import { useEffect, useRef, useCallback } from 'react';
import { useAssignmentStore } from '../store/assignmentStore';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000/ws';
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;

export function useWebSocket(assignmentId?: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const subscribedIdRef = useRef<string | null>(null);

  const { setWsConnected, setGenerationProgress, setGeneratedPaper } =
    useAssignmentStore();

  const subscribe = useCallback((id: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe', assignmentId: id }));
      subscribedIdRef.current = id;
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        reconnectAttemptsRef.current = 0;
        console.log('✅ WebSocket connected');

        // Re-subscribe if we had an active subscription
        if (subscribedIdRef.current) {
          subscribe(subscribedIdRef.current);
        } else if (assignmentId) {
          subscribe(assignmentId);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'connected':
              console.log('WS client ID:', data.clientId);
              if (assignmentId) subscribe(assignmentId);
              break;

            case 'status_update':
              setGenerationProgress({
                status: data.status,
                progress: data.progress || 0,
                message: data.message || '',
              });
              break;

            case 'completed':
              setGenerationProgress({
                status: 'completed',
                progress: 100,
                message: 'Question paper ready!',
              });
              if (data.generatedPaper) {
                setGeneratedPaper(data.generatedPaper);
              }
              break;

            case 'failed':
              setGenerationProgress({
                status: 'failed',
                progress: 0,
                message: data.message || 'Generation failed',
              });
              break;
          }
        } catch (err) {
          console.error('WS message parse error:', err);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        console.log('WS disconnected');

        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY);
        }
      };

      ws.onerror = (err) => {
        console.error('WS error:', err);
        ws.close();
      };
    } catch (err) {
      console.error('WS connect error:', err);
    }
  }, [assignmentId, subscribe, setWsConnected, setGenerationProgress, setGeneratedPaper]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  useEffect(() => {
    if (assignmentId && assignmentId !== subscribedIdRef.current) {
      subscribe(assignmentId);
    }
  }, [assignmentId, subscribe]);

  return { subscribe };
}
