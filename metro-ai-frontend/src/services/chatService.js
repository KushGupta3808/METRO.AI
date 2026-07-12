// Placeholder for /api/v1/chat (REST or WebSocket - backend TBD).
// sendMessage() returns a canned, corridor-aware reply so the widget is
// fully demoable now. Replace the body with a real fetch/WebSocket call -
// ChatWidget only depends on this function's signature.

const CANNED_REPLIES = [
  (base, target) =>
    `Corridor ${base} to ${target} looks stable right now. I would wait for the next bulletin before moving a large amount.`,
  (base, target) =>
    `Based on the last 30 days, ${target} has been drifting in your favor. Small transfers now are reasonable.`,
  () => 'I can pull live routes for you - try the Compare tab and I will break down the AI recommendation.',
];

export async function sendMessage(message, { baseCurrency, targetCurrency } = {}) {
  await new Promise((resolve) => setTimeout(resolve, 700 + Math.random() * 500));
  const reply = CANNED_REPLIES[Math.floor(Math.random() * CANNED_REPLIES.length)];
  return {
    role: 'assistant',
    text: reply(baseCurrency || 'CAD', targetCurrency || 'INR'),
  };
}
