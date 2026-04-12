import type { BrandTheme } from '@/lib/templates/types';

export const brandThemes: BrandTheme[] = [
  {
    key: 'executiva-com-milhas',
    name: 'Executiva com Milhas',
    backgroundColor: '#eff1f4',
    primaryColor: '#1450b8',
    textColor: '#3a3a3a',
    footerColor: '#1450b8',
    watermarkText: 'EXECUTIVA\nCOM\nMILHAS'
  },
  {
    key: 'first-class-consultoria',
    name: 'First Class Consultoria',
    backgroundColor: '#f7f5f2',
    primaryColor: '#74501e',
    textColor: '#373737',
    footerColor: '#74501e',
    watermarkText: 'FIRST CLASS\nCONSULTORIA'
  }
];

export function getBrandTheme(themeKey: string): BrandTheme {
  return brandThemes.find((theme) => theme.key === themeKey) ?? brandThemes[0];
}
