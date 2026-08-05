import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Helper function untuk mengirim pesan balasan ke Telegram
async function sendTelegramMessage(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("TELEGRAM_BOT_TOKEN is not defined in environment variables.");
    return;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown",
      }),
    });
    if (!res.ok) {
      console.error("Gagal mengirim pesan Telegram:", await res.text());
    }
  } catch (err) {
    console.error("Error sending Telegram message:", err);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Pastikan payload memiliki pesan teks
    if (!body.message || !body.message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = body.message.chat.id;
    const text = body.message.text.trim();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase environment variables are missing (URL or Service Role Key).");
      await sendTelegramMessage(chatId, "⚠️ Sistem sedang mengalami kendala konfigurasi. Silakan hubungi admin.");
      return NextResponse.json({ ok: true });
    }

    // Buat Supabase Admin client untuk bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    });

    // ── KASUS 1: Perintah Pendaftaran / Pairing (/start <kode>) ─────────────────
    if (text.startsWith("/start")) {
      const parts = text.split(/\s+/);
      if (parts.length > 1) {
        const pairingCode = parts[1].trim();

        // Cari user yang memiliki pairing code ini dan belum kedaluwarsa
        const { data: profile, error: findError } = await supabaseAdmin
          .from("profiles")
          .select("id, full_name, email, telegram_pairing_expires_at")
          .eq("telegram_pairing_code", pairingCode)
          .maybeSingle();

        if (findError || !profile) {
          await sendTelegramMessage(
            chatId,
            "❌ *Kode pairing tidak valid.*\nSilakan generate kode baru dari halaman Setelan Profil di MoneyTracker."
          );
          return NextResponse.json({ ok: true });
        }

        // Cek kedaluwarsa
        const expiresAt = new Date(profile.telegram_pairing_expires_at);
        if (expiresAt < new Date()) {
          await sendTelegramMessage(
            chatId,
            "❌ *Kode pairing telah kedaluwarsa (aktif 10 menit).*\nSilakan generate ulang kode baru dari web."
          );
          return NextResponse.json({ ok: true });
        }

        // Simpan chat_id ke profil dan hapus kode pairing
        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({
            telegram_chat_id: chatId.toString(),
            telegram_pairing_code: null,
            telegram_pairing_expires_at: null,
          })
          .eq("id", profile.id);

        if (updateError) {
          console.error("Error updating profile with telegram chat id:", updateError);
          await sendTelegramMessage(chatId, "❌ Gagal menghubungkan Telegram ke akun Anda. Silakan coba beberapa saat lagi.");
        } else {
          const userName = profile.full_name || profile.email?.split("@")[0] || "Pengguna";
          await sendTelegramMessage(
            chatId,
            `🎉 *Koneksi Berhasil!*\n\nHalo *${userName}*, akun Telegram Anda sekarang telah terhubung dengan MoneyTracker.\n\nSekarang Anda sudah bisa langsung mencatat transaksi via chat.`
          );
        }
        return NextResponse.json({ ok: true });
      }
    }

    // ── KASUS 2: Bantuan (/help) atau /start tanpa kode ────────────────────────
    if (text === "/help" || text === "/start") {
      const helpText = 
        `💡 *Panduan Penggunaan MoneyTracker Bot*\n\n` +
        `Anda bisa mencatat transaksi dengan format sederhana berikut:\n\n` +
        `💸 *Catat Pengeluaran (Expense)*\n` +
        `Format: \`[nominal] [nama_barang]\`\n` +
        `Contoh: \`25000 kopi susu hangat\`\n\n` +
        `💰 *Catat Pemasukan (Income)*\n` +
        `Format: \`+[nominal] [nama_sumber]\`\n` +
        `Contoh: \`+500000 bonus project\`\n\n` +
        `✍️ *Catatan*:\n` +
        `- Penggunaan titik/koma pada angka diperbolehkan (misal: \`25.000\` atau \`25,000\`).\n` +
        `- Transaksi akan otomatis dicatat ke rekening default (biasanya "Uang Tunai" atau rekening pertama Anda).\n` +
        `- Kategori transaksi akan otomatis masuk ke kategori "Lainnya" (dapat Anda ganti sewaktu-waktu di web dashboard).`;
      await sendTelegramMessage(chatId, helpText);
      return NextResponse.json({ ok: true });
    }

    // ── KASUS 3: Transaksi (Teks biasa, misal: "25000 kopi" atau "+500000 bonus") ──
    
    // Cari profil user berdasarkan telegram_chat_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .eq("telegram_chat_id", chatId.toString())
      .maybeSingle();

    if (profileError || !profile) {
      await sendTelegramMessage(
        chatId,
        "⚠️ *Telegram Anda belum terhubung.*\n\nSilakan masuk ke halaman *Setelan Profil* di web MoneyTracker, klik 'Hubungkan Telegram', lalu ikuti petunjuknya."
      );
      return NextResponse.json({ ok: true });
    }

    // Regex parser: 
    // Group 1: Tanda + opsional (menandakan pemasukan)
    // Group 2: Angka nominal (bisa menggunakan pemisah titik/koma)
    // Group 3: Nama barang/keterangan transaksi
    const txRegex = /^(\+)?([\d.,]+)\s+(.+)$/;
    const match = text.match(txRegex);

    if (!match) {
      await sendTelegramMessage(
        chatId,
        "🤔 *Format tidak dikenali.*\n\nGunakan format:\n- \`[nominal] [nama]\` untuk pengeluaran.\n- \`+[nominal] [nama]\` untuk pemasukan.\n\nContoh: \`15000 nasi uduk\` atau \`+1000000 gaji bulanan\`"
      );
      return NextResponse.json({ ok: true });
    }

    const isIncome = !!match[1];
    const amountRaw = match[2].replace(/[.,]/g, ""); // Hapus titik dan koma pembatas ribuan
    const amount = parseFloat(amountRaw);
    const name = match[3].trim();
    const type = isIncome ? "income" : "expense";
    const category = "other"; // Default: Lainnya

    if (isNaN(amount) || amount <= 0) {
      await sendTelegramMessage(chatId, "❌ Nominal transaksi harus berupa angka positif yang valid.");
      return NextResponse.json({ ok: true });
    }

    // 1. Ambil rekening bank milik user (default gunakan cash/rekening pertama)
    const { data: accounts, error: accountError } = await supabaseAdmin
      .from("bank_accounts")
      .select("id, name, balance")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: true });

    if (accountError || !accounts || accounts.length === 0) {
      await sendTelegramMessage(
        chatId,
        "❌ Anda belum memiliki Rekening/Dompet. Silakan buat minimal 1 rekening (misal: Uang Tunai) di web dashboard."
      );
      return NextResponse.json({ ok: true });
    }

    // Pilih rekening "cash" atau "tunai" jika ada, jika tidak gunakan yang pertama
    const defaultAccount = accounts.find(acc => 
      acc.name.toLowerCase().includes("cash") || 
      acc.name.toLowerCase().includes("tunai") ||
      acc.name.toLowerCase().includes("dompet")
    ) || accounts[0];

    const transactionId = crypto.randomUUID();
    const dateToday = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // 2. Simpan Transaksi
    const { error: insertTxError } = await supabaseAdmin
      .from("transactions")
      .insert({
        id: transactionId,
        user_id: profile.id,
        name: name,
        amount: amount,
        type: type,
        category: category,
        date: dateToday,
        bank_account_id: defaultAccount.id,
        notes: "Dicatat otomatis via Telegram Bot",
      });

    if (insertTxError) {
      console.error("Error inserting transaction via Telegram:", insertTxError);
      await sendTelegramMessage(chatId, `❌ Gagal mencatat transaksi: ${insertTxError.message}`);
      return NextResponse.json({ ok: true });
    }

    // 3. Update Saldo Rekening (applyAccountDelta)
    const delta = type === "income" ? amount : -amount;
    const newBalance = Number(defaultAccount.balance) + delta;

    const { error: updateAccError } = await supabaseAdmin
      .from("bank_accounts")
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", defaultAccount.id);

    if (updateAccError) {
      console.error("Error updating account balance:", updateAccError);
      // Tetap lanjutkan karena transaksi sudah berhasil diinsert
    }

    // 4. Update Budget spent jika tipe pengeluaran (applyBudgetDelta)
    if (type === "expense") {
      const { data: budget } = await supabaseAdmin
        .from("budget_items")
        .select("id, spent")
        .eq("user_id", profile.id)
        .eq("category", category)
        .maybeSingle();

      if (budget) {
        const newSpent = Math.max(0, Number(budget.spent) + amount);
        await supabaseAdmin
          .from("budget_items")
          .update({ spent: newSpent })
          .eq("id", budget.id);
      }
    }

    // Kirim pesan sukses
    const formattedAmount = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);

    const typeEmoji = type === "income" ? "💰 Pemasukan" : "💸 Pengeluaran";
    
    await sendTelegramMessage(
      chatId,
      `✅ *Transaksi Berhasil Dicatat!*\n\n` +
      `📌 *Jenis*: ${typeEmoji}\n` +
      `📝 *Keterangan*: ${name}\n` +
      `💵 *Nominal*: *${formattedAmount}*\n` +
      `💳 *Rekening*: ${defaultAccount.name}\n\n` +
      `_Catatan berhasil disimpan ke dalam MoneyTracker Anda._`
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Telegram Webhook Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
