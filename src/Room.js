import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import ListGroup from "react-bootstrap/ListGroup";
import Badge from "react-bootstrap/Badge";
import ProgressBar from "react-bootstrap/ProgressBar";
import { useAuthState } from "react-firebase-hooks/auth";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";
import { db, auth } from "./firebase";
import { useNavigate } from "react-router-dom";
import cx from "classnames";
import QuestionCreator from "./components/QuestionCreator";
import DropdownButton from "react-bootstrap/DropdownButton";
import Dropdown from "react-bootstrap/Dropdown";
import ReactWordcloud from "react-wordcloud";
import QRCode from "react-qr-code";

function Room(props) {
  const navigate = useNavigate();
  const location = useLocation();

  const [room, setRoom] = useState(null);
  const [newRoomDesc, setNewRoomDesc] = useState("");
  const [newRoomTag, setNewRoomTag] = useState(
    location.state?.room?.tag || "Computer Science"
  );
  const [question, setQuestion] = useState("");
  const [currentAnswerQuestionId, setCurrentAnswerQuestionId] = useState(null);
  const [currentAnswerText, setCurrentAnswerText] = useState("");
  const [newQuestionMode, setNewQuestionMode] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const [user, loading] = useAuthState(auth);
  let params = useParams();

  const isNewRoomMode = Boolean(!params?.roomId || location.state?.room);
  const isRoomHost = room?.hostId === user?.uid;

  function joinRoom(roomId) {
    const id = roomId || params.roomId;
    if (id && user) {
      db.ref(`rooms/${id}`).on("value", (snap) => {
        setRoom(snap.val());
      });
      db.ref(`rooms/${id}/participants/`)
        .child(user.uid)
        .update({
          name: user.displayName || "Anonymous",
          uid: user.uid,
        })
        .then(() => {
          setShowJoinModal(false);
        });
    }
  }

  function handleCreateRoom() {
    const baseRoom = location?.state?.room;

    if (baseRoom) {
      Object.keys(baseRoom.questions).forEach((questionId) => {
        baseRoom.questions[questionId].askedTime = dayjs().format();
        baseRoom.questions[questionId].uid = user?.uid;
        baseRoom.questions[questionId].userName =
          user?.displayName || "Anonymous";
      });
    }
    const roomObject = {
      ...baseRoom,
      roomId: uuidv4(),
      roomDesc: newRoomDesc,
      passcode: "1234",
      hostId: user?.uid,
      status: "Active",
      startedTime: dayjs().format(),
      createdUserName: user?.displayName || "Anonymous",
      parentRoomId: baseRoom?.originalRoomId || null,
      endedTime: null,
      tag: newRoomTag,
    };
    db.ref(`rooms/${roomObject.roomId}`)
      .set(roomObject)
      .then(() => {
        joinRoom(roomObject.roomId);
        navigate(`/rooms/${roomObject.roomId}`, { replace: true });
      });
  }

  function handleAnswerQuestion(question, answer) {
    if (question.visibility === "public") return;
    let newAnswer = {
      text: answer?.optionId ? null : answer, // only set text when its not multi-select
      optionId: answer?.optionId || null, // only needed for multi-select answers
      uid: user.uid,
      answeredTime: dayjs().format(),
      answeredBy: user.displayName || "Anonymous",
      visibility: "private", // always private by default
    };

    // First check if question has been made visible
    // then insert a new answer as public so it can be
    // seen by everyone as its answered live
    db.ref(`rooms/${room.roomId}/questions/${question.questionId}`).once(
      "value",
      (snap) => {
        const questionObject = snap.val();
        if (questionObject.visibility === "public") {
          newAnswer.visibility = "public";
        }
        console.log("HERE!");
        db.ref(`rooms/${room.roomId}/questions`)
          .child(question.questionId)
          .child(`answers/${user.uid}`)
          .set(newAnswer);
      }
    );

    setCurrentAnswerText("");
  }

  function postQuestion(e) {
    e.preventDefault();
    setNewQuestionMode(false);
    db.ref(`rooms/${room.roomId}/questions/${uuidv4()}`).set({
      uid: user.uid,
      text: question,
      type: "free",
      reactionCount: 0,
      askedTime: dayjs().format(),
      userName: user?.displayName || "Anonymous",
      showQuestion: isRoomHost ? true : false,
      visibility: "private",
    });
    setQuestion("");
  }

  function handleCurrentActiveQuestion(questionId) {
    console.log("HEREEE!!");
    // sets the current active question user
    // is about to answer so we can show the
    // answer input box
    if (questionId !== currentAnswerQuestionId) {
      // only change if its not the same question
      // already selected
      setCurrentAnswerText("");
      setCurrentAnswerQuestionId(questionId);
    }
  }

  function countNoOfOptionsAnswered(question, optionId, answers) {
    let count = 0;
    if (answers) {
      Object.keys(answers).forEach((userIdKey) => {
        console.log(answers[userIdKey].optionId, optionId);
        if (
          answers[userIdKey].optionId === optionId &&
          (answers[userIdKey].visibility !== "private" ||
            question.uid === user.uid)
        ) {
          count = count + 1;
        }
      });
    }
    return count;
  }

  function isCurrentUsersAnswer(optionId, answers) {
    let isAnswered = false;
    let answer = null;
    if (answers) {
      Object.keys(answers).forEach((userIdKey) => {
        if (answers[userIdKey]?.uid === user?.uid) {
          answer = answers[userIdKey];
        }
      });
    }
    if (answer?.optionId === optionId) {
      isAnswered = true;
    }
    return isAnswered;
  }

  function changeAnswerVisibility(question, isMakingPrivate) {
    console.log({ question });
    const updatedAnswers = {};

    db.ref(`rooms/${room.roomId}/questions`)
      .child(question.questionId)
      .update({ visibility: isMakingPrivate ? "private" : "public" });

    if (question?.answers) {
      Object.keys(question?.answers).forEach((key) => {
        updatedAnswers[key] = {
          ...question.answers[key],
          visibility: isMakingPrivate ? "private" : "public",
        };
      });

      db.ref(`rooms/${room.roomId}/questions`)
        .child(question.questionId)
        .child("answers")
        .update(updatedAnswers);
    }
  }

  function handlePublishQuestion(question) {
    db.ref(`rooms/${room.roomId}/questions`)
      .child(question.questionId)
      .update({
        showQuestion: question.showQuestion ? false : true,
        visibility: "private",
        publishedTime: dayjs().format(),
      })
      .then(() => {
        changeAnswerVisibility(question, true);
      });
  }

  function shareRoom() {
    // make a copy of the room
    let sharedRoom = JSON.parse(JSON.stringify(room));

    // keep some meta data for tracking who originally created the room
    sharedRoom.originalCreatedUserName = sharedRoom.createdUserName;
    sharedRoom.originalHostId = sharedRoom.hostId;
    sharedRoom.originalRoomId = sharedRoom.roomId;
    sharedRoom.sharedAt = dayjs().format();

    // delete properties that are not needed
    delete sharedRoom.createdUserName;
    delete sharedRoom.hostId;
    delete sharedRoom.roomId;
    delete sharedRoom.participants;
    delete sharedRoom.startedTime;
    delete sharedRoom.passcode;

    Object.keys(sharedRoom.questions).forEach((questionId) => {
      // delete all answers from the room
      delete sharedRoom.questions[questionId].answers;
      // make each question public incase it was made private
      sharedRoom.questions[questionId].visibility = "publilc";
      // remove the asked time so it can be set again when someone
      // creates a new room with it
      delete sharedRoom.questions[questionId].askedTime;
      // delete details of the user who asked the question
      delete sharedRoom.questions[questionId].userName;
      delete sharedRoom.questions[questionId].uid;
      // reset the react count for each question
      sharedRoom.questions[questionId].reactionCount = 0;
    });

    db.ref("shared").push(sharedRoom);
    setShowShareModal(false)
  }

  function generateWordCloud(answers) {
    if (!answers) return;
    // go through each answer and collect text
    // split text on each space
    // group the same word together and count
    let textCollection = "";
    Object.keys(answers).forEach((answerId) => {
      console.log({ answerId });
      textCollection = textCollection + " " + answers[answerId].text;
    });

    const splitWords = textCollection.split(" ");
    let groupedWords = {};
    splitWords.map(function (a) {
      if (a in groupedWords) groupedWords[a]++;
      else groupedWords[a] = 1;
    });

    let wordList = [];
    if (Object.keys(groupedWords).length) {
      Object.keys(groupedWords).forEach((word) => {
        wordList = wordList.concat({ text: word, value: groupedWords[word] });
      });
    }
    return wordList;
  }

  function renderJoinModal() {
    return (
      <Modal show={showJoinModal} backdrop="static" centered>
        <Modal.Header>
          <Modal.Title>Join Room</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to join this Room?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => joinRoom()}>
            Join Room
          </Button>
          <Button variant="danger" onClick={() => navigate("/")}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  function renderNewRoomCreator() {
    return (
      <Modal show={isNewRoomMode} backdrop="static" centered>
        <Modal.Header>
          <Modal.Title>New Room</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              // handleAnswerQuestion(question, currentAnswerText);
            }}
          >
            {location.state?.room && (
              <>
                <p>
                  You are creating a new room using a shared room. This will
                  import all questions and post them in newly created room.
                </p>
                <Card className="mb-3">
                  <Card.Body className="bg-grey">
                    <Card.Title className="text-primary">
                      {location.state?.room?.tag}
                    </Card.Title>
                    <Card.Text>
                      Questions:{" "}
                      {location?.state?.room &&
                        Object.keys(location?.state?.room?.questions)?.length}
                    </Card.Text>
                    <ListGroup>
                      {Object.keys(location.state.room?.questions).map(
                        (questionId) => {
                          return (
                            <ListGroup.Item key={questionId}>
                              Q.{" "}
                              {location.state.room?.questions[questionId].text}
                            </ListGroup.Item>
                          );
                        }
                      )}
                    </ListGroup>
                    <Card.Text className="mt-2">
                      <small>
                        Questions shared by:{" "}
                        {location.state?.room?.originalCreatedUserName}
                      </small>
                    </Card.Text>
                  </Card.Body>
                </Card>
              </>
            )}
            <Form.Group controlId="room-name" className="mb-2">
              <Form.Label>Room Description (optional)</Form.Label>
              <Form.Control
                as="textarea"
                autoComplete="off"
                size="lg"
                type="text"
                className="bg-grey"
                placeholder="Enter room description..."
                value={newRoomDesc}
                onChange={(e) => setNewRoomDesc(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="room-tag">
              <Form.Label>Select Tag</Form.Label>
              <DropdownButton
                variant="secondary"
                align="end"
                title={newRoomTag}
                id="tags-dropdown-menu"
              >
                {["Computer Science", "Forensics", "Networking"].map((tag) => (
                  <Dropdown.Item
                    active={tag === newRoomTag}
                    onClick={() => setNewRoomTag(tag)}
                    eventKey={tag}
                  >
                    {tag}
                  </Dropdown.Item>
                ))}
              </DropdownButton>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => navigate("/")}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={handleCreateRoom}>
            Create Room
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  function renderNewQuestionCreator() {
    return (
      <Modal
        show={newQuestionMode}
        centered
        onHide={() => setNewQuestionMode(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>New Question</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <QuestionCreator
            isRoomHost={isRoomHost}
            roomId={params.roomId}
            onQuestionSubmit={() => setNewQuestionMode(false)}
          />
        </Modal.Body>
      </Modal>
    );
  }
  function renderShareModal() {
    return (
      <Modal
        show={showShareModal}
        centered
        onHide={() => setShowShareModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Share</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <Row>
            <Col>
              <h3>Scan to join</h3>
              <QRCode value={window.location.href} size={200} />
            </Col>
            <Col>
              <h3>Share with others</h3>
              <p className="text-muted">Share the questions in this room with others. All participant information is not included.</p>
              <Button variant="secondary" onClick={shareRoom}>Share Room</Button>
            </Col>
          </Row>
        </Modal.Body>
      </Modal>
    );
  }

  function renderRoom() {
    // convert objects into arrays for easy sorting
    let questions = room?.questions
      ? Object.keys(room?.questions).map((k) => {
        return { ...room?.questions[k], questionId: k };
      })
      : null;
    let sortedQuestions = questions
      ? questions?.sort((a, b) =>
        dayjs(
          isRoomHost
            ? a.askedTime
            : a.publishedTime !== undefined
              ? a.publishedTime
              : a.askedTime
        ).isAfter(
          dayjs(
            isRoomHost
              ? b.askedTime
              : b.publishedTime !== undefined
                ? b.publishedTime
                : b.askedTime
          )
        )
          ? 1
          : -1
      )
      : null;
    return (
      <Col className="p-2 p-md-5 d-flex flex-column">
        <Row xs={1} sm={1} md={2} className="mb-2 mb-md-5 ">
          <Col>
            <h1 className="text-secondary">
              <strong>{room?.tag}</strong>
            </h1>
            <p>{room?.roomDesc}</p>
          </Col>
          <Col className="justify-content-end d-none d-md-flex">
            <div>
              {isRoomHost && (
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => setNewQuestionMode(true)}
                >
                  New Question
                </Button>
              )}
              <Button
                size="lg"
                variant="light"
                className="mx-3"
                onClick={() => setShowShareModal(true)}
              >
                Share
              </Button>
              <Button size="lg" variant="light">
                Export
              </Button>
            </div>
          </Col>
        </Row>
        <Row>
          <Col className="d-flex flex-column pb-5 mb-5">
            {sortedQuestions &&
              Object.keys(sortedQuestions).map((questionId) => {
                const question = sortedQuestions[questionId];
                const isCurrentUserQuestion = question?.uid === user?.uid;
                if (
                  isCurrentUserQuestion ||
                  isRoomHost ||
                  question.showQuestion !== false
                )
                  return (
                    <Card
                      key={questionId}
                      onClick={() => handleCurrentActiveQuestion(questionId)}
                      className={cx("chatItem mb-3", {
                        "border-primary": isCurrentUserQuestion,
                        "border-secondary": !isCurrentUserQuestion,
                      })}
                      style={{
                        marginLeft: isCurrentUserQuestion ? "auto" : "",
                      }}
                    >
                      <Card.Body className="rounded bg-light">
                        <Card.Title>
                          {question.uid === room.hostId && (
                            <Badge bg="dark">Host</Badge>
                          )}{" "}
                          <strong>
                            {isCurrentUserQuestion ? (
                              <span className="text-primary">You</span>
                            ) : (
                              question?.userName
                            )}
                          </strong>{" "}
                          asked a question
                        </Card.Title>
                        <Card.Text>Q. {question.text}</Card.Text>
                        <ListGroup className="mb-3">
                          {question.type !== "multi" &&
                            question?.answers &&
                            Object.keys(question?.answers)?.map((key) => {
                              if (
                                question?.answers[key].visibility ===
                                "public" ||
                                question?.uid === user?.uid ||
                                question?.answers[key].uid === user.uid ||
                                room.hostId === user.uid
                              ) {
                                return (
                                  <ListGroup.Item
                                    action
                                    key={key}
                                  // onClick={() => handleAnswerQuestion(question, a)}
                                  >
                                    A. {question?.answers[key]?.text}{" "}
                                    <p className="m-0">
                                      <small className="text-muted">
                                        - {question?.answers[key]?.answeredBy}
                                      </small>
                                    </p>
                                  </ListGroup.Item>
                                );
                              }
                            })}
                        </ListGroup>
                        <p>
                          <small>
                            Total Answers:{" "}
                            {(question?.answers &&
                              Object.keys(question?.answers)?.length) ||
                              0}
                          </small>
                        </p>
                        {question?.options?.length && (
                          <ListGroup className="mb-3">
                            {question?.options?.map((a) => {
                              const noOfAnswers = countNoOfOptionsAnswered(
                                question,
                                a.optionId,
                                question.answers
                              );
                              const isCurrentAnswer = isCurrentUsersAnswer(
                                a.optionId,
                                question.answers
                              );
                              return (
                                <ListGroup.Item
                                  action
                                  active={isCurrentAnswer}
                                  key={a.optionId}
                                  onClick={() =>
                                    handleAnswerQuestion(question, a)
                                  }
                                >
                                  {a.text}
                                  {noOfAnswers > 0 && (
                                    <ProgressBar
                                      variant={
                                        question.visibility === "private"
                                          ? "primary"
                                          : "secondary"
                                      }
                                      now={noOfAnswers}
                                      max={
                                        question?.answers &&
                                        Object.keys(question?.answers)?.length
                                      }
                                      label={`${(
                                        (noOfAnswers /
                                          Object.keys(question?.answers)
                                            ?.length) *
                                        100
                                      ).toFixed()}%`}
                                    />
                                  )}
                                </ListGroup.Item>
                              );
                            })}
                          </ListGroup>
                        )}
                        {question.visibility === "public" &&
                          question.type !== "multi" && (
                            <div
                              className="bg-grey mb-3"
                              style={{ width: "100%", height: "200px" }}
                            >
                              <ReactWordcloud
                                words={generateWordCloud(question?.answers)}
                              />
                            </div>
                          )}

                        {currentAnswerQuestionId === questionId &&
                          question.type === "free" &&
                          (isRoomHost ||
                            (question.uid === user.uid &&
                              question.visibility === "private") ||
                            question.visibility === "private") && (
                            <Form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleAnswerQuestion(
                                  question,
                                  currentAnswerText
                                );
                              }}
                            >
                              <Form.Group controlId="option-text">
                                <Form.Control
                                  autoComplete="off"
                                  size="sm"
                                  type="text"
                                  className="bg-grey"
                                  placeholder="Type your answer..."
                                  onClick={() => setCurrentAnswerText("")}
                                  value={currentAnswerText}
                                  onChange={(e) =>
                                    setCurrentAnswerText(e.target.value)
                                  }
                                />
                              </Form.Group>
                            </Form>
                          )}
                        {isRoomHost && (
                          <Button
                            className="mt-2 me-2"
                            variant={
                              question.showQuestion ? "secondary" : "grey"
                            }
                            size="sm"
                            onClick={() => handlePublishQuestion(question)}
                          >
                            Publish Questions
                          </Button>
                        )}
                        {isRoomHost && question.showQuestion && (
                          <Button
                            className="mt-2"
                            variant={
                              question.visibility === "public"
                                ? "secondary"
                                : "grey"
                            }
                            size="sm"
                            onClick={() =>
                              changeAnswerVisibility(
                                question,
                                question.visibility === "public" ? true : false
                              )
                            }
                          >
                            Show Answers
                          </Button>
                        )}
                      </Card.Body>
                    </Card>
                  );
              })}
          </Col>
        </Row>
      </Col>
    );
  }

  useEffect(() => {
    if (!room && !isNewRoomMode) {
      setShowJoinModal(true);
    } else {
      setShowJoinModal(false);
    }
  }, [room, params, location]);

  useEffect(() => {
    console.log({ loading });
    if (!user && !loading) {
      navigate("/login");
    }
  }, [user, loading]);

  return (
    <>
      <Row className="bg-dark h-100 overflow-auto">
        {renderJoinModal()}
        {renderNewQuestionCreator()}
        {renderNewRoomCreator()}
        {renderRoom()}
        {renderShareModal()}
      </Row>
      <div
        className="position-fixed w-100"
        style={{ bottom: "0px", left: "0px" }}
      >
        {!isNewRoomMode && !isRoomHost && (
          <Form onSubmit={postQuestion} className="p-5">
            <Form.Group controlId="question-text">
              <Form.Control
                autoComplete="off"
                className="p-3 shadow"
                size="lg"
                type="text"
                placeholder="Ask a question..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </Form.Group>
          </Form>
        )}
      </div>
    </>
  );
}

export default Room;
