import { useState, useEffect } from "react";
import { Plus, Search, Zap, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES = [
  "Ofensivo",
  "Defensivo",
  "Suporte",
  "Utilitário",
  "Movimento",
  "Mental",
  "Elemental",
  "Transformação",
  "Controle",
  "Outro"
];

export default function PowersLibrary() {
  const { toast } = useToast();
  const [powers, setPowers] = useState<any[]>([]);
  const [filteredPowers, setFilteredPowers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Form states
  const [newPowerName, setNewPowerName] = useState("");
  const [newPowerCategory, setNewPowerCategory] = useState("");
  const [newPowerDescription, setNewPowerDescription] = useState("");
  const [newPowerBaseLevel, setNewPowerBaseLevel] = useState(1);

  useEffect(() => {
    fetchPowers();
  }, []);

  useEffect(() => {
    filterPowers();
  }, [searchTerm, selectedCategory, powers]);

  const fetchPowers = async () => {
    try {
      const { data, error } = await supabase
        .from("powers_library")
        .select("*")
        .order("name");

      if (error) throw error;
      setPowers(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar poderes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterPowers = () => {
    let filtered = [...powers];

    if (searchTerm) {
      filtered = filtered.filter(power =>
        power.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        power.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(power => power.category === selectedCategory);
    }

    setFilteredPowers(filtered);
  };

  const handleAddPower = async () => {
    if (!newPowerName || !newPowerCategory) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome e categoria do poder",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("powers_library")
        .insert({
          name: newPowerName,
          category: newPowerCategory,
          description: newPowerDescription,
          base_level: newPowerBaseLevel,
        });

      if (error) throw error;

      toast({
        title: "Poder adicionado!",
        description: "O poder foi adicionado à biblioteca.",
      });

      setNewPowerName("");
      setNewPowerCategory("");
      setNewPowerDescription("");
      setNewPowerBaseLevel(1);
      setIsAddModalOpen(false);
      fetchPowers();
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar poder",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Ofensivo": "bg-neon-red/20 text-neon-red border-neon-red",
      "Defensivo": "bg-neon-green/20 text-neon-green border-neon-green",
      "Suporte": "bg-neon-cyan/20 text-neon-cyan border-neon-cyan",
      "Utilitário": "bg-neon-yellow/20 text-neon-yellow border-neon-yellow",
      "Movimento": "bg-neon-blue/20 text-neon-blue border-neon-blue",
      "Mental": "bg-neon-magenta/20 text-neon-magenta border-neon-magenta",
      "Elemental": "bg-neon-orange/20 text-neon-orange border-neon-orange",
      "Transformação": "bg-neon-purple/20 text-neon-purple border-neon-purple",
      "Controle": "bg-neon-lime/20 text-neon-lime border-neon-lime",
    };
    return colors[category] || "bg-muted/20 text-foreground border-muted";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="cyber-card p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold glow-text-cyan mb-2 flex items-center">
              <Zap className="mr-3 w-10 h-10" />
              Biblioteca de Super Poderes
            </h1>
            <p className="text-muted-foreground">
              Gerencie todos os poderes disponíveis no sistema A.R.C.A.
            </p>
          </div>
          
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-neon-cyan text-background hover:bg-neon-cyan/90 font-bold glow-cyan">
                <Plus className="mr-2 w-5 h-5" />
                Novo Poder
              </Button>
            </DialogTrigger>
            <DialogContent className="cyber-card border-neon-cyan max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold glow-text-cyan">Adicionar Novo Poder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-neon-cyan">Nome do Poder *</Label>
                  <Input
                    value={newPowerName}
                    onChange={(e) => setNewPowerName(e.target.value)}
                    placeholder="Ex: Super Força, Telecinese, etc"
                    className="cyber-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-neon-cyan">Categoria *</Label>
                  <Select value={newPowerCategory} onValueChange={setNewPowerCategory}>
                    <SelectTrigger className="cyber-input">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-neon-cyan">
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-neon-cyan">Nível Base</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={newPowerBaseLevel}
                    onChange={(e) => setNewPowerBaseLevel(parseInt(e.target.value))}
                    className="cyber-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-neon-cyan">Descrição</Label>
                  <Textarea
                    value={newPowerDescription}
                    onChange={(e) => setNewPowerDescription(e.target.value)}
                    rows={4}
                    placeholder="Descreva os efeitos e características do poder..."
                    className="cyber-input"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="ghost"
                    onClick={() => setIsAddModalOpen(false)}
                    className="text-neon-cyan hover:bg-neon-cyan/20"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAddPower}
                    className="bg-neon-cyan text-background hover:bg-neon-cyan/90 font-bold"
                  >
                    Adicionar Poder
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neon-cyan w-5 h-5" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar poderes..."
              className="pl-10 cyber-input"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="cyber-input w-full md:w-64">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent className="bg-background border-neon-cyan">
              <SelectItem value="all">Todas as categorias</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 mt-4 text-sm text-muted-foreground">
          <span className="text-neon-cyan font-bold">{filteredPowers.length}</span>
          <span>poderes encontrados</span>
        </div>
      </div>

      {/* Powers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPowers.map((power) => (
          <Card key={power.id} className="cyber-card p-6 hover:scale-105 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">{power.name}</h3>
              <Badge className={`${getCategoryColor(power.category)} font-bold`}>
                {power.category}
              </Badge>
            </div>
            
            {power.description && (
              <p className="text-sm text-muted-foreground mb-4">{power.description}</p>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-neon-cyan/30">
              <span className="text-xs text-muted-foreground">Nível Base</span>
              <Badge className="bg-neon-cyan/20 text-neon-cyan border-neon-cyan font-bold">
                {power.base_level}
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      {filteredPowers.length === 0 && (
        <div className="text-center py-12">
          <Zap className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground">Nenhum poder encontrado</p>
        </div>
      )}
    </div>
  );
}