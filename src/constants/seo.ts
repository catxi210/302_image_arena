export type SEOData = {
  supportLanguages: string[];
  fallbackLanguage: string;
  languages: Record<
    string,
    { title: string; description: string; image: string }
  >;
};

export const SEO_DATA: SEOData = {
  // TODO: Change to your own support languages
  supportLanguages: ["zh", "en", "ja"],
  fallbackLanguage: "en",
  // TODO: Change to your own SEO data
  languages: {
    zh: {
      title: "图片竞技场",
      description: "AI模型文生图能力大比拼",
      image: "/images/global/desc_zh.png",
    },
    en: {
      title: "Image Arena",
      description:
        "Comparison of AI models' text-to-image generation capabilities",
      image: "/images/global/desc_en.png",
    },
    ja: {
      title: "画像アリーナ",
      description: "AIモデルのテキストから画像生成性能の比較",
      image: "/images/global/desc_ja.png",
    },
  },
};
