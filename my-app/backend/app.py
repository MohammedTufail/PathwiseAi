from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
from groq import Groq

from learning_system import generate_curriculum, attach_resources
from quiz_module import generate_quiz, DEFAULT_TOTAL, DEFAULT_DIFFICULTY
import traceback

load_dotenv()

app = Flask(__name__)
CORS(app, origins=[
    "https://pathwise-ai-blue.vercel.app",
    "http://localhost:5173"
])

# Shared Groq client (quiz_module receives it; learning_system creates its own internally)
_groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/api/generate", methods=["POST"])
def generate():
    data = request.json
    subject = data.get("subject")
    level = data.get("level")
    goal = data.get("goal")

    if not subject or not level or not goal:
        return jsonify({"error": "Missing subject, level, or goal"}), 400

    try:
        print(f" Generating curriculum for: {subject} | {level} | {goal}")
        curriculum = generate_curriculum(subject, level, goal)
        print(f" Curriculum generated with keys: {list(curriculum.keys())}")

        curriculum = attach_resources(curriculum, subject)
        print(" Resources attached successfully")

        return jsonify(curriculum)

    except Exception as e:
        print(f" Error: {str(e)}")
        return jsonify({"error": str(e)}), 500


# =====================================================
# QUIZ GENERATOR ROUTE  (updated)
# =====================================================
@app.route("/api/generate-quiz", methods=["POST"])
def quiz():
    data = request.json or {}

    subject    = data.get("subject", "").strip()
    topics     = data.get("topics", [])
    total      = int(data.get("total", DEFAULT_TOTAL))
    difficulty = data.get("difficulty", DEFAULT_DIFFICULTY)

    # Basic validation
    if not subject:
        return jsonify({"error": "Missing 'subject'"}), 400
    if not topics or not isinstance(topics, list):
        return jsonify({"error": "'topics' must be a non-empty list"}), 400
    if total < 1 or total > 30:
        return jsonify({"error": "'total' must be between 1 and 30"}), 400

    try:
        print(f" Generating quiz — subject: {subject!r} | topics: {topics} | "
              f"total: {total} | difficulty: {difficulty!r}")

        result = generate_quiz(
            client=_groq_client,
            subject=subject,
            topics=topics,
            total=total,
            difficulty=difficulty,
        )

        print(f" Quiz ready — {result.meta.total_questions} questions")
        return jsonify(result.to_dict())

    except Exception as e:
        print(" FULL ERROR TRACE:")
        traceback.print_exc() 
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(debug=False, host="0.0.0.0", port=5001)