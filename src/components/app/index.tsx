import { useEffect, useRef, useState } from 'react';
import { SimpleUser } from 'sip.js/lib/platform/web';

import {
  nameAlice,
  nameBob,
  passwordAlice,
  passwordBob,
  uriAlice,
  uriBob,
  webSocketServerAlice,
  webSocketServerBob,
} from '@utils/sip.config.ts';

import type React from 'react';
import type { SimpleUserDelegate, SimpleUserOptions } from 'sip.js/lib/platform/web';

import './app.css';

type UserControls = {
  user: SimpleUser | null;
  isConnected: boolean;
  isRegistered: boolean;
  isInCall: boolean;
  isHeld: boolean;
  isMuted: boolean;
};

const App: React.FC = () => {
  const [aliceControls, setAliceControls] = useState<UserControls>({
    user: null,
    isConnected: false,
    isRegistered: false,
    isInCall: false,
    isHeld: false,
    isMuted: false,
  });

  const [bobControls, setBobControls] = useState<UserControls>({
    user: null,
    isConnected: false,
    isRegistered: false,
    isInCall: false,
    isHeld: false,
    isMuted: false,
  });

  const videoLocalAliceRef = useRef<HTMLVideoElement>(null);
  const videoLocalBobRef = useRef<HTMLVideoElement>(null);
  const videoRemoteAliceRef = useRef<HTMLVideoElement>(null);
  const videoRemoteBobRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Initialize Alice
    const alice = createUser(
      webSocketServerAlice,
      uriAlice,
      nameAlice,
      passwordAlice,
      uriBob,
      nameBob,
      videoLocalAliceRef.current!,
      videoRemoteAliceRef.current!,
      setAliceControls
    );

    // Initialize Bob
    const bob = createUser(
      webSocketServerBob,
      uriBob,
      nameBob,
      passwordBob,
      uriAlice,
      nameAlice,
      videoLocalBobRef.current!,
      videoRemoteBobRef.current!,
      setBobControls
    );

    setAliceControls((prev) => ({ ...prev, user: alice }));
    setBobControls((prev) => ({ ...prev, user: bob }));

    return () => {
      alice?.disconnect();
      bob?.disconnect();
    };
  }, []);

  const createUser = (
    webSocketServer: string,
    aor: string,
    displayName: string,
    password: string,
    targetAOR: string,
    targetName: string,
    videoLocalElement: HTMLVideoElement,
    videoRemoteElement: HTMLVideoElement,
    setControls: React.Dispatch<React.SetStateAction<UserControls>>
  ): SimpleUser => {
    console.log(`Creating "${displayName}" <${aor}>...`);

    const options: SimpleUserOptions = {
      aor,
      media: {
        constraints: {
          audio: true,
          video: false,
        },
        local: {
          video: videoLocalElement,
        },
        remote: {
          audio: videoRemoteElement,
          video: videoRemoteElement,
        },
      },
      userAgentOptions: {
        authorizationPassword: password,
        displayName,
      },
    };

    const user = new SimpleUser(webSocketServer, options);

    const delegate: SimpleUserDelegate = {
      onCallAnswered: () => {
        console.log(`[${user.id}] call answered`);
        setControls((prev) => ({ ...prev, isHeld: false, isMuted: false }));
      },
      onCallReceived: () => {
        console.log(`[${user.id}] call received`);
        user.answer().catch((error: Error) => {
          console.error(`[${user.id}] failed to answer call`);
          alert(`[${user.id}] Failed to answer call.\n` + error);
        });
      },
      onCallCreated: () => {
        console.log(`[${user.id}] call created`);
        setControls((prev) => ({ ...prev, isInCall: true }));
      },
      onCallHangup: () => {
        console.log(`[${user.id}] call hangup`);
        setControls((prev) => ({
          ...prev,
          isInCall: false,
          isHeld: false,
          isMuted: false,
        }));
      },
      onCallHold: (held: boolean) => {
        console.log(`[${user.id}] call hold ${held}`);
        setControls((prev) => ({ ...prev, isHeld: held }));
      },
      onRegistered: () => {
        console.log(`[${user.id}] registered`);
        setControls((prev) => ({ ...prev, isRegistered: true }));
      },
      onUnregistered: () => {
        console.log(`[${user.id}] unregistered`);
        setControls((prev) => ({ ...prev, isRegistered: false }));
      },
      onServerConnect: () => {
        console.log(`[${user.id}] connected`);
        setControls((prev) => ({ ...prev, isConnected: true }));
      },
      onServerDisconnect: (error?: Error) => {
        console.log(`[${user.id}] disconnected`);
        setControls((prev) => ({
          ...prev,
          isConnected: false,
          isRegistered: false,
          isInCall: false,
        }));
        if (error) {
          alert(`[${user.id}] Server disconnected.\n` + error.message);
        }
      },
    };

    user.delegate = delegate;
    return user;
  };

  // Alice handlers
  const handleConnectAlice = () => {
    aliceControls.user?.connect().catch((error: Error) => {
      console.error(`[${aliceControls.user?.id}] failed to connect`);
      alert(`Failed to connect.\n` + error);
    });
  };

  const handleDisconnectAlice = () => {
    aliceControls.user?.disconnect().catch((error: Error) => {
      console.error(`[${aliceControls.user?.id}] failed to disconnect`);
      alert(`Failed to disconnect.\n` + error);
    });
  };

  const handleRegisterAlice = () => {
    aliceControls.user?.register().catch((error: Error) => {
      console.error(`[${aliceControls.user?.id}] failed to register`);
      alert(`Failed to register.\n` + error);
    });
  };

  const handleUnregisterAlice = () => {
    aliceControls.user?.unregister().catch((error: Error) => {
      console.error(`[${aliceControls.user?.id}] failed to unregister`);
      alert(`Failed to unregister.\n` + error);
    });
  };

  const handleBeginAlice = () => {
    const uri2000 = 'sip:2000@cityonline.real.su';
    aliceControls.user?.call(uri2000).catch((error: Error) => {
      console.error(`[${aliceControls.user?.id}] failed to begin session`);
      alert(`Failed to begin session.\n` + error);
    });
  };

  const handleEndAlice = () => {
    aliceControls.user?.hangup().catch((error: Error) => {
      console.error(`[${aliceControls.user?.id}] failed to end session`);
      alert(`Failed to end session.\n` + error);
    });
  };

  const handleHoldAlice = (held: boolean) => {
    if (held) {
      aliceControls.user?.hold().catch((error: Error) => {
        console.error(`[${aliceControls.user?.id}] failed to hold call`);
        alert('Failed to hold call.\n' + error);
      });
    } else {
      aliceControls.user?.unhold().catch((error: Error) => {
        console.error(`[${aliceControls.user?.id}] failed to unhold call`);
        alert('Failed to unhold call.\n' + error);
      });
    }
  };

  const handleMuteAlice = (muted: boolean) => {
    if (muted) {
      aliceControls.user?.mute();
      if (aliceControls.user?.isMuted() === false) {
        console.error(`[${aliceControls.user?.id}] failed to mute call`);
        alert('Failed to mute call.\n');
      }
    } else {
      aliceControls.user?.unmute();
      if (aliceControls.user?.isMuted() === true) {
        console.error(`[${aliceControls.user?.id}] failed to unmute call`);
        alert('Failed to unmute call.\n');
      }
    }
  };

  // Bob handlers (similar to Alice)
  const handleConnectBob = () => {
    bobControls.user?.connect().catch((error: Error) => {
      console.error(`[${bobControls.user?.id}] failed to connect`);
      alert(`Failed to connect.\n` + error);
    });
  };

  const handleDisconnectBob = () => {
    bobControls.user?.disconnect().catch((error: Error) => {
      console.error(`[${bobControls.user?.id}] failed to disconnect`);
      alert(`Failed to disconnect.\n` + error);
    });
  };

  const handleRegisterBob = () => {
    bobControls.user?.register().catch((error: Error) => {
      console.error(`[${bobControls.user?.id}] failed to register`);
      alert(`Failed to register.\n` + error);
    });
  };

  const handleUnregisterBob = () => {
    bobControls.user?.unregister().catch((error: Error) => {
      console.error(`[${bobControls.user?.id}] failed to unregister`);
      alert(`Failed to unregister.\n` + error);
    });
  };

  const handleBeginBob = () => {
    bobControls.user?.call(uriAlice).catch((error: Error) => {
      console.error(`[${bobControls.user?.id}] failed to begin session`);
      alert(`Failed to begin session.\n` + error);
    });
  };

  const handleEndBob = () => {
    bobControls.user?.hangup().catch((error: Error) => {
      console.error(`[${bobControls.user?.id}] failed to end session`);
      alert(`Failed to end session.\n` + error);
    });
  };

  const handleHoldBob = (held: boolean) => {
    if (held) {
      bobControls.user?.hold().catch((error: Error) => {
        console.error(`[${bobControls.user?.id}] failed to hold call`);
        alert('Failed to hold call.\n' + error);
      });
    } else {
      bobControls.user?.unhold().catch((error: Error) => {
        console.error(`[${bobControls.user?.id}] failed to unhold call`);
        alert('Failed to unhold call.\n' + error);
      });
    }
  };

  const handleMuteBob = (muted: boolean) => {
    if (muted) {
      bobControls.user?.mute();
      if (bobControls.user?.isMuted() === false) {
        console.error(`[${bobControls.user?.id}] failed to mute call`);
        alert('Failed to mute call.\n');
      }
    } else {
      bobControls.user?.unmute();
      if (bobControls.user?.isMuted() === true) {
        console.error(`[${bobControls.user?.id}] failed to unmute call`);
        alert('Failed to unmute call.\n');
      }
    }
  };

  return (
    <div className="app">
      <div className="content">
        {/* Alice Panel */}
        <div className="user-panel">
          <h4>Alice</h4>
          <div className="video-container">
            <video ref={videoRemoteAliceRef} width="100%" muted>
              <p>Your browser doesn't support HTML5 video.</p>
            </video>
            <div className="video-local">
              <video ref={videoLocalAliceRef} width="100%" muted>
                <p>Your browser doesn't support HTML5 video.</p>
              </video>
            </div>
          </div>

          <div className="controls">
            <div className="controls-grid">
              <button onClick={handleConnectAlice} disabled={aliceControls.isConnected}>
                Connect
              </button>
              <button
                onClick={handleRegisterAlice}
                disabled={!aliceControls.isConnected || aliceControls.isRegistered}
              >
                Register
              </button>
              <button
                onClick={handleBeginAlice}
                disabled={!aliceControls.isConnected || aliceControls.isInCall}
              >
                Call
              </button>
              <button onClick={handleEndAlice} disabled={!aliceControls.isInCall}>
                Hang Up
              </button>
              <button
                onClick={handleUnregisterAlice}
                disabled={!aliceControls.isRegistered}
              >
                Unregister
              </button>
              <button
                onClick={handleDisconnectAlice}
                disabled={!aliceControls.isConnected}
              >
                Disconnect
              </button>
            </div>

            <div className="checkboxes">
              <label>
                <input
                  type="checkbox"
                  checked={aliceControls.isHeld}
                  onChange={(e) => handleHoldAlice(e.target.checked)}
                  disabled={!aliceControls.isInCall}
                />
                Hold
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={aliceControls.isMuted}
                  onChange={(e) => handleMuteAlice(e.target.checked)}
                  disabled={!aliceControls.isInCall}
                />
                Mute
              </label>
            </div>
          </div>
        </div>

        {/* Bob Panel */}
        <div className="user-panel">
          <h4>Bob</h4>
          <div className="video-container">
            <video ref={videoRemoteBobRef} width="100%" muted>
              <p>Your browser doesn't support HTML5 video.</p>
            </video>
            <div className="video-local">
              <video ref={videoLocalBobRef} width="100%" muted>
                <p>Your browser doesn't support HTML5 video.</p>
              </video>
            </div>
          </div>

          <div className="controls">
            <div className="controls-grid">
              <button onClick={handleConnectBob} disabled={bobControls.isConnected}>
                Connect
              </button>
              <button
                onClick={handleRegisterBob}
                disabled={!bobControls.isConnected || bobControls.isRegistered}
              >
                Register
              </button>
              <button
                onClick={handleBeginBob}
                disabled={!bobControls.isConnected || bobControls.isInCall}
              >
                Call
              </button>
              <button onClick={handleEndBob} disabled={!bobControls.isInCall}>
                Hang Up
              </button>
              <button onClick={handleUnregisterBob} disabled={!bobControls.isRegistered}>
                Unregister
              </button>
              <button onClick={handleDisconnectBob} disabled={!bobControls.isConnected}>
                Disconnect
              </button>
            </div>

            <div className="checkboxes">
              <label>
                <input
                  type="checkbox"
                  checked={bobControls.isHeld}
                  onChange={(e) => handleHoldBob(e.target.checked)}
                  disabled={!bobControls.isInCall}
                />
                Hold
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={bobControls.isMuted}
                  onChange={(e) => handleMuteBob(e.target.checked)}
                  disabled={!bobControls.isInCall}
                />
                Mute
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
