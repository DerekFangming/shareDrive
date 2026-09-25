package files

import (
	"os"
	"path/filepath"
)

type Shareable struct {
	Name         string `json:"name"`
	Path         string `json:"path"`
	IsFile       bool   `json:"isFile"`
	Created      int64  `json:"created"`
	LastModified int64  `json:"lastModified"`
	Size         int64  `json:"size"`
}

func ToShareable(relativePath, fullPath string) (*Shareable, error) {
	info, err := os.Stat(fullPath)
	if err != nil {
		return nil, err
	}
	size := int64(0)
	if info.Mode().IsRegular() {
		size = info.Size()
	}
	return &Shareable{
		Name:         info.Name(),
		Path:         relativePath,
		IsFile:       info.Mode().IsRegular(),
		Created:      createdFromInfo(info),
		LastModified: info.ModTime().UnixMilli(),
		Size:         size,
	}, nil
}

func ToShareableUnderRoot(rootDir, fullPath string) (*Shareable, error) {
	return ToShareable(GetRelativePath(fullPath, rootDir), fullPath)
}

func DirectorySize(dir string) (int64, error) {
	var total int64
	err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.Mode().IsRegular() {
			total += info.Size()
		}
		return nil
	})
	return total, err
}

func SetWorldWritable(path string) {
	_ = os.Chmod(path, 0777)
}
