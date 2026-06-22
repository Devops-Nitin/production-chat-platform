# ChatSphere AI — Public Server Kubernetes Deployment Document

## 1. Project Objective

Deploy the ChatSphere AI full-stack real-time chat application on a public Ubuntu server so users can access it from anywhere using:

```bash
http://49.249.22.163
```

The application includes:

* React frontend
* Node.js backend
* MongoDB database
* Redis cache
* Socket.IO real-time messaging
* Kubernetes deployment
* NGINX Ingress public routing
* Docker Hub images

---

## 2. Final Working Status

Current status:

```txt
Ubuntu Server: Working
Docker: Working
K3s Kubernetes: Working
NGINX Ingress: Working
MongoDB: Working
Redis: Working
Backend: Working
Frontend: Working
Registration: Working
Login: Working
Chat Screen: Working
Public URL: http://49.249.22.163
```

---

## 3. Server Details

```txt
Server Type: Physical Ubuntu server
Location: On-premises
Public IP: 49.249.22.163
Username: tvu
OS: Ubuntu 26.04 LTS
CPU: 8 cores
Disk: 99 GB root filesystem
Kubernetes: K3s
Ingress: NGINX Ingress
```

---

## 4. Why We Moved From Local Setup to Public Server

Earlier setup was local:

```txt
Windows Laptop
↓
WSL
↓
Docker Desktop
↓
Kind Kubernetes
↓
ChatSphere AI
```

That was good for learning, but had limitations:

* Only worked locally or inside home network
* DNS depended on Pi-hole/local configuration
* Laptop needed to stay powered on
* Not accessible publicly
* Not production-like enough

New public setup:

```txt
Internet
↓
49.249.22.163
↓
Ubuntu Server
↓
K3s Kubernetes
↓
NGINX Ingress
↓
ChatSphere AI
```

This is closer to real production.

---

## 5. Target Architecture

```txt
User Browser
    ↓
http://49.249.22.163
    ↓
NGINX Ingress Controller
    ↓
Frontend Service
    ↓
React Frontend
    ↓
/api requests
    ↓
Backend Service
    ↓
Node.js Backend
    ↓
MongoDB + Redis
```

Application flow:

```txt
Frontend
  ↓
/api/auth/register
/api/auth/login
/api/users
/api/messages
  ↓
Backend
  ↓
MongoDB
Redis
Socket.IO
```

---

## 6. Initial Server Verification

### Check CPU

Command:

```bash
nproc
```

Output:

```txt
8
```

Meaning:

```txt
The server has 8 CPU cores.
This is enough for K3s, MongoDB, Redis, backend and frontend.
```

---

### Check disk

Command:

```bash
df -h
```

Important output:

```txt
/dev/sda5  99G  39G  55G  42% /
```

Meaning:

```txt
The server has enough storage for Docker images, Kubernetes data, MongoDB PVC and logs.
```

---

### Check OS

Command:

```bash
cat /etc/os-release
```

Output:

```txt
Ubuntu 26.04 LTS
```

Meaning:

```txt
The server is Ubuntu-based and suitable for Docker/Kubernetes installation.
```

---

## 7. DNS Issue on Ubuntu Server

Initially, `apt update` failed with:

```txt
Temporary failure resolving 'archive.ubuntu.com'
Temporary failure resolving 'security.ubuntu.com'
```

This means the server could not resolve DNS names.

### DNS file checked

Command:

```bash
cat /etc/resolv.conf
```

Configured DNS:

```txt
nameserver 8.8.8.8
nameserver 1.1.1.1
```

### DNS test

Command:

```bash
ping -c 3 archive.ubuntu.com
```

Output confirmed DNS started working.

Why this was required:

```txt
Without DNS, Ubuntu cannot install packages.
Kubernetes cannot pull images.
Docker cannot reach Docker Hub.
```

---

## 8. Docker Verification

Command:

```bash
docker ps
```

Output:

```txt
CONTAINER ID   IMAGE   COMMAND   CREATED   STATUS   PORTS   NAMES
```

Meaning:

```txt
Docker is installed and running.
No containers were running initially.
```

Command:

```bash
docker ps -a
```

Output:

```txt
No containers found.
```

Meaning:

```txt
Server was clean and safe for deployment.
```

---

## 9. Port Availability Check

Command:

```bash
ss -tulpn | grep -E ':80|:443|:6443'
```

No output was returned.

Meaning:

```txt
Port 80  was free for HTTP
Port 443 was free for HTTPS
Port 6443 was free for Kubernetes API
```

Why this matters:

```txt
If Nginx/Apache already used port 80 or 443, Ingress would fail.
If 6443 was already used, K3s API server could conflict.
```

---

## 10. K3s Installation

K3s was selected instead of Kind.

Why K3s:

```txt
Kind is best for local development.
K3s is better for public Linux servers.
K3s is lightweight and production-capable for single-node deployments.
```

Install command:

```bash
curl -sfL https://get.k3s.io | sh -
```

Verify node:

```bash
kubectl get nodes
```

Output:

```txt
NAME                        STATUS   ROLES           AGE   VERSION
tvu-to-be-filled-by-o-e-m   Ready    control-plane   25s   v1.35.5+k3s1
```

Meaning:

```txt
K3s installed successfully.
Kubernetes node is Ready.
Control plane is working.
```

---

## 11. K3s System Pod Verification

Command:

```bash
kubectl get pods -A
```

Initial important pods:

```txt
coredns
metrics-server
local-path-provisioner
traefik
```

Issue found:

```txt
traefik ImagePullBackOff
svclb-traefik ImagePullBackOff
```

Error:

```txt
lookup registry-1.docker.io: Try again
```

Meaning:

```txt
K3s/containerd could not resolve Docker Hub.
```

---

## 12. Fixing K3s DNS/Image Pull Problem

The issue was caused by DNS resolution inside K3s/containerd.

We configured system DNS using:

```bash
mkdir -p /etc/systemd/resolved.conf.d

cat > /etc/systemd/resolved.conf.d/dns.conf <<EOF
[Resolve]
DNS=8.8.8.8 1.1.1.1
FallbackDNS=8.8.4.4 1.0.0.1
DNSStubListener=yes
EOF

systemctl restart systemd-resolved
systemctl restart k3s
```

Why:

```txt
K3s/containerd must resolve registry-1.docker.io to pull container images.
```

After restart, Traefik and system images started running.

---

## 13. GitHub Repository Issue

On the public server, the cloned repository initially contained only:

```txt
README.md
```

No:

```txt
backend/
frontend/
k8s/
docs/
```

Reason:

```txt
Full project files were not pushed to GitHub yet.
```

Fix on local WSL machine:

```bash
cd ~/projects/production-chat-platform

git add backend frontend k8s docs docker-compose.yml package.json package-lock.json .gitignore .github

git commit -m "Add complete ChatSphere AI application and Kubernetes manifests"

git push origin develop
```

Then on public server:

```bash
cd /opt/chatsphere/production-chat-platform

git fetch origin

git checkout develop

git pull origin develop
```

Verify:

```bash
ls
ls k8s
```

Expected:

```txt
backend
frontend
k8s
docs
```

---

## 14. Kubernetes Manifests Present

Local project had:

```txt
k8s/
├── namespace.yml
├── backend-configmap.yaml
├── backend-deployment.yaml
├── backend-secret.yaml
├── backend-service.yaml
├── frontend-deployment.yaml
├── frontend-service.yaml
├── ingress.yaml
├── mongo-deployment.yaml
├── mongo-pvc.yaml
├── mongo-secret.yaml
├── mongo-service.yaml
├── redis-deployment.yaml
├── redis-service.yaml
```

Purpose:

```txt
namespace.yml              Creates production-chat namespace
mongo-secret.yaml          Stores Mongo username/password
mongo-pvc.yaml             Persistent storage for MongoDB
mongo-deployment.yaml      Runs MongoDB pod
mongo-service.yaml         Internal MongoDB service
redis-deployment.yaml      Runs Redis pod
redis-service.yaml         Internal Redis service
backend-secret.yaml        Backend sensitive environment values
backend-configmap.yaml     Backend non-secret configuration
backend-deployment.yaml    Runs Node.js backend
backend-service.yaml       Exposes backend inside cluster
frontend-deployment.yaml   Runs React frontend
frontend-service.yaml      Exposes frontend
ingress.yaml               Public routing through ingress
```

---

## 15. Docker Images Used

Images identified:

```txt
Backend:  nsmachine/production:backend-v1
Frontend: nsmachine/production:frontend-v10, v11, v12, v13
MongoDB:  mongo:8 initially, later mongo:7
Redis:    redis:7-alpine
```

Why image tags matter:

```txt
Kubernetes pulls exact image tags from Docker Hub.
If image is private or tag does not exist, pod goes into ImagePullBackOff.
```

---

## 16. Kubernetes Deployment Order

We deployed resources in this order:

```bash
kubectl apply -f k8s/namespace.yml

kubectl apply -f k8s/mongo-secret.yaml
kubectl apply -f k8s/mongo-pvc.yaml
kubectl apply -f k8s/mongo-deployment.yaml
kubectl apply -f k8s/mongo-service.yaml

kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/redis-service.yaml

kubectl apply -f k8s/backend-secret.yaml
kubectl apply -f k8s/backend-configmap.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml

kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
```

Why this order:

```txt
Namespace must exist first.
Database and Redis should start before backend.
Backend should start before frontend testing.
Frontend is deployed last.
```

---

## 17. ImagePullBackOff Issue for Backend and Frontend

Pods initially showed:

```txt
backend ImagePullBackOff
frontend ErrImagePull
```

Backend event:

```txt
pull access denied
repository does not exist or may require authorization
Unable to retrieve image pull secret dockerhub-secret
```

Reason:

```txt
Docker Hub image needed authentication or Kubernetes secret was missing.
```

Fix:

```bash
kubectl create secret docker-registry dockerhub-secret \
  --docker-server=https://index.docker.io/v1/ \
  --docker-username=nsmachine \
  --docker-password='YOUR_DOCKERHUB_TOKEN' \
  --docker-email='nsmachine27@gmail.com' \
  -n production-chat
```

Then restarted deployments:

```bash
kubectl rollout restart deployment/backend-deployment -n production-chat
kubectl rollout restart deployment/frontend-deployment -n production-chat
```

Result:

```txt
Backend Running
Frontend Running
```

---

## 18. MongoDB Issue

Mongo initially used:

```txt
mongo:8
```

Mongo pod showed:

```txt
CrashLoopBackOff
Exit Code: 139
```

Meaning:

```txt
Exit code 139 usually indicates segmentation fault.
```

Since this was a new test deployment and no production data existed, we switched to stable MongoDB 7.

Command:

```bash
sed -i 's|image: mongo:8|image: mongo:7|g' k8s/mongo-deployment.yaml
```

Recreated Mongo resources:

```bash
kubectl delete deployment mongo-deployment -n production-chat
kubectl delete pvc mongo-pvc -n production-chat

kubectl apply -f k8s/mongo-pvc.yaml
kubectl apply -f k8s/mongo-deployment.yaml
```

Why delete PVC:

```txt
Old MongoDB data files may have been created by mongo:8.
To avoid corrupted/incompatible test data, we recreated PVC.
```

Mongo logs confirmed:

```txt
mongod startup complete
Listening on 0.0.0.0:27017
Waiting for connections
Successfully authenticated
```

Result:

```txt
MongoDB working
Backend connecting to MongoDB
Collections created
```

---

## 19. Redis Status

Redis pod became:

```txt
1/1 Running
```

Redis service:

```txt
redis-service
Port: 6379
```

Purpose:

```txt
Used for real-time presence, socket status, cache or session-related features.
```

---

## 20. Service Verification

Command:

```bash
kubectl get svc -n production-chat
```

Output included:

```txt
backend-service    ClusterIP   port 5000
frontend-service   NodePort    port 80:30080
mongo-service      ClusterIP   port 27017
redis-service      ClusterIP   port 6379
```

Meaning:

```txt
Backend, frontend, MongoDB and Redis services exist inside Kubernetes.
```

---

## 21. Traefik vs NGINX Decision

K3s includes Traefik by default.

But we selected NGINX Ingress because:

```txt
NGINX Ingress is widely used in production Kubernetes.
NGINX Ingress is common in EKS/AKS/GKE environments.
NGINX has strong interview and enterprise value.
NGINX annotations are widely used.
```

Comparison:

```txt
Traefik:
- Simple
- Default in K3s
- Good for quick lab setup

NGINX:
- More common in enterprise production
- Better for portfolio
- Better AWS/EKS alignment
```

Final decision:

```txt
Use NGINX Ingress.
```

---

## 22. NGINX Ingress Installation

Installed NGINX Ingress bare-metal manifest:

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.15.1/deploy/static/provider/baremetal/deploy.yaml
```

Waited for controller:

```bash
kubectl wait --namespace ingress-nginx \
  --for=condition=Ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=180s
```

Patched service to use public IP:

```bash
kubectl patch svc ingress-nginx-controller -n ingress-nginx \
  -p '{"spec":{"type":"LoadBalancer","externalIPs":["49.249.22.163"]}}'
```

Verify:

```bash
kubectl get svc -n ingress-nginx
```

Output:

```txt
ingress-nginx-controller
TYPE: LoadBalancer
EXTERNAL-IP: 49.249.22.163
PORTS: 80,443
```

Meaning:

```txt
NGINX Ingress is publicly exposed on port 80 and 443.
```

---

## 23. Ingress Configuration

Final ingress purpose:

```txt
/       → frontend-service:80
/api    → backend-service:5000
```

This allows:

```txt
http://49.249.22.163
```

to open frontend, and:

```txt
http://49.249.22.163/api/users
```

to reach backend.

Important test:

```bash
curl http://49.249.22.163/api/users
```

Output:

```txt
[]
```

Meaning:

```txt
Backend is reachable publicly.
Database is empty initially, so users list is empty.
```

---

## 24. Frontend API URL Issue

Registration initially failed with network error.

Browser DevTools showed:

```txt
Request URL:
http://localhost:5000/api/auth/register
```

Problem:

```txt
In browser, localhost means the user's own machine, not the public server.
```

Correct URL should be:

```txt
http://49.249.22.163/api/auth/register
```

Fix:

```txt
Use relative API path instead of localhost.
```

Updated frontend files to replace:

```txt
http://localhost:5000
```

with:

```txt
/api
```

Files involved:

```txt
frontend/src/pages/Admin/AdminDashboard.jsx
frontend/src/pages/Register/Register.jsx
frontend/src/pages/Chat/components/MessageBubble.jsx
frontend/.env
```

---

## 25. Double /api Issue

After first fix, registration returned 404.

Browser showed:

```txt
http://49.249.22.163/api/api/auth/register
```

Problem:

```txt
API_URL was /api
Register.jsx also added /api/auth/register
This caused /api/api/auth/register
```

Final fix:

In `Register.jsx`, call API directly:

```js
await axios.post("/api/auth/register", {
  username,
  email,
  password,
});
```

Then rebuilt image:

```bash
docker build --no-cache -t nsmachine/production:frontend-v13 ./frontend
docker push nsmachine/production:frontend-v13
```

Updated public server deployment:

```bash
sed -i 's|nsmachine/production:frontend-v12|nsmachine/production:frontend-v13|g' k8s/frontend-deployment.yaml

kubectl apply -f k8s/frontend-deployment.yaml

kubectl rollout restart deployment/frontend-deployment -n production-chat

kubectl rollout status deployment/frontend-deployment -n production-chat
```

Verified:

```bash
kubectl describe deployment frontend-deployment -n production-chat | grep Image
```

Expected:

```txt
nsmachine/production:frontend-v13
```

Result:

```txt
Registration working.
Login working.
Chat screen opening.
```

---

## 26. Current Working Public Tests

Frontend:

```bash
curl http://49.249.22.163 | head
```

Backend users API:

```bash
curl http://49.249.22.163/api/users
```

Register API:

```bash
curl -X POST http://49.249.22.163/api/auth/register \
-H "Content-Type: application/json" \
-d '{"username":"testuser","email":"testuser@test.com","password":"123456"}'
```

Browser:

```txt
http://49.249.22.163
```

Validated:

```txt
Registration Working
Login Working
Chat Screen Opening
```

---

## 27. Current Final Kubernetes Status

Expected final pods:

```txt
backend-deployment    1/1 Running
frontend-deployment   1/1 Running
mongo-deployment      1/1 Running
redis-deployment      1/1 Running
```

Expected ingress:

```txt
chatsphere-ai-ingress
class: nginx
```

Expected public endpoint:

```txt
http://49.249.22.163
```

---

## 28. Important Troubleshooting Summary

### Problem 1: Ubuntu DNS failed

Error:

```txt
Temporary failure resolving archive.ubuntu.com
```

Fix:

```txt
Configured DNS to 8.8.8.8 and 1.1.1.1
```

---

### Problem 2: K3s image pull failed

Error:

```txt
lookup registry-1.docker.io: Try again
```

Fix:

```txt
Fixed systemd-resolved DNS and restarted K3s
```

---

### Problem 3: GitHub repo missing files

Issue:

```txt
Only README.md was present
```

Fix:

```txt
Committed and pushed backend, frontend, k8s and docs folders
```

---

### Problem 4: Docker image pull denied

Error:

```txt
pull access denied
Unable to retrieve image pull secret dockerhub-secret
```

Fix:

```txt
Created docker-registry secret in production-chat namespace
```

---

### Problem 5: MongoDB crash

Error:

```txt
CrashLoopBackOff
Exit Code 139
```

Fix:

```txt
Changed mongo:8 to mongo:7
Deleted old PVC
Recreated MongoDB deployment
```

---

### Problem 6: Wrong frontend API URL

Error:

```txt
http://localhost:5000/api/auth/register
```

Fix:

```txt
Changed frontend API usage to relative /api route
```

---

### Problem 7: Double API path

Error:

```txt
/api/api/auth/register
```

Fix:

```txt
Register.jsx now directly calls /api/auth/register
```

---

## 29. Interview Talking Points

You can explain this project like this:

```txt
I deployed a full-stack real-time chat application on a public Ubuntu server using K3s Kubernetes. The application includes React frontend, Node.js backend, MongoDB, Redis and Socket.IO. I containerized the frontend and backend, pushed images to Docker Hub, deployed them using Kubernetes manifests, configured secrets, services, persistent storage and NGINX Ingress, and exposed the application publicly through a real public IP.
```

Key skills demonstrated:

```txt
Docker
Docker Hub
Kubernetes
K3s
NGINX Ingress
MongoDB
Redis
Node.js
React
Linux server administration
DNS troubleshooting
ImagePullBackOff troubleshooting
CrashLoopBackOff troubleshooting
Kubernetes services
Kubernetes secrets
Persistent volumes
Public deployment
```

---

## 30. Commands Cheat Sheet

Check pods:

```bash
kubectl get pods -n production-chat
```

Check services:

```bash
kubectl get svc -n production-chat
```

Check ingress:

```bash
kubectl get ingress -n production-chat
```

Describe pod:

```bash
kubectl describe pod POD_NAME -n production-chat
```

Logs:

```bash
kubectl logs deployment/backend-deployment -n production-chat
kubectl logs deployment/frontend-deployment -n production-chat
kubectl logs deployment/mongo-deployment -n production-chat
kubectl logs deployment/redis-deployment -n production-chat
```

Restart deployment:

```bash
kubectl rollout restart deployment/backend-deployment -n production-chat
kubectl rollout restart deployment/frontend-deployment -n production-chat
```

Check rollout:

```bash
kubectl rollout status deployment/frontend-deployment -n production-chat
```

Check image:

```bash
kubectl describe deployment frontend-deployment -n production-chat | grep Image
```

Test frontend:

```bash
curl http://49.249.22.163 | head
```

Test backend:

```bash
curl http://49.249.22.163/api/users
```

---

## 31. Current Project Milestone

```txt
Milestone: Public Kubernetes Deployment Completed
Status: Successful
Public URL: http://49.249.22.163
Core app status: Working
Registration: Working
Login: Working
Chat screen: Working
```

---

## 32. Next Recommended Phase

Next phase should be:

```txt
Phase 8: Production Hardening
```

Tasks:

```txt
1. Add HTTPS/TLS
2. Add domain name later
3. Add persistent MongoDB backup
4. Add monitoring with Prometheus and Grafana
5. Add logging with Loki
6. Add resource requests and limits
7. Add health checks
8. Add CI/CD auto-deploy to public server
9. Add security hardening
10. Add AWS migration plan
```

Recommended immediate next step:

```txt
Add resource requests/limits and health checks before HTTPS.
```

Reason:

```txt
Before making the app more public with HTTPS/domain, workloads should have stable Kubernetes resource and health configurations.
```
