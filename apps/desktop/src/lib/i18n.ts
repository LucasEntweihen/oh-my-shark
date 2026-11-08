import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { zh } from "@/i18n/zh";
import { en } from "@/i18n/en";
import { ko } from "@/i18n/ko";
import { pt } from "@/i18n/pt";
const stored = (() => {
  try {
    return typeof window !== "undefined" && window.localStorage
      ? window.localStorage.getItem("ccgui-next.language")
      : null;
  } catch {
    return null;
  }
})();

i18n.use(initReactI18next).init({
  resources: {
    pt: { translation: pt },
    en: { translation: en },
    zh: { translation: zh },
    ko: { translation: ko },
  },
  lng: stored === "en" || stored === "zh" || stored === "ko" ? stored : "pt",
  fallbackLng: "pt",
  interpolation: { escapeValue: false },
});

/** Keep <html lang> in sync with the active UI language (screen readers and
const HTML_LANG_TAGS: Record<string, string> = { pt: "pt-BR", zh: "zh-CN", en: "en", ko: "ko" };
function syncHtmlLang(lng: string) {
  document.documentElement.lang = HTML_LANG_TAGS[lng] ?? lng;
}
syncHtmlLang(i18n.language);
i18n.on("languageChanged", syncHtmlLang);

export default i18n;
