"use client";

import { createContext, useContext } from "react";
import {
  DEFAULT_LOCALE,
  dictionaries,
  type Dict,
  type Locale,
} from "./dictionary";

/**
 * Locale truyền từ root layout (server đọc cookie) xuống toàn cây client.
 * Client không tự đọc cookie: một nguồn sự thật, không lệch hydration.
 */
const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

/** Ngôn ngữ + từ điển cho client component: `const { locale, t } = useI18n()`. */
export function useI18n(): { locale: Locale; t: Dict } {
  const locale = useContext(LocaleContext);
  return { locale, t: dictionaries[locale] };
}
