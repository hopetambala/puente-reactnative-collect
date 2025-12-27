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

i18n.locale = Localization.getLocales()[0].languageCode;
i18n.enableFallback = true;
i18n.defaultLocale = "en";

export default i18n;
