// components/progress/ProjectSection.tsx
// ─────────────────────────────────────────────────────────────────────────────
// "Mark Project as Done" button with optional GitHub link input.
// Once marked done the button becomes a green "Completed" badge.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Github, Folder, Loader2 } from "lucide-react";
import { Button } from "../button";
import type { ProjectProgress } from "../../api/progressApi";

interface Props {
  project: ProjectProgress | undefined;
  projectTitle: string;
  onMarkDone: (githubLink: string) => Promise<void>;
}

export default function ProjectSection({
  project,
  projectTitle,
  onMarkDone,
}: Props) {
  const [githubLink, setGithubLink] = useState(project?.githubLink ?? "");
  const [saving, setSaving] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const isDone = project?.completed ?? false;

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onMarkDone(githubLink.trim());
      setShowInput(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 p-4 rounded-xl border border-white/8 bg-white/3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
            <Folder className="h-3.5 w-3.5 text-green-400" />
          </div>
          <div>
            <p className="text-[11px] text-gray-600 uppercase tracking-widest font-semibold">
              Weekly Project
            </p>
            <p className="text-sm font-semibold text-white leading-snug mt-0.5">
              {projectTitle}
            </p>
          </div>
        </div>

        {/* Action area */}
        {isDone ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/12 border border-green-500/25 text-green-400 text-xs font-semibold shrink-0"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Completed
          </motion.div>
        ) : (
          <Button
            onClick={() => setShowInput((v) => !v)}
            className="shrink-0 rounded-xl text-xs font-semibold bg-white/6 hover:bg-green-500/15 border border-white/10 hover:border-green-500/30 text-gray-300 hover:text-white transition-all duration-200"
          >
            Mark as Done
          </Button>
        )}
      </div>

      {/* GitHub link shown once project is done */}
      {isDone && project?.githubLink && (
        <a
          href={project.githubLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 mt-3 text-xs text-green-400 hover:text-green-300 transition-colors"
        >
          <Github className="h-3 w-3" />
          {project.githubLink}
        </a>
      )}

      {/* GitHub input + submit (shown when toggled) */}
      <AnimatePresence>
        {showInput && !isDone && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 mt-3">
              <div className="relative flex-1">
                <Github className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
                <input
                  type="url"
                  value={githubLink}
                  onChange={(e) => setGithubLink(e.target.value)}
                  placeholder="https://github.com/you/project (optional)"
                  className="w-full pl-8 pr-3 h-9 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-green-500/40 transition-colors"
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="h-9 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-semibold shadow-[0_0_8px_#16a34a] disabled:opacity-50 transition-all"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Confirm"
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
