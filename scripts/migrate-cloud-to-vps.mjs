/**
 * Script Automatizado de Migração Completa: Supabase Cloud -> Supabase VPS (Mentoria ISAAC)
 *
 * O que este script migra (filtrando APENAS dados do ISAAC, ignorando os outros sistemas do Cloud compartilhado):
 * 1. Contas de usuários do ISAAC em auth.users (preservando os mesmos UUIDs!)
 * 2. Todas as 27 tabelas public.izaque_* na ordem exata das chaves estrangeiras (incluindo vetores 768d!)
 * 3. Todos os arquivos dos buckets de Storage (izaque-pdfs e avatars) + atualização automática das URLs públicas!
 *
 * Como usar assim que o Supabase da VPS estiver online em https://supabase.lynxems.com.br
 * e após rodar supabase/vps_isaac_complete_schema.sql no SQL Editor da VPS:
 *
 *   cd backend && node ../scripts/migrate-cloud-to-vps.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '../backend/node_modules/@supabase/supabase-js/dist/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const map = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const idx = trimmed.indexOf('=');
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    map[key] = val;
  }
  return map;
}

const cloudEnv = parseEnvFile(path.join(rootDir, 'backend/.env'));
const vpsEnv = parseEnvFile(path.join(rootDir, 'supabase/vps-supabase.env'));

const SOURCE_URL = process.env.SOURCE_SUPABASE_URL || cloudEnv.SUPABASE_URL;
const SOURCE_KEY = process.env.SOURCE_SERVICE_ROLE_KEY || cloudEnv.SUPABASE_SERVICE_ROLE_KEY;

const TARGET_URL = process.env.TARGET_SUPABASE_URL || vpsEnv.SUPABASE_PUBLIC_URL || 'https://supabaseisaac.lynxems.com.br';
const TARGET_KEY = process.env.TARGET_SERVICE_ROLE_KEY || vpsEnv.SERVICE_ROLE_KEY;

if (!SOURCE_URL || !SOURCE_KEY || !TARGET_URL || !TARGET_KEY) {
  console.error('❌ Verifique backend/.env (Cloud) e supabase/vps-supabase.env (VPS).');
  process.exit(1);
}

console.log(`🚀 Iniciando Migração Dedicada do ISAAC:`);
console.log(`   Origem (Cloud): ${SOURCE_URL}`);
console.log(`   Destino (VPS):  ${TARGET_URL}\n`);

const source = createClient(SOURCE_URL, SOURCE_KEY, { auth: { persistSession: false } });
const target = createClient(TARGET_URL, TARGET_KEY, { auth: { persistSession: false } });

const referencedStorageObjects = new Set();

function rewriteStorageUrls(row) {
  if (!row || typeof row !== 'object') return row;
  const copy = { ...row };
  const publicPrefix = `${SOURCE_URL}/storage/v1/object/public/`;
  for (const [k, v] of Object.entries(copy)) {
    if (typeof v === 'string' && v.includes(SOURCE_URL)) {
      if (v.startsWith(publicPrefix)) {
        const rest = v.slice(publicPrefix.length).split('?')[0];
        if (rest.includes('/')) referencedStorageObjects.add(rest);
      }
      copy[k] = v.split(SOURCE_URL).join(TARGET_URL);
    }
  }
  return copy;
}

async function fetchAllRows(client, table) {
  const all = [];
  const pageSize = 500;
  let from = 0;
  while (true) {
    const { data, error } = await client.from(table).select('*').range(from, from + pageSize - 1);
    if (error) {
      console.warn(`⚠️ Aviso ao ler ${table}: ${error.message}`);
      break;
    }
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

// 1. Descobrir todos os UUIDs de usuários que pertencem ao ISAAC (em qualquer tabela com FK para auth.users/profiles)
const profileRows = await fetchAllRows(source, 'izaque_profiles');
const sessionRows = await fetchAllRows(source, 'izaque_chat_sessions');
const memoryRows = await fetchAllRows(source, 'izaque_user_memories');
const subRows = await fetchAllRows(source, 'izaque_subscriptions');
const termsRows = await fetchAllRows(source, 'izaque_terms_acceptances');
const feedbackRows = await fetchAllRows(source, 'izaque_feedbacks');
const memberRows = await fetchAllRows(source, 'izaque_user_group_members');
const notifRows = await fetchAllRows(source, 'izaque_user_notifications');
const broadcastRows = await fetchAllRows(source, 'izaque_group_broadcasts');
const troubleRows = await fetchAllRows(source, 'izaque_creative_troubles');

const isaacUserIds = new Set([
  ...profileRows.map((r) => r.id),
  ...sessionRows.map((r) => r.user_id),
  ...memoryRows.map((r) => r.user_id),
  ...subRows.map((r) => r.user_id),
  ...termsRows.map((r) => r.user_id),
  ...feedbackRows.map((r) => r.user_id),
  ...memberRows.map((r) => r.user_id),
  ...notifRows.map((r) => r.user_id),
  ...broadcastRows.map((r) => r.sent_by),
  ...troubleRows.map((r) => r.user_id),
].filter(Boolean));

console.log(`👤 Usuários exclusivos do ISAAC identificados: ${isaacUserIds.size}`);

// 2. Migrar contas em auth.users preservando o mesmo UUID
let page = 1;
let migratedUsers = 0;
while (true) {
  const { data, error } = await source.auth.admin.listUsers({ page, perPage: 200 });
  if (error || !data?.users?.length) break;

  for (const u of data.users) {
    if (!isaacUserIds.has(u.id) && u.email !== 'edsonmanoel2012@gmail.com') continue;

    const { error: createErr } = await target.auth.admin.createUser({
      id: u.id,
      email: u.email,
      phone: u.phone || undefined,
      email_confirm: true,
      user_metadata: u.user_metadata || {},
      app_metadata: u.app_metadata || {},
      password: `IsaacTemp#${u.id.slice(0, 8)}!`,
    });

    if (!createErr) {
      migratedUsers++;
    } else if (!createErr.message?.toLowerCase().includes('already')) {
      console.warn(`   ⚠️ Usuário ${u.email}: ${createErr.message}`);
    }
  }
  if (data.users.length < 200) break;
  page++;
}
console.log(`✅ Contas Auth sincronizadas na VPS: ${migratedUsers} novas contas criadas.\n`);

// 3. Ordem estrita de dependências (Foreign Keys) das 27 tabelas izaque_*
const TABLES_IN_ORDER = [
  { name: 'izaque_system_settings', pk: 'id' },
  { name: 'izaque_creator', pk: 'id' },
  { name: 'izaque_plans', pk: 'id' },
  { name: 'izaque_user_groups', pk: 'id' },
  { name: 'izaque_pdf_campaigns', pk: 'id' },
  { name: 'izaque_profiles', pk: 'id' },
  { name: 'izaque_agents', pk: 'id' },
  { name: 'izaque_agent_documents', pk: 'id' },
  { name: 'izaque_agent_knowledge', pk: 'id' },
  { name: 'izaque_guided_conversations', pk: 'id' },
  { name: 'izaque_chat_sessions', pk: 'id' },
  { name: 'izaque_messages', pk: 'id' },
  { name: 'izaque_user_memories', pk: 'id' },
  { name: 'izaque_creative_troubles', pk: 'id' },
  { name: 'izaque_inscriptions', pk: 'id' },
  { name: 'izaque_pdf_deliveries', pk: 'id' },
  { name: 'izaque_subscriptions', pk: 'id' },
  { name: 'izaque_feedbacks', pk: 'id' },
  { name: 'izaque_terms_acceptances', pk: 'id' },
  { name: 'izaque_user_group_members', pk: 'id' },
  { name: 'izaque_group_broadcasts', pk: 'id' },
  { name: 'izaque_user_notifications', pk: 'id' },
  { name: 'izaque_project_members', pk: 'id' },
  { name: 'izaque_project_milestones', pk: 'id' },
  { name: 'izaque_project_tasks', pk: 'id' },
  { name: 'izaque_project_notifications_log', pk: 'id' },
  { name: 'izaque_marketing_creatives', pk: 'id' },
];

for (const tbl of TABLES_IN_ORDER) {
  const rows = await fetchAllRows(source, tbl.name);
  if (rows.length === 0) {
    console.log(`⚪ ${tbl.name}: 0 registros`);
    continue;
  }

  const transformed = rows.map(rewriteStorageUrls);
  const batchSize = 100;
  let okCount = 0;

  for (let i = 0; i < transformed.length; i += batchSize) {
    const chunk = transformed.slice(i, i + batchSize);
    const { error } = await target.from(tbl.name).upsert(chunk, { onConflict: tbl.pk });
    if (error) {
      console.error(`❌ Erro em ${tbl.name} (lote ${i}): ${error.message}`);
    } else {
      okCount += chunk.length;
    }
  }
  console.log(`✅ ${tbl.name}: ${okCount}/${rows.length} registros migrados`);
}

// 4. Migrar arquivos do bucket izaque-pdfs
async function migrateBucketFolder(bucketName, prefix = '') {
  const { data: items, error } = await source.storage.from(bucketName).list(prefix, { limit: 500 });
  if (error || !items) return 0;
  let count = 0;

  for (const item of items) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (!item.id) {
      count += await migrateBucketFolder(bucketName, fullPath);
      continue;
    }
    const { data: blob, error: dlErr } = await source.storage.from(bucketName).download(fullPath);
    if (dlErr || !blob) continue;

    const buf = Buffer.from(await blob.arrayBuffer());
    const { error: upErr } = await target.storage.from(bucketName).upload(fullPath, buf, {
      contentType: item.metadata?.mimetype || 'application/octet-stream',
      upsert: true,
    });
    if (!upErr) count++;
  }
  return count;
}

console.log('\n📦 Migrando arquivos de Storage (izaque-pdfs + mídias referenciadas)...');
const pdfCount = await migrateBucketFolder('izaque-pdfs');
console.log(`✅ Arquivos migrados em izaque-pdfs: ${pdfCount}`);

let refCount = 0;
for (const entry of referencedStorageObjects) {
  const slashIdx = entry.indexOf('/');
  const bucketName = entry.slice(0, slashIdx);
  const objectPath = entry.slice(slashIdx + 1);
  if (bucketName === 'izaque-pdfs') continue;
  const { data: blob, error: dlErr } = await source.storage.from(bucketName).download(objectPath);
  if (dlErr || !blob) {
    console.warn(`   ⚠️ Falha ao baixar ${entry}: ${dlErr?.message}`);
    continue;
  }
  const buf = Buffer.from(await blob.arrayBuffer());
  const contentType = objectPath.endsWith('.png')
    ? 'image/png'
    : objectPath.endsWith('.webp')
      ? 'image/webp'
      : objectPath.endsWith('.jpg') || objectPath.endsWith('.jpeg')
        ? 'image/jpeg'
        : blob.type || 'application/octet-stream';
  const { error: upErr } = await target.storage.from(bucketName).upload(objectPath, buf, {
    contentType,
    upsert: true,
  });
  if (!upErr) {
    refCount++;
    console.log(`✅ Mídia migrada: ${bucketName}/${objectPath}`);
  } else {
    console.warn(`   ⚠️ Falha ao subir ${entry}: ${upErr.message}`);
  }
}
console.log(`✅ Mídias referenciadas migradas: ${refCount}`);

console.log('\n🎉 MIGRAÇÃO CONCLUÍDA! Agora atualize SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY no app issac do Easypanel!');

