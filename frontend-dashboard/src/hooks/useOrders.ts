import { useState, useCallback } from "react";
import { ApiService } from "@/services/api.service";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const apiService = new ApiService({ baseUrl });

interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  [key: string]: any;
}

interface Order {
  id: string;
  customerId: string;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  items: OrderItem[];
  total: number;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const useOrders = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const listOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.get<Order[]>("/api/orders");
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrder = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.get<Order>(`/api/orders/${id}`);
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrder = useCallback(async (data: Partial<Order>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.post<Order>("/api/orders", data);
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrder = useCallback(async (id: string, data: Partial<Order>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.put<Order>(`/api/orders/${id}`, data);
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = useCallback(
    async (id: string, status: Order["status"]) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiService.put<Order>(
          `/api/orders/${id}/status`,
          { status }
        );
        return response;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getOrderItems = useCallback(async (orderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.get<OrderItem[]>(
        `/api/orders/${orderId}/items`
      );
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderItem = useCallback(
    async (orderId: string, itemId: string, data: Partial<OrderItem>) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiService.put<OrderItem>(
          `/api/orders/${orderId}/items/${itemId}`,
          data
        );
        return response;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteOrderItem = useCallback(
    async (orderId: string, itemId: string) => {
      setLoading(true);
      setError(null);
      try {
        await apiService.delete(`/api/orders/${orderId}/items/${itemId}`);
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    listOrders,
    getOrder,
    createOrder,
    updateOrder,
    updateOrderStatus,
    getOrderItems,
    updateOrderItem,
    deleteOrderItem,
  };
};
