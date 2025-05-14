import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";
import { ThemeToggle } from "../components/ThemeToggle";
import { CheckCircle, Github, User } from "lucide-react";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import dashboardIllustration from "@/assets/dashboard-illustration.svg";
import rocketAnimation from "@/assets/rocket-animation.svg";

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between p-4">
          <Logo />
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6">
              <a
                href="#features"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Features
              </a>
              <a
                href="#demo"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Demo
              </a>
              <a
                href="#tech"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Tech Stack
              </a>
            </nav>
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Button asChild variant="outline">
                  <Link to="/dashboard">
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="outline">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild className="bg-[#6C63FF] hover:bg-[#6C63FF]/90">
                  <Link to="/register">Sign up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-b from-background to-[#6C63FF]/5">
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Organize. Focus. <span className="text-[#6C63FF]">Flow.</span>
              </h1>
              <p className="text-xl mb-8 text-muted-foreground">
                FlowFocus is a minimalist productivity dashboard for developers
                and creatives. Manage tasks, take notes, and track habits—all in
                one clutter-free workspace designed for deep work.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-[#6C63FF] hover:bg-[#6C63FF]/90"
                >
                  <Link to={isAuthenticated ? "/dashboard" : "/login"}>
                    {isAuthenticated ? "Go to Dashboard" : "Try Demo"}
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a
                    href="https://github.com/ihab4real/flowfocus"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="mr-2 h-4 w-4" /> GitHub
                  </a>
                </Button>
              </div>
            </div>
            <div className="rounded-lg border border-border shadow-lg overflow-hidden">
              <img
                src={dashboardIllustration}
                alt="FlowFocus Dashboard"
                className="w-full h-auto"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              Key Features
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                title="Task Management"
                description="Organize your work with Trello-like boards. Create tasks, set priorities, and track progress."
                icon="📋"
              />
              <FeatureCard
                title="Rich Text Notes"
                description="Capture ideas and information with our powerful rich text editor. Format text, add lists, and more."
                icon="📝"
              />
              <FeatureCard
                title="Pomodoro Timer"
                description="Stay focused with our built-in Pomodoro timer. Alternate between focused work and breaks."
                icon="⏱️"
              />
              <FeatureCard
                title="Dark Mode"
                description="Easy on the eyes. Switch between light and dark themes based on your preference."
                icon="🌙"
              />
              <FeatureCard
                title="Responsive Design"
                description="Access your workspace from any device. CamelCase works on desktop, tablet, and mobile."
                icon="📱"
              />
              <FeatureCard
                title="Open Source"
                description="Built with transparency. Contribute to the project or customize it for your needs."
                icon="🔓"
              />
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section
          id="demo"
          className="py-20 bg-gradient-to-b from-background to-[#6C63FF]/10"
        >
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">
              See FlowFocus in Action
            </h2>
            <p className="text-center text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
              Experience the seamless workflow and intuitive interface that
              helps you stay focused and productive.
            </p>
            <div className="flex justify-center">
              <div className="max-w-3xl w-full rounded-lg border border-border shadow-lg overflow-hidden bg-card">
                <img
                  src={rocketAnimation}
                  alt="FlowFocus Animation"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section id="tech" className="py-20 bg-[#6C63FF]/5">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Built With</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <TechBadge name="MongoDB" />
              <TechBadge name="Express.js" />
              <TechBadge name="React" />
              <TechBadge name="Node.js" />
              <TechBadge name="Tailwind CSS" />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center">
          <Logo />
          <p className="mt-4 text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} FlowFocus. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description, icon }) {
  return (
    <div className="bg-card p-6 rounded-lg border border-border shadow-sm hover:border-[#6C63FF]/30 transition-colors">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function TechBadge({ name }) {
  return (
    <div className="bg-card px-4 py-2 rounded-full border border-border shadow-sm flex items-center gap-2">
      <CheckCircle className="h-4 w-4 text-[#4FD1C5]" />
      <span className="font-medium">{name}</span>
    </div>
  );
}
