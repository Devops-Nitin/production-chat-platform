function TypingIndicator({
typingUser,
}) {
if (!typingUser) {
return null;
}

return ( <div className="px-4 py-2 text-sm text-green-600">
{typingUser} is typing... </div>
);
}

export default TypingIndicator;

