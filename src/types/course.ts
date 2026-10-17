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

export interface CourseOrder {
    _id: string;
    CourseID: string;
    Amount: number;
    Currency: string;
    Status: "Pending" | "Paid" | "Failed";
    PaymentMethod: "MoMo" | "VNPAY" | "Free";
    PaidAt?: string;
    createdAt: string;
}