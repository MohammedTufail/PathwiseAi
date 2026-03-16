"""

Features
--------
- Three difficulty tiers: easy / medium / hard (configurable split)
- Three question types: mcq / true_false / scenario
- Per-topic prompting for balanced topic coverage
- Strict JSON schema validation on every question
- Automatic retry (up to MAX_RETRIES) on parse/validation failure
- Deduplication, shuffling, and trimming to exact target count
- Rich QuizResult dataclass consumed directly by the Flask route
- Safe for concurrent calls (no module-level mutable state)
"""

from __future__ import annotations

import json
import random
import re
import time
from dataclasses import asdict, dataclass, field
from typing import Any

from groq import Groq

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

MAX_RETRIES = 3
DEFAULT_TOTAL = 10         # questions per quiz call
DEFAULT_DIFFICULTY = "mixed"   # easy | medium | hard | mixed

# Distribution when difficulty == "mixed"
DIFFICULTY_SPLIT = {"easy": 0.30, "medium": 0.50, "hard": 0.20}

# Question-type weight (MCQ dominant, others as flavour)
QTYPE_WEIGHTS = {"mcq": 0.65, "true_false": 0.20, "scenario": 0.15}

VALID_ANSWER_LETTERS = {"A", "B", "C", "D"}

# ---------------------------------------------------------------------------
# Dataclasses
# ---------------------------------------------------------------------------

@dataclass
class QuizQuestion:
    question: str
    options: list[str]         # exactly 4 full-sentence strings for MCQ
    answer: str                # "A" | "B" | "C" | "D" | "True" | "False"
    explanation: str
    topic: str
    difficulty: str            # easy | medium | hard
    question_type: str         # mcq | true_false | scenario


@dataclass
class QuizMeta:
    subject: str
    topics: list[str]
    total_questions: int
    difficulty_mode: str
    difficulty_distribution: dict[str, int]   # {"easy": 3, "medium": 5, "hard": 2}
    type_distribution: dict[str, int]          # {"mcq": 7, "true_false": 2, "scenario": 1}
    generated_at: float = field(default_factory=time.time)


@dataclass
class QuizResult:
    quiz: list[QuizQuestion]
    meta: QuizMeta

    def to_dict(self) -> dict[str, Any]:
        """Serialise to a plain dict ready for jsonify()."""
        return {
            "quiz": [asdict(q) for q in self.quiz],
            "meta": asdict(self.meta),
        }


# ---------------------------------------------------------------------------
# Prompt builders
# ---------------------------------------------------------------------------

def _difficulty_instruction(difficulty: str) -> str:
    """Return the difficulty-specific sub-instruction for the prompt."""
    instructions = {
        "easy": (
            "These questions should test basic recall and recognition. "
            "Use simple, clear language. Wrong options should be clearly wrong "
            "but plausible enough to require reading the question."
        ),
        "medium": (
            "These questions should test understanding and application. "
            "Require the student to reason about the concept, not just recall a fact. "
            "Wrong options should be subtly incorrect — common misconceptions work well."
        ),
        "hard": (
            "These questions should test analysis and edge-case knowledge. "
            "Involve trade-offs, comparisons, or nuanced scenarios. "
            "All four options should seem plausible; only careful reasoning reveals the correct one."
        ),
    }
    return instructions.get(difficulty, instructions["medium"])


def _qtype_instruction(question_type: str) -> str:
    """Return format rules for the given question type."""
    if question_type == "true_false":
        return (
            'This is a TRUE/FALSE question. '
            'The "options" array must be exactly ["True", "False"]. '
            'The "answer" field must be exactly "True" or "False" (not A/B/C/D).'
        )
    if question_type == "scenario":
        return (
            "This is a scenario-based MCQ. "
            "Begin the question with a short 2–3 sentence real-world situation, "
            "then ask what the student should do or what will happen. "
            "Options must be A/B/C/D full-sentence choices."
        )
    # default: mcq
    return (
        "This is a standard multiple-choice question. "
        "Options must be labelled A, B, C, D — each a complete, self-contained sentence. "
        'The "answer" field must be exactly one of: "A", "B", "C", "D".'
    )


def _build_prompt(
    subject: str,
    topic: str,
    difficulty: str,
    question_type: str,
    count: int,
) -> str:
    return f"""You are an expert quiz designer creating assessment questions for a professional learning platform.

Subject: {subject}
Topic: {topic}
Difficulty: {difficulty.upper()}
Question type: {question_type}
Number of questions to generate: {count}

Difficulty guidance:
{_difficulty_instruction(difficulty)}

Format guidance:
{_qtype_instruction(question_type)}

Return ONLY a JSON object in this exact structure — no markdown, no preamble:

{{
  "questions": [
    {{
      "question": "Full question text here.",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "answer": "B",
      "explanation": "Concise 2-sentence explanation of why the answer is correct and why the others are wrong.",
      "topic": "{topic}",
      "difficulty": "{difficulty}",
      "question_type": "{question_type}"
    }}
  ]
}}

Rules:
1. Every question must be self-contained — no references to "the passage above" or external material.
2. Explanations must name the correct concept, not just restate the answer.
3. No repeated or near-duplicate questions.
4. For MCQ/scenario: options array has exactly 4 elements. For true_false: exactly ["True", "False"].
5. Output valid JSON only. No extra keys. No trailing commas.
"""


# ---------------------------------------------------------------------------
# LLM caller (reuses the shared Groq client passed in)
# ---------------------------------------------------------------------------

def _call_groq(client: Groq, prompt: str) -> str:
    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a quiz generation engine. "
                    "You respond ONLY with valid JSON. "
                    "No markdown fences, no explanation, no text outside the JSON object."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.4,   # slightly higher than curriculum for more question variety
        max_tokens=4096,
    )
    return completion.choices[0].message.content.strip()


# ---------------------------------------------------------------------------
# Parser + validator
# ---------------------------------------------------------------------------

def _extract_questions_json(raw: str) -> list[dict]:
    """
    Strip markdown fences, extract the JSON object, parse it,
    and return the inner 'questions' list.
    Raises ValueError with a descriptive message on any failure.
    """
    text = re.sub(r"```json\s*", "", raw)
    text = re.sub(r"```\s*", "", text)
    text = text.strip()

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError(f"No JSON object found in LLM response. Preview: {text[:200]}")

    try:
        parsed = json.loads(match.group())
    except json.JSONDecodeError as exc:
        raise ValueError(f"JSON decode error: {exc}. Preview: {match.group()[:200]}") from exc

    questions = parsed.get("questions")
    if not isinstance(questions, list):
        raise ValueError(f"Missing 'questions' list. Got keys: {list(parsed.keys())}")

    return questions


def _validate_question(q: dict, question_type: str) -> QuizQuestion:
    """
    Validate one raw question dict and coerce it into a QuizQuestion.
    Raises ValueError if the question is malformed.
    """
    required = {"question", "options", "answer", "explanation"}
    missing = required - q.keys()
    if missing:
        raise ValueError(f"Question missing fields: {missing}. Got: {q}")

    question_text = str(q["question"]).strip()
    explanation = str(q["explanation"]).strip()
    topic = str(q.get("topic", "")).strip()
    difficulty = str(q.get("difficulty", "medium")).strip().lower()
    qtype = str(q.get("question_type", question_type)).strip().lower()

    options = q["options"]
    if not isinstance(options, list):
        raise ValueError(f"'options' must be a list, got {type(options)}")

    answer = str(q["answer"]).strip()

    if qtype == "true_false":
        if len(options) != 2:
            raise ValueError(f"true_false question must have exactly 2 options, got {len(options)}")
        if answer not in {"True", "False"}:
            raise ValueError(f"true_false answer must be 'True' or 'False', got '{answer}'")
    else:
        if len(options) != 4:
            raise ValueError(f"MCQ/scenario question must have 4 options, got {len(options)}")
        # Normalise: strip leading "A. " / "A) " prefixes the model sometimes adds
        clean_options = []
        for opt in options:
            opt_str = re.sub(r"^[A-D][.)]\s*", "", str(opt)).strip()
            clean_options.append(opt_str)
        options = clean_options

        answer = answer.upper().replace(".", "").replace(")", "").strip()
        if answer not in VALID_ANSWER_LETTERS:
            raise ValueError(f"MCQ answer must be A/B/C/D, got '{answer}'")

    if len(question_text) < 10:
        raise ValueError(f"Question text too short: '{question_text}'")
    if len(explanation) < 10:
        raise ValueError(f"Explanation too short: '{explanation}'")

    return QuizQuestion(
        question=question_text,
        options=options,
        answer=answer,
        explanation=explanation,
        topic=topic,
        difficulty=difficulty,
        question_type=qtype,
    )


# ---------------------------------------------------------------------------
# Slot planner
# ---------------------------------------------------------------------------

def _plan_slots(
    topics: list[str],
    total: int,
    difficulty: str,
) -> list[dict]:
    """
    Return a list of slot dicts:
      [{"topic": str, "difficulty": str, "question_type": str, "count": int}, ...]

    Each slot represents one LLM call. Slots are distributed so that:
    - Topics are covered as evenly as possible
    - When difficulty=="mixed", easy/medium/hard proportions from DIFFICULTY_SPLIT
    - Question types are sampled per slot according to QTYPE_WEIGHTS
    """
    if not topics:
        topics = ["General"]

    # --- difficulty per question -----------------------------------------
    if difficulty == "mixed":
        buckets: list[str] = []
        for diff, ratio in DIFFICULTY_SPLIT.items():
            buckets.extend([diff] * round(ratio * total))
        # pad / trim to exact total
        while len(buckets) < total:
            buckets.append("medium")
        buckets = buckets[:total]
        random.shuffle(buckets)
    else:
        buckets = [difficulty] * total

    # --- question types per question -------------------------------------
    qtype_choices = list(QTYPE_WEIGHTS.keys())
    qtype_weights_list = [QTYPE_WEIGHTS[qt] for qt in qtype_choices]
    qtypes = random.choices(qtype_choices, weights=qtype_weights_list, k=total)

    # --- assign to topics (round-robin) ---------------------------------
    per_question = [
        {"topic": topics[i % len(topics)], "difficulty": buckets[i], "question_type": qtypes[i]}
        for i in range(total)
    ]

    # --- group into slots (one LLM call per unique topic/difficulty/type combo) --
    slot_map: dict[tuple, dict] = {}
    for pq in per_question:
        key = (pq["topic"], pq["difficulty"], pq["question_type"])
        if key not in slot_map:
            slot_map[key] = {**pq, "count": 0}
        slot_map[key]["count"] += 1

    return list(slot_map.values())


# ---------------------------------------------------------------------------
# Core generator
# ---------------------------------------------------------------------------

def generate_quiz(
    client: Groq,
    subject: str,
    topics: list[str],
    total: int = DEFAULT_TOTAL,
    difficulty: str = DEFAULT_DIFFICULTY,
) -> QuizResult:
    """
    Generate a complete quiz and return a QuizResult.

    Parameters
    ----------
    client      : Groq client instance (shared from app.py)
    subject     : e.g. "Java Backend Development"
    topics      : e.g. ["REST APIs", "Spring Boot", "CRUD APIs"]
    total       : target number of questions (default 10)
    difficulty  : "easy" | "medium" | "hard" | "mixed"

    Returns
    -------
    QuizResult  : dataclass with .quiz (list[QuizQuestion]) and .meta (QuizMeta)
    """
    difficulty = difficulty.lower().strip()
    if difficulty not in {*DIFFICULTY_SPLIT, "mixed"}:
        difficulty = DEFAULT_DIFFICULTY

    slots = _plan_slots(topics, total, difficulty)
    all_questions: list[QuizQuestion] = []
    seen_questions: set[str] = set()

    for slot in slots:
        slot_topic = slot["topic"]
        slot_diff = slot["difficulty"]
        slot_type = slot["question_type"]
        slot_count = slot["count"]

        prompt = _build_prompt(subject, slot_topic, slot_diff, slot_type, slot_count)

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                raw = _call_groq(client, prompt)
                raw_questions = _extract_questions_json(raw)

                for rq in raw_questions:
                    try:
                        validated = _validate_question(rq, slot_type)
                    except ValueError as ve:
                        print(f"  ⚠️  Skipping malformed question: {ve}")
                        continue

                    # Deduplicate by normalised question text
                    norm = re.sub(r"\s+", " ", validated.question.lower())
                    if norm in seen_questions:
                        print(f"  ⚠️  Duplicate skipped: {validated.question[:60]}…")
                        continue

                    seen_questions.add(norm)
                    all_questions.append(validated)

                break  # slot succeeded — move to next

            except (ValueError, Exception) as exc:
                print(f"  ❌ Slot [{slot_topic}/{slot_diff}/{slot_type}] attempt {attempt}/{MAX_RETRIES} failed: {exc}")
                if attempt == MAX_RETRIES:
                    print(f"  ⛔ Giving up on slot after {MAX_RETRIES} retries.")
                else:
                    time.sleep(0.5 * attempt)   # brief back-off

    # --- shuffle and trim to exact target ---------------------------------
    random.shuffle(all_questions)
    all_questions = all_questions[:total]

    # --- build metadata ---------------------------------------------------
    diff_dist: dict[str, int] = {"easy": 0, "medium": 0, "hard": 0}
    type_dist: dict[str, int] = {"mcq": 0, "true_false": 0, "scenario": 0}
    for q in all_questions:
        diff_dist[q.difficulty] = diff_dist.get(q.difficulty, 0) + 1
        type_dist[q.question_type] = type_dist.get(q.question_type, 0) + 1

    meta = QuizMeta(
        subject=subject,
        topics=topics,
        total_questions=len(all_questions),
        difficulty_mode=difficulty,
        difficulty_distribution=diff_dist,
        type_distribution=type_dist,
    )

    print(
        f"✅ Quiz complete — {len(all_questions)} questions | "
        f"diff: {diff_dist} | types: {type_dist}"
    )
    return QuizResult(quiz=all_questions, meta=meta)