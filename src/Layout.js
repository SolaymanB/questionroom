import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db, logout } from "./firebase";
import { useNavigate } from "react-router-dom";

function Layout(props) {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  function handleLogout() {
    db.ref(`users/${user?.uid}`).remove();
    logout();
  }

  return (
    <Container fluid className="d-flex flex-column h-100">
      <Row className="bg-light">
        <Col className="p-4">
          <img
            src="/logo.svg"
            className="img-fluid"
            onClick={() => navigate("/")}
          />
        </Col>
        {user && (
          <Col className="p-4 flex-grow-0">
            <Button variant="light" onClick={handleLogout}>
              Logout
            </Button>
          </Col>
        )}
      </Row>
      <Row className="flex-grow-1 overflow-auto">
        <Col className="h-100">{props.children}</Col>
      </Row>
    </Container>
  );
}

export default Layout;
