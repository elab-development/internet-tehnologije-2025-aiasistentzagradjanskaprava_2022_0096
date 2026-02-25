from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from api.models import User

class AuthTests(APITestCase):
    def test_registration_and_login(self):
        # Test registracije
        reg_url = reverse('register_create') # proveri naziv u urls.py
        user_data = {
            "username": "pravnik123",
            "password": "SigurnaLozinka1!",
            "email": "test@primer.rs",
            "role": "Citizen"
        }
        response = self.client.post(reg_url, user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Test logina za dobijanje JWT tokena
        login_url = reverse('login_create')
        login_data = {
            "username": "pravnik123",
            "password": "SigurnaLozinka1!"
        }
        login_res = self.client.post(login_url, login_data, format='json')
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertIn('access', login_res.data) # Provera da li je stigao token