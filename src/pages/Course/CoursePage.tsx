import { useEffect, useState } from "react";
import { getCourses, createCourse, updateCourse, deleteCourse } from "../../services/course.service";
import "./CoursePage.css";
import axios from "axios";
import { FaPlus, FaSearch, FaEye, FaEdit, FaTrash, FaImage, FaBook } from "react-icons/fa";
import { useNavigate } from "react-router";

function CoursePage() {

    const [courses, setCourses] = useState([]);
    const [search, setSearch] = useState("");
    const [editingId, setEditingId] = useState("");
    const [selectedCourse, setSelectedCourse] = useState<any>(null);
    const navigate = useNavigate();

    const [form, setForm] = useState({
        Name: "",
        Description: "",
        Time: "",
        Fee: 0,
        Thumbnail: "",
        Status: true,
        IsOpen: true,
    });

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            const data = await getCourses();
            setCourses(data);
        } catch (error) {
            console.log(error);
        }
    };

    const handleView = (course: any) => {
        setSelectedCourse(course);
    };

    const filteredCourses = courses.filter((course: any) =>
        course.Name.toLowerCase().includes(search.toLowerCase())
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setForm({
            ...form,
            [name]: name === "Fee" ? Number(value) : value,
        });
    };

    const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({
            ...form,
            [e.target.name]: e.target.checked,
        });
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "ielts-web");
        try {
            const response = await axios.post(
                "https://api.cloudinary.com/v1_1/hgjoncad/image/upload",
                formData
            );
            setForm({
                ...form,
                Thumbnail: response.data.secure_url
            });
        } catch (error) {
            console.log(error);
            alert("Upload image failed");
        }

    };
    const handleSave = async () => {
        try {

            if (editingId === "") {
                await createCourse(form);
                alert("Create Success");
            } else {
                await updateCourse(editingId, form);
                alert("Update Success");
            }

            resetForm();
            loadCourses();

        } catch (error) {
            console.log(error);
        }
    };

    const handleEdit = (course: any) => {

        setEditingId(course._id);

        setForm({
            Name: course.Name,
            Description: course.Description,
            Time: course.Time.substring(0, 10),
            Fee: course.Fee,
            Thumbnail: course.Thumbnail,
            Status: course.Status,
            IsOpen: course.IsOpen,
        });
    };

    const handleDelete = async (id: string) => {

        if (!window.confirm("Delete this course?")) {
            return;
        }

        try {
            await deleteCourse(id);
            alert("Delete Success");
            loadCourses();
        } catch (error) {
            console.log(error);
        }
    };

    const resetForm = () => {

        setEditingId("");

        setForm({
            Name: "",
            Description: "",
            Time: "",
            Fee: 0,
            Thumbnail: "",
            Status: true,
            IsOpen: true,
        });
    };

    return (
        <div className="container-fluid py-4">

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center flex-wrap mb-4">

                <div>
                    <h2 className="fw-bold text-primary mb-1">
                        Course Management
                    </h2>

                    <p className="text-muted mb-0">
                        Manage all IELTS courses
                    </p>
                </div>

                <button
                    className="btn btn-primary px-4 rounded-pill"
                    onClick={resetForm}
                >
                    <FaPlus className="me-2" />
                    New Course
                </button>

            </div>

            {/* Form */}

            <div className="card border-0 shadow-lg rounded-4 mb-4">

                <div className="card-header bg-white border-0 pt-4">

                    <h4 className="fw-bold text-white">

                        {editingId ? "Update Course" : "Create Course"}

                    </h4>

                </div>

                <div className="card-body">

                    <div className="row g-3">

                        <div className="col-lg-6">

                            <label className="form-label">
                                Course Name
                            </label>

                            <input
                                className="form-control"
                                name="Name"
                                value={form.Name}
                                onChange={handleChange}
                                placeholder="Enter course name"
                            />

                        </div>

                        <div className="col-lg-6">

                            <label className="form-label">
                                Fee
                            </label>

                            <input
                                type="number"
                                className="form-control"
                                name="Fee"
                                value={form.Fee}
                                onChange={handleChange}
                                placeholder="Course Fee"
                            />

                        </div>

                        <div className="col-lg-6">

                            <label className="form-label">
                                Description
                            </label>

                            <input
                                className="form-control"
                                name="Description"
                                value={form.Description}
                                onChange={handleChange}
                                placeholder="Description"
                            />

                        </div>

                        <div className="col-lg-6">

                            <label className="form-label">
                                Date
                            </label>

                            <input
                                type="date"
                                className="form-control"
                                name="Time"
                                value={form.Time}
                                onChange={handleChange}
                            />

                        </div>

                    </div>

                    {/* Upload */}

                    <div className="upload-area mt-4">

                        <FaImage size={40} className="text-primary mb-3" />

                        <input
                            className="form-control"
                            type="file"
                            accept="image/*"
                            onChange={handleUpload}
                        />

                        {form.Thumbnail && (

                            <img
                                src={form.Thumbnail}
                                className="preview-image mt-3"
                                alt=""
                            />

                        )}

                    </div>

                    <div className="row mt-4">

                        <div className="col-md-6">

                            <div className="form-check">

                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="Status"
                                    checked={form.Status}
                                    onChange={handleCheckbox}
                                />

                                <label className="form-check-label">

                                    Active

                                </label>

                            </div>

                        </div>

                        <div className="col-md-6">

                            <div className="form-check">

                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="IsOpen"
                                    checked={form.IsOpen}
                                    onChange={handleCheckbox}
                                />

                                <label className="form-check-label">

                                    Open Registration

                                </label>

                            </div>

                        </div>

                    </div>

                    <div className="mt-4 d-flex gap-3">

                        <button
                            className="btn btn-primary px-4"
                            onClick={handleSave}
                        >

                            {editingId ? "Update" : "Create"}

                        </button>

                        <button
                            className="btn btn-outline-secondary px-4"
                            onClick={resetForm}
                        >

                            Cancel

                        </button>

                    </div>

                </div>

            </div>
            <div className="search-box mt-3 mt-lg-0">

                <div className="input-group">

                    <span className="input-group-text">

                        <FaSearch />

                    </span>

                    <input
                        className="form-control"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                </div>

            </div>

            {/* Table */}

            <div className="card border-0 shadow-lg rounded-4">

                <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center flex-wrap">

                    <h4 className="fw-bold mb-0 text-white">

                        Course List

                    </h4>



                </div>

                <div className="table-responsive">

                    <table className="table table-hover align-middle mb-0">

                        <thead className="table-primary">

                            <tr>

                                <th>Name</th>

                                <th>Fee</th>

                                <th>Status</th>

                                <th>Open</th>

                                <th>Created By</th>

                                <th style={{ width: "180px" }}>
                                    Actions
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {filteredCourses.map((course: any) => (

                                <tr key={course._id}>

                                    <td>{course.Name}</td>

                                    <td>{course.Fee.toLocaleString()} VNĐ</td>

                                    <td>

                                        <span className={`badge ${course.Status ? "bg-success" : "bg-danger"}`}>

                                            {course.Status ? "Active" : "Inactive"}

                                        </span>

                                    </td>

                                    <td>

                                        <span className={`badge ${course.IsOpen ? "bg-primary" : "bg-secondary"}`}>

                                            {course.IsOpen ? "Open" : "Close"}

                                        </span>

                                    </td>

                                    <td>

                                        {course.UserCreate.Email}

                                    </td>

                                    <td>
                                        <div className="d-flex justify-content-center gap-2 flex-nowrap">
                                            <button
                                                className="btn btn-primary btn-sm me-2"
                                                onClick={() => navigate(`/admin/courses/${course._id}`)}
                                            >
                                                <FaBook className="me-1" />

                                            </button>
                                            <button
                                                className="btn btn-info btn-sm me-2"
                                                onClick={() => handleView(course)}
                                            >
                                                <FaEye />
                                            </button>
                                            <button
                                                className="btn btn-warning btn-sm me-2"
                                                onClick={() => handleEdit(course)}
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleDelete(course._id)}
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            </div>

            {/* Modal */}

            {selectedCourse && (

                <div className="modal-overlay">

                    <div className="course-modal">

                        <div className="modal-header">

                            <h3>Course Detail</h3>

                            <button
                                className="btn-close"
                                onClick={() => setSelectedCourse(null)}
                            />

                        </div>

                        <div className="modal-body">

                            <img
                                src={selectedCourse.Thumbnail}
                                className="course-image mb-4"
                                alt=""
                            />

                            <div className="row">

                                <div className="col-md-6">

                                    <p><strong>Name:</strong> {selectedCourse.Name}</p>

                                    <p><strong>Fee:</strong> {selectedCourse.Fee.toLocaleString()} VNĐ</p>

                                    <p><strong>Status:</strong> {selectedCourse.Status ? "Active" : "Inactive"}</p>

                                </div>

                                <div className="col-md-6">

                                    <p><strong>Open:</strong> {selectedCourse.IsOpen ? "Open" : "Close"}</p>

                                    <p><strong>Date:</strong> {new Date(selectedCourse.Time).toLocaleDateString()}</p>

                                    <p><strong>Created By:</strong> {selectedCourse.UserCreate.Email}</p>

                                </div>

                            </div>

                            <hr />

                            <p>

                                {selectedCourse.Description}

                            </p>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default CoursePage;