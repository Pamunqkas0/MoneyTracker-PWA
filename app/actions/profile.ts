"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedUserId } from "./_shared";

export async function getTelegramStatus() {
  const { supabase, userId } = await getAuthenticatedUserId();

  if (!userId) {
    return { success: false, error: "Anda harus login terlebih dahulu." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error } = await (supabase as any)
    .from("profiles")
    .select("telegram_chat_id, telegram_pairing_code, telegram_pairing_expires_at")
    .eq("id", userId)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  const isConnected = !!profile?.telegram_chat_id;
  const isCodeActive = profile?.telegram_pairing_code && profile?.telegram_pairing_expires_at 
    ? new Date(profile.telegram_pairing_expires_at) > new Date()
    : false;

  return {
    success: true,
    isConnected,
    telegramChatId: profile?.telegram_chat_id || null,
    pairingCode: isCodeActive ? profile?.telegram_pairing_code : null,
  };
}

export async function generateTelegramPairingCode() {
  const { supabase, userId } = await getAuthenticatedUserId();

  if (!userId) {
    return { success: false, error: "Anda harus login terlebih dahulu." };
  }

  // Generate 6-digit random code: MT-XXXXXX
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  const code = `MT-${randomNum}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 menit

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("profiles")
    .update({
      telegram_pairing_code: code,
      telegram_pairing_expires_at: expiresAt,
    })
    .eq("id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, code };
}

export async function disconnectTelegram() {
  const { supabase, userId } = await getAuthenticatedUserId();

  if (!userId) {
    return { success: false, error: "Anda harus login terlebih dahulu." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("profiles")
    .update({
      telegram_chat_id: null,
      telegram_pairing_code: null,
      telegram_pairing_expires_at: null,
    })
    .eq("id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/profile");
  return { success: true };
}

// ── Stock Portfolio Holdings Actions ────────────────────────────────────────
