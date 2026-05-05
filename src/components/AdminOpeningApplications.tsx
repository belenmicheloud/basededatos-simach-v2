import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { JobApplication, ApplicationStatus, STATUS_LABELS, STATUS_COLORS, YEARS_EXPERIENCE } from "@/lib/types";
import {
  Download, Briefcase, MapPin, Building2, ChevronDown, ChevronUp,
  Mail, Phone, Clock, Calendar, Tag, X, CalendarCheck, User, Trash2,
  IdCard, Search, UserMinus,
} from "lucide-react";

type Opening = {
  id: string;
  position: string;
  area: string;
  branch: string;
  description: string;
  is_active: boolean;
};

type AppWithExtra = JobApplication & {
  cuil?: string;
  answers?: Record<string, string> | null;
};

export default function AdminOpeningApplications() {
  const { toast } = useToast();
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [applications, setApplications] = useState<AppWithExtra[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOpenings, setExpandedOpenings] = useState<Record<string, boolean>>({});
  const [expandedApps, setExpandedApps] = useState<Record<string, boolean>>({});
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterExperience, setFilterExperience] = useState("all");
  const [filterAnswers, setFilterAnswers] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const fetchAll = async () => {
    const [openRes, appsRes] = await Promise.all([
      supabase.from("job_openings").select("*").order("created_at", { ascending: false }),
      supabase.from("job_applications").select("*").not("opening_id", "is", null).order("created_at", { ascending: false }),
    ]);

    if (openRes.error) toast({ title: "Error", description: openRes.error.message, variant: "destructive" });
    if (appsRes.error) toast({ title: "Error", description: appsRes.error.message, variant: "destructive" });

    setOpenings((openRes.data as Opening[]) || []);
    setApplications((appsRes.data as AppWithExtra[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const filteredApplications = useMemo(() => {
    const term = search.trim().toLowerCase();
    const answerTerm = filterAnswers.trim().toLowerCase();

    return applications.filter(app => {
      const cuil = app.cuil || "";
      const answers = app.answers || {};

      const matchesSearch = !term || [
        app.full_name,
        app.email,
        app.phone,
        cuil,
        app.city,
      ].some(v => (v || "").toLowerCase().includes(term));

      const matchesStatus = filterStatus === "all" || app.status === filterStatus;
      const matchesExperience = filterExperience === "all" || app.years_experience === filterExperience;

      const answersText = Object.entries(answers)
        .map(([q, a]) => `${q} ${a}`)
        .join(" ")
        .toLowerCase();

      const matchesAnswers = !answerTerm || answersText.includes(answerTerm);

      const createdDate = app.created_at.slice(0, 10);
      const matchesDateFrom = !filterDateFrom || createdDate >= filterDateFrom;
      const matchesDateTo = !filterDateTo || createdDate <= filterDateTo;

      return matchesSearch && matchesStatus && matchesExperience && matchesAnswers && matchesDateFrom && matchesDateTo;
    });
  }, [applications, search, filterStatus, filterExperience, filterAnswers, filterDateFrom, filterDateTo]);

  const persist = async (id: string, patch: Partial<JobApplication>) => {
    const { error } = await supabase.from("job_applications").update(patch).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }
    setApplications(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
    return true;
  };

  const handleStatusChange = async (id: string, status: ApplicationStatus) => {
    const app = applications.find(a => a.id === id);
    const patch: Partial<JobApplication> = { status };
    if (status === "contratado" && !app?.hired_at) patch.hired_at = new Date().toISOString().slice(0, 10);
    if (status !== "contratado") patch.hired_at = null;

    const ok = await persist(id, patch);
    if (ok) toast({ title: "Estado actualizado" });
  };

  const handleHiredAtChange = async (id: string, value: string) => {
    await persist(id, { hired_at: value || null });
  };

  const handleCommentsBlur = async (id: string, value: string) => {
    const app = applications.find(a => a.id === id);
    if ((app?.comments || "") === value) return;
    const ok = await persist(id, { comments: value });
    if (ok) toast({ title: "Comentario guardado" });
  };

  const addTag = async (id: string) => {
    const t = (tagInputs[id] || "").trim();
    if (!t) return;
    const app = applications.find(a => a.id === id);
    const tags = app?.tags || [];
    if (tags.includes(t)) {
      setTagInputs(prev => ({ ...prev, [id]: "" }));
      return;
    }
    const ok = await persist(id, { tags: [...tags, t] });
    if (ok) setTagInputs(prev => ({ ...prev, [id]: "" }));
  };

  const removeTag = async (id: string, tag: string) => {
    const app = applications.find(a => a.id === id);
    await persist(id, { tags: (app?.tags || []).filter(t => t !== tag) });
  };

  const downloadCv = async (cvPath: string) => {
    const { data, error } = await supabase.storage.from("cvs").createSignedUrl(cvPath, 60);
    if (error || !data?.signedUrl) {
      toast({ title: "Error al descargar", description: error?.message, variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const deleteApplication = async (id: string, name: string) => {
    const confirmed = window.confirm(`¿Eliminar a ${name}? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    const { error } = await supabase.from("job_applications").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setApplications(prev => prev.filter(a => a.id !== id));
    toast({ title: "Candidato eliminado" });
  };

  const unassignApplication = async (app: AppWithExtra) => {
    const confirmed = window.confirm(
      `¿Desasignar a ${app.full_name} de esta búsqueda? El candidato seguirá en la base general.`
    );
    if (!confirmed) return;

    const cuil = app.cuil || "";

    try {
      if (!cuil) {
        const { error } = await supabase
          .from("job_applications")
          .update({ opening_id: null, answers: {} })
          .eq("id", app.id);

        if (error) throw error;

        setApplications(prev => prev.filter(a => a.id !== app.id));
        toast({ title: "Candidato desasignado" });
        return;
      }

      const { data: existingGeneral, error: lookupError } = await supabase
        .from("job_applications")
        .select("id")
        .eq("cuil", cuil)
        .is("opening_id", null)
        .limit(1);

      if (lookupError) throw lookupError;

      if (existingGeneral && existingGeneral.length > 0) {
        const { error: deleteError } = await supabase
          .from("job_applications")
          .delete()
          .eq("id", app.id);

        if (deleteError) throw deleteError;
      } else {
        const { error: updateError } = await supabase
          .from("job_applications")
          .update({ opening_id: null, answers: {} })
          .eq("id", app.id);

        if (updateError) throw updateError;
      }

      setApplications(prev => prev.filter(a => a.id !== app.id));
      toast({ title: "Candidato desasignado de la búsqueda" });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "No se pudo desasignar el candidato.",
        variant: "destructive",
      });
    }
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Cargando...</div>;

  if (openings.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">No hay búsquedas creadas todavía.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border p-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, CUIL, email o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterExperience} onValueChange={setFilterExperience}>
          <SelectTrigger><SelectValue placeholder="Experiencia" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toda experiencia</SelectItem>
            {YEARS_EXPERIENCE.map(y => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="lg:col-span-2 flex gap-2 items-center">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="text-sm" />
          <span className="text-muted-foreground text-sm">a</span>
          <Input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="text-sm" />
        </div>

        <div className="lg:col-span-2">
          <Input
            placeholder="Filtrar por texto en respuestas de preguntas..."
            value={filterAnswers}
            onChange={(e) => setFilterAnswers(e.target.value)}
          />
        </div>
      </div>

      {openings.map(o => {
        const apps = filteredApplications.filter(a => a.opening_id === o.id);
        const totalApps = applications.filter(a => a.opening_id === o.id).length;
        const isOpeningExpanded = expandedOpenings[o.id] ?? true;

        return (
          <div key={o.id} className="bg-card rounded-xl border overflow-hidden">
            <button
              onClick={() => setExpandedOpenings(prev => ({ ...prev, [o.id]: !isOpeningExpanded }))}
              className="w-full p-4 md:p-5 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
            >
              <div className="rounded-lg p-2 bg-primary/10 shrink-0">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground">{o.position}</h3>
                  <Badge className={o.is_active ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}>
                    {o.is_active ? "Activa" : "Inactiva"}
                  </Badge>
                  <Badge variant="outline">{apps.length} / {totalApps} postulaciones</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{o.area}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{o.branch}</span>
                </div>
              </div>
              {isOpeningExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
            </button>

            {isOpeningExpanded && (
              <div className="border-t divide-y">
                {apps.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">Sin postulaciones para esta búsqueda con los filtros actuales.</div>
                ) : (
                  apps.map(app => {
                    const isAppExpanded = expandedApps[app.id] ?? false;
                    const cuil = app.cuil || "—";
                    const answers = app.answers || {};

                    return (
                      <div key={app.id} className="bg-background transition-shadow hover:shadow-sm">
                        <div className="p-4 md:p-5">
                          <div className="flex flex-col md:flex-row md:items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                                  <User className="h-4 w-4" />
                                </span>
                                <h4 className="font-semibold text-foreground text-base">{app.full_name}</h4>
                                <Badge className={`${STATUS_COLORS[app.status]} text-xs`}>{STATUS_LABELS[app.status]}</Badge>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1"><IdCard className="h-3 w-3" />CUIL: {cuil}</span>
                                <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{app.email}</span>
                                <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{app.phone}</span>
                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{app.city}</span>
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{app.years_experience || "—"} años exp.</span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(app.created_at).toLocaleDateString("es-AR")}
                                </span>
                              </div>
                              {app.tags && app.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {app.tags.map(t => (
                                    <Badge key={t} variant="outline" className="text-xs gap-1">
                                      <Tag className="h-2.5 w-2.5" />{t}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0 flex-wrap">
                              <Button variant="outline" size="sm" onClick={() => downloadCv(app.cv_path)}>
                                <Download className="h-4 w-4 mr-1" /> CV
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => unassignApplication(app)}>
                                <UserMinus className="h-4 w-4 mr-1" /> Desasignar
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => deleteApplication(app.id, app.full_name)}>
                                <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setExpandedApps(prev => ({ ...prev, [app.id]: !isAppExpanded }))}>
                                {isAppExpanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                                {isAppExpanded ? "Cerrar" : "Ver detalle"}
                              </Button>
                            </div>
                          </div>
                        </div>

                        {isAppExpanded && (
                          <div className="border-t bg-muted/20 p-4 md:p-5 space-y-5">
                            <div>
                              <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                Datos del candidato
                              </h5>
                              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 text-sm">
                                <div className="flex items-center gap-2 text-foreground/80">
                                  <IdCard className="h-4 w-4 text-muted-foreground shrink-0" />
                                  <span>CUIL: {cuil}</span>
                                </div>
                                <div className="flex items-center gap-2 text-foreground/80">
                                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                                  <a href={`mailto:${app.email}`} className="hover:text-primary truncate">{app.email}</a>
                                </div>
                                <div className="flex items-center gap-2 text-foreground/80">
                                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                                  <a href={`tel:${app.phone}`} className="hover:text-primary">{app.phone}</a>
                                </div>
                                <div className="flex items-center gap-2 text-foreground/80">
                                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                                  <span>{app.city}</span>
                                </div>
                                <div className="flex items-center gap-2 text-foreground/80">
                                  <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                                  <span>{app.position}</span>
                                </div>
                                <div className="flex items-center gap-2 text-foreground/80">
                                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                                  <span>{app.area}</span>
                                </div>
                                <div className="flex items-center gap-2 text-foreground/80">
                                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                                  <span>{app.years_experience || "—"} años de experiencia</span>
                                </div>
                                <div className="flex items-center gap-2 text-foreground/80">
                                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                                  <span>Postulación: {new Date(app.created_at).toLocaleDateString("es-AR")}</span>
                                </div>
                              </div>
                            </div>

                            {Object.keys(answers).length > 0 && (
                              <div>
                                <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                  Respuestas de filtrado
                                </h5>
                                <div className="grid gap-2">
                                  {Object.entries(answers).map(([question, answer]) => (
                                    <div key={question} className="rounded-lg border bg-background p-3">
                                      <p className="text-xs font-semibold text-muted-foreground">{question}</p>
                                      <p className="text-sm text-foreground/90 mt-1 whitespace-pre-wrap">{answer || "—"}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div>
                              <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                                Resumen de experiencia
                              </h5>
                              <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                {app.experience_summary || <span className="text-muted-foreground italic">Sin resumen</span>}
                              </p>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Estado del proceso
                                </label>
                                <Select value={app.status} onValueChange={(v) => handleStatusChange(app.id, v as ApplicationStatus)}>
                                  <SelectTrigger className="h-9">
                                    <Badge className={`${STATUS_COLORS[app.status]} text-xs`}>{STATUS_LABELS[app.status]}</Badge>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                                      <SelectItem key={k} value={k}>{v}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              {app.status === "contratado" && (
                                <div className="space-y-1.5">
                                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                                    <CalendarCheck className="h-3 w-3" /> Fecha de contratación
                                  </label>
                                  <Input
                                    type="date"
                                    value={app.hired_at || ""}
                                    onChange={(e) => handleHiredAtChange(app.id, e.target.value)}
                                    className="h-9"
                                  />
                                </div>
                              )}
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Etiquetas
                              </label>
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {(app.tags || []).map(t => (
                                  <Badge key={t} variant="secondary" className="text-xs gap-1 pr-1">
                                    <Tag className="h-2.5 w-2.5" />{t}
                                    <button
                                      onClick={() => removeTag(app.id, t)}
                                      className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
                                      aria-label={`Quitar etiqueta ${t}`}
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                                {(app.tags || []).length === 0 && (
                                  <span className="text-xs text-muted-foreground">Sin etiquetas</span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Input
                                  value={tagInputs[app.id] || ""}
                                  onChange={(e) => setTagInputs(prev => ({ ...prev, [app.id]: e.target.value }))}
                                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(app.id); } }}
                                  placeholder="Agregar etiqueta y Enter (ej: Senior, Bilingüe)"
                                  className="h-9 text-sm"
                                  maxLength={30}
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => addTag(app.id)}
                                  disabled={!(tagInputs[app.id] || "").trim()}
                                >
                                  Agregar
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Comentarios internos
                              </label>
                              <Textarea
                                defaultValue={app.comments || ""}
                                onBlur={(e) => handleCommentsBlur(app.id, e.target.value)}
                                placeholder="Notas internas sobre el candidato..."
                                rows={3}
                                className="text-sm"
                              />
                            </div>

                            <div>
                              <Button variant="outline" size="sm" onClick={() => downloadCv(app.cv_path)}>
                                <Download className="h-4 w-4 mr-2" /> Descargar CV
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
