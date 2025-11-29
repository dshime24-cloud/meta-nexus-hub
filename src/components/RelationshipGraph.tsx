import { useEffect, useRef, useMemo } from "react";
import { Card } from "@/components/ui/card";

interface RelationshipGraphProps {
  relationships: any[];
  characters: any[];
}

const relationshipColors: Record<string, string> = {
  aliado: "#39ff14",
  rival: "#ff8c00",
  mentor: "#0080ff",
  inimigo: "#ff0044",
  amigo: "#00ffff",
  familia: "#ff00ff",
};

export function RelationshipGraph({ relationships, characters }: RelationshipGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { nodes, edges } = useMemo(() => {
    const nodeMap = new Map<string, any>();
    const edgeList: any[] = [];

    // Create nodes from characters that have relationships
    relationships.forEach((rel) => {
      if (rel.character_id && !nodeMap.has(rel.character_id)) {
        const char = characters.find((c) => c.id === rel.character_id);
        if (char) {
          nodeMap.set(rel.character_id, {
            id: rel.character_id,
            name: char.name,
            image: char.image_url,
            type: char.type,
          });
        }
      }
      if (rel.related_character_id && !nodeMap.has(rel.related_character_id)) {
        const char = characters.find((c) => c.id === rel.related_character_id);
        if (char) {
          nodeMap.set(rel.related_character_id, {
            id: rel.related_character_id,
            name: char.name,
            image: char.image_url,
            type: char.type,
          });
        }
      }

      // Create edge
      if (rel.character_id && rel.related_character_id) {
        edgeList.push({
          from: rel.character_id,
          to: rel.related_character_id,
          type: rel.relationship_type.toLowerCase(),
          bonus: rel.bonus,
        });
      }
    });

    return { nodes: Array.from(nodeMap.values()), edges: edgeList };
  }, [relationships, characters]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    // Clear canvas
    ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
    ctx.fillRect(0, 0, width, height);

    // Position nodes in a circle
    const nodePositions = new Map<string, { x: number; y: number }>();
    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      nodePositions.set(node.id, { x, y });
    });

    // Draw edges
    edges.forEach((edge) => {
      const from = nodePositions.get(edge.from);
      const to = nodePositions.get(edge.to);
      if (!from || !to) return;

      const color = relationshipColors[edge.type] || "#00ffff";

      // Draw line
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Draw glow
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.2;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Draw midpoint label
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      ctx.fillStyle = color;
      ctx.font = "10px Rajdhani";
      ctx.textAlign = "center";
      ctx.fillText(edge.type.toUpperCase(), midX, midY - 5);
    });

    // Draw nodes
    nodes.forEach((node) => {
      const pos = nodePositions.get(node.id);
      if (!pos) return;

      const nodeRadius = 30;

      // Draw outer glow
      const gradient = ctx.createRadialGradient(pos.x, pos.y, nodeRadius * 0.8, pos.x, pos.y, nodeRadius * 1.5);
      const nodeColor = node.type === "hero" ? "#39ff14" : node.type === "villain" ? "#ff0044" : "#00ffff";
      gradient.addColorStop(0, nodeColor + "40");
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeRadius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Draw node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fill();
      ctx.strokeStyle = nodeColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw name
      ctx.fillStyle = nodeColor;
      ctx.font = "bold 11px Rajdhani";
      ctx.textAlign = "center";
      ctx.fillText(node.name.substring(0, 10), pos.x, pos.y + nodeRadius + 15);

      // Draw initial
      ctx.fillStyle = nodeColor;
      ctx.font = "bold 20px Orbitron";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.name.charAt(0).toUpperCase(), pos.x, pos.y);
    });
  }, [nodes, edges]);

  if (nodes.length === 0) {
    return (
      <Card className="cyber-card p-12 text-center">
        <p className="text-muted-foreground">Nenhum relacionamento entre personagens para visualizar</p>
      </Card>
    );
  }

  return (
    <Card className="cyber-card p-4">
      <div className="mb-4 flex flex-wrap gap-3">
        {Object.entries(relationshipColors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
            <span className="text-xs text-muted-foreground capitalize">{type}</span>
          </div>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full h-auto border border-neon-cyan/30 rounded"
        style={{ maxHeight: "600px" }}
      />
    </Card>
  );
}