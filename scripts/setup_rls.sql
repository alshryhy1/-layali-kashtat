-- Enable RLS and deny-all baseline policies for sensitive tables
ALTER TABLE IF NOT EXISTS conversations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY deny_all_conversations ON conversations FOR ALL USING (false);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE IF NOT EXISTS messages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY deny_all_messages ON messages FOR ALL USING (false);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE IF NOT EXISTS customer_requests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY deny_all_customer_requests ON customer_requests FOR ALL USING (false);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
