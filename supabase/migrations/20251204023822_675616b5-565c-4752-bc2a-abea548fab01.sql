-- Fix shop_items type constraint to match UI types
ALTER TABLE public.shop_items DROP CONSTRAINT IF EXISTS shop_items_type_check;
ALTER TABLE public.shop_items ADD CONSTRAINT shop_items_type_check 
  CHECK (type = ANY (ARRAY['consumivel'::text, 'equipamento'::text, 'habilidade'::text, 'melhoria'::text, 'xp'::text, 'roll'::text, 'item'::text]));

-- Add user_id column to characters for ownership
ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);

-- Create profiles table for user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create notifications table for level ups and achievements
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id uuid REFERENCES public.characters(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Add team_id to missions for cooperative missions
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id);

-- Enable realtime for character_inventory
ALTER PUBLICATION supabase_realtime ADD TABLE public.character_inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE public.characters;