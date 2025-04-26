import { API_URL_AI_PREDICTIONS } from "@/config";
import { ApiService } from "./api.service";

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
  private baseEndpoint: string;
  private apiService: ApiService;

  constructor() {
    this.baseEndpoint = "api/v1/predictions";
    this.apiService = new ApiService({
      baseUrl: API_URL_AI_PREDICTIONS,
    });
  }

  async getPredictions(
    page: number = 0,
    pageSize: number = 10,
    modelName?: string
  ): Promise<PredictionResponse> {
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        page_size: pageSize.toString(),
      };

      if (modelName) {
        params.model = modelName;
      }

      return await this.apiService.get<PredictionResponse>(this.baseEndpoint, {
        params,
      });
    } catch (error) {
      console.error("Error fetching predictions:", error);
      throw error;
    }
  }

  async getPrediction(id: string): Promise<IPrediction> {
    try {
      return await this.apiService.get<IPrediction>(
        `${this.baseEndpoint}/${id}`
      );
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
      return await this.apiService.get<ModelResponse>(
        `${this.baseEndpoint}/models`
      );
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
      const params: Record<string, string> = {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      };

      if (modelName) {
        params.model = modelName;
      }

      return await this.apiService.get<PredictionResponse>(
        `${this.baseEndpoint}/time-range`,
        { params }
      );
    } catch (error) {
      console.error("Error fetching predictions by time range:", error);
      throw error;
    }
  }

  async generatePrediction(): Promise<IPrediction> {
    try {
      return await this.apiService.post<IPrediction>(
        `${this.baseEndpoint}/generate`
      );
    } catch (error) {
      console.error("Error generating prediction:", error);
      throw error;
    }
  }

  async getConfidenceDistribution(
    modelName?: string
  ): Promise<{ range: string; count: number }[]> {
    try {
      const params: Record<string, string> = {};

      if (modelName) {
        params.model = modelName;
      }

      return await this.apiService.get<{ range: string; count: number }[]>(
        `${this.baseEndpoint}/confidence-distribution`,
        { params }
      );
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
      return await this.apiService.get<IPrediction[]>(
        `${this.baseEndpoint}/item/${itemId}`
      );
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
      const params: Record<string, string> = {};

      if (modelName) {
        params.model = modelName;
      }

      const response = await this.apiService.request<Blob>(
        "GET",
        `${this.baseEndpoint}/export`,
        {
          params,
          headers: {
            Accept: "text/csv",
          },
        }
      );

      return new Blob([response as unknown as string], { type: "text/csv" });
    } catch (error) {
      console.error("Error downloading predictions CSV:", error);
      throw error;
    }
  }
}
