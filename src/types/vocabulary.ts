export interface VocabularyTopic { _id: string; Name: string; Description: string; IsActive: boolean; IsDeleted?: boolean; }
export interface VocabularySense { _id?: string; PartOfSpeech: string; Meaning: string; Translation: string; Example: string; ExampleTranslation: string; }
export interface VocabularyWord { _id: string; TopicID: string | VocabularyTopic; Word: string; Meaning: string; Translation: string; PartOfSpeech: string; Example: string; ExampleTranslation: string; Senses?: VocabularySense[]; Pronunciation: string; Level: string; IsActive: boolean; }
export interface SavedVocabulary { _id: string; WordID: VocabularyWord; Note: string; IsLearned: boolean; createdAt: string; }
export interface VocabularyTranslation { translation: string; meaning: string; partOfSpeech: string; example: string; exampleTranslation: string; senses?: VocabularySense[]; }
