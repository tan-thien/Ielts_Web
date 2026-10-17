import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
    FaBookOpen,
    FaChalkboardTeacher,
    FaClipboardList,
    FaGraduationCap,
    FaMoneyBillWave,
    FaUserPlus,
    FaUsers,
    FaSignInAlt,
} from "react-icons/fa";
import { getAdminReports } from "../../../services/reports.service";
import type { MonthlyReport, ReportsData } from "../../../types/reports";
import "../Reports/ReportsPage.css";
import "./DashboardPage.css";

const numberFormat = new Intl.NumberFormat("vi-VN");
const currencyFormat = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
});

type ChartKey = Exclude<keyof MonthlyReport, "month">;

function formatMonth(value: string, showYear: boolean): string {
    const [year, month] = value.split("-").map(Number);
    return new Intl.DateTimeFormat("vi-VN", {
        month: "short",
        ...(showYear ? { year: "2-digit" } : {}),
    }).format(new Date(year, month - 1, 1));
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
    return error instanceof Error ? error.message : "Không thể tải dữ liệu tổng quan.";
}

function DashboardMetric({
    label,
    value,
    detail,
    icon,
    tone,
}: {
    label: string;
    value: string;
    detail: string;
    icon: ReactNode;
    tone: string;
}) {
    return (
        <article className="report-metric-card dashboard-metric">
            <span className={`report-metric-icon ${tone}`}>{icon}</span>
            <div className="report-metric-copy">
                <span>{label}</span>
                <strong title={value}>{value}</strong>
                <small>{detail}</small>
            </div>
        </article>
    );
}

function DashboardChart({
    title,
    description,
    rows,
    series,
    valueFormat = (value) => numberFormat.format(value),
}: {
    title: string;
    description: string;
    rows: MonthlyReport[];
    series: { key: ChartKey; label: string; color: string }[];
    valueFormat?: (value: number) => string;
}) {
    const maximum = Math.max(
        1,
        ...rows.flatMap((row) => series.map(({ key }) => Number(row[key]) || 0)),
    );

    return (
        <section className="report-panel dashboard-chart-panel">
            <header className="report-panel-heading">
                <div>
                    <h2>{title}</h2>
                    <p>{description}</p>
                </div>
            </header>
            <div className="report-legend" aria-label="Chú giải">
                {series.map((item) => (
                    <span key={item.key}>
                        <i style={{ backgroundColor: item.color }} />
                        {item.label}
                    </span>
                ))}
            </div>
            <div className="report-chart dashboard-chart" role="img" aria-label={title}>
                {rows.map((row, index) => (
                    <div className="report-chart-month" key={row.month}>
                        <div className="report-chart-bars">
                            {series.map((item) => {
                                const value = Number(row[item.key]) || 0;
                                const height = value ? Math.max(3, (value / maximum) * 100) : 0;
                                return (
                                    <span
                                        className="report-chart-bar"
                                        key={item.key}
                                        style={{ height: `${height}%`, backgroundColor: item.color }}
                                        title={`${item.label}: ${valueFormat(value)}`}
                                    />
                                );
                            })}
                        </div>
                        <small>
                            {index % 2 === 0 || rows.length <= 6
                                ? formatMonth(row.month, rows.length > 12)
                                : ""}
                        </small>
                    </div>
                ))}
            </div>
        </section>
    );
}

function DashboardPage() {
    const [months, setMonths] = useState(12);
    const [reports, setReports] = useState<ReportsData | null>(null);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let cancelled = false;
        getAdminReports(months)
            .then((data) => {
                if (!cancelled) {
                    setReports(data);
                    setError("");
                }
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

    const topCourseMaximum = useMemo(
        () => Math.max(1, ...(reports?.popularCourses.map((course) => course.learners) ?? [])),
        [reports],
    );

    if (isLoading && !reports) {
        return <div className="dashboard-page"><div className="report-loading">Đang tải Dashboard...</div></div>;
    }

    return (
        <div className="dashboard-page">
            <header className="dashboard-header">
                <div>
                    <span className="reports-eyebrow">IELTS LEARNING MANAGEMENT</span>
                    <h1>Dashboard</h1>
                    <p>Tổng quan hoạt động, người dùng, học tập và doanh thu của website.</p>
                </div>
                <div className="dashboard-actions">
                    <label htmlFor="dashboard-range">Thời gian</label>
                    <select
                        id="dashboard-range"
                        value={months}
                        onChange={(event) => {
                            setReports(null);
                            setError("");
                            setIsLoading(true);
                            setMonths(Number(event.target.value));
                        }}
                    >
                        <option value={6}>6 tháng</option>
                        <option value={12}>12 tháng</option>
                        <option value={24}>24 tháng</option>
                    </select>
                    <button
                        type="button"
                        onClick={() => {
                            setReports(null);
                            setError("");
                            setIsLoading(true);
                            setReloadKey((key) => key + 1);
                        }}
                    >
                        Làm mới
                    </button>
                </div>
            </header>

            {error && (
                <div className="report-error" role="alert">
                    <span>{error}</span>
                    <button
                        type="button"
                        onClick={() => {
                            setReports(null);
                            setError("");
                            setIsLoading(true);
                            setReloadKey((key) => key + 1);
                        }}
                    >
                        Thử lại
                    </button>
                </div>
            )}

            {reports && (
                <>
                    <section className="dashboard-metric-grid" aria-label="Các chỉ số chính">
                        <DashboardMetric
                            label="Tổng học viên"
                            value={numberFormat.format(reports.totals.students)}
                            detail={`+${numberFormat.format(reports.currentMonth.newStudents)} đăng ký trong tháng`}
                            icon={<FaUsers />}
                            tone="blue"
                        />
                        <DashboardMetric
                            label="Đăng ký mới tháng này"
                            value={numberFormat.format(reports.currentMonth.newStudents)}
                            detail="Ước tính từ thời điểm tạo tài khoản"
                            icon={<FaUserPlus />}
                            tone="purple"
                        />
                        <DashboardMetric
                            label="Lượt đăng nhập tháng này"
                            value={numberFormat.format(reports.currentMonth.logins)}
                            detail={`${numberFormat.format(reports.totals.allTimeLogins)} lượt đã ghi nhận`}
                            icon={<FaSignInAlt />}
                            tone="teal"
                        />
                        <DashboardMetric
                            label="Giảng viên"
                            value={numberFormat.format(reports.totals.teachers)}
                            detail={`${numberFormat.format(reports.totals.assignedTeachers)} đang được phân công`}
                            icon={<FaChalkboardTeacher />}
                            tone="orange"
                        />
                        <DashboardMetric
                            label="Khóa học"
                            value={numberFormat.format(reports.totals.courses)}
                            detail={`+${numberFormat.format(reports.currentMonth.newCourses)} khóa mới trong tháng`}
                            icon={<FaBookOpen />}
                            tone="teal"
                        />
                        <DashboardMetric
                            label="Bài tập"
                            value={numberFormat.format(reports.totals.assignments)}
                            detail={`${numberFormat.format(reports.totals.submissions)} lượt nộp trong kỳ`}
                            icon={<FaClipboardList />}
                            tone="rose"
                        />
                        <DashboardMetric
                            label="Doanh thu tháng này"
                            value={currencyFormat.format(reports.currentMonth.revenue)}
                            detail={`${numberFormat.format(reports.currentMonth.paidOrders)} đơn đã thanh toán`}
                            icon={<FaMoneyBillWave />}
                            tone="green"
                        />
                        <DashboardMetric
                            label="Tổng doanh thu"
                            value={currencyFormat.format(reports.totals.allTimeRevenue)}
                            detail={`${numberFormat.format(reports.totals.paidOrders)} đơn thành công`}
                            icon={<FaGraduationCap />}
                            tone="blue"
                        />
                    </section>

                    <div className="dashboard-chart-grid">
                        <DashboardChart
                            title="Doanh thu theo tháng"
                            description={`Doanh thu đã thanh toán trong ${months} tháng gần nhất`}
                            rows={reports.monthly}
                            series={[{ key: "revenue", label: "Doanh thu", color: "#2878d0" }]}
                            valueFormat={(value) => currencyFormat.format(value)}
                        />
                        <DashboardChart
                            title="Đăng ký mới"
                            description="Học viên và giảng viên mới theo tháng"
                            rows={reports.monthly}
                            series={[
                                { key: "newStudents", label: "Học viên", color: "#2878d0" },
                                { key: "newTeachers", label: "Giảng viên", color: "#f08b45" },
                            ]}
                        />
                        <DashboardChart
                            title="Lượt đăng nhập"
                            description="Các lần đăng nhập thành công được ghi nhận"
                            rows={reports.monthly}
                            series={[{ key: "logins", label: "Lượt đăng nhập", color: "#8566d8" }]}
                        />
                        <DashboardChart
                            title="Hoạt động học tập"
                            description="Bài học hoàn thành và bài tập đã nộp"
                            rows={reports.monthly}
                            series={[
                                { key: "completedLessons", label: "Bài học hoàn thành", color: "#27a779" },
                                { key: "submissions", label: "Bài tập đã nộp", color: "#e77b32" },
                            ]}
                        />
                    </div>

                    <div className="dashboard-detail-grid">
                        <section className="report-panel">
                            <header className="report-panel-heading">
                                <div>
                                    <h2>Khóa học nổi bật</h2>
                                    <p>Xếp theo số học viên đã thanh toán</p>
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
                                                    <span>
                                                        {numberFormat.format(course.learners)} học viên · {currencyFormat.format(course.revenue)}
                                                    </span>
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
                                    <h2>Giao dịch gần đây</h2>
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
                                            <b>{currencyFormat.format(order.amount)}</b>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <p className="report-empty">Chưa có giao dịch để hiển thị.</p>
                            )}
                        </section>
                    </div>

                    <p className="dashboard-footnote">
                        Lượt đăng nhập được tính từ thời điểm triển khai tính năng ghi nhận; dữ liệu trước đó không thể khôi phục.
                        Số đăng ký theo tháng được ước tính từ thời điểm tạo ObjectId tài khoản.
                    </p>
                </>
            )}
        </div>
    );
}

export default DashboardPage;
