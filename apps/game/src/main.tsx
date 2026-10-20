import { GAME_SOCKET_PATH } from '@casino/contracts';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createGameBus } from './bus/gameBus.ts';
import { ServerConnection } from './net/ServerConnection.ts';
import { ClientStateStore } from './state/ClientStateStore.ts';
import { App } from './ui/App.tsx';
import './styles.css';

const bus = createGameBus();
const store = new ClientStateStore(bus);
const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
new ServerConnection(bus, `${protocol}://${window.location.host}${GAME_SOCKET_PATH}`).open();

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');
createRoot(root).render(
  <StrictMode>
    <App bus={bus} store={store} />
  </StrictMode>,
);
