
// Self-contained floating chat widget.
// Drop <ChatWidget ... /> anywhere and it renders a floating button
// in the bottom-right corner. Clicking opens a slide-up chat panel.
//
// Props:
//   courseId    — e.g. "java-backend"
//   subject     — e.g. "Java Backend Development"
//   weekNumber  — current week
//   weekTitle   — e.g. "Object Oriented Programming"
//   topics      — string[] of topics for the week
//   quizScore   — number | null
//   quizPassed  — boolean
//
// Usage (in LearningPath.tsx or WeekDetails.tsx):
//   <ChatWidget
//     courseId={courseId}
//     subject={subject}
//     weekNumber={week.week}
//     weekTitle={week.title}
//     topics={week.topics}
//     quizScore={weekProgress?.quiz.bestScore ?? null}
//     quizPassed={weekProgress?.quiz.passed ?? false}
//   />
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Trash2,
  Brain,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { useChat } from "../../hooks/useChat";
import type { ChatContext } from "../../api/chatApi";
import ChatMessage from "./ChatMessage";
import SuggestedPrompts from "./SuggestedPrompts";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  courseId: string;
  subject: string;
  weekNumber: number;
  weekTitle: string;
  topics: string[];
  quizScore: number | null;
  quizPassed: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChatWidget({
  courseId,
  subject,
  weekNumber,
  weekTitle,
  topics,
  quizScore,
  quizPassed,
}: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const context: ChatContext = {
    subject,
    weekNumber,
    weekTitle,
    topics,
    quizScore,
    quizPassed,
  };

  const { messages, loading, send, clear } = useChat(courseId, context);

useEffect(() => {
  const handler = (e: any) => {
    const message = e.detail?.message;
    if (!message) return;

    setInput(message); // fill input
    setOpen(true); // open chat UI
  };

  window.addEventListener("open-chat", handler);
  return () => window.removeEventListener("open-chat", handler);
}, []);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const text = input;
    setInput("");
    await send(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <>
      {/* ── Floating trigger button ── */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-green-600 hover:bg-green-500 text-white shadow-[0_0_20px_#16a34a] hover:shadow-[0_0_28px_#22c55e] flex items-center justify-center transition-colors duration-200"
        title="AI Learning Assistant"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <X className="h-5 w-5" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <MessageCircle className="h-5 w-5" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Chat panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl border border-white/12 bg-gradient-to-b from-gray-950 via-black to-gray-950 shadow-[0_24px_60px_rgba(0,0,0,0.7)] overflow-hidden"
            style={{ height: "480px" }}
          >
            {/* ── Panel header ── */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 bg-black/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-green-500/15 border border-green-500/25 flex items-center justify-center">
                  <Brain className="h-3.5 w-3.5 text-green-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">
                    AI Assistant
                  </p>
                  <p className="text-[10px] text-gray-500 leading-none mt-0.5 truncate max-w-[180px]">
                    Week {weekNumber}: {weekTitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={clear}
                    className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                    title="Clear conversation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-white/8 transition-all duration-200"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* ── Message list ── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
              {/* Welcome message */}
              {isEmpty && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <div className="flex gap-2.5">
                    <div className="h-6 w-6 rounded-full bg-green-500/15 border border-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Brain className="h-3 w-3 text-green-400" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-white/6 border border-white/8 px-3 py-2.5 text-sm text-gray-300 leading-relaxed max-w-[260px]">
                      Hi! I'm your learning assistant for{" "}
                      <span className="text-green-400 font-medium">
                        {weekTitle}
                      </span>
                      . Ask me anything — concepts, examples, or hints for quiz
                      questions.
                    </div>
                  </div>

                  {/* Suggested prompts */}
                  <SuggestedPrompts
                    topics={topics}
                    quizPassed={quizPassed}
                    onSelect={(p) => {
                      setInput(p);
                      inputRef.current?.focus();
                    }}
                  />
                </motion.div>
              )}

              {/* Messages */}
              {messages.map((msg, i) => (
                <ChatMessage key={msg.id} message={msg} index={i} />
              ))}

              {/* Typing indicator */}
              <AnimatePresence>
                {loading && (
                  <motion.div
                    key="typing"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-2.5"
                  >
                    <div className="h-6 w-6 rounded-full bg-green-500/15 border border-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Brain className="h-3 w-3 text-green-400" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-white/6 border border-white/8 px-3 py-3 flex items-center gap-1.5">
                      {[0, 0.15, 0.3].map((delay, i) => (
                        <motion.span
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-green-400"
                          animate={{ y: [0, -4, 0] }}
                          transition={{
                            duration: 0.6,
                            delay,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={bottomRef} />
            </div>

            {/* ── Input bar ── */}
            <div className="shrink-0 border-t border-white/8 bg-black/40 px-3 py-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about this week…"
                  rows={1}
                  disabled={loading}
                  className="flex-1 resize-none bg-white/5 border border-white/10 focus:border-green-500/40 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none transition-colors duration-200 leading-snug disabled:opacity-50"
                  style={{ maxHeight: "96px", overflowY: "auto" }}
                  onInput={(e) => {
                    const t = e.currentTarget;
                    t.style.height = "auto";
                    t.style.height = Math.min(t.scrollHeight, 96) + "px";
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="shrink-0 h-9 w-9 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-[0_0_8px_#16a34a] hover:shadow-[0_0_14px_#22c55e] transition-all duration-200"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <Send className="h-4 w-4 text-white" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-gray-700 mt-1.5 text-center">
                Enter to send · Shift+Enter for new line
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
