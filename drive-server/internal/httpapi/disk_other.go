//go:build !darwin && !linux && !freebsd && !netbsd && !openbsd && !windows

package httpapi

func diskUsage(path string) (total, available int64) {
	return 0, 0
}
