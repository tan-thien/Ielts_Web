export interface LessonDetail {
    _id?: string;
    LessonID?: string;
    Title: string;
    Content: string;
    Type: "Text" | "Video" | "Audio" | "PDF" | "Image" | "Quiz";
    FileUrl: string;
    Thumbnail: string;
    Order: number;
    Duration: number;
    Status: boolean;
}

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