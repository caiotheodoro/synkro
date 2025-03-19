import { useState, useCallback } from "react";
import { ApiService } from "@/services/api.service";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const apiService = new ApiService({ baseUrl });

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const useCustomers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const listCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.get<Customer[]>("/api/customers");
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCustomer = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.get<Customer>(`/api/customers/${id}`);
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createCustomer = useCallback(async (data: Partial<Customer>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.post<Customer>("/api/customers", data);
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCustomer = useCallback(
    async (id: string, data: Partial<Customer>) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiService.put<Customer>(
          `/api/customers/${id}`,
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

  const deleteCustomer = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiService.delete(`/api/customers/${id}`);
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
    listCustomers,
    getCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
};
