export interface LessonDetail {
    _id?: string;
    LessonID?: string;
    Content: string;
    Type: "Text" | "Video" | "Audio" | "PDF" | "Image" | "Quiz";
    FileUrl: string;
    Order: number;
    Status: boolean;
}

export type LessonDetailPayload = Pick<
    LessonDetail,
    "Content" | "Type" | "FileUrl" | "Status"
> & {
    LessonID: string;
};


export interface Lesson {
    _id?: string;
    Name: string;
    Description: string;
    Time: string;
    Unit: string;
    CourseID: string;
    UserCreate?: string;
    Status: "Draft" | "Pending" | "Active" | "Finished";
    IsOpen: boolean;
    IsDeleted?: boolean;
    Details: LessonDetail[];
}