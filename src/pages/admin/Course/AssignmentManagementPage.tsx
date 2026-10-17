import { useCallback, useEffect, useMemo, useState } from "react";
import { getCourses } from "../../../services/course.service";
import { getAssignments } from "../../../services/assignment.service";
import { getAllLessons } from "../../../services/lesson.service";
import type { Assignment } from "../../../types/assignment";
import type { Course } from "../../../types/course";
import type { LessonWithCourse } from "../../../types/lesson";
import AssignmentTab from "./components/AssignmentTab";

function AssignmentManagementPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState("");
    const [lessons, setLessons] = useState<LessonWithCourse[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setLoadError("");
        try {
            const [courseData, lessonData, assignmentData] = await Promise.all([
                getCourses(),
                getAllLessons(),
                getAssignments(),
            ]);
            setCourses(courseData);
            setLessons(lessonData);
            setAssignments(assignmentData);
            setSelectedCourseId((current) => current || courseData[0]?._id || "");
        } catch (error) {
            console.error("Load assignment management data error:", error);
            setLoadError("Failed to load assignment management data. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        Promise.all([getCourses(), getAllLessons(), getAssignments()])
            .then(([courseData, lessonData, assignmentData]) => {
                setCourses(courseData);
                setLessons(lessonData);
                setAssignments(assignmentData);
                setSelectedCourseId((current) => current || courseData[0]?._id || "");
            })
            .catch((error) => {
                console.error("Load assignment management data error:", error);
                setLoadError("Failed to load assignment management data. Please try again.");
            })
            .finally(() => setIsLoading(false));
    }, []);

    const courseLessons = useMemo(
        () => lessons.filter((lesson) =>
            (typeof lesson.CourseID === "string" ? lesson.CourseID : lesson.CourseID?._id) === selectedCourseId
        ),
        [lessons, selectedCourseId]
    );
    const searchedAssignments = useMemo(() => {
        const query = search.trim().toLocaleLowerCase();
        if (!query) return assignments;
        return assignments.filter((assignment) =>
            [assignment.Title, assignment.Description, assignment.Skill, assignment.AssignmentType]
                .some((value) => value?.toLocaleLowerCase().includes(query))
        );
    }, [assignments, search]);

    return (
        <div className="container-fluid py-4">
            <div className="mb-4">
                <h1 className="h3 mb-1">Assignment management</h1>
                <p className="text-muted mb-0">Create and manage course and lesson assignments.</p>
            </div>

            {loadError && (
                <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
                    {loadError}
                    <button className="btn btn-sm btn-outline-danger" onClick={() => void loadData()}>Retry</button>
                </div>
            )}

            <div className="card border-0 shadow-sm">
                <div className="card-body">
                    <div className="row g-3 mb-4">
                        <div className="col-md-6">
                            <label className="form-label" htmlFor="assignment-course">Course</label>
                            <select
                                id="assignment-course"
                                className="form-select"
                                value={selectedCourseId}
                                onChange={(event) => setSelectedCourseId(event.target.value)}
                                disabled={isLoading}
                            >
                                <option value="">Select a course</option>
                                {courses.map((course) => (
                                    <option key={course._id} value={course._id}>{course.Name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label" htmlFor="assignment-search">Search assignments</label>
                            <input
                                id="assignment-search"
                                className="form-control"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search by title, description, skill or type"
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-5">Loading assignments...</div>
                    ) : selectedCourseId ? (
                        <AssignmentTab
                            assignments={searchedAssignments}
                            lessons={courseLessons}
                            courseId={selectedCourseId}
                            loadError={loadError}
                            onChange={loadData}
                        />
                    ) : (
                        <div className="alert alert-info mb-0">Create a course before managing its assignments.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AssignmentManagementPage;
