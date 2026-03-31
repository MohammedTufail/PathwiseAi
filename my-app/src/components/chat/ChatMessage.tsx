
// Renders a single chat bubble.
// User messages: right-aligned, green tint.
// Assistant messages: left-aligned, neutral, with bot avatar.
// ─────────────────────────────────────────────────────────────────────────────

import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import type { Message } from "../../hooks/useChat";

interface Props {
  message: Message;
  index: number;
}

export default function ChatMessage({ message, index }: Props) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.2) }}
      className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {/* Bot avatar */}
      {!isUser && (
        <div className="h-6 w-6 rounded-full bg-green-500/15 border border-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <Brain className="h-3 w-3 text-green-400" />
        </div>
      )}

      {/* Bubble */}
      <div
        className={`
          max-w-[240px] rounded-2xl px-3 py-2.5 text-sm leading-relaxed
          ${
            isUser
              ? "rounded-tr-sm bg-green-600/25 border border-green-500/25 text-green-100"
              : "rounded-tl-sm bg-white/6 border border-white/8 text-gray-300"
          }
        `}
      >
        {/* Preserve newlines in the reply */}
        {message.content.split("\n").map((line, i) => (
          <span key={i}>
            {line}
            {i < message.content.split("\n").length - 1 && <br />}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
