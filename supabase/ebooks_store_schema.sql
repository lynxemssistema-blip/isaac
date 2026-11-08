-- ============================================================================
-- ISAAC® ESSENTIAL — EBOOK STORE, CART & PERSONALIZED PDF DELIVERY SCHEMA
-- Follows Supabase & PostgreSQL Security/RLS Best Practices:
-- 1. RLS enabled on public.izaque_ebook_orders (accessed via backend service_role;
--    authenticated users can also read their own orders via (select auth.uid()) = user_id).
-- 2. Proper B-tree indexes on download_token, asaas_payment_id, buyer_email, user_id.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.izaque_ebook_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  download_token text NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  buyer_name text NOT NULL,
  buyer_email text NOT NULL,
  buyer_phone text,
  buyer_cpf_cnpj text NOT NULL,
  is_international_phone boolean DEFAULT false,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_complete_bundle boolean DEFAULT false,
  subtotal_amount numeric(10,2) NOT NULL DEFAULT 0,
  discount_amount numeric(10,2) NOT NULL DEFAULT 0,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  asaas_customer_id text,
  asaas_payment_id text UNIQUE,
  billing_type text DEFAULT 'UNDEFINED',
  invoice_url text,
  pix_qr_code_base64 text,
  pix_copy_paste text,
  external_reference text,
  paid_at timestamptz,
  email_sent_at timestamptz,
  whatsapp_sent_at timestamptz,
  download_count integer NOT NULL DEFAULT 0,
  last_downloaded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_izaque_ebook_orders_token
  ON public.izaque_ebook_orders (download_token);

CREATE INDEX IF NOT EXISTS idx_izaque_ebook_orders_asaas_payment
  ON public.izaque_ebook_orders (asaas_payment_id);

CREATE INDEX IF NOT EXISTS idx_izaque_ebook_orders_user_id
  ON public.izaque_ebook_orders (user_id);

CREATE INDEX IF NOT EXISTS idx_izaque_ebook_orders_buyer_email
  ON public.izaque_ebook_orders (buyer_email);

CREATE INDEX IF NOT EXISTS idx_izaque_ebook_orders_status_created
  ON public.izaque_ebook_orders (status, created_at DESC);

ALTER TABLE public.izaque_ebook_orders ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.izaque_ebook_orders TO postgres, service_role;
GRANT SELECT ON TABLE public.izaque_ebook_orders TO authenticated;

DROP POLICY IF EXISTS "Users read own ebook orders" ON public.izaque_ebook_orders;
CREATE POLICY "Users read own ebook orders"
  ON public.izaque_ebook_orders
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

