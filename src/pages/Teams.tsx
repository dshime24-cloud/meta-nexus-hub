import { Navigation } from "@/components/Navigation";
import { TeamManager } from "@/components/TeamManager";

const Teams = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-slide-up">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text font-space mb-2">
            Equipes & Formações
          </h1>
          <p className="text-muted-foreground text-lg">
            Organize seus heróis em equipes para missões cooperativas
          </p>
        </div>
        <TeamManager />
      </main>
    </div>
  );
};

export default Teams;