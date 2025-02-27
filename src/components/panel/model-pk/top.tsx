import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SwitchWithLabels } from "@/components/ui/switch/switch-with-label";
import { Textarea } from "@/components/ui/textarea";
import {
  AspectRatioSelector,
  type AspectRatio,
} from "@/components/ui/aspect-ratio-selector";
import { cn } from "@/lib/utils";
import { Loader2, Shuffle, Wand2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAtom } from "jotai";
import { pkStateAtom } from "@/stores/slices/pk_store";
import { languageAtom, store } from "@/stores";
import { imagePKFormAtom } from "@/stores/slices/image_form_store";
import { usePrompts } from "@/hooks/swr/use-prompts";

interface ModelPkTopProps {
  className?: string;
  onGenerate: () => Promise<void>;
}

const defaultRatios: AspectRatio[] = [
  { width: 1, height: 1, label: `1:1` },
  // { width: 2, height: 3, label: `2:3` },
  // { width: 3, height: 2, label: `3:2` },
  // { width: 3, height: 4, label: `3:4` },
  // { width: 4, height: 3, label: `4:3` },
  // { width: 9, height: 16, label: `9:16` },
  // { width: 16, height: 9, label: `16:9` },
];

export default function ModelPkTop({ className, onGenerate }: ModelPkTopProps) {
  const t = useTranslations("modelPk");
  const [pkState] = useAtom(pkStateAtom);
  const [pkForm, setPkForm] = useAtom(imagePKFormAtom);
  const { prompts, refresh } = usePrompts(1);

  const handleRandomPrompt = () => {
    if (prompts.length > 0) {
      const prompt = prompts[0];
      setPkForm((prev) => ({
        ...prev,
        prompt: prompt[store.get(languageAtom) as keyof typeof prompt],
      }));
    }
    refresh();
  };

  return (
    <div className="@container">
      <div
        className={cn(
          "flex size-full min-h-[200px] flex-col overflow-hidden rounded-lg border focus-within:border-transparent focus-within:ring-1 focus-within:ring-violet-500 @[600px]:flex-row dark:focus-within:ring-violet-500",
          className
        )}
      >
        <div className="relative min-h-[200px] flex-1 @[600px]:min-h-0">
          <Textarea
            id="model-pk-top"
            value={pkForm.prompt}
            onChange={(e) =>
              setPkForm((prev) => ({ ...prev, prompt: e.target.value }))
            }
            className="absolute inset-0 border-none pr-10 shadow-none [resize:none] focus-visible:ring-0"
            placeholder={t("promptPlaceholder")}
          />
          <Button
            size="icon"
            variant="ghost"
            className="absolute bottom-2 right-2 h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleRandomPrompt}
          >
            <Shuffle className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-col gap-4 border-t p-4 @[600px]:w-[200px] @[600px]:border-l @[600px]:border-t-0">
          <div className="space-y-1.5">
            <Label className="text-sm">{t("resolution")}</Label>
            <AspectRatioSelector
              ratios={defaultRatios}
              value={pkForm}
              onChange={(ratio) =>
                setPkForm((prev) => ({
                  ...prev,
                  width: ratio.width,
                  height: ratio.height,
                }))
              }
              placeholder={t("resolutionPlaceholder")}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="model-pk-top" className="text-sm">
              {t("optimize")}
            </Label>
            <SwitchWithLabels
              checked={pkForm.isOptimized}
              onCheckedChange={(isOptimized) =>
                setPkForm((prev) => ({ ...prev, isOptimized }))
              }
              onLabel={t("yes")}
              offLabel={t("no")}
            />
          </div>
          <Button
            onClick={onGenerate}
            className="mt-auto gap-2"
            disabled={pkState.isGenerating}
          >
            {pkState.isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("generating")}
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                {t("generate")}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
