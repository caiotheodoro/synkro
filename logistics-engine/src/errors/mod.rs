use std::fmt;

#[derive(Debug)]
pub enum LogisticsError {
    DatabaseError(sqlx::Error),
    NotFound(&'static str, String),
    ValidationError(String),
    InternalError(String),
}

impl fmt::Display for LogisticsError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            LogisticsError::DatabaseError(err) => write!(f, "Database error: {}", err),
            LogisticsError::NotFound(entity, id) => {
                write!(f, "{} with ID {} not found", entity, id)
            }
            LogisticsError::ValidationError(msg) => write!(f, "Validation error: {}", msg),
            LogisticsError::InternalError(msg) => write!(f, "Internal error: {}", msg),
        }
    }
}

impl std::error::Error for LogisticsError {}

impl From<sqlx::Error> for LogisticsError {
    fn from(err: sqlx::Error) -> Self {
        LogisticsError::DatabaseError(err)
    }
}

pub type Result<T> = std::result::Result<T, LogisticsError>;
