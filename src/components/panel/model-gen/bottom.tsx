import { WaterfallGallery } from "@/components/ui/gallery/waterfall-gallery";
import { getModelById } from "@/constants/models";
import { useHistory } from "@/hooks/db/use-gen-history";
import { useMonitorMessage } from "@/hooks/global/use-monitor-message";
import { useTranslations } from "next-intl";

export function ModelGenBottom() {
  const t = useTranslations("modelGen");
  const { genHistory, deleteHistory } = useHistory();
  const { handleDownload } = useMonitorMessage();

  const mediaItems =
    genHistory?.flatMap((history) =>
      history.images.map((image, index) => ({
        id: `${history.id}-${index}`,
        title: t("gallery.promptTitle"),
        desc: history.rawPrompt,
        base64: image.base64,
        tag: getModelById(image.model)?.alias || "",
        historyId: history.id,
      }))
    ) || [];

  return (
    <div className="rounded-lg border">
      <WaterfallGallery
        mediaItems={mediaItems}
        title={t("gallery.title")}
        description={t("gallery.description")}
        emptyStateMessage={t("gallery.emptyMessage")}
        insertAtStart
        onDelete={(item) => item.historyId && deleteHistory(item.historyId)}
        onDownload={(item) => {
          if (item.base64) {
            handleDownload(item.base64, `${item.desc.slice(0, 10)}.png`);
          }
        }}
      />
    </div>
  );
}
