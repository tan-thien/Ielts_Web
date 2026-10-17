import api from "./api";
import type { CourseRequest, CourseOrder } from "../types/course";

export const getCourses = async () => {
    const res = await api.get("/courses/get-all");
    return res.data.data;
};

export const createCourse = async (data: CourseRequest) => {
    return await api.post("/courses/create", data);
};

export const updateCourse = async (id: string, data: CourseRequest) => {
    return await api.put(`/courses/update/${id}`, data);
};

export const deleteCourse = async (id: string) => {
    return await api.delete(`/courses/delete/${id}`);
};

export const getCourseById = async (id:string)=>{
    const res = await api.get(`/courses/get/${id}`);
    return res.data.data;
};

export const createCoursePayment = async (
    courseId: string,
    paymentMethod: "MoMo" | "VNPAY" | "Free",
) => {
    const res = await api.post(`/orders/course/${courseId}/payment`, { paymentMethod });
    return res.data.data as { order: CourseOrder; paymentUrl: string | null; alreadyPaid: boolean };
};

export const getCourseOrder = async (courseId: string): Promise<CourseOrder | null> => {
    const res = await api.get(`/orders/course/${courseId}`);
    return res.data.data;
};

export const getOrderById = async (orderId: string): Promise<CourseOrder> => {
    const res = await api.get(`/orders/${orderId}`);
    return res.data.data;
};