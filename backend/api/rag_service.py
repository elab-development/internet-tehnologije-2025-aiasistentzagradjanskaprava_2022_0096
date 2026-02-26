import os
import chromadb
import google.generativeai as genai
from PyPDF2 import PdfReader
from django.conf import settings

class RAGService:
    def __init__(self):
        # Inicijalizacija klijenta za vektorsku bazu
        self.chroma_client = chromadb.PersistentClient(path="./chroma_db")
        self.collection = self.chroma_client.get_or_create_collection(name="zakoni")
        
        # Konfiguracija Gemini modela
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        # PROMENA: Koristimo stabilniju oznaku modela
        # Ako 'gemini-1.5-flash-latest' ne prođe, probaj 'gemini-pro'
        try:
            self.model = genai.GenerativeModel('gemini-3-flash-preview')
        except Exception as e:
            print(f"Greška pri inicijalizaciji gemini-pro: {e}")
            # Zadnja opcija ako gemini-pro ne prođe
            self.model = genai.GenerativeModel('gemini-1.5-flash')

    def process_pdf(self, file_path, doc_id):
        """Čita PDF, deli ga na delove i ubacuje u ChromaDB."""
        if not os.path.exists(file_path):
            print(f"Fajl nije pronađen: {file_path}")
            return

        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            content = page.extract_text()
            if content:
                text += content

        # Deljenje teksta na segmente (chunks)
        # Smanjili smo na 800 karaktera radi bolje preciznosti Gemini-ja
        chunks = [text[i:i+800] for i in range(0, len(text), 800) if len(text[i:i+800]) > 50]
        
        if not chunks:
            print("Nema teksta za indeksiranje.")
            return

        # Ubacivanje u vektorsku bazu
        ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
        self.collection.add(
            documents=chunks,
            ids=ids
        )
        print(f"Indeksirano {len(chunks)} segmenata za dokument {doc_id}")

    def get_answer(self, question):
        """Pronalazi kontekst i generiše odgovor putem Gemini API-ja."""
        try:
            # 1. Pretraga najsličnijih delova zakona
            results = self.collection.query(
                query_texts=[question],
                n_results=3
            )
            
            # Provera da li imamo rezultate pre spajanja
            if not results['documents'] or not results['documents'][0]:
                return "Žao mi je, ne mogu da pronađem relevantne informacije u bazi zakona."

            context = " ".join(results['documents'][0])

            # 2. Prompt inženjering
            prompt = f"""
            Ti si stručni pravni asistent za građanska prava u Srbiji. 
            Koristi isključivo sledeći kontekst da odgovoriš na pitanje. 
            Odgovori moraju biti profesionalni, tačni i zasnovani samo na dostavljenom tekstu.
            Ako u kontekstu nema odgovora, reci da na osnovu trenutne baze ne možeš dati precizan odgovor.
            Svaki clan zakona mora biti referenciran, u skladu sa kontekstom, i potrebno je pruziti linkove ka svim zakonima koji se koriste iz konteksta.
            
            KONTEKST: {context}
            PITANJE: {question}
            """
            
            response = self.model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            print(f"RAG Error: {e}")
            return "Došlo je do greške prilikom generisanja odgovora. Proverite API ključ ili status modela."