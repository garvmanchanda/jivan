# Fallback Response Template

When the AI system fails or is unavailable, use this safe fallback response:

```json
{
  "summary": "We apologize, but we're unable to process your health query at this moment. Your health and safety are our top priority, so we recommend consulting with a healthcare professional for proper evaluation.",
  "causes": [
    "System temporarily unable to analyze your symptoms",
    "For accurate assessment, professional medical evaluation is recommended"
  ],
  "self_care": [
    "If you're experiencing mild symptoms, monitor your condition closely",
    "Keep a record of your symptoms, including when they started and any changes",
    "Stay hydrated and get adequate rest",
    "Take note of any factors that make symptoms better or worse"
  ],
  "red_flags": [
    "Seek immediate emergency care if you experience severe chest pain, difficulty breathing, sudden weakness, severe bleeding, or loss of consciousness",
    "Call your doctor right away if symptoms worsen rapidly or you develop new concerning symptoms",
    "Go to the ER immediately if you feel your condition is life-threatening"
  ],
  "recommendations": [
    "Contact your primary care physician or visit an urgent care center for proper evaluation",
    "Do not delay seeking medical attention if you're concerned about your symptoms",
    "If this is a medical emergency, call 911 or go to the nearest emergency room",
    "Consider using telemedicine services for immediate consultation if available"
  ],
  "follow_up": [
    "Schedule an appointment with your healthcare provider as soon as possible",
    "Keep track of all symptoms and their progression to share with your doctor",
    "Have a list of any medications you're currently taking ready for your appointment"
  ]
}
```

## When to Use Fallback:

1. AI service is down or unresponsive
2. Response parsing fails
3. Safety validation detects potentially harmful content
4. Rate limits exceeded
5. Invalid or incomplete AI response
6. Query contains unsafe or inappropriate content

## Logging:

Always log the reason for fallback to help improve the system:
- Original query
- Error type
- Timestamp
- User ID (hashed)

## User Communication:

Display a friendly message:
"We're experiencing technical difficulties. For your safety, we recommend consulting with a healthcare professional directly. If this is an emergency, please call 911 or visit your nearest emergency room."

