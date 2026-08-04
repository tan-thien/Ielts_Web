import type { Lesson, LessonDetail } from "../types/lesson";
import api from "./api";

export const getLessonByCourseId = async (courseId: string) => {
    const res = await api.get(`/lessons/course/${courseId}`);
    return res.data.data;
};

export const getLessonById = async (id: string) => {
    const res = await api.get(`/lessons/get/${id}`);
    return res.data.data;
};

export const createLesson = async (data: Lesson) => {
    const res = await api.post("/lessons/create", data);
    return res.data;
};

export const updateLesson = async (id: string, data: Lesson) => {
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

export const createLessonDetail = async (data: LessonDetail) => {
    const res = await api.post("/lesson-details/create", data);
    return res.data.data;
};

export const updateLessonDetail = async (
    id: string,
    data: LessonDetail
) => {
    const res = await api.put(`/lesson-details/update/${id}`, data);
    return res.data.data;
};

export const deleteLessonDetail = async (id: string) => {
    const res = await api.delete(`/lesson-details/delete/${id}`);
    return res.data;
};