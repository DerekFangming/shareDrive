package status

import "sync"

type DriveStatus string

const (
	NoRootDir         DriveStatus = "NO_ROOT_DIR"
	InvalidRootDir    DriveStatus = "INVALID_ROOT_DIR"
	InvalidPermission DriveStatus = "INVALID_PERMISSION"
	InvalidDatabase   DriveStatus = "INVALID_DATABASE"
	Unknown           DriveStatus = "UNKNOWN"
	OK                DriveStatus = "OK"
)

var (
	mu     sync.RWMutex
	current = Unknown
)

func Get() DriveStatus {
	mu.RLock()
	defer mu.RUnlock()
	return current
}

func Set(s DriveStatus) {
	mu.Lock()
	defer mu.Unlock()
	current = s
}

func MarkDatabaseInvalid() {
	mu.Lock()
	defer mu.Unlock()
	if current == OK {
		current = InvalidDatabase
	}
}
