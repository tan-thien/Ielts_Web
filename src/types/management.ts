export interface ManagementTeacher {
    _id: string;
    Email: string;
    Name: string;
    Phone: string;
    Avatar: string;
}

export interface ManagementAssignment {
    _id: string;
    Title: string;
    Status: "Not started" | "Doing" | "Submitted" | "Graded";
    Score: number | null;
    MaxScore: number;
    Attempts: number;
    SubmittedAt: string | null;
}

export interface ManagedLessonProgress {
    _id: string;
    Name: string;
    Completed: boolean;
}

export interface ManagedStudentCourse {
    _id: string;
    Name: string;
    TeacherCount: number;
    Teachers: ManagementTeacher[];
    CompletedLessons: number;
    TotalLessons: number;
    Lessons: ManagedLessonProgress[];
    LessonProgress: number;
    CompletedAssignments: number;
    TotalAssignments: number;
    Assignments: ManagementAssignment[];
}

export interface ManagedStudent {
    _id: string;
    Email: string;
    Name: string;
    Phone: string;
    Avatar: string;
    CourseCount: number;
    CompletedLessons: number;
    TotalLessons: number;
    LessonProgress: number;
    CompletedAssignments: number;
    TotalAssignments: number;
    Courses: ManagedStudentCourse[];
}

export interface ManagementCourse {
    _id: string;
    Name: string;
    IsOpen: boolean;
    Status: boolean;
    TeacherIDs: string[];
    Teachers: ManagementTeacher[];
}

export interface ManagementDashboard {
    stats: {
        studentCount: number;
        teacherCount: number;
        courseCount: number;
        assignedCourseCount: number;
        paidCourseCount: number;
        assignmentCount: number;
    };
    teachers: ManagementTeacher[];
    courses: ManagementCourse[];
    students: ManagedStudent[];
    roleAccounts: Array<ManagementTeacher & { Role: "user" | "teacher" }>;
    teacherCourseCounts: Record<string, number>;
    pagination: {
        students: ManagementPagination;
        accounts: ManagementPagination;
        courses: ManagementPagination;
    };
}

export interface ManagementPagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}
