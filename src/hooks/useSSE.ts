import { useEffect, useRef, useCallback, useState } from 'react';

type EventCallback<T = any> = (data: T) => void;
type ErrorCallback = (error: Event) => void;

interface UseSSEOptions {
  url: string;
  eventHandlers?: Record<string, EventCallback>;
  onMessage?: EventCallback;
  onError?: ErrorCallback;
  onOpen?: () => void;
  onClose?: () => void;
  autoConnect?: boolean; // 新增：是否自动连接
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface UseSSEReturn {
  isConnected: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lastMessage: any;
  error: Error | null;
  connect: () => void;
  disconnect: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendMessage: (data: any, eventType?: string) => void;
}

export const useSSE = ({
  url,
  eventHandlers = {},
  onMessage,
  onError,
  onOpen,
  onClose,
  autoConnect = true, // 默认自动连接
  autoReconnect = true,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5,
}: UseSSEOptions): UseSSEReturn => {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0); 
  const reconnectTimerRef = useRef<number | null>(null); 
  const isConnectingRef = useRef(false);

  const [isConnected, setIsConnected] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);

  // 清理函数
  const cleanup = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    isConnectingRef.current = false;
  }, []);

  // 断开连接
  const disconnect = useCallback(() => {
    console.log('Disconnecting SSE...');
    cleanup();
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    setIsConnected(false);
    onClose?.();
  }, [cleanup, onClose]);

  // 重连逻辑
  const attemptReconnect = useCallback(() => {
    if (!autoReconnect) return;
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    console.log(`Attempting to reconnect... (${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
    
    reconnectTimerRef.current = setTimeout(() => {
      reconnectAttemptsRef.current += 1;
      // eslint-disable-next-line react-hooks/immutability
      connect();
    }, reconnectInterval);
  }, [autoReconnect, maxReconnectAttempts, reconnectInterval]);

  // 连接函数
  const connect = useCallback(() => {
    // 防止重复连接
    if (isConnectingRef.current || eventSourceRef.current?.readyState === EventSource.OPEN) {
      console.log('SSE already connecting or connected');
      return;
    }

    console.log('Connecting to SSE:', url);
    isConnectingRef.current = true;

    // 清理旧的连接
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      // 连接成功
      eventSource.onopen = () => {
        console.log('SSE connected successfully');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        isConnectingRef.current = false;
        onOpen?.();

      };

      // 通用消息处理器
      eventSource.onmessage = (event) => {
        try {
          const data = event.data;
          console.log('Received SSE message:', data);
          setLastMessage(data);
          onMessage?.(data);
          
          if (eventHandlers.message) {
            eventHandlers.message(data);
          }
        } catch (err) {
          console.error('Failed to parse SSE message:', err);
        }
      };

      // 注册自定义事件处理器
      Object.entries(eventHandlers).forEach(([eventType, handler]) => {
        if (eventType !== 'message') {
          eventSource.addEventListener(eventType, (event) => {
            try {
              const data = JSON.parse((event as MessageEvent).data);
              console.log(`Received ${eventType} event:`, data);
              handler(data);
            } catch (err) {
              console.error(`Failed to parse ${eventType} event:`, err);
            }
          });
        }
      });

      // 错误处理
      eventSource.onerror = (event) => {
        console.error('SSE connection error:', event);
        setIsConnected(false);
        isConnectingRef.current = false;
        setError(new Error('SSE connection error'));
        onError?.(event);
        
        // 检查连接状态
        const readyState = eventSource.readyState;
        console.log('EventSource readyState:', readyState);
        
        if (readyState === EventSource.CLOSED) {
          attemptReconnect();
        }
      };

    } catch (err) {
      console.error('Failed to create EventSource:', err);
      isConnectingRef.current = false;
      setError(err instanceof Error ? err : new Error('Failed to create EventSource'));
      attemptReconnect();
    }
  }, [url, eventHandlers, onMessage, onError, onOpen, attemptReconnect]);

  // 初始化连接 - 修改 useEffect
  useEffect(() => {
    console.log('SSE Hook mounted, autoConnect:', autoConnect);
    
    if (autoConnect) {
      // connect();
    }

    // 组件卸载时清理
    return () => {
      console.log('SSE Hook unmounting, cleaning up...');
      disconnect(); 
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    error,
    connect,
    disconnect,
    sendMessage: () => console.warn('EventSource does not support sending messages'),
  };
};