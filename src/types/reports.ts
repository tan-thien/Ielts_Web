export interface MonthlyReport {
    month: string;
    revenue: number;
    paidOrders: number;
    newStudents: number;
    newTeachers: number;
    newCourses: number;
    completedLessons: number;
    submissions: number;
}

export interface ReportsData {
    months: number;
    monthStart: string;
    totals: {
        students: number;
        teachers: number;
        assignedTeachers: number;
        courses: number;
        assignments: number;
        paidLearners: number;
        paidOrders: number;
        allTimeRevenue: number;
        revenue: number;
        newStudents: number;
        newTeachers: number;
        newCourses: number;
        completedLessons: number;
        submissions: number;
    };
    currentMonth: MonthlyReport;
    monthly: MonthlyReport[];
    popularCourses: {
        _id: string;
        name: string;
        learners: number;
        revenue: number;
    }[];
    topTeachers: {
        _id: string;
        name: string;
        email: string;
        courses: number;
    }[];
    recentPaidOrders: {
        _id: string;
        courseName: string;
        amount: number;
        currency: string;
        paymentMethod: string;
        paidAt: string;
    }[];
}
