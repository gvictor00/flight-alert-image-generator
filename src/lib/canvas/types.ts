export type TripMode = 'one-way' | 'round-trip';
export type CanvasThemeKey = 'gomiles' | 'executiva' | 'firstclass' | 'milhasaovivo';
export type MavVariant = 'experiencias' | 'milhasaovivo';

export interface PriceBand {
  id: string;
  miles: string;
  dates: string;
}

export interface JourneyLeg {
  origin: string;
  destination: string;
  bands: PriceBand[];
}

export interface TypographySettings {
  headerSize: number;
  headerBold: boolean;
  routeSize: number;
  routeBold: boolean;
  milesSize: number;
  milesBold: boolean;
  datesSize: number;
  datesBold: boolean;
  footerSize: number;
  footerBold: boolean;
  headerRouteGap: number;
  datesLineHeight: number;
  milesLineHeight: number;
}

export interface AlertDraft {
  title: string;
  mavVariant: MavVariant;
  tripMode: TripMode;
  outbound: JourneyLeg;
  inbound: JourneyLeg;
  footersByTheme: Record<CanvasThemeKey, string>;
  typography: TypographySettings;
  destinationPhotoMode: 'auto' | 'manual';
  manualPhotoDataUrl?: string;
}

export interface CanvasFrame {
  inset: number;
  radius: number;
  outerBg: [string, string];
}

export interface CanvasTheme {
  key: CanvasThemeKey;
  name: string;
  fileSlug: string;
  bg: string;
  header: string;
  headerTextColor?: string;
  headerStyle?: 'pill';
  routeTitle: string;
  separatorColor?: string;
  separatorChar?: string;
  miles: string;
  dateLabel: string;
  dateText: string;
  divider: string;
  footerBg: string;
  footerText: string;
  footerSub?: string;
  footerLogoMode: 'own' | 'powered';
  hazard?: [string, string];
  watermarkAsset?: string;
  watermarkOpacity: number;
  brandMarkAsset?: string;
  ownLogoAsset?: string;
  poweredLogoAsset?: string;
  photoGradTop: string;
  photoGradBottom: string;
  noPlane?: boolean;
  photoBank?: 'default' | 'gomiles';
  frame?: CanvasFrame;
}

export interface CanvasAssets {
  plane: HTMLImageElement | null;
  logos: Record<string, HTMLImageElement | null>;
  destinationPhoto: HTMLImageElement | null;
  gomilesDestinationPhoto: HTMLImageElement | null;
}
