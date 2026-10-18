import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaBookOpen, FaSearch } from "react-icons/fa";
import { getMyCourses, type MyCourseSummary } from "../../services/course.service";
import { LearningDashboard } from "./CoursePage";
import "./CoursePage.css";

function MyCoursesPage() {
    const [items, setItems] = useState<MyCourseSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    useEffect(() => {
        getMyCourses().then(setItems).catch(() => setError("Không thể tải khóa học của bạn. Vui lòng đăng nhập lại hoặc thử lại.")).finally(() => setLoading(false));
    }, []);
    const visible = items.filter((item) => item.course.Name.toLocaleLowerCase("vi").includes(search.trim().toLocaleLowerCase("vi")));
    return <div className="public-courses my-courses-page"><section className="public-courses-hero"><div className="public-courses-container"><span className="public-courses-eyebrow">KHÓA HỌC CỦA TÔI</span><h1>Không gian học tập của bạn</h1><p>Theo dõi tiến độ, mở lại khóa học và xem lịch những ngày bạn đã học.</p><label className="public-courses-search"><FaSearch aria-hidden="true" /><input aria-label="Tìm khóa học của tôi" placeholder="Tìm khóa học của tôi..." value={search} onChange={(event) => setSearch(event.target.value)} /></label></div></section>{loading && <p className="public-courses-message public-courses-container">Đang tải khóa học...</p>}{error && <p className="public-courses-message public-courses-error public-courses-container">{error}</p>}{!loading && !error && items.length === 0 && <div className="public-courses-message public-courses-container"><FaBookOpen /><p>Bạn chưa có khóa học nào đã đăng ký.</p><Link to="/courses" className="public-course-detail-link">Khám phá khóa học</Link></div>}{!loading && !error && visible.length > 0 && <LearningDashboard items={visible} />}{!loading && !error && items.length > 0 && visible.length === 0 && <p className="public-courses-message public-courses-container">Không tìm thấy khóa học phù hợp.</p>}</div>;
}

export default MyCoursesPage;
