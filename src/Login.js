import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, signInAnonymously, logInWithEmailAndPassword } from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { Card, Col, Form, Row } from "react-bootstrap";
import { Button, Alert } from "react-bootstrap";

function Login() {
  const [signInType, setSignInType] = useState("Anonymous");
  const [email, setEmail] = useState("ayan@gmail.com");
  const [password, setPassword] = useState("1231231231");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, loading] = useAuthState(auth);

  const navigate = useNavigate();

  async function onClickContinue(e) {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Fake delay for 2 seconds
      if (signInType === "Anonymous") {
        await signInAnonymously();
      }
      if (signInType === "SignIn") {
        await logInWithEmailAndPassword(email, password);
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      setError(error);
    }
  }

  useEffect(() => {
    if (loading) {
      console.log({ loading });
      // maybe trigger a loading screen
      return;
    }
    if (user) navigate("/");
  }, [user, loading]);

  useEffect(() => {
    // everytime signInType changes clear the fields
    setError("");
  }, [signInType]);

  return (
    <Form className="h-100" onSubmit={onClickContinue}>
      <Row className="h-100">
        <Col className="h-100 d-flex align-items-center justify-content-center">
          <Card
            className="shadow rounded-0 border-primary"
            style={{ width: "500px", borderTop: "solid 10px" }}
          >
            <Card.Img variant="top" src="login-art.jpg" />
            <Card.Body>
              <Card.Title as={"h1"} className="mb-3">
                Let's get started!
              </Card.Title>
              <Card.Text>How do you want to use interact?</Card.Text>
              <Button
                variant={signInType === "Anonymous" ? "secondary" : "light"}
                onClick={() => setSignInType("Anonymous")}
                size="lg"
                className="me-3"
              >
                Anonymously
              </Button>
              <Button
                variant={signInType === "SignIn" ? "secondary" : "light"}
                onClick={() => setSignInType("SignIn")}
                size="lg"
              >
                Sign In
              </Button>
              {error && (
                <Alert variant="danger" className="my-2">
                  Sign in error: {error.code}
                </Alert>
              )}

              {signInType === "SignIn" && (
                <Row className="mt-3">
                  <Col>
                    <Form.Group controlId="search">
                      <Form.Control
                        required
                        autoComplete="off"
                        className="bg-muted border rounded-0 mb-1"
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                      />
                    </Form.Group>
                    <Form.Group controlId="password">
                      <Form.Control
                        required
                        autoComplete="off"
                        className="bg-muted border rounded-0"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                      />
                    </Form.Group>
                    <p className="text-muted w-100 text-end">
                      <small>
                        Don't have an account?{" "}
                        <Link to="/register" className="text-decoration-none">
                          Register
                        </Link>
                      </small>
                    </p>
                  </Col>
                </Row>
              )}

              <p className="mt-3 text-muted">
                <small>
                  {signInType === "Anonymous"
                    ? "*Only allowed to participate in rooms."
                    : "*You can participate and create new rooms."}
                </small>
              </p>
              <Button
                variant="light"
                size="md"
                className="text-primary float-end"
                type="submit"
                disabled={
                  signInType !== "Anonymous" &&
                  (isLoading || !email.length || !password.length)
                }
              >
                {isLoading ? "Please wait..." : "Continue"}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Form>
  );
}
export default Login;
