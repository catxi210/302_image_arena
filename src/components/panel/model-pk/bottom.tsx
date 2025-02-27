import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  SkipForward,
  ArrowLeftFromLine,
  ArrowRightFromLine,
  Download,
  Loader2,
  Medal,
} from "lucide-react";
import { ModelSelector } from "@/components/business/model-selector";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { createScopedLogger } from "@/utils";
import { getModelById, getRandomModel } from "@/constants/models";
import { useAtom, useAtomValue } from "jotai";
import { pkStateAtom } from "@/stores/slices/pk_store";
import { imagePKFormAtom } from "@/stores/slices/image_form_store";
import { motion } from "framer-motion";
import { GalleryModal } from "@/components/ui/gallery/gallery-modal";
import type { MediaItemType } from "@/components/ui/gallery/gallery";
import { useHistory } from "@/hooks/db/use-gen-history";
import { useMonitorMessage } from "@/hooks/global/use-monitor-message";
import { IconButton } from "@/components/ui/icon-button";

const logger = createScopedLogger("model-pk-bottom");

interface ModelPkBottomProps {
  className?: string;
  updateCloudConfig: (winner: number) => Promise<void>;
}

export default function ModelPkBottom({
  className,
  updateCloudConfig,
}: ModelPkBottomProps) {
  const t = useTranslations("modelPk");
  const pkState = useAtomValue(pkStateAtom);
  const [pkForm, setPkForm] = useAtom(imagePKFormAtom);
  const [selectedImage, setSelectedImage] = useState<MediaItemType | null>(
    null
  );
  const { history, updateHistory } = useHistory();
  const { handleDownload } = useMonitorMessage();

  // Get current PK history record
  const currentPkHistory = history?.items?.find(
    (h) => h.id === pkState.historyId
  );
  const leftImage = currentPkHistory?.images?.[0];
  const rightImage = currentPkHistory?.images?.[1];
  const hasVoted = currentPkHistory?.winner !== undefined;
  const winner = currentPkHistory?.winner;

  const handleModelChange = (
    side: "left" | "right",
    value: string | string[],
    actualModel: string | string[] | undefined
  ) => {
    const displayValue = Array.isArray(value) ? value[0] : value;
    const modelValue = actualModel
      ? Array.isArray(actualModel)
        ? actualModel[0]
        : actualModel
      : displayValue;

    logger.info(
      `handleModelChange: side=${side}, display=${displayValue}, model=${modelValue}`
    );
    if (side === "left") {
      setPkForm((prev) => ({
        ...prev,
        leftDisplay: displayValue,
        leftModel: modelValue,
      }));
      // 如果右边是随机的或者选中的模型和新的左边模型相同，需要重新随机
      if (
        pkForm.rightDisplay === "random" ||
        pkForm.rightModel === modelValue
      ) {
        const newRightModel = getRandomModel(modelValue);
        setPkForm((prev) => ({
          ...prev,
          rightModel: newRightModel,
          rightDisplay:
            pkForm.rightModel === modelValue ? "random" : prev.rightDisplay,
        }));
      }
    } else {
      setPkForm((prev) => ({
        ...prev,
        rightDisplay: displayValue,
        rightModel: modelValue,
      }));
      // 如果左边是随机的或者选中的模型和新的右边模型相同，需要重新随机
      if (pkForm.leftDisplay === "random" || pkForm.leftModel === modelValue) {
        const newLeftModel = getRandomModel(modelValue);
        setPkForm((prev) => ({
          ...prev,
          leftModel: newLeftModel,
          leftDisplay:
            pkForm.leftModel === modelValue ? "random" : prev.leftDisplay,
        }));
      }
    }
  };

  const handleVote = async (side: "left" | "right") => {
    if (!pkState.historyId) return;
    const winner = side === "left" ? 0 : 1;
    await updateHistory(pkState.historyId, {
      winner,
    });
    await updateCloudConfig(winner);
  };

  const handleSkip = async () => {
    if (!pkState.historyId) return;
    await updateHistory(pkState.historyId, {
      winner: -1, // -1 represents skip
    });
    await updateCloudConfig(-1);
  };

  const handleImageClick = (side: "left" | "right") => {
    const image = side === "left" ? leftImage : rightImage;
    if (!image) return;

    const mediaItem: MediaItemType = {
      id: side,
      base64: image.base64,
      title: "",
      desc: image.prompt,
      url: image.base64,
    };

    setSelectedImage(mediaItem);
  };

  const createMediaItem = (side: "left" | "right"): MediaItemType | null => {
    const image = side === "left" ? leftImage : rightImage;
    if (!image) return null;
    return {
      id: side,
      base64: image.base64,
      title: "",
      desc: image.prompt,
      url: image.base64,
    };
  };

  const renderImage = (image: typeof leftImage, side: "left" | "right") => {
    if (!image) return null;

    if (image.status === "pending") {
      return (
        <div className="absolute inset-0 m-4 rounded border border-dashed border-muted-foreground/50">
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin" />
              <div>{pkState.elapsedTime[side]}s</div>
            </div>
          </div>
        </div>
      );
    }

    if (image.status === "failed") {
      return (
        <div className="absolute inset-0 m-4 rounded border border-dashed border-destructive/50">
          <div className="absolute inset-0 flex items-center justify-center text-destructive">
            {side === "left" ? t("leftModelFailed") : t("rightModelFailed")}
          </div>
        </div>
      );
    }

    return (
      <motion.div
        className="relative size-full cursor-pointer"
        onClick={() => handleImageClick(side)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <img
          src={image.base64}
          alt={`${side === "left" ? "Left" : "Right"} Model Result`}
          className="size-full object-contain"
        />
        {hasVoted && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {((side === "left" && winner === 0) ||
              (side === "right" && winner === 1)) && (
              <motion.div
                className="flex flex-col items-center gap-2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <div className="flex items-center gap-2 rounded-full bg-green-500/20 px-6 py-2 text-green-500">
                  <Medal className="h-6 w-6" />
                  <span className="text-2xl font-bold">{t("winner")}</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
        {hasVoted && (
          <motion.div
            className="absolute bottom-4 right-4 flex items-center gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="rounded bg-black/50 px-2 py-1 text-sm text-white">
              {getModelById(image.model)?.name}
            </span>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(
                  image.base64,
                  `${image.prompt.slice(0, 10) || side}.png`
                );
              }}
              title="Download"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </IconButton>
          </motion.div>
        )}
      </motion.div>
    );
  };

  return (
    <div className={cn("mt-4 flex flex-col gap-4 @container", className)}>
      {/* Model Selection Area */}
      <div className="flex flex-col gap-4 @[600px]:flex-row @[600px]:items-end">
        <div className="flex-1">
          <Label className="mb-1.5 block text-sm">{t("model")}</Label>
          <ModelSelector
            value={pkForm.leftDisplay}
            onChange={(value, actualModel) =>
              handleModelChange("left", value, actualModel)
            }
            placeholder={t("modelPlaceholder")}
          />
        </div>
        <div className="flex-1">
          <Label className="mb-1.5 block text-sm">{t("model")}</Label>
          <ModelSelector
            value={pkForm.rightDisplay}
            onChange={(value, actualModel) =>
              handleModelChange("right", value, actualModel)
            }
            placeholder={t("modelPlaceholder")}
          />
        </div>
      </div>

      {/* Result Display Area */}
      <div className="flex min-h-[600px] flex-col overflow-hidden rounded-lg border @[600px]:flex-row">
        {/* Left Model Display */}
        <div className="flex flex-1 border-b @[600px]:border-b-0 @[600px]:border-r">
          <div className="flex w-full items-center justify-center p-4">
            <div
              className="relative w-full"
              style={{
                aspectRatio: `${pkForm.width}/${pkForm.height}`,
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {renderImage(leftImage, "left")}
              </div>
            </div>
          </div>
        </div>

        {/* Right Model Display */}
        <div className="flex flex-1">
          <div className="flex w-full items-center justify-center p-4">
            <div
              className="relative w-full"
              style={{
                aspectRatio: `${pkForm.width}/${pkForm.height}`,
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {renderImage(rightImage, "right")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Buttons */}
      {leftImage?.status === "success" &&
        rightImage?.status === "success" &&
        !hasVoted && (
          <motion.div
            className="flex items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => handleVote("left")}
            >
              <ArrowLeftFromLine className="h-4 w-4" />
              {t("leftBetter")}
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleSkip}>
              <SkipForward className="h-4 w-4" />
              {t("skip")}
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => handleVote("right")}
            >
              {t("rightBetter")}
              <ArrowRightFromLine className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

      {/* Gallery Modal */}
      {selectedImage && (
        <GalleryModal
          selectedItem={selectedImage}
          isOpen={true}
          onClose={() => setSelectedImage(null)}
          setSelectedItem={setSelectedImage}
          mediaItems={
            [createMediaItem("left"), createMediaItem("right")].filter(
              Boolean
            ) as MediaItemType[]
          }
          onDownload={(item) => {
            if (item.base64) {
              handleDownload(item.base64, `${item.desc.slice(0, 10)}.png`);
            }
          }}
          showDelete={false}
        />
      )}
    </div>
  );
}
