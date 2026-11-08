/**
 * Parser binário ultrarrápido de multipart/form-data para upload de áudio no /api/chat/audio
 * Evita serializar e fazer JSON.parse de megabytes de Base64 na Main Thread do Node.js.
 */

const MAX_MULTIPART_BYTES = 25 * 1024 * 1024; // 25 MB

export function isMultipartRequest(req) {
  const ct = String(req.headers?.['content-type'] || '').toLowerCase();
  return ct.startsWith('multipart/form-data') && ct.includes('boundary=');
}

export function parseMultipartAudioRequest(req) {
  return new Promise((resolve, reject) => {
    const ct = String(req.headers?.['content-type'] || '');
    const match = ct.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    const boundaryStr = (match?.[1] || match?.[2] || '').trim();
    if (!boundaryStr) {
      return reject(new Error('Boundary ausente em multipart/form-data.'));
    }

    const chunks = [];
    let totalBytes = 0;

    req.on('data', (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > MAX_MULTIPART_BYTES) {
        req.destroy();
        reject(new Error('Arquivo de áudio excede o limite máximo de 25MB.'));
        return;
      }
      chunks.push(chunk);
    });

    req.on('error', (err) => reject(err));

    req.on('end', () => {
      try {
        const fullBuf = Buffer.concat(chunks);
        const delimiter = Buffer.from(`--${boundaryStr}`);
        const headerSep = Buffer.from('\r\n\r\n');

        const fields = {};
        let audioBuffer = null;
        let audioMimeType = 'audio/webm';

        let pos = fullBuf.indexOf(delimiter);
        while (pos !== -1) {
          const partStart = pos + delimiter.length;
          // Final boundary "--boundary--"
          if (fullBuf[partStart] === 0x2d && fullBuf[partStart + 1] === 0x2d) {
            break;
          }

          // Pula \r\n após o boundary
          const contentStart =
            fullBuf[partStart] === 0x0d && fullBuf[partStart + 1] === 0x0a ? partStart + 2 : partStart;
          const nextBoundaryPos = fullBuf.indexOf(delimiter, contentStart);
          if (nextBoundaryPos === -1) break;

          // Remove \r\n final antes do próximo boundary
          let partEnd = nextBoundaryPos;
          if (fullBuf[partEnd - 2] === 0x0d && fullBuf[partEnd - 1] === 0x0a) {
            partEnd -= 2;
          }

          const headerEnd = fullBuf.indexOf(headerSep, contentStart);
          if (headerEnd !== -1 && headerEnd < partEnd) {
            const rawHeaders = fullBuf.subarray(contentStart, headerEnd).toString('utf8');
            const bodySlice = fullBuf.subarray(headerEnd + 4, partEnd);

            const nameMatch = rawHeaders.match(/name="([^"]+)"/i);
            const filenameMatch = rawHeaders.match(/filename="([^"]*)"/i);
            const partTypeMatch = rawHeaders.match(/Content-Type:\s*([^\r\n;]+)/i);
            const fieldName = nameMatch?.[1] || '';

            if (filenameMatch || fieldName === 'audio') {
              audioBuffer = Buffer.from(bodySlice);
              if (partTypeMatch?.[1]) {
                audioMimeType = partTypeMatch[1].trim();
              }
            } else if (fieldName) {
              fields[fieldName] = bodySlice.toString('utf8');
            }
          }

          pos = nextBoundaryPos;
        }

        resolve({ fields, audioBuffer, audioMimeType });
      } catch (err) {
        reject(err);
      }
    });
  });
}

