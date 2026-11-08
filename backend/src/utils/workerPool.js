import { Worker } from 'worker_threads';

const WORKER_URL = new URL('../workers/cpuWorker.js', import.meta.url);

let workerInstance = null;
let reqSeq = 0;
const pendingCallbacks = new Map();

function ensureWorker() {
  if (workerInstance) return workerInstance;

  try {
    const w = new Worker(WORKER_URL);
    w.unref();

    w.on('message', ({ id, ok, result, error }) => {
      const entry = pendingCallbacks.get(id);
      if (!entry) return;
      pendingCallbacks.delete(id);
      clearTimeout(entry.timer);
      if (ok) {
        entry.resolve(result);
      } else {
        entry.reject(new Error(error || 'Worker task error'));
      }
    });

    w.on('error', (err) => {
      console.warn('⚠️ [CPU Worker] Erro na thread auxiliar, recriando sob demanda:', err.message);
      workerInstance = null;
      for (const [id, entry] of pendingCallbacks.entries()) {
        clearTimeout(entry.timer);
        entry.reject(err);
        pendingCallbacks.delete(id);
      }
    });

    w.on('exit', () => {
      workerInstance = null;
    });

    workerInstance = w;
    return w;
  } catch (err) {
    console.warn('⚠️ [CPU Worker] Indisponível, operando via fallback seguro:', err.message);
    return null;
  }
}

export function runCpuTask(task, payload, timeoutMs = 10_000) {
  return new Promise((resolve, reject) => {
    const worker = ensureWorker();
    if (!worker) {
      return reject(new Error('Worker thread unavailable'));
    }

    const id = ++reqSeq;
    const timer = setTimeout(() => {
      pendingCallbacks.delete(id);
      reject(new Error(`Worker task "${task}" timed out`));
    }, timeoutMs);

    pendingCallbacks.set(id, { resolve, reject, timer });
    worker.postMessage({ id, task, payload });
  });
}

export async function pcmBase64ToWavOffThread(pcmBase64, sampleRate = 24000, fallbackFn = null) {
  try {
    const arrayBuf = await runCpuTask('pcmBase64ToWav', {
      pcmBase64,
      sampleRate,
      numChannels: 1,
      bitsPerSample: 16,
    });
    return Buffer.from(arrayBuf);
  } catch {
    if (typeof fallbackFn === 'function') {
      return fallbackFn(Buffer.from(pcmBase64, 'base64'), sampleRate, 1, 16);
    }
    throw new Error('Falha ao converter PCM para WAV.');
  }
}

