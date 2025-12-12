# Symptom Extraction Instructions

Your task is to extract structured symptom information from user's health query.

## Input Format:
You will receive a natural language query like:
- "I have a headache and fever for 2 days"
- "My child has been coughing at night"
- "Feeling dizzy when I stand up"

## Output Format:
Extract the following structured information in JSON:

```json
{
  "primary_symptoms": ["symptom1", "symptom2"],
  "duration": "X days/hours/weeks",
  "severity": "mild/moderate/severe",
  "timing": "constant/intermittent/specific time",
  "triggers": ["trigger1", "trigger2"],
  "associated_symptoms": ["symptom1", "symptom2"],
  "affected_person": "self/child/parent/other",
  "age_group": "infant/child/teen/adult/senior",
  "medications_tried": ["medication1", "medication2"]
}
```

## Extraction Rules:

1. **Primary Symptoms**: Main health concerns mentioned
2. **Duration**: How long symptoms have been present (extract timeframe)
3. **Severity**: Mild (minor discomfort), Moderate (affecting daily activities), Severe (unable to function)
4. **Timing**: When symptoms occur
5. **Triggers**: What makes symptoms worse
6. **Associated Symptoms**: Secondary symptoms mentioned
7. **Affected Person**: Who is experiencing this (based on profile relation)
8. **Age Group**: Infer from profile data if available
9. **Medications Tried**: Any OTC or prescribed meds mentioned

## Important:
- If information is not provided, use null
- Don't make assumptions
- Extract exactly what's stated

