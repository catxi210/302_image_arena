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
import { ModelSelector } from "@/components/business/model-selector";
import { generateImage } from "@/services/gen-image";
import { appConfigAtom, languageAtom, store } from "@/stores";
import { createScopedLogger } from "@/utils";
import { useAtom } from "jotai";
import { imageGenFormAtom } from "@/stores/slices/image_form_store";
import { genStateAtom } from "@/stores/slices/gen_store";
import { toast } from "sonner";
import { useHistory } from "@/hooks/db/use-gen-history";
import { useState, useEffect } from "react";
import { usePrompts } from "@/hooks/swr/use-prompts";

const logger = createScopedLogger("model-gen-top");

interface ModelGenTopProps {
  className?: string;
}

const defaultRatios: AspectRatio[] = [
  { width: 1, height: 1, label: `1:1` },
  { width: 2, height: 3, label: `2:3` },
  { width: 3, height: 2, label: `3:2` },
  { width: 3, height: 4, label: `3:4` },
  { width: 4, height: 3, label: `4:3` },
  { width: 9, height: 16, label: `9:16` },
  { width: 16, height: 9, label: `16:9` },
];

export default function ModelGenTop({ className }: ModelGenTopProps) {
  const t = useTranslations("modelGen");
  const [imageGenForm, setImageGenForm] = useAtom(imageGenFormAtom);
  const [genState, setGenState] = useAtom(genStateAtom);
  const { addHistory } = useHistory();
  const { prompts, refresh } = usePrompts(1);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (genState.isGenerating) {
      timer = setInterval(() => {
        setGenState((prev) => ({
          ...prev,
          elapsedTime: prev.elapsedTime + 1,
        }));
      }, 1000);
    } else {
      setGenState((prev) => ({ ...prev, elapsedTime: 0 }));
    }
    return () => clearInterval(timer);
  }, [genState.isGenerating, setGenState]);

  const handleModelChange = (
    value: string | string[],
    actualModel: string | string[]
  ) => {
    logger.info(`handleModelChange: display=${value}, model=${actualModel}`);
    setImageGenForm((prev) => ({
      ...prev,
      model: Array.isArray(actualModel) ? actualModel : [actualModel],
    }));
  };

  const handleRandomPrompt = () => {
    if (prompts.length > 0) {
      const prompt = prompts[0];
      setImageGenForm((prev) => ({
        ...prev,
        prompt: prompt[store.get(languageAtom) as keyof typeof prompt],
      }));
    }
    refresh();
  };

  const handleGenerate = async () => {
    const { apiKey } = store.get(appConfigAtom);
    if (!imageGenForm.width || !imageGenForm.height) {
      toast.error(t("error.no_resolution"));
      return;
    }
    if (!imageGenForm.prompt) {
      toast.error(t("error.no_prompt"));
      return;
    }
    if (!imageGenForm.model || imageGenForm.model.length === 0) {
      toast.error(t("error.no_model"));
      return;
    }

    setGenState((prev) => ({ ...prev, isGenerating: true }));
    try {
      const res = await generateImage({
        prompt: imageGenForm.prompt,
        shouldOptimize: imageGenForm.isOptimized,
        aspectRatio: `${imageGenForm.width}:${imageGenForm.height}`,
        model: imageGenForm.model,
        apiKey: apiKey || "",
      });

      logger.info(`generateImage res: `, res);
      addHistory({
        rawPrompt: imageGenForm.prompt,
        shouldOptimize: imageGenForm.isOptimized,
        aspectRatio: `${imageGenForm.width}:${imageGenForm.height}`,
        type: "gen",
        images: res.images.map((img) => ({
          base64: "data:image/png;base64," + img.image,
          prompt: img.prompt,
          model: img.model,
          status: "success",
        })),
      });
    } catch (error) {
      logger.error(`generateImage error: `, error);
      toast.error(t("error.generate_failed"));
    } finally {
      setGenState((prev) => ({ ...prev, isGenerating: false }));
    }
  };

  return (
    <div className="@container">
      <div
        className={cn(
          "flex size-full min-h-[300px] flex-col overflow-hidden rounded-lg border focus-within:border-transparent focus-within:ring-1 focus-within:ring-violet-500 @[600px]:flex-row dark:focus-within:ring-violet-500",
          className
        )}
      >
        <div className="relative min-h-[200px] flex-1 @[600px]:min-h-0">
          <Textarea
            id="model-pk-top"
            value={imageGenForm.prompt}
            onChange={(e) =>
              setImageGenForm((prev) => ({
                ...prev,
                prompt: e.target.value,
              }))
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
            <Label className="text-sm">{t("model")}</Label>
            <ModelSelector
              value={imageGenForm.model}
              onChange={(value, actualModel) =>
                handleModelChange(value, actualModel || [])
              }
              placeholder={t("modelPlaceholder")}
              multiple
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">{t("resolution")}</Label>
            <AspectRatioSelector
              ratios={defaultRatios}
              value={imageGenForm}
              onChange={(value) =>
                setImageGenForm((prev) => ({
                  ...prev,
                  width: value.width,
                  height: value.height,
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
              checked={imageGenForm.isOptimized}
              onCheckedChange={(value) =>
                setImageGenForm((prev) => ({ ...prev, isOptimized: value }))
              }
              onLabel={t("yes")}
              offLabel={t("no")}
            />
          </div>
          <Button
            onClick={handleGenerate}
            className="mt-auto gap-2"
            disabled={genState.isGenerating}
          >
            {genState.isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {genState.elapsedTime}s
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
