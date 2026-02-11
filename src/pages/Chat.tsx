import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ConversationList } from "@/components/chat/ConversationList";
import {
  ChatHeader,
  type VoiceConnectionState,
} from "@/components/chat/ChatHeader";
import { VoiceStatusBar } from "@/components/chat/VoiceStatusBar";
import type { VoiceStatus } from "@/components/chat/VoiceStatusBar";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { NoConversationState } from "@/components/chat/NoConversationState";
import {
  useConversations,
  useCreateConversation,
  useUpdateConversation,
  useDeleteConversation,
} from "@/hooks/use-conversations";
import { useAIChat } from "@/hooks/use-ai-chat";
import { useVoiceSession } from "@/hooks/use-voice-session";
import type { VoiceSessionState } from "@/hooks/use-voice-session";
import { toast } from "sonner";
import type { Conversation } from "@/types";

function toConnectionState(state: VoiceSessionState): VoiceConnectionState {
  if (state === "idle") return "idle";
  if (state === "connecting") return "connecting";
  return "connected";
}

function toVoiceStatus(state: VoiceSessionState): VoiceStatus {
  switch (state) {
    case "listening":
      return "listening";
    case "userSpeaking":
      return "hearing";
    case "processing":
      return "thinking";
    case "aiSpeaking":
      return "speaking";
    default:
      return "listening";
  }
}

export function Chat() {
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [localConversations, setLocalConversations] = useState<Conversation[]>(
    []
  );

  const { data: conversations, isLoading: conversationsLoading } =
    useConversations();
  const createConversation = useCreateConversation();
  const updateConversation = useUpdateConversation();
  const deleteConversation = useDeleteConversation();

  // Ref for sentence chunk handler — updated after voice session is created
  const sentenceHandlerRef = useRef<((sentence: string) => void) | null>(null);

  const { messages, isStreaming, lastAssistantMessage, sendMessage, clearMessages } =
    useAIChat(activeConversationId, {
      onSentence: (sentence) => sentenceHandlerRef.current?.(sentence),
    });

  // Wrap sendMessage to ensure conversation exists before sending (voice can call this)
  const activeConversationIdRef = useRef(activeConversationId);
  activeConversationIdRef.current = activeConversationId;

  const ensureConversationAndSend = useCallback(
    async (content: string, options?: { overrideConversationId?: string; inputMode?: "voice" | "text" }) => {
      let convId = options?.overrideConversationId || activeConversationIdRef.current;

      if (!convId) {
        try {
          const conv = await createConversation.mutateAsync(content.slice(0, 50));
          setActiveConversationId(conv.id);
          convId = conv.id;
        } catch {
          const localConv: Conversation = {
            id: `local-${Date.now()}`,
            user_id: "",
            title: content.slice(0, 50),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setLocalConversations((prev) => [localConv, ...prev]);
          setActiveConversationId(localConv.id);
          convId = localConv.id;
        }
      }

      await sendMessage(content, { ...options, overrideConversationId: convId });
    },
    [createConversation, sendMessage]
  );

  const voiceSession = useVoiceSession({
    sendMessage: ensureConversationAndSend,
    isStreaming,
    lastAssistantMessage,
  });

  // Connect the sentence handler to voice session's chunk handler
  sentenceHandlerRef.current = voiceSession.handleSentenceChunk;

  const voiceState = useMemo(
    () => toConnectionState(voiceSession.sessionState),
    [voiceSession.sessionState]
  );
  const voiceStatus = useMemo(
    () => toVoiceStatus(voiceSession.sessionState),
    [voiceSession.sessionState]
  );

  // Show voice errors as toasts
  useEffect(() => {
    if (voiceSession.error) {
      toast.error(voiceSession.error);
    }
  }, [voiceSession.error]);

  // Sync server conversations with local state
  useEffect(() => {
    if (conversations) {
      setLocalConversations(conversations);
    }
  }, [conversations]);

  const handleNewChat = useCallback(async () => {
    try {
      const conv = await createConversation.mutateAsync(undefined);
      setActiveConversationId(conv.id);
      clearMessages();
      setMobileDrawerOpen(false);
    } catch {
      const localConv: Conversation = {
        id: `local-${Date.now()}`,
        user_id: "",
        title: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setLocalConversations((prev) => [localConv, ...prev]);
      setActiveConversationId(localConv.id);
      clearMessages();
      setMobileDrawerOpen(false);
    }
  }, [createConversation, clearMessages]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      setActiveConversationId(id);
      clearMessages();
      setMobileDrawerOpen(false);
    },
    [clearMessages]
  );

  const handleRename = useCallback(
    (id: string) => {
      const conv = localConversations.find((c) => c.id === id);
      const newTitle = window.prompt(
        "Rename conversation:",
        conv?.title || "New Conversation"
      );
      if (newTitle?.trim()) {
        updateConversation.mutate(
          { id, title: newTitle.trim() },
          {
            onError: () => {
              setLocalConversations((prev) =>
                prev.map((c) =>
                  c.id === id ? { ...c, title: newTitle.trim() } : c
                )
              );
            },
          }
        );
      }
    },
    [localConversations, updateConversation]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteConversation.mutate(id, {
        onSuccess: () => {
          if (activeConversationId === id) {
            setActiveConversationId(null);
            clearMessages();
          }
        },
        onError: () => {
          setLocalConversations((prev) => prev.filter((c) => c.id !== id));
          if (activeConversationId === id) {
            setActiveConversationId(null);
            clearMessages();
          }
        },
      });
    },
    [activeConversationId, deleteConversation, clearMessages]
  );

  const handleTitleChange = useCallback(
    (title: string) => {
      if (!activeConversationId) return;
      updateConversation.mutate(
        { id: activeConversationId, title },
        {
          onError: () => {
            setLocalConversations((prev) =>
              prev.map((c) =>
                c.id === activeConversationId ? { ...c, title } : c
              )
            );
          },
        }
      );
    },
    [activeConversationId, updateConversation]
  );

  const handleVoiceToggle = useCallback(() => {
    if (voiceSession.sessionState === "idle") {
      voiceSession.startSession();
    } else {
      voiceSession.endSession();
    }
  }, [voiceSession]);

  const handleVoiceFromEmpty = useCallback(async () => {
    try {
      const conv = await createConversation.mutateAsync(undefined);
      setActiveConversationId(conv.id);
      clearMessages();
      // Small delay to let state settle, then start voice
      setTimeout(() => {
        voiceSession.startSession();
      }, 100);
    } catch {
      const localConv: Conversation = {
        id: `local-${Date.now()}`,
        user_id: "",
        title: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setLocalConversations((prev) => [localConv, ...prev]);
      setActiveConversationId(localConv.id);
      clearMessages();
      setTimeout(() => {
        voiceSession.startSession();
      }, 100);
    }
  }, [createConversation, clearMessages, voiceSession]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      await ensureConversationAndSend(content, { inputMode: "text" });
    },
    [ensureConversationAndSend]
  );

  const activeConversation = localConversations.find(
    (c) => c.id === activeConversationId
  );

  const conversationListElement = (
    <ConversationList
      conversations={localConversations}
      activeId={activeConversationId}
      isLoading={conversationsLoading}
      onSelect={handleSelectConversation}
      onNew={handleNewChat}
      onRename={handleRename}
      onDelete={handleDelete}
    />
  );

  return (
    <div className="flex flex-1 min-h-0">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-72 glass-panel border-r border-white/[0.06] flex-col min-h-0">
        {conversationListElement}
      </div>

      {/* Mobile Sheet drawer */}
      <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="px-4 pt-4 pb-2">
            <SheetTitle>Conversations</SheetTitle>
          </SheetHeader>
          {conversationListElement}
        </SheetContent>
      </Sheet>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {activeConversationId ? (
          <>
            <div className="flex items-center md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="ml-2"
                onClick={() => setMobileDrawerOpen(true)}
                aria-label="Open conversations"
              >
                <Menu className="h-5 w-5 text-white/50" strokeWidth={1.5} />
              </Button>
              <div className="flex-1">
                <ChatHeader
                  title={activeConversation?.title || null}
                  voiceState={voiceState}
                  onTitleChange={handleTitleChange}
                  onVoiceToggle={handleVoiceToggle}
                />
              </div>
            </div>
            <div className="hidden md:block">
              <ChatHeader
                title={activeConversation?.title || null}
                voiceState={voiceState}
                onTitleChange={handleTitleChange}
                onVoiceToggle={handleVoiceToggle}
              />
            </div>
            {voiceState === "connected" && (
              <VoiceStatusBar
                status={voiceStatus}
                interimTranscript={voiceSession.interimTranscript}
              />
            )}
            <ChatMessages
              messages={messages}
              isStreaming={isStreaming}
              voiceActive={voiceState === "connected"}
              interimTranscript={voiceSession.interimTranscript}
            />
            <ChatInput
              onSend={handleSendMessage}
              isStreaming={isStreaming}
              onMicClick={handleVoiceToggle}
            />
          </>
        ) : (
          <>
            <div className="md:hidden p-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileDrawerOpen(true)}
                aria-label="Open conversations"
              >
                <Menu className="h-5 w-5 text-white/50" strokeWidth={1.5} />
              </Button>
            </div>
            <NoConversationState onNewChat={handleNewChat} onStartVoice={handleVoiceFromEmpty} />
          </>
        )}
      </div>
    </div>
  );
}
