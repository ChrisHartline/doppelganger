# Nylas Calendar Integration - Complete Guide

## Overview

This document details the Nylas v3 API integration for automated calendar booking in the Doppelganger project. Successfully implemented on February 5, 2026.

## What It Does

The integration enables visitors to:
1. View available appointment slots
2. Book meetings directly through the AI chat interface
3. Automatically receive Google Calendar invites
4. Get confirmation codes for their bookings

## Architecture

### Components

```
Frontend (React)
  └─> AppointmentBooking.tsx
       └─> API Service (/api/calendar/*)
            └─> Backend Routes (calendar.routes.ts)
                 └─> Nylas Service (nylas.service.ts)
                      └─> Nylas v3 API
```

### Key Files

- **Frontend**: `frontend/src/components/AppointmentBooking.tsx`
- **API Service**: `frontend/src/services/api.ts`
- **Backend Route**: `backend/src/routes/calendar.routes.ts`
- **Nylas Service**: `backend/src/services/nylas.service.ts`
- **Types**: `backend/src/types/index.ts`

## Nylas Setup

### 1. Prerequisites

- Nylas account: https://dashboard.nylas.com/
- Google account for calendar integration
- Nylas v3 API access

### 2. Required Credentials

Two environment variables are required:

```env
NYLAS_API_KEY=nyk_v0_xxxxx...
NYLAS_GRANT_ID=33923ad7-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

#### Where to Find Them

1. **NYLAS_API_KEY**
   - Dashboard → API Keys
   - Create new API key
   - Copy the key (starts with `nyk_v0_`)

2. **NYLAS_GRANT_ID**
   - Dashboard → Grants
   - Find your connected Google account
   - Copy the Grant ID (UUID format)

### 3. Grant Permissions

Your Nylas grant must have:
- ✅ Calendar read access
- ✅ Calendar write access
- ✅ Email send access (optional, for email confirmations)

## API Implementation

### Service Methods

The `NylasService` class provides three key methods:

#### 1. `getAvailableSlots()`

Generates available appointment slots for the next 7 days.

```typescript
async getAvailableSlots(): Promise<AppointmentSlot[]>
```

**Logic:**
- Business hours: 9 AM - 5 PM EST
- Slot duration: 30 minutes
- Checks Nylas for conflicts
- Returns only available slots

#### 2. `isSlotAvailable(slot)`

Checks if a specific time slot is free on the calendar.

```typescript
async isSlotAvailable(slot: AppointmentSlot): Promise<boolean>
```

**How it works:**
- Queries Nylas Events API
- Checks for overlapping events in the time range
- Returns `true` if no conflicts

#### 3. `createEvent(booking, slot)`

Creates a calendar event and sends invite.

```typescript
async createEvent(
  booking: BookingRequest, 
  slot: AppointmentSlot
): Promise<{
  success: boolean
  eventId?: string
  confirmationId: string
}>
```

**What it does:**
1. Fetches list of calendars from Nylas
2. Finds the primary calendar
3. Creates event with calendar_id as query parameter
4. Returns confirmation ID

## Critical Implementation Details

### Calendar ID as Query Parameter

**IMPORTANT**: Nylas v3 API requires `calendar_id` as a **URL query parameter**, not in the request body.

#### ❌ Wrong (doesn't work)
```javascript
POST /grants/{grant_id}/events
Body: {
  calendar_id: "chris.hartline.99@gmail.com",
  title: "Meeting",
  when: { ... }
}
```

#### ✅ Correct
```javascript
POST /grants/{grant_id}/events?calendar_id=chris.hartline.99%40gmail.com
Body: {
  title: "Meeting",
  when: { ... }
}
```

**Code:**
```typescript
const response = await axios.post(
  `${NYLAS_API_URL}/grants/${NYLAS_GRANT_ID}/events?calendar_id=${encodeURIComponent(primaryCalendar.id)}`,
  eventPayload,
  { headers: { Authorization: `Bearer ${NYLAS_API_KEY}` } }
)
```

### Fetching Calendar ID

Don't hardcode calendar IDs. Fetch them dynamically:

```typescript
// Get calendars
const calendarsResponse = await axios.get(
  `${NYLAS_API_URL}/grants/${NYLAS_GRANT_ID}/calendars`,
  { headers: { Authorization: `Bearer ${NYLAS_API_KEY}` } }
)

// Find primary calendar
const calendars = calendarsResponse.data.data
const primaryCalendar = calendars.find((cal: any) => cal.is_primary) || calendars[0]
```

### Unix Timestamps

Nylas expects Unix timestamps (seconds since epoch):

```typescript
when: {
  start_time: Math.floor(new Date(slot.startTime).getTime() / 1000),
  end_time: Math.floor(new Date(slot.endTime).getTime() / 1000),
}
```

## Troubleshooting Guide

### Issues We Encountered (and Fixed)

#### 1. Error: "calendar_id query parameter is required"

**Symptom:**
```
Response status: 400
"message": "calendar_id query parameter is required."
```

**Cause:** Sending `calendar_id` in request body instead of URL query parameter.

**Fix:** Move `calendar_id` to query string:
```typescript
`${NYLAS_API_URL}/grants/${GRANT_ID}/events?calendar_id=${encodeURIComponent(calendarId)}`
```

#### 2. Error: "Invalid calendar_id 'primary'"

**Symptom:**
```
Response status: 400
"message": "Invalid calendar_id"
```

**Cause:** Using `'primary'` as calendar ID. Nylas v3 doesn't accept this.

**Fix:** Fetch actual calendar ID using the calendars endpoint.

#### 3. Mock Bookings Instead of Real Events

**Symptom:** Confirmation code appears but no calendar event.

**Cause:** Missing `NYLAS_API_KEY` or `NYLAS_GRANT_ID` in environment variables.

**Fix:** 
1. Verify env vars are set in Vercel Dashboard (Settings → Environment Variables)
2. Ensure they're set for "Production" environment
3. Redeploy after adding env vars

## Testing

### Manual Testing Checklist

- [ ] Visit the deployed site
- [ ] Chat until "Book Appointment" option appears
- [ ] View available slots (should show next 7 days, 9-5 PM)
- [ ] Select a slot
- [ ] Fill booking form (name, email, company, purpose)
- [ ] Submit booking
- [ ] Verify confirmation code appears
- [ ] Check Google Calendar for event
- [ ] Check Gmail for calendar invite

### Testing Locally

1. Copy `.env.example` to `.env`
2. Add your Nylas credentials
3. Run backend: `npm run dev --workspace=backend`
4. Run frontend: `npm run dev --workspace=frontend`
5. Test booking flow

### Test Script

Created a test script to verify calendar access:

```javascript
// test-calendar-id.js
const axios = require('axios');
require('dotenv').config();

const NYLAS_API_KEY = process.env.NYLAS_API_KEY;
const NYLAS_GRANT_ID = process.env.NYLAS_GRANT_ID;

async function testCalendarFetch() {
  const response = await axios.get(
    `https://api.us.nylas.com/v3/grants/${NYLAS_GRANT_ID}/calendars`,
    { headers: { Authorization: `Bearer ${NYLAS_API_KEY}` } }
  );
  
  console.log('Calendars:', response.data.data);
}

testCalendarFetch();
```

Run: `node test-calendar-id.js`

## Future: MCP Tool Package

### Proposed Structure

Package this as a standalone MCP tool that other projects can use:

```
nylas-calendar-mcp/
├── index.js              # MCP server entry point
├── tools/
│   ├── list-calendars.js
│   ├── get-slots.js
│   ├── book-appointment.js
│   └── cancel-appointment.js
├── config/
│   └── schema.json       # Tool schemas for MCP
└── package.json
```

### Tool Definitions

#### `list_calendars`
```json
{
  "name": "list_calendars",
  "description": "List all calendars for the Nylas grant",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```

#### `get_available_slots`
```json
{
  "name": "get_available_slots",
  "description": "Get available appointment slots",
  "inputSchema": {
    "type": "object",
    "properties": {
      "calendar_id": { "type": "string" },
      "days_ahead": { "type": "number", "default": 7 },
      "duration_minutes": { "type": "number", "default": 30 },
      "business_hours_start": { "type": "number", "default": 9 },
      "business_hours_end": { "type": "number", "default": 17 }
    }
  }
}
```

#### `book_appointment`
```json
{
  "name": "book_appointment",
  "description": "Book a calendar appointment",
  "inputSchema": {
    "type": "object",
    "properties": {
      "calendar_id": { "type": "string", "required": true },
      "title": { "type": "string", "required": true },
      "start_time": { "type": "number", "required": true },
      "end_time": { "type": "number", "required": true },
      "participant_email": { "type": "string", "required": true },
      "participant_name": { "type": "string" },
      "description": { "type": "string" }
    }
  }
}
```

### MCP Configuration

Users would configure in their `.cursorrules` or MCP settings:

```json
{
  "mcpServers": {
    "nylas-calendar": {
      "command": "node",
      "args": ["path/to/nylas-calendar-mcp/index.js"],
      "env": {
        "NYLAS_API_KEY": "your-key",
        "NYLAS_GRANT_ID": "your-grant-id"
      }
    }
  }
}
```

### Reusable Service Class

Extract the core service as a standalone package:

```typescript
// @doppelganger/nylas-service
export class NylasCalendarService {
  constructor(apiKey: string, grantId: string) { ... }
  
  async listCalendars(): Promise<Calendar[]>
  async getAvailableSlots(options: SlotOptions): Promise<Slot[]>
  async bookAppointment(booking: Booking): Promise<Event>
  async cancelAppointment(eventId: string): Promise<void>
  async updateAppointment(eventId: string, updates: Partial<Booking>): Promise<Event>
}
```

## Environment Configuration

### Local Development

```env
# .env
NYLAS_API_KEY=nyk_v0_xxxxx
NYLAS_GRANT_ID=33923ad7-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NOTIFICATION_EMAIL=chris.hartline.99@gmail.com
```

### Vercel Production

Set in Dashboard → Settings → Environment Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| NYLAS_API_KEY | nyk_v0_... | Production |
| NYLAS_GRANT_ID | 33923ad7-... | Production |
| NOTIFICATION_EMAIL | chris.hartline.99@gmail.com | Production |

**Important:** After adding/updating env vars, trigger a new deployment.

## API Endpoints

### GET `/api/calendar/slots`

Returns available appointment slots.

**Response:**
```json
{
  "slots": [
    {
      "id": "2026-02-10-09:00",
      "startTime": "2026-02-10T14:00:00.000Z",
      "endTime": "2026-02-10T14:30:00.000Z",
      "display": "Monday, February 10 at 9:00 AM"
    }
  ]
}
```

### POST `/api/calendar/book`

Books an appointment.

**Request:**
```json
{
  "slotId": "2026-02-10-09:00",
  "name": "John Doe",
  "email": "john@example.com",
  "company": "Acme Corp",
  "purpose": "Discuss partnership"
}
```

**Response:**
```json
{
  "success": true,
  "eventId": "evt_abc123",
  "confirmationId": "DPLG-ML9J68MI",
  "message": "Appointment booked successfully"
}
```

## Best Practices

### 1. Error Handling

Always wrap Nylas calls in try/catch:

```typescript
try {
  const result = await nylasService.createEvent(booking, slot)
  return result
} catch (error) {
  console.error('Booking error:', error)
  // Return user-friendly message
  throw new Error('Failed to book appointment. Please try again.')
}
```

### 2. Logging

Use structured logging for debugging:

```typescript
console.log('Using calendar:', primaryCalendar.id, primaryCalendar.name)
console.log('Creating event with payload:', JSON.stringify(eventPayload, null, 2))
```

### 3. Validation

Validate all booking inputs:

```typescript
if (!booking.name || !booking.email || !slot.id) {
  return res.status(400).json({ error: 'Missing required fields' })
}
```

### 4. Mock Mode

Support mock bookings when Nylas isn't configured:

```typescript
if (!NYLAS_API_KEY || !NYLAS_GRANT_ID) {
  console.log('Nylas not configured, creating mock booking')
  return { success: true, confirmationId: generateConfirmationId() }
}
```

## Performance Considerations

### 1. Cache Calendar List

Don't fetch calendar list on every booking:

```typescript
// Cache calendar ID for 1 hour
let cachedCalendarId: string | null = null
let cacheExpiry: number = 0

async function getPrimaryCalendarId(): Promise<string> {
  if (cachedCalendarId && Date.now() < cacheExpiry) {
    return cachedCalendarId
  }
  
  const calendars = await fetchCalendars()
  cachedCalendarId = calendars.find(c => c.is_primary)?.id
  cacheExpiry = Date.now() + 3600000 // 1 hour
  
  return cachedCalendarId
}
```

### 2. Batch Availability Checks

Check multiple slots in parallel:

```typescript
const availabilityChecks = slots.map(slot => isSlotAvailable(slot))
const results = await Promise.all(availabilityChecks)
const availableSlots = slots.filter((_, i) => results[i])
```

## Security

### 1. Never Expose API Keys

- ✅ Store in environment variables
- ✅ Add `.env` to `.gitignore`
- ❌ Never commit API keys to git
- ❌ Never send API keys to frontend

### 2. Validate Grant Permissions

Before using a grant, verify it has necessary permissions:

```typescript
const grant = await fetchGrant(NYLAS_GRANT_ID)
if (!grant.scopes.includes('calendar')) {
  throw new Error('Grant missing calendar permissions')
}
```

### 3. Rate Limiting

Implement rate limiting for booking endpoint:

```typescript
// Limit: 10 bookings per hour per IP
const rateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10
})

app.post('/api/calendar/book', rateLimiter, bookingHandler)
```

## Resources

- **Nylas Documentation**: https://developer.nylas.com/docs/
- **Nylas v3 API Reference**: https://developer.nylas.com/docs/api/v3/
- **Calendar API**: https://developer.nylas.com/docs/api/v3/calendar/
- **Events API**: https://developer.nylas.com/docs/api/v3/calendar/events/
- **Dashboard**: https://dashboard.nylas.com/

## Changelog

### February 5, 2026 - Initial Implementation

- ✅ Implemented Nylas v3 API integration
- ✅ Fixed calendar_id query parameter issue
- ✅ Added dynamic calendar ID fetching
- ✅ Deployed to Vercel production
- ✅ Confirmed working end-to-end

### Issues Resolved

1. **calendar_id in body vs query param** - Moved to query string
2. **Using 'primary' as calendar ID** - Fetch actual ID dynamically
3. **Mock bookings in production** - Fixed environment variables
4. **Serverless filesystem issues** - Use `/tmp` for logs

## Next Steps

- [ ] Add email confirmation using Nylas Email API
- [ ] Implement appointment cancellation
- [ ] Add reminder notifications
- [ ] Package as reusable MCP tool
- [ ] Add timezone support for international visitors
- [ ] Implement recurring availability patterns

---

**Status**: ✅ Production Ready  
**Last Updated**: February 5, 2026  
**Maintainer**: Chris Hartline / Ashley AI Agent
