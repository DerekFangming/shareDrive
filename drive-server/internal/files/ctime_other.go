//go:build unix && !darwin && !freebsd && !netbsd && !openbsd && !linux

package files

import "syscall"

func birthTimespec(st *syscall.Stat_t) int64 {
	return 0
}
