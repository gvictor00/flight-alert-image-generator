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
  { iata: 'NBO', city: 'Nairóbi', country: 'Quênia' },
  { iata: 'AMM', city: 'Amã', country: 'Jordânia' },
  { iata: 'KWI', city: 'Kuwait', country: 'Kuwait' },
  { iata: 'MCT', city: 'Mascate', country: 'Omã' },
  { iata: 'BEY', city: 'Beirute', country: 'Líbano' },
  { iata: 'SEZ', city: 'Mahé', country: 'Seychelles' },

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
  { iata: 'MNL', city: 'Manila', country: 'Filipinas' },
  { iata: 'DPS', city: 'Denpasar', country: 'Indonésia' },
  { iata: 'NAN', city: 'Nadi', country: 'Fiji' },
  { iata: 'PER', city: 'Perth', country: 'Austrália' },
  { iata: 'PLS', city: 'Providenciales', country: 'Ilhas Turcas e Caicos' },
  { iata: 'JED', city: 'Jeddah', country: 'Arábia Saudita' },
  { iata: 'RUH', city: 'Riyadh', country: 'Arábia Saudita' },
  { iata: 'CMN', city: 'Casablanca', country: 'Marrocos' },
  { iata: 'HKT', city: 'Phuket', country: 'Tailândia' },
  { iata: 'SZX', city: 'Shenzhen', country: 'China' },
  { iata: 'TYO', city: 'Tóquio (Área)', country: 'Japão' },
  { iata: 'SEL', city: 'Seul (Área)', country: 'Coreia do Sul' },

  // Ilhas e destinos exóticos
  { iata: 'PPT', city: 'Papeete', country: 'Polinésia Francesa' },
  { iata: 'PUJ', city: 'Punta Cana', country: 'República Dominicana' },
  { iata: 'SDQ', city: 'Santo Domingo', country: 'República Dominicana' },
  { iata: 'NAS', city: 'Nassau', country: 'Bahamas' },
  { iata: 'MBJ', city: 'Montego Bay', country: 'Jamaica' },
  { iata: 'HAV', city: 'Havana', country: 'Cuba' },
  { iata: 'BON', city: 'Bonaire', country: 'Caribe Holandês' },

  // Aeroportos Adicionais (Extraídos dos comentários)
  { iata: 'TXL', city: 'Berlim', country: 'Alemanha' },
  { iata: 'BER', city: 'Berlim', country: 'Alemanha' },
  { iata: 'STR', city: 'Stuttgart', country: 'Alemanha' },
  { iata: 'HAJ', city: 'Hannover', country: 'Alemanha' },
  { iata: 'DTM', city: 'Dortmund', country: 'Alemanha' },
  { iata: 'HAM', city: 'Hamburg', country: 'Alemanha' },
  { iata: 'LAD', city: 'Luanda', country: 'Angola' },
  { iata: 'ROS', city: 'Rosario', country: 'Argentina' },
  { iata: 'COR', city: 'Córdoba', country: 'Argentina' },
  { iata: 'BRC', city: 'Bariloche', country: 'Argentina' },
  { iata: 'AUA', city: 'Aruba', country: 'Aruba' },
  { iata: 'BNE', city: 'Brisbane', country: 'Austrália' },
  { iata: 'BRU', city: 'Bruxelas', country: 'Bélgica' },
  { iata: 'SJJ', city: 'Sarajevo', country: 'Bósnia' },
  { iata: 'SOF', city: 'Sófia', country: 'Bulgária' },
  { iata: 'SID', city: 'Espargos', country: 'Cabo Verde' },
  { iata: 'YOW', city: 'Ottawa', country: 'Canadá' },
  { iata: 'YQB', city: 'Quebec', country: 'Canadá' },
  { iata: 'PMC', city: 'Puerto Montt', country: 'Chile' },
  { iata: 'ZAG', city: 'Zagreb', country: 'Croácia' },
  { iata: 'GYE', city: 'Guayaquil', country: 'Equador' },
  { iata: 'DEN', city: 'Denver', country: 'Estados Unidos' },
  { iata: 'DTW', city: 'Detroit', country: 'Estados Unidos' },
  { iata: 'HNL', city: 'Honolulu', country: 'Estados Unidos' },
  { iata: 'IAH', city: 'Houston', country: 'Estados Unidos' },
  { iata: 'LGA', city: 'Nova Iorque', country: 'Estados Unidos' },
  { iata: 'SEA', city: 'Seattle', country: 'Estados Unidos' },
  { iata: 'TPA', city: 'Tampa', country: 'Estados Unidos' },
  { iata: 'DCA', city: 'Washington - D.C.', country: 'Estados Unidos' },
  { iata: 'BWI', city: 'Washington - D.C.', country: 'Estados Unidos' },
  { iata: 'FLL', city: 'Fort Lauderdale', country: 'Estados Unidos' },
  { iata: 'CGK', city: 'Jacarta', country: 'Indonésia' },
  { iata: 'TLV', city: 'Tel Aviv', country: 'Israel' },
  { iata: 'LIN', city: 'Milão', country: 'Itália' },
  { iata: 'CIA', city: 'Roma', country: 'Itália' },
  { iata: 'VCE', city: 'Veneza', country: 'Itália' },
  { iata: 'NAP', city: 'Nápoles', country: 'Itália' },
  { iata: 'NGO', city: 'Nagoya', country: 'Japão' },
  { iata: 'ITM', city: 'Osaka', country: 'Japão' },
  { iata: 'GDL', city: 'Guadalajara', country: 'México' },
  { iata: 'ACA', city: 'Acapulco', country: 'México' },
  { iata: 'MRU', city: 'Port Louis', country: 'Maurício' },
  { iata: 'MPM', city: 'Maputo', country: 'Moçambique' },
  { iata: 'LOS', city: 'Lagos', country: 'Nigéria' },
  { iata: 'OSL', city: 'Oslo', country: 'Noruega' },
  { iata: 'WLG', city: 'Wellington', country: 'Nova Zelândia' },
  { iata: 'AGT', city: 'Ciudad del Este', country: 'Paraguai' },
  { iata: 'CUZ', city: 'Cuzco', country: 'Peru' },
  { iata: 'SJU', city: 'San Juan', country: 'Porto Rico' },
  { iata: 'OPT', city: 'Bucareste', country: 'Romênia' },
  { iata: 'LED', city: 'São Petersburgo', country: 'Rússia' },
  { iata: 'SVO', city: 'Moscou', country: 'Rússia' },
  { iata: 'DKR', city: 'Dacar', country: 'Senegal' },
  { iata: 'BEG', city: 'Belgrado', country: 'Sérvia' },
  { iata: 'DAM', city: 'Damasco', country: 'Síria' },
  { iata: 'KBP', city: 'Kiev', country: 'Ucrânia' },
  { iata: 'PDP', city: 'Punta del Este', country: 'Uruguai' },
  { iata: 'CCS', city: 'Caracas', country: 'Venezuela' }
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