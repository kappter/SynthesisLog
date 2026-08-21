import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ReflectionDepth } from "@shared/reflectionDepth";
import { DEPTH_NAMES, DEPTH_DESCRIPTIONS } from "@shared/reflectionDepth";

interface DepthSelectorProps {
  value: ReflectionDepth;
  onChange: (depth: ReflectionDepth) => void;
}

export function DepthSelector({ value, onChange }: DepthSelectorProps) {
  const depths: ReflectionDepth[] = [2, 3, 4, 5];

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Reflection Depth</div>
      <RadioGroup
        value={value.toString()}
        onValueChange={(v) => onChange(parseInt(v) as ReflectionDepth)}
      >
        {depths.map((depth) => (
          <div key={depth} className="flex items-start space-x-3 space-y-0">
            <RadioGroupItem value={depth.toString()} id={`depth-${depth}`} />
            <Label
              htmlFor={`depth-${depth}`}
              className="font-normal cursor-pointer flex-1"
            >
              <div className="font-medium">{DEPTH_NAMES[depth]}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {DEPTH_DESCRIPTIONS[depth]}
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
