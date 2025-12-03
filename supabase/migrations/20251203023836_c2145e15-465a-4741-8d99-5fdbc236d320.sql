-- Teams System
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  formation TEXT DEFAULT 'standard',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Allow public insert teams" ON public.teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update teams" ON public.teams FOR UPDATE USING (true);
CREATE POLICY "Allow public delete teams" ON public.teams FOR DELETE USING (true);

-- Team Members
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  position INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(team_id, character_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read team_members" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Allow public insert team_members" ON public.team_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update team_members" ON public.team_members FOR UPDATE USING (true);
CREATE POLICY "Allow public delete team_members" ON public.team_members FOR DELETE USING (true);

-- Crafting Recipes
CREATE TABLE public.crafting_recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  result_item_id UUID REFERENCES public.shop_items(id) ON DELETE SET NULL,
  result_quantity INTEGER DEFAULT 1,
  required_level INTEGER DEFAULT 1,
  crafting_time INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.crafting_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read crafting_recipes" ON public.crafting_recipes FOR SELECT USING (true);
CREATE POLICY "Allow public insert crafting_recipes" ON public.crafting_recipes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update crafting_recipes" ON public.crafting_recipes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete crafting_recipes" ON public.crafting_recipes FOR DELETE USING (true);

-- Crafting Ingredients
CREATE TABLE public.crafting_ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES public.crafting_recipes(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1
);

ALTER TABLE public.crafting_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read crafting_ingredients" ON public.crafting_ingredients FOR SELECT USING (true);
CREATE POLICY "Allow public insert crafting_ingredients" ON public.crafting_ingredients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update crafting_ingredients" ON public.crafting_ingredients FOR UPDATE USING (true);
CREATE POLICY "Allow public delete crafting_ingredients" ON public.crafting_ingredients FOR DELETE USING (true);

-- Character Progression / Abilities
CREATE TABLE public.character_abilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  unlock_level INTEGER DEFAULT 1,
  is_unlocked BOOLEAN DEFAULT false,
  ability_type TEXT DEFAULT 'passive',
  effect TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.character_abilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read character_abilities" ON public.character_abilities FOR SELECT USING (true);
CREATE POLICY "Allow public insert character_abilities" ON public.character_abilities FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update character_abilities" ON public.character_abilities FOR UPDATE USING (true);
CREATE POLICY "Allow public delete character_abilities" ON public.character_abilities FOR DELETE USING (true);

-- Level Thresholds Table
CREATE TABLE public.level_thresholds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level INTEGER NOT NULL UNIQUE,
  xp_required INTEGER NOT NULL,
  attribute_points INTEGER DEFAULT 0,
  ability_slots INTEGER DEFAULT 0,
  description TEXT
);

ALTER TABLE public.level_thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read level_thresholds" ON public.level_thresholds FOR SELECT USING (true);
CREATE POLICY "Allow public insert level_thresholds" ON public.level_thresholds FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update level_thresholds" ON public.level_thresholds FOR UPDATE USING (true);
CREATE POLICY "Allow public delete level_thresholds" ON public.level_thresholds FOR DELETE USING (true);

-- Insert default level thresholds
INSERT INTO public.level_thresholds (level, xp_required, attribute_points, ability_slots, description) VALUES
(1, 0, 0, 1, 'Iniciante'),
(2, 100, 1, 1, 'Aprendiz'),
(3, 250, 1, 1, 'Novato'),
(4, 500, 2, 2, 'Competente'),
(5, 1000, 2, 2, 'Habilidoso'),
(6, 1750, 3, 2, 'Experiente'),
(7, 2750, 3, 3, 'Veterano'),
(8, 4000, 4, 3, 'Mestre'),
(9, 5500, 4, 3, 'Grão-Mestre'),
(10, 7500, 5, 4, 'Lendário');

-- Add triggers for updated_at
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();