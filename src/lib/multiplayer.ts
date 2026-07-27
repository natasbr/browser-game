// ============================================================
// STANDARD P2P MULTIPLAYER CONNECTION SYSTEM
// ============================================================
//
// Uses PeerJS for browser-to-browser communication.
// Standard implementation following the standard PeerJS guide.

import { Peer, DataConnection } from 'peerjs';
import { NetworkMessage } from '../types';

export let peer: Peer | null = null;
export let conn: DataConnection | null = null;

// Callback hooks for UI/Game engine
type MessageHandler = (data: NetworkMessage) => void;
type StatusHandler = (status: string) => void;
type EstablishedHandler = () => void;
type ClosedHandler = () => void;
type ErrorHandler = (error: unknown) => void;

let messageCallback: MessageHandler | null = null;
let statusCallback: StatusHandler | null = null;
let establishedCallback: EstablishedHandler | null = null;
let closedCallback: ClosedHandler | null = null;
let errorCallback: ErrorHandler | null = null;

export function registerNetworkCallbacks(callbacks: {
  onMessage?: MessageHandler;
  onStatus?: StatusHandler;
  onEstablished?: EstablishedHandler;
  onClosed?: ClosedHandler;
  onError?: ErrorHandler;
}) {
  if (callbacks.onMessage) messageCallback = callbacks.onMessage;
  if (callbacks.onStatus) statusCallback = callbacks.onStatus;
  if (callbacks.onEstablished) establishedCallback = callbacks.onEstablished;
  if (callbacks.onClosed) closedCallback = callbacks.onClosed;
  if (callbacks.onError) errorCallback = callbacks.onError;
}

// ============================================================
// GENERATE A RANDOM 4-DIGIT PEER ID
// ============================================================
export function generateRandomId(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// ============================================================
// CREATE HOST
// ============================================================
export function createHost(overrideId?: string): string {
  disconnectMultiplayer();

  const hostId = overrideId || generateRandomId();

  try {
    peer = new Peer(hostId);

    peer.on('open', (id) => {
      console.log('HOST READY. My Peer ID:', id);
      onConnectionStatus(`Waiting for cast player... Code: ${id}`);
    });

    peer.on('connection', (connection) => {
      conn = connection;
      console.log('Player connected:', conn.peer);
      setupConnection();
      onConnectionEstablished();
    });

    peer.on('error', (error) => {
      console.error('PeerJS Error:', error);
      onConnectionError(error);
    });

    peer.on('disconnected', () => {
      console.log('Peer disconnected from PeerJS server.');
      onConnectionStatus('Disconnected from signaling server.');
      if (peer && !peer.destroyed) {
        try {
          peer.reconnect();
        } catch {
          // ignore
        }
      }
    });
  } catch (err) {
    console.error('Failed to create host Peer:', err);
    onConnectionError(err);
  }

  return hostId;
}

// ============================================================
// CREATE CLIENT
// ============================================================
export function createClient(): void {
  if (peer && !peer.destroyed) {
    return;
  }

  try {
    peer = new Peer(generateRandomId());

    peer.on('open', (id) => {
      console.log('CLIENT READY. My Peer ID:', id);
      onConnectionStatus('Ready to connect.');
    });

    peer.on('error', (error) => {
      console.error('PeerJS Error:', error);
      onConnectionError(error);
    });

    peer.on('disconnected', () => {
      console.log('Client peer disconnected from signaling server.');
      if (peer && !peer.destroyed) {
        try {
          peer.reconnect();
        } catch {
          // ignore
        }
      }
    });
  } catch (err) {
    console.error('Failed to create client Peer:', err);
    onConnectionError(err);
  }
}

// ============================================================
// CONNECT TO HOST
// ============================================================
export function connectToHost(hostId: string): void {
  hostId = hostId.trim();

  if (!hostId) {
    console.warn('No host ID provided.');
    return;
  }

  const doConnect = () => {
    if (!peer || peer.destroyed) return;
    console.log('Connecting to host:', hostId);
    onConnectionStatus('Connecting to host...');

    conn = peer.connect(hostId, {
      reliable: true,
    });

    conn.on('open', () => {
      console.log('Connected to host:', conn?.peer);
      setupConnection();
      onConnectionEstablished();
    });

    conn.on('error', (error) => {
      console.error('Connection Error:', error);
      onConnectionError(error);
    });

    conn.on('close', () => {
      console.log('Connection closed.');
      onConnectionClosed();
    });
  };

  if (!peer || peer.destroyed) {
    peer = new Peer(generateRandomId());
    peer.on('open', () => {
      doConnect();
    });
    peer.on('error', (error) => {
      console.error('PeerJS Error:', error);
      onConnectionError(error);
    });
  } else if (peer.open) {
    doConnect();
  } else {
    peer.once('open', () => {
      doConnect();
    });
  }
}

// ============================================================
// SETUP THE DATA CONNECTION
// ============================================================
export function setupConnection(): void {
  if (!conn) return;

  conn.on('data', (data) => {
    console.log('Received data:', data);
    handleNetworkMessage(data as NetworkMessage);
  });

  conn.on('close', () => {
    console.log('Connection closed.');
    onConnectionClosed();
  });

  conn.on('error', (error) => {
    console.error('Data connection error:', error);
    onConnectionError(error);
  });
}

// ============================================================
// SEND DATA
// ============================================================
export function sendData<T = unknown>(type: string, payload: T = {} as T): void {
  if (conn && conn.open) {
    conn.send({
      type: type,
      payload: payload,
    });
  } else {
    console.warn('Cannot send data. P2P connection is not open.');
  }
}

// ============================================================
// RECEIVE AND PROCESS NETWORK MESSAGES
// ============================================================
export function handleNetworkMessage(data: NetworkMessage): void {
  if (!data || !data.type) {
    console.warn('Invalid network message:', data);
    return;
  }

  if (messageCallback) {
    messageCallback(data);
  }

  switch (data.type) {
    case 'player_move':
      console.log('Remote player moved:', data.payload);
      break;

    case 'player_ready':
      console.log('Remote player is ready.');
      break;

    case 'game_state':
      console.log('Received game state:', data.payload);
      break;

    default:
      console.log('Network message received:', data.type);
      break;
  }
}

// ============================================================
// DISCONNECT EVERYTHING
// ============================================================
export function disconnectMultiplayer(): void {
  if (conn) {
    try {
      conn.close();
    } catch {
      // ignore
    }
    conn = null;
  }

  if (peer) {
    try {
      peer.destroy();
    } catch {
      // ignore
    }
    peer = null;
  }

  console.log('Multiplayer connection destroyed.');
}

// ============================================================
// CONNECTION CALLBACKS
// ============================================================
function onConnectionEstablished(): void {
  console.log('MULTIPLAYER CONNECTED');
  if (establishedCallback) establishedCallback();
}

function onConnectionClosed(): void {
  console.log('MULTIPLAYER DISCONNECTED');
  if (closedCallback) closedCallback();
}

function onConnectionStatus(message: string): void {
  console.log('P2P STATUS:', message);
  if (statusCallback) statusCallback(message);
}

function onConnectionError(error: unknown): void {
  console.error('P2P ERROR:', error);
  if (errorCallback) errorCallback(error);
}

