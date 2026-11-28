import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProgressAnalytics } from "../../services/progressAnalytics.service";
import type { ProgressAnalytics, Skill } from "../../types/progressAnalytics";
import { ieltsSkillName } from "../../utils/ieltsDisplay";
import UtilityPageHeader from "../../components/learning/UtilityPageHeader";
import LearningProgressBar from "../../components/learning/LearningProgressBar";
import WeeklyProgressChart from "../../components/learning/WeeklyProgressChart";
import { FaChartLine } from "react-icons/fa";
import "./ProgressAnalytics.css";
import "../../styles/ieltsUtilityDesign.css";

const skills: Skill[] = ["Reading", "Listening", "Writing", "Speaking"];

const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remaining = seconds % 60;
    return [hours ? `${hours} giờ` : "", minutes ? `${minutes} phút` : "", remaining ? `${remaining} giây` : ""]
        .filter(Boolean).join(" ") || "0 giây";
};

const displayValue = (value: number | null, suffix = "") =>
    value === null ? "—" : `${value}${suffix}`;

function ProgressPage() {
    const [data, setData] = useState<ProgressAnalytics | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        getProgressAnalytics().then(setData).catch(() => setError("Không thể tải thống kê tiến độ. Vui lòng thử lại."));
    }, []);

    if (error) return <main className="progress-page"><p className="progress-alert">{error}</p></main>;
    if (!data) return <main className="progress-page"><p className="progress-muted">Đang tải dữ liệu học tập…</p></main>;

    return (
        <main className="progress-page">
            <UtilityPageHeader
                eyebrow="Hành trình học tập"
                title="Tiến độ IELTS của bạn"
                description="Theo dõi kết quả đã ghi nhận và xác định kỹ năng cần luyện tiếp."
                icon={<FaChartLine />}
                actions={<Link className="progress-primary-link" to="/study-plan">Xem lộ trình học</Link>}
            />

            <section className="progress-overview-grid">
                <article className="progress-hero-card">
                    <span>Band ước tính trung bình</span>
                    <strong>{displayValue(data.summary.averageAiEstimatedBand)}</strong>
                    <p>
                        {data.summary.averageAiEstimatedBand === null
                            ? "Chưa đủ dữ liệu Writing hoặc Speaking để ước tính."
                            : "Điểm trung bình chỉ bao gồm kết quả AI Writing/Speaking đã hoàn thành."}
                    </p>
                    <LearningProgressBar
                        label="Tiến gần mục tiêu"
                        value={data.summary.averageAiEstimatedBand === null ? 0 : Math.round((data.summary.averageAiEstimatedBand / 9) * 100)}
                        tone="orange"
                    />
                </article>
                <article className="progress-week-card">
                    <div className="progress-week-heading">
                        <div>
                            <span>Hoạt động 7 ngày gần nhất</span>
                            <strong>{data.timeline.reduce((sum, day) => sum + day.completedLessons + day.aiPractices + day.objectiveAssignments, 0)} hoạt động</strong>
                        </div>
                        <small>{data.streak.days} ngày liên tiếp</small>
                    </div>
                    <WeeklyProgressChart
                        valueLabel="hoạt động"
                        points={Array.from({ length: 7 }, (_, index) => {
                            const date = new Date();
                            date.setHours(12, 0, 0, 0);
                            date.setDate(date.getDate() - (6 - index));
                            const dateKey = date.toISOString().slice(0, 10);
                            const day = data.timeline.find(item => item.date === dateKey);
                            return {
                                label: date.toLocaleDateString("vi-VN", { weekday: "narrow" }),
                                value: day ? day.completedLessons + day.aiPractices + day.objectiveAssignments : 0,
                            };
                        })}
                    />
                </article>
            </section>

            <section className="progress-stat-grid" aria-label="Tóm tắt tiến độ">
                <article className="progress-stat">
                    <span>Band IELTS do AI ước tính</span>
                    <strong>{displayValue(data.summary.averageAiEstimatedBand)}</strong>
                    <small>{data.summary.aiPracticeCount} lượt luyện AI đã hoàn thành</small>
                </article>
                <article className="progress-stat">
                    <span>Độ chính xác bài tập khách quan</span>
                    <strong>{displayValue(data.summary.averageObjectiveAssignmentPercent, "%")}</strong>
                    <small>{data.summary.objectiveAssignmentCount} kết quả bài tập đã xác minh</small>
                </article>
                <article className="progress-stat">
                    <span>Chuỗi ngày học liên tiếp</span>
                    <strong>{data.streak.days} ngày</strong>
                    <small>{data.availability.studyActivity.message || "Chỉ tính theo ngày học đã được ghi nhận."}</small>
                </article>
                <article className="progress-stat">
                    <span>Thời lượng làm bài đã ghi nhận</span>
                    <strong>{formatDuration(data.summary.recordedStudyDurationSeconds)}</strong>
                    <small>Chỉ tính thời lượng của các bài nộp đã được lưu.</small>
                </article>
            </section>

            <section className="progress-two-column">
                <article className="progress-panel">
                    <h2>Band IELTS do AI ước tính</h2>
                    <p className="progress-note">Điểm AI ước tính không thay thế điểm bài tập được chấm.</p>
                    {data.availability.aiEstimatedBands.message && <p className="progress-empty">{data.availability.aiEstimatedBands.message}</p>}
                    <div className="progress-skill-list">
                        {data.aiEstimatedBands.bySkill.filter(item => item.count > 0).map(item => (
                            <div className="progress-skill-row" key={item.skill}>
                                <span>{ieltsSkillName(item.skill)}</span>
                                <strong>{displayValue(item.averageEstimatedBand)}</strong>
                                <small>{item.count} lượt luyện</small>
                            </div>
                        ))}
                        {data.aiEstimatedBands.count === 0 && <p className="progress-muted">Chưa có dữ liệu ước tính theo kỹ năng.</p>}
                    </div>
                </article>
                <article className="progress-panel">
                    <h2>Kết quả bài tập khách quan đã xác minh</h2>
                    <p className="progress-note">Chỉ tính bài nộp có đáp án khách quan và đã được chấm hoàn tất.</p>
                    {data.availability.objectiveAssignments.message && <p className="progress-empty">{data.availability.objectiveAssignments.message}</p>}
                    <div className="progress-skill-list">
                        {data.objectiveAssignments.bySkill.filter(item => item.count > 0).map(item => (
                            <div className="progress-skill-row" key={item.skill}>
                                <span>{ieltsSkillName(item.skill)}</span>
                                <strong>{displayValue(item.averagePercent, "%")}</strong>
                                <small>{item.count} kết quả</small>
                            </div>
                        ))}
                        {data.objectiveAssignments.count === 0 && <p className="progress-muted">Chưa có kết quả bài tập khách quan đã xác minh.</p>}
                    </div>
                </article>
            </section>

            <section className="progress-panel">
                <h2>Tiến độ hoàn thành khóa học</h2>
                {data.availability.lessons.message && <p className="progress-empty">{data.availability.lessons.message}</p>}
                {data.courses.length > 0 && <div className="progress-course-list">
                    {data.courses.map(course => (
                        <div className="progress-course" key={course.courseId}>
                            <div className="progress-course-heading">
                                <strong>{course.name}</strong>
                                <span>{course.percent === null ? "Chưa có bài học" : `${course.completedLessons}/${course.totalLessons} bài học · ${course.percent}%`}</span>
                            </div>
                            {course.percent !== null && <div className="progress-meter" role="progressbar" aria-valuenow={course.percent} aria-valuemin={0} aria-valuemax={100}>
                                <span style={{ width: `${course.percent}%` }} />
                            </div>}
                        </div>
                    ))}
                </div>}
                {data.courses.length > 0 && data.summary.completedLessonCount === 0 && <p className="progress-muted">Bạn chưa đánh dấu hoàn thành bài học nào.</p>}
            </section>

            <section className="progress-panel">
                <h2>Lịch sử tiến độ</h2>
                <p className="progress-note">Chỉ hiển thị ngày có hoạt động, bài học hoàn thành hoặc kết quả được ghi nhận.</p>
                {data.timeline.length === 0 ? <p className="progress-empty">Chưa có hoạt động nào được ghi nhận.</p> : (
                    <div className="progress-timeline">
                        {data.timeline.slice().reverse().map(day => (
                            <article className="progress-timeline-day" key={day.date}>
                                <time dateTime={day.date}>{new Date(`${day.date}T12:00:00`).toLocaleDateString("vi-VN")}</time>
                                <div>
                                    {day.studyActivity && <span>Có hoạt động học tập</span>}
                                    {day.completedLessons > 0 && <span>{day.completedLessons} bài học đã hoàn thành</span>}
                                    {day.aiPractices > 0 && <span>{day.aiPractices} lượt luyện AI · band ước tính {displayValue(day.averageAiEstimatedBand)}</span>}
                                    {day.objectiveAssignments > 0 && <span>{day.objectiveAssignments} bài tập khách quan · {displayValue(day.averageObjectiveAssignmentPercent, "%")}</span>}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
            <p className="progress-footnote">Trang này không có band AI ước tính cho kỹ năng Đọc và Nghe. Điểm chưa có dữ liệu sẽ được để trống, không suy đoán.</p>
            <div className="progress-skill-legend" aria-hidden="true">{skills.map(skill => <span key={skill}>{ieltsSkillName(skill)}</span>)}</div>
        </main>
    );
}

export { ProgressPage };
export default ProgressPage;
