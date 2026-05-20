import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { JobApplication, STATUS_LABELS, ApplicationStatus } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import { Users, UserCheck, Clock, TrendingUp, Briefcase, Building2 } from "lucide-react";

type AppRow = JobApplication & { opening_id?: string | null };

const STATUS_CHART_COLORS: Record<string, string> = {
  nuevo:        "#3b82f6",
  contactado:   "#06b6d4",
  en_revision:  "#f59e0b",
  entrevistado: "#8b5cf6",
  contratado:   "#22c55e",
  rechazado:    "#ef4444",
  descartado:   "#6b7280",
};

const AREA_COLORS = [
  "#3b82f6","#8b5cf6","#06b6d4","#f59e0b","#22c55e","#ef4444",
  "#ec4899","#14b8a6","#f97316","#a855f7",
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || p.fill }} className="text-xs">
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-card border rounded-xl p-4 flex items-start gap-3">
      <div className={`rounded-lg p-2.5 shrink-0 ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground/70 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [apps, setApps] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("job_applications")
      .select("*")
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
        else setApps((data as AppRow[]) || []);
        setLoading(false);
      });
  }, []);

  const stats = useMemo(() => {
    const total = apps.length;
    const contratados = apps.filter(a => a.status === "contratado").length;
    const enProceso = apps.filter(a =>
      ["contactado","en_revision","entrevistado"].includes(a.status)
    ).length;

    const hiredApps = apps.filter(a => a.status === "contratado" && a.hired_at);
    const avgDays = hiredApps.length
      ? Math.round(
          hiredApps.reduce((acc, a) => {
            const diff = (new Date(a.hired_at!).getTime() - new Date(a.created_at).getTime()) / 86400000;
            return acc + diff;
          }, 0) / hiredApps.length
        )
      : null;

    const byStatus = Object.keys(STATUS_LABELS).map(k => ({
      name: STATUS_LABELS[k as ApplicationStatus],
      value: apps.filter(a => a.status === k).length,
      key: k,
    })).filter(d => d.value > 0);

    const areaMap: Record<string, number> = {};
    apps.forEach(a => { areaMap[a.area] = (areaMap[a.area] || 0) + 1; });
    const byArea = Object.entries(areaMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const posMap: Record<string, number> = {};
    apps.forEach(a => { posMap[a.position] = (posMap[a.position] || 0) + 1; });
    const byPosition = Object.entries(posMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const monthMap: Record<string, { mes: string; postulaciones: number; contratados: number }> = {};
    apps.forEach(a => {
      const d = new Date(a.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("es-AR", { month: "short", year: "2-digit" });
      if (!monthMap[key]) monthMap[key] = { mes: label, postulaciones: 0, contratados: 0 };
      monthMap[key].postulaciones++;
      if (a.status === "contratado") monthMap[key].contratados++;
    });
    const trend = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([, v]) => v);

    const cityMap: Record<string, number> = {};
    apps.forEach(a => {
      const city = a.city.split(",")[0].trim();
      cityMap[city] = (cityMap[city] || 0) + 1;
    });
    const byCity = Object.entries(cityMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return { total, contratados, enProceso, avgDays, byStatus, byArea, byPosition, trend, byCity };
  }, [apps]);

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-muted-foreground">Cargando...</div>;
  }

  if (stats.total === 0) {
    return <div className="text-center py-24 text-muted-foreground">No hay postulaciones registradas.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={Users}      label="Total postulaciones"        value={stats.total}       color="bg-blue-500" />
        <KpiCard icon={TrendingUp} label="En proceso"                 value={stats.enProceso}   color="bg-violet-500" />
        <KpiCard icon={UserCheck}  label="Contratados"                value={stats.contratados} color="bg-emerald-500" />
        <KpiCard
          icon={Clock}
          label="Dias prom. a contratacion"
          value={stats.avgDays !== null ? `${stats.avgDays}d` : "--"}
          sub={stats.avgDays !== null ? "sobre candidatos contratados" : "sin datos aun"}
          color="bg-amber-500"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <p className="text-sm font-semibold text-foreground mb-4">Postulaciones por mes</p>
          {stats.trend.length < 2 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">Necesitas datos de al menos 2 meses.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stats.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="postulaciones" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Postulaciones" />
                <Line type="monotone" dataKey="contratados" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} name="Contratados" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card border rounded-xl p-4">
          <p className="text-sm font-semibold text-foreground mb-4">Distribucion por estado</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={200}>
              <PieChart>
                <Pie data={stats.byStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {stats.byStatus.map((entry, i) => (
                    <Cell key={i} fill={STATUS_CHART_COLORS[entry.key] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              {stats.byStatus.map(s => (
                <div key={s.key} className="flex items-center gap-2 text-xs">
                  <span className="shrink-0 h-2.5 w-2.5 rounded-full" style={{ background: STATUS_CHART_COLORS[s.key] || "#94a3b8" }} />
                  <span className="text-muted-foreground truncate">{s.name}</span>
                  <span className="font-semibold text-foreground ml-auto">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <p className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" /> Por area
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.byArea} layout="vertical" margin={{ left: 8 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={110} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Postulaciones" radius={[0, 4, 4, 0]}>
                {stats.byArea.map((_, i) => (
                  <Cell key={i} fill={AREA_COLORS[i % AREA_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border rounded-xl p-4">
          <p className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" /> Por puesto (top 8)
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.byPosition} layout="vertical" margin={{ left: 8 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={140} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Postulaciones" radius={[0, 4, 4, 0]}>
                {stats.byPosition.map((_, i) => (
                  <Cell key={i} fill={AREA_COLORS[(i + 3) % AREA_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-4">
        <p className="text-sm font-semibold text-foreground mb-4">Por ciudad (top 6)</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={stats.byCity}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="Postulaciones" radius={[4, 4, 0, 0]}>
              {stats.byCity.map((_, i) => (
                <Cell key={i} fill={AREA_COLORS[i % AREA_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
