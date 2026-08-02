export interface Course {
    _id: string;
    Name: string;
    Description: string;
    Time: string;
    Fee: number;
    Thumbnail: string;
    Status: boolean;
    IsOpen: boolean;
    IsDeleted: boolean;

    UserCreate: {
        _id: string;
        Email: string;
        Role: string;
    };
}

export interface CourseRequest {
    Name: string;
    Description: string;
    Time: string;
    Fee: number;
    Thumbnail: string;
    Status: boolean;
    IsOpen: boolean;
}