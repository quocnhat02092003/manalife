import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  dictionaries,
  isLocale,
  type Dict,
  type Locale,
} from "./dictionary";

/** Ngôn ngữ hiện tại từ cookie — dùng trong Server Component / Route Handler. */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Từ điển theo ngôn ngữ hiện tại — cách dùng chính ở Server Component. */
export async function getDict(): Promise<Dict> {
  return dictionaries[await getLocale()];
}
