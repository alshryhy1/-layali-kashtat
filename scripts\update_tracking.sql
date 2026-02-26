
-- Add columns for provider tracking
ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS provider_status text DEFAULT 'accepted'; -- accepted, en_route, arrived, completed
ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS provider_current_lat numeric;
ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS provider_current_lng numeric;
