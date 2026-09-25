package httpapi

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/fmning/drive/internal/files"
)

func (s *Server) listDirectory(w http.ResponseWriter, r *http.Request) {
	path, err := files.RemainderPath(r.URL.Path, "/api/directory")
	if err != nil {
		writeError(w, err)
		return
	}
	directory, err := files.GetInnerFolder(s.root, path)
	if err != nil {
		writeError(w, err)
		return
	}
	info, err := os.Stat(directory)
	if err != nil {
		writeError(w, badReq("Requested path does not exist."))
		return
	}
	if !info.IsDir() {
		writeError(w, badReq("Requested path is not a directory."))
		return
	}
	dirOnly := r.URL.Query().Get("dirOnly") == "true"
	entries, err := os.ReadDir(directory)
	if err != nil {
		writeError(w, err)
		return
	}
	result := make([]*files.Shareable, 0)
	for _, entry := range entries {
		info, err := entry.Info()
		if err != nil {
			continue
		}
		if !files.IsListable(entry.Name(), info.Mode()) {
			continue
		}
		if dirOnly && !entry.IsDir() {
			continue
		}
		item, err := files.ToShareableUnderRoot(s.root, filepath.Join(directory, entry.Name()))
		if err != nil {
			continue
		}
		result = append(result, item)
	}
	writeJSONValue(w, http.StatusOK, result)
}

func (s *Server) listSharedDirectory(w http.ResponseWriter, r *http.Request) {
	path, err := files.RemainderPath(r.URL.Path, "/api/shared-directory")
	if err != nil {
		writeError(w, err)
		return
	}
	if path == "" {
		writeError(w, badReq("No share code is provided"))
		return
	}
	shareID, subPath := files.SplitSharePath(path)
	share, err := s.loadShare(shareID)
	if err != nil {
		writeError(w, err)
		return
	}
	shareRoot, err := files.GetInnerFolder(s.root, share.Path)
	if err != nil {
		writeError(w, err)
		return
	}
	sharePoint, err := files.ResolveSharedPath(s.root, share.Path, subPath)
	if err != nil {
		writeError(w, err)
		return
	}
	info, err := os.Stat(sharePoint)
	if err != nil {
		writeError(w, badReq("Shared file does not exist."))
		return
	}
	access := "r"
	if share.WriteAccess {
		access = "rw"
	}
	kind := "d:"
	if info.Mode().IsRegular() {
		kind = "f:"
	}
	w.Header().Set("X-Share-Details", kind+access)

	if info.Mode().IsRegular() {
		item, err := files.ToShareable(share.ID, sharePoint)
		if err != nil {
			writeError(w, err)
			return
		}
		writeJSONValue(w, http.StatusOK, []*files.Shareable{item})
		return
	}
	if !info.IsDir() {
		writeError(w, badReq("Internal error: Shared path does not contain file or directory."))
		return
	}
	entries, err := os.ReadDir(sharePoint)
	if err != nil {
		writeError(w, err)
		return
	}
	result := make([]*files.Shareable, 0)
	for _, entry := range entries {
		fi, err := entry.Info()
		if err != nil {
			continue
		}
		if !files.IsListable(entry.Name(), fi.Mode()) {
			continue
		}
		full := filepath.Join(sharePoint, entry.Name())
		rel := share.ID + "/" + files.GetRelativePath(full, shareRoot)
		item, err := files.ToShareable(rel, full)
		if err != nil {
			continue
		}
		result = append(result, item)
	}
	writeJSONValue(w, http.StatusOK, result)
}

func (s *Server) directorySize(w http.ResponseWriter, r *http.Request) {
	path, err := files.RemainderPath(r.URL.Path, "/api/directory-size")
	if err != nil {
		writeError(w, err)
		return
	}
	directory, err := files.GetInnerFolder(s.root, path)
	if err != nil {
		writeError(w, err)
		return
	}
	info, err := os.Stat(directory)
	if err != nil {
		writeError(w, badReq("Requested path does not exist."))
		return
	}
	if !info.IsDir() {
		writeError(w, badReq("Requested path is not a directory."))
		return
	}
	size, err := files.DirectorySize(directory)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSONValue(w, http.StatusOK, map[string]int64{"size": size})
}

func (s *Server) capacity(w http.ResponseWriter, r *http.Request) {
	total, available := diskUsage(s.root)
	writeJSONValue(w, http.StatusOK, map[string]int64{
		"totalSpace":     total,
		"availableSpace": available,
	})
}

func (s *Server) createDirectory(w http.ResponseWriter, r *http.Request) {
	var body files.Shareable
	if err := jsonDecode(r, &body); err != nil || body.Path == "" {
		writeError(w, badReq("The request is invalid"))
		return
	}
	if files.IsNameInvalid(body.Name) {
		writeError(w, badReq("File name cannot contain characters like / ` ? * \\ < > | \" :"))
		return
	}
	newDir, err := files.GetInnerFolder(s.root, body.Path)
	if err != nil {
		writeError(w, err)
		return
	}
	if _, err := os.Stat(newDir); err == nil {
		writeError(w, badReq("The folder already exits"))
		return
	}
	if err := os.MkdirAll(newDir, 0777); err != nil {
		writeError(w, badReq("Failed to create folder."))
		return
	}
	files.SetWorldWritable(newDir)
	item, err := files.ToShareableUnderRoot(s.root, newDir)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSONValue(w, http.StatusOK, item)
}
