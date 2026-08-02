const HTML_DEFAULT_BANK = '/assets/destinations/html/default';
const HTML_GOMILES_BANK = '/assets/destinations/html/gomiles';

const HTML_DESTINATION_KEYS = [
  'abudhabi',
  'adelaide',
  'amsterdam',
  'atenas',
  'aruba',
  'auckland',
  'bali',
  'bangkok',
  'barcelona',
  'belohorizonte',
  'bogota',
  'bolonha',
  'boston',
  'brasilia',
  'brisbane',
  'buenosaires',
  'budapeste',
  'cairo',
  'cancun',
  'casablanca',
  'chicago',
  'cidadedocabo',
  'cidadedomexico',
  'copenhague',
  'curacao',
  'dallas',
  'daressalam',
  'delhi',
  'doha',
  'dubai',
  'dublin',
  'dusseldorf',
  'frankfurt',
  'havai',
  'helskinki',
  'hongkong',
  'honolulu',
  'houston',
  'istambul',
  'jacarta',
  'jeddah',
  'joanesburgo',
  'lima',
  'lisboa',
  'londres',
  'losangeles',
  'madri',
  'maldidvas',
  'manaus',
  'manila',
  'mauritius',
  'melbourne',
  'miami',
  'milao',
  'montreal',
  'montevideu',
  'mumbai',
  'munique',
  'nadifiji',
  'napoles',
  'newark',
  'novaiorque',
  'orlandoi',
  'osaka',
  'oslo',
  'panama',
  'paris',
  'papete',
  'perth',
  'pequim',
  'phuket',
  'porto',
  'portoalegre',
  'puntacana',
  'recife',
  'riodejaneiro',
  'roma',
  'santiagodochile',
  'saofrancisco',
  'saopaulo',
  'seul',
  'seychelles',
  'shenzhen',
  'singapura',
  'stmarteen',
  'sydney',
  'taipei',
  'tokyo',
  'toronto',
  'toulouse',
  'turkscaicos',
  'valencia',
  'vancouver',
  'varsovia',
  'veneza',
  'washigton',
  'xangai',
  'zurique'
] as const;

type HtmlDestinationKey = (typeof HTML_DESTINATION_KEYS)[number];

function makePhotoBank(basePath: string): Record<HtmlDestinationKey, string> {
  return Object.fromEntries(HTML_DESTINATION_KEYS.map((key) => [key, `${basePath}/${key}.jpg`])) as Record<
    HtmlDestinationKey,
    string
  >;
}

export const DESTINATION_PHOTOS = makePhotoBank(HTML_DEFAULT_BANK);
export const DESTINATION_PHOTOS_GOMILES = makePhotoBank(HTML_GOMILES_BANK);

const DESTINATION_KEYWORDS: Record<HtmlDestinationKey, string[]> = {
  abudhabi: ['abu dhabi', 'auh'],
  adelaide: ['adelaide'],
  amsterdam: ['amsterda', 'amsterdam', 'ams'],
  atenas: ['atenas', 'athens', 'ath'],
  aruba: ['aruba', 'aua'],
  auckland: ['auckland', 'akl'],
  bali: ['bali', 'dps'],
  bangkok: ['bangkok', 'bkk'],
  barcelona: ['barcelona', 'bcn'],
  belohorizonte: ['belo horizonte', 'confins', 'bh', 'cnf'],
  bogota: ['bogota', 'bog'],
  bolonha: ['bolonha', 'bologna'],
  boston: ['boston', 'bos'],
  brasilia: ['brasilia', 'bsb'],
  brisbane: ['brisbane', 'bne'],
  buenosaires: ['buenos aires', 'baires', 'eze', 'aep'],
  budapeste: ['budapeste', 'budapest'],
  cairo: ['cairo', 'cai'],
  cancun: ['cancun', 'cun'],
  casablanca: ['casablanca', 'cmn'],
  chicago: ['chicago', 'ord'],
  cidadedocabo: ['cidade do cabo', 'cape town', 'cpt'],
  cidadedomexico: ['cidade do mexico', 'mexico city', 'cdmx', 'mex'],
  copenhague: ['copenhague', 'copenhagen', 'cph'],
  curacao: ['curacao', 'cur'],
  dallas: ['dallas', 'dfw'],
  daressalam: ['dar es salaam', 'dar es salam'],
  delhi: ['delhi', 'del'],
  doha: ['doha', 'doh'],
  dubai: ['dubai', 'dxb'],
  dublin: ['dublin', 'dublim', 'dub'],
  dusseldorf: ['dusseldorf', 'dus'],
  frankfurt: ['frankfurt', 'fra'],
  havai: ['havai', 'hawaii'],
  helskinki: ['helsinki', 'helsinque', 'hel'],
  hongkong: ['hong kong', 'hkg'],
  honolulu: ['honolulu', 'hnl'],
  houston: ['houston', 'iah'],
  istambul: ['istambul', 'istanbul', 'ist'],
  jacarta: ['jacarta', 'jakarta'],
  jeddah: ['jeddah', 'jida', 'jed'],
  joanesburgo: ['joanesburgo', 'johannesburg', 'jnb'],
  lima: ['lima', 'lim'],
  lisboa: ['lisboa', 'lisbon', 'lis'],
  londres: ['londres', 'london', 'lhr', 'lgw'],
  losangeles: ['los angeles', 'l.a.', 'lax'],
  madri: ['madri', 'madrid', 'mad'],
  maldidvas: ['maldivas', 'maldives', 'mle'],
  manaus: ['manaus'],
  manila: ['manila'],
  mauritius: ['mauricio', 'mauritius', 'mru'],
  melbourne: ['melbourne', 'mel'],
  miami: ['miami', 'mia'],
  milao: ['milao', 'milan', 'milano', 'mxp'],
  montreal: ['montreal'],
  montevideu: ['montevideu', 'montevideo', 'mvd'],
  mumbai: ['mumbai', 'bombaim', 'bom'],
  munique: ['munique', 'munich', 'muc'],
  nadifiji: ['fiji', 'nadi', 'nan'],
  napoles: ['napoles', 'naples'],
  newark: ['newark', 'ewr'],
  novaiorque: ['nova iorque', 'nova york', 'new york', 'nyc', 'jfk'],
  orlandoi: ['orlando', 'mco'],
  osaka: ['osaka', 'kix'],
  oslo: ['oslo'],
  panama: ['panama', 'pty'],
  paris: ['paris', 'cdg', 'ory'],
  papete: ['papete', 'papeete', 'tahiti'],
  perth: ['perth', 'per'],
  pequim: ['pequim', 'beijing', 'pek'],
  phuket: ['phuket', 'hkt'],
  porto: ['porto, portugal', 'porto portugal', 'porto', 'opo'],
  portoalegre: ['porto alegre'],
  puntacana: ['punta cana'],
  recife: ['recife', 'rec'],
  riodejaneiro: ['rio de janeiro', 'rio', 'gig', 'sdu'],
  roma: ['roma', 'rome', 'fco'],
  santiagodochile: ['santiago do chile', 'santiago', 'scl'],
  saofrancisco: ['sao francisco', 'san francisco', 'sfo'],
  saopaulo: ['sao paulo', 'gru', 'cgh', 'vcp'],
  seul: ['seul', 'seoul', 'icn'],
  seychelles: ['seychelles', 'sez'],
  shenzhen: ['shenzhen', 'shezhen'],
  singapura: ['singapura', 'singapore', 'sin'],
  stmarteen: ['st marteen', 'saint martin', 'sint maarten'],
  sydney: ['sydney', 'syd'],
  taipei: ['taipei'],
  tokyo: ['toquio', 'tokyo', 'hnd', 'nrt'],
  toronto: ['toronto', 'yyz'],
  toulouse: ['toulouse'],
  turkscaicos: ['turks e caicos', 'turks and caicos', 'turcs e caicos'],
  valencia: ['valencia', 'vlc'],
  vancouver: ['vancouver'],
  varsovia: ['varsovia', 'warsaw'],
  veneza: ['veneza', 'venice', 'vce'],
  washigton: ['washington', 'iad', 'dca'],
  xangai: ['xangai', 'shanghai', 'pvg'],
  zurique: ['zurique', 'zurich', 'zrh', 'gva']
};

export function normalizeDestinationText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function destinationPhotoSlug(value: string): string {
  return normalizeDestinationText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'destino';
}

export function matchDestinationPhotoKey(destination: string): HtmlDestinationKey | null {
  const normalized = normalizeDestinationText(destination);
  if (!normalized) return null;

  let bestKey: HtmlDestinationKey | null = null;
  let bestLength = -1;

  for (const [key, keywords] of Object.entries(DESTINATION_KEYWORDS) as [HtmlDestinationKey, string[]][]) {
    for (const keyword of keywords) {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`);
      if (re.test(normalized) && keyword.length > bestLength) {
        bestKey = key;
        bestLength = keyword.length;
      }
    }
  }

  return bestKey;
}

export function photoPathForDestination(destination: string, gomiles = false): string | null {
  const key = matchDestinationPhotoKey(destination);
  if (!key) return null;
  return gomiles ? DESTINATION_PHOTOS_GOMILES[key] : DESTINATION_PHOTOS[key];
}
