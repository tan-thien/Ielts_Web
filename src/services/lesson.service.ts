import type { Lesson, LessonDetailPayload, LessonWithCourse } from "../types/lesson";
import api from "./api";

export const getLessonByCourseId = async (courseId: string) => {
    const res = await api.get(`/lessons/course/${courseId}`);
    return res.data.data;
};

export const getAllLessons = async (): Promise<LessonWithCourse[]> => {
    const res = await api.get("/lessons/get-all");
    return res.data.data;
};

export const getCourseLessonProgress = async (courseId: string): Promise<string[]> => {
    const res = await api.get(`/lessons/progress/course/${courseId}`);
    return res.data.data.map((item: { LessonID: string }) => item.LessonID);
};

export const completeLesson = async (lessonId: string) => {
    const res = await api.post(`/lessons/progress/${lessonId}/complete`);
    return res.data.data;
};

export const getLessonById = async (id: string) => {
    const res = await api.get(`/lessons/get/${id}`);
    return res.data.data;
};

export const createLesson = async (data: Omit<Lesson, "Details">) => {
    const res = await api.post("/lessons/create", data);
    return res.data;
};

export const updateLesson = async (id: string, data: Omit<Lesson, "Details">) => {
    const res = await api.put(`/lessons/update/${id}`, data);
    return res.data;
};

export const deleteLesson = async (id: string) => {
    const res = await api.delete(`/lessons/delete/${id}`);
    return res.data;
};

/* detail */

export const getLessonDetailById = async (id: string) => {
    const res = await api.get(`/lesson-details/get/${id}`);
    return res.data.data;
};

export const getLessonDetailsByLessonId = async (lessonId: string) => {
    const res = await api.get(`/lesson-details/lesson/${lessonId}`);
    return res.data.data;
};

export const reorderLessonDetails = async (lessonId: string, detailIds: string[]) => {
    const res = await api.put(`/lesson-details/lesson/${lessonId}/reorder`, { detailIds });
    return res.data.data;
};

export const createLessonDetail = async (data: LessonDetailPayload) => {
    const res = await api.post("/lesson-details/create", data);
    return res.data.data;
};

export const updateLessonDetail = async (
    id: string,
    data: LessonDetailPayload
) => {
    const res = await api.put(`/lesson-details/update/${id}`, data);
    return res.data.data;
};

export const deleteLessonDetail = async (id: string) => {
    const res = await api.delete(`/lesson-details/delete/${id}`);
    return res.data;
};

export const markCourseAccess = async (courseId: string) => {
    const res = await api.post(`/lessons/activity/course/${courseId}`);
    return res.data.data;
};

export const getStudyActivity = async (month: string): Promise<Array<{ StudyDate: string; CourseID: string }>> => {
    const res = await api.get("/lessons/activity", { params: { month } });
    return res.data.data;
};
