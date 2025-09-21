from flask import Flask, request, jsonify
from flask_cors import CORS
from textblob import TextBlob
import json
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
import requests
import uuid
import statistics
import re
import random

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
DATA_FOLDER = os.getenv('DATA_FOLDER', 'data/sessions')
MISTRAL_API_KEY = os.getenv('MISTRAL_API_KEY')

# Initialize Mistral client for OpenRouter
mistral_client = None
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
if MISTRAL_API_KEY:
    # For OpenRouter, we'll use requests directly
    mistral_client = {"api_key": MISTRAL_API_KEY, "base_url": OPENROUTER_URL}

# Ensure data folder exists
os.makedirs(DATA_FOLDER, exist_ok=True)

# -----------------------
# Session and file helpers
# -----------------------
def get_session_id():
    """Generate or get current session ID"""
    today = datetime.now().strftime("%Y-%m-%d")
    return f"session_{today}_{uuid.uuid4().hex[:8]}"

def get_session_file_path(session_id):
    """Get the file path for a session"""
    return os.path.join(DATA_FOLDER, f"{session_id}.json")

def load_session_data(session_id):
    """Load session data from JSON file"""
    file_path = get_session_file_path(session_id)
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    else:
        # Create new session structure
        return {
            "session_id": session_id,
            "created_at": datetime.now().isoformat(),
            "user_id": "default_user",
            "journals": [],
            "wellness_metrics": {
                "wellness_score": 3,
                "mood_trend": 50,
                "total_entries": 0,
                "weekly_average": 0.5
            },
            "mood_history": [],
            "ai_interactions": []
        }

def save_session_data(session_id, data):
    """Save session data to JSON file"""
    file_path = get_session_file_path(session_id)
    data["updated_at"] = datetime.now().isoformat()
    # Write file and log details for debugging
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    try:
        print(f"[save_session_data] Saved session '{session_id}' -> {file_path} (journals={len(data.get('journals', []))})")
    except Exception:
        # Avoid crashing on logging
        print("[save_session_data] Saved session (could not compute journal count)")

def get_current_session_id():
    """Get or create current session ID for today"""
    today = datetime.now().strftime("%Y-%m-%d")
    session_files = [f for f in os.listdir(DATA_FOLDER) if f.startswith(f"session_{today}")]
    
    if session_files:
        # Use the most recent session for today
        latest_file = max(session_files, key=lambda x: os.path.getctime(os.path.join(DATA_FOLDER, x)))
        return latest_file.replace('.json', '')
    else:
        # Create new session for today
        return get_session_id()

# -----------------------
# Sentiment / AI helpers
# -----------------------
def analyze_sentiment_fallback(text):
    """Fallback sentiment analysis using TextBlob + keyword detection"""
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    subjectivity = blob.sentiment.subjectivity
    
    text_lower = text.lower()
    
    stress_keywords = ['stress', 'overwhelm', 'pressure', 'anxiety', 'panic', 'deadline', 'busy', 'rush', 'worry', 'tense']
    happy_keywords = ['happy', 'joy', 'excited', 'great', 'amazing', 'wonderful', 'love', 'grateful', 'blessed', 'proud']
    sad_keywords = ['sad', 'depressed', 'down', 'cry', 'hurt', 'pain', 'lonely', 'empty', 'hopeless', 'disappointed']
    calm_keywords = ['calm', 'peaceful', 'relaxed', 'quiet', 'serene', 'content', 'balanced', 'centered', 'tranquil']
    angry_keywords = ['angry', 'mad', 'furious', 'irritated', 'frustrated', 'annoyed', 'rage', 'upset', 'pissed']
    tired_keywords = ['tired', 'exhausted', 'drained', 'fatigue', 'weary', 'worn out', 'sleepy', 'burned out']
    
    stress_count = sum(1 for word in stress_keywords if word in text_lower)
    happy_count = sum(1 for word in happy_keywords if word in text_lower)
    sad_count = sum(1 for word in sad_keywords if word in text_lower)
    calm_count = sum(1 for word in calm_keywords if word in text_lower)
    angry_count = sum(1 for word in angry_keywords if word in text_lower)
    tired_count = sum(1 for word in tired_keywords if word in text_lower)
    
    keyword_scores = {
        'stressed': stress_count + (0.5 if polarity < -0.2 else 0),
        'happy': happy_count + (1 if polarity > 0.3 else 0),
        'sad': sad_count + (0.8 if polarity < -0.1 else 0),
        'calm': calm_count + (0.3 if -0.1 <= polarity <= 0.1 else 0),
        'angry': angry_count + (0.7 if polarity < -0.3 else 0),
        'tired': tired_count
    }
    
    if max(keyword_scores.values()) > 0:
        mood = max(keyword_scores, key=keyword_scores.get)
    else:
        if polarity > 0.2:
            mood = "happy"
        elif polarity > -0.1:
            mood = "calm"
        elif polarity > -0.5:
            mood = "sad"
        else:
            mood = "stressed"
    
    max_keyword_count = max(keyword_scores.values())
    if max_keyword_count >= 3 or subjectivity > 0.8:
        intensity = "high"
    elif max_keyword_count >= 1 or subjectivity > 0.5:
        intensity = "medium"
    else:
        intensity = "low"
    
    sentiment_score = (polarity + 1) / 2
    
    return {
        "sentiment_score": sentiment_score,
        "sentiment_label": "positive" if polarity > 0.1 else "negative" if polarity < -0.1 else "neutral",
        "mood": mood,
        "polarity": polarity,
        "subjectivity": subjectivity,
        "intensity": intensity,
        "keyword_matches": {k: v for k, v in keyword_scores.items() if v > 0},
        "analysis_method": "textblob_keywords"
    }

def analyze_sentiment_with_mistral(text):
    """Analyze sentiment using Mistral AI for more accurate results"""
    if not mistral_client:
        return analyze_sentiment_fallback(text)
    
    # Use a non-f-string template to avoid Python formatting errors caused by
    # literal JSON braces in the template. We'll safely replace the placeholder
    # with the (escaped) journal text.
    prompt_template = """Analyze the emotional sentiment of this journal entry and provide a detailed psychological assessment.

JOURNAL ENTRY: "{text}"

INSTRUCTIONS:
1. Identify the primary emotional state from these categories: happy, sad, angry, stressed, calm, tired
2. Rate sentiment on a scale from -1.0 (very negative) to +1.0 (very positive)
3. Rate emotional intensity: low, medium, high
4. Rate subjectivity from 0.0 (objective) to 1.0 (very subjective/emotional)
5. Identify specific emotional indicators found in the text
6. Provide confidence level in your analysis (0.0 to 1.0)

OUTPUT FORMAT (must be valid JSON):
{
    "mood": "primary_emotional_state",
    "sentiment_score": 0.0,
    "polarity": 0.0,
    "subjectivity": 0.0,
    "intensity": "intensity_level",
    "sentiment_label": "positive/negative/neutral",
    "emotional_indicators": ["list", "of", "key", "words", "or", "phrases"],
    "confidence": 0.0,
    "reasoning": "brief explanation of analysis"
}

Be precise and psychological in your analysis. Consider context, nuance, and underlying emotions."""

    # Escape double-quotes in the entry so the prompt remains valid JSON-like text
    safe_text = text.replace('"', '\\"') if isinstance(text, str) else str(text)
    prompt = prompt_template.replace('{text}', safe_text)
    try:
        headers = {
            "Authorization": f"Bearer {mistral_client['api_key']}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Soul-Link-Sentiment"
        }
        
        payload = {
            "model": "mistralai/mistral-7b-instruct",
            "messages": [
                {
                    "role": "system",
                    "content": "You are an expert emotional intelligence psychologist. Always respond with valid JSON containing the exact fields requested. Be precise and insightful in emotional analysis."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": 400,
            "temperature": 0.3
        }
        
        response = requests.post(mistral_client['base_url'], headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        
        chat_response = response.json()
        analysis_text = chat_response['choices'][0]['message']['content']
        
        try:
            mistral_analysis = json.loads(analysis_text)
            required_fields = ['mood', 'sentiment_score', 'polarity', 'subjectivity', 'intensity', 'sentiment_label']
            if all(field in mistral_analysis for field in required_fields):
                polarity = float(mistral_analysis['polarity'])
                sentiment_score = (polarity + 1) / 2
                return {
                    "sentiment_score": sentiment_score,
                    "sentiment_label": mistral_analysis['sentiment_label'],
                    "mood": mistral_analysis['mood'],
                    "polarity": polarity,
                    "subjectivity": float(mistral_analysis['subjectivity']),
                    "intensity": mistral_analysis['intensity'],
                    "emotional_indicators": mistral_analysis.get('emotional_indicators', []),
                    "confidence": mistral_analysis.get('confidence', 0.8),
                    "reasoning": mistral_analysis.get('reasoning', ''),
                    "analysis_method": "mistral_ai"
                }
            else:
                print(f"Missing required fields in Mistral response: {mistral_analysis}")
                return analyze_sentiment_fallback(text)
        except json.JSONDecodeError as e:
            print(f"JSON parsing error from Mistral sentiment analysis: {e}")
            print(f"Raw response: {analysis_text}")
            return analyze_sentiment_fallback(text)
    except Exception as e:
        print(f"Error calling Mistral for sentiment analysis: {e}")
        return analyze_sentiment_fallback(text)

def analyze_sentiment(text):
    """Main sentiment analysis function - uses Mistral AI if available, falls back to TextBlob"""
    return analyze_sentiment_with_mistral(text)

# -----------------------
# Questionnaire analyzer
# -----------------------
def analyze_questionnaire(answers):
    """
    Convert Likert answers to a sentiment-like score and related metrics.
    `answers` expected to be a list (ordered) of responses like:
      ["Agree", "Neutral", "Disagree", ...]
    Returns a dict with sentiment_score (0-1), sentiment_label, mood, intensity, and raw stats.
    """
    if not answers or not isinstance(answers, (list, tuple)):
        return {
            "sentiment_score": 0.5,
            "sentiment_label": "neutral",
            "mood": "neutral",
            "intensity": "low",
            "analysis_method": "questionnaire_likert_simple",
            "details": {}
        }

    # Map Likert to numeric 1..5
    likert_map = {
        "Strongly Disagree": 1,
        "Disagree": 2,
        "Neutral": 3,
        "Agree": 4,
        "Strongly Agree": 5
    }

    # Indices that are negatively worded and should be reverse-scored
    # (0-based indices based on the frontend question order)
    negative_indices = {2, 4, 6, 9, 11, 13}

    numeric_scores = []
    for i, ans in enumerate(answers):
        val = likert_map.get(ans, None)
        if val is None:
            # treat missing/unrecognized as neutral
            val = 3
        # Normalize to 0..1
        norm = (val - 1) / 4.0
        if i in negative_indices:
            norm = 1.0 - norm  # reverse-coded
        numeric_scores.append(norm)

    # Aggregate
    avg = sum(numeric_scores) / len(numeric_scores)
    try:
        stddev = statistics.pstdev(numeric_scores) if len(numeric_scores) > 1 else 0.0
    except Exception:
        stddev = 0.0

    # sentiment_label thresholds
    if avg >= 0.66:
        label = "positive"
        mood = "happy"
    elif avg >= 0.45:
        label = "neutral"
        mood = "calm"
    elif avg >= 0.25:
        label = "negative"
        mood = "sad"
    else:
        label = "negative"
        mood = "stressed"

    # intensity based on variability and closeness to extremes
    if stddev > 0.28 or abs(avg - 0.5) > 0.3:
        intensity = "high"
    elif stddev > 0.12 or abs(avg - 0.5) > 0.15:
        intensity = "medium"
    else:
        intensity = "low"

    return {
        "sentiment_score": round(avg, 3),
        "sentiment_label": label,
        "mood": mood,
        "intensity": intensity,
        "stddev": round(stddev, 3),
        "analysis_method": "questionnaire_likert_simple",
        "details": {
            "numeric_scores": [round(s, 3) for s in numeric_scores],
            "count": len(numeric_scores)
        }
    }

# -----------------------
# AI suggestions (Mistral + fallback)
# -----------------------
def generate_ai_suggestions_fallback(sentiment_data, content="", recent_journals=None):
    """Enhanced rule-based suggestions without meditation as the second suggestion."""
    recent_journals = recent_journals or []
    mood = sentiment_data.get('mood', 'calm')
    polarity = sentiment_data.get('polarity', sentiment_data.get('sentiment_score', 0.5) * 2 - 1)

    # Prepare suggestions pools with helpful, actionable alternatives (no meditation as second item)
    if mood == "stressed" or polarity < -0.3:
        suggestions_pool = [
            {"text": "Try the 4-7-8 breathing technique: inhale 4, hold 7, exhale 8", "icon": "🫁"},
            {"text": "Write down 3 concrete next actions to regain control (small, achievable steps)", "icon": "📝"},
            {"text": "Take a 10-minute walk outside to clear your mind and reset", "icon": "🚶‍♀️"},
            {"text": "Write down what you can delegate or postpone to reduce pressure", "icon": "📤"},
            {"text": "Try progressive muscle relaxation starting with your toes", "icon": "💆‍♂️"},
            {"text": "Have a warm cup of herbal tea and pause for 5 minutes", "icon": "🍵"}
        ]
    elif mood == "sad" or polarity < 0:
        suggestions_pool = [
            {"text": "Call a trusted friend or family member to connect", "icon": "📞"},
            {"text": "Write down 3 things you're grateful for today", "icon": "🙏"},
            {"text": "Watch a funny video or movie that makes you smile", "icon": "😊"},
            {"text": "Do one small act of kindness for yourself", "icon": "💝"},
            {"text": "Step outside for fresh air and sunlight", "icon": "☀️"},
            {"text": "Listen to music that matches then lifts your mood", "icon": "🎶"}
        ]
    elif mood == "happy" or polarity > 0.2:
        suggestions_pool = [
            {"text": "Share your positive energy with someone you care about", "icon": "✨"},
            {"text": "Write about what made you feel this way today to reinforce it", "icon": "📝"},
            {"text": "Take a photo or create something to remember this moment", "icon": "📸"},
            {"text": "Plan a small celebration or treat for yourself", "icon": "🎉"},
            {"text": "Use this energy to tackle a goal you've been putting off", "icon": "🎯"},
            {"text": "Send a thank you message to someone who helped you", "icon": "💌"}
        ]
    else:  # calm / neutral
        suggestions_pool = [
            {"text": "Set a positive intention for the rest of your day", "icon": "🌟"},
            {"text": "Write down one achievement from today and why it mattered", "icon": "📝"},  # replaced meditation
            {"text": "Reflect on one thing you learned about yourself today", "icon": "🤔"},
            {"text": "Plan one small goal you can achieve tomorrow", "icon": "🎯"},
            {"text": "Organize a small area of your space mindfully", "icon": "🏠"},
            {"text": "Practice gentle stretching or a short walk to stay present", "icon": "🤸‍♀️"}
        ]

    content_lower = (content or "").lower()
    work_stress = any(word in content_lower for word in ['work', 'job', 'boss', 'deadline', 'meeting', 'office', 'colleague'])

    # If content suggests work stress and mood is stressed, inject more work-focused suggestions
    if work_stress and (mood == "stressed" or polarity < -0.3):
        work_pool = [
            {"text": "Take a 5-minute break and step away from your workspace", "icon": "⏰"},
            {"text": "Use the Pomodoro technique: 25 min focused work, 5 min break", "icon": "🍅"},
            {"text": "Write down your top 3 priorities to regain focus", "icon": "📝"},
            {"text": "Talk to a trusted colleague about workload concerns", "icon": "💬"},
            {"text": "Set a clear boundary: no work emails after a certain hour", "icon": "📵"},
            {"text": "Do a 2-minute desk stretch to release tension", "icon": "🧍‍♂️"}
        ]
        # Combine and randomize to give variety
        suggestions_pool = work_pool + suggestions_pool

    # Add time-aware suggestion
    current_hour = datetime.now().hour
    if 6 <= current_hour < 12:
        suggestions_pool.append({"text": "Start your day with intention and purpose", "icon": "🌅"})
    elif 12 <= current_hour < 17:
        suggestions_pool.append({"text": "Take a midday moment to check in with yourself", "icon": "☀️"})
    elif 17 <= current_hour < 22:
        suggestions_pool.append({"text": "Reflect on the positive moments from today", "icon": "🌇"})
    else:
        suggestions_pool.append({"text": "Prepare for restful sleep with a calming routine", "icon": "🌙"})

    # Return 3 suggestions randomized but deterministic enough
    try:
        if len(suggestions_pool) <= 3:
            return suggestions_pool
        return random.sample(suggestions_pool, 3)
    except Exception:
        # Fallback simple suggestions
        return [
            {"text": "Take a short break and notice your breath", "icon": "🫁"},
            {"text": "Write one small action you can take now", "icon": "📝"},
            {"text": "Connect with someone who cares about you", "icon": "🤝"}
        ]

def generate_ai_suggestions_mistral(content, sentiment_data, session_data):
    """Generate AI suggestions using Mistral API (OpenRouter). Falls back safely.

    This function now gathers recent context from both `journals` and `questionnaires` so
    questionnaire submissions will be considered when producing suggestions.
    """
    # Prepare context from session data: combine journals and questionnaires
    journals = session_data.get('journals', [])
    questionnaires = session_data.get('questionnaires', [])

    # Convert questionnaires to journal-like snippets for context
    combined_entries = []
    for j in journals:
        combined_entries.append({
            'content': j.get('content', ''),
            'mood': j.get('mood', ''),
            'created_at': j.get('created_at')
        })
    for q in questionnaires:
        answers = q.get('answers', [])
        # Create a short content summary for the questionnaire
        content_summary = 'Questionnaire responses: ' + '; '.join([str(a) for a in answers])
        q_mood = q.get('sentiment_analysis', {}).get('mood', '')
        combined_entries.append({
            'content': content_summary,
            'mood': q_mood,
            'created_at': q.get('created_at')
        })

    # Sort by created_at and take last 5 entries for context
    def parse_date_safe(dt):
        if not dt:
            return datetime.fromtimestamp(0)
        try:
            return datetime.fromisoformat(dt.replace('Z', '+00:00'))
        except Exception:
            try:
                return datetime.fromisoformat(dt)
            except Exception:
                return datetime.fromtimestamp(0)

    combined_entries_sorted = sorted(combined_entries, key=lambda x: parse_date_safe(x.get('created_at')), reverse=True)
    recent_journals = combined_entries_sorted[:5]

    if not mistral_client:
        return generate_ai_suggestions_fallback(sentiment_data, content, recent_journals)
    
    mood_history = [entry.get('mood', 'calm') for entry in combined_entries]
    recent_entries = [entry.get('content', '')[:100] + '...' for entry in recent_journals[:2]]
    
    # Calculate mood trend
    if len(mood_history) >= 2:
        mood_counts = {}
        for mood in mood_history:
            mood_counts[mood] = mood_counts.get(mood, 0) + 1
        dominant_mood = max(mood_counts, key=mood_counts.get)
        mood_trend = f"Recent mood pattern: {dominant_mood} (appears {mood_counts[dominant_mood]} times in last {len(mood_history)} entries)"
    else:
        mood_trend = "Not enough history for trend analysis"
    
    prompt = f"""You are Dr. Elena Rodriguez, a licensed clinical psychologist and wellness coach with 15+ years of experience in CBT and positive psychology.

CURRENT ENTRY:
{content}

PROFILE:
- Primary emotion: {sentiment_data.get('mood')}
- Intensity: {sentiment_data.get('intensity')}
- Mood trend: {mood_trend}
- Recent snippets: {recent_entries if recent_entries else 'none'}

Task: Provide exactly 3 personalized, actionable suggestions tailored to this person's entry. Output MUST be valid JSON array with 3 objects: each object must have 'text' and 'icon' keys.

Return only JSON."""

    try:
        headers = {
            "Authorization": f"Bearer {mistral_client['api_key']}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Soul-Link"
        }
        payload = {
            "model": "mistralai/mistral-7b-instruct",
            "messages": [
                {"role": "system", "content": "You are an expert clinical psychologist. Respond with only valid JSON array of 3 objects, each with 'text' and 'icon'."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 600,
            "temperature": 0.7
        }

        response = requests.post(mistral_client['base_url'], headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        chat_response = response.json()
        # Get the model's text output safely
        suggestions_text = None
        try:
            suggestions_text = chat_response['choices'][0]['message']['content']
        except Exception:
            # Try alternate keys (defensive)
            try:
                suggestions_text = chat_response['choices'][0]['text']
            except Exception:
                suggestions_text = str(chat_response)

        # Debug: log a truncated raw model response so we can inspect problems
        try:
            print("[generate_ai_suggestions_mistral] raw model output (truncated 2000 chars):", suggestions_text[:2000])
        except Exception:
            print("[generate_ai_suggestions_mistral] raw model output: <unprintable>")

        # Try to extract JSON array from the model's response
        suggestions_text = (suggestions_text or "").strip()
        parsed_response = None

        # 1) Look for a JSON array anywhere in the text
        match = re.search(r'\[[\s\S]*\]', suggestions_text)
        if match:
            json_text = match.group(0)
            # Cleanup common non-JSON artifacts
            json_text = re.sub(r'//.*?$', '', json_text, flags=re.MULTILINE)
            json_text = re.sub(r'/\*.*?\*/', '', json_text, flags=re.DOTALL)
            json_text = re.sub(r'[\r\n\t]+', ' ', json_text)
            json_text = re.sub(r',(\s*[}\]])', r'\1', json_text)
            try:
                parsed_response = json.loads(json_text)
            except json.JSONDecodeError:
                try:
                    parsed_response = json.loads(json_text.replace("'", '"'))
                except Exception:
                    parsed_response = None

        # 2) If no array found, try to parse the whole text as JSON
        if parsed_response is None:
            try:
                parsed_response = json.loads(suggestions_text)
            except Exception:
                parsed_response = None

        # 3) Try ast.literal_eval as a last-ditch attempt for Python-like dicts
        if parsed_response is None:
            try:
                import ast
                maybe = suggestions_text
                # Replace smart quotes
                maybe = maybe.replace('“', '"').replace('”', '"').replace("‘", "'").replace("’", "'")
                parsed_response = ast.literal_eval(maybe)
            except Exception:
                parsed_response = None

        # Debug: log parse outcome
        try:
            print("[generate_ai_suggestions_mistral] parsed_response type:", type(parsed_response), "value (truncated):", str(parsed_response)[:1000])
        except Exception:
            pass

        if isinstance(parsed_response, list) and len(parsed_response) >= 1:
            # Normalize and ensure 3 items
            valid = []
            for item in parsed_response:
                if isinstance(item, dict) and 'text' in item:
                    text = str(item.get('text', '')).strip()
                    icon = item.get('icon') or "💡"
                    if len(text) >= 5:
                        valid.append({"text": text, "icon": icon})
            # Pad or truncate
            while len(valid) < 3:
                filler = generate_ai_suggestions_fallback(sentiment_data, content, recent_journals)
                for f in filler:
                    if len(valid) < 3 and f not in valid:
                        valid.append(f)
            return valid[:3]
        else:
            # Fallback
            return generate_ai_suggestions_fallback(sentiment_data, content, recent_journals)
    except Exception as e:
        print(f"Error calling Mistral API for suggestions: {e}")
        return generate_ai_suggestions_fallback(sentiment_data, content, recent_journals)

# -----------------------
# Wellness metrics
# -----------------------
def calculate_wellness_metrics(session_data):
    """Calculate wellness metrics from journal entries and questionnaires"""
    journals = session_data.get('journals', [])
    questionnaires = session_data.get('questionnaires', [])
    
    all_entries = []
    for j in journals:
        all_entries.append({
            'created_at': j.get('created_at'),
            'sentiment_score': j.get('sentiment_score')
        })
    for q in questionnaires:
        sa = q.get('sentiment_analysis', {})
        all_entries.append({
            'created_at': q.get('created_at'),
            'sentiment_score': sa.get('sentiment_score')
        })
    
    if not all_entries:
        return {
            "wellness_score": 3,
            "mood_trend": 50,
            "total_entries": 0,
            "weekly_average": 0.5
        }

    week_ago = datetime.now() - timedelta(days=7)
    recent_entries = []

    for entry in all_entries:
        try:
            entry_date = datetime.fromisoformat(entry['created_at'].replace('Z', '+00:00'))
        except Exception:
            try:
                entry_date = datetime.fromisoformat(entry['created_at'])
            except Exception:
                continue
        if entry_date >= week_ago:
            recent_entries.append(entry)

    if recent_entries:
        sentiment_scores = [e.get('sentiment_score') for e in recent_entries if e.get('sentiment_score') is not None]
        if sentiment_scores:
            weekly_average = sum(sentiment_scores) / len(sentiment_scores)
            wellness_score = min(5, max(1, int(weekly_average * 5) + 1))
            mood_trend = int(weekly_average * 100)
        else:
            weekly_average = 0.5
            wellness_score = 3
            mood_trend = 50
    else:
        weekly_average = 0.5
        wellness_score = 3
        mood_trend = 50

    return {
        "wellness_score": wellness_score,
        "mood_trend": mood_trend,
        "total_entries": len(all_entries),
        "weekly_average": weekly_average
    }

# -----------------------
# API Endpoints
# -----------------------
@app.route('/api/journal', methods=['POST'])
def save_journal():
    try:
        data = request.get_json()
        if not data or not isinstance(data, dict):
            return jsonify({"error": "Invalid or missing JSON body"}), 400

        content = (data.get('content') or '').strip()
        user_id = data.get('user_id', 'default_user')
        session_id = data.get('session_id') or get_current_session_id()

        if not content:
            return jsonify({"error": "Content is required"}), 400

        # Load session data
        session_data = load_session_data(session_id)

        # Analyze sentiment
        sentiment_data = analyze_sentiment(content)

        # Create journal entry
        journal_entry = {
            "id": len(session_data.get('journals', [])) + 1,
            "content": content,
            "sentiment_score": sentiment_data.get('sentiment_score'),
            "sentiment_label": sentiment_data.get('sentiment_label'),
            "mood": sentiment_data.get('mood'),
            "created_at": datetime.now().isoformat()
        }

        # Add to session data
        session_data.setdefault('journals', []).append(journal_entry)
        session_data['user_id'] = user_id

        # Generate AI suggestions using Mistral
        ai_suggestions = generate_ai_suggestions_mistral(content, sentiment_data, session_data)

        # Calculate updated wellness metrics
        wellness_metrics = calculate_wellness_metrics(session_data)
        session_data['wellness_metrics'] = wellness_metrics

        # Record AI interaction
        ai_interaction = {
            "timestamp": datetime.now().isoformat(),
            "journal_entry_id": journal_entry["id"],
            "suggestions": ai_suggestions,
            "sentiment_data": sentiment_data
        }
        session_data.setdefault('ai_interactions', []).append(ai_interaction)

        # Save session data (and log)
        save_session_data(session_id, session_data)
        print(f"[save_journal] Session '{session_id}' now has {len(session_data.get('journals', []))} journals")

        return jsonify({
            "success": True,
            "session_id": session_id,
            "journal_id": journal_entry["id"],
            "sentiment_analysis": sentiment_data,
            "ai_suggestions": ai_suggestions,
            "wellness_metrics": wellness_metrics,
            "message": "Journal entry saved successfully"
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Internal server error", "detail": str(e)}), 500

@app.route('/api/questionnaire', methods=['POST'])
def save_questionnaire():
    try:
        data = request.get_json()
        if not data or not isinstance(data, dict):
            return jsonify({"error": "Invalid or missing JSON body"}), 400

        answers = data.get('answers', [])
        user_id = data.get('user_id', 'default_user')
        session_id = data.get('session_id') or get_current_session_id()

        if not answers or not isinstance(answers, (list, tuple)) or len(answers) == 0:
            return jsonify({"error": "Answers are required"}), 400

        # Load session data
        session_data = load_session_data(session_id)

        # Analyze answers (convert Likert scale to sentiment-ish values)
        sentiment_data = analyze_questionnaire(answers)

        # Create questionnaire entry
        questionnaire_entry = {
            "id": len(session_data.get('questionnaires', [])) + 1,
            "answers": answers,
            "sentiment_analysis": sentiment_data,
            "created_at": datetime.now().isoformat()
        }

        # Add to session data
        if "questionnaires" not in session_data:
            session_data["questionnaires"] = []
        session_data["questionnaires"].append(questionnaire_entry)
        session_data["user_id"] = user_id

        # Generate AI suggestions using Mistral (now considers questionnaires too)
        # Create a short content summary for the questionnaire to pass into the generator
        content_summary = 'Questionnaire: ' + '; '.join([str(a) for a in answers])
        ai_suggestions = generate_ai_suggestions_mistral(content_summary, sentiment_data, session_data)

        # Calculate updated wellness metrics
        wellness_metrics = calculate_wellness_metrics(session_data)
        session_data['wellness_metrics'] = wellness_metrics

        # Record AI interaction (tagged as questionnaire)
        ai_interaction = {
            "timestamp": datetime.now().isoformat(),
            "questionnaire_entry_id": questionnaire_entry["id"],
            "entry_type": "questionnaire",
            "suggestions": ai_suggestions,
            "sentiment_data": sentiment_data
        }
        session_data['ai_interactions'].append(ai_interaction)

        # Save session data
        save_session_data(session_id, session_data)

        return jsonify({
            "success": True,
            "session_id": session_id,
            "questionnaire_id": questionnaire_entry["id"],
            "sentiment_analysis": sentiment_data,
            "ai_suggestions": ai_suggestions,
            "wellness_metrics": wellness_metrics,
            "message": "Questionnaire responses saved successfully"
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Internal server error", "detail": str(e)}), 500

@app.route('/api/dashboard/mood', methods=['GET'])
def get_todays_mood():
    try:
        user_id = request.args.get('user_id', 'default_user')
        session_id = request.args.get('session_id') or get_current_session_id()
        
        # Load session data
        session_data = load_session_data(session_id)
        
        # Get today's entries
        today = datetime.now().date()
        todays_entries = []
        
        for journal in session_data.get('journals', []):
            try:
                entry_date = datetime.fromisoformat(journal['created_at']).date()
            except Exception:
                continue
            if entry_date == today:
                todays_entries.append(journal)
        
        if todays_entries:
            latest_entry = max(todays_entries, key=lambda x: x['created_at'])
            mood = latest_entry.get('mood', 'neutral')
            
            if mood == "happy":
                message = "You're radiating positivity today!"
                encouragement = "Keep spreading that joy!"
            elif mood == "calm":
                message = "You seem peaceful and centered"
                encouragement = "Your balance is inspiring!"
            elif mood == "sad":
                message = "It seems like a tough day"
                encouragement = "Tomorrow is a new beginning!"
            else:  # stressed
                message = "You seem overwhelmed today"
                encouragement = "Take it one step at a time!"
        else:
            mood = "neutral"
            message = "How are you feeling today?"
            encouragement = "Your mood matters to us!"
        
        return jsonify({
            "session_id": session_id,
            "mood": mood,
            "message": message,
            "encouragement": encouragement,
            "has_entry_today": len(todays_entries) > 0
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/dashboard/suggestions', methods=['GET'])
def get_ai_suggestions():
    try:
        user_id = request.args.get('user_id', 'default_user')
        session_id = request.args.get('session_id') or get_current_session_id()
        
        # Load session data
        session_data = load_session_data(session_id)
        
        # Get latest AI interaction or generate new suggestions
        ai_interactions = session_data.get('ai_interactions', [])
        
        if ai_interactions:
            latest_interaction = max(ai_interactions, key=lambda x: x['timestamp'])
            suggestions = latest_interaction.get('suggestions', [])
        else:
            suggestions = [
                {"text": "Start your day with journaling", "icon": "📝"},
                {"text": "Take a moment to notice one thing you accomplished", "icon": "✅"},  # replaced meditation suggestion
                {"text": "Set a positive intention for today", "icon": "🌟"}
            ]
        
        return jsonify({
            "session_id": session_id,
            "suggestions": suggestions,
            "generated_at": datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/dashboard/wellness', methods=['GET'])
def get_wellness_dashboard():
    try:
        user_id = request.args.get('user_id', 'default_user')
        session_id = request.args.get('session_id') or get_current_session_id()
        
        # Load session data
        session_data = load_session_data(session_id)
        
        # Calculate wellness metrics
        wellness_metrics = calculate_wellness_metrics(session_data)
        
        return jsonify({
            "session_id": session_id,
            "wellness_data": wellness_metrics,
            "updated_at": datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/journals', methods=['GET'])
def get_journals():
    try:
        user_id = request.args.get('user_id', 'default_user')
        session_id = request.args.get('session_id') or get_current_session_id()
        limit = int(request.args.get('limit', 10))
        
        # Load session data
        session_data = load_session_data(session_id)
        
        # Get journals (most recent first)
        journals = session_data.get('journals', [])
        journals_sorted = sorted(journals, key=lambda x: x['created_at'], reverse=True)
        limited_journals = journals_sorted[:limit]
        
        return jsonify({
            "session_id": session_id,
            "journals": limited_journals,
            "total": len(journals)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/sessions', methods=['GET'])
def get_sessions():
    try:
        sessions = []
        
        for filename in os.listdir(DATA_FOLDER):
            if filename.endswith('.json'):
                session_id = filename.replace('.json', '')
                file_path = os.path.join(DATA_FOLDER, filename)
                modified_time = datetime.fromtimestamp(os.path.getmtime(file_path))
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        session_data = json.load(f)
                    sessions.append({
                        "session_id": session_id,
                        "created_at": session_data.get('created_at'),
                        "updated_at": session_data.get('updated_at', modified_time.isoformat()),
                        "total_entries": len(session_data.get('journals', [])),
                        "user_id": session_data.get('user_id', 'default_user')
                    })
                except:
                    continue
        
        sessions.sort(key=lambda x: x['updated_at'], reverse=True)
        
        return jsonify({
            "sessions": sessions,
            "total": len(sessions)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/session/<session_id>', methods=['GET'])
def get_session_data(session_id):
    try:
        session_data = load_session_data(session_id)
        return jsonify({
            "success": True,
            "session_data": session_data
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "message": "Soul Link API is running",
        "timestamp": datetime.now().isoformat(),
        "storage": "JSON files",
        "ai_provider": "Mistral AI" if mistral_client else "Rule-based fallback"
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
