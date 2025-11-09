export interface Exchange {
  id: string;
  name: string;
  lat: number;
  lng: number;
  provider: string;
  distanceKm: number;
}

export interface StreamData {
  location: string;
  country: string;
  lat: number;
  lng: number;
  latency: { p25: number; p50: number; p75: number };
  exchanges: Exchange[];
}

export interface ArcDatum {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  latency: number;
  source: string;
  target: string;
  targetProvider: string;
  distance: number;
  color: string;
  id: string;
  targetType: string;
  targetLocation: string;
  sourceType: string;
  sourceLocation: string;
}

export interface PingdomProbe {
  id: number;
  city: string;
  countryiso: string;
  region?: string;
  active: boolean;
}
export interface CloudflareLatency {
  p25: number;
  p50: number;
  p75: number;
}
export interface ExchangeServer {
  id: string;
  name: string;
  provider: string;
  region: string;
  lat: number;
  lng: number;
}

export interface Latency {
  p25: number;
  p50: number;
  p75: number;
}

export interface Exchange {
  id: string;
  name: string;
  provider: string;
  region: string;
  lat: number;
  lng: number;
}

export interface Server {
  country: string;
  lat: number;
  lng: number;
  provider?: string;
  latency?: Latency;
}

export interface LatencyStore {
  servers: Server[];
  exchanges: Exchange[];
  filteredServers: Server[];
  filters: {
    provider: string[];
    exchange: string[];
  };
  setServers: (data: Server[]) => void;
  setExchanges: (data: Exchange[]) => void;
  updateLatency: (lat: number, lng: number, latency: Latency) => void;
  setFilters: (filters: Partial<LatencyStore["filters"]>) => void;
  applyFilters: () => void;
}

export interface PingdomProbe {
  id: number;
  city: string;
  countryiso: string;
  region?: string;
  active: boolean;
}

export interface LatencySeriesPoint {
  timestamp: string;
  value: number;
}

export interface LocationLatency {
  location: string;
  series: LatencySeriesPoint[];
}
