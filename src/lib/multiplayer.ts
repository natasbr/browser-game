// ============================================================
// DUAL-PLAYER P2P MULTIPLAYER SYSTEM (PEERJS)
// ============================================================

import { Peer, DataConnection } from 'peerjs';
import { NetworkMessage, PlayerSlot } from '../types';

export interface HostState {
  p1Pin: string;
  p2Pin: string;
  isP1Connected: boolean;
  isP2Connected: boolean;
}

// Global Host References
let peerP1: Peer | null = null;
let peerP2: Peer | null = null;
let connP1: DataConnection | null = null;
let connP2: DataConnection | null = null;

// Global Client Reference
let clientPeer: Peer | null = null;
let clientConn: DataConnection | null = null;
let assignedSlot: PlayerSlot | null = null;

// Host Callbacks
type HostMessageCallback = (slot: PlayerSlot, msg: NetworkMessage) => void;
type HostStatusCallback = (state: HostState) => void;

let hostMessageCb: HostMessageCallback | null = null;
let hostStatusCb: HostStatusCallback | null = null;

// Client Callbacks
type ClientMessageCallback = (msg: NetworkMessage) => void;
type ClientStatusCallback = (status: string, isConnected: boolean, slot: PlayerSlot | null) => void;

let clientMessageCb: ClientMessageCallback | null = null;
let clientStatusCb: ClientStatusCallback | null = null;

export function generateRandomPin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// ============================================================
// HOST SIDE: CREATE 2-PLAYER HOST WITH TWO PINS
// ============================================================
export function createTwoPlayerHost(): { p1Pin: string; p2Pin: string } {
  disconnectMultiplayer();

  const p1Pin = generateRandomPin();
  let p2Pin = generateRandomPin();
  while (p2Pin === p1Pin) {
    p2Pin = generateRandomPin();
  }

  const notifyHostStatus = () => {
    if (hostStatusCb) {
      hostStatusCb({
        p1Pin,
        p2Pin,
        isP1Connected: Boolean(connP1 && connP1.open),
        isP2Connected: Boolean(connP2 && connP2.open),
      });
    }
  };

  try {
    // --- PEER FOR P1 ---
    peerP1 = new Peer(p1Pin);
    peerP1.on('open', () => {
      console.log('HOST P1 Peer Ready:', p1Pin);
      notifyHostStatus();
    });

    peerP1.on('connection', (connection) => {
      connP1 = connection;
      console.log('P1 Connected:', connP1.peer);

      connP1.on('open', () => {
        notifyHostStatus();
        // Handshake Ack
        sendToSlot('P1', 'host_ack', { playerSlot: 'P1', message: 'Connected as Player 1' });
      });

      connP1.on('data', (data) => {
        if (hostMessageCb) {
          hostMessageCb('P1', data as NetworkMessage);
        }
      });

      connP1.on('close', () => {
        connP1 = null;
        console.log('P1 Disconnected');
        notifyHostStatus();
      });

      connP1.on('error', (err) => {
        console.error('P1 Conn Error:', err);
      });
    });

    // --- PEER FOR P2 ---
    peerP2 = new Peer(p2Pin);
    peerP2.on('open', () => {
      console.log('HOST P2 Peer Ready:', p2Pin);
      notifyHostStatus();
    });

    peerP2.on('connection', (connection) => {
      connP2 = connection;
      console.log('P2 Connected:', connP2.peer);

      connP2.on('open', () => {
        notifyHostStatus();
        // Handshake Ack
        sendToSlot('P2', 'host_ack', { playerSlot: 'P2', message: 'Connected as Player 2' });
      });

      connP2.on('data', (data) => {
        if (hostMessageCb) {
          hostMessageCb('P2', data as NetworkMessage);
        }
      });

      connP2.on('close', () => {
        connP2 = null;
        console.log('P2 Disconnected');
        notifyHostStatus();
      });

      connP2.on('error', (err) => {
        console.error('P2 Conn Error:', err);
      });
    });
  } catch (err) {
    console.error('Failed to create 2-Player Host Peers:', err);
  }

  return { p1Pin, p2Pin };
}

export function registerHostCallbacks(callbacks: {
  onMessage?: HostMessageCallback;
  onStatus?: HostStatusCallback;
}) {
  if (callbacks.onMessage) hostMessageCb = callbacks.onMessage;
  if (callbacks.onStatus) hostStatusCb = callbacks.onStatus;
}

export function sendToSlot<T = unknown>(slot: PlayerSlot, type: string, payload: T) {
  const target = slot === 'P1' ? connP1 : connP2;
  if (target && target.open) {
    target.send({ type, payload, playerSlot: slot });
  }
}

export function broadcastGameState<T = unknown>(type: string, payload: T) {
  sendToSlot('P1', type, payload);
  sendToSlot('P2', type, payload);
}

// ============================================================
// CLIENT SIDE: CONNECT TO HOST PIN (P1 or P2)
// ============================================================
export function connectClientToHost(targetPin: string) {
  targetPin = targetPin.trim();
  if (!targetPin) return;

  if (clientConn) {
    try {
      clientConn.close();
    } catch {
      // ignore
    }
    clientConn = null;
  }

  if (clientPeer) {
    try {
      clientPeer.destroy();
    } catch {
      // ignore
    }
    clientPeer = null;
  }

  const updateClientStatus = (status: string, isConn: boolean) => {
    if (clientStatusCb) {
      clientStatusCb(status, isConn, assignedSlot);
    }
  };

  updateClientStatus(`Connecting to PIN ${targetPin}...`, false);

  try {
    clientPeer = new Peer(generateRandomPin());

    clientPeer.on('open', () => {
      console.log('Client Peer Open. Connecting to target:', targetPin);
      clientConn = clientPeer!.connect(targetPin, { reliable: true });

      clientConn.on('open', () => {
        console.log('Connected to Host PIN:', targetPin);
        updateClientStatus('CONNECTED TO HOST!', true);
      });

      clientConn.on('data', (data) => {
        const msg = data as NetworkMessage;
        if (msg.type === 'host_ack') {
          const ack = msg.payload as { playerSlot: PlayerSlot };
          assignedSlot = ack.playerSlot;
          updateClientStatus(`CONNECTED AS ${assignedSlot}!`, true);
        }
        if (clientMessageCb) {
          clientMessageCb(msg);
        }
      });

      clientConn.on('close', () => {
        clientConn = null;
        assignedSlot = null;
        updateClientStatus('Disconnected from Host.', false);
      });

      clientConn.on('error', (err) => {
        console.error('Client Connection Error:', err);
        updateClientStatus('Connection Error. Check PIN.', false);
      });
    });

    clientPeer.on('error', (err) => {
      console.error('Client Peer Error:', err);
      updateClientStatus('P2P Error. Please try again.', false);
    });
  } catch (err) {
    console.error('Client initialization failed:', err);
    updateClientStatus('Failed to start client.', false);
  }
}

export function registerClientCallbacks(callbacks: {
  onMessage?: ClientMessageCallback;
  onStatus?: ClientStatusCallback;
}) {
  if (callbacks.onMessage) clientMessageCb = callbacks.onMessage;
  if (callbacks.onStatus) clientStatusCb = callbacks.onStatus;
}

export function sendClientMessage<T = unknown>(type: string, payload: T) {
  if (clientConn && clientConn.open) {
    clientConn.send({ type, payload, playerSlot: assignedSlot || undefined });
  }
}

// ============================================================
// CLEANUP & DISCONNECT
// ============================================================
export function disconnectMultiplayer() {
  if (connP1) {
    try { connP1.close(); } catch { /* ignore */ }
    connP1 = null;
  }
  if (connP2) {
    try { connP2.close(); } catch { /* ignore */ }
    connP2 = null;
  }
  if (peerP1) {
    try { peerP1.destroy(); } catch { /* ignore */ }
    peerP1 = null;
  }
  if (peerP2) {
    try { peerP2.destroy(); } catch { /* ignore */ }
    peerP2 = null;
  }
  if (clientConn) {
    try { clientConn.close(); } catch { /* ignore */ }
    clientConn = null;
  }
  if (clientPeer) {
    try { clientPeer.destroy(); } catch { /* ignore */ }
    clientPeer = null;
  }
  assignedSlot = null;
  console.log('All P2P connections cleaned up.');
}


