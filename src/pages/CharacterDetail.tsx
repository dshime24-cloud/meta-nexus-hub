import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Skull, Zap, Users, Star, Edit, Dices, BookOpen, Target, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";
import { EditCharacterModal } from "@/components/EditCharacterModal";
import { PowerSelector } from "@/components/PowerSelector";
import { DiceRoller } from "@/components/DiceRoller";
import { SpecialtyManager } from "@/components/SpecialtyManager";
import { CharacterInventory } from "@/components/CharacterInventory";
import { CombatButton } from "@/components/CombatButton";

interface Specialty {
  id: string;
  name: string;
  attribute: string;
  bonus: number;
  description: string | null;
}

export default function CharacterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [character, setCharacter] = useState<any>(null);
  const [attributes, setAttributes] = useState<any>(null);
  const [powers, setPowers] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDiceRollerOpen, setIsDiceRollerOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCharacter();
    }
  }, [id]);

  const fetchCharacter = async () => {
    try {
      const { data: charData, error: charError } = await supabase
        .from("characters")
        .select("*")
        .eq("id", id)
        .single();

      if (charError) throw charError;

      const { data: attrData } = await supabase
        .from("character_attributes")
        .select("*")
        .eq("character_id", id)
        .single();

      const { data: powersData } = await supabase
        .from("character_powers")
        .select("*, powers_library(*)")
        .eq("character_id", id);

      const { data: specialtiesData } = await supabase
        .from("character_specialties")
        .select("*")
        .eq("character_id", id);

      setCharacter(charData);
      setAttributes(attrData);
      setPowers(powersData || []);
      setSpecialties(specialtiesData || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar personagem",
        description: error.message,
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan"></div>
      </div>
    );
  }

  if (!character) return null;

  const radarData = attributes ? [
    { attribute: "Coordenação", value: attributes.coordination },
    { attribute: "Vigor", value: attributes.vigor },
    { attribute: "Intelecto", value: attributes.intellect },
    { attribute: "Atenção", value: attributes.attention },
    { attribute: "Vontade", value: attributes.willpower },
    { attribute: "Proeza", value: attributes.prowess },
  ] : [];

  const xpProgress = (character.xp % 100);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="text-neon-cyan hover:text-neon-cyan hover:bg-neon-cyan/20"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsDiceRollerOpen(true)}
            variant="outline"
            className="border-neon-lime text-neon-lime hover:bg-neon-lime/20"
          >
            <Dices className="mr-2 w-4 h-4" />
            Rolagem
          </Button>
          <CombatButton characterId={id!} />
          <Button
            onClick={() => setIsEditModalOpen(true)}
            className="bg-neon-cyan text-background hover:bg-neon-cyan/90 font-bold glow-cyan"
          >
            <Edit className="mr-2 w-4 h-4" />
            Editar Ficha
          </Button>
        </div>
      </div>

      {/* Header Section */}
      <div className="cyber-card p-8 mb-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-64 h-64 bg-gradient-to-br from-neon-cyan/10 to-neon-magenta/10 rounded-lg flex items-center justify-center">
            {character.image_url ? (
              <img src={character.image_url} alt={character.name} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <div className="text-8xl font-bold text-neon-cyan opacity-30">
                {character.name.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl font-bold glow-text-cyan mb-2">{character.name}</h1>
                {character.alias && (
                  <p className="text-xl text-neon-magenta">"{character.alias}"</p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {character.type === "hero" ? (
                  <Badge className="bg-neon-green/20 text-neon-green border-neon-green text-lg px-4 py-2">
                    <Shield className="w-5 h-5 mr-2" />
                    Herói
                  </Badge>
                ) : character.type === "villain" ? (
                  <Badge className="bg-neon-red/20 text-neon-red border-neon-red text-lg px-4 py-2">
                    <Skull className="w-5 h-5 mr-2" />
                    Vilão
                  </Badge>
                ) : (
                  <Badge className="bg-neon-cyan/20 text-neon-cyan border-neon-cyan text-lg px-4 py-2">
                    Neutro
                  </Badge>
                )}
                <Badge className="text-2xl font-bold px-4 py-2 bg-neon-cyan/20 text-neon-cyan border-neon-cyan">
                  {character.classification}
                </Badge>
              </div>
            </div>

            {/* XP Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Nível {character.level}</span>
                <span className="text-neon-cyan">{character.xp} XP</span>
              </div>
              <Progress value={xpProgress} className="h-3 bg-muted" />
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div>
                <p className="text-muted-foreground text-sm">Idade</p>
                <p className="text-foreground font-bold">{character.age || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Gênero</p>
                <p className="text-foreground font-bold">{character.gender || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Altura</p>
                <p className="text-foreground font-bold">{character.height ? `${character.height}cm` : "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Peso</p>
                <p className="text-foreground font-bold">{character.weight ? `${character.weight}kg` : "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Raça</p>
                <p className="text-foreground font-bold">{character.race || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Localização</p>
                <p className="text-foreground font-bold">{character.location || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Nível de Ameaça</p>
                <p className="text-neon-red font-bold text-xl">{character.threat_level || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Energia</p>
                <p className="text-neon-green font-bold">{character.energy || 100}</p>
              </div>
            </div>

            {character.quote && (
              <div className="pt-4 border-t border-neon-cyan/30">
                <p className="italic text-neon-magenta">"{character.quote}"</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attributes Radar */}
        <Card className="cyber-card p-6">
          <h2 className="text-2xl font-bold text-neon-cyan mb-6 flex items-center">
            <Star className="mr-2" />
            Atributos
          </h2>
          {attributes && (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--neon-cyan))" strokeOpacity={0.3} />
                  <PolarAngleAxis 
                    dataKey="attribute" 
                    tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                  />
                  <PolarRadiusAxis angle={90} domain={[0, 15]} tick={{ fill: 'hsl(var(--foreground))' }} />
                  <Radar
                    name="Atributos"
                    dataKey="value"
                    stroke="hsl(var(--neon-cyan))"
                    fill="hsl(var(--neon-cyan))"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                {radarData.map((attr) => (
                  <div key={attr.attribute} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <span className="text-sm">{attr.attribute}</span>
                    <span className="text-neon-cyan font-bold text-lg">{attr.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Powers */}
        <Card className="cyber-card p-6">
          <PowerSelector
            characterId={id!}
            existingPowers={powers}
            onUpdate={fetchCharacter}
          />
        </Card>

        {/* Specialties */}
        <SpecialtyManager
          characterId={id!}
          specialties={specialties}
          powers={powers}
          onUpdate={fetchCharacter}
        />

        {/* Inventory */}
        <CharacterInventory
          characterId={id!}
          currentXp={character.xp || 0}
          currentEnergy={character.energy || 100}
          currentDetermination={character.determination_points || 0}
        />

        {/* Determination Points */}
        <Card className="cyber-card p-6">
          <h2 className="text-2xl font-bold text-neon-orange mb-4 flex items-center">
            <Heart className="mr-2" />
            Pontos de Determinação
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-6xl font-bold text-neon-orange">
              {character.determination_points || 0}
            </div>
            <p className="text-muted-foreground">
              Pontos disponíveis para ações heroicas e reviravoltas dramáticas.
            </p>
          </div>
        </Card>

        {/* Appearance */}
        {character.appearance && (
          <Card className="cyber-card p-6">
            <h2 className="text-2xl font-bold text-neon-purple mb-4 flex items-center">
              <Users className="mr-2" />
              Aparência
            </h2>
            <p className="text-foreground leading-relaxed">{character.appearance}</p>
          </Card>
        )}

        {/* Backstory */}
        {character.backstory && (
          <Card className="cyber-card p-6">
            <h2 className="text-2xl font-bold text-neon-lime mb-4 flex items-center">
              <BookOpen className="mr-2" />
              História de Fundo
            </h2>
            <p className="text-foreground leading-relaxed">{character.backstory}</p>
          </Card>
        )}

        {/* Motivation */}
        {character.motivation && (
          <Card className="cyber-card p-6">
            <h2 className="text-2xl font-bold text-neon-yellow mb-4 flex items-center">
              <Target className="mr-2" />
              Motivação
            </h2>
            <p className="text-foreground leading-relaxed">{character.motivation}</p>
          </Card>
        )}

        {/* Origin Story */}
        {character.origin_story && (
          <Card className="cyber-card p-6 lg:col-span-2">
            <h2 className="text-2xl font-bold text-neon-cyan mb-4 flex items-center">
              <Zap className="mr-2" />
              Origem dos Poderes
            </h2>
            <p className="text-foreground leading-relaxed">{character.origin_story}</p>
          </Card>
        )}
      </div>

      {/* Edit Modal */}
      <EditCharacterModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        characterId={id!}
        onSuccess={fetchCharacter}
      />

      {/* Dice Roller Modal */}
      {attributes && (
        <DiceRoller
          isOpen={isDiceRollerOpen}
          onClose={() => setIsDiceRollerOpen(false)}
          characterName={character.name}
          characterId={id!}
          attributes={{
            coordination: attributes.coordination,
            vigor: attributes.vigor,
            intellect: attributes.intellect,
            attention: attributes.attention,
            willpower: attributes.willpower,
            prowess: attributes.prowess,
          }}
          powers={powers}
          specialties={specialties}
          currentDetermination={character.determination_points || 0}
        />
      )}
    </div>
  );
}
