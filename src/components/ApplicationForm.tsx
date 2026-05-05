import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { POSITIONS, AREAS, CITIES, YEARS_EXPERIENCE } from "@/lib/types";
import { Upload, CheckCircle, Loader2 } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

type FilterQuestion = {
  question: string;
};

interface ApplicationFormProps {
  openingId?: string;
  lockedPosition?: string;
  lockedArea?: string;
  onSuccess?: () => void;
}

const normalizeQuestions = (raw: any): FilterQuestion[] => {
  if (!raw) return [];

  let parsed = raw;

  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return raw.trim() ? [{ question: raw.trim() }] : [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((q: any) => {
      if (typeof q === "string") return { question: q.trim() };
      if (typeof q?.question === "string") return { question: q.question.trim() };
      return { question: "" };
    })
    .filter(q => q.question.length > 0)
    .slice(0, 4);
};

export default function ApplicationForm({ openingId, lockedPosition, lockedArea, onSuccess }: ApplicationFormProps = {}) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [mathAnswer, setMathAnswer] = useState("");
  const [questions, setQuestions] = useState<FilterQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [mathChallenge] = useState(() => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    return { a, b, answer: a + b };
  });

  const normalizeCuil = (value: string) => value.replace(/\D/g, "");

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!openingId) {
        setQuestions([]);
        setAnswers({});
        return;
      }

      const { data, error } = await supabase
        .from("job_openings")
        .select("custom_questions")
        .eq("id", openingId)
        .single();

      if (error) {
        console.error("Error fetching custom_questions:", error);
        setQuestions([]);
        return;
      }

      setQuestions(normalizeQuestions(data?.custom_questions));
    };

    fetchQuestions();
  }, [openingId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!ALLOWED_TYPES.includes(f.type)) {
      toast({ title: "Formato no válido", description: "Solo se permiten archivos PDF, DOC o DOCX.", variant: "destructive" });
      e.target.value = "";
      return;
    }

    if (f.size > MAX_FILE_SIZE) {
      toast({ title: "Archivo muy grande", description: "El tamaño máximo es 5MB.", variant: "destructive" });
      e.target.value = "";
      return;
    }

    setFile(f);
  };

  const handleAnswerChange = (question: string, value: string) => {
    setAnswers(prev => ({ ...prev, [question]: value }));
  };

  const validateQuestionAnswers = () => {
    if (!openingId || questions.length === 0) return true;

    const missing = questions.some(q => !answers[q.question]?.trim());

    if (missing) {
      toast({
        title: "Preguntas incompletas",
        description: "Respondé todas las preguntas de filtrado para continuar.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const uploadCv = async (cuil: string) => {
    if (!file) throw new Error("CV requerido");

    const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const safeFileName = file.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_");

    const filePath = `${cuil}/${Date.now()}_${safeFileName || `cv.${ext}`}`;

    const { error: uploadError } = await supabase.storage
      .from("cvs")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    return filePath;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (parseInt(mathAnswer) !== mathChallenge.answer) {
      toast({ title: "Verificación incorrecta", description: "Por favor resolvé la operación correctamente.", variant: "destructive" });
      return;
    }

    if (!consent) {
      toast({ title: "Consentimiento requerido", description: "Debés aceptar el tratamiento de datos personales.", variant: "destructive" });
      return;
    }

    if (!file) {
      toast({ title: "CV requerido", description: "Por favor subí tu CV.", variant: "destructive" });
      return;
    }

    if (!validateQuestionAnswers()) return;

    setLoading(true);
    const form = e.currentTarget;
    const fd = new FormData(form);

    try {
      const cuil = normalizeCuil(fd.get("cuil") as string);

      if (!cuil) {
        toast({ title: "CUIL requerido", description: "Por favor ingresá tu CUIL.", variant: "destructive" });
        setLoading(false);
        return;
      }

      if (openingId) {
        const { data: existingOpeningApplication, error: openingCheckError } = await supabase
          .from("job_applications")
          .select("id")
          .eq("cuil", cuil)
          .eq("opening_id", openingId)
          .limit(1);

        if (openingCheckError) throw openingCheckError;

        if (existingOpeningApplication && existingOpeningApplication.length > 0) {
          toast({
            title: "Postulación ya registrada",
            description: "Este CUIL ya está postulado a esta búsqueda.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      } else {
        const { data: existingGeneralApplication, error: generalCheckError } = await supabase
          .from("job_applications")
          .select("id")
          .eq("cuil", cuil)
          .is("opening_id", null)
          .limit(1);

        if (generalCheckError) throw generalCheckError;

        if (existingGeneralApplication && existingGeneralApplication.length > 0) {
          toast({
            title: "Postulación ya registrada",
            description: "Este CUIL ya tiene una postulación general registrada.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      const filePath = await uploadCv(cuil);

      const baseApplicationData = {
        full_name: fd.get("full_name") as string,
        cuil,
        phone: fd.get("phone") as string,
        email: fd.get("email") as string,
        city: fd.get("city") as string,
        position: lockedPosition ?? (fd.get("position") as string),
        area: lockedArea ?? (fd.get("area") as string),
        years_experience: fd.get("years_experience") as string,
        experience_summary: fd.get("experience_summary") as string,
        cv_path: filePath,
        consent: true,
      };

      if (openingId) {
        const { error: openingInsertError } = await supabase
          .from("job_applications")
          .insert({
            ...baseApplicationData,
            opening_id: openingId,
            answers,
          });

        if (openingInsertError) throw openingInsertError;

        const { data: existingGeneralApplication, error: generalLookupError } = await supabase
          .from("job_applications")
          .select("id")
          .eq("cuil", cuil)
          .is("opening_id", null)
          .limit(1);

        if (generalLookupError) throw generalLookupError;

        if (!existingGeneralApplication || existingGeneralApplication.length === 0) {
          const { error: generalInsertError } = await supabase
            .from("job_applications")
            .insert({
              ...baseApplicationData,
              opening_id: null,
              answers: {},
            });

          if (generalInsertError) throw generalInsertError;
        }
      } else {
        const { error: generalInsertError } = await supabase
          .from("job_applications")
          .insert({
            ...baseApplicationData,
            opening_id: null,
            answers: {},
          });

        if (generalInsertError) throw generalInsertError;
      }

      setSubmitted(true);
      onSuccess?.();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Ocurrió un error al enviar la postulación.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <CheckCircle className="h-16 w-16 text-success" />
        <h3 className="text-2xl font-bold text-foreground">¡Postulación enviada!</h3>
        <p className="text-muted-foreground max-w-md">
          Gracias por tu interés en formar parte de nuestro equipo. Revisaremos tu perfil y nos pondremos en contacto.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setSubmitted(false);
            setFile(null);
            setConsent(false);
            setMathAnswer("");
            setAnswers({});
          }}
        >
          Enviar otra postulación
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="full_name">Nombre y Apellido *</Label>
        <Input id="full_name" name="full_name" required placeholder="Ej: Juan Pérez" maxLength={100} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cuil">CUIL *</Label>
        <Input id="cuil" name="cuil" required placeholder="Ej: 20301234567" maxLength={20} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Teléfono *</Label>
        <Input id="phone" name="phone" type="tel" required placeholder="Ej: +54 11 1234-5678" maxLength={30} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input id="email" name="email" type="email" required placeholder="Ej: juan@email.com" maxLength={255} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">Ciudad / Provincia *</Label>
        <Select name="city" required>
          <SelectTrigger>
            <SelectValue placeholder="Seleccioná una ciudad" />
          </SelectTrigger>
          <SelectContent>
            {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {lockedPosition ? (
        <div className="space-y-2">
          <Label>Puesto de Interés</Label>
          <Input value={lockedPosition} readOnly disabled />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="position">Puesto de Interés *</Label>
          <Select name="position" required>
            <SelectTrigger>
              <SelectValue placeholder="Seleccioná un puesto" />
            </SelectTrigger>
            <SelectContent>
              {POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {lockedArea ? (
        <div className="space-y-2">
          <Label>Área de Interés</Label>
          <Input value={lockedArea} readOnly disabled />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="area">Área de Interés *</Label>
          <Select name="area" required>
            <SelectTrigger>
              <SelectValue placeholder="Seleccioná un área" />
            </SelectTrigger>
            <SelectContent>
              {AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="years_experience">Años de experiencia en el área *</Label>
        <Select name="years_experience" required>
          <SelectTrigger>
            <SelectValue placeholder="Seleccioná años de experiencia" />
          </SelectTrigger>
          <SelectContent>
            {YEARS_EXPERIENCE.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="experience_summary">Breve resumen de experiencia laboral *</Label>
        <Textarea
          id="experience_summary"
          name="experience_summary"
          required
          placeholder="Contanos brevemente tu experiencia..."
          rows={4}
          maxLength={2000}
        />
      </div>

      {openingId && questions.length > 0 && (
        <div className="md:col-span-2 rounded-lg border p-4 space-y-4 bg-muted/20">
          <div>
            <h4 className="font-semibold text-foreground">Preguntas de filtrado</h4>
            <p className="text-sm text-muted-foreground">
              Respondé estas preguntas para completar tu postulación a la búsqueda.
            </p>
          </div>

          {questions.map((q, i) => (
            <div key={`${q.question}-${i}`} className="space-y-2">
              <Label htmlFor={`answer_${i}`}>{i + 1}. {q.question} *</Label>
              <Textarea
                id={`answer_${i}`}
                value={answers[q.question] || ""}
                onChange={(e) => handleAnswerChange(q.question, e.target.value)}
                placeholder="Escribí tu respuesta..."
                rows={3}
                maxLength={1000}
                required
              />
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2 md:col-span-2">
        <Label>Curriculum Vitae (PDF, DOC, DOCX - máx 5MB) *</Label>
        <div
          onClick={() => fileRef.current?.click()}
          className="cursor-pointer flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input p-6 hover:border-primary/50 transition-colors"
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {file ? file.name : "Hacé click para seleccionar tu CV"}
          </span>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      <div className="md:col-span-2 space-y-4">
        <div className="flex items-start gap-3">
          <Checkbox id="consent" checked={consent} onCheckedChange={(v) => setConsent(v === true)} />
          <Label htmlFor="consent" className="text-sm leading-relaxed font-normal">
            Acepto el tratamiento de mis datos personales conforme a la legislación vigente para fines de selección de personal. *
          </Label>
        </div>

        <div className="space-y-2 max-w-xs">
          <Label htmlFor="captcha">¿Cuánto es {mathChallenge.a} + {mathChallenge.b}? *</Label>
          <Input
            id="captcha"
            value={mathAnswer}
            onChange={e => setMathAnswer(e.target.value)}
            required
            placeholder="Tu respuesta"
            maxLength={5}
          />
        </div>
      </div>

      <div className="md:col-span-2">
        <Button type="submit" size="lg" disabled={loading} className="w-full md:w-auto">
          {loading && <Loader2 className="animate-spin" />}
          {loading ? "Enviando..." : "Enviar Postulación"}
        </Button>
      </div>
    </form>
  );
}
