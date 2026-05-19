import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

let socketInstance = null;

/**
 * Singleton Socket.IO hook.
 * - Prevents duplicate connections across re-renders / StrictMode double-mount.
 * - Handles auto-reconnect (built into socket.io-client).
 * - Deduplicates events using a seen-ID Set (pass eventId to deduplicate).
 */
export function useSocket(onNewFeed, onDeleteFeed, onStatusChange, onUpdateFeed) {
  const seenIds = useRef(new Set());
  const onNewFeedRef = useRef(onNewFeed);
  const onDeleteFeedRef = useRef(onDeleteFeed);
  const onStatusChangeRef = useRef(onStatusChange);
  const onUpdateFeedRef = useRef(onUpdateFeed);

  // Keep refs in sync so we don't need to re-bind socket events on every render
  useEffect(() => { onNewFeedRef.current = onNewFeed; }, [onNewFeed]);
  useEffect(() => { onDeleteFeedRef.current = onDeleteFeed; }, [onDeleteFeed]);
  useEffect(() => { onStatusChangeRef.current = onStatusChange; }, [onStatusChange]);
  useEffect(() => { onUpdateFeedRef.current = onUpdateFeed; }, [onUpdateFeed]);

  useEffect(() => {
    // Re-use existing singleton connection
    if (!socketInstance) {
      socketInstance = io(
        process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000',
        {
          transports: ['polling', 'websocket'],
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 10000,
          upgrade: true,
        }
      );
    }

    const socket = socketInstance;

    const handleConnect = () => {
      console.log('🔌 Socket connected:', socket.id);
      onStatusChangeRef.current?.('connected');
    };

    const handleDisconnect = (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      onStatusChangeRef.current?.('disconnected');
    };

    const handleReconnectAttempt = (attempt) => {
      console.log(`🔄 Reconnect attempt #${attempt}`);
      onStatusChangeRef.current?.('reconnecting');
    };

    const handleNewFeed = (feed) => {
      // Deduplicate: skip if we've already processed this _id
      if (seenIds.current.has(feed._id)) return;
      seenIds.current.add(feed._id);
      // Prevent unbounded growth
      if (seenIds.current.size > 500) seenIds.current.clear();
      onNewFeedRef.current?.(feed);
    };

    const handleDeleteFeed = ({ _id }) => {
      onDeleteFeedRef.current?.(_id);
    };

    const handleUpdateFeed = (feed) => {
      onUpdateFeedRef.current?.(feed);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('new_feed', handleNewFeed);
    socket.on('delete_feed', handleDeleteFeed);
    socket.on('update_feed', handleUpdateFeed);

    // Set initial status
    if (socket.connected) onStatusChangeRef.current?.('connected');

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('new_feed', handleNewFeed);
      socket.off('delete_feed', handleDeleteFeed);
      socket.off('update_feed', handleUpdateFeed);
    };
  }, []);
}
