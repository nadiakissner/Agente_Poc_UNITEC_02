export function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4 animate-in fade-in duration-300">
      <div className="max-w-[85%] rounded-2xl rounded-bl-none px-4 py-3 bg-chat-bubble-agent">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-dot-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-dot-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-dot-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
