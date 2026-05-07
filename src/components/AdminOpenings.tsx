import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { POSITIONS, AREAS, CITIES, SCHEDULE_TYPES, WORK_MODES } from "@/lib/types";
import { Trash2, Plus, Power, Clock, Laptop, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type FilterQuestion = {
  question: string;
};

type Opening = {
  id: string;
  position: string;
  area: string;
  branch: string;
  description: string;
  requirements: string;
  schedule_type: string | null;
  work_mode: string | null;
  start_date?: string | null;
  is_active: boolean;
  created_at: string;
  custom_questions?: FilterQuestion[] | null;
};

const cleanQuestions = (questions: FilterQuestion[]) => {
  return questions
    .map(q => ({ question: q.question.trim() }))
    .filter(q => q.question.length > 0)
    .slice(0, 4);
};

export default function AdminOpenings() {
  const { toast } = useToast();
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState("");
  const [area, setArea] = useState("");
  const [branch, setBranch] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [scheduleType, setScheduleType] = useState("");
  const [workMode, setWorkMode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [questions, setQuestions] = useState<FilterQuestion[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<Opening | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const fetchOpenings = async () => {
    const { data, error } = await supabase
      .from("job_openings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setOpenings((data as Opening[]) || []);
    }

    setLoading(false);
  };

  useEffect(() => { fetchOpenings(); }, []);

  const addQuestion = () => {
    if (questions.length >= 4) return;
    setQuestions(prev => [...prev, { question: "" }]);
  };

  const updateQuestion = (index: number, value: string) => {
    setQuestions(prev => prev.map((q, i) => i === index ? { ...q, question: value } : q));
  };

  const removeQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const addEditQuestion = () => {
    if (!editing) return;
    const current = editing.custom_questions || [];
    if (current.length >= 4) return;
    setEditing({
      ...editing,
      custom_questions: [...current, { question: "" }],
    });
  };

  const updateEditQuestion = (index: number, value: string) => {
    if (!editing) return;
    const current = editing.custom_questions || [];
    setEditing({
      ...editing,
      custom_questions: current.map((q, i) => i === index ? { ...q, question: value } : q),
    });
  };

  const removeEditQuestion = (index: number) => {
    if (!editing) return;
    const current = editing.custom_questions || [];
    setEditing({
      ...editing,
      custom_questions: current.filter((_, i) => i !== index),
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!position || !area || !branch || !description.trim() || !scheduleType || !workMode || !startDate) {
      toast({ title: "Completá todos los campos", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    const finalQuestions = cleanQuestions(questions);

    const { data, error } = await supabase
      .from("job_openings")
      .insert({
        position,
        area,
        branch,
        description: description.trim(),
        requirements: requirements.trim(),
        schedule_type: scheduleType,
        work_mode: workMode,
        start_date: startDate,
        custom_questions: finalQuestions,
      })
      .select()
      .single();

    setSubmitting(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setOpenings(prev => [data as Opening, ...prev]);
      setPosition("");
      setArea("");
      setBranch("");
      setDescription("");
      setRequirements("");
      setScheduleType("");
      setWorkMode("");
      setStartDate("");
      setQuestions([]);
      toast({ title: "Búsqueda creada" });
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("job_openings").update({ is_active: !current }).eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setOpenings(prev => prev.map(o => o.id === id ? { ...o, is_active: !current } : o));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta búsqueda?")) return;

    const { error } = await supabase.from("job_openings").delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setOpenings(prev => prev.filter(o => o.id !== id));
      toast({ title: "Búsqueda eliminada" });
    }
  };

  const handleSaveEdit = async () => {
    if (!editing) return;

    if (!editing.position || !editing.area || !editing.branch || !editing.description.trim() || !editing.schedule_type || !editing.work_mode || !editing.start_date) {
      toast({ title: "Completá todos los campos", variant: "destructive" });
      return;
    }

    setEditSaving(true);

    const finalQuestions = cleanQuestions(editing.custom_questions || []);

    const { error } = await supabase.from("job_openings").update({
      position: editing.position,
      area: editing.area,
      branch: editing.branch,
      description: editing.description.trim(),
      requirements: (editing.requirements || "").trim(),
      schedule_type: editing.schedule_type,
      work_mode: editing.work_mode,
      start_date: editing.start_date,
      custom_questions: finalQuestions,
    }).eq("id", editing.id);

    setEditSaving(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setOpenings(prev => prev.map(o => o.id === editing.id ? { ...editing, custom_questions: finalQuestions } : o));
      setEditing(null);
      toast({ title: "Búsqueda actualizada" });
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="bg-card rounded-xl border p-4 md:p-6 space-y-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Plus className="h-4 w-4" /> Nueva búsqueda
        </h3>

        <div className="grid gap-3 md:grid-cols-3">
          <Select value={position} onValueChange={setPosition}>
            <SelectTrigger><SelectValue placeholder="Puesto" /></SelectTrigger>
            <SelectContent>
              {POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={area} onValueChange={setArea}>
            <SelectTrigger><SelectValue placeholder="Área" /></SelectTrigger>
            <SelectContent>
              {AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={branch} onValueChange={setBranch}>
            <SelectTrigger><SelectValue placeholder="Sucursal" /></SelectTrigger>
            <SelectContent>
              {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Select value={scheduleType} onValueChange={setScheduleType}>
            <SelectTrigger><SelectValue placeholder="Tipo de jornada" /></SelectTrigger>
            <SelectContent>
              {SCHEDULE_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={workMode} onValueChange={setWorkMode}>
            <SelectTrigger><SelectValue placeholder="Modalidad de trabajo" /></SelectTrigger>
            <SelectContent>
              {WORK_MODES.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <Textarea
          placeholder="Breve descripción de la búsqueda..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
        />

        <Textarea
          placeholder="Requerimientos del puesto (formación, experiencia, habilidades)..."
          value={requirements}
          onChange={e => setRequirements(e.target.value)}
          rows={3}
        />

        <div className="rounded-lg border p-3 space-y-3 bg-muted/20">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h4 className="font-semibold text-sm">Preguntas de filtrado</h4>
              <p className="text-xs text-muted-foreground">
                Podés agregar hasta 4 preguntas. Si no agregás ninguna, no aparecerán en el formulario.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addQuestion} disabled={questions.length >= 4}>
              <Plus className="h-4 w-4 mr-1" /> Agregar
            </Button>
          </div>

          {questions.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin preguntas de filtrado.</p>
          ) : (
            <div className="space-y-2">
              {questions.map((q, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder={`Pregunta ${i + 1}`}
                    value={q.question}
                    onChange={(e) => updateQuestion(i, e.target.value)}
                    maxLength={200}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeQuestion(i)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button type="submit" disabled={submitting}>
          {submitting ? "Creando..." : "Crear búsqueda"}
        </Button>
      </form>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando...</div>
      ) : openings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No hay búsquedas creadas.</div>
      ) : (
        <div className="grid gap-3">
          {openings.map(o => (
            <div key={o.id} className="bg-card rounded-xl border p-4 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className="font-semibold text-foreground">{o.position}</h4>
                  <Badge className={o.is_active ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}>
                    {o.is_active ? "Activa" : "Inactiva"}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground mb-1">
                  {o.area} · {o.branch}
                </p>

                {o.start_date && (
                  <p className="text-xs text-muted-foreground">
                    Inicio: {new Date(o.start_date).toLocaleDateString("es-AR")}
                  </p>
                )}

                <div className="flex flex-wrap gap-1.5 mb-2 mt-2">
                  {o.schedule_type && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Clock className="h-3 w-3" />{o.schedule_type}
                    </Badge>
                  )}
                  {o.work_mode && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Laptop className="h-3 w-3" />{o.work_mode}
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-foreground/80">{o.description}</p>

                {o.requirements && (
                  <p className="text-xs text-muted-foreground mt-2">
                    <span className="font-semibold">Requerimientos:</span> {o.requirements}
                  </p>
                )}

                {(o.custom_questions || []).length > 0 && (
                  <div className="mt-3 rounded-lg border p-2 bg-muted/20">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Preguntas de filtrado:</p>
                    <div className="space-y-1">
                      {(o.custom_questions || []).map((q, i) => (
                        <p key={i} className="text-xs text-foreground/80">
                          {i + 1}. {q.question}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 shrink-0 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleActive(o.id, o.is_active)}
                >
                  <Power className="h-4 w-4" />
                  {o.is_active ? "Desactivar" : "Activar"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing({ ...o, custom_questions: o.custom_questions || [] })}
                >
                  <Pencil className="h-4 w-4" /> Editar
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(o.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar búsqueda</DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Puesto</Label>
                  <Select value={editing.position} onValueChange={(v) => setEditing({ ...editing, position: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Área</Label>
                  <Select value={editing.area} onValueChange={(v) => setEditing({ ...editing, area: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Sucursal</Label>
                  <Select value={editing.branch} onValueChange={(v) => setEditing({ ...editing, branch: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo de jornada</Label>
                  <Select value={editing.schedule_type ?? ""} onValueChange={(v) => setEditing({ ...editing, schedule_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {SCHEDULE_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Modalidad</Label>
                  <Select value={editing.work_mode ?? ""} onValueChange={(v) => setEditing({ ...editing, work_mode: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {WORK_MODES.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Fecha de inicio</Label>
                  <Input
                    type="date"
                    value={editing.start_date ?? ""}
                    onChange={(e) => setEditing({ ...editing, start_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Descripción</Label>
                <Textarea
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Requerimientos</Label>
                <Textarea
                  value={editing.requirements ?? ""}
                  onChange={(e) => setEditing({ ...editing, requirements: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="rounded-lg border p-3 space-y-3 bg-muted/20">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <Label className="text-sm font-semibold">Preguntas de filtrado</Label>
                    <p className="text-xs text-muted-foreground">
                      Hasta 4 preguntas. Si no hay preguntas, no aparecerán en el formulario.
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addEditQuestion} disabled={(editing.custom_questions || []).length >= 4}>
                    <Plus className="h-4 w-4 mr-1" /> Agregar
                  </Button>
                </div>

                {(editing.custom_questions || []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin preguntas de filtrado.</p>
                ) : (
                  <div className="space-y-2">
                    {(editing.custom_questions || []).map((q, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          placeholder={`Pregunta ${i + 1}`}
                          value={q.question}
                          onChange={(e) => updateEditQuestion(i, e.target.value)}
                          maxLength={200}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeEditQuestion(i)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={editSaving}>
              {editSaving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
fix AdminOpenings date field
