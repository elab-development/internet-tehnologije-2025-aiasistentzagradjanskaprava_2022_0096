from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from api.models import User

class AuthTests(APITestCase):
    def test_registration_and_login(self):
        reg_url = reverse('auth_register') 
        
        user_data = {
            "username": "pravnik123",
            "password": "SigurnaLozinka1!",
            "email": "test@primer.rs"
        }
        
        response = self.client.post(reg_url, user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        login_url = reverse('token_obtain_pair')
        
        login_data = {
            "username": "pravnik123",
            "password": "SigurnaLozinka1!"
        }
        login_res = self.client.post(login_url, login_data, format='json')
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)