import JsSIP from 'jssip';
import { useState, useEffect, useRef } from 'react';

import styles from './sipCall.module.css';

const SipCall = () => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Отключен');
  const [credentials, setCredentials] = useState({
    ws_servers: 'wss://cityonline.real.su:8089/ws',
    uri: 'sip:3000@cityonline.real.su',
    password: '30906cb3a5451f7e91bc9ae0596345b3',
  });
  const [targetNumber, setTargetNumber] = useState('');

  const userAgentRef = useRef(null);
  const currentSessionRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const initializeSip = () => {
    try {
      const socket = new JsSIP.WebSocketInterface(credentials.ws_servers);
      const configuration = {
        sockets: [socket],
        uri: credentials.uri,
        password: credentials.password,
      };

      userAgentRef.current = new JsSIP.UA(configuration);

      userAgentRef.current.on('registered', () => {
        setIsRegistered(true);
        setConnectionStatus('Зарегистрирован');
      });

      userAgentRef.current.on('registrationFailed', () => {
        setIsRegistered(false);
        setConnectionStatus('Ошибка регистрации');
      });

      userAgentRef.current.on('newRTCSession', (e) => {
        const session = e.session;

        session.on('progress', () => {
          setConnectionStatus('Вызываем...');
        });

        session.on('accepted', () => {
          setIsCalling(true);
          setConnectionStatus('В разговоре');
          const localMediaStream = session.connection.getLocalStreams()[0];
          const remoteMediaStream = session.connection.getRemoteStreams()[0];
          if (localVideoRef.current) localVideoRef.current.srcObject = localMediaStream;
          if (remoteVideoRef.current)
            remoteVideoRef.current.srcObject = remoteMediaStream;
        });

        session.on('ended', () => {
          setIsCalling(false);
          setConnectionStatus('Зарегистрирован');
          currentSessionRef.current = null;
          if (localVideoRef.current) localVideoRef.current.srcObject = null;
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        });

        session.on('failed', () => {
          setIsCalling(false);
          setConnectionStatus('Ошибка звонка');
          currentSessionRef.current = null;
        });
      });

      userAgentRef.current.on('disconnected', () => {
        setIsRegistered(false);
        setConnectionStatus('Отключен');
      });

      userAgentRef.current.start();
    } catch (error) {
      setConnectionStatus('Ошибка инициализации');
    }
  };

  const handleRegister = () => {
    if (userAgentRef.current) {
      userAgentRef.current.stop();
    }
    setConnectionStatus('Подключается...');
    initializeSip();
  };

  const handleUnregister = () => {
    if (userAgentRef.current && isRegistered) {
      userAgentRef.current.unregister();
      userAgentRef.current.stop();
      setIsRegistered(false);
      setIsCalling(false);
      setConnectionStatus('Отключен');
    }
  };

  const handleCall = () => {
    if (!userAgentRef.current || !isRegistered) return;
    if (!targetNumber) return;
    if (isCalling) return;

    try {
      const options = {
        mediaConstraints: { audio: true, video: true },
      };
      currentSessionRef.current = userAgentRef.current.call(targetNumber, options);
      setConnectionStatus('Звоним...');
    } catch (error) {
      setConnectionStatus('Ошибка звонка');
    }
  };

  const handleHangup = () => {
    if (currentSessionRef.current) {
      currentSessionRef.current.terminate();
      setIsCalling(false);
      setConnectionStatus('Зарегистрирован');
    }
  };

  useEffect(() => {
    return () => {
      if (userAgentRef.current) {
        userAgentRef.current.stop();
      }
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.videoContainer}>
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={styles.remoteVideo}
        />
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className={styles.localVideo}
        />
      </div>

      <div className={styles.status}>
        <div
          className={`${styles.statusIndicator} ${isRegistered ? styles.registered : styles.disconnected}`}
        />
        <span>{connectionStatus}</span>
      </div>

      <div className={styles.controls}>
        <div className={styles.registration}>
          <h3>Регистрация</h3>
          <div className={styles.inputGroup}>
            <label>WebSocket:</label>
            <input
              type="text"
              name="ws_servers"
              value={credentials.ws_servers}
              onChange={handleInputChange}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>SIP URI:</label>
            <input
              type="text"
              name="uri"
              value={credentials.uri}
              onChange={handleInputChange}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Пароль:</label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
            />
          </div>
          <div className={styles.buttons}>
            <button
              onClick={isRegistered ? handleUnregister : handleRegister}
              disabled={connectionStatus === 'Подключается...'}
              className={isRegistered ? styles.unregisterBtn : styles.registerBtn}
            >
              {connectionStatus === 'Подключается...'
                ? '...'
                : isRegistered
                  ? 'Выход'
                  : 'Регистрация'}
            </button>
          </div>
        </div>

        <div className={styles.calling}>
          <h3>Звонок</h3>
          <div className={styles.inputGroup}>
            <label>Номер:</label>
            <input
              type="text"
              value={targetNumber}
              onChange={(e) => setTargetNumber(e.target.value)}
              disabled={!isRegistered}
            />
          </div>
          <div className={styles.buttons}>
            <button
              onClick={handleCall}
              disabled={!isRegistered || isCalling}
              className={styles.callBtn}
            >
              Звонок
            </button>
            <button
              onClick={handleHangup}
              disabled={!isCalling}
              className={styles.hangupBtn}
            >
              Сброс
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SipCall;
