/**
 * CLAUSETRACE Background Document Parser Web Worker
 * Offloads SHA-256 document hashing, token estimation, and regex section slicing off the main thread.
 */

self.onmessage = async (e: MessageEvent<{ rawText: string; messageId: string }>) => {
  const { rawText, messageId } = e.data;
  if (!rawText) {
    self.postMessage({ messageId, error: 'Empty text provided' });
    return;
  }

  try {
    // 1. Compute SHA-256 hash using crypto.subtle in worker
    const encoder = new TextEncoder();
    const data = encoder.encode(rawText);
    const hashBuffer = await self.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    // 2. Metrics
    const words = rawText.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const estimatedTokens = Math.ceil(wordCount * 1.33);
    const estimatedReadingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

    // 3. Regex Clause Parsing
    const lines = rawText.split('\n');
    const detectedClauses: Array<{
      sectionNumber: string;
      heading: string;
      text: string;
      characterCount: number;
    }> = [];

    let currentSection = {
      sectionNumber: 'Section 1',
      heading: 'Preamble / Recitals',
      text: '',
      characterCount: 0,
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const match = /(?:Section|Clause|Article|\d+[\.\)])\s*([0-9A-Za-z\.\-]+)[\s:\-\–]+(.+)/i.exec(trimmed);
      if (match) {
        if (currentSection.text.trim()) {
          currentSection.characterCount = currentSection.text.length;
          detectedClauses.push({ ...currentSection });
        }
        currentSection = {
          sectionNumber: match[1] ? `Section ${match[1]}` : `Section ${detectedClauses.length + 1}`,
          heading: match[2]?.trim() || 'Provision',
          text: trimmed + '\n',
          characterCount: 0,
        };
      } else {
        currentSection.text += line + '\n';
      }
    }

    if (currentSection.text.trim()) {
      currentSection.characterCount = currentSection.text.length;
      detectedClauses.push(currentSection);
    }

    if (detectedClauses.length === 0) {
      detectedClauses.push({
        sectionNumber: 'Section 1',
        heading: 'General Provisions',
        text: rawText,
        characterCount: rawText.length,
      });
    }

    self.postMessage({
      messageId,
      result: {
        hash,
        wordCount,
        estimatedTokens,
        estimatedReadingTimeMinutes,
        detectedClauses,
      },
    });
  } catch (err: any) {
    self.postMessage({ messageId, error: err?.message || 'Worker parsing error' });
  }
};
