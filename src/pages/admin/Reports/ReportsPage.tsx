import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
    FaBookOpen,
    FaChartLine,
    FaChalkboardTeacher,
    FaClipboardCheck,
    FaGraduationCap,
    FaMoneyBillWave,
    FaUsers,
} from "react-icons/fa";
import { getAdminReports } from "../../../services/reports.service";
import type { MonthlyReport, ReportsData } from "../../../types/reports";
import "./ReportsPage.css";

const currency = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
});
const number = new Intl.NumberFormat("vi-VN");

function formatMonth(month: string, year = false): string {
    const [monthYear, monthNumber] = month.split("-").map(Number);
    const date = new Date(monthYear, monthNumber - 1, 1);
    return new Intl.DateTimeFormat("vi-VN", {
        month: "short",
        ...(year ? { year: "2-digit" } : {}),
    }).format(date);
}

function formatDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "—"
        : new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function getErrorMessage(error: unknown): string {
    if (typeof error === "object" && error !== null && "response" in error) {
        const response = error.response;
        if (typeof response === "object" && response !== null && "data" in response) {
            const data = response.data;
            if (typeof data === "object" && data !== null && "message" in data &&
                typeof data.message === "string") {
                return data.message;
            }
        }
    }
    return error instanceof Error ? error.message : "Không thể tải báo cáo.";
}

function MetricCard({
    label,
    value,
    description,
    icon,
    tone,
}: {
    label: string;
    value: string;
    description: string;
    icon: ReactNode;
    tone: string;
}) {
    return (
        <article className="report-metric-card">
            <span className={`report-metric-icon ${tone}`}>{icon}</span>
            <div className="report-metric-copy">
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{description}</small>
            </div>
        </article>
    );
}

function MonthlyBarChart({
    title,
    description,
    rows,
    series,
    formatValue = (value) => number.format(value),
}: {
    title: string;
    description: string;
    rows: MonthlyReport[];
    series: { key: keyof MonthlyReport; label: string; color: string }[];
    formatValue?: (value: number) => string;
}) {
    const maximum = Math.max(
        1,
        ...rows.flatMap((row) => series.map((item) => Number(row[item.key]) || 0)),
    );

    return (
        <section className="report-panel">
            <header className="report-panel-heading">
                <div>
                    <h2>{title}</h2>
                    <p>{description}</p>
                </div>
            </header>
            <div className="report-legend" aria-label="Chú giải">
                {series.map((item) => (
                    <span key={item.label}>
                        <i style={{ backgroundColor: item.color }} />
                        {item.label}
                    </span>
                ))}
            </div>
            <div className="report-chart" role="img" aria-label={title}>
                {rows.map((row, index) => (
                    <div className="report-chart-month" key={row.month}>
                        <div className="report-chart-bars">
                            {series.map((item) => {
                                const value = Number(row[item.key]) || 0;
                                const height = value ? Math.max(3, (value / maximum) * 100) : 0;
                                return (
                                    <span
                                        className="report-chart-bar"
                                        key={item.label}
                                        style={{ height: `${height}%`, backgroundColor: item.color }}
                                        title={`${item.label}: ${formatValue(value)}`}
                                    />
                                );
                            })}
                        </div>
                        <small>{index % 2 === 0 || rows.length <= 6 ? formatMonth(row.month, rows.length > 12) : ""}</small>
                    </div>
                ))}
            </div>
        </section>
    );
}

function ReportsPage() {
    const [months, setMonths] = useState(12);
    const [reports, setReports] = useState<ReportsData | null>(null);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let cancelled = false;
        getAdminReports(months)
            .then((data) => {
                if (!cancelled) setReports(data);
            })
            .catch((requestError: unknown) => {
                if (!cancelled) setError(getErrorMessage(requestError));
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [months, reloadKey]);

    const refreshReports = () => {
        setError("");
        setReports(null);
        setIsLoading(true);
        setReloadKey((key) => key + 1);
    };

    const topCourseMaximum = useMemo(
        () => Math.max(1, ...(reports?.popularCourses.map((course) => course.learners) ?? [])),
        [reports],
    );

    if (isLoading && !reports) {
        return <div className="reports-page"><div className="report-loading">Đang tải báo cáo...</div></div>;
    }

    return (
        <div className="reports-page">
            <header className="reports-header">
                <div>
                    <span className="reports-eyebrow">TỔNG QUAN VẬN HÀNH</span>
                    <h1>Báo cáo &amp; thống kê</h1>
                    <p>Theo dõi doanh thu, học viên, giảng viên và hoạt động học tập theo tháng.</p>
                </div>
                <div className="reports-actions">
                    <label htmlFor="report-range">Khoảng thời gian</label>
                    <select
                        id="report-range"
                        value={months}
                        onChange={(event) => {
                            setError("");
                            setReports(null);
                            setIsLoading(true);
                            setMonths(Number(event.target.value));
                        }}
                    >
                        <option value={6}>6 tháng gần nhất</option>
                        <option value={12}>12 tháng gần nhất</option>
                        <option value={24}>24 tháng gần nhất</option>
                    </select>
                    <button type="button" onClick={refreshReports}>
                        Làm mới
                    </button>
                </div>
            </header>

            {error && (
                <div className="report-error" role="alert">
                    <span>{error}</span>
                    <button type="button" onClick={refreshReports}>Thử lại</button>
                </div>
            )}

            {reports && (
                <>
                    <section className="report-metric-grid" aria-label="Chỉ số tổng quan">
                        <MetricCard
                            label="Doanh thu tháng này"
                            value={currency.format(reports.currentMonth.revenue)}
                            description={`${number.format(reports.currentMonth.paidOrders)} đơn đã thanh toán`}
                            icon={<FaMoneyBillWave />}
                            tone="green"
                        />
                        <MetricCard
                            label="Tổng doanh thu"
                            value={currency.format(reports.totals.allTimeRevenue)}
                            description={`${number.format(reports.totals.paidOrders)} đơn thành công`}
                            icon={<FaChartLine />}
                            tone="blue"
                        />
                        <MetricCard
                            label="Học viên"
                            value={number.format(reports.totals.students)}
                            description={`+${number.format(reports.currentMonth.newStudents)} trong tháng`}
                            icon={<FaUsers />}
                            tone="purple"
                        />
                        <MetricCard
                            label="Giảng viên"
                            value={number.format(reports.totals.teachers)}
                            description={`${number.format(reports.totals.assignedTeachers)} đang dạy · +${number.format(reports.currentMonth.newTeachers)} trong tháng`}
                            icon={<FaChalkboardTeacher />}
                            tone="orange"
                        />
                        <MetricCard
                            label="Khóa học"
                            value={number.format(reports.totals.courses)}
                            description={`+${number.format(reports.currentMonth.newCourses)} trong tháng`}
                            icon={<FaBookOpen />}
                            tone="teal"
                        />
                        <MetricCard
                            label="Học viên đã mua khóa"
                            value={number.format(reports.totals.paidLearners)}
                            description={`${number.format(reports.totals.assignments)} bài tập đang có`}
                            icon={<FaGraduationCap />}
                            tone="rose"
                        />
                    </section>

                    <div className="report-chart-grid">
                        <MonthlyBarChart
                            title="Doanh thu theo tháng"
                            description={`Tổng ${currency.format(reports.totals.revenue)} trong ${months} tháng`}
                            rows={reports.monthly}
                            series={[{ key: "revenue", label: "Doanh thu", color: "#2878d0" }]}
                            formatValue={(value) => currency.format(value)}
                        />
                        <MonthlyBarChart
                            title="Người dùng mới"
                            description="Số học viên và giảng viên đăng ký mới"
                            rows={reports.monthly}
                            series={[
                                { key: "newStudents", label: "Học viên", color: "#2878d0" },
                                { key: "newTeachers", label: "Giảng viên", color: "#f08b45" },
                            ]}
                        />
                        <MonthlyBarChart
                            title="Hoạt động học tập"
                            description="Bài học hoàn thành và bài tập đã nộp"
                            rows={reports.monthly}
                            series={[
                                { key: "completedLessons", label: "Bài học hoàn thành", color: "#27a779" },
                                { key: "submissions", label: "Bài tập đã nộp", color: "#8566d8" },
                            ]}
                        />
                    </div>

                    <section className="report-panel report-summary-strip">
                        <div>
                            <span><FaMoneyBillWave /> Doanh thu trong kỳ</span>
                            <strong>{currency.format(reports.totals.revenue)}</strong>
                        </div>
                        <div>
                            <span><FaUsers /> Học viên mới trong kỳ</span>
                            <strong>{number.format(reports.totals.newStudents)}</strong>
                        </div>
                        <div>
                            <span><FaChalkboardTeacher /> Giảng viên mới trong kỳ</span>
                            <strong>{number.format(reports.totals.newTeachers)}</strong>
                        </div>
                        <div>
                            <span><FaClipboardCheck /> Bài nộp trong kỳ</span>
                            <strong>{number.format(reports.totals.submissions)}</strong>
                        </div>
                    </section>

                    <div className="report-detail-grid">
                        <section className="report-panel">
                            <header className="report-panel-heading">
                                <div>
                                    <h2>Khóa học nổi bật</h2>
                                    <p>Xếp theo số học viên đã mua</p>
                                </div>
                            </header>
                            {reports.popularCourses.length ? (
                                <div className="report-course-list">
                                    {reports.popularCourses.map((course, index) => (
                                        <div className="report-course-row" key={course._id}>
                                            <span className="report-course-rank">{index + 1}</span>
                                            <div className="report-course-info">
                                                <div>
                                                    <strong>{course.name}</strong>
                                                    <span>{number.format(course.learners)} học viên · {currency.format(course.revenue)}</span>
                                                </div>
                                                <div className="report-course-track">
                                                    <span style={{ width: `${(course.learners / topCourseMaximum) * 100}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="report-empty">Chưa có đơn hàng thanh toán thành công.</p>
                            )}
                        </section>

                        <section className="report-panel">
                            <header className="report-panel-heading">
                                <div>
                                    <h2>Giảng viên hoạt động</h2>
                                    <p>Giảng viên đang phụ trách nhiều khóa học</p>
                                </div>
                            </header>
                            {reports.topTeachers.length ? (
                                <div className="report-course-list">
                                    {reports.topTeachers.map((teacher, index) => (
                                        <div className="report-course-row" key={teacher._id}>
                                            <span className="report-course-rank">{index + 1}</span>
                                            <div className="report-course-info">
                                                <div>
                                                    <strong>{teacher.name}</strong>
                                                    <span>{teacher.courses} khóa học</span>
                                                </div>
                                                {teacher.email && <small className="report-teacher-email">{teacher.email}</small>}
                                                <div className="report-course-track">
                                                    <span style={{
                                                        width: `${(teacher.courses / Math.max(1, ...reports.topTeachers.map((item) => item.courses))) * 100}%`,
                                                    }} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="report-empty">Chưa có giảng viên được phân công khóa học.</p>
                            )}
                        </section>

                        <section className="report-panel report-orders-panel">
                            <header className="report-panel-heading">
                                <div>
                                    <h2>Thanh toán gần đây</h2>
                                    <p>Các đơn hàng đã thanh toán thành công</p>
                                </div>
                            </header>
                            {reports.recentPaidOrders.length ? (
                                <div className="report-orders-list">
                                    {reports.recentPaidOrders.map((order) => (
                                        <article className="report-order-row" key={order._id}>
                                            <span className="report-order-icon"><FaMoneyBillWave /></span>
                                            <div>
                                                <strong>{order.courseName}</strong>
                                                <small>{order.paymentMethod} · {formatDate(order.paidAt)}</small>
                                            </div>
                                            <b>{currency.format(order.amount)}</b>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <p className="report-empty">Chưa có giao dịch để hiển thị.</p>
                            )}
                        </section>
                    </div>
                    <p className="report-footnote">
                        Do tài khoản chưa có trường ngày tạo riêng, số liệu đăng ký theo tháng được ước tính từ thời điểm tạo ObjectId. Doanh thu chỉ tính đơn đã thanh toán.
                    </p>
                </>
            )}
        </div>
    );
}

export default ReportsPage;
