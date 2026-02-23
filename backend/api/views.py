from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, generics
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.parsers import MultiPartParser, FormParser
from drf_spectacular.utils import extend_schema, OpenApiParameter
from django.core.exceptions import PermissionDenied

from .models import Folder, Chat, ChatMessage
from .serializers import *
from .rag_service import RAGService

# --- AUTH & ADMIN ---

@extend_schema(tags=['Auth'])
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

@extend_schema(
    tags=['Auth'],
    request=UserSerializer,
    responses={201: UserSerializer}
)
class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Korisnik uspešno kreiran"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@extend_schema(
    tags=['Admin'],
    request=DocumentMetaSerializer,
    responses={201: DocumentMetaSerializer},
    description="Endpoint za administratore koji omogućava upload PDF dokumenata i njihovu indeksaciju u RAG sistem."
)
class AdminUploadView(APIView):
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = DocumentMetaSerializer(data=request.data)  
        if serializer.is_valid():
            doc = serializer.save(uploaded_by=request.user)
            file_full_path = doc.file_path.path
            
            try:
                rag = RAGService()
                rag.process_pdf(file_full_path, str(doc.id))
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- FOLDERI ---

@extend_schema(tags=['Folders'])
class FolderListCreateView(generics.ListCreateAPIView):
    serializer_class = FolderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Folder.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# --- CHATOVI ---

@extend_schema(tags=['Chats'])
class FolderChatListView(generics.ListAPIView):
    serializer_class = ChatSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        folder_id = self.kwargs['folder_id']
        return Chat.objects.filter(folder_id=folder_id, folder__user=self.request.user)

@extend_schema(tags=['Chats'])
class ChatCreateView(generics.ListCreateAPIView):
    serializer_class = ChatSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Chat.objects.filter(folder__user=self.request.user)

    def perform_create(self, serializer):
        folder_id = self.request.data.get('folder_id')
        try:
            folder = Folder.objects.get(id=folder_id, user=self.request.user)
            serializer.save(folder=folder)
        except Folder.DoesNotExist:
            raise PermissionDenied("Folder ne postoji ili nemate pristup.")

# --- PORUKE I AI LOGIKA ---

@extend_schema(tags=['Messages'])
class ChatHistoryView(generics.ListAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        chat_id = self.kwargs['chat_id']
        return ChatMessage.objects.filter(chat_id=chat_id, chat__folder__user=self.request.user).order_by('timestamp')

@extend_schema(
    tags=['AI Engine'],
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'question': {'type': 'string', 'example': 'Koja su moja prava u slučaju otkaza?'},
                'chat_id': {'type': 'integer', 'example': 1}
            },
            'required': ['question', 'chat_id']
        }
    },
    responses={200: {'type': 'object', 'properties': {'answer': {'type': 'string'}}}}
)
class ChatView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        question = request.data.get('question')
        chat_id = request.data.get('chat_id')

        if not chat_id or not question:
            return Response({"error": "Nedostaju chat_id ili question"}, status=status.HTTP_400_BAD_REQUEST)

        chat_thread = Chat.objects.filter(id=chat_id, folder__user=request.user).first()
        if not chat_thread:
            return Response({"error": "Razgovor nije pronađen"}, status=status.HTTP_404_NOT_FOUND)

        try:
            rag = RAGService()
            answer = rag.get_answer(question)
        except Exception as e:
            answer = "Žao mi je, trenutno ne mogu da pristupim bazi zakona."

        ChatMessage.objects.create(
            chat=chat_thread,
            question=question,
            answer=answer
        )

        return Response({"answer": answer}, status=status.HTTP_200_OK)