//go:build unix

package files

import (
	"io/fs"
	"syscall"
)

func createdFromInfo(info fs.FileInfo) int64 {
	if st, ok := info.Sys().(*syscall.Stat_t); ok {
		if ts := birthTimespec(st); ts != 0 {
			return ts
		}
	}
	return info.ModTime().UnixMilli()
}
