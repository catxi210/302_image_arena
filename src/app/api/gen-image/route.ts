import { APICallError, experimental_generateImage, generateText } from "ai";
import { createAI302 } from "@302ai/ai-sdk";
import prompts from "@/constants/prompts";
import { env } from "@/env";
import { createScopedLogger } from "@/utils";

const logger = createScopedLogger("gen-image");

export async function POST(request: Request) {
  try {
    const {
      prompt,
      shouldOptimize,
      aspectRatio,
      model,
      apiKey,
    }: {
      prompt: string;
      shouldOptimize: boolean;
      aspectRatio: string;
      model: string[];
      apiKey: string;
    } = await request.json();

    const ai302 = createAI302({
      apiKey,
      baseURL: env.NEXT_PUBLIC_API_URL,
    });

    let newPrompt = prompt;

    if (shouldOptimize) {
      const { text } = await generateText({
        model: ai302.chatModel("gpt-4o"),
        prompt: prompts.optimizeImage.compile({ input: prompt }),
      });
      newPrompt = text;
    }

    // Generate images for all models in parallel
    const results = await Promise.all(
      model.map(async (modelId) => {
        const { image } = await experimental_generateImage({
          model: ai302.image(modelId),
          prompt: newPrompt,
          aspectRatio: aspectRatio as `${number}:${number}`,
        });
        return {
          image: image.base64,
          prompt: newPrompt,
          model: modelId,
        };
      })
    );

    return Response.json({ images: results });
  } catch (error) {
    logger.error(error);
    if (error instanceof APICallError) {
      const resp = error.responseBody;

      return Response.json(resp, { status: 500 });
    }
    // Handle different types of errors
    let errorMessage = "Failed to generate image";
    let errorCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      // You can add specific error code mapping here if needed
      if ("code" in error && typeof (error as any).code === "number") {
        errorCode = (error as any).code;
      }
    }

    return Response.json(
      {
        error: {
          err_code: errorCode,
          message: errorMessage,
          message_cn: "生成图片失败",
          message_en: "Failed to generate image",
          message_ja: "画像の生成に失敗しました",
          type: "IMAGE_GENERATION_ERROR",
        },
      },
      { status: errorCode }
    );
  }
}
