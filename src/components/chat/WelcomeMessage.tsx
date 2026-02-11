import { Bot } from "lucide-react";

export function WelcomeMessage() {
  return (
    <div className="flex gap-3 max-w-[80%] animate-fade-in">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
        <Bot className="h-4 w-4 text-primary" />
      </div>
      <div className="glass-panel rounded-2xl rounded-bl-md px-4 py-3 space-y-2">
        <p className="text-white/90 text-sm font-medium">
          Welcome to Second Brain
        </p>
        <p className="text-white/70 text-sm leading-relaxed">
          I'm your AI assistant. I can help you manage your notes, tasks,
          contacts, meetings, and more. Just tell me what you need — you can type
          or use voice.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {[
            "Create a new note",
            "Add a contact",
            "What's on my schedule?",
            "Start a roadmap",
          ].map((suggestion) => (
            <span
              key={suggestion}
              className="text-xs text-white/40 glass-surface px-2.5 py-1 rounded-full"
            >
              {suggestion}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
