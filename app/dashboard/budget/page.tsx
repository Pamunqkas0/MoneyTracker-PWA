import { getAvailableTransactionCategories, getBudgetItems, getSavingsGoals } from "@/lib/supabase/queries";
import { BudgetClient } from "@/components/dashboard/budget-client";

export const metadata = {
  title: "Savings & Anggaran | MoneyTracker",
};

interface BudgetPageProps {
  searchParams: Promise<{
    month?: string;
    year?: string;
  }>;
}

export default async function BudgetPage({ searchParams }: BudgetPageProps) {
  // Ambil parameter bulan dan tahun dari URL (jika tidak ada, gunakan bulan & tahun saat ini)
  const params = await searchParams;
  const currentDate = new Date();

  const selectedMonth = params.month ? parseInt(params.month, 10) : currentDate.getMonth();
  const selectedYear = params.year ? parseInt(params.year, 10) : currentDate.getFullYear();

  // Ambil budget items, available categories, dan savings goals secara paralel
  const [budgetItems, availableCategories, savingsGoals] = await Promise.all([
    getBudgetItems(selectedMonth, selectedYear),
    getAvailableTransactionCategories(),
    getSavingsGoals(),
  ]);

  return (
    <BudgetClient
      initialBudgets={budgetItems}
      availableCategories={availableCategories}
      savingsGoals={savingsGoals}
      currentMonth={selectedMonth}
      currentYear={selectedYear}
    />
  );
}

