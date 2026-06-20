# ChatSphere AI — CI/CD Pipeline Documentation

## 1. Phase Objective

The goal of this phase was to convert the manual deployment process into an automated CI/CD pipeline for **ChatSphere AI**.

Before this phase, every frontend/backend change required manual commands:

```bash
docker build
docker push
kubectl apply
kubectl rollout status
```

After this phase, the deployment flow became automated:

```txt
Developer pushes code to GitHub
        ↓
GitHub Actions starts pipeline
        ↓
Docker images are built
        ↓
Images are pushed to Docker Hub
        ↓
Self-hosted GitHub runner deploys to Kubernetes
        ↓
Kubernetes performs rolling update
        ↓
ChatSphere AI gets updated
```

---

## 2. Tools Used

| Tool                      | Purpose                                                  |
| ------------------------- | -------------------------------------------------------- |
| GitHub                    | Source code repository                                   |
| GitHub Actions            | CI/CD automation                                         |
| Docker                    | Container image build                                    |
| Docker Hub                | Container image registry                                 |
| Kubernetes                | Application deployment platform                          |
| Kind                      | Local Kubernetes cluster                                 |
| Self-hosted GitHub Runner | Allows GitHub Actions to access local Kubernetes cluster |
| kubectl                   | Kubernetes deployment command-line tool                  |

---

## 3. Why CI/CD Was Needed

Manual deployment is okay during early development, but it is not suitable for production.

Manual process problems:

```txt
Human error
Wrong image tag
Forgotten docker push
Forgotten kubectl rollout
No repeatable deployment process
No proper deployment history
Slow release process
```

CI/CD solves this by making deployment:

```txt
Automated
Repeatable
Traceable
Faster
Production-like
```

---

## 4. Initial Manual Deployment Flow

Before CI/CD, we manually built and deployed images.

Example frontend deployment:

```bash
docker build --no-cache -t nsmachine/production:frontend-v9 ./frontend
docker push nsmachine/production:frontend-v9
```

Then Kubernetes deployment file had to be updated manually:

```yaml
image: nsmachine/production:frontend-v9
```

Then applied:

```bash
kubectl apply -f k8s/frontend-deployment.yaml
kubectl rollout status deployment/frontend-deployment -n production-chat
```

This worked, but it was not automated.

---

## 5. Docker Hub Integration

Docker Hub was used as the container image registry.

Repository used:

```txt
nsmachine/production
```

Image naming pattern:

```txt
nsmachine/production:backend-<tag>
nsmachine/production:frontend-<tag>
```

Example:

```txt
nsmachine/production:backend-dev-a1b2c3d
nsmachine/production:frontend-dev-a1b2c3d
```

### Why Docker Hub?

Kubernetes does not deploy source code directly. Kubernetes deploys container images.

Flow:

```txt
Source Code
   ↓
Docker Build
   ↓
Docker Image
   ↓
Docker Hub
   ↓
Kubernetes Pulls Image
```

---

## 6. GitHub Secrets Configuration

GitHub Actions needs Docker Hub credentials to push images.

Instead of hardcoding credentials in the workflow, we created GitHub repository secrets.

Path:

```txt
GitHub Repository
→ Settings
→ Secrets and variables
→ Actions
→ New repository secret
```

Secrets added:

```txt
DOCKERHUB_USERNAME = nsmachine
DOCKERHUB_TOKEN    = Docker Hub access token
```

### Why Secrets?

Bad practice:

```yaml
username: nsmachine
password: actual-password
```

Good practice:

```yaml
username: ${{ secrets.DOCKERHUB_USERNAME }}
password: ${{ secrets.DOCKERHUB_TOKEN }}
```

Secrets are injected securely during workflow runtime.

---

## 7. GitHub Actions CI Workflow

We created:

```txt
.github/workflows/docker-build-push.yml
```

Initial purpose:

```txt
Build backend Docker image
Push backend image to Docker Hub
Build frontend Docker image
Push frontend image to Docker Hub
```

This gave us the CI part.

CI means:

```txt
Continuous Integration
```

In our project:

```txt
Code push
   ↓
Docker image build
   ↓
Docker image push
```

---

## 8. Self-hosted GitHub Runner

GitHub cloud runners cannot access a local Kind Kubernetes cluster running on a laptop.

Cloud runner limitation:

```txt
GitHub-hosted runner
   ✗ Cannot access local laptop Kubernetes cluster
```

So we installed a self-hosted runner inside WSL.

Self-hosted runner flow:

```txt
GitHub Actions
   ↓
Self-hosted runner on laptop
   ↓
kubectl
   ↓
Kind Kubernetes cluster
```

This allowed GitHub Actions to deploy directly into our local Kubernetes cluster.

---

## 9. Self-hosted Runner Installation

GitHub path:

```txt
Repository
→ Settings
→ Actions
→ Runners
→ New self-hosted runner
→ Linux
→ x64
```

We created a script:

```bash
setup-github-runner.sh
```

Script summary:

```bash
mkdir -p ~/actions-runner
cd ~/actions-runner

curl -o actions-runner-linux-x64-2.335.1.tar.gz \
-L https://github.com/actions/runner/releases/download/v2.335.1/actions-runner-linux-x64-2.335.1.tar.gz

tar xzf actions-runner-linux-x64-2.335.1.tar.gz

./config.sh \
  --url https://github.com/Devops-Nitin/production-chat-platform \
  --token <runner-token> \
  --name chatsphere-ai-local-runner \
  --labels self-hosted,linux,x64,chatsphere,kubernetes \
  --unattended

./run.sh
```

Successful output:

```txt
Connected to GitHub
Runner successfully added
Settings saved
Listening for Jobs
```

This confirmed the runner was ready.

---

## 10. Kubernetes Context Verification

Before enabling deployment automation, we verified that the runner machine had access to the local Kubernetes cluster.

Commands:

```bash
kubectl config current-context
```

Output:

```txt
kind-nks-cluster
```

Checked deployments:

```bash
kubectl get deployment -n production-chat
```

Output confirmed:

```txt
backend-deployment    1/1
frontend-deployment   2/2
mongo-deployment      1/1
redis-deployment      1/1
```

Checked nodes:

```bash
kubectl get nodes
```

Output confirmed:

```txt
nks-cluster-control-plane   Ready
nks-cluster-worker          Ready
nks-cluster-worker2         Ready
```

---

## 11. Final CI/CD Workflow

We updated:

```txt
.github/workflows/docker-build-push.yml
```

Final pipeline stages:

```txt
Stage 1: Build and Push Docker Images
Stage 2: Deploy to Local Kubernetes
```

Workflow behavior:

```txt
Push to develop branch
   ↓
Build backend image
   ↓
Push backend image
   ↓
Build frontend image
   ↓
Push frontend image
   ↓
Self-hosted runner updates Kubernetes deployments
   ↓
Kubernetes performs rollout
```

---

## 12. Final GitHub Actions Workflow

```yaml
name: ChatSphere AI CI CD Pipeline

on:
  push:
    branches:
      - develop

jobs:
  build-and-push:
    name: Build and Push Docker Images
    runs-on: ubuntu-latest

    outputs:
      image_tag: ${{ steps.vars.outputs.image_tag }}

    steps:
      - name: Checkout source code
        uses: actions/checkout@v4

      - name: Generate image tag
        id: vars
        run: |
          IMAGE_TAG=dev-${GITHUB_SHA::7}
          echo "image_tag=$IMAGE_TAG" >> $GITHUB_OUTPUT

      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build backend image
        run: |
          docker build \
            -t nsmachine/production:backend-${{ steps.vars.outputs.image_tag }} \
            ./backend

      - name: Push backend image
        run: |
          docker push nsmachine/production:backend-${{ steps.vars.outputs.image_tag }}

      - name: Build frontend image
        run: |
          docker build \
            -t nsmachine/production:frontend-${{ steps.vars.outputs.image_tag }} \
            ./frontend

      - name: Push frontend image
        run: |
          docker push nsmachine/production:frontend-${{ steps.vars.outputs.image_tag }}

  deploy-to-kubernetes:
    name: Deploy to Local Kubernetes
    runs-on: self-hosted
    needs: build-and-push

    steps:
      - name: Checkout source code
        uses: actions/checkout@v4

      - name: Verify Kubernetes context
        run: |
          kubectl config current-context
          kubectl get nodes

      - name: Deploy backend image
        run: |
          kubectl set image deployment/backend-deployment \
            backend=nsmachine/production:backend-${{ needs.build-and-push.outputs.image_tag }} \
            -n production-chat

      - name: Deploy frontend image
        run: |
          kubectl set image deployment/frontend-deployment \
            frontend=nsmachine/production:frontend-${{ needs.build-and-push.outputs.image_tag }} \
            -n production-chat

      - name: Wait for backend rollout
        run: |
          kubectl rollout status deployment/backend-deployment \
            -n production-chat \
            --timeout=180s

      - name: Wait for frontend rollout
        run: |
          kubectl rollout status deployment/frontend-deployment \
            -n production-chat \
            --timeout=180s

      - name: Verify pods
        run: |
          kubectl get pods -n production-chat
          kubectl get ingress -n production-chat
```

---

## 13. Why Image Tags Use Git SHA

We used:

```bash
IMAGE_TAG=dev-${GITHUB_SHA::7}
```

Example:

```txt
frontend-dev-a1b2c3d
backend-dev-a1b2c3d
```

### Why?

Every Git commit gets a unique SHA.

This gives:

```txt
Unique image version
Traceability
Rollback support
Clear deployment history
```

If a deployment breaks, we can identify exactly which Git commit caused it.

---

## 14. Kubernetes Deployment Automation

Instead of editing YAML manually, we used:

```bash
kubectl set image
```

Backend:

```bash
kubectl set image deployment/backend-deployment \
  backend=nsmachine/production:backend-${IMAGE_TAG} \
  -n production-chat
```

Frontend:

```bash
kubectl set image deployment/frontend-deployment \
  frontend=nsmachine/production:frontend-${IMAGE_TAG} \
  -n production-chat
```

### Why kubectl set image?

It updates only the container image inside the deployment.

Kubernetes then automatically performs rolling update.

---

## 15. Rollout Verification

We used:

```bash
kubectl rollout status deployment/backend-deployment -n production-chat --timeout=180s
```

and:

```bash
kubectl rollout status deployment/frontend-deployment -n production-chat --timeout=180s
```

### Why?

This ensures the deployment is successful before the pipeline finishes.

If pods fail with:

```txt
CrashLoopBackOff
ImagePullBackOff
Readiness probe failure
```

the workflow fails.

This is production-grade behavior.

---

## 16. Final Verification

After the workflow succeeded, we verified locally:

```bash
kubectl get pods -n production-chat
```

Output:

```txt
backend-deployment     Running
frontend-deployment    Running
mongo-deployment       Running
redis-deployment       Running
```

We also verified:

```bash
kubectl get deployment frontend-deployment -n production-chat \
-o=jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'
```

and:

```bash
kubectl get deployment backend-deployment -n production-chat \
-o=jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'
```

This confirms Kubernetes is running the image generated by GitHub Actions.

---

## 17. Final CI/CD Architecture

```txt
Developer
   ↓
git push origin develop
   ↓
GitHub Repository
   ↓
GitHub Actions
   ↓
Docker Build
   ↓
Docker Hub
   ↓
Self-hosted GitHub Runner
   ↓
kubectl set image
   ↓
Kubernetes Deployment
   ↓
Rolling Update
   ↓
ChatSphere AI Updated
```

---

## 18. What We Achieved

At the end of this phase, ChatSphere AI had:

```txt
Automated Docker image build
Automated Docker Hub image push
Unique image versioning using Git SHA
Self-hosted GitHub runner
Automated Kubernetes deployment
Automated rollout verification
Production-style CI/CD workflow
```

This is a major DevOps milestone.

---

# Cloud Migration Plan

## 19. Current Local Setup

Current setup:

```txt
GitHub Actions
   ↓
Docker Hub
   ↓
Self-hosted runner on laptop
   ↓
Local Kind Kubernetes cluster
```

This is good for learning and local production simulation.

But in real production, the Kubernetes cluster will run in cloud.

Example:

```txt
AWS EKS
Azure AKS
Google GKE
DigitalOcean Kubernetes
```

---

## 20. Cloud Deployment Target Example: AWS EKS

Future cloud architecture:

```txt
GitHub
   ↓
GitHub Actions
   ↓
Docker Hub / Amazon ECR
   ↓
AWS EKS
   ↓
Nginx Ingress / AWS Load Balancer
   ↓
ChatSphere AI
```

---

## 21. Steps to Move Same Setup to Cloud

### Step 1: Create Cloud Kubernetes Cluster

For AWS:

```bash
eksctl create cluster \
  --name chatsphere-ai-cluster \
  --region ap-south-1 \
  --nodes 2 \
  --node-type t3.medium
```

Purpose:

```txt
Create managed Kubernetes cluster in AWS
```

---

### Step 2: Configure kubectl

```bash
aws eks update-kubeconfig \
  --name chatsphere-ai-cluster \
  --region ap-south-1
```

Verify:

```bash
kubectl get nodes
```

---

### Step 3: Create Namespace

```bash
kubectl apply -f k8s/namespace.yml
```

---

### Step 4: Create Secrets and ConfigMaps

```bash
kubectl apply -f k8s/mongo-secret.yaml
kubectl apply -f k8s/backend-secret.yaml
kubectl apply -f k8s/backend-configmap.yaml
```

In production, secrets should ideally come from:

```txt
AWS Secrets Manager
External Secrets Operator
Sealed Secrets
```

---

### Step 5: Deploy MongoDB and Redis

For learning:

```bash
kubectl apply -f k8s/mongo-pvc.yaml
kubectl apply -f k8s/mongo-deployment.yaml
kubectl apply -f k8s/mongo-service.yaml

kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/redis-service.yaml
```

For real production, better services:

```txt
MongoDB Atlas
Amazon DocumentDB
Amazon ElastiCache Redis
```

---

### Step 6: Deploy Backend and Frontend

```bash
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
```

---

### Step 7: Install Ingress Controller

For AWS, use either:

```txt
Nginx Ingress Controller
AWS Load Balancer Controller
```

Nginx option:

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
```

AWS Load Balancer Controller option is more production-native.

---

### Step 8: Update Ingress Host

Local:

```txt
app.chatsphere.local
```

Cloud:

```txt
app.chatsphereai.com
```

Ingress example:

```yaml
rules:
  - host: app.chatsphereai.com
    http:
      paths:
        - path: /
          pathType: Prefix
          backend:
            service:
              name: frontend-service
              port:
                number: 80
```

---

### Step 9: Configure DNS

In AWS Route 53:

```txt
app.chatsphereai.com
        ↓
AWS Load Balancer DNS
```

Example DNS record:

```txt
Type: CNAME
Name: app
Value: abc123.ap-south-1.elb.amazonaws.com
```

---

### Step 10: Add TLS/HTTPS

Install cert-manager:

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.15.0/cert-manager.yaml
```

Then create:

```txt
ClusterIssuer
TLS Secret
Ingress TLS section
```

Final access:

```txt
https://app.chatsphereai.com
```

---

## 22. CI/CD Changes for Cloud

In local setup:

```yaml
runs-on: self-hosted
```

because the cluster is on the laptop.

In cloud setup, we can use:

```yaml
runs-on: ubuntu-latest
```

because GitHub Actions can authenticate to AWS and access EKS.

Cloud workflow needs AWS credentials:

```txt
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
```

Stored in GitHub Secrets.

Pipeline flow:

```txt
GitHub Actions cloud runner
   ↓
AWS authentication
   ↓
aws eks update-kubeconfig
   ↓
kubectl set image
   ↓
EKS rollout
```

---

## 23. Cloud GitHub Actions Deployment Example

```yaml
deploy-to-eks:
  name: Deploy to AWS EKS
  runs-on: ubuntu-latest
  needs: build-and-push

  steps:
    - name: Checkout source code
      uses: actions/checkout@v4

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ap-south-1

    - name: Update kubeconfig
      run: |
        aws eks update-kubeconfig \
          --name chatsphere-ai-cluster \
          --region ap-south-1

    - name: Deploy backend image
      run: |
        kubectl set image deployment/backend-deployment \
          backend=nsmachine/production:backend-${{ needs.build-and-push.outputs.image_tag }} \
          -n production-chat

    - name: Deploy frontend image
      run: |
        kubectl set image deployment/frontend-deployment \
          frontend=nsmachine/production:frontend-${{ needs.build-and-push.outputs.image_tag }} \
          -n production-chat

    - name: Wait for rollout
      run: |
        kubectl rollout status deployment/backend-deployment -n production-chat
        kubectl rollout status deployment/frontend-deployment -n production-chat
```

---

## 24. Production Recommendations

For real cloud production, improve the setup with:

```txt
Amazon ECR instead of Docker Hub
MongoDB Atlas instead of MongoDB pod
Amazon ElastiCache instead of Redis pod
AWS Load Balancer Controller
Route 53 DNS
cert-manager for HTTPS
External Secrets Operator
Prometheus and Grafana
Loki for logs
ArgoCD for GitOps
Horizontal Pod Autoscaler
```

---

## 25. Interview Explanation

If asked:

**“How did you implement CI/CD for this project?”**

Answer:

```txt
I implemented a complete CI/CD pipeline for ChatSphere AI using GitHub Actions, Docker Hub, and Kubernetes.

On every push to the develop branch, GitHub Actions builds separate Docker images for the backend and frontend, tags them using the Git commit SHA, pushes them to Docker Hub, and then triggers a self-hosted runner running on my laptop.

The self-hosted runner has access to my local Kind Kubernetes cluster, so it runs kubectl set image commands to update backend and frontend deployments. Kubernetes then performs rolling updates, and the pipeline waits for rollout status to confirm that the deployment completed successfully.

This gives me a production-style deployment workflow with automated image build, registry publishing, Kubernetes deployment, rollout verification, and traceability from Git commit to running container image.
```

---

## 26. LinkedIn Project Wording

```txt
Implemented CI/CD for ChatSphere AI using GitHub Actions, Docker Hub, and Kubernetes.

The pipeline automatically builds backend and frontend Docker images on every push, tags them with Git commit SHA, pushes them to Docker Hub, and deploys the latest version to Kubernetes through a self-hosted GitHub runner.

This setup simulates a production-grade DevOps workflow with automated build, image publishing, deployment, rolling updates, and rollout verification.
```

---

# Final Status

CI/CD Phase completed successfully.

ChatSphere AI now has:

```txt
GitHub source control
Docker image automation
Docker Hub registry integration
GitHub Actions CI pipeline
Self-hosted runner
Kubernetes CD pipeline
Rolling deployment automation
Deployment verification
Cloud migration roadmap
```

