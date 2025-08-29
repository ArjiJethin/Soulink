# Soulink

Soulink is an empathetic, AI-powered journaling app that helps people reflect on their emotions, track mental wellness, and discover personalized strategies — all in a fun and gamified way.  

## Features  
- Daily Diary with Emotion Detection → Write your thoughts and let AI detect your mood and suggest solutions if required.  
- Mental Wellness Insights → Track emotional trends over time with visuals.  
- Character Companions → Interact with fun avatars and personalities to make journaling engaging with your real life characters.  
- AI-Generated Nicknames & Tags → Reflect your unique identity with creative nicknames for yourself and your friends.  
- Gamified Dashboard → Earn streaks, badges, and rewards for consistent journaling.  

## Tech Stack  
- Frontend: React.js, Vite, CSS  
- Routing: React Router DOM  
- State & Storage: LocalStorage  
- AI & NLP: Google Generative AI API / OpenAI GPT APIs  
- Charts & Visualization: Chart.js  
- Voice Input: Web Speech API  
- Hosting: Vercel  

## How It Works  
1. User writes a diary entry (text/voice).  
2. AI analyzes the entry, detects emotions, and generates strategies.  
3. Mood + diary are stored securely in LocalStorage (no external DB).  
4. Dashboard visualizes emotional trends, streaks, and gamified stats.  
5. Avatars & nicknames personalize the experience.  

## Setup Instructions  
### 1. Clone the repo  
```bash
git clone https://github.com/your-username/Soulink.git
cd Soulink
```

### 2. Create .env file with your API key:
```bash
OPENAI_API_KEY=your_api_key_here
```
### 3.Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4.Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload
```

## Developers:
<a href="https://github.com/ArjiJethin">@Arji Jethin Naga Sai Eswar</a><p> Status: Dead</p><br> 
<a href="https://github.com/alurubalakarthikeya">@Aluru Bala Karthikeya</a><p> - Nothing beats a Jet 2 holiday</p><br>
<a href="https://github.com/Veda-1503">@Vedeshwari Nakate</a><p> aka The Einstien</p><br>
<a href="https://github.com/ayushsingh08-ds">@Ayush Singh</a><p> The Nigga</p><br>
