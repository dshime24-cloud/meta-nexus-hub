import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { CraftingSystem } from "@/components/CraftingSystem";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Hammer } from "lucide-react";

const Crafting = () => {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("");

  const { data: characters = [] } = useQuery({
    queryKey: ["characters-for-crafting"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("characters")
        .select("id, name, alias, level")
        .eq("type", "herói");
      if (error) throw error;
      return data;
    },
  });

  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-slide-up">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text-fire font-space mb-2 flex items-center gap-3">
            <Hammer className="w-10 h-10" /> Sistema de Crafting
          </h1>
          <p className="text-muted-foreground text-lg">
            Combine itens do inventário para criar equipamentos poderosos
          </p>
        </div>

        <Card className="cyber-card mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <CardContent className="pt-6">
            <label className="block text-sm font-medium text-neon-cyan mb-2">
              Selecione um Personagem para Crafting
            </label>
            <Select value={selectedCharacterId} onValueChange={setSelectedCharacterId}>
              <SelectTrigger className="bg-muted border-primary/50 max-w-md">
                <SelectValue placeholder="Escolha um personagem..." />
              </SelectTrigger>
              <SelectContent>
                {characters.map((char) => (
                  <SelectItem key={char.id} value={char.id}>
                    {char.alias || char.name} (Nível {char.level || 1})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedCharacterId && selectedCharacter ? (
          <div className="animate-scale-in">
            <CraftingSystem
              characterId={selectedCharacterId}
              characterLevel={selectedCharacter.level || 1}
            />
          </div>
        ) : (
          <Card className="cyber-card-magenta animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <CardContent className="py-12 text-center">
              <Hammer className="w-16 h-16 mx-auto mb-4 text-neon-magenta opacity-50" />
              <p className="text-muted-foreground text-lg">
                Selecione um personagem para acessar o sistema de crafting
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Crafting;