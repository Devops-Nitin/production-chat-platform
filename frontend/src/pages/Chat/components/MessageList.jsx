import MessageBubble from "./MessageBubble";

function MessageList({
  messages = [],
  currentUser,
  loading = false,
  messagesEndRef,
  onEditMessage,
  onDeleteMessage,
  onReactMessage,
}) {
  if (loading) {
    return (
      <div className="message-list">
        <p>Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.length === 0 ? (
        <p className="no-messages">No messages yet</p>
      ) : (
        messages.map((message) => (
          <MessageBubble
            key={message._id}
            message={message}
            currentUser={currentUser}
            onEditMessage={onEditMessage}
            onDeleteMessage={onDeleteMessage}
            onReactMessage={onReactMessage}
          />
        ))
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

export default MessageList;
