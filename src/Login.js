import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  auth,
  db,
  signInAnonymously,
  logInWithEmailAndPassword,
  registerWithEmailAndPassword,
} from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { Card, Col, Form, Row } from "react-bootstrap";
import { Button, Alert } from "react-bootstrap";

function Login() {
  const [signInType, setSignInType] = useState("Anonymous");
  const [name, setName] = useState("ayan");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user] = useAuthState(auth);

  const navigate = useNavigate();

  // Handles the submission of the form
  async function onClickContinue(e) {
    // by default the form submit will refresh the page, in order to
    // stop this we call preventDefault()
    e.preventDefault();
    setIsLoading(true);
    let res;
    try {
      if (signInType === "Anonymous") {
        res = await signInAnonymously();
      }
      if (signInType === "SignIn") {
        res = await logInWithEmailAndPassword(email, password);
      }
      if (signInType === "Register") {
        res = await registerWithEmailAndPassword(name, email, password);
      }
      db.ref(`users/${res?.user?.uid || res?.uid}`).set({
        name: res?.user?.displayName || res?.displayName || "Anonymous",
        loginTime: Date.now(),
      });
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      setError(error);
    }
  }

  useEffect(() => {
    // when there is a user signed in, take them
    // to the dashboard screen
    if (user) navigate("/");
  }, [user]);

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
                variant={
                  signInType === "SignIn" || signInType === "Register"
                    ? "secondary"
                    : "light"
                }
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

              {signInType !== "Anonymous" && (
                <Row className="mt-3">
                  <Col>
                    {signInType === "Register" && (
                      <Form.Group controlId="name">
                        <Form.Control
                          required
                          className="bg-muted border rounded-0 mb-1"
                          type="text"
                          placeholder="Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={isLoading}
                        />
                      </Form.Group>
                    )}
                    <Form.Group controlId="email">
                      <Form.Control
                        required
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
                        className="bg-muted border rounded-0"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                      />
                    </Form.Group>
                    {signInType !== "Register" && (
                      <p className="text-muted w-100 text-end">
                        <small>
                          Don't have an account?{" "}
                          <a
                            href="#"
                            onClick={() => setSignInType("Register")}
                            className="text-decoration-none"
                          >
                            Register
                          </a>
                        </small>
                      </p>
                    )}
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
