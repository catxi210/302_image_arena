import { getRandomModel } from "@/constants/models";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

type ImageGenForm = {
  prompt: string;
  model: string[];
  width: number;
  height: number;
  isOptimized: boolean;
};

export const imageGenFormAtom = atomWithStorage<ImageGenForm>(
  "imageGenForm",
  {
    prompt: "",
    model: ["ideogram/V_2"],
    width: 1,
    height: 1,
    isOptimized: true,
  },
  createJSONStorage(() =>
    typeof window !== "undefined"
      ? sessionStorage
      : {
          getItem: () => null,
          setItem: () => null,
          removeItem: () => null,
        }
  ),
  {
    getOnInit: true,
  }
);

type ImagePKForm = {
  prompt: string;
  width: number;
  height: number;
  isOptimized: boolean;
  leftModel: string;
  leftDisplay: string;
  rightModel: string;
  rightDisplay: string;
};

export const imagePKFormAtom = atomWithStorage<ImagePKForm>(
  "imagePKForm",
  (() => {
    const leftModel = getRandomModel();
    return {
      prompt: "",
      width: 1,
      height: 1,
      isOptimized: true,
      leftModel,
      leftDisplay: "random",
      rightModel: getRandomModel(leftModel),
      rightDisplay: "random",
    };
  })(),
  createJSONStorage(() =>
    typeof window !== "undefined"
      ? sessionStorage
      : {
          getItem: () => null,
          setItem: () => null,
          removeItem: () => null,
        }
  ),
  {
    getOnInit: true,
  }
);
