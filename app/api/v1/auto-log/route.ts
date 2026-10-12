import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type ParsedTransaction = {
  merchant_name: string;
  amount: number;
  type: "expense" | "income";
  category: string;
  date: string;
  notes: string;
  bank_name?: string;
};

const ALLOWED_CATEGORIES = new Set([
  "food", "shopping", "transport", "bills", "entertainment", "health", "education", "other",
]);

function jsonError(message: string, status: number) {
  return Response.json({ success: false, message }, { status });
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");
  return authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? null;
}

async function resolveUserId(request: Request, bodyApiKey?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const suppliedToken = getBearerToken(request) ?? request.headers.get("x-api-key") ?? bodyApiKey ?? null;

  if (!supabaseUrl || !anonKey || !suppliedToken) return null;

  // Supabase access tokens identify their owner directly and are preferred.
  if (suppliedToken.split(".").length === 3) {
    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${suppliedToken}` } },
    });
    const { data, error } = await authClient.auth.getUser(suppliedToken);
    if (!error && data.user) return data.user.id;
    return null;
  }

  // A shared secret needs an explicit owner because it cannot identify a user.
  const configuredKey = process.env.AUTO_LOG_API_KEY;
  const configuredUserId = process.env.AUTO_LOG_USER_ID;
  if (!configuredKey || !configuredUserId || suppliedToken !== configuredKey) return null;
  return configuredUserId;
}

function extractImageInput(body: Record<string, unknown>) {
  const image = body.image ?? body.base64 ?? body.image_base64;
  if (typeof image !== "string") return null;
  const match = image.match(/^data:([^;,]+);base64,([\s\S]*)$/);
  return {
    mimeType: match?.[1] ?? (typeof body.mime_type === "string" ? body.mime_type : "image/jpeg"),
    data: (match?.[2] ?? image).replace(/\s/g, ""),
  };
}

function normalizeAmount(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.round(Math.abs(value)) : Number.NaN;
  }
  if (typeof value !== "string") return Number.NaN;

  const normalized = value.trim().toLowerCase().replace(/\s/g, "");
  const hasUnit = /(?:juta|jt|ribu|rb)\b/.test(normalized);
  const multiplier = /(?:juta|jt)\b/.test(normalized)
    ? 1_000_000
    : /(?:ribu|rb)\b/.test(normalized)
      ? 1_000
      : 1;
  let numeric = normalized
    .replace(/rp\.?|idr/g, "")
    .replace(/(?:rupiah|juta|jt|ribu|rb)\b/g, "")
    .replace(/^[+-]+/, "")
    .replace(/,-$/g, "")
    .replace(/[^\d.,]/g, "");

  if (!numeric) return Number.NaN;

  // Indonesian formatting uses dots for thousands and commas for decimals (e.g. -Rp57.000,00).
  let numericValue: number;
  if (hasUnit) {
    numericValue = Number(numeric.replace(/\.(?=\d{3}(?:,|$))/g, "").replace(",", "."));
  } else {
    numeric = numeric.replace(/[.,]\d{2}$/, "");
    numericValue = Number(numeric.replace(/[.,]/g, ""));
  }
  const amount = Math.round(numericValue * multiplier);
  return Number.isSafeInteger(amount) ? amount : Number.NaN;
}

function isInvalidSelfCapture(text: string) {
  const lower = text.toLowerCase();
  if (
    (lower.includes("ambil tangkapan layar") || lower.includes("take screenshot")) &&
    (lower.includes("ekstrak teks") || lower.includes("extract text") || lower.includes("dapatkan konten"))
  ) {
    return "Pintasan memotret layar editor Shortcuts itu sendiri, bukan layar struk. Buka layar struk pembayaran lalu jalankan pintasan (misalnya lewat Ketuk Belakang / Back Tap).";
  }
  return null;
}

function extractFallbackAmount(text: string): number {
  if (!text) return Number.NaN;

  // 1. Prioritaskan nominal setelah label Total / Jumlah / Grand Total / Tagihan / Bayar
  const labeledRegex =
    /(?:grand\s*total|total\s*(?:pembayaran|tagihan|bayar|belanja|transaksi)?|jumlah\s*(?:tagihan|bayar|pembayaran)?|amount\s*due|nominal)\s*[:=-]?\s*([-+]?\s*(?:rp\.?|idr)\s*\d[\d.,]*(?:\s*(?:juta|jt|ribu|rb))?)/gi;
  const labeledMatches = Array.from(text.matchAll(labeledRegex));
  for (let i = labeledMatches.length - 1; i >= 0; i--) {
    const candidate = normalizeAmount(labeledMatches[i][1]);
    if (Number.isSafeInteger(candidate) && candidate > 0) {
      return candidate;
    }
  }

  // 2. Fallback ke nominal dengan simbol Rp / IDR di dalam struk
  const currencyRegex = /[-+]?\s*(?:rp\.?|idr)\s*\d[\d.,]*(?:\s*(?:juta|jt|ribu|rb))?/gi;
  const currencyMatches = Array.from(text.matchAll(currencyRegex));
  for (const match of currencyMatches) {
    const candidate = normalizeAmount(match[0]);
    if (Number.isSafeInteger(candidate) && candidate >= 100) {
      return candidate;
    }
  }

  return Number.NaN;
}

async function parseWithGemini(text: string | null, image: ReturnType<typeof extractImageInput>) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY belum dikonfigurasi.");

  const today = new Date().toISOString().slice(0, 10);
  const prompt = `Analisis teks OCR atau screenshot bukti pembayaran/struk/invoice/rincian transaksi berikut untuk diekstrak ke pencatatan keuangan.

Aturan ekstraksi:
1. "amount": Ambil nominal uang transaksi sebagai integer POSITIF dalam rupiah (tanpa titik/koma dan tanpa sen desimal).
   - Contoh: "Rp50.000" -> 50000, "-Rp57.000,00" -> 57000, "Rp 25.000" -> 25000, "Rp 3,5 jt" -> 3500000.
   - Jika ada "Total", "Grand Total", "Total Pembayaran", atau "Jumlah", prioritaskan nilai "Total" atau "Jumlah" tersebut.
   - Struk atau halaman "Rincian transaksi" / "Detail Transaksi" dengan status "Selesai", "Transaksi berhasil", "Berhasil", atau "Sukses" ADALAH transaksi yang VALID, meskipun tanggalnya di masa lalu (bukan hari ini) dan meskipun nama merchant tidak tertulis di layar. JANGAN kembalikan 0 untuk rincian transaksi/struk seperti ini.
   - Jangan mengambil ID transaksi, Order ID, RRN, PAN, nomor referensi, tanggal, atau jam sebagai nominal.
2. "merchant_name": Nama merchant/tujuan/toko (contoh: "PECEL LELE CAK HARRY", "Indomaret"). Jika nama merchant tidak terlihat di layar (misalnya hanya terlihat "Rincian transaksi" dan metode pembayaran "GoPay Saldo"), isi dengan "Transaksi <nama bank/e-wallet>" (contoh: "Transaksi GoPay") atau "Transaksi".
3. "type": Gunakan "expense" untuk pembayaran/pembelian/transfer keluar (termasuk nominal bertanda minus atau pembayaran GoPay/QRIS), dan "income" hanya jika jelas uang masuk/top up masuk.
4. "category": Pilih satu dari: food, shopping, transport, bills, entertainment, health, education, other.
5. "date": Tanggal transaksi pada struk dalam format YYYY-MM-DD (contoh: "06 Okt 2026" -> "2026-10-06", "10 Okt 2026" -> "2026-10-10"). Jika tidak ada tanggal, gunakan "${today}".
6. "bank_name": Nama bank atau e-wallet sumber dana/metode pembayaran yang terlihat (contoh: "GoPay", "BRI", "BCA", "Mandiri", "DANA", "OVO", "ShopeePay", "Jago", "Blu", "SeaBank"). Jika tertulis "GoPay Saldo", isi "GoPay".
7. "notes": Ringkasan singkat (misal metode pembayaran atau ID singkat), atau string kosong.

Teks OCR:\n${text ?? "(tidak ada)"}`;
  const parts: Array<Record<string, unknown>> = [{ text: prompt }];
  if (image) parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
          responseSchema: {
            type: "OBJECT",
            properties: {
              merchant_name: { type: "STRING" },
              amount: { type: "NUMBER" },
              type: { type: "STRING", enum: ["expense", "income"] },
              category: {
                type: "STRING",
                enum: ["food", "shopping", "transport", "bills", "entertainment", "health", "education", "other"],
              },
              date: { type: "STRING" },
              notes: { type: "STRING" },
              bank_name: { type: "STRING" },
            },
            required: ["merchant_name", "amount", "type", "category", "date", "notes", "bank_name"],
          },
        },
      }),
      signal: AbortSignal.timeout(30_000),
    },
  );
  if (!response.ok) throw new Error("Gemini gagal menganalisis transaksi.");
  const result = await response.json();
  const output = result.candidates?.[0]?.content?.parts?.find((part: { text?: string }) => part.text)?.text;
  if (typeof output !== "string") throw new Error("Gemini tidak mengembalikan data transaksi.");
  const parsedJson = JSON.parse(output);
  return (Array.isArray(parsedJson) ? parsedJson[0] ?? {} : parsedJson) as Partial<ParsedTransaction>;
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let body: Record<string, unknown> = {};
    let image: ReturnType<typeof extractImageInput> = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const textValue = form.get("text");
      body.text = typeof textValue === "string" ? textValue : "";
      const file = form.get("image") ?? form.get("file");
      if (file instanceof File) {
        if (file.size > 10 * 1024 * 1024) return jsonError("Ukuran gambar maksimal 10 MB.", 413);
        const bytes = new Uint8Array(await file.arrayBuffer());
        let binary = "";
        for (const byte of bytes) binary += String.fromCharCode(byte);
        image = { mimeType: file.type || "image/jpeg", data: btoa(binary) };
      }
      body.api_key = form.get("api_key");
    } else {
      const parsed = await request.json();
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return jsonError("Body JSON tidak valid.", 400);
      body = parsed as Record<string, unknown>;
      image = extractImageInput(body);
    }

    const bodyApiKey = typeof body.api_key === "string" ? body.api_key : undefined;
    const userId = await resolveUserId(request, bodyApiKey);
    if (!userId) return jsonError("Autentikasi tidak valid.", 401);

    const text = typeof body.text === "string" ? body.text.trim().slice(0, 30_000) : "";
    if (!text && !image) return jsonError("Kirim teks OCR atau gambar transaksi.", 400);
    if (image && (!image.data || image.data.length > 14_000_000 || !/^image\/(jpeg|png|webp|heic)$/i.test(image.mimeType))) {
      return jsonError("Gambar tidak valid atau terlalu besar.", 400);
    }

    if (text) {
      const selfCaptureError = isInvalidSelfCapture(text);
      if (selfCaptureError) return jsonError(selfCaptureError, 422);
    }

    const parsed = await parseWithGemini(text || null, image);
    let amount = normalizeAmount(parsed.amount);
    if ((!Number.isSafeInteger(amount) || amount <= 0) && text) {
      amount = extractFallbackAmount(text);
    }
    const date = typeof parsed.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date)
      ? parsed.date
      : new Date().toISOString().slice(0, 10);
    const type = parsed.type === "income" ? "income" : "expense";
    const bankHint = typeof parsed.bank_name === "string" ? parsed.bank_name.trim() : "";
    const merchant = typeof parsed.merchant_name === "string" && parsed.merchant_name.trim()
      ? parsed.merchant_name.trim().slice(0, 160)
      : bankHint
        ? `Transaksi ${bankHint}`
        : "Transaksi";
    const categorySlug = typeof parsed.category === "string" && ALLOWED_CATEGORIES.has(parsed.category.toLowerCase())
      ? parsed.category.toLowerCase()
      : "other";

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      const preview = text ? ` (OCR: "${text.replace(/\s+/g, " ").slice(0, 80)}")` : "";
      return jsonError(`Nominal transaksi baru tidak terbaca jelas${preview}. Ambil screenshot struk atau notifikasi pembayaran yang memuat nominal, lalu jalankan pintasan lagi.`, 422);
    }

    const formattedAmount = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);

    // Safe preview mode for validating OCR/Gemini results without touching Supabase.
    if (body.dry_run === true) {
      return Response.json({
        success: true,
        dry_run: true,
        message: "Simulasi berhasil. Transaksi tidak disimpan dan saldo tidak diubah.",
        data: {
          merchant,
          amount,
          formatted_amount: formattedAmount,
          category: categorySlug,
          date,
          notes: typeof parsed.notes === "string" ? parsed.notes.trim().slice(0, 500) : null,
          bank: typeof parsed.bank_name === "string" ? parsed.bank_name : null,
        },
      });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) return jsonError("Konfigurasi Supabase server belum lengkap.", 500);
    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const { data: accounts, error: accountError } = await supabase
      .from("bank_accounts").select("id, name, bank_name, balance").eq("user_id", userId).order("created_at", { ascending: true });
    if (accountError) throw new Error("Gagal mengambil rekening pengguna.");
    if (!accounts?.length) return jsonError("Buat rekening atau dompet terlebih dahulu.", 422);

    const detectedBank = typeof parsed.bank_name === "string" && parsed.bank_name.trim()
      ? accounts.find((item) => `${item.name} ${item.bank_name}`.toLowerCase().includes(parsed.bank_name!.trim().toLowerCase()))
      : undefined;
    const account = detectedBank ?? accounts.find((item) => /utama|default|tunai|cash|dompet/i.test(item.name)) ?? accounts[0];
    const { data: categories } = await supabase.from("categories").select("slug, name").eq("user_id", userId).eq("type", type);
    const category = categories?.find((item) => item.slug.toLowerCase() === categorySlug)
      ?? categories?.find((item) => /^(other|lainnya)$/.test(item.slug.toLowerCase()))
      ?? null;
    const selectedCategory = category?.slug ?? categorySlug;
    const notes = typeof parsed.notes === "string" ? parsed.notes.trim().slice(0, 500) || null : null;

    const { error: insertError } = await supabase.from("transactions").insert({
      id: crypto.randomUUID(), user_id: userId, name: merchant, amount, type,
      category: selectedCategory, date, notes, bank_account_id: account.id,
    });
    if (insertError) throw new Error("Transaksi gagal disimpan.");

    const newBalance = Number(account.balance) + (type === "income" ? amount : -amount);
    const { error: balanceError } = await supabase.from("bank_accounts")
      .update({ balance: newBalance, updated_at: new Date().toISOString() }).eq("id", account.id).eq("user_id", userId);
    if (balanceError) console.error("[auto-log] Saldo rekening gagal diperbarui:", balanceError.message);

    return Response.json({
      success: true,
      message: "Transaksi berhasil dicatat!",
      data: { merchant, amount, formatted_amount: formattedAmount, category: category?.name ?? selectedCategory, bank: account.name },
    });
  } catch (error) {
    console.error("[auto-log] Request gagal:", error);
    return jsonError(error instanceof Error && error.name === "TimeoutError" ? "Analisis transaksi melewati batas waktu." : "Gagal memproses transaksi.", 500);
  }
}
