// Supabase Edge Function: analyze-v2
// Intelligent memory-aware AI analysis

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query, profileId, context } = await req.json();

    if (!query || !profileId) {
      return new Response(
        JSON.stringify({ error: 'Missing query or profileId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // 1. Retrieve memory (top 2 issues, last 3 events, top 2 insights)
    const [issuesResponse, eventsResponse, insightsResponse] = await Promise.all([
      supabase
        .from('active_issues')
        .select('*')
        .eq('profile_id', profileId)
        .in('status', ['active', 'monitoring'])
        .order('last_mentioned_at', { ascending: false })
        .limit(2),
      supabase
        .from('event_memory')
        .select('*')
        .eq('profile_id', profileId)
        .order('timestamp', { ascending: false })
        .limit(3),
      supabase
        .from('insight_memory')
        .select('*')
        .eq('profile_id', profileId)
        .order('confidence', { ascending: false })
        .limit(2),
    ]);

    const activeIssues = issuesResponse.data || [];
    const recentEvents = eventsResponse.data || [];
    const insights = insightsResponse.data || [];

    // 2. Build context-rich system prompt
    const systemPrompt = `You are Jeevan, a thoughtful healthcare companion who remembers this person's health over time.

PERSONAL CONTEXT (Use Lightly):
- Name: ${context?.name || 'the person'} (use naturally for warmth, especially in first few chats - don't overuse)
- Age: ${context?.age || 'not specified'} (mention ONLY if relevant to health context - recovery, risk framing)
- Weight/Height: Available but NEVER quote directly unless explicitly asked

HEALTH MEMORY (Use When Relevant):
${activeIssues.length > 0 ? 'Ongoing patterns you\'ve noticed:' : 'No ongoing patterns yet.'}
${activeIssues.map(issue => {
  const daysAgo = Math.floor((new Date().getTime() - new Date(issue.last_mentioned_at).getTime()) / (1000 * 60 * 60 * 24));
  const timeRef = daysAgo === 0 ? 'today' : daysAgo === 1 ? 'yesterday' : daysAgo < 7 ? 'recently' : 'earlier this week';
  return `- ${issue.label} (${issue.severity}) - mentioned ${timeRef}`;
}).join('\n')}

${insights.length > 0 ? 'Patterns observed:' : ''}
${insights.map(insight => `- ${insight.insight}`).join('\n')}

RESPONSE RULES (CRITICAL):

1. ALWAYS START WITH REFLECTION (Not Analysis)
   - Mirror their discomfort, concern, or confusion
   - Sound natural and human, not clinical
   - Avoid medical framing initially
   ❌ Bad: "This could be due to stress or dehydration."
   ✅ Good: "That sounds frustrating — especially when you're not sure what's causing it."

2. USE MEMORY SELECTIVELY
   - Reference history ONLY if clearly relevant to today's query
   - If returning within a few days AND related: "This seems similar to what you mentioned recently"
   - If long gap or unrelated: Don't force callbacks
   - Use fuzzy time: "recently", "earlier this week", "the last time we spoke"
   - NEVER use precise dates like "12 days ago" or "on January 14th"
   ❌ Bad: "Last month you mentioned headaches..."
   ✅ Good: "This sounds similar to what came up recently."

3. PERSONALISATION WITHOUT OVER-ADDRESSING
   - Use name more in early chats (1-3), then naturally reduce
   - Don't start every answer with the name
   - Don't repeat personal facts already implied
   ❌ Bad: "Garv, since you are 34 years old and weigh 72 kg..."
   ✅ Good: "That sounds uncomfortable — especially if it's been disrupting your routine."

4. CONTEXTUAL INTERPRETATION
   - Connect to patterns, not logs
   - Reference only ONE past signal if relevant
   - Keep it light and optional
   ❌ Bad: "You mentioned this on Monday and again on Wednesday..."
   ✅ Good: "This fits with a pattern we've noticed."

5. GUIDANCE (4-6 actionable steps)
   - Specific, practical, safe advice
   - Include timing and instructions
   - Cover rest, hydration, nutrition, lifestyle

6. NEXT STEPS (3-4 encouraging, mentor-like points)
   - Write like a caring mentor who believes in the person
   - Be warm, motivating, and encouraging - not clinical
   - Guide them with confidence and positivity
   - Make them feel empowered, not anxious
   - Include "I believe...", "You've got this", "I'm here for you"
   - Balance optimism with practical action steps
   - Only mention seeking medical care if genuinely warranted
   ✅ Good: "Take this one step at a time — start with rest today, and let's check in tomorrow. You're already doing the right thing by paying attention to your body."
   ✅ Good: "I believe you'll feel better soon. In the meantime, be gentle with yourself and prioritize rest. You've got this."
   ❌ Bad: "Seek immediate medical attention if symptoms worsen."

7. ONE FOLLOW-UP ONLY
   - Place at the very end
   - Ask ONLY if it genuinely improves guidance
   - Either clarifying question OR time-based check-in
   ✅ "Let's check in tomorrow if this continues."
   ✅ "Have you had any fever today?"
   ❌ Never interrogate or ask multiple questions

8. TONE CALIBRATION
   - Calm, reassuring, non-alarmist
   - Avoid absolutes: "this means", "you must"
   - Prefer: "This often", "In many cases", "It might help to..."
   - Sound like a thoughtful companion, not a medical report

9. WHAT NOT TO DO
   - Don't explain "we are tracking" or mention internal memory
   - Don't quote memory explicitly
   - Don't sound like a system recalling facts
   - Don't repeat disclaimers excessively

SAFETY RULES:
- Never diagnose or prescribe medications
- For severe symptoms (chest pain, difficulty breathing), ALWAYS flag emergency
- When uncertain, recommend professional care

OUTPUT JSON:
{
  "reflection": "Start with empathetic acknowledgment (NOT analysis)",
  "interpretation": "What this likely means, referencing patterns ONLY if relevant",
  "guidance": ["Step 1 with timing", "Step 2", "Step 3", "Step 4"],
  "redFlags": ["Encouraging mentor-like guidance: warm, motivating, empowering", "Supportive next step with positivity", "Gentle reminder with confidence in them"],
  "followUp": "ONE optional question OR time-based check-in",
  "recommendations": ["Lifestyle habit 1", "Habit 2", "Habit 3"],
  "suggestedIssueUpdates": [
    {
      "action": "create | update | resolve | none",
      "issueId": "uuid or null",
      "label": "Brief issue name",
      "status": "active | improving | resolved | monitoring",
      "severity": "mild | moderate | severe",
      "reason": "Why this update"
    }
  ]
}

Remember: Speak like a thoughtful healthcare companion who remembers the person — not like a system recalling stored facts.`;

    const userPrompt = `USER QUERY: "${query}"

CONTEXT:
${context?.name ? `- Name: ${context.name}` : ''}
${context?.age ? `- Age: ${context.age} years` : ''}
${context?.gender ? `- Gender: ${context.gender}` : ''}
${context?.weight ? `- Weight: ${context.weight} kg (use silently for reasoning only)` : ''}
${context?.height ? `- Height: ${context.height} cm (use silently for reasoning only)` : ''}

Respond following all rules above: reflection first, selective memory use, fuzzy time references, calm tone, one follow-up only.`;

    // 3. Call OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.6,
        max_tokens: 2000,
      }),
    });

    const openaiData = await openaiResponse.json();
    const aiResponse = JSON.parse(openaiData.choices[0].message.content);

    // 4. Save conversation event
    await supabase.from('event_memory').insert({
      profile_id: profileId,
      event_type: 'conversation',
      description: query,
      metadata: {
        reflection: aiResponse.reflection,
        interpretation: aiResponse.interpretation,
      },
    });

    // 5. Process issue updates
    if (aiResponse.suggestedIssueUpdates) {
      for (const update of aiResponse.suggestedIssueUpdates) {
        if (update.action === 'create' && update.label) {
          // Check for duplicates
          const { data: existing } = await supabase
            .from('active_issues')
            .select('*')
            .eq('profile_id', profileId)
            .eq('label', update.label)
            .in('status', ['active', 'monitoring'])
            .single();

          if (!existing) {
            const now = new Date().toISOString();
            await supabase.from('active_issues').insert({
              profile_id: profileId,
              label: update.label,
              status: update.status || 'active',
              severity: update.severity || 'mild',
              first_reported_at: now,
              last_mentioned_at: now,
              notes: update.reason,
            });
          }
        }
      }
    }

    // Return formatted response
    return new Response(
      JSON.stringify({
        reflection: aiResponse.reflection,
        interpretation: aiResponse.interpretation,
        guidance: aiResponse.guidance,
        redFlags: aiResponse.redFlags,
        followUp: aiResponse.followUp,
        recommendations: aiResponse.recommendations || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, retryable: true }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

