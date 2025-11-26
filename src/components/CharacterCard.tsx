import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Skull, Minus } from "lucide-react";
import { Link } from "react-router-dom";

interface CharacterCardProps {
  id: string;
  name: string;
  alias?: string;
  classification: string;
  threatLevel: number;
  type: "hero" | "villain" | "neutral";
  imageUrl?: string;
  attributes: {
    coordination: number;
    vigor: number;
    intellect: number;
    attention: number;
    willpower: number;
    prowess: number;
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
  const getTypeIcon = () => {
    if (type === "hero") return <Shield className="w-4 h-4" />;
    if (type === "villain") return <Skull className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTypeColor = () => {
    if (type === "hero") return "neon-green";
    if (type === "villain") return "neon-red";
    return "neon-cyan";
  };

  const getClassificationColor = () => {
    if (["SS", "S", "A"].includes(classification)) return "neon-green";
    if (["B", "C", "D"].includes(classification)) return "neon-cyan";
    return "neon-red";
  };

  return (
    <Link to={`/character/${id}`}>
      <Card className="cyber-card overflow-hidden cursor-pointer group">
        <div className="aspect-square bg-gradient-to-br from-neon-cyan/10 to-neon-magenta/10 relative">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className={`text-6xl font-bold text-${getTypeColor()} opacity-20`}>
                {name.charAt(0)}
              </div>
            </div>
          )}
          
          <div className="absolute top-2 right-2 flex gap-2">
            <Badge className={`bg-${getTypeColor()}/20 text-${getTypeColor()} border-${getTypeColor()} glow-border-${getTypeColor().split('-')[1]}`}>
              {getTypeIcon()}
            </Badge>
            <Badge className={`bg-${getClassificationColor()}/20 text-${getClassificationColor()} border-${getClassificationColor()} font-bold text-lg`}>
              {classification}
            </Badge>
          </div>
          
          <div className="absolute bottom-2 left-2">
            <Badge variant="outline" className="bg-black/60 text-neon-cyan border-neon-cyan">
              Ameaça: {threatLevel}
            </Badge>
          </div>
        </div>
        
        <div className="p-4 space-y-2">
          <h3 className="font-bold text-lg text-neon-cyan truncate group-hover:glow-text-cyan transition-all">
            {name}
          </h3>
          {alias && (
            <p className="text-sm text-muted-foreground truncate">"{alias}"</p>
          )}
          
          <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-neon-cyan/30">
            <div className="text-center">
              <div className="text-muted-foreground">CRD</div>
              <div className="text-neon-green font-bold">{attributes.coordination}</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">VIG</div>
              <div className="text-neon-green font-bold">{attributes.vigor}</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">INT</div>
              <div className="text-neon-green font-bold">{attributes.intellect}</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">ATE</div>
              <div className="text-neon-cyan font-bold">{attributes.attention}</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">VON</div>
              <div className="text-neon-cyan font-bold">{attributes.willpower}</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">PRO</div>
              <div className="text-neon-cyan font-bold">{attributes.prowess}</div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};
