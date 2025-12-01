import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, ShoppingCart, Zap, Star, Heart, Package, Infinity, User, Plus, Pencil, Trash2 } from "lucide-react";
import { ShopItemModal } from "@/components/ShopItemModal";
import type { Tables } from "@/integrations/supabase/types";

type ShopItem = Tables<"shop_items">;
type Character = Tables<"characters">;

const itemTypeIcons: Record<string, React.ReactNode> = {
  consumivel: <Package className="h-4 w-4" />,
  equipamento: <Star className="h-4 w-4" />,
  habilidade: <Zap className="h-4 w-4" />,
  melhoria: <Heart className="h-4 w-4" />,
};

const itemTypeColors: Record<string, string> = {
  consumivel: "bg-neon-lime/20 text-neon-lime border-neon-lime",
  equipamento: "bg-neon-purple/20 text-neon-purple border-neon-purple",
  habilidade: "bg-neon-cyan/20 text-neon-cyan border-neon-cyan",
  melhoria: "bg-neon-orange/20 text-neon-orange border-neon-orange",
};

export default function Shop() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ["shop-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_items")
        .select("*")
        .order("type", { ascending: true });
      if (error) throw error;
      return data as ShopItem[];
    },
  });

  const { data: characters = [], isLoading: loadingCharacters } = useQuery({
    queryKey: ["characters-for-shop"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("characters")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Character[];
    },
  });

  const selectedCharacter = characters.find(c => c.id === selectedCharacterId);

  const purchaseMutation = useMutation({
    mutationFn: async ({ item, characterId }: { item: ShopItem; characterId: string }) => {
      const character = characters.find(c => c.id === characterId);
      if (!character) throw new Error("Personagem não encontrado");

      let newXp = character.xp || 0;
      let newEnergy = character.energy || 100;
      let newDetermination = character.determination_points || 3;

      if (item.cost > (character.xp || 0)) {
        throw new Error("XP insuficiente para comprar este item");
      }

      newXp -= item.cost;

      if (item.effect) {
        const effects = item.effect.toLowerCase();
        if (effects.includes("+1 xp")) newXp += 1;
        if (effects.includes("+1 eh") || effects.includes("+1 energia")) newEnergy += 1;
        if (effects.includes("+1 fh") || effects.includes("+1 determinação")) newDetermination += 1;
        if (effects.includes("+5 xp")) newXp += 5;
        if (effects.includes("+10 xp")) newXp += 10;
        if (effects.includes("+5 eh") || effects.includes("+5 energia")) newEnergy += 5;
        if (effects.includes("+10 eh") || effects.includes("+10 energia")) newEnergy += 10;
      }

      const { error } = await supabase
        .from("characters")
        .update({
          xp: newXp,
          energy: newEnergy,
          determination_points: newDetermination,
        })
        .eq("id", characterId);

      if (error) throw error;
      return { item, character };
    },
    onSuccess: ({ item, character }) => {
      queryClient.invalidateQueries({ queryKey: ["characters-for-shop"] });
      toast({
        title: "Compra realizada!",
        description: `${item.name} foi aplicado a ${character.name}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na compra",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("shop_items")
        .delete()
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-items"] });
      toast({
        title: "Item removido",
        description: "O item foi removido da loja.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const itemTypes = [...new Set(items.map(item => item.type))];

  const handlePurchase = (item: ShopItem) => {
    if (!selectedCharacterId) {
      toast({
        title: "Selecione um personagem",
        description: "Escolha um personagem para receber o item",
        variant: "destructive",
      });
      return;
    }
    purchaseMutation.mutate({ item, characterId: selectedCharacterId });
  };

  const handleEdit = (item: ShopItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (item: ShopItem) => {
    if (confirm(`Tem certeza que deseja remover "${item.name}" da loja?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["shop-items"] });
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary glow-text-cyan font-['Orbitron']">
              LOJA
            </h1>
            <p className="text-muted-foreground mt-1">
              Adquira itens e melhorias para seus personagens
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-neon-lime" />
              <span className="text-neon-lime font-bold">{items.length} itens</span>
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-neon-lime text-background hover:bg-neon-lime/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Item
            </Button>
          </div>
        </div>

        {/* Character Selection */}
        <Card className="cyber-card mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-primary flex items-center gap-2">
              <User className="h-5 w-5" />
              Selecionar Personagem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <Select value={selectedCharacterId} onValueChange={setSelectedCharacterId}>
                <SelectTrigger className="w-full md:w-80 bg-muted border-primary/30">
                  <SelectValue placeholder="Escolha um personagem" />
                </SelectTrigger>
                <SelectContent className="bg-background border-primary">
                  {characters.map((char) => (
                    <SelectItem key={char.id} value={char.id}>
                      {char.name} {char.alias && `(${char.alias})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedCharacter && (
                <div className="flex gap-4 items-center flex-wrap">
                  <div className="flex items-center gap-2 px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded">
                    <Star className="h-4 w-4 text-neon-cyan" />
                    <span className="text-neon-cyan font-bold">{selectedCharacter.xp || 0} XP</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-neon-lime/10 border border-neon-lime/30 rounded">
                    <Zap className="h-4 w-4 text-neon-lime" />
                    <span className="text-neon-lime font-bold">{selectedCharacter.energy || 0} EH</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-neon-orange/10 border border-neon-orange/30 rounded">
                    <Heart className="h-4 w-4 text-neon-orange" />
                    <span className="text-neon-orange font-bold">{selectedCharacter.determination_points || 0} FH</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar itens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted border-primary/30 focus:border-primary"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-48 bg-muted border-primary/30">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="bg-background border-primary">
              <SelectItem value="all">Todos os tipos</SelectItem>
              {itemTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Items Grid */}
        {loadingItems || loadingCharacters ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-pulse text-primary">Carregando itens...</div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Nenhum item encontrado</p>
            <Button
              onClick={() => setIsModalOpen(true)}
              variant="outline"
              className="mt-4 border-primary text-primary hover:bg-primary/10"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar primeiro item
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className="cyber-card-interactive group">
                <CardContent className="p-4">
                  {/* Item Image */}
                  {item.image_url && (
                    <div className="w-full h-32 mb-3 rounded overflow-hidden bg-muted/30">
                      <img 
                        src={item.image_url} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-3">
                    <Badge 
                      variant="outline" 
                      className={`${itemTypeColors[item.type] || 'border-primary text-primary'} flex items-center gap-1`}
                    >
                      {itemTypeIcons[item.type] || <Package className="h-3 w-3" />}
                      {item.type}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {item.unlimited && (
                        <span title="Compra ilimitada">
                          <Infinity className="h-4 w-4 text-neon-purple" />
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleEdit(item)}
                      >
                        <Pencil className="h-4 w-4 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-primary mb-2 font-['Orbitron']">
                    {item.name}
                  </h3>

                  {item.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {item.effect && (
                    <div className="mb-4 p-2 bg-neon-lime/10 border border-neon-lime/30 rounded">
                      <p className="text-xs text-neon-lime">
                        <Zap className="h-3 w-3 inline mr-1" />
                        {item.effect}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-primary/20">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-neon-yellow" />
                      <span className="font-bold text-neon-yellow">{item.cost} XP</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handlePurchase(item)}
                      disabled={purchaseMutation.isPending || !selectedCharacterId}
                      className="bg-primary text-primary-foreground hover:bg-primary/80"
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Comprar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Shop Item Modal */}
      <ShopItemModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        item={editingItem}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
