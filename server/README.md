# Mock WebSocket 服务器 - 启动指南

## 概述

这是一个本地 WebSocket 模拟服务器，用于模拟后端推送实时网络拓扑数据，支持前端的测试和开发，而无需等待真实的后端服务。

## 功能特性

### 1. 完整的节点初始化
- 9 个网络节点（路由器、基站、自组网节点、终端、卫星）
- 符合项目的多层网络架构（骨干网、接入网、自组网、边缘）
- 初始化位置在北京周边地区

### 2. 实时数据更新
- **每秒更新一次**，模拟真实网络的数据刷新
- **移动节点**（无人机 MN-201、MN-202，卫星 SAT-901）：
  - 每次更新时位置产生微小增量，模拟飞行轨迹
  - 速度矢量 + 随机抖动，增加真实感
- **固定节点**（路由器、基站、终端）：
  - 位置保持不变
- **属性波动**：
  - CPU 负载：基础值 ±15% 随机波动
  - 网络延迟：基础值 ±30% 随机波动
  - 节点状态：0.5% 概率变为 warning，0.1% 概率变为 offline

### 3. WebSocket 广播
- 每次数据更新通过 WebSocket 广播给所有已连接的客户端
- 消息格式为 JSON，包含时间戳和所有节点的最新状态

## 安装与启动

### 前置要求
- Node.js (v14+)
- npm

### 步骤 1：安装依赖

```bash
cd server
npm install
```

会自动安装 `ws` 库（WebSocket 服务器库）。

### 步骤 2：启动服务器

```bash
npm start
```

或者直接运行：

```bash
node mockWebSocketServer.js
```

### 启动成功的输出

```
========================================
🚀 多层网络拓扑 Mock WebSocket 服务器
========================================
📍 服务地址: ws://localhost:8080
📍 健康检查: http://localhost:8080/health
📊 节点数量: 9
⏱️  更新频率: 每秒 1000ms
========================================

等待客户端连接...
```

## 数据格式

### 消息格式

```json
{
  "timestamp": 1708500000000,
  "nodes": [
    {
      "id": "R-001",
      "type": "router",
      "lat": 39.905,
      "lng": 116.401,
      "altitude": 40,
      "cpuLoad": 45.3,
      "latency": 3.2,
      "status": "normal"
    },
    {
      "id": "SAT-901",
      "type": "satellite",
      "lat": 39.94,
      "lng": 116.408,
      "altitude": 550000,
      "cpuLoad": 58.5,
      "latency": 35.2,
      "status": "normal"
    },
    ...
  ]
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `timestamp` | number | 消息发送时的时间戳（毫秒） |
| `id` | string | 节点唯一标识符 |
| `type` | string | 节点类型：`router` / `base-station` / `mesh-node` / `terminal` / `satellite` |
| `lat` | number | 地理纬度 |
| `lng` | number | 地理经度 |
| `altitude` | number | 高度（米） |
| `cpuLoad` | number | CPU 负载（百分比，0-100） |
| `latency` | number | 网络延迟（毫秒） |
| `status` | string | 节点状态：`normal` / `warning` / `offline` |

## 前端连接

### 使用 React Hook

```javascript
import React, { useCallback } from 'react';
import { useWebSocketTopology } from './hooks/useWebSocketTopology';

function App() {
  const handleWebSocketData = useCallback((data) => {
    console.log('接收到更新:', data);
    // 处理节点更新，更新 Leaflet Markers 等
    data.nodes.forEach((nodeUpdate) => {
      const marker = markerRefsById.current[nodeUpdate.id];
      if (marker) {
        marker.setLatLng([nodeUpdate.lat, nodeUpdate.lng]);
      }
    });
  }, []);

  const { connectionStatus } = useWebSocketTopology(
    handleWebSocketData,
    'ws://localhost:8080'
  );

  return (
    <div>
      <p>WebSocket 状态: {connectionStatus}</p>
      {/* 其他组件... */}
    </div>
  );
}

export default App;
```

### 原生 WebSocket API

```javascript
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  console.log('已连接');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('接收数据:', data);
};

ws.onerror = (error) => {
  console.error('连接错误:', error);
};

ws.onclose = () => {
  console.log('已断开');
};
```

## 健康检查

可以通过 HTTP 请求检查服务器是否运行正常：

```bash
curl http://localhost:8080/health
```

响应示例：

```json
{
  "status": "ok",
  "timestamp": 1708500000000
}
```

## 节点清单

| ID | 名称 | 类型 | 层级 | 位置 | 是否移动 |
|----|------|------|------|------|---------|
| R-001 | 核心路由器 R1 | router | backbone | 北京中心 | ✗ |
| R-002 | 汇聚路由器 R2 | router | backbone | 北京东北 | ✗ |
| BS-101 | 基站 BS-101 | base-station | access | 北京东 | ✗ |
| BS-102 | 基站 BS-102 | base-station | access | 北京东北 | ✗ |
| MN-201 | 自组网节点 MN-201 | mesh-node | mesh | 北京东南 | ✓ |
| MN-202 | 自组网节点 MN-202 | mesh-node | mesh | 北京东 | ✓ |
| UE-301 | 终端 UE-301 | terminal | edge | 北京东南 | ✗ |
| UE-302 | 终端 UE-302 | terminal | edge | 北京东北 | ✗ |
| SAT-901 | 低轨卫星 SAT-901 | satellite | backbone | 北京上空 550km | ✓ |

## 故障排查

### 问题 1：端口 8080 已被占用

**错误信息：** `Error: listen EADDRINUSE :::8080`

**解决方案：**
- 改用其他端口，编辑 `mockWebSocketServer.js`，将 `const PORT = 8080` 改为其他端口
- 或者关闭占用 8080 的应用程序

### 问题 2：前端连接失败

**错误信息：** `WebSocket is closed with code 1006`

**解决方案：**
- 确认服务器已启动且正在监听 `ws://localhost:8080`
- 检查防火墙是否阻止了连接
- 前端应该在服务器启动后再启动，或使用自动重连机制

### 问题 3：npm install 失败

**错误信息：** 找不到 `ws` 模块

**解决方案：**
```bash
cd server
npm install ws --save
npm start
```

## 性能指标

- **吞吐量**：每秒推送 1 次，每次 9 个节点的完整更新
- **消息大小**：约 1.5KB ~ 2KB (JSON 格式)
- **延迟**：< 100ms（本地 WebSocket）
- **支持连接数**：理论上可支持数百个并发客户端

## 开发扩展

### 修改更新频率

编辑 `mockWebSocketServer.js`，找到最后的 `setInterval`：

```javascript
setInterval(() => {
  // ... 数据更新逻辑
}, 1000);  // 改为其他值（毫秒）
```

### 添加更多节点

在 `initialNodes` 数组中添加新的节点对象：

```javascript
{
  id: 'NEW-001',
  name: '新节点',
  type: 'router',
  layer: 'backbone',
  lat: 39.95,
  lng: 116.42,
  altitude: 50,
  isMoving: false,
  baseLoad: 40,
  baseLatency: 5,
  baseStatus: 'normal',
}
```

### 修改波动参数

调整以下参数来改变属性波动的强度：

```javascript
// CPU 负载波动（±15%）
const loadJitter = (Math.random() - 0.5) * 30;

// 网络延迟波动（±30%）
const latencyJitter = (Math.random() - 0.5) * 0.6 * node.baseLatency;

// 状态变化概率
// 0.1% -> offline
// 0.5% -> warning
// 99.4% -> normal
```

## 注意事项

- 这是一个 **仅供开发和测试使用** 的模拟服务器
- 数据完全在内存中生成和存储，不持久化
- 不应在生产环境中使用
- WebSocket 连接是单向的（服务器推送），不接受客户端的其他命令

## 许可证

MIT
