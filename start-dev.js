import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('====================================================');
console.log('🌿 [Mentoria ISAAC] Iniciando Backend Hermes & Frontend...');
console.log('📡 Backend:  http://localhost:3001');
console.log('💻 Frontend: http://localhost:5173');
console.log('====================================================\n');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

// Inicia o Backend com auto-reinicialização em caso de queda
let backendProcess = null;
function startBackend() {
  backendProcess = spawn(npmCmd, ['run', 'dev'], {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit',
    shell: true,
  });

  backendProcess.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.warn(`\n⚠️ [Backend Hermes] Processo encerrou (código ${code}). Reiniciando em 2s...`);
      setTimeout(startBackend, 2000);
    }
  });
}
startBackend();

// Inicia o Frontend (Porta 5173 com proxy /api para 3001)
const frontend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true,
});

function cleanup() {
  console.log('\n🛑 Encerrando Mentoria ISAAC...');
  try { backendProcess?.kill(); } catch {}
  try { frontend?.kill(); } catch {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
