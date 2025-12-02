-- Create character inventory table
CREATE TABLE IF NOT EXISTS public.character_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  acquired_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(character_id, item_id)
);

-- Enable RLS
ALTER TABLE public.character_inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies for character_inventory
CREATE POLICY "Allow public read inventory"
  ON public.character_inventory FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert inventory"
  ON public.character_inventory FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update inventory"
  ON public.character_inventory FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete inventory"
  ON public.character_inventory FOR DELETE
  USING (true);

-- Update character_specialties to allow power specialties
ALTER TABLE public.character_specialties 
  ADD COLUMN IF NOT EXISTS power_id UUID REFERENCES public.character_powers(id) ON DELETE CASCADE;

-- Create combat logs table
CREATE TABLE IF NOT EXISTS public.combat_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attacker_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  defender_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  attacker_roll INTEGER NOT NULL,
  defender_roll INTEGER NOT NULL,
  winner_id UUID REFERENCES public.characters(id),
  combat_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  details JSONB
);

-- Enable RLS
ALTER TABLE public.combat_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for combat_logs
CREATE POLICY "Allow public read combat logs"
  ON public.combat_logs FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert combat logs"
  ON public.combat_logs FOR INSERT
  WITH CHECK (true);