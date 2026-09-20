export interface StockHoldingRow {
  id: string;
  user_id: string;
  symbol: string;         // e.g. "BBCA", "BBRI", "TLKM"
  company_name: string;   // e.g. "Bank Central Asia"
  shares_count: number;   // Total lembar saham (1 lot = 100 lembar)
  avg_buy_price: number;  // Rata-rata harga beli per lembar
  current_price?: number; // Harga pasar terkini per lembar (opsional/estimasi)
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type StockHoldingInsert = Omit<StockHoldingRow, "created_at" | "updated_at">;

export const DEFAULT_IDX_STOCKS = [
  { symbol: "BBCA", name: "Bank Central Asia", badge: "BCA", color: "#003B70", defaultPrice: 10125 },
  { symbol: "BBRI", name: "Bank Rakyat Indonesia", badge: "BRI", color: "#00529C", defaultPrice: 5250 },
  { symbol: "BMRI", name: "Bank Mandiri", badge: "BMRI", color: "#0A2972", defaultPrice: 6850 },
  { symbol: "TLKM", name: "Telkom Indonesia", badge: "TLKM", color: "#EE1C25", defaultPrice: 2890 },
  { symbol: "ASII", name: "Astra International", badge: "ASII", color: "#002D62", defaultPrice: 4950 },
  { symbol: "GOTO", name: "GoTo Gojek Tokopedia", badge: "GOTO", color: "#00AA13", defaultPrice: 62 },
  { symbol: "BBNI", name: "Bank Negara Indonesia", badge: "BNI", color: "#F15A24", defaultPrice: 5350 },
  { symbol: "ICBP", name: "Indofood CBP", badge: "ICBP", color: "#005696", defaultPrice: 11800 },
  { symbol: "AMMN", name: "Amman Mineral", badge: "AMMN", color: "#A87C39", defaultPrice: 9450 },
  { symbol: "ADRO", name: "Adaro Energy", badge: "ADRO", color: "#1D5F44", defaultPrice: 3600 },
];
