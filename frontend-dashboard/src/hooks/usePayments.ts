import { useState, useCallback } from "react";
import { ApiService } from "@/services/api.service";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const apiService = new ApiService({ baseUrl });

interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED";
  paymentMethod: string;
  transactionId?: string;
  refundId?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const usePayments = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const listPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.get<Payment[]>("/api/payments");
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPayment = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.get<Payment>(`/api/payments/${id}`);
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createPayment = useCallback(async (data: Partial<Payment>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.post<Payment>("/api/payments", data);
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePayment = useCallback(
    async (id: string, data: Partial<Payment>) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiService.put<Payment>(
          `/api/payments/${id}`,
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

  const deletePayment = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiService.delete(`/api/payments/${id}`);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const processPayment = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.post<Payment>(
        `/api/payments/${id}/process`
      );
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refundPayment = useCallback(async (id: string, amount?: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.post<Payment>(
        `/api/payments/${id}/refund`,
        { amount }
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
    listPayments,
    getPayment,
    createPayment,
    updatePayment,
    deletePayment,
    processPayment,
    refundPayment,
  };
};
