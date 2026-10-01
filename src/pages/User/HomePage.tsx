import {
    FaBookOpen,
    FaPenFancy,
    FaHeadphones,
    FaMicrophone,
    FaChartLine,
    FaGraduationCap,
    FaArrowRight
} from "react-icons/fa";

import "./HomePage.css";

function HomePage() {

    return (

        <>

            {/* Hero */}

            <section className="hero-section position-relative overflow-hidden">

                <div className="hero-shape hero-shape-1"></div>
                <div className="hero-shape hero-shape-2"></div>

                <div className="container">

                    <div className="row align-items-center min-vh-75">

                        <div className="col-lg-6">

                            <span className="hero-badge">

                                🚀 Modern IELTS Learning Platform

                            </span>

                            <h1 className="hero-title">

                                Learn IELTS
                                <br />

                                <span>Smarter with AI</span>

                            </h1>

                            <p className="hero-text">

                                Interactive courses, AI Writing Feedback,
                                Speaking Practice, Vocabulary Builder,
                                Progress Tracking and Mock Tests.

                            </p>

                            <div className="hero-buttons">

                                <button className="btn btn-warning btn-lg px-4">

                                    Explore Courses

                                </button>

                                <button className="btn btn-light btn-lg px-4 ms-3">

                                    Free Trial

                                </button>

                            </div>

                        </div>

                        <div className="col-lg-6">

                            <div className="hero-image">

                                <img
                                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=900"
                                    className="img-fluid"
                                    alt=""
                                />

                                <div className="floating-box">

                                    ⭐ 4.9 Rating

                                </div>

                                <div className="floating-box bottom">

                                    🎓 12,000+ Students

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </section>

            {/* Features */}

            <section className="py-5 bg-light">

                <div className="container">

                    <div className="text-center mb-5">

                        <h2>Everything You Need To Master IELTS</h2>

                        <p className="text-muted">

                            Learn all four skills with modern technologies.

                        </p>

                    </div>

                    <div className="row g-4">

                        <div className="col-md-4">

                            <div className="feature-card h-100">

                                <div className="icon-wrapper">

                                    <FaPenFancy className="feature-icon" />

                                </div>

                                <h5>

                                    AI Writing Evaluation

                                </h5>

                                <p>

                                    Receive instant writing feedback with estimated IELTS band score.

                                </p>

                            </div>

                        </div>

                        <div className="col-md-4">

                            <div className="feature-card">
                                <div className="icon-wrapper">
                                    <FaMicrophone className="feature-icon" />
                                </div>
                                <h5>Speaking Practice</h5>

                                <p>

                                    Practice speaking with AI and improve
                                    pronunciation.

                                </p>

                            </div>

                        </div>

                        <div className="col-md-4">

                            <div className="feature-card">
                                <div className="icon-wrapper">
                                    <FaHeadphones className="feature-icon" />
                                </div>
                                <h5>Listening Exercises</h5>

                                <p>

                                    Real IELTS audio with transcript and quiz.

                                </p>

                            </div>

                        </div>

                        <div className="col-md-4">

                            <div className="feature-card">
                                <div className="icon-wrapper">
                                    <FaBookOpen className="feature-icon" />
                                </div>
                                <h5>Reading Practice</h5>

                                <p>

                                    Timed passages with detailed explanations.

                                </p>

                            </div>

                        </div>

                        <div className="col-md-4">

                            <div className="feature-card">
                                <div className="icon-wrapper">
                                    <FaChartLine className="feature-icon" />
                                </div>
                                <h5>Learning Analytics</h5>
                                <p>

                                    Track progress and identify weak skills.

                                </p>

                            </div>

                        </div>

                        <div className="col-md-4">

                            <div className="feature-card">

                                <div className="icon-wrapper">
                                    <FaGraduationCap className="feature-icon" />
                                </div>

                                <h5>Professional Courses</h5>

                                <p>

                                    Structured lessons from Beginner to Band 8+.

                                </p>

                            </div>

                        </div>

                    </div>

                </div>

            </section>

            {/* Popular Courses */}

            <section className="py-5">

                <div className="container">

                    <div className="d-flex justify-content-between align-items-center mb-4">

                        <h2>Popular IELTS Courses</h2>

                        <button className="btn btn-outline-primary">

                            View All

                        </button>

                    </div>

                    <div className="row g-4">

                        {[1, 2, 3].map(item => (

                            <div
                                className="col-lg-4"
                                key={item}
                            >

                                <div className="course-card">

                                    <div className="course-image">

                                        <img
                                            src="https://images.unsplash.com/photo-1513258496099-48168024aec0?w=800"
                                            className="img-fluid"
                                            alt=""
                                        />

                                        <span className="course-tag">

                                            IELTS

                                        </span>

                                    </div>

                                    <div className="course-body">

                                        <h5>

                                            IELTS Foundation Course

                                        </h5>

                                        <p>

                                            Master Grammar, Vocabulary, Listening,
                                            Reading, Writing and Speaking.

                                        </p>

                                        <div className="course-footer">

                                            <span>

                                                ⭐ 4.9

                                            </span>

                                            <button className="btn btn-primary">

                                                Learn More

                                                <FaArrowRight className="ms-2" />

                                            </button>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        ))}

                    </div>

                </div>

            </section>

            {/* CTA */}

            <section className="cta-section">

                <div className="container text-center">

                    <h2>

                        Start Your IELTS Journey Today

                    </h2>

                    <p>

                        Thousands of students have improved their IELTS score
                        using our learning platform.

                    </p>

                    <button className="btn btn-light btn-lg">

                        Get Started

                    </button>

                </div>

            </section>

        </>

    );

}

export default HomePage;