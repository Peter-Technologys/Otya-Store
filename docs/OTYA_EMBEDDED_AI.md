# Embedded OTYA intelligence

OTYA should not require visitors or Android users to enter a standalone chatbot for ordinary help.

Primary surfaces:

- Android Search: local media and app knowledge first; online AI may add a concise inline answer.
- Android Help & Support: Ask OTYA can answer product and general questions when online.
- Website Support: `OtyaAssistPrompt` uses the existing `/api/ai/chat` endpoint with the same guest identity as the existing chat system.

The existing full conversation route may remain as a fallback for explicit follow-up, history and model-selection workflows, but it is not the primary product navigation.
