import { useRef, useState } from "react";
import Picker from "emoji-picker-react";

function MessageInput({ onSendMessage, onTyping, onStopTyping }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleTyping = (value) => {
    setText(value);

    if (onTyping) {
      onTyping();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (onStopTyping) {
        onStopTyping();
      }
    }, 1000);
  };

  const handleEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (!selectedFile) return;

    setFile(selectedFile);
  };

  const handleSend = async (event) => {
    event.preventDefault();

    if (!text.trim() && !file) return;

    await onSendMessage({
      text: text.trim(),
      file,
    });

    setText("");
    setFile(null);
    setShowEmojiPicker(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (onStopTyping) {
      onStopTyping();
    }
  };

  return (
    <form className="message-input-form" onSubmit={handleSend}>
      {showEmojiPicker && (
        <div className="emoji-picker-wrapper">
          <Picker onEmojiClick={handleEmojiClick} />
        </div>
      )}

      {file && (
        <div className="selected-file-preview">
          <span>📎 {file.name}</span>

          <button
            type="button"
            onClick={() => {
              setFile(null);

              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
          >
            ✕
          </button>
        </div>
      )}

      <button
        type="button"
        className="emoji-button"
        onClick={() => setShowEmojiPicker((prev) => !prev)}
      >
        😊
      </button>

      <input
        type="text"
        value={text}
        placeholder="Type a message..."
        onChange={(event) => handleTyping(event.target.value)}
        className="message-input"
      />

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="file-input"
        hidden
      />

      <button
        type="button"
        className="file-button"
        onClick={() => fileInputRef.current?.click()}
      >
        📎
      </button>

      <button type="submit" className="send-button">
        Send
      </button>
    </form>
  );
}

export default MessageInput;
