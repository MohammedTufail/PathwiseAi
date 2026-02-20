export async function generateLearningPath(
  subject: string,
  level: string,
  goal: string,
) {
  const response = await fetch("http://localhost:5000/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ subject, level, goal }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate curriculum");
  }

  return response.json();
}
