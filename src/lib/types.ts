import type { Database } from "@/integrations/supabase/types";

export type ApplicationStatus = Database["public"]["Enums"]["application_status"];

export type JobApplication = Database["public"]["Tables"]["job_applications"]["Row"];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  en_revision: 'En revisión',
  entrevistado: 'Entrevistado',
  contratado: 'Contratado',
  rechazado: 'Rechazado',
  descartado: 'Descartado',
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  nuevo: 'bg-info text-info-foreground',
  contactado: 'bg-info text-info-foreground',
  en_revision: 'bg-warning text-warning-foreground',
  entrevistado: 'bg-primary text-primary-foreground',
  contratado: 'bg-success text-success-foreground',
  rechazado: 'bg-destructive text-destructive-foreground',
  descartado: 'bg-destructive text-destructive-foreground',
};

export const POSITIONS = [
  'Administrativo de Servicios',
  'Analista Administrativo',
  'Analista Comercial',
  'Vendedor de Máquinas',
  'Analista Contable',
  'Analista de Almacenes',
  'Analista de Comercio Exterior',
  'Analista de Compras',
  'Analista de Cuentas a Pagar',
  'Analista de Cuentas Corrientes',
  'Analista de Gestión del Cambio',
  'Analista de Recursos Humanos',
  'Analista de Repuestos',
  'Analista de Higiene y Seguridad',
  'Analista de Costos y Control de Gestión',
  'Auditoría',
  'Administrativo de Rental y Logística',
  'Chofer Camión',
  'Comunicador Técnico',
  'Coordinador Administrativo',
  'Gerente de Administración y Finanzas',
  'Gerente de Post Venta',
  'Jefe de Taller',
  'Mecánico de Taller',
  'Operador de Grúas',
  'Recepción y Mandatario',
  'Supervisor de Mantenimiento',
  'Tesorería',
  'Vendedor Técnico',
  'Otro',
];

export const CITIES = [
  'San Lorenzo, Santa Fe',
  'Puerto General San Martín, Santa Fe',
  'Fray Luis Beltrán, Santa Fe',
  'Capitán Bermúdez, Santa Fe',
  'Granadero Baigorria, Santa Fe',
  'Rosario, Santa Fe',
  'Funes, Santa Fe',
  'Roldán, Santa Fe',
  'Pérez, Santa Fe',
  'Villa Gobernador Gálvez, Santa Fe',
  'Timbúes, Santa Fe',
  'Ricardone, Santa Fe',
  'Aldao, Santa Fe',
  'Andino, Santa Fe',
  'Oliveros, Santa Fe',
  'Otro',
];

export const YEARS_EXPERIENCE = [
  'Sin experiencia',
  'Menos de 1 año',
  '1 a 3 años',
  '3 a 5 años',
  'Más de 5 años',
];

export const AREAS = [
  'Ventas',
  'Administración',
  'Recursos Humanos',
  'Recepción',
  'Gerencia',
  'Alquiler de Maquinaria',
  'Logística',
  'Taller Mecánico',
  'Servicio Técnico',
  'Repuestos',
  'Almacén',
  'Finanzas',
];

export const SCHEDULE_TYPES = ['Completa', 'Part time', 'Reducida'];
export const WORK_MODES = ['Presencial', 'Híbrido', 'Remoto'];
