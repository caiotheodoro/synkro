use std::collections::HashMap;
use validator::Validate;

use crate::error::AppError;

pub fn validate<T: Validate>(data: &T) -> Result<(), AppError> {
    match data.validate() {
        Ok(()) => Ok(()),
        Err(validation_errors) => {
            let mut error_messages = HashMap::new();

            for (field, errors) in validation_errors.field_errors() {
                let error_details: Vec<String> = errors
                    .iter()
                    .map(|error| {
                        error
                            .message
                            .clone()
                            .unwrap_or_else(|| "Invalid value".into())
                            .to_string()
                    })
                    .collect();

                error_messages.insert(field.to_string(), error_details);
            }

            Err(AppError::ValidationError(
                serde_json::to_string(&error_messages)
                    .unwrap_or_else(|_| "Validation error".to_string()),
            ))
        }
    }
}

pub fn validate_uuid(uuid_str: &str) -> Result<uuid::Uuid, AppError> {
    uuid::Uuid::parse_str(uuid_str)
        .map_err(|_| AppError::BadRequest(format!("Invalid UUID: {}", uuid_str)))
}
