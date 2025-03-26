FROM continuumio/miniconda3:latest

WORKDIR /app

# Copy environment file
COPY environment.yml .

# Create conda environment
RUN conda env create -f environment.yml

# Make RUN commands use the new environment
SHELL ["conda", "run", "-n", "ai-ml-predictions", "/bin/bash", "-c"]

# Copy application code
COPY . .

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PORT=3004

# Expose ports
EXPOSE 3004 8084

# Run the application
CMD ["conda", "run", "--no-capture-output", "-n", "ai-ml-predictions", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3004"]

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD conda run -n ai-ml-predictions curl -f http://localhost:3004/health || exit 1 