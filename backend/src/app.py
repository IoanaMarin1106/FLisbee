import string
from datetime import datetime
import random
from flask import Flask, request, jsonify
from pymongo import MongoClient
from flask_cors import CORS
from config import config
from flask_jwt_extended import JWTManager, create_access_token
import bcrypt
import uuid
import json
import logging
import boto3
import base64
import time
import os
from itsdangerous import URLSafeTimedSerializer, SignatureExpired
import smtplib
from email.mime.text import MIMEText
from flask import url_for
from werkzeug.utils import secure_filename

app = Flask(__name__)

log_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

app.config["MONGO_URI"] = config["MONGO_URI"]
app.config['JWT_SECRET_KEY'] = config["JWT_SECRET_KEY"]
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'json'}
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
FROM_EMAIL = "flisbeeinfo@gmail.com"

# AWS clients
region = config["AWS_REGION"]
aws_access_key = config["AWS_ACCESS_KEY"]
aws_secret_access_key = config["AWS_SECRET_ACCESS_KEY"]

ecs_client = boto3.client(
    'ecs',
    region_name=region,
    aws_access_key_id=aws_access_key,
    aws_secret_access_key=aws_secret_access_key,
)

asg_client = boto3.client(
    'autoscaling',
    region_name=region,
    aws_access_key_id=aws_access_key,
    aws_secret_access_key=aws_secret_access_key,
)

ec2_client = boto3.client(
    'ec2',
    region_name=region,
    aws_access_key_id=aws_access_key,
    aws_secret_access_key=aws_secret_access_key,
)

logs_client = boto3.client(
    'logs',
    region_name=region,
    aws_access_key_id=aws_access_key,
    aws_secret_access_key=aws_secret_access_key,
)

elbv2_client = boto3.client(
    'elbv2',
    region_name=region,
    aws_access_key_id=aws_access_key,
    aws_secret_access_key=aws_secret_access_key,
)

s3_client = boto3.client(
    's3',
    region_name=region,
    aws_access_key_id=aws_access_key,
    aws_secret_access_key=aws_secret_access_key,
    endpoint_url=f'https://s3.{region}.amazonaws.com'
)

# Start Debugging
if client:
    print("connected")
else:
    print("not connected")


@app.route("/ping", methods=["GET"])
def ping():
    user_id = users.find_one({"email": "ciurezue@gmail.com"})["_id"]
    return str(user_id)


# End Debugging

# Utilities
class Try:
    def __init__(self, func):
        self._func = func
        self._value = None
        self._exception = None
        try:
            self._value = func()
        except Exception as e:
            self._exception = e

    def is_success(self):
        return self._exception is None

    def is_failure(self):
        return self._exception is not None

    def get_or_else(self, default):
        if self.is_success():
            return self._value
        else:
            return default

    def or_else(self, default_func):
        if self.is_success():
            return self._value
        else:
            return default_func()

    def get_exception(self):
        return self._exception


def get_server_service_status(workflow_id):
    task_arns = ecs_client.list_tasks(
        cluster=f'fl-ecs-{workflow_id}',
        serviceName=f'fl-server-service-{workflow_id}'
    )['taskArns']
    print("server task_arns: ", task_arns)
    status = ecs_client.describe_tasks(
        cluster=f'fl-ecs-{workflow_id}',
        tasks=task_arns
    )['tasks'][0]['lastStatus']
    print("server laststatus: ", status)
    return status


def get_orchestrator_service_status(workflow_id):
    task_arns = ecs_client.list_tasks(
        cluster=f'fl-ecs-{workflow_id}',
        serviceName=f'fl-orchestrator-service-{workflow_id}'
    )['taskArns']
    print("orchestrator task_arns: ", task_arns)
    status = ecs_client.describe_tasks(
        cluster=f'fl-ecs-{workflow_id}',
        tasks=task_arns
    )['tasks'][0]['lastStatus']
    print("orchestrator laststatus: ", status)
    return status


def timestamp_to_iso8601(timestamp):
    timestamp_s = timestamp / 1000.0
    dt_object = datetime.fromtimestamp(timestamp_s)
    return dt_object.isoformat(timespec='milliseconds') + 'Z'


def generate_random_string(length=12):
    characters = string.ascii_letters + string.digits
    random_string = ''.join(random.choice(characters) for _ in range(length))
    return random_string


# API routes
# Health
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy"})


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
            "name": workflow["name"],
            "status": workflow["status"],
            "server_hostname": workflow["server_hostname"],
        })
    return jsonify(workflows_list)


# TODO: update the method after decide details about workflows
@app.route("/workflows/precreate", methods=["POST"])
def precreate_workflow():
    payload = request.get_json()
    name = payload.get("name", None)
    ml_model = payload.get("ml_model", None)
    training_frequency = payload.get("training_frequency", None)
    user_email = payload.get("user_email", None)

    if not name:
        return jsonify({"msg": "Missing workflow name"}), 400

    if not ml_model:
        return jsonify({"msg": "Missing ml model"}), 400

    if not training_frequency:
        return jsonify({"msg": "Missing training frequency"}), 400

    workflow_id = generate_random_string()
    # Insert workflow into database
    workflows.insert_one({
        "wid": workflow_id,
        "status": 'Pending',
        "name": name,
        "ml_model": ml_model,
        "training_frequency": training_frequency,
        "server_hostname": "not-ready",
        "created_at": datetime.now()
    })

    # Add workflow to user
    users.update_one(
        {"email": user_email},
        {"$push": {"workflows": workflow_id}}
    )

    return jsonify(
        {
            "msg": "Workflow creation started",
            "workflow_id": workflow_id
        }
    ), 201


@app.route("/workflows/create", methods=["POST"])
def create_workflow():
    payload = request.get_json()
    workflow_id = payload.get("workflow_id", None)
    name = payload.get("name", None)
    ml_model = payload.get("ml_model", None)
    training_frequency = payload.get("training_frequency", None)
    user_email = payload.get("user_email", None)
    user_id = str(users.find_one({"email": user_email})["_id"])

    if not workflow_id:
        return jsonify({"msg": "Missing workflow id"}), 400

    if not name:
        return jsonify({"msg": "Missing workflow name"}), 400

    if not ml_model:
        return jsonify({"msg": "Missing ml model"}), 400

    if not training_frequency:
        return jsonify({"msg": "Missing training frequency"}), 400

    ecs_cluster_name = f"fl-ecs-{workflow_id}"
    user_data_script = f'''#!/bin/bash
echo ECS_CLUSTER={ecs_cluster_name} >> /etc/ecs/ecs.config
'''

    app.logger.info(f"Creating workflow with id: {workflow_id}...")

    # Create S3 bucket
    app.logger.info(f"Creating S3 Bucket...")
    bucket_name = f"fl-workflow-{workflow_id.lower()}"
    s3_client.create_bucket(
        Bucket=bucket_name,
        CreateBucketConfiguration={
            'LocationConstraint': region
        }
    )

    # Copy model to S3 bucket
    app.logger.info(f"Copying model to S3 Bucket...")
    copy_source = {
        'Bucket': f'fl-models-{user_id}',
        'Key': f'{ml_model}.tflite'
    }

    s3_client.copy_object(
        Bucket=bucket_name,
        CopySource=copy_source,
        Key=f'models/{ml_model}.tflite'
    )

    # Create Launch Template
    app.logger.info(f"Creating Launch Template...")
    launch_template_id = ec2_client.create_launch_template(
        DryRun=False,
        ClientToken=workflow_id,
        LaunchTemplateName=f'ECSLaunchTemplate_{ecs_cluster_name}',
        LaunchTemplateData={
            'IamInstanceProfile': {
                'Name': 'ecsInstanceRole'
            },
            'ImageId': 'ami-027c0bac11fd4d20f',
            'InstanceType': 't3.micro',
            'KeyName': 'ecs-fl-server-key-pair',
            'UserData': base64.b64encode(user_data_script.encode('utf-8')).decode('utf-8'),
            'SecurityGroupIds': [
                'sg-0f3ac3f9100d4f229',
            ]
        }
    )['LaunchTemplate']['LaunchTemplateId']

    # Create Auto Scaling Group
    app.logger.info(f"Creating Auto Scaling Group...")
    asg_name = f'Infra-ECS-Cluster-{ecs_cluster_name}-ASG'
    asg_client.create_auto_scaling_group(
        AutoScalingGroupName=asg_name,
        LaunchTemplate={
            'LaunchTemplateId': launch_template_id,
            'Version': '$Default'
        },
        MinSize=0,
        MaxSize=2,
        DesiredCapacity=1,  # only one instance for server. update to 2 when orchestrator is started
        DefaultCooldown=300,
        AvailabilityZones=['eu-north-1b', 'eu-north-1c', 'eu-north-1a'],
        HealthCheckType='EC2',
        HealthCheckGracePeriod=0,
        VPCZoneIdentifier='subnet-09170b66267125da7,subnet-063d0c019fea38df5,subnet-0524d3c0c3491d5db',
        TerminationPolicies=['Default'],
    )

    # Create Capacity Provider
    app.logger.info(f"Creating Capacity Provider...")
    asg_response = asg_client.describe_auto_scaling_groups(
        AutoScalingGroupNames=[asg_name]
    )
    auto_scaling_group_arn = asg_response['AutoScalingGroups'][0]['AutoScalingGroupARN']

    capacity_provider_name = f'Infra-ECS-Cluster-{ecs_cluster_name}-EC2CapacityProvider'
    ecs_client.create_capacity_provider(
        name=capacity_provider_name,
        autoScalingGroupProvider={
            'autoScalingGroupArn': auto_scaling_group_arn,
            'managedScaling': {
                'status': 'DISABLED',
                'targetCapacity': 100,
                'minimumScalingStepSize': 1,
                'maximumScalingStepSize': 10000,
                'instanceWarmupPeriod': 300
            },
            'managedTerminationProtection': 'DISABLED',
            'managedDraining': 'ENABLED'
        }
    )

    # Create ECS Cluster
    app.logger.info(f"Creating ECS Cluster...")
    ecs_client.create_cluster(
        clusterName=ecs_cluster_name,
        capacityProviders=[capacity_provider_name],
        defaultCapacityProviderStrategy=[
            {
                'capacityProvider': capacity_provider_name,
                'weight': 1,
                'base': 0
            }
        ]
    )

    # Create Target Group
    app.logger.info(f"Creating Target Group...")
    target_group_arn = elbv2_client.create_target_group(
        Name=f'ecs-alb-targetgroup-{workflow_id}',
        Protocol='HTTP',
        Port=5000,
        VpcId='vpc-0b5070041457d8eaf',
        HealthCheckProtocol='HTTP',
        HealthCheckPath='/health',
        TargetType='instance',
        ProtocolVersion='HTTP1',
        IpAddressType='ipv4'
    )['TargetGroups'][0]['TargetGroupArn']

    # Create Application Load Balancer
    app.logger.info(f"Creating Application Load Balancer...")
    load_balancer_response = elbv2_client.create_load_balancer(
        Name=f'ecs-alb-{workflow_id}',
        Subnets=[
            'subnet-0524d3c0c3491d5db',
            'subnet-063d0c019fea38df5',
            'subnet-09170b66267125da7'
        ],
        SecurityGroups=[
            'sg-0f3ac3f9100d4f229',
        ],
        Scheme='internet-facing',
        Type='application',
        IpAddressType='ipv4',
    )
    load_balancer_arn = load_balancer_response['LoadBalancers'][0]['LoadBalancerArn']
    load_balancer_dns = load_balancer_response['LoadBalancers'][0]['DNSName']

    # Create Listener
    app.logger.info(f"Creating Listener...")
    listener_arn = elbv2_client.create_listener(
        LoadBalancerArn=load_balancer_arn,
        Protocol='HTTP',
        Port=5000,
        DefaultActions=[
            {
                'Type': 'forward',
                'TargetGroupArn': target_group_arn
            }
        ]
    )['Listeners'][0]['ListenerArn']

    # Wait until a container is provisioned by ASG
    time.sleep(90)

    # Register fl-server Task Definition
    app.logger.info(f"Registering fl-server Task Definition...")
    server_task_name = f'fl-server-{workflow_id}'
    ecs_client.register_task_definition(
        family=server_task_name,
        taskRoleArn='ecsTaskExecutionRole',
        executionRoleArn='ecsTaskExecutionRole',
        networkMode='bridge',
        containerDefinitions=[
            {
                'name': 'fl-server',
                'image': 'public.ecr.aws/d1f3d1b3/fl-server:latest',
                'cpu': 0,
                'memory': 512,
                'memoryReservation': 512,
                'portMappings': [
                    {
                        'containerPort': 5000,
                        'hostPort': 5000,
                        'protocol': 'tcp',
                        'name': 'fl-service-5000-tcp',
                        'appProtocol': 'http'
                    },
                ],
                'essential': True,
                'logConfiguration': {
                    'logDriver': 'awslogs',
                    'options': {
                        'awslogs-create-group': 'true',
                        'awslogs-group': f'/ecs/{server_task_name}',
                        'awslogs-region': 'eu-north-1',
                        'awslogs-stream-prefix': 'ecs'
                    },
                }
            }
        ],
        requiresCompatibilities=[
            'EC2'
        ],
        cpu='256',
        memory='512',
        runtimePlatform={
            'cpuArchitecture': 'X86_64',
            'operatingSystemFamily': 'LINUX'
        }
    )

    # Create fl-server Service
    app.logger.info(f"Creating fl-server Service...")
    server_service_name = f'fl-server-service-{workflow_id}'
    ecs_client.create_service(
        cluster=ecs_cluster_name,
        serviceName=server_service_name,
        taskDefinition=server_task_name,
        desiredCount=1,
        loadBalancers=[
            {
                'targetGroupArn': target_group_arn,
                'containerName': 'fl-server',
                'containerPort': 5000
            },
        ],
        capacityProviderStrategy=[
            {
                'capacityProvider': capacity_provider_name,
                'weight': 1,
                'base': 0
            },
        ],
        deploymentConfiguration={
            'deploymentCircuitBreaker': {
                'enable': True,
                'rollback': True
            },
            'maximumPercent': 101,
            'minimumHealthyPercent': 100,
            'alarms': {
                'alarmNames': [],
                'enable': False,
                'rollback': False
            }
        },
        placementStrategy=[
            {
                'type': 'spread',
                'field': 'attribute:ecs.availability-zone'
            },
            {
                'type': 'spread',
                'field': 'instanceId'
            },
        ],
        schedulingStrategy='REPLICA',
        deploymentController={
            'type': 'ECS'
        },
        enableECSManagedTags=True,
        propagateTags='NONE',
        enableExecuteCommand=False,
    )

    # Register fl-orchestrator Task Definition
    app.logger.info(f"Registering fl-orchestrator Task Definition...")
    orchestrator_task_name = f'fl-orchestrator-{workflow_id}'
    ecs_client.register_task_definition(
        family=orchestrator_task_name,
        taskRoleArn='ecsTaskExecutionRole',
        executionRoleArn='ecsTaskExecutionRole',
        networkMode='bridge',
        containerDefinitions=[
            {
                'name': 'fl-orchestrator',
                'image': 'public.ecr.aws/d1f3d1b3/fl-orchestrator:latest',
                'cpu': 0,
                'memory': 512,
                'memoryReservation': 512,
                'portMappings': [
                    {
                        'containerPort': 5000,
                        'hostPort': 5000,
                        'protocol': 'tcp',
                        'name': 'fl-orchestrator-5000-tcp',
                        'appProtocol': 'http'
                    },
                ],
                'essential': True,
                'environment': [
                    {
                        'name': 'FL_SERVER_ENDPOINT',
                        'value': load_balancer_dns
                    },
                    {
                        'name': 'FL_SERVER_PORT',
                        'value': '5000'
                    },
                    {
                        'name': 'FREQUENCY_HOURS',
                        'value': '2'
                    }
                ],
                'logConfiguration': {
                    'logDriver': 'awslogs',
                    'options': {
                        'awslogs-create-group': 'true',
                        'awslogs-group': f'/ecs/{orchestrator_task_name}',
                        'awslogs-region': 'eu-north-1',
                        'awslogs-stream-prefix': 'ecs'
                    },
                }
            }
        ],
        requiresCompatibilities=[
            'EC2'
        ],
        cpu='256',
        memory='512',
        runtimePlatform={
            'cpuArchitecture': 'X86_64',
            'operatingSystemFamily': 'LINUX'
        }
    )

    # Create fl-orchestrator Service
    app.logger.info(f"Creating fl-orchestrator Service...")
    orchestrator_service_name = f'fl-orchestrator-service-{workflow_id}'
    ecs_client.create_service(
        cluster=ecs_cluster_name,
        serviceName=orchestrator_service_name,
        taskDefinition=orchestrator_task_name,
        desiredCount=0,  # update to 1 when orchestrator is started
        capacityProviderStrategy=[
            {
                'capacityProvider': capacity_provider_name,
                'weight': 1,
                'base': 0
            },
        ],
        deploymentConfiguration={
            'deploymentCircuitBreaker': {
                'enable': True,
                'rollback': True
            },
            'maximumPercent': 101,
            'minimumHealthyPercent': 100,
            'alarms': {
                'alarmNames': [],
                'enable': False,
                'rollback': False
            }
        },
        placementStrategy=[
            {
                'type': 'spread',
                'field': 'attribute:ecs.availability-zone'
            },
            {
                'type': 'spread',
                'field': 'instanceId'
            },
        ],
        schedulingStrategy='REPLICA',
        deploymentController={
            'type': 'ECS'
        },
        enableECSManagedTags=True,
        propagateTags='NONE',
        enableExecuteCommand=False,
    )

    app.logger.info(f"Successfully created workflow with id: {workflow_id}")

    # Update server hostname & status in database
    workflows.update_one(
        {"wid": workflow_id},
        {"$set": {"server_hostname": load_balancer_dns, "status": "Created"}}
    )

    return jsonify(
        {
            "msg": "Workflow created",
            "id": workflow_id
        }
    ), 201


@app.route("/workflows/delete/<workflow_id>", methods=["DELETE"])
def delete_workflow(workflow_id):
    result = workflows.delete_one({"wid": workflow_id})
    if result.deleted_count == 1:
        return jsonify({"msg": "Workflow deleted"}), 200
    else:
        return jsonify({"msg": "Workflow not found"}), 404


@app.route("/workflows/status/<workflow_id>", methods=["GET"])
def get_workflow_status(workflow_id):
    try:
        current_status = workflows.find_one({"wid": workflow_id})["status"]
    except:
        return jsonify({"msg": "Workflow not found"}), 404

    ecs_cluster_active_services_count = Try(
        lambda:
        ecs_client.describe_clusters(
            clusters=[
                f'fl-ecs-{workflow_id}'
            ]
        )['clusters'][0]['activeServicesCount']
    ).get_or_else(0)
    server_task_last_status = Try(lambda: get_server_service_status(workflow_id)).get_or_else('Failed').capitalize()
    orchestrator_task_last_status = Try(lambda: get_orchestrator_service_status(workflow_id)).get_or_else(
        'Failed').capitalize()

    new_status = current_status
    if current_status == 'Pending' or current_status == 'Created':
        pass
    elif ecs_cluster_active_services_count < 2 and current_status != 'Pending':
        new_status = 'Failed'
    elif server_task_last_status == 'Failed' and current_status != 'Pending':
        new_status = 'Failed'
    elif orchestrator_task_last_status == 'Failed' and (current_status == 'Pending' or current_status == 'Created'):
        pass
    elif orchestrator_task_last_status == 'Failed' and current_status == 'Running':
        new_status = 'Canceled'
    elif orchestrator_task_last_status != 'Failed' and orchestrator_task_last_status != current_status:
        new_status = orchestrator_task_last_status
    else:
        pass

    workflows.update_one(
        {"wid": workflow_id},
        {"$set": {"status": new_status}}
    )

    return jsonify({"id": workflow_id, "status": new_status}), 200


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
            "name": model["name"],
            "filename": model["filename"]
        })
    return jsonify(models_list)

# TODO: update the method after decide details about models
@app.route("/models/insert", methods=["POST"])
def insert_model():
    name = request.json.get("name", None)
    filename = request.json.get("filename", None)

    if not name:
        return jsonify({"msg": "Missing model name"}), 400
    if not filename:
        return jsonify({"msg": "Missing filename"}), 400

    model = models.find_one({"name": name})
    if model:
        return jsonify({"msg": "Model already registered"}), 400

    model_id = str(uuid.uuid4())
    models.insert_one({"mid": model_id, "name": name, "filename": filename})
    return jsonify({"msg": "Model created", "id": model_id}), 201


@app.route("/models/delete/<model_id>", methods=["DELETE"])
def delete_model(model_id):
    result = models.delete_one({"mid": model_id})
    if result.deleted_count == 1:
        return jsonify({"msg": "Model deleted"}), 200
    else:
        return jsonify({"msg": "Model not found"}), 404
    
@app.route('/upload/model', methods=['POST'])
def upload_file():
    print("aiciiii")
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'})

    print("si aiciii")
    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'})
    
    # Read the content of the file
    file_content = file.read()

    # Process the file content (e.g., print or save to disk)
    print("Content of the uploaded file:")
    print(file_content.decode('utf-8'))  # Decode bytes to string assuming UTF-8 encoding
    
    print(f'File {file.filename}')
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        return jsonify({'success': True, 'message': 'File uploaded successfully'})
    else:
        return jsonify({'error': 'Invalid file type'})
    
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ----------------------- Models ------------------------------

def send_confirmation_email(user_email):
    token = s.dumps(user_email, salt='email-confirm')
    confirm_url = f'http://localhost:3006/confirm/{user_email}/{token}'
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
        server.login(FROM_EMAIL, "odyr rtxp vtda jrnk")
        server.sendmail(msg['From'], [msg['To']], msg.as_string())

if __name__ == "__main__":
    app.run(debug=True)
