import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaCheckCircle, FaClock, FaTimesCircle } from "react-icons/fa";
import { getOrderById } from "../../../services/course.service";
import type { CourseOrder } from "../../../types/course";
import "./PaymentResultPage.css";

function PaymentResultPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const orderId = searchParams.get("orderId");
    const hasInvalidPayment = searchParams.get("payment") === "invalid";
    const [order, setOrder] = useState<CourseOrder | null>(null);
    const [error, setError] = useState("");
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        if (!orderId || hasInvalidPayment) return;

        if (!localStorage.getItem("token")) {
            navigate(`/login?redirect=${encodeURIComponent(`/payment/result?orderId=${orderId}`)}`);
            return;
        }

        let isMounted = true;
        let attempts = 0;
        let timeout: ReturnType<typeof setTimeout>;

        const checkOrder = async () => {
            try {
                const latestOrder = await getOrderById(orderId);
                if (!isMounted) return;
                setOrder(latestOrder);
                setError("");
                if (latestOrder.Status === "Pending" && attempts < 20) {
                    attempts += 1;
                    timeout = setTimeout(checkOrder, 3000);
                    return;
                }
            } catch {
                if (isMounted) setError("Không thể kiểm tra đơn hàng. Hãy tải lại trang để thử lại.");
            }
            if (isMounted) setIsChecking(false);
        };

        void checkOrder();
        return () => {
            isMounted = false;
            clearTimeout(timeout);
        };
    }, [hasInvalidPayment, orderId, navigate]);

    const isPaid = order?.Status === "Paid";
    const isFailed = order?.Status === "Failed";

    if (!orderId || hasInvalidPayment) {
        return (
            <main className="payment-result-page">
                <section className="payment-result-card">
                    <FaTimesCircle className="payment-result-icon payment-result-failed" aria-hidden="true" />
                    <h1>{hasInvalidPayment ? "Không xác thực được kết quả thanh toán" : "Không tìm thấy mã đơn hàng"}</h1>
                    <p>{hasInvalidPayment ? "Vui lòng kiểm tra trạng thái đơn hàng trong tài khoản hoặc liên hệ hỗ trợ." : ""}</p>
                    <Link className="payment-result-link" to="/courses">Xem danh sách khóa học</Link>
                </section>
            </main>
        );
    }

    return (
        <main className="payment-result-page">
            <section className="payment-result-card">
                {isPaid ? (
                    <FaCheckCircle className="payment-result-icon payment-result-success" aria-hidden="true" />
                ) : isFailed ? (
                    <FaTimesCircle className="payment-result-icon payment-result-failed" aria-hidden="true" />
                ) : (
                    <FaClock className="payment-result-icon payment-result-pending" aria-hidden="true" />
                )}
                <h1>
                    {isPaid
                        ? "Thanh toán thành công"
                        : isFailed
                          ? "Thanh toán chưa thành công"
                          : "Đang xác nhận thanh toán"}
                </h1>
                <p>
                    {isPaid
                        ? `Đơn hàng đã được ${order?.PaymentMethod === "VNPAY" ? "VNPay" : order?.PaymentMethod === "MoMo" ? "MoMo" : "hệ thống"} xác nhận. Bạn có thể bắt đầu học ngay.`
                        : isFailed
                          ? "Giao dịch chưa hoàn tất. Bạn có thể quay lại khóa học và thử thanh toán lại."
                          : `Đang chờ ${order?.PaymentMethod === "VNPAY" ? "VNPay" : "MoMo"} gửi xác nhận đến hệ thống. Vui lòng giữ trang này mở trong giây lát.`}
                </p>
                {order && <span className="payment-result-order">Mã đơn hàng: {order._id}</span>}
                {error && <p className="payment-result-error" role="alert">{error}</p>}
                {!isPaid && !isFailed && isChecking && (
                    <span className="payment-result-hint" role="status">Đang kiểm tra trạng thái...</span>
                )}
                {!isPaid && !isFailed && !isChecking && (
                    <button
                        className="payment-result-button"
                        type="button"
                        onClick={() => window.location.reload()}
                    >
                        Kiểm tra lại
                    </button>
                )}
                {order && (
                    <Link
                        className="payment-result-link"
                        to={isPaid ? `/courses/${order.CourseID}/learn` : `/courses/${order.CourseID}`}
                    >
                        {isPaid ? "Vào học ngay" : "Quay lại khóa học"}
                    </Link>
                )}
                {!order && (
                    <Link className="payment-result-link" to="/courses">Xem danh sách khóa học</Link>
                )}
            </section>
        </main>
    );
}

export default PaymentResultPage;
