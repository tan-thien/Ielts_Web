import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import {
    completeStudyTask,
    getStudyPlan,
    saveStudyGoal
} from "../../services/progressAnalytics.service";
import type { Skill, StudyPlan, StudyPlanGoal, StudyPlanTask } from "../../types/progressAnalytics";
import { ieltsSkillName } from "../../utils/ieltsDisplay";
import UtilityPageHeader from "../../components/learning/UtilityPageHeader";
import LearningProgressBar from "../../components/learning/LearningProgressBar";
import LearningEmptyState from "../../components/learning/LearningEmptyState";
import WeeklyProgressChart from "../../components/learning/WeeklyProgressChart";
import { FaCalendarAlt } from "react-icons/fa";
import "./ProgressAnalytics.css";
import "../../styles/ieltsUtilityDesign.css";

const skills: Skill[] = ["Reading", "Listening", "Writing", "Speaking"];

const goalSummary = (goal: StudyPlanGoal) =>
    `Mục tiêu của bạn là đạt band ${goal.TargetBand} trước ngày ${new Date(goal.TargetDate).toLocaleDateString("vi-VN")}, với ${goal.WeeklyStudyDays} ngày học mỗi tuần.`;

const taskTitle = (task: StudyPlanTask) => {
    if (task.Type === "practice_skill") return `Luyện tập kỹ năng ${ieltsSkillName(task.Skill || "")}`;
    if (task.Type === "baseline") return "Ghi nhận kết quả học tập đầu tiên";
    const lessonName = task.Title.replace(/^Complete lesson:\s*/i, "");
    return lessonName === task.Title ? task.Title : `Hoàn thành bài học: ${lessonName}`;
};

const taskReason = (task: StudyPlanTask, goal: StudyPlanGoal) => {
    if (/[À-ỹĐđ]/.test(task.Reason)) return task.Reason;
    const context = goalSummary(goal);
    if (task.Type === "practice_skill") return `Nhiệm vụ được đề xuất dựa trên kỹ năng ưu tiên và dữ liệu học tập đã ghi nhận. ${context}`;
    if (task.Type === "complete_lesson") return `Đây là bài học trong khóa học bạn đã mua và chưa được đánh dấu hoàn thành. ${context}`;
    return `Hãy hoàn thành một hoạt động học tập để bắt đầu ghi nhận tiến độ. ${context}`;
};

function StudyPlanPage() {
    const [plan, setPlan] = useState<StudyPlan | null>(null);
    const [targetBand, setTargetBand] = useState("");
    const [targetDate, setTargetDate] = useState("");
    const [weeklyStudyDays, setWeeklyStudyDays] = useState("");
    const [focusSkills, setFocusSkills] = useState<Skill[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    useEffect(() => {
        getStudyPlan().then(savedPlan => {
            setPlan(savedPlan);
            if (savedPlan) {
                setTargetBand(String(savedPlan.Goal.TargetBand));
                setTargetDate(savedPlan.Goal.TargetDate.slice(0, 10));
                setWeeklyStudyDays(String(savedPlan.Goal.WeeklyStudyDays));
                setFocusSkills(savedPlan.Goal.FocusSkills);
            }
        }).catch(() => setError("Không thể tải lộ trình học. Vui lòng thử lại.")).finally(() => setLoading(false));
    }, []);

    const toggleSkill = (skill: Skill) => setFocusSkills(current =>
        current.includes(skill) ? current.filter(item => item !== skill) : [...current, skill]
    );

    const saveGoal = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setNotice("");
        setSaving(true);
        try {
            const updated = await saveStudyGoal({
                targetBand: Number(targetBand),
                targetDate,
                weeklyStudyDays: Number(weeklyStudyDays),
                focusSkills
            });
            setPlan(updated);
            setNotice("Đã lưu mục tiêu và tạo nhiệm vụ dựa trên kỹ năng ưu tiên cùng dữ liệu học tập đã ghi nhận.");
        } catch {
            setError("Không thể lưu mục tiêu. Hãy kiểm tra ngày mục tiêu, band theo mức 0,5 và số ngày học mỗi tuần.");
        } finally {
            setSaving(false);
        }
    };

    const markComplete = async (taskId: string) => {
        setError("");
        try {
            setPlan(await completeStudyTask(taskId));
        } catch {
            setError("Không thể cập nhật nhiệm vụ này. Vui lòng tải lại trang và thử lại.");
        }
    };

    if (loading) return <main className="progress-page"><p className="progress-muted">Đang tải lộ trình học…</p></main>;

    return (
        <main className="progress-page">
            <UtilityPageHeader
                eyebrow="Lộ trình cá nhân"
                title="Lộ trình học của bạn"
                description="Xem mục tiêu và nhiệm vụ cần ưu tiên dựa trên dữ liệu học tập thật."
                icon={<FaCalendarAlt />}
                actions={<>
                    <Link className="progress-secondary-link" to="/progress">Xem tiến độ</Link>
                    <button type="button" className="progress-primary-link" onClick={() => document.querySelector(".study-goal-panel")?.scrollIntoView({ behavior: "smooth" })}>Chỉnh mục tiêu</button>
                </>}
            />

            {error && <p className="progress-alert" role="alert">{error}</p>}
            {notice && <p className="progress-success" role="status">{notice}</p>}

            {plan ? (
                <section className="study-plan-overview">
                    <article className="study-plan-goal-card">
                        <span>Mục tiêu IELTS</span>
                        <strong>Band {plan.Goal.TargetBand}</strong>
                        <p>{goalSummary(plan.Goal)}</p>
                        <LearningProgressBar
                            label="Nhiệm vụ đã hoàn thành"
                            value={plan.Tasks.length ? Math.round((plan.Tasks.filter(task => task.Status === "Completed").length / plan.Tasks.length) * 100) : 0}
                        />
                    </article>
                    <article className="study-plan-week-card">
                        <div className="progress-week-heading">
                            <div>
                                <span>Hoạt động 7 ngày gần nhất</span>
                                <strong>{plan.Tasks.filter(task => task.Status === "Completed").length} nhiệm vụ hoàn thành</strong>
                            </div>
                        </div>
                        <WeeklyProgressChart
                            valueLabel="nhiệm vụ"
                            points={Array.from({ length: 7 }, (_, index) => {
                                const date = new Date();
                                date.setHours(12, 0, 0, 0);
                                date.setDate(date.getDate() - (6 - index));
                                const key = date.toISOString().slice(0, 10);
                                return {
                                    label: date.toLocaleDateString("vi-VN", { weekday: "narrow" }),
                                    value: plan.Tasks.filter(task =>
                                        task.Status === "Completed" &&
                                        task.CompletedAt &&
                                        task.CompletedAt.slice(0, 10) === key
                                    ).length,
                                };
                            })}
                        />
                    </article>
                </section>
            ) : (
                <LearningEmptyState
                    icon={<FaCalendarAlt />}
                    title="Thiết lập mục tiêu để tạo lộ trình"
                    description="Bạn chưa có mục tiêu học tập. Hãy chọn band mục tiêu, ngày cần đạt và kỹ năng ưu tiên."
                    action={<button type="button" className="progress-primary-link" onClick={() => document.querySelector(".study-goal-panel")?.scrollIntoView({ behavior: "smooth" })}>Thiết lập mục tiêu</button>}
                />
            )}

            <section className="progress-panel study-goal-panel">
                <h2>Mục tiêu của bạn</h2>
                <form className="study-goal-form" onSubmit={saveGoal}>
                    <label>
                        Band IELTS mục tiêu
                        <input type="number" min="0" max="9" step="0.5" required value={targetBand} onChange={event => setTargetBand(event.target.value)} />
                    </label>
                    <label>
                        Ngày cần đạt mục tiêu
                        <input type="date" required value={targetDate} onChange={event => setTargetDate(event.target.value)} />
                    </label>
                    <label>
                        Số ngày học mỗi tuần
                        <input type="number" min="1" max="7" step="1" required value={weeklyStudyDays} onChange={event => setWeeklyStudyDays(event.target.value)} />
                    </label>
                    <fieldset>
                        <legend>Kỹ năng cần ưu tiên (không bắt buộc)</legend>
                        <div className="study-skill-options">
                            {skills.map(skill => <label key={skill}>
                                <input type="checkbox" checked={focusSkills.includes(skill)} onChange={() => toggleSkill(skill)} />
                                {ieltsSkillName(skill)}
                            </label>)}
                        </div>
                    </fieldset>
                    <button className="progress-primary-link" disabled={saving} type="submit">{saving ? "Đang tạo lộ trình…" : plan ? "Cập nhật mục tiêu và lộ trình" : "Tạo mục tiêu và lộ trình"}</button>
                </form>
                <p className="progress-note">Band mục tiêu và số ngày học mỗi tuần do bạn chọn; hệ thống không tự giả định thời lượng hoặc lịch học.</p>
            </section>

            <section className="progress-panel">
                <h2>Nhiệm vụ học tập</h2>
                {!plan ? <p className="progress-empty">Hãy đặt mục tiêu để tạo nhiệm vụ dựa trên dữ liệu học tập.</p> : plan.Tasks.length === 0 ? (
                    <p className="progress-empty">Chưa có nhiệm vụ. Hãy cập nhật mục tiêu để tạo lộ trình.</p>
                ) : (
                    <div className="study-task-list">
                        {plan.Tasks.map(task => (
                            <article className={`study-task ${task.Status === "Completed" ? "is-complete" : ""}`} key={task._id}>
                                <div className="study-task-content">
                                    <span className="study-task-kind">{task.Type === "practice_skill" ? "LUYỆN KỸ NĂNG" : task.Type === "complete_lesson" ? "BÀI HỌC TRONG KHÓA" : "BẮT ĐẦU HỌC TẬP"}</span>
                                    <h3>{taskTitle(task)}</h3>
                                    <p>{taskReason(task, plan.Goal)}</p>
                                </div>
                                {task.Status === "Completed" ? (
                                    <span className="study-task-completed">Đã hoàn thành{task.CompletedAt ? ` · ${new Date(task.CompletedAt).toLocaleDateString("vi-VN")}` : ""}</span>
                                ) : (
                                    <button className="study-task-button" type="button" onClick={() => markComplete(task._id)}>Đánh dấu hoàn thành</button>
                                )}
                            </article>
                        ))}
                    </div>
                )}
                {plan && <p className="progress-note">Nhiệm vụ chỉ được đánh dấu hoàn thành khi bạn chọn nút tương ứng. Khi cập nhật mục tiêu, trạng thái hoàn thành của nhiệm vụ còn phù hợp sẽ được giữ lại.</p>}
            </section>
        </main>
    );
}

export { StudyPlanPage };
export default StudyPlanPage;
