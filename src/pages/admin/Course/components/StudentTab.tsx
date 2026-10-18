import { useMemo, useState } from "react";
import { FaChalkboardTeacher, FaSearch, FaUsers } from "react-icons/fa";
import type { ManagedStudent, ManagementTeacher } from "../../../../types/management";
import "./StudentTab.css";

interface Props { courseId: string; students: ManagedStudent[]; teachers: ManagementTeacher[]; loading?: boolean; error?: string; }

function StudentTab({ courseId, students, teachers, loading = false, error = "" }: Props) {
    const [search, setSearch] = useState("");
    const normalizedSearch = search.trim().toLowerCase();
    const filteredStudents = useMemo(() => students.filter((student) => !normalizedSearch || [student.Name, student.Email, student.Phone].some((value) => value?.toLowerCase().includes(normalizedSearch))), [students, normalizedSearch]);

    return <div className="student-tab">
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
            <div><h4 className="mb-1">Thành viên khóa học</h4><p className="text-muted mb-0">Quản lý học viên và giảng viên tham gia khóa học.</p></div>
            <div className="student-tab-search"><FaSearch className="text-muted" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm học viên" aria-label="Tìm học viên" /></div>
        </div>
        <div className="row g-3 mb-4">
            <div className="col-md-6"><div className="participant-summary"><FaUsers className="text-primary" /><div><strong>{students.length}</strong><span>Học viên đã đăng ký</span></div></div></div>
            <div className="col-md-6"><div className="participant-summary"><FaChalkboardTeacher className="text-success" /><div><strong>{teachers.length}</strong><span>Giảng viên được phân công</span></div></div></div>
        </div>
        {loading ? <div className="text-center text-muted py-5">Đang tải thành viên khóa học...</div> : <>
            <section className="participant-section mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3"><h5 className="mb-0">Học viên</h5><span className="text-muted small">{filteredStudents.length} kết quả</span></div>
                {filteredStudents.length ? <div className="table-responsive"><table className="table align-middle mb-0"><thead><tr><th>Học viên</th><th>Tiến độ bài học</th><th>Bài tập</th><th>Liên hệ</th></tr></thead><tbody>
                    {filteredStudents.map((student) => { const course = student.Courses.find((item) => item._id === courseId); return <tr key={student._id}><td><strong>{student.Name}</strong><small className="d-block text-muted">{student.Email}</small></td><td><strong>{course?.LessonProgress ?? 0}%</strong><small className="d-block text-muted">{course?.CompletedLessons ?? 0}/{course?.TotalLessons ?? 0} bài học</small></td><td><strong>{course?.CompletedAssignments ?? 0}/{course?.TotalAssignments ?? 0}</strong><small className="d-block text-muted">đã hoàn thành</small></td><td>{student.Phone || "—"}</td></tr>; })}
                </tbody></table></div> : <div className="empty-participant">Khóa học chưa có học viên đăng ký.</div>}
            </section>
            <section className="participant-section"><div className="d-flex justify-content-between align-items-center mb-3"><h5 className="mb-0">Giảng viên</h5><span className="text-muted small">{teachers.length} người được phân công</span></div>
                {teachers.length ? <div className="row g-3">{teachers.map((teacher) => <div className="col-md-6 col-xl-4" key={teacher._id}><div className="teacher-card"><div className="teacher-avatar">{teacher.Name.charAt(0).toUpperCase()}</div><div className="min-w-0"><strong className="d-block text-truncate">{teacher.Name}</strong><small className="text-muted text-break">{teacher.Email}</small>{teacher.Phone && <small className="d-block text-muted">{teacher.Phone}</small>}</div></div></div>)}</div> : <div className="empty-participant">Chưa có giảng viên được phân công cho khóa học này.</div>}
            </section>
        </>}
    </div>;
}

export default StudentTab;
