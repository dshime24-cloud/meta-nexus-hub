-- Create specialties table for character roll bonuses
CREATE TABLE public.character_specialties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  attribute TEXT NOT NULL,
  bonus INTEGER NOT NULL DEFAULT 1 CHECK (bonus >= 1 AND bonus <= 3),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.character_specialties ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read specialties" ON public.character_specialties FOR SELECT USING (true);
CREATE POLICY "Allow public insert specialties" ON public.character_specialties FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update specialties" ON public.character_specialties FOR UPDATE USING (true);
CREATE POLICY "Allow public delete specialties" ON public.character_specialties FOR DELETE USING (true);

-- Add RLS policies for shop_items (currently missing INSERT, UPDATE, DELETE)
CREATE POLICY "Allow public insert shop items" ON public.shop_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update shop items" ON public.shop_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete shop items" ON public.shop_items FOR DELETE USING (true);

-- Add image_url column to shop_items
ALTER TABLE public.shop_items ADD COLUMN IF NOT EXISTS image_url TEXT;