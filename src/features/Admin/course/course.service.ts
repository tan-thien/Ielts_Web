import { createCourseApi, deleteCourseApi, getCoursesApi, updateCourseApi,} from "./course.api";

export const getCourses = async () => {
    const res = await getCoursesApi();
    return res.data.data;
};

export const createCourse = async (data: any) => {
    return await createCourseApi(data);
};

export const updateCourse = async (id: string, data: any) => {
    return await updateCourseApi(id, data);
};

export const deleteCourse = async (id: string) => {
    return await deleteCourseApi(id);
};