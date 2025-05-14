import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import ResetPasswordForm from "../components/ResetPasswordForm";

export default function ResetPassword() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-[#6C63FF]/5">
      <header className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between p-4">
          <Logo />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <ResetPasswordForm />
      </main>
    </div>
  );
}
