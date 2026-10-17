
import { Container } from "react-bootstrap";
import { Link } from "react-router-dom";
import {
    FaGraduationCap,
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
                        <Link to="/home" className="site-footer-brand" aria-label="IELTS AI home">
                            <span className="site-footer-brand-icon">
                                <FaGraduationCap />
                            </span>
                            <span className="site-footer-brand-name">
                                IELTS<span> NGTANTH_</span>
                            </span>
                        </Link>
                        <p>
                            A focused place to study, practice all four IELTS
                            skills and keep moving toward your English goals.
                        </p>
                        <Link to="/register" className="site-footer-cta">
                            Start learning <FaArrowRight aria-hidden="true" />
                        </Link>
                    </div>

                    <nav className="site-footer-links" aria-label="Explore IELTS AI">
                        <h2>Explore</h2>
                        <Link to="/home#courses">Courses</Link>
                        <Link to="/home#features">All features</Link>
                        <Link to="/home#why-choose-us">Why choose us</Link>
                        <Link to="/home#faq">FAQs</Link>
                    </nav>

                    <nav className="site-footer-links" aria-label="Practice IELTS skills">
                        <h2>Practice</h2>
                        <Link to="/home#writing-feedback">Writing</Link>
                        <Link to="/home#speaking-practice">Speaking</Link>
                        <Link to="/home#listening-practice">Listening</Link>
                        <Link to="/home#reading-practice">Reading</Link>
                    </nav>

                    <div className="site-footer-contact">
                        <h2>Get in touch</h2>
                        <p>Questions about getting started? Contact our team.</p>
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
                        © {new Date().getFullYear()} IELTS AI. All rights reserved.
                    </span>
                    <span>
                        Learn smarter. <strong>Grow confidently.</strong>
                    </span>
                </div>
            </Container>
        </footer>
    );
}

export default Footer;
