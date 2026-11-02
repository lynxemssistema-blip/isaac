import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const p of [
  path.resolve(__dirname, '../.env'),
  path.resolve(process.cwd(), 'backend/.env'),
  path.resolve(process.cwd(), '.env'),
]) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}

const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) {
  console.error('❌ Defina SUPABASE_DB_PASSWORD no .env antes de executar esta migração.');
  process.exit(1);
}

const projectRef = 'ohjuqcrpakswvnoqobiq';

const connectionAttempts = [
  {
    name: 'Conexão Direta (db.ohjuqcrpakswvnoqobiq.supabase.co:5432)',
    config: {
      host: `db.${projectRef}.supabase.co`,
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    },
  },
  {
    name: 'Pooler de Conexão (aws-0-sa-east-1.pooler.supabase.com:6543)',
    config: {
      host: 'aws-0-sa-east-1.pooler.supabase.com',
      port: 6543,
      database: 'postgres',
      user: `postgres.${projectRef}`,
      password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    },
  },
  {
    name: 'Pooler de Conexão (aws-0-us-east-1.pooler.supabase.com:6543)',
    config: {
      host: 'aws-0-us-east-1.pooler.supabase.com',
      port: 6543,
      database: 'postgres',
      user: `postgres.${projectRef}`,
      password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    },
  },
];

async function runMigration() {
  console.log('🔄 [Inscriptions DB] Iniciando migração para Ficha de Inscrição Simples (/inscricao)...');

  let client = null;
  for (const attempt of connectionAttempts) {
    try {
      const testClient = new pg.Client(attempt.config);
      await testClient.connect();
      client = testClient;
      console.log(`✅ Conectado via: ${attempt.name}`);
      break;
    } catch (err) {
      console.warn(`⚠️ Falha em ${attempt.name}: ${err.message}`);
    }
  }

  if (!client) {
    console.error('❌ Não foi possível conectar ao PostgreSQL.');
    process.exit(1);
  }

  try {
    console.log('⏳ 1. Criando tabela public.izaque_inscriptions...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.izaque_inscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT chk_izaque_inscriptions_contact CHECK (
          (email IS NOT NULL AND btrim(email) <> '') OR
          (phone IS NOT NULL AND btrim(phone) <> '')
        )
      );

      CREATE INDEX IF NOT EXISTS idx_izaque_inscriptions_email_lower
        ON public.izaque_inscriptions (lower(email))
        WHERE email IS NOT NULL;

      CREATE INDEX IF NOT EXISTS idx_izaque_inscriptions_phone
        ON public.izaque_inscriptions (phone)
        WHERE phone IS NOT NULL;

      CREATE INDEX IF NOT EXISTS idx_izaque_inscriptions_created_at
        ON public.izaque_inscriptions (created_at DESC);

      ALTER TABLE public.izaque_inscriptions ENABLE ROW LEVEL SECURITY;
    `);

    console.log('⏳ 2. Permitindo classificação de inscritos sem login em izaque_user_group_members...');
    await client.query(`
      DO $$
      DECLARE
        fk_rec RECORD;
      BEGIN
        FOR fk_rec IN
          SELECT tc.constraint_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          WHERE tc.table_schema = 'public'
            AND tc.table_name = 'izaque_user_group_members'
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = 'user_id'
        LOOP
          EXECUTE format('ALTER TABLE public.izaque_user_group_members DROP CONSTRAINT %I', fk_rec.constraint_name);
        END LOOP;
      END $$;

      NOTIFY pgrst, 'reload schema';
    `);

    const check = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'izaque_inscriptions';
    `);
    console.log('📋 Tabela verificada:', check.rows.map((r) => r.table_name));
    console.log('🎉 Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

runMigration();

