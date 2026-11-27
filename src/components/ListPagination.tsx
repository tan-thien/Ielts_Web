import "./ListPagination.css";

interface ListPaginationProps {
    total: number;
    page: number;
    onPageChange: (page: number) => void;
    pageSize?: number;
}

function ListPagination({
    total,
    page,
    onPageChange,
    pageSize = 50,
}: ListPaginationProps) {
    const totalPages = Math.ceil(total / pageSize);
    const firstItem = total ? (page - 1) * pageSize + 1 : 0;
    const lastItem = Math.min(page * pageSize, total);

    return (
        <nav className="list-pagination" aria-label="Pagination">
            <span>Hiển thị {firstItem}–{lastItem} / {total}</span>
            {totalPages > 1 && (
                <div>
                    <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => onPageChange(page - 1)}
                    >
                        Trước
                    </button>
                    <strong>{page} / {totalPages}</strong>
                    <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => onPageChange(page + 1)}
                    >
                        Tiếp
                    </button>
                </div>
            )}
        </nav>
    );
}

export default ListPagination;
