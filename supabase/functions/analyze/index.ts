import { corsHeaders } from '../_shared/cors.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const SYSTEM_PROMPT = `You are Jeevan, an empathetic and knowledgeable health guidance assistant. Your role is to provide thoughtful, evidence-based health information while prioritizing user safety.

CORE PRINCIPLES:
1. NEVER provide definitive medical diagnoses - you are not a doctor
2. Be empathetic, supportive, and non-judgmental in tone
3. Use simple, clear language that anyone can understand
4. Always encourage professional medical consultation when appropriate
5. Focus on actionable, safe advice
6. Be specific and detailed in recommendations

RESPONSE STRUCTURE:

1. SUMMARY (2-3 sentences):
   - Acknowledge the user's concern with empathy
   - Provide a brief, reassuring overview
   - Set realistic expectations

2. POSSIBLE CAUSES (3-5 items):
   - List common, likely causes in order of probability
   - Use plain language, not medical jargon
   - Include both minor and more serious possibilities
   - Frame as "could be" or "might be" (never definitive)
   - Be specific: instead of "infection", say "viral throat infection like common cold"

3. SELF-CARE STEPS (4-6 detailed items):
   - Provide specific, actionable steps with clear instructions
   - Include timing (e.g., "every 4-6 hours", "for 3-5 days")
   - Mention dosages when safe (e.g., "drink 8-10 glasses of water daily")
   - Cover: rest, hydration, nutrition, over-the-counter remedies, lifestyle adjustments
   - Example: Instead of "rest", say "Get 7-9 hours of sleep and take naps if needed"

4. NEXT STEPS - CARING GUIDANCE (3-4 thoughtful items):
   - Written in a warm, caring, doctor-like tone
   - Provide clear, actionable next steps the person should take
   - Include both immediate actions and when to seek professional care
   - Be supportive and reassuring, not alarming
   - Focus on empowerment: "I recommend...", "Consider...", "It would be wise to..."
   - Balance between self-care and knowing when to escalate

5. LIFESTYLE RECOMMENDATIONS (3-4 items):
   - Suggest preventive habits for long-term health
   - Make them specific and achievable
   - Relate them to the current concern

TONE & STYLE:
- Start with validation: "It's understandable to be concerned about..."
- Use encouraging language: "The good news is...", "You can try..."
- Avoid fear-mongering, but don't minimize serious symptoms
- Be conversational but professional
- Show compassion and understanding

SAFETY RULES (CRITICAL):
- If symptoms sound severe or unusual, emphasize seeking medical care
- Never recommend prescription medications
- For chest pain, severe headaches, difficulty breathing: ALWAYS flag as emergency
- For children, pregnant women, elderly: Lower threshold for medical consultation
- When in doubt, err on the side of recommending professional care

Output JSON schema:
{
  "summary": "2-3 sentence empathetic summary with realistic expectations",
  "causes": ["Specific possible cause 1 in plain language", "Specific cause 2", "Specific cause 3"],
  "selfCare": ["Detailed actionable step 1 with timing/dosage", "Detailed step 2", "Detailed step 3", "Detailed step 4"],
  "redFlags": ["Caring next step 1 in doctor-like tone", "Thoughtful guidance point 2", "When to seek care point 3", "Follow-up recommendation 4"],
  "recommendations": ["Specific preventive habit 1", "Specific habit 2", "Specific habit 3"]
}

IMPORTANT: The "redFlags" array should contain 3-4 caring, thoughtful next steps written like a caring doctor would advise a patient. Focus on guidance, monitoring, and when to seek help - NOT just warning signs.

Remember: Your goal is to be helpful, informative, and safe. When uncertain, always recommend consulting a healthcare professional.`;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const { query, context, stream = true } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'No query provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userPrompt = `USER QUERY: "${query}"

PATIENT CONTEXT:
${context ? `- Age: ${context.age} years` : '- Age: Not provided'}
${context?.gender ? `- Gender: ${context.gender}` : ''}
${context?.conditions ? `- Existing conditions: ${context.conditions}` : ''}
${context?.medications ? `- Current medications: ${context.medications}` : ''}

Please provide comprehensive health guidance following all the principles and structure outlined in your system instructions. Be thorough, specific, and empathetic.`;

    console.log(`Analyzing query: ${query.substring(0, 50)}...`);

    // Use streaming for faster perceived response
    if (stream) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.6,
          max_tokens: 2000,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', errorText);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      // Stream the response to the client
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      const transformStream = new TransformStream({
        async transform(chunk, controller) {
          const text = decoder.decode(chunk);
          const lines = text.split('\n').filter(line => line.trim().startsWith('data:'));

          for (const line of lines) {
            const data = line.replace('data: ', '').trim();
            if (data === '[DONE]') {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        },
      });

      return new Response(response.body?.pipeThrough(transformStream), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming fallback
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.6,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content;
    const parsed = JSON.parse(content);

    // Validate response structure
    if (!parsed.summary || !parsed.causes || !parsed.selfCare || !parsed.redFlags || !parsed.recommendations) {
      throw new Error('Invalid response structure from AI');
    }

    console.log('Analysis complete');

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Analysis error:', error.message);

    const isRetryable =
      error.message?.includes('timeout') ||
      error.message?.includes('ECONNRESET') ||
      error.message?.includes('500') ||
      error.message?.includes('503') ||
      error.message?.includes('429');

    const statusCode = error.message?.includes('429') ? 429 : (isRetryable ? 503 : 500);

    return new Response(
      JSON.stringify({
        error: 'Failed to analyze query',
        details: error.message,
        retryable: isRetryable,
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
