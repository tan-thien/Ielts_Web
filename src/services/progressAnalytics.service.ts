import api from "./api";
import type { ProgressAnalytics, StudyGoalInput, StudyPlan } from "../types/progressAnalytics";

export const getProgressAnalytics = async (): Promise<ProgressAnalytics> => {
    const response = await api.get("/progress-analytics/analytics");
    return response.data.data;
};

export const getStudyPlan = async (): Promise<StudyPlan | null> => {
    const response = await api.get("/progress-analytics/plan");
    return response.data.data;
};

export const saveStudyGoal = async (goal: StudyGoalInput): Promise<StudyPlan> => {
    const response = await api.put("/progress-analytics/plan", goal);
    return response.data.data;
};

export const completeStudyTask = async (taskId: string): Promise<StudyPlan> => {
    const response = await api.patch(`/progress-analytics/plan/tasks/${encodeURIComponent(taskId)}/complete`);
    return response.data.data;
};
