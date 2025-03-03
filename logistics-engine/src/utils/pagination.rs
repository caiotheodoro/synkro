use serde::{Deserialize, Serialize};

const DEFAULT_PAGE_SIZE: usize = 10;
const MAX_PAGE_SIZE: usize = 100;

#[derive(Debug, Deserialize, Clone, Copy)]
pub struct PaginationParams {
    pub page: Option<usize>,
    pub page_size: Option<usize>,
}

#[derive(Debug, Serialize)]
pub struct PaginationResponse {
    pub total: usize,
    pub page: usize,
    pub page_size: usize,
    pub total_pages: usize,
}

impl PaginationParams {
    pub fn new(page: Option<usize>, page_size: Option<usize>) -> Self {
        Self { page, page_size }
    }

    pub fn page(&self) -> usize {
        self.page.unwrap_or(1).max(1)
    }

    pub fn page_size(&self) -> usize {
        self.page_size
            .unwrap_or(DEFAULT_PAGE_SIZE)
            .min(MAX_PAGE_SIZE)
            .max(1)
    }

    pub fn offset(&self) -> usize {
        (self.page() - 1) * self.page_size()
    }

    pub fn limit(&self) -> usize {
        self.page_size()
    }
}

pub fn paginate<T>(
    items: Vec<T>,
    pagination: &PaginationParams,
    total: usize,
) -> (Vec<T>, PaginationResponse) {
    let page = pagination.page();
    let page_size = pagination.page_size();
    let total_pages = (total as f64 / page_size as f64).ceil() as usize;

    let pagination_response = PaginationResponse {
        total,
        page,
        page_size,
        total_pages,
    };

    (items, pagination_response)
}
