-- Create missions table
CREATE TABLE public.missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Fácil', 'Média', 'Difícil', 'Extrema', 'Lendária')),
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'concluída', 'falhada', 'pausada')),
  xp_reward INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  threat_level INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mission_participants table (many-to-many relationship with characters)
CREATE TABLE public.mission_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  role TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(mission_id, character_id)
);

-- Create mission_timeline table for progress tracking
CREATE TABLE public.mission_timeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('criação', 'início', 'progresso', 'conclusão', 'falha', 'pausa', 'retomada', 'participante_adicionado', 'participante_removido')),
  description TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB
);

-- Enable RLS
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_timeline ENABLE ROW LEVEL SECURITY;

-- Create policies for missions
CREATE POLICY "Allow public read missions" 
ON public.missions 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert missions" 
ON public.missions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update missions" 
ON public.missions 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete missions" 
ON public.missions 
FOR DELETE 
USING (true);

-- Create policies for mission_participants
CREATE POLICY "Allow public read mission participants" 
ON public.mission_participants 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert mission participants" 
ON public.mission_participants 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update mission participants" 
ON public.mission_participants 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete mission participants" 
ON public.mission_participants 
FOR DELETE 
USING (true);

-- Create policies for mission_timeline
CREATE POLICY "Allow public read mission timeline" 
ON public.mission_timeline 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert mission timeline" 
ON public.mission_timeline 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update mission timeline" 
ON public.mission_timeline 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete mission timeline" 
ON public.mission_timeline 
FOR DELETE 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_missions_updated_at
BEFORE UPDATE ON public.missions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_missions_status ON public.missions(status);
CREATE INDEX idx_mission_participants_mission_id ON public.mission_participants(mission_id);
CREATE INDEX idx_mission_participants_character_id ON public.mission_participants(character_id);
CREATE INDEX idx_mission_timeline_mission_id ON public.mission_timeline(mission_id);
CREATE INDEX idx_mission_timeline_event_date ON public.mission_timeline(event_date);