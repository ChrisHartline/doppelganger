# Deploying to Vercel

This guide walks you through deploying the Doppelganger application to Vercel.

## Prerequisites

- Vercel account (https://vercel.com/signup)
- Vercel CLI installed: `npm install -g vercel`

## Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

## Step 2: Login to Vercel

```bash
vercel login
```

Follow the prompts to authenticate.

## Step 3: Deploy

From the `doppelganger` directory:

```bash
vercel
```

The CLI will:
1. Ask you to link to an existing project or create a new one
2. Detect the framework settings (already configured in `vercel.json`)
3. Deploy your application

For production deployment:

```bash
vercel --prod
```

## Step 4: Configure Environment Variables

After deployment, add your environment variables in the Vercel dashboard:

1. Go to your project on vercel.com
2. Click **Settings** → **Environment Variables**
3. Add the following variables:

### Required Variables

```
CLAUDE_API_KEY=your-claude-api-key
```

### Optional (for full features)

```
# HeyGen (when ready)
HEYGEN_API_KEY=your-heygen-key

# D-ID (fallback)
DID_API_KEY=your-d-id-key

# ElevenLabs
ELEVENLABS_API_KEY=your-elevenlabs-key
ELEVENLABS_VOICE_ID=your-voice-id

# Nylas
NYLAS_API_KEY=your-nylas-api-key
NYLAS_GRANT_ID=your-grant-id

# Session
SESSION_SECRET=random-secret-string

# Notifications
NOTIFICATION_EMAIL=your-email@example.com
```

## Step 5: Redeploy

After adding environment variables:

```bash
vercel --prod
```

## Step 6: Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain (e.g., `ashley.chrishartline.com`)
3. Follow DNS configuration instructions

## Project Structure

```
doppelganger/
├── api/
│   └── index.js          # Vercel serverless function wrapper
├── frontend/
│   ├── src/              # React source
│   └── dist/             # Built frontend (deployed)
├── backend/
│   ├── src/              # Express API source
│   └── dist/             # Compiled TypeScript (deployed)
├── knowledge/            # Deployed with backend
└── vercel.json           # Vercel configuration
```

## How It Works

- **Frontend**: Deployed as static files from `frontend/dist`
- **Backend**: Runs as Vercel Serverless Functions via `api/index.js`
- **API Routes**: Requests to `/api/*` are routed to the serverless function
- **Knowledge Base**: Deployed alongside the backend code

## Troubleshooting

### Build Fails

Check build logs in Vercel dashboard. Common issues:
- Missing dependencies: Add to `package.json`
- TypeScript errors: Fix before deploying
- Environment variables: Ensure they're set

### API Errors

- Check Function Logs in Vercel dashboard
- Verify environment variables are set correctly
- Cold start times: First request may take 3-5 seconds

### Frontend Can't Reach API

- Ensure `VITE_API_URL` is NOT set (it will default to `/api`)
- Check Network tab in browser DevTools
- Verify API routes in `vercel.json`

## Local Testing

Test the production build locally:

```bash
# Build everything
npm run build

# Test with Vercel CLI
vercel dev
```

This runs your app in a local Vercel environment.

## Monitoring

- **Function Logs**: Vercel Dashboard → Deployments → [Latest] → Functions
- **Analytics**: Vercel Dashboard → Analytics
- **Conversation Logs**: `https://your-domain.vercel.app/api/logs`

## Cost Estimate

Vercel Free Tier includes:
- 100 GB bandwidth
- 100 GB-hours serverless function execution
- Unlimited deployments

This should be sufficient for initial employer outreach. Monitor usage in dashboard.

## Next Steps

1. Test the deployment thoroughly
2. Share the URL with potential employers
3. Monitor conversation logs
4. Iterate based on feedback
