export function extractTextFromLandingAiMd(rawContent: string): string {
  const MARKDOWN_PATTERN = /markdown="([^"\\]*(?:\\.[^"\\]*)*)"/g;
  const matches: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = MARKDOWN_PATTERN.exec(rawContent)) !== null) {
    let decoded = m[1]!
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'");
    decoded = decoded.replace(/<a id='[^']*'><\/a>\s*/g, "");
    decoded = decoded.replace(/<a id="[^"]*"><\/a>\s*/g, "");
    decoded = decoded.trim();
    if (decoded) matches.push(decoded);
  }
  return matches.length > 0 ? matches.join("\n\n") : rawContent;
}
