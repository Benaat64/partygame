import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export function useRoom() {
  const socketRef = useRef(null);
  const busy = useRef(false);
  const tokenRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [session, setSession] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try { tokenRef.current = sessionStorage.getItem('partyroom-session'); } catch { /* Storage may be disabled. */ }
    const socket = io();
    socketRef.current = socket;
    socket.on('connect', async () => {
      setConnected(false);
      if (tokenRef.current) {
        try {
          const response = await socket.timeout(5000).emitWithAck('room:resume', tokenRef.current);
          if (!socket.connected || socketRef.current !== socket) return;
          if (response.ok) {
            setSession({ room: response.room, playerId: response.playerId, secret: response.secret });
            setError('');
          } else {
            tokenRef.current = null;
            try { sessionStorage.removeItem('partyroom-session'); } catch { /* Optional storage. */ }
            setSession(null);
            setError(response.error);
          }
        } catch {
          if (socketRef.current === socket && socket.connected) { socket.disconnect(); socket.connect(); }
          return;
        }
      }
      setConnected(true);
    });
    socket.on('connect_error', () => setConnected(false));
    socket.on('disconnect', () => {
      setConnected(false);
      setSession(null);
      setError('Connexion interrompue. Reconnexion automatique en cours (place réservée 60 secondes).');
    });
    socket.on('room:updated', room => {
      setSession(current => current?.room.code === room.code
        ? { ...current, room, secret: current.room.gameSessionId === room.gameSessionId ? current.secret : null }
        : current);
    });
    socket.on('game:private', secret => {
      setSession(current => current?.room.gameSessionId === secret.gameSessionId
        ? { ...current, secret } : current);
    });
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  async function request(event, payload) {
    const socket = socketRef.current;
    if (busy.current) return;
    if (!socket?.connected) {
      setError('Le serveur est indisponible. Patientez pendant la reconnexion.');
      return;
    }
    busy.current = true;
    setPending(true);
    setError('');
    try {
      const response = event === 'room:leave'
        ? await socket.timeout(5000).emitWithAck(event)
        : await socket.timeout(5000).emitWithAck(event, payload);
      if (!response.ok) throw new Error(response.error);
      if (event === 'room:leave') {
        setSession(null);
        tokenRef.current = null;
        try { sessionStorage.removeItem('partyroom-session'); } catch { /* Optional storage. */ }
      }
      else if (event === 'room:create' || event === 'room:join') {
        tokenRef.current = response.resumeToken;
        try { sessionStorage.setItem('partyroom-session', response.resumeToken); } catch { /* Reconnection still works without refresh. */ }
        setSession({ room: response.room, playerId: response.playerId, secret: null });
      }
      return true;
    } catch (err) {
      setError(err.message === 'operation has timed out'
        ? 'Le serveur ne répond pas. La connexion a été réinitialisée ; réessayez.'
        : err.message);
      if (err.message === 'operation has timed out') {
        socket.disconnect();
        socket.connect();
      }
      return false;
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  return { connected, session, pending, error, request };
}
