import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaBookOpen, FaCheckCircle, FaClock } from "react-icons/fa";
import axios from "axios";
import { createCoursePayment, getCourseById, getCourseOrder } from "../../../services/course.service";
import { getLessonByCourseId } from "../../../services/lesson.service";
import type { Course, CourseOrder } from "../../../types/course";
import type { Lesson } from "../../../types/lesson";
import "./CourseDetailPage.css";

function formatFee(fee: number) {
    return fee === 0
        ? "Miễn phí"
        : new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
              maximumFractionDigits: 0,
          }).format(fee);
}

function CourseDetailPage() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState<Course | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [order, setOrder] = useState<CourseOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPaying, setIsPaying] = useState(false);
    const [showPaymentMethods, setShowPaymentMethods] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"MoMo" | "VNPAY">("MoMo");
    const [error, setError] = useState("");
    const [paymentError, setPaymentError] = useState("");

    useEffect(() => {
        if (!courseId) return;

        let isMounted = true;
        Promise.all([getCourseById(courseId), getLessonByCourseId(courseId)])
            .then(([courseData, lessonData]: [Course, Lesson[]]) => {
                if (!isMounted) return;
                setCourse(courseData);
                setLessons(lessonData.filter((lesson) => !lesson.IsDeleted && lesson.Status === "Active"));
            })
            .catch(() => {
                if (isMounted) setError("Không thể tải thông tin khóa học. Vui lòng thử lại.");
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        if (localStorage.getItem("token") && localStorage.getItem("role") === "user") {
            getCourseOrder(courseId)
                .then((data) => {
                    if (isMounted) setOrder(data);
                })
                .catch(() => {
                    if (isMounted) {
                        setPaymentError("Không thể kiểm tra trạng thái đơn hàng. Vui lòng tải lại trang.");
                    }
                });
        }

        return () => {
            isMounted = false;
        };
    }, [courseId]);

    const handlePayment = async (paymentMethod: "MoMo" | "VNPAY" | "Free" = selectedPaymentMethod) => {
        if (!courseId) return;
        if (!localStorage.getItem("token")) {
            navigate(`/login?redirect=${encodeURIComponent(`/courses/${courseId}`)}`);
            return;
        }
        if (localStorage.getItem("role") !== "user") {
            setPaymentError("Chỉ tài khoản học viên mới có thể mua khóa học.");
            return;
        }

        setIsPaying(true);
        setPaymentError("");
        try {
            const result = await createCoursePayment(courseId, paymentMethod);
            if (result.alreadyPaid || result.order.Status === "Paid") {
                navigate(`/courses/${courseId}/learn`);
            } else if (result.paymentUrl) {
                window.location.assign(result.paymentUrl);
            } else {
                setPaymentError("Không nhận được đường dẫn thanh toán. Vui lòng thử lại.");
            }
        } catch (paymentRequestError) {
            console.error(paymentRequestError);
            const serverMessage = axios.isAxiosError<{ message?: string }>(paymentRequestError)
                ? paymentRequestError.response?.data?.message
                : undefined;
            setPaymentError(serverMessage || "Tạo thanh toán thất bại. Vui lòng thử lại sau.");
        } finally {
            setIsPaying(false);
        }
    };

    if (isLoading) {
        return <div className="course-detail-state" role="status">Đang tải thông tin khóa học...</div>;
    }

    if (error || !course) {
        return (
            <div className="course-detail-state course-detail-error" role="alert">
                {error || "Không tìm thấy khóa học."}
                <Link to="/courses">Quay lại danh sách khóa học</Link>
            </div>
        );
    }

    const date = new Date(course.Time);
    const startDate = Number.isNaN(date.getTime())
        ? course.Time
        : date.toLocaleDateString("vi-VN");

    return (
        <main className="course-detail-page">
            <div className="course-detail-container">
                <Link className="course-detail-back" to="/courses">
                    <FaArrowLeft aria-hidden="true" /> Danh sách khóa học
                </Link>

                <section className="course-detail-hero">
                    <div className="course-detail-copy">
                        <span className="course-detail-eyebrow">CHI TIẾT KHÓA HỌC</span>
                        <h1>{course.Name}</h1>
                        <p>{course.Description}</p>
                        <div className="course-detail-facts">
                            <span><FaBookOpen aria-hidden="true" /> {lessons.length} bài học</span>
                            <span><FaClock aria-hidden="true" /> Khai giảng: {startDate}</span>
                        </div>
                    </div>
                    <aside className="course-detail-enroll-card">
                        {course.Thumbnail && <img src={course.Thumbnail} alt={course.Name} />}
                        <div className="course-detail-price">{formatFee(course.Fee)}</div>
                        {order?.Status === "Paid" ? (
                            <div className="course-detail-enrolled" role="status">
                                <FaCheckCircle aria-hidden="true" />
                                Bạn đã mua khóa học này
                            </div>
                        ) : (
                            course.Fee === 0 ? (
                                <button
                                    className="course-detail-enroll-button"
                                    type="button"
                                    onClick={() => void handlePayment("Free")}
                                    disabled={isPaying || !course.Status || !course.IsOpen}
                                >
                                    {isPaying ? "Đang xử lý..." : "Học miễn phí"}
                                </button>
                            ) : (
                                <>
                                    {!showPaymentMethods ? (
                                        <button
                                            className="course-detail-enroll-button"
                                            type="button"
                                            onClick={() => setShowPaymentMethods(true)}
                                            disabled={isPaying || !course.Status || !course.IsOpen}
                                        >
                                            Chọn phương thức thanh toán
                                        </button>
                                    ) : (
                                        <div className="course-payment-methods">
                                            <fieldset disabled={isPaying}>
                                                <legend>Chọn phương thức</legend>
                                                <label className={selectedPaymentMethod === "MoMo" ? "selected" : ""}>
                                                    <input
                                                        type="radio"
                                                        name="payment-method"
                                                        value="MoMo"
                                                        checked={selectedPaymentMethod === "MoMo"}
                                                        onChange={() => setSelectedPaymentMethod("MoMo")}
                                                    />
                                                    <span className="course-payment-logo momo-logo">M</span>
                                                    <span><strong>MoMo</strong><small>Ví điện tử MoMo</small></span>
                                                </label>
                                                <label className={selectedPaymentMethod === "VNPAY" ? "selected" : ""}>
                                                    <input
                                                        type="radio"
                                                        name="payment-method"
                                                        value="VNPAY"
                                                        checked={selectedPaymentMethod === "VNPAY"}
                                                        onChange={() => setSelectedPaymentMethod("VNPAY")}
                                                    />
                                                    <span className="course-payment-logo vnpay-logo">V</span>
                                                    <span><strong>VNPay</strong><small>Thẻ nội địa, QR và ngân hàng</small></span>
                                                </label>
                                            </fieldset>
                                            <button
                                                className="course-detail-enroll-button"
                                                type="button"
                                                onClick={() => void handlePayment()}
                                                disabled={isPaying}
                                            >
                                                {isPaying
                                                    ? `Đang chuyển đến ${selectedPaymentMethod}...`
                                                    : `Thanh toán bằng ${selectedPaymentMethod}`}
                                            </button>
                                            <button
                                                className="course-payment-cancel"
                                                type="button"
                                                onClick={() => setShowPaymentMethods(false)}
                                                disabled={isPaying}
                                            >
                                                Quay lại
                                            </button>
                                        </div>
                                    )}
                                </>
                            )
                        )}
                        {order?.Status === "Paid" && (
                            <Link className="course-detail-learn-button" to={`/courses/${courseId}/learn`}>
                                Vào học ngay
                            </Link>
                        )}
                        {(!course.Status || !course.IsOpen) && (
                            <p className="course-detail-closed">Khóa học hiện chưa mở đăng ký.</p>
                        )}
                        {paymentError && (
                            <p className="course-detail-error-text" role="alert">{paymentError}</p>
                        )}
                        <p className="course-detail-notice">
                            Quyền học được mở sau khi cổng thanh toán xác nhận giao dịch thành công.
                        </p>
                    </aside>
                </section>

                <section className="course-detail-syllabus">
                    <div className="course-detail-section-heading">
                        <span className="course-detail-eyebrow">LỘ TRÌNH HỌC</span>
                        <h2>Nội dung khóa học</h2>
                        <p>Xem trước các bài học và chủ đề bạn sẽ học trong khóa này.</p>
                    </div>
                    {lessons.length > 0 ? (
                        <ol className="course-detail-lesson-list">
                            {lessons.map((lesson, index) => (
                                <li key={lesson._id || `${lesson.Name}-${index}`}>
                                    <span className="course-detail-lesson-number">
                                        {String(index + 1).padStart(2, "0")}
                                    </span>
                                    <div>
                                        <h3>{lesson.Name}</h3>
                                        <p>{lesson.Description || "Nội dung bài học sẽ được cập nhật."}</p>
                                        {lesson.Unit && <span>{lesson.Unit}</span>}
                                    </div>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <p className="course-detail-empty">
                            Nội dung bài học đang được cập nhật. Vui lòng quay lại sau.
                        </p>
                    )}
                </section>
            </div>
        </main>
    );
}

export default CourseDetailPage;
