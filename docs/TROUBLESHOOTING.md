# Troubleshooting Guide

This document contains common issues encountered during development of the Production Chat Platform and their solutions.

---

# 1. React Blank Page

## Symptom

Application opens but displays a blank white screen.

## Cause

JavaScript compilation failure.

Common causes:

* Missing export default
* Syntax errors
* Invalid JSX
* Accidentally pasted markdown code blocks

## Resolution

Check browser console:

```bash
F12
Console
```

Check Vite logs:

```bash
npm run dev
```

Fix any syntax errors.

---

# 2. Login.jsx Does Not Export Default

## Symptom

```text
The requested module '/src/pages/Login/Login.jsx'
does not provide an export named 'default'
```

## Cause

Component export removed accidentally.

## Resolution

Verify:

```javascript
export default Login;
```

or

```javascript
export default function Login() {
}
```

---

# 3. Vite Parse Error

## Symptom

```text
Expected ':' but found '{'
```

or

```text
Expected ',' or ')'
```

## Cause

Markdown syntax accidentally pasted into source code.

## Resolution

Search for markdown markers:

````bash
grep -R "```" frontend/src
grep -R "```" backend/src
````

Remove all occurrences.

---

# 4. Accidental Markdown Markers Inside Source Code

## Symptom

```text
TypeError: "" is not a function
```

or

```text
Expected ':' but found '{'
```

or

```text
Expected ',' or ')'
```

## Cause

Markdown code fences were pasted directly into .js or .jsx files.

Example:

```text
```

setFormData(...)

```
```

## Resolution

Search:

````bash
grep -R "```" frontend/src
grep -R "```" backend/src
````

Remove all markdown fences.

## Prevention

Never paste markdown fences into source files.

---

# 5. Redis Connection Refused

## Symptom

```text
ECONNREFUSED 127.0.0.1:6379
```

## Cause

Redis container stopped.

## Resolution

Verify:

```bash
docker ps
```

Start Redis:

```bash
docker start chat-redis
```

Verify:

```bash
docker exec -it chat-redis redis-cli

PING
```

Expected:

```text
PONG
```

---

# 6. Online Users Not Showing

## Symptom

Users login successfully but do not appear online.

## Cause

Socket join event not firing.

Redis not storing username.

Frontend not listening to online_users event.

## Resolution

Verify:

```bash
docker exec -it chat-redis redis-cli

KEYS online:*
```

Expected:

```text
online:nitin
online:john
```

Verify frontend:

```javascript
socket.emit("join", user.username);
```

---

# 7. MongoDB Authentication Failed

## Symptom

```text
MongoServerError: Authentication failed
```

## Resolution

Check credentials:

```bash
docker exec -it chat-mongodb bash

env | grep MONGO
```

Login:

```bash
mongosh \
-u admin \
-p 'Admin@123' \
--authenticationDatabase admin
```

---

# 8. Unauthorized Mongo Queries

## Symptom

```text
Command find requires authentication
```

## Resolution

Authenticate first:

```bash
mongosh \
-u admin \
-p 'Admin@123' \
--authenticationDatabase admin
```

---

# 9. Invalid Login Credentials

## Symptom

Frontend displays:

```text
Invalid Credentials
```

## Cause

User missing from database.

Wrong password.

Wrong Mongo database.

## Resolution

Check:

```javascript
db.users.find().pretty()
```

Verify:

* username
* email
* password

exist.

---

# 10. Express Startup Failure

## Symptom

```text
Cannot access 'app' before initialization
```

## Cause

Routes registered before Express app created.

## Resolution

Always:

```javascript
const app = express();
```

before:

```javascript
app.use(...)
```

---

# 11. Socket.IO Room Issues

## Symptom

Messages not delivered.

## Cause

Users joined different rooms.

## Resolution

Use deterministic room names:

```javascript
[user1, user2]
.sort()
.join("_")
```

Example:

```text
john_nitin
```

Both users must join same room.

---

# Daily Startup Checklist

## Backend

```bash
cd backend

npm install

npm run dev
```

Expected:

```text
MongoDB Connected
Redis Connected
Server running on port 5000
```

## Frontend

```bash
cd frontend

npm install

npm run dev
```

Expected:

```text
VITE ready
http://localhost:5173
```

## Redis

```bash
docker ps
```

Verify:

```text
chat-redis
```

running.

## MongoDB

```bash
docker ps
```

Verify:

```text
chat-mongodb
```

running.

---

# Emergency Diagnostics

## Backend Health

```bash
curl http://localhost:5000/health
```

## Users API

```bash
curl http://localhost:5000/api/users
```

## Redis Online Users

```bash
docker exec -it chat-redis redis-cli

KEYS online:*
```

## Mongo User Count

```bash
docker exec -it chat-mongodb bash

mongosh -u admin -p 'Admin@123' --authenticationDatabase admin

use chatapp

db.users.countDocuments()
```

## Running Containers

```bash
docker ps
```

## Backend Logs

```bash
cd backend

npm run dev
```

Watch for:

```text
MongoDB Connected
Redis Connected
Server running
```

