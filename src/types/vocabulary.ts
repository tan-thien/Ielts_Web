export interface VocabularyTopic { _id: string; Name: string; Description: string; IsActive: boolean; IsDeleted?: boolean; WordCount?: number; ActiveWordCount?: number; }
export interface VocabularySense { _id?: string; PartOfSpeech: string; Meaning: string; Translation: string; Example: string; ExampleTranslation: string; }
export interface VocabularyWord { _id: string; TopicID: string | VocabularyTopic; TopicIDs?: Array<string | VocabularyTopic>; NormalizedWord?: string; Word: string; Meaning: string; Translation: string; PartOfSpeech: string; Example: string; ExampleTranslation: string; Senses?: VocabularySense[]; Pronunciation: string; IPAUK?: string; IPAUS?: string; AudioUK?: string; AudioUS?: string; Level: string; Source?: { Provider: string; URL: string; License: string; Attribution: string }; DictionaryStatus?: "verified" | "partial" | "manual"; IsActive: boolean; }
export interface VocabularyLookupResult extends Omit<VocabularyWord, "_id" | "TopicID" | "IsActive"> { warnings: string[]; }
export interface VocabularyAdminSummary { activeTopics: number; inactiveTopics: number; totalWords: number; activeWords: number; inactiveWords: number; }
export interface SavedVocabulary { _id: string; WordID: VocabularyWord; Note: string; IsLearned: boolean; createdAt: string; }
export interface VocabularyTranslation { translation: string; meaning: string; partOfSpeech: string; example: string; exampleTranslation: string; senses?: VocabularySense[]; }
export interface VocabularyFlashcardSet { _id: string; Name: string; Description: string; WordIDs: string[]; createdAt: string; updatedAt: string; }
export type VocabularyReviewRating = "again" | "hard" | "good" | "easy";
export type VocabularyReviewMode = "due" | "saved" | "topic" | "all";
export interface VocabularyReviewState { _id: string; EaseFactor: number; Repetitions: number; IntervalDays: number; LastReviewedAt: string | null; NextReviewAt: string; TotalReviewCount: number; CorrectCount: number; IncorrectCount: number; MemoryLevel: number; CurrentStatus: "New" | "Learning" | "Reviewing" | "Mastered"; }
export interface VocabularyReviewCard { Word: VocabularyWord; Review: VocabularyReviewState | null; NextReviewAt: string | null; Due: boolean; }
export interface VocabularyReviewHistory { _id: string; WordID: VocabularyWord; Rating: VocabularyReviewRating; IntervalDays: number; NextReviewAt: string; ReviewedAt: string; }
export interface VocabularyPageResult<T> { items: T[]; page: number; limit: number; total: number; pages: number; mode?: VocabularyReviewMode; }
export interface VocabularyGeneratePreview { Key: string; Word: string; Preview: Partial<VocabularyLookupResult>; Status: "Pending" | "Approved" | "Rejected"; Error: string; }
export interface VocabularyGenerateJob { _id: string; TopicID: string; Level: string; TargetCount: number; GeneratedCount: number; ValidCount: number; DuplicateCount: number; ApprovedCount: number; BatchNumber: number; BatchStatus: "Idle" | "Processing" | "Completed" | "Error"; ErrorMessage: string; Previews: VocabularyGeneratePreview[]; createdAt: string; updatedAt: string; }
