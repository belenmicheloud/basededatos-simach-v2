import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { JobApplication, STATUS_LABELS, POSITIONS } from "@/lib/types";
import { Search, ArrowLeft, FileDown, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminOpenings from "@/components/AdminOpenings";
import AdminOpeningApplications from "@/components/AdminOpeningApplications";
import ApplicationCard from "@/components/ApplicationCard";

export default function Admin() {
  const { toast } = useToast();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPosition, setFilterPosition] = useState<string>("all");
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const fetchApplications = async () => {
    const { data, error } = await supabase
      .from("job_applications")
      .select("*")
      .is("opening_id", null)
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setApplications((data as JobApplication[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchApplications(); }, []);

  const updateApp = (id: string, patch: Partial<JobApplication>) => {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
  };

  const cities = useMemo(() => [...new Set(applications.map(a => a.city))].sort(), [applications]);

  const filtered = useMemo(() => {
    return applications.filter(a => {
      if (search && !a.full_name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus !== "all" && a.status !== filterStatus) return false;
      if (filterPosition !== "all" && a.position !== filterPosition) return false;
      if (filterCity !== "all" && a.city !== filterCity) return false;
      if (filterDateFrom && a.created_at < filterDateFrom) return false;
      if (filterDateTo && a.created_at > filterDateTo + "T23:59:59") return false;
      return true;
    });
  }, [applications, search, filterStatus, filterPosition, filterCity, filterDateFrom, filterDateTo]);

  const exportCSV = () => {
    const headers = ["Nombre", "Email", "Teléfono", "Ciudad", "Puesto", "Área", "Años de experiencia", "Estado", "Fecha", "Etiquetas", "Fecha contratación", "Comentarios"];
    const rows = filtered.map(a => [
      a.full_name, a.email, a.phone, a.city, a.position, a.area, a.years_experience || "",
      STATUS_LABELS[a.status], new Date(a.created_at).toLocaleDateString("es-AR"),
      (a.tags || []).join("; "),
      a.hired_at ? new Date(a.hired_at).toLocaleDateString("es-AR") : "",
      (a.comments || "").replace(/"/g, '""'),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `postulaciones_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Panel de Postulaciones</h1>
          </div>
          <Button variant="secondary" size="sm" onClick={exportCSV}>
            <FileDown className="h-4 w-4" /> Exportar CSV
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList>
            <TabsTrigger value="applications">Postulaciones generales</TabsTrigger>
            <TabsTrigger value="by-opening">Postulaciones por búsqueda</TabsTrigger>
            <TabsTrigger value="openings">Búsquedas activas</TabsTrigger>
          </TabsList>
          <TabsContent value="applications" className="space-y-6">
        {/* Filters */}
        <div className="bg-card rounded-xl border p-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nombre..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPosition} onValueChange={setFilterPosition}>
            <SelectTrigger><SelectValue placeholder="Puesto" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los puestos</SelectItem>
              {POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCity} onValueChange={setFilterCity}>
            <SelectTrigger><SelectValue placeholder="Ciudad" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las ciudades</SelectItem>
              {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex gap-2 items-center">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="text-sm" />
            <span className="text-muted-foreground text-sm">a</span>
            <Input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="text-sm" />
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-2 flex-wrap text-sm">
          <span className="text-muted-foreground">{filtered.length} postulaciones</span>
          {filterStatus === "all" && Object.entries(STATUS_LABELS).map(([k, v]) => {
            const count = applications.filter(a => a.status === k).length;
            return count > 0 ? (
              <Badge key={k} variant="outline" className="text-xs">{v}: {count}</Badge>
            ) : null;
          })}
        </div>

        {/* Cards */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No hay postulaciones que mostrar.</div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(app => (
              <ApplicationCard key={app.id} app={app} onUpdate={updateApp} />
            ))}
          </div>
        )}
          </TabsContent>
          <TabsContent value="by-opening">
            <AdminOpeningApplications />
          </TabsContent>
          <TabsContent value="openings">
            <AdminOpenings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
