-- Create storage bucket for character images
INSERT INTO storage.buckets (id, name, public)
VALUES ('character-images', 'character-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for character images
CREATE POLICY "Public can view character images"
ON storage.objects FOR SELECT
USING (bucket_id = 'character-images');

CREATE POLICY "Anyone can upload character images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'character-images');

CREATE POLICY "Anyone can update their character images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'character-images');

CREATE POLICY "Anyone can delete character images"
ON storage.objects FOR DELETE
USING (bucket_id = 'character-images');