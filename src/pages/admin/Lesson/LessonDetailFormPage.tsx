import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaSave } from "react-icons/fa";
import { uploadCloudinaryResource } from "../../../services/cloudinary.service";

import {
    createLessonDetail,
    updateLessonDetail,
    getLessonDetailById
} from "../../../services/lesson.service";

import type { LessonDetailPayload } from "../../../types/lesson";

function LessonDetailFormPage() {

    const { courseId, lessonId, detailId } = useParams();
    const navigate = useNavigate();
    const isEdit = !!detailId;
    const [uploading, setUploading] = useState(false);
    const [form, setForm] = useState<LessonDetailPayload>({
        LessonID: lessonId || "",
        Content: "",
        Type: "Text",
        FileUrl: "",
        Status: true
    });

    useEffect(() => {
        if (!detailId) return;

        let cancelled = false;

        getLessonDetailById(detailId).then(data => {
            if (!cancelled) {
                setForm({
                    LessonID: data.LessonID || lessonId || "",
                    Content: data.Content || "",
                    Type: data.Type || "Text",
                    FileUrl: data.FileUrl || "",
                    Status: data.Status ?? true
                });
            }
        }).catch(error => {
            console.error("Load lesson detail error:", error);
            alert("Không thể tải nội dung bài học.");
        });

        return () => {
            cancelled = true;
        };
    }, [detailId, lessonId]);

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) {

        const { name, value, type } = e.target;

        setForm(prev => ({
            ...prev,
            [name]:
                type === "checkbox"
                    ? (e.target as HTMLInputElement).checked
                    : value
        }));

    }

    async function handleSubmit(e: React.FormEvent) {

        e.preventDefault();

        if (isEdit) {

            await updateLessonDetail(detailId!, form);

        }
        else {

            await createLessonDetail(form);

        }

        navigate(`/admin/courses/${courseId}/lessons/${lessonId}/details`);

    }

    const handleUpload = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {

        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = "";

        try {

            setUploading(true);

            if (form.Type === "Text" || form.Type === "Quiz") {
                throw new Error("Loại nội dung này không hỗ trợ tải tệp lên.");
            }
            const url = await uploadCloudinaryResource(file, form.Type);
            setForm(prev => ({ ...prev, FileUrl: url }));

        } catch (err) {

            console.log(err);

            alert(err instanceof Error ? err.message : "Tải tệp lên không thành công.");

        } finally {

            setUploading(false);

        }

    };

    return (

        <div className="container py-4">

            <button
                className="btn btn-outline-secondary mb-4"
                onClick={() =>
                    navigate(`/admin/courses/${courseId}/lessons/${lessonId}/details`)
                }
            >
                <FaArrowLeft className="me-2" />
                Quay lại
            </button>

            <div className="card shadow">

                <div className="card-header">

                    <h4 className="mb-0 text-white ">

                        {isEdit ? "Chỉnh sửa nội dung bài học" : "Thêm nội dung bài học"}

                    </h4>

                </div>

                <div className="card-body">

                    <form onSubmit={handleSubmit}>


                        <div className="mb-3">

                            <label className="form-label">

                                Loại nội dung

                            </label>

                            <select
                                className="form-select"
                                name="Type"
                                value={form.Type}
                                onChange={handleChange}
                            >

                                <option value="Text">Văn bản</option>

                                <option value="Video">Video</option>

                                <option value="Audio">Âm thanh</option>

                                <option value="PDF">Tài liệu PDF</option>

                                <option value="Image">Hình ảnh</option>

                                <option value="Quiz">Câu hỏi</option>

                            </select>

                        </div>

                        <div className="mb-3">

                            {
                                (form.Type === "Text" || form.Type === "Quiz") && (

                                    <div className="mb-3">

                                        <label className="form-label">

                                            Nội dung

                                        </label>

                                        <textarea
                                            rows={6}
                                            className="form-control"
                                            name="Content"
                                            value={form.Content}
                                            onChange={handleChange}
                                        />

                                    </div>

                                )
                            }

                        </div>

                        <div className="row">

                            <div className="col-md-6 mb-3">



                                {
                                    form.Type !== "Text" &&
                                    form.Type !== "Quiz" && (

                                        <div className="mb-3">
                                            
                                            <label className="form-label">

                                                Tải tệp lên

                                            </label>

                                            <input
                                                type="url"
                                                className="form-control mb-2"
                                                name="FileUrl"
                                                value={form.FileUrl}
                                                onChange={handleChange}
                                                placeholder="Dán đường dẫn tệp (https://...)"
                                            />

                                            <input
                                                type="file"
                                                className="form-control"
                                                accept={
                                                    form.Type === "Image"
                                                        ? "image/*"
                                                        : form.Type === "Video"
                                                            ? "video/*"
                                                            : form.Type === "Audio"
                                                                ? "audio/*"
                                                                : form.Type === "PDF"
                                                                    ? ".pdf"
                                                                    : "*"
                                                }
                                                onChange={handleUpload}
                                            />

                                            {
                                                uploading &&
                                                <div className="text-primary mt-2">

                                                    Đang tải lên...

                                                </div>
                                            }

                                            {
                                                form.FileUrl &&
                                                <div className="text-success mt-2">

                                                    ✓ Tải lên thành công

                                                </div>
                                            }

                                        </div>

                                    )
                                }

                            </div>

                            <div className="col-md-6 mb-3">

                                {
                                    form.Type === "Image" &&
                                    form.FileUrl && (

                                        <div className="mb-3">

                                            <img
                                                src={form.FileUrl}
                                                className="img-thumbnail"
                                                style={{
                                                    width: 250,
                                                    borderRadius: 10
                                                }}
                                            />

                                        </div>

                                    )
                                }

                            </div>

                        </div>

                        <div className="row">



                            <div className="col-md-4 d-flex align-items-center">

                                <div className="form-check mt-4">

                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={form.Status}
                                        name="Status"
                                        onChange={handleChange}
                                    />

                                    <label className="form-check-label">

                                        Đang hoạt động

                                    </label>

                                </div>

                            </div>

                        </div>

                        <div className="text-end">

                            <button
                                className="btn btn-primary"
                                type="submit"
                            >

                                <FaSave className="me-2" />

                                Lưu nội dung

                            </button>

                        </div>

                    </form>

                </div>

            </div>

        </div>

    );

}

export default LessonDetailFormPage;
