# AI Doppelganger

A digital twin that represents you to potential employers. Chat with recruiters and hiring managers on your behalf, qualify leads, and book meetings - all while you focus on your work.

## Features

- **Conversational AI** - Powered by Claude (Anthropic) with full knowledge of your background
- **Appointment Scheduling** - Nylas integration for automated Google Calendar booking with invite delivery
- **Contact Qualification Gate** - Visitors provide contact info after 10 messages before continuing
- **Hard Boundaries** - Configurable dealbreakers (location, compensation, role type) politely enforced automatically
- **Static Avatar** - Display your professional photo while chatting
- **Voice Synthesis** - ElevenLabs support (optional, currently deprioritized)
- **Video Avatar** - D-ID / HeyGen support (optional, currently deprioritized)

## Architecture

```
doppelganger/
├── frontend/          # React + Vite + shadcn/ui
├── backend/           # Express API server (TypeScript)
├── modal/             # TinyLlama fallback (optional)
└── knowledge/         # YOUR personal data — resume, skills, Q&A, boundaries
```

## Quick Start

### 1. Set Up Knowledge Base

Copy the example files and fill in your personal information:

```bash
cd knowledge
cp resume.txt.example resume.txt
cp personality.json.example personality.json
cp hard_boundaries.json.example hard_boundaries.json
cp qa.json.example qa.json
cp skills.json.example skills.json
cp projects.json.example projects.json
```

See `knowledge/README.md` for detailed instructions on each file.

> **This is the most important step.** The AI reads entirely from these files. The better your content, the better it represents you.

### 2. Add Your Avatar

Place your professional photo at:

```
frontend/public/avatar.png
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Required keys:
- **CLAUDE_API_KEY** - Get from https://console.anthropic.com/
- **NYLAS_API_KEY** - Get from https://dashboard.nylas.com/
- **NYLAS_GRANT_ID** - Your connected Google account grant ID
- **NOTIFICATION_EMAIL** - Your email to receive booking notifications
- **LINKEDIN_URL** - Your LinkedIn profile URL (used as fallback in chat)
- **SESSION_SECRET** - Any random string (e.g. `openssl rand -hex 32`)
- **ADMIN_API_KEY** - Any random string to protect admin routes

Optional (for voice/video features):
- **ELEVENLABS_API_KEY** + **ELEVENLABS_VOICE_ID** - Voice synthesis
- **DID_API_KEY** - Lip-sync video (D-ID)
- **HEYGEN_API_KEY** - Interactive avatar (HeyGen)

### 4. Install and Run

```bash
# Install all workspaces
npm install --workspaces

# Run backend
npm run dev --workspace=backend

# Run frontend (separate terminal)
npm run dev --workspace=frontend
```

Visit http://localhost:5173

### 5. Deploy to Vercel

See `DEPLOYMENT.md` for the full guide including common pitfalls.

## How It Works

### Conversational AI
The AI reads your knowledge base files on startup and uses them to build a dynamic system prompt. It speaks in first person as you, answers questions about your background, and enforces your hard boundaries (compensation floor, location dealbreakers, etc.).

### Contact Gate
After 10 messages, visitors are asked for their name, company, and email before continuing. This ensures you have contact info for every meaningful conversation.

### Appointment Booking
Qualified visitors can book 30-minute slots on your Google Calendar. They must provide a phone number or Google Meets link. A calendar invite is automatically sent to both parties.

### Hard Boundaries
Configure dealbreakers in `knowledge/hard_boundaries.json`. The AI will politely decline and stop the conversation if:
- A role requires relocation to a location on your hard-no list
- Compensation is below your floor
- Role type doesn't match your criteria

## Customization

### Qualification Logic
Edit `backend/src/services/llm.service.ts` → `calculateQualificationScore()`

### Available Time Slots
Edit `backend/src/services/nylas.service.ts`:
- `AVAILABLE_DAYS` - Days of week (1=Mon, 4=Thu, 5=Fri)
- `AVAILABLE_HOURS` - `{ start: 9, end: 17 }` (24hr)
- `SLOT_DURATION_MINUTES` - Default 30

### Contact Gate Threshold
Edit `backend/src/routes/chat.routes.ts` → `isAtMessageLimit(sessionId, 10)` — change `10` to any number.

### System Prompt
The system prompt is fully dynamic and built from your knowledge files. To tweak behavior, edit `backend/src/services/llm.service.ts` → `buildSystemPrompt()`.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat/session` | POST | Create a new chat session |
| `/api/chat` | POST | Send message, get AI response |
| `/api/calendar/slots` | GET | Get available time slots |
| `/api/calendar/book` | POST | Book an appointment |
| `/api/contact` | POST | Submit visitor contact info |
| `/api/profile` | GET | Get profile information |
| `/api/profile/resume` | POST | Update resume (admin) |
| `/api/profile/skills` | POST | Update skills (admin) |
| `/api/avatar/upload` | POST | Upload avatar image (admin) |

## Tech Stack

- **Frontend**: React, Vite, TypeScript, shadcn/ui, Tailwind CSS
- **Backend**: Express, TypeScript, Node.js
- **LLM**: Claude (Anthropic) — claude-sonnet model
- **Calendar**: Nylas v3 API → Google Calendar
- **Deployment**: Vercel (frontend static + backend serverless)
- **Voice** *(optional)*: ElevenLabs
- **Video** *(optional)*: D-ID or HeyGen

## Key Documentation

- `DEPLOYMENT.md` - Vercel deployment guide and troubleshooting
- `NYLAS_INTEGRATION.md` - Nylas calendar integration details and lessons learned
- `API_KEYS_GUIDE.md` - Where to get every API key and estimated costs
- `knowledge/README.md` - How to fill in your personal knowledge base

## License

MIT
