// frontend/src/hooks/useChat.ts
// ─────────────────────────────────────────────────────────────────────────────
// Manages local chat UI state and delegates API calls to chatApi.ts.
// Messages are stored in component memory only (not localStorage) —
// the backend holds the persistent history.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useRef } from "react";
import { sendChatMessage, clearChatHistory } from "../api/chatApi";
import type { ChatContext } from "../api/chatApi";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function useChat(courseId: string, context: ChatContext) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idRef = useRef(0);

  const nextId = () => `msg-${++idRef.current}`;

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      const userMsg: Message = {
        id: nextId(),
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);
      setError(null);

      try {
        const reply = await sendChatMessage(courseId, text.trim(), context);

        const botMsg: Message = {
          id: nextId(),
          role: "assistant",
          content: reply,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMsg]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong";
        setError(msg);

        // Add an inline error message so the user sees it in the chat
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "assistant",
            content: "Sorry, I couldn't respond right now. Please try again.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [courseId, context, loading],
  );

  const clear = useCallback(async () => {
    setMessages([]);
    setError(null);
    await clearChatHistory(courseId).catch(() => {});
  }, [courseId]);

  return { messages, loading, error, send, clear };
}
