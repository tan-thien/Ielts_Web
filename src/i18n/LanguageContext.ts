import { createContext } from "react";
import type { AppLanguage } from "./translations";

export interface LanguageContextValue {
    language: AppLanguage;
    setLanguage: (language: AppLanguage) => void;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);
