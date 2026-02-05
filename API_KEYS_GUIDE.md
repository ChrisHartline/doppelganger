# API Keys Setup Guide

Quick reference for obtaining and configuring API keys for the Doppelganger project.

## Required Keys (Core Functionality)

### 1. Claude API (Anthropic)
**Purpose**: AI conversation engine  
**Get it**: https://console.anthropic.com/settings/keys  
**Environment Variable**: `CLAUDE_API_KEY`

**Steps**:
1. Create account at https://console.anthropic.com/
2. Go to Settings → API Keys
3. Create new key
4. Copy key (starts with `sk-ant-api03-`)

**Cost**: Pay-as-you-go, ~$3-15 per 1M tokens (Claude Sonnet)

---

### 2. Nylas Calendar & Email
**Purpose**: Calendar booking and email confirmations  
**Get it**: https://dashboard.nylas.com/  
**Environment Variables**: 
- `NYLAS_API_KEY`
- `NYLAS_GRANT_ID`

**Steps**:
1. Create account at https://dashboard.nylas.com/
2. Connect your Google account (for Calendar & Gmail access)
3. Go to API Keys → Create new key
4. Copy the API key (starts with `nyk_v0_`)
5. Go to Grants → Find your connected account
6. Copy the Grant ID (UUID format)

**Cost**: Free tier available, then $6/user/month for Calendar API

**Documentation**: See `NYLAS_INTEGRATION.md` for detailed setup

---

## Optional Keys (Enhanced Features)

These features are currently **deprioritized** but available for future use:

### 3. D-ID (Video Avatar - Fallback)
**Purpose**: Lip-sync video generation  
**Get it**: https://studio.d-id.com/account-settings  
**Environment Variable**: `DID_API_KEY`

**Steps**:
1. Create account at https://studio.d-id.com/
2. Go to Account Settings → API Key
3. Copy your API key

**Cost**: Credits-based, ~$0.10-0.30 per video generation

**Status**: ⚠️ Currently deprioritized in favor of text-only chat

---

### 4. HeyGen (LiveAgent - Preferred Avatar Option)
**Purpose**: Interactive video avatar with real-time responses  
**Get it**: https://app.heygen.com/settings/api  
**Environment Variable**: `HEYGEN_API_KEY`

**Steps**:
1. Create account at https://heygen.com/
2. Go to Settings → API
3. Generate API key
4. Copy the key

**Cost**: Premium feature, pricing varies

**Status**: ⚠️ Currently deprioritized - requires further investigation

---

### 5. ElevenLabs (Voice Synthesis)
**Purpose**: Text-to-speech for AI responses  
**Get it**: https://elevenlabs.io/app/settings/api-keys  
**Environment Variables**:
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`

**Steps**:
1. Create account at https://elevenlabs.io/
2. Go to Profile → API Keys
3. Generate new API key
4. Browse Voice Lab to find a voice: https://elevenlabs.io/voice-lab
5. Copy the Voice ID from your selected voice

**Cost**: Free tier (10k characters/month), then $5-22/month

**Status**: ⚠️ Currently deprioritized in favor of text-only chat

---

## Environment Configuration

### Local Development

Add keys to `.env` file:

```env
# Required
CLAUDE_API_KEY=sk-ant-api03-xxxxx
NYLAS_API_KEY=nyk_v0_xxxxx
NYLAS_GRANT_ID=33923ad7-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Optional (for future features)
DID_API_KEY=xxxxx:xxxxx
HEYGEN_API_KEY=xxxxx-xxxx-xxxx-xxxx-xxxxx
ELEVENLABS_API_KEY=xxxxx
ELEVENLABS_VOICE_ID=xxxxx
```

### Vercel Production

Add keys in Dashboard → Settings → Environment Variables:

**Required for Production**:
- ✅ `CLAUDE_API_KEY`
- ✅ `NYLAS_API_KEY`
- ✅ `NYLAS_GRANT_ID`
- ✅ `SESSION_SECRET` (random string for session security)
- ✅ `NOTIFICATION_EMAIL` (for booking notifications)

**Optional** (only if enabling avatar/voice features):
- `DID_API_KEY`
- `HEYGEN_API_KEY`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`

**Important**: After adding/updating environment variables in Vercel, trigger a new deployment for changes to take effect.

---

## Key Security Best Practices

### ✅ DO:
- Store keys in `.env` file (never commit to git)
- Add `.env` to `.gitignore`
- Use environment variables in Vercel Dashboard
- Rotate keys periodically
- Use different keys for development and production

### ❌ DON'T:
- Commit API keys to git repositories
- Share keys in Slack, Discord, or public channels
- Hardcode keys in source code
- Use production keys in development
- Expose keys in frontend code

---

## Testing API Keys

### Test Claude API
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $CLAUDE_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-sonnet-4-20250514","max_tokens":10,"messages":[{"role":"user","content":"test"}]}'
```

### Test Nylas API
```bash
# In the project directory
node test-calendar-id.js
```
(See `NYLAS_INTEGRATION.md` for the test script)

### Test D-ID API
```bash
curl -X POST https://api.d-id.com/talks \
  -H "Authorization: Basic $DID_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"script":{"type":"text","input":"Hello"},"source_url":"https://path-to-image.jpg"}'
```

### Test ElevenLabs API
```bash
curl -X GET https://api.elevenlabs.io/v1/voices \
  -H "xi-api-key: $ELEVENLABS_API_KEY"
```

---

## Cost Management

### Estimated Monthly Costs (Production)

**Minimum (Text-only chat)**:
- Claude API: $10-50 (depending on traffic)
- Nylas: Free tier or $6/month
- **Total**: ~$10-56/month

**With Voice/Video Features**:
- Add D-ID: $10-50 (based on usage)
- Add ElevenLabs: $5-22/month
- **Total**: ~$25-128/month

### Cost Optimization Tips:
1. **Cache responses** where possible
2. **Limit context window** to reduce token usage
3. **Use free tiers** during development
4. **Monitor usage** via provider dashboards
5. **Set spending limits** in API dashboards

---

## Troubleshooting

### "API key not configured" errors

**Symptom**: 500 errors mentioning missing API keys

**Fix**:
1. Check `.env` file has the key
2. Restart development server
3. For Vercel: Check Environment Variables in dashboard
4. For Vercel: Redeploy after adding keys

### "Invalid API key" errors

**Symptom**: 401/403 authentication errors

**Fix**:
1. Verify key is copied correctly (no extra spaces)
2. Check key hasn't expired
3. Verify key has correct permissions
4. Regenerate key if necessary

### Keys working locally but not in Vercel

**Symptom**: Works on localhost, fails in production

**Fix**:
1. Verify keys are set in Vercel Environment Variables
2. Check they're set for "Production" environment
3. Trigger new deployment after adding keys
4. Check Vercel function logs for specific errors

---

## Current Project Status

As of February 5, 2026:

**Active Features**:
- ✅ AI Chat (Claude)
- ✅ Calendar Booking (Nylas)
- ✅ Email Confirmations (Nylas)

**Deprioritized Features**:
- ⏸️ Video Avatar (D-ID/HeyGen)
- ⏸️ Voice Synthesis (ElevenLabs)

The project currently operates in **text-only mode** with static image, focusing on conversation quality and calendar integration rather than audio/visual features.

---

## Resources

- **Claude API Docs**: https://docs.anthropic.com/
- **Nylas API Docs**: https://developer.nylas.com/docs/
- **D-ID API Docs**: https://docs.d-id.com/
- **HeyGen API Docs**: https://docs.heygen.com/
- **ElevenLabs API Docs**: https://elevenlabs.io/docs/

---

**Last Updated**: February 5, 2026  
**Maintainer**: Chris Hartline / Ashley AI Agent
