package auth

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/fmning/drive/internal/config"
	"github.com/golang-jwt/jwt/v5"
)

func TestParseAuthoritiesFromUserInfoMaps(t *testing.T) {
	got := parseAuthorities([]any{
		map[string]any{"authority": "DR"},
		map[string]any{"authority": "OTHER"},
	})
	if len(got) != 2 || got[0] != "DR" || got[1] != "OTHER" {
		t.Fatalf("got %#v", got)
	}
}

func TestAuthoritiesFromScopeClaim(t *testing.T) {
	got := authoritiesFromClaims(jwt.MapClaims{"scope": "DR read"})
	if !contains(got, "DR") {
		t.Fatalf("expected DR in %#v", got)
	}
}

func TestRequireAnyAuthorityForbiddenWithoutAuthority(t *testing.T) {
	svc := NewService(config.Config{Production: true, SessionSecret: "01234567890123456789012345678901"})
	h := svc.Parse(svc.RequireAnyAuthority([]string{"DR"})(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})))
	req := httptest.NewRequest(http.MethodGet, "/api/capacity", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusForbidden {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestRequireAnyAuthoritySkippedWhenNotProduction(t *testing.T) {
	svc := NewService(config.Config{Production: false, SessionSecret: "01234567890123456789012345678901"})
	h := svc.Parse(svc.RequireAnyAuthority([]string{"DR"})(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})))
	req := httptest.NewRequest(http.MethodGet, "/api/capacity", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestHasAnyAuthorityOr(t *testing.T) {
	u := &User{Authorities: []string{"OTHER"}}
	if !u.HasAnyAuthority([]string{"DR", "OTHER"}) {
		t.Fatal("expected OR match")
	}
	if u.HasAnyAuthority([]string{"DR"}) {
		t.Fatal("expected no match")
	}
}

func contains(in []string, want string) bool {
	for _, v := range in {
		if v == want {
			return true
		}
	}
	return false
}
