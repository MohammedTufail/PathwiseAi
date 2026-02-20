import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/button";

const Home = () => {
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!subject || !level || !goal) {
      alert("Please fill all fields");
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180000); // 3 min timeout

    try {
      setLoading(true);

      const res = await fetch("https://pathwiseai-re2v.onrender.com/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, level, goal }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error("Server error");
      }

      const data = await res.json();

      if (!data.weeks || !Array.isArray(data.weeks) || data.weeks.length === 0) {
        throw new Error("Invalid curriculum received from AI. Please try again.");
      }

      localStorage.setItem("curriculum", JSON.stringify(data));
      navigate("/learning-path");

    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === "AbortError") {
        alert("Request timed out. Ollama is taking too long. Try a simpler prompt.");
      } else {
        console.error(err);
        alert(err.message || "Failed to generate curriculum");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg bg-card border rounded-2xl p-6 shadow-sm space-y-4">
        <h1 className="text-2xl font-bold text-foreground">PathwiseAI</h1>
        <p className="text-muted-foreground text-sm">
          Build your personalized curriculum with AI.
        </p>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject (ex: Java)"
          className="w-full p-3 rounded-xl border bg-background"
        />
        <input
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          placeholder="Skill Level (Beginner/Intermediate)"
          className="w-full p-3 rounded-xl border bg-background"
        />
        <input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Goal (ex: Build an app)"
          className="w-full p-3 rounded-xl border bg-background"
        />
        <Button
          className="w-full rounded-xl"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? "Generating... (this may take a minute)" : "Generate Curriculum"}
        </Button>
      </div>
    </div>
  );
};

export default Home;