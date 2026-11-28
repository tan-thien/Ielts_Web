export type Skill = "Reading" | "Listening" | "Writing" | "Speaking";
export type AvailabilityState = "available" | "no_data" | "no_courses" | "no_lessons";

export interface Availability {
    state: AvailabilityState;
    message: string | null;
}

export interface SkillBandSummary {
    skill: Skill;
    count: number;
    averageEstimatedBand: number | null;
}

export interface SkillAssignmentSummary {
    skill: Skill;
    count: number;
    averagePercent: number | null;
}

export interface ProgressTimelineDay {
    date: string;
    studyActivity: boolean;
    completedLessons: number;
    aiPractices: number;
    objectiveAssignments: number;
    averageAiEstimatedBand: number | null;
    averageObjectiveAssignmentPercent: number | null;
}

export interface CourseProgress {
    courseId: string;
    name: string;
    totalLessons: number;
    completedLessons: number;
    percent: number | null;
    state: "available" | "no_lessons";
}

export interface ProgressAnalytics {
    availability: {
        aiEstimatedBands: Availability;
        objectiveAssignments: Availability;
        lessons: Availability;
        studyActivity: Availability;
    };
    summary: {
        aiPracticeCount: number;
        averageAiEstimatedBand: number | null;
        objectiveAssignmentCount: number;
        averageObjectiveAssignmentPercent: number | null;
        completedLessonCount: number;
        recordedStudyDurationSeconds: number;
    };
    aiEstimatedBands: {
        average: number | null;
        count: number;
        bySkill: SkillBandSummary[];
    };
    objectiveAssignments: {
        averagePercent: number | null;
        count: number;
        bySkill: SkillAssignmentSummary[];
    };
    streak: {
        days: number;
        lastStudyDate: string | null;
    };
    studyDates: string[];
    courses: CourseProgress[];
    timeline: ProgressTimelineDay[];
}

export interface StudyPlanGoal {
    TargetBand: number;
    TargetDate: string;
    WeeklyStudyDays: number;
    FocusSkills: Skill[];
}

export interface StudyPlanTask {
    _id: string;
    Key: string;
    Type: "practice_skill" | "complete_lesson" | "baseline";
    Title: string;
    Reason: string;
    Skill: Skill | null;
    ResourceID: string | null;
    Status: "Pending" | "Completed";
    CompletedAt: string | null;
}

export interface StudyPlan {
    _id: string;
    Goal: StudyPlanGoal;
    Tasks: StudyPlanTask[];
    updatedAt: string;
}

export interface StudyGoalInput {
    targetBand: number;
    targetDate: string;
    weeklyStudyDays: number;
    focusSkills: Skill[];
}
