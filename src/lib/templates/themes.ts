import type { BrandTheme } from '@/lib/templates/types';

export const brandThemes: BrandTheme[] = [
  {
    key: 'executiva-com-milhas',
    name: 'Executiva com Milhas',
    backgroundColor: '#eff1f4',
    primaryColor: '#1450b8',
    textColor: '#3a3a3a',
    footerColor: '#1450b8',
    footerTextColor: '#ffffff',
    footerOverlayLayout: {
      primaryLine: { x: 25, y: 873, width: 596 },
      secondaryLine: { x: 25, y: 896, width: 596 },
      generatedAtLine: { x: 25, y: 919, width: 596 }
    },
    mainTextOverlay: {
      x: 36,
      width: 670,
      oneWayY: 52,
      roundTripY: 40
    },
    backgroundImage: '/assets/backgrounds/templace_executiva_com_milhas.png'
  },
  {
    key: 'first-class-consultoria',
    name: 'First Class',
    backgroundColor: '#121e3e',
    primaryColor: '#f1c469',
    textColor: '#d1d3d9',
    footerColor: '#121e3e',
    footerTextColor: '#ffffff',
    footerOverlayLayout: {
      primaryLine: { x: 25, y: 873, width: 596 },
      secondaryLine: { x: 25, y: 896, width: 596 },
      generatedAtLine: { x: 25, y: 919, width: 596 }
    },
    mainTextOverlay: {
      x: 36,
      width: 670,
      oneWayY: 52,
      roundTripY: 40
    },
    backgroundImage: '/assets/backgrounds/template_first_class.png'
  }
];

export function getBrandTheme(themeKey: string): BrandTheme {
  return brandThemes.find((theme) => theme.key === themeKey) ?? brandThemes[0];
}
