import { cn } from "@/Lib/utils";

interface ChatBubbleProps {
  message: string;
  sender: 'agent' | 'user';
  className?: string;
}

export function ChatBubble({ message, sender, className }: ChatBubbleProps) {
  const isAgent = sender === 'agent';
  
  // Convertir patrones de markdown link [texto](url) a HTML
  const renderMessageWithLinks = (text: string) => {
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    const hasLinks = linkPattern.test(text);
    
    if (!hasLinks && !text.includes('<')) {
      return <p className="text-sm leading-relaxed whitespace-pre-line">{text}</p>;
    }
    
    // Procesar links markdown
    const parts = text.split(/(\[([^\]]+)\]\(([^)]+)\))/g);
    
    return (
      <div className="text-sm leading-relaxed whitespace-pre-line">
        {parts.map((part, idx) => {
          if (idx % 4 === 0) {
            // Texto normal
            return part ? <span key={idx}>{part}</span> : null;
          } else if (idx % 4 === 2) {
            // Texto del link
            const url = parts[idx + 1];
            return (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer transition-colors"
              >
                {part}
              </a>
            );
          }
          return null;
        })}
      </div>
    );
  };
  
  return (
    <div className={cn(
      "flex w-full mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
      isAgent ? "justify-start" : "justify-end",
      className
    )}>
      <div className={cn(
        "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm",
        isAgent 
          ? "bg-chat-bubble-agent text-foreground rounded-bl-none" 
          : "bg-chat-bubble-user text-foreground rounded-br-none"
      )}>
        {message.includes('<') ? (
          <div 
            className="text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: message }}
          />
        ) : (
          renderMessageWithLinks(message)
        )}
      </div>
    </div>
  );
}
