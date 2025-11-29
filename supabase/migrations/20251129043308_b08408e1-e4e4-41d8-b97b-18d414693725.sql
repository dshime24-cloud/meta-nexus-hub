-- Create story_arcs table
CREATE TABLE public.story_arcs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'em_andamento',
    start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    end_date TIMESTAMP WITH TIME ZONE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create story_chapters table
CREATE TABLE public.story_chapters (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    story_arc_id UUID NOT NULL REFERENCES public.story_arcs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    chapter_number INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pendente',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create story_arc_characters junction table
CREATE TABLE public.story_arc_characters (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    story_arc_id UUID NOT NULL REFERENCES public.story_arcs(id) ON DELETE CASCADE,
    character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
    role TEXT,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(story_arc_id, character_id)
);

-- Create story_arc_missions junction table
CREATE TABLE public.story_arc_missions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    story_arc_id UUID NOT NULL REFERENCES public.story_arcs(id) ON DELETE CASCADE,
    mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES public.story_chapters(id) ON DELETE SET NULL,
    sequence_order INTEGER DEFAULT 1,
    UNIQUE(story_arc_id, mission_id)
);

-- Create story_timeline table for narrative events
CREATE TABLE public.story_timeline (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    story_arc_id UUID NOT NULL REFERENCES public.story_arcs(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES public.story_chapters(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    metadata JSONB
);

-- Enable RLS on all tables
ALTER TABLE public.story_arcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_arc_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_arc_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_timeline ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for story_arcs
CREATE POLICY "Allow public read story_arcs" ON public.story_arcs FOR SELECT USING (true);
CREATE POLICY "Allow public insert story_arcs" ON public.story_arcs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update story_arcs" ON public.story_arcs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete story_arcs" ON public.story_arcs FOR DELETE USING (true);

-- Create RLS policies for story_chapters
CREATE POLICY "Allow public read story_chapters" ON public.story_chapters FOR SELECT USING (true);
CREATE POLICY "Allow public insert story_chapters" ON public.story_chapters FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update story_chapters" ON public.story_chapters FOR UPDATE USING (true);
CREATE POLICY "Allow public delete story_chapters" ON public.story_chapters FOR DELETE USING (true);

-- Create RLS policies for story_arc_characters
CREATE POLICY "Allow public read story_arc_characters" ON public.story_arc_characters FOR SELECT USING (true);
CREATE POLICY "Allow public insert story_arc_characters" ON public.story_arc_characters FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update story_arc_characters" ON public.story_arc_characters FOR UPDATE USING (true);
CREATE POLICY "Allow public delete story_arc_characters" ON public.story_arc_characters FOR DELETE USING (true);

-- Create RLS policies for story_arc_missions
CREATE POLICY "Allow public read story_arc_missions" ON public.story_arc_missions FOR SELECT USING (true);
CREATE POLICY "Allow public insert story_arc_missions" ON public.story_arc_missions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update story_arc_missions" ON public.story_arc_missions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete story_arc_missions" ON public.story_arc_missions FOR DELETE USING (true);

-- Create RLS policies for story_timeline
CREATE POLICY "Allow public read story_timeline" ON public.story_timeline FOR SELECT USING (true);
CREATE POLICY "Allow public insert story_timeline" ON public.story_timeline FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update story_timeline" ON public.story_timeline FOR UPDATE USING (true);
CREATE POLICY "Allow public delete story_timeline" ON public.story_timeline FOR DELETE USING (true);

-- Create indexes for performance
CREATE INDEX idx_story_chapters_arc ON public.story_chapters(story_arc_id);
CREATE INDEX idx_story_arc_characters_arc ON public.story_arc_characters(story_arc_id);
CREATE INDEX idx_story_arc_characters_character ON public.story_arc_characters(character_id);
CREATE INDEX idx_story_arc_missions_arc ON public.story_arc_missions(story_arc_id);
CREATE INDEX idx_story_arc_missions_mission ON public.story_arc_missions(mission_id);
CREATE INDEX idx_story_timeline_arc ON public.story_timeline(story_arc_id);
CREATE INDEX idx_story_timeline_chapter ON public.story_timeline(chapter_id);

-- Add trigger for updated_at on story_arcs
CREATE TRIGGER update_story_arcs_updated_at
BEFORE UPDATE ON public.story_arcs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on story_chapters
CREATE TRIGGER update_story_chapters_updated_at
BEFORE UPDATE ON public.story_chapters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();