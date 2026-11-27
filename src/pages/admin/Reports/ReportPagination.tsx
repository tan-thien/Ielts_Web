import type { ReportPagination as Pagination } from "../../../types/reports";

function ReportPagination({
    pagination,
    onPageChange,
}: {
    pagination: Pagination;
    onPageChange: (page: number) => void;
}) {
    const firstItem = pagination.total
        ? (pagination.page - 1) * pagination.pageSize + 1
        : 0;
    const lastItem = Math.min(pagination.page * pagination.pageSize, pagination.total);

    return (
        <nav className="report-list-pagination" aria-label="Pagination">
            <span>Hiển thị {firstItem}–{lastItem} / {pagination.total}</span>
            <div>
                <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => onPageChange(pagination.page - 1)}
                >
                    Trước
                </button>
                <strong>{pagination.page} / {Math.max(1, pagination.totalPages)}</strong>
                <button
                    type="button"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => onPageChange(pagination.page + 1)}
                >
                    Tiếp
                </button>
            </div>
        </nav>
    );
}

export default ReportPagination;
