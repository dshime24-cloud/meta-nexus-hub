import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Swords } from "lucide-react";
import { CombatModal } from "./CombatModal";

interface CombatButtonProps {
  characterId: string;
}

export function CombatButton({ characterId }: CombatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="border-neon-orange text-neon-orange hover:bg-neon-orange/10"
      >
        <Swords className="w-4 h-4 mr-2" />
        Combate
      </Button>
      <CombatModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        attackerId={characterId}
      />
    </>
  );
}
