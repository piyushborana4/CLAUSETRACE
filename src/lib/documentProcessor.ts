/**
 * CLAUSETRACE Document Background Processor
 * Coordinates Web Worker parallel processing and in-process WebCrypto fallback.
 */

export interface ProcessedDocumentData {
  hash: string;
  wordCount: number;
  estimatedTokens: number;
  estimatedReadingTimeMinutes: number;
  detectedClauses: {
    sectionNumber: string;
    heading: string;
    text: string;
    characterCount: number;
  }[];
}

let workerInstance: Worker | null = null;
const pendingWorkerRequests = new Map<string, {
  resolve: (data: ProcessedDocumentData) => void;
  reject: (err: any) => void;
}>();

function getWorker(): Worker | null {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    return null;
  }
  if (!workerInstance) {
    try {
      workerInstance = new Worker(
        new URL('../workers/documentParserWorker.ts', import.meta.url),
        { type: 'module' }
      );
      workerInstance.onmessage = (e: MessageEvent) => {
        const { messageId, result, error } = e.data;
        const handler = pendingWorkerRequests.get(messageId);
        if (handler) {
          pendingWorkerRequests.delete(messageId);
          if (error) {
            handler.reject(new Error(error));
          } else {
            handler.resolve(result);
          }
        }
      };
      workerInstance.onerror = () => {
        workerInstance = null;
      };
    } catch {
      workerInstance = null;
    }
  }
  return workerInstance;
}

/**
 * Computes SHA-256 hash using Web Crypto API.
 */
export async function computeDocumentHash(content: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Node.js or fallback simple hash
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) - hash + content.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

/**
 * In-process text processor fallback
 */
function processDocumentTextSync(rawText: string, hash: string): ProcessedDocumentData {
  const words = rawText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const estimatedTokens = Math.ceil(wordCount * 1.33);
  const estimatedReadingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const lines = rawText.split('\n');
  const detectedClauses: ProcessedDocumentData['detectedClauses'] = [];

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

  return {
    hash,
    wordCount,
    estimatedTokens,
    estimatedReadingTimeMinutes,
    detectedClauses,
  };
}

/**
 * Parses raw text into structured section blocks with statistical metadata.
 * Uses Web Worker when in browser for zero UI lag; falls back to async WebCrypto in-process.
 */
export async function processDocumentTextAsync(rawText: string): Promise<ProcessedDocumentData> {
  const worker = getWorker();
  if (worker) {
    return new Promise<ProcessedDocumentData>((resolve, reject) => {
      const messageId = `proc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      pendingWorkerRequests.set(messageId, { resolve, reject });
      worker.postMessage({ rawText, messageId });

      // 5-second timeout safeguard to fall back to in-process
      setTimeout(() => {
        if (pendingWorkerRequests.has(messageId)) {
          pendingWorkerRequests.delete(messageId);
          computeDocumentHash(rawText).then((hash) => {
            resolve(processDocumentTextSync(rawText, hash));
          });
        }
      }, 5000);
    });
  }

  const hash = await computeDocumentHash(rawText);
  return processDocumentTextSync(rawText, hash);
}
