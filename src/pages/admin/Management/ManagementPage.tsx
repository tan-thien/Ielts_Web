import { useCallback, useEffect, useState } from "react";
import { FaBookOpen, FaChalkboardTeacher, FaGraduationCap, FaUsers } from "react-icons/fa";
import {
    getManagementDashboard,
    updateAccountRole,
    updateCourseTeachers,
} from "../../../services/management.service";
import type { ManagementDashboard, ManagementTeacher } from "../../../types/management";
import ManagementPagination from "./ManagementPagination";
import "./ManagementPage.css";

type ManagementPageProps = {
    mode: "teachers" | "students";
};

function ManagementPage({ mode }: ManagementPageProps) {
    const [dashboard, setDashboard] = useState<ManagementDashboard | null>(null);
    const [roleDrafts, setRoleDrafts] = useState<Record<string, "user" | "teacher">>({});
    const [teacherDrafts, setTeacherDrafts] = useState<Record<string, string[]>>({});
    const [studentsSearch, setStudentsSearch] = useState("");
    const [accountsSearch, setAccountsSearch] = useState("");
    const [accountsRole, setAccountsRole] = useState<"all" | "user" | "teacher">("all");
    const [coursesSearch, setCoursesSearch] = useState("");
    const [studentsPage, setStudentsPage] = useState(1);
    const [accountsPage, setAccountsPage] = useState(1);
    const [coursesPage, setCoursesPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [busyKey, setBusyKey] = useState("");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const fetchDashboard = useCallback(() => getManagementDashboard({
        studentsPage,
        studentsSearch,
        accountsPage,
        accountsSearch,
        accountsRole,
        coursesPage,
        coursesSearch,
    }), [
        studentsPage,
        studentsSearch,
        accountsPage,
        accountsSearch,
        accountsRole,
        coursesPage,
        coursesSearch,
    ]);

    const loadDashboard = useCallback(async () => {
        setIsLoading(true);
        setError("");
        try {
            const result = await fetchDashboard();
            setDashboard(result);
            setRoleDrafts({});
            setTeacherDrafts({});
        } catch {
            setError("Không thể tải dữ liệu quản lý. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    }, [fetchDashboard]);

    useEffect(() => {
        let isCurrent = true;
        const timeout = window.setTimeout(() => {
            setIsLoading(true);
            setError("");
            fetchDashboard()
                .then((result) => {
                    if (isCurrent) setDashboard(result);
                })
                .catch(() => {
                    if (isCurrent) setError("Không thể tải dữ liệu quản lý. Vui lòng thử lại.");
                })
                .finally(() => {
                    if (isCurrent) setIsLoading(false);
                });
        }, 250);
        return () => {
            isCurrent = false;
            window.clearTimeout(timeout);
        };
    }, [fetchDashboard]);

    const handleRoleUpdate = async (accountId: string) => {
        const role = roleDrafts[accountId];
        if (!role) return;
        setBusyKey(accountId);
        setError("");
        setNotice("");
        try {
            await updateAccountRole(accountId, role);
            setNotice("Đã cập nhật phân quyền tài khoản.");
            await loadDashboard();
        } catch {
            setError("Không thể cập nhật quyền tài khoản. Vui lòng thử lại.");
        } finally {
            setBusyKey("");
        }
    };

    const handleCourseTeachersUpdate = async (courseId: string) => {
        const teacherIds = teacherDrafts[courseId];
        if (!teacherIds) return;
        setBusyKey(courseId);
        setError("");
        setNotice("");
        try {
            await updateCourseTeachers(courseId, teacherIds);
            setNotice("Đã cập nhật giáo viên phụ trách khóa học.");
            await loadDashboard();
        } catch {
            setError("Không thể phân công giáo viên cho khóa học. Vui lòng thử lại.");
        } finally {
            setBusyKey("");
        }
    };

    if (isLoading && !dashboard) {
        return <div className="management-state" role="status">Đang tải dữ liệu quản lý...</div>;
    }

    if (!dashboard) {
        return (
            <section className="management-page">
                <div className="management-alert error" role="alert">{error}</div>
                <button className="management-button primary" type="button" onClick={() => void loadDashboard()}>
                    Thử tải lại
                </button>
            </section>
        );
    }

    const accountRows = dashboard.roleAccounts;

    return (
        <section className="management-page">
            <header className="management-header">
                <div>
                    <span className="management-eyebrow">QUẢN TRỊ HỌC TẬP</span>
                    <h1>{mode === "teachers" ? "Quản lý giáo viên" : "Quản lý học viên"}</h1>
                    <p>
                        {mode === "teachers"
                            ? "Phân quyền tài khoản, phân công giáo viên vào khóa học và theo dõi tải giảng dạy."
                            : "Theo dõi khóa học, tiến độ từng lesson, bài tập và điểm của mỗi học viên."}
                    </p>
                </div>
                <button
                    className="management-button secondary"
                    type="button"
                    onClick={() => void loadDashboard()}
                    disabled={isLoading}
                >
                    {isLoading ? "Đang cập nhật..." : "Làm mới dữ liệu"}
                </button>
            </header>

            <div className="management-stat-grid">
                <article className="management-stat-card">
                    <span className="management-stat-icon"><FaUsers /></span>
                    <div><span>Học viên</span><strong>{dashboard.stats.studentCount}</strong></div>
                </article>
                <article className="management-stat-card">
                    <span className="management-stat-icon teacher"><FaChalkboardTeacher /></span>
                    <div><span>Giáo viên</span><strong>{dashboard.stats.teacherCount}</strong></div>
                </article>
                <article className="management-stat-card">
                    <span className="management-stat-icon course"><FaBookOpen /></span>
                    <div><span>Khóa học</span><strong>{dashboard.stats.courseCount}</strong></div>
                </article>
                <article className="management-stat-card">
                    <span className="management-stat-icon assignment"><FaGraduationCap /></span>
                    <div><span>Khóa có giáo viên</span><strong>{dashboard.stats.assignedCourseCount}</strong></div>
                </article>
            </div>

            {error && <div className="management-alert error" role="alert">{error}</div>}
            {notice && <div className="management-alert success" role="status">{notice}</div>}

            {mode === "teachers" ? (
                <div className="management-section-stack">
                    <section className="management-panel">
                        <div className="management-panel-heading">
                            <div>
                                <h2>Phân quyền tài khoản</h2>
                                <p>Chuyển tài khoản học viên thành giáo viên hoặc thu hồi quyền giáo viên.</p>
                            </div>
                            <span className="management-count">{dashboard.pagination.accounts.total} tài khoản</span>
                        </div>
                        <div className="management-list-controls">
                            <input
                                className="management-search"
                                type="search"
                                placeholder="Tìm theo tên, email, số điện thoại"
                                value={accountsSearch}
                                onChange={(event) => {
                                    setAccountsSearch(event.target.value);
                                    setAccountsPage(1);
                                }}
                            />
                            <select
                                aria-label="Lọc tài khoản theo vai trò"
                                value={accountsRole}
                                onChange={(event) => {
                                    setAccountsRole(event.target.value as "all" | "user" | "teacher");
                                    setAccountsPage(1);
                                }}
                            >
                                <option value="all">Tất cả vai trò</option>
                                <option value="teacher">Giáo viên</option>
                                <option value="user">Học viên</option>
                            </select>
                        </div>
                        <div className="management-table-wrap">
                            <table className="management-table">
                                <thead><tr><th>Tài khoản</th><th>Liên hệ</th><th>Khóa đang phụ trách</th><th>Vai trò</th><th>Thao tác</th></tr></thead>
                                <tbody>
                                    {accountRows.map((account) => {
                                        const selectedRole = roleDrafts[account._id] || account.Role;
                                        return (
                                            <tr key={account._id}>
                                                <td><strong>{account.Name}</strong><small>{account.Email}</small></td>
                                                <td>{account.Phone || "—"}</td>
                                                <td>{account.Role === "teacher" ? dashboard.teacherCourseCounts[account._id] || 0 : "—"}</td>
                                                <td>
                                                    <select
                                                        aria-label={`Vai trò của ${account.Name}`}
                                                        value={selectedRole}
                                                        onChange={(event) => setRoleDrafts((drafts) => ({
                                                            ...drafts,
                                                            [account._id]: event.target.value as "user" | "teacher",
                                                        }))}
                                                    >
                                                        <option value="user">Học viên</option>
                                                        <option value="teacher">Giáo viên</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="management-button primary small"
                                                        disabled={selectedRole === account.Role || busyKey === account._id}
                                                        onClick={() => void handleRoleUpdate(account._id)}
                                                    >
                                                        {busyKey === account._id ? "Đang lưu..." : "Lưu quyền"}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {accountRows.length === 0 && (
                                        <tr><td colSpan={5} className="management-empty">Chưa có tài khoản học viên hoặc giáo viên.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <ManagementPagination
                            pagination={dashboard.pagination.accounts}
                            onPageChange={setAccountsPage}
                        />
                    </section>

                    <section className="management-panel">
                        <div className="management-panel-heading">
                            <div>
                                <h2>Giáo viên theo khóa học</h2>
                                <p>Mỗi khóa có thể được phụ trách bởi một hoặc nhiều giáo viên.</p>
                            </div>
                            <span className="management-count">{dashboard.pagination.courses.total} khóa học</span>
                        </div>
                        <div className="management-list-controls">
                            <input
                                className="management-search"
                                type="search"
                                placeholder="Tìm khóa học cần phân công"
                                value={coursesSearch}
                                onChange={(event) => {
                                    setCoursesSearch(event.target.value);
                                    setCoursesPage(1);
                                }}
                            />
                        </div>
                        <div className="management-course-grid">
                            {dashboard.courses.map((course) => {
                                const selectedTeachers = teacherDrafts[course._id] || course.TeacherIDs;
                                const hasChanges = JSON.stringify([...selectedTeachers].sort()) !==
                                    JSON.stringify([...course.TeacherIDs].sort());
                                return (
                                    <article className="management-course-card" key={course._id}>
                                        <div className="management-course-heading">
                                            <h3>{course.Name}</h3>
                                            <span className={course.Teachers.length ? "teacher-badge assigned" : "teacher-badge"}>
                                                {course.Teachers.length} giáo viên
                                            </span>
                                        </div>
                                        <p>
                                            {course.Teachers.length
                                                ? course.Teachers.map((teacher: ManagementTeacher) => teacher.Name).join(", ")
                                                : "Chưa phân công giáo viên"}
                                        </p>
                                        <label>
                                            Phân công giáo viên
                                            <select
                                                multiple
                                                value={selectedTeachers}
                                                onChange={(event) => {
                                                    const values = Array.from(event.target.selectedOptions, (option) => option.value);
                                                    setTeacherDrafts((drafts) => ({ ...drafts, [course._id]: values }));
                                                }}
                                            >
                                                {dashboard.teachers.map((teacher) => (
                                                    <option key={teacher._id} value={teacher._id}>
                                                        {teacher.Name} · {teacher.Email}
                                                    </option>
                                                ))}
                                            </select>
                                            <small>Giữ Ctrl (Windows) hoặc Command (Mac) để chọn nhiều giáo viên.</small>
                                        </label>
                                        <button
                                            type="button"
                                            className="management-button primary small"
                                            disabled={!hasChanges || busyKey === course._id}
                                            onClick={() => void handleCourseTeachersUpdate(course._id)}
                                        >
                                            {busyKey === course._id ? "Đang lưu..." : "Lưu phân công"}
                                        </button>
                                    </article>
                                );
                            })}
                            {dashboard.courses.length === 0 && (
                                <p className="management-empty">
                                    {coursesSearch ? "Không tìm thấy khóa học phù hợp." : "Chưa có khóa học để phân công."}
                                </p>
                            )}
                        </div>
                        <ManagementPagination
                            pagination={dashboard.pagination.courses}
                            onPageChange={setCoursesPage}
                        />
                    </section>
                </div>
            ) : (
                <section className="management-panel">
                    <div className="management-panel-heading student-heading">
                        <div>
                            <h2>Bảng theo dõi học viên</h2>
                            <p>Mở chi tiết từng học viên để xem khóa học, lesson và trạng thái/điểm bài tập.</p>
                        </div>
                        <input
                            className="management-search"
                            type="search"
                            placeholder="Tìm tên, email hoặc số điện thoại"
                            value={studentsSearch}
                            onChange={(event) => {
                                setStudentsSearch(event.target.value);
                                setStudentsPage(1);
                            }}
                        />
                    </div>
                    <div className="management-table-wrap">
                        <table className="management-table student-table">
                            <thead>
                                <tr>
                                    <th>Học viên</th>
                                    <th>Khóa học</th>
                                    <th>Lesson hoàn thành</th>
                                    <th>Tiến độ</th>
                                    <th>Bài tập đã làm</th>
                                    <th>Chi tiết</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dashboard.students.map((student) => (
                                    <tr key={student._id}>
                                        <td>
                                            <strong>{student.Name}</strong>
                                            <small>{student.Email}</small>
                                            {student.Phone && <small>{student.Phone}</small>}
                                        </td>
                                        <td>{student.CourseCount}</td>
                                        <td>{student.CompletedLessons}/{student.TotalLessons}</td>
                                        <td>
                                            <div className="management-progress">
                                                <span><i style={{ width: `${student.LessonProgress}%` }} /></span>
                                                <strong>{student.LessonProgress}%</strong>
                                            </div>
                                        </td>
                                        <td>{student.CompletedAssignments}/{student.TotalAssignments}</td>
                                        <td>
                                            <details className="student-detail">
                                                <summary>Xem khóa học & bài tập</summary>
                                                <div className="student-detail-content">
                                                    {student.Courses.length === 0 ? (
                                                        <p>Học viên chưa có khóa học đã thanh toán.</p>
                                                    ) : student.Courses.map((course) => (
                                                        <article className="student-course-detail" key={course._id}>
                                                            <header>
                                                                <div>
                                                                    <h3>{course.Name}</h3>
                                                                    <p>Giáo viên ({course.TeacherCount}): {course.Teachers.map((teacher) => teacher.Name).join(", ") || "Chưa phân công"}</p>
                                                                </div>
                                                                <span>{course.LessonProgress}% lesson</span>
                                                            </header>
                                                            <p className="student-course-summary">
                                                                Lesson: {course.CompletedLessons}/{course.TotalLessons} hoàn thành ·
                                                                Bài tập: {course.CompletedAssignments}/{course.TotalAssignments} đã làm
                                                            </p>
                                                            {course.Lessons.length > 0 && (
                                                                <div className="lesson-progress-list">
                                                                    <strong>Tiến độ lesson</strong>
                                                                    <div>
                                                                        {course.Lessons.map((lesson, index) => (
                                                                            <span className={lesson.Completed ? "completed" : ""} key={lesson._id}>
                                                                                {String(index + 1).padStart(2, "0")}. {lesson.Name}
                                                                            {lesson.Completed ? " · Hoàn thành" : " · Chưa hoàn thành"}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {course.Assignments.length > 0 ? (
                                                                <div className="assignment-list">
                                                                    {course.Assignments.map((assignment) => (
                                                                        <div className="assignment-row" key={assignment._id}>
                                                                            <strong>{assignment.Title}</strong>
                                                                            <span className={`assignment-status ${assignment.Status === "Not started" ? "not-started" : "started"}`}>
                                                                                {assignment.Status === "Not started" ? "Chưa làm" : assignment.Status === "Doing" ? "Đang làm" : assignment.Status === "Submitted" ? "Đã nộp" : "Đã chấm"}
                                                                            </span>
                                                                            <span>Điểm: {assignment.Score === null ? "—" : `${assignment.Score}/${assignment.MaxScore}`}</span>
                                                                            <span>{assignment.Attempts} lượt</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : <p>Khóa học chưa có bài tập.</p>}
                                                        </article>
                                                    ))}
                                                </div>
                                            </details>
                                        </td>
                                    </tr>
                                ))}
                                {dashboard.students.length === 0 && (
                                    <tr><td colSpan={6} className="management-empty">
                                        {studentsSearch ? "Không tìm thấy học viên phù hợp." : "Chưa có học viên."}
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <ManagementPagination
                        pagination={dashboard.pagination.students}
                        onPageChange={setStudentsPage}
                    />
                </section>
            )}
        </section>
    );
}

export default ManagementPage;
