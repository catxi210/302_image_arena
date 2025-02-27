"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getModelById } from "@/constants/models";
import { Medal } from "lucide-react";
import { useConfig } from "@/hooks/config";
import { ModelStats } from "@/utils/leaderboard";

export default function LeaderBoard() {
  const t = useTranslations("leaderBoard");
  // const { pkHistory } = useHistory();

  const [modelStats, setModelStats] = useState<ModelStats[]>([]);

  const { fetchConfig, isReady } = useConfig();

  useEffect(() => {
    if (isReady) {
      const getInitialConfig = async () => {
        const config = await fetchConfig();
        setModelStats(config.config.leaderboard || []);
      };
      getInitialConfig();
    }
  }, [isReady, fetchConfig]);

  // const modelStats = useMemo(() => {
  //   if (!pkHistory) return [];

  //   const statsMap = new Map<string, ModelStats>();

  //   // 计算每个模型的统计数据
  //   pkHistory.forEach((history) => {
  //     const modelA = history.images[0]?.model;
  //     const modelB = history.images[1]?.model;
  //     // 只有当用户投票了才计入统计
  //     if (!modelA || !modelB || history.winner === undefined) return;

  //     const winnerModel = history.images[history.winner]?.model;
  //     if (!winnerModel) return;

  //     // 处理模型A
  //     if (!statsMap.has(modelA)) {
  //       statsMap.set(modelA, {
  //         modelId: modelA,
  //         winRate: 0,
  //         totalScore: 0,
  //         pkCount: 0,
  //       });
  //     }
  //     const statsA = statsMap.get(modelA)!;
  //     statsA.pkCount++;
  //     if (winnerModel === modelA) {
  //       statsA.totalScore++;
  //     }

  //     // 处理模型B
  //     if (!statsMap.has(modelB)) {
  //       statsMap.set(modelB, {
  //         modelId: modelB,
  //         winRate: 0,
  //         totalScore: 0,
  //         pkCount: 0,
  //       });
  //     }
  //     const statsB = statsMap.get(modelB)!;
  //     statsB.pkCount++;
  //     if (winnerModel === modelB) {
  //       statsB.totalScore++;
  //     }
  //   });

  //   // 计算胜率
  //   statsMap.forEach((stats) => {
  //     stats.winRate = (stats.totalScore / stats.pkCount) * 100;
  //   });

  //   // 转换为数组并排序
  //   return Array.from(statsMap.values()).sort((a, b) => {
  //     if (a.winRate === b.winRate) {
  //       return b.totalScore - a.totalScore;
  //     }
  //     return b.winRate - a.winRate;
  //   });
  // }, [pkHistory]);

  // if (!pkHistory) {
  //   return (
  //     <div className="p-4 text-center text-sm text-muted-foreground">
  //       {t("loading")}
  //     </div>
  //   );
  // }

  if (modelStats.length === 0) {
    return (
      <div className="flex size-full flex-col items-center justify-center gap-2 p-4 text-center text-sm text-muted-foreground">
        <Medal className="h-8 w-8 opacity-50" />
        {t("empty")}
      </div>
    );
  }

  return (
    <div className="flex size-full flex-col gap-4">
      <div className="@container">
        <div className="rounded-lg border bg-card text-card-foreground">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>{t("creator")}</TableHead>
                <TableHead>{t("name")}</TableHead>
                <TableHead className="text-right">{t("winRate")}</TableHead>
                <TableHead className="text-right">{t("score")}</TableHead>
                <TableHead className="text-right">{t("appearances")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modelStats.map((stats, index) => {
                const model = getModelById(stats.modelId);
                if (!model) return null;

                const Icon = model.icon;
                return (
                  <TableRow
                    key={stats.modelId}
                    className={cn("h-14", index === 0 && "bg-primary/5")}
                  >
                    <TableCell className="w-[50px]">
                      <div className="flex items-center justify-center gap-1">
                        {index < 3 && (
                          <Medal
                            className={cn(
                              "h-5 w-5",
                              index === 0 && "text-yellow-500",
                              index === 1 && "text-gray-400",
                              index === 2 && "text-amber-600"
                            )}
                          />
                        )}
                        <span className="text-sm text-muted-foreground">
                          {index + 1}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="h-6 w-6" />
                        {model.group}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{model.name}</TableCell>
                    <TableCell className="text-right">
                      {stats.winRate.toFixed(0)}%
                    </TableCell>
                    <TableCell className="text-right">
                      {stats.totalScore}
                    </TableCell>
                    <TableCell className="text-right">
                      {stats.pkCount}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
