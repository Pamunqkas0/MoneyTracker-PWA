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
        `Anda bisa mencatat transaksi dengan format dasar:\n` +
        `• *Pengeluaran*: \`[nominal] [keterangan]\` -> \`25000 kopi\`\n` +
        `• *Pemasukan*: \`+[nominal] [keterangan]\` -> \`+500000 bonus\`\n\n` +
        `⚡ *Fitur Efisien (Tag Rekening & Kategori)*:\n` +
        `Anda bisa menentukan Rekening menggunakan tag *@* dan Kategori menggunakan tag *#* secara langsung di chat!\n\n` +
        `📌 *Format Lanjutan*:\n` +
        `\`[nominal] [keterangan] @[nama_rekening] #[nama_kategori]\`\n\n` +
        `✍️ *Contoh Penggunaan*:\n` +
        `• \`25000 Nasi Padang @bca #makanan\`\n` +
        `• \`12000 bayar parkir @cash #transportasi\`\n` +
        `• \`+1500000 cashback gajian @gopay #freelance\`\n\n` +
        `💡 *Catatan*:\n` +
        `- Nama rekening/kategori tidak harus ditulis lengkap, cukup kata kunci saja (misal: \`@bca\` untuk BCA Xpresi, \`#makan\` untuk Makanan).\n` +
        `- Jika tag *@* atau *#* dilewatkan, bot otomatis menggunakan rekening default Anda (misal: Uang Tunai) dan kategori "Lainnya".`;
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
    // Group 3: Sisa teks (keterangan + tag)
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
    const rawRest = match[3].trim();
    const type = isIncome ? "income" : "expense";

    if (isNaN(amount) || amount <= 0) {
      await sendTelegramMessage(chatId, "❌ Nominal transaksi harus berupa angka positif yang valid.");
      return NextResponse.json({ ok: true });
    }

    // Ekstrak tag rekening (@nama) dan kategori (#kategori)
    const accountTagMatch = rawRest.match(/@(\S+)/);
    const accountTag = accountTagMatch ? accountTagMatch[1].toLowerCase() : null;

    const categoryTagMatch = rawRest.match(/#(\S+)/);
    const categoryTag = categoryTagMatch ? categoryTagMatch[1].toLowerCase() : null;

    // Bersihkan keterangan dari tag @ dan #
    let cleanName = rawRest
      .replace(/@\S+/g, "")
      .replace(/#\S+/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanName) {
      cleanName = "Transaksi via Telegram";
    }

    // 1. Ambil rekening bank milik user
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

    // Pilih rekening default (cash/tunai)
    const defaultAccount = accounts.find(acc => 
      acc.name.toLowerCase().includes("cash") || 
      acc.name.toLowerCase().includes("tunai") ||
      acc.name.toLowerCase().includes("dompet")
    ) || accounts[0];

    let selectedAccount = defaultAccount;
    if (accountTag) {
      const matchedAcc = accounts.find(acc => 
        acc.name.toLowerCase().includes(accountTag)
      );
      if (matchedAcc) {
        selectedAccount = matchedAcc;
      }
    }

    // 2. Ambil kategori milik user
    const { data: userCategories } = await supabaseAdmin
      .from("categories")
      .select("slug, name")
      .eq("user_id", profile.id)
      .eq("type", type);

    let selectedCategory = "other"; // Default: Lainnya
    let selectedCategoryName = "Lainnya";

    if (categoryTag && userCategories) {
      const matchedCat = userCategories.find(cat => 
        cat.slug.toLowerCase() === categoryTag || 
        cat.name.toLowerCase().includes(categoryTag)
      );
      if (matchedCat) {
        selectedCategory = matchedCat.slug;
        selectedCategoryName = matchedCat.name;
      }
    }

    const transactionId = crypto.randomUUID();
    const dateToday = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // 3. Simpan Transaksi
    const { error: insertTxError } = await supabaseAdmin
      .from("transactions")
      .insert({
        id: transactionId,
        user_id: profile.id,
        name: cleanName,
        amount: amount,
        type: type,
        category: selectedCategory,
        date: dateToday,
        bank_account_id: selectedAccount.id,
        notes: "Dicatat otomatis via Telegram Bot",
      });

    if (insertTxError) {
      console.error("Error inserting transaction via Telegram:", insertTxError);
      await sendTelegramMessage(chatId, `❌ Gagal mencatat transaksi: ${insertTxError.message}`);
      return NextResponse.json({ ok: true });
    }

    // 4. Update Saldo Rekening (applyAccountDelta)
    const delta = type === "income" ? amount : -amount;
    const newBalance = Number(selectedAccount.balance) + delta;

    const { error: updateAccError } = await supabaseAdmin
      .from("bank_accounts")
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedAccount.id);

    if (updateAccError) {
      console.error("Error updating account balance:", updateAccError);
    }

    // 5. Update Budget spent jika tipe pengeluaran (applyBudgetDelta)
    if (type === "expense") {
      const { data: budget } = await supabaseAdmin
        .from("budget_items")
        .select("id, spent")
        .eq("user_id", profile.id)
        .eq("category", selectedCategory)
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
      `📝 *Keterangan*: ${cleanName}\n` +
      `🏷️ *Kategori*: ${selectedCategoryName}\n` +
      `💵 *Nominal*: *${formattedAmount}*\n` +
      `💳 *Rekening*: ${selectedAccount.name}\n\n` +
      `_Catatan berhasil disimpan ke dalam MoneyTracker Anda._`
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Telegram Webhook Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
