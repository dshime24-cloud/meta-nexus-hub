import { useState, useEffect } from "react";
import { Plus, Search, Filter, Target, Clock, CheckCircle, XCircle, PauseCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MissionModal } from "@/components/MissionModal";
import { MissionCard } from "@/components/MissionCard";

export default function Missions() {
  const { toast } = useToast();
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<any>(null);

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    try {
      const { data: missionsData, error } = await supabase
        .from("missions")
        .select(`
          *,
          mission_participants (
            id,
            character_id,
            role,
            characters (
              id,
              name,
              alias,
              image_url
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMissions(missionsData || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar missões",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMissions = missions.filter((mission) => {
    const matchesSearch = mission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mission.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || mission.status === statusFilter;
    const matchesDifficulty = difficultyFilter === "all" || mission.difficulty === difficultyFilter;
    
    return matchesSearch && matchesStatus && matchesDifficulty;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ativa": return <Clock className="w-4 h-4" />;
      case "concluída": return <CheckCircle className="w-4 h-4" />;
      case "falhada": return <XCircle className="w-4 h-4" />;
      case "pausada": return <PauseCircle className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getStatusCount = (status: string) => {
    return missions.filter(m => m.status === status).length;
  };

  const handleEditMission = (mission: any) => {
    setSelectedMission(mission);
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setSelectedMission(null);
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
              <Target className="mr-3 w-10 h-10" />
              Sistema de Missões
            </h1>
            <p className="text-muted-foreground">
              Gerencie operações, atribua personagens e acompanhe progresso
            </p>
          </div>
          
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-neon-cyan text-background hover:bg-neon-cyan/90 font-bold glow-cyan"
          >
            <Plus className="mr-2 w-5 h-5" />
            Nova Missão
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="cyber-card p-4 bg-neon-cyan/10 border-neon-cyan/30">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-neon-cyan" />
              <span className="text-sm text-muted-foreground">Ativas</span>
            </div>
            <p className="text-3xl font-bold text-neon-cyan">{getStatusCount("ativa")}</p>
          </div>

          <div className="cyber-card p-4 bg-neon-green/10 border-neon-green/30">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-neon-green" />
              <span className="text-sm text-muted-foreground">Concluídas</span>
            </div>
            <p className="text-3xl font-bold text-neon-green">{getStatusCount("concluída")}</p>
          </div>

          <div className="cyber-card p-4 bg-neon-red/10 border-neon-red/30">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-neon-red" />
              <span className="text-sm text-muted-foreground">Falhadas</span>
            </div>
            <p className="text-3xl font-bold text-neon-red">{getStatusCount("falhada")}</p>
          </div>

          <div className="cyber-card p-4 bg-neon-yellow/10 border-neon-yellow/30">
            <div className="flex items-center gap-2 mb-2">
              <PauseCircle className="w-5 h-5 text-neon-yellow" />
              <span className="text-sm text-muted-foreground">Pausadas</span>
            </div>
            <p className="text-3xl font-bold text-neon-yellow">{getStatusCount("pausada")}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neon-cyan w-5 h-5" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar missões..."
            className="pl-10 cyber-input"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="cyber-input w-full md:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-background border-neon-cyan">
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="ativa">Ativa</SelectItem>
            <SelectItem value="concluída">Concluída</SelectItem>
            <SelectItem value="falhada">Falhada</SelectItem>
            <SelectItem value="pausada">Pausada</SelectItem>
          </SelectContent>
        </Select>

        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="cyber-input w-full md:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Dificuldade" />
          </SelectTrigger>
          <SelectContent className="bg-background border-neon-cyan">
            <SelectItem value="all">Todas dificuldades</SelectItem>
            <SelectItem value="Fácil">Fácil</SelectItem>
            <SelectItem value="Média">Média</SelectItem>
            <SelectItem value="Difícil">Difícil</SelectItem>
            <SelectItem value="Extrema">Extrema</SelectItem>
            <SelectItem value="Lendária">Lendária</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Missions Grid */}
      {filteredMissions.length === 0 ? (
        <div className="text-center py-12 cyber-card">
          <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-xl text-muted-foreground">
            {searchTerm || statusFilter !== "all" || difficultyFilter !== "all" 
              ? "Nenhuma missão encontrada com os filtros aplicados" 
              : "Nenhuma missão cadastrada ainda"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMissions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              onEdit={handleEditMission}
              onUpdate={fetchMissions}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <MissionModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        mission={selectedMission}
        onSuccess={fetchMissions}
      />
    </div>
  );
}