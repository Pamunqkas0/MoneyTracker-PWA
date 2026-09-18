"use server";

import { createClient } from "@/lib/supabase/server";

export interface ParsedReceiptResult {
  merchant_name: string;
  total_amount: number;
  date: string;
  category: string;
  items_summary: string;
  confidence_note?: string;
}

export type ScanReceiptResponse =
  | { success: true; data: ParsedReceiptResult }
  | { success: false; error: string };

export async function scanReceiptAction(
  base64Data: string,
  mimeType = "image/jpeg"
): Promise<ScanReceiptResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Anda harus login terlebih dahulu." };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: "GEMINI_API_KEY belum dikonfigurasi di server environment.",
      };
    }

    if (!base64Data || base64Data.trim().length === 0) {
      return { success: false, error: "Data gambar struk tidak valid." };
    }

    const todayDate = new Date().toISOString().split("T")[0];

    const prompt = `
Anda adalah sistem AI OCR dan analisis struk/nota belanja pintar untuk aplikasi pencatatan keuangan MoneyTracker.
Tugas Anda adalah membaca gambar struk/nota/invoice belanjaan ini dan mengekstrak informasi detail transaksi.

Instruksi Analisis:
1. "merchant_name": Nama toko, restoran, minimarket, merchant, atau penyedia layanan (misal: "Indomaret", "Alfamart", "Starbucks", "Super Indo", "SPBU Pertamina", "PLN", "Tokopedia"). Jika tidak terbaca, gunakan "Belanja Struk".
2. "total_amount": Angka nominal total akhir yang dibayarkan (Grand Total / Total Bayar / Total Belanja). Harus berupa bilangan bulat positif (number) murni tanpa simbol Rp, titik ribuan, atau koma desimal.
3. "date": Tanggal transaksi dalam format "YYYY-MM-DD" (contoh: "${todayDate}"). Jika tahun tidak ada di struk, gunakan tahun saat ini. Jika tanggal sama sekali tidak terbaca, gunakan "${todayDate}".
4. "category": Tentukan kategori yang paling tepat dari pilihan berikut:
   - "food" (makanan, minuman, resto, cafe, jajanan)
   - "shopping" (belanja harian, supermarket, minimarket kebutuhan rumah, pakaian, elektronik)
   - "transport" (bensin, parkir, tol, ojek online, tiket transportasi)
   - "bills" (listrik, air, internet, langganan pulsa, tagihan rutin)
   - "entertainment" (bioskop, game, rekreasi, liburan)
   - "health" (obat, apotek, dokter, suplemen, RS)
   - "other" (jika tidak masuk ke kategori di atas)
5. "items_summary": Buat ringkasan ringkas daftar item barang/menu yang dibeli beserta kuantitasnya jika terlihat (maksimal 3-5 item teratas, contoh: "2x Kopi Susu, 1x Donat Cokelat").
6. "confidence_note": Catatan singkat jika ada angka yang buram atau kurang jelas.

Format output HARUS berupa JSON object dengan struktur:
{
  "merchant_name": string,
  "total_amount": number,
  "date": string,
  "category": string,
  "items_summary": string,
  "confidence_note": string
}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
                {
                  inlineData: {
                    mimeType: mimeType || "image/jpeg",
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                merchant_name: { type: "STRING" },
                total_amount: { type: "NUMBER" },
                date: { type: "STRING" },
                category: {
                  type: "STRING",
                  enum: [
                    "food",
                    "shopping",
                    "transport",
                    "bills",
                    "entertainment",
                    "health",
                    "other",
                  ],
                },
                items_summary: { type: "STRING" },
                confidence_note: { type: "STRING" },
              },
              required: [
                "merchant_name",
                "total_amount",
                "date",
                "category",
                "items_summary",
              ],
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Gemini OCR API Error:", response.statusText, errorData);
      const specificMessage =
        errorData?.error?.message || response.statusText;
      return {
        success: false,
        error: `Gagal memproses struk dengan AI: ${specificMessage}`,
      };
    }

    const result = await response.json();
    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      return {
        success: false,
        error: "AI tidak dapat membaca teks pada gambar struk.",
      };
    }

    const parsed: ParsedReceiptResult = JSON.parse(responseText);

    // Validasi & sanitasi data hasil parsing
    const totalAmount = Math.round(Number(parsed.total_amount)) || 0;
    const safeDate =
      parsed.date && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date)
        ? parsed.date
        : todayDate;

    return {
      success: true,
      data: {
        merchant_name: parsed.merchant_name?.trim() || "Struk Belanja",
        total_amount: totalAmount,
        date: safeDate,
        category: parsed.category || "shopping",
        items_summary: parsed.items_summary?.trim() || "",
        confidence_note: parsed.confidence_note || "",
      },
    };
  } catch (error) {
    console.error("Error in scanReceiptAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat memindai struk belanja.",
    };
  }
}
