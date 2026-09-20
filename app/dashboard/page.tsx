import { DashboardClient } from "@/components/dashboard/dashboard-client";

import {
  getTransactions,
  getBankAccounts,
  getAvailableTransactionCategories,
  getBudgetItems,
  getSavingsGoals,
  getUpcomingBills,
  getFinancialSummary,
  getMonthlyData,
  getCategoryExpenses,
  getRecentTransactions24h,
  getStockHoldings,
} from "@/lib/supabase/queries";

export const metadata = {
  title: "Dashboard | MoneyTracker",
};

interface DashboardPageProps {
  searchParams: Promise<{
    month?: string;
    year?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  // Ambil parameter bulan dan tahun dari URL (jika tidak ada, gunakan bulan & tahun saat ini)
  const params = await searchParams;
  const currentDate = new Date();
  
  // Format bulan dari URL biasanya string, kita ubah ke number. 
  // Catatan: JavaScript menggunakan 0 untuk Januari dan 11 untuk Desember.
  const selectedMonth = params.month ? parseInt(params.month, 10) : currentDate.getMonth();
  const selectedYear = params.year ? parseInt(params.year, 10) : currentDate.getFullYear();

  // Ambil semua data dari Supabase secara paralel
  // Operasikan selectedMonth dan selectedYear ke fungsi query yang membutuhkan filter waktu
  const [
    transactions,
    bankAccounts,
    availableCategories,
    budgetItems,
    savingsGoals,
    upcomingBills,
    summary,
    monthlyData,
    categoryExpenses,
    recentNotifications,
    stockHoldings,
  ] = await Promise.all([
    getTransactions(selectedMonth, selectedYear), // Masukkan parameter jika query Anda mendukung filter
    getBankAccounts(),
    getAvailableTransactionCategories(),
    getBudgetItems(),
    getSavingsGoals(),
    getUpcomingBills(),
    getFinancialSummary(selectedMonth, selectedYear), // Masukkan parameter
    getMonthlyData(), // Jika ini chart tren beberapa bulan, biarkan kosong atau sesuaikan
    getCategoryExpenses(selectedMonth, selectedYear), // Masukkan parameter
    getRecentTransactions24h(),
    getStockHoldings(),
  ]);

  return (
    <DashboardClient
      summary={summary}
      monthlyData={monthlyData}
      categoryExpenses={categoryExpenses}
      insights={[]}
      transactions={transactions}
      bankAccounts={bankAccounts}
      availableCategories={availableCategories}
      budgetItems={budgetItems}
      savingsGoals={savingsGoals}
      upcomingBills={upcomingBills}
      stockHoldings={stockHoldings}
      recentNotifications={recentNotifications}
      // Kirim state bulan & tahun aktif ke client untuk ditaruh di dropdown komponen
      currentMonth={selectedMonth}
      currentYear={selectedYear}
    />
  );
}
