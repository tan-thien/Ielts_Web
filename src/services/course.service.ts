import { createCourseApi, deleteCourseApi, getCoursesApi, updateCourseApi, getCourseByIdApi,} from "../apis/course.api";

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

export const getCourseById = async (id:string)=>{
    const res = await getCourseByIdApi(id);
    return res.data;
}