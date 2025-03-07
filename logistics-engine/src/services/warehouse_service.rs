use std::sync::Arc;
use uuid::Uuid;

use crate::db::repository::WarehouseRepository;
use crate::errors::{LogisticsError, Result};
use crate::models::warehouse::{CreateWarehouseDto, UpdateWarehouseDto, Warehouse};

pub struct WarehouseService {
    repository: Arc<WarehouseRepository>,
}

impl WarehouseService {
    pub fn new(repository: Arc<WarehouseRepository>) -> Self {
        Self { repository }
    }

    pub async fn get_all_warehouses(
        &self,
        page: u32,
        limit: u32,
        search: Option<String>,
    ) -> Result<Vec<Warehouse>> {
        let limit = limit as i64;
        let offset = (page as i64) * limit;

        match search {
            Some(search_term) => self
                .repository
                .search_warehouses(&search_term, limit, offset)
                .await
                .map_err(LogisticsError::from),
            None => self
                .repository
                .find_all(limit, offset)
                .await
                .map_err(LogisticsError::from),
        }
    }

    pub async fn get_active_warehouses(&self, page: u32, limit: u32) -> Result<Vec<Warehouse>> {
        let limit = limit as i64;
        let offset = (page as i64) * limit;

        self.repository
            .find_active(limit, offset)
            .await
            .map_err(LogisticsError::from)
    }

    pub async fn get_warehouse_by_id(&self, id: Uuid) -> Result<Warehouse> {
        let warehouse = self.repository.find_by_id(id).await?;

        match warehouse {
            Some(warehouse) => Ok(warehouse),
            None => Err(LogisticsError::NotFound("Warehouse", id.to_string())),
        }
    }

    pub async fn create_warehouse(&self, dto: CreateWarehouseDto) -> Result<Warehouse> {
        let existing = self.repository.find_by_code(&dto.code).await?;
        if existing.is_some() {
            return Err(LogisticsError::ValidationError(format!(
                "Warehouse with code {} already exists",
                dto.code
            )));
        }

        self.repository
            .create(dto)
            .await
            .map_err(LogisticsError::from)
    }

    pub async fn update_warehouse(&self, id: Uuid, dto: UpdateWarehouseDto) -> Result<Warehouse> {
        if let Some(ref code) = dto.code {
            let existing = self.repository.find_by_code(code).await?;
            if let Some(existing) = existing {
                if existing.id != id {
                    return Err(LogisticsError::ValidationError(format!(
                        "Warehouse with code {} already exists",
                        code
                    )));
                }
            }
        }

        let updated = self.repository.update(id, dto).await?;

        match updated {
            Some(warehouse) => Ok(warehouse),
            None => Err(LogisticsError::NotFound("Warehouse", id.to_string())),
        }
    }

    pub async fn set_warehouse_active(&self, id: Uuid, active: bool) -> Result<Warehouse> {
        let updated = self.repository.set_active(id, active).await?;

        match updated {
            Some(warehouse) => Ok(warehouse),
            None => Err(LogisticsError::NotFound("Warehouse", id.to_string())),
        }
    }

    pub async fn delete_warehouse(&self, id: Uuid) -> Result<bool> {
        let warehouse = self.repository.find_by_id(id).await?;
        if warehouse.is_none() {
            return Err(LogisticsError::NotFound("Warehouse", id.to_string()));
        }

        self.repository
            .delete(id)
            .await
            .map_err(LogisticsError::from)
    }

    pub async fn count_warehouses(&self) -> Result<i64> {
        self.repository.count().await.map_err(LogisticsError::from)
    }

    pub async fn count_active_warehouses(&self) -> Result<i64> {
        self.repository
            .count_active()
            .await
            .map_err(LogisticsError::from)
    }

    pub async fn count_warehouses_by_country(&self, country: &str) -> Result<i64> {
        self.repository
            .count_by_country(country)
            .await
            .map_err(LogisticsError::from)
    }
}
