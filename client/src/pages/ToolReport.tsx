import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, FileText } from "lucide-react";
import { appBasePath } from "@/lib/staticMode";

export default function ToolReport() {
  return (
    <div className="flex flex-col min-h-screen bg-[#faf8f5] text-[#2c2c2c]">
      {/* Header */}
      <header className="border-b border-[#e0d8cc] bg-white/80 backdrop-blur sticky top-0 z-10 print:hidden">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-[#7a6a55]">
              <ArrowLeft className="w-4 h-4" />
              Back to App
            </Button>
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-[#b08060] shrink-0" />
            <span className="text-sm font-semibold text-[#2c2c2c] truncate">TOK Spiral Reflection Report</span>
            <span className="hidden sm:inline text-xs text-[#8a7a6a] ml-1">— load a JSON to generate a print-ready report</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/tools/student-maker">
              <Button variant="outline" size="sm" className="gap-1 text-xs border-[#e0d8cc] text-[#7a6a55] hover:bg-[#f0e8dc]">
                Student Maker
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
            <Link href="/tools/teacher-batch">
              <Button variant="outline" size="sm" className="gap-1 text-xs border-[#e0d8cc] text-[#7a6a55] hover:bg-[#f0e8dc]">
                Teacher Batch
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Iframe fills remaining viewport */}
      <div className="flex-1 flex flex-col">
        <iframe
          src={`${appBasePath()}tools/report/index.html`}
          title="TOK Spiral Reflection Report"
          className="flex-1 w-full border-0"
          style={{ minHeight: "calc(100vh - 57px)" }}
        />
      </div>
    </div>
  );
}
