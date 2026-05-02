export interface Airport {
  iata: string;
  city: string;
  country: string;
}

export const airports: Airport[] = [
  // Brasil
  { iata: 'GRU', city: 'São Paulo', country: 'Brasil' },
  { iata: 'CGH', city: 'São Paulo (Congonhas)', country: 'Brasil' },
  { iata: 'VCP', city: 'Campinas', country: 'Brasil' },
  { iata: 'GIG', city: 'Rio de Janeiro', country: 'Brasil' },
  { iata: 'SDU', city: 'Rio de Janeiro (Santos Dumont)', country: 'Brasil' },
  { iata: 'BSB', city: 'Brasília', country: 'Brasil' },
  { iata: 'SSA', city: 'Salvador', country: 'Brasil' },
  { iata: 'REC', city: 'Recife', country: 'Brasil' },
  { iata: 'FOR', city: 'Fortaleza', country: 'Brasil' },
  { iata: 'CNF', city: 'Belo Horizonte', country: 'Brasil' },
  { iata: 'CWB', city: 'Curitiba', country: 'Brasil' },
  { iata: 'POA', city: 'Porto Alegre', country: 'Brasil' },
  { iata: 'FLN', city: 'Florianópolis', country: 'Brasil' },
  { iata: 'MCZ', city: 'Maceió', country: 'Brasil' },
  { iata: 'NAT', city: 'Natal', country: 'Brasil' },
  { iata: 'BEL', city: 'Belém', country: 'Brasil' },
  { iata: 'MAO', city: 'Manaus', country: 'Brasil' },
  { iata: 'THE', city: 'Teresina', country: 'Brasil' },
  { iata: 'SLZ', city: 'São Luís', country: 'Brasil' },

  // Europa
  { iata: 'LIS', city: 'Lisboa', country: 'Portugal' },
  { iata: 'OPO', city: 'Porto', country: 'Portugal' },
  { iata: 'MAD', city: 'Madri', country: 'Espanha' },
  { iata: 'BCN', city: 'Barcelona', country: 'Espanha' },
  { iata: 'CDG', city: 'Paris', country: 'França' },
  { iata: 'ORY', city: 'Paris (Orly)', country: 'França' },
  { iata: 'LHR', city: 'Londres (Heathrow)', country: 'Reino Unido' },
  { iata: 'LGW', city: 'Londres (Gatwick)', country: 'Reino Unido' },
  { iata: 'AMS', city: 'Amsterdã', country: 'Holanda' },
  { iata: 'FCO', city: 'Roma', country: 'Itália' },
  { iata: 'MXP', city: 'Milão', country: 'Itália' },
  { iata: 'FRA', city: 'Frankfurt', country: 'Alemanha' },
  { iata: 'MUC', city: 'Munique', country: 'Alemanha' },
  { iata: 'ZRH', city: 'Zurique', country: 'Suíça' },
  { iata: 'GVA', city: 'Genebra', country: 'Suíça' },
  { iata: 'VIE', city: 'Viena', country: 'Áustria' },
  { iata: 'HEL', city: 'Helsinque', country: 'Finlândia' },
  { iata: 'ARN', city: 'Estocolmo', country: 'Suécia' },
  { iata: 'CPH', city: 'Copenhague', country: 'Dinamarca' },
  { iata: 'ATH', city: 'Atenas', country: 'Grécia' },
  { iata: 'IST', city: 'Istambul', country: 'Turquia' },
  { iata: 'DUB', city: 'Dublin', country: 'Irlanda' },
  { iata: 'PRG', city: 'Praga', country: 'República Tcheca' },
  { iata: 'BUD', city: 'Budapeste', country: 'Hungria' },
  { iata: 'WAW', city: 'Varsóvia', country: 'Polônia' },

  // Américas do Norte e Central
  { iata: 'JFK', city: 'Nova York (JFK)', country: 'EUA' },
  { iata: 'EWR', city: 'Nova York (Newark)', country: 'EUA' },
  { iata: 'LAX', city: 'Los Angeles', country: 'EUA' },
  { iata: 'MIA', city: 'Miami', country: 'EUA' },
  { iata: 'ORD', city: 'Chicago', country: 'EUA' },
  { iata: 'ATL', city: 'Atlanta', country: 'EUA' },
  { iata: 'BOS', city: 'Boston', country: 'EUA' },
  { iata: 'SFO', city: 'San Francisco', country: 'EUA' },
  { iata: 'MCO', city: 'Orlando', country: 'EUA' },
  { iata: 'LAS', city: 'Las Vegas', country: 'EUA' },
  { iata: 'DFW', city: 'Dallas', country: 'EUA' },
  { iata: 'IAD', city: 'Washington D.C.', country: 'EUA' },
  { iata: 'YYZ', city: 'Toronto', country: 'Canadá' },
  { iata: 'YVR', city: 'Vancouver', country: 'Canadá' },
  { iata: 'YUL', city: 'Montreal', country: 'Canadá' },
  { iata: 'CUN', city: 'Cancún', country: 'México' },
  { iata: 'MEX', city: 'Cidade do México', country: 'México' },
  { iata: 'PTY', city: 'Cidade do Panamá', country: 'Panamá' },

  // América do Sul
  { iata: 'EZE', city: 'Buenos Aires (Ezeiza)', country: 'Argentina' },
  { iata: 'AEP', city: 'Buenos Aires (Aeroparque)', country: 'Argentina' },
  { iata: 'SCL', city: 'Santiago', country: 'Chile' },
  { iata: 'LIM', city: 'Lima', country: 'Peru' },
  { iata: 'BOG', city: 'Bogotá', country: 'Colômbia' },
  { iata: 'UIO', city: 'Quito', country: 'Equador' },
  { iata: 'MVD', city: 'Montevidéu', country: 'Uruguai' },
  { iata: 'ASU', city: 'Assunção', country: 'Paraguai' },

  // Oriente Médio e África
  { iata: 'DOH', city: 'Doha', country: 'Catar' },
  { iata: 'DXB', city: 'Dubai', country: 'Emirados Árabes' },
  { iata: 'AUH', city: 'Abu Dhabi', country: 'Emirados Árabes' },
  { iata: 'JNB', city: 'Joanesburgo', country: 'África do Sul' },
  { iata: 'CPT', city: 'Cidade do Cabo', country: 'África do Sul' },
  { iata: 'CAI', city: 'Cairo', country: 'Egito' },

  // Ásia e Oceania
  { iata: 'NRT', city: 'Tóquio (Narita)', country: 'Japão' },
  { iata: 'HND', city: 'Tóquio (Haneda)', country: 'Japão' },
  { iata: 'KIX', city: 'Osaka', country: 'Japão' },
  { iata: 'ICN', city: 'Seul', country: 'Coreia do Sul' },
  { iata: 'PVG', city: 'Xangai', country: 'China' },
  { iata: 'PEK', city: 'Pequim', country: 'China' },
  { iata: 'HKG', city: 'Hong Kong', country: 'Hong Kong' },
  { iata: 'SIN', city: 'Cingapura', country: 'Cingapura' },
  { iata: 'BKK', city: 'Bangkok', country: 'Tailândia' },
  { iata: 'KUL', city: 'Kuala Lumpur', country: 'Malásia' },
  { iata: 'DEL', city: 'Nova Delhi', country: 'Índia' },
  { iata: 'BOM', city: 'Mumbai', country: 'Índia' },
  { iata: 'SYD', city: 'Sydney', country: 'Austrália' },
  { iata: 'MEL', city: 'Melbourne', country: 'Austrália' },
  { iata: 'AKL', city: 'Auckland', country: 'Nova Zelândia' },
  { iata: 'MLE', city: 'Malé', country: 'Maldivas' },

  // Ilhas e destinos exóticos
  { iata: 'PPT', city: 'Papeete', country: 'Polinésia Francesa' },
  { iata: 'PUJ', city: 'Punta Cana', country: 'República Dominicana' },
  { iata: 'SDQ', city: 'Santo Domingo', country: 'República Dominicana' },
  { iata: 'NAS', city: 'Nassau', country: 'Bahamas' },
  { iata: 'MBJ', city: 'Montego Bay', country: 'Jamaica' },
  { iata: 'HAV', city: 'Havana', country: 'Cuba' },
  { iata: 'BON', city: 'Bonaire', country: 'Caribe Holandês' },
];

export function findAirport(iata: string): Airport | undefined {
  return airports.find((a) => a.iata === iata.toUpperCase().trim());
}

export function getAirportLabel(iata: string): string {
  const airport = findAirport(iata);
  return airport ? `${airport.iata} — ${airport.city}` : iata;
}

export function filterAirports(query: string, limit = 8): Airport[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return airports
    .filter(
      (a) =>
        a.iata.toLowerCase().startsWith(q) ||
        a.city.toLowerCase().includes(q) ||
        a.country.toLowerCase().includes(q)
    )
    .slice(0, limit);
}

/**
 * Resolves a token (IATA code or city name) to an IATA code.
 * Used by parseRoute so that city-name routes ("São Paulo - Papeete") round-trip
 * back to IATA values for the AirportAutocomplete component.
 */
export function resolveToIata(token: string): string {
  const t = token.trim();
  if (!t) return '';
  const byIata = findAirport(t);
  if (byIata) return byIata.iata;
  const tLower = t.toLowerCase();
  const byCity = airports.find((a) => a.city.toLowerCase() === tLower);
  return byCity ? byCity.iata : t;
}
