const skillNames: Record<string, string> = {
    Reading: "Đọc",
    Listening: "Nghe",
    Writing: "Viết",
    Speaking: "Nói",
};

const assignmentTypeNames: Record<string, string> = {
    Practice: "Luyện tập",
    Quiz: "Bài kiểm tra",
    Exam: "Bài thi",
    Homework: "Bài tập về nhà",
};

export const ieltsSkillName = (skill: string) => skillNames[skill] || skill;

export const assignmentTypeName = (type: string) => assignmentTypeNames[type] || type;
