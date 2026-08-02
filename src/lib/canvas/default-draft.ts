import type { AlertDraft, CanvasThemeKey, TypographySettings } from './types';

export const STANDARD_TYPOGRAPHY: TypographySettings = {
  headerSize: 41,
  headerBold: true,
  routeSize: 52,
  routeBold: true,
  milesSize: 33,
  milesBold: true,
  datesSize: 29,
  datesBold: false,
  footerSize: 21,
  footerBold: true,
  headerRouteGap: 0,
  datesLineHeight: 1.55,
  milesLineHeight: 1.32
};

export function todayShort(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
}

export function todayLongPt(): string {
  const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const d = new Date();
  return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
}

export function defaultFooters(): Record<CanvasThemeKey, string> {
  return {
    gomiles: `Pesquisa realizada para 1 passageiro.\nData da pesquisa: ${todayShort()}`,
    executiva: `Alerta para uso próprio. Não encaminhar para outros grupos.\nPesquisa realizada para 1 passageiro.\nPesquisa realizada no dia ${todayLongPt()}`,
    firstclass: `Pesquisa realizada para 1 passageiro.\nQuer realizar a emissão? Entre em contato com seu gestor!\nPesquisa realizada no dia ${todayLongPt()}`,
    milhasaovivo: `· Pesquisa realizada para 1 passageiro no dia ${todayLongPt()} ·\nAlerta para uso exclusivo do grupo. Não encaminhar!\nCOMPRE E VENDA MILHAS NO NOSSO CLOSE FRIENDS COM MAIS DE 700 MEMBROS!\nSAIBA MAIS: COMENTE CF NO (31) 99957-9696`
  };
}

export function seatCountFooters(): Record<CanvasThemeKey, string> {
  return {
    gomiles: `Entre parênteses a quantidade de vagas em cada data.\nData da pesquisa: ${todayShort()}`,
    executiva: `Alerta para uso próprio. Não encaminhar para outros grupos.\nEntre parênteses a quantidade de vagas em cada data.\nPesquisa realizada no dia ${todayLongPt()}`,
    firstclass: `Entre parênteses a quantidade de vagas em cada data.\nQuer realizar a emissão? Entre em contato com seu gestor!\nPesquisa realizada no dia ${todayLongPt()}`,
    milhasaovivo: `· Pesquisa realizada no dia ${todayLongPt()}. Em parênteses a quantidade de vagas em cada data. ·\nAlerta para uso exclusivo do grupo. Não encaminhar!\nCOMPRE E VENDA MILHAS NO NOSSO CLOSE FRIENDS COM MAIS DE 700 MEMBROS!\nSAIBA MAIS: COMENTE CF NO (31) 99957-9696`
  };
}

export function createDefaultAlertDraft(): AlertDraft {
  return {
    title: 'EXECUTIVA AIR EUROPA',
    mavVariant: 'experiencias',
    tripMode: 'one-way',
    outbound: {
      origin: 'São Paulo',
      destination: 'Madri',
      bands: [
        {
          id: 'outbound-1',
          miles: '62.5K Milhas Flying Blue + 12,60 USD',
          dates: 'NOV: 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 31\nDEZ: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15\nFEV: 2, 15, 16, 22, 23\nMAR: 9'
        }
      ]
    },
    inbound: {
      origin: 'Madri',
      destination: 'São Paulo',
      bands: [
        {
          id: 'inbound-1',
          miles: '62.5K Milhas Flying Blue + 29,10 USD',
          dates: 'NOV: 11, 13, 14, 16, 17, 18, 19, 20, 21, 23, 24, 25, 26, 28, 29, 30\nDEZ: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 24, 25\nJUN: 16'
        }
      ]
    },
    footersByTheme: defaultFooters(),
    typography: { ...STANDARD_TYPOGRAPHY },
    destinationPhotoMode: 'auto'
  };
}
