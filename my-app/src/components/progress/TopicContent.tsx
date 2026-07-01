// frontend/src/components/progress/TopicContent.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Renders the AI-generated micro-lesson for a topic as a simple paragraph-style
// block: each sentence/field is a "-" prefixed line, no per-line colors or icons.
// Collapsed to 3 lines by default with a "Read more" toggle that expands inline
// (no navigation).
//
// Used in:
//   WeekDetails.tsx — <TopicContent topic content index />
//   WeekCard.tsx    — <TopicContentPreview content />
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

// ─── Exported type ────────────────────────────────────────────────────────────

export type TopicContentItem = {
  explanation: string;
  analogy: string;
  example: string; // "" if not applicable
  whyItMatters: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Splits a paragraph into individual sentences. */
function splitSentences(text: string): string[] {
  if (!text) return [];
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Flattens explanation/analogy/example/whyItMatters into one ordered list of lines. */
function buildLines(content: TopicContentItem): string[] {
  const lines: string[] = [];
  lines.push(...splitSentences(content.explanation));
  if (content.analogy?.trim()) lines.push(content.analogy.trim());
  if (content.example?.trim()) lines.push(content.example.trim());
  if (content.whyItMatters?.trim()) lines.push(content.whyItMatters.trim());
  return lines;
}

// ─── Shared block ─────────────────────────────────────────────────────────────

interface BlockProps {
  content: TopicContentItem;
  collapsedCount?: number;
}

function TopicContentBlock({ content, collapsedCount = 3 }: BlockProps) {
  const [expanded, setExpanded] = useState(false);
  const lines = buildLines(content);

  if (lines.length === 0) return null;

  const hasMore = lines.length > collapsedCount;
  const visible = expanded ? lines : lines.slice(0, collapsedCount);

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="space-y-1.5">
          {visible.map((line, i) => (
            <p
              key={i}
              className="text-sm text-gray-300 leading-relaxed flex gap-2"
            >
              <span className="text-green-500/60 shrink-0 select-none">-</span>
              <span>{line}</span>
            </p>
          ))}
        </div>

        
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-[11px] font-semibold text-green-400 hover:text-green-300 transition-colors duration-200"
        >
          {expanded ? "Show less" : "Read more"}
          {expanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>
      )}
    </div>
  );
}

// ─── Full TopicContent (WeekDetails) ─────────────────────────────────────────

interface FullProps {
  topic: string;
  content: TopicContentItem;
  index?: number;
}

export function TopicContent({ content, index = 0 }: FullProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.05 + index * 0.04,
        duration: 0.4,
        ease: "easeOut",
      }}
    >
      <TopicContentBlock content={content} collapsedCount={3} />
    </motion.div>
  );
}

// ─── Collapsed preview (WeekCard) ────────────────────────────────────────────

interface PreviewProps {
  content: TopicContentItem;
}

export function TopicContentPreview({ content }: PreviewProps) {
  return <TopicContentBlock content={content} collapsedCount={3} />;
}

export default TopicContent;
