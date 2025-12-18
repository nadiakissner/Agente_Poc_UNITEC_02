import { cn } from "@/Lib/utils";

interface ChatBubbleProps {
  message: string;
  sender: 'agent' | 'user';
  className?: string;
}

export function ChatBubble({ message, sender, className }: ChatBubbleProps) {
  const isAgent = sender === 'agent';
  
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
        <p className="text-sm leading-relaxed whitespace-pre-line">{message}</p>
      </div>
    </div>
  );
}
