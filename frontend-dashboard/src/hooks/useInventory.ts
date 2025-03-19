import { useState, useCallback } from "react";
import { ApiService } from "@/services/api.service";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const apiService = new ApiService({ baseUrl });

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  reorderPoint: number;
  warehouseId: string;
  [key: string]: any;
}

interface InventoryTransaction {
  id: string;
  itemId: string;
  quantity: number;
  type: "IN" | "OUT";
  reason: string;
  timestamp: string;
  [key: string]: any;
}

interface InventoryReservation {
  id: string;
  itemId: string;
  quantity: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  orderId?: string;
  expiresAt: string;
  [key: string]: any;
}

export const useInventory = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const listInventoryItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.get<InventoryItem[]>("/api/inventory");
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getInventoryItem = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.get<InventoryItem>(
        `/api/inventory/${id}`
      );
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createInventoryItem = useCallback(
    async (data: Partial<InventoryItem>) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiService.post<InventoryItem>(
          "/api/inventory",
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

  const updateInventoryItem = useCallback(
    async (id: string, data: Partial<InventoryItem>) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiService.put<InventoryItem>(
          `/api/inventory/${id}`,
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

  const deleteInventoryItem = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiService.delete(`/api/inventory/${id}`);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const adjustQuantity = useCallback(async (id: string, quantity: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.put<InventoryItem>(
        `/api/inventory/${id}/adjust`,
        { quantity }
      );
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const listTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.get<InventoryTransaction[]>(
        "/api/inventory/transactions"
      );
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createTransaction = useCallback(
    async (data: Partial<InventoryTransaction>) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiService.post<InventoryTransaction>(
          "/api/inventory/transactions",
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

  const listReservations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.get<InventoryReservation[]>(
        "/api/inventory/reservations"
      );
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createReservation = useCallback(
    async (data: Partial<InventoryReservation>) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiService.post<InventoryReservation>(
          "/api/inventory/reservations",
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

  const updateReservation = useCallback(
    async (id: string, data: Partial<InventoryReservation>) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiService.put<InventoryReservation>(
          `/api/inventory/reservations/${id}`,
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

  const deleteReservation = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiService.delete(`/api/inventory/reservations/${id}`);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    listInventoryItems,
    getInventoryItem,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    adjustQuantity,
    listTransactions,
    createTransaction,
    listReservations,
    createReservation,
    updateReservation,
    deleteReservation,
  };
};
