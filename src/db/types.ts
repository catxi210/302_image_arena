export type History = {
  id: string;
  rawPrompt: string;
  shouldOptimize: boolean;
  aspectRatio: string;
  images: {
    base64: string;
    prompt: string;
    model: string;
    status: "pending" | "success" | "failed";
  }[];
  type: "gen" | "pk";
  winner?: number;
  createdAt: number;
};

export type AddHistory = Omit<History, "id" | "createdAt">;
