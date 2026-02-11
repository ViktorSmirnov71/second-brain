import { Mic, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NoConversationStateProps {
  onNewChat: () => void;
  onStartVoice?: () => void;
}

export function NoConversationState({ onNewChat, onStartVoice }: NoConversationStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center space-y-6">
        <div className="glass-panel w-20 h-20 rounded-full flex items-center justify-center animate-float">
          <Mic className="h-8 w-8 text-white/50" strokeWidth={1.5} />
        </div>
        <div className="text-center space-y-1">
          <p className="text-white/90 font-medium">No conversation selected</p>
          <p className="text-white/40 text-sm">
            Start a new chat or voice conversation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={onNewChat}>
            <Plus className="mr-2 h-4 w-4" />
            Start New Chat
          </Button>
          {onStartVoice && (
            <Button variant="outline" onClick={onStartVoice}>
              <Mic className="mr-2 h-4 w-4" />
              Start Voice
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
