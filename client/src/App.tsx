import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import SynthesisLog from "@/pages/SynthesisLog";
import About from "@/pages/About";
import ToolReport from "@/pages/ToolReport";
import ToolStudentMaker from "@/pages/ToolStudentMaker";
import ToolTeacherBatch from "@/pages/ToolTeacherBatch";
import { Route, Switch, Link } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={SynthesisLog} />
      <Route path="/about" component={About} />
      <Route path="/tools/report" component={ToolReport} />
      <Route path="/tools/student-maker" component={ToolStudentMaker} />
      <Route path="/tools/teacher-batch" component={ToolTeacherBatch} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Footer() {
  return (
    <footer className="w-full border-t border-border/40 py-3 px-4 print:hidden">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        {/* Tool links */}
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <span className="text-[11px] text-muted-foreground/40 uppercase tracking-widest font-semibold hidden sm:inline">Tools</span>
          <Link href="/tools/report">
            <span className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-pointer hover:underline underline-offset-2">
              Report Viewer
            </span>
          </Link>
          <Link href="/tools/student-maker">
            <span className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-pointer hover:underline underline-offset-2">
              Student JSON Maker
            </span>
          </Link>
          <Link href="/tools/teacher-batch">
            <span className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-pointer hover:underline underline-offset-2">
              Teacher Batch Tool
            </span>
          </Link>
          <Link href="/about">
            <span className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-pointer hover:underline underline-offset-2">
              About
            </span>
          </Link>
        </nav>

        {/* External TOK resources */}
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <span className="text-[11px] text-muted-foreground/40 uppercase tracking-widest font-semibold hidden sm:inline">TOK Resources</span>
          <a
            href="https://kappter.github.io/portfolio/tok2.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors hover:underline underline-offset-2"
          >
            Exhibition Brainstorm
          </a>
          <a
            href="https://kappter.github.io/portfolio/tok3.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors hover:underline underline-offset-2"
          >
            Essay Brainstorm
          </a>
          <a
            href="https://kappter.github.io/portfolio/tok4.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors hover:underline underline-offset-2"
          >
            Essay Orbital Outline
          </a>
          <a
            href="https://kappter.github.io/portfolio/tok6.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors hover:underline underline-offset-2"
          >
            Common Topics Reference
          </a>
        </nav>

        {/* Attribution */}
        <p className="text-[11px] text-muted-foreground/50">
          Built by{" "}
          <a
            href="https://kappter.github.io/portfolio/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-muted-foreground transition-colors underline-offset-2 hover:underline"
          >
            Kappter
          </a>
        </p>
      </div>
    </footer>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <div className="flex flex-col min-h-screen">
            <div className="flex-1">
              <Router />
            </div>
            <Footer />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
