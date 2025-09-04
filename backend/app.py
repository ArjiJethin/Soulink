from flask import Flask, request, jsonify
from flask_cors import CORS
from textblob import TextBlob
import json
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
import requests
import uuid

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
    # For OpenRouter, we'll use requests directly since the Mistral SDK doesn't support custom base URLs properly
    mistral_client = {"api_key": MISTRAL_API_KEY, "base_url": OPENROUTER_URL}

# Ensure data folder exists
os.makedirs(DATA_FOLDER, exist_ok=True)

# Session and file management
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
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

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

# AI-powered sentiment analysis using Mistral
def analyze_sentiment_with_mistral(text):
    """Analyze sentiment using Mistral AI for more accurate results"""
    if not mistral_client:
        return analyze_sentiment_fallback(text)
    
    prompt = f"""Analyze the emotional sentiment of this journal entry and provide a detailed psychological assessment.

JOURNAL ENTRY: "{text}"

INSTRUCTIONS:
1. Identify the primary emotional state from these categories: happy, sad, angry, stressed, calm, tired
2. Rate sentiment on a scale from -1.0 (very negative) to +1.0 (very positive)
3. Rate emotional intensity: low, medium, high
4. Rate subjectivity from 0.0 (objective) to 1.0 (very subjective/emotional)
5. Identify specific emotional indicators found in the text
6. Provide confidence level in your analysis (0.0 to 1.0)

OUTPUT FORMAT (must be valid JSON):
{{
    "mood": "primary_emotional_state",
    "sentiment_score": 0.0,
    "polarity": 0.0,
    "subjectivity": 0.0,
    "intensity": "intensity_level",
    "sentiment_label": "positive/negative/neutral",
    "emotional_indicators": ["list", "of", "key", "words", "or", "phrases"],
    "confidence": 0.0,
    "reasoning": "brief explanation of analysis"
}}

Be precise and psychological in your analysis. Consider context, nuance, and underlying emotions."""

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
        
        response = requests.post(mistral_client['base_url'], headers=headers, json=payload)
        response.raise_for_status()
        
        chat_response = response.json()
        analysis_text = chat_response['choices'][0]['message']['content']
        
        # Parse JSON response
        try:
            mistral_analysis = json.loads(analysis_text)
            
            # Validate required fields
            required_fields = ['mood', 'sentiment_score', 'polarity', 'subjectivity', 'intensity', 'sentiment_label']
            if all(field in mistral_analysis for field in required_fields):
                # Convert sentiment_score to 0-1 scale
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

# Enhanced fallback sentiment analysis function
def analyze_sentiment_fallback(text):
    """Fallback sentiment analysis using TextBlob + keyword detection"""
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    subjectivity = blob.sentiment.subjectivity
    
    # Detect specific emotional keywords for more accurate classification
    text_lower = text.lower()
    
    # Emotional keyword patterns
    stress_keywords = ['stress', 'overwhelm', 'pressure', 'anxiety', 'panic', 'deadline', 'busy', 'rush', 'worry', 'tense']
    happy_keywords = ['happy', 'joy', 'excited', 'great', 'amazing', 'wonderful', 'love', 'grateful', 'blessed', 'proud']
    sad_keywords = ['sad', 'depressed', 'down', 'cry', 'hurt', 'pain', 'lonely', 'empty', 'hopeless', 'disappointed']
    calm_keywords = ['calm', 'peaceful', 'relaxed', 'quiet', 'serene', 'content', 'balanced', 'centered', 'tranquil']
    angry_keywords = ['angry', 'mad', 'furious', 'irritated', 'frustrated', 'annoyed', 'rage', 'upset', 'pissed']
    tired_keywords = ['tired', 'exhausted', 'drained', 'fatigue', 'weary', 'worn out', 'sleepy', 'burned out']
    
    # Count keyword matches
    stress_count = sum(1 for word in stress_keywords if word in text_lower)
    happy_count = sum(1 for word in happy_keywords if word in text_lower)
    sad_count = sum(1 for word in sad_keywords if word in text_lower)
    calm_count = sum(1 for word in calm_keywords if word in text_lower)
    angry_count = sum(1 for word in angry_keywords if word in text_lower)
    tired_count = sum(1 for word in tired_keywords if word in text_lower)
    
    # Determine mood based on keywords and polarity
    keyword_scores = {
        'stressed': stress_count + (0.5 if polarity < -0.2 else 0),
        'happy': happy_count + (1 if polarity > 0.3 else 0),
        'sad': sad_count + (0.8 if polarity < -0.1 else 0),
        'calm': calm_count + (0.3 if -0.1 <= polarity <= 0.1 else 0),
        'angry': angry_count + (0.7 if polarity < -0.3 else 0),
        'tired': tired_count
    }
    
    # Get the mood with highest score
    if max(keyword_scores.values()) > 0:
        mood = max(keyword_scores, key=keyword_scores.get)
    else:
        # Fallback to polarity-based mood if no keywords match
        if polarity > 0.2:
            mood = "happy"
        elif polarity > -0.1:
            mood = "calm"
        elif polarity > -0.5:
            mood = "sad"
        else:
            mood = "stressed"
    
    # Determine intensity based on subjectivity and keyword count
    max_keyword_count = max(keyword_scores.values())
    if max_keyword_count >= 3 or subjectivity > 0.8:
        intensity = "high"
    elif max_keyword_count >= 1 or subjectivity > 0.5:
        intensity = "medium"  
    else:
        intensity = "low"
    
    # Convert to 0-1 scale for sentiment score
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

# Main sentiment analysis function with Mistral integration
def analyze_sentiment(text):
    """Main sentiment analysis function - uses Mistral AI if available, falls back to TextBlob"""
    return analyze_sentiment_with_mistral(text)

# Generate AI suggestions using Mistral
def generate_ai_suggestions_mistral(content, sentiment_data, session_data):
    """Generate AI suggestions using Mistral API"""
    if not mistral_client:
        # Fallback to rule-based suggestions
        return generate_ai_suggestions_fallback(sentiment_data, content, recent_journals)
    
    # Prepare context from session data
    recent_journals = session_data.get('journals', [])[-5:]  # Last 5 entries for more context
    mood_history = [entry.get('mood', 'calm') for entry in recent_journals]
    recent_entries = [entry.get('content', '')[:100] + '...' for entry in recent_journals[-2:]]
    
    # Calculate mood trend
    if len(mood_history) >= 2:
        mood_counts = {'happy': 0, 'calm': 0, 'sad': 0, 'stressed': 0}
        for mood in mood_history:
            mood_counts[mood] = mood_counts.get(mood, 0) + 1
        dominant_mood = max(mood_counts, key=mood_counts.get)
        mood_trend = f"Recent mood pattern: {dominant_mood} (appears {mood_counts[dominant_mood]} times in last {len(mood_history)} entries)"
    else:
        mood_trend = "Not enough history for trend analysis"
    
    # Enhanced deep contextual analysis prompt
    prompt = f"""You are Dr. Elena Rodriguez, a licensed clinical psychologist and wellness coach with 15+ years of experience in cognitive behavioral therapy, trauma-informed care, and positive psychology. You specialize in analyzing personal narratives to provide deeply personalized, evidence-based interventions.

DEEP CONTEXT ANALYSIS:
📝 CURRENT JOURNAL ENTRY: "{content}"

🧠 PSYCHOLOGICAL PROFILE:
- Primary emotion: {sentiment_data['mood']} (confidence: {sentiment_data.get('confidence', 0.8):.1f})
- Emotional intensity: {sentiment_data.get('intensity', 'medium')}
- Sentiment polarity: {sentiment_data['sentiment_score']:.2f} (range: 0.0-1.0)
- Reasoning: {sentiment_data.get('reasoning', 'Basic sentiment analysis')}

📊 BEHAVIORAL PATTERNS:
- Mood progression: {mood_trend}
- Historical context: {recent_entries if recent_entries else 'First-time user - establish baseline'}
- Total reflective sessions: {len(session_data.get('journals', []))}
- Emotional keywords detected: {sentiment_data.get('emotional_indicators', [])}

DEEP ANALYSIS REQUIREMENTS:
1. **Content Analysis**: Extract specific situations, triggers, relationships, stressors, or positive events mentioned
2. **Emotional Subtext**: Identify underlying emotions beyond surface-level expressions
3. **Behavioral Patterns**: Notice recurring themes, coping mechanisms, or avoidance patterns
4. **Contextual Triggers**: Identify environmental, social, or personal factors influencing their state
5. **Strength Recognition**: Highlight resilience, positive coping, or personal growth shown

INTERVENTION STRATEGY:
Create 3 highly personalized suggestions that:
- Address the SPECIFIC situation/concern they mentioned
- Utilize evidence-based therapeutic techniques (CBT, DBT, mindfulness, somatic approaches)
- Acknowledge their unique emotional experience
- Provide concrete, actionable steps they can implement today
- Build on their existing strengths and resources
- Consider their apparent coping style and preferences

OUTPUT FORMAT (valid JSON only):
[
    {{"text": "specific intervention text", "icon": "💭"}},
    {{"text": "emotional regulation strategy text", "icon": "🧘"}},
    {{"text": "resilience building strategy text", "icon": "🌱"}}
]

EXAMPLES OF DEPTH:
❌ Generic: "Practice deep breathing when stressed"
✅ Contextual: "Since you mentioned feeling overwhelmed by work deadlines, try the 5-4-3-2-1 grounding technique when you notice your thoughts spiraling about tomorrow's presentation"

❌ Generic: "Exercise for better mood"  
✅ Contextual: "Given that you feel energized after your morning walks but struggle with evening anxiety, consider a 10-minute walking meditation after dinner to channel that restless energy productively"

❌ Generic: "Write in a gratitude journal"
✅ Contextual: "You mentioned feeling proud of helping your colleague today - this shows your natural tendency toward connection. Write down 3 specific moments when helping others brought you joy this week"

Now analyze this journal entry with the depth of a skilled therapist and provide highly personalized, situation-specific wellness interventions.

RESPOND WITH ONLY VALID JSON ARRAY - NO OTHER TEXT:
[
    {{"text": "your specific intervention here", "icon": "💭"}},
    {{"text": "your emotional regulation strategy here", "icon": "🧘"}},
    {{"text": "your resilience building strategy here", "icon": "🌱"}}
]"""
    
    try:
        # Use OpenRouter API directly with requests
        headers = {
            "Authorization": f"Bearer {mistral_client['api_key']}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",  # Optional: for OpenRouter
            "X-Title": "Soul-Link"  # Optional: for OpenRouter
        }
        
        payload = {
            "model": "mistralai/mistral-7b-instruct",
            "messages": [
                {
                    "role": "system",
                    "content": "You are Dr. Elena Rodriguez, an expert clinical psychologist. Your responses MUST be valid JSON only - absolutely no explanatory text, comments, or additional content. Return exactly 3 therapeutic suggestions as a JSON array. Each object must have 'text' and 'icon' fields. Focus on specific, actionable, evidence-based interventions tailored to the user's exact situation."
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            "max_tokens": 600,
            "temperature": 0.7
        }
        
        response = requests.post(mistral_client['base_url'], headers=headers, json=payload)
        response.raise_for_status()
        
        chat_response = response.json()
        suggestions_text = chat_response['choices'][0]['message']['content']
        
        # Try to parse JSON from response
        try:
            # Clean the response to extract valid JSON
            suggestions_text = suggestions_text.strip()
            
            # Multiple strategies to extract valid JSON
            import re
            
            # Strategy 1: Direct parsing
            try:
                parsed_response = json.loads(suggestions_text)
            except json.JSONDecodeError:
                # Strategy 2: Extract JSON array with more comprehensive cleaning
                json_match = re.search(r'\[[\s\S]*\]', suggestions_text)
                if json_match:
                    json_text = json_match.group(0)
                    
                    # Clean various non-JSON artifacts
                    json_text = re.sub(r'//.*?$', '', json_text, flags=re.MULTILINE)  # Remove line comments
                    json_text = re.sub(r'/\*.*?\*/', '', json_text, flags=re.DOTALL)  # Remove block comments
                    json_text = re.sub(r'[\r\n\t]+', ' ', json_text)  # Normalize whitespace
                    json_text = re.sub(r',(\s*[}\]])', r'\1', json_text)  # Remove trailing commas
                    
                    # Try to fix common JSON issues
                    json_text = re.sub(r'"([^"]*)"(\s*:)', r'"\1"\2', json_text)  # Fix unquoted keys
                    json_text = re.sub(r':\s*"([^"]*)"([^,}\]]*)', r': "\1"', json_text)  # Fix unquoted values
                    
                    parsed_response = json.loads(json_text)
                else:
                    # Strategy 3: Try to construct from text patterns
                    # Look for structured text patterns that suggest suggestions
                    # Improved pattern to avoid extracting colons and empty strings
                    suggestions_pattern = r'"text"\s*:\s*"([^"]{10,})"'  # At least 10 characters
                    suggestions_found = re.findall(suggestions_pattern, suggestions_text, re.IGNORECASE)
                    
                    if suggestions_found and len(suggestions_found) >= 1:
                        # Create suggestions from found text
                        parsed_response = []
                        icons = ["💭", "🧘", "🌱"]  # Default icons
                        for i, text in enumerate(suggestions_found[:3]):
                            parsed_response.append({
                                "text": text.strip(),
                                "icon": icons[i] if i < len(icons) else "💡"
                            })
                    else:
                        # If all parsing strategies fail, use fallback
                        raise json.JSONDecodeError("No valid JSON or suggestions found", suggestions_text, 0)
            
            # Handle both array and object responses
            if isinstance(parsed_response, dict) and 'suggestions' in parsed_response:
                suggestions = parsed_response['suggestions']
            elif isinstance(parsed_response, list):
                suggestions = parsed_response
            else:
                # If it's an object but not the expected format, try to extract suggestions
                suggestions = list(parsed_response.values())[0] if parsed_response else []
            
            # Validate and clean suggestions format
            if isinstance(suggestions, list) and len(suggestions) >= 1:
                valid_suggestions = []
                for suggestion in suggestions[:3]:  # Take max 3
                    if isinstance(suggestion, dict) and 'text' in suggestion:
                        text = suggestion['text'].strip()
                        
                        # Validate text content - must be meaningful
                        if len(text) >= 5 and text not in [':', '...', 'N/A', 'None']:
                            # Ensure icon is present and valid
                            if 'icon' not in suggestion or not suggestion['icon']:
                                suggestion['icon'] = "💡"
                            # Clean text of any JSON artifacts
                            suggestion['text'] = re.sub(r'["\']$', '', text)
                            valid_suggestions.append(suggestion)
                
                if len(valid_suggestions) >= 1:
                    # Pad with fallback suggestions if needed
                    while len(valid_suggestions) < 3:
                        fallback_suggestions = generate_ai_suggestions_fallback(sentiment_data, content, recent_journals)
                        for fb_suggestion in fallback_suggestions:
                            if len(valid_suggestions) < 3:
                                valid_suggestions.append(fb_suggestion)
                    
                    return valid_suggestions[:3]
            
            print(f"Invalid suggestions format from Mistral: {suggestions}")
            return generate_ai_suggestions_fallback(sentiment_data, content, recent_journals)
                
        except json.JSONDecodeError as e:
            print(f"JSON parsing error from Mistral response: {e}")
            print(f"Raw response: {suggestions_text}")
            return generate_ai_suggestions_fallback(sentiment_data, content, recent_journals)
            
    except Exception as e:
        print(f"Error calling Mistral API: {e}")
        return generate_ai_suggestions_fallback(sentiment_data, content, recent_journals)

# Fallback suggestions when AI is not available
def generate_ai_suggestions_fallback(sentiment_data, content="", recent_journals=[]):
    """Enhanced rule-based suggestions with more variety"""
    mood = sentiment_data['mood']
    polarity = sentiment_data['polarity']
    
    # More diverse suggestions based on mood and polarity
    if mood == "stressed" or polarity < -0.3:
        suggestions_pool = [
            {"text": "Try the 4-7-8 breathing technique: inhale 4, hold 7, exhale 8", "icon": "�"},
            {"text": "Take a 10-minute walk outside to clear your mind", "icon": "🚶‍♀️"},
            {"text": "Listen to calming nature sounds or meditation music", "icon": "🎵"},
            {"text": "Write down 3 things you can control right now", "icon": "✏️"},
            {"text": "Try progressive muscle relaxation starting with your toes", "icon": "🧘"},
            {"text": "Have a warm cup of herbal tea and sit quietly", "icon": "🍵"}
        ]
    elif mood == "sad" or polarity < 0:
        suggestions_pool = [
            {"text": "Call a trusted friend or family member to connect", "icon": "📞"},
            {"text": "Write down 3 things you're grateful for today", "icon": "🙏"},
            {"text": "Watch a funny video or movie that makes you smile", "icon": "😊"},
            {"text": "Do one small act of kindness for yourself", "icon": "💝"},
            {"text": "Step outside for some fresh air and sunlight", "icon": "☀️"},
            {"text": "Listen to music that matches then lifts your mood", "icon": "🎶"}
        ]
    elif mood == "happy" or polarity > 0.2:
        suggestions_pool = [
            {"text": "Share your positive energy with someone you care about", "icon": "✨"},
            {"text": "Write about what made you feel this way today", "icon": "📝"},
            {"text": "Take a photo or create something to remember this moment", "icon": "📸"},
            {"text": "Plan a small celebration or treat for yourself", "icon": "�"},
            {"text": "Use this energy to tackle a goal you've been putting off", "icon": "🎯"},
            {"text": "Send a thank you message to someone who helped you", "icon": "�"}
        ]
    else:  # calm
        suggestions_pool = [
            {"text": "Set a positive intention for the rest of your day", "icon": "🌟"},
            {"text": "Try 5 minutes of mindfulness meditation", "icon": "🧘"},
            {"text": "Reflect on one thing you learned about yourself today", "icon": "🤔"},
            {"text": "Plan one small goal you can achieve tomorrow", "icon": "🎯"},
            {"text": "Organize a small area of your space mindfully", "icon": "🏠"},
            {"text": "Practice gentle stretching or yoga poses", "icon": "🤸‍♀️"}
        ]
    
    # Analyze content for specific themes  
    content_lower = content.lower() if content else ""
    work_stress = any(word in content_lower for word in ['work', 'job', 'boss', 'deadline', 'meeting', 'office', 'colleague'])
    
    # Enhanced suggestions based on content analysis
    if work_stress and (mood == "stressed" or polarity < -0.3):
        suggestions_pool = [
            {"text": "Take a 5-minute break and step away from your workspace", "icon": "⏰"},
            {"text": "Try the Pomodoro technique: 25 min work, 5 min break", "icon": "🍅"},
            {"text": "Practice desk yoga or shoulder rolls to release tension", "icon": "🧘‍♀️"},
            {"text": "Write down your top 3 priorities to regain focus", "icon": "📝"},
            {"text": "Talk to a trusted colleague about workload concerns", "icon": "💬"},
            {"text": "Set boundaries: no work emails after a certain time", "icon": "📵"}
        ]
    
    # Add time-aware suggestions
    import datetime
    current_hour = datetime.datetime.now().hour
    
    if 6 <= current_hour < 12:  # Morning
        suggestions_pool.append({"text": "Start your day with intention and purpose", "icon": "🌅"})
    elif 12 <= current_hour < 17:  # Afternoon  
        suggestions_pool.append({"text": "Take a midday moment to check in with yourself", "icon": "☀️"})
    elif 17 <= current_hour < 22:  # Evening
        suggestions_pool.append({"text": "Reflect on the positive moments from today", "icon": "🌇"})
    else:  # Night
        suggestions_pool.append({"text": "Prepare for restful sleep with a calming routine", "icon": "🌙"})
    
    # Return 3 random suggestions from the pool
    import random
    return random.sample(suggestions_pool, 3)

# Calculate wellness metrics from session data
def calculate_wellness_metrics(session_data):
    """Calculate wellness metrics from journal entries"""
    journals = session_data.get('journals', [])
    
    if not journals:
        return {
            "wellness_score": 3,
            "mood_trend": 50,
            "total_entries": 0,
            "weekly_average": 0.5
        }
    
    # Get entries from last 7 days
    week_ago = datetime.now() - timedelta(days=7)
    recent_entries = []
    
    for journal in journals:
        entry_date = datetime.fromisoformat(journal['created_at'].replace('Z', '+00:00'))
        if entry_date >= week_ago:
            recent_entries.append(journal)
    
    if recent_entries:
        sentiment_scores = [entry['sentiment_score'] for entry in recent_entries if entry.get('sentiment_score') is not None]
        
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
        "total_entries": len(journals),
        "weekly_average": weekly_average
    }

@app.route('/api/journal', methods=['POST'])
def save_journal():
    try:
        data = request.get_json()
        content = data.get('content', '').strip()
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
            "id": len(session_data['journals']) + 1,
            "content": content,
            "sentiment_score": sentiment_data['sentiment_score'],
            "sentiment_label": sentiment_data['sentiment_label'],
            "mood": sentiment_data['mood'],
            "created_at": datetime.now().isoformat()
        }
        
        # Add to session data
        session_data['journals'].append(journal_entry)
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
        session_data['ai_interactions'].append(ai_interaction)
        
        # Save session data
        save_session_data(session_id, session_data)
        
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
        return jsonify({"error": str(e)}), 500

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
            entry_date = datetime.fromisoformat(journal['created_at']).date()
            if entry_date == today:
                todays_entries.append(journal)
        
        if todays_entries:
            # Use the most recent entry today
            latest_entry = max(todays_entries, key=lambda x: x['created_at'])
            mood = latest_entry['mood']
            
            # Generate mood message based on sentiment
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
            # Default mood if no entries today
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
            # Use most recent AI suggestions
            latest_interaction = max(ai_interactions, key=lambda x: x['timestamp'])
            suggestions = latest_interaction['suggestions']
        else:
            # Generate default suggestions
            suggestions = [
                {"text": "Start your day with journaling", "icon": "📝"},
                {"text": "Take a moment to breathe deeply", "icon": "🧘"},
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
        # List all available sessions
        sessions = []
        
        for filename in os.listdir(DATA_FOLDER):
            if filename.endswith('.json'):
                session_id = filename.replace('.json', '')
                file_path = os.path.join(DATA_FOLDER, filename)
                
                # Get file modification time
                modified_time = datetime.fromtimestamp(os.path.getmtime(file_path))
                
                # Load basic session info
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
        
        # Sort by update time (most recent first)
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
        # Load and return complete session data
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
