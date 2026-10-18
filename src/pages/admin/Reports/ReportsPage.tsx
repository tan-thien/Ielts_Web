import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
    FaBookOpen,
    FaChartLine,
    FaChalkboardTeacher,
    FaClipboardCheck,
    FaFileExcel,
    FaFilePdf,
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

interface ReportSheet {
    name: string;
    title: string;
    subtitle: string;
    headers: string[];
    rows: (string | number)[][];
    widths: number[];
    currencyColumns?: number[];
    currencyRows?: number[];
}

function xmlEscape(value: string): string {
    return Array.from(value)
        .filter((character) => {
            const code = character.charCodeAt(0);
            return code >= 0x20 || code === 0x09 || code === 0x0a || code === 0x0d;
        })
        .join("")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function columnName(index: number): string {
    let name = "";
    let value = index + 1;
    while (value > 0) {
        const remainder = (value - 1) % 26;
        name = String.fromCharCode(65 + remainder) + name;
        value = Math.floor((value - 1) / 26);
    }
    return name;
}

function makeReportWorkbook(reports: ReportsData): ReportSheet[] {
    return [
        {
            name: "Tổng quan",
            title: "BÁO CÁO TỔNG QUAN IELTS",
            subtitle: "Tổng hợp quy mô, doanh thu và hoạt động học tập",
            headers: ["Chỉ số", "Giá trị", "Diễn giải"],
            rows: [
            ["Tổng học viên", reports.totals.students, "Tài khoản học viên hiện có"],
            ["Tổng giảng viên", reports.totals.teachers, "Tài khoản giảng viên hiện có"],
            ["Giảng viên được phân công", reports.totals.assignedTeachers, "Có tham gia phụ trách khóa học"],
            ["Tổng khóa học", reports.totals.courses, "Khóa học chưa xóa"],
            ["Tổng bài tập", reports.totals.assignments, "Bài tập chưa xóa"],
            ["Học viên đã mua khóa", reports.totals.paidLearners, "Học viên có đơn thanh toán thành công"],
            ["Tổng lượt đăng nhập ghi nhận", reports.totals.allTimeLogins, "Từ thời điểm triển khai ghi nhận đăng nhập"],
            ["Tổng đơn đã thanh toán", reports.totals.paidOrders, "Đơn hàng có trạng thái Paid"],
            ["Tổng doanh thu", reports.totals.allTimeRevenue, "VND · đơn hàng đã thanh toán"],
            ["Doanh thu trong kỳ", reports.totals.revenue, "VND · theo khoảng thời gian đã chọn"],
            ["Học viên mới trong kỳ", reports.totals.newStudents, "Ước tính theo thời điểm tạo tài khoản"],
            ["Giảng viên mới trong kỳ", reports.totals.newTeachers, "Ước tính theo thời điểm tạo tài khoản"],
            ["Khóa học mới trong kỳ", reports.totals.newCourses, "Theo thời điểm tạo khóa học"],
            ["Bài học hoàn thành trong kỳ", reports.totals.completedLessons, "Lượt hoàn thành ghi nhận"],
            ["Bài tập nộp trong kỳ", reports.totals.submissions, "Bài đã nộp hoặc chấm điểm"],
            ["Lượt đăng nhập trong kỳ", reports.totals.logins, "Các lần đăng nhập thành công"],
        ],
            widths: [34, 20, 55],
            currencyRows: [8, 9],
        },
        {
            name: "Theo tháng",
            title: "BÁO CÁO THEO THÁNG",
            subtitle: "Xu hướng người dùng, doanh thu và hoạt động học tập",
            headers: [
                "Tháng", "Doanh thu (VND)", "Đơn thanh toán", "Học viên mới",
                "Giảng viên mới", "Khóa học mới", "Lượt đăng nhập",
                "Bài học hoàn thành", "Bài tập đã nộp",
            ],
            rows: reports.monthly.map((row) => [
            formatMonth(row.month, true),
            row.revenue,
            row.paidOrders,
            row.newStudents,
            row.newTeachers,
            row.newCourses,
            row.logins,
            row.completedLessons,
            row.submissions,
        ]),
            widths: [18, 22, 18, 18, 18, 18, 18, 22, 18],
            currencyColumns: [1],
        },
        {
            name: "Khóa học",
            title: "KHÓA HỌC NỔI BẬT",
            subtitle: "Xếp theo số lượng học viên có đơn thanh toán thành công",
            headers: ["Xếp hạng", "Tên khóa học", "Học viên", "Doanh thu (VND)"],
            rows: reports.popularCourses.map((course, index) => [
            index + 1,
            course.name,
            course.learners,
            course.revenue,
        ]),
            widths: [14, 42, 18, 24],
            currencyColumns: [3],
        },
        {
            name: "Giảng viên",
            title: "HIỆU SUẤT GIẢNG VIÊN",
            subtitle: "Danh sách giảng viên theo số khóa học đang phụ trách",
            headers: ["Xếp hạng", "Giảng viên", "Email", "Số khóa học"],
            rows: reports.topTeachers.map((teacher, index) => [
            index + 1,
            teacher.name,
            teacher.email,
            teacher.courses,
        ]),
            widths: [14, 32, 38, 18],
        },
        {
            name: "Giao dịch",
            title: "GIAO DỊCH THANH TOÁN GẦN ĐÂY",
            subtitle: "Các đơn hàng đã thanh toán thành công",
            headers: ["Khóa học", "Số tiền", "Tiền tệ", "Phương thức", "Thời gian thanh toán"],
            rows: reports.recentPaidOrders.map((order) => [
            order.courseName,
            order.amount,
            order.currency,
            order.paymentMethod,
            formatDate(order.paidAt),
        ]),
            widths: [42, 20, 14, 20, 30],
            currencyColumns: [1],
        },
    ];
}

function buildWorkbookFiles(
    sheets: ReportSheet[],
    generatedAt: Date,
    period: string,
): Record<string, string> {
    const generatedLabel = generatedAt.toLocaleString("vi-VN");
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    const lastColumn = (count: number) => columnName(count - 1);
    const files: Record<string, string> = {
        "[Content_Types].xml": `${xmlHeader}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${sheets.map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}
</Types>`,
        "_rels/.rels": `${xmlHeader}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
        "xl/workbook.xml": `${xmlHeader}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<bookViews><workbookView/></bookViews><sheets>${sheets.map((sheet, index) => `<sheet name="${xmlEscape(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join("")}</sheets></workbook>`,
        "xl/_rels/workbook.xml.rels": `${xmlHeader}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${sheets.map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join("")}
<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
        "xl/styles.xml": `${xmlHeader}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0 &quot;₫&quot;"/></numFmts>
<fonts count="4"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="18"/><name val="Calibri"/></font><font><b/><color rgb="FF173F75"/><sz val="11"/><name val="Calibri"/></font><font><i/><color rgb="FF64748B"/><sz val="10"/><name val="Calibri"/></font></fonts>
<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF173F75"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEAF1FA"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFDCE4EE"/></left><right style="thin"><color rgb="FFDCE4EE"/></right><top style="thin"><color rgb="FFDCE4EE"/></top><bottom style="thin"><color rgb="FFDCE4EE"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="8"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="3" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf></cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
    };

    sheets.forEach((sheet, sheetIndex) => {
        const columnCount = sheet.headers.length;
        const endColumn = lastColumn(columnCount);
        const allRows: (string | number)[][] = [
            [sheet.title],
            [sheet.subtitle],
            [`Kỳ báo cáo: ${period}`, `Ngày xuất: ${generatedLabel}`],
            [],
            sheet.headers,
            ...sheet.rows,
        ];
        const rowXml = allRows.map((row, rowIndex) => {
            const rowNumber = rowIndex + 1;
            const cells = row.map((value, columnIndex) => {
                const address = `${columnName(columnIndex)}${rowNumber}`;
                if (typeof value === "number" && Number.isFinite(value)) {
                    let style = rowIndex === 4 ? 4 : 6;
                    if (
                        rowIndex > 4 &&
                        (sheet.currencyColumns?.includes(columnIndex) ||
                            (sheet.currencyRows?.includes(rowIndex - 5) && columnIndex === 1))
                    ) {
                        style = 7;
                    }
                    return `<c r="${address}" s="${style}" t="n"><v>${value}</v></c>`;
                }
                const style = rowIndex === 0 ? 1 : rowIndex === 1 ? 2 : rowIndex === 2 ? 3 : rowIndex === 4 ? 4 : 5;
                return `<c r="${address}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(String(value))}</t></is></c>`;
            }).join("");
            const height = rowIndex === 0 ? ' ht="30" customHeight="1"' : rowIndex === 4 ? ' ht="32" customHeight="1"' : "";
            return `<row r="${rowNumber}"${height}>${cells}</row>`;
        }).join("");
        const columns = sheet.widths
            .map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`)
            .join("");
        const filterEnd = 5 + sheet.rows.length;

        files[`xl/worksheets/sheet${sheetIndex + 1}.xml`] = `${xmlHeader}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:${endColumn}${Math.max(5, filterEnd)}"/>
<sheetViews><sheetView workbookViewId="0"><pane ySplit="5" topLeftCell="A6" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A6" sqref="A6"/></sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="19"/><cols>${columns}</cols><sheetData>${rowXml}</sheetData>
<autoFilter ref="A5:${endColumn}${Math.max(5, filterEnd)}"/><mergeCells count="2"><mergeCell ref="A1:${endColumn}1"/><mergeCell ref="A2:${endColumn}2"/></mergeCells>
<pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/><pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>`;
    });

    return files;
}

function PrintReport({ reports, months }: { reports: ReportsData; months: number }) {
    const generatedAt = new Date();
    const period = reports.monthly.length
        ? `${formatMonth(reports.monthly[0].month, true)} – ${formatMonth(
            reports.monthly[reports.monthly.length - 1].month,
            true,
        )}`
        : "Không có dữ liệu";

    return (
        <article className="report-print-document">
            <header className="print-report-header">
                <div className="print-report-brand">IELTS <span>HỌC TẬP</span></div>
                <p>BÁO CÁO QUẢN TRỊ</p>
                <h1>Báo cáo hoạt động &amp; kinh doanh</h1>
                <div className="print-report-meta">
                    <span><strong>Kỳ báo cáo:</strong> {period} ({months} tháng)</span>
                    <span><strong>Ngày xuất:</strong> {generatedAt.toLocaleString("vi-VN")}</span>
                </div>
            </header>

            <section className="print-report-section">
                <h2>01. Tóm tắt điều hành</h2>
                <table>
                    <tbody>
                        <tr><th>Học viên</th><td>{number.format(reports.totals.students)}</td><th>Giảng viên</th><td>{number.format(reports.totals.teachers)}</td></tr>
                        <tr><th>Khóa học</th><td>{number.format(reports.totals.courses)}</td><th>Bài tập</th><td>{number.format(reports.totals.assignments)}</td></tr>
                        <tr><th>Doanh thu toàn thời gian</th><td>{currency.format(reports.totals.allTimeRevenue)}</td><th>Đơn đã thanh toán</th><td>{number.format(reports.totals.paidOrders)}</td></tr>
                        <tr><th>Doanh thu trong kỳ</th><td>{currency.format(reports.totals.revenue)}</td><th>Học viên đã mua khóa</th><td>{number.format(reports.totals.paidLearners)}</td></tr>
                        <tr><th>Học viên đăng ký trong kỳ</th><td>{number.format(reports.totals.newStudents)}</td><th>Giảng viên mới trong kỳ</th><td>{number.format(reports.totals.newTeachers)}</td></tr>
                        <tr><th>Lượt đăng nhập trong kỳ</th><td>{number.format(reports.totals.logins)}</td><th>Tổng lượt đăng nhập ghi nhận</th><td>{number.format(reports.totals.allTimeLogins)}</td></tr>
                        <tr><th>Bài học hoàn thành</th><td>{number.format(reports.totals.completedLessons)}</td><th>Bài tập đã nộp</th><td>{number.format(reports.totals.submissions)}</td></tr>
                    </tbody>
                </table>
            </section>

            <section className="print-report-section">
                <h2>02. Diễn biến theo tháng</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Tháng</th><th>Doanh thu</th><th>Đơn trả phí</th>
                            <th>HV mới</th><th>GV mới</th><th>Đăng nhập</th>
                            <th>Bài học xong</th><th>Bài tập nộp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.monthly.map((row) => (
                            <tr key={row.month}>
                                <td>{formatMonth(row.month, true)}</td>
                                <td>{currency.format(row.revenue)}</td>
                                <td>{number.format(row.paidOrders)}</td>
                                <td>{number.format(row.newStudents)}</td>
                                <td>{number.format(row.newTeachers)}</td>
                                <td>{number.format(row.logins)}</td>
                                <td>{number.format(row.completedLessons)}</td>
                                <td>{number.format(row.submissions)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <section className="print-report-section">
                <h2>03. Khóa học nổi bật</h2>
                {reports.popularCourses.length ? (
                    <table>
                        <thead><tr><th>#</th><th>Khóa học</th><th>Học viên</th><th>Doanh thu</th></tr></thead>
                        <tbody>
                            {reports.popularCourses.map((course, index) => (
                                <tr key={course._id}>
                                    <td>{index + 1}</td><td>{course.name}</td>
                                    <td>{number.format(course.learners)}</td><td>{currency.format(course.revenue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p className="print-report-empty">Chưa có dữ liệu khóa học đã thanh toán.</p>}
            </section>

            <section className="print-report-section">
                <h2>04. Hiệu suất giảng viên</h2>
                {reports.topTeachers.length ? (
                    <table>
                        <thead><tr><th>#</th><th>Giảng viên</th><th>Email</th><th>Số khóa học</th></tr></thead>
                        <tbody>
                            {reports.topTeachers.map((teacher, index) => (
                                <tr key={teacher._id}>
                                    <td>{index + 1}</td><td>{teacher.name}</td>
                                    <td>{teacher.email || "—"}</td><td>{number.format(teacher.courses)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p className="print-report-empty">Chưa có dữ liệu phân công giảng viên.</p>}
            </section>

            <section className="print-report-section">
                <h2>05. Giao dịch gần đây</h2>
                {reports.recentPaidOrders.length ? (
                    <table>
                        <thead><tr><th>Khóa học</th><th>Giá trị</th><th>Phương thức</th><th>Thời gian</th></tr></thead>
                        <tbody>
                            {reports.recentPaidOrders.map((order) => (
                                <tr key={order._id}>
                                    <td>{order.courseName}</td>
                                    <td>{currency.format(order.amount)}</td>
                                    <td>{order.paymentMethod}</td>
                                    <td>{formatDate(order.paidAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p className="print-report-empty">Chưa có giao dịch để hiển thị.</p>}
            </section>

            <footer className="print-report-footer">
                Dữ liệu được tổng hợp từ hệ thống IELTS Học Tập. Doanh thu chỉ tính các đơn đã thanh toán.
                Lượt đăng nhập được ghi nhận từ thời điểm triển khai; số đăng ký theo tháng ước tính theo ObjectId tài khoản.
            </footer>
        </article>
    );
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
    const [isExportingExcel, setIsExportingExcel] = useState(false);
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
                    <div className="report-range-control">
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
                    </div>
                    <div className="report-action-buttons">
                    <button className="report-refresh-button" type="button" onClick={refreshReports}>
                        Làm mới
                    </button>
                    {reports && (
                        <>
                            <button
                                className="report-export-button report-export-pdf"
                                type="button"
                                onClick={() => window.print()}
                            >
                                <FaFilePdf />
                                Xuất PDF
                            </button>
                            <button
                                className="report-export-button report-export-excel"
                                type="button"
                                disabled={isExportingExcel}
                                onClick={async () => {
                                    setIsExportingExcel(true);
                                    try {
                                        const generatedAt = new Date();
                                        const firstMonth = reports.monthly[0]?.month;
                                        const lastMonth = reports.monthly[reports.monthly.length - 1]?.month;
                                        const period = firstMonth && lastMonth
                                            ? `${formatMonth(firstMonth, true)} – ${formatMonth(lastMonth, true)}`
                                            : "Không có dữ liệu";
                                        const { strToU8, zipSync } = await import("fflate");
                                        const files = buildWorkbookFiles(
                                            makeReportWorkbook(reports),
                                            generatedAt,
                                            period,
                                        );
                                        const archive = zipSync(
                                            Object.fromEntries(
                                                Object.entries(files).map(([path, content]) => [
                                                    path,
                                                    strToU8(content),
                                                ]),
                                            ),
                                        );
                                        const fileUrl = URL.createObjectURL(
                                            new Blob([archive], {
                                                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                            }),
                                        );
                                        const link = document.createElement("a");
                                        link.href = fileUrl;
                                        link.download = `bao-cao-ielts-${generatedAt.toISOString().slice(0, 10)}.xlsx`;
                                        link.click();
                                        window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
                                    } catch (exportError) {
                                        console.error("Export Excel report failed:", exportError);
                                        setError("Không thể xuất file Excel. Vui lòng thử lại.");
                                    } finally {
                                        setIsExportingExcel(false);
                                    }
                                }}
                            >
                                <FaFileExcel />
                                {isExportingExcel ? "Đang tạo Excel..." : "Xuất Excel"}
                            </button>
                        </>
                    )}
                    </div>
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
                    <PrintReport reports={reports} months={months} />
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
