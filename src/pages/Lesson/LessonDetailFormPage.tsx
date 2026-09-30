import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaSave } from "react-icons/fa";
import axios from "axios";

import {
    createLessonDetail,
    updateLessonDetail,
    getLessonDetailById
} from "../../services/lesson.service";

import type { LessonDetail } from "../../types/lesson";

function LessonDetailFormPage() {

    const { courseId, lessonId, detailId } = useParams();
    const navigate = useNavigate();
    const isEdit = !!detailId;
    const [uploading, setUploading] = useState(false);
    const [form, setForm] = useState<LessonDetail>({
        LessonID: lessonId!,
        Title: "",
        Content: "",
        Type: "Text",
        FileUrl: "",
        Thumbnail: "",
        Duration: 0,
        Order: 1,
        Status: true
    });

    useEffect(() => {

        if (isEdit) {

            loadDetail();

        }

    }, []);

    async function loadDetail() {

        const data = await getLessonDetailById(detailId!);

        setForm(data);

    }

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) {

        const { name, value, type } = e.target;

        setForm(prev => ({
            ...prev,
            [name]:
                type === "checkbox"
                    ? (e.target as HTMLInputElement).checked
                    : name === "Duration" || name === "Order"
                        ? Number(value)
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

        if (!e.target.files?.length) return;

        const file = e.target.files[0];

        const formData = new FormData();

        formData.append("file", file);

        formData.append("upload_preset", "ielts-web");

        try {

            setUploading(true);

            let url = "";

            if (form.Type === "Image") {

                const res = await axios.post(
                    "https://api.cloudinary.com/v1_1/hgjoncad/image/upload",
                    formData
                );

                url = res.data.secure_url;

            } else {

                const res = await axios.post(
                    "https://api.cloudinary.com/v1_1/hgjoncad/auto/upload",
                    formData
                );

                url = res.data.secure_url;

            }

            setForm(prev => ({
                ...prev,
                FileUrl: url,
                Thumbnail: url
            }));

        } catch (err) {

            console.log(err);

            alert("Upload failed");

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
                Back
            </button>

            <div className="card shadow">

                <div className="card-header">

                    <h4 className="mb-0 text-white ">

                        {isEdit ? "Edit Lesson Content" : "Create Lesson Content"}

                    </h4>

                </div>

                <div className="card-body">

                    <form onSubmit={handleSubmit}>


                        <div className="mb-3">

                            <label className="form-label">

                                Type

                            </label>

                            <select
                                className="form-select"
                                name="Type"
                                value={form.Type}
                                onChange={handleChange}
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

                            {
                                (form.Type === "Text" || form.Type === "Quiz") && (

                                    <div className="mb-3">

                                        <label className="form-label">

                                            Content

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

                                                Upload File

                                            </label>

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

                                                    Uploading...

                                                </div>
                                            }

                                            {
                                                form.FileUrl &&
                                                <div className="text-success mt-2">

                                                    ✓ Uploaded successfully

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

                                        Active

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

                                Save

                            </button>

                        </div>

                    </form>

                </div>

            </div>

        </div>

    );

}

export default LessonDetailFormPage;