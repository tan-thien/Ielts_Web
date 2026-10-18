
import { Container } from "react-bootstrap";
import { Link } from "react-router-dom";
import {
    FaArrowRight,
    FaEnvelope,
    FaPhoneAlt,
} from "react-icons/fa";

import "./Footer.css";

function Footer() {
    return (
        <footer className="site-footer">
            <Container>
                <div className="site-footer-main">
                    <div className="site-footer-about">
                        <Link to="/home" className="site-footer-brand" aria-label="Trang chủ IELTS AI">
                            <img className="footer-logo" src="/Logo_Name.png" alt="IELTS Học Tập" />
                        </Link>
                        <p>
                            Không gian học tập IELTS bài bản, giúp bạn rèn luyện
                            bốn kỹ năng và tiến gần hơn tới mục tiêu tiếng Anh.
                        </p>
                        <Link to="/register" className="site-footer-cta">
                            Bắt đầu học <FaArrowRight aria-hidden="true" />
                        </Link>
                    </div>

                    <nav className="site-footer-links" aria-label="Khám phá IELTS AI">
                        <h2>Khám phá</h2>
                        <Link to="/home#courses">Khóa học</Link>
                        <Link to="/home#features">Tính năng</Link>
                        <Link to="/home#why-choose-us">Vì sao chọn chúng tôi</Link>
                        <Link to="/home#faq">Câu hỏi thường gặp</Link>
                    </nav>

                    <nav className="site-footer-links" aria-label="Luyện tập các kỹ năng IELTS">
                        <h2>Luyện tập</h2>
                        <Link to="/home#writing-feedback">Viết</Link>
                        <Link to="/home#speaking-practice">Nói</Link>
                        <Link to="/home#listening-practice">Nghe</Link>
                        <Link to="/home#reading-practice">Đọc</Link>
                    </nav>

                    <div className="site-footer-contact">
                        <h2>Liên hệ</h2>
                        <p>Bạn cần hỗ trợ? Hãy liên hệ với đội ngũ của chúng tôi.</p>
                        <a href="mailto:admin@gmail.com">
                            <span className="site-footer-contact-icon">
                                <FaEnvelope aria-hidden="true" />
                            </span>
                            admin@gmail.com
                        </a>
                        <a href="tel:0123456789">
                            <span className="site-footer-contact-icon">
                                <FaPhoneAlt aria-hidden="true" />
                            </span>
                            0123456789
                        </a>
                    </div>
                </div>

                <div className="site-footer-bottom">
                    <span>
                        © {new Date().getFullYear()} IELTS AI. Bảo lưu mọi quyền.
                    </span>
                    <span>
                        Học tập thông minh. <strong>Tự tin tiến bước.</strong>
                    </span>
                </div>
            </Container>
        </footer>
    );
}

export default Footer;
