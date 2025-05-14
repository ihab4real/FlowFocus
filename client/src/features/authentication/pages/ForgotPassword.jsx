import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import ForgotPasswordForm from "../components/ForgotPasswordForm";

export default function ForgotPassword() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-[#6C63FF]/5">
      <header className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between p-4">
          <Logo />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <ForgotPasswordForm />
      </main>
    </div>
  );
}
