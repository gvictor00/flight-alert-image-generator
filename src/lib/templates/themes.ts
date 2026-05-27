import type { BrandTheme, FontVariantKey } from '@/lib/templates/types';

export const brandThemes: BrandTheme[] = [
  {
    key: 'executiva-com-milhas',
    name: 'Executiva com Milhas',
    backgroundColor: '#eff1f4',
    primaryColor: '#1450b8',
    textColor: '#3a3a3a',
    footerColor: '#1450b8',
    footerTextColor: '#ffffff',
    obsTextColor: '#3d3d3d',
    footerOverlayLayout: {
      primaryLine: { x: 25, y: 987, width: 800 },
      secondaryLine: { x: 25, y: 1007, width: 800 },
      generatedAtLine: { x: 25, y: 1050, width: 800 }
    },
    mainTextOverlay: {
      x: 36,
      width: 670,
      oneWayY: 52,
      roundTripY: 40
    },
    backgroundImage: '/assets/backgrounds/template_executiva_com_milhas.png',
    textFontVariants: {
      title: 'medium',
      route: 'bold',
      cost: 'bold',
      dates: 'bold',
      orLabel: 'medium',
      footerPrimary: 'bold',
      footerSecondary: 'bold',
      footerDate: 'medium',
      obsText: 'extra-light-italic'
    }
  },
  {
    key: 'first-class-consultoria',
    name: 'First Class',
    backgroundColor: '#121e3e',
    primaryColor: '#f1c469',
    textColor: '#d1d3d9',
    footerColor: '#121e3e',
    footerTextColor: '#121e3e',
    obsTextColor: '#cccccc',
    footerOverlayLayout: {
      primaryLine: { x: 25, y: 987, width: 800 },
      secondaryLine: { x: 25, y: 1007, width: 800 },
      generatedAtLine: { x: 25, y: 1050, width: 800 }
    },
    mainTextOverlay: {
      x: 36,
      width: 670,
      oneWayY: 52,
      roundTripY: 40
    },
    backgroundImage: '/assets/backgrounds/template_first_class.png',
    textFontVariants: {
      title: 'medium',
      route: 'bold',
      cost: 'bold',
      dates: 'bold',
      orLabel: 'medium',
      footerPrimary: 'bold',
      footerSecondary: 'bold',
      footerDate: 'medium',
      obsText: 'light-italic'
    }
  }
];

const fontVariantWeightMap: Record<FontVariantKey, number> = {
  thin: 100,
  'extra-light': 200,
  'extra-light-italic': 200,
  light: 300,
  'light-italic': 300,
  regular: 400,
  medium: 500,
  'medium-italic': 500,
  'semi-bold': 600,
  bold: 700,
  'extra-bold': 800,
  black: 900
};

export function getBrandTheme(themeKey: string): BrandTheme {
  return brandThemes.find((theme) => theme.key === themeKey) ?? brandThemes[0];
}

export function getFontWeightForVariant(variant: FontVariantKey): number {
  return fontVariantWeightMap[variant];
}
