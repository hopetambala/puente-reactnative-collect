import * as Localization from "expo-localization";
import { I18n } from "i18n-js";

import english from "./english/en.json";
import haitian from "./kreyol/hk.json";
import spanish from "./spanish/es.json";

const i18n = new I18n({
  en: english,
  es: spanish,
  hk: haitian,
});

// Set locale from device settings, with fallback
const locales = Localization.getLocales();
i18n.locale = locales && locales[0] ? locales[0].languageCode : "en";
i18n.enableFallback = true;
i18n.defaultLocale = "en";

export default i18n;
