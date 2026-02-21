/**
 * WebSocket 客户端 Hook
 * 用于连接到本地 Mock WebSocket 服务器并接收实时网络拓扑更新
 */

import React from 'react';

export function useWebSocketTopology(onDataReceived, url = 'ws://localhost:8080') {
  const wsRef = React.useRef(null);
  const reconnectTimeoutRef = React.useRef(null);
  const [connectionStatus, setConnectionStatus] = React.useState('disconnected'); // disconnected, connecting, connected

  React.useEffect(() => {
    let mounted = true;

    const connect = () => {
      if (!mounted) return;

      setConnectionStatus('connecting');
      console.log(`[WebSocket] 正在连接到 ${url}...`);

      try {
        const ws = new WebSocket(url);

        ws.onopen = () => {
          if (!mounted) return;
          setConnectionStatus('connected');
          console.log('[WebSocket] ✅ 已连接');
        };

        ws.onmessage = (event) => {
          if (!mounted) return;

          try {
            const data = JSON.parse(event.data);

            // 检查数据格式
            if (!data || typeof data !== 'object') {
              console.warn('[WebSocket] 无效的数据格式:', data);
              return;
            }

            if (data.type === 'connected') {
              console.log('[WebSocket] 客户端 ID:', data.clientId);
              return;
            }

            // 处理拓扑数据更新 - 确保 nodes 是数组
            if (data.timestamp && Array.isArray(data.nodes) && data.nodes.length >= 0) {
              console.log(`[WebSocket] 📨 接收数据 (${data.nodes.length} 个节点更新)`, data);
              onDataReceived && onDataReceived(data);
            } else {
              console.warn('[WebSocket] 数据格式不正确或缺少 nodes 数组:', data);
            }
          } catch (error) {
            console.error('[WebSocket] 解析消息失败:', error);
          }
        };

        ws.onerror = (error) => {
          if (!mounted) return;
          setConnectionStatus('disconnected');
          console.error('[WebSocket] ❌ 连接错误:', error);
        };

        ws.onclose = () => {
          if (!mounted) return;
          setConnectionStatus('disconnected');
          console.log('[WebSocket] 🔌 已断开连接，5秒后尝试重新连接...');
          reconnectTimeoutRef.current = setTimeout(connect, 5000);
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('[WebSocket] 连接失败:', error);
        setConnectionStatus('disconnected');
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      mounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url, onDataReceived]);

  return {
    ws: wsRef.current,
    connectionStatus,
  };
}
