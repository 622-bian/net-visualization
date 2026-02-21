/**
 * App.js 的 WebSocket 集成完整示例
 * 
 * 这个文件展示了如何在现有的 App 组件中集成 WebSocket Hook
 * 来接收和处理来自 Mock 服务器的实时数据
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { useWebSocketTopology } from './hooks/useWebSocketTopology';

/**
 * 在 App.js 中的使用示例
 * 
 * 在你现有的 App 函数组件中添加这些代码片段：
 */

// ==================== 1. 导入 Hook ====================
// import { useWebSocketTopology } from './hooks/useWebSocketTopology';

// ==================== 2. 在 App 函数中添加以下代码 ====================

/*
function App() {
  // 其他现有代码...
  
  // ❌ 注释掉原本的 Mock 数据生成
  // const stop = createMockNodeStream(baseNodes, handleUpdateNodeStates);
  // return () => stop();

  // ✅ 改用 WebSocket 数据源
  const handleWebSocketData = useCallback((data) => {
    // data 结构:
    // {
    //   timestamp: 1708500000000,
    //   nodes: [
    //     { id: "R-001", type: "router", lat: 39.905, lng: 116.401, 
    //       altitude: 40, cpuLoad: 45.3, latency: 3.2, status: "normal" },
    //     ...
    //   ]
    // }

    // 将 WebSocket 接收的数据转换为系统内部的更新格式
    const updates = data.nodes.map((wsNode) => ({
      id: wsNode.id,
      location: {
        geo: {
          lat: wsNode.lat,
          lng: wsNode.lng,
          altitude: wsNode.altitude,
        },
      },
      state: {
        online: wsNode.status !== 'offline',
        status: wsNode.status,
      },
      // 可选：也可以保存网络指标供后续使用
      metrics: {
        cpuLoad: wsNode.cpuLoad,
        latency: wsNode.latency,
      },
      timestamp: new Date(data.timestamp).toISOString(),
    }));

    // 调用已有的处理函数
    handleUpdateNodeStates(updates);
  }, [handleUpdateNodeStates]);

  // 连接到 WebSocket 服务器（默认本地 localhost:8080）
  const { connectionStatus } = useWebSocketTopology(
    handleWebSocketData,
    'ws://localhost:8080'
    // or 'wss://your-real-server:8443' for production
  );

  // 在 JSX 中显示连接状态（可选）
  // <div className="websocket-status">
  //   状态: {connectionStatus} (disconnected/connecting/connected)
  // </div>
}
*/

// ==================== 3. 完整的代码集成示例 ====================

export const AppWebSocketIntegrationExample = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '12px' }}>
      <h2>App.js WebSocket 集成步骤</h2>
      
      <h3>步骤 1: 导入 Hook</h3>
      <pre>{`import { useWebSocketTopology } from './hooks/useWebSocketTopology';`}</pre>

      <h3>步骤 2: 创建数据处理回调</h3>
      <pre>{`const handleWebSocketData = useCallback((data) => {
  // data 包含 { timestamp, nodes: [...] }
  const updates = data.nodes.map((wsNode) => ({
    id: wsNode.id,
    location: {
      geo: {
        lat: wsNode.lat,
        lng: wsNode.lng,
        altitude: wsNode.altitude,
      },
    },
    state: {
      online: wsNode.status !== 'offline',
      status: wsNode.status,
    },
    timestamp: new Date(data.timestamp).toISOString(),
  }));

  handleUpdateNodeStates(updates);
}, [handleUpdateNodeStates]);`}</pre>

      <h3>步骤 3: 使用 Hook</h3>
      <pre>{`const { connectionStatus } = useWebSocketTopology(
  handleWebSocketData,
  'ws://localhost:8080'
);`}</pre>

      <h3>步骤 4: （可选）显示连接状态</h3>
      <pre>{`<div className="websocket-indicator">
  WebSocket: <span style={{
    color: connectionStatus === 'connected' ? 'green' : 
           connectionStatus === 'connecting' ? 'orange' : 'red'
  }}>
    {connectionStatus}
  </span>
</div>`}</pre>

      <h3>数据流向</h3>
      <pre>{`
Mock Server (ws://localhost:8080)
           ↓
    WebSocket Message
   { timestamp, nodes }
           ↓
  useWebSocketTopology Hook
           ↓
  handleWebSocketData Callback
           ↓
  handleUpdateNodeStates(updates)
           ↓
  Leaflet Marker.setLatLng() (直接更新)
           ↓
    地图中的图标平滑移动
      `}</pre>

      <h3>常用配置</h3>
      <pre>{`// 本地开发（Mock 服务器）
const { connectionStatus } = useWebSocketTopology(
  handleWebSocketData,
  'ws://localhost:8080'
);

// 远程生产环境
const { connectionStatus } = useWebSocketTopology(
  handleWebSocketData,
  'wss://api.example.com:8443/topology'
);`}</pre>

      <h3>调试技巧</h3>
      <pre>{`// 在浏览器控制台中检查接收的数据
// 修改 useWebSocketTopology 的 onmessage 处理，添加日志：
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('[WebSocket] 接收数据:', data);  // 检查数据格式
  console.log('[WebSocket] 节点数:', data.nodes.length);
  console.log('[WebSocket] 时间戳:', new Date(data.timestamp).toLocaleString());
};`}</pre>
    </div>
  );
};

export default AppWebSocketIntegrationExample;
