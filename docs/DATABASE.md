# Database Guide

This document describes the MongoDB database design used by the Production Chat Platform.

---

# Overview

Database Engine:

* MongoDB

Database Name:

```text
chatapp
```

Primary Collections:

```text
users
messages
```

---

# Database Architecture

```text
MongoDB
│
├── users
│
└── messages
```

---

# Connection Information

Environment Variable:

```env
MONGO_URI=mongodb://admin:Admin@123@localhost:27017/chatapp?authSource=admin
```

Application Connection:

```javascript
await mongoose.connect(
  process.env.MONGO_URI
);
```

---

# Login to MongoDB

Container:

```bash
docker exec -it chat-mongodb bash
```

Connect:

```bash
mongosh \
-u admin \
-p 'Admin@123' \
--authenticationDatabase admin
```

Select Database:

```javascript
use chatapp
```

---

# Users Collection

Collection:

```text
users
```

Purpose:

Stores registered users.

---

# User Schema

Example:

```json
{
  "_id": "6a21d3e833e22e6b51ef0a52",
  "username": "nitin",
  "email": "nitin@test.com",
  "password": "$2a$10$hashvalue",
  "createdAt": "2026-06-07T12:00:00Z",
  "updatedAt": "2026-06-07T12:00:00Z"
}
```

---

# User Model

Expected Schema:

```javascript
{
  username: String,
  email: String,
  password: String
}
```

---

# Find All Users

```javascript
db.users.find().pretty()
```

---

# Count Users

```javascript
db.users.countDocuments()
```

---

# Find User By Email

```javascript
db.users.findOne({
  email: "john@test.com"
})
```

---

# Find User By Username

```javascript
db.users.findOne({
  username: "john"
})
```

---

# Update Username

```javascript
db.users.updateOne(
  {
    email: "john@test.com"
  },
  {
    $set: {
      username: "john"
    }
  }
)
```

---

# Delete User

```javascript
db.users.deleteOne({
  email: "john@test.com"
})
```

---

# Messages Collection

Collection:

```text
messages
```

Purpose:

Stores all private chat messages.

---

# Message Schema

Example:

```json
{
  "_id": "687612abcc3f5f1234567890",
  "sender": "nitin",
  "receiver": "john",
  "message": "Hello",
  "room": "john_nitin",
  "createdAt": "2026-06-07T14:00:00Z"
}
```

---

# Message Model

Expected Schema:

```javascript
{
  sender: String,
  receiver: String,
  message: String,
  room: String
}
```

---

# Find All Messages

```javascript
db.messages.find().pretty()
```

---

# Count Messages

```javascript
db.messages.countDocuments()
```

---

# Find Messages By Room

```javascript
db.messages.find({
  room: "john_nitin"
}).pretty()
```

---

# Find Messages From User

```javascript
db.messages.find({
  sender: "john"
}).pretty()
```

---

# Find Messages To User

```javascript
db.messages.find({
  receiver: "nitin"
}).pretty()
```

---

# Delete Conversation

```javascript
db.messages.deleteMany({
  room: "john_nitin"
})
```

---

# Authentication Verification

Check user exists:

```javascript
db.users.find(
  {},
  {
    username: 1,
    email: 1
  }
)
```

Example:

```json
[
  {
    "username": "nitin",
    "email": "nitin@test.com"
  },
  {
    "username": "john",
    "email": "john@test.com"
  }
]
```

---

# Password Verification

Passwords should never appear in plain text.

Expected:

```text
$2a$10$...
```

If you see:

```text
Password123
```

the password was stored incorrectly.

---

# Common Troubleshooting

## No Users Found

Check:

```javascript
show collections
```

Verify:

```text
users
```

exists.

---

## User Cannot Login

Verify:

```javascript
db.users.findOne({
  email: "john@test.com"
})
```

Check:

* email
* password hash

exist.

---

## Messages Not Saving

Verify:

```javascript
db.messages.countDocuments()
```

should increase after sending messages.

---

## Wrong Database

Check:

```javascript
db.getName()
```

Expected:

```text
chatapp
```

---

# Recommended Indexes

Create Username Index:

```javascript
db.users.createIndex({
  username: 1
})
```

Create Email Index:

```javascript
db.users.createIndex({
  email: 1
})
```

Create Unique Email Index:

```javascript
db.users.createIndex(
  {
    email: 1
  },
  {
    unique: true
  }
)
```

Create Message Room Index:

```javascript
db.messages.createIndex({
  room: 1
})
```

---

# Backup Database

Inside host machine:

```bash
mongodump \
--host localhost \
--port 27017 \
-u admin \
-p 'Admin@123' \
--authenticationDatabase admin \
--db chatapp \
--out backup/
```

Expected:

```text
backup/chatapp/
```

---

# Restore Database

```bash
mongorestore \
--host localhost \
--port 27017 \
-u admin \
-p 'Admin@123' \
--authenticationDatabase admin \
--db chatapp \
backup/chatapp
```

---

# Health Checks

Verify MongoDB:

```bash
docker ps
```

Verify Database:

```javascript
show dbs
```

Verify Collections:

```javascript
show collections
```

Verify Users:

```javascript
db.users.countDocuments()
```

Verify Messages:

```javascript
db.messages.countDocuments()
```

---

# Production Recommendations

Future improvements:

* MongoDB Replica Set
* Automated Backups
* TTL Indexes
* Message Archiving
* Audit Logging
* Database Monitoring
* Slow Query Analysis
* Atlas Migration

---

# Validation Checklist

Before deployment:

* MongoDB running
* Authentication working
* Users collection exists
* Messages collection exists
* Indexes created
* Backup tested
* Restore tested
* Login verified
* Message persistence verified

Database is considered healthy only when all checks pass.

