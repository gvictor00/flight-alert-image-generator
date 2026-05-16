export type TemplateType = 'one-way' | 'round-trip';

export interface CostOption {
  id: string;
  value: string;
}

export interface MonthAvailability {
  id: string;
  value: string;
}

export interface JourneyBlock {
  route: string;
  stopsText?: string;
  costs: CostOption[];
  dates: MonthAvailability[];
}

export interface FooterContent {
  primaryLine: string;
  secondaryLine: string;
  generatedAtLine: string;
}

export interface DestinationImageSettings {
  fit: 'cover' | 'contain';
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface FooterTextPosition {
  x: number;
  y: number;
  width: number;
}

export interface FooterOverlayLayout {
  primaryLine: FooterTextPosition;
  secondaryLine: FooterTextPosition;
  generatedAtLine: FooterTextPosition;
}

export interface MainTextOverlayLayout {
  x: number;
  width: number;
  oneWayY: number;
  roundTripY: number;
}

export type FontVariantKey =
  | 'thin'
  | 'extra-light'
  | 'extra-light-italic'
  | 'light'
  | 'light-italic'
  | 'regular'
  | 'medium'
  | 'medium-italic'
  | 'semi-bold'
  | 'bold'
  | 'extra-bold'
  | 'black';

export interface ThemeTextFontVariants {
  title: FontVariantKey;
  route: FontVariantKey;
  cost: FontVariantKey;
  dates: FontVariantKey;
  orLabel: FontVariantKey;
  footerPrimary: FontVariantKey;
  footerSecondary: FontVariantKey;
  footerDate: FontVariantKey;
  obsText: FontVariantKey;
}

export interface BrandTheme {
  key: string;
  name: string;
  backgroundColor: string;
  primaryColor: string;
  textColor: string;
  obsTextColor: string;
  footerColor: string;
  footerTextColor: string;
  footerOverlayLayout: FooterOverlayLayout;
  mainTextOverlay: MainTextOverlayLayout;
  backgroundImage: string;
  textFontVariants: ThemeTextFontVariants;
}

export interface AlertImagePayload {
  template: TemplateType;
  title: string;
  themeKey: string;
  destinationImage: string;
  destinationImageSettings: DestinationImageSettings;
  outbound: JourneyBlock;
  inbound?: JourneyBlock;
  footer: FooterContent;
  extraObservation?: string;
}
