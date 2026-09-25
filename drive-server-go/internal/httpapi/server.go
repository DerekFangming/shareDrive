package httpapi

import (
	"io/fs"
	"net/http"
	"path"
	"strings"

	"github.com/fmning/drive/internal/auth"
	"github.com/fmning/drive/internal/config"
	"github.com/fmning/drive/internal/db"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

type Server struct {
	cfg    config.Config
	root   string
	store  *db.Store
	auth   *auth.Service
	static fs.FS
}

func New(cfg config.Config, root string, store *db.Store, authSvc *auth.Service, static fs.FS) http.Handler {
	s := &Server{cfg: cfg, root: root, store: store, auth: authSvc, static: static}
	r := chi.NewRouter()
	r.Use(middleware.Recoverer)
	r.Use(middleware.RealIP)
	r.Use(cors)
	r.Use(driveStatus)
	r.Use(s.auth.Parse)

	r.Get("/oauth2/authorization/drive", s.auth.StartLogin)
	r.Get("/login/oauth2/code/drive", s.auth.Callback)
	r.Get("/login", s.auth.StartLogin)
	r.Handle("/logout", http.HandlerFunc(s.auth.Logout))

	r.With(s.auth.RequireLogin).Get("/me", s.auth.Me)
	r.With(s.auth.RequireLogin).Get("/login-redirect", s.auth.LoginRedirect)

	// HTTP authenticated() + @PreAuthorize("hasAuthority('DR')") (Redirects to login if not authenticated)
	r.With(s.auth.RequireLogin, s.auth.RequireDR).Get("/api/directory", s.listDirectory)
	r.With(s.auth.RequireLogin, s.auth.RequireDR).Get("/api/directory/*", s.listDirectory)
	r.With(s.auth.RequireLogin, s.auth.RequireDR).Get("/api/shares", s.listShares)
	r.With(s.auth.RequireLogin, s.auth.RequireDR).Post("/api/shares", s.createShare)
	r.With(s.auth.RequireLogin, s.auth.RequireDR).Put("/api/shares", s.updateShare)

	// permitAll at HTTP layer; method security still requires DR in production (Rejects if not authenticated)
	r.With(s.auth.RequireDR).Delete("/api/shares/{shareId}", s.deleteShare)
	r.With(s.auth.RequireDR).Get("/api/download-file", s.downloadOwned)
	r.With(s.auth.RequireDR).Get("/api/download-file/*", s.downloadOwned)
	r.With(s.auth.RequireDR).Post("/api/upload-file", s.uploadOwned)
	r.With(s.auth.RequireDR).Post("/api/upload-file/*", s.uploadOwned)
	r.With(s.auth.RequireDR).Put("/api/rename-file", s.renameFile)
	r.With(s.auth.RequireDR).Post("/api/move-file", s.moveFile)
	r.With(s.auth.RequireDR).Delete("/api/delete-file", s.deleteFile)
	r.With(s.auth.RequireDR).Delete("/api/delete-file/*", s.deleteFile)
	r.With(s.auth.RequireDR).Get("/api/search-file", s.searchFiles)
	r.With(s.auth.RequireDR).Get("/api/search-file/*", s.searchFiles)
	r.With(s.auth.RequireDR).Get("/api/directory-size", s.directorySize)
	r.With(s.auth.RequireDR).Get("/api/directory-size/*", s.directorySize)
	r.With(s.auth.RequireDR).Get("/api/capacity", s.capacity)
	r.With(s.auth.RequireDR).Post("/api/directory", s.createDirectory)

	// Public share endpoints (share code is the access token)
	r.Get("/api/download-shared-file", s.downloadShared)
	r.Get("/api/download-shared-file/*", s.downloadShared)
	r.Post("/api/upload-shared-file", s.uploadShared)
	r.Post("/api/upload-shared-file/*", s.uploadShared)
	r.Get("/api/shared-directory", s.listSharedDirectory)
	r.Get("/api/shared-directory/*", s.listSharedDirectory)

	r.NotFound(s.spa)
	return r
}

func (s *Server) spa(w http.ResponseWriter, r *http.Request) {
	if s.static == nil {
		http.NotFound(w, r)
		return
	}
	name := strings.TrimPrefix(path.Clean(r.URL.Path), "/")
	if name == "" || strings.HasSuffix(r.URL.Path, "/") {
		name = "index.html"
	}
	f, err := s.static.Open(name)
	if err != nil {
		http.ServeFileFS(w, r, s.static, "index.html")
		return
	}
	stat, err := f.Stat()
	f.Close()
	if err != nil || stat.IsDir() {
		http.ServeFileFS(w, r, s.static, "index.html")
		return
	}
	http.ServeFileFS(w, r, s.static, name)
}
