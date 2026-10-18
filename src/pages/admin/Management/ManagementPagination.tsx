import type { ManagementPagination as PaginationData } from "../../../types/management";

type ManagementPaginationProps = {
    pagination: PaginationData;
    onPageChange: (page: number) => void;
};

function ManagementPagination({ pagination, onPageChange }: ManagementPaginationProps) {
    if (pagination.totalPages <= 1) {
        return (
            <div className="management-pagination-summary">
                Hiển thị {pagination.total} bản ghi (tối đa {pagination.pageSize}/trang)
            </div>
        );
    }

    const firstItem = (pagination.page - 1) * pagination.pageSize + 1;
    const lastItem = Math.min(pagination.page * pagination.pageSize, pagination.total);

    return (
        <div className="management-pagination">
            <span>Hiển thị {firstItem}–{lastItem} / {pagination.total}</span>
            <div>
                <button
                    type="button"
                    className="management-button secondary small"
                    disabled={pagination.page <= 1}
                    onClick={() => onPageChange(pagination.page - 1)}
                >
                    Trước
                </button>
                <strong>Trang {pagination.page}/{pagination.totalPages}</strong>
                <button
                    type="button"
                    className="management-button secondary small"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => onPageChange(pagination.page + 1)}
                >
                    Sau
                </button>
            </div>
        </div>
    );
}

export default ManagementPagination;
