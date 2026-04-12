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
  costs: CostOption[];
  dates: MonthAvailability[];
}

export interface FooterContent {
  primaryLine: string;
  secondaryLine: string;
  generatedAtLine: string;
}

export interface BrandTheme {
  key: string;
  name: string;
  backgroundColor: string;
  primaryColor: string;
  textColor: string;
  footerColor: string;
  watermarkText: string;
}

export interface AlertImagePayload {
  template: TemplateType;
  title: string;
  themeKey: string;
  destinationImage: string;
  outbound: JourneyBlock;
  inbound?: JourneyBlock;
  footer: FooterContent;
}
