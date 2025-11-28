import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Loader2 } from "lucide-react";

const characterSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  alias: z.string().max(100).optional(),
  classification: z.string().min(1, "Classificação é obrigatória"),
  type: z.enum(["hero", "villain", "neutral"]),
  threatLevel: z.number().min(0).max(100),
  location: z.string().max(100).optional(),
  age: z.number().optional(),
  gender: z.string().max(50).optional(),
  height: z.number().optional(),
  weight: z.number().optional(),
  race: z.string().max(100).optional(),
  quote: z.string().max(500).optional(),
  originStory: z.string().optional(),
  appearance: z.string().optional(),
  backstory: z.string().optional(),
  motivation: z.string().optional(),
  coordination: z.number().min(1).max(15),
  vigor: z.number().min(1).max(15),
  intellect: z.number().min(1).max(15),
  attention: z.number().min(1).max(15),
  willpower: z.number().min(1).max(15),
  prowess: z.number().min(1).max(15),
});

type CharacterFormData = z.infer<typeof characterSchema>;

interface EditCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterId: string;
  onSuccess?: () => void;
}

export function EditCharacterModal({ isOpen, onClose, characterId, onSuccess }: EditCharacterModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<CharacterFormData>({
    resolver: zodResolver(characterSchema),
    defaultValues: {
      coordination: 1,
      vigor: 1,
      intellect: 1,
      attention: 1,
      willpower: 1,
      prowess: 1,
      threatLevel: 0,
    },
  });

  const typeValue = watch("type");

  useEffect(() => {
    if (isOpen && characterId) {
      loadCharacterData();
    }
  }, [isOpen, characterId]);

  const loadCharacterData = async () => {
    try {
      const { data: character, error: charError } = await supabase
        .from("characters")
        .select("*")
        .eq("id", characterId)
        .single();

      if (charError) throw charError;

      const { data: attributes, error: attrError } = await supabase
        .from("character_attributes")
        .select("*")
        .eq("character_id", characterId)
        .single();

      if (attrError) throw attrError;

      setValue("name", character.name);
      setValue("alias", character.alias || "");
      setValue("classification", character.classification);
      setValue("type", character.type as "hero" | "villain" | "neutral");
      setValue("threatLevel", character.threat_level || 0);
      setValue("location", character.location || "");
      setValue("age", character.age || undefined);
      setValue("gender", character.gender || "");
      setValue("height", character.height || undefined);
      setValue("weight", character.weight || undefined);
      setValue("race", character.race || "");
      setValue("quote", character.quote || "");
      setValue("originStory", character.origin_story || "");
      setValue("appearance", character.appearance || "");
      setValue("backstory", character.backstory || "");
      setValue("motivation", character.motivation || "");

      setValue("coordination", attributes.coordination);
      setValue("vigor", attributes.vigor);
      setValue("intellect", attributes.intellect);
      setValue("attention", attributes.attention);
      setValue("willpower", attributes.willpower);
      setValue("prowess", attributes.prowess);

      setCurrentImageUrl(character.image_url);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (characterId: string) => {
    if (!imageFile) return null;

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${characterId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('character-images')
      .upload(filePath, imageFile, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('character-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const onSubmit = async (data: CharacterFormData) => {
    setIsSubmitting(true);

    try {
      let imageUrl = currentImageUrl;
      
      if (imageFile) {
        imageUrl = await uploadImage(characterId);
      }

      const { error: characterError } = await supabase
        .from("characters")
        .update({
          name: data.name,
          alias: data.alias || null,
          classification: data.classification,
          type: data.type,
          threat_level: data.threatLevel,
          location: data.location || null,
          age: data.age || null,
          gender: data.gender || null,
          height: data.height || null,
          weight: data.weight || null,
          race: data.race || null,
          quote: data.quote || null,
          origin_story: data.originStory || null,
          appearance: data.appearance || null,
          backstory: data.backstory || null,
          motivation: data.motivation || null,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", characterId);

      if (characterError) throw characterError;

      const { error: attributesError } = await supabase
        .from("character_attributes")
        .update({
          coordination: data.coordination,
          vigor: data.vigor,
          intellect: data.intellect,
          attention: data.attention,
          willpower: data.willpower,
          prowess: data.prowess,
        })
        .eq("character_id", characterId);

      if (attributesError) throw attributesError;

      toast({
        title: "Ficha atualizada!",
        description: "As alterações foram salvas com sucesso.",
      });

      reset();
      setImageFile(null);
      setImagePreview(null);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar ficha",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto cyber-card border-neon-cyan">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold glow-text-cyan">Editar Ficha</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-neon-cyan">Imagem do Personagem</Label>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 border-2 border-neon-cyan/30 rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : currentImageUrl ? (
                  <img src={currentImageUrl} alt="Current" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="cyber-input"
                />
              </div>
              {(imagePreview || currentImageUrl) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="text-neon-red hover:bg-neon-red/20"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-neon-cyan">Nome *</Label>
              <Input {...register("name")} className="cyber-input" />
              {errors.name && <p className="text-xs text-neon-red">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="alias" className="text-neon-cyan">Codinome / Alias</Label>
              <Input {...register("alias")} className="cyber-input" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="classification" className="text-neon-cyan">Classificação *</Label>
              <Input {...register("classification")} placeholder="Ex: Classe-S, Omega, etc" className="cyber-input" />
              {errors.classification && <p className="text-xs text-neon-red">{errors.classification.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-neon-cyan">Tipo *</Label>
              <Select onValueChange={(value) => setValue("type", value as any)} value={typeValue}>
                <SelectTrigger className="cyber-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-neon-cyan">
                  <SelectItem value="hero">Herói</SelectItem>
                  <SelectItem value="villain">Vilão</SelectItem>
                  <SelectItem value="neutral">Neutro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="threatLevel" className="text-neon-cyan">Nível de Ameaça</Label>
              <Input type="number" {...register("threatLevel", { valueAsNumber: true })} className="cyber-input" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-neon-cyan">Localização</Label>
              <Input {...register("location")} className="cyber-input" />
            </div>
          </div>

          {/* Physical Data */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age" className="text-neon-cyan">Idade</Label>
              <Input type="number" {...register("age", { valueAsNumber: true })} className="cyber-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender" className="text-neon-cyan">Gênero</Label>
              <Input {...register("gender")} className="cyber-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height" className="text-neon-cyan">Altura (cm)</Label>
              <Input type="number" {...register("height", { valueAsNumber: true })} className="cyber-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight" className="text-neon-cyan">Peso (kg)</Label>
              <Input type="number" {...register("weight", { valueAsNumber: true })} className="cyber-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="race" className="text-neon-cyan">Raça</Label>
              <Input {...register("race")} className="cyber-input" />
            </div>
          </div>

          {/* Attributes */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-neon-cyan">Atributos (1-15)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { name: "coordination", label: "Coordenação" },
                { name: "vigor", label: "Vigor" },
                { name: "intellect", label: "Intelecto" },
                { name: "attention", label: "Atenção" },
                { name: "willpower", label: "Vontade" },
                { name: "prowess", label: "Proeza" },
              ].map((attr) => (
                <div key={attr.name} className="space-y-2">
                  <Label htmlFor={attr.name} className="text-neon-cyan">{attr.label}</Label>
                  <Input
                    type="number"
                    min="1"
                    max="15"
                    {...register(attr.name as any, { valueAsNumber: true })}
                    className="cyber-input"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Quote */}
          <div className="space-y-2">
            <Label htmlFor="quote" className="text-neon-cyan">Citação Pessoal</Label>
            <Input {...register("quote")} placeholder="Uma frase marcante do personagem" className="cyber-input" />
          </div>

          {/* Text Areas */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="originStory" className="text-neon-cyan">Origem dos Poderes</Label>
              <Textarea {...register("originStory")} rows={3} className="cyber-input" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appearance" className="text-neon-cyan">Aparência</Label>
              <Textarea {...register("appearance")} rows={3} className="cyber-input" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="backstory" className="text-neon-cyan">História de Fundo</Label>
              <Textarea {...register("backstory")} rows={4} className="cyber-input" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivation" className="text-neon-cyan">Motivação</Label>
              <Textarea {...register("motivation")} rows={3} className="cyber-input" />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-neon-cyan hover:bg-neon-cyan/20"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-neon-cyan text-background hover:bg-neon-cyan/90 font-bold glow-cyan"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}