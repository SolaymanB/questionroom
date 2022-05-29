import { useState } from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import ListGroup from "react-bootstrap/ListGroup";
import { db, auth } from "../firebase";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";
import { useAuthState } from "react-firebase-hooks/auth";

function QuestionCreator(props) {
  const [questionType, setQuestionType] = useState("free");
  const [questionText, setQuestionText] = useState("");
  const [optionText, setOptionText] = useState("");
  const [options, setOptions] = useState([]);
  const [user] = useAuthState(auth);

  function addOption(e) {
    e.preventDefault();
    setOptions((prev) =>
      prev.concat({
        optionId: uuidv4(),
        text: optionText,
      })
    );
    setOptionText("");
  }

  function postQuestion(e) {
    e.preventDefault();
    db.ref(`rooms/${props.roomId}/questions/${uuidv4()}`).set({
      uid: user.uid,
      text: questionText,
      type: questionType,
      reactionCount: 0,
      askedTime: dayjs().format(),
      userName: user?.displayName || "Anonymous",
      options: options,
      showQuestion: props.isRoomHost ? true : false,
      visibility: "private",
    });
    props.onQuestionSubmit();
  }

  return (
    <>
      <Form id="new-question-form" onSubmit={postQuestion}>
        <Form.Group controlId="question-text" className="mb-3">
          <Form.Control
            required
            as="textarea"
            autoComplete="off"
            size="lg"
            type="text"
            className="bg-grey"
            placeholder="Type a question..."
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
          />
        </Form.Group>
      </Form>
      <Button
        size="sm"
        variant={questionType === "free" ? "secondary" : "light"}
        className="me-2"
        onClick={() => setQuestionType("free")}
      >
        Free Text
      </Button>
      <Button
        size="sm"
        variant={questionType === "multi" ? "secondary" : "light"}
        onClick={() => setQuestionType("multi")}
      >
        Multiple Choice
      </Button>
      {questionType === "multi" && (
        <Form onSubmit={addOption} className="mt-3">
          <ListGroup className="mb-3">
            {options?.map((a) => (
              <ListGroup.Item action type="button" key={a.optionId}>
                {a.text}
              </ListGroup.Item>
            ))}
            <ListGroup.Item action type="button">
              <Form.Group controlId="option-text">
                <Form.Control
                  autoComplete="off"
                  size="sm"
                  type="text"
                  className="bg-grey"
                  placeholder="Type an option..."
                  value={optionText}
                  onChange={(e) => setOptionText(e.target.value)}
                />
              </Form.Group>
            </ListGroup.Item>
          </ListGroup>
        </Form>
      )}
      <div>
        <Button
          variant="secondary"
          form="new-question-form"
          type="submit"
          className="float-end"
        >
          Ask Question
        </Button>
      </div>
    </>
  );
}

export default QuestionCreator;
