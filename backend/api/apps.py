from django.apps import AppConfig

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'  # Ovo ime mora da se poklapa sa onim u INSTALLED_APPS