import { useTheme } from "./ThemeProvider";
import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/Button";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      onClick={toggleTheme}
      variant="outline"
      size="icon"
      className="rounded-full bg-background border-[#6C63FF]/30"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-[#6C63FF]" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-[#4FD1C5]" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
