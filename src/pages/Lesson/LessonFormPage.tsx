import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    createLesson,
    getLessonById,
    updateLesson
} from "../../services/lesson.service";
import type { Lesson } from "../../types/lesson";

function LessonFormPage() {

    const navigate = useNavigate();
    const { courseId, lessonId } = useParams();
    const isEdit = !!lessonId;
    const [lesson, setLesson] = useState<Omit<Lesson, "Details">>({
        Name: "",
        Description: "",
        Time: "",
        Unit: "",
        CourseID: courseId || "",
        Status: "Draft",
        IsOpen: false
    });

    useEffect(() => {
        if (!lessonId) return;

        let cancelled = false;

        getLessonById(lessonId).then(res => {
            if (cancelled) return;

            setLesson({
                Name: res.Lesson.Name,
                Description: res.Lesson.Description,
                Time: res.Lesson.Time,
                Unit: res.Lesson.Unit,
                CourseID: res.Lesson.CourseID?._id || res.Lesson.CourseID || courseId || "",
                Status: res.Lesson.Status,
                IsOpen: res.Lesson.IsOpen,
                IsDeleted: res.Lesson.IsDeleted
            });
        }).catch(error => {
            console.error("Load lesson error:", error);
        });

        return () => {
            cancelled = true;
        };
    }, [courseId, lessonId]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {

        const { name, value } = e.target;

        setLesson(prev => ({
            ...prev,
            [name]: value
        }));



    }

    function handleCheckbox(e: React.ChangeEvent<HTMLInputElement>) {

        setLesson(prev => ({
            ...prev,
            IsOpen: e.target.checked
        }));

    }

    async function handleSubmit(e: React.FormEvent) {

        e.preventDefault();

        try {

            if (!lesson.Name.trim()) {
                alert("Lesson name is required.");
                return;
            }

            if (!lesson.Description.trim()) {
                alert("Description is required.");
                return;
            }

            if (!lesson.Unit.trim()) {
                alert("Unit is required.");
                return;
            }

            if (!lesson.CourseID) {
                alert("Course is required.");
                return;
            }

            const lessonPayload: Omit<Lesson, "Details"> = {
                Name: lesson.Name,
                Description: lesson.Description,
                Time: lesson.Time,
                Unit: lesson.Unit,
                CourseID: lesson.CourseID,
                Status: lesson.Status,
                IsOpen: lesson.IsOpen,
                ...(lesson.IsDeleted === undefined ? {} : { IsDeleted: lesson.IsDeleted })
            };
            let savedLessonId = lessonId;

            if (isEdit) {

                const response = await updateLesson(
                    lessonId!,
                    lessonPayload
                );

                console.log("Update lesson:", response);

            } else {

                const response = await createLesson(
                    lessonPayload
                );

                console.log("Create lesson:", response);
                savedLessonId = response?.lesson?._id || response?.data?.lesson?._id;
            }

            alert(
                isEdit
                    ? "Lesson updated successfully!"
                    : "Lesson created successfully!"
            );

            navigate(savedLessonId
                ? `/admin/courses/${courseId}/lessons/${savedLessonId}/details`
                : `/admin/courses/${courseId}?tab=lessons`);

        } catch (err: unknown) {

            console.error("Save lesson error:", err);

            const errorDetails = err as {
                response?: { data?: { message?: string } };
                message?: string;
            };
            const message =
                errorDetails?.response?.data?.message ||
                errorDetails?.message ||
                "Failed to save lesson.";

            alert(message);
        }
    }

    return (

        <div className="container mt-4">

            <div className="card">

                <div className="card-header text-white">

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
        </div>




    );




}



export default LessonFormPage;