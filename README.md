# AI Doppelganger

A digital twin application that represents you to potential employers. Features include:

- **Conversational AI** - Powered by TinyLlama via Modal
- **Lip-sync Video** - D-ID integration for realistic video responses
- **Voice Synthesis** - ElevenLabs custom voice support
- **Appointment Scheduling** - Nylas integration for Gmail/Calendar
- **Qualification Flow** - Visitors must engage before booking meetings

## Architecture

```
doppelganger/
├── frontend/          # React + Vite + shadcn/ui
├── backend/           # Express API server
├── modal/             # TinyLlama deployment on Modal
└── knowledge/         # Resume, skills, Q&A training data
```

## Quick Start

### 1. Configure Environment

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

Required API keys:
- **DID_API_KEY** - For lip-sync video generation (https://www.d-id.com/)
- **ELEVENLABS_API_KEY** - For voice synthesis (https://elevenlabs.io/)
- **ELEVENLABS_VOICE_ID** - Your custom voice ID from ElevenLabs
- **NYLAS_API_KEY** - For Gmail/Calendar integration (https://www.nylas.com/)
- **NYLAS_GRANT_ID** - Your Nylas grant ID

### 2. Set Up Knowledge Base

Edit the files in `/knowledge/` to personalize your AI:

- `resume.txt` - Your full resume content
- `skills.json` - Array of your skills
- `projects.json` - Array of project descriptions
- `experience.json` - Structured work experience
- `qa.json` - Q&A pairs for training (answer common interview questions)

### 3. Upload Your Avatar

Place your photo in `frontend/public/avatar.jpg` or upload via the API:

```bash
curl -X POST http://localhost:3001/api/avatar/upload \
  -F "avatar=@your-photo.jpg"
```

### 4. Deploy TinyLlama on Modal

```bash
cd modal
pip install modal
modal token new
modal deploy app.py
```

Update `MODAL_ENDPOINT` in your `.env` with the deployed URL.

### 5. Start the Application

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173

## Features

### Conversational Interface
The chat interface lets visitors ask questions about your background, skills, and experience. The AI responds based on your knowledge base.

### Qualification System
Visitors must engage in meaningful conversation before they can book an appointment. The qualification score increases as they:
- Introduce themselves
- Ask about your skills/experience
- Discuss projects/achievements
- Share what they're looking for

### Appointment Booking
Once qualified (70%+ score), visitors can book a meeting. Available time slots are:
- Monday, Thursday, Friday
- 2 PM - 5 PM
- 30-minute slots

Configure in `backend/src/services/nylas.service.ts`.

### Video Responses
When D-ID is configured, the AI generates lip-sync videos of your avatar speaking the responses.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Send message, get AI response |
| `/api/video/generate` | POST | Generate lip-sync video |
| `/api/calendar/slots` | GET | Get available time slots |
| `/api/calendar/book` | POST | Book an appointment |
| `/api/profile` | GET | Get profile information |
| `/api/profile/resume` | POST | Update resume content |
| `/api/profile/qa` | POST | Add Q&A training pair |
| `/api/avatar/upload` | POST | Upload avatar image |

## Training Your Doppelganger

### Adding Q&A Pairs
Add question-answer pairs to improve responses:

```bash
curl -X POST http://localhost:3001/api/profile/qa \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is your management style?",
    "answer": "I believe in servant leadership..."
  }'
```

### Updating Skills
```bash
curl -X POST http://localhost:3001/api/profile/skills \
  -H "Content-Type: application/json" \
  -d '{
    "skills": ["JavaScript", "Python", "React", "Node.js"]
  }'
```

## Creating Your ElevenLabs Voice

1. Go to https://elevenlabs.io/
2. Create an account
3. Navigate to "Voice Lab"
4. Click "Add Generative or Cloned Voice"
5. Upload audio samples of your voice (minimum 1 minute recommended)
6. Copy the Voice ID and add it to your `.env`

## Customization

### Qualification Criteria
Edit `backend/src/services/llm.service.ts` - `calculateQualificationScore()` method.

### Available Time Slots
Edit `backend/src/services/nylas.service.ts`:
- `AVAILABLE_DAYS` - Days of the week (0=Sunday)
- `AVAILABLE_HOURS` - Start and end hours
- `SLOT_DURATION_MINUTES` - Meeting length

### System Prompt
Edit `backend/src/services/llm.service.ts` - `buildSystemPrompt()` method.

## Tech Stack

- **Frontend**: React, Vite, shadcn/ui, Tailwind CSS
- **Backend**: Express, TypeScript
- **LLM**: TinyLlama 1.1B on Modal
- **Video**: D-ID
- **Voice**: ElevenLabs
- **Calendar/Email**: Nylas

## License

MIT
