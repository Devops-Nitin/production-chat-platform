# Development Setup Guide

This document describes how to set up the Production Chat Platform from scratch.

---

# Prerequisites

Install:

* Git
* Docker
* Docker Compose
* Node.js 22+
* npm
* VS Code

Verify:

```bash
node -v

npm -v

docker -v
```

---

# Clone Repository

```bash
git clone <repository-url>

cd production-chat-platform
```

---

# Project Structure

```text
production-chat-platform/
├── backend
├── frontend
├── docs
├── k8s
├── helm
├── terraform
└── github
```

---

# Start MongoDB

```bash
docker run -d \
--name chat-mongodb \
-p 27017:27017 \
-e MONGO_INITDB_ROOT_USERNAME=admin \
-e MONGO_INITDB_ROOT_PASSWORD=Admin@123 \
mongo
```

Verify:

```bash
docker ps
```

---

# Start Redis

```bash
docker run -d \
--name chat-redis \
-p 6379:6379 \
redis
```

Verify:

```bash
docker ps
```

---

# Backend Setup

Navigate:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create:

```text
backend/.env
```

Example:

```env
PORT=5000

MONGO_URI=mongodb://admin:Admin@123@localhost:27017/chatapp?authSource=admin

JWT_SECRET=mysecretkey

JWT_EXPIRES_IN=7d

REDIS_HOST=localhost

REDIS_PORT=6379
```

Start backend:

```bash
npm run dev
```

Expected:

```text
MongoDB Connected
Redis Connected
Server running on port 5000
```

---

# Frontend Setup

Navigate:

```bash
cd frontend
```

Install:

```bash
npm install
```

Start:

```bash
npm run dev
```

Expected:

```text
http://localhost:5173
```

---

# Create First User

Register using frontend.

Or API:

```bash
curl -X POST http://localhost:5000/api/auth/register \
-H "Content-Type: application/json" \
-d '{
"username":"john",
"email":"john@test.com",
"password":"Password123"
}'
```

---

# Verify User Exists

Login to Mongo:

```bash
docker exec -it chat-mongodb bash

mongosh -u admin -p 'Admin@123' --authenticationDatabase admin
```

Select database:

```javascript
use chatapp
```

Verify:

```javascript
db.users.find().pretty()
```

---

# Verify Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
-H "Content-Type: application/json" \
-d '{
"email":"john@test.com",
"password":"Password123"
}'
```

Expected:

```json
{
  "message": "Login successful",
  "token": "..."
}
```

---

# Verify Redis

Open:

```bash
docker exec -it chat-redis redis-cli
```

Check online users:

```bash
KEYS online:*
```

Expected:

```text
online:john
online:nitin
```

---

# Verify Socket.IO

Open two browser windows.

Login with different users.

Expected:

* Both users visible online.
* User list updates automatically.
* Messages delivered instantly.

---

# Verify APIs

Health:

```bash
curl http://localhost:5000/health
```

Users:

```bash
curl http://localhost:5000/api/users
```

Messages:

```bash
curl http://localhost:5000/api/messages
```

---

# Clean Startup Sequence

Start services in this order:

1. MongoDB
2. Redis
3. Backend
4. Frontend

Verify:

```bash
docker ps
```

```bash
curl http://localhost:5000/health
```

Open:

```text
http://localhost:5173
```

System should be fully operational.

