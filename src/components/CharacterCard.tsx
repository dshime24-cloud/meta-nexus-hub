import { useNavigate } from "react-router-dom";
import { Shield, Skull, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";
import { useState } from "react";
import { EditCharacterModal } from "./EditCharacterModal";

interface CharacterCardProps {
  id: string;
  name: string;
  alias?: string;
  classification: string;
  threatLevel?: number;
  type: string;
  imageUrl?: string;
  attributes: {
    coordination?: number;
    vigor?: number;
    intellect?: number;
    attention?: number;
    willpower?: number;
    prowess?: number;
  };
}

export const CharacterCard = ({
  id,
  name,
  alias,
  classification,
  threatLevel,
  type,
  imageUrl,
  attributes,
}: CharacterCardProps) => {
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [, forceUpdate] = useState({});

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditModalOpen(true);
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
      className="cyber-card p-4 rounded-sm cursor-pointer hover:scale-[1.02] transition-all relative group"
      style={{
        border: `1px solid hsl(var(--${classColor}))`,
        boxShadow: `0 0 10px hsla(var(--${classColor}) / 0.3)`,
      }}
    >
      {/* Top Icons */}
      <div className="absolute top-2 left-2 flex gap-2">
        <button 
          className="w-6 h-6 rounded-full border border-neon-cyan flex items-center justify-center hover:bg-neon-cyan/20 transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-2 h-2 rounded-full bg-neon-cyan"></div>
        </button>
      </div>

      <div className="absolute top-2 right-2 flex gap-2">
        <button 
          className="w-6 h-6 rounded-full border border-neon-cyan flex items-center justify-center hover:bg-neon-cyan/20 transition-all opacity-0 group-hover:opacity-100"
          onClick={handleEdit}
          title="Editar ficha"
        >
          <Edit className="w-3 h-3 text-neon-cyan" />
        </button>
      </div>

      {/* Character Initial/Image */}
      <div className="flex justify-center mb-3 mt-2">
        <div
          className="w-16 h-16 rounded-sm flex items-center justify-center text-white font-bold text-3xl relative"
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
        <h3 className="text-base font-bold text-neon-cyan tracking-wide" style={{ fontFamily: 'Orbitron, sans-serif' }}>
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
