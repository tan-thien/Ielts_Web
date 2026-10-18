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
    typeof value === "number" ? `${value.toLocaleString("vi-VN")} đ` : "Đang cập nhật";

const statusLabels: Record<string, string> = {
    Active: "Đang hoạt động",
    Pending: "Đang chờ",
    Finished: "Đã hoàn tất",
};

function OverviewTab({ course, lessons, assignments, studentCount, teachers }: Props) {
    const activeLessons = lessons.filter((lesson) => lesson.Status === "Active").length;
    const contentReadiness = lessons.length ? Math.round((activeLessons / lessons.length) * 100) : 0;
    const detailCount = lessons.reduce((total, lesson) => total + (lesson.Details?.length || 0), 0);

    return (
        <div className="row g-4">
            <div className="col-12"><Card className="shadow-sm border-0"><Card.Body>
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                    <div><p className="text-uppercase text-muted small fw-semibold mb-1">Tổng quan khóa học</p><h4 className="mb-2">{course?.Name || "Thông tin khóa học"}</h4><p className="text-muted mb-0">{course?.Description || "Chưa có mô tả cho khóa học này."}</p></div>
                    <div className="d-flex gap-2 flex-wrap"><span className={`badge ${course?.Status ? "bg-success" : "bg-secondary"}`}>{course?.Status ? "Đang hoạt động" : "Ngừng hoạt động"}</span><span className={`badge ${course?.IsOpen ? "bg-primary" : "bg-secondary"}`}>{course?.IsOpen ? "Đang mở đăng ký" : "Đã đóng đăng ký"}</span></div>
                </div>
            </Card.Body></Card></div>

            <div className="col-lg-8"><Card className="shadow-sm border-0 h-100"><Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3"><h5 className="mb-0">Mức độ hoàn thiện nội dung</h5><strong className="text-primary">{contentReadiness}%</strong></div>
                <ProgressBar now={contentReadiness} label={`${contentReadiness}%`} style={{ height: 22 }} />
                <div className="row g-3 mt-3">
                    <div className="col-sm-4"><div className="border rounded p-3 h-100"><FaBook className="text-primary mb-2" /><div className="fw-bold">{lessons.length}</div><small className="text-muted">Tổng số bài học</small></div></div>
                    <div className="col-sm-4"><div className="border rounded p-3 h-100"><FaCheckCircle className="text-success mb-2" /><div className="fw-bold">{activeLessons}</div><small className="text-muted">Bài học đang hoạt động</small></div></div>
                    <div className="col-sm-4"><div className="border rounded p-3 h-100"><FaClipboardList className="text-warning mb-2" /><div className="fw-bold">{assignments.length}</div><small className="text-muted">Bài tập</small></div></div>
                </div>
                <p className="text-muted mt-3 mb-0">Chỉ số phản ánh trạng thái xuất bản bài học, không phải tiến độ hoàn thành của học viên. Khóa học hiện có {detailCount} nội dung bài học.</p>
            </Card.Body></Card></div>

            <div className="col-lg-4"><Card className="shadow-sm border-0 h-100"><Card.Body>
                <h5 className="mb-3">Thông tin khóa học</h5>
                <ListGroup variant="flush">
                    <ListGroup.Item className="px-0 d-flex justify-content-between gap-3"><span><FaMoneyBillWave className="me-2 text-success" />Học phí</span><strong>{formatCurrency(course?.Fee)}</strong></ListGroup.Item>
                    <ListGroup.Item className="px-0 d-flex justify-content-between gap-3"><span><FaClock className="me-2 text-primary" />Khai giảng</span><strong>{course?.Time || "Đang cập nhật"}</strong></ListGroup.Item>
                    <ListGroup.Item className="px-0 d-flex justify-content-between gap-3"><span><FaUsers className="me-2 text-warning" />Học viên</span><strong>{studentCount}</strong></ListGroup.Item>
                    <ListGroup.Item className="px-0 d-flex justify-content-between gap-3"><span>Giảng viên</span><strong>{teachers.length}</strong></ListGroup.Item>
                    <ListGroup.Item className="px-0"><small className="text-muted">Người tạo</small><div className="fw-semibold text-break">{course?.UserCreate?.Email || "Đang cập nhật"}</div></ListGroup.Item>
                </ListGroup>
            </Card.Body></Card></div>

            <div className="col-lg-6"><Card className="shadow-sm border-0 h-100"><Card.Body><h5 className="mb-3">Bài học</h5><ListGroup variant="flush">
                {lessons.slice(0, 6).map((lesson, index) => <ListGroup.Item key={lesson._id || `${lesson.Name}-${index}`} className="px-0 d-flex justify-content-between align-items-center gap-3"><span className="text-truncate">{index + 1}. {lesson.Name}</span><span className={`badge ${lesson.Status === "Active" ? "bg-success" : "bg-light text-dark"}`}>{statusLabels[lesson.Status] || lesson.Status}</span></ListGroup.Item>)}
                {!lessons.length && <div className="text-center text-muted py-4">Chưa có bài học.</div>}
            </ListGroup>{lessons.length > 6 && <small className="text-muted d-block mt-3">Đang hiển thị 6 bài học đầu tiên.</small>}</Card.Body></Card></div>

            <div className="col-lg-6"><Card className="shadow-sm border-0 h-100"><Card.Body><h5 className="mb-3">Bài tập</h5><ListGroup variant="flush">
                {assignments.slice(0, 6).map((assignment) => <ListGroup.Item key={assignment._id} className="px-0 d-flex justify-content-between align-items-center gap-3"><span className="text-truncate">{assignment.Title}</span><span className="badge bg-light text-dark">{assignment.Skill}</span></ListGroup.Item>)}
                {!assignments.length && <div className="text-center text-muted py-4">Chưa có bài tập.</div>}
            </ListGroup>{assignments.length > 6 && <small className="text-muted d-block mt-3">Đang hiển thị 6 bài tập đầu tiên.</small>}</Card.Body></Card></div>
        </div>
    );
}

export default OverviewTab;
