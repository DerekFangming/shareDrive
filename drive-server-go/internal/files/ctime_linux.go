//go:build linux

package files

import "syscall"

func birthTimespec(st *syscall.Stat_t) int64 {
	return timespecMillis(st.Ctim.Sec, st.Ctim.Nsec)
}
