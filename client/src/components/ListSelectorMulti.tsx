import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PRESET_LISTS, PresetList } from "@shared/presets";
import { Plus, Upload, Link, Sparkles, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  SPIRAL_MODE_LABELS,
  SPIRAL_MODE_DESCRIPTIONS,
  type SpiralMode,
} from "@shared/spiralTypes";
import type { ReflectionDepth } from "@shared/reflectionDepth";
import { DepthSelector } from "@/components/DepthSelector";
import { isStaticMode } from "@/lib/staticMode";
import { getGoogleSheetCsvUrl, parseTermCsv } from "@shared/googleSheetsClient";

interface ListSelectorMultiProps {
  onSelectLists: (
    lists: Array<{ id: string; name: string; hue: number; terms: string[] }>,
    mode: SpiralMode,
    depth: ReflectionDepth
  ) => void;
  isTransitionZone?: boolean;
  trigger?: React.ReactNode;
}

export function ListSelectorMulti({
  onSelectLists,
  isTransitionZone,
  trigger,
}: ListSelectorMultiProps) {
  const staticMode = isStaticMode();
  const [open, setOpen] = useState(false);
  const [selectedPresets, setSelectedPresets] = useState<Set<string>>(new Set());
  const [spiralMode, setSpiralMode] = useState<SpiralMode>("shuffled");
  const [reflectionDepth, setReflectionDepth] = useState<ReflectionDepth>(4);
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

  const togglePreset = (id: string) => {
    const newSelected = new Set(selectedPresets);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPresets(newSelected);
  };

  const handlePresetSelect = () => {
    if (selectedPresets.size === 0) {
      toast.error("Please select at least one list");
      return;
    }

    const lists = Array.from(selectedPresets)
      .map((id) => PRESET_LISTS.find((p) => p.id === id))
      .filter((p): p is PresetList => p !== undefined)
      .map((p) => ({
        id: p.id,
        name: p.name,
        hue: p.hue,
        terms: p.terms,
      }));

    onSelectLists(lists, spiralMode, reflectionDepth);
    setOpen(false);
    setSelectedPresets(new Set());
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

    onSelectLists(
      [
        {
          id: `custom-${Date.now()}`,
          name: customName,
          hue: randomHue,
          terms,
        },
      ],
      spiralMode,
      reflectionDepth
    );
    setOpen(false);
  };

  const handleSheetImport = () => {
    if (!sheetUrl || !customName) {
      toast.error("Please provide a name and Google Sheet URL");
      return;
    }

    if (!staticMode) {
      importFromSheet.mutate({
      sheetUrl,
      name: customName,
      });
      return;
    }

    void (async () => {
      try {
        const response = await fetch(getGoogleSheetCsvUrl(sheetUrl));
        if (!response.ok) throw new Error("The published CSV could not be loaded.");
        const terms = parseTermCsv(await response.text());
        onSelectLists([{ id: `sheet-${Date.now()}`, name: customName, hue: Math.floor(Math.random() * 360), terms }], spiralMode, reflectionDepth);
        setOpen(false);
        toast.success(`Imported ${terms.length} terms from Google Sheets.`);
      } catch {
        toast.error("Google Sheets direct import needs a publicly published, CORS-enabled CSV. Use CSV Upload if this Sheet blocks browser access.");
      }
    })();
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {isTransitionZone
              ? "Continue Your Learning Spiral"
              : "Choose Term Lists"}
          </DialogTitle>
          <DialogDescription>
            {isTransitionZone
              ? "Your current list is winding down. Select one or more lists to continue."
              : "Select one or more preset lists or import your own terms."}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="presets" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="presets">Presets</TabsTrigger>
            <TabsTrigger value="csv">CSV Upload</TabsTrigger>
            <TabsTrigger value="sheets">Google Sheets</TabsTrigger>
          </TabsList>

          <TabsContent value="presets" className="flex-1 flex flex-col gap-4 min-h-0">
            {/* Mode Selector */}
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
              <Label className="text-sm font-semibold">Spiral Mode</Label>
              <RadioGroup
                value={spiralMode}
                onValueChange={(v) => setSpiralMode(v as SpiralMode)}
                className="grid grid-cols-3 gap-2"
              >
                 {(["sequential", "shuffled", "blended"] as SpiralMode[]).map((mode) => (
                  <label
                    key={mode}
                    htmlFor={`spiral-mode-${mode}`}
                    className={cn(
                      "flex items-center space-x-2 p-2 rounded border cursor-pointer transition-colors",
                      spiralMode === mode
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <RadioGroupItem value={mode} id={`spiral-mode-${mode}`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {SPIRAL_MODE_LABELS[mode]}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {SPIRAL_MODE_DESCRIPTIONS[mode]}
                      </div>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {/* Depth Selector */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <DepthSelector value={reflectionDepth} onChange={setReflectionDepth} />
            </div>

            {/* List Selection */}
            <ScrollArea className="flex-1 max-h-[300px]">
              <div className="grid grid-cols-2 gap-2 p-1">
                {PRESET_LISTS.map((preset) => {
                  const isSelected = selectedPresets.has(preset.id);
                  return (
                    <button
                      key={preset.id}
                      onClick={() => togglePreset(preset.id)}
                      className={cn(
                        "p-3 rounded-lg border-2 text-left transition-all relative",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{
                            backgroundColor: `oklch(0.55 0.15 ${preset.hue})`,
                          }}
                        />
                        <span className="font-medium text-sm">{preset.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {preset.terms.length} terms
                      </p>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">
                {selectedPresets.size} list{selectedPresets.size !== 1 ? "s" : ""}{" "}
                selected
              </span>
              <Button
                onClick={handlePresetSelect}
                disabled={selectedPresets.size === 0}
              >
                Start Spiral
              </Button>
            </div>
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
                Found {csvText.split(/\r?\n/).filter((l) => l.trim()).length - 1}{" "}
                terms
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
                {staticMode ? "Static mode fetches a publicly published, CORS-enabled CSV directly. If it is blocked, download the CSV and use CSV Upload." : "Make sure the sheet is publicly accessible (Anyone with link can view)"}
              </p>
            </div>
            <Button
              onClick={handleSheetImport}
              disabled={!sheetUrl || !customName || importFromSheet.isPending}
              className="w-full"
            >
              <Link className="h-4 w-4 mr-2" />
              {importFromSheet.isPending
                ? "Importing..."
                : "Import from Google Sheets"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
