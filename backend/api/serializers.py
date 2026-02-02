from rest_framework import serializers
from .models import *
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        # Dodajemo user objekat u JSON odgovor koji ide ka React-u
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'role': self.user.role,
            'email': self.user.email
        }
        return data

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        # Koristimo create_user da bi lozinka bila ispravno hash-ovana
        user = User.objects.create_user(**validated_data)
        return user

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'question', 'answer', 'timestamp', 'chat']
        # 'chat' polje može biti read_only jer ga dodeljujemo u view-u
        read_only_fields = ['timestamp']

class ChatSerializer(serializers.ModelSerializer):
    # Dodajemo broj poruka kao bonus informaciju
    message_count = serializers.IntegerField(source='messages.count', read_only=True)

    class Meta:
        model = Chat
        fields = ['id', 'name', 'folder', 'created_at', 'message_count']
        # 'folder' stavljamo u read_only jer ga setujemo preko perform_create
        # ali ga ostavljamo u fields da bi ga videli u GET odgovoru
        extra_kwargs = {'folder': {'read_only': True}}

class FolderSerializer(serializers.ModelSerializer):
    # Vraća povezane chatove (threads) unutar foldera
    chats = ChatSerializer(many=True, read_only=True)

    class Meta:
        model = Folder
        fields = ['id', 'name', 'chats', 'created_at']
        # Ne stavljamo 'user' ovde jer ga Frontend ne šalje, 
        # Backend ga sam dodaje iz tokena.

class DocumentMetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentMeta
        fields = '__all__'
        # Ako želiš da uploaded_by bude automatski dodat:
        extra_kwargs = {'uploaded_by': {'read_only': True}}

# api/serializers.py

class ChatHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatHistory
        fields = '__all__'