import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaBookOpen, FaSearch } from "react-icons/fa";
import { getCourses } from "../../services/course.service";
import type { Course } from "../../types/course";
import "./CoursePage.css";

function formatFee(fee: number) {
    return fee === 0
        ? "Miễn phí"
        : new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
              maximumFractionDigits: 0,
          }).format(fee);
}

function CoursePageUser() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        getCourses()
            .then((data: Course[]) => {
                if (isMounted) {
                    setCourses(data);
                    setError("");
                }
            })
            .catch(() => {
                if (isMounted) {
                    setError("Không thể tải danh sách khóa học. Vui lòng thử lại.");
                }
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const visibleCourses = useMemo(
        () =>
            courses.filter(
                (course) =>
                    course.Status &&
                    course.IsOpen &&
                    !course.IsDeleted &&
                    course.Name.toLocaleLowerCase("vi").includes(search.trim().toLocaleLowerCase("vi")),
            ),
        [courses, search],
    );

    return (
        <div className="public-courses">
            <section className="public-courses-hero">
                <div className="public-courses-container">
                    <span className="public-courses-eyebrow">IELTS LEARNING</span>
                    <h1>Chọn khóa học phù hợp với bạn</h1>
                    <p>
                        Khám phá lộ trình học IELTS, xem nội dung từng khóa học và
                        gửi yêu cầu đăng ký ngay hôm nay.
                    </p>
                    <label className="public-courses-search">
                        <FaSearch aria-hidden="true" />
                        <input
                            aria-label="Tìm khóa học"
                            placeholder="Tìm theo tên khóa học..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </label>
                </div>
            </section>

            <section className="public-courses-list public-courses-container">
                <div className="public-courses-heading">
                    <div>
                        <span className="public-courses-eyebrow">DANH SÁCH KHÓA HỌC</span>
                        <h2>Khóa học đang mở</h2>
                    </div>
                    {!isLoading && !error && (
                        <span className="public-courses-count">
                            {visibleCourses.length} khóa học
                        </span>
                    )}
                </div>

                {isLoading && (
                    <p className="public-courses-message" role="status">
                        Đang tải khóa học...
                    </p>
                )}
                {error && (
                    <p className="public-courses-message public-courses-error" role="alert">
                        {error}
                    </p>
                )}
                {!isLoading && !error && visibleCourses.length === 0 && (
                    <p className="public-courses-message">
                        {search
                            ? "Không tìm thấy khóa học phù hợp."
                            : "Hiện chưa có khóa học nào đang mở."}
                    </p>
                )}

                {!isLoading && !error && visibleCourses.length > 0 && (
                    <div className="public-courses-grid">
                        {visibleCourses.map((course) => (
                            <article className="public-course-card" key={course._id}>
                                <Link
                                    className="public-course-image"
                                    to={`/courses/${course._id}`}
                                    aria-label={`Xem chi tiết khóa học ${course.Name}`}
                                >
                                    {course.Thumbnail ? (
                                        <img src={course.Thumbnail} alt={course.Name} loading="lazy" />
                                    ) : (
                                        <span className="public-course-image-placeholder">
                                            <FaBookOpen aria-hidden="true" />
                                        </span>
                                    )}
                                    <span className="public-course-open">Đang tuyển sinh</span>
                                </Link>
                                <div className="public-course-content">
                                    <h3>{course.Name}</h3>
                                    <p>{course.Description}</p>
                                    <div className="public-course-footer">
                                        <strong>{formatFee(course.Fee)}</strong>
                                        <Link className="public-course-detail-link" to={`/courses/${course._id}`}>
                                            Xem chi tiết <FaArrowRight aria-hidden="true" />
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

export default CoursePageUser;
