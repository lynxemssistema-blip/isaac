-- ============================================================================
-- BOOTSTRAP COMPLETO DO BANCO DEDICADO NA VPS — MENTORIA ISAAC
-- Cria 100% das 27 tabelas izaque_*, extensao pgvector, RPCs, Storage, Indices e RLS
-- Cole e execute este arquivo uma unica vez no SQL Editor do seu Supabase na VPS
-- (https://supabase.lynxems.com.br) ANTES de rodar node scripts/migrate-cloud-to-vps.mjs
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. PARAMETROS GLOBAIS DO SISTEMA
CREATE TABLE IF NOT EXISTS public.izaque_system_settings (
  id text PRIMARY KEY DEFAULT 'global',
  show_theme_selector boolean DEFAULT true,
  show_settings_button boolean DEFAULT true,
  show_ambient_sound_button boolean DEFAULT true,
  show_creative_troubles boolean DEFAULT true,
  evolution_whatsapp_enabled boolean NOT NULL DEFAULT true,
  show_landing_creator boolean DEFAULT true,
  show_landing_sensations boolean DEFAULT true,
  show_landing_features boolean DEFAULT true,
  show_landing_security boolean DEFAULT true,
  show_landing_steps boolean DEFAULT true,
  show_landing_cta boolean DEFAULT true,
  default_theme text DEFAULT 'indigo',
  default_guide_name text DEFAULT 'Isaac',
  default_ambient_track text DEFAULT '432hz',
  default_ambient_volume numeric DEFAULT 0.20,
  default_ambient_enabled boolean DEFAULT false,
  default_voice_engine text DEFAULT 'gemini',
  default_gemini_voice text DEFAULT 'Charon',
  default_immersive_voice boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  updated_by text
);

-- 2. IDEALIZADOR (VITRINE PUBLICA / E-E-A-T)
CREATE TABLE IF NOT EXISTS public.izaque_creator (
  id text PRIMARY KEY DEFAULT 'main',
  name text,
  title text,
  bio text,
  story text,
  quote text,
  image_url text,
  social_instagram text,
  social_linkedin text,
  social_whatsapp text,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. PLANOS DE ASSINATURA
CREATE TABLE IF NOT EXISTS public.izaque_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  billing_cycle text DEFAULT 'monthly',
  description text,
  features jsonb DEFAULT '[]'::jsonb,
  pix_key text,
  pix_key_type text,
  pix_beneficiary text,
  activation_notice text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. GRUPOS DE USUARIOS
CREATE TABLE IF NOT EXISTS public.izaque_user_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  color text DEFAULT '#0284c7',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. CAMPANHAS DE PDF / LINKS DE CADASTRO
CREATE TABLE IF NOT EXISTS public.izaque_pdf_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  subtitle text,
  pdf_file_name text,
  pdf_storage_path text,
  pdf_public_url text,
  pdf_size_bytes bigint,
  email_subject text,
  email_body text,
  target_group_id uuid REFERENCES public.izaque_user_groups(id) ON DELETE SET NULL,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. PERFIS DE USUARIOS
CREATE TABLE IF NOT EXISTS public.izaque_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('master', 'admin', 'user')),
  avatar_url text,
  phone text,
  preferences jsonb DEFAULT '{}'::jsonb,
  plan_id text,
  is_active boolean DEFAULT true,
  plan_status text DEFAULT 'free',
  plan_activated_at timestamptz,
  plan_expires_at timestamptz,
  terms_accepted boolean DEFAULT false,
  terms_accepted_at timestamptz,
  terms_version text,
  birth_date date,
  city text,
  state text,
  occupation text,
  main_goal text,
  signup_campaign_id uuid REFERENCES public.izaque_pdf_campaigns(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7. AGENTES / MENTORES ESPECIALISTAS
CREATE TABLE IF NOT EXISTS public.izaque_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  type text NOT NULL DEFAULT 'mindset',
  system_prompt text NOT NULL,
  temperature numeric(3, 2) NOT NULL DEFAULT 0.70,
  is_active boolean NOT NULL DEFAULT true,
  starter_questions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 8. DOCUMENTOS E CONHECIMENTO RAG DOS AGENTES
CREATE TABLE IF NOT EXISTS public.izaque_agent_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.izaque_agents(id) ON DELETE CASCADE,
  title text NOT NULL,
  file_type text DEFAULT 'txt',
  total_chunks integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.izaque_agent_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.izaque_agents(id) ON DELETE CASCADE,
  document_id uuid REFERENCES public.izaque_agent_documents(id) ON DELETE CASCADE,
  content text NOT NULL,
  embedding vector(768) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 9. CONVERSAS DIRECIONADAS
CREATE TABLE IF NOT EXISTS public.izaque_guided_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text DEFAULT 'Geral',
  icon text DEFAULT 'Compass',
  agent_slug text DEFAULT 'izaque-master',
  questions jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 10. SESSOES DE CHAT E MENSAGENS
CREATE TABLE IF NOT EXISTS public.izaque_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text DEFAULT 'Nova Reflexão',
  guided_conversation_id uuid REFERENCES public.izaque_guided_conversations(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.izaque_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES public.izaque_agents(id) ON DELETE SET NULL,
  session_id uuid REFERENCES public.izaque_chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  is_audio boolean DEFAULT false,
  audio_duration_seconds numeric,
  created_at timestamptz DEFAULT now()
);

-- 11. MEMORIAS DE LONGO PRAZO (PGVECTOR 768 DIMENSOES)
CREATE TABLE IF NOT EXISTS public.izaque_user_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'blocker',
  importance_score integer NOT NULL DEFAULT 3,
  embedding vector(768) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 12. LABORATORIO DO INCOMODO CRIATIVO
CREATE TABLE IF NOT EXISTS public.izaque_creative_troubles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  fact_description text,
  posture_level integer DEFAULT 1,
  trouble_type text,
  cause_aspects text,
  effect_aspects text,
  internal_state text,
  context text,
  parties_involved jsonb DEFAULT '[]'::jsonb,
  intensity_score integer DEFAULT 5,
  intensity_notes text,
  relevance_score integer DEFAULT 5,
  relevance_notes text,
  responsibility_score integer DEFAULT 5,
  responsibility_notes text,
  influence_score integer DEFAULT 5,
  influence_notes text,
  attention_reason text,
  additional_notes text,
  ai_diagnosis jsonb,
  micro_action_24h text,
  status text DEFAULT 'active',
  mentor_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 13. INSCRICOES, ENTREGAS DE PDF, ASSINATURAS, FEEDBACKS E TERMOS
CREATE TABLE IF NOT EXISTS public.izaque_inscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text,
  phone text,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.izaque_pdf_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  campaign_id uuid REFERENCES public.izaque_pdf_campaigns(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  recipient_name text,
  signup_origin text DEFAULT 'direct_link',
  delivery_status text DEFAULT 'sent',
  error_message text,
  sent_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.izaque_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  user_name text,
  plan_id text,
  amount numeric DEFAULT 0,
  status text DEFAULT 'pending',
  pix_key_used text,
  notes text,
  created_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  approved_by uuid
);

CREATE TABLE IF NOT EXISTS public.izaque_feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  user_name text,
  user_plan text,
  type text DEFAULT 'support',
  subject text,
  message text,
  status text DEFAULT 'open',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.izaque_terms_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  terms_version text,
  accepted boolean DEFAULT true,
  accepted_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- 14. MEMBROS DE GRUPOS, BROADCASTS E NOTIFICACOES
CREATE TABLE IF NOT EXISTS public.izaque_user_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.izaque_user_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.izaque_group_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  audio_url text,
  target_group_ids jsonb DEFAULT '[]'::jsonb,
  sender_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.izaque_user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  broadcast_id uuid REFERENCES public.izaque_group_broadcasts(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  audio_url text,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 15. GESTAO DE PROJETO & MARKETING
CREATE TABLE IF NOT EXISTS public.izaque_project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  role_title text,
  phone text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.izaque_project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text DEFAULT 'in_progress',
  start_date date,
  target_date date,
  completed_date date,
  order_index integer DEFAULT 0,
  color text DEFAULT '#0f766e',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.izaque_project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id uuid REFERENCES public.izaque_project_milestones(id) ON DELETE SET NULL,
  assigned_member_id uuid REFERENCES public.izaque_project_members(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'pending',
  priority text DEFAULT 'medium',
  start_date date,
  due_date date,
  completed_at timestamptz,
  checklist jsonb DEFAULT '[]'::jsonb,
  notified_pre_at timestamptz,
  notified_due_at timestamptz,
  notified_completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.izaque_project_notifications_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.izaque_project_tasks(id) ON DELETE SET NULL,
  member_id uuid REFERENCES public.izaque_project_members(id) ON DELETE SET NULL,
  type text,
  recipient_email text,
  subject text,
  status text,
  sent_at timestamptz DEFAULT now(),
  error_message text
);

CREATE TABLE IF NOT EXISTS public.izaque_marketing_creatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  theme text,
  target_audience text,
  platform text,
  hooks jsonb DEFAULT '[]'::jsonb,
  caption text,
  hashtags jsonb DEFAULT '[]'::jsonb,
  image_prompt text,
  image_url text,
  aspect_ratio text,
  strategy_tips text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 16. FUNCOES RPC DE BUSCA VETORIAL (PGVECTOR)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.izaque_match_memories (
  query_embedding vector(768),
  match_threshold float DEFAULT 0.45,
  match_count int DEFAULT 5,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  category text,
  importance_score int,
  similarity float,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    um.id,
    um.content,
    um.category,
    um.importance_score,
    (1 - (um.embedding <=> query_embedding))::float AS similarity,
    um.created_at
  FROM public.izaque_user_memories um
  WHERE um.user_id = p_user_id
    AND (1 - (um.embedding <=> query_embedding)) >= match_threshold
  ORDER BY (um.embedding <=> query_embedding) ASC
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.izaque_match_agent_knowledge (
  query_embedding vector(768),
  p_agent_id uuid,
  match_threshold float DEFAULT 0.40,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_agent_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    ak.id,
    ak.document_id,
    ak.content,
    (1 - (ak.embedding <=> query_embedding))::float AS similarity
  FROM public.izaque_agent_knowledge ak
  WHERE ak.agent_id = p_agent_id
    AND (1 - (ak.embedding <=> query_embedding)) >= match_threshold
  ORDER BY (ak.embedding <=> query_embedding) ASC
  LIMIT match_count;
END;
$$;

-- ============================================================================
-- 17. BUCKETS DE STORAGE PUBLICOS (PDFs e Avatares)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('izaque-pdfs', 'izaque-pdfs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ============================================================================
-- 18. INDICES DE ALTA PERFORMANCE (B-TREE + HNSW)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_izaque_user_memories_hnsw ON public.izaque_user_memories USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_izaque_agent_knowledge_hnsw ON public.izaque_agent_knowledge USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_izaque_user_memories_user ON public.izaque_user_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_izaque_chat_sessions_user ON public.izaque_chat_sessions(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_izaque_messages_session ON public.izaque_messages(session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_izaque_messages_user ON public.izaque_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_izaque_notifications_user_unread ON public.izaque_user_notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_izaque_creative_troubles_user ON public.izaque_creative_troubles(user_id, updated_at DESC);

-- ============================================================================
-- 19. PERMISSOES DE ROLE & SEGURANCA RLS
-- ============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Clientes autenticados leem/atualizam apenas o proprio perfil no frontend
GRANT SELECT, INSERT, UPDATE ON public.izaque_profiles TO authenticated;
ALTER TABLE public.izaque_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "izaque_profiles_select_own" ON public.izaque_profiles;
CREATE POLICY "izaque_profiles_select_own" ON public.izaque_profiles
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "izaque_profiles_insert_own" ON public.izaque_profiles;
CREATE POLICY "izaque_profiles_insert_own" ON public.izaque_profiles
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "izaque_profiles_update_own" ON public.izaque_profiles;
CREATE POLICY "izaque_profiles_update_own" ON public.izaque_profiles
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- Trigger que impede usuario comum de alterar seu proprio role para admin/master via frontend
CREATE OR REPLACE FUNCTION public.izaque_guard_profile_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'authenticated' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      NEW.role := OLD.role;
    END IF;
    IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      NEW.is_active := OLD.is_active;
    END IF;
    IF NEW.plan_id IS DISTINCT FROM OLD.plan_id THEN
      NEW.plan_id := OLD.plan_id;
    END IF;
    IF NEW.plan_status IS DISTINCT FROM OLD.plan_status THEN
      NEW.plan_status := OLD.plan_status;
    END IF;
    IF NEW.plan_expires_at IS DISTINCT FROM OLD.plan_expires_at THEN
      NEW.plan_expires_at := OLD.plan_expires_at;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_izaque_guard_profile_escalation ON public.izaque_profiles;
CREATE TRIGGER trg_izaque_guard_profile_escalation
  BEFORE UPDATE ON public.izaque_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.izaque_guard_profile_escalation();

-- Habilita RLS em todas as demais tabelas publicas (acesso exclusivo via Backend service_role)
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'izaque_%' AND tablename <> 'izaque_profiles'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
  END LOOP;
END $$;

-- Protege RPCs SECURITY DEFINER contra chamadas anonimas diretas
REVOKE EXECUTE ON FUNCTION public.izaque_match_memories(vector, float, int, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.izaque_match_agent_knowledge(vector, uuid, float, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.izaque_match_memories(vector, float, int, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.izaque_match_agent_knowledge(vector, uuid, float, int) TO service_role;

-- ============================================================================
-- 20. INTEGRACAO WHATSAPP EVOLUTION API (FOLLOW-UP DIARIO 09:50 & WEBHOOK)
-- ============================================================================
ALTER TABLE public.izaque_profiles
  ADD COLUMN IF NOT EXISTS whatsapp_jid text,
  ADD COLUMN IF NOT EXISTS whatsapp_opt_out boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_opt_out_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_whatsapp_inbound_at timestamptz;

CREATE TABLE IF NOT EXISTS public.izaque_whatsapp_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.izaque_chat_sessions(id) ON DELETE SET NULL,
  last_message_id uuid,
  phone_raw text,
  whatsapp_jid text,
  preferred_name text,
  pending_topic_summary text,
  message_content text NOT NULL,
  trigger_type text NOT NULL DEFAULT 'daily_cron',
  status text NOT NULL DEFAULT 'sent',
  evolution_message_id text,
  delay_ms integer,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.izaque_whatsapp_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  instance_name text,
  remote_jid text,
  matched_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  from_me boolean NOT NULL DEFAULT false,
  message_text text,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_izaque_profiles_phone_active
  ON public.izaque_profiles(is_active, whatsapp_opt_out)
  WHERE phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_izaque_whatsapp_followups_user_created
  ON public.izaque_whatsapp_followups(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_izaque_whatsapp_followups_last_msg
  ON public.izaque_whatsapp_followups(user_id, last_message_id)
  WHERE status = 'sent';

CREATE INDEX IF NOT EXISTS idx_izaque_whatsapp_webhooks_jid_created
  ON public.izaque_whatsapp_webhook_events(remote_jid, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_izaque_whatsapp_webhooks_user
  ON public.izaque_whatsapp_webhook_events(matched_user_id);

ALTER TABLE public.izaque_whatsapp_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.izaque_whatsapp_webhook_events ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.izaque_whatsapp_followups TO service_role;
GRANT ALL ON public.izaque_whatsapp_webhook_events TO service_role;

-- ============================================================================
-- 21. TRIGGER AUTOMATICO DE PERFIL EM AUTH.USERS (GARANTE ZERO CONTA ORFA)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_izaque_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.izaque_profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    CASE WHEN lower(NEW.email) IN ('edsonmanoel2012@gmail.com', 'thiagopratas@gmail.com') THEN 'master' ELSE 'user' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_izaque ON auth.users;
CREATE TRIGGER on_auth_user_created_izaque
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_izaque_user();

-- ============================================================================
-- 22. PLANOS OFICIAIS (GRATUITO LIVRE + WHATSAPP R$ 14,99) E GATEWAY ASAAS V3
-- ============================================================================
ALTER TABLE public.izaque_profiles
  ADD COLUMN IF NOT EXISTS cpf_cnpj text,
  ADD COLUMN IF NOT EXISTS asaas_customer_id text,
  ADD COLUMN IF NOT EXISTS asaas_subscription_id text;

ALTER TABLE public.izaque_subscriptions
  ADD COLUMN IF NOT EXISTS asaas_customer_id text,
  ADD COLUMN IF NOT EXISTS asaas_subscription_id text,
  ADD COLUMN IF NOT EXISTS asaas_payment_id text,
  ADD COLUMN IF NOT EXISTS billing_type text DEFAULT 'UNDEFINED',
  ADD COLUMN IF NOT EXISTS invoice_url text,
  ADD COLUMN IF NOT EXISTS pix_qr_code_base64 text,
  ADD COLUMN IF NOT EXISTS pix_copy_paste text,
  ADD COLUMN IF NOT EXISTS external_reference text;

CREATE INDEX IF NOT EXISTS idx_izaque_profiles_asaas_customer
  ON public.izaque_profiles(asaas_customer_id)
  WHERE asaas_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_izaque_profiles_asaas_sub
  ON public.izaque_profiles(asaas_subscription_id)
  WHERE asaas_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_izaque_subscriptions_asaas_sub
  ON public.izaque_subscriptions(asaas_subscription_id)
  WHERE asaas_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_izaque_subscriptions_asaas_payment
  ON public.izaque_subscriptions(asaas_payment_id)
  WHERE asaas_payment_id IS NOT NULL;



