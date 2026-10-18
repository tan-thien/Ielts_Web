
import {
    FaBookOpen,
    FaPenFancy,
    FaHeadphones,
    FaMicrophone,
    FaChartLine,
    FaGraduationCap,
    FaArrowRight,
    FaStar,
    FaUsers,
    FaCheckCircle,
    FaPlay,
    FaClock,
    FaLaptop,
    FaLightbulb,
    FaQuestionCircle,
} from "react-icons/fa";

import { Link } from "react-router-dom";
import "./HomePage.css";

const features = [
    {
        id: "writing-feedback",
        icon: FaPenFancy,
        title: "Chấm bài Viết bằng AI",
        description:
            "Nhận góp ý cụ thể về bài viết, ngữ pháp, từ vựng và tiêu chí chấm IELTS.",
        color: "orange",
    },
    {
        id: "speaking-practice",
        icon: FaMicrophone,
        title: "Luyện kỹ năng Nói",
        description:
            "Tự tin giao tiếp hơn với câu hỏi gợi ý và bài luyện tập có định hướng.",
        color: "blue",
    },
    {
        id: "listening-practice",
        icon: FaHeadphones,
        title: "Luyện kỹ năng Nghe",
        description:
            "Luyện nghe qua bài tập, câu hỏi và lời giải thích đáp án rõ ràng.",
        color: "orange",
    },
    {
        id: "reading-practice",
        icon: FaBookOpen,
        title: "Luyện kỹ năng Đọc",
        description:
            "Cải thiện khả năng đọc hiểu, quản lý thời gian và tìm thông tin quan trọng.",
        color: "blue",
    },
    {
        id: "learning-progress",
        icon: FaChartLine,
        title: "Theo dõi tiến độ học",
        description:
            "Xem lại kết quả luyện tập và xác định kỹ năng cần ưu tiên.",
        color: "orange",
    },
    {
        id: "guided-courses",
        icon: FaGraduationCap,
        title: "Khóa học bài bản",
        description:
            "Lộ trình học rõ ràng từ nền tảng tiếng Anh đến luyện thi IELTS.",
        color: "blue",
    },
];

const courses = [
    {
        title: "Nền tảng IELTS",
        level: "Cơ bản",
        description:
            "Củng cố ngữ pháp, từ vựng và xây nền tảng cho cả bốn kỹ năng.",
        image:
            "https://images.unsplash.com/photo-1513258496099-48168024aec0?w=900",
        rating: "4.9",
        students: "2.4k",
        duration: "8 tuần",
    },
    {
        title: "Chinh phục IELTS Nói",
        level: "Trung cấp",
        description:
            "Phát triển ý tưởng, trả lời tự tin và làm quen với dạng câu hỏi thi Nói.",
        image:
            "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=900",
        rating: "4.8",
        students: "1.8k",
        duration: "6 tuần",
    },
    {
        title: "Bộ đề thi thử IELTS",
        level: "Mọi trình độ",
        description:
            "Làm quen cấu trúc đề, quản lý thời gian và tự đánh giá kết quả.",
        image:
            "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=900",
        rating: "4.9",
        students: "1.2k",
        duration: "Tự học linh hoạt",
    },
];

const learningSteps = [
    {
        number: "01",
        icon: FaLaptop,
        title: "Chọn khóa học",
        description:
            "Chọn khóa học và kỹ năng phù hợp với mục tiêu hiện tại.",
    },
    {
        number: "02",
        icon: FaLightbulb,
        title: "Học và luyện tập",
        description:
            "Nắm kiến thức trọng tâm, hoàn thành bài tập và chủ động thực hành.",
    },
    {
        number: "03",
        icon: FaChartLine,
        title: "Theo dõi tiến độ",
        description:
            "Xem kết quả và xác định nội dung cần cải thiện tiếp theo.",
    },
];

const faqs = [
    {
        question: "Nền tảng phù hợp với trình độ tiếng Anh nào?",
        answer:
            "Bạn có thể bắt đầu từ kiến thức nền tảng hoặc chọn bài luyện theo kỹ năng muốn cải thiện.",
    },
    {
        question: "AI góp ý bài Viết như thế nào?",
        answer:
            "Gửi bài viết để nhận góp ý về ngữ pháp, từ vựng và cách sắp xếp ý. Đây là phản hồi tham khảo, không thay thế kết quả chấm IELTS chính thức.",
    },
    {
        question: "Tôi có thể luyện đủ bốn kỹ năng IELTS không?",
        answer:
            "Có. Lộ trình học bao gồm Nghe, Đọc, Viết và Nói thông qua khóa học cùng các hoạt động thực hành.",
    },
    {
        question: "Tôi có thể theo dõi quá trình học không?",
        answer:
            "Bạn có thể xem lại kết quả luyện tập để biết kỹ năng nào nên được ưu tiên tiếp theo.",
    },
];

function HomePage() {
    return (
        <div className="home-page">
            {/* HERO */}
            <section className="hero-section">
                <div className="hero-decoration hero-decoration-one" />
                <div className="hero-decoration hero-decoration-two" />

                <div className="container hero-container">
                    <div className="row align-items-center g-5">
                        <div className="col-lg-6">
                            <div className="hero-content">
                                <span className="hero-badge">
                                    <FaGraduationCap />
                                    Bắt đầu hành trình IELTS hiệu quả hơn
                                </span>

                                <h1 className="hero-title">
                                    Học IELTS
                                    <br />
                                    <span>Hiệu quả hơn cùng AI</span>
                                </h1>

                                <p className="hero-description">
                                    Cải thiện tiếng Anh với khóa học tương tác,
                                    góp ý bài viết bằng AI, luyện nói và theo dõi
                                    tiến độ học tập dành riêng cho bạn.
                                </p>

                                <div className="hero-actions">
                                    <Link to="/courses" className="btn-home btn-orange">
                                        Khám phá khóa học <FaArrowRight />
                                    </Link>

                                    <a href="#features" className="btn-home btn-outline-light">
                                        <FaPlay /> Khám phá nền tảng
                                    </a>
                                </div>

                                <div className="hero-trust">
                                    <div className="hero-avatar-stack">
                                        <span>H</span>
                                        <span>M</span>
                                        <span>A</span>
                                        <span>+</span>
                                    </div>

                                    <div>
                                        <div className="hero-stars">
                                            <FaStar />
                                            <FaStar />
                                            <FaStar />
                                            <FaStar />
                                            <FaStar />
                                        </div>
                                        <p>
                                            Cách luyện tiếng Anh thông minh hơn
                                        </p>
                                    </div>
                                </div>

                                <div className="hero-benefits">
                                    <span>
                                        <FaCheckCircle />
                                        Học theo nhịp độ của bạn
                                    </span>
                                    <span>
                                        <FaCheckCircle />
                                        Luyện đủ bốn kỹ năng
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-6">
                            <div className="hero-visual">
                                <div className="hero-orbit" />

                                <div className="hero-image-frame">
                                    <img
                                        src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1000"
                                        alt="Học viên cùng nhau học tập"
                                    />
                                </div>

                                <div className="floating-card rating-card">
                                    <div className="floating-icon orange-icon">
                                        <FaStar />
                                    </div>
                                    <div>
                                        <strong>Học tập thông minh</strong>
                                        <span>Hình thành thói quen học tốt</span>
                                    </div>
                                </div>

                                <div className="floating-card progress-card">
                                    <div className="floating-icon blue-icon">
                                        <FaChartLine />
                                    </div>
                                    <div className="progress-card-content">
                                        <strong>Tiến độ của bạn</strong>
                                        <span>Luyện tập từng bước mỗi ngày</span>
                                        <div className="progress-track">
                                            <div />
                                        </div>
                                    </div>
                                </div>

                                <div className="hero-note">
                                    <span>Ước mơ lớn.</span>
                                    <span>Luyện tập mỗi ngày.</span>
                                    <span>Tự tin tiến bước.</span>
                                </div>

                                <div className="hero-dot-pattern" />
                            </div>
                        </div>
                    </div>

                    <div className="hero-bottom-strip">
                        <div>
                            <FaBookOpen />
                            <span>Lộ trình học bài bản</span>
                        </div>
                        <div>
                            <FaPenFancy />
                            <span>Luyện tập với AI</span>
                        </div>
                        <div>
                            <FaChartLine />
                            <span>Theo dõi tiến độ</span>
                        </div>
                        <div>
                            <FaUsers />
                            <span>Học theo nhịp độ riêng</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section className="section-padding features-section" id="features">
                <div className="container">
                    <div className="section-heading text-center">
                        <span className="section-eyebrow">TÍNH NĂNG NỔI BẬT</span>
                        <h2>
                            Mọi điều bạn cần để
                            <br className="desktop-break" /> chinh phục IELTS
                        </h2>
                        <p>
                            Phát triển kỹ năng với trải nghiệm học tập giúp mỗi
                            buổi luyện tập đều thiết thực và hiệu quả.
                        </p>
                    </div>

                    <div className="row g-4">
                        {features.map((feature) => {
                            const Icon = feature.icon;

                            return (
                                <div
                                    className="col-md-6 col-lg-4"
                                    key={feature.id}
                                >
                                    <article className="feature-card" id={feature.id}>
                                        <div
                                            className={`feature-icon ${feature.color}`}
                                        >
                                            <Icon />
                                        </div>

                                        <h3>{feature.title}</h3>
                                        <p>{feature.description}</p>

                                        <div className="feature-card-bottom">
                                            <span>Khám phá tính năng</span>
                                            <span className="feature-arrow">
                                                <FaArrowRight />
                                            </span>
                                        </div>
                                    </article>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* COURSES */}
            <section className="section-padding courses-section" id="courses">
                <div className="container">
                    <div className="section-heading-row">
                        <div className="section-heading">
                            <span className="section-eyebrow">
                                HỌC THEO CÁCH CỦA BẠN
                            </span>
                            <h2>Khám phá khóa học IELTS</h2>
                            <p>
                                Chọn khóa học phù hợp với mục tiêu và bắt đầu
                                tiến bộ ngay hôm nay.
                            </p>
                        </div>

                        <Link to="/courses" className="btn-home btn-outline-blue">
                            Xem tất cả khóa học <FaArrowRight />
                        </Link>
                    </div>

                    <div className="row g-4">
                        {courses.map((course) => (
                            <div className="col-md-6 col-lg-4" key={course.title}>
                                <article className="course-card">
                                    <div className="course-image">
                                        <img
                                            src={course.image}
                                            alt={course.title}
                                            loading="lazy"
                                        />
                                        <span className="course-level">
                                            {course.level}
                                        </span>
                                    </div>

                                    <div className="course-body">
                                        <div className="course-meta">
                                            <span>
                                                <FaClock />
                                                {course.duration}
                                            </span>
                                            <span className="course-rating">
                                                <FaStar />
                                                {course.rating}
                                            </span>
                                        </div>

                                        <h3>{course.title}</h3>
                                        <p>{course.description}</p>

                                        <div className="course-footer">
                                            <span className="course-students">
                                                <FaUsers />
                                                {course.students} học viên
                                            </span>

                                            <button
                                                type="button"
                                                className="course-link"
                                                aria-label={`Tìm hiểu thêm về ${course.title}`}
                                            >
                                                Tìm hiểu thêm
                                                <FaArrowRight />
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* WHY CHOOSE US */}
            <section
                className="section-padding results-section"
                id="why-choose-us"
            >
                <div className="container">
                    <div className="row align-items-center g-5">
                        <div className="col-lg-6">
                            <div className="section-heading results-heading">
                                <span className="section-eyebrow">
                                    VÌ SAO CHỌN CHÚNG TÔI
                                </span>
                                <h2>
                                    Cách học IELTS rõ ràng hơn,
                                    <br />
                                    từng bước một
                                </h2>
                                <p>
                                    Xây dựng thói quen học đều đặn với bài học
                                    bài bản, nội dung luyện tập trọng tâm và lộ
                                    trình rõ ràng cho cả bốn kỹ năng IELTS.
                                </p>
                            </div>

                            <div className="stats-grid">
                                <div className="stat-item">
                                    <div className="stat-icon orange">
                                        <FaUsers />
                                    </div>
                                    <strong>4 kỹ năng</strong>
                                    <span>Luyện tập trên cùng nền tảng</span>
                                </div>

                                <div className="stat-item">
                                    <div className="stat-icon blue">
                                        <FaChartLine />
                                    </div>
                                    <strong>Theo dõi tiến độ</strong>
                                    <span>Biết nội dung cần luyện tiếp theo</span>
                                </div>

                                <div className="stat-item">
                                    <div className="stat-icon orange">
                                        <FaGraduationCap />
                                    </div>
                                    <strong>Học tập linh hoạt</strong>
                                    <span>Học theo nhịp độ của riêng bạn</span>
                                </div>

                                <div className="stat-item">
                                    <div className="stat-icon blue">
                                        <FaCheckCircle />
                                    </div>
                                    <strong>Luyện tập trọng tâm</strong>
                                    <span>Phát triển từng kỹ năng</span>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-6">
                            <div className="testimonial-layout">
                                <div className="testimonial-card">
                                    <span className="section-eyebrow">
                                        LỘ TRÌNH TẬP TRUNG
                                    </span>

                                    <p className="testimonial-text">
                                        Đặt mục tiêu rõ ràng, luyện tập từng kỹ
                                        năng và sử dụng góp ý để xác định bước
                                        tiến tiếp theo.
                                    </p>

                                    <div className="testimonial-author">
                                        <div className="author-avatar">
                                            <FaGraduationCap />
                                        </div>
                                        <div>
                                            <strong>IELTS AI</strong>
                                            <span>Người bạn đồng hành học tập</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="testimonial-image">
                                    <img
                                        src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900"
                                        alt="Học viên học tập với máy tính"
                                        loading="lazy"
                                    />
                                    <div className="image-caption">
                                        <FaGraduationCap />
                                        <span>
                                            Mục tiêu của bạn.
                                            <strong> Hành trình của bạn.</strong>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="section-padding process-section">
                <div className="container">
                    <div className="section-heading text-center">
                        <span className="section-eyebrow">CÁCH THỨC HOẠT ĐỘNG</span>
                        <h2>Hành trình IELTS qua 3 bước đơn giản</h2>
                        <p>
                            Lộ trình học đơn giản giúp bạn luôn tập trung
                            và không ngừng tiến bộ.
                        </p>
                    </div>

                    <div className="row g-4 process-grid">
                        {learningSteps.map((step) => {
                            const Icon = step.icon;

                            return (
                                <div
                                    className="col-md-4"
                                    key={step.number}
                                >
                                    <article className="process-card">
                                        <div className="process-number">
                                            {step.number}
                                        </div>
                                        <div className="process-icon">
                                            <Icon />
                                        </div>
                                        <h3>{step.title}</h3>
                                        <p>{step.description}</p>
                                    </article>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="section-padding faq-section" id="faq">
                <div className="container">
                    <div className="row g-5">
                        <div className="col-lg-5">
                            <div className="section-heading faq-heading">
                                <span className="section-eyebrow">
                                    BẠN CẦN HỖ TRỢ?
                                </span>
                                <h2>Câu hỏi thường gặp</h2>
                                <p>
                                    Bạn có thắc mắc về hành trình học tập?
                                    Hãy tham khảo lời giải đáp cho các câu hỏi phổ biến.
                                </p>

                                <div className="faq-help">
                                    <FaQuestionCircle />
                                    <span>
                                        Bạn vẫn còn thắc mắc?
                                        <strong> Chúng tôi luôn sẵn sàng hỗ trợ.</strong>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-7">
                            <div className="faq-list">
                                {faqs.map((faq, index) => (
                                    <details
                                        className="faq-item"
                                        key={faq.question}
                                        open={index === 0}
                                    >
                                        <summary>
                                            {faq.question}
                                            <span className="faq-toggle">
                                                +
                                            </span>
                                        </summary>
                                        <p>{faq.answer}</p>
                                    </details>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CALL TO ACTION */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-content">
                        <div className="cta-icon">
                            <FaGraduationCap />
                        </div>

                        <div className="cta-text">
                            <span>CHƯƠNG MỚI CỦA BẠN BẮT ĐẦU TỪ ĐÂY</span>
                            <h2>Sẵn sàng bắt đầu hành trình IELTS?</h2>
                            <p>
                                Đặt mục tiêu, xây dựng sự tự tin và tận dụng
                                hiệu quả từng buổi luyện tập.
                            </p>
                        </div>

                        <Link to="/register" className="btn-home btn-cta">
                            Bắt đầu ngay <FaArrowRight />
                        </Link>

                        <div className="cta-decoration" />
                    </div>
                </div>
            </section>

        </div>
    );
}

export default HomePage;