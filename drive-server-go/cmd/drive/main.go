package main

import (
	"io/fs"
	"log/slog"
	"net"
	"net/http"
	"os"
	"strconv"

	"github.com/fmning/drive/internal/auth"
	"github.com/fmning/drive/internal/bootstrap"
	"github.com/fmning/drive/internal/config"
	"github.com/fmning/drive/internal/db"
	"github.com/fmning/drive/internal/httpapi"
	"github.com/fmning/drive/internal/status"
)

func main() {
	cfg := config.Load()
	root := bootstrap.InitRoot(cfg)
	slog.Info("drive starting", "status", status.Get(), "production", cfg.Production, "port", cfg.Port)

	store, err := db.Open(cfg, root)
	if err != nil {
		slog.Error("failed to open database", "err", err)
		os.Exit(1)
	}

	authSvc := auth.NewService(cfg)
	static := loadStatic(config.StaticDir)
	handler := httpapi.New(cfg, root, store, authSvc, static)

	addr := net.JoinHostPort(cfg.Host, strconv.Itoa(cfg.Port))
	slog.Info("listening", "addr", addr)
	if err := http.ListenAndServe(addr, handler); err != nil {
		slog.Error("server stopped", "err", err)
		os.Exit(1)
	}
}

func loadStatic(dir string) fs.FS {
	if dir == "" {
		return nil
	}
	info, err := os.Stat(dir)
	if err != nil || !info.IsDir() {
		return nil
	}
	return os.DirFS(dir)
}
