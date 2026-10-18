import { useEffect, useState } from "react";
import { getCourses, createCourse, updateCourse, deleteCourse } from "../../../services/course.service";
import { uploadCloudinaryResource } from "../../../services/cloudinary.service";
import "./CoursePage.css";
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
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = "";

        try {
            const imageUrl = await uploadCloudinaryResource(file, "Image");
            setForm({
                ...form,
                Thumbnail: imageUrl
            });
        } catch (error) {
            console.log(error);
            alert(error instanceof Error ? error.message : "Tải ảnh lên không thành công.");
        }

    };
    const handleSave = async () => {
        try {

            if (editingId === "") {
                await createCourse(form);
                alert("Tạo khóa học thành công.");
            } else {
                await updateCourse(editingId, form);
                alert("Cập nhật khóa học thành công.");
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
            alert("Xóa khóa học thành công.");
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
                        Quản lý khóa học
                    </h2>

                    <p className="text-muted mb-0">
                        Quản lý các khóa học IELTS
                    </p>
                </div>

                <button
                    className="btn btn-primary px-4 rounded-pill"
                    onClick={resetForm}
                >
                    <FaPlus className="me-2" />
                    Thêm khóa học
                </button>

            </div>

            {/* Form */}

            <div className="card border-0 shadow-lg rounded-4 mb-4">

                <div className="card-header bg-white border-0 pt-4">

                    <h4 className="fw-bold text-white">

                        {editingId ? "Cập nhật khóa học" : "Tạo khóa học"}

                    </h4>

                </div>

                <div className="card-body">

                    <div className="row g-3">

                        <div className="col-lg-6">

                            <label className="form-label">
                                Tên khóa học
                            </label>

                            <input
                                className="form-control"
                                name="Name"
                                value={form.Name}
                                onChange={handleChange}
                                placeholder="Nhập tên khóa học"
                            />

                        </div>

                        <div className="col-lg-6">

                            <label className="form-label">
                                Học phí
                            </label>

                            <input
                                type="number"
                                className="form-control"
                                name="Fee"
                                value={form.Fee}
                                onChange={handleChange}
                                placeholder="Nhập học phí"
                            />

                        </div>

                        <div className="col-lg-6">

                            <label className="form-label">
                                Mô tả
                            </label>

                            <input
                                className="form-control"
                                name="Description"
                                value={form.Description}
                                onChange={handleChange}
                                placeholder="Nhập mô tả khóa học"
                            />

                        </div>

                        <div className="col-lg-6">

                            <label className="form-label">
                                Ngày khai giảng
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

                                    Đang hoạt động

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

                                    Mở đăng ký

                                </label>

                            </div>

                        </div>

                    </div>

                    <div className="mt-4 d-flex gap-3">

                        <button
                            className="btn btn-primary px-4"
                            onClick={handleSave}
                        >

                            {editingId ? "Cập nhật" : "Tạo khóa học"}

                        </button>

                        <button
                            className="btn btn-outline-secondary px-4"
                            onClick={resetForm}
                        >

                            Hủy

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
                        placeholder="Tìm kiếm khóa học..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                </div>

            </div>

            {/* Table */}

            <div className="card border-0 shadow-lg rounded-4">

                <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center flex-wrap">

                    <h4 className="fw-bold mb-0 text-white">

                        Danh sách khóa học

                    </h4>



                </div>

                <div className="table-responsive">

                    <table className="table table-hover align-middle mb-0">

                        <thead className="table-primary">

                            <tr>

                                <th>Tên khóa học</th>

                                <th>Học phí</th>

                                <th>Trạng thái</th>

                                <th>Đăng ký</th>

                                <th>Người tạo</th>

                                <th style={{ width: "180px" }}>
                                    Thao tác
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

                                            {course.Status ? "Đang hoạt động" : "Ngừng hoạt động"}

                                        </span>

                                    </td>

                                    <td>

                                        <span className={`badge ${course.IsOpen ? "bg-primary" : "bg-secondary"}`}>

                                            {course.IsOpen ? "Đang mở" : "Đang đóng"}

                                        </span>

                                    </td>

                                    <td>

                                        {course.UserCreate.Email}

                                    </td>

                                    <td>
                                        <div className="d-flex justify-content-center gap-2 flex-nowrap">
                                            <button
                                                className="btn btn-primary btn-sm me-2"
                                                title="Quản lý khóa học"
                                                onClick={() => navigate(`/admin/courses/${course._id}`)}
                                            >
                                                <FaBook className="me-1" />

                                            </button>
                                            <button
                                                className="btn btn-info btn-sm me-2"
                                                title="Xem chi tiết"
                                                onClick={() => handleView(course)}
                                            >
                                                <FaEye />
                                            </button>
                                            <button
                                                className="btn btn-warning btn-sm me-2"
                                                title="Chỉnh sửa khóa học"
                                                onClick={() => handleEdit(course)}
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                title="Xóa khóa học"
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

                            <h3>Chi tiết khóa học</h3>

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

                                    <p><strong>Tên khóa học:</strong> {selectedCourse.Name}</p>

                                    <p><strong>Học phí:</strong> {selectedCourse.Fee.toLocaleString()} VNĐ</p>

                                    <p><strong>Trạng thái:</strong> {selectedCourse.Status ? "Đang hoạt động" : "Ngừng hoạt động"}</p>

                                </div>

                                <div className="col-md-6">

                                    <p><strong>Đăng ký:</strong> {selectedCourse.IsOpen ? "Đang mở" : "Đang đóng"}</p>

                                    <p><strong>Ngày khai giảng:</strong> {new Date(selectedCourse.Time).toLocaleDateString("vi-VN")}</p>

                                    <p><strong>Người tạo:</strong> {selectedCourse.UserCreate.Email}</p>

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