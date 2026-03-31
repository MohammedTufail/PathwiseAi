
// ─────────────────────────────────────────────────────────────────────────────
// Shows 3–4 clickable suggested prompts when the chat is empty.
// Prompts are generated from the current week's topics so they're
// always contextually relevant — no hardcoding.
// ─────────────────────────────────────────────────────────────────────────────

import { motion } from "framer-motion";

interface Props {
  topics: string[];
  quizPassed: boolean;
  onSelect: (prompt: string) => void;
}

function buildSuggestions(topics: string[], quizPassed: boolean): string[] {
  const firstTopic = topics[0] ?? "this topic";
  const secondTopic = topics[1] ?? topics[0] ?? "this topic";

  const suggestions = [
    `Explain ${firstTopic} with a simple example`,
    `What's the difference between ${firstTopic} and ${secondTopic}?`,
    `Give me a beginner-friendly analogy for ${firstTopic}`,
  ];

  // Add quiz hint prompt if quiz isn't passed yet
  if (!quizPassed) {
    suggestions.push("I'm stuck on a quiz question — can you give me a hint?");
  } else {
    suggestions.push(`What's a common mistake to avoid with ${firstTopic}?`);
  }

  return suggestions.slice(0, 4);
}

export default function SuggestedPrompts({
  topics,
  quizPassed,
  onSelect,
}: Props) {
  const prompts = buildSuggestions(topics, quizPassed);

  return (
    <div className="mt-3 flex flex-col gap-1.5">
      {prompts.map((prompt, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 + i * 0.06 }}
          onClick={() => onSelect(prompt)}
          className="text-left text-xs text-gray-400 hover:text-green-400 bg-white/4 hover:bg-green-500/8 border border-white/8 hover:border-green-500/25 rounded-xl px-3 py-2 transition-all duration-200 leading-snug"
        >
          {prompt}
        </motion.button>
      ))}
    </div>
  );
}
