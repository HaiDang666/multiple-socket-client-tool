import "./App.css";
import Connection from "./components/connection.jsx";
import Listen from "./components/listen.jsx";
import Emitter from "./components/emitter.jsx";
import Ack from "./components/ack.jsx";
import { useEffect, useState, useRef } from "react";
import { io as io3 } from "socket.io-client";
import io2 from "socket.io-client2";
import { Container, Row, Col, Modal, Tabs, Tab } from "react-bootstrap";
import { MdCloudDone, MdCloudOff, MdDoNotDisturb } from "react-icons/md";

function App() {
  const [socket, setSocket] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState([]);

  const isReadyRef = useRef();
  isReadyRef.current = isReady;

  const [connData, setConnData] = useState({
    server: "http://localhost:8080",
    config:
      '{"path": "/socket.io", "forceNew": true, "reconnectionAttempts": 3, "timeout": 2000}',
    numberConnection: 1,
    version: 3,
    welcomeEvent: '',
    errors: [],
  });

  const [appConfig, setAppConfig] = useState(0);
  const [eventsToListenFor, setEventsToListenFor] = useState([
    "message",
  ]);

  const [listenTo, setListenTo] = useState([]);
  const [emitTo, setEmitTo] = useState([]);

  // Storage
  const [emitHistory, setEmitHistory] = useState([]);
  const [listenHistory, setListenHistory] = useState({});
  const [ackHistory, setAckHistory] = useState([]);

  const createConnection = (url, config, numberConnection, version, welcomeEvent) => {
    setConnData(() => {
      return {
        server: url,
        config: config,
        numberConnection: numberConnection,
        version: version,
        errors: [],
      };
    });

    if (welcomeEvent) {
      setListenTo([welcomeEvent]);
    }

    setIsLoading(true);

    setTimeout(() => {
      const io = version === 3 ? io3 : io2;
      const client = [];
      for (let i = 0; i < numberConnection; i++) {
        const connection = {
          index: i,
          socket: io.connect(url, JSON.parse(config)),
        };

        connection.socket.on("connect", () => {
          if (i === numberConnection - 1) {
            setIsConnected(true);
            setIsLoading(false);
          }
        });

        if (welcomeEvent) {
          connection.socket.once(welcomeEvent, (response) => {
            console.log(response);
          });
        }

        client.push(connection);
      }

      setClients(client);
    });
  };

  useEffect(() => {
    if (socket === null) {
      return;
    }
    socket.on("connect", () => {
      if (isReadyRef.current === true) {
        return;
      }

      // setConnData(() => {
      //   return {
      //     server: connData.url,
      //     config: connData.config,
      //     numberConnection: connData.numberConnection,
      //     version: connData.version,
      //     errors: []
      //   }
      // });
      addListener(eventsToListenFor);
      setIsReady(() => true);
    });
  });

  useEffect(() => {}, [listenTo]);

  function addListener(channels) {
    channels.forEach((channel) => {
      const channelsToAdd = [];
      if (!listenTo.includes(channel)) {
        channelsToAdd.push(channel);
        socket.on(channel, (response) => {
          console.log("data received", channel, response);
          const d = new Date();
          const data = {
            key: d.toLocaleString(),
            date: d,
            channel: channel,
            data:
              typeof response === "string"
                ? response
                : JSON.stringify(response, null, 2),
            dataType: typeof response === "string" ? "string" : "json",
          };
          setListenHistory([data, ...listenHistory]);
        });
      }
      setListenTo([...channelsToAdd, ...listenTo]);
    });
  }

  const addEmitTo = (channel) => {
    setEmitTo((items) => [channel, ...items]);
  };

  const emitData = (emitChannel, dataToEmit) => {
    socket.emit(emitChannel, dataToEmit, (ack) => {
      const date = new Date();
      const store = {
        key: date.toUTCString(),
        channel: emitChannel,
        date: date,
        data: ack,
        type: typeof ack === "string" ? "string" : "json",
      };
      setAckHistory((items) => [store, ...items]);
    });
    const date = new Date();
    const store = {
      key: date.toUTCString(),
      channel: emitChannel,
      date: date,
      data: dataToEmit,
      type: typeof dataToEmit === "string" ? "string" : "json",
    };
    setEmitHistory((items) => [store, ...items]);
  };

  // const histryStackChannelsFilter = (item, channels) => {
  //   return !channels.includes(item.channel);
  // }

  function clearHistory(stack, channels) {
    switch (stack) {
      case "emit":
        setEmitHistory(() => []);
        break;
      case "listen":
        setListenHistory((items) =>
          items.filter((i) => !channels.includes(i.channel))
        );
        break;
      case "ack":
        setAckHistory(() => []);
        break;
      default:
        break;
    }
  }

  // useEffect(() => {
  //   function setHash() {
  //     const hashObj = {
  //       server: connData.server,
  //       listen: listenTo,
  //       emit: emitTo,
  //       config: connData.config,
  //     };
  //     window.location.hash = window.btoa(JSON.stringify(hashObj));
  //   }

  //   function getHash() {
  //     return window.location.hash === ""
  //       ? false
  //       : JSON.parse(window.atob(window.location.hash.split("#")[1]));
  //   }

  //   if (connData.connected) {
  //     setHash();
  //   } else {
  //     const d = getHash();

  //     if (d !== false && appConfig === 0) {
  //       // Has hash value on load
  //       setAppConfig(() => 1);
  //       if (d.listen.length > 0) {
  //         setEventsToListenFor(() => d.listen);
  //       }
  //       setEmitTo(() => d.emit);
  //       // setConnData(() => {
  //       //   return {
  //       //     connected: false,
  //       //     loading: false,
  //       //     server: d.server,
  //       //     config: d.config,
  //       //     numberConnection: connData.numberConnection,
  //       //     version: connData.version,
  //       //     errors: []
  //       //   };
  //       // });
  //     }
  //   }
  // }, [connData, listenTo, emitTo, appConfig]);

  function handleDisconnect() {
    setIsConnected(false);
    clients.forEach((c) => {
      if (c.socket.connected) {
        c.socket.disconnect();
      }
    });

    setClients([]);
    setListenTo([]);
  }

  return (
    <div className="App">
      <Container>
        <Row>
          <Col className="text-right">
            <span className="small">
              ID: <b>{connData.socketId}</b> Server: <b>{connData.server}</b>
            </span>
            {isConnected ? (
              <>
                <MdCloudDone className="text-success ml-3 h3" />
                <MdDoNotDisturb
                  className="text-danger mx-2 h3"
                  onClick={handleDisconnect}
                />
              </>
            ) : (
              <MdCloudOff className="text-danger mx-2 h3" />
            )}
          </Col>
        </Row>

        <Row>
          <Col>
            <Tabs defaultActiveKey="listen" className="mb-4 nav-fillx">
              <Tab eventKey="listen" title="Listen">
                <Listen
                  listeners={listenTo}
                  addListener={addListener}
                  listenHistory={listenHistory}
                  clearHistory={clearHistory}
                  stack="listen"
                />
              </Tab>

              <Tab eventKey="emit" title="Emit">
                <Emitter
                  emitToChannels={emitTo}
                  addEmitTo={addEmitTo}
                  emitData={emitData}
                  emitHistory={emitHistory}
                  clearHistory={clearHistory}
                  stack="emit"
                />
              </Tab>

              <Tab eventKey="ack" title="Ack">
                <Ack
                  ackHistory={ackHistory}
                  stack="ack"
                  clearHistory={clearHistory}
                />
              </Tab>
            </Tabs>
          </Col>
        </Row>
      </Container>

      <Modal show={!isConnected} backdrop="static" centered size="lg">
        <Modal.Header>
          <Modal.Title>Configure connection</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Connection
            eventsToListenFor={eventsToListenFor}
            emitTo={emitTo}
            connData={connData}
            loading={isLoading}
            createConnection={createConnection}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default App;
