
import requests
import json
import os
import re
from dotenv import load_dotenv
from typing import List, Dict
from groq import Groq

load_dotenv()

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

client = Groq(api_key=GROQ_API_KEY)

# =====================================================
# GROQ CALL
# =====================================================
def call_groq(prompt: str) -> str:
    completion = client.chat.completions.create(
       model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "You are a curriculum designer. You only respond with valid JSON. No markdown, no explanation, no text outside the JSON object."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.1,
        max_tokens=4096,
    )
    return completion.choices[0].message.content.strip()

# =====================================================
# SAFE JSON PARSER
# =====================================================
def extract_json(text: str) -> Dict:
    text = re.sub(r"```json", "", text)
    text = re.sub(r"```", "", text)
    text = text.strip()

    text = re.sub(r'\}\s*\]\s*,\s*\[', ', ', text)

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError(f"No JSON found in LLM response. Raw response: {text[:300]}")

    raw_json = match.group()

    try:
        parsed = json.loads(raw_json)
    except json.JSONDecodeError as e:
        raise ValueError(f"JSON decode error: {e}. Raw JSON: {raw_json[:300]}")

    if "weeks" not in parsed:
        raise ValueError(f"Missing 'weeks' key in parsed JSON. Got keys: {list(parsed.keys())}")

    return parsed

# =====================================================
# CURRICULUM GENERATOR
# =====================================================
def generate_curriculum(subject: str, level: str, goal: str) -> Dict:
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

    print("📡 Calling Groq...")
    response = call_groq(prompt)
    print(f"🧠 Raw Groq response:\n{response}\n")

    try:
        curriculum = extract_json(response)
        print(f"✅ Parsed curriculum with {len(curriculum['weeks'])} weeks")
        return curriculum
    except Exception as e:
        raise RuntimeError(f"JSON parsing failed: {e}")

# =====================================================
# YOUTUBE FETCH
# =====================================================
def fetch_youtube_videos(query: str, max_results=2) -> List[Dict]:
    if not YOUTUBE_API_KEY:
        print("⚠️ YOUTUBE_API_KEY not configured, skipping YouTube fetch")
        return []

    url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "maxResults": max_results,
        "key": YOUTUBE_API_KEY
    }

    try:
        response = requests.get(url, params=params, timeout=30)
    except requests.exceptions.RequestException as e:
        print(f"⚠️ YouTube request failed: {e}")
        return []

    if response.status_code != 200:
        print("⚠️ YouTube API error:", response.text)
        return []

    data = response.json()
    videos = []
    for item in data.get("items", []):
        video_id = item["id"]["videoId"]
        title = item["snippet"]["title"]
        videos.append({
            "title": title,
            "url": f"https://www.youtube.com/watch?v={video_id}"
        })
    return videos

# =====================================================
# GITHUB FETCH
# =====================================================
def fetch_github_repos(query: str, max_results=2) -> List[Dict]:
    url = "https://api.github.com/search/repositories"
    params = {
        "q": query,
        "sort": "stars",
        "order": "desc",
        "per_page": max_results
    }

    try:
        response = requests.get(url, params=params, timeout=30)
    except requests.exceptions.RequestException as e:
        print(f"⚠️ GitHub request failed: {e}")
        return []

    if response.status_code != 200:
        print("⚠️ GitHub API error:", response.text)
        return []

    data = response.json()
    repos = []
    for item in data.get("items", []):
        repos.append({
            "name": item["full_name"],
            "url": item["html_url"],
            "stars": item["stargazers_count"]
        })
    return repos

# =====================================================
# RESOURCE ATTACHER
# =====================================================
def attach_resources(curriculum: Dict, subject: str) -> Dict:
    for week in curriculum.get("weeks", []):
        week["resources"] = {}
        for topic in week.get("topics", []):
            print(f"🔎 Fetching resources for: {topic}")
            youtube_query = f"{topic} {subject} tutorial beginner"
            github_query = f"{topic} {subject}"

            youtube_results = fetch_youtube_videos(youtube_query)
            github_results = fetch_github_repos(github_query)

            week["resources"][topic] = {
                "videos": youtube_results,
                "repos": github_results
            }
    return curriculum