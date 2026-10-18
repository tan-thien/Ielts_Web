interface Props {
    course: any;
}

function SettingTab({ course }: Props) {

    return (

        <div className="card">

            <div className="card-body">

                <h4>Cài đặt khóa học</h4>

                <hr />

                <p>

                    <strong>Tên khóa học:</strong>

                    {course?.Name}

                </p>

                <p>

                    <strong>Học phí:</strong>

                    {course?.Fee}

                </p>

                <p>

                    <strong>Trạng thái:</strong>

                    {
                        course?.Status
                            ? "Đang hoạt động"
                            : "Ngừng hoạt động"
                    }

                </p>

                <p>

                    <strong>Đăng ký:</strong>

                    {
                        course?.IsOpen
                            ? "Đang mở"
                            : "Đang đóng"
                    }

                </p>

            </div>

        </div>

    );

}

export default SettingTab;