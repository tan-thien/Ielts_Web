import api from "./api";

export const getCourses = async () => {
    const res = await api.get("/courses/get-all");
    return res.data.data;
};

export const createCourse = async (data: any) => {
    return await api.post("/courses/create", data);
};

export const updateCourse = async (id: string, data: any) => {
    return await api.put(`/courses/update/${id}`, data);
};

export const deleteCourse = async (id: string) => {
    return await api.delete(`/courses/delete/${id}`);
};

export const getCourseById = async (id:string)=>{
    const res = await api.get(`/courses/get/${id}`);
    return res.data.data;
}