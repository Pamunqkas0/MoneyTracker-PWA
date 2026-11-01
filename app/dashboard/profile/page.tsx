import { createClient } from "@/lib/supabase/server";
import { ProfileClient } from "@/components/features/profile/profile-client";
import { getCategories } from "@/lib/supabase/queries";

export const metadata = {
  title: "Profil & Setelan | MoneyTracker",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Ambil metadata total jumlah baris dari masing-masing tabel di Supabase
  const [txCount, bankCount, budgetCount, categories] = await Promise.all([
    supabase.from("transactions").select("*", { count: "exact", head: true }),
    supabase.from("bank_accounts").select("*", { count: "exact", head: true }),
    supabase.from("budget_items").select("*", { count: "exact", head: true }),
    getCategories(),
  ]);

  const stats = {
    transactions: txCount.count ?? 0,
    bankAccounts: bankCount.count ?? 0,
    budgets: budgetCount.count ?? 0,
  };

  return (
    <ProfileClient
      stats={stats}
      categories={categories}
      user={{
        email: user?.email ?? "",
        name: String(user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Pengguna"),
      }}
    />
  );
}
