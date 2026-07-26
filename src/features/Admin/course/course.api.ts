import api from "../../../../src/shared/services/api";

export const getCoursesApi = () => {
    return api.get("/courses/get-all");
};

export const createCourseApi = (data: any) => {
    return api.post("/courses/create", data);
};

export const updateCourseApi = (id: string, data: any) => {
    return api.put(`/courses/update/${id}`, data);
};

export const deleteCourseApi = (id: string) => {
    return api.delete(`/courses/delete/${id}`);
};