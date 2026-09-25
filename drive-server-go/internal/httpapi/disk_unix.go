//go:build darwin || linux || freebsd || netbsd || openbsd

package httpapi

import "golang.org/x/sys/unix"

func diskUsage(path string) (total, available int64) {
	var stat unix.Statfs_t
	if err := unix.Statfs(path, &stat); err != nil {
		return 0, 0
	}
	bsize := int64(stat.Bsize)
	return int64(stat.Blocks) * bsize, int64(stat.Bavail) * bsize
}
