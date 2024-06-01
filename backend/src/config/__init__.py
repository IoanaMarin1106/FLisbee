from dotenv import load_dotenv
import os
load_dotenv()  # take environment variables from .env.


config = os.environ
DB_NAME = config.get("DB_NAME", "fl-mongo-db")
DB_PORT = config.get("DB_PORT", 27017)
DB_HOST = config.get("DB_HOST", "localhost")
DB_USER = config.get("MONGO_USERNAME", "marinvioana")
DB_PASSWORD = config.get("MONGO_PASSWORD", "Jpa5P6O9uGj6JP3n")

config["MONGO_URI"] = f"mongodb+srv://{DB_USER}:{DB_PASSWORD}@fl-mongo.esrtxd0.mongodb.net/?retryWrites=true&w=majority&appName=fl-mongo"
config["JWT_SECRET_KEY"] = 'fl-mobility-2024-11-06'
