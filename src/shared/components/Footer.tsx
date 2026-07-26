import { Container, Row, Col } from "react-bootstrap";

function Footer() {

    return (

        <footer className="main-footer">

            <Container>

                <Row>

                    <Col md={5}>

                        <h3>IELTS Master</h3>

                        <p>
                            Learn IELTS smarter with AI.
                        </p>

                    </Col>

                    <Col md={3}>

                        <h5>Quick Links</h5>

                        <p>Home</p>

                        <p>Courses</p>

                        <p>Writing</p>

                    </Col>

                    <Col md={4}>

                        <h5>Contact</h5>

                        <p>admin@gmail.com</p>

                        <p>0123456789</p>

                    </Col>

                </Row>

                <hr />

                <p className="text-center">

                    © 2026 IELTS Master

                </p>

            </Container>

        </footer>

    );

}

export default Footer;