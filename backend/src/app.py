from flask import Flask, request, jsonify
from flask_pymongo import ObjectId
from pymongo import MongoClient
from flask_cors import CORS
from config import config
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from bson.objectid import ObjectId
import bcrypt

app = Flask(__name__)
app.config["MONGO_URI"] = config["MONGO_URI"]
app.config['JWT_SECRET_KEY'] = config["JWT_SECRET_KEY"]
jwt = JWTManager(app)

CORS(app)
client = MongoClient(config["MONGO_URI"])
db = client['flMongoDb']
users = db['users']


# Start Debugging
if client:
    print("connected")
else: 
    print("not connected")

@app.route("/ping", methods=["GET"])
def ping():
    return "ok"
# End Debugging

@app.route("/register", methods=["POST"])
def register():
    email = request.json.get("email", None)
    password = request.json.get("password", None)
    if not email or not password:
        return jsonify({"msg": "Missing email or password"}), 400

    user = users.find_one({"email": email})
    if user:
        return jsonify({"msg": "Email already registered"}), 400

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    user_id = users.insert_one({"email": email, "password": hashed_password}).inserted_id
    return jsonify({"msg": "User created", "id": str(user_id)}), 201

@app.route("/login", methods=["POST"])
def login():
    email = request.json.get("email", None)
    password = request.json.get("password", None)
    if not email or not password:
        return jsonify({"msg": "Missing email or password"}), 400

    user = users.find_one({"email": email})
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password']):
        return jsonify({"msg": "Bad email or password"}), 401

    access_token = create_access_token(identity=str(user["_id"]))
    return jsonify(access_token=access_token), 200

@app.route("/protected", methods=["GET"])
@jwt_required()
def protected():
    current_user_id = get_jwt_identity()
    user = users.find_one({"_id": ObjectId(current_user_id)})
    return jsonify(logged_in_as=user["email"]), 200

if __name__ == "__main__":
    app.run(debug=True)
