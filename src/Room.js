import { useParams } from "react-router-dom";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

function Room(props) {
  let params = useParams();

  function getSessionFromDatabase(sessionId) {
    // call firebase with that id and get the object
  }

  return (
    <>
      <Row className="bg-dark h-100 overflow-auto">
        <Col className="p-5 d-flex flex-column">
          <Row>
            <Col>
              <Button size="lg" variant="light">
                New Question
              </Button>
            </Col>
            <Col className="d-flex justify-content-end">
              <Button size="lg" variant="light" className="mx-3">
                Share
              </Button>
              <Button size="lg" variant="light">
                Export
              </Button>
            </Col>
          </Row>
          <Row>
            <Col>
              <h1>Stuff in here</h1>
              <h1>Stuff in here</h1>
            </Col>
          </Row>
        </Col>
      </Row>
      <div
        className="position-fixed p-5 w-100"
        style={{ bottom: "0px", left: "0px" }}
      >
        <Form>
          <Form.Group controlId="search">
            <Form.Control
              autoComplete="off"
              className="p-3 shadow"
              size="lg"
              type="search"
              placeholder="Ask a question..."
            />
          </Form.Group>
        </Form>
      </div>
    </>
  );
}

export default Room;
