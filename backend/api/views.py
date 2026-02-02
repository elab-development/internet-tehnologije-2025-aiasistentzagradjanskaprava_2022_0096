from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, generics
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Folder, Chat, ChatMessage
from .serializers import *
from .rag_service import RAGService

# --- AUTH & ADMIN ---

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Korisnik uspešno kreiran"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AdminUploadView(APIView):
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = DocumentMetaSerializer(data=request.data)
        if serializer.is_valid():
            # 1. Prvo sačuvaj dokument u bazu (i na disk)
            doc = serializer.save(uploaded_by=request.user)
            
            # 2. Uzmi apsolutnu putanju do fajla
            file_full_path = doc.file_path.path
            print(f"Započinjem procesiranje fajla na putanji: {file_full_path}")
            
            try:
                rag = RAGService()
                # 3. Pozovi procesiranje
                rag.process_pdf(file_full_path, str(doc.id))
                print("RAG procesiranje uspešno završeno.")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                print(f"Greška tokom RAG procesiranja: {e}")
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- FOLDERI ---

class FolderListCreateView(generics.ListCreateAPIView):
    serializer_class = FolderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Folder.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# --- CHATOVI (Threads unutar foldera) ---

class FolderChatListView(generics.ListAPIView):
    """Vraća sve chatove unutar jednog foldera"""
    serializer_class = ChatSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        folder_id = self.kwargs['folder_id']
        return Chat.objects.filter(folder_id=folder_id, folder__user=self.request.user)

class ChatCreateView(generics.ListCreateAPIView):
    """Kreira novi chat (razgovor) unutar foldera"""
    serializer_class = ChatSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Chat.objects.filter(folder__user=self.request.user)

    def perform_create(self, serializer):
        # React šalje folder_id u body-ju
        folder_id = self.request.data.get('folder_id')
        try:
            folder = Folder.objects.get(id=folder_id, user=self.request.user)
            serializer.save(folder=folder)
        except Folder.DoesNotExist:
            # Ako folder ne postoji ili nije korisnikov, bacamo grešku
            from django.core.exceptions import PermissionDenied
            raise PermissionDenied("Folder ne postoji ili nemate pristup.")

# --- PORUKE I AI LOGIKA ---

class ChatHistoryView(generics.ListAPIView):
    """Vraća istoriju poruka za konkretan chat ID"""
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        chat_id = self.kwargs['chat_id']
        return ChatMessage.objects.filter(chat_id=chat_id, chat__folder__user=self.request.user).order_by('timestamp')

class ChatView(APIView):
    """Glavni endpoint gde AI odgovara i čuva poruku"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        question = request.data.get('question')
        chat_id = request.data.get('chat_id')

        if not chat_id or not question:
            return Response({"error": "Nedostaju chat_id ili question"}, status=status.HTTP_400_BAD_REQUEST)

        # Provera da li chat pripada korisniku
        chat_thread = Chat.objects.filter(id=chat_id, folder__user=request.user).first()
        if not chat_thread:
            return Response({"error": "Razgovor nije pronađen"}, status=status.HTTP_404_NOT_FOUND)

        # RAG Logika
        try:
            rag = RAGService()
            answer = rag.get_answer(question)
        except Exception as e:
            print(f"RAG Error: {e}")
            answer = "Žao mi je, trenutno ne mogu da pristupim bazi zakona."

        # Čuvanje poruke
        ChatMessage.objects.create(
            chat=chat_thread,
            question=question,
            answer=answer
        )

        return Response({"answer": answer}, status=status.HTTP_200_OK)