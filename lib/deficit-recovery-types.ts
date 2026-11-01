export interface FlexibleBudgetRecommendation {
  category: string;
  label: string;
  color: string;
  previousSpend: number;
  currentSpend: number;
  currentLimit: number;
  proposedLimit: number;
  reductionAmount: number;
  hasExistingBudget: boolean;
}

export interface SavingsGoalRecommendation {
  name: string;
  suggestedAmount: number;
}

export interface DeficitRecoveryPlan {
  currentMonth: number;
  currentYear: number;
  previousMonth: number;
  previousYear: number;
  deficitAmount: number;
  previousIncome: number;
  previousExpenses: number;
  currentIncome: number;
  currentExpenses: number;
  recoveredAmount: number;
  recoveryPercent: number;
  dailyRecoveryTarget: number;
  flexibleBudget: FlexibleBudgetRecommendation | null;
  savingsGoal: SavingsGoalRecommendation | null;
}
