# Embedded Otya intelligence

Otya should not require visitors or Android users to enter a standalone chatbot for ordinary help.

Primary surfaces:

- Android Search: local media and app knowledge first; online intelligence may add a concise inline answer.
- Android Help & Support: **Next** can answer product and general questions when online.
- Website Support: `OtyaAssistPrompt` uses the existing `/api/ai/chat` endpoint with the same guest identity as the supported conversation system.
- Otya Space: Next is available inside the same signed-in environment as the account rather than requiring another identity.

The full Next conversation route may remain for explicit follow-up, history and model-selection workflows. Product pages should still solve simple tasks directly instead of forcing every user through chat.

Never use legacy customer-facing labels such as “Ask OTYA” for new UI. **Next** is the canonical assistant name.
