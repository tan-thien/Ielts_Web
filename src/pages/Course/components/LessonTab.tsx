import { FaBookOpen, FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";

interface Props {
    lessons: any[];
    onDelete: (id: string) => void;
}

function LessonTab({
    lessons,
    onDelete
}: Props) {

    const navigate = useNavigate();
    const { courseId } = useParams();

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">
                    Lesson List
                </h4>

                <button
                    className="btn btn-primary"
                    onClick={() =>
                        navigate(`/admin/courses/${courseId}/lessons/create`)
                    }
                >
                    <FaPlus className="me-2" />
                    New Lesson
                </button>
            </div>

            <table className="table table-hover align-middle">

                <thead className="table-light">
                    <tr>
                        <th>Name</th>
                        <th>Unit</th>
                        <th>Status</th>
                        <th>Open</th>
                        <th >Action</th>
                    </tr>
                </thead>

                <tbody>

                    {
                        lessons.length > 0 ? (

                            lessons.map((lesson) => (

                                <tr key={lesson._id}>

                                    <td>{lesson.Name}</td>

                                    <td>{lesson.Unit}</td>

                                    <td>
                                        <span
                                            className={`badge ${lesson.Status === "Active"
                                                    ? "bg-success"
                                                    : lesson.Status === "Pending"
                                                        ? "bg-warning text-dark"
                                                        : lesson.Status === "Finished"
                                                            ? "bg-secondary"
                                                            : "bg-dark"
                                                }`}
                                        >
                                            {lesson.Status}
                                        </span>
                                    </td>

                                    <td>
                                        <span
                                            className={`badge ${lesson.IsOpen
                                                    ? "bg-primary"
                                                    : "bg-danger"
                                                }`}
                                        >
                                            {lesson.IsOpen ? "Open" : "Closed"}
                                        </span>
                                    </td>

                                    <td>
                                        <button
                                            className="btn btn-primary btn-sm me-2"
                                            onClick={() =>
                                                navigate(
                                                    `/admin/courses/${courseId}/lessons/${lesson._id}/details`
                                                )
                                            }
                                        >
                                            <FaBookOpen />
                                        </button>
                                        <button
                                            className="btn btn-warning btn-sm me-2"
                                            onClick={() =>
                                                navigate(
                                                    `/admin/courses/${courseId}/lessons/${lesson._id}/edit`
                                                )
                                            }
                                        >
                                            <FaEdit />
                                        </button>

                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() =>
                                                onDelete(lesson._id)
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
                                    No lessons found.
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