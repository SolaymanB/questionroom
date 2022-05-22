import { useEffect, useState } from 'react'
import { useParams } from "react-router-dom";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import { useAuthState } from "react-firebase-hooks/auth";
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs'
import { db, auth } from './firebase'
import { useNavigate } from "react-router-dom";
import { onValue } from "firebase/database";


function Room(props) {
  const [room, setRoom] = useState(null)
  const [question, setQuestion] = useState('')

  const [user, loading] = useAuthState(auth);
  let params = useParams();

  const navigate = useNavigate()

  function handleCreateRoom() {
    const roomObject = {
      "roomId": uuidv4(),
      "passcode": "1234",
      "hostId": user.uid,
      "status": "Active",
      "startedTime": dayjs().format(),
      "createdUserName": user?.displayName || 'Anonymous',
      "parentSessionId": null,
      "endedTime": null,
      "tag": "Computer Science",
      "questions": [],
      "students": []
    }
    const usersRef = db.ref(`rooms/${roomObject.roomId}`).set(roomObject);
    navigate(`/rooms/${roomObject.roomId}`)
  }

  function postQuestion(e) {
    e.preventDefault()
    const usersRef = db.ref(`rooms/${room.roomId}/questions/${uuidv4()}`).set({
      // Student question
      "uid": user.uid,
      "text": question,
      "type": "free",
      "reactionCount": 0,
      "askedTime": dayjs().format(),
      "userName": user?.displayName || 'Anonymous'
    });
    setQuestion("")
  }


  useEffect(() => {
    if (params.roomId) {
      const room = db.ref(`rooms/${params.roomId}`).on('value', (snap) => {
        setRoom(snap.val())
      })
    }
  }, [params]);

  useEffect(() => {
    if (!user) {
      // navigate("/login");
    }
  }, [user]);


  function renderNewRoomCreator() {
    return <Modal show={isNewRoomMode} backdrop="static" centered>
      <Modal.Header>
        <Modal.Title>New Session</Modal.Title>
      </Modal.Header>
      <Modal.Body>Woohoo, you're reading this text in a modal!</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleCreateRoom}>
          Create Room
        </Button>
      </Modal.Footer>
    </Modal>
  }

  function renderRoom() {
    // convert objects into arrays for easy sorting
    let questions = room?.questions ? Object.keys(room?.questions).map((k) => { return { ...room?.questions[k], roomId: k } }) : null
    let sortedQuestions = questions ? questions?.sort((a, b) => (dayjs(a.askedTime).isAfter(dayjs(b.askedTime)) ? 1 : -1)) : null
    return <Col className="p-5 d-flex flex-column">
      <Row className="mb-5">
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
        <Col className="d-flex flex-column pb-5 mb-5">
          {sortedQuestions && Object.keys(sortedQuestions).map((key) => {
            const question = sortedQuestions[key];
            const isCurrentUserQuestion = question?.uid === user?.uid;
            return <Card className="mb-3" style={{ width: '500px', marginLeft: isCurrentUserQuestion ? 'auto' : '' }}>
              <Card.Body className="rounded-lg">
                <Card.Title as="strong">
                  {isCurrentUserQuestion ? 'You' : question?.userName}
                </Card.Title>
                <Card.Text>
                  {question.text}
                </Card.Text>
              </Card.Body>
            </Card>
          })}
        </Col>
      </Row>
    </Col>
  }

  const isNewRoomMode = Boolean(!params?.roomId)

  return (
    <>
      <Row className="bg-dark h-100 overflow-auto">
        {renderNewRoomCreator()}
        {renderRoom()}
      </Row>
      <div
        className="position-fixed w-100"
        style={{ bottom: "0px", left: "0px" }}
      >
        {!isNewRoomMode &&
          <Form onSubmit={postQuestion}>
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

        }
      </div>
    </>
  );
}

export default Room;
