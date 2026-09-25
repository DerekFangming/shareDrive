//go:build windows

package files

import "io/fs"

func createdFromInfo(info fs.FileInfo) int64 {
	return info.ModTime().UnixMilli()
}
