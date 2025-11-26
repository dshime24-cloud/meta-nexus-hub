-- Criar tabela de personagens
CREATE TABLE public.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  alias TEXT,
  classification TEXT NOT NULL CHECK (classification IN ('SS', 'S', 'A', 'B', 'C', 'D', 'E', 'F')),
  threat_level INTEGER CHECK (threat_level >= 0 AND threat_level <= 10),
  type TEXT NOT NULL CHECK (type IN ('hero', 'villain', 'neutral')),
  age INTEGER,
  gender TEXT,
  weight NUMERIC,
  height NUMERIC,
  race TEXT,
  location TEXT,
  quote TEXT,
  origin_story TEXT,
  appearance TEXT,
  backstory TEXT,
  motivation TEXT,
  image_url TEXT,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  determination_points INTEGER DEFAULT 3,
  energy INTEGER DEFAULT 100,
  folder TEXT DEFAULT 'Todas',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de atributos dos personagens
CREATE TABLE public.character_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  coordination INTEGER DEFAULT 1 CHECK (coordination >= 1 AND coordination <= 15),
  vigor INTEGER DEFAULT 1 CHECK (vigor >= 1 AND vigor <= 15),
  intellect INTEGER DEFAULT 1 CHECK (intellect >= 1 AND intellect <= 15),
  attention INTEGER DEFAULT 1 CHECK (attention >= 1 AND attention <= 15),
  willpower INTEGER DEFAULT 1 CHECK (willpower >= 1 AND willpower <= 15),
  prowess INTEGER DEFAULT 1 CHECK (prowess >= 1 AND prowess <= 15),
  UNIQUE(character_id)
);

-- Criar tabela de biblioteca de poderes
CREATE TABLE public.powers_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Ofensivo', 'Defensivo', 'Mental', 'Alteração', 'Movimento', 'Controle')),
  base_level INTEGER DEFAULT 1 CHECK (base_level >= 1 AND base_level <= 10),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de poderes dos personagens
CREATE TABLE public.character_powers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  power_id UUID REFERENCES public.powers_library(id) ON DELETE CASCADE,
  custom_name TEXT,
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 10),
  description TEXT,
  extras TEXT,
  limitations TEXT
);

-- Criar tabela de relacionamentos
CREATE TABLE public.relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  related_character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  description TEXT,
  bonus TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de localizações
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de itens da loja
CREATE TABLE public.shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  cost INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('xp', 'roll', 'item')),
  effect TEXT,
  unlimited BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.powers_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_powers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

-- Políticas públicas de leitura (ajustar conforme necessário para autenticação futura)
CREATE POLICY "Allow public read characters" ON public.characters FOR SELECT USING (true);
CREATE POLICY "Allow public insert characters" ON public.characters FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update characters" ON public.characters FOR UPDATE USING (true);
CREATE POLICY "Allow public delete characters" ON public.characters FOR DELETE USING (true);

CREATE POLICY "Allow public read attributes" ON public.character_attributes FOR SELECT USING (true);
CREATE POLICY "Allow public insert attributes" ON public.character_attributes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update attributes" ON public.character_attributes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete attributes" ON public.character_attributes FOR DELETE USING (true);

CREATE POLICY "Allow public read powers library" ON public.powers_library FOR SELECT USING (true);
CREATE POLICY "Allow public insert powers library" ON public.powers_library FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update powers library" ON public.powers_library FOR UPDATE USING (true);
CREATE POLICY "Allow public delete powers library" ON public.powers_library FOR DELETE USING (true);

CREATE POLICY "Allow public read character powers" ON public.character_powers FOR SELECT USING (true);
CREATE POLICY "Allow public insert character powers" ON public.character_powers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update character powers" ON public.character_powers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete character powers" ON public.character_powers FOR DELETE USING (true);

CREATE POLICY "Allow public read relationships" ON public.relationships FOR SELECT USING (true);
CREATE POLICY "Allow public insert relationships" ON public.relationships FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update relationships" ON public.relationships FOR UPDATE USING (true);
CREATE POLICY "Allow public delete relationships" ON public.relationships FOR DELETE USING (true);

CREATE POLICY "Allow public read locations" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Allow public insert locations" ON public.locations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update locations" ON public.locations FOR UPDATE USING (true);
CREATE POLICY "Allow public delete locations" ON public.locations FOR DELETE USING (true);

CREATE POLICY "Allow public read shop items" ON public.shop_items FOR SELECT USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_characters_updated_at
BEFORE UPDATE ON public.characters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir alguns itens iniciais na loja
INSERT INTO public.shop_items (name, description, cost, type, effect, unlimited) VALUES
('XP da Campanha', 'Adiciona 1 XP e 1 EH ao inventário', 0, 'xp', '+1 XP, +1 EH', true),
('Rolagem de Dado Adicional', 'Adiciona uma rolagem extra em combate', 150, 'roll', '+1 Rolagem', false);

-- Inserir alguns poderes na biblioteca
INSERT INTO public.powers_library (name, category, base_level, description) VALUES
('Super Força', 'Ofensivo', 5, 'Capacidade de levantar e arremessar objetos pesados'),
('Voo', 'Movimento', 4, 'Capacidade de voar livremente'),
('Telecinese', 'Mental', 6, 'Mover objetos com a mente'),
('Regeneração', 'Defensivo', 5, 'Cura acelerada de ferimentos'),
('Controle de Fogo', 'Controle', 7, 'Manipular e criar chamas'),
('Invisibilidade', 'Alteração', 4, 'Tornar-se invisível'),
('Super Velocidade', 'Movimento', 6, 'Mover-se em velocidades sobre-humanas'),
('Escudo de Energia', 'Defensivo', 5, 'Criar barreiras de energia'),
('Telepatia', 'Mental', 6, 'Ler e comunicar pensamentos'),
('Controle de Gelo', 'Controle', 6, 'Manipular e criar gelo');