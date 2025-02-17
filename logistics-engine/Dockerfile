FROM rust:1.76-slim as builder

WORKDIR /usr/src/app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y musl-tools pkg-config libssl-dev && \
    rustup target add x86_64-unknown-linux-musl

# First copy only the manifests
COPY Cargo.toml ./

# Create empty src/main.rs to build dependencies
RUN mkdir -p src && \
    echo 'fn main() {}' > src/main.rs

# Build dependencies only (with musl target)
RUN RUSTFLAGS='-C target-feature=+crt-static' cargo build --release --target x86_64-unknown-linux-musl

# Remove the dummy source file
RUN rm -rf src

# Now copy the real source code
COPY ./src ./src

# Build the actual application (with musl target)
RUN RUSTFLAGS='-C target-feature=+crt-static' cargo build --release --target x86_64-unknown-linux-musl

# Use a minimal Alpine image
FROM alpine:3.19

# Install necessary runtime dependencies
RUN apk --no-cache add ca-certificates && \
    mkdir /app

WORKDIR /app

# Copy the statically linked binary
COPY --from=builder /usr/src/app/target/x86_64-unknown-linux-musl/release/logistics-engine .

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000

CMD ["./logistics-engine"] 