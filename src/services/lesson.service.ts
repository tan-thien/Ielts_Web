import api from "../apis/api";

export const getLessonByCourseId = async (courseId: string) => {
    const res = await api.get(`/lesson/course/${courseId}`);
    return res.data;
};

export const getLessonById = async (id: string) => {
    const res = await api.get(`/lesson/get/${id}`);
    return res.data;
};

export const updateLesson = async (id: string, data: any) => {
    const token = localStorage.getItem("token");

    const res = await api.put(
        `/lesson/update/${id}`,
        data,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    return res.data;
};