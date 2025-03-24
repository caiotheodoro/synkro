export const isServer = typeof window === "undefined";

export const parseJwt = (token: string): any => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch (error) {
    console.error("Error parsing JWT:", error);
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const payload = parseJwt(token);
  if (!payload?.exp) return false;
  return payload.exp < Math.floor(Date.now() / 1000);
};

export const broadcastAuthEvent = (type: string, data: any): void => {
  if (isServer) return;

  const trustedOrigins = [
    process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || "http://localhost:3000",
    process.env.NEXT_PUBLIC_AUTH_INTERFACE_URL || "http://localhost:5173",
  ];

  trustedOrigins.forEach((origin) => {
    try {
      window.parent.postMessage({ type, ...data }, origin);
    } catch (error) {
      console.error(`Error broadcasting auth event to ${origin}:`, error);
    }
  });
};

export const formatChartData = (data: any[], metadata: any) => {
  if (!data || !Array.isArray(data)) return { data: [], metadata };

  if (metadata.type === "line" || metadata.type === "bar") {
    return {
      data: data.map((item) => ({
        x: item[metadata.xAxis || "x"],
        y: item[metadata.yAxis || "y"],
      })),
      metadata,
    };
  }

  if (metadata.type === "pie" || metadata.type === "donut") {
    return {
      data: data.map((item) => ({
        label: item[metadata.dimension || "label"],
        value: item[metadata.metric || "value"],
      })),
      metadata,
    };
  }

  if (metadata.type === "tree" || metadata.type === "network") {
    return {
      data: data.map((item) => ({
        id: item.id,
        parent: item.parent,
        value: item[metadata.value || "value"],
      })),
      metadata,
    };
  }

  return { data, metadata };
};
