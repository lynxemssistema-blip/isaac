import { parentPort } from 'worker_threads';

function buildWavFromPcmBuffer(pcmBuffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const out = Buffer.allocUnsafe(44 + dataSize);

  out.write('RIFF', 0);
  out.writeUInt32LE(36 + dataSize, 4);
  out.write('WAVE', 8);
  out.write('fmt ', 12);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(numChannels, 22);
  out.writeUInt32LE(sampleRate, 24);
  out.writeUInt32LE(byteRate, 28);
  out.writeUInt16LE(blockAlign, 32);
  out.writeUInt16LE(bitsPerSample, 34);
  out.write('data', 36);
  out.writeUInt32LE(dataSize, 40);
  pcmBuffer.copy(out, 44);

  return out;
}

function chunkTextForRag(rawText = '', chunkSize = 1100, overlap = 180) {
  const cleaned = String(rawText || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!cleaned) return [];
  if (cleaned.length <= chunkSize) return [cleaned];

  const chunks = [];
  let start = 0;
  while (start < cleaned.length) {
    let end = Math.min(cleaned.length, start + chunkSize);
    if (end < cleaned.length) {
      const naturalBreak = Math.max(
        cleaned.lastIndexOf('\n\n', end),
        cleaned.lastIndexOf('. ', end),
        cleaned.lastIndexOf('! ', end),
        cleaned.lastIndexOf('? ', end)
      );
      if (naturalBreak > start + chunkSize * 0.45) {
        end = naturalBreak + 1;
      }
    }
    const piece = cleaned.slice(start, end).trim();
    if (piece.length > 20) chunks.push(piece);
    if (end >= cleaned.length) break;
    start = Math.max(start + 1, end - overlap);
  }
  return chunks;
}

if (parentPort) {
  parentPort.on('message', (msg) => {
    const { id, task, payload } = msg || {};
    try {
      if (task === 'pcmBase64ToWav') {
        const pcmBuf = Buffer.from(payload.pcmBase64, 'base64');
        const wavBuf = buildWavFromPcmBuffer(
          pcmBuf,
          payload.sampleRate || 24000,
          payload.numChannels || 1,
          payload.bitsPerSample || 16
        );
        // Transfere o ArrayBuffer com zero-copy de volta para a main thread
        const ab = wavBuf.buffer.slice(wavBuf.byteOffset, wavBuf.byteOffset + wavBuf.byteLength);
        parentPort.postMessage({ id, ok: true, result: ab }, [ab]);
        return;
      }

      if (task === 'chunkText') {
        const chunks = chunkTextForRag(payload.text, payload.chunkSize, payload.overlap);
        parentPort.postMessage({ id, ok: true, result: chunks });
        return;
      }

      parentPort.postMessage({ id, ok: false, error: `Unknown worker task: ${task}` });
    } catch (err) {
      parentPort.postMessage({ id, ok: false, error: err?.message || 'Worker failure' });
    }
  });
}

