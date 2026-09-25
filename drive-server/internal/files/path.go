package files

import (
	"errors"
	"io/fs"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

const RecycleFolder = "#recycle"

var invalidName = regexp.MustCompile(`[/\n\r\t\x00\f` + "`" + `?*<>|":]`)

var ErrOutsideRoot = errors.New("Access denied: path is outside the allowed directory")
var ErrInvalidPath = errors.New("Invalid path")

func IsListable(name string, _ fs.FileMode) bool {
	if strings.HasPrefix(name, ".") || strings.HasPrefix(name, "$") {
		return false
	}
	if name == RecycleFolder {
		return false
	}
	return true
}

func IsUnderRecycleFolder(filePath, rootDir string) bool {
	rel := GetRelativePath(filePath, rootDir)
	rel = strings.ReplaceAll(rel, "\\", "/")
	return rel == RecycleFolder || strings.HasPrefix(rel, RecycleFolder+"/")
}

func GetInnerFolder(baseFolder, path string) (string, error) {
	return ResolveWithin(baseFolder, path)
}

func ResolveSharedPath(driveRoot, sharePath, subPath string) (string, error) {
	shareRoot, err := ResolveWithin(driveRoot, sharePath)
	if err != nil {
		return "", err
	}
	if strings.TrimSpace(subPath) == "" {
		return shareRoot, nil
	}
	return ResolveWithin(shareRoot, subPath)
}

func ResolveWithin(baseFolder, path string) (string, error) {
	if baseFolder == "" {
		return "", ErrOutsideRoot
	}
	if path == "" {
		path = ""
	}
	if strings.ContainsRune(path, 0) {
		return "", ErrInvalidPath
	}
	for strings.HasPrefix(path, "/") || strings.HasPrefix(path, "\\") {
		path = path[1:]
	}

	base, err := filepath.Abs(baseFolder)
	if err != nil {
		return "", ErrInvalidPath
	}
	base, err = canonicalExisting(base)
	if err != nil {
		return "", ErrInvalidPath
	}

	target := filepath.Join(base, filepath.FromSlash(path))
	target, err = canonicalExisting(target)
	if err != nil {
		return "", ErrInvalidPath
	}
	if !IsContained(base, target) {
		return "", ErrOutsideRoot
	}
	return target, nil
}

func AssertContained(baseFolder, target string) error {
	if baseFolder == "" || target == "" {
		return ErrOutsideRoot
	}
	base, err := canonicalExisting(baseFolder)
	if err != nil {
		return ErrInvalidPath
	}
	tgt, err := canonicalExisting(target)
	if err != nil {
		return ErrInvalidPath
	}
	if !IsContained(base, tgt) {
		return ErrOutsideRoot
	}
	return nil
}

func IsContained(base, target string) bool {
	base = filepath.Clean(base)
	target = filepath.Clean(target)
	rel, err := filepath.Rel(base, target)
	if err != nil {
		return false
	}
	if rel == "." {
		return true
	}
	if strings.HasPrefix(rel, "..") {
		return false
	}
	return true
}

func GetRelativePath(filePath, rootDir string) string {
	root := strings.ReplaceAll(rootDir, "\\", "/")
	if !strings.HasSuffix(root, "/") {
		root += "/"
	}
	p := strings.ReplaceAll(filePath, "\\", "/")
	return strings.TrimPrefix(p, root)
}

func IsNameInvalid(name string) bool {
	if strings.TrimSpace(name) == "" {
		return true
	}
	return invalidName.MatchString(name)
}

func RemainderPath(requestPath, prefix string) (string, error) {
	p := requestPath
	if decoded, err := url.PathUnescape(p); err == nil {
		p = decoded
	}
	p = strings.TrimPrefix(p, prefix)
	p = strings.TrimPrefix(p, "/")
	if strings.ContainsRune(p, 0) {
		return "", ErrInvalidPath
	}
	return p, nil
}

func SplitSharePath(path string) (shareID, subPath string) {
	parts := strings.SplitN(path, "/", 2)
	shareID = parts[0]
	if len(parts) == 2 {
		subPath = parts[1]
	}
	return shareID, subPath
}

func SearchRegex(keyword string) (*regexp.Regexp, error) {
	k := strings.ToLower(strings.TrimSpace(keyword))
	replacer := strings.NewReplacer(
		`.`, `\.`,
		`*`, `.*`,
		`\`, `\\`,
		`(`, `\(`,
		`)`, `\)`,
		`/`, `\/`,
		`$`, `\$`,
		`^`, `\^`,
		`+`, `\+`,
		`[`, `\[`,
		`]`, `\]`,
		`|`, `\|`,
		`?`, `\?`,
	)
	return regexp.Compile(".*" + replacer.Replace(k) + ".*")
}

func canonicalExisting(path string) (string, error) {
	abs, err := filepath.Abs(path)
	if err != nil {
		return "", err
	}
	resolved, err := filepath.EvalSymlinks(abs)
	if err == nil {
		return resolved, nil
	}
	// Resolve the longest existing prefix (Java getCanonicalFile behavior for new paths).
	dir := abs
	var missing []string
	for {
		if _, statErr := os.Lstat(dir); statErr == nil {
			break
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		missing = append([]string{filepath.Base(dir)}, missing...)
		dir = parent
	}
	dir, err = filepath.EvalSymlinks(dir)
	if err != nil {
		dir, err = filepath.Abs(dir)
		if err != nil {
			return "", err
		}
	}
	return filepath.Join(append([]string{dir}, missing...)...), nil
}
