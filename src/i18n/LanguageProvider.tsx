import { useEffect, useMemo, useState, type ReactNode } from "react";
import { translateText, type AppLanguage } from "./translations";
import { LanguageContext, type LanguageContextValue } from "./LanguageContext";

interface TranslationState {
    original: string;
    translated: string;
    applied: string;
}

const LANGUAGE_STORAGE_KEY = "ielts-language";

function getStoredLanguage(): AppLanguage {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) === "en" ? "en" : "vi";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, updateLanguage] = useState<AppLanguage>(getStoredLanguage);
    const contextValue = useMemo<LanguageContextValue>(() => ({
        language,
        setLanguage: (nextLanguage) => {
            localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
            updateLanguage(nextLanguage);
        },
    }), [language]);

    useEffect(() => {
        const textStates = new WeakMap<Text, TranslationState>();
        const attributeStates = new WeakMap<Element, Map<string, TranslationState>>();
        let currentLanguage = language;

        const localizeText = (node: Text) => {
            const existing = textStates.get(node);
            if (existing && node.data === existing.applied) return;
            const original = existing && node.data === existing.translated
                ? existing.original
                : node.data;
            const translated = translateText(original, currentLanguage);
            const state = { original, translated, applied: translated };
            textStates.set(node, state);
            if (node.data !== translated) node.data = translated;
        };

        const localizeAttribute = (element: Element, attribute: string) => {
            const value = element.getAttribute(attribute);
            if (value === null) return;
            let states = attributeStates.get(element);
            if (!states) {
                states = new Map();
                attributeStates.set(element, states);
            }
            const existing = states.get(attribute);
            if (existing && value === existing.applied) return;
            const original = existing && value === existing.translated
                ? existing.original
                : value;
            const translated = translateText(original, currentLanguage);
            states.set(attribute, { original, translated, applied: translated });
            if (value !== translated) element.setAttribute(attribute, translated);
        };

        const scan = (root: Node) => {
            if (root.nodeType === Node.TEXT_NODE) {
                localizeText(root as Text);
                return;
            }
            if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
            const element = root.nodeType === Node.ELEMENT_NODE ? root as Element : null;
            if (element && ["SCRIPT", "STYLE", "NOSCRIPT"].includes(element.tagName)) return;
            if (element) {
                for (const attribute of ["placeholder", "title", "aria-label", "alt"]) {
                    localizeAttribute(element, attribute);
                }
            }
            root.childNodes.forEach(scan);
        };

        const root = document.getElementById("root");
        if (!root) return;
        document.documentElement.lang = currentLanguage;
        scan(root);

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === "characterData" && mutation.target instanceof Text) {
                    localizeText(mutation.target);
                }
                if (mutation.type === "attributes" && mutation.target instanceof Element && mutation.attributeName) {
                    localizeAttribute(mutation.target, mutation.attributeName);
                }
                mutation.addedNodes.forEach(scan);
            }
        });
        observer.observe(root, {
            subtree: true,
            childList: true,
            characterData: true,
            attributes: true,
            attributeFilter: ["placeholder", "title", "aria-label", "alt"],
        });

        return () => {
            observer.disconnect();
            currentLanguage = language;
        };
    }, [language]);

    return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
}
