import React, { useState, useEffect } from 'react';
import { Form, Col, Button, Alert } from 'react-bootstrap';

export default function Connection({
  connData,
  createConnection,
  eventsToListenFor,
  emitTo,
  loading
}) {
  const [formValid, setFormValid] = useState([]);
  const [serverUrl, setServerUrl] = useState('');
  const [config, setConfig] = useState();
  const [numberConnection, setNumberConnection] = useState(1);
  const [welcomeEvent, setWelcomeEvent] = useState('');
  const [version, setVersion] = useState(3);

  const onFormSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const errors = [];

    if (numberConnection <= 0) {
      errors.push(Error('numberConnection cannot be less than 1'));
    }

    try {
      JSON.parse(config);
    } catch (e) {
      console.log('cannot parse config json', e);
      errors.push(e);
    }

    if (errors.length > 0) {
      setFormValid(errors);
      return;
    }

    setFormValid([]);
    createConnection(serverUrl, config, numberConnection, parseInt(version), welcomeEvent);
  };

  useEffect(() => {
    setConfig(connData.config);
    setServerUrl(connData.server);
    setNumberConnection(connData.numberConnection);
    setVersion(connData.version);
    setWelcomeEvent(connData.welcomeEvent);
  }, [connData]);

  return (
    <>
      <Alert
        variant='danger'
        show={connData.errors.length > 0 || formValid.length > 0}
      >
        {connData.errors.join(', ')} {formValid.join(', ')}
      </Alert>

      <Form onSubmit={onFormSubmit}>
        <Form.Row className='mb-2'>
          <Col>
            <Form.Label>Socket Server</Form.Label>
            <Form.Control
              required
              value={serverUrl}
              placeholder='server url'
              type='url'
              onChange={(e) => setServerUrl(e.target.value)}
            />
          </Col>
        </Form.Row>
        <Form.Row className='mb-2'>
          <Col>
            <Form.Label>JSON config</Form.Label>
            <Form.Control
              as='textarea'
              placeholder='JSON config'
              value={config}
              onChange={(e) => setConfig(e.target.value)}
            />
          </Col>
        </Form.Row>
        <Form.Row className='mb-2'>
          <Col>
            <Form.Label>Number of Connection</Form.Label>
            <Form.Control
              as='input'
              type='number'
              placeholder='Number of connection'
              value={numberConnection}
              onChange={(e) => setNumberConnection(e.target.value)}
            />
          </Col>
        </Form.Row>
        <Form.Row className='mb-2'>
          <Col>
            <Form.Label>Event after client connect</Form.Label>
            <Form.Control
              as='input'
              type='text'
              placeholder='Event after client connect'
              value={welcomeEvent}
              onChange={(e) => setWelcomeEvent(e.target.value.trim())}
            />
          </Col>
        </Form.Row>
        <Form.Row className='mb-2'>
          <Col>
            <Form.Label>Socket Version</Form.Label>
            <Form.Control
              as='select'
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              custom
            >
              <option value={3}>3</option>
              <option value={2}>2.x</option>
            </Form.Control>
          </Col>
        </Form.Row>
        <Form.Row className='mt-2'>
          <Col>
            <Form.Text className='mb-2'>
              <strong>Listen to</strong>: {eventsToListenFor.join(', ')}{' '}
              <strong>Emit to</strong>: {emitTo.join(', ')}
            </Form.Text>

            <Button
              variant='success'
              type='submit'
              block
              disabled={loading}
            >
              {loading ? 'Connecting...' : 'Connect'}
            </Button>
          </Col>
        </Form.Row>
      </Form>
    </>
  );
}
