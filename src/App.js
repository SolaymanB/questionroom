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
  const [user] = useAuthState(auth);
  const [sharedRooms, setSharedRooms] = useState(null);
  const [currentFilter, setCurrentFilter] = useState('All');

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
  }, [user, navigate]);

  const asArray = sharedRooms ? Object.entries(sharedRooms) : [];
  const filtered = asArray.filter(([key, value]) => value.tag.toLowerCase() === currentFilter.toLowerCase());
  // Convert the key/value array back to an object:
  const sharedRoomsWithFilters = Object.fromEntries(filtered);

  return (
    <div className="p-3">
      <Row xs={1} md={2} className="mb-4 justify-content-between">
        <Col className="d-flex justify-content-start align-items-center">
          <h3 className="m-0">Hi, {renderUserTitle()}</h3>
        </Col>
        <Col className="d-flex justify-content-end align-items-center">
          <DropdownButton
            variant="light"
            align="end"
            title={currentFilter}
            id="tags-dropdown-menu"
          >
            {['All', 'Computer Science', 'Forensics', 'Networking'].map((tag, i) => {
              return (
                <Dropdown.Item active={currentFilter === tag} eventKey={i} onClick={() => setCurrentFilter(tag)}>
                  {tag}
                </Dropdown.Item>
              )
            })}
          </DropdownButton>

          <Button variant="secondary" onClick={() => navigate("/rooms")}>
            New Room
          </Button>
        </Col>
      </Row>
      <Row xs={1} md={2} lg={3} className="g-4">
        {sharedRooms &&
          Object.keys(currentFilter === 'All' ? sharedRooms : sharedRoomsWithFilters).map((sharedRoomId) => (
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


