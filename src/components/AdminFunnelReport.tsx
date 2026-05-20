import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { JobApplication } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from "recharts";
import { Calendar, Clock, Users, UserCheck, UserX, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Opening = {
  id: string;
  position: string;
  area: string;
  branch: string;
  is_active: boolean;
  created_at: string;
  start_date?: string | null;
};

type AppRow = JobApplication & { opening_id?: string | null };

type FunnelRow = {
  opening: Opening;
  apps: AppRow[];
  total: number;
  contactados: number;
  enRevision: number;
  entrevistados: number;
  contratados: number;
  rechazados: number;
  descartados: number;
  nuevos: number;
  conversionRate: number;     // % contratados / total
  entrevistaRate: number;     // % entrevistados / total
  diasHastaContratacion: number | null;
  diasBusqueda: number;       // desde created_at hasta hoy (o hasta hired_at del contratado)
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.fill }} className="text-xs">
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

function FunnelBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-muted rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums w-6 text-right" style={{ color }}>{value}</span>
    </div>
  );
}

function FunnelCard({ row, expanded, onToggle }: { row: FunnelRow; expanded: boolean; onToggle: () => void }) {
  const chartData = [
    { name: "Total", value: row.total, fill: "#3b82f6" },
    { name: "Contactados", value: row.contactados, fill: "#06b6d4" },
    { name: "En revisión", value: row.enRevision, fill: "#f59e0b" },
    { name: "Entrevistados", value: row.entrevistados, fill: "#8b5cf6" },
    { name: "Contratados", value: row.contratados, fill: "#22c55e" },
  ];

  const fechaInicio = row.opening.start_date || row.opening.created_at;

  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      {/* Header */}
      <div
        className="p-4 flex flex-col md:flex-row md:items-center gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-foreground">{row.opening.position}</h3>
            <Badge variant="outline" className="text-xs">{row.opening.area}</Badge>
            <Badge variant="outline" className="text-xs">{row.opening.branch}</Badge>
            {row.opening.is_active
              ? <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-200 text-xs">Activa</Badge>
              : <Badge variant="secondary" className="text-xs">Cerrada</Badge>
            }
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Inicio: {new Date(fechaInicio).toLocaleDateString("es-AR")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {row.diasBusqueda} días activa
            </span>
            {row.diasHastaContratacion !== null && (
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <UserCheck className="h-3 w-3" />
                Contratado en {row.diasHastaContratacion}d
              </span>
            )}
          </div>
        </div>

        {/* Mini KPIs */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground leading-none">{row.total}</p>
            <p className="text-[10px] text-muted-foreground">postulados</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-violet-600 leading-none">{row.entrevistados}</p>
            <p className="text-[10px] text-muted-foreground">entrevistados</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-emerald-600 leading-none">{row.contratados}</p>
            <p className="text-[10px] text-muted-foreground">contratados</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold leading-none" style={{
              color: row.conversionRate >= 10 ? "#22c55e" : row.conversionRate >= 3 ? "#f59e0b" : "#6b7280"
            }}>
              {row.conversionRate}%
            </p>
            <p className="text-[10px] text-muted-foreground">conversión</p>
          </div>
          <div className="text-muted-foreground ml-2">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t bg-muted/10 p-4 grid md:grid-cols-2 gap-6">
          {/* Funnel bars */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Embudo de conversión</p>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Total postulados</span>
                  <span className="font-semibold">100%</span>
                </div>
                <FunnelBar value={row.total} max={row.total} color="#3b82f6" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Contactados</span>
                  <span className="font-semibold">{row.total > 0 ? Math.round(row.contactados/row.total*100) : 0}%</span>
                </div>
                <FunnelBar value={row.contactados} max={row.total} color="#06b6d4" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">En revisión</span>
                  <span className="font-semibold">{row.total > 0 ? Math.round(row.enRevision/row.total*100) : 0}%</span>
                </div>
                <FunnelBar value={row.enRevision} max={row.total} color="#f59e0b" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Entrevistados</span>
                  <span className="font-semibold">{row.entrevistaRate}%</span>
                </div>
                <FunnelBar value={row.entrevistados} max={row.total} color="#8b5cf6" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Contratados</span>
                  <span className="font-semibold text-emerald-600">{row.conversionRate}%</span>
                </div>
                <FunnelBar value={row.contratados} max={row.total} color="#22c55e" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Descartados/Rechazados</span>
                  <span className="font-semibold text-destructive">{row.total > 0 ? Math.round((row.descartados+row.rechazados)/row.total*100) : 0}%</span>
                </div>
                <FunnelBar value={row.descartados + row.rechazados} max={row.total} color="#ef4444" />
              </div>
            </div>
          </div>

          {/* Bar chart */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Distribución visual</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Candidatos" radius={[4, 4, 0, 0]}>
                  {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Extra stats */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="bg-muted/40 rounded-lg p-2 text-center">
                <p className="text-xs text-muted-foreground">Nuevos sin gestionar</p>
                <p className="text-base font-bold text-foreground">{row.nuevos}</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-2 text-center">
                <p className="text-xs text-muted-foreground">Días hasta contrat.</p>
                <p className="text-base font-bold text-foreground">
                  {row.diasHastaContratacion !== null ? `${row.diasHastaContratacion}d` : "--"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminFunnelReport() {
  const { toast } = useToast();
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [apps, setApps] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    Promise.all([
      supabase.from("job_openings").select("*").order("created_at", { ascending: false }),
      supabase.from("job_applications").select("*").not("opening_id", "is", null),
    ]).then(([openRes, appRes]) => {
      if (openRes.error) toast({ title: "Error", description: openRes.error.message, variant: "destructive" });
      if (appRes.error) toast({ title: "Error", description: appRes.error.message, variant: "destructive" });
      setOpenings((openRes.data as Opening[]) || []);
      setApps((appRes.data as AppRow[]) || []);
      setLoading(false);
    });
  }, []);

  const rows = useMemo<FunnelRow[]>(() => {
    return openings.map(opening => {
      const oApps = apps.filter(a => a.opening_id === opening.id);
      const total = oApps.length;

      const count = (status: string) => oApps.filter(a => a.status === status).length;

      const contratados = count("contratado");
      const entrevistados = count("entrevistado");
      const contactados = count("contactado");
      const enRevision = count("en_revision");
      const rechazados = count("rechazado");
      const descartados = count("descartado");
      const nuevos = count("nuevo");

      const conversionRate = total > 0 ? Math.round((contratados / total) * 100) : 0;
      const entrevistaRate = total > 0 ? Math.round((entrevistados / total) * 100) : 0;

      // Days from start to today (or to hired_at)
      const fechaInicio = opening.start_date || opening.created_at;
      const hiredApp = oApps.find(a => a.status === "contratado" && a.hired_at);
      const endDate = hiredApp?.hired_at ? new Date(hiredApp.hired_at) : new Date();
      const diasBusqueda = Math.max(0, Math.round((endDate.getTime() - new Date(fechaInicio).getTime()) / 86400000));

      const diasHastaContratacion = hiredApp?.hired_at
        ? Math.round((new Date(hiredApp.hired_at).getTime() - new Date(fechaInicio).getTime()) / 86400000)
        : null;

      return {
        opening, apps: oApps, total,
        contactados, enRevision, entrevistados, contratados,
        rechazados, descartados, nuevos,
        conversionRate, entrevistaRate,
        diasHastaContratacion, diasBusqueda,
      };
    });
  }, [openings, apps]);

  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  if (loading) {
    return <div className="text-center py-16 text-muted-foreground">Cargando reporte...</div>;
  }

  if (rows.length === 0) {
    return <div className="text-center py-16 text-muted-foreground">No hay búsquedas creadas todavía.</div>;
  }

  // Summary KPIs across all openings
  const totalPostulados = rows.reduce((s, r) => s + r.total, 0);
  const totalContratados = rows.reduce((s, r) => s + r.contratados, 0);
  const avgConversion = rows.length > 0
    ? Math.round(rows.reduce((s, r) => s + r.conversionRate, 0) / rows.length)
    : 0;
  const avgDiasBusqueda = rows.length > 0
    ? Math.round(rows.reduce((s, r) => s + r.diasBusqueda, 0) / rows.length)
    : 0;

  return (
    <div className="space-y-5">
      {/* Global summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{rows.length}</p>
          <p className="text-xs text-muted-foreground">Búsquedas totales</p>
        </div>
        <div className="bg-card border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{totalPostulados}</p>
          <p className="text-xs text-muted-foreground">Postulados totales</p>
        </div>
        <div className="bg-card border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{totalContratados}</p>
          <p className="text-xs text-muted-foreground">Contratados totales</p>
        </div>
        <div className="bg-card border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-violet-600">{avgConversion}%</p>
          <p className="text-xs text-muted-foreground">Conv. promedio</p>
        </div>
      </div>

      {/* Per-opening funnels */}
      <div className="space-y-3">
        {rows.map(row => (
          <FunnelCard
            key={row.opening.id}
            row={row}
            expanded={!!expanded[row.opening.id]}
            onToggle={() => toggle(row.opening.id)}
          />
        ))}
      </div>
    </div>
  );
}
