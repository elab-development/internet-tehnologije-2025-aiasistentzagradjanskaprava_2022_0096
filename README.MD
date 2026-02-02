To run frontend:
1. cd frontend
2. npm install
3. npm run dev

To run backend:
1. Create .env file in backend/backend/
2. python3 -m venv venv 
3. source venv/bin/activate
4. pip install -r requirements.txt
5. python manage.py migrate
6. python manage.py runserver