import { TeamManager } from "@/components/TeamManager";

const Teams = () => {
  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <h1 className="text-4xl md:text-5xl font-bold gradient-text font-space mb-2">
          Equipes & Formações
        </h1>
        <p className="text-muted-foreground text-lg">
          Organize seus heróis em equipes para missões cooperativas
        </p>
      </div>
      <TeamManager />
    </div>
  );
};

export default Teams;