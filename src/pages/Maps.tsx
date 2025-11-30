import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Plus, Navigation, Globe, Trash2, Edit } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Tables } from "@/integrations/supabase/types";

type Location = Tables<"locations">;

// Fix for default marker icons in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom neon marker icon
const createNeonIcon = (color: string = "#00ffff") => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: ${color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 0 10px ${color}, 0 0 20px ${color};
        border: 2px solid white;
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};

const neonIcon = createNeonIcon("#00ffff");

interface LocationFormData {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  image_url: string;
}

function AddLocationMarker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyToLocation({ location }: { location: Location | null }) {
  const map = useMap();
  
  if (location) {
    map.flyTo([Number(location.latitude), Number(location.longitude)], 8, {
      duration: 1.5,
    });
  }
  
  return null;
}

export default function Maps() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState<LocationFormData>({
    name: "",
    description: "",
    latitude: 0,
    longitude: 0,
    image_url: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Location[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: LocationFormData) => {
      const { error } = await supabase.from("locations").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      setIsAddModalOpen(false);
      setIsAddingMode(false);
      resetForm();
      toast({ title: "Localização criada com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar localização", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LocationFormData> }) => {
      const { error } = await supabase.from("locations").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      setEditingLocation(null);
      resetForm();
      toast({ title: "Localização atualizada!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("locations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast({ title: "Localização removida!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", latitude: 0, longitude: 0, image_url: "" });
  };

  const handleLocationClick = (lat: number, lng: number) => {
    if (isAddingMode) {
      setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
      setIsAddModalOpen(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLocation) {
      updateMutation.mutate({ id: editingLocation.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      description: location.description || "",
      latitude: Number(location.latitude),
      longitude: Number(location.longitude),
      image_url: location.image_url || "",
    });
    setIsAddModalOpen(true);
  };

  const navigateToLocation = (location: Location) => {
    setSelectedLocation(location);
  };

  return (
    <div className="min-h-screen bg-black pt-20 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary glow-text-cyan font-['Orbitron']">
              MAPA GLOBAL
            </h1>
            <p className="text-muted-foreground mt-1">
              Explore e gerencie localizações importantes
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={isAddingMode ? "default" : "outline"}
              onClick={() => setIsAddingMode(!isAddingMode)}
              className={isAddingMode ? "bg-neon-lime text-black hover:bg-neon-lime/80" : "border-primary text-primary hover:bg-primary/10"}
            >
              <MapPin className="h-4 w-4 mr-2" />
              {isAddingMode ? "Clique no mapa" : "Adicionar Local"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Locations List */}
          <Card className="cyber-card lg:col-span-1 max-h-[600px] overflow-y-auto scrollbar-hide">
            <CardHeader className="pb-4 sticky top-0 bg-black z-10">
              <CardTitle className="text-primary flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Localizações ({locations.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                <p className="text-muted-foreground text-center py-4">Carregando...</p>
              ) : locations.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Nenhuma localização cadastrada</p>
              ) : (
                locations.map((location) => (
                  <div
                    key={location.id}
                    className="p-3 border border-primary/30 rounded hover:border-primary/60 transition-colors group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-primary truncate">{location.name}</h4>
                        {location.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {location.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => navigateToLocation(location)}
                        >
                          <Navigation className="h-3 w-3 text-neon-cyan" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleEdit(location)}
                        >
                          <Edit className="h-3 w-3 text-neon-lime" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteMutation.mutate(location.id)}
                        >
                          <Trash2 className="h-3 w-3 text-neon-red" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Map */}
          <Card className="cyber-card lg:col-span-3 overflow-hidden">
            <div className="h-[600px] relative">
              {isAddingMode && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-neon-lime/90 text-black px-4 py-2 rounded font-bold">
                  Clique no mapa para adicionar uma localização
                </div>
              )}
              <MapContainer
                center={[-15.7801, -47.9292]}
                zoom={4}
                className="h-full w-full"
                style={{ background: "#000" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                
                {isAddingMode && <AddLocationMarker onLocationSelect={handleLocationClick} />}
                
                <FlyToLocation location={selectedLocation} />
                
                {locations.map((location) => (
                  <Marker
                    key={location.id}
                    position={[Number(location.latitude), Number(location.longitude)]}
                    icon={neonIcon}
                  >
                    <Popup className="cyber-popup">
                      <div className="min-w-[200px] p-2">
                        {location.image_url && (
                          <img
                            src={location.image_url}
                            alt={location.name}
                            className="w-full h-32 object-cover rounded mb-2"
                          />
                        )}
                        <h3 className="font-bold text-lg mb-1">{location.name}</h3>
                        {location.description && (
                          <p className="text-sm text-gray-600">{location.description}</p>
                        )}
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(location)}
                            className="flex-1"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteMutation.mutate(location.id)}
                            className="flex-1"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remover
                          </Button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </Card>
        </div>

        {/* Add/Edit Location Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={(open) => {
          setIsAddModalOpen(open);
          if (!open) {
            setEditingLocation(null);
            resetForm();
            setIsAddingMode(false);
          }
        }}>
          <DialogContent className="bg-black border-primary">
            <DialogHeader>
              <DialogTitle className="text-primary font-['Orbitron']">
                {editingLocation ? "Editar Localização" : "Nova Localização"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-primary">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="bg-muted border-primary/30"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-primary">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-muted border-primary/30"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude" className="text-primary">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                    required
                    className="bg-muted border-primary/30"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude" className="text-primary">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                    required
                    className="bg-muted border-primary/30"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="image_url" className="text-primary">URL da Imagem</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="https://..."
                  className="bg-muted border-primary/30"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingLocation(null);
                    resetForm();
                  }}
                  className="flex-1 border-primary text-primary hover:bg-primary/10"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/80"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {editingLocation ? "Salvar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
