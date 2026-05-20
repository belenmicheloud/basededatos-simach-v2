import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { JobApplication, ApplicationStatus, STATUS_LABELS, STATUS_COLORS, ACTIVE_STATUSES, DISCARD_REASONS, StatusHistoryEntry } from "@/lib/types";
import {
  Download, Mail, Phone, MapPin, Briefcase, Building2, Calendar, Clock,
  ChevronDown, ChevronUp, Tag, X, CalendarCheck, Send, Trash2, IdCard, History,
} from "lucide-react";

type ActiveOpening = { id: string; position: string; area: string; branch: string };

interface Props {
  app: JobApplication;
  onUpdate: (id: string, patch: Partial<JobApplication>) => void;
}

const STATUS_NEEDS_DATE = ["contactado", "entrevistado", "contratado"];
const STATUS_DATE_LABEL: Record<string, string> = {
  contactado: "Fecha de contacto",
  entrevistado: "Fecha de entrevista",
  contratado: "Fecha de contratacion",
};

export default function ApplicationCard({ app, onUpdate }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [openings, setOpenings] = useState<ActiveOpening[]>([]);
  const [selectedOpening, setSelectedOpening] = useState<string>("");
  const [assigning, setAssigning] = useState(false);
  const [updatePosition, setUpdatePosition] = useState(true);

  // Status change flow
  const [pendingStatus, setPendingStatus] = useState<ApplicationStatus | null>(null);
  const [pendingDate, setPendingDate] = useState<string>("");
  const [pendingDiscard, setPendingDiscard] = useState<string>("");
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const cuil = (app as any).cuil || "--";
  const history: StatusHistoryEntry[] = (app as any).status_history || [];
  const discardReason: string | null = (app as any).discard_reason || null;

  useEffect(() => {
    if (!assignOpen || openings.length > 0) return;
    supabase
      .from("job_openings")
      .select("id, position, area, branch")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => setOpenings((data as ActiveOpening[]) || []));
  }, [assignOpen, openings.length]);

  const persist = async (patch: Partial<JobApplication>) => {
    const { error } = await supabase.from("job_applications").update(patch).eq("id", app.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      onUpdate(app.id, patch);
    }
  };

  const handleStatusSelect = (status: ApplicationStatus) => {
    if (status === app.status) return;
    setPendingStatus(status);
    setPendingDate(new Date().toISOString().slice(0, 10));
    setPendingDiscard("");
    setStatusDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;

    const newEntry: StatusHistoryEntry = {
      status: pendingStatus,
      date: pendingDate || new Date().toISOString().slice(0, 10),
    };
    if (pendingStatus === "descartado" && pendingDiscard) {
      newEntry.note = pendingDiscard;
    }

    const newHistory = [...history, newEntry];
    const patch: Partial<JobApplication> = {
      status: pendingStatus,
      status_history: newHistory as any,
    };

    if (pendingStatus === "contratado") {
      patch.hired_at = pendingDate || new Date().toISOString().slice(0, 10);
    } else {
      patch.hired_at = null;
    }

    if (pendingStatus === "descartado") {
      patch.discard_reason = pendingDiscard || null;
    } else {
      patch.discard_reason = null;
    }

    await persist(patch);
    toast({ title: "Estado actualizado" });
    setStatusDialogOpen(false);
    setPendingStatus(null);
  };

  const handleCommentsBlur = async (value: string) => {
    if ((app.comments || "") === value) return;
    await persist({ comments: value });
    toast({ title: "Comentario guardado" });
  };

  const addTag = async () => {
    const t = tagInput.trim();
    if (!t) return;
    const tags = app.tags || [];
    if (tags.includes(t)) { setTagInput(""); return; }
    await persist({ tags: [...tags, t] });
    setTagInput("");
  };

  const removeTag = async (tag: string) => {
    await persist({ tags: (app.tags || []).filter(t => t !== tag) });
  };

  const downloadCv = async () => {
    const { data, error } = await supabase.storage.from("cvs").createSignedUrl(app.cv_path, 60);
    if (error || !data?.signedUrl) {
      toast({ title: "Error al descargar", description: error?.message, variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const deleteApplication = async () => {
    const confirmed = window.confirm(`Eliminar a ${app.full_name}? Esta accion no se puede deshacer.`);
    if (!confirmed) return;
    const { error } = await supabase.from("job_applications").delete().eq("id", app.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Candidato eliminado" });
    window.location.reload();
  };

  const assignToOpening = async () => {
    if (!selectedOpening) return;
    setAssigning(true);
    const op = openings.find(o => o.id === selectedOpening);
    const patch: Partial<JobApplication> = { opening_id: selectedOpening };
    if (op && updatePosition) { patch.position = op.position; patch.area = op.area; }
    const { error } = await supabase.from("job_applications").update(patch).eq("id", app.id);
    setAssigning(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    onUpdate(app.id, patch);
    setAssignOpen(false);
    setSelectedOpening("");
    toast({ title: "Candidato asignado", description: op ? `${op.position} - ${op.branch}` : undefined });
  };

  const isDescartado = app.status === "descartado" || app.status === "rechazado";

  return (
    <div className="bg-card rounded-xl border overflow-hidden transition-shadow hover:shadow-md">
      <div className="p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-foreground text-base">{app.full_name}</h3>
              <Badge className={`${STATUS_COLORS[app.status]} text-xs`}>{STATUS_LABELS[app.status]}</Badge>
              {isDescartado && discardReason && (
                <span className="text-xs text-muted-foreground italic">{discardReason}</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><IdCard className="h-3 w-3" />CUIL: {cuil}</span>
              <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{app.position}</span>
              <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{app.area}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{app.city}</span>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />
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
            <Button variant="outline" size="sm" onClick={downloadCv}>
              <Download className="h-4 w-4" /> CV
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAssignOpen(true)}>
              <Send className="h-4 w-4" /> {app.opening_id ? "Reasignar" : "Asignar a busqueda"}
            </Button>
            <Button variant="destructive" size="sm" onClick={deleteApplication}>
              <Trash2 className="h-4 w-4" /> Eliminar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setOpen(o => !o)}>
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {open ? "Cerrar" : "Detalles"}
            </Button>
          </div>
        </div>
      </div>

      {open && (
        <div className="border-t bg-muted/20 p-4 md:p-5 space-y-5">
          <div className="grid gap-2 md:grid-cols-2 text-sm">
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
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>Experiencia: {app.years_experience || "--"}</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              Resumen de experiencia
            </h4>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {app.experience_summary}
            </p>
          </div>

          {/* Status change */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Estado del proceso
            </label>
            <Select value={app.status} onValueChange={(v) => handleStatusSelect(v as ApplicationStatus)}>
              <SelectTrigger className="h-9">
                <Badge className={`${STATUS_COLORS[app.status]} text-xs`}>{STATUS_LABELS[app.status]}</Badge>
              </SelectTrigger>
              <SelectContent>
                {ACTIVE_STATUSES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                <History className="h-3 w-3" /> Historial
              </label>
              <div className="space-y-1">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-foreground/80">
                    <span className="text-muted-foreground w-20 shrink-0">
                      {new Date(h.date).toLocaleDateString("es-AR")}
                    </span>
                    <Badge className={`${STATUS_COLORS[h.status]} text-xs`}>{STATUS_LABELS[h.status]}</Badge>
                    {h.note && <span className="text-muted-foreground italic">{h.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Etiquetas
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(app.tags || []).map(t => (
                <Badge key={t} variant="secondary" className="text-xs gap-1 pr-1">
                  <Tag className="h-2.5 w-2.5" />{t}
                  <button onClick={() => removeTag(t)} className="ml-1 rounded-full hover:bg-destructive/20 p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {(app.tags || []).length === 0 && <span className="text-xs text-muted-foreground">Sin etiquetas</span>}
            </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Agregar etiqueta y Enter"
                className="h-9 text-sm"
                maxLength={30}
              />
              <Button type="button" size="sm" onClick={addTag} disabled={!tagInput.trim()}>Agregar</Button>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Comentarios internos
            </label>
            <Textarea
              defaultValue={app.comments || ""}
              onBlur={(e) => handleCommentsBlur(e.target.value)}
              placeholder="Notas internas sobre el candidato..."
              rows={3}
              className="text-sm"
            />
          </div>
        </div>
      )}

      {/* Status change dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cambiar estado</DialogTitle>
            <DialogDescription>
              {pendingStatus && `Cambiando a "${STATUS_LABELS[pendingStatus]}"`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {pendingStatus && STATUS_NEEDS_DATE.includes(pendingStatus) && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                  <CalendarCheck className="h-3 w-3" />
                  {STATUS_DATE_LABEL[pendingStatus] || "Fecha"}
                </label>
                <Input
                  type="date"
                  value={pendingDate}
                  onChange={(e) => setPendingDate(e.target.value)}
                  className="h-9"
                />
              </div>
            )}

            {pendingStatus === "descartado" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Motivo de descarte
                </label>
                <Select value={pendingDiscard} onValueChange={setPendingDiscard}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un motivo..." /></SelectTrigger>
                  <SelectContent>
                    {DISCARD_REASONS.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={confirmStatusChange}
              disabled={pendingStatus === "descartado" && !pendingDiscard}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar a busqueda activa</DialogTitle>
            <DialogDescription>
              Move a <strong>{app.full_name}</strong> a una de las busquedas activas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {openings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay busquedas activas.</p>
            ) : (
              <>
                <Select value={selectedOpening} onValueChange={setSelectedOpening}>
                  <SelectTrigger><SelectValue placeholder="Elegi una busqueda..." /></SelectTrigger>
                  <SelectContent>
                    {openings.map(o => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.position} - {o.area} - {o.branch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <label className="flex items-start gap-2 text-sm text-foreground/90 cursor-pointer">
                  <input type="checkbox" checked={updatePosition} onChange={(e) => setUpdatePosition(e.target.checked)} className="mt-0.5" />
                  <span>Actualizar puesto y area con los de la busqueda</span>
                </label>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancelar</Button>
            <Button onClick={assignToOpening} disabled={!selectedOpening || assigning}>
              {assigning ? "Asignando..." : "Asignar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
