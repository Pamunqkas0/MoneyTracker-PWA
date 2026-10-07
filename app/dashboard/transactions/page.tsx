import { getTransactions, getBankAccounts, getAvailableTransactionCategories } from "@/lib/supabase/queries";
import { TransactionsClient } from "@/components/dashboard/transactions-client";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Riwayat Transaksi | MoneyTracker",
};

interface TransactionsPageProps {
  searchParams: Promise<{
    month?: string;
    year?: string;
  }>;
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const username = user?.email?.split("@")[0] || "Pengguna";
  const name = String(user?.user_metadata?.full_name ?? "").trim() || username;

  // Ambil parameter bulan dan tahun dari URL (jika tidak ada, gunakan bulan & tahun saat ini)
  const params = await searchParams;
  const currentDate = new Date();

  const selectedMonth = params.month ? parseInt(params.month, 10) : currentDate.getMonth();
  const selectedYear = params.year ? parseInt(params.year, 10) : currentDate.getFullYear();

  // Ambil transaksi berdasarkan bulan dan tahun yang dipilih
  const [transactions, bankAccounts, availableCategories] = await Promise.all([
    getTransactions(selectedMonth, selectedYear, 250),
    getBankAccounts(),
    getAvailableTransactionCategories(),
  ]);

  return (
    <TransactionsClient
      name={name}
      username={username}
      initialTransactions={transactions}
      bankAccounts={bankAccounts}
      availableCategories={availableCategories}
      currentMonth={selectedMonth}
      currentYear={selectedYear}
    />
  );
}
