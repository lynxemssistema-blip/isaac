import pg from 'pg';
import { supabaseAdmin } from '../src/config/supabase.js';

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
  console.log('🔄 [PDF Campaigns DB] Iniciando migração para Links de Cadastro & Múltiplos PDFs...');

  let client = null;
  for (const attempt of connectionAttempts) {
    try {
      console.log(`📡 Tentando ${attempt.name}...`);
      const testClient = new pg.Client(attempt.config);
      await testClient.connect();
      client = testClient;
      console.log(`✅ Conectado com sucesso via: ${attempt.name}`);
      break;
    } catch (err) {
      console.warn(`⚠️ Falha ao conectar em ${attempt.name}: ${err.message}`);
    }
  }

  if (!client) {
    console.error('❌ Não foi possível conectar ao banco PostgreSQL.');
    process.exit(1);
  }

  try {
    console.log('⏳ 1. Criando tabela public.izaque_pdf_campaigns...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.izaque_pdf_campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        subtitle TEXT,
        pdf_file_name TEXT NOT NULL,
        pdf_storage_path TEXT NOT NULL,
        pdf_public_url TEXT,
        pdf_size_bytes BIGINT,
        email_subject TEXT NOT NULL,
        email_body TEXT,
        target_group_id UUID REFERENCES public.izaque_user_groups(id) ON DELETE SET NULL,
        is_default BOOLEAN NOT NULL DEFAULT false,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    console.log('⏳ 2. Criando tabela public.izaque_pdf_deliveries...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.izaque_pdf_deliveries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        campaign_id UUID REFERENCES public.izaque_pdf_campaigns(id) ON DELETE SET NULL,
        recipient_email TEXT NOT NULL,
        recipient_name TEXT,
        signup_origin TEXT NOT NULL DEFAULT 'direct_link',
        delivery_status TEXT NOT NULL DEFAULT 'sent',
        error_message TEXT,
        sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    console.log('⏳ 3. Expandindo public.izaque_profiles com campos do cadastro completo...');
    await client.query(`
      ALTER TABLE public.izaque_profiles
        ADD COLUMN IF NOT EXISTS birth_date DATE,
        ADD COLUMN IF NOT EXISTS city TEXT,
        ADD COLUMN IF NOT EXISTS state TEXT,
        ADD COLUMN IF NOT EXISTS occupation TEXT,
        ADD COLUMN IF NOT EXISTS main_goal TEXT,
        ADD COLUMN IF NOT EXISTS signup_campaign_id UUID REFERENCES public.izaque_pdf_campaigns(id) ON DELETE SET NULL;
    `);

    console.log('⏳ 4. Criando índices de performance e unicidade parcial...');
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_izaque_pdf_campaigns_single_default
        ON public.izaque_pdf_campaigns (is_default)
        WHERE is_default = true;

      CREATE INDEX IF NOT EXISTS idx_izaque_pdf_campaigns_target_group
        ON public.izaque_pdf_campaigns (target_group_id);

      CREATE INDEX IF NOT EXISTS idx_izaque_pdf_deliveries_campaign_id
        ON public.izaque_pdf_deliveries (campaign_id);

      CREATE INDEX IF NOT EXISTS idx_izaque_pdf_deliveries_user_id
        ON public.izaque_pdf_deliveries (user_id);

      CREATE INDEX IF NOT EXISTS idx_izaque_pdf_deliveries_email_sent_at
        ON public.izaque_pdf_deliveries (lower(recipient_email), sent_at DESC);

      CREATE INDEX IF NOT EXISTS idx_izaque_profiles_signup_campaign
        ON public.izaque_profiles (signup_campaign_id);

      CREATE INDEX IF NOT EXISTS idx_izaque_profiles_email_lower
        ON public.izaque_profiles (lower(email));
    `);

    console.log('⏳ 5. Configurando permissões da Data API e políticas de RLS...');
    await client.query(`
      ALTER TABLE public.izaque_pdf_campaigns ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.izaque_pdf_deliveries ENABLE ROW LEVEL SECURITY;

      GRANT SELECT ON public.izaque_pdf_campaigns TO anon, authenticated;
      GRANT SELECT ON public.izaque_pdf_deliveries TO authenticated;

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies
          WHERE schemaname = 'public'
            AND tablename = 'izaque_pdf_campaigns'
            AND policyname = 'Campanhas de PDF ativas visiveis publicamente'
        ) THEN
          CREATE POLICY "Campanhas de PDF ativas visiveis publicamente"
            ON public.izaque_pdf_campaigns
            FOR SELECT
            TO anon, authenticated
            USING (is_active = true);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies
          WHERE schemaname = 'public'
            AND tablename = 'izaque_pdf_deliveries'
            AND policyname = 'Usuario visualiza seus proprios envios de PDF'
        ) THEN
          CREATE POLICY "Usuario visualiza seus proprios envios de PDF"
            ON public.izaque_pdf_deliveries
            FOR SELECT
            TO authenticated
            USING ((select auth.uid()) = user_id);
        END IF;
      END $$;

      NOTIFY pgrst, 'reload schema';
    `);

    console.log('⏳ 6. Garantindo bucket izaque-pdfs no Supabase Storage...');
    const { data: buckets, error: listBucketErr } = await supabaseAdmin.storage.listBuckets();
    if (listBucketErr) {
      console.warn('⚠️ Aviso ao listar buckets do Storage:', listBucketErr.message);
    } else {
      const exists = (buckets || []).some((b) => b.name === 'izaque-pdfs');
      if (!exists) {
        const { error: createBucketErr } = await supabaseAdmin.storage.createBucket('izaque-pdfs', {
          public: true,
          fileSizeLimit: 16 * 1024 * 1024, // 16 MB
          allowedMimeTypes: ['application/pdf'],
        });
        if (createBucketErr) {
          console.warn('⚠️ Aviso ao criar bucket izaque-pdfs:', createBucketErr.message);
        } else {
          console.log('✅ Bucket izaque-pdfs criado com sucesso no Supabase Storage!');
        }
      } else {
        console.log('✅ Bucket izaque-pdfs já existe no Supabase Storage.');
      }
    }

    const verifyRes = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('izaque_pdf_campaigns', 'izaque_pdf_deliveries')
      ORDER BY table_name;
    `);
    console.log('📋 Tabelas verificadas:', verifyRes.rows.map((r) => r.table_name));
    console.log('🎉 Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

runMigration();

