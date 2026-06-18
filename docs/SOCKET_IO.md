# Socket.IO Integration Guide

This document explains the real-time communication architecture used in the Production Chat Platform.

---

# Overview

Socket.IO is used for:

* User online/offline presence
* Private chat rooms
* Real-time message delivery
* Live user status updates

---

# Architecture

```text
Frontend User A
       |
       |
   Socket.IO
       |
       |
Backend Socket Server
       |
       |
Redis Presence Store
       |
       |
Frontend User B
```

---

# Connection Flow

## User Login

After successful login:

```javascript
socket.connect();

socket.emit(
  "join",
  user.username
);
```

Backend receives:

```javascript
socket.on(
  "join",
  async (userId) => {
  }
);
```

---

# Redis Presence Tracking

When user joins:

```javascript
await redisClient.set(
  `online:${userId}`,
  socket.id
);
```

Example:

```text
online:nitin
online:john
online:meloni
```

Verify:

```bash
docker exec -it chat-redis redis-cli

KEYS online:*
```

---

# Online Users Event

Backend publishes:

```javascript
io.emit(
  "online_users",
  onlineUsers
);
```

Frontend receives:

```javascript
socket.on(
  "online_users",
  (users) => {
    setOnlineUsers(users);
  }
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

# Private Chat Rooms

Users communicate inside private rooms.

Room names are generated using:

```javascript
[user1, user2]
.sort()
.join("_")
```

Example:

```text
nitin_john
john_nitin
```

Both become:

```text
john_nitin
```

This guarantees both users join the same room.

---

# Join Room Event

Frontend:

```javascript
socket.emit(
  "join_room",
  {
    user1: user.username,
    user2: selectedUser
  }
);
```

Backend:

```javascript
socket.on(
  "join_room",
  ({ user1, user2 }) => {

    const roomName =
      getRoomName(
        user1,
        user2
      );

    socket.join(
      roomName
    );
  }
);
```

---

# Send Message Event

Frontend:

```javascript
socket.emit(
  "send_message",
  {
    sender: user.username,
    receiver: selectedUser,
    message: "Hello"
  }
);
```

Backend:

```javascript
socket.on(
  "send_message",
  async (messageData) => {
  }
);
```

---

# Message Persistence

Messages are stored in MongoDB:

```javascript
await Message.create({
  sender,
  receiver,
  message,
  room
});
```

Collection:

```text
messages
```

Example:

```json
{
  "sender": "nitin",
  "receiver": "john",
  "message": "Hello",
  "room": "john_nitin"
}
```

---

# Receive Message Event

Backend:

```javascript
io.to(roomName).emit(
  "receive_message",
  savedMessage
);
```

Frontend:

```javascript
socket.on(
  "receive_message",
  (message) => {

    setMessages(
      prev => [
        ...prev,
        message
      ]
    );

  }
);
```

---

# Disconnect Event

Backend:

```javascript
socket.on(
  "disconnect",
  async () => {
  }
);
```

Steps:

1. Find Redis key.
2. Delete online user.
3. Refresh online user list.
4. Broadcast updates.

Example:

```javascript
await redisClient.del(
  "online:nitin"
);
```

---

# Socket Events Summary

| Event           | Direction          | Purpose                |
| --------------- | ------------------ | ---------------------- |
| join            | Frontend → Backend | Register online user   |
| online_users    | Backend → Frontend | Broadcast online users |
| join_room       | Frontend → Backend | Join private room      |
| send_message    | Frontend → Backend | Send message           |
| receive_message | Backend → Frontend | Receive message        |
| disconnect      | Socket Event       | Remove online user     |

---

# Troubleshooting

## User Not Online

Check:

```bash
docker exec -it chat-redis redis-cli

KEYS online:*
```

Expected:

```text
online:nitin
```

---

## Message Not Delivered

Verify:

```javascript
join_room
```

called before:

```javascript
send_message
```

---

## Room Mismatch

Verify room generation:

```javascript
[user1, user2]
.sort()
.join("_")
```

Both users must produce identical room names.

---

## Socket Not Connecting

Browser Console:

```javascript
socket.connected
```

Expected:

```text
true
```

---

# Production Improvements

Future enhancements:

* Read receipts
* Typing indicators
* Message delivery status
* Message reactions
* Group chats
* Redis Pub/Sub
* Multi-server Socket.IO scaling
* WebRTC video calls

---

# Validation Checklist

Before release:

* User appears online
* User disappears after logout
* User disappears after browser close
* Messages save to MongoDB
* Messages arrive instantly
* Rooms generated correctly
* Redis presence working
* Socket reconnect working

System is considered healthy only when all checks pass.

