from flask import Flask, request, jsonify
from flask_pymongo import ObjectId
from pymongo import MongoClient
from flask_cors import CORS
from config import config
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from bson.objectid import ObjectId
import bcrypt
import uuid

app = Flask(__name__)
app.config["MONGO_URI"] = config["MONGO_URI"]
app.config['JWT_SECRET_KEY'] = config["JWT_SECRET_KEY"]
jwt = JWTManager(app)

CORS(app)
client = MongoClient(config["MONGO_URI"])
db = client['flMongoDb']
users = db['users']
workflows = db["workflows"]

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
    return jsonify(access_token=access_token, username=email), 200

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
    id
    print(name)
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

if __name__ == "__main__":
    app.run(debug=True)
