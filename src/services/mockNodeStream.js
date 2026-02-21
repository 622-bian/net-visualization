// Node snapshot shape: { id, type, layer, location: { geo: { lat, lng, altitude } }, state: { online, status }, timestamp }
const DEFAULT_OPTIONS = {
  intervalMs: 1000,
};

const JITTER_METERS = {
  router: 2,
  'base-station': 3,
  'mesh-node': 18,
  terminal: 8,
  satellite: 50,
};

const STATUS_POOL = ['normal', 'busy', 'degraded'];

function metersToLat(meters) {
  return meters / 111000;
}

function metersToLng(meters, lat) {
  const latRad = (lat * Math.PI) / 180;
  const metersPerDeg = 111000 * Math.cos(latRad);
  if (!metersPerDeg) {
    return 0;
  }
  return meters / metersPerDeg;
}

function pickRandomStatus() {
  const index = Math.floor(Math.random() * STATUS_POOL.length);
  return STATUS_POOL[index];
}

function jitterGeo(geo, type) {
  const jitter = JITTER_METERS[type] ?? 5;
  const metersLat = (Math.random() - 0.5) * jitter * 2;
  const metersLng = (Math.random() - 0.5) * jitter * 2;

  return {
    lat: geo.lat + metersToLat(metersLat),
    lng: geo.lng + metersToLng(metersLng, geo.lat),
    altitude: geo.altitude,
  };
}

function buildNodeState(node) {
  return {
    id: node.id,
    type: node.type,
    layer: node.layer,
    location: {
      geo: {
        lat: node.location?.geo?.lat ?? 0,
        lng: node.location?.geo?.lng ?? 0,
        altitude: node.location?.geo?.altitude ?? 0,
      },
    },
    state: {
      online: node.state?.online ?? true,
      status: node.state?.status ?? 'normal',
    },
    timestamp: new Date().toISOString(),
  };
}

export function buildInitialNodeState(nodes) {
  return nodes.reduce((acc, node) => {
    acc[node.id] = buildNodeState(node);
    return acc;
  }, {});
}

export function createMockNodeStream(nodes, onBatch, options = {}) {
  const settings = { ...DEFAULT_OPTIONS, ...options };
  let currentState = buildInitialNodeState(nodes);

  const timer = setInterval(() => {
    const updates = nodes.map((node) => {
      const previous = currentState[node.id] || buildNodeState(node);
      const geo = previous.location?.geo || node.location?.geo;
      const nextGeo = geo ? jitterGeo(geo, node.type) : geo;

      const shouldToggle = Math.random() < 0.03;
      const nextOnline = shouldToggle ? !previous.state?.online : previous.state?.online;
      const nextStatus = nextOnline ? pickRandomStatus() : 'offline';

      const update = {
        id: node.id,
        location: {
          geo: nextGeo,
        },
        state: {
          online: nextOnline,
          status: nextStatus,
        },
        timestamp: new Date().toISOString(),
      };

      currentState[node.id] = {
        ...previous,
        ...update,
        location: update.location,
        state: update.state,
      };

      return update;
    });

    onBatch(updates);
  }, settings.intervalMs);

  return () => clearInterval(timer);
}
