-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Conversations Table
-- Links a Customer Request (Integer ID) with a Provider (Integer ID)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id INTEGER NOT NULL, -- References customer_requests(id)
  provider_id BIGINT, -- References provider_requests(id)
  status TEXT DEFAULT 'open', -- 'open', 'closed', 'archived'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('customer', 'provider', 'system')),
  sender_id TEXT, -- For provider: Provider ID (String), For customer: 'customer' or Ref
  content TEXT, -- Text message content
  media_url TEXT, -- URL for image/voice
  media_type TEXT DEFAULT 'text' CHECK (media_type IN ('text', 'image', 'voice', 'location')),
  location_lat FLOAT, -- For location type
  location_lng FLOAT, -- For location type
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_conversations_request_id ON conversations(request_id);
CREATE INDEX IF NOT EXISTS idx_conversations_provider_id ON conversations(provider_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- 4. Add Accepted Fields to Customer Requests
ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS accepted_provider_id BIGINT;
ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS accepted_provider_name TEXT;
ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS accepted_provider_phone TEXT;
ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS accepted_provider_email TEXT;
ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS accepted_price NUMERIC;
ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS accepted_currency TEXT;
ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS accepted_notes TEXT;
ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS accepted_meeting_location TEXT;
ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS accepted_payment_method TEXT;
ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS accepted_payment_details TEXT;

