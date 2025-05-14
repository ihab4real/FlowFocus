import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import RegisterForm from "../components/RegisterForm";

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Redirect to the page they were trying to access, or dashboard as fallback
      const from = location.state?.from || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleRegisterSuccess = () => {
    // Redirect to the page they were trying to access, or dashboard as fallback
    const from = location.state?.from || "/dashboard";
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-[#6C63FF]/5">
      <header className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between p-4">
          <Logo />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <RegisterForm onSuccess={handleRegisterSuccess} />
      </main>
    </div>
  );
}
