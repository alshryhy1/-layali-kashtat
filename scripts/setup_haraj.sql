CREATE TABLE IF NOT EXISTS haraj_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC,
  city TEXT,
  category TEXT,
  contact_phone TEXT,
  image_url TEXT
);

-- Insert some dummy data if table is empty
INSERT INTO haraj_items (title, description, price, city, category, contact_phone, image_url)
SELECT 'خيمة صباح 4*4 نظيفة', 'خيمة استخدام حشمة لموسم واحد', 1200, 'الرياض', 'tents', '0500000000', 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&q=80&w=800'
WHERE NOT EXISTS (SELECT 1 FROM haraj_items);
