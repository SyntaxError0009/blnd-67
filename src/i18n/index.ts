import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { en } from "./en";
import { ku } from "./ku";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ku: { translation: ku },
    },
    fallbackLng: "ku",
    supportedLngs: ["ku", "en"],
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "lng",
    },
    interpolation: { escapeValue: false },
  });

const applyDir = (lng: string) => {
  const isRtl = lng === "ku";
  document.documentElement.dir = isRtl ? "rtl" : "ltr";
  document.documentElement.lang = lng;
  document.documentElement.classList.toggle("font-kurdish", isRtl);
};

applyDir(i18n.language || "ku");
i18n.on("languageChanged", applyDir);

export default i18n;
