import type { Database } from "@/integrations/supabase/types";

export type ApplicationStatus = Database["public"]["Enums"]["application_status"];

export type JobApplication = Database["public"]["Tables"]["job_applications"]["Row"] & {
  status_history?: StatusHistoryEntry[];
  discard_reason?: string | null;
};

export type StatusHistoryEntry = {
  status: ApplicationStatus;
  date: string;
  note?: string;
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  entrevistado: "Entrevistado",
  contratado: "Contratado",
  rechazado: "Descartado",
  descartado: "Descartado",
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  nuevo: "bg-info text-info-foreground",
  contactado: "bg-info text-info-foreground",
  entrevistado: "bg-primary text-primary-foreground",
  contratado: "bg-success text-success-foreground",
  rechazado: "bg-destructive text-destructive-foreground",
  descartado: "bg-destructive text-destructive-foreground",
};

export const ACTIVE_STATUSES: { value: ApplicationStatus; label: string }[] = [
  { value: "nuevo", label: "Nuevo" },
  { value: "contactado", label: "Contactado" },
  { value: "entrevistado", label: "Entrevistado" },
  { value: "contratado", label: "Contratado" },
  { value: "descartado", label: "Descartado" },
];

export const DISCARD_REASONS = [
  "No cumple requisitos",
  "Falta de experiencia",
  "Pretension salarial fuera de rango",
  "No disponibilidad horaria",
  "No paso la entrevista",
  "No respondio / perdio contacto",
  "Retiro su postulacion",
  "Malas referencias",
  "Perfil duplicado",
  "Otro",
];

export const POSITIONS = [
  "Vendedor tecnico",
  "Operador de equipos",
  "Tecnico / Mecanico",
  "Montador",
  "Canista",
  "Soldador",
  "Armador",
  "Pintor",
  "Analista de Almacen",
  "Chofer",
  "Supervisor",
  "Operario de Mantenimiento",
  "Administrativo",
  "Analista de Compras",
  "Analista de Recursos Humanos",
  "Oficina Tecnica",
  "Repositor / Logistica",
  "Otro",
];

export const CITIES = [
  "San Lorenzo, Santa Fe",
  "Puerto General San Martin, Santa Fe",
  "Fray Luis Beltran, Santa Fe",
  "Capitan Bermudez, Santa Fe",
  "Granadero Baigorria, Santa Fe",
  "Rosario, Santa Fe",
  "Funes, Santa Fe",
  "Roldan, Santa Fe",
  "Perez, Santa Fe",
  "Villa Gobernador Galvez, Santa Fe",
  "Timbues, Santa Fe",
  "Ricardone, Santa Fe",
  "Aldao, Santa Fe",
  "Andino, Santa Fe",
  "Oliveros, Santa Fe",
  "Otro",
];

export const YEARS_EXPERIENCE = [
  "Sin experiencia",
  "Menos de 1 año",
  "1 a 3 años",
  "3 a 5 años",
  "Mas de 5 años",
];

export const AREAS = [
  "Comercial / Ventas",
  "Servicios Industriales",
  "Rental",
  "Administracion",
  "Taller / Montaje",
  "Otro",
];

export const SCHEDULE_TYPES = ["Completa", "Part time", "Reducida"];
export const WORK_MODES = ["Presencial", "Hibrido", "Remoto"];
