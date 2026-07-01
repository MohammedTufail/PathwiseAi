import requests
import json
import os
import re
from dotenv import load_dotenv
from typing import List, Dict
from groq import Groq
import json

load_dotenv()

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

client = Groq(api_key=GROQ_API_KEY)

# =====================================================
# GROQ CALL  (curriculum generator — large model)
# =====================================================

def call_groq(prompt: str) -> str:
    """
    Call Groq with the high-capability model for structured curriculum generation.
    Raises on HTTP / API error so callers can handle it explicitly.
    """
    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a curriculum designer. "
                    "You only respond with valid JSON. "
                    "No markdown, no explanation, no text outside the JSON object."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.1,
        max_tokens=4096,
    )
    return completion.choices[0].message.content.strip()


# =====================================================
# SAFE JSON PARSER
# =====================================================

def extract_json(text: str) -> Dict:
    """
    Strip markdown fences, locate the first {...} block, parse it, and
    verify it contains a 'weeks' key.  Raises ValueError on any failure.
    """
    # Strip markdown code fences
    text = re.sub(r"```json", "", text)
    text = re.sub(r"```", "", text)
    text = text.strip()

    # Fix a common LLM artefact: "}] , [" between week chunks
    text = re.sub(r"\}\s*\]\s*,\s*\[", ", ", text)

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError(
            f"No JSON object found in LLM response. Raw (first 300 chars): {text[:300]}"
        )

    raw_json = match.group()

    try:
        parsed = json.loads(raw_json)
    except json.JSONDecodeError as e:
        raise ValueError(
            f"JSON decode error: {e}. Raw JSON (first 300 chars): {raw_json[:300]}"
        )

    if "weeks" not in parsed:
        raise ValueError(
            f"Missing 'weeks' key in parsed JSON. Got keys: {list(parsed.keys())}"
        )

    return parsed


# --------------------------------------------------------------------

def extract_any_json(text: str) -> Dict:
    """
    Extract and parse any JSON object from an LLM response.
    Unlike extract_json(), this does NOT require a 'weeks' key.
    """

    # Remove markdown fences
    text = re.sub(r"```json", "", text)
    text = re.sub(r"```", "", text)
    text = text.strip()

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError(
            f"No JSON object found in LLM response. Raw:\n{text[:300]}"
        )

    raw_json = match.group()

    try:
        return json.loads(raw_json)
    except json.JSONDecodeError as e:
        raise ValueError(
            f"JSON decode error: {e}\nRaw JSON:\n{raw_json[:300]}"
        )

# =====================================================
# CURRICULUM GENERATOR
# =====================================================

def generate_curriculum(subject: str, level: str, goal: str) -> Dict:
    """
    Ask Groq to produce a multi-week curriculum JSON for the given subject,
    level, and goal.  Returns a dict with a 'weeks' list.
    """
    prompt = f"""Create a comprehensive curriculum with as many weeks as needed for:
Subject: {subject}
Skill Level: {level}
Goal: {goal}

Use exactly this JSON structure:
{{"weeks": [
  {{"week": 1, "title": "...", "topics": ["...", "...", "..."], "project": "..."}},
  {{"week": 2, "title": "...", "topics": ["...", "...", "..."], "project": "..."}}
]}}

Output the JSON only. No intro. No explanation. No markdown."""

    print("  Calling Groq for curriculum…")
    response = call_groq(prompt)
    print(f"  Raw Groq response:\n{response}\n")

    try:
        curriculum = extract_json(response)
        print(f"   Parsed curriculum with {len(curriculum['weeks'])} weeks")
        return curriculum
    except Exception as e:
        raise RuntimeError(f"Curriculum JSON parsing failed: {e}")


# =====================================================
# TOPIC CONTENT GENERATOR  (one call per week)
# =====================================================

def generate_topic_content(week: dict, subject: str, groq_client: Groq) -> dict:
    topics = week.get("topics", [])
    week_title = week.get("title", "")

    if not topics:
        return {}

    subject_lower = subject.lower()
    is_programming = any(
        kw in subject_lower
        for kw in [
            "java", "python", "javascript", "react", "node", "sql",
            "programming", "coding", "software", "backend", "frontend"
        ]
    )

    example_instruction = (
        'Return a 3-6 line code snippet. If not applicable return "".'
        if is_programming
        else
        'Return a real-world example (1-2 sentences) or "".'
    )

    topic_lines = "\n".join(
        f'    "{t}": {{"explanation": "...", "analogy": "...", "example": "...", "whyItMatters": "..."}}'
        + ("," if i < len(topics) - 1 else "")
        for i, t in enumerate(topics)
    )

    prompt = f"""
You are an expert educator.

Return ONLY valid JSON.

Week: {week_title}
Topics: {json.dumps(topics)}

Rules:
- explanation: 2-3 simple sentences
- analogy: start with "Think of it like..."
- example: {example_instruction}
- whyItMatters: 1 sentence

Output:
{{
  "topicContent": {{
{topic_lines}
  }}
}}
"""

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=1500,
        )

        raw = response.choices[0].message.content.strip()
        print("  RAW topic content:\n", raw)

        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        parsed = extract_any_json(raw)


        # Model returned:
# {
#   "topicContent": {
#      ...
#   }
# }
        if isinstance(parsed, dict) and "topicContent" in parsed:
         return parsed["topicContent"]

# Model returned:
# {
#    "Variables": {...},
#    "Loops": {...}
# }
        if isinstance(parsed, dict):
           return parsed

        return {}

    except Exception as e:
        print(f"[topic_content ERROR] Week '{week_title}': {e}")
        return {}

# =====================================================
# YOUTUBE FETCH
# =====================================================

def fetch_youtube_videos(query: str, max_results: int = 2) -> List[Dict]:
    """
    Search YouTube for tutorial videos matching `query`.
    Returns a list of {title, url} dicts; returns [] on any failure.
    """
    if not YOUTUBE_API_KEY:
        print("  YOUTUBE_API_KEY not set — skipping YouTube fetch")
        return []

    url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "maxResults": max_results,
        "key": YOUTUBE_API_KEY,
    }

    try:
        response = requests.get(url, params=params, timeout=30)
    except requests.exceptions.RequestException as e:
        print(f"    YouTube request failed: {e}")
        return []

    if response.status_code != 200:
        print(f"    YouTube API error ({response.status_code}): {response.text[:200]}")
        return []

    videos: List[Dict] = []
    for item in response.json().get("items", []):
        video_id = item["id"]["videoId"]
        title = item["snippet"]["title"]
        videos.append(
            {"title": title, "url": f"https://www.youtube.com/watch?v={video_id}"}
        )
    return videos


# =====================================================
# GITHUB FETCH
# =====================================================

def fetch_github_repos(query: str, max_results: int = 2) -> List[Dict]:
    """
    Search GitHub for repositories matching `query`, sorted by stars.
    Returns a list of {name, url, stars} dicts; returns [] on any failure.
    """
    url = "https://api.github.com/search/repositories"
    params = {
        "q": query,
        "sort": "stars",
        "order": "desc",
        "per_page": max_results,
    }

    try:
        response = requests.get(url, params=params, timeout=30)
    except requests.exceptions.RequestException as e:
        print(f"    GitHub request failed: {e}")
        return []

    if response.status_code != 200:
        print(f"    GitHub API error ({response.status_code}): {response.text[:200]}")
        return []

    repos: List[Dict] = []
    for item in response.json().get("items", []):
        repos.append(
            {
                "name": item["full_name"],
                "url": item["html_url"],
                "stars": item["stargazers_count"],
            }
        )
    return repos


# =====================================================
# RESOURCE ATTACHER
# =====================================================

def attach_resources(curriculum: Dict, subject: str) -> Dict:
    """
    For every topic in every week, fetch YouTube videos + GitHub repos and
    attach them under week["resources"][topic] = {videos: [...], repos: [...]}.
    Mutates and returns the curriculum dict.
    """
    for week in curriculum.get("weeks", []):
        week.setdefault("resources", {})
        for topic in week.get("topics", []):
            print(f" Fetching resources for: {topic}")
            youtube_query = f"{topic} {subject} tutorial beginner"
            github_query = f"{topic} {subject}"

            week["resources"][topic] = {
                "videos": fetch_youtube_videos(youtube_query),
                "repos": fetch_github_repos(github_query),
            }
    return curriculum


# =====================================================
# MAIN PIPELINE
# =====================================================

def generate_curriculum_with_resources(subject: str, level: str, goal: str) -> Dict:
    """
    Full pipeline:
      1. Generate week/topic skeleton via Groq (large model).
      2. Attach YouTube + GitHub resources per topic.
      3. Generate AI micro-lesson content per topic per week (fast model).

    Returns the complete curriculum dict ready to be stored / returned by the API:
    {
        "weeks": [
            {
                "week": 1,
                "title": "...",
                "topics": [...],
                "project": "...",
                "resources": {
                    "Topic A": {"videos": [...], "repos": [...]},
                    ...
                },
                "topicContent": {
                    "Topic A": {
                        "explanation": "...",
                        "analogy": "...",
                        "example": "...",
                        "whyItMatters": "..."
                    },
                    ...
                }
            },
            ...
        ]
    }
    """
    # ── Step 1: Curriculum skeleton ───────────────────────────────────────────
    print("=" * 60)
    print(f"   Generating curriculum: {subject} | {level} | {goal}")
    print("=" * 60)
    curriculum = generate_curriculum(subject, level, goal)

    # ── Step 2: Attach external resources ────────────────────────────────────
    print("\n Attaching YouTube + GitHub resources…")
    curriculum = attach_resources(curriculum, subject)

    # ── Step 3: Generate topic micro-lesson content ───────────────────────────
    print("\n  Generating topic content…")
    for week in curriculum.get("weeks", []):
        week_num = week.get("week", "?")
        print(f"   Week {week_num}: {week.get('title', '')}")
        week["topicContent"] = generate_topic_content(week, subject, client)
        print(
    f"   Week {week['week']} generated "
    f"{len(week['topicContent'])} topic contents"
)

    print(json.dumps(week["topicContent"], indent=2))         

    print("\n   Pipeline complete.")
    return curriculum