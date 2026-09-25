package httpapi

import (
	"crypto/rand"
	"encoding/json"
	"math/big"
	"net/http"
	"os"
	"time"

	"github.com/fmning/drive/internal/db"
	"github.com/fmning/drive/internal/files"
	"github.com/go-chi/chi/v5"
)

func (s *Server) loadShare(id string) (*db.Share, error) {
	share, err := s.store.FindByID(id)
	if err != nil {
		return nil, err
	}
	if share == nil {
		return nil, badReq("Share code " + id + " does not exist.")
	}
	if share.Expiration != nil && share.Expiration.Before(time.Now()) {
		return nil, badReq("Share code " + id + " has expired.")
	}
	return share, nil
}

func (s *Server) listShares(w http.ResponseWriter, r *http.Request) {
	shares, err := s.store.FindAll()
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSONValue(w, http.StatusOK, shares)
}

func (s *Server) createShare(w http.ResponseWriter, r *http.Request) {
	var share db.Share
	if err := json.NewDecoder(r.Body).Decode(&share); err != nil {
		writeError(w, badReq("The request is invalid"))
		return
	}
	file, err := files.GetInnerFolder(s.root, share.Path)
	if err != nil {
		writeError(w, err)
		return
	}
	info, err := os.Stat(file)
	if err != nil {
		writeError(w, badReq("The file does not exist"))
		return
	}
	if info.Mode().IsRegular() && share.WriteAccess {
		writeError(w, badReq("Shared file does not allow uploading."))
		return
	}
	id, err := s.uniqueShareID()
	if err != nil {
		writeError(w, err)
		return
	}
	now := time.Now().UTC()
	share.ID = id
	share.Created = &now
	user := s.auth.CurrentUser(r)
	if user != nil {
		share.CreatorName = firstNonEmpty(user.DisplayName, user.Name)
		share.CreatorID = user.UserName
	}
	if err := s.store.Save(share); err != nil {
		writeError(w, err)
		return
	}
	writeJSONValue(w, http.StatusOK, share)
}

func (s *Server) updateShare(w http.ResponseWriter, r *http.Request) {
	var updated db.Share
	if err := json.NewDecoder(r.Body).Decode(&updated); err != nil {
		writeError(w, badReq("The request is invalid"))
		return
	}
	share, err := s.store.FindByID(updated.ID)
	if err != nil {
		writeError(w, err)
		return
	}
	if share == nil {
		writeError(w, badReq("Share not found"))
		return
	}
	share.Name = updated.Name
	share.Expiration = updated.Expiration
	share.WriteAccess = updated.WriteAccess
	if err := s.store.Save(*share); err != nil {
		writeError(w, err)
		return
	}
	writeJSONValue(w, http.StatusOK, share)
}

func (s *Server) deleteShare(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "shareId")
	ok, err := s.store.Delete(id)
	if err != nil {
		writeError(w, err)
		return
	}
	if !ok {
		writeError(w, badReq("Share not found"))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) uniqueShareID() (string, error) {
	const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	for i := 0; i < 20; i++ {
		b := make([]byte, 6)
		for j := range b {
			n, err := rand.Int(rand.Reader, big.NewInt(int64(len(alphabet))))
			if err != nil {
				return "", err
			}
			b[j] = alphabet[n.Int64()]
		}
		id := string(b)
		exists, err := s.store.IDExists(id)
		if err != nil {
			return "", err
		}
		if !exists {
			return id, nil
		}
	}
	return "", badReq("Failed to generate share id")
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if v != "" {
			return v
		}
	}
	return ""
}
