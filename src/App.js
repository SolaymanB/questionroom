import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import { auth, db } from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "./App.css";

var relativeTime = require("dayjs/plugin/relativeTime");
dayjs.extend(relativeTime);



function App(props) {
  const [user, loading, error] = useAuthState(auth);
  const [sharedRooms, setSharedRooms] = useState(null);

  const navigate = useNavigate();


  function renderUserTitle() {
    if (user?.isAnonymous) {
      return "Anonymous";
    } else {
      return user?.displayName;
    }
  }

  function getSharedRooms() {
    db.ref(`shared`).on("value", (snapshot) => {
      const shared = snapshot.val();
      setSharedRooms(shared);
    });
  }

  function handleCreateRoom(room) {
    navigate("/rooms", { state: { room } });
  }

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else {
      getSharedRooms();
    }
  }, [user]);

  return (
    <div className="p-3">
      <Row xs={1} md={2} className="mb-4 justify-content-between">
        <Col className="d-flex justify-content-start align-items-center">
          <Form>
            <Form.Group controlId="search">
              <Form.Control type="search" placeholder="Search..." />
            </Form.Group>
          </Form>
        </Col>
        <Col className="d-flex justify-content-end align-items-center">
          <DropdownButton
            variant="light"
            align="end"
            title="Computer Science"
            id="tags-dropdown-menu"
          >
            <Dropdown.Item active eventKey="1">
              Computer Science
            </Dropdown.Item>
            <Dropdown.Item eventKey="2">Forensics</Dropdown.Item>
            <Dropdown.Item eventKey="3">Networking</Dropdown.Item>
          </DropdownButton>

          <Button variant="secondary" onClick={() => navigate("/rooms")}>
            New Room
          </Button>
        </Col>
      </Row>
      <h3>Hi, {renderUserTitle()}</h3>
      <Row xs={1} md={2} lg={3} className="g-4">
        {sharedRooms &&
          Object.keys(sharedRooms).map((sharedRoomId) => (
            <Col key={sharedRoomId}>
              <Card>
                <Card.Body>
                  <Card.Title className="text-primary">
                    {sharedRooms[sharedRoomId].tag}
                  </Card.Title>
                  Shared by{" "}
                  <strong>
                    {sharedRooms[sharedRoomId].originalCreatedUserName}
                  </strong>
                  <Card.Text>
                    <small className="text-muted">
                      {dayjs(sharedRooms[sharedRoomId]?.sharedAt).fromNow()}
                    </small>
                  </Card.Text>
                  <Card.Text>
                    Questions:{" "}
                    {Object.keys(sharedRooms[sharedRoomId].questions)?.length}
                  </Card.Text>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleCreateRoom(sharedRooms[sharedRoomId])}
                  >
                    Create Room
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
      </Row>
    </div>
  );
}

export default App;


