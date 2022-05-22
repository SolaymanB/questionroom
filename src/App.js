import { useEffect } from "react";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import { logout, auth } from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";

import "./App.css";

function App(props) {
  const [user, loading, error] = useAuthState(auth);

  const navigate = useNavigate();

  function renderUserTitle() {
    if (user?.isAnonymous) {
      return 'Anonymous'
    } else {
      return user?.displayName
    }
  }

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user]);

  return (
    <div className="p-3">
      <Row xs={1} md={5} className="mb-4 justify-content-between">
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

          <Button variant="secondary" onClick={() => navigate('/rooms')}>
            New Room
          </Button>
        </Col>
      </Row>
      <h3>Hi, {renderUserTitle()}</h3>
      <Row xs={1} md={5} className="g-4">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Col>
            <Card>
              <Card.Body>
                <Card.Title>Card title</Card.Title>
                <Card.Text>
                  This is a longer card with supporting text below as a natural
                  lead-in to additional content. This content is a little bit
                  longer.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}

export default App;
