# Intelligent Memory System - Deployment Guide

## Overview

This guide covers deploying the intelligent memory system (v2) to production. The system includes:

- **Prompt Manager**: Orchestrates all LLM interactions with memory context
- **Memory Layers**: Retrieval, Update, and Insight Detection
- **New Database Tables**: Active Issues, Event Memory, Insight Memory, Issue History
- **V2 API Endpoints**: `/v2/analyze` with full memory integration
- **Health Journey UI**: New frontend screen for visualizing health patterns

---

## Step 1: Deploy Database Schema

### Run in Supabase SQL Editor

```sql
-- Run the entire supabase-schema-v2.sql file
-- This creates 4 new tables:
-- - active_issues
-- - event_memory
-- - insight_memory
-- - issue_history
```

**File:** `supabase-schema-v2.sql`

**Verification:**
1. Go to Supabase Dashboard → Table Editor
2. Confirm you see the 4 new tables
3. Check that RLS policies are enabled

---

## Step 2: Install Backend Dependencies

The backend now requires `@supabase/supabase-js`:

```bash
cd backend
npm install @supabase/supabase-js
```

---

## Step 3: Update Backend Environment Variables

Add these to your Render.com environment variables:

```bash
SUPABASE_URL=https://gzmfehoyqyjydegwgbjz.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Important**: These are already set if you've configured Supabase previously.

---

## Step 4: Deploy Backend to Render

### Option A: Automatic Deployment (if GitHub connected)

1. Push your changes to GitHub:
   ```bash
   git add .
   git commit -m "feat: Add intelligent memory system v2"
   git push
   ```

2. Render will automatically deploy

### Option B: Manual Deployment

1. Go to Render Dashboard
2. Click on `jivan-backend`
3. Click "Manual Deploy" → "Deploy latest commit"

**Verification:**
- Check Render logs for: `📊 V2 API with intelligent memory system enabled`
- Test the health endpoint: `https://jivan-backend.onrender.com/`
- Should return: `{"status":"healthy","message":"Jivan Backend API"}`

---

## Step 5: Test V2 API Endpoints

### Test `/v2/analyze` endpoint:

```bash
curl -X POST https://jivan-backend.onrender.com/v2/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "query": "I have a headache",
    "profileId": "YOUR_PROFILE_UUID",
    "context": {
      "age": 30
    }
  }'
```

**Expected Response:**
```json
{
  "reflection": "...",
  "interpretation": "...",
  "guidance": ["...", "..."],
  "redFlags": ["...", "..."],
  "followUp": "...",
  "recommendations": ["...", "..."]
}
```

### Test Memory Endpoints:

```bash
# Get active issues
curl https://jivan-backend.onrender.com/memory/issues/YOUR_PROFILE_UUID

# Get insights
curl https://jivan-backend.onrender.com/memory/insights/YOUR_PROFILE_UUID

# Get events
curl https://jivan-backend.onrender.com/memory/events/YOUR_PROFILE_UUID
```

---

## Step 6: Update Frontend Environment

The frontend `services/ai.ts` now uses the backend URL. Ensure this environment variable is set:

```bash
# In your .env file or Expo configuration
EXPO_PUBLIC_API_URL=https://jivan-backend.onrender.com
```

---

## Step 7: Test the Mobile App

### Update Expo App

```bash
# Stop existing Expo process
# Then restart
npx expo start --tunnel
```

### Test Flow:

1. **Create a profile** (if you haven't already)
2. **Record a health query**: "I've been feeling tired for the past few days"
3. **Check the response**: Should include reflection and interpretation
4. **Go to Profile & Insights**
5. **Click "View Health Journey"** (you may need to add this link)
6. **Verify**:
   - Issue was created (e.g., "Fatigue")
   - Event was recorded in timeline
   - Status shows as "active"

---

## Step 8: Enable Insight Detection (Optional)

The Insight Detector runs pattern analysis. You can trigger it manually or via cron job.

### Manual Trigger (for testing):

Add a test endpoint in `backend/index.js`:

```javascript
const InsightDetector = require('./services/insightDetector');

app.post('/test/detect-insights/:profileId', async (req, res) => {
  try {
    const { profileId } = req.params;
    const detector = new InsightDetector();
    await detector.detectInsights(profileId);
    res.json({ success: true, message: 'Insights detected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Production: Setup Cron Job

Use a service like cron-job.org or Render Cron Jobs to call:

```bash
POST /test/detect-insights/:profileId
```

**Frequency**: Daily or after every 5th conversation

---

## Step 9: Testing Scenarios

### Scenario 1: Continuity Test

**Day 1:**
1. Record: "I have a headache"
2. Check database: `active_issues` should have one entry
3. Status should be "active"

**Day 3:**
1. Record: "My headache is still there"
2. Check response: Should reference "the headache you mentioned X days ago"
3. Check database: `last_mentioned_at` should be updated

**Expected:** LLM acknowledges continuity

---

### Scenario 2: Improvement Tracking

**Days 1-5:**
1. Record queries about poor sleep
2. Track sleep vitals daily (4-5 hours)

**Days 6-12:**
1. Improve sleep tracking (7-8 hours)
2. Run insight detection

**Expected:**
- Issue status changes to "improving"
- Insight generated: "Sleep tracking has improved your sleep by ~X%"

---

### Scenario 3: Auto-Resolution

**Day 1:**
1. Create an issue (e.g., "Sore throat")
2. Status: "active"

**Day 31+:**
1. Don't mention the issue for 30 days
2. Run auto-update (happens automatically on next query)

**Expected:**
- Issue status changes to "resolved"
- Reason: "Auto-resolved: no mention in 30 days"

---

## Step 10: Monitoring & Debugging

### Check Supabase Tables:

```sql
-- Check active issues
SELECT * FROM active_issues WHERE profile_id = 'YOUR_UUID';

-- Check event memory
SELECT * FROM event_memory WHERE profile_id = 'YOUR_UUID' ORDER BY timestamp DESC LIMIT 10;

-- Check insights
SELECT * FROM insight_memory WHERE profile_id = 'YOUR_UUID';

-- Check issue history
SELECT ih.*, ai.label 
FROM issue_history ih 
JOIN active_issues ai ON ih.issue_id = ai.id 
WHERE ai.profile_id = 'YOUR_UUID'
ORDER BY ih.changed_at DESC;
```

### Check Backend Logs (Render):

Look for:
- `[PromptManager] Processing query for profile...`
- `[MemoryRetrieval] Retrieved: X issues, Y events, Z insights`
- `[MemoryUpdate] Memory update complete`
- `[InsightDetector] Pattern analysis complete`

---

## Common Issues & Fixes

### Issue 1: "No profileId provided"

**Cause:** Frontend not sending profileId
**Fix:** Ensure `getAIResponseV2` is called with valid profileId

### Issue 2: Empty memory context

**Cause:** No data in new tables
**Fix:** Use the app for a few days to build up event history

### Issue 3: Insights not generated

**Cause:** Insufficient data or correlation not found
**Fix:** Need at least 3-5 events of each type for correlation

### Issue 4: Backend errors on Render

**Cause:** Missing environment variables
**Fix:** Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set

---

## Rollback Plan

If you need to rollback:

1. **Frontend**: Switch back to `getAIResponse()` instead of `getAIResponseV2()`
2. **Backend**: The old `/analyze` endpoint still works
3. **Database**: New tables don't affect old functionality

---

## Success Metrics

After 1 week of usage, check:

1. **Active Issues**: Are they being created correctly?
2. **Memory Context**: Do responses reference past conversations?
3. **Insights**: Are meaningful patterns being detected?
4. **User Engagement**: Are users returning within 24-48 hours?

---

## Next Steps

Once the system is stable:

1. **Phase B**: Enable insight detection cron job
2. **Phase C**: Add report upload with signal extraction
3. **Device Integration**: Sync Apple Health / Google Fit data
4. **Fine-tuning**: Adjust insight detection thresholds based on data

---

## Support

For issues:
1. Check backend logs on Render
2. Verify Supabase tables have data
3. Test API endpoints directly with curl
4. Review console logs in mobile app

---

**Deployment Complete!** 🎉

The intelligent memory system is now live. Users will experience:
- Personalized, context-aware responses
- Continuous health journey tracking
- Meaningful insights over time
- Better engagement and trust

