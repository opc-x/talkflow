/** Build gpt-image-1 prompt for one Q&A pair illustration */

export function buildQaSceneImagePrompt(question: string, answer: string): string {
  const q = question.trim().slice(0, 200);
  const a = answer.trim().slice(0, 200);
  return [
    "Flat educational illustration for an English speaking lesson.",
    "Warm cream classroom, soft lighting, clean children's textbook style.",
    "Single clear scene — no text, no letters, no speech bubbles in the image.",
    `The picture must visually match this answer: "${a}".`,
    `Question context: "${q}".`,
    "Show relevant objects large and easy to see (pen, pencil, book, desk, clock, etc.).",
    "One obvious focal object if the answer names one item.",
    "4:3 friendly composition, not cluttered.",
  ].join(" ");
}
