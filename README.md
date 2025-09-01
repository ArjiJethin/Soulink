# Soul Link - AI-Powered Wellness Journal

A beautiful, dark-themed wellness journaling app with AI-powered mood analysis and personalized suggestions.

## 🌟 Features

### Frontend

- **Dark Theme**: Beautiful dark UI optimized for comfortable writing
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Real-time Dashboard**: Live mood tracking, AI suggestions, and wellness metrics
- **Journal Interface**: Clean, distraction-free writing experience with word count
- **Characters & Achievements**: Gamified wellness tracking with progress indicators

### Backend

- **AI-Powered Analysis**: Sentiment analysis using TextBlob and Mistral AI
- **JSON Storage**: Simple file-based data storage (no database required)
- **Mood Tracking**: Automatic mood detection from journal entries
- **Wellness Metrics**: Daily/weekly/monthly wellness scoring and insights
- **RESTful API**: Clean API endpoints for all functionality

## 🚀 Quick Start

### Prerequisites

- Node.js 20.19+ or 22.12+
- Python 3.8+
- Mistral AI API key (optional - app works with fallback suggestions)

### Backend Setup

1. **Navigate to backend directory**

   ```bash
   cd backend
   ```

2. **Run setup script**

   ```bash
   python setup_backend.py
   ```

3. **Add your Mistral API key** (Optional)

   ```bash
   # Edit .env file
   MISTRAL_API_KEY=your_mistral_api_key_here
   ```

   Get your API key from: https://console.mistral.ai/

4. **Start the backend server**
   ```bash
   python app.py
   ```
   Backend will be available at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**

   ```bash
   cd frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   Frontend will be available at `http://localhost:5173` (or next available port)

## 📁 Project Structure

```
Soul-Link/
├── backend/
│   ├── app.py                 # Flask API server
│   ├── requirements.txt       # Python dependencies
│   ├── setup_backend.py      # Automated setup script
│   ├── .env                  # Environment variables
│   ├── .env.example          # Environment template
│   └── data/                 # JSON data storage
│       └── session_*.json    # User session data
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── Navbar.jsx
│   │   │   └── comp-styles/  # Component stylesheets
│   │   ├── pages/           # Page components
│   │   │   ├── Landing.jsx   # Homepage
│   │   │   ├── dashboard.jsx # Main dashboard
│   │   │   ├── Journal.jsx   # Journal writing page
│   │   │   ├── Preferences.jsx
│   │   │   └── page-styles/ # Page stylesheets
│   │   ├── assets/          # Images and icons
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🔧 API Endpoints

### Health Check

```
GET /api/health
```

### Journal Operations

```
POST /api/journal          # Save journal entry
GET /api/journals          # Get journal entries
```

### Dashboard Data

```
GET /api/dashboard/mood         # Get today's mood
GET /api/dashboard/suggestions  # Get AI suggestions
GET /api/dashboard/wellness     # Get wellness metrics
```

### Session Management

```
GET /api/sessions          # List all sessions
GET /api/session/{id}      # Get specific session data
```

## 🎨 Design Features

### Dark Theme

- Consistent dark color scheme across all components
- High contrast text for accessibility
- Smooth transitions and hover effects
- Eye-friendly color palette for extended use

### Responsive Design

- **Desktop**: Full dashboard layout with side navigation
- **Tablet**: Optimized card layouts with collapsible elements
- **Mobile**: Stack layout with touch-friendly controls
- **Breakpoints**: 1200px, 768px, 480px, 360px

### Dashboard Components

- **Mood Tracker**: Real-time sentiment analysis display
- **AI Suggestions**: Personalized recommendations
- **Wellness Metrics**: Progress tracking and insights
- **Quick Stats**: Journal count, streak tracking
- **Characters**: Motivational wellness companions

## 🧠 AI Integration

### Sentiment Analysis

- **TextBlob**: Local sentiment analysis for mood detection
- **Real-time**: Instant mood classification from journal text
- **Categories**: Happy, Calm, Sad, Stressed, Neutral

### Mistral AI Suggestions

- **Personalized**: Context-aware wellness recommendations
- **Fallback**: Rule-based suggestions when API unavailable
- **Categories**: Mindfulness, Self-care, Productivity, Wellness

## 📊 Data Storage

### JSON Session Files

```json
{
  "session_id": "unique_identifier",
  "user_id": "user_identifier",
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T12:00:00",
  "journals": [
    {
      "id": 1,
      "content": "Today was a great day...",
      "sentiment_score": 0.8,
      "sentiment_label": "positive",
      "mood": "happy",
      "created_at": "2024-01-01T12:00:00"
    }
  ],
  "ai_interactions": [...],
  "wellness_metrics": {...}
}
```

## 🛠️ Development

### Backend Dependencies

- **Flask**: Web framework and API
- **Flask-CORS**: Cross-origin resource sharing
- **TextBlob**: Natural language processing
- **requests**: HTTP client for API calls
- **python-dotenv**: Environment variable management

### Frontend Dependencies

- **React**: UI framework
- **React Router**: Client-side routing
- **Vite**: Build tool and development server

### Development Commands

**Backend:**

```bash
# Install dependencies
pip install -r requirements.txt

# Run in development mode
python app.py

# Test API endpoints
python -c "from app import app; print('✅ Backend imports successfully')"
```

**Frontend:**

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📱 Mobile Responsiveness

### Mobile Features (360px+)

- Touch-optimized navigation
- Stackable card layouts
- Large tap targets
- Optimized text sizes
- Swipe-friendly interactions

### Tablet Features (768px+)

- Two-column layouts
- Collapsible sidebar
- Hover states for enhanced interaction
- Medium-density information display

### Desktop Features (1200px+)

- Full dashboard layout
- Side navigation
- Multi-column content
- Rich hover interactions
- High information density

## 🔒 Security & Privacy

- **Local Storage**: All data stored locally in JSON files
- **No External Database**: No cloud storage or external dependencies
- **Session-based**: Data organized by session for privacy
- **API Key Safety**: Environment variables for sensitive data

## 🚀 Deployment

### Production Considerations

- Use production WSGI server (e.g., Gunicorn) instead of Flask dev server
- Configure proper CORS policies
- Set up proper logging
- Use environment-specific configuration
- Consider containerization with Docker

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source. Feel free to use, modify, and distribute according to your needs.

## 🆘 Support

For issues or questions:

1. Check the console for error messages
2. Verify both frontend and backend are running
3. Ensure all dependencies are installed
4. Check API connectivity between frontend and backend

---

**Happy Journaling! 🌟**

Soulink is an empathetic, AI-powered journaling app that helps people reflect on their emotions, track mental wellness, and discover personalized strategies — all in a fun and gamified way.

## Features

- Daily Diary with Emotion Detection → Write your thoughts and let AI detect your mood and suggest solutions if required.
- Mental Wellness Insights → Track emotional trends over time with visuals.
- Character Companions → Interact with fun avatars and personalities to make journaling engaging with your real life characters.
- AI-Generated Nicknames & Tags → Reflect your unique identity with creative nicknames for yourself and your friends.
- Gamified Dashboard → Earn streaks, badges, and rewards for consistent journaling.
- Lumos AI - Your Personal AI therapist helps you with mental health concerns (if any exists).

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

<a href="https://github.com/ArjiJethin">@Arji Jethin Naga Sai Eswar</a> Status: Dead<br>
<a href="https://github.com/alurubalakarthikeya">@Aluru Bala Karthikeya</a> - Nothing beats a Jet 2 holiday<br>
<a href="https://github.com/Veda-1503">@Vedeshwari Nakate</a> aka The Einstien<br>
<a href="https://github.com/ayushsingh08-ds">@Ayush Singh</a> The Nigga<br>
