import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, MapPin, Building2, Clock, Laptop, ListChecks, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ApplicationForm from "@/components/ApplicationForm";

type FilterQuestion = {
  question: string;
};

type Opening = {
  id: string;
  position: string;
  area: string;
  branch: string;
  description: string;
  requirements: string | null;
  schedule_type: string | null;
  work_mode: string | null;
  custom_questions?: FilterQuestion[] | null;
};

export default function ActiveOpenings() {
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Opening | null>(null);
  const [details, setDetails] = useState<Opening | null>(null);

  useEffect(() => {
    supabase
      .from("job_openings")
      .select("id, position, area, branch, description, requirements, schedule_type, work_mode, custom_questions")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOpenings((data as Opening[]) || []);
        setLoading(false);
      });
  }, []);

  if (loading || openings.length === 0) return null;

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex flex-col items-center text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Búsquedas Activas</h2>
          <p className="text-muted-foreground mt-2">
            Estas son las posiciones que estamos buscando actualmente.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {openings.map((o) => (
            <article
              key={o.id}
              className="bg-card rounded-xl border border-border shadow-sm hover:shadow-lg hover:border-primary/40 transition-all p-6 flex flex-col"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="rounded-lg p-2 bg-primary/10 shrink-0">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-bold text-foreground leading-tight">{o.position}</h3>
              </div>

              <div className="space-y-1.5 mb-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  <span>{o.area}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>{o.branch}</span>
                </div>
              </div>

              {(o.schedule_type || o.work_mode) && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {o.schedule_type && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Clock className="h-3 w-3" />{o.schedule_type}
                    </Badge>
                  )}
                  {o.work_mode && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Laptop className="h-3 w-3" />{o.work_mode}
                    </Badge>
                  )}
                </div>
              )}

              {(o.custom_questions || []).length > 0 && (
                <Badge variant="outline" className="w-fit mb-3">
                  {(o.custom_questions || []).length} preguntas de filtrado
                </Badge>
              )}

              <div className="flex-1" />

              <div className="flex flex-col gap-2 mt-2">
                <Button
                  onClick={() => setDetails(o)}
                  variant="outline"
                  className="w-full gap-1.5"
                  size="sm"
                >
                  <Eye className="h-3.5 w-3.5" /> Ver más
                </Button>

                <Button
                  onClick={() => setSelected(o)}
                  className="w-full"
                  size="sm"
                >
                  Postularme a esta búsqueda
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Postulación a: {selected?.position}</DialogTitle>
            <DialogDescription>
              {selected?.area} · {selected?.branch}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <ApplicationForm
              openingId={selected.id}
              lockedPosition={selected.position}
              lockedArea={selected.area}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!details} onOpenChange={(open) => !open && setDetails(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{details?.position}</DialogTitle>
            <DialogDescription>
              {details?.area} · {details?.branch}
            </DialogDescription>
          </DialogHeader>

          {details && (
            <div className="space-y-4">
              {(details.schedule_type || details.work_mode) && (
                <div className="flex flex-wrap gap-1.5">
                  {details.schedule_type && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Clock className="h-3 w-3" />{details.schedule_type}
                    </Badge>
                  )}
                  {details.work_mode && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Laptop className="h-3 w-3" />{details.work_mode}
                    </Badge>
                  )}
                </div>
              )}

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Descripción</h4>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{details.description}</p>
              </div>

              {details.requirements && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 flex items-center gap-1">
                    <ListChecks className="h-3 w-3" /> Requerimientos
                  </h4>
                  <p className="text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap">{details.requirements}</p>
                </div>
              )}

              {(details.custom_questions || []).length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                    Preguntas de filtrado
                  </h4>
                  <div className="space-y-1">
                    {(details.custom_questions || []).map((q, i) => (
                      <p key={i} className="text-sm text-foreground/70">
                        {i + 1}. {q.question}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={() => {
                  setSelected(details);
                  setDetails(null);
                }}
                className="w-full"
              >
                Postularme a esta búsqueda
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
