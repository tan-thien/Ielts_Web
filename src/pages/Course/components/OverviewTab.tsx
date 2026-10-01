import { Card, ProgressBar, ListGroup } from "react-bootstrap";

interface Props {
    course: any;
    lessons: any[];
}

function OverviewTab({ course, lessons }: Props) {

    const totalLessons = lessons.length;
    const progress = totalLessons === 0 ? 0 : 35; // sau này lấy API

    return (

        <div className="row g-4">

            <div className="col-lg-8">

                <Card className="shadow-sm border-0">

                    <Card.Body>

                        <h5 className="mb-3">
                            Course Progress
                        </h5>

                        <ProgressBar
                            now={progress}
                            label={`${progress}%`}
                            style={{ height: 22 }}
                        />

                        <p className="text-muted mt-3 mb-0">
                            This course currently contains
                            <strong> {totalLessons} lessons</strong>.
                        </p>

                    </Card.Body>

                </Card>

            </div>

            <div className="col-lg-4">

                <Card className="shadow-sm border-0">

                    <Card.Body>

                        <h5>Course Information</h5>

                        <hr />

                        <p>
                            <strong>Fee:</strong>{" "}
                            {course?.Fee?.toLocaleString()} đ
                        </p>

                        <p>
                            <strong>Status:</strong>{" "}
                            {course?.Status ? "Active" : "Inactive"}
                        </p>

                        <p>
                            <strong>Open:</strong>{" "}
                            {course?.IsOpen ? "Yes" : "No"}
                        </p>

                    </Card.Body>

                </Card>

            </div>

            <div className="col-12">

                <Card className="shadow-sm border-0">

                    <Card.Body>

                        <h5 className="mb-3">
                            Latest Lessons
                        </h5>

                        <ListGroup variant="flush">

                            {
                                lessons.slice(0,5).map((lesson,index)=>(
                                    <ListGroup.Item
                                        key={lesson._id}
                                        className="d-flex justify-content-between"
                                    >
                                        <span>
                                            {index+1}. {lesson.Name}
                                        </span>

                                        <small className="text-muted">
                                            Unit {lesson.Unit}
                                        </small>

                                    </ListGroup.Item>
                                ))
                            }

                            {
                                lessons.length===0 &&
                                <div className="text-center text-muted py-4">
                                    No lessons yet.
                                </div>
                            }

                        </ListGroup>

                    </Card.Body>

                </Card>

            </div>

        </div>

    );

}

export default OverviewTab;