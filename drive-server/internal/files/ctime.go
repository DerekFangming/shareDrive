package files

import (
	"os"
	"time"
)

func CreatedMillis(path string) int64 {
	info, err := os.Stat(path)
	if err != nil {
		return 0
	}
	return createdFromInfo(info)
}

func timespecMillis(sec, nsec int64) int64 {
	return time.Unix(sec, nsec).UnixMilli()
}
