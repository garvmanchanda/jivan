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
    const systemPrompt = `You are Jeevan, a healthcare concierge managing an ongoing health journey.

CRITICAL CONTEXT:
You are NOT starting fresh. You have memory of this person's health over time.

${activeIssues.length > 0 ? 'ACTIVE ONGOING ISSUES:' : 'No active issues currently tracked.'}
${activeIssues.map(issue => 
  `- ${issue.label} (${issue.status}, ${issue.severity}) - first reported ${formatDate(issue.first_reported_at)}, last mentioned ${formatDate(issue.last_mentioned_at)}`
).join('\n')}

${recentEvents.length > 0 ? 'RECENT HEALTH EVENTS:' : ''}
${recentEvents.map(event => `- ${event.description} (${formatDate(event.timestamp)})`).join('\n')}

${insights.length > 0 ? 'LEARNED INSIGHTS:' : ''}
${insights.map(insight => `- ${insight.insight} (confidence: ${Math.round(insight.confidence * 100)}%)`).join('\n')}

YOUR RESPONSE MUST:
1. REFLECTION: Mirror their feeling AND reference continuity if applicable
2. INTERPRETATION: Connect today's query to past patterns (if any)
3. GUIDANCE: Specific, actionable, safe steps (4-6 items)
4. RED FLAGS: Clear escalation signals (3-4 items)
5. ONE FOLLOW-UP: Either ask a clarifying question OR set a time-based check-in
6. SUGGESTED ISSUE UPDATES: How should we update the memory?

SAFETY RULES:
- Never diagnose or prescribe medications
- For severe symptoms, ALWAYS flag emergency
- When uncertain, recommend professional care

OUTPUT JSON SCHEMA:
{
  "reflection": "Empathetic acknowledgment WITH continuity reference if applicable",
  "interpretation": "What this means given their ongoing issues and patterns",
  "guidance": ["Detailed step 1", "Step 2", "Step 3", "Step 4"],
  "redFlags": ["When to seek care point 1", "Warning sign 2", "Follow-up recommendation 3"],
  "followUp": "One specific question OR time-based next step",
  "recommendations": ["Lifestyle recommendation 1", "Recommendation 2", "Recommendation 3"],
  "suggestedIssueUpdates": [
    {
      "action": "create | update | resolve | none",
      "issueId": "uuid for update/resolve, null for create",
      "label": "Brief issue name",
      "status": "active | improving | resolved | monitoring",
      "severity": "mild | moderate | severe",
      "reason": "1-2 sentence explanation"
    }
  ]
}`;

    const userPrompt = `USER QUERY: "${query}"

PATIENT CONTEXT:
${context?.age ? `- Age: ${context.age} years` : '- Age: Not provided'}
${context?.gender ? `- Gender: ${context.gender}` : ''}

Please provide comprehensive health guidance following all principles and structure outlined.`;

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

