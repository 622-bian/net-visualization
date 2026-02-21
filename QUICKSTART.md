# 🚀 快速开始 - Mock WebSocket 服务器

## ⚡ 5 分钟快速启动

### 1️⃣  启动 Mock 服务器

```bash
cd server
npm install
npm start
```

**预期输出：**
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

✅ 服务器已启动并等待客户端连接

---

### 2️⃣  在另一个终端启动前端

```bash
npm start
```

前端应用会在 `http://localhost:3000` 启动

---

### 3️⃣  在浏览器中打开开发者工具

按 `F12` 打开开发者工具，进入 **Console** 标签页

---

### 4️⃣  在前端代码中添加 WebSocket 连接

**方法 A：快速测试（在浏览器控制台直接运行）**

```javascript
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  console.log('✅ 已连接到 Mock 服务器');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('📨 接收数据:', data);
  console.log('节点数:', data.nodes.length);
  console.log('第一个节点:', data.nodes[0]);
};

ws.onerror = (error) => {
  console.error('❌ 连接错误:', error);
};
```

**方法 B：在 React 组件中使用（推荐）**

编辑 `src/App.js`，在导入部分添加：

```javascript
import { useWebSocketTopology } from './hooks/useWebSocketTopology';
```

在 `App` 函数中添加（在其他 `useEffect` 之后）：

```javascript
const handleWebSocketData = useCallback((data) => {
  console.log('📨 WebSocket 数据:', data);
  // 处理更新...
  const updates = data.nodes.map((node) => ({
    id: node.id,
    location: { geo: { lat: node.lat, lng: node.lng, altitude: node.altitude } },
    state: { online: node.status !== 'offline', status: node.status },
  }));
  handleUpdateNodeStates(updates);
}, [handleUpdateNodeStates]);

const { connectionStatus } = useWebSocketTopology(
  handleWebSocketData,
  'ws://localhost:8080'
);
```

在 JSX 中显示状态（可选）：

```javascript
<div style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 20 }}>
  WebSocket: {connectionStatus === 'connected' ? '✅' : '❌'}
</div>
```

---

## 📊 实时数据流

```
Mock Server (每秒推送)
    ↓
{'timestamp': 1708500000000, 'nodes': [...]}
    ↓
前端 WebSocket onmessage
    ↓
Leaflet Marker.setLatLng()
    ↓
地图中的图标平滑移动
```

---

## 🔍 验证数据

### 检查 Mock 服务器是否正常运行

```bash
curl http://localhost:8080/health
```

预期响应：
```json
{"status":"ok","timestamp":1708500000000}
```

### 在浏览器控制台检查接收的数据

```javascript
// 复制这段代码到浏览器控制台运行
const ws = new WebSocket('ws://localhost:8080');
ws.onmessage = (e) => {
  const data = JSON.parse(e.data);
  console.table(data.nodes.map(n => ({
    ID: n.id,
    Type: n.type,
    Lat: n.lat.toFixed(5),
    Lng: n.lng.toFixed(5),
    CPU: n.cpuLoad.toFixed(1) + '%',
    Latency: n.latency.toFixed(1) + 'ms',
    Status: n.status
  })));
};
```

---

## 🎯 预期行为

✅ **应该看到：**
- 服务器每秒显示一次"广播数据"日志
- 浏览器控制台显示接收到的 JSON 数据
- 节点位置不断变化（尤其是卫星和无人机）
- 连接状态显示为 "connected"

❌ **如果没有看到：**
1. 检查服务器是否真的在运行（看是否有"等待客户端连接..."的日志）
2. 检查浏览器控制台是否有错误信息
3. 检查防火墙是否阻止了 8080 端口
4. 尝试刷新浏览器

---

## 📝 数据格式参考

**每个消息示例：**

```json
{
  "timestamp": 1708500000000,
  "nodes": [
    {
      "id": "R-001",
      "type": "router",
      "lat": 39.90500,
      "lng": 116.40100,
      "altitude": 40,
      "cpuLoad": 42.3,
      "latency": 3.2,
      "status": "normal"
    },
    {
      "id": "SAT-901",
      "type": "satellite",
      "lat": 39.94012,
      "lng": 116.40756,
      "altitude": 550000,
      "cpuLoad": 58.5,
      "latency": 35.2,
      "status": "normal"
    }
  ]
}
```

---

## 🛠️ 常见问题

### Q: 端口 8080 已被占用

A: 编辑 `server/mockWebSocketServer.js`，改变 PORT 号：
```javascript
const PORT = 9000;  // 改为其他端口
```

### Q: npm install 失败

A: 确保你在 `server` 目录中：
```bash
cd server
npm install ws
npm start
```

### Q: 前端无法连接

A: 在浏览器控制台检查：
```javascript
new WebSocket('ws://localhost:8080');
// 应该看到连接成功的日志
```

---

## 🎓 下一步

1. ✅ 验证 WebSocket 数据接收正常
2. ✅ 在 App.js 中集成 `useWebSocketTopology` Hook
3. ✅ 调用 `handleUpdateNodeStates` 处理实时更新
4. ✅ 观察地图上的图标平滑移动
5. ✅ 当后端真实服务就绪时，只需改变 WebSocket URL

---

## 📖 详细信息

更多详細文档见：[server/README.md](./README.md)

关于前端集成的详细说明：[src/hooks/WEBSOCKET_INTEGRATION.md](../src/hooks/WEBSOCKET_INTEGRATION.md)
