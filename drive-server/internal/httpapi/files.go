package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"mime/multipart"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/fmning/drive/internal/config"
	"github.com/fmning/drive/internal/files"
)

type rangeSpec struct {
	start  int64
	end    int64
	length int64
	total  int64
}

func (s *Server) downloadShared(w http.ResponseWriter, r *http.Request) {
	path, err := files.RemainderPath(r.URL.Path, "/api/download-shared-file")
	if err != nil {
		writeError(w, err)
		return
	}
	if strings.TrimSpace(path) == "" {
		writeError(w, badReq("No share code is provided"))
		return
	}
	shareID, subPath := files.SplitSharePath(path)
	share, err := s.loadShare(shareID)
	if err != nil {
		writeError(w, err)
		return
	}
	file, err := files.ResolveSharedPath(s.root, share.Path, subPath)
	if err != nil {
		writeError(w, err)
		return
	}
	s.downloadFile(w, r, file)
}

func (s *Server) downloadOwned(w http.ResponseWriter, r *http.Request) {
	path, err := files.RemainderPath(r.URL.Path, "/api/download-file")
	if err != nil {
		writeError(w, err)
		return
	}
	file, err := files.GetInnerFolder(s.root, path)
	if err != nil {
		writeError(w, err)
		return
	}
	s.downloadFile(w, r, file)
}

func (s *Server) downloadFile(w http.ResponseWriter, r *http.Request, file string) {
	info, err := os.Stat(file)
	if err != nil {
		writeError(w, badReq("The file does not exist"))
		return
	}
	if info.IsDir() {
		writeError(w, badReq("Cannot download a directory"))
		return
	}

	length := info.Size()
	contentType := contentTypeOf(file)
	fileName := info.Name()
	encoded := strings.ReplaceAll(url.QueryEscape(fileName), "+", "%20")
	ranges, invalid := parseRanges(r.Header.Get("Range"), length)
	if invalid {
		w.Header().Set("Content-Range", "bytes */"+strconv.FormatInt(length, 10))
		http.Error(w, "", http.StatusRequestedRangeNotSatisfiable)
		return
	}

	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Accept-Ranges", "bytes")
	w.Header().Set("Cache-Control", "private, no-transform")
	w.Header().Set("Content-Disposition", `attachment; filename="`+strings.ReplaceAll(fileName, `"`, "")+`"; filename*=UTF-8''`+encoded)
	w.Header().Set("ETag", `"`+strconv.FormatInt(length, 10)+`-`+strconv.FormatInt(info.ModTime().UnixMilli(), 10)+`"`)

	f, err := os.Open(file)
	if err != nil {
		writeError(w, err)
		return
	}
	defer f.Close()

	if len(ranges) == 0 {
		w.Header().Set("Content-Length", strconv.FormatInt(length, 10))
		w.WriteHeader(http.StatusOK)
		if length > 0 {
			_, err = copyRange(w, f, 0, length)
		}
	} else if len(ranges) == 1 {
		rg := ranges[0]
		w.Header().Set("Content-Range", "bytes "+strconv.FormatInt(rg.start, 10)+"-"+strconv.FormatInt(rg.end, 10)+"/"+strconv.FormatInt(rg.total, 10))
		w.Header().Set("Content-Length", strconv.FormatInt(rg.length, 10))
		w.WriteHeader(http.StatusPartialContent)
		_, err = copyRange(w, f, rg.start, rg.length)
	} else {
		w.Header().Set("Content-Type", "multipart/byteranges; boundary=MULTIPART_BYTERANGES")
		w.WriteHeader(http.StatusPartialContent)
		for _, rg := range ranges {
			_, _ = io.WriteString(w, "--MULTIPART_BYTERANGES\r\n")
			_, _ = io.WriteString(w, "Content-Type: "+contentType+"\r\n")
			_, _ = io.WriteString(w, "Content-Range: bytes "+strconv.FormatInt(rg.start, 10)+"-"+strconv.FormatInt(rg.end, 10)+"/"+strconv.FormatInt(rg.total, 10)+"\r\n\r\n")
			_, err = copyRange(w, f, rg.start, rg.length)
			if err != nil {
				break
			}
			_, _ = io.WriteString(w, "\r\n")
		}
		if err == nil {
			_, _ = io.WriteString(w, "--MULTIPART_BYTERANGES--\r\n")
		}
	}
	if err != nil && !isClientAbort(err) {
		slog.Error("download failed", "err", err)
	}
}

func parseRanges(header string, length int64) ([]rangeSpec, bool) {
	if header == "" {
		return nil, false
	}
	ok, _ := regexp.MatchString(`^bytes=\d*-\d*(,\d*-\d*)*$`, header)
	if !ok {
		return nil, true
	}
	var ranges []rangeSpec
	for _, part := range strings.Split(header[6:], ",") {
		dash := strings.Index(part, "-")
		start := sublong(part, 0, dash)
		end := sublong(part, dash+1, len(part))
		if start == -1 {
			start = max64(0, length-end)
			end = length - 1
		} else if end == -1 || end > length-1 {
			end = length - 1
		}
		if length == 0 {
			continue
		}
		if start > end || start >= length {
			return nil, true
		}
		ranges = append(ranges, rangeSpec{start: start, end: end, length: end - start + 1, total: length})
	}
	return ranges, false
}

func sublong(value string, begin, end int) int64 {
	if begin < 0 || end < begin || end > len(value) {
		return -1
	}
	substr := value[begin:end]
	if substr == "" {
		return -1
	}
	n, err := strconv.ParseInt(substr, 10, 64)
	if err != nil {
		return -1
	}
	return n
}

func copyRange(w io.Writer, f *os.File, start, length int64) (int64, error) {
	if _, err := f.Seek(start, io.SeekStart); err != nil {
		return 0, err
	}
	return io.CopyN(w, f, length)
}

func isClientAbort(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "broken pipe") ||
		strings.Contains(msg, "connection reset") ||
		strings.Contains(msg, "connection abort") ||
		strings.Contains(msg, "clientabort") ||
		errorsIsTimeout(err)
}

func errorsIsTimeout(err error) bool {
	return errors.Is(err, context.Canceled) || errors.Is(err, http.ErrAbortHandler)
}

func contentTypeOf(path string) string {
	ext := strings.ToLower(filepath.Ext(path))
	if ct := mimeByExt(ext); ct != "" {
		return ct
	}
	return "application/octet-stream"
}

func mimeByExt(ext string) string {
	switch ext {
	case ".txt":
		return "text/plain"
	case ".html", ".htm":
		return "text/html"
	case ".json":
		return "application/json"
	case ".pdf":
		return "application/pdf"
	case ".png":
		return "image/png"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".gif":
		return "image/gif"
	case ".mp4":
		return "video/mp4"
	case ".zip":
		return "application/zip"
	default:
		return ""
	}
}

type uploadResult struct {
	Error string             `json:"error"`
	Files []*files.Shareable `json:"files"`
}

func (s *Server) uploadShared(w http.ResponseWriter, r *http.Request) {
	path, err := files.RemainderPath(r.URL.Path, "/api/upload-shared-file")
	if err != nil {
		writeError(w, err)
		return
	}
	if strings.TrimSpace(path) == "" {
		writeError(w, badReq("No share code is provided"))
		return
	}
	shareID, subPath := files.SplitSharePath(path)
	share, err := s.loadShare(shareID)
	if err != nil {
		writeError(w, err)
		return
	}
	if !share.WriteAccess {
		writeError(w, badReq("This shared directory is read only. Uploading is not allowed."))
		return
	}
	shareRoot, err := files.GetInnerFolder(s.root, share.Path)
	if err != nil {
		writeError(w, err)
		return
	}
	folder, err := files.ResolveSharedPath(s.root, share.Path, subPath)
	if err != nil {
		writeError(w, err)
		return
	}
	s.uploadFiles(w, r, folder, shareRoot, share.ID)
}

func (s *Server) uploadOwned(w http.ResponseWriter, r *http.Request) {
	path, err := files.RemainderPath(r.URL.Path, "/api/upload-file")
	if err != nil {
		writeError(w, err)
		return
	}
	folder, err := files.GetInnerFolder(s.root, path)
	if err != nil {
		writeError(w, err)
		return
	}
	s.uploadFiles(w, r, folder, "", "")
}

func (s *Server) uploadFiles(w http.ResponseWriter, r *http.Request, folder, shareRoot, shareID string) {
	r.Body = http.MaxBytesReader(w, r.Body, config.MaxUploadBytes)
	if err := r.ParseMultipartForm(config.MultipartMemBytes); err != nil {
		writeError(w, badReq("No files are provided."))
		return
	}
	info, err := os.Stat(folder)
	if err != nil {
		writeError(w, badReq("The folder does not exist"))
		return
	}
	if !info.IsDir() {
		writeError(w, badReq("Invalid upload path."))
		return
	}
	headers := r.MultipartForm.File["files"]
	if len(headers) == 0 {
		writeError(w, badReq("No files are provided."))
		return
	}

	var errorMsg strings.Builder
	uploaded := make([]*files.Shareable, 0)
	for _, hdr := range headers {
		name := filepath.Base(hdr.Filename)
		if name == "" || name == "." || files.IsNameInvalid(name) {
			errorMsg.WriteString("File named " + hdr.Filename + " failed to upload because the file name is invalid;")
			continue
		}
		if hdr.Size == 0 {
			errorMsg.WriteString("File named " + name + " failed to upload because it is empty;")
			continue
		}
		target := filepath.Join(folder, name)
		if _, err := os.Stat(target); err == nil {
			errorMsg.WriteString("File named " + name + " failed to upload because it already exists in the directory;")
			continue
		}
		shareable, err := s.commitUpload(hdr, target, shareRoot, shareID)
		if err != nil {
			errorMsg.WriteString("File named " + name + " failed to be uploaded, " + err.Error() + ";")
			continue
		}
		uploaded = append(uploaded, shareable)
	}
	writeJSONValue(w, http.StatusOK, uploadResult{Error: errorMsg.String(), Files: uploaded})
}

func (s *Server) commitUpload(hdr *multipart.FileHeader, target, shareRoot, shareID string) (*files.Shareable, error) {
	src, err := hdr.Open()
	if err != nil {
		return nil, err
	}
	defer src.Close()

	tmp, err := os.CreateTemp("", "drive-upload-*.tmp")
	if err != nil {
		return nil, err
	}
	tmpName := tmp.Name()
	n, err := io.Copy(tmp, src)
	closeErr := tmp.Close()
	if err != nil {
		_ = os.Remove(tmpName)
		return nil, err
	}
	if closeErr != nil {
		_ = os.Remove(tmpName)
		return nil, closeErr
	}
	if hdr.Size > 0 && n != hdr.Size {
		_ = os.Remove(tmpName)
		return nil, badReq("Incomplete upload: expected " + strconv.FormatInt(hdr.Size, 10) + " bytes but received " + strconv.FormatInt(n, 10))
	}

	timeout := time.Duration(max64(60_000, min64(hdr.Size/50_000, 600_000))) * time.Millisecond
	done := make(chan error, 1)
	go func() {
		done <- writeToStorage(tmpName, target)
	}()
	select {
	case err := <-done:
		if err != nil {
			_ = os.Remove(target)
			return nil, err
		}
	case <-time.After(timeout):
		_ = os.Remove(target)
		return nil, badReq("Timed out while saving file to storage. The storage may be slow or unavailable.")
	}

	files.SetWorldWritable(target)
	if shareRoot == "" {
		return files.ToShareableUnderRoot(s.root, target)
	}
	rel := shareID + "/" + files.GetRelativePath(target, shareRoot)
	return files.ToShareable(rel, target)
}

func writeToStorage(source, target string) error {
	if err := os.Rename(source, target); err == nil {
		return nil
	}
	in, err := os.Open(source)
	if err != nil {
		return err
	}
	defer in.Close()
	out, err := os.OpenFile(target, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0666)
	if err != nil {
		return err
	}
	_, copyErr := io.Copy(out, in)
	closeErr := out.Close()
	if copyErr != nil {
		_ = os.Remove(target)
		return copyErr
	}
	if closeErr != nil {
		_ = os.Remove(target)
		return closeErr
	}
	_ = os.Remove(source)
	return nil
}

func max64(a, b int64) int64 {
	if a > b {
		return a
	}
	return b
}

func min64(a, b int64) int64 {
	if a < b {
		return a
	}
	return b
}

func (s *Server) renameFile(w http.ResponseWriter, r *http.Request) {
	var body files.Shareable
	if err := jsonDecode(r, &body); err != nil || body.Path == "" {
		writeError(w, badReq("The request is invalid"))
		return
	}
	if files.IsNameInvalid(body.Name) {
		writeError(w, badReq("File name cannot contain characters like / ` ? * \\ < > | \" :"))
		return
	}
	previous, err := files.GetInnerFolder(s.root, body.Path)
	if err != nil {
		writeError(w, err)
		return
	}
	if _, err := os.Stat(previous); err != nil {
		writeError(w, badReq("The file you are trying to rename does not exist"))
		return
	}
	previousExt := strings.TrimPrefix(filepath.Ext(previous), ".")
	newName := body.Name
	newExt := strings.TrimPrefix(filepath.Ext(newName), ".")
	if newExt != "" && !strings.EqualFold(previousExt, newExt) {
		writeError(w, badReq("Cannot modify file extension. Please enter either the new name without file extension, or new name with the same extension"))
		return
	}
	if newExt != "" {
		idx := strings.LastIndex(newName, newExt)
		newName = newName[:idx] + previousExt + newName[idx+len(newExt):]
	} else if previousExt != "" {
		newName += "." + previousExt
	}
	newPath := filepath.Join(filepath.Dir(previous), newName)
	if newPath == previous {
		writeError(w, badReq("File name is the same as before"))
		return
	}
	if err := files.AssertContained(s.root, newPath); err != nil {
		writeError(w, err)
		return
	}
	if _, err := os.Stat(newPath); err == nil {
		writeError(w, badReq("There is already a file in the directory called "+newName))
		return
	}
	if err := os.Rename(previous, newPath); err != nil {
		writeError(w, badReq("Failed to rename file."))
		return
	}
	shareable, err := files.ToShareableUnderRoot(s.root, newPath)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSONValue(w, http.StatusOK, shareable)
}

type moveFile struct {
	Path       string `json:"path"`
	TargetPath string `json:"targetPath"`
}

func (s *Server) moveFile(w http.ResponseWriter, r *http.Request) {
	var body moveFile
	if err := jsonDecode(r, &body); err != nil {
		writeError(w, badReq("The request is invalid"))
		return
	}
	if body.Path == "" {
		writeError(w, badReq("Please provide the file."))
		return
	}
	if body.TargetPath == "" {
		writeError(w, badReq("Please provide the target location."))
		return
	}
	file, err := files.GetInnerFolder(s.root, body.Path)
	if err != nil {
		writeError(w, err)
		return
	}
	targetFolder, err := files.GetInnerFolder(s.root, body.TargetPath)
	if err != nil {
		writeError(w, err)
		return
	}
	if _, err := os.Stat(file); err != nil {
		writeError(w, badReq("Provided file does not exist."))
		return
	}
	info, err := os.Stat(targetFolder)
	if err != nil {
		writeError(w, badReq("Provided target location does not exist."))
		return
	}
	if !info.IsDir() {
		writeError(w, badReq("Provided target location is not a folder."))
		return
	}
	target := filepath.Join(targetFolder, filepath.Base(file))
	if _, err := os.Stat(target); err == nil {
		writeError(w, badReq("Target location already has a file called "+filepath.Base(file)))
		return
	}
	if err := os.Rename(file, target); err != nil {
		writeError(w, badReq("Failed to move file."))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) deleteFile(w http.ResponseWriter, r *http.Request) {
	path, err := files.RemainderPath(r.URL.Path, "/api/delete-file")
	if err != nil {
		writeError(w, err)
		return
	}
	file, err := files.GetInnerFolder(s.root, path)
	if err != nil {
		writeError(w, err)
		return
	}
	if err := os.Remove(file); err != nil {
		writeError(w, badReq("Failed to DELETE file."))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) searchFiles(w http.ResponseWriter, r *http.Request) {
	path, err := files.RemainderPath(r.URL.Path, "/api/search-file")
	if err != nil {
		writeError(w, err)
		return
	}
	folder, err := files.GetInnerFolder(s.root, path)
	if err != nil {
		writeError(w, err)
		return
	}
	info, err := os.Stat(folder)
	if err != nil {
		writeError(w, badReq("Search path does not exist."))
		return
	}
	if !info.IsDir() {
		writeError(w, badReq("Search path is not a directory."))
		return
	}
	keyword := strings.TrimSpace(r.URL.Query().Get("keyword"))
	if keyword == "" {
		writeError(w, badReq("Please enter a keyword."))
		return
	}
	re, err := files.SearchRegex(keyword)
	if err != nil {
		writeError(w, badReq(err.Error()))
		return
	}
	result := make([]*files.Shareable, 0)
	walkErr := filepath.Walk(folder, func(p string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if files.IsUnderRecycleFolder(p, s.root) {
			if info.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		if !re.MatchString(strings.ToLower(info.Name())) {
			return nil
		}
		item, err := files.ToShareableUnderRoot(s.root, p)
		if err != nil {
			return err
		}
		result = append(result, item)
		return nil
	})
	if walkErr != nil {
		writeError(w, badReq(walkErr.Error()))
		return
	}
	writeJSONValue(w, http.StatusOK, result)
}

func jsonDecode(r *http.Request, dest any) error {
	defer r.Body.Close()
	return json.NewDecoder(r.Body).Decode(dest)
}
