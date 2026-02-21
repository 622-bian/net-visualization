/**
 * WebSocket 集成示例
 * 展示如何在现有 React 组件中集成 WebSocket 实时数据
 */

import React, { useCallback, useEffect } from 'react';
import { useWebSocketTopology } from '../hooks/useWebSocketTopology';

/**
 * 使用示例：在 App 组件中添加以下代码
 */
export function WebSocketIntegrationExample() {
  // 你可以将这个代码添加到 App.js 的主组件中

  const handleWebSocketData = useCallback((data) => {
    // data 格式：
    // {
    //   timestamp: 1708500000000,
    //   nodes: [
    //     {
    //       id: "SAT-901",
    //       type: "satellite",
    //       lat: 39.912,
    //       lng: 116.404,
    //       altitude: 550000,
    //       cpuLoad: 58.5,
    //       latency: 35.2,
    //       status: "normal" | "warning" | "offline"
    //     },
    //     ...
    //   ]
    // }

    // 你可以在这里：
    // 1. 直接更新 Leaflet Markers 的位置和状态
    // 2. 更新节点的属性（CPU 负载、延迟）
    // 3. 根据状态改变图标或颜色

    // 示例：直接操作 Leaflet Markers（如果有的话）
    data.nodes.forEach((nodeUpdate) => {
      const marker = markerRefsById.current[nodeUpdate.id];
      if (marker) {
        const latLng = [nodeUpdate.lat, nodeUpdate.lng];
        marker.setLatLng(latLng);
        // 也可以根据 status 修改图标颜色或样式
      }
    });
  }, []);

  // 连接到本地 WebSocket 服务器
  const { connectionStatus } = useWebSocketTopology(
    handleWebSocketData,
    'ws://localhost:8080'
  );

  return (
    <div className="websocket-status" style={{ padding: '10px', fontSize: '12px' }}>
      WebSocket 状态:{' '}
      <span
        style={{
          color:
            connectionStatus === 'connected'
              ? '#35f29a'
              : connectionStatus === 'connecting'
                ? '#f4c84a'
                : '#f95d5d',
        }}
      >
        {connectionStatus === 'connected'
          ? '✅ 已连接'
          : connectionStatus === 'connecting'
            ? '⏳ 连接中...'
            : '❌ 未连接'}
      </span>
    </div>
  );
}

/**
 * 使用说明：
 *
 * 1. 确保 Mock 服务器正在运行：
 *    cd server
 *    npm install
 *    npm start
 *
 * 2. 在 App.js 中导入并使用 useWebSocketTopology：
 *    import { useWebSocketTopology } from './hooks/useWebSocketTopology';
 *
 * 3. 在 App 组件中使用该 hook：
 *    const handleWebSocketData = useCallback((data) => {
 *      // 处理实时节点更新
 *      data.nodes.forEach((nodeUpdate) => {
 *        // 更新 Leaflet Marker 的位置、状态等
 *      });
 *    }, [dependencies]);
 *
 *    const { connectionStatus } = useWebSocketTopology(
 *      handleWebSocketData,
 *      'ws://localhost:8080'
 *    );
 *
 * 4. 接收的数据格式：
 *    {
 *      timestamp: number (毫秒时间戳),
 *      nodes: [
 *        {
 *          id: string (节点 ID),
 *          type: string (节点类型: router, base-station, mesh-node, terminal, satellite),
 *          lat: number (纬度),
 *          lng: number (经度),
 *          altitude: number (高度米数),
 *          cpuLoad: number (CPU 负载百分比),
 *          latency: number (延迟毫秒),
 *          status: string (状态: normal, warning, offline)
 *        },
 *        ...
 *      ]
 *    }
 *
 * 5. 连接状态 (connectionStatus)：
 *    - 'disconnected': 未连接或已断开
 *    - 'connecting': 正在连接
 *    - 'connected': 已连接
 */
