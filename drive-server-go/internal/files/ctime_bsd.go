//go:build darwin || freebsd || netbsd || openbsd

package files

import "syscall"

func birthTimespec(st *syscall.Stat_t) int64 {
	return timespecMillis(st.Birthtimespec.Sec, st.Birthtimespec.Nsec)
}
