# Production Chat Platform Architecture

## Overview

Production Chat Platform is a real-time messaging application built using:

* React
* Node.js
* Express
* Socket.IO
* MongoDB
* Redis
* Docker
* Kubernetes
* Helm
* Terraform

---

# High Level Architecture

```text
Browser
   │
   ▼
React Frontend
   │
   ├── Axios (REST API)
   │
   └── Socket.IO Client
           │
           ▼
Node.js Backend
   │
   ├── Express API
   │
   ├── Socket.IO Server
   │
   ├── Redis
   │       │
   │       └── Online User Tracking
   │
   └── MongoDB
           │
           ├── Users
           └── Messages
```

---

# Frontend Architecture

Location:

```text
frontend/
```

Main components:

```text
src/
├── pages/
│   ├── Login/
│   └── Chat/
│
├── context/
│   └── AuthContext.jsx
│
├── services/
│   └── socket.js
```

Responsibilities:

* Authentication
* User management
* Real-time messaging
* Online status display

---

# Backend Architecture

Location:

```text
backend/
```

Structure:

```text
src/
├── config/
│   ├── database.js
│   └── redis.js
│
├── controllers/
│   ├── authController.js
│   ├── messageController.js
│   └── userController.js
│
├── models/
│   ├── User.js
│   └── Message.js
│
├── routes/
│   ├── authRoutes.js
│   ├── messageRoutes.js
│   └── userRoutes.js
│
└── socket/
    └── chatSocket.js
```

---

# Authentication Flow

```text
User Login
    │
    ▼
POST /api/auth/login
    │
    ▼
Validate Credentials
    │
    ▼
Generate JWT Token
    │
    ▼
Return User + Token
    │
    ▼
Store Token in LocalStorage
```

---

# Online User Flow

```text
User Login
    │
    ▼
Socket Connected
    │
    ▼
join Event
    │
    ▼
Redis
online:<username>
    │
    ▼
Broadcast online_users
    │
    ▼
Frontend Updates Status
```

---

# Private Chat Flow

```text
User A
    │
    ▼
send_message
    │
    ▼
Socket.IO Server
    │
    ▼
Save Message To MongoDB
    │
    ▼
Emit receive_message
    │
    ▼
User B
```

---

# Room Naming Strategy

Room names are deterministic.

Example:

```text
john_nitin
```

Generated using:

```javascript
[user1, user2]
.sort()
.join("_");
```

This guarantees both users join the same room.

---

# MongoDB Collections

## users

```json
{
  "_id": "...",
  "username": "nitin",
  "email": "nitin@test.com",
  "password": "hashed-password"
}
```

## messages

```json
{
  "_id": "...",
  "sender": "nitin",
  "receiver": "john",
  "message": "Hello",
  "room": "john_nitin",
  "createdAt": "..."
}
```

---

# Redis Usage

Purpose:

* Online user tracking
* Fast lookup

Example:

```text
online:nitin
online:john
online:meloni
```

Value:

```text
socket-id
```

---

# Future Kubernetes Architecture

```text
Internet
   │
   ▼
Ingress
   │
   ▼
Frontend Service
   │
   ▼
Frontend Pods
   │
   ▼
Backend Service
   │
   ▼
Backend Pods
   │
   ├── MongoDB
   └── Redis
```

---

# Monitoring Stack (Planned)

* Prometheus
* Grafana
* Node Exporter
* AlertManager

---

# CI/CD Pipeline (Planned)

```text
GitHub
   │
   ▼
GitHub Actions
   │
   ▼
Docker Build
   │
   ▼
Push To Registry
   │
   ▼
Helm Upgrade
   │
   ▼
Kubernetes Deployment
```

