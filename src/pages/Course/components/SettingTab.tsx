interface Props {
    course: any;
}

function SettingTab({ course }: Props) {

    return (

        <div className="card">

            <div className="card-body">

                <h4>Course Settings</h4>

                <hr />

                <p>

                    <strong>Name:</strong>

                    {course?.Name}

                </p>

                <p>

                    <strong>Fee:</strong>

                    {course?.Fee}

                </p>

                <p>

                    <strong>Status:</strong>

                    {
                        course?.Status
                            ? "Active"
                            : "Inactive"
                    }

                </p>

                <p>

                    <strong>Open:</strong>

                    {
                        course?.IsOpen
                            ? "Yes"
                            : "No"
                    }

                </p>

            </div>

        </div>

    );

}

export default SettingTab;