# API Guide

Base URL

```text
http://localhost:5000
```

---

# Health Check

## Request

```http
GET /health
```

## Response

```json
{
  "status": "UP",
  "service": "chat-backend"
}
```

---

# Register User

## Request

```http
POST /api/auth/register
```

## Body

```json
{
  "username": "nitin",
  "email": "nitin@test.com",
  "password": "Password123"
}
```

## Success Response

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "123",
    "username": "nitin",
    "email": "nitin@test.com"
  }
}
```

---

# Login User

## Request

```http
POST /api/auth/login
```

## Body

```json
{
  "email": "nitin@test.com",
  "password": "Password123"
}
```

## Success Response

```json
{
  "message": "Login successful",
  "token": "jwt-token",
  "user": {
    "id": "123",
    "username": "nitin",
    "email": "nitin@test.com"
  }
}
```

---

# Get Users

## Request

```http
GET /api/users
```

## Success Response

```json
[
  {
    "id": "1",
    "username": "nitin",
    "email": "nitin@test.com",
    "status": "online"
  },
  {
    "id": "2",
    "username": "john",
    "email": "john@test.com",
    "status": "offline"
  }
]
```

---

# Get Messages

## Request

```http
GET /api/messages
```

## Get Messages Between Two Users

```http
GET /api/messages?user1=nitin&user2=john
```

## Success Response

```json
[
  {
    "_id": "123",
    "sender": "nitin",
    "receiver": "john",
    "message": "Hello",
    "room": "john_nitin"
  }
]
```

---

# Socket.IO Events

## Client → Server

### Join

```javascript
socket.emit(
  "join",
  username
);
```

### Join Room

```javascript
socket.emit(
  "join_room",
  {
    user1,
    user2
  }
);
```

### Send Message

```javascript
socket.emit(
  "send_message",
  {
    sender,
    receiver,
    message
  }
);
```

---

## Server → Client

### Online Users

```javascript
socket.on(
  "online_users",
  (users) => {}
);
```

Example:

```json
[
  "nitin",
  "john",
  "meloni"
]
```

---

### Receive Message

```javascript
socket.on(
  "receive_message",
  (message) => {}
);
```

Example:

```json
{
  "_id": "123",
  "sender": "nitin",
  "receiver": "john",
  "message": "Hello"
}
```

---

# Error Codes

## 400

```json
{
  "message": "All fields are required"
}
```

---

## 401

```json
{
  "message": "Invalid credentials"
}
```

---

## 409

```json
{
  "message": "User already exists"
}
```

---

## 500

```json
{
  "message": "Internal Server Error"
}
```

