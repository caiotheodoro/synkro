package grpc

import (
	"google.golang.org/grpc"
	"google.golang.org/grpc/test/bufconn"
)

// NewBufDialer is a function variable that will be set by tests to create a buffer-based dialer
var NewBufDialer func(listener *bufconn.Listener) (grpc.ClientConnInterface, error) 