from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import *

urlpatterns = [
    # Auth rute
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Folderi i istorija
    path('folders/', FolderListCreateView.as_view(), name='folder-list'),
    path('folders/<int:folder_id>/chats/', FolderChatListView.as_view(), name='folder-chats'),
    path('chats/', ChatCreateView.as_view(), name='chat-create'),
    path('chats/<int:chat_id>/history/', ChatHistoryView.as_view(), name='chat-history'),
    
    # Glavni chat
    path('chat/', ChatView.as_view(), name='chat'),

    path('admin/upload/', AdminUploadView.as_view(), name='admin-upload'),

]