# Knowledge Base Setup

This folder contains the knowledge that powers your AI Doppelganger's personality, responses, and boundaries. Each file shapes how the AI represents you.

## Quick Start

1. Copy each `.example` file to its counterpart (without `.example`):

```bash
cp resume.txt.example resume.txt
cp personality.json.example personality.json
cp hard_boundaries.json.example hard_boundaries.json
cp qa.json.example qa.json
cp skills.json.example skills.json
cp projects.json.example projects.json
```

2. Edit each file with your personal information
3. Add your profile photo as `avatar.png` to `frontend/public/`
4. The AI will automatically load these on startup

## File Descriptions

| File | Purpose | Required? |
|------|---------|-----------|
| `resume.txt` | Full resume text - the AI's primary knowledge source | Yes |
| `personality.json` | Communication style, traits, what excites you, ideal roles | Yes |
| `hard_boundaries.json` | Dealbreakers: location, compensation floor, role types | Yes |
| `qa.json` | Pre-written answers to common interview questions | Yes |
| `skills.json` | List of your technical and soft skills | Yes |
| `projects.json` | Key projects with brief descriptions | Yes |
| `contacts.json` | Known contacts for personalized interactions | Optional |
| `experience.json` | Structured work experience (additional format) | Optional |

## Tips for Best Results

### resume.txt
- Include quantified achievements (dollar amounts, percentages, team sizes)
- Cover all career history you want the AI to reference
- Include certifications, education, and military service if applicable

### personality.json
- Be authentic - the AI should sound like you, not a generic bot
- The `handle_with_care` section covers sensitive topics (salary, weaknesses)
- `off_limits_topics` prevents the AI from discussing certain subjects

### hard_boundaries.json
- Set your compensation floor honestly - the AI will politely decline below this
- Location dealbreakers are hard stops - the AI won't negotiate these
- The `linkedin_fallback` is your escape hatch for questions the AI can't answer

### qa.json
- Write answers in your own voice - conversational, not formal
- Include specific stories and examples where possible
- The more authentic detail you provide, the better the AI represents you

### contacts.json
- Add people who might visit your site (recruiters, colleagues, friends)
- The AI adjusts tone based on relationship type
- Completely optional but adds a personal touch

## Security Notes

- These files are gitignored by default - your personal data stays local
- Never commit files containing real personal information
- The `.example` files are safe to commit as templates
- Your deployed site (e.g., Vercel) reads from the built version of these files
