FROM oven/bun:1

WORKDIR /app

# Copy package files
COPY package.json .
COPY tsconfig.json .

# Install dependencies
RUN bun install --production

# Copy source code
COPY src/ ./src/

# Expose the port
EXPOSE 3000

# Start the service
CMD ["bun", "run", "src/main.ts"] 