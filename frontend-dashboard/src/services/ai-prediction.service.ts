import { API_URL_AI_PREDICTIONS } from "@/config";

export interface IPrediction {
  id: string;
  model_name: string;
  item_id: string;
  input_data: Record<string, any>;
  prediction_result: Record<string, any>;
  predicted_demand: number;
  confidence_score: number;
  timestamp: string;
  created_at: string;
  updated_at: string;
}

export interface IModel {
  id: string;
  name: string;
  version: string;
  description: string;
  type: string;
  metrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1_score?: number;
    mae?: number;
    mse?: number;
    rmse?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface PredictionResponse {
  total: number;
  page: number;
  page_size: number;
  items: IPrediction[];
}

export interface ModelResponse {
  total: number;
  models: IModel[];
}

export class AIPredictionService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_URL_AI_PREDICTIONS}/api/v1/predictions`;
  }

  /**
   * Get a list of predictions with pagination
   */
  async getPredictions(
    page: number = 0,
    pageSize: number = 10,
    modelName?: string
  ): Promise<PredictionResponse> {
    try {
      let url = `${this.baseUrl}?page=${page}&page_size=${pageSize}`;
      if (modelName) {
        url += `&model=${encodeURIComponent(modelName)}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch predictions: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching predictions:", error);
      throw error;
    }
  }

  /**
   * Get a single prediction by ID
   */
  async getPrediction(id: string): Promise<IPrediction> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch prediction: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching prediction ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all available models
   */
  async getModels(): Promise<ModelResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/models`);

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching models:", error);
      throw error;
    }
  }

  /**
   * Get predictions for specific time period
   */
  async getPredictionsByTimeRange(
    startDate: Date,
    endDate: Date,
    modelName?: string
  ): Promise<PredictionResponse> {
    try {
      let url = `${
        this.baseUrl
      }/time-range?start=${startDate.toISOString()}&end=${endDate.toISOString()}`;

      if (modelName) {
        url += `&model=${encodeURIComponent(modelName)}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch predictions by time range: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching predictions by time range:", error);
      throw error;
    }
  }

  /**
   * Generate a new prediction for a specific item
   */
  async generatePrediction(
  ): Promise<IPrediction> {
    try {
   

      const response = await fetch(`${this.baseUrl}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to generate prediction: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error generating prediction:", error);
      throw error;
    }
  }

  /**
   * Get prediction confidence distribution
   */
  async getConfidenceDistribution(
    modelName?: string
  ): Promise<{ range: string; count: number }[]> {
    try {
      let url = `${this.baseUrl}/confidence-distribution`;

      if (modelName) {
        url += `?model=${encodeURIComponent(modelName)}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch confidence distribution: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching confidence distribution:", error);
      throw error;
    }
  }

  /**
   * Get predictions for a specific item
   */
  async getPredictionsForItem(itemId: string): Promise<IPrediction[]> {
    try {
      const response = await fetch(`${this.baseUrl}/item/${itemId}`);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch predictions for item: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching predictions for item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Download predictions as CSV
   */
  async downloadPredictionsCSV(modelName?: string): Promise<Blob> {
    try {
      let url = `${this.baseUrl}/export`;

      if (modelName) {
        url += `?model=${encodeURIComponent(modelName)}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Failed to download predictions CSV: ${response.statusText}`
        );
      }

      return await response.blob();
    } catch (error) {
      console.error("Error downloading predictions CSV:", error);
      throw error;
    }
  }
}
