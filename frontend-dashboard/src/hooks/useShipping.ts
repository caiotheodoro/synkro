import { useState, useCallback } from "react";
import { ApiService } from "@/services/api.service";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const apiService = new ApiService({ baseUrl });

interface Shipment {
  id: string;
  orderId: string;
  status: "PENDING" | "IN_TRANSIT" | "DELIVERED" | "FAILED";
  trackingNumber: string;
  carrier: string;
  estimatedDeliveryDate: string;
  actualDeliveryDate?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const useShipping = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const listShipments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.get<Shipment[]>("/api/shipping");
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getShipment = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.get<Shipment>(`/api/shipping/${id}`);
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createShipment = useCallback(async (data: Partial<Shipment>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.post<Shipment>("/api/shipping", data);
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateShipment = useCallback(
    async (id: string, data: Partial<Shipment>) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiService.put<Shipment>(
          `/api/shipping/${id}`,
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

  const deleteShipment = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiService.delete(`/api/shipping/${id}`);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateShipmentStatus = useCallback(
    async (id: string, status: Shipment["status"]) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiService.put<Shipment>(
          `/api/shipping/${id}/status`,
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

  const markAsDelivered = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.post<Shipment>(
        `/api/shipping/${id}/deliver`
      );
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getShipmentByTracking = useCallback(async (trackingNumber: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.get<Shipment>(
        `/api/shipping/tracking/${trackingNumber}`
      );
      return response;
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
    listShipments,
    getShipment,
    createShipment,
    updateShipment,
    deleteShipment,
    updateShipmentStatus,
    markAsDelivered,
    getShipmentByTracking,
  };
};
