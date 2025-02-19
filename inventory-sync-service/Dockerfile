FROM golang:1.19 AS builder

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY src/ ./src/

RUN CGO_ENABLED=0 GOOS=linux go build -o inventory-sync ./src/main.go

FROM alpine:latest

WORKDIR /root/

COPY --from=builder /app/inventory-sync .

CMD ["./inventory-sync"]
