import { cookies, headers } from "next/headers"

import { ImageStudio } from "@/components/image-studio"
import { LOCALE_COOKIE_KEY, resolveLocaleFrom } from "@/lib/i18n"
import { loadPromptPresets } from "@/lib/prompt-presets"

export default async function Home() {
  const cookieStore = await cookies()
  const headerStore = await headers()
  const initialLocale = resolveLocaleFrom(
    cookieStore.get(LOCALE_COOKIE_KEY)?.value,
    headerStore.get("accept-language")
  )

  return <ImageStudio initialLocale={initialLocale} promptPresetOverride={loadPromptPresets()} />
}
