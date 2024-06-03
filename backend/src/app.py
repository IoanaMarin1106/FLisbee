from flask import Flask, request, jsonify
from pymongo import MongoClient
from flask_cors import CORS
from config import config
from flask_jwt_extended import JWTManager, create_access_token
import bcrypt
import uuid
import os
from itsdangerous import URLSafeTimedSerializer, SignatureExpired
import smtplib
from email.mime.text import MIMEText
from flask import url_for

app = Flask(__name__)
app.config["MONGO_URI"] = config["MONGO_URI"]
app.config['JWT_SECRET_KEY'] = config["JWT_SECRET_KEY"]
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
jwt = JWTManager(app)

s = URLSafeTimedSerializer(app.config['SECRET_KEY'])

CORS(app)
client = MongoClient(config["MONGO_URI"])
db = client['flMongoDb']
users = db['users']
workflows = db["workflows"]
models = db["models"]

# email
HOST = "smtp.gmail.com"
PORT = 587
FROM_EMAIL = "solveitinfo0@gmail.com"

# Start Debugging
if client:
    print("connected")
else: 
    print("not connected")

@app.route("/ping", methods=["GET"])
def ping():
    return "ok"
# End Debugging


# ----------------------- Users -------------------------------
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
    email_confirmed = False
    user_id = users.insert_one({"email": email, "password": hashed_password, "email_confirmed": email_confirmed}).inserted_id
    send_confirmation_email(email)
    return jsonify({"msg": "User created. Please check your email to confirm your address.", "id": str(user_id)}), 201

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
    return jsonify(access_token=access_token, username=email), 200
    
@app.route('/confirmed/<email>', methods=["GET"])
def get_user_confirmation_status(email):
    user = users.find_one({"email": email})
    if not user:
        return jsonify({"msg": "Bad email."}), 401
    
    return jsonify({"conf": user["email_confirmed"]}), 200

from flask import jsonify

@app.route('/confirm/<email>', methods=["GET"])
def confirm_user_email(email):
    user = users.find_one({"email": email})
    if not user:
        return jsonify({"msg": "User not found."}), 404
    
    # Update email_confirmed to true
    user['email_confirmed'] = True
    # Save the changes
    users.update_one({"email": email}, {"$set": user})
    
    return jsonify({"msg": "Email confirmed successfully."}), 200

# ----------------------- Users -------------------------------

# ----------------------- Workflows ---------------------------

@app.route("/workflows/count", methods=["GET"])
def get_workflows_count():
    count = workflows.count_documents({})
    return jsonify({"count": count})

@app.route("/workflows/getAll", methods=["GET"])
def get_all_workflows():
    all_workflows = list(workflows.find({}))
    workflows_list = []
    for workflow in all_workflows:
        workflows_list.append({
            "id": str(workflow["wid"]),
            "name": workflow["name"]
        })
    return jsonify(workflows_list)

# TODO: update the method after decide details about workflows
@app.route("/workflows/insert", methods=["POST"])
def insert_workflow():
    name = request.json.get("name", None)
    if not name:
        return jsonify({"msg": "Missing workflow name"}), 400
    
    workflow = workflows.find_one({"name": name})
    if workflow:
        return jsonify({"msg": "Workflow already registered"}), 400

    workflow_id = str(uuid.uuid4())
    workflows.insert_one({"wid": workflow_id, "name": name})
    return jsonify({"msg": "Workflow created", "id": workflow_id}), 201

@app.route("/workflows/delete/<workflow_id>", methods=["DELETE"])
def delete_workflow(workflow_id):
    result = workflows.delete_one({"wid": workflow_id})
    if result.deleted_count == 1:
        return jsonify({"msg": "Workflow deleted"}), 200
    else:
        return jsonify({"msg": "Workflow not found"}), 404
    
@app.route("/workflows/state/<workflow_id>", methods=["GET"])
def get_workflow_state(workflow_id):
    print(workflow_id)
    if (workflow_id == "6c482d89-7667-407c-803f-193c7e21807d"):
        return jsonify({"state": "running"}), 200
    elif (workflow_id == "5f10d6d4-e260-4a56-aa0b-01c6bb57b2d6"):
        return jsonify({"state": "created"}), 200
    elif (workflow_id == "95e6f638-60a6-49c0-90ea-b1cab1adcf43"):
        return jsonify({"state": "pending"}), 200   

@app.route("/workflows/cancel/<workflow_id>", methods=["POST"])    
def cancel_workflow(workflow_id):
    # Here you can add the logic to cancel the workflow with the given ID
    # Change its state to "canceled"
    # For now, let's just return a simple message
    return jsonify({"message": f"Workflow {workflow_id} is canceled"}), 200

@app.route("/workflows/run/<workflow_id>", methods=["POST"])    
def run_workflow(workflow_id):
    # Here you can add the logic to run the workflow with the given ID
    # Change its state to 'running'
    # For now, let's just return a simple message
    return jsonify({"message": f"Workflow {workflow_id} is canceled"}), 200

# ----------------------- Workflows ---------------------------

# ----------------------- Models ------------------------------

@app.route("/models/count", methods=["GET"])
def get_models_count():
    count = workflows.count_documents({})
    return jsonify({"count": count})

@app.route("/models/getAll", methods=["GET"])
def get_all_models():
    all_models = list(models.find({}))
    models_list = []
    for model in all_models:
        models_list.append({
            "id": str(model["mid"]),
            "name": model["name"]
        })
    return jsonify(models_list)

# TODO: update the method after decide details about models
@app.route("/models/insert", methods=["POST"])
def insert_model():
    name = request.json.get("name", None)
    if not name:
        return jsonify({"msg": "Missing model name"}), 400
    
    model = models.find_one({"name": name})
    if model:
        return jsonify({"msg": "Model already registered"}), 400

    model_id = str(uuid.uuid4())
    models.insert_one({"mid": model_id, "name": name})
    return jsonify({"msg": "Model created", "id": model_id}), 201

@app.route("/models/delete/<model_id>", methods=["DELETE"])
def delete_model(model_id):
    result = models.delete_one({"mid": model_id})
    if result.deleted_count == 1:
        return jsonify({"msg": "Model deleted"}), 200
    else:
        return jsonify({"msg": "Model not found"}), 404

# ----------------------- Models ------------------------------

def send_confirmation_email(user_email):
    token = s.dumps(user_email, salt='email-confirm')
    confirm_url = f'http://localhost:3007/confirm/{user_email}/{token}'
    print(confirm_url)
    html = f'''
        <h2>Welcome to Flisbee!</h2>
        <p>Congratulations on joining our community!</p>
        <p>To get started, please click the link below to confirm your email address:</p>
        <p><a href="{confirm_url}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Confirm Email</a></p>
        <p>Thank you for choosing Flisbee! We can't wait for you to explore all the amazing features.</p>
        <p>Happy exploring!</p>
    '''
    msg = MIMEText(html, 'html')
    msg['Subject'] = 'Confirm your email'
    msg['From'] = FROM_EMAIL
    msg['To'] = user_email

    with smtplib.SMTP(HOST, PORT) as server:
        server.starttls()
        server.login(FROM_EMAIL, "unmnmgdudjqhtcqf")
        server.sendmail(msg['From'], [msg['To']], msg.as_string())

if __name__ == "__main__":
    app.run(debug=True)
