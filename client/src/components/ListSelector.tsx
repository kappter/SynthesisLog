import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PRESET_LISTS, PresetList } from "@shared/presets";
import { Plus, Upload, Link, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ListSelectorProps {
  onSelectList: (list: { id: string; name: string; hue: number; terms: string[] }) => void;
  isTransitionZone?: boolean;
  trigger?: React.ReactNode;
}

export function ListSelector({ onSelectList, isTransitionZone, trigger }: ListSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [customName, setCustomName] = useState("");
  const [csvText, setCsvText] = useState("");
  const [sheetUrl, setSheetUrl] = useState("");

  const importFromSheet = trpc.sheets.importFromSheet.useMutation({
    onSuccess: (data) => {
      toast.success(`Imported ${data.termCount} terms from Google Sheet`);
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handlePresetSelect = () => {
    const preset = PRESET_LISTS.find((p) => p.id === selectedPreset);
    if (preset) {
      onSelectList({
        id: preset.id,
        name: preset.name,
        hue: preset.hue,
        terms: preset.terms,
      });
      setOpen(false);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(file);
  };

  const handleCsvImport = () => {
    if (!csvText || !customName) {
      toast.error("Please provide a name and CSV content");
      return;
    }

    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l);
    if (lines.length <= 1) {
      toast.error("CSV must have a header and at least one term");
      return;
    }

    const terms = lines.slice(1); // Skip header
    const randomHue = Math.floor(Math.random() * 360);

    onSelectList({
      id: `custom-${Date.now()}`,
      name: customName,
      hue: randomHue,
      terms,
    });
    setOpen(false);
  };

  const handleSheetImport = () => {
    if (!sheetUrl || !customName) {
      toast.error("Please provide a name and Google Sheet URL");
      return;
    }

    importFromSheet.mutate({
      sheetUrl,
      name: customName,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant={isTransitionZone ? "default" : "outline"}
            className={isTransitionZone ? "animate-pulse" : ""}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isTransitionZone ? "Continue the Spiral" : "Add Term List"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {isTransitionZone ? "Continue Your Learning Spiral" : "Choose a Term List"}
          </DialogTitle>
          <DialogDescription>
            {isTransitionZone
              ? "Your current list is winding down. Select a new list to seamlessly continue your reflection journey."
              : "Select a preset list or import your own terms."}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="presets" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="presets">Presets</TabsTrigger>
            <TabsTrigger value="csv">CSV Upload</TabsTrigger>
            <TabsTrigger value="sheets">Google Sheets</TabsTrigger>
          </TabsList>

          <TabsContent value="presets" className="space-y-4">
            <ScrollArea className="h-64">
              <div className="grid grid-cols-2 gap-2 p-1">
                {PRESET_LISTS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset.id)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selectedPreset === preset.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: `oklch(0.55 0.15 ${preset.hue})` }}
                      />
                      <span className="font-medium text-sm">{preset.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {preset.terms.length} terms
                    </p>
                  </button>
                ))}
              </div>
            </ScrollArea>
            <Button
              onClick={handlePresetSelect}
              disabled={!selectedPreset}
              className="w-full"
            >
              Use Selected List
            </Button>
          </TabsContent>

          <TabsContent value="csv" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv-name">List Name</Label>
              <Input
                id="csv-name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="My Custom List"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="csv-file">CSV File</Label>
              <div className="flex gap-2">
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCsvUpload}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                CSV should have a header row and one term per line
              </p>
            </div>
            {csvText && (
              <p className="text-sm text-muted-foreground">
                Found {csvText.split(/\r?\n/).filter((l) => l.trim()).length - 1} terms
              </p>
            )}
            <Button
              onClick={handleCsvImport}
              disabled={!csvText || !customName}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
          </TabsContent>

          <TabsContent value="sheets" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sheet-name">List Name</Label>
              <Input
                id="sheet-name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="My Google Sheet List"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sheet-url">Google Sheet URL</Label>
              <Input
                id="sheet-url"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
              />
              <p className="text-xs text-muted-foreground">
                Make sure the sheet is publicly accessible (Anyone with link can view)
              </p>
            </div>
            <Button
              onClick={handleSheetImport}
              disabled={!sheetUrl || !customName || importFromSheet.isPending}
              className="w-full"
            >
              <Link className="h-4 w-4 mr-2" />
              {importFromSheet.isPending ? "Importing..." : "Import from Google Sheets"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
