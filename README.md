# FLisbee
Repository for providing a FLaaS platform.

### ⌨️ Backend

Installation:
```
export SECRET_KEY=$(python -c 'import secrets; print(secrets.token_hex(16))') # Generate a random secret key

pip install Flask Flask-Cors Flask-JWT-Extended pymongo bcrypt

cd backend
python3 -m venv venv
source venv/bin/activate
```

For running backend:
```
python src/app.py
```

### 🎨 Frontend
Installation:
```
cd frontend
npm install
```

For running React excute this:
```
npm run dev
```
