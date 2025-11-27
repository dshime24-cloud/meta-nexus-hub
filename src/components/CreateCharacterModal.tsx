import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2 } from "lucide-react";

const characterSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  alias: z.string().max(100).optional(),
  classification: z.string().min(1, "Classificação é obrigatória"),
  threatLevel: z.number().min(0).max(100),
  type: z.enum(["hero", "villain", "neutral"]),
  age: z.number().optional(),
  gender: z.string().optional(),
  height: z.number().optional(),
  weight: z.number().optional(),
  race: z.string().optional(),
  location: z.string().optional(),
  quote: z.string().optional(),
  originStory: z.string().optional(),
  backstory: z.string().optional(),
  appearance: z.string().optional(),
  motivation: z.string().optional(),
  // Attributes
  coordination: z.number().min(1).max(15).default(1),
  vigor: z.number().min(1).max(15).default(1),
  intellect: z.number().min(1).max(15).default(1),
  attention: z.number().min(1).max(15).default(1),
  willpower: z.number().min(1).max(15).default(1),
  prowess: z.number().min(1).max(15).default(1),
});

type CharacterFormData = z.infer<typeof characterSchema>;

interface CreateCharacterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateCharacterModal = ({
  open,
  onOpenChange,
  onSuccess,
}: CreateCharacterModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CharacterFormData>({
    resolver: zodResolver(characterSchema),
    defaultValues: {
      classification: "C",
      threatLevel: 1,
      type: "neutral",
      coordination: 1,
      vigor: 1,
      intellect: 1,
      attention: 1,
      willpower: 1,
      prowess: 1,
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 5MB",
          variant: "destructive",
        });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const uploadImage = async (characterId: string): Promise<string | null> => {
    if (!imageFile) return null;

    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${characterId}-${Date.now()}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from("character-images")
      .upload(fileName, imageFile);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("character-images")
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const onSubmit = async (data: CharacterFormData) => {
    setIsSubmitting(true);
    try {
      // Insert character
      const { data: character, error: characterError } = await supabase
        .from("characters")
        .insert({
          name: data.name,
          alias: data.alias || null,
          classification: data.classification,
          threat_level: data.threatLevel,
          type: data.type,
          age: data.age || null,
          gender: data.gender || null,
          height: data.height || null,
          weight: data.weight || null,
          race: data.race || null,
          location: data.location || null,
          quote: data.quote || null,
          origin_story: data.originStory || null,
          backstory: data.backstory || null,
          appearance: data.appearance || null,
          motivation: data.motivation || null,
          image_url: null,
        })
        .select()
        .single();

      if (characterError) throw characterError;

      // Upload image if exists
      if (imageFile && character) {
        const imageUrl = await uploadImage(character.id);
        if (imageUrl) {
          await supabase
            .from("characters")
            .update({ image_url: imageUrl })
            .eq("id", character.id);
        }
      }

      // Insert attributes
      const { error: attributesError } = await supabase
        .from("character_attributes")
        .insert({
          character_id: character.id,
          coordination: data.coordination,
          vigor: data.vigor,
          intellect: data.intellect,
          attention: data.attention,
          willpower: data.willpower,
          prowess: data.prowess,
        });

      if (attributesError) throw attributesError;

      toast({
        title: "✨ Personagem criado!",
        description: `${data.name} foi adicionado ao banco de dados.`,
      });

      reset();
      removeImage();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro ao criar personagem",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto bg-black border-2 scrollbar-hide"
        style={{
          borderColor: 'hsl(var(--neon-cyan))',
          boxShadow: '0 0 30px rgba(0, 255, 255, 0.4)',
        }}
      >
        <DialogHeader>
          <DialogTitle 
            className="text-2xl font-bold text-neon-cyan glow-text-cyan tracking-wider"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            + NOVA FICHA META-HUMANA
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
          {/* Image Upload */}
          <div className="cyber-card p-4 rounded-sm" style={{
            border: '1px solid hsl(var(--neon-cyan))',
            boxShadow: '0 0 10px rgba(0, 255, 255, 0.2)'
          }}>
            <Label className="text-neon-cyan text-sm font-bold tracking-wide mb-2 block" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              IMAGEM DO PERSONAGEM
            </Label>
            {imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-sm border-2 border-neon-cyan"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-neon-red rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <X className="w-4 h-4 text-black" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-neon-cyan rounded-sm cursor-pointer hover:bg-neon-cyan/10 transition-all">
                <Upload className="w-8 h-8 text-neon-cyan mb-2" />
                <span className="text-xs text-neon-cyan" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  UPLOAD
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-neon-cyan text-sm font-bold tracking-wide" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                NOME *
              </Label>
              <Input
                {...register("name")}
                className="mt-1 bg-black border-neon-cyan text-neon-cyan"
                style={{ fontFamily: 'Rajdhani, sans-serif' }}
              />
              {errors.name && (
                <p className="text-neon-red text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label className="text-neon-cyan text-sm font-bold tracking-wide" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                ALIAS / CODINOME
              </Label>
              <Input
                {...register("alias")}
                className="mt-1 bg-black border-neon-cyan text-neon-cyan"
                style={{ fontFamily: 'Rajdhani, sans-serif' }}
              />
            </div>

            <div>
              <Label className="text-neon-cyan text-sm font-bold tracking-wide" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                CLASSIFICAÇÃO *
              </Label>
              <select
                {...register("classification")}
                className="mt-1 w-full px-3 py-2 bg-black border border-neon-cyan text-neon-cyan rounded-sm"
                style={{ fontFamily: 'Rajdhani, sans-serif' }}
              >
                <option value="F">F - Fraco</option>
                <option value="D">D - Baixo</option>
                <option value="C">C - Médio</option>
                <option value="B">B - Alto</option>
                <option value="A">A - Muito Alto</option>
                <option value="S">S - Excepcional</option>
              </select>
            </div>

            <div>
              <Label className="text-neon-cyan text-sm font-bold tracking-wide" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                TIPO *
              </Label>
              <select
                {...register("type")}
                className="mt-1 w-full px-3 py-2 bg-black border border-neon-cyan text-neon-cyan rounded-sm"
                style={{ fontFamily: 'Rajdhani, sans-serif' }}
              >
                <option value="hero">Herói</option>
                <option value="villain">Vilão</option>
                <option value="neutral">Neutro</option>
              </select>
            </div>

            <div>
              <Label className="text-neon-cyan text-sm font-bold tracking-wide" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                NÍVEL DE AMEAÇA
              </Label>
              <Input
                type="number"
                {...register("threatLevel", { valueAsNumber: true })}
                className="mt-1 bg-black border-neon-cyan text-neon-cyan"
                style={{ fontFamily: 'Rajdhani, sans-serif' }}
              />
            </div>

            <div>
              <Label className="text-neon-cyan text-sm font-bold tracking-wide" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                LOCALIZAÇÃO
              </Label>
              <Input
                {...register("location")}
                className="mt-1 bg-black border-neon-cyan text-neon-cyan"
                style={{ fontFamily: 'Rajdhani, sans-serif' }}
              />
            </div>
          </div>

          {/* Physical Info */}
          <div className="cyber-card p-4 rounded-sm" style={{
            border: '1px solid hsl(var(--neon-lime))',
            boxShadow: '0 0 10px rgba(57, 255, 20, 0.2)'
          }}>
            <h3 className="text-neon-lime font-bold mb-3 tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              DADOS FÍSICOS
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-neon-cyan text-xs" style={{ fontFamily: 'Rajdhani, sans-serif' }}>IDADE</Label>
                <Input
                  type="number"
                  {...register("age", { valueAsNumber: true })}
                  className="mt-1 bg-black border-neon-cyan text-neon-cyan"
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                />
              </div>
              <div>
                <Label className="text-neon-cyan text-xs" style={{ fontFamily: 'Rajdhani, sans-serif' }}>GÊNERO</Label>
                <Input
                  {...register("gender")}
                  className="mt-1 bg-black border-neon-cyan text-neon-cyan"
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                />
              </div>
              <div>
                <Label className="text-neon-cyan text-xs" style={{ fontFamily: 'Rajdhani, sans-serif' }}>ALTURA (cm)</Label>
                <Input
                  type="number"
                  {...register("height", { valueAsNumber: true })}
                  className="mt-1 bg-black border-neon-cyan text-neon-cyan"
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                />
              </div>
              <div>
                <Label className="text-neon-cyan text-xs" style={{ fontFamily: 'Rajdhani, sans-serif' }}>PESO (kg)</Label>
                <Input
                  type="number"
                  {...register("weight", { valueAsNumber: true })}
                  className="mt-1 bg-black border-neon-cyan text-neon-cyan"
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                />
              </div>
            </div>
            <div className="mt-4">
              <Label className="text-neon-cyan text-xs" style={{ fontFamily: 'Rajdhani, sans-serif' }}>RAÇA</Label>
              <Input
                {...register("race")}
                className="mt-1 bg-black border-neon-cyan text-neon-cyan"
                style={{ fontFamily: 'Rajdhani, sans-serif' }}
                placeholder="Ex: Humano, Meta-Humano, Alien..."
              />
            </div>
          </div>

          {/* Attributes */}
          <div className="cyber-card p-4 rounded-sm" style={{
            border: '1px solid hsl(var(--neon-magenta))',
            boxShadow: '0 0 10px rgba(255, 0, 255, 0.2)'
          }}>
            <h3 className="text-neon-magenta font-bold mb-3 tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              ATRIBUTOS (1-15)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { name: "coordination", label: "COORDENAÇÃO" },
                { name: "vigor", label: "VIGOR" },
                { name: "intellect", label: "INTELECTO" },
                { name: "attention", label: "ATENÇÃO" },
                { name: "willpower", label: "VONTADE" },
                { name: "prowess", label: "PROEZA" },
              ].map((attr) => (
                <div key={attr.name}>
                  <Label className="text-neon-cyan text-xs" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    {attr.label}
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="15"
                    {...register(attr.name as keyof CharacterFormData, { valueAsNumber: true })}
                    className="mt-1 bg-black border-neon-cyan text-neon-cyan text-center font-bold"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Story Fields */}
          <div className="space-y-4">
            <div>
              <Label className="text-neon-cyan text-sm font-bold tracking-wide" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                CITAÇÃO PESSOAL
              </Label>
              <Input
                {...register("quote")}
                className="mt-1 bg-black border-neon-cyan text-neon-cyan italic"
                style={{ fontFamily: 'Rajdhani, sans-serif' }}
                placeholder='"Uma frase marcante do personagem..."'
              />
            </div>

            <div>
              <Label className="text-neon-cyan text-sm font-bold tracking-wide" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                ORIGEM DOS PODERES
              </Label>
              <Textarea
                {...register("originStory")}
                className="mt-1 bg-black border-neon-cyan text-neon-cyan min-h-[80px]"
                style={{ fontFamily: 'Rajdhani, sans-serif' }}
                placeholder="Como o personagem adquiriu seus poderes..."
              />
            </div>

            <div>
              <Label className="text-neon-cyan text-sm font-bold tracking-wide" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                APARÊNCIA
              </Label>
              <Textarea
                {...register("appearance")}
                className="mt-1 bg-black border-neon-cyan text-neon-cyan min-h-[80px]"
                style={{ fontFamily: 'Rajdhani, sans-serif' }}
                placeholder="Descrição da aparência física..."
              />
            </div>

            <div>
              <Label className="text-neon-cyan text-sm font-bold tracking-wide" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                BACKSTORY / HISTÓRICO
              </Label>
              <Textarea
                {...register("backstory")}
                className="mt-1 bg-black border-neon-cyan text-neon-cyan min-h-[120px]"
                style={{ fontFamily: 'Rajdhani, sans-serif' }}
                placeholder="História de vida do personagem..."
              />
            </div>

            <div>
              <Label className="text-neon-cyan text-sm font-bold tracking-wide" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                MOTIVAÇÃO
              </Label>
              <Textarea
                {...register("motivation")}
                className="mt-1 bg-black border-neon-cyan text-neon-cyan min-h-[80px]"
                style={{ fontFamily: 'Rajdhani, sans-serif' }}
                placeholder="O que motiva o personagem..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-sm font-bold tracking-wider transition-all hover:scale-105"
              style={{
                background: 'hsl(var(--neon-lime))',
                color: '#000',
                boxShadow: '0 0 20px rgba(57, 255, 20, 0.5)',
                fontFamily: 'Rajdhani, sans-serif'
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                  CRIANDO...
                </>
              ) : (
                "✓ CRIAR PERSONAGEM"
              )}
            </Button>
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="rounded-sm font-bold tracking-wider border-2"
              style={{
                borderColor: 'hsl(var(--neon-red))',
                color: 'hsl(var(--neon-red))',
                background: 'black',
                fontFamily: 'Rajdhani, sans-serif'
              }}
            >
              ✕ CANCELAR
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
