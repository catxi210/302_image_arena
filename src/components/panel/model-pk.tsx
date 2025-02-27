import { useEffect } from "react";
import ModelPkTop from "./model-pk/top";
import ModelPkBottom from "./model-pk/bottom";
import { useTranslations } from "next-intl";
import { useAtom, useAtomValue } from "jotai";
import { pkStateAtom } from "@/stores/slices/pk_store";
import { generateImage } from "@/services/gen-image";
import { appConfigAtom, store } from "@/stores";
import { createScopedLogger } from "@/utils";
import { toast } from "sonner";
import { useHistory } from "@/hooks/db/use-gen-history";
import { imagePKFormAtom } from "@/stores/slices/image_form_store";
import { getRandomModel } from "@/constants/models";
import { db } from "@/db";
import { History } from "@/db/types";
import { useConfig } from "@/hooks/config";
import {
  calculateInitialLeaderboard,
  updateLeaderboard,
} from "@/utils/leaderboard";

const logger = createScopedLogger("model-pk");

export default function ModelPk() {
  const t = useTranslations("modelPk");
  const [pkState, setPkState] = useAtom(pkStateAtom);
  const pkForm = useAtomValue(imagePKFormAtom);
  const { fetchConfig, updateConfigValues, isReady } = useConfig();

  const {
    addHistory,
    history,
    updateHistoryImage,
    updateHistoryImageStatus,
    deleteHistory,
  } = useHistory();

  // Get current PK history record
  const currentPkHistory = history?.items?.find(
    (h) => h.id === pkState.historyId
  );
  const leftImage = currentPkHistory?.images?.[0];
  const rightImage = currentPkHistory?.images?.[1];

  // Update cloud config when voting
  const updateCloudConfig = async (winner: number) => {
    if (!isReady || !currentPkHistory) return;
    try {
      const config = await fetchConfig();
      const currentLeaderboard = config.config.leaderboard || [];

      if (winner >= 0) {
        // Only update leaderboard if not skipped
        const newLeaderboard = updateLeaderboard(currentLeaderboard, {
          modelA: leftImage?.model || "",
          modelB: rightImage?.model || "",
          winner:
            winner === 0 ? leftImage?.model || "" : rightImage?.model || "",
        });

        await updateConfigValues(
          {
            leaderboard: newLeaderboard,
          },
          config.version
        );
      }
    } catch (error) {
      logger.error("Failed to update cloud config:", error);
      toast.error(t("error.update_leaderboard_failed"));
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (pkState.isGenerating) {
      timer = setInterval(() => {
        setPkState((prev) => ({
          ...prev,
          elapsedTime: {
            left:
              leftImage?.status === "success" || leftImage?.status === "failed"
                ? prev.elapsedTime.left
                : prev.elapsedTime.left + 1,
            right:
              rightImage?.status === "success" ||
              rightImage?.status === "failed"
                ? prev.elapsedTime.right
                : prev.elapsedTime.right + 1,
          },
        }));
      }, 1000);
    } else {
      setPkState((prev) => ({
        ...prev,
        elapsedTime: { left: 0, right: 0 },
      }));
    }
    return () => clearInterval(timer);
  }, [pkState.isGenerating, setPkState, leftImage?.status, rightImage?.status]);

  const handleGenerate = async () => {
    const { apiKey } = store.get(appConfigAtom);
    if (!pkForm.width || !pkForm.height) {
      toast.error(t("error.no_resolution"));
      return;
    }
    if (!pkForm.prompt) {
      toast.error(t("error.no_prompt"));
      return;
    }
    if (!pkForm.leftModel || !pkForm.rightModel) {
      toast.error(t("error.no_model"));
      return;
    }

    // Re-randomize models if they are set to random
    let actualLeftModel = pkForm.leftModel;
    let actualRightModel = pkForm.rightModel;

    if (pkForm.leftDisplay === "random") {
      actualLeftModel = getRandomModel(actualRightModel);
    }
    if (pkForm.rightDisplay === "random") {
      actualRightModel = getRandomModel(actualLeftModel);
    }

    setPkState((prev) => ({
      ...prev,
      historyId: null,
      isGenerating: true,
      elapsedTime: {
        left: 0,
        right: 0,
      },
    }));

    try {
      // Create history record first with pending images
      const historyId = await addHistory({
        rawPrompt: pkForm.prompt,
        shouldOptimize: pkForm.isOptimized,
        aspectRatio: `${pkForm.width}:${pkForm.height}`,
        type: "pk",
        images: [
          {
            base64:
              "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", // 1x1 transparent PNG
            prompt: pkForm.prompt,
            model: actualLeftModel,
            status: "pending",
          },
          {
            base64:
              "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", // 1x1 transparent PNG
            prompt: pkForm.prompt,
            model: actualRightModel,
            status: "pending",
          },
        ],
      });

      setPkState((prev) => ({
        ...prev,
        historyId,
      }));

      // Generate both images simultaneously
      const [leftPromise, rightPromise] = [
        generateImage({
          prompt: pkForm.prompt,
          shouldOptimize: pkForm.isOptimized,
          aspectRatio: `${pkForm.width}:${pkForm.height}`,
          model: [actualLeftModel],
          apiKey: apiKey || "",
        }),
        generateImage({
          prompt: pkForm.prompt,
          shouldOptimize: pkForm.isOptimized,
          aspectRatio: `${pkForm.width}:${pkForm.height}`,
          model: [actualRightModel],
          apiKey: apiKey || "",
        }),
      ];

      // Handle left image generation
      leftPromise
        .then((leftRes) => {
          const newImage = {
            base64: "data:image/png;base64," + leftRes.images[0].image,
            prompt: leftRes.images[0].prompt,
            model: actualLeftModel,
            status: "success" as const,
          };
          updateHistoryImage(historyId, 0, newImage);
        })
        .catch((error) => {
          logger.error(`Left image generation error: `, error);
          toast.error(t("error.left_generate_failed"));
          updateHistoryImageStatus(historyId, 0, "failed");
        });

      // Handle right image generation
      rightPromise
        .then((rightRes) => {
          const newImage = {
            base64: "data:image/png;base64," + rightRes.images[0].image,
            prompt: rightRes.images[0].prompt,
            model: actualRightModel,
            status: "success" as const,
          };
          updateHistoryImage(historyId, 1, newImage);
        })
        .catch((error) => {
          logger.error(`Right image generation error: `, error);
          toast.error(t("error.right_generate_failed"));
          updateHistoryImageStatus(historyId, 1, "failed");
        });

      // Wait for both generations to complete
      Promise.allSettled([leftPromise, rightPromise]).finally(() => {
        setPkState((prev) => ({
          ...prev,
          isGenerating: false,
        }));

        // Check if both images failed and delete the history record if they did
        db.history.get(historyId).then((record) => {
          if (record && record.images.every((img) => img.status === "failed")) {
            deleteHistory(historyId);
          }
        });
      });
    } catch (error) {
      logger.error(`generateImage error: `, error);
      toast.error(t("error.generate_failed"));
      setPkState((prev) => ({
        ...prev,
        isGenerating: false,
      }));
    }
  };

  return (
    <div className="flex size-full flex-col gap-4">
      <div className="@container">
        <div className="rounded-lg border bg-card text-card-foreground">
          <div className="grid gap-4 p-4">
            <ModelPkTop onGenerate={handleGenerate} />
            <ModelPkBottom
              className="flex-1"
              updateCloudConfig={updateCloudConfig}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
