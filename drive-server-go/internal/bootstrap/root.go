package bootstrap

import (
	"crypto/rand"
	"encoding/hex"
	"os"
	"path/filepath"

	"github.com/fmning/drive/internal/config"
	"github.com/fmning/drive/internal/files"
	"github.com/fmning/drive/internal/status"
)

func InitRoot(cfg config.Config) string {
	if cfg.RootDir == "" {
		status.Set(status.NoRootDir)
		return ""
	}
	info, err := os.Stat(cfg.RootDir)
	if err != nil || !info.IsDir() {
		status.Set(status.InvalidRootDir)
		return cfg.RootDir
	}
	root := cfg.RootDir
	if cfg.IsPostgres() {
		validateWritePermission(root)
	} else {
		ensureInternalFolder(root)
	}
	return root
}

func validateWritePermission(directory string) {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	testFolder := filepath.Join(directory, "."+hex.EncodeToString(b))
	if err := os.Mkdir(testFolder, 0777); err != nil {
		status.Set(status.InvalidPermission)
		return
	}
	if err := os.Remove(testFolder); err != nil {
		status.Set(status.InvalidPermission)
		return
	}
	status.Set(status.OK)
}

func ensureInternalFolder(rootDir string) {
	internal := filepath.Join(rootDir, config.InternalFolder)
	if info, err := os.Stat(internal); err == nil && info.IsDir() {
		validateWritePermission(internal)
		return
	}
	if err := os.Mkdir(internal, 0777); err != nil {
		status.Set(status.InvalidPermission)
		return
	}
	status.Set(status.OK)
}

func MustInner(root, path string) (string, error) {
	return files.GetInnerFolder(root, path)
}
