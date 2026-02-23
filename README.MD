# Civil Rights Chatbot

Ova aplikacija predstavlja inteligentni chatbot sistem dizajniran da pruži korisnicima informacije o njihovim građanskim pravima koristeći Google Gemini AI.

## Tehnologije
- **Frontend:** React (Vite)
- **Backend:** Django REST Framework
- **Baza podataka:** MYSQL i ChromaDB
- **AI:** Google Gemini API
- **Kontejnerizacija:** Docker & Docker Compose

## Pokretanje pomoću Docker-a (Preporučeno)
Najbrži način za pokretanje celokupnog sistema (Backend, Frontend i Baza):

1. Osigurajte da imate instaliran [Docker Desktop](https://www.docker.com/).
2. U korenskom direktorijumu pokrenite:
   ```bash
   docker-compose up --build
