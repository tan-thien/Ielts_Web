import { Card, ListGroup, ProgressBar } from "react-bootstrap";
import { FaBook, FaCheckCircle, FaClipboardList, FaClock, FaMoneyBillWave, FaUsers } from "react-icons/fa";
import type { Assignment } from "../../../../types/assignment";
import type { Course } from "../../../../types/course";
import type { Lesson } from "../../../../types/lesson";
import type { ManagementTeacher } from "../../../../types/management";

interface Props {
    course: Course | null;
    lessons: Lesson[];
    assignments: Assignment[];
    studentCount: number;
    teachers: ManagementTeacher[];
}

const formatCurrency = (value: number | undefined) =>
    typeof value === "number" ? `${value.toLocaleString("vi-VN")} đ` : "Updating";

function OverviewTab({ course, lessons, assignments, studentCount, teachers }: Props) {
    const activeLessons = lessons.filter((lesson) => lesson.Status === "Active").length;
    const contentReadiness = lessons.length ? Math.round((activeLessons / lessons.length) * 100) : 0;
    const detailCount = lessons.reduce((total, lesson) => total + (lesson.Details?.length || 0), 0);

    return (
        <div className="row g-4">
            <div className="col-12"><Card className="shadow-sm border-0"><Card.Body>
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                    <div><p className="text-uppercase text-muted small fw-semibold mb-1">Course overview</p><h4 className="mb-2">{course?.Name || "Course information"}</h4><p className="text-muted mb-0">{course?.Description || "No course description has been added yet."}</p></div>
                    <div className="d-flex gap-2 flex-wrap"><span className={`badge ${course?.Status ? "bg-success" : "bg-secondary"}`}>{course?.Status ? "Active" : "Inactive"}</span><span className={`badge ${course?.IsOpen ? "bg-primary" : "bg-secondary"}`}>{course?.IsOpen ? "Open for learning" : "Closed for learning"}</span></div>
                </div>
            </Card.Body></Card></div>

            <div className="col-lg-8"><Card className="shadow-sm border-0 h-100"><Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3"><h5 className="mb-0">Content readiness</h5><strong className="text-primary">{contentReadiness}%</strong></div>
                <ProgressBar now={contentReadiness} label={`${contentReadiness}%`} style={{ height: 22 }} />
                <div className="row g-3 mt-3">
                    <div className="col-sm-4"><div className="border rounded p-3 h-100"><FaBook className="text-primary mb-2" /><div className="fw-bold">{lessons.length}</div><small className="text-muted">Total lessons</small></div></div>
                    <div className="col-sm-4"><div className="border rounded p-3 h-100"><FaCheckCircle className="text-success mb-2" /><div className="fw-bold">{activeLessons}</div><small className="text-muted">Active lessons</small></div></div>
                    <div className="col-sm-4"><div className="border rounded p-3 h-100"><FaClipboardList className="text-warning mb-2" /><div className="fw-bold">{assignments.length}</div><small className="text-muted">Assignments</small></div></div>
                </div>
                <p className="text-muted mt-3 mb-0">This indicator reflects lesson publishing status, not learner completion. The course currently has {detailCount} lesson content item{detailCount === 1 ? "" : "s"}.</p>
            </Card.Body></Card></div>

            <div className="col-lg-4"><Card className="shadow-sm border-0 h-100"><Card.Body>
                <h5 className="mb-3">Course information</h5>
                <ListGroup variant="flush">
                    <ListGroup.Item className="px-0 d-flex justify-content-between gap-3"><span><FaMoneyBillWave className="me-2 text-success" />Fee</span><strong>{formatCurrency(course?.Fee)}</strong></ListGroup.Item>
                    <ListGroup.Item className="px-0 d-flex justify-content-between gap-3"><span><FaClock className="me-2 text-primary" />Duration</span><strong>{course?.Time || "Updating"}</strong></ListGroup.Item>
                    <ListGroup.Item className="px-0 d-flex justify-content-between gap-3"><span><FaUsers className="me-2 text-warning" />Learners</span><strong>{studentCount}</strong></ListGroup.Item>
                    <ListGroup.Item className="px-0 d-flex justify-content-between gap-3"><span>Teachers</span><strong>{teachers.length}</strong></ListGroup.Item>
                    <ListGroup.Item className="px-0"><small className="text-muted">Created by</small><div className="fw-semibold text-break">{course?.UserCreate?.Email || "Updating"}</div></ListGroup.Item>
                </ListGroup>
            </Card.Body></Card></div>

            <div className="col-lg-6"><Card className="shadow-sm border-0 h-100"><Card.Body><h5 className="mb-3">Lessons</h5><ListGroup variant="flush">
                {lessons.slice(0, 6).map((lesson, index) => <ListGroup.Item key={lesson._id || `${lesson.Name}-${index}`} className="px-0 d-flex justify-content-between align-items-center gap-3"><span className="text-truncate">{index + 1}. {lesson.Name}</span><span className={`badge ${lesson.Status === "Active" ? "bg-success" : "bg-light text-dark"}`}>{lesson.Status}</span></ListGroup.Item>)}
                {!lessons.length && <div className="text-center text-muted py-4">No lessons yet.</div>}
            </ListGroup>{lessons.length > 6 && <small className="text-muted d-block mt-3">Showing the first 6 lessons.</small>}</Card.Body></Card></div>

            <div className="col-lg-6"><Card className="shadow-sm border-0 h-100"><Card.Body><h5 className="mb-3">Assignments</h5><ListGroup variant="flush">
                {assignments.slice(0, 6).map((assignment) => <ListGroup.Item key={assignment._id} className="px-0 d-flex justify-content-between align-items-center gap-3"><span className="text-truncate">{assignment.Title}</span><span className="badge bg-light text-dark">{assignment.Skill}</span></ListGroup.Item>)}
                {!assignments.length && <div className="text-center text-muted py-4">No assignments yet.</div>}
            </ListGroup>{assignments.length > 6 && <small className="text-muted d-block mt-3">Showing the first 6 assignments.</small>}</Card.Body></Card></div>
        </div>
    );
}

export default OverviewTab;
