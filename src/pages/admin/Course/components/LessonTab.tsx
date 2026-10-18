import {
    FaBookOpen,
    FaEdit,
    FaPlus,
    FaTrash
} from "react-icons/fa";

import { useNavigate, useParams } from "react-router-dom";

import { deleteLesson } from "../../../../services/lesson.service";


interface Props {
    lessons: any[];
    onDelete: () => Promise<void>;
}


function LessonTab({ lessons, onDelete}: Props) {

    const navigate = useNavigate();
    const { courseId } = useParams();


    const handleDelete = async (id: string) => {

        const confirmDelete = window.confirm(
            "Bạn có chắc muốn xóa bài học này không?"
        );

        if (!confirmDelete) {
            return;
        }

        try {

            await deleteLesson(id);

            alert("Đã xóa bài học thành công.");

            await onDelete();

        } catch (error: any) {

            console.error("Delete lesson error:", error);

            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Không thể xóa bài học.";

            alert(message);
        }
    };


    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">

                <h4 className="mb-0">
                    Danh sách bài học
                </h4>

                <button
                    className="btn btn-primary"
                    onClick={() =>
                        navigate(
                            `/admin/courses/${courseId}/lessons/create`
                        )
                    }
                >
                    <FaPlus className="me-2" />
                    Thêm bài học
                </button>

            </div>


            <table className="table table-hover align-middle">

                <thead className="table-light">

                    <tr>
                        <th>Tên bài học</th>
                        <th>Chương</th>
                        <th>Trạng thái</th>
                        <th>Hiển thị</th>
                        <th>Thao tác</th>
                    </tr>

                </thead>


                <tbody>

                    {
                        lessons.length > 0 ? (

                            lessons.map((lesson) => (

                                <tr key={lesson._id}>

                                    <td>
                                        {lesson.Name}
                                    </td>

                                    <td>
                                        {lesson.Unit}
                                    </td>

                                    <td>

                                        <span
                                            className={`badge ${
                                                lesson.Status === "Active"
                                                    ? "bg-success"
                                                    : lesson.Status === "Pending"
                                                        ? "bg-warning text-dark"
                                                        : lesson.Status === "Finished"
                                                            ? "bg-secondary"
                                                            : "bg-dark"
                                            }`}
                                        >
                                            {lesson.Status === "Active" ? "Đang hoạt động" : lesson.Status === "Pending" ? "Đang chờ" : lesson.Status === "Finished" ? "Đã hoàn tất" : lesson.Status}
                                        </span>

                                    </td>

                                    <td>

                                        <span
                                            className={`badge ${
                                                lesson.IsOpen
                                                    ? "bg-primary"
                                                    : "bg-danger"
                                            }`}
                                        >
                                            {
                                                lesson.IsOpen
                                                    ? "Đang mở"
                                                    : "Đang đóng"
                                            }
                                        </span>

                                    </td>

                                    <td>

                                        {/* Lesson Detail */}
                                        <button
                                            className="btn btn-primary btn-sm me-2"
                                            title="Quản lý nội dung"
                                            onClick={() =>
                                                navigate(
                                                    `/admin/courses/${courseId}/lessons/${lesson._id}/details`
                                                )
                                            }
                                        >
                                            <FaBookOpen />
                                        </button>


                                        {/* Edit */}
                                        <button
                                            className="btn btn-warning btn-sm me-2"
                                            title="Chỉnh sửa bài học"
                                            onClick={() =>
                                                navigate(
                                                    `/admin/courses/${courseId}/lessons/${lesson._id}/edit`
                                                )
                                            }
                                        >
                                            <FaEdit />
                                        </button>


                                        {/* Delete */}
                                        <button
                                            className="btn btn-danger btn-sm"
                                            title="Xóa bài học"
                                            onClick={() =>
                                                handleDelete(lesson._id)
                                            }
                                        >
                                            <FaTrash />
                                        </button>

                                    </td>

                                </tr>

                            ))

                        ) : (

                            <tr>

                                <td
                                    colSpan={5}
                                    className="text-center py-5 text-muted"
                                >
                                    Chưa có bài học nào.
                                </td>

                            </tr>

                        )
                    }

                </tbody>

            </table>
        </>
    );
}


export default LessonTab;