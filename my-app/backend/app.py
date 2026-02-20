from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
from learning_system import generate_curriculum, attach_resources

load_dotenv()

app = Flask(__name__)
CORS(app)

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
        print(f"🚀 Generating curriculum for: {subject} | {level} | {goal}")
        curriculum = generate_curriculum(subject, level, goal)
        print(f"✅ Curriculum generated with keys: {list(curriculum.keys())}")

        curriculum = attach_resources(curriculum, subject)
        print("✅ Resources attached successfully")

        return jsonify(curriculum)

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=False, host="0.0.0.0", port=port)