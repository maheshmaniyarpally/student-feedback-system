#!/bin/bash

echo "Installing dependencies..."
pip install -r requirements.txt

echo ""
echo "Creating database migrations..."
python manage.py makemigrations

echo ""
echo "Applying migrations..."
python manage.py migrate

echo ""
echo "Setup complete! Run 'python manage.py runserver' to start the server."

