package httpapi

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/fmning/drive/internal/files"
	"github.com/fmning/drive/internal/status"
)

type errorBody struct {
	Message string `json:"message"`
}

func writeError(w http.ResponseWriter, err error) {
	if err == nil {
		return
	}
	switch {
	case errors.Is(err, files.ErrOutsideRoot), errors.Is(err, files.ErrInvalidPath):
		writeJSON(w, http.StatusBadRequest, err.Error())
	default:
		if _, ok := err.(badRequest); ok {
			slog.Error("invalid request", "err", err)
			writeJSON(w, http.StatusBadRequest, err.Error())
			return
		}
		slog.Error("unhandled exception", "err", err)
		writeJSON(w, http.StatusInternalServerError, "Internal server error")
	}
}

type badRequest struct{ msg string }

func (e badRequest) Error() string { return e.msg }

func badReq(msg string) error { return badRequest{msg: msg} }

func writeJSON(w http.ResponseWriter, code int, message string) {
	writeJSONValue(w, code, errorBody{Message: message})
}

func writeJSONValue(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	enc := json.NewEncoder(w)
	enc.SetEscapeHTML(true)
	_ = enc.Encode(v)
}

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "POST, GET, PUT, OPTIONS, DELETE, PATCH")
			w.Header().Set("Access-Control-Max-Age", "3600")
			w.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Expose-Headers", "Location, X-Total-Count, X-Share-Details")
			w.Header().Add("Vary", "Origin")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func driveStatus(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if status.Get() == status.OK {
			next.ServeHTTP(w, r)
			return
		}
		slog.Error("Drive status failed", "status", status.Get())
		writeJSON(w, http.StatusInternalServerError, "Drive status failed.")
	})
}
