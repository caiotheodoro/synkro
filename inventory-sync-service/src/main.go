package main

import (
	"context"
	"log"
	"net"
	"net/http"
	"os/signal"
	"syscall"

	"github.com/gin-gonic/gin"
	"google.golang.org/grpc"
)

const (
	grpcPort = ":50051"
	httpPort = ":8080"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	grpcServer := grpc.NewServer()

	grpcListener, err := net.Listen("tcp", grpcPort)
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	go func() {
		log.Printf("Starting gRPC server on port %s", grpcPort)
		if err := grpcServer.Serve(grpcListener); err != nil {
			log.Fatalf("failed to serve gRPC: %v", err)
		}
	}()

	router := gin.Default()
	
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
		})
	})

	srv := &http.Server{
		Addr:    httpPort,
		Handler: router,
	}

	go func() {
		log.Printf("Starting HTTP server on port %s", httpPort)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("failed to serve HTTP: %v", err)
		}
	}()

	<-ctx.Done()

	log.Println("Shutting down servers...")
	grpcServer.GracefulStop()
	if err := srv.Shutdown(context.Background()); err != nil {
		log.Printf("HTTP server forced to shutdown: %v", err)
	}
} 