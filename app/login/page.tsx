import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Login | MoneyTracker",
};

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F7F4EE] px-4 py-10 dark:bg-[#0b0f1a]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-28 h-80 w-80 rounded-full bg-brand-orange/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 -right-20 h-96 w-96 rounded-full bg-pastel-yellow/10 blur-3xl" />
      <div className="relative z-10 w-full max-w-md">
        <AuthForm />
      </div>
    </main>
  );
}
