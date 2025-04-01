import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";
import { ThemeToggle } from "../components/ThemeToggle";
import { CheckCircle, Github } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between p-4">
          <Logo />
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="#features"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Features
              </Link>
              <Link
                to="#demo"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Demo
              </Link>
              <Link
                to="#tech"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Tech Stack
              </Link>
            </nav>
            <ThemeToggle />
            <button className="btn btn-primary">
              <Link to="/dashboard">Try Demo</Link>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-b from-background to-primary/5">
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Organize. Focus. <span className="text-primary">Flow.</span>
              </h1>
              <p className="text-xl mb-8 text-muted-foreground">
                CamelCase is a minimalist productivity dashboard for developers
                and creatives. Manage tasks, take notes, and track habits—all in
                one clutter-free workspace designed for deep work.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/dashboard" className="btn btn-primary">
                  Try Demo
                </Link>
                <a
                  href="https://github.com/yourusername/camelcase"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                >
                  <Github className="mr-2 h-4 w-4" /> GitHub
                </a>
              </div>
            </div>
            <div className="rounded-lg border border-border shadow-lg overflow-hidden">
              <img
                src="/placeholder.svg"
                alt="CamelCase Dashboard"
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

        {/* Tech Stack Section */}
        <section id="tech" className="py-20 bg-primary/5">
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
            &copy; {new Date().getFullYear()} CamelCase. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description, icon }) {
  return (
    <div className="card p-6 hover:border-primary/30 transition-colors">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function TechBadge({ name }) {
  return (
    <div className="card px-4 py-2 rounded-full flex items-center gap-2">
      <CheckCircle className="h-4 w-4 text-primary" />
      <span className="font-medium">{name}</span>
    </div>
  );
}
