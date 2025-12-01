import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2, Crop } from "lucide-react";
import { ImageCropper } from "./ImageCropper";
import type { Tables } from "@/integrations/supabase/types";

const shopItemSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  description: z.string().max(500).optional(),
  type: z.string().min(1, "Tipo é obrigatório"),
  effect: z.string().max(200).optional(),
  cost: z.number().min(0, "Custo deve ser positivo"),
  unlimited: z.boolean().default(false),
});

type ShopItemFormData = z.infer<typeof shopItemSchema>;
type ShopItem = Tables<"shop_items">;

interface ShopItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: ShopItem | null;
  onSuccess: () => void;
}

export function ShopItemModal({ isOpen, onClose, item, onSuccess }: ShopItemModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<ShopItemFormData>({
    resolver: zodResolver(shopItemSchema),
    defaultValues: {
      cost: 0,
      unlimited: false,
      type: "consumivel",
    },
  });

  const typeValue = watch("type");
  const unlimitedValue = watch("unlimited");

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setValue("name", item.name);
        setValue("description", item.description || "");
        setValue("type", item.type);
        setValue("effect", item.effect || "");
        setValue("cost", item.cost);
        setValue("unlimited", item.unlimited || false);
        setImagePreview(item.image_url || null);
      } else {
        reset({
          cost: 0,
          unlimited: false,
          type: "consumivel",
        });
        setImagePreview(null);
        setImageFile(null);
      }
    }
  }, [isOpen, item, setValue, reset]);

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

  const uploadImage = async (itemId: string): Promise<string | null> => {
    if (!imageFile) return item?.image_url || null;

    const fileExt = "jpg";
    const fileName = `shop-${itemId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("character-images")
      .upload(fileName, imageFile, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("character-images")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const onSubmit = async (data: ShopItemFormData) => {
    setIsSubmitting(true);
    try {
      if (item) {
        // Update existing item
        const imageUrl = await uploadImage(item.id);
        
        const { error } = await supabase
          .from("shop_items")
          .update({
            name: data.name,
            description: data.description || null,
            type: data.type,
            effect: data.effect || null,
            cost: data.cost,
            unlimited: data.unlimited,
            image_url: imageUrl,
          })
          .eq("id", item.id);

        if (error) throw error;

        toast({
          title: "Item atualizado!",
          description: `${data.name} foi atualizado com sucesso.`,
        });
      } else {
        // Create new item
        const { data: newItem, error } = await supabase
          .from("shop_items")
          .insert({
            name: data.name,
            description: data.description || null,
            type: data.type,
            effect: data.effect || null,
            cost: data.cost,
            unlimited: data.unlimited,
          })
          .select()
          .single();

        if (error) throw error;

        // Upload image if exists
        if (imageFile && newItem) {
          const imageUrl = await uploadImage(newItem.id);
          await supabase
            .from("shop_items")
            .update({ image_url: imageUrl })
            .eq("id", newItem.id);
        }

        toast({
          title: "Item criado!",
          description: `${data.name} foi adicionado à loja.`,
        });
      }

      reset();
      removeImage();
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar item",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg bg-background border-primary max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary text-xl">
              {item ? "Editar Item" : "Novo Item da Loja"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="text-primary">Imagem do Item</Label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 border-2 border-primary/30 rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-primary text-primary hover:bg-primary/10"
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
                      className="text-destructive hover:bg-destructive/10"
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

            {/* Name */}
            <div className="space-y-2">
              <Label className="text-primary">Nome *</Label>
              <Input {...register("name")} className="cyber-input" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label className="text-primary">Tipo *</Label>
              <Select value={typeValue} onValueChange={(value) => setValue("type", value)}>
                <SelectTrigger className="cyber-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-primary">
                  <SelectItem value="consumivel">Consumível</SelectItem>
                  <SelectItem value="equipamento">Equipamento</SelectItem>
                  <SelectItem value="habilidade">Habilidade</SelectItem>
                  <SelectItem value="melhoria">Melhoria</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-primary">Descrição</Label>
              <Textarea {...register("description")} className="cyber-input min-h-[80px]" />
            </div>

            {/* Effect */}
            <div className="space-y-2">
              <Label className="text-primary">Efeito</Label>
              <Input 
                {...register("effect")} 
                className="cyber-input" 
                placeholder="Ex: +5 XP, +10 Energia, etc."
              />
            </div>

            {/* Cost */}
            <div className="space-y-2">
              <Label className="text-primary">Custo (XP) *</Label>
              <Input 
                type="number" 
                {...register("cost", { valueAsNumber: true })} 
                className="cyber-input" 
              />
              {errors.cost && <p className="text-xs text-destructive">{errors.cost.message}</p>}
            </div>

            {/* Unlimited */}
            <div className="flex items-center justify-between">
              <Label className="text-primary">Compra Ilimitada</Label>
              <Switch
                checked={unlimitedValue}
                onCheckedChange={(checked) => setValue("unlimited", checked)}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  item ? "Salvar Alterações" : "Criar Item"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
}
