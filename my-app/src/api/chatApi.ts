// frontend/src/api/chatApi.ts
// ─────────────────────────────────────────────────────────────────────────────
// All HTTP calls for the chat feature.
// Context is read from the calling component and passed in per-request —
// no global state needed.
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

export interface ChatContext {
  subject: string;
  weekNumber: number;
  weekTitle: string;
  topics: string[];
  quizScore: number | null;
  quizPassed: boolean;
}

function getToken(): string {
  return localStorage.getItem("token") ?? "";
}

export async function sendChatMessage(
  courseId: string,
  message: string,
  context: ChatContext,
): Promise<string> {
  const res = await fetch(`${API_BASE}/api/chat/${courseId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ message, context }),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message ?? "Chat request failed");
  }

  return data.reply as string;
}

export async function clearChatHistory(courseId: string): Promise<void> {
  await fetch(`${API_BASE}/api/chat/${courseId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
}
