import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    createLesson,
    getLessonById,
    updateLesson
} from "../../services/lesson.service";
import type { Lesson, LessonDetail } from "../../types/lesson";
import axios from "axios";

function LessonFormPage() {

    const navigate = useNavigate();
    const { courseId, lessonId } = useParams();
    const isEdit = !!lessonId;
    const [uploading, setUploading] = useState(false);
    const [lesson, setLesson] = useState<Lesson>({
        Name: "",
        Description: "",
        Time: "",
        Unit: "",
        CourseID: courseId || "",
        Status: "Draft",
        IsOpen: false,
        Details: []
    });
    const emptyDetail: LessonDetail = {
        Title: "",
        Content: "",
        Type: "Text",
        FileUrl: "",
        Thumbnail: "",
        Duration: 0,
        Oder: 1,
        Status: true
    };
    const [showModal, setShowModal] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [detail, setDetail] = useState<LessonDetail>(emptyDetail);

    useEffect(() => {

        if (isEdit) {
            loadLesson();
        }
    }, []);

    async function loadLesson() {

        try {

            const res = await getLessonById(lessonId!);

            setLesson({
                ...res.Lesson,
                Details: res.Details
            });

        }
        catch (err) {
            console.log(err);
        }

    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {

        const { name, value } = e.target;

        setLesson(prev => ({
            ...prev,
            [name]: value
        }));

    }

    function handleDetailChange(
        e: React.ChangeEvent<
            HTMLInputElement |
            HTMLTextAreaElement |
            HTMLSelectElement
        >
    ) {
        const { name, value, type } = e.target;

        setDetail(prev => ({
            ...prev,
            [name]:
                type === "checkbox"
                    ? (e.target as HTMLInputElement).checked
                    : name === "Duration" || name === "Oder"
                        ? Number(value)
                        : value
        }));
    }

    function handleCheckbox(e: React.ChangeEvent<HTMLInputElement>) {

        setLesson(prev => ({
            ...prev,
            IsOpen: e.target.checked
        }));

    }

    function handleAddContent() {

        setEditingIndex(null);

        setDetail({
            ...emptyDetail,
            Oder: lesson.Details.length + 1
        });

        setShowModal(true);

    }

    function handleEditContent(index: number) {

        setEditingIndex(index);

        setDetail(lesson.Details[index]);

        setShowModal(true);

    }

    function handleDeleteContent(index: number) {

        if (!window.confirm("Delete content?")) return;

        setLesson(prev => ({
            ...prev,
            Details: prev.Details.filter((_, i) => i !== index)
        }));

    }

    function handleSaveContent() {

        if (editingIndex === null) {

            setLesson(prev => ({
                ...prev,
                Details: [...prev.Details, detail]
            }));

        } else {

            const arr = [...lesson.Details];

            arr[editingIndex] = detail;

            setLesson(prev => ({
                ...prev,
                Details: arr
            }));

        }

        setShowModal(false);

    }

    async function handleSubmit(e: React.FormEvent) {

        e.preventDefault();
        try {
            if (isEdit) {

                await updateLesson(lessonId!, lesson);
            }
            else {
                await createLesson(lesson);
            }
            navigate(`/admin/courses/${courseId}?tab=lessons`);

        }
        catch (err) {
            console.log(err);
        }

    }

    async function handleUpload(
        e: React.ChangeEvent<HTMLInputElement>,
        field: "FileUrl" | "Thumbnail"
    ) {

        if (!e.target.files?.length) return;

        const file = e.target.files[0];

        const formData = new FormData();

        formData.append("file", file);
        formData.append("upload_preset", "ielts-web");

        try {

            setUploading(true);

            const res = await axios.post(
                "https://api.cloudinary.com/v1_1/hgjoncad/auto/upload",
                formData
            );

            setDetail(prev => ({
                ...prev,
                [field]: res.data.secure_url
            }));

        }
        catch {

            alert("Upload failed");

        }
        finally {

            setUploading(false);

        }

    }

    return (

        <div className="container mt-4">

            <div className="card">

                <div className="card-header">

                    <h3>

                        {isEdit ? "Update Lesson" : "Create Lesson"}

                    </h3>

                </div>

                <div className="card-body">

                    <form onSubmit={handleSubmit}>

                        <div className="mb-3">

                            <label>Name</label>

                            <input
                                className="form-control"
                                name="Name"
                                value={lesson.Name}
                                onChange={handleChange}
                            />

                        </div>

                        <div className="mb-3">

                            <label>Description</label>

                            <textarea
                                className="form-control"
                                name="Description"
                                value={lesson.Description}
                                onChange={handleChange}
                            />

                        </div>

                        <div className="row">

                            <div className="col-md-4">

                                <label>Unit</label>

                                <input
                                    className="form-control"
                                    name="Unit"
                                    value={lesson.Unit}
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="col-md-4">

                                <label>Date</label>

                                <input
                                    type="date"
                                    className="form-control"
                                    name="Time"
                                    value={lesson.Time?.substring(0, 10)}
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="col-md-4">

                                <label>Status</label>

                                <select
                                    className="form-select"
                                    name="Status"
                                    value={lesson.Status}
                                    onChange={handleChange}
                                >

                                    <option value="Draft">Draft</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Active">Active</option>
                                    <option value="Finished">Finished</option>

                                </select>

                            </div>

                        </div>

                        <div className="form-check mt-3">

                            <input
                                className="form-check-input"
                                type="checkbox"
                                checked={lesson.IsOpen}
                                onChange={handleCheckbox}
                            />

                            <label className="form-check-label">

                                Open Lesson

                            </label>

                        </div>

                        <hr className="my-4" />

                        <div className="d-flex justify-content-between align-items-center mb-3">

                            <h4>Lesson Contents</h4>

                            <button
                                type="button"
                                className="btn btn-success"
                                onClick={handleAddContent}
                            >
                                + Add Content
                            </button>

                        </div>

                        <table className="table table-hover align-middle">

                            <thead>

                                <tr>

                                    <th>Title</th>

                                    <th>Type</th>

                                    <th>Duration</th>

                                    <th>Order</th>

                                    <th ></th>

                                </tr>

                            </thead>

                            <tbody>

                                {

                                    lesson.Details.length === 0 ?

                                        <tr>

                                            <td
                                                colSpan={5}
                                                className="text-center text-muted"
                                            >

                                                No content

                                            </td>

                                        </tr>

                                        :

                                        lesson.Details.map((item, index) => (

                                            <tr key={index}>

                                                <td>{item.Title}</td>

                                                <td>{item.Type}</td>

                                                <td>{item.Duration}s</td>

                                                <td>{item.Oder}</td>

                                                <td>

                                                    <button
                                                        type="button"
                                                        className="btn btn-warning btn-sm me-2"
                                                        onClick={() => handleEditContent(index)}
                                                    >

                                                        Edit

                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleDeleteContent(index)}
                                                    >

                                                        Delete

                                                    </button>

                                                </td>

                                            </tr>

                                        ))

                                }

                            </tbody>

                        </table>

                        <div className="mt-4">

                            <button
                                className="btn btn-primary me-2"
                                type="submit"
                            >

                                Save

                            </button>

                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => navigate(-1)}
                            >

                                Cancel

                            </button>

                        </div>

                    </form>

                </div>

            </div>
            {
                showModal && (

                    <div className="modal d-block">

                        <div className="modal-dialog modal-lg">

                            <div className="modal-content">

                                <div className="modal-header">

                                    <h5>

                                        {editingIndex === null ? "Add Content" : "Edit Content"}

                                    </h5>

                                </div>

                                <div className="modal-body">

                                    <div className="mb-3">

                                        <label className="form-label">
                                            Title
                                        </label>

                                        <input
                                            className="form-control"
                                            value={detail.Title}
                                            onChange={(e) =>
                                                setDetail({
                                                    ...detail,
                                                    Title: e.target.value
                                                })
                                            }
                                        />

                                    </div>

                                    <div className="mb-3">

                                        <label className="form-label">

                                            Type

                                        </label>

                                        <select
                                            className="form-select"
                                            name="Type"
                                            value={detail.Type}
                                            onChange={handleDetailChange}
                                        >

                                            <option value="Text">Text</option>
                                            <option value="Video">Video</option>
                                            <option value="Audio">Audio</option>
                                            <option value="PDF">PDF</option>
                                            <option value="Image">Image</option>
                                            <option value="Quiz">Quiz</option>

                                        </select>

                                    </div>

                                    <div className="mb-3">

                                        {(detail.Type === "Text" || detail.Type === "Quiz") && (

                                            <div className="mb-3">

                                                <label className="form-label">

                                                    Content

                                                </label>

                                                <textarea
                                                    rows={8}
                                                    className="form-control"
                                                    name="Content"
                                                    value={detail.Content}
                                                    onChange={(e) =>
                                                        setDetail({
                                                            ...detail,
                                                            Content: e.target.value
                                                        })
                                                    }
                                                />

                                            </div>

                                        )}

                                    </div>

                                    <div className="row">

                                        <div className="col-md-6 mb-3">

                                            {detail.Type !== "Text" && detail.Type !== "Quiz" && (

                                                <div className="mb-3">

                                                    <label className="form-label">

                                                        Upload File

                                                    </label>

                                                    <input
                                                        type="file"
                                                        className="form-control"
                                                        onChange={(e) => handleUpload(e, "FileUrl")}
                                                    />

                                                    {uploading && (

                                                        <small className="text-primary">

                                                            Uploading...

                                                        </small>

                                                    )}

                                                    {detail.FileUrl && (

                                                        <div className="mt-2">

                                                            <a
                                                                href={detail.FileUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                            >
                                                                View uploaded file
                                                            </a>

                                                        </div>

                                                    )}

                                                </div>

                                            )}

                                            {(detail.Type === "Video" || detail.Type === "Audio") && (

                                                <div className="mb-3">

                                                    <label className="form-label">

                                                        Duration (seconds)

                                                    </label>

                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        name="Duration"
                                                        value={detail.Duration}
                                                        onChange={(e) =>
                                                            setDetail({
                                                                ...detail,
                                                                Duration: Number(e.target.value)
                                                            })
                                                        }
                                                    />

                                                </div>

                                            )}

                                        </div>



                                    </div>

                                    <div className="row">

                                        <div className="col-md-4 mb-3">

                                            <label className="form-label">
                                                Duration (seconds)
                                            </label>

                                            <input
                                                type="number"
                                                className="form-control"
                                                value={detail.Duration}
                                                onChange={(e) =>
                                                    setDetail({
                                                        ...detail,
                                                        Duration: Number(e.target.value)
                                                    })
                                                }
                                            />

                                        </div>

                                        <div className="col-md-4 mb-3">

                                            <label className="form-label">
                                                Oder
                                            </label>

                                            <input
                                                type="number"
                                                className="form-control"
                                                value={detail.Oder}
                                                onChange={(e) =>
                                                    setDetail({
                                                        ...detail,
                                                        Oder: Number(e.target.value)
                                                    })
                                                }
                                            />

                                        </div>

                                        <div className="col-md-4 d-flex align-items-end">

                                            <div className="form-check mb-2">

                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={detail.Status}
                                                    onChange={(e) =>
                                                        setDetail({
                                                            ...detail,
                                                            Status: e.target.checked
                                                        })
                                                    }
                                                />

                                                <label className="form-check-label">
                                                    Active
                                                </label>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                                <div className="modal-footer">

                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setShowModal(false)}
                                    >

                                        Cancel

                                    </button>

                                    <button
                                        className="btn btn-primary"
                                        onClick={handleSaveContent}
                                    >

                                        Save

                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                )
            }

        </div>




    );




}



export default LessonFormPage;