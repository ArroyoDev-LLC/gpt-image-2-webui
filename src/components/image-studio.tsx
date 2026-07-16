"use client"

import Image from "next/image"
import type { CSSProperties, DragEvent } from "react"
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import {
  ArrowDownToLineIcon,
  CheckCircle2Icon,
  CopyPlusIcon,
  EyeIcon,
  EyeOffIcon,
  HistoryIcon,
  ImagePlusIcon,
  KeyRoundIcon,
  LanguagesIcon,
  Layers3Icon,
  LoaderCircleIcon,
  Maximize2Icon,
  MousePointer2Icon,
  PaintbrushIcon,
  PanelRightIcon,
  PlayIcon,
  RefreshCwIcon,
  ScissorsIcon,
  SparklesIcon,
  Trash2Icon,
  WandSparklesIcon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  clearHistory,
  deleteHistoryEntry,
  loadHistory,
  saveHistoryEntry,
  type HistoryEntry,
} from "@/lib/history-store"
import { type GeneratedImage } from "@/lib/image-request"
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_KEY,
  LOCALE_OPTIONS,
  LOCALE_STORAGE_KEY,
  getDocumentLang,
  isCjkLocale,
  pluralSuffix,
  resolveLocale,
  resolveLocaleFrom,
  studioMessages,
  studioPromptPresets,
  t,
  type Locale,
  type StudioMessages,
} from "@/lib/i18n"
import { cn } from "@/lib/utils"

const MAX_UPLOADS = 4
const MAX_FILE_SIZE = 10 * 1024 * 1024
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"])
const DEFAULT_ENDPOINT = "https://api.openai.com/v1"
const GITHUB_REPOSITORY_URL = "https://github.com/imgx-studio/gpt-image-2-webui"
const CONNECTION_PREFERENCES_KEY = "imgx.connectionPreferences"
const LEGACY_API_KEY_KEY = "imgx.apiKey"
const LEGACY_REMEMBER_KEY_KEY = "imgx.rememberKey"
const LEGACY_ENDPOINT_KEY = "imgx.endpoint"
const optionGroupClassName = "studio-option-group"
const optionItemClassName = "studio-option-item h-8 text-xs hover:bg-muted"
const CUSTOM_SIZE_OPTION_VALUE = "custom"
const DEFAULT_SIZE = "1024x1024"
const DEFAULT_CUSTOM_SIZE = "1280x720"
const MIN_CUSTOM_DIMENSION = 64
const MAX_CUSTOM_DIMENSION = 8192
const PRESET_SIZE_VALUES = [
  "auto",
  "1024x1024",
  "1536x1024",
  "1024x1536",
  "2048x2048",
  "2048x1152",
  "3840x2160",
  "2160x3840",
] as const

function GitHubMarkIcon() {
  return (
    <svg
      aria-hidden="true"
      data-icon="inline-start"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        clipRule="evenodd"
        d="M12 0.75C5.79 0.75 0.75 5.79 0.75 12c0 4.97 3.22 9.18 7.69 10.67 0.56 0.1 0.77-0.24 0.77-0.54 0-0.27-0.01-1.14-0.02-2.07-3.13 0.68-3.79-1.33-3.79-1.33-0.51-1.3-1.25-1.65-1.25-1.65-1.02-0.7 0.08-0.68 0.08-0.68 1.13 0.08 1.73 1.16 1.73 1.16 1 1.72 2.63 1.22 3.27 0.93 0.1-0.73 0.39-1.22 0.71-1.5-2.5-0.28-5.13-1.25-5.13-5.56 0-1.23 0.44-2.23 1.16-3.02-0.12-0.28-0.5-1.43 0.11-2.98 0 0 0.95-0.3 3.09 1.15 0.9-0.25 1.86-0.38 2.82-0.38s1.92 0.13 2.82 0.38c2.15-1.45 3.09-1.15 3.09-1.15 0.61 1.55 0.23 2.7 0.11 2.98 0.72 0.79 1.16 1.79 1.16 3.02 0 4.32-2.63 5.27-5.14 5.55 0.4 0.35 0.76 1.03 0.76 2.08 0 1.5-0.01 2.71-0.01 3.07 0 0.3 0.2 0.65 0.77 0.54A11.26 11.26 0 0 0 23.25 12C23.25 5.79 18.21 0.75 12 0.75Z"
        fillRule="evenodd"
      />
    </svg>
  )
}

type RemixRecipeId = "variations" | "retouch" | "upscale" | "inpaint"

type WorkflowCopy = {
  activeSource: string
  clearSource: string
  continueGeneration: string
  copyPrompt: string
  copyPromptFailed: string
  copyPromptSuccess: string
  currentPrompt: string
  emptySelectionDescription: string
  emptySelectionTitle: string
  flowSteps: string[]
  generatedAsset: string
  generationSkeletonTitle: string
  lineageTitle: string
  noRevisedPrompt: string
  panelDescription: string
  panelTitle: string
  recipeSuccess: string
  recipesTitle: string
  referenceSuccess: string
  revisedPrompt: string
  selectImage: string
  selected: string
  selectedAsset: string
  setAsSource: string
  sourceReady: string
  sourceRound: string
  stageFailed: string
  stageWithRecipe: string
  recipes: Record<RemixRecipeId, {
    description: string
    instruction: string
    title: string
  }>
}

const workflowCopies: Record<Locale, WorkflowCopy> = {
  en: {
    activeSource: "Active source image",
    clearSource: "Clear source image",
    continueGeneration: "Continue from source image",
    copyPrompt: "Copy prompt",
    copyPromptFailed: "Could not copy the prompt.",
    copyPromptSuccess: "Prompt copied.",
    currentPrompt: "Current prompt",
    emptySelectionDescription: "Generate a set first, then pick one result to remix, upscale, retouch, or use as the next source image.",
    emptySelectionTitle: "No image selected yet",
    flowSteps: ["Generate options", "Select a winner", "Choose a remix move", "Generate the next round"],
    generatedAsset: "Generated asset",
    generationSkeletonTitle: "Composing candidates",
    lineageTitle: "Prompt lineage",
    noRevisedPrompt: "No revised prompt returned by the model.",
    panelDescription: "Select any result as the source image, keep editing the prompt and parameters, then generate the next branch.",
    panelTitle: "Iteration board",
    recipeSuccess: "This result is now the active source image with a remix instruction. Edit prompt/parameters, then generate again.",
    recipesTitle: "Creative moves",
    referenceSuccess: "This result is now the source image for the next generation.",
    revisedPrompt: "Model revised prompt",
    selectImage: "Select image",
    selected: "Selected",
    selectedAsset: "Selected asset",
    setAsSource: "Set as source image",
    sourceReady: "Source image ready",
    sourceRound: "Round {round}",
    stageFailed: "Could not set this image as the source image.",
    stageWithRecipe: "Apply move",
    recipes: {
      variations: {
        title: "Explore variations",
        description: "Keep the product and composition, branch into four controlled alternatives.",
        instruction:
          "Create controlled variations from the source image. Preserve the main subject, product geometry, and premium lighting, while exploring subtle changes in angle, background, and styling.",
      },
      retouch: {
        title: "Commercial polish",
        description: "Clean artifacts, sharpen material, and make it campaign-ready.",
        instruction:
          "Retouch the source image for commercial delivery. Remove artifacts, improve edges and material realism, balance reflections, and keep the original composition recognizable.",
      },
      upscale: {
        title: "Hero upscale",
        description: "Turn the selected result into a cleaner hero visual.",
        instruction:
          "Recreate the source image as a high-end hero image with sharper detail, cleaner surfaces, deeper contrast, and premium studio lighting. Do not change the core product identity.",
      },
      inpaint: {
        title: "Local redraw brief",
        description: "Use the image as context and request a targeted local change.",
        instruction:
          "Use the source image as context for a targeted redraw. Keep the untouched areas stable, then improve only the weak or inconsistent details with natural blending.",
      },
    },
  },
  zh: {
    activeSource: "当前创作源图",
    clearSource: "清除创作源图",
    continueGeneration: "基于创作源图继续生成",
    copyPrompt: "复制提示词",
    copyPromptFailed: "无法复制提示词。",
    copyPromptSuccess: "提示词已复制。",
    currentPrompt: "当前提示词",
    emptySelectionDescription: "先生成一组结果，再选择其中一张进行变体、精修、高清化或作为下一轮创作源图。",
    emptySelectionTitle: "还没有选中的图片",
    flowSteps: ["生成候选", "选中最佳图", "选择二创动作", "生成下一轮"],
    generatedAsset: "生成资产",
    generationSkeletonTitle: "正在组织候选图",
    lineageTitle: "提示词链路",
    noRevisedPrompt: "模型未返回改写后的提示词。",
    panelDescription: "选择任意结果作为创作源图，继续修改提示词和参数，再生成下一条分支。",
    panelTitle: "迭代工作台",
    recipeSuccess: "这张结果已设为当前创作源图，并叠加了二创指令。继续调整 prompt/参数后再生成。",
    recipesTitle: "二创动作",
    referenceSuccess: "这张结果已设为下一轮创作源图。",
    revisedPrompt: "模型改写提示词",
    selectImage: "选中图片",
    selected: "已选中",
    selectedAsset: "选中资产",
    setAsSource: "设为创作源图",
    sourceReady: "创作源图已就绪",
    sourceRound: "第 {round} 轮",
    stageFailed: "无法将这张图片设为创作源图。",
    stageWithRecipe: "应用动作",
    recipes: {
      variations: {
        title: "变体探索",
        description: "保留主体与构图，分叉出 4 张可控方案。",
        instruction:
          "基于创作源图做可控变体。保留主体、产品几何关系和高级布光，只微调角度、背景、陈列方式与风格氛围。",
      },
      retouch: {
        title: "商业精修",
        description: "清理瑕疵、强化材质，让画面可交付。",
        instruction:
          "对创作源图进行商业级精修。移除伪影，优化边缘和材质真实感，平衡反光与阴影，同时保持原始构图可识别。",
      },
      upscale: {
        title: "高清主视觉",
        description: "把选中图升级成更干净的主视觉。",
        instruction:
          "将创作源图重塑为高端主视觉：细节更锐利，表面更干净，对比更深，使用高级影棚光效；不要改变核心产品身份。",
      },
      inpaint: {
        title: "局部重绘",
        description: "以原图为上下文，提出局部修改方向。",
        instruction:
          "以创作源图作为上下文进行局部重绘。保持不需要修改的区域稳定，只修复薄弱或不一致的细节，并保证自然融合。",
      },
    },
  },
  "zh-TW": {
    activeSource: "目前創作源圖",
    clearSource: "清除創作源圖",
    continueGeneration: "基於創作源圖繼續生成",
    copyPrompt: "複製提示詞",
    copyPromptFailed: "無法複製提示詞。",
    copyPromptSuccess: "提示詞已複製。",
    currentPrompt: "目前提示詞",
    emptySelectionDescription: "先生成一組結果，再選擇其中一張進行變體、精修、高清化，或作為下一輪創作源圖。",
    emptySelectionTitle: "尚未選取圖片",
    flowSteps: ["生成候選", "選中最佳圖", "選擇二創動作", "生成下一輪"],
    generatedAsset: "生成資產",
    generationSkeletonTitle: "正在組織候選圖",
    lineageTitle: "提示詞鏈路",
    noRevisedPrompt: "模型未返回改寫後的提示詞。",
    panelDescription: "選擇任意結果作為創作源圖，繼續修改提示詞和參數，再生成下一條分支。",
    panelTitle: "迭代工作台",
    recipeSuccess: "這張結果已設為目前創作源圖，並疊加了二創指令。繼續調整 prompt/參數後再生成。",
    recipesTitle: "二創動作",
    referenceSuccess: "這張結果已設為下一輪創作源圖。",
    revisedPrompt: "模型改寫提示詞",
    selectImage: "選取圖片",
    selected: "已選取",
    selectedAsset: "選取資產",
    setAsSource: "設為創作源圖",
    sourceReady: "創作源圖已就緒",
    sourceRound: "第 {round} 輪",
    stageFailed: "無法將這張圖片設為創作源圖。",
    stageWithRecipe: "套用動作",
    recipes: {
      variations: {
        title: "變體探索",
        description: "保留主體與構圖，分叉出 4 張可控方案。",
        instruction:
          "基於創作源圖做可控變體。保留主體、產品幾何關係和高級布光，只微調角度、背景、陳列方式與風格氛圍。",
      },
      retouch: {
        title: "商業精修",
        description: "清理瑕疵、強化材質，讓畫面可交付。",
        instruction:
          "對創作源圖進行商業級精修。移除偽影，優化邊緣和材質真實感，平衡反光與陰影，同時保持原始構圖可識別。",
      },
      upscale: {
        title: "高清主視覺",
        description: "把選中圖升級成更乾淨的主視覺。",
        instruction:
          "將創作源圖重塑為高端主視覺：細節更銳利，表面更乾淨，對比更深，使用高級影棚光效；不要改變核心產品身份。",
      },
      inpaint: {
        title: "局部重繪",
        description: "以原圖為上下文，提出局部修改方向。",
        instruction:
          "以創作源圖作為上下文進行局部重繪。保持不需要修改的區域穩定，只修復薄弱或不一致的細節，並保證自然融合。",
      },
    },
  },
  ja: {
    activeSource: "現在のソース画像",
    clearSource: "ソース画像を解除",
    continueGeneration: "ソース画像から続けて生成",
    copyPrompt: "プロンプトをコピー",
    copyPromptFailed: "プロンプトをコピーできませんでした。",
    copyPromptSuccess: "プロンプトをコピーしました。",
    currentPrompt: "現在のプロンプト",
    emptySelectionDescription: "まず一組生成し、結果を選んでバリエーション、レタッチ、高解像度化、または次のソース画像として続けます。",
    emptySelectionTitle: "まだ画像が選択されていません",
    flowSteps: ["候補を生成", "ベストを選択", "リミックス操作を選択", "次のラウンドを生成"],
    generatedAsset: "生成アセット",
    generationSkeletonTitle: "候補を作成中",
    lineageTitle: "プロンプト履歴",
    noRevisedPrompt: "モデルから改訂プロンプトは返されませんでした。",
    panelDescription: "任意の結果をソース画像として選び、プロンプトとパラメータを編集して次の分岐を生成します。",
    panelTitle: "反復ボード",
    recipeSuccess: "この結果を現在のソース画像にし、リミックス指示を追加しました。プロンプト/パラメータを調整して再生成してください。",
    recipesTitle: "クリエイティブ操作",
    referenceSuccess: "この結果を次の生成のソース画像にしました。",
    revisedPrompt: "モデル改訂プロンプト",
    selectImage: "画像を選択",
    selected: "選択済み",
    selectedAsset: "選択アセット",
    setAsSource: "ソース画像に設定",
    sourceReady: "ソース画像準備完了",
    sourceRound: "ラウンド {round}",
    stageFailed: "この画像をソース画像に設定できませんでした。",
    stageWithRecipe: "操作を適用",
    recipes: {
      variations: {
        title: "バリエーション探索",
        description: "商品と構図を保ち、4つの制御された代替案に分岐します。",
        instruction:
          "ソース画像から制御されたバリエーションを作成します。主題、商品の形状、上質なライティングを維持しながら、角度、背景、スタイリングを控えめに変化させてください。",
      },
      retouch: {
        title: "商用仕上げ",
        description: "アーティファクトを整え、素材感を強化して納品向けにします。",
        instruction:
          "ソース画像を商用納品向けにレタッチします。アーティファクトを除去し、エッジと素材のリアリティを高め、反射を整えつつ、元の構図が認識できる状態を保ってください。",
      },
      upscale: {
        title: "ヒーロー高解像度化",
        description: "選択結果をよりクリーンなヒーロービジュアルにします。",
        instruction:
          "ソース画像を高品質なヒーロー画像として再構成します。ディテールをよりシャープに、表面をよりクリーンに、コントラストを深くし、上質なスタジオライティングを加えてください。商品の核となる個性は変えないでください。",
      },
      inpaint: {
        title: "局所修正ブリーフ",
        description: "画像を文脈として使い、狙った局所変更を依頼します。",
        instruction:
          "ソース画像を文脈として局所的な再描画を行います。変更しない領域は安定させ、弱い部分や不自然な細部だけを自然になじむよう改善してください。",
      },
    },
  },
  ko: {
    activeSource: "현재 소스 이미지",
    clearSource: "소스 이미지 지우기",
    continueGeneration: "소스 이미지에서 이어서 생성",
    copyPrompt: "프롬프트 복사",
    copyPromptFailed: "프롬프트를 복사할 수 없습니다.",
    copyPromptSuccess: "프롬프트를 복사했습니다.",
    currentPrompt: "현재 프롬프트",
    emptySelectionDescription: "먼저 결과 세트를 생성한 뒤, 하나를 선택해 변형, 리터치, 업스케일 또는 다음 소스 이미지로 이어가세요.",
    emptySelectionTitle: "아직 선택한 이미지가 없습니다",
    flowSteps: ["후보 생성", "최종안 선택", "리믹스 동작 선택", "다음 라운드 생성"],
    generatedAsset: "생성된 에셋",
    generationSkeletonTitle: "후보 구성 중",
    lineageTitle: "프롬프트 흐름",
    noRevisedPrompt: "모델이 수정된 프롬프트를 반환하지 않았습니다.",
    panelDescription: "결과를 소스 이미지로 선택하고 프롬프트와 파라미터를 계속 편집한 뒤 다음 분기를 생성하세요.",
    panelTitle: "반복 보드",
    recipeSuccess: "이 결과가 현재 소스 이미지가 되었고 리믹스 지시가 추가되었습니다. 프롬프트/파라미터를 조정한 뒤 다시 생성하세요.",
    recipesTitle: "크리에이티브 동작",
    referenceSuccess: "이 결과가 다음 생성의 소스 이미지가 되었습니다.",
    revisedPrompt: "모델 수정 프롬프트",
    selectImage: "이미지 선택",
    selected: "선택됨",
    selectedAsset: "선택된 에셋",
    setAsSource: "소스 이미지로 설정",
    sourceReady: "소스 이미지 준비됨",
    sourceRound: "{round}라운드",
    stageFailed: "이 이미지를 소스 이미지로 설정할 수 없습니다.",
    stageWithRecipe: "동작 적용",
    recipes: {
      variations: {
        title: "변형 탐색",
        description: "제품과 구도를 유지하고 4개의 제어된 대안을 만듭니다.",
        instruction:
          "소스 이미지에서 제어된 변형을 만드세요. 주요 피사체, 제품 형태, 고급 조명은 유지하면서 각도, 배경, 스타일링만 섬세하게 탐색하세요.",
      },
      retouch: {
        title: "상업용 보정",
        description: "아티팩트를 정리하고 소재감을 선명하게 해 캠페인에 맞춥니다.",
        instruction:
          "소스 이미지를 상업 납품 수준으로 보정하세요. 아티팩트를 제거하고 경계와 소재 현실감을 개선하며 반사를 균형 있게 조정하되 원래 구도는 알아볼 수 있게 유지하세요.",
      },
      upscale: {
        title: "히어로 업스케일",
        description: "선택 결과를 더 깔끔한 히어로 비주얼로 만듭니다.",
        instruction:
          "소스 이미지를 고급 히어로 이미지로 재구성하세요. 디테일을 더 선명하게, 표면을 더 깨끗하게, 대비를 더 깊게 만들고 프리미엄 스튜디오 조명을 적용하세요. 핵심 제품 정체성은 바꾸지 마세요.",
      },
      inpaint: {
        title: "부분 수정 브리프",
        description: "이미지를 맥락으로 사용해 특정 부분 수정을 요청합니다.",
        instruction:
          "소스 이미지를 맥락으로 특정 영역을 다시 그리세요. 수정하지 않는 영역은 안정적으로 유지하고 약하거나 일관되지 않은 디테일만 자연스럽게 개선하세요.",
      },
    },
  },
  es: {
    activeSource: "Imagen fuente activa",
    clearSource: "Borrar imagen fuente",
    continueGeneration: "Continuar desde la imagen fuente",
    copyPrompt: "Copiar prompt",
    copyPromptFailed: "No se pudo copiar el prompt.",
    copyPromptSuccess: "Prompt copiado.",
    currentPrompt: "Prompt actual",
    emptySelectionDescription: "Genera primero un conjunto y elige un resultado para remezclar, mejorar, retocar o usar como la siguiente imagen fuente.",
    emptySelectionTitle: "Aún no hay imagen seleccionada",
    flowSteps: ["Generar opciones", "Elegir ganadora", "Elegir remezcla", "Generar la siguiente ronda"],
    generatedAsset: "Asset generado",
    generationSkeletonTitle: "Componiendo candidatos",
    lineageTitle: "Linaje del prompt",
    noRevisedPrompt: "El modelo no devolvió un prompt revisado.",
    panelDescription: "Selecciona cualquier resultado como imagen fuente, sigue editando el prompt y los parámetros, y genera la siguiente rama.",
    panelTitle: "Panel de iteración",
    recipeSuccess: "Este resultado es ahora la imagen fuente activa con una instrucción de remezcla. Edita prompt/parámetros y vuelve a generar.",
    recipesTitle: "Movimientos creativos",
    referenceSuccess: "Este resultado es ahora la imagen fuente para la siguiente generación.",
    revisedPrompt: "Prompt revisado por el modelo",
    selectImage: "Seleccionar imagen",
    selected: "Seleccionada",
    selectedAsset: "Asset seleccionado",
    setAsSource: "Usar como imagen fuente",
    sourceReady: "Imagen fuente lista",
    sourceRound: "Ronda {round}",
    stageFailed: "No se pudo usar esta imagen como imagen fuente.",
    stageWithRecipe: "Aplicar movimiento",
    recipes: {
      variations: {
        title: "Explorar variaciones",
        description: "Mantén producto y composición, y abre cuatro alternativas controladas.",
        instruction:
          "Crea variaciones controladas desde la imagen fuente. Conserva el sujeto principal, la geometría del producto y la iluminación premium, explorando cambios sutiles de ángulo, fondo y estilo.",
      },
      retouch: {
        title: "Pulido comercial",
        description: "Limpia artefactos, afina materiales y deja la imagen lista para campaña.",
        instruction:
          "Retoca la imagen fuente para entrega comercial. Elimina artefactos, mejora bordes y realismo de materiales, equilibra reflejos y mantén reconocible la composición original.",
      },
      upscale: {
        title: "Hero upscale",
        description: "Convierte el resultado elegido en un hero visual más limpio.",
        instruction:
          "Recrea la imagen fuente como una imagen hero de alta gama con más detalle, superficies limpias, contraste profundo e iluminación de estudio premium. No cambies la identidad central del producto.",
      },
      inpaint: {
        title: "Brief de redibujo local",
        description: "Usa la imagen como contexto y pide un cambio local específico.",
        instruction:
          "Usa la imagen fuente como contexto para un redibujo localizado. Mantén estables las zonas no modificadas y mejora solo los detalles débiles o inconsistentes con una integración natural.",
      },
    },
  },
  fr: {
    activeSource: "Image source active",
    clearSource: "Effacer l’image source",
    continueGeneration: "Continuer depuis l’image source",
    copyPrompt: "Copier le prompt",
    copyPromptFailed: "Impossible de copier le prompt.",
    copyPromptSuccess: "Prompt copié.",
    currentPrompt: "Prompt actuel",
    emptySelectionDescription: "Générez d'abord une série, puis choisissez un résultat à remixer, retoucher, améliorer ou utiliser comme prochaine image source.",
    emptySelectionTitle: "Aucune image sélectionnée",
    flowSteps: ["Générer des options", "Choisir la meilleure", "Choisir un remix", "Générer la suite"],
    generatedAsset: "Asset généré",
    generationSkeletonTitle: "Composition des candidats",
    lineageTitle: "Historique du prompt",
    noRevisedPrompt: "Le modèle n'a pas renvoyé de prompt révisé.",
    panelDescription: "Sélectionnez un résultat comme image source, ajustez le prompt et les paramètres, puis générez la branche suivante.",
    panelTitle: "Tableau d'itération",
    recipeSuccess: "Ce résultat est maintenant l’image source active avec une instruction de remix. Modifiez prompt/paramètres, puis relancez la génération.",
    recipesTitle: "Mouvements créatifs",
    referenceSuccess: "Ce résultat est maintenant l’image source pour la prochaine génération.",
    revisedPrompt: "Prompt révisé par le modèle",
    selectImage: "Sélectionner l'image",
    selected: "Sélectionné",
    selectedAsset: "Asset sélectionné",
    setAsSource: "Définir comme image source",
    sourceReady: "Image source prête",
    sourceRound: "Tour {round}",
    stageFailed: "Impossible de définir cette image comme image source.",
    stageWithRecipe: "Appliquer le remix",
    recipes: {
      variations: {
        title: "Explorer des variations",
        description: "Gardez produit et composition, puis créez quatre alternatives contrôlées.",
        instruction:
          "Créez des variations contrôlées à partir de l’image source. Préservez le sujet principal, la géométrie du produit et l'éclairage premium, tout en explorant de légers changements d'angle, de fond et de style.",
      },
      retouch: {
        title: "Finition commerciale",
        description: "Nettoyez les artefacts, affinez les matières et préparez l'image pour campagne.",
        instruction:
          "Retouchez l’image source pour une livraison commerciale. Supprimez les artefacts, améliorez les bords et le réalisme des matières, équilibrez les reflets et gardez la composition originale reconnaissable.",
      },
      upscale: {
        title: "Hero upscale",
        description: "Transformez le résultat choisi en visuel hero plus propre.",
        instruction:
          "Recréez l’image source comme un visuel hero haut de gamme avec plus de détail, des surfaces plus propres, un contraste plus profond et un éclairage studio premium. Ne changez pas l'identité centrale du produit.",
      },
      inpaint: {
        title: "Brief de retouche locale",
        description: "Utilisez l'image comme contexte et demandez un changement local ciblé.",
        instruction:
          "Utilisez l’image source comme contexte pour une retouche localisée. Gardez les zones intactes stables, puis améliorez seulement les détails faibles ou incohérents avec une intégration naturelle.",
      },
    },
  },
  de: {
    activeSource: "Aktives Quellbild",
    clearSource: "Quellbild entfernen",
    continueGeneration: "Vom Quellbild fortsetzen",
    copyPrompt: "Prompt kopieren",
    copyPromptFailed: "Prompt konnte nicht kopiert werden.",
    copyPromptSuccess: "Prompt kopiert.",
    currentPrompt: "Aktueller Prompt",
    emptySelectionDescription: "Erzeuge zuerst ein Set und wähle dann ein Ergebnis zum Remixen, Retuschieren, Hochskalieren oder als nächstes Quellbild.",
    emptySelectionTitle: "Noch kein Bild ausgewählt",
    flowSteps: ["Optionen erzeugen", "Favorit wählen", "Remix wählen", "Nächste Runde erzeugen"],
    generatedAsset: "Generiertes Asset",
    generationSkeletonTitle: "Kandidaten werden erstellt",
    lineageTitle: "Prompt-Verlauf",
    noRevisedPrompt: "Das Modell hat keinen überarbeiteten Prompt zurückgegeben.",
    panelDescription: "Wähle ein Ergebnis als Quellbild, bearbeite Prompt und Parameter weiter und erzeuge den nächsten Zweig.",
    panelTitle: "Iterationsboard",
    recipeSuccess: "Dieses Ergebnis ist jetzt das aktive Quellbild mit Remix-Anweisung. Prompt/Parameter anpassen und erneut generieren.",
    recipesTitle: "Kreative Aktionen",
    referenceSuccess: "Dieses Ergebnis ist jetzt das Quellbild für die nächste Generierung.",
    revisedPrompt: "Vom Modell überarbeiteter Prompt",
    selectImage: "Bild auswählen",
    selected: "Ausgewählt",
    selectedAsset: "Ausgewähltes Asset",
    setAsSource: "Als Quellbild setzen",
    sourceReady: "Quellbild bereit",
    sourceRound: "Runde {round}",
    stageFailed: "Dieses Bild konnte nicht als Quellbild gesetzt werden.",
    stageWithRecipe: "Aktion anwenden",
    recipes: {
      variations: {
        title: "Variationen erkunden",
        description: "Produkt und Komposition beibehalten und vier kontrollierte Alternativen erzeugen.",
        instruction:
          "Erstelle kontrollierte Variationen aus dem Quellbild. Bewahre Hauptmotiv, Produktgeometrie und hochwertige Lichtsetzung, während Winkel, Hintergrund und Styling subtil variiert werden.",
      },
      retouch: {
        title: "Kommerzieller Feinschliff",
        description: "Artefakte bereinigen, Material schärfen und kampagnenreif machen.",
        instruction:
          "Retuschiere das Quellbild für die kommerzielle Auslieferung. Entferne Artefakte, verbessere Kanten und Materialrealismus, balanciere Reflexionen und halte die ursprüngliche Komposition erkennbar.",
      },
      upscale: {
        title: "Hero-Upscale",
        description: "Das gewählte Ergebnis in ein saubereres Hero-Visual verwandeln.",
        instruction:
          "Erstelle das Quellbild als hochwertiges Hero-Bild neu: schärfere Details, sauberere Oberflächen, tieferer Kontrast und Premium-Studiolicht. Die zentrale Produktidentität darf nicht verändert werden.",
      },
      inpaint: {
        title: "Brief für lokale Korrektur",
        description: "Das Bild als Kontext nutzen und eine gezielte lokale Änderung anfordern.",
        instruction:
          "Nutze das Quellbild als Kontext für eine gezielte lokale Neuzeichnung. Unveränderte Bereiche stabil halten und nur schwache oder inkonsistente Details natürlich verbessern.",
      },
    },
  },
  pt: {
    activeSource: "Imagem fonte ativa",
    clearSource: "Limpar imagem fonte",
    continueGeneration: "Continuar da imagem fonte",
    copyPrompt: "Copiar prompt",
    copyPromptFailed: "Não foi possível copiar o prompt.",
    copyPromptSuccess: "Prompt copiado.",
    currentPrompt: "Prompt atual",
    emptySelectionDescription: "Gere primeiro um conjunto e escolha um resultado para remixar, retocar, ampliar ou usar como a próxima imagem fonte.",
    emptySelectionTitle: "Nenhuma imagem selecionada ainda",
    flowSteps: ["Gerar opções", "Escolher a melhor", "Escolher remix", "Gerar a próxima rodada"],
    generatedAsset: "Asset gerado",
    generationSkeletonTitle: "Compondo candidatos",
    lineageTitle: "Histórico do prompt",
    noRevisedPrompt: "O modelo não retornou um prompt revisado.",
    panelDescription: "Selecione qualquer resultado como imagem fonte, continue editando o prompt e os parâmetros, e gere o próximo ramo.",
    panelTitle: "Quadro de iteração",
    recipeSuccess: "Este resultado agora é a imagem fonte ativa com uma instrução de remix. Edite prompt/parâmetros e gere novamente.",
    recipesTitle: "Movimentos criativos",
    referenceSuccess: "Este resultado agora é a imagem fonte para a próxima geração.",
    revisedPrompt: "Prompt revisado pelo modelo",
    selectImage: "Selecionar imagem",
    selected: "Selecionada",
    selectedAsset: "Asset selecionado",
    setAsSource: "Definir como imagem fonte",
    sourceReady: "Imagem fonte pronta",
    sourceRound: "Rodada {round}",
    stageFailed: "Não foi possível definir esta imagem como imagem fonte.",
    stageWithRecipe: "Aplicar movimento",
    recipes: {
      variations: {
        title: "Explorar variações",
        description: "Mantenha produto e composição, criando quatro alternativas controladas.",
        instruction:
          "Crie variações controladas a partir da imagem fonte. Preserve o assunto principal, a geometria do produto e a iluminação premium, explorando mudanças sutis de ângulo, fundo e estilo.",
      },
      retouch: {
        title: "Polimento comercial",
        description: "Limpe artefatos, refine materiais e deixe pronto para campanha.",
        instruction:
          "Retoque a imagem fonte para entrega comercial. Remova artefatos, melhore bordas e realismo dos materiais, equilibre reflexos e mantenha a composição original reconhecível.",
      },
      upscale: {
        title: "Hero upscale",
        description: "Transforme o resultado selecionado em um hero visual mais limpo.",
        instruction:
          "Recrie a imagem fonte como uma imagem hero de alto nível com mais detalhe, superfícies mais limpas, contraste profundo e iluminação de estúdio premium. Não altere a identidade central do produto.",
      },
      inpaint: {
        title: "Brief de redesenho local",
        description: "Use a imagem como contexto e solicite uma mudança local direcionada.",
        instruction:
          "Use a imagem fonte como contexto para um redesenho localizado. Mantenha estáveis as áreas intactas e melhore apenas detalhes fracos ou inconsistentes com integração natural.",
      },
    },
  },
}

const remixRecipeItems: {
  count: number
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  id: RemixRecipeId
}[] = [
  { count: 4, icon: RefreshCwIcon, id: "variations" },
  { count: 2, icon: PaintbrushIcon, id: "retouch" },
  { count: 1, icon: Maximize2Icon, id: "upscale" },
  { count: 2, icon: ScissorsIcon, id: "inpaint" },
]

const modelItems = [
  { label: "gpt-image-2", value: "gpt-image-2" },
  { label: "gpt-image-2-2026-04-21", value: "gpt-image-2-2026-04-21" },
  { label: "gpt-image-1", value: "gpt-image-1" },
]

type PresetSizeValue = (typeof PRESET_SIZE_VALUES)[number]
type SizeValue = PresetSizeValue | (string & {})
type SizeSelectValue = PresetSizeValue | typeof CUSTOM_SIZE_OPTION_VALUE

function getGenerationErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

type StudioResponse = {
  endpoint: string
  generation: number
  images: GeneratedImage[]
  model: string
  outputFormat: string
  prompt: string
  quality: string
  requestedCount: number
  size: string
  sourceLabel?: string
}

type UploadPreview = {
  file: File
  id: string
  url: string
}

type ActiveSource = {
  label: string
  promptSnapshot: string
  round: number
  upload: UploadPreview
}

type StoredConnectionPreferences = {
  version: 1
  remember: boolean
  apiKey: string
  endpoint: string
}

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function selectValue(value: string | null, fallback: string) {
  return value || fallback
}

function isPresetSizeValue(value: string): value is PresetSizeValue {
  return (PRESET_SIZE_VALUES as readonly string[]).includes(value)
}

function getNextSizeMode(value: string | null): SizeSelectValue {
  const nextValue = selectValue(value, DEFAULT_SIZE)

  if (nextValue === CUSTOM_SIZE_OPTION_VALUE || isPresetSizeValue(nextValue)) {
    return nextValue
  }

  return DEFAULT_SIZE
}

function normalizeCustomSize(value: string) {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "").replace(/×/g, "x")
  const match = /^([1-9]\d{1,4})x([1-9]\d{1,4})$/.exec(normalized)

  if (!match) {
    return ""
  }

  const width = Number(match[1])
  const height = Number(match[2])

  if (
    width < MIN_CUSTOM_DIMENSION ||
    width > MAX_CUSTOM_DIMENSION ||
    height < MIN_CUSTOM_DIMENSION ||
    height > MAX_CUSTOM_DIMENSION
  ) {
    return ""
  }

  return `${width}x${height}`
}

function getWorkflowCopy(locale: Locale) {
  return workflowCopies[locale]
}

function appendRemixInstruction(prompt: string, instruction: string) {
  const trimmedPrompt = prompt.trim()

  if (!trimmedPrompt) {
    return instruction
  }

  if (trimmedPrompt.includes(instruction)) {
    return trimmedPrompt
  }

  return `${trimmedPrompt}\n\n${instruction}`
}

function getReferenceUploadLimit(activeSource: ActiveSource | null) {
  return Math.max(MAX_UPLOADS - (activeSource ? 1 : 0), 0)
}

function splitUploadsByLimit(uploads: UploadPreview[], limit: number) {
  return {
    overflow: uploads.slice(limit),
    visible: uploads.slice(0, limit),
  }
}

function buildRequestPrompt(prompt: string, activeSource: ActiveSource | null) {
  const trimmedPrompt = prompt.trim()

  if (!activeSource) {
    return trimmedPrompt
  }

  const sourceContext = activeSource.promptSnapshot.trim()
  const sections = [
    "Use the first input image as the primary source image.",
    "Preserve the overall composition, framing, lighting, styling, and layout unless the request below explicitly asks for changes.",
  ]

  if (sourceContext && sourceContext !== trimmedPrompt) {
    sections.push(`Source image context:\n${sourceContext}`)
  }

  sections.push(`Requested changes:\n${trimmedPrompt}`)

  return sections.join("\n\n")
}

function getUploadType(outputFormat: string, blobType: string) {
  if (ACCEPTED_TYPES.has(blobType)) {
    return blobType
  }

  if (outputFormat === "jpeg") {
    return "image/jpeg"
  }

  if (outputFormat === "webp") {
    return "image/webp"
  }

  return "image/png"
}

function getUploadExtension(type: string) {
  if (type === "image/jpeg" || type === "image/jpg") {
    return "jpg"
  }

  if (type === "image/webp") {
    return "webp"
  }

  return "png"
}

async function createGeneratedUploadPreview({
  image,
  index,
  locale,
  outputFormat,
}: {
  image: GeneratedImage
  index: number
  locale: Locale
  outputFormat: string
}): Promise<UploadPreview> {
  const response = await fetch(image.src)

  if (!response.ok) {
    throw new Error(getWorkflowCopy(locale).stageFailed)
  }

  const blob = await response.blob()
  const type = getUploadType(outputFormat, blob.type)

  if (blob.size > MAX_FILE_SIZE) {
    throw new Error(t(locale, "exceedsMaxFileSize", { name: `imgx-${index + 1}` }))
  }

  const file = new File(
    [blob],
    `imgx-remix-${String(index + 1).padStart(2, "0")}.${getUploadExtension(type)}`,
    { type }
  )

  return {
    file,
    id: `${file.name}-${Date.now()}-${crypto.randomUUID()}`,
    url: URL.createObjectURL(file),
  }
}

function getSizeOptions(locale: Locale) {
  return [
    { value: "auto" as const, label: `${t(locale, "aspectSmart")} (auto)` },
    { value: "1024x1024" as const, label: `1024 x 1024 · ${t(locale, "aspectSquare")}` },
    { value: "1536x1024" as const, label: `1536 x 1024 · ${t(locale, "aspectLandscape")} 3:2` },
    { value: "1024x1536" as const, label: `1024 x 1536 · ${t(locale, "aspectPortrait")} 2:3` },
    { value: "2048x2048" as const, label: `2048 x 2048 · 2K ${t(locale, "aspectSquare")}` },
    { value: "2048x1152" as const, label: `2048 x 1152 · 2K ${t(locale, "aspectLandscape")}` },
    { value: "3840x2160" as const, label: `3840 x 2160 · 4K ${t(locale, "aspectLandscape")}` },
    { value: "2160x3840" as const, label: `2160 x 3840 · 4K ${t(locale, "aspectPortrait")}` },
    { value: CUSTOM_SIZE_OPTION_VALUE, label: `${t(locale, "aspectCustom")} · ${DEFAULT_CUSTOM_SIZE}` },
  ]
}

function getSizeDimensions(size: string) {
  const normalized = normalizeCustomSize(size)

  if (!normalized) {
    return null
  }

  const [width, height] = normalized.split("x").map(Number)
  return { height, width }
}

function getSizePreviewClass(size: string) {
  if (size === "1024x1536") {
    return "aspect-[2/3]"
  }

  if (size === "1536x1024") {
    return "aspect-[3/2]"
  }

  if (size === "2048x1152" || size === "3840x2160") {
    return "aspect-video"
  }

  if (size === "2160x3840") {
    return "aspect-[9/16]"
  }

  return "aspect-square"
}

function getSizePreviewStyle(size: string): CSSProperties | undefined {
  const dimensions = getSizeDimensions(size)

  if (!dimensions) {
    return undefined
  }

  return { aspectRatio: `${dimensions.width} / ${dimensions.height}` }
}

function getQualityItems(locale: Locale) {
  return [
    { label: t(locale, "qualityAuto"), value: "auto" },
    { label: t(locale, "qualityLow"), value: "low" },
    { label: t(locale, "qualityMedium"), value: "medium" },
    { label: t(locale, "qualityHigh"), value: "high" },
  ]
}

function getFormatItems() {
  return [
    { label: "PNG", value: "png" },
    { label: "JPEG", value: "jpeg" },
    { label: "WEBP", value: "webp" },
  ]
}

function getBackgroundItems(locale: Locale) {
  return [
    { label: t(locale, "backgroundAuto"), value: "auto" },
    { label: t(locale, "backgroundOpaque"), value: "opaque" },
    { label: t(locale, "backgroundTransparent"), value: "transparent" },
  ]
}

function readCookieValue(name: string) {
  const value = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`))
    ?.split("=")[1]

  return value ? decodeURIComponent(value) : null
}

function getPreferredClientLocale(): Locale {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE
  }

  return resolveLocaleFrom(
    localStorage.getItem(LOCALE_STORAGE_KEY),
    readCookieValue(LOCALE_COOKIE_KEY),
    navigator.language,
    document.documentElement.lang
  )
}

function subscribeToLocalePreferenceChange(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === LOCALE_STORAGE_KEY) {
      onStoreChange()
    }
  }

  window.addEventListener("storage", handleStorage)

  return () => window.removeEventListener("storage", handleStorage)
}

function readStoredConnectionPreferences(): StoredConnectionPreferences {
  const storedPreferences = localStorage.getItem(CONNECTION_PREFERENCES_KEY)

  if (storedPreferences) {
    try {
      const parsed = JSON.parse(storedPreferences) as Partial<StoredConnectionPreferences>

      if (
        parsed.version === 1 &&
        typeof parsed.remember === "boolean" &&
        typeof parsed.apiKey === "string" &&
        typeof parsed.endpoint === "string"
      ) {
        return {
          version: 1,
          remember: parsed.remember,
          apiKey: parsed.apiKey,
          endpoint: parsed.endpoint.trim() || DEFAULT_ENDPOINT,
        }
      }
    } catch {
      localStorage.removeItem(CONNECTION_PREFERENCES_KEY)
    }
  }

  const remember = localStorage.getItem(LEGACY_REMEMBER_KEY_KEY) === "true"

  return {
    version: 1,
    remember,
    apiKey: remember ? localStorage.getItem(LEGACY_API_KEY_KEY) || "" : "",
    endpoint: remember ? localStorage.getItem(LEGACY_ENDPOINT_KEY)?.trim() || DEFAULT_ENDPOINT : DEFAULT_ENDPOINT,
  }
}

function clearStoredConnectionPreferences() {
  localStorage.removeItem(CONNECTION_PREFERENCES_KEY)
  localStorage.removeItem(LEGACY_API_KEY_KEY)
  localStorage.removeItem(LEGACY_REMEMBER_KEY_KEY)
  localStorage.removeItem(LEGACY_ENDPOINT_KEY)
}

function writeStoredConnectionPreferences({
  apiKey,
  endpoint,
}: Pick<StoredConnectionPreferences, "apiKey" | "endpoint">) {
  const preferences: StoredConnectionPreferences = {
    version: 1,
    remember: true,
    apiKey,
    endpoint: endpoint.trim() || DEFAULT_ENDPOINT,
  }

  localStorage.setItem(CONNECTION_PREFERENCES_KEY, JSON.stringify(preferences))
  localStorage.removeItem(LEGACY_API_KEY_KEY)
  localStorage.removeItem(LEGACY_REMEMBER_KEY_KEY)
  localStorage.removeItem(LEGACY_ENDPOINT_KEY)
}

export function ImageStudio({ initialLocale = DEFAULT_LOCALE }: { initialLocale?: Locale }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const activeSourceRef = useRef<ActiveSource | null>(null)
  const uploadsRef = useRef<UploadPreview[]>([])
  const progressResetTimeoutRef = useRef<number | null>(null)
  const referenceDropDepthRef = useRef(0)
  const browserLocale = useSyncExternalStore(
    subscribeToLocalePreferenceChange,
    getPreferredClientLocale,
    () => initialLocale
  )
  const [localeOverride, setLocaleOverride] = useState<Locale | null>(null)
  const [apiKey, setApiKey] = useState("")
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false)
  const [rememberKey, setRememberKey] = useState(false)
  const [hasLoadedPreferences, setHasLoadedPreferences] = useState(false)
  const [customPrompt, setCustomPrompt] = useState<string | null>(null)
  const [selectedPromptPresetIndex, setSelectedPromptPresetIndex] = useState(0)
  const [endpoint, setEndpoint] = useState(DEFAULT_ENDPOINT)
  const [model, setModel] = useState("gpt-image-2")
  const [uploads, setUploads] = useState<UploadPreview[]>([])
  const [isReferenceDropActive, setIsReferenceDropActive] = useState(false)
  const [sizeMode, setSizeMode] = useState<SizeSelectValue>(DEFAULT_SIZE)
  const [customSize, setCustomSize] = useState(DEFAULT_CUSTOM_SIZE)
  const [quality, setQuality] = useState("auto")
  const [outputFormat, setOutputFormat] = useState("png")
  const [background, setBackground] = useState("auto")
  const [imageCount, setImageCount] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<StudioResponse | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [activeSource, setActiveSource] = useState<ActiveSource | null>(null)
  const [history, setHistory] = useState<HistoryEntry<StudioResponse>[]>([])
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null)
  const locale = localeOverride ?? browserLocale
  const text = studioMessages[locale]
  const workflow = getWorkflowCopy(locale)
  const isCjk = isCjkLocale(locale)
  const selectedLocale = LOCALE_OPTIONS.find((item) => item.value === locale) || LOCALE_OPTIONS[0]
  const promptPresets = useMemo(() => studioPromptPresets[locale], [locale])
  const prompt = customPrompt ?? promptPresets[selectedPromptPresetIndex] ?? promptPresets[0]
  const sizeOptions = useMemo(() => getSizeOptions(locale), [locale])
  const customSizeValue = useMemo(() => normalizeCustomSize(customSize), [customSize])
  const isCustomSize = sizeMode === CUSTOM_SIZE_OPTION_VALUE
  const size: SizeValue = isCustomSize ? customSizeValue || customSize.trim() : sizeMode
  const qualityItems = useMemo(() => getQualityItems(locale), [locale])
  const formatItems = useMemo(() => getFormatItems(), [])
  const backgroundItems = useMemo(() => getBackgroundItems(locale), [locale])
  const qualityLabelByValue = useMemo(
    () => Object.fromEntries(qualityItems.map((item) => [item.value, item.label])),
    [qualityItems]
  )

  const selectedSizeOption = useMemo(
    () => sizeOptions.find((item) => item.value === sizeMode) || sizeOptions[1],
    [sizeOptions, sizeMode]
  )
  const selectedSizeLabel = isCustomSize
    ? customSizeValue
      ? `${customSizeValue} · ${text.aspectCustom}`
      : text.customAspectDescription
    : selectedSizeOption.label
  const selectedImage = result?.images[selectedImageIndex] || result?.images[0] || null
  const selectedImageNumber = selectedImage ? Math.min(selectedImageIndex, (result?.images.length || 1) - 1) + 1 : 0
  const inputUploads = activeSource ? [activeSource.upload, ...uploads] : uploads
  const inputUploadCount = inputUploads.length
  const maxReferenceUploads = getReferenceUploadLimit(activeSource)
  const nextGeneration = activeSource ? activeSource.round + 1 : 1

  useEffect(() => {
    document.documentElement.lang = getDocumentLang(locale)
    document.title = text.metadataTitle
  }, [locale, text.metadataTitle])

  useEffect(() => {
    if (localeOverride === null) {
      return
    }

    localStorage.setItem(LOCALE_STORAGE_KEY, localeOverride)
    document.cookie = `${LOCALE_COOKIE_KEY}=${encodeURIComponent(localeOverride)}; Path=/; Max-Age=31536000; SameSite=Lax`
  }, [localeOverride])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const preferences = readStoredConnectionPreferences()

      setRememberKey(preferences.remember)
      setApiKey(preferences.apiKey)
      setEndpoint(preferences.endpoint)

      setHasLoadedPreferences(true)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    if (!hasLoadedPreferences) {
      return
    }

    if (!rememberKey) {
      clearStoredConnectionPreferences()
      return
    }

    writeStoredConnectionPreferences({ apiKey, endpoint })
  }, [apiKey, endpoint, hasLoadedPreferences, rememberKey])

  useEffect(() => {
    let cancelled = false

    loadHistory<StudioResponse>().then((entries) => {
      if (!cancelled) {
        setHistory(entries)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    uploadsRef.current = uploads
  }, [uploads])

  useEffect(() => {
    activeSourceRef.current = activeSource
  }, [activeSource])

  useEffect(() => {
    return () => {
      for (const upload of uploadsRef.current) {
        URL.revokeObjectURL(upload.url)
      }

      if (activeSourceRef.current) {
        URL.revokeObjectURL(activeSourceRef.current.upload.url)
      }

      if (progressResetTimeoutRef.current) {
        window.clearTimeout(progressResetTimeoutRef.current)
      }
    }
  }, [])

  const updatePrompt = useCallback((next: string | ((current: string) => string)) => {
    setCustomPrompt((current) => (typeof next === "function" ? next(current ?? prompt) : next))
  }, [prompt])

  const addUploads = useCallback((files: FileList | File[]) => {
    const accepted: UploadPreview[] = []

    for (const file of Array.from(files)) {
      if (!ACCEPTED_TYPES.has(file.type)) {
        toast.error(t(locale, "unsupportedImageFormat", { name: file.name }))
        continue
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(t(locale, "exceedsMaxFileSize", { name: file.name }))
        continue
      }

      accepted.push({
        file,
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        url: URL.createObjectURL(file),
      })
    }

    setUploads((current) => {
      const merged = [...current, ...accepted]
      const { overflow, visible } = splitUploadsByLimit(merged, maxReferenceUploads)

      for (const upload of overflow) {
        URL.revokeObjectURL(upload.url)
      }

      if (overflow.length) {
        toast.warning(t(locale, "maxUploadsWarning", { count: maxReferenceUploads }))
      }

      return visible
    })
  }, [locale, maxReferenceUploads])

  const handleReferenceDragEnter = useCallback((event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (!Array.from(event.dataTransfer.types).includes("Files")) {
      return
    }

    referenceDropDepthRef.current += 1
    event.dataTransfer.dropEffect = "copy"
    setIsReferenceDropActive(true)
  }, [])

  const handleReferenceDragOver = useCallback((event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (Array.from(event.dataTransfer.types).includes("Files")) {
      event.dataTransfer.dropEffect = "copy"
    }
  }, [])

  const handleReferenceDragLeave = useCallback((event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    referenceDropDepthRef.current = Math.max(referenceDropDepthRef.current - 1, 0)

    if (referenceDropDepthRef.current === 0) {
      setIsReferenceDropActive(false)
    }
  }, [])

  const handleReferenceDrop = useCallback((event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    referenceDropDepthRef.current = 0
    setIsReferenceDropActive(false)

    if (event.dataTransfer.files.length > 0) {
      addUploads(event.dataTransfer.files)
      return
    }

    const droppedFiles = Array.from(event.dataTransfer.items)
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null)

    if (droppedFiles.length > 0) {
      addUploads(droppedFiles)
    }
  }, [addUploads])

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items
      if (!items) {
        return
      }

      const pastedImages = Array.from(items)
        .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
        .map((item) => item.getAsFile())
        .filter((file): file is File => file !== null)

      if (pastedImages.length === 0) {
        return
      }

      event.preventDefault()
      addUploads(pastedImages)
    }

    window.addEventListener("paste", handlePaste)
    return () => window.removeEventListener("paste", handlePaste)
  }, [addUploads])

  const removeUpload = useCallback((id: string) => {
    setUploads((current) => {
      const removed = current.find((upload) => upload.id === id)

      if (removed) {
        URL.revokeObjectURL(removed.url)
      }

      return current.filter((upload) => upload.id !== id)
    })
  }, [])

  function clearActiveSource() {
    setActiveSource((current) => {
      if (current) {
        URL.revokeObjectURL(current.upload.url)
      }

      return null
    })
  }

  async function setGeneratedImageAsSource(index: number, recipeId?: RemixRecipeId) {
    const image = result?.images[index]

    if (!image) {
      toast.error(workflow.stageFailed)
      return
    }

    try {
      const upload = await createGeneratedUploadPreview({
        image,
        index,
        locale,
        outputFormat: result?.outputFormat || outputFormat,
      })
      const nextSource: ActiveSource = {
        label: `${workflow.sourceReady} · ${String(index + 1).padStart(2, "0")}`,
        promptSnapshot: image.revisedPrompt || result?.prompt || prompt.trim(),
        round: result?.generation || 1,
        upload,
      }

      setActiveSource((current) => {
        if (current) {
          URL.revokeObjectURL(current.upload.url)
        }

        return nextSource
      })
      setUploads((current) => {
        const nextLimit = getReferenceUploadLimit(nextSource)
        const { overflow, visible } = splitUploadsByLimit(current, nextLimit)

        for (const extraUpload of overflow) {
          URL.revokeObjectURL(extraUpload.url)
        }

        if (overflow.length) {
          toast.warning(t(locale, "maxUploadsWarning", { count: nextLimit }))
        }

        return visible
      })
      setSelectedImageIndex(index)

      if (recipeId) {
        const recipe = workflow.recipes[recipeId]
        const recipeItem = remixRecipeItems.find((item) => item.id === recipeId)

        updatePrompt((current) => appendRemixInstruction(current, recipe.instruction))
        setImageCount(recipeItem?.count || 1)
        toast.success(workflow.recipeSuccess)
        return
      }

      toast.success(workflow.referenceSuccess)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : workflow.stageFailed)
    }
  }

  async function copyPromptToClipboard(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(workflow.copyPromptSuccess)
    } catch {
      toast.error(workflow.copyPromptFailed)
    }
  }

  async function commitToHistory(response: StudioResponse) {
    const entry: HistoryEntry<StudioResponse> = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      imageCount: response.images.length,
      response,
    }

    setActiveHistoryId(entry.id)

    try {
      setHistory(await saveHistoryEntry(entry))
    } catch {
      setHistory((current) => [entry, ...current])
    }
  }

  function restoreHistory(entry: HistoryEntry<StudioResponse>) {
    setResult(entry.response)
    setSelectedImageIndex(0)
    setActiveHistoryId(entry.id)
  }

  function removeHistory(id: string) {
    setHistory((current) => current.filter((entry) => entry.id !== id))
    setActiveHistoryId((current) => (current === id ? null : current))
    void deleteHistoryEntry(id).catch(() => undefined)
  }

  function clearAllHistory() {
    setHistory([])
    setActiveHistoryId(null)
    void clearHistory().catch(() => undefined)
  }

  async function callProxy(requestedCount: number): Promise<{ endpoint: string; images: GeneratedImage[] }> {
    const formData = new FormData()
    const requestPrompt = buildRequestPrompt(prompt, activeSource)

    formData.append("apiKey", apiKey.trim())
    formData.append("background", background)
    formData.append("endpoint", endpoint.trim())
    formData.append("imageCount", String(requestedCount))
    formData.append("locale", locale)
    formData.append("model", model)
    formData.append("outputFormat", outputFormat)
    formData.append("prompt", requestPrompt)
    formData.append("quality", quality)
    formData.append("size", size)

    for (const upload of inputUploads) {
      formData.append("images", upload.file, upload.file.name)
    }

    const response = await fetch("/api/images", {
      method: "POST",
      body: formData,
    })
    const payload = (await response.json()) as {
      endpoint?: string
      error?: string
      images?: GeneratedImage[]
    }

    if (!response.ok) {
      throw new Error(payload.error || t(locale, "requestFailedStatus", { status: response.status }))
    }

    if (!payload.images?.length) {
      throw new Error(t(locale, "noImageInPayload"))
    }

    return {
      endpoint: payload.endpoint || endpoint,
      images: payload.images,
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (progressResetTimeoutRef.current) {
      window.clearTimeout(progressResetTimeoutRef.current)
      progressResetTimeoutRef.current = null
    }

    if (!prompt.trim()) {
      toast.error(text.promptRequired)
      return
    }

    if (isCustomSize && !customSizeValue) {
      toast.error(text.customAspectInvalid)
      return
    }

    setIsGenerating(true)
    setProgress(8)
    setResult(null)
    setSelectedImageIndex(0)

    const total = Math.min(Math.max(imageCount, 1), 4)
    let collectedEndpoint = ""
    let firstError: unknown = null

    try {
      const images: GeneratedImage[] = []
      const maxAttempts = total + 2
      let attempts = 0

      const createResult = (visibleImages: GeneratedImage[]): StudioResponse => ({
        endpoint: collectedEndpoint,
        generation: nextGeneration,
        images: visibleImages,
        model,
        outputFormat,
        prompt: prompt.trim(),
        quality,
        requestedCount: total,
        size,
        sourceLabel: activeSource?.label,
      })

      const publishResult = () => {
        const visibleImages = images.slice(0, total)

        if (!visibleImages.length) {
          return
        }

        setResult(createResult(visibleImages))
        setSelectedImageIndex((current) => current < visibleImages.length ? current : 0)
        setProgress(Math.min(95, 8 + Math.round((visibleImages.length / total) * 87)))
      }

      const runRequest = async () => {
        try {
          const topUp = await callProxy(1)
          collectedEndpoint = topUp.endpoint

          if (images.length < total) {
            images.push(...topUp.images.slice(0, total - images.length))
            publishResult()
          }
        } catch (error) {
          if (!firstError) {
            firstError = error
          }
        }
      }

      while (images.length < total && attempts < maxAttempts) {
        const batchSize = Math.min(total - images.length, maxAttempts - attempts)
        attempts += batchSize

        await Promise.all(Array.from({ length: batchSize }, runRequest))
      }

      if (!images.length) {
        throw firstError instanceof Error
          ? firstError
          : new Error(text.allRequestsFailed)
      }

      const visibleImages = images.slice(0, total)
      const finalResult = createResult(visibleImages)

      setResult(finalResult)
      setSelectedImageIndex((current) => current < visibleImages.length ? current : 0)
      setProgress(100)
      void commitToHistory(finalResult)

      if (visibleImages.length < total && firstError) {
        toast.warning(
          t(locale, "generatedPartialWarning", {
            count: visibleImages.length,
            total,
            error: getGenerationErrorMessage(firstError, String(firstError)),
          })
        )
      } else {
        toast.success(
          t(locale, "generatedSuccess", {
            count: visibleImages.length,
            suffix: pluralSuffix(locale, visibleImages.length),
          })
        )
      }

      progressResetTimeoutRef.current = window.setTimeout(() => {
        setProgress(0)
        progressResetTimeoutRef.current = null
      }, 900)
    } catch (error) {
      toast.error(getGenerationErrorMessage(error, text.generationFailed))
      setProgress(0)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div
      data-locale={locale}
      translate="no"
      className={cn("notranslate studio-shell flex min-h-screen flex-col text-foreground", isCjk && "studio-cjk")}
    >
      <header className="studio-header-surface sticky top-0 z-30 border-b backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1840px] items-center justify-between gap-3 px-4 py-3 sm:gap-5 sm:px-6">
          <div className="flex items-center">
            <div className="studio-logo-mark shrink-0">
              <Image
                priority
                alt="ImgX Studio"
                className="studio-logo-image"
                height={123}
                src="/logo.png"
                style={{ width: "100%", height: "auto" }}
                width={426}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 font-mono text-[11px] text-muted-foreground shadow-sm md:flex">
              <span className="font-medium text-foreground">{model}</span>
              <span className="text-border">·</span>
              <span>{size}</span>
              <span className="text-border">·</span>
              <span>{outputFormat.toUpperCase()}</span>
              <span className="text-border">·</span>
              <span className="font-medium text-foreground">×{imageCount}</span>
            </div>
            <Select
              items={LOCALE_OPTIONS}
              value={locale}
              onValueChange={(value) => {
                const next = resolveLocale(value)
                const currentPresetIndex = customPrompt ? promptPresets.indexOf(customPrompt) : selectedPromptPresetIndex

                if (currentPresetIndex !== -1) {
                  setSelectedPromptPresetIndex(currentPresetIndex)
                  setCustomPrompt(null)
                }

                setLocaleOverride(next)
              }}
            >
              <SelectTrigger
                aria-label={text.localeSwitchAria}
                className="h-10 w-14 rounded-md bg-muted/40 px-2 text-xs font-semibold shadow-sm sm:w-[154px] sm:px-3"
              >
                <LanguagesIcon data-icon="inline-start" />
                <SelectValue className="hidden sm:flex" placeholder={text.localeLabel}>
                  {selectedLocale.nativeLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} className="min-w-[190px]">
                <SelectGroup>
                  {LOCALE_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      <span className="flex items-baseline justify-between gap-4">
                        <span>{item.nativeLabel}</span>
                        <span className="text-xs text-muted-foreground">{item.value}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <a
              aria-label="GitHub"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "h-10 rounded-md bg-muted/40 px-3 shadow-sm"
              )}
              href={GITHUB_REPOSITORY_URL}
              rel="noreferrer"
              target="_blank"
            >
              <GitHubMarkIcon />
              <span className="hidden sm:inline">GitHub</span>
              <span className="sr-only sm:hidden">GitHub</span>
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1840px] flex-1 gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        <form
          onSubmit={handleSubmit}
          className="studio-panel relative flex flex-col overflow-hidden rounded-lg backdrop-blur-xl lg:max-h-[calc(100vh-102px)]"
        >
          <div className="flex flex-col gap-5 overflow-y-auto px-4 py-4">
            <Section index="00" title={text.sectionPromptTitle} hint={text.sectionPromptHint}>
              <FieldGroup>
                <Field>
                  <Textarea
                    id="prompt"
                    className="studio-control min-h-48 resize-y rounded-md p-4 text-sm leading-6 placeholder:text-muted-foreground/65"
                    placeholder={text.promptPlaceholder}
                    value={prompt}
                    onChange={(event) => updatePrompt(event.target.value)}
                  />
                </Field>
                <div className="flex flex-wrap gap-1.5">
                  {promptPresets.map((preset, index) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setSelectedPromptPresetIndex(index)
                        setCustomPrompt(null)
                      }}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-md border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <WandSparklesIcon className="size-3" />
                      {t(locale, "presetLabel", { index: index + 1 })}
                    </button>
                  ))}
                </div>
              </FieldGroup>
            </Section>

            <Section
              index="01"
              title={text.sectionReferencesTitle}
              hint={`${inputUploadCount} / ${MAX_UPLOADS}`}
            >
              <FieldGroup>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={handleReferenceDragEnter}
                  onDragLeave={handleReferenceDragLeave}
                  onDragOver={handleReferenceDragOver}
                  onDrop={handleReferenceDrop}
                  className={cn(
                    "studio-accent-card group flex h-28 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground",
                    isReferenceDropActive && "border-foreground/40 bg-muted/50 text-foreground"
                  )}
                >
                  <span className="font-medium">{text.clickOrDropReferences}</span>
                  <span className="text-xs text-muted-foreground">{text.referenceDropHint}</span>
                </button>
                <input
                  ref={fileInputRef}
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="sr-only"
                  multiple
                  type="file"
                  onChange={(event) => {
                    if (event.target.files) {
                      addUploads(event.target.files)
                      event.target.value = ""
                    }
                  }}
                />

                {inputUploadCount > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {activeSource && (
                      <div className="group relative overflow-hidden rounded-md border bg-muted/30 shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          alt={workflow.activeSource}
                          className="aspect-[4/3] w-full object-cover"
                          src={activeSource.upload.url}
                        />
                        <div className="flex items-center justify-between gap-2 px-3 py-2 text-[11px]">
                          <Badge variant="secondary" className="rounded-md px-2 py-0.5 text-[10px]">
                            <Layers3Icon data-icon="inline-start" />
                            {workflow.sourceReady}
                          </Badge>
                          <button
                            type="button"
                            aria-label={workflow.clearSource}
                            onClick={clearActiveSource}
                            className="inline-flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          >
                            <XIcon className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                    {uploads.map((upload) => (
                      <div
                        key={upload.id}
                        className="group relative overflow-hidden rounded-md border bg-muted/30 shadow-sm"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          alt={upload.file.name}
                          className="aspect-[4/3] w-full object-cover"
                          src={upload.url}
                        />
                        <div className="flex items-center justify-between gap-2 px-3 py-2 text-[11px]">
                          <span className="truncate font-mono text-muted-foreground">
                            {formatBytes(upload.file.size)}
                          </span>
                          <button
                            type="button"
                            aria-label={t(locale, "removeReferenceAria", { name: upload.file.name })}
                            onClick={() => removeUpload(upload.id)}
                            className="inline-flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          >
                            <XIcon className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </FieldGroup>
            </Section>

            <Section index="02" title={text.sectionOutputTitle} hint={text.sectionOutputHint}>
              <FieldGroup>
                <Field data-invalid={isCustomSize && !customSizeValue ? true : undefined}>
                  <FieldLabel className="text-xs font-semibold text-muted-foreground">
                    {text.aspect}
                  </FieldLabel>
                  <Select
                    items={sizeOptions}
                    value={sizeMode}
                    onValueChange={(value) => setSizeMode(getNextSizeMode(value))}
                  >
                    <SelectTrigger className="studio-control h-11 w-full rounded-md font-mono text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="start">
                      <SelectGroup>
                        {sizeOptions.map((item) => (
                          <SelectItem key={item.value} value={item.value} className="font-mono text-xs">
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {isCustomSize && (
                    <Input
                      aria-invalid={!customSizeValue}
                      className="studio-control mt-2 h-11 rounded-md font-mono text-xs"
                      inputMode="text"
                      placeholder={text.customAspectPlaceholder}
                      spellCheck={false}
                      value={customSize}
                      onChange={(event) => setCustomSize(event.target.value)}
                    />
                  )}
                  <FieldDescription className="text-xs">
                    {selectedSizeLabel}
                  </FieldDescription>
                </Field>

                <div className="grid grid-cols-3 gap-2">
                  <Field>
                    <FieldLabel className="text-xs font-semibold text-muted-foreground">
                      {text.quality}
                    </FieldLabel>
                    <Select
                      items={qualityItems}
                      value={quality}
                      onValueChange={(value) => setQuality(selectValue(value, "auto"))}
                    >
                        <SelectTrigger className="studio-control w-full rounded-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {qualityItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel className="text-xs font-semibold text-muted-foreground">
                      {text.format}
                    </FieldLabel>
                    <Select
                      items={formatItems}
                      value={outputFormat}
                      onValueChange={(value) => setOutputFormat(selectValue(value, "png"))}
                    >
                        <SelectTrigger className="studio-control w-full rounded-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {formatItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel className="text-xs font-semibold text-muted-foreground">
                      {text.background}
                    </FieldLabel>
                    <Select
                      items={backgroundItems}
                      value={background}
                      onValueChange={(value) => setBackground(selectValue(value, "auto"))}
                    >
                        <SelectTrigger className="studio-control w-full rounded-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {backgroundItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Field>
                  <div className="flex items-center justify-between">
                    <FieldLabel className="text-xs font-semibold text-muted-foreground">
                      {text.count}
                    </FieldLabel>
                    <span className="font-mono text-xs text-foreground">×{imageCount}</span>
                  </div>
                  <ToggleGroup
                    spacing={2}
                    value={[String(imageCount)]}
                    variant="outline"
                    onValueChange={(values) => {
                      const next = values.at(-1)
                      if (next) setImageCount(Number(next))
                    }}
                    className={cn("grid w-full grid-cols-4", optionGroupClassName)}
                  >
                    {[1, 2, 3, 4].map((value) => (
                      <ToggleGroupItem
                        key={value}
                        value={String(value)}
                        className={optionItemClassName}
                      >
                        {value}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  <FieldDescription className="text-xs">
                    {t(locale, "countDescription", { count: imageCount })}
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </Section>

            <Section index="03" title={text.sectionConnectionTitle} hint={text.sectionConnectionHint}>
              <FieldGroup>
                <Field>
                  <FieldLabel className="text-xs font-semibold text-muted-foreground">
                    {text.model}
                  </FieldLabel>
                  <Select
                    items={modelItems}
                    value={model}
                    onValueChange={(value) => setModel(selectValue(value, "gpt-image-2"))}
                  >
                    <SelectTrigger className="studio-control w-full rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {modelItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel
                    htmlFor="endpoint"
                    className="text-xs font-semibold text-muted-foreground"
                  >
                    {text.baseUrl}
                  </FieldLabel>
                  <Input
                    id="endpoint"
                    className="studio-control rounded-md font-mono text-xs focus-visible:border-primary focus-visible:ring-primary/20"
                    value={endpoint}
                    onChange={(event) => setEndpoint(event.target.value)}
                  />
                  <FieldDescription className="text-xs">
                    {text.baseUrlDescription}
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel
                    htmlFor="api-key"
                    className="text-xs font-semibold text-muted-foreground"
                  >
                    {text.apiKey}
                  </FieldLabel>
                  <div className="relative">
                    <input
                      id="api-key"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="sk-..."
                      type={isApiKeyVisible ? "text" : "password"}
                      className="studio-control h-11 w-full min-w-0 rounded-md border px-3 py-1 pr-11 font-mono text-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20"
                      value={apiKey}
                      onChange={(event) => setApiKey(event.target.value)}
                    />
                    <button
                      type="button"
                      aria-controls="api-key"
                      aria-label={isApiKeyVisible ? text.hideApiKey : text.showApiKey}
                      aria-pressed={isApiKeyVisible}
                      className="absolute top-1/2 right-2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setIsApiKeyVisible((visible) => !visible)}
                    >
                      {isApiKeyVisible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                    </button>
                  </div>
                </Field>

                <Field orientation="horizontal">
                  <Switch
                    checked={rememberKey}
                    id="remember-key"
                    onCheckedChange={setRememberKey}
                  />
                  <FieldContent>
                    <FieldLabel htmlFor="remember-key" className="text-xs">
                      {text.rememberOnDevice}
                    </FieldLabel>
                    <FieldDescription className="text-xs">
                      {text.rememberDescription}
                    </FieldDescription>
                  </FieldContent>
                </Field>
              </FieldGroup>
            </Section>
          </div>

          <div className="sticky bottom-0 mt-auto flex flex-col gap-3 border-t bg-background/80 px-4 py-4 backdrop-blur-xl">
            <Button
              type="submit"
              size="lg"
              disabled={isGenerating}
              className="studio-primary-button h-[52px] w-full justify-center rounded-lg text-base font-semibold tracking-tight"
            >
              <span
                aria-hidden="true"
                data-icon="inline-start"
                className="relative grid size-4 place-items-center"
              >
                <LoaderCircleIcon
                  className={cn(
                    "absolute transition-opacity",
                    isGenerating ? "animate-spin opacity-100" : "opacity-0"
                  )}
                />
                <PlayIcon className={cn("transition-opacity", isGenerating ? "opacity-0" : "opacity-100")} />
              </span>
              {isGenerating ? text.generating : activeSource ? workflow.continueGeneration : text.generateImages}
              <span className="ml-2 text-xs font-medium opacity-80">
                ×{imageCount}
              </span>
            </Button>
            <Progress
              value={progress}
              className={cn(
                "h-1.5 rounded-sm transition-opacity duration-300",
                isGenerating || progress > 0 ? "opacity-100" : "opacity-0"
              )}
            />
          </div>
        </form>

        <main className="studio-panel relative flex min-h-[calc(100vh-102px)] flex-col overflow-hidden rounded-lg backdrop-blur-xl lg:max-h-[calc(100vh-102px)]">
          <div className="studio-vignette pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative flex items-center justify-between gap-3 border-b bg-muted/20 px-5 py-4 backdrop-blur">
            <div>
              <span className="text-sm font-semibold text-foreground">{text.creativeCanvas}</span>
              <span className="ml-2 text-sm text-muted-foreground">
                {result
                  ? t(locale, "generatedCountLabel", {
                      count: result.images.length === result.requestedCount
                        ? result.images.length
                        : `${result.images.length}/${result.requestedCount}`,
                      suffix: pluralSuffix(locale, result.images.length),
                    })
                  : text.readyForNextConcept}
              </span>
            </div>
            <div className="hidden items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground shadow-sm sm:flex">
              <KeyRoundIcon className="size-3" />
              {apiKey ? text.keySet : text.noKey}
              <span className="text-border">·</span>
              <span className="max-w-[260px] truncate font-mono text-[11px]">
                {endpoint}
              </span>
            </div>
          </div>

          {history.length > 0 && (
            <HistoryStrip
              activeId={activeHistoryId}
              clearLabel={text.historyClear}
              entries={history}
              removeLabel={text.historyRemove}
              restoreLabel={text.historyRestore}
              title={text.historyTitle}
              onClear={clearAllHistory}
              onRemove={removeHistory}
              onRestore={restoreHistory}
            />
          )}

          <div className="relative flex-1 overflow-y-auto p-5">
            {result?.images.length ? (
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
                <section className="flex min-w-0 flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MousePointer2Icon className="size-4 text-primary" />
                      <span>
                        {workflow.selected}: {String(selectedImageNumber).padStart(2, "0")}
                      </span>
                    </div>
                    <Badge variant="secondary" className="rounded-md px-3 py-1">
                      {workflow.generatedAsset} · {result.images.length === result.requestedCount
                        ? result.images.length
                        : `${result.images.length}/${result.requestedCount}`}
                    </Badge>
                  </div>

                  <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
                    {result.images.map((image, index) => {
                      const isSelected = index === selectedImageIndex

                      return (
                        <article
                          key={`${image.src}-${index}`}
                          className={cn(
                            "group relative flex flex-col overflow-hidden rounded-lg border bg-card shadow-[0_24px_70px_-50px_rgba(0,0,0,0.9)] transition-colors duration-200",
                            isSelected
                              ? "border-primary bg-primary/5 ring-[3px] ring-primary/15"
                              : "border-border opacity-90 hover:border-foreground/30 hover:opacity-100"
                          )}
                        >
                          {isSelected && (
                            <div
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-0 z-10 rounded-lg ring-1 ring-inset ring-primary"
                            />
                          )}
                          <button
                            type="button"
                            aria-label={`${workflow.selectImage} ${index + 1}`}
                            aria-pressed={isSelected}
                            onClick={() => setSelectedImageIndex(index)}
                            className="relative cursor-pointer bg-background text-left outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              alt={`${text.generateImages} ${index + 1}`}
                              className={cn(
                                "w-full object-cover transition duration-300 group-hover:scale-[1.015]",
                                getSizePreviewClass(result.size)
                              )}
                              style={getSizePreviewStyle(result.size)}
                              src={image.src}
                            />
                            <div className="absolute left-3 top-3 rounded-md bg-background/80 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur">
                              {String(index + 1).padStart(2, "0")}
                            </div>
                            {isSelected && (
                              <Badge className="absolute right-3 top-3 rounded-md px-3 py-1.5 text-[11px] shadow-xl ring-1 ring-background/70">
                                <CheckCircle2Icon data-icon="inline-start" />
                                {workflow.selected}
                              </Badge>
                            )}
                            {isSelected && (
                              <div className="absolute inset-x-3 bottom-3 rounded-md bg-primary px-3 py-2 text-center text-xs font-semibold text-primary-foreground shadow-xl">
                                {workflow.selectedAsset} · {String(index + 1).padStart(2, "0")}
                              </div>
                            )}
                          </button>

                          <div className="flex flex-col gap-3 border-t px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <span className="min-w-0 truncate text-xs font-medium text-muted-foreground">
                                {result.outputFormat.toUpperCase()} · {result.size}
                              </span>
                              {image.revisedPrompt && (
                                <Badge variant="outline" className="rounded-md bg-muted/40 text-[10px]">
                                  <SparklesIcon data-icon="inline-start" />
                                  prompt
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="h-9 rounded-md"
                                onClick={() => setGeneratedImageAsSource(index)}
                              >
                                <ImagePlusIcon data-icon="inline-start" />
                                {workflow.setAsSource}
                              </Button>
                              <a
                                className={cn(
                                  buttonVariants({ size: "sm", variant: "outline" }),
                                  "h-9 rounded-md bg-muted/40 px-3 text-xs font-semibold"
                                )}
                                download={`imgx-${index + 1}.${result.outputFormat}`}
                                href={image.src}
                              >
                                <ArrowDownToLineIcon data-icon="inline-start" />
                                {text.save}
                              </a>
                            </div>
                          </div>
                        </article>
                      )
                    })}
                    {isGenerating &&
                      Array.from(
                        { length: Math.max(result.requestedCount - result.images.length, 0) },
                        (_, index) => <PendingImageCard key={`pending-${index}`} />
                      )}
                  </div>
                </section>

                <RemixPanel
                  image={selectedImage}
                  imageIndex={selectedImageNumber}
                  isCjk={isCjk}
                  outputFormat={result.outputFormat}
                  prompt={prompt}
                  size={result.size}
                  workflow={workflow}
                  onCopyPrompt={copyPromptToClipboard}
                  onSelectRecipe={(recipeId) => setGeneratedImageAsSource(selectedImageNumber - 1, recipeId)}
                  onStageReference={() => setGeneratedImageAsSource(selectedImageNumber - 1)}
                  onUseRevisedPrompt={(value) => updatePrompt(value)}
                />
              </div>
            ) : isGenerating ? (
              <GenerationSkeleton count={imageCount} workflow={workflow} />
            ) : (
              <EmptyCanvas
                imageCount={imageCount}
                isCjk={isCjk}
                model={model}
                outputFormat={outputFormat}
                size={size}
                text={text}
              />
            )}
          </div>

          {result && (
            <div className="relative border-t bg-background/70 px-5 py-4 backdrop-blur">
              <div className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
                {[
                  [text.summaryModel, result.model],
                  [text.summarySize, result.size],
                  [text.summaryQuality, qualityLabelByValue[result.quality] || result.quality],
                  [text.summaryFormat, result.outputFormat.toUpperCase()],
                  [
                    text.summaryCount,
                    result.images.length === result.requestedCount
                      ? String(result.images.length)
                      : `${result.images.length} / ${result.requestedCount}`,
                  ],
                  [workflow.activeSource, result.sourceLabel || workflow.sourceRound.replace("{round}", String(result.generation))],
                  [text.summaryRefs, String(inputUploadCount)],
                  [text.summaryEndpoint, result.endpoint],
                ].map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-baseline gap-3 rounded-md border bg-muted/30 px-3 py-2 shadow-sm"
                  >
                    <span className="font-medium text-muted-foreground">
                      {key}
                    </span>
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-foreground",
                        key === text.summaryEndpoint ? "text-left" : "text-right"
                      )}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function HistoryStrip({
  activeId,
  clearLabel,
  entries,
  removeLabel,
  restoreLabel,
  title,
  onClear,
  onRemove,
  onRestore,
}: {
  activeId: string | null
  clearLabel: string
  entries: HistoryEntry<StudioResponse>[]
  removeLabel: string
  restoreLabel: string
  title: string
  onClear: () => void
  onRemove: (id: string) => void
  onRestore: (entry: HistoryEntry<StudioResponse>) => void
}) {
  return (
    <div className="relative flex items-center gap-3 border-b bg-muted/10 px-5 py-2.5">
      <div className="flex shrink-0 items-center gap-2 text-xs font-medium text-muted-foreground">
        <HistoryIcon className="size-3.5" />
        <span>{title}</span>
        <Badge variant="secondary" className="rounded-md px-1.5 py-0 text-[10px]">
          {entries.length}
        </Badge>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-1">
        {entries.map((entry) => {
          const cover = entry.response.images[0]
          const isActive = entry.id === activeId

          return (
            <div key={entry.id} className="group/history relative shrink-0">
              <button
                type="button"
                aria-label={restoreLabel}
                aria-pressed={isActive}
                onClick={() => onRestore(entry)}
                className={cn(
                  "relative block size-14 overflow-hidden rounded-md border bg-background outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40",
                  isActive
                    ? "border-primary ring-2 ring-primary/25"
                    : "border-border hover:border-foreground/40"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" className="size-full object-cover" src={cover?.src} />
                {entry.imageCount > 1 && (
                  <span className="absolute bottom-0.5 right-0.5 rounded bg-background/85 px-1 text-[9px] font-semibold text-foreground shadow-sm">
                    ×{entry.imageCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                aria-label={removeLabel}
                onClick={() => onRemove(entry.id)}
                className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full border bg-background text-muted-foreground opacity-0 shadow-sm transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover/history:opacity-100"
              >
                <XIcon className="size-3" />
              </button>
            </div>
          )
        })}
      </div>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-8 shrink-0 rounded-md px-2 text-xs text-muted-foreground"
        onClick={onClear}
      >
        <Trash2Icon data-icon="inline-start" />
        {clearLabel}
      </Button>
    </div>
  )
}

function EmptyCanvas({
  imageCount,
  isCjk,
  model,
  outputFormat,
  size,
  text,
}: {
  imageCount: number
  isCjk: boolean
  model: string
  outputFormat: string
  size: string
  text: StudioMessages
}) {
  return (
    <div className="relative flex h-full min-h-[66vh] flex-col overflow-hidden rounded-lg border bg-background/40">
      <div className="flex items-center justify-between gap-3 border-b px-5 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{text.creativeCanvas}</p>
          <p className="text-xs text-muted-foreground">{text.readyForNextConcept}</p>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <Badge variant="secondary" className="rounded-md font-mono text-[11px]">
            {model}
          </Badge>
          <Badge variant="outline" className="rounded-md bg-muted/30 font-mono text-[11px]">
            {size} · {outputFormat.toUpperCase()} · x{imageCount}
          </Badge>
        </div>
      </div>

      <Empty className="min-h-[520px] flex-1 border-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.035),transparent_42%)]">
        <EmptyHeader>
          <EmptyTitle>{text.readyForNextConcept}</EmptyTitle>
          <EmptyDescription className={cn("max-w-md text-xs", isCjk && "leading-6")}>
            {text.idleDescription}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )
}

function GenerationSkeleton({
  count,
  workflow,
}: {
  count: number
  workflow: WorkflowCopy
}) {
  const skeletonItems = Array.from({ length: Math.min(Math.max(count, 1), 4) }, (_, index) => index)

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
        {skeletonItems.map((item) => (
          <Card
            key={item}
            className="overflow-hidden rounded-xl bg-card py-0 shadow-[0_24px_70px_-50px_rgba(0,0,0,0.9)]"
          >
            <Skeleton className="aspect-square rounded-none" />
            <CardContent className="flex flex-col gap-3 p-4">
              <Skeleton className="h-3 w-28 rounded-sm" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-7 rounded-md" />
                <Skeleton className="h-7 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
      <Card className="h-fit rounded-lg bg-card shadow-[0_24px_70px_-50px_rgba(0,0,0,0.9)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LoaderCircleIcon className="size-4 animate-spin text-primary" />
            {workflow.generationSkeletonTitle}
          </CardTitle>
          <CardDescription>{workflow.panelDescription}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-9 rounded-md" />
          <Skeleton className="h-9 rounded-md" />
          <Skeleton className="h-9 rounded-md" />
        </CardContent>
      </Card>
    </div>
  )
}

function PendingImageCard() {
  return (
    <Card className="overflow-hidden rounded-xl bg-card py-0 shadow-[0_24px_70px_-50px_rgba(0,0,0,0.9)]">
      <Skeleton className="aspect-square rounded-none" />
      <CardContent className="flex flex-col gap-3 p-4">
        <Skeleton className="h-3 w-28 rounded-sm" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-7 rounded-md" />
          <Skeleton className="h-7 rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}

function RemixPanel({
  image,
  imageIndex,
  isCjk,
  outputFormat,
  prompt,
  size,
  workflow,
  onCopyPrompt,
  onSelectRecipe,
  onStageReference,
  onUseRevisedPrompt,
}: {
  image: GeneratedImage | null
  imageIndex: number
  isCjk: boolean
  outputFormat: string
  prompt: string
  size: string
  workflow: WorkflowCopy
  onCopyPrompt: (value: string) => void
  onSelectRecipe: (recipeId: RemixRecipeId) => void
  onStageReference: () => void
  onUseRevisedPrompt: (value: string) => void
}) {
  if (!image) {
    return (
      <Card className="h-fit rounded-xl bg-card shadow-[0_24px_70px_-50px_rgba(0,0,0,0.9)]">
        <CardHeader>
          <CardTitle>{workflow.emptySelectionTitle}</CardTitle>
          <CardDescription>{workflow.emptySelectionDescription}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const promptToCopy = image.revisedPrompt || prompt

  return (
    <Card className="h-fit rounded-lg bg-card shadow-[0_24px_70px_-50px_rgba(0,0,0,0.9)] xl:sticky xl:top-0">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PanelRightIcon className="size-4 text-primary" />
              {workflow.panelTitle}
            </CardTitle>
            <CardDescription className={cn("mt-1", isCjk && "leading-6")}>
              {workflow.panelDescription}
            </CardDescription>
          </div>
          <Badge className="rounded-md">
            {String(imageIndex).padStart(2, "0")}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-lg border bg-background">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={`${workflow.selectedAsset} ${imageIndex}`}
            className={cn("w-full object-cover", getSizePreviewClass(size))}
            style={getSizePreviewStyle(size)}
            src={image.src}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            className="h-10 rounded-md"
            onClick={onStageReference}
          >
            <ImagePlusIcon data-icon="inline-start" />
            {workflow.setAsSource}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-md"
            onClick={() => onCopyPrompt(promptToCopy)}
          >
            <CopyPlusIcon data-icon="inline-start" />
            {workflow.copyPrompt}
          </Button>
        </div>

        <div className="rounded-lg border bg-muted/25 p-3">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Layers3Icon className="size-3.5 text-primary" />
            {workflow.recipesTitle}
          </div>
          <div className="grid gap-2">
            {remixRecipeItems.map((item) => {
              const Icon = item.icon
              const recipe = workflow.recipes[item.id]

              return (
                <Button
                  key={item.id}
                  type="button"
                  variant="outline"
                  className="h-auto justify-start rounded-lg bg-muted/30 px-3 py-3 text-left hover:bg-muted"
                  onClick={() => onSelectRecipe(item.id)}
                >
                  <span className="studio-mark grid size-9 shrink-0 place-items-center rounded-lg">
                    <Icon className="size-4" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="font-semibold text-foreground">{recipe.title}</span>
                    <span className="text-wrap text-xs leading-5 text-muted-foreground">
                      {recipe.description}
                    </span>
                  </span>
                  <Badge variant="secondary" className="rounded-md">
                    ×{item.count}
                  </Badge>
                </Button>
              )
            })}
          </div>
        </div>

        <div className="rounded-lg border bg-muted/25 p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <SparklesIcon className="size-3.5 text-primary" />
              {workflow.lineageTitle}
            </div>
            <Badge variant="outline" className="rounded-md bg-muted/40 text-[10px]">
              {outputFormat.toUpperCase()}
            </Badge>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {workflow.currentPrompt}
              </div>
              <p className={cn("line-clamp-3 text-xs text-foreground/80", isCjk && "leading-6")}>
                {prompt}
              </p>
            </div>
            <Separator className="bg-border/60" />
            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {workflow.revisedPrompt}
              </div>
              <p className={cn("line-clamp-4 text-xs text-foreground/80", isCjk && "leading-6")}>
                {image.revisedPrompt || workflow.noRevisedPrompt}
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      {image.revisedPrompt && (
        <CardFooter className="justify-between gap-3 bg-muted/40">
          <span className="text-xs text-muted-foreground">{workflow.revisedPrompt}</span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-9 rounded-md"
            onClick={() => image.revisedPrompt && onUseRevisedPrompt(image.revisedPrompt)}
          >
            <WandSparklesIcon data-icon="inline-start" />
            {workflow.stageWithRecipe}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

function Section({
  index,
  title,
  hint,
  children,
}: {
  index: string
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3.5">
      <div className="flex items-baseline justify-between">
        <div className="flex items-center gap-2.5">
          <span className="rounded-md border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
            {index}
          </span>
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        </div>
        {hint && (
          <span className="font-mono text-[11px] font-medium text-muted-foreground">
            {hint}
          </span>
        )}
      </div>
      <Separator />
      {children}
    </section>
  )
}
