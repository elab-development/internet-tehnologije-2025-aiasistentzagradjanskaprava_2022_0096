from django.db import models
from django.contrib.auth.models import AbstractUser

# 1. Prošireni User model
class User(AbstractUser):
    ROLE_CHOICES = (
        ('Admin', 'Administrator'),
        ('Citizen', 'Ulogovani korisnik'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='Citizen')
    
    def __str__(self):
        return self.username

# 2. Folderi za grupisanje chat-ova
class Folder(models.Model):
    name = models.CharField(max_length=255)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='folders')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.user.username})"

# 3. Chat (Thread/Razgovor unutar foldera)
class Chat(models.Model):
    name = models.CharField(max_length=255)
    folder = models.ForeignKey(Folder, on_delete=models.CASCADE, related_name='chats')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

# 4. ChatMessage (Pojedinačne poruke unutar Chata)
class ChatMessage(models.Model):
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name='messages')
    question = models.TextField()
    answer = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Msg in {self.chat.name} at {self.timestamp}"

# 5. DocumentMeta (Upload-ovani PDF-ovi za RAG)
class DocumentMeta(models.Model):
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    file_path = models.FileField(upload_to='laws/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

# 6. ChatHistory (Stari model - zadržavamo ga zbog kompatibilnosti ako zatreba)
class ChatHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    folder = models.ForeignKey(Folder, on_delete=models.SET_NULL, null=True, blank=True)
    question = models.TextField()
    answer = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)