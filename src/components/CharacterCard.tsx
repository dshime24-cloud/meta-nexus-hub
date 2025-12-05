import { useNavigate } from "react-router-dom";
import { Shield, Skull, Edit, User, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";
import { useState } from "react";
import { EditCharacterModal } from "./EditCharacterModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CharacterCardProps {
  id: string;
  name: string;
  alias?: string;
  classification: string;
  threatLevel?: number;
  type: string;
  imageUrl?: string;
  ownerId?: string | null;
  attributes: {
    coordination?: number;
    vigor?: number;
    intellect?: number;
    attention?: number;
    willpower?: number;
    prowess?: number;
  };
  onOwnershipChange?: () => void;
}

export const CharacterCard = ({
  id,
  name,
  alias,
  classification,
  threatLevel,
  type,
  imageUrl,
  ownerId,
  attributes,
  onOwnershipChange,
}: CharacterCardProps) => {
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [, forceUpdate] = useState({});
  const { user } = useAuth();
  const { toast } = useToast();

  const isOwner = user && ownerId === user.id;
  const isOwnedByOther = ownerId && user && ownerId !== user.id;
  const canEdit = !ownerId || isOwner;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEdit) {
      toast({
        title: "Acesso bloqueado",
        description: "Esta ficha pertence a outro usuário.",
        variant: "destructive",
      });
      return;
    }
    setIsEditModalOpen(true);
  };

  const handleClaimCharacter = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para marcar esta ficha como sua.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("characters")
        .update({ owner_id: user.id })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Ficha marcada como sua!",
        description: "Agora apenas você pode editar esta ficha.",
      });
      onOwnershipChange?.();
    } catch (error: any) {
      toast({
        title: "Erro ao marcar ficha",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const radarData = [
    { attribute: "Coord", value: attributes.coordination || 1 },
    { attribute: "Vigor", value: attributes.vigor || 1 },
    { attribute: "Intel", value: attributes.intellect || 1 },
    { attribute: "Atençã", value: attributes.attention || 1 },
    { attribute: "Vontad", value: attributes.willpower || 1 },
    { attribute: "Proeza", value: attributes.prowess || 1 },
  ];

  const getClassificationColor = () => {
    switch (classification) {
      case 'S': return 'neon-magenta';
      case 'A': return type === 'hero' ? 'neon-blue' : 'neon-red';
      case 'B': return 'neon-cyan';
      case 'C': return 'neon-lime';
      case 'D': return 'neon-yellow';
      case 'F': return 'neon-red';
      default: return 'neon-cyan';
    }
  };

  const classColor = getClassificationColor();

  return (
    <div
      onClick={() => navigate(`/character/${id}`)}
      className={`cyber-card p-4 rounded-sm cursor-pointer hover:scale-[1.02] transition-all relative group ${
        isOwner ? 'ring-2 ring-neon-lime ring-offset-2 ring-offset-background' : ''
      }`}
      style={{
        border: `1px solid hsl(var(--${classColor}))`,
        boxShadow: isOwner 
          ? `0 0 20px hsla(var(--neon-lime) / 0.5), 0 0 10px hsla(var(--${classColor}) / 0.3)` 
          : `0 0 10px hsla(var(--${classColor}) / 0.3)`,
      }}
    >
      {/* Ownership Badge */}
      {isOwner && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge className="bg-neon-lime text-background text-xs font-bold px-2 py-1 animate-pulse">
            <User className="w-3 h-3 mr-1" />
            SUA FICHA
          </Badge>
        </div>
      )}

      {/* Locked Badge */}
      {isOwnedByOther && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge className="bg-neon-red/80 text-white text-xs font-bold px-2 py-1">
            <Lock className="w-3 h-3 mr-1" />
            BLOQUEADA
          </Badge>
        </div>
      )}

      {/* Top Icons */}
      <div className="absolute top-2 left-2 flex gap-2">
        {!ownerId && user && (
          <button 
            className="w-6 h-6 rounded-full border border-neon-lime flex items-center justify-center hover:bg-neon-lime/20 transition-all"
            onClick={handleClaimCharacter}
            title="Marcar como minha ficha"
          >
            <User className="w-3 h-3 text-neon-lime" />
          </button>
        )}
      </div>

      <div className="absolute top-2 right-2 flex gap-2">
        {canEdit && (
          <button 
            className="w-6 h-6 rounded-full border border-neon-cyan flex items-center justify-center hover:bg-neon-cyan/20 transition-all opacity-0 group-hover:opacity-100"
            onClick={handleEdit}
            title="Editar ficha"
          >
            <Edit className="w-3 h-3 text-neon-cyan" />
          </button>
        )}
      </div>

      {/* Character Initial/Image */}
      <div className="flex justify-center mb-3 mt-2">
        <div
          className={`w-16 h-16 rounded-sm flex items-center justify-center text-white font-bold text-3xl relative ${
            isOwner ? 'ring-2 ring-neon-lime' : ''
          }`}
          style={{
            background: `linear-gradient(135deg, hsl(var(--${classColor})) 0%, hsl(var(--${classColor})) 100%)`,
            boxShadow: `0 0 20px hsla(var(--${classColor}) / 0.5)`,
            fontFamily: 'Orbitron, sans-serif'
          }}
        >
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="w-full h-full object-cover rounded-sm" />
          ) : (
            name.charAt(0).toUpperCase()
          )}
        </div>
      </div>

      {/* Name */}
      <div className="text-center mb-2">
        <h3 className={`text-base font-bold tracking-wide ${isOwner ? 'text-neon-lime' : 'text-neon-cyan'}`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
          {name.toUpperCase()}
        </h3>
        {alias && (
          <p className="text-xs text-neon-cyan/60 mt-0.5" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            ({alias})
          </p>
        )}
      </div>

      {/* Badges */}
      <div className="flex justify-center gap-2 mb-3">
        <Badge
          className="px-2 py-0.5 text-xs font-bold rounded-sm"
          style={{
            background: `hsl(var(--${classColor}))`,
            color: '#000',
            fontFamily: 'Orbitron, sans-serif',
            boxShadow: `0 0 10px hsla(var(--${classColor}) / 0.6)`,
          }}
        >
          {classification}
        </Badge>
        <Badge
          className="px-2 py-0.5 text-xs font-semibold rounded-sm border"
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            borderColor: `hsl(var(--neon-orange))`,
            color: `hsl(var(--neon-orange))`,
            fontFamily: 'Rajdhani, sans-serif',
          }}
        >
          AMEAÇA: {threatLevel || 0}
        </Badge>
      </div>

      {/* Radar Chart */}
      <div className="mb-3">
        <ResponsiveContainer width="100%" height={140}>
          <RadarChart data={radarData}>
            <PolarGrid stroke={`hsl(var(--neon-cyan))`} strokeOpacity={0.2} />
            <PolarAngleAxis
              dataKey="attribute"
              tick={{ fill: 'hsl(var(--neon-cyan))', fontSize: 9, fontFamily: 'Rajdhani, sans-serif' }}
            />
            <PolarRadiusAxis angle={90} domain={[0, 15]} tick={false} />
            <Radar
              name="Atributos"
              dataKey="value"
              stroke={`hsl(var(--${classColor}))`}
              fill={`hsl(var(--${classColor}))`}
              fillOpacity={0.4}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-xs pt-2 border-t border-neon-cyan/30">
        <div className="flex gap-2">
          {type === "hero" && (
            <div className="flex items-center gap-1 text-neon-lime">
              <Shield className="w-3 h-3" />
              <span style={{ fontFamily: 'Rajdhani, sans-serif' }}>HERÓI</span>
            </div>
          )}
          {type === "villain" && (
            <div className="flex items-center gap-1 text-neon-red">
              <Skull className="w-3 h-3" />
              <span style={{ fontFamily: 'Rajdhani, sans-serif' }}>VILÃO</span>
            </div>
          )}
        </div>
        <button
          className="text-neon-cyan hover:text-neon-lime transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/character/${id}`);
          }}
          style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}
        >
          ABRIR
        </button>
      </div>

      <EditCharacterModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        characterId={id}
        onSuccess={() => forceUpdate({})}
      />
    </div>
  );
};