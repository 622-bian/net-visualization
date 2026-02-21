import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
import url from 'url';

const PORT = 8080;

// ====== 初始化节点数据 ======
const initialNodes = [
  {
    id: 'R-001',
    name: '核心路由器 R1',
    type: 'router',
    layer: 'backbone',
    lat: 39.905,
    lng: 116.401,
    altitude: 40,
    isMoving: false,
    baseLoad: 45,
    baseLatency: 3,
    baseStatus: 'normal',
  },
  {
    id: 'R-002',
    name: '汇聚路由器 R2',
    type: 'router',
    layer: 'backbone',
    lat: 39.912,
    lng: 116.412,
    altitude: 45,
    isMoving: false,
    baseLoad: 52,
    baseLatency: 4,
    baseStatus: 'normal',
  },
  {
    id: 'BS-101',
    name: '基站 BS-101',
    type: 'base-station',
    layer: 'access',
    lat: 39.908,
    lng: 116.423,
    altitude: 32,
    isMoving: false,
    baseLoad: 68,
    baseLatency: 8,
    baseStatus: 'normal',
  },
  {
    id: 'BS-102',
    name: '基站 BS-102',
    type: 'base-station',
    layer: 'access',
    lat: 39.918,
    lng: 116.438,
    altitude: 30,
    isMoving: false,
    baseLoad: 55,
    baseLatency: 9,
    baseStatus: 'normal',
  },
  {
    id: 'MN-201',
    name: '自组网节点 MN-201',
    type: 'mesh-node',
    layer: 'mesh',
    lat: 39.914,
    lng: 116.432,
    altitude: 120,
    isMoving: true,
    baseLoad: 32,
    baseLatency: 15,
    baseStatus: 'normal',
    velocityLat: 0.0002,
    velocityLng: 0.0001,
  },
  {
    id: 'MN-202',
    name: '自组网节点 MN-202',
    type: 'mesh-node',
    layer: 'mesh',
    lat: 39.922,
    lng: 116.426,
    altitude: 110,
    isMoving: true,
    baseLoad: 28,
    baseLatency: 18,
    baseStatus: 'normal',
    velocityLat: -0.0001,
    velocityLng: 0.00015,
  },
  {
    id: 'UE-301',
    name: '终端 UE-301',
    type: 'terminal',
    layer: 'edge',
    lat: 39.916,
    lng: 116.445,
    altitude: 15,
    isMoving: false,
    baseLoad: 42,
    baseLatency: 22,
    baseStatus: 'normal',
  },
  {
    id: 'UE-302',
    name: '终端 UE-302',
    type: 'terminal',
    layer: 'edge',
    lat: 39.926,
    lng: 116.442,
    altitude: 18,
    isMoving: false,
    baseLoad: 35,
    baseLatency: 25,
    baseStatus: 'normal',
  },
  {
    id: 'SAT-901',
    name: '低轨卫星 SAT-901',
    type: 'satellite',
    layer: 'backbone',
    lat: 39.94,
    lng: 116.408,
    altitude: 550000,
    isMoving: true,
    baseLoad: 58,
    baseLatency: 35,
    baseStatus: 'normal',
    velocityLat: 0.0005,
    velocityLng: -0.0003,
  },
];

// 在内存中维护节点状态
const nodesState = initialNodes.map((node) => ({
  ...node,
}));

// 创建 HTTP 服务器和 WebSocket 服务器
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const wss = new WebSocketServer({ server });

const clients = new Set();

wss.on('connection', (ws, req) => {
  const clientId = `client-${Date.now()}-${Math.random()}`;
  clients.add(ws);
  console.log(`[${new Date().toISOString()}] 客户端连接: ${clientId}, 总连接数: ${clients.size}`);

  // 发送连接确认
  ws.send(JSON.stringify({
    type: 'connected',
    clientId,
    timestamp: Date.now(),
    message: '已连接到 Mock WebSocket 服务器',
  }));

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[${new Date().toISOString()}] 客户端断开: ${clientId}, 剩余连接数: ${clients.size}`);
  });

  ws.on('error', (error) => {
    console.error(`[${new Date().toISOString()}] 客户端错误: ${clientId}`, error);
  });
});

// ====== 数据更新计时器 ======
setInterval(() => {
  const timestamp = Date.now();
  const updates = [];

  nodesState.forEach((node) => {
    // 对移动节点更新位置
    if (node.isMoving) {
      node.lat += (node.velocityLat || 0) + (Math.random() - 0.5) * 0.00005;
      node.lng += (node.velocityLng || 0) + (Math.random() - 0.5) * 0.00008;
    }

    // 模拟 CPU 负载波动 (±15%)
    const loadJitter = (Math.random() - 0.5) * 30;
    const cpuLoad = Math.max(5, Math.min(95, node.baseLoad + loadJitter));

    // 模拟延迟波动 (±30%)
    const latencyJitter = (Math.random() - 0.5) * 0.6 * node.baseLatency;
    const latency = Math.max(1, node.baseLatency + latencyJitter);

    // 随机状态变化（0.5% 概率变成 warning，0.1% 概率变成 offline）
    let status = node.baseStatus;
    const statusRand = Math.random();
    if (statusRand < 0.001) {
      status = 'offline'; // 0.1%
    } else if (statusRand < 0.006) {
      status = 'warning'; // 0.5%
    } else {
      status = 'normal';
    }

    // 更新节点状态
    node.currentLoad = Math.round(cpuLoad * 10) / 10;
    node.latency = Math.round(latency * 10) / 10;
    node.status = status;

    // 收集该节点的更新
    updates.push({
      id: node.id,
      type: node.type,
      lat: Math.round(node.lat * 100000) / 100000,
      lng: Math.round(node.lng * 100000) / 100000,
      altitude: node.altitude,
      cpuLoad: node.currentLoad,
      latency: node.latency,
      status: node.status,
    });
  });

  // 构建消息
  const message = {
    timestamp,
    nodes: updates,
  };

  // 广播给所有已连接的客户端
  const messageStr = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });

  if (clients.size > 0) {
    console.log(`[${new Date().toISOString()}] 📤 广播数据 (${clients.size} 个客户端): ${updates.length} 个节点更新`);
  }
}, 1000);

// 启动服务器
server.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`🚀 多层网络拓扑 Mock WebSocket 服务器`);
  console.log(`========================================`);
  console.log(`📍 服务地址: ws://localhost:${PORT}`);
  console.log(`📍 健康检查: http://localhost:${PORT}/health`);
  console.log(`📊 节点数量: ${nodesState.length}`);
  console.log(`⏱️  更新频率: 每秒 1000ms`);
  console.log(`========================================\n`);
  console.log(`等待客户端连接...\n`);
});

process.on('SIGINT', () => {
  console.log('\n\n关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
