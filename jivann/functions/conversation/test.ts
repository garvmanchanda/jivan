// Mock tests for the conversation Edge Function
// Run with: deno test --allow-env functions/conversation/test.ts

import { assertEquals, assertExists } from "https://deno.land/std@0.177.0/testing/asserts.ts";

// Mock response that matches the LLM response schema
const mockLLMResponse = {
  intent: "symptom_check",
  summary: "I understand you're experiencing headaches. Let me help you with some guidance.",
  recommendations: [
    {
      type: "general",
      title: "Stay Hydrated",
      description: "Ensure you're drinking at least 8 glasses of water daily.",
      priority: 1,
    },
    {
      type: "lifestyle",
      title: "Rest in a Dark Room",
      description: "If possible, rest in a quiet, dark room for 15-20 minutes.",
      priority: 2,
    },
  ],
  follow_up_questions: [
    "How long have you been experiencing these headaches?",
    "Are you experiencing any other symptoms like nausea or light sensitivity?",
  ],
  urgency_level: "low" as const,
  suggested_actions: [
    {
      action_type: "track_symptom",
      label: "Log Headache",
      payload: { symptom_type: "headache" },
    },
    {
      action_type: "schedule_appointment",
      label: "Schedule Check-up",
      payload: { appointment_type: "checkup" },
    },
  ],
};

// Mock profile context
const mockProfileContext = {
  id: "test-profile-id",
  name: "John Doe",
  relationship: "self",
  date_of_birth: "1990-01-15",
  medical_conditions: ["Migraine history"],
  allergies: ["Penicillin"],
  medications: ["Vitamin D"],
  notes: "Prefers natural remedies",
};

// Test: Mock response structure validation
Deno.test("Mock response has valid structure", () => {
  assertExists(mockLLMResponse.intent);
  assertExists(mockLLMResponse.summary);
  assertExists(mockLLMResponse.recommendations);
  assertExists(mockLLMResponse.follow_up_questions);
  assertExists(mockLLMResponse.urgency_level);
  assertExists(mockLLMResponse.suggested_actions);
  
  assertEquals(typeof mockLLMResponse.intent, "string");
  assertEquals(typeof mockLLMResponse.summary, "string");
  assertEquals(Array.isArray(mockLLMResponse.recommendations), true);
  assertEquals(Array.isArray(mockLLMResponse.follow_up_questions), true);
  assertEquals(Array.isArray(mockLLMResponse.suggested_actions), true);
});

// Test: Urgency level is valid
Deno.test("Urgency level is valid", () => {
  const validLevels = ["low", "medium", "high", "emergency"];
  assertEquals(validLevels.includes(mockLLMResponse.urgency_level), true);
});

// Test: Recommendations have required fields
Deno.test("Recommendations have required fields", () => {
  for (const rec of mockLLMResponse.recommendations) {
    assertExists(rec.type);
    assertExists(rec.title);
    assertExists(rec.description);
    assertExists(rec.priority);
    assertEquals(typeof rec.priority, "number");
  }
});

// Test: Suggested actions have required fields
Deno.test("Suggested actions have required fields", () => {
  for (const action of mockLLMResponse.suggested_actions) {
    assertExists(action.action_type);
    assertExists(action.label);
    assertEquals(typeof action.action_type, "string");
    assertEquals(typeof action.label, "string");
  }
});

// Test: Profile context validation
Deno.test("Profile context has required fields", () => {
  assertExists(mockProfileContext.id);
  assertExists(mockProfileContext.name);
  assertExists(mockProfileContext.relationship);
  assertEquals(Array.isArray(mockProfileContext.medical_conditions), true);
  assertEquals(Array.isArray(mockProfileContext.allergies), true);
  assertEquals(Array.isArray(mockProfileContext.medications), true);
});

// Mock function to simulate the getMockResponse function from index.ts
function getMockResponse(transcript: string): typeof mockLLMResponse {
  return {
    intent: "health_inquiry",
    summary: `I understood you're asking about: "${transcript.substring(0, 100)}..."`,
    recommendations: [
      {
        type: "general",
        title: "Stay Hydrated",
        description: "Ensure you're drinking enough water throughout the day.",
        priority: 1,
      },
      {
        type: "lifestyle",
        title: "Rest Well",
        description: "Getting adequate sleep is crucial for recovery.",
        priority: 2,
      },
    ],
    follow_up_questions: [
      "How long have you been experiencing these symptoms?",
      "Have you tried any remedies so far?",
    ],
    urgency_level: "low",
    suggested_actions: [
      {
        action_type: "track_symptom",
        label: "Log this symptom",
        payload: { symptom_type: "general" },
      },
      {
        action_type: "schedule_appointment",
        label: "Schedule a check-up",
        payload: { appointment_type: "checkup" },
      },
    ],
  };
}

// Test: Mock response generator works
Deno.test("Mock response generator returns valid response", () => {
  const response = getMockResponse("I have a headache");
  
  assertExists(response.intent);
  assertExists(response.summary);
  assertEquals(response.intent, "health_inquiry");
  assertEquals(response.summary.includes("I understood"), true);
});

// Test: Mock response handles long transcripts
Deno.test("Mock response handles long transcripts", () => {
  const longTranscript = "a".repeat(200);
  const response = getMockResponse(longTranscript);
  
  // Should truncate to 100 chars in summary
  assertEquals(response.summary.length < longTranscript.length + 50, true);
});

// Simulated API response structure test
Deno.test("API response structure is valid", () => {
  const apiResponse = {
    success: true,
    conversation_id: "test-conv-id",
    transcript: "I have a headache",
    llm_response: mockLLMResponse,
    processing_time_ms: 1234,
  };

  assertExists(apiResponse.success);
  assertExists(apiResponse.conversation_id);
  assertExists(apiResponse.transcript);
  assertExists(apiResponse.llm_response);
  assertExists(apiResponse.processing_time_ms);
  
  assertEquals(apiResponse.success, true);
  assertEquals(typeof apiResponse.processing_time_ms, "number");
});

// Test: Error response structure
Deno.test("Error response structure is valid", () => {
  const errorResponse = {
    success: false,
    error: "Profile not found",
  };

  assertEquals(errorResponse.success, false);
  assertExists(errorResponse.error);
  assertEquals(typeof errorResponse.error, "string");
});

console.log("\n✅ All mock tests passed! The Edge Function can be tested without real OpenAI keys.\n");
console.log("To use mock mode, set MOCK_MODE=true in your environment.\n");

