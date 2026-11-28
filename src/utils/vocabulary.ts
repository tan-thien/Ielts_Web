import type { VocabularySense, VocabularyWord } from "../types/vocabulary";

const isGeneratedExample = (example: string, word: string) => {
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`^Example:\\s*${escapedWord}[.!?]?$`, "i").test(example.trim());
};

export const getVocabularySenses = (word: VocabularyWord): VocabularySense[] => {
    const senses = word.Senses?.length
        ? word.Senses
        : [{
            PartOfSpeech: word.PartOfSpeech,
            Meaning: word.Meaning,
            Translation: word.Translation,
            Example: word.Example,
            ExampleTranslation: word.ExampleTranslation,
        }];

    return senses
        .filter((sense) => sense.Meaning?.trim())
        .map((sense) => ({
            ...sense,
            PartOfSpeech: sense.PartOfSpeech || "",
            Meaning: sense.Meaning || "",
            Translation: sense.Translation || "",
            Example: sense.Example && isGeneratedExample(sense.Example, word.Word) ? "" : sense.Example || "",
            ExampleTranslation: sense.ExampleTranslation || "",
        }));
};
