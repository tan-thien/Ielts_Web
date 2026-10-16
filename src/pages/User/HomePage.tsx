
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
        title: "AI Writing Evaluation",
        description:
            "Get focused feedback on your writing, grammar, vocabulary and IELTS criteria.",
        color: "orange",
    },
    {
        id: "speaking-practice",
        icon: FaMicrophone,
        title: "Speaking Practice",
        description:
            "Build confidence with guided speaking prompts and focused practice.",
        color: "blue",
    },
    {
        id: "listening-practice",
        icon: FaHeadphones,
        title: "Listening Exercises",
        description:
            "Practice with listening exercises, questions and clear answer explanations.",
        color: "orange",
    },
    {
        id: "reading-practice",
        icon: FaBookOpen,
        title: "Reading Practice",
        description:
            "Improve reading comprehension, timing and your ability to find key details.",
        color: "blue",
    },
    {
        id: "learning-progress",
        icon: FaChartLine,
        title: "Learning Analytics",
        description:
            "Review your practice and identify the skills to focus on next.",
        color: "orange",
    },
    {
        id: "guided-courses",
        icon: FaGraduationCap,
        title: "Professional Courses",
        description:
            "Follow a structured path from English foundations to IELTS preparation.",
        color: "blue",
    },
];

const courses = [
    {
        title: "IELTS Foundation",
        level: "Beginner",
        description:
            "Strengthen grammar and vocabulary while building a foundation across all four skills.",
        image:
            "https://images.unsplash.com/photo-1513258496099-48168024aec0?w=900",
        rating: "4.9",
        students: "2.4k",
        duration: "8 weeks",
    },
    {
        title: "IELTS Speaking Mastery",
        level: "Intermediate",
        description:
            "Develop ideas, respond with confidence and prepare for speaking test questions.",
        image:
            "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=900",
        rating: "4.8",
        students: "1.8k",
        duration: "6 weeks",
    },
    {
        title: "IELTS Mock Test Series",
        level: "All Levels",
        description:
            "Get familiar with test formats, manage your time and review your performance.",
        image:
            "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=900",
        rating: "4.9",
        students: "1.2k",
        duration: "Self-paced",
    },
];

const learningSteps = [
    {
        number: "01",
        icon: FaLaptop,
        title: "Choose Your Course",
        description:
            "Choose a course and skill that match your current goals.",
    },
    {
        number: "02",
        icon: FaLightbulb,
        title: "Learn & Practice",
        description:
            "Study key concepts, complete exercises and practice actively.",
    },
    {
        number: "03",
        icon: FaChartLine,
        title: "Track Your Progress",
        description:
            "Review your results and choose what to work on next.",
    },
];

const faqs = [
    {
        question: "What English level is this platform for?",
        answer:
            "Start with foundational study or choose practice that matches the skills you want to improve.",
    },
    {
        question: "How does AI writing feedback work?",
        answer:
            "Submit a draft to receive guidance on areas such as grammar, vocabulary and organization. AI feedback is for practice only and does not replace an official IELTS assessment.",
    },
    {
        question: "Can I practice all four IELTS skills?",
        answer:
            "Yes. The learning paths cover Listening, Reading, Writing and Speaking through courses and practice activities.",
    },
    {
        question: "Can I keep track of my learning?",
        answer:
            "Review your practice results to see which skills you may want to focus on next.",
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
                                    Your smarter IELTS journey starts here
                                </span>

                                <h1 className="hero-title">
                                    Learn IELTS
                                    <br />
                                    <span>Smarter with AI</span>
                                </h1>

                                <p className="hero-description">
                                    Improve your English with interactive courses,
                                    AI-assisted writing feedback, speaking practice
                                    and personalized progress tracking.
                                </p>

                                <div className="hero-actions">
                                    <Link to="/courses" className="btn-home btn-orange">
                                        Explore Courses <FaArrowRight />
                                    </Link>

                                    <a href="#features" className="btn-home btn-outline-light">
                                        <FaPlay /> Discover the Platform
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
                                            A smarter way to practice English
                                        </p>
                                    </div>
                                </div>

                                <div className="hero-benefits">
                                    <span>
                                        <FaCheckCircle />
                                        Learn at your own pace
                                    </span>
                                    <span>
                                        <FaCheckCircle />
                                        Practice all four skills
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
                                        alt="Students studying together"
                                    />
                                </div>

                                <div className="floating-card rating-card">
                                    <div className="floating-icon orange-icon">
                                        <FaStar />
                                    </div>
                                    <div>
                                        <strong>Learn smarter</strong>
                                        <span>Build better study habits</span>
                                    </div>
                                </div>

                                <div className="floating-card progress-card">
                                    <div className="floating-icon blue-icon">
                                        <FaChartLine />
                                    </div>
                                    <div className="progress-card-content">
                                        <strong>Your progress</strong>
                                        <span>Practice one step at a time</span>
                                        <div className="progress-track">
                                            <div />
                                        </div>
                                    </div>
                                </div>

                                <div className="hero-note">
                                    <span>Dream big.</span>
                                    <span>Practice daily.</span>
                                    <span>Grow confidently.</span>
                                </div>

                                <div className="hero-dot-pattern" />
                            </div>
                        </div>
                    </div>

                    <div className="hero-bottom-strip">
                        <div>
                            <FaBookOpen />
                            <span>Structured Learning</span>
                        </div>
                        <div>
                            <FaPenFancy />
                            <span>AI-assisted Practice</span>
                        </div>
                        <div>
                            <FaChartLine />
                            <span>Progress Tracking</span>
                        </div>
                        <div>
                            <FaUsers />
                            <span>Learn at Your Pace</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section className="section-padding features-section" id="features">
                <div className="container">
                    <div className="section-heading text-center">
                        <span className="section-eyebrow">OUR FEATURES</span>
                        <h2>
                            Everything You Need to
                            <br className="desktop-break" /> Master IELTS
                        </h2>
                        <p>
                            Build your skills with a learning experience designed
                            to make every practice session more meaningful.
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
                                            <span>Explore feature</span>
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
                                LEARN YOUR WAY
                            </span>
                            <h2>Explore Our IELTS Courses</h2>
                            <p>
                                Find a course that matches your goals and start
                                making progress today.
                            </p>
                        </div>

                        <Link to="/courses" className="btn-home btn-outline-blue">
                            View All Courses <FaArrowRight />
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
                                                {course.students} learners
                                            </span>

                                            <button
                                                type="button"
                                                className="course-link"
                                                aria-label={`Learn more about ${course.title}`}
                                            >
                                                Learn More
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
                                    WHY CHOOSE US
                                </span>
                                <h2>
                                    A Clearer Way to Learn IELTS,
                                    <br />
                                    One Step at a Time
                                </h2>
                                <p>
                                    Build a steady study routine with structured
                                    lessons, focused practice and clear next steps
                                    across all four IELTS skills.
                                </p>
                            </div>

                            <div className="stats-grid">
                                <div className="stat-item">
                                    <div className="stat-icon orange">
                                        <FaUsers />
                                    </div>
                                    <strong>4 Skills</strong>
                                    <span>One place to practice</span>
                                </div>

                                <div className="stat-item">
                                    <div className="stat-icon blue">
                                        <FaChartLine />
                                    </div>
                                    <strong>Track Progress</strong>
                                    <span>See what to practice next</span>
                                </div>

                                <div className="stat-item">
                                    <div className="stat-icon orange">
                                        <FaGraduationCap />
                                    </div>
                                    <strong>Flexible Learning</strong>
                                    <span>Study at your own pace</span>
                                </div>

                                <div className="stat-item">
                                    <div className="stat-icon blue">
                                        <FaCheckCircle />
                                    </div>
                                    <strong>Focused Practice</strong>
                                    <span>Build one skill at a time</span>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-6">
                            <div className="testimonial-layout">
                                <div className="testimonial-card">
                                    <span className="section-eyebrow">
                                        A FOCUSED APPROACH
                                    </span>

                                    <p className="testimonial-text">
                                        Set a clear goal, practice one skill at a
                                        time, and use feedback to decide what to
                                        work on next.
                                    </p>

                                    <div className="testimonial-author">
                                        <div className="author-avatar">
                                            <FaGraduationCap />
                                        </div>
                                        <div>
                                            <strong>IELTS AI</strong>
                                            <span>Your learning companion</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="testimonial-image">
                                    <img
                                        src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900"
                                        alt="Student learning with a laptop"
                                        loading="lazy"
                                    />
                                    <div className="image-caption">
                                        <FaGraduationCap />
                                        <span>
                                            Your goals.
                                            <strong> Your journey.</strong>
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
                        <span className="section-eyebrow">HOW IT WORKS</span>
                        <h2>Your IELTS Journey in 3 Simple Steps</h2>
                        <p>
                            A simple learning process to help you stay focused
                            and keep moving forward.
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
                                    NEED HELP?
                                </span>
                                <h2>Frequently Asked Questions</h2>
                                <p>
                                    Have questions about your learning journey?
                                    Find answers to some common questions here.
                                </p>

                                <div className="faq-help">
                                    <FaQuestionCircle />
                                    <span>
                                        Still have questions?
                                        <strong> We're here to help.</strong>
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
                            <span>YOUR NEXT CHAPTER STARTS HERE</span>
                            <h2>Ready to Start Your IELTS Journey?</h2>
                            <p>
                                Set your goals, build your confidence and make
                                every practice session count.
                            </p>
                        </div>

                        <Link to="/register" className="btn-home btn-cta">
                            Get Started <FaArrowRight />
                        </Link>

                        <div className="cta-decoration" />
                    </div>
                </div>
            </section>

        </div>
    );
}

export default HomePage;