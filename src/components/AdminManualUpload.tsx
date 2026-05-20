import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { POSITIONS, AREAS, CITIES, YEARS_EXPERIENCE } from "@/lib/types";
import { Upload, UserPlus, Loader2, CheckCircle, X, FileText, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

type CandidateForm = {
  id: string;
  full_name: string;
  cuil: string;
  phone: string;
  email: string;
  city: string;
  position: string;
  area: string;
  years_experience: string;
  experience_summary: string;
  file: File | null;
  status: "idle" | "uploading" | "done" | "error";
  errorMsg?: string;
};

const emptyForm = (): CandidateForm => ({
  id: crypto.randomUUID(),
  full_name: "",
  cuil: "",
  phone: "",
  email: "",
  city: "",
  position: "",
  area: "",
  years_experience: "",
  experience_summary: "",
  file: null,
  status: "idle",
});

function CandidateRow({
  form,
  onChange,
  onRemove,
  onFileChange,
  canRemove,
}: {
  form: CandidateForm;
  onChange: (id: string, field: keyof CandidateForm, value: any) => void;
  onRemove: (id: string) => void;
  onFileChange: (id: string, file: File | null) => void;
  canRemove: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) {
      toast({ title: "Formato no válido", description: "Solo PDF, DOC o DOCX.", variant: "destructive" });
      e.target.value = "";
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast({ title: "Archivo muy grande", description: "Máx 5MB.", variant: "destructive" });
      e.target.value = "";
      return;
    }
    onFileChange(form.id, f);
  };

  const isDone = form.status === "done";
  const isError = form.status === "error";
  const isLoading = form.status === "uploading";

  return (
    <div className={`border rounded-xl p-4 space-y-4 relative transition-colors ${
      isDone ? "border-emerald-300 bg-emerald-50/30 dark:bg-emerald-950/20" :
      isError ? "border-destructive/40 bg-destructive/5" :
      "border-border bg-card"
    }`}>
      {/* Status overlay */}
      {isDone && (
        <div className="absolute top-3 right-3">
          <CheckCircle className="h-5 w-5 text-emerald-500" />
        </div>
      )}
      {isError && (
        <div className="absolute top-3 right-14">
          <Badge variant="destructive" className="text-xs">{form.errorMsg || "Error"}</Badge>
        </div>
      )}

      {/* Remove button */}
      {canRemove && !isDone && (
        <button
          type="button"
          onClick={() => onRemove(form.id)}
          className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {isDone && (
        <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm">
          <CheckCircle className="h-4 w-4" />
          {form.full_name} fue cargado exitosamente
        </div>
      )}

      {!isDone && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Nombre y Apellido *</Label>
            <Input
              value={form.full_name}
              onChange={e => onChange(form.id, "full_name", e.target.value)}
              placeholder="Ej: Juan Pérez"
              disabled={isLoading}
              maxLength={100}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">CUIL *</Label>
            <Input
              value={form.cuil}
              onChange={e => onChange(form.id, "cuil", e.target.value.replace(/\D/g, ""))}
              placeholder="20301234567"
              disabled={isLoading}
              maxLength={20}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Teléfono *</Label>
            <Input
              value={form.phone}
              onChange={e => onChange(form.id, "phone", e.target.value)}
              placeholder="+54 341 000-0000"
              disabled={isLoading}
              maxLength={30}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Email *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={e => onChange(form.id, "email", e.target.value)}
              placeholder="juan@email.com"
              disabled={isLoading}
              maxLength={255}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Ciudad *</Label>
            <Select
              value={form.city}
              onValueChange={v => onChange(form.id, "city", v)}
              disabled={isLoading}
            >
              <SelectTrigger><SelectValue placeholder="Seleccioná" /></SelectTrigger>
              <SelectContent>
                {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Puesto *</Label>
            <Select
              value={form.position}
              onValueChange={v => onChange(form.id, "position", v)}
              disabled={isLoading}
            >
              <SelectTrigger><SelectValue placeholder="Seleccioná" /></SelectTrigger>
              <SelectContent>
                {POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Área *</Label>
            <Select
              value={form.area}
              onValueChange={v => onChange(form.id, "area", v)}
              disabled={isLoading}
            >
              <SelectTrigger><SelectValue placeholder="Seleccioná" /></SelectTrigger>
              <SelectContent>
                {AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Experiencia</Label>
            <Select
              value={form.years_experience}
              onValueChange={v => onChange(form.id, "years_experience", v)}
              disabled={isLoading}
            >
              <SelectTrigger><SelectValue placeholder="Seleccioná" /></SelectTrigger>
              <SelectContent>
                {YEARS_EXPERIENCE.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* CV upload */}
          <div className="space-y-1.5">
            <Label className="text-xs">CV (PDF, DOC, DOCX) *</Label>
            <div
              onClick={() => !isLoading && fileRef.current?.click()}
              className={`flex items-center gap-2 border-2 border-dashed rounded-lg px-3 py-2.5 cursor-pointer transition-colors text-sm ${
                form.file
                  ? "border-primary/50 bg-primary/5 text-primary"
                  : "border-input hover:border-primary/40 text-muted-foreground"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {form.file
                ? <><FileText className="h-4 w-4 shrink-0" /><span className="truncate">{form.file.name}</span></>
                : <><Upload className="h-4 w-4 shrink-0" /><span>Subir CV</span></>
              }
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleFile}
              />
            </div>
          </div>

          <div className="space-y-1.5 lg:col-span-3">
            <Label className="text-xs">Resumen de experiencia</Label>
            <Textarea
              value={form.experience_summary}
              onChange={e => onChange(form.id, "experience_summary", e.target.value)}
              placeholder="Breve descripción del perfil del candidato..."
              rows={2}
              disabled={isLoading}
              maxLength={2000}
              className="text-sm"
            />
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando {form.full_name || "candidato"}...
        </div>
      )}
    </div>
  );
}

export default function AdminManualUpload() {
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<CandidateForm[]>([emptyForm()]);
  const [submitting, setSubmitting] = useState(false);
  const [allDone, setAllDone] = useState(false);

  const onChange = (id: string, field: keyof CandidateForm, value: any) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const onFileChange = (id: string, file: File | null) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, file } : c));
  };

  const addCandidate = () => {
    setCandidates(prev => [...prev, emptyForm()]);
  };

  const removeCandidate = (id: string) => {
    setCandidates(prev => prev.filter(c => c.id !== id));
  };

  const validate = (c: CandidateForm): string | null => {
    if (!c.full_name.trim()) return "Falta nombre";
    if (!c.cuil.trim()) return "Falta CUIL";
    if (!c.phone.trim()) return "Falta teléfono";
    if (!c.email.trim()) return "Falta email";
    if (!c.city) return "Falta ciudad";
    if (!c.position) return "Falta puesto";
    if (!c.area) return "Falta área";
    if (!c.file) return "Falta CV";
    return null;
  };

  const uploadOne = async (c: CandidateForm): Promise<void> => {
    const cuil = c.cuil.replace(/\D/g, "");
    const file = c.file!;
    const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const safeFileName = file.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${cuil}/${Date.now()}_${safeFileName || `cv.${ext}`}`;

    const { error: uploadError } = await supabase.storage
      .from("cvs")
      .upload(filePath, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    if (uploadError) throw new Error(`CV: ${uploadError.message}`);

    const { error: insertError } = await supabase.from("job_applications").insert({
      full_name: c.full_name.trim(),
      cuil,
      phone: c.phone.trim(),
      email: c.email.trim(),
      city: c.city,
      position: c.position,
      area: c.area,
      years_experience: c.years_experience || null,
      experience_summary: c.experience_summary.trim() || "Cargado manualmente por RRHH.",
      cv_path: filePath,
      consent: true,
      opening_id: null,
      tags: [],
      answers: {},
    });
    if (insertError) throw new Error(insertError.message);
  };

  const handleSubmit = async () => {
    const pending = candidates.filter(c => c.status === "idle");
    const errors: string[] = [];

    for (const c of pending) {
      const err = validate(c);
      if (err) errors.push(`${c.full_name || "Candidato"}: ${err}`);
    }

    if (errors.length > 0) {
      toast({
        title: "Hay campos incompletos",
        description: errors.join(" | "),
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    for (const c of pending) {
      setCandidates(prev => prev.map(x => x.id === c.id ? { ...x, status: "uploading" } : x));
      try {
        await uploadOne(c);
        setCandidates(prev => prev.map(x => x.id === c.id ? { ...x, status: "done" } : x));
      } catch (err: any) {
        setCandidates(prev => prev.map(x => x.id === c.id ? {
          ...x, status: "error", errorMsg: err.message || "Error"
        } : x));
      }
    }

    setSubmitting(false);
    const doneCount = candidates.filter(c => c.status === "done").length + pending.length;
    toast({ title: `${pending.length} candidato${pending.length > 1 ? "s" : ""} cargado${pending.length > 1 ? "s" : ""} exitosamente` });
    setAllDone(true);
  };

  const reset = () => {
    setCandidates([emptyForm()]);
    setAllDone(false);
  };

  const pendingCount = candidates.filter(c => c.status === "idle").length;
  const doneCount = candidates.filter(c => c.status === "done").length;

  return (
    <div className="space-y-5">
      <div className="bg-card border rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 rounded-lg p-2.5">
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Carga manual de candidatos</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Importá uno o varios candidatos recibidos por mail, WhatsApp o por cualquier otro canal. Quedan registrados en la base general de postulaciones.
            </p>
          </div>
        </div>
      </div>

      {/* Candidate forms */}
      <div className="space-y-3">
        {candidates.map(c => (
          <CandidateRow
            key={c.id}
            form={c}
            onChange={onChange}
            onRemove={removeCandidate}
            onFileChange={onFileChange}
            canRemove={candidates.length > 1}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        {!allDone && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={addCandidate}
              disabled={submitting}
            >
              <Plus className="h-4 w-4" /> Agregar otro candidato
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={submitting || pendingCount === 0}
            >
              {submitting
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Cargando...</>
                : <><Upload className="h-4 w-4" /> Cargar {pendingCount} candidato{pendingCount !== 1 ? "s" : ""}</>
              }
            </Button>
          </>
        )}

        {allDone && doneCount > 0 && (
          <>
            <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm">
              <CheckCircle className="h-4 w-4" />
              {doneCount} candidato{doneCount !== 1 ? "s" : ""} cargado{doneCount !== 1 ? "s" : ""} correctamente
            </div>
            <Button variant="outline" onClick={reset}>
              <Plus className="h-4 w-4" /> Cargar más candidatos
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
