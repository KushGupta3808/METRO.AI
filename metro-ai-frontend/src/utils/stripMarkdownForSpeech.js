// Assistant replies are rendered as Markdown, but SpeechSynthesis reads
// raw characters literally - "**strengthened**" would come out as
// "asterisk asterisk strengthened asterisk asterisk" without this. Strips
// the common syntax down to plain, speakable text.
export function stripMarkdownForSpeech(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, '') // code blocks - don't read code aloud
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links -> just the label
    .replace(/^#{1,6}\s+/gm, '') // headings
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // italics
    .replace(/^\s*[-*+]\s+/gm, '') // bullet markers
    .replace(/^\s*\d+\.\s+/gm, '') // numbered list markers
    .replace(/\n{2,}/g, '. ') // paragraph breaks -> a natural pause
    .replace(/\n/g, ' ')
    .trim();
}