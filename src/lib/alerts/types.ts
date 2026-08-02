export const EXPERIENCIAS_AO_VIVO = 'Experiências Ao Vivo';

export const ALERT_GROUPS = ['Executiva com Milhas', 'FirstClass', 'Go Miles Club', EXPERIENCIAS_AO_VIVO, 'Milhas Ao Vivo'] as const;

export type AlertGroup = (typeof ALERT_GROUPS)[number];

const ALERT_GROUP_ALIASES: Record<string, AlertGroup> = {
  'Executiva com Milhas': 'Executiva com Milhas',
  FirstClass: 'FirstClass',
  'Go Miles Club': 'Go Miles Club',
  'Experiências Ao Vivo': EXPERIENCIAS_AO_VIVO,
  'Experiencias Ao Vivo': EXPERIENCIAS_AO_VIVO,
  'Milhas Ao Vivo': 'Milhas Ao Vivo'
};

export function normalizeAlertGroup(value: string): AlertGroup | null {
  return ALERT_GROUP_ALIASES[value.trim()] || null;
}

export interface AlertRecord {
  id: string;
  origem: string;
  destino: string;
  programa: string;
  cia: string;
  grupo: AlertGroup;
  data: string;
  autor: string;
  obs?: string;
  image_url?: string | null;
  par_id?: string | null;
  card_data?: string | Record<string, unknown> | null;
  enviado: boolean;
  created_at?: string;
}

export interface NewAlertRecord {
  origem: string;
  destino: string;
  programa: string;
  cia: string;
  grupo: AlertGroup;
  data?: string;
  autor: string;
  obs?: string;
  image_url?: string | null;
  par_id?: string | null;
  card_data?: string | null;
}

export interface RouteSetting {
  route_key: string;
  min_days: number;
}

export interface PeriodFilter {
  mode: 'today' | '7d' | '30d' | 'all' | 'custom';
  startDate?: string;
  endDate?: string;
}

export interface ProgramStat {
  name: string;
  count: number;
  percentage: number;
}

export interface OperatorStat {
  operator: string;
  generatedToday: number;
  sentToday: number;
  generatedInPeriod: number;
  sentInPeriod: number;
  lastAlert: string;
}

export interface RouteMatrixRow {
  key: string;
  origin: string;
  destination: string;
  groupDays: Partial<Record<AlertGroup, number | null>>;
  status: 'Nunca enviada' | 'OK' | 'Atenção' | 'Vencida';
  total: number;
  minDays: number;
  programs: string[];
}
