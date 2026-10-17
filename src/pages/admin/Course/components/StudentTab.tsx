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
            <div><h4 className="mb-1">Course participants</h4><p className="text-muted mb-0">Manage the learners and teachers assigned to this course.</p></div>
            <div className="student-tab-search"><FaSearch className="text-muted" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search students" aria-label="Search students" /></div>
        </div>
        <div className="row g-3 mb-4">
            <div className="col-md-6"><div className="participant-summary"><FaUsers className="text-primary" /><div><strong>{students.length}</strong><span>Students enrolled</span></div></div></div>
            <div className="col-md-6"><div className="participant-summary"><FaChalkboardTeacher className="text-success" /><div><strong>{teachers.length}</strong><span>Teachers assigned</span></div></div></div>
        </div>
        {loading ? <div className="text-center text-muted py-5">Loading course participants...</div> : <>
            <section className="participant-section mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3"><h5 className="mb-0">Students</h5><span className="text-muted small">{filteredStudents.length} result{filteredStudents.length === 1 ? "" : "s"}</span></div>
                {filteredStudents.length ? <div className="table-responsive"><table className="table align-middle mb-0"><thead><tr><th>Student</th><th>Lesson progress</th><th>Assignments</th><th>Contact</th></tr></thead><tbody>
                    {filteredStudents.map((student) => { const course = student.Courses.find((item) => item._id === courseId); return <tr key={student._id}><td><strong>{student.Name}</strong><small className="d-block text-muted">{student.Email}</small></td><td><strong>{course?.LessonProgress ?? 0}%</strong><small className="d-block text-muted">{course?.CompletedLessons ?? 0}/{course?.TotalLessons ?? 0} lessons</small></td><td><strong>{course?.CompletedAssignments ?? 0}/{course?.TotalAssignments ?? 0}</strong><small className="d-block text-muted">completed</small></td><td>{student.Phone || "—"}</td></tr>; })}
                </tbody></table></div> : <div className="empty-participant">No students are enrolled in this course.</div>}
            </section>
            <section className="participant-section"><div className="d-flex justify-content-between align-items-center mb-3"><h5 className="mb-0">Teachers</h5><span className="text-muted small">{teachers.length} assigned</span></div>
                {teachers.length ? <div className="row g-3">{teachers.map((teacher) => <div className="col-md-6 col-xl-4" key={teacher._id}><div className="teacher-card"><div className="teacher-avatar">{teacher.Name.charAt(0).toUpperCase()}</div><div className="min-w-0"><strong className="d-block text-truncate">{teacher.Name}</strong><small className="text-muted text-break">{teacher.Email}</small>{teacher.Phone && <small className="d-block text-muted">{teacher.Phone}</small>}</div></div></div>)}</div> : <div className="empty-participant">No teacher has been assigned to this course.</div>}
            </section>
        </>}
    </div>;
}

export default StudentTab;
