import string
import traceback
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
import tempfile
from itsdangerous import URLSafeTimedSerializer, SignatureExpired
import smtplib
from email.mime.text import MIMEText
from flask import url_for
from werkzeug.utils import secure_filename
import tensorflow as tf
import shutil

app = Flask(__name__)

log_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

app.config["MONGO_URI"] = config["MONGO_URI"]
app.config['JWT_SECRET_KEY'] = config["JWT_SECRET_KEY"]
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
ALLOWED_EXTENSIONS = {'keras'}
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
    # workflows.update_one(
    #     {"wid": "kpJ511QEmWtK"},
    #     {"$set": {"status": "Created"}}
    # )
    workflow = workflows.find_one({"wid": "kpJ511QEmWtK"})
    return json.dumps(workflow, default=str)


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
    status = ecs_client.describe_tasks(
        cluster=f'fl-ecs-{workflow_id}',
        tasks=task_arns
    )['tasks'][0]['lastStatus']
    return status


def get_orchestrator_service_status(workflow_id):
    task_arns = ecs_client.list_tasks(
        cluster=f'fl-ecs-{workflow_id}',
        serviceName=f'fl-orchestrator-service-{workflow_id}'
    )['taskArns']
    status = ecs_client.describe_tasks(
        cluster=f'fl-ecs-{workflow_id}',
        tasks=task_arns
    )['tasks'][0]['lastStatus']
    return status


def timestamp_to_iso8601(timestamp):
    timestamp_s = timestamp / 1000.0
    dt_object = datetime.fromtimestamp(timestamp_s)
    return dt_object.isoformat(timespec='milliseconds') + 'Z'


def generate_random_string(length=12):
    characters = string.ascii_letters + string.digits
    random_string = ''.join(random.choice(characters) for _ in range(length))
    return random_string


def empty_bucket(bucket_name):
    response = s3_client.list_objects_v2(Bucket=bucket_name)

    while 'Contents' in response:
        for obj in response['Contents']:
            s3_client.delete_object(Bucket=bucket_name, Key=obj['Key'])

        if response['IsTruncated']:
            response = s3_client.list_objects_v2(
                Bucket=bucket_name,
                ContinuationToken=response['NextContinuationToken']
            )
        else:
            break


def terminate_instances(workflow_id):
    instances = asg_client.describe_auto_scaling_groups(
        AutoScalingGroupNames=[f'Infra-ECS-Cluster-fl-ecs-{workflow_id}-ASG'],
    )['AutoScalingGroups'][0]['Instances']
    instanceIds = [instance['InstanceId'] for instance in instances]
    ec2_client.terminate_instances(
        InstanceIds=instanceIds
    )


def delete_auto_scaling_group(workflow_id):
    asg_client.delete_auto_scaling_group(
        AutoScalingGroupName=f'Infra-ECS-Cluster-fl-ecs-{workflow_id}-ASG',
        ForceDelete=True
    )


def delete_load_balancer(workflow_id):
    load_balancer_arn = elbv2_client.describe_load_balancers(
        Names=[f'ecs-alb-{workflow_id}']
    )['LoadBalancers'][0]['LoadBalancerArn']

    elbv2_client.delete_load_balancer(
        LoadBalancerArn=load_balancer_arn
    )


def delete_target_group(workflow_id):
    target_group_arn = elbv2_client.describe_target_groups(
        Names=[f'ecs-alb-targetgroup-{workflow_id}']
    )['TargetGroups'][0]['TargetGroupArn']

    elbv2_client.delete_target_group(
        TargetGroupArn=target_group_arn
    )


def delete_launch_template(workflow_id):
    ec2_client.delete_launch_template(
        DryRun=False,
        LaunchTemplateName=f'ECSLaunchTemplate_fl-ecs-{workflow_id}',
    )


def delete_server_service(workflow_id):
    ecs_client.delete_service(
        cluster=f'fl-ecs-{workflow_id}',
        service=f'fl-server-service-{workflow_id}',
        force=True
    )


def delete_orchestrator_service(workflow_id):
    ecs_client.delete_service(
        cluster=f'fl-ecs-{workflow_id}',
        service=f'fl-orchestrator-service-{workflow_id}',
        force=True
    )


def delete_ecs_cluster(workflow_id):
    ecs_client.delete_cluster(
        cluster=f'fl-ecs-{workflow_id}',
    )


def deregister_server_task_definition(workflow_id):
    ecs_client.deregister_task_definition(
        taskDefinition=f'fl-server-{workflow_id}:1'
    )


def deregister_orchestrator_task_definition(workflow_id):
    ecs_client.deregister_task_definition(
        taskDefinition=f'fl-orchestrator-{workflow_id}:1'
    )


def delete_task_definition(workflow_id):
    ecs_client.delete_task_definitions(
        taskDefinitions=[
            f'fl-server-{workflow_id}:1',
            f'fl-orchestrator-{workflow_id}:1'
        ]
    )


def delete_bucket(workflow_id):
    bucket_name = f'fl-workflow-{workflow_id.lower()}'
    empty_bucket(bucket_name)
    s3_client.delete_bucket(Bucket=bucket_name)


def get_orchestrator_logs(workflow_id):
    log_streams = logs_client.describe_log_streams(
        logGroupName=f'/ecs/fl-orchestrator-{workflow_id}',
        orderBy='LastEventTime',
        descending=False,
    )['logStreams']
    log_stream_names = [log_stream['logStreamName'] for log_stream in log_streams]

    logs = []
    for log_stream_name in log_stream_names:
        log_events = logs_client.get_log_events(
            logGroupName=f'/ecs/fl-orchestrator-{workflow_id}',
            logStreamName=log_stream_name,
            startFromHead=True
        )
        for event in log_events['events']:
            logs.append(f"[{timestamp_to_iso8601(event['timestamp'])}] {event['message']}")

    return logs


def create_tflite_model(keras_model, filename):
    input_shape = keras_model.input_shape
    num_inputs = input_shape[1] if isinstance(input_shape, tuple) else input_shape[-1]
    output_shape = keras_model.output_shape
    num_outputs = output_shape[1] if isinstance(output_shape, tuple) else output_shape[-1]

    class Model(tf.Module):
        def __init__(self):
            self.model = keras_model

        @tf.function(input_signature=[
            tf.TensorSpec(shape=[None, num_inputs], dtype=tf.float32),
            tf.TensorSpec(shape=[None, num_outputs], dtype=tf.int32)
        ])
        def train(self, features, label):
            with tf.GradientTape() as tape:
                predictions = self.model(tf.convert_to_tensor(features))
                loss = self.model.loss(label, predictions)
            gradients = tape.gradient(loss, self.model.trainable_variables)
            self.model.optimizer.apply_gradients(zip(gradients, self.model.trainable_variables))
            result = {"loss": loss}
            return result

        @tf.function(input_signature=[
            tf.TensorSpec(shape=[None, num_inputs], dtype=tf.float32)
        ])
        def infer(self, features):
            logits = self.model(features)
            probabilities = tf.nn.softmax(logits, axis=-1)
            return {
                "output": probabilities
            }

        @tf.function(input_signature=[
            tf.TensorSpec(shape=[], dtype=tf.string)
        ])
        def save(self, checkpoint_path):
            tensor_names = [weight.name for weight in self.model.weights]
            print("tensor_names: ", tensor_names)
            tensors_to_save = [weight.read_value() for weight in self.model.weights]
            tf.raw_ops.Save(
                filename=checkpoint_path,
                tensor_names=tensor_names,
                data=tensors_to_save,
                name='save')
            return {
                "checkpoint_path": checkpoint_path
            }

        @tf.function(input_signature=[tf.TensorSpec(shape=[], dtype=tf.string)])
        def restore(self, checkpoint_path):
            restored_tensors = list()
            for var in self.model.weights:
                restored = tf.raw_ops.Restore(
                    file_pattern=checkpoint_path,
                    tensor_name=var.name,
                    dt=var.dtype,
                    name='restore')
                var.assign(restored)
                if restored is not None:
                    restored_tensors.append(var.name)
            return {
                "restored_tensors": ",".join(restored_tensors)
            }

    tf_model = Model()
    saved_model_path = tempfile.gettempdir() + '/saved_model'
    tf.saved_model.save(
        tf_model, saved_model_path,
        signatures={
            'train': tf_model.train.get_concrete_function(),
            'infer': tf_model.infer.get_concrete_function(),
            'save': tf_model.save.get_concrete_function(),
            'restore': tf_model.restore.get_concrete_function()
        }
    )

    converter = tf.lite.TFLiteConverter.from_saved_model(saved_model_path)
    converter.target_spec.supported_ops = [
        tf.lite.OpsSet.TFLITE_BUILTINS,  # enable TensorFlow Lite ops.
        tf.lite.OpsSet.SELECT_TF_OPS  # enable TensorFlow ops.
    ]
    tflite_model = converter.convert()

    tflite_filepath = tempfile.gettempdir() + f'/{filename}.tflite'
    open(tflite_filepath, 'wb').write(tflite_model)

    if os.path.exists(saved_model_path):
        shutil.rmtree(saved_model_path)

    return tflite_filepath, num_inputs, num_outputs


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
    user_id = users.insert_one(
        {"email": email, "password": hashed_password, "email_confirmed": email_confirmed}).inserted_id
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
        "status": 'Provisioning',
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
    users.update_one(
        {"workflows": workflow_id},
        {"$pull": {"workflows": workflow_id}}
    )

    Try(lambda: terminate_instances(workflow_id))
    Try(lambda: delete_auto_scaling_group(workflow_id))
    Try(lambda: delete_load_balancer(workflow_id))
    Try(lambda: delete_target_group(workflow_id))
    Try(lambda: delete_launch_template(workflow_id))
    Try(lambda: delete_server_service(workflow_id))
    Try(lambda: delete_orchestrator_service(workflow_id))
    Try(lambda: delete_ecs_cluster(workflow_id))
    Try(lambda: deregister_server_task_definition(workflow_id))
    Try(lambda: deregister_orchestrator_task_definition(workflow_id))
    Try(lambda: delete_task_definition(workflow_id))
    Try(lambda: delete_bucket(workflow_id))

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
    if current_status == 'Provisioning' or current_status == 'Created':
        pass
    elif ecs_cluster_active_services_count < 2 and current_status != 'Provisioning':
        new_status = 'Failed'
        workflows.update_one(
            {"wid": workflow_id},
            {"$set": {"status": new_status}}
        )
    elif server_task_last_status == 'Failed' and current_status != 'Provisioning':
        new_status = 'Failed'
        workflows.update_one(
            {"wid": workflow_id},
            {"$set": {"status": new_status}}
        )
    elif orchestrator_task_last_status == 'Failed' and (
            current_status == 'Provisioning' or current_status == 'Created'):
        pass
    elif orchestrator_task_last_status == 'Failed' and current_status == 'Running':
        new_status = 'Canceled'
        workflows.update_one(
            {"wid": workflow_id},
            {"$set": {"status": new_status}}
        )
    elif orchestrator_task_last_status != 'Failed' and orchestrator_task_last_status != current_status:
        new_status = orchestrator_task_last_status
        workflows.update_one(
            {"wid": workflow_id},
            {"$set": {"status": new_status}}
        )
    else:
        pass

    return jsonify({"id": workflow_id, "status": new_status}), 200


@app.route("/workflows/register/cancel/<workflow_id>", methods=["POST"])
def register_workflow_cancel(workflow_id):
    workflows.update_one(
        {"wid": workflow_id},
        {"$set": {"status": "Canceling"}}
    )
    return jsonify(
        {
            "message": f"Workflow {workflow_id} registered to cancel",
            "id": workflow_id
        }
    ), 200


@app.route("/workflows/cancel/<workflow_id>", methods=["POST"])
def cancel_workflow(workflow_id):
    task_arns = ecs_client.list_tasks(
        cluster=f'fl-ecs-{workflow_id}',
        serviceName=f'fl-orchestrator-service-{workflow_id}'
    )['taskArns']

    container_instance_arn = ecs_client.describe_tasks(
        cluster=f'fl-ecs-{workflow_id}',
        tasks=task_arns
    )['tasks'][0]['containerInstanceArn']

    instance_id = ecs_client.describe_container_instances(
        cluster=f'fl-ecs-{workflow_id}',
        containerInstances=[container_instance_arn]
    )['containerInstances'][0]['ec2InstanceId']

    # Update orchestrator service desired count to 0
    ecs_client.update_service(
        cluster=f'fl-ecs-{workflow_id}',
        service=f'fl-orchestrator-service-{workflow_id}',
        desiredCount=0
    )

    # Update auto scaling group
    asg_client.update_auto_scaling_group(
        AutoScalingGroupName=f'Infra-ECS-Cluster-fl-ecs-{workflow_id}-ASG',
        MinSize=0,
        MaxSize=2,
        DesiredCapacity=1
    )

    # Terminate instance
    ec2_client.terminate_instances(
        InstanceIds=[instance_id]
    )

    workflows.update_one(
        {"wid": workflow_id},
        {"$set": {"status": "Canceled"}}
    )

    return jsonify(
        {
            "message": f"Workflow {workflow_id} is canceled",
            "id": workflow_id
        }
    ), 200


@app.route("/workflows/register/run/<workflow_id>", methods=["POST"])
def register_workflow_run(workflow_id):
    workflows.update_one(
        {"wid": workflow_id},
        {"$set": {"status": "Provisioning"}}
    )
    return jsonify(
        {
            "message": f"Workflow {workflow_id} registered to run",
            "id": workflow_id
        }
    ), 200


@app.route("/workflows/run/<workflow_id>", methods=["POST"])
def run_workflow(workflow_id):
    # update ASG desired capacity
    asg_client.update_auto_scaling_group(
        AutoScalingGroupName=f'Infra-ECS-Cluster-fl-ecs-{workflow_id}-ASG',
        DesiredCapacity=2
    )
    # wait for container provisioning
    time.sleep(45)
    # update service desired count
    ecs_client.update_service(
        cluster=f'fl-ecs-{workflow_id}',
        service=f'fl-orchestrator-service-{workflow_id}',
        desiredCount=1
    )
    # wait for orchestrator to start
    time.sleep(45)

    workflows.update_one(
        {"wid": workflow_id},
        {"$set": {"status": "Running"}}
    )

    return jsonify(
        {
            "message": f"Workflow {workflow_id} is running",
            "id": workflow_id
        }
    ), 200


@app.route("/workflows/logs/<workflow_id>", methods=["GET"])
def get_workflow_logs(workflow_id):
    logs = Try(lambda: get_orchestrator_logs(workflow_id)).get_or_else([])

    return jsonify(logs), 200


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
            "filename": model["filename"],
            "description": model["description"],
            "features": str(model["features"]),
            "labels": str(model["labels"]),
        })
    return jsonify(models_list)


@app.route("/models/getUserModels/<user_email>", methods=["GET"])
def get_user_models(user_email):
    user_models = users.find_one({"email": user_email})["models"]
    models_list = []
    for model_id in user_models:
        model = models.find_one({"mid": model_id})
        models_list.append({
            "id": str(model["mid"]),
            "name": model["name"],
            "filename": model["filename"],
        })

    return jsonify(models_list), 200


# TODO: update the method after decide details about models
@app.route("/models/insert", methods=["POST"])
def insert_model():
    name = request.json.get("name", None)
    description = request.json.get("description", None)
    filename = request.json.get("filename", None)
    user_email = request.json.get("user_email", None)

    if not name:
        return jsonify({"msg": "Missing model name"}), 400
    if not description:
        return jsonify({"msg": "Missing model description"}), 400
    if not filename:
        return jsonify({"msg": "Missing filename"}), 400
    if not user_email:
        return jsonify({"msg": "Missing user email"}), 400

    model = models.find_one({"name": name})
    if model:
        return jsonify({"msg": "Model already registered"}), 400

    model = models.find_one({"filename": filename})
    if model:
        return jsonify({"msg": "Model already registered"}), 400

    model_id = str(uuid.uuid4())
    models.insert_one(
        {
            "mid": model_id,
            "name": name,
            "description": description,
            "filename": filename,
            "created_at": datetime.now()
        }
    )
    users.update_one(
        {"email": user_email},
        {"$push": {"models": model_id}}
    )

    return jsonify({"msg": "Model created", "id": model_id}), 201


@app.route("/models/delete/<model_id>", methods=["DELETE"])
def delete_model(model_id):
    filename = os.path.splitext(models.find_one({"mid": model_id})['filename'])[0]
    result = models.delete_one({"mid": model_id})
    user_id = str(users.find_one({"models": model_id})["_id"])
    users.update_one(
        {"models": model_id},
        {"$pull": {"models": model_id}}
    )

    Try(lambda: s3_client.delete_object(
        Bucket=f'fl-models-{user_id}',
        Key=f'{filename}.tflite'
    ))

    if result.deleted_count == 1:
        return jsonify({"msg": "Model deleted"}), 200
    else:
        return jsonify({"msg": "Model not found"}), 404


@app.route('/upload/model', methods=['POST'])
def upload_file():
    user_email = request.form.get('user_email', None)
    model_id = request.form.get('model_id', None)
    if not user_email:
        return jsonify({'error': 'Missing user email'}), 400

    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400

    user_id = str(users.find_one({"email": user_email})["_id"])
    temp_dir = tempfile.gettempdir()
    file_path = os.path.join(temp_dir, file.filename)
    file.save(file_path)
    tflite_filepath = None

    try:
        model = tf.keras.models.load_model(file_path)
        tflite_filepath, num_features, num_labels = create_tflite_model(model, os.path.splitext(file.filename)[0])

        s3_client.upload_file(
            tflite_filepath,
            f'fl-models-{user_id}',
            f'{os.path.splitext(file.filename)[0]}.tflite'
        )

        models.update_one(
            {"mid": model_id},
            {"$set": {"features": num_features, "labels": num_labels}}
        )

        return jsonify({'message': 'File uploaded and model loaded successfully'}), 201
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500
    finally:
        # Clean up the temporary file
        if os.path.exists(file_path):
            os.remove(file_path)

        if tflite_filepath is not None and os.path.exists(tflite_filepath):
            os.remove(tflite_filepath)


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
