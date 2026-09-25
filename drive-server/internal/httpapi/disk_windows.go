//go:build windows

package httpapi

import "golang.org/x/sys/windows"

func diskUsage(path string) (total, available int64) {
	var free, totalBytes, totalFree uint64
	if err := windows.GetDiskFreeSpaceEx(windows.StringToUTF16Ptr(path), &free, &totalBytes, &totalFree); err != nil {
		return 0, 0
	}
	return int64(totalBytes), int64(free)
}
