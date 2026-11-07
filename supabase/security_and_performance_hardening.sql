-- ============================================================================
-- ISAAC — HARDENING DE SEGURANÇA (LGPD / RLS / RPC) & PERFORMANCE POSTGRESQL
-- IMPORTANTE: Preserva 100% dos nomes originais de tabelas e RPCs (public.izaque_*)
-- Idempotente: pode ser executado com segurança no SQL Editor do Supabase.
-- ============================================================================

-- 1. IMPEDIR ESCALONAMENTO DE PRIVILÉGIO DIRETO VIA CLIENTE ANON/AUTHENTICATED
-- (Garante que nenhum usuário comum altere o próprio 'role' ou 'is_active' via PostgREST)
CREATE OR REPLACE FUNCTION public.izaque_protect_profile_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_jwt_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
  v_caller_uid uuid := auth.uid();
  v_caller_is_master boolean := false;
BEGIN
  -- Permite livremente chamadas do backend (service_role) ou migrações SQL diretas (postgres/supabase_admin)
  IF v_jwt_role = 'service_role' OR current_user IN ('postgres', 'supabase_admin', 'service_role') THEN
    RETURN NEW;
  END IF;

  -- Verifica se o chamador autenticado já é um administrador master legítimo
  IF v_caller_uid IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.izaque_profiles
      WHERE id = v_caller_uid AND role IN ('master', 'admin')
    ) INTO v_caller_is_master;
  END IF;

  IF NOT v_caller_is_master THEN
    -- Bloqueia auto-promoção de role e auto-desbloqueio de conta suspensa
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Operação não permitida: alteração de nível de acesso restrita à administração.';
    END IF;
    IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      RAISE EXCEPTION 'Operação não permitida: alteração de status de conta restrita à administração.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_izaque_protect_profile_columns ON public.izaque_profiles;
CREATE TRIGGER trg_izaque_protect_profile_columns
  BEFORE UPDATE ON public.izaque_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.izaque_protect_profile_sensitive_columns();

-- 2. BLINDAR RPCs VETORIAIS SECURITY DEFINER CONTRA ACESSO ANÔNIMO DIRETO
-- (O RAG é orquestrado pelo backend usando service_role; revoga acesso público direto)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'izaque_match_memories'
  ) THEN
    EXECUTE 'REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon';
    -- Garante que service_role mantenha acesso integral às RPCs de RAG
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
    GRANT EXECUTE ON FUNCTION public.izaque_handle_new_user() TO postgres, supabase_auth_admin, service_role;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Aviso ao ajustar permissões de funções: %', SQLERRM;
END $$;

-- 3. OTIMIZAÇÃO RLS COM (select auth.uid()) PARA CACHE DE INITPLAN NO POSTGRESQL
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'izaque_profiles') THEN
    DROP POLICY IF EXISTS "Usuários leem próprio perfil" ON public.izaque_profiles;
    CREATE POLICY "Usuários leem próprio perfil" ON public.izaque_profiles
      FOR SELECT USING ((select auth.uid()) = id);

    DROP POLICY IF EXISTS "Usuários atualizam próprio perfil" ON public.izaque_profiles;
    CREATE POLICY "Usuários atualizam próprio perfil" ON public.izaque_profiles
      FOR UPDATE USING ((select auth.uid()) = id)
      WITH CHECK ((select auth.uid()) = id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'izaque_messages') THEN
    DROP POLICY IF EXISTS "Usuários acessam próprias mensagens" ON public.izaque_messages;
    CREATE POLICY "Usuários acessam próprias mensagens" ON public.izaque_messages
      FOR ALL USING ((select auth.uid()) = user_id)
      WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'izaque_user_memories') THEN
    DROP POLICY IF EXISTS "Usuários acessam próprias memórias" ON public.izaque_user_memories;
    CREATE POLICY "Usuários acessam próprias memórias" ON public.izaque_user_memories
      FOR ALL USING ((select auth.uid()) = user_id)
      WITH CHECK ((select auth.uid()) = user_id);
  END IF;
END $$;

-- 4. ÍNDICES COMPOSTOS B-TREE E HNSW PGVECTOR PARA ALTA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_izaque_messages_user_session_created
  ON public.izaque_messages (user_id, session_id, created_at ASC);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'izaque_chat_sessions') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_izaque_chat_sessions_user_updated ON public.izaque_chat_sessions (user_id, updated_at DESC)';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'izaque_user_notifications') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_izaque_user_notifications_user_read_created ON public.izaque_user_notifications (user_id, is_read, created_at DESC)';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'izaque_creative_troubles') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_izaque_creative_troubles_user_status_created ON public.izaque_creative_troubles (user_id, status, created_at DESC)';
  END IF;

  -- Índices Vetoriais HNSW (aceleração O(log N) na busca semântica de memórias e estudos)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'izaque_user_memories') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_izaque_user_memories_embedding_hnsw ON public.izaque_user_memories USING hnsw (embedding vector_cosine_ops)';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'izaque_agent_knowledge') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_izaque_agent_knowledge_embedding_hnsw ON public.izaque_agent_knowledge USING hnsw (embedding vector_cosine_ops)';
  END IF;
END $$;
