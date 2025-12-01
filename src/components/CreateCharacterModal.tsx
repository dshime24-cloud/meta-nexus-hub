import { useState, useRef } from "react";
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
import { Upload, X, Loader2, Crop } from "lucide-react";
import { ImageCropper } from "./ImageCropper";
import { PowerSelectorSimple } from "./PowerSelectorSimple";

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
  coordination: z.number().min(1).max(15).default(1),
  vigor: z.number().min(1).max(15).default(1),
  intellect: z.number().min(1).max(15).default(1),
  attention: z.number().min(1).max(15).default(1),
  willpower: z.number().min(1).max(15).default(1),
  prowess: z.number().min(1).max(15).default(1),
});

type CharacterFormData = z.infer<typeof characterSchema>;

interface SelectedPower {
  power_id: string;
  custom_name: string;
  level: number;
  description: string;
  extras: string;
  limitations: string;
}

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
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string>("");
  const [selectedPowers, setSelectedPowers] = useState<SelectedPower[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImageSrc(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    const file = new File([croppedBlob], "cropped-image.jpg", { type: "image/jpeg" });
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(croppedBlob);
    setShowCropper(false);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (characterId: string): Promise<string | null> => {
    if (!imageFile) return null;

    const fileExt = "jpg";
    const fileName = `${characterId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
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

      // Insert selected powers
      if (selectedPowers.length > 0) {
        const powersToInsert = selectedPowers.map((p) => ({
          character_id: character.id,
          power_id: p.power_id,
          custom_name: p.custom_name || null,
          level: p.level,
          description: p.description || null,
          extras: p.extras || null,
          limitations: p.limitations || null,
        }));

        const { error: powersError } = await supabase
          .from("character_powers")
          .insert(powersToInsert);

        if (powersError) throw powersError;
      }

      toast({
        title: "✨ Personagem criado!",
        description: `${data.name} foi adicionado ao banco de dados.`,
      });

      reset();
      removeImage();
      setSelectedPowers([]);
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-2 scrollbar-hide"
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
              <div className="flex items-center gap-4">
                <div className="w-32 h-32 border-2 border-neon-cyan/30 rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10"
                  >
                    <Crop className="w-4 h-4 mr-2" />
                    Selecionar e Recortar
                  </Button>
                  {imagePreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeImage}
                      className="text-neon-red hover:bg-neon-red/10"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remover
                    </Button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-neon-cyan text-sm font-bold tracking-wide" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  NOME *
                </Label>
                <Input
                  {...register("name")}
                  className="mt-1 bg-background border-neon-cyan text-foreground"
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
                  className="mt-1 bg-background border-neon-cyan text-foreground"
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                />
              </div>

              <div>
                <Label className="text-neon-cyan text-sm font-bold tracking-wide" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  CLASSIFICAÇÃO *
                </Label>
                <select
                  {...register("classification")}
                  className="mt-1 w-full px-3 py-2 bg-background border border-neon-cyan text-foreground rounded-sm"
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
                  className="mt-1 w-full px-3 py-2 bg-background border border-neon-cyan text-foreground rounded-sm"
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
                  className="mt-1 bg-background border-neon-cyan text-foreground"
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                />
              </div>

              <div>
                <Label className="text-neon-cyan text-sm font-bold tracking-wide" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  LOCALIZAÇÃO
                </Label>
                <Input
                  {...register("location")}
                  className="mt-1 bg-background border-neon-cyan text-foreground"
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
                    className="mt-1 bg-background border-neon-cyan text-foreground"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  />
                </div>
                <div>
                  <Label className="text-neon-cyan text-xs" style={{ fontFamily: 'Rajdhani, sans-serif' }}>GÊNERO</Label>
                  <Input
                    {...register("gender")}
                    className="mt-1 bg-background border-neon-cyan text-foreground"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  />
                </div>
                <div>
                  <Label className="text-neon-cyan text-xs" style={{ fontFamily: 'Rajdhani, sans-serif' }}>ALTURA (cm)</Label>
                  <Input
                    type="number"
                    {...register("height", { valueAsNumber: true })}
                    className="mt-1 bg-background border-neon-cyan text-foreground"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  />
                </div>
                <div>
                  <Label className="text-neon-cyan text-xs" style={{ fontFamily: 'Rajdhani, sans-serif' }}>PESO (kg)</Label>
                  <Input
                    type="number"
                    {...register("weight", { valueAsNumber: true })}
                    className="mt-1 bg-background border-neon-cyan text-foreground"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  />
                </div>
              </div>
              <div className="mt-4">
                <Label className="text-neon-cyan text-xs" style={{ fontFamily: 'Rajdhani, sans-serif' }}>RAÇA</Label>
                <Input
                  {...register("race")}
                  className="mt-1 bg-background border-neon-cyan text-foreground"
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
                      className="mt-1 bg-background border-neon-cyan text-foreground text-center font-bold"
                      style={{ fontFamily: 'Orbitron, sans-serif' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Powers */}
            <div className="cyber-card p-4 rounded-sm" style={{
              border: '1px solid hsl(var(--neon-magenta))',
              boxShadow: '0 0 10px rgba(255, 0, 255, 0.2)'
            }}>
              <PowerSelectorSimple
                selectedPowers={selectedPowers}
                onPowersChange={setSelectedPowers}
              />
            </div>

            {/* Story Fields */}
            <div className="space-y-4">
              <div>
                <Label className="text-neon-cyan text-sm font-bold tracking-wide" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  CITAÇÃO PESSOAL
                </Label>
                <Input
                  {...register("quote")}
                  className="mt-1 bg-background border-neon-cyan text-foreground italic"
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
                  className="mt-1 bg-background border-neon-cyan text-foreground min-h-[80px]"
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
                  className="mt-1 bg-background border-neon-cyan text-foreground min-h-[80px]"
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  placeholder="Descrição da aparência física..."
                />
              </div>

              <div>
                <Label className="text-neon-cyan text-sm font-bold tracking-wide" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  HISTÓRIA DE FUNDO
                </Label>
                <Textarea
                  {...register("backstory")}
                  className="mt-1 bg-background border-neon-cyan text-foreground min-h-[80px]"
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  placeholder="A história de vida do personagem..."
                />
              </div>

              <div>
                <Label className="text-neon-cyan text-sm font-bold tracking-wide" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  MOTIVAÇÃO
                </Label>
                <Textarea
                  {...register("motivation")}
                  className="mt-1 bg-background border-neon-cyan text-foreground min-h-[80px]"
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  placeholder="O que motiva o personagem..."
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-neon-cyan/30">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
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
                    Criando...
                  </>
                ) : (
                  "Criar Personagem"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Cropper */}
      {showCropper && (
        <ImageCropper
          isOpen={showCropper}
          imageSrc={tempImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={() => setShowCropper(false)}
          aspect={1}
        />
      )}
    </>
  );
};
