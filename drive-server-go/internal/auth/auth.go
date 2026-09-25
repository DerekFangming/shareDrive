package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/MicahParks/keyfunc/v3"
	"github.com/fmning/drive/internal/config"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/sessions"
	"golang.org/x/oauth2"
)

const (
	sessionName     = "DRIVE_SESSION"
	sessionUserKey  = "user"
	sessionStateKey = "oauth_state"
	sessionSavedKey = "saved_request"
)

type User struct {
	Name        string   `json:"name"`
	UserName    string   `json:"userName"`
	Avatar      string   `json:"avatar"`
	DisplayName string   `json:"displayName"`
	Authorities []string `json:"authorities"`
}

type contextKey struct{}

type Service struct {
	cfg       config.Config
	oauth     *oauth2.Config
	store     *sessions.CookieStore
	jwksMu    sync.Mutex
	jwks      keyfunc.Keyfunc
	jwksErr   error
	jwksAt    time.Time
}

func NewService(cfg config.Config) *Service {
	hashKey := []byte(cfg.SessionSecret)
	if len(hashKey) < 32 {
		padded := make([]byte, 32)
		copy(padded, hashKey)
		hashKey = padded
	}
	blockKey := hashKey
	if len(blockKey) > 32 {
		blockKey = blockKey[:32]
	}
	store := sessions.NewCookieStore(hashKey, blockKey)
	store.Options = &sessions.Options{
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   0,
	}

	s := &Service{cfg: cfg, store: store}
	if cfg.SSOBaseURL != "" {
		s.oauth = &oauth2.Config{
			ClientID:     config.OAuthClientID,
			ClientSecret: cfg.ClientSecret,
			RedirectURL:  "", // computed per request from {baseUrl}/login/oauth2/code/drive
			Scopes:       nil,
			Endpoint: oauth2.Endpoint{
				AuthURL:   cfg.SSOBaseURL + "/oauth/authorize",
				TokenURL:  cfg.SSOBaseURL + "/oauth/token",
				AuthStyle: oauth2.AuthStyleAutoDetect,
			},
		}
	}
	return s
}

func (s *Service) oauthFor(r *http.Request) *oauth2.Config {
	if s.oauth == nil {
		return nil
	}
	cp := *s.oauth
	cp.RedirectURL = baseURL(r) + "/login/oauth2/code/drive"
	return &cp
}

func UserFrom(ctx context.Context) *User {
	u, _ := ctx.Value(contextKey{}).(*User)
	return u
}

func withUser(ctx context.Context, u *User) context.Context {
	return context.WithValue(ctx, contextKey{}, u)
}

func (u *User) HasAuthority(authority string) bool {
	if u == nil {
		return false
	}
	for _, a := range u.Authorities {
		if a == authority {
			return true
		}
	}
	return false
}

func (u *User) HasAnyAuthority(authorities []string) bool {
	for _, authority := range authorities {
		if u.HasAuthority(authority) {
			return true
		}
	}
	return false
}

func (s *Service) Parse(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if authz := r.Header.Get("Authorization"); strings.HasPrefix(strings.ToLower(authz), "bearer ") {
			token := strings.TrimSpace(authz[7:])
			user, err := s.userFromJWT(r.Context(), token)
			if err != nil {
				w.Header().Set("WWW-Authenticate", `Bearer`)
				writeJSON(w, http.StatusUnauthorized, "Unauthorized")
				return
			}
			next.ServeHTTP(w, r.WithContext(withUser(r.Context(), user)))
			return
		}

		if user := s.sessionUser(r); user != nil {
			next.ServeHTTP(w, r.WithContext(withUser(r.Context(), user)))
			return
		}
		next.ServeHTTP(w, r)
	})
}

// RedirectToLogin matches Spring's authenticated() matcher: unauthenticated
// browser requests are redirected into the OAuth2 authorization-code flow.
// Handlers without this middleware return 403 instead of starting login.
func (s *Service) RedirectToLogin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !s.cfg.Production {
			next.ServeHTTP(w, r)
			return
		}
		if UserFrom(r.Context()) != nil {
			next.ServeHTTP(w, r)
			return
		}
		s.beginLogin(w, r, currentURL(r))
	})
}

// RequireAnyAuthority matches @PreAuthorize("hasAnyAuthority(...)") when
// drive.production is true. The given authorities are evaluated as OR.
func (s *Service) RequireAnyAuthority(authorities []string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !s.cfg.Production {
				next.ServeHTTP(w, r)
				return
			}
			if UserFrom(r.Context()).HasAnyAuthority(authorities) {
				next.ServeHTTP(w, r)
				return
			}
			writeJSON(w, http.StatusForbidden, "Access is denied")
		})
	}
}

func (s *Service) StartLogin(w http.ResponseWriter, r *http.Request) {
	if s.oauth == nil {
		writeJSON(w, http.StatusInternalServerError, "SSO is not configured")
		return
	}
	s.beginLogin(w, r, "")
}

func (s *Service) beginLogin(w http.ResponseWriter, r *http.Request, saved string) {
	conf := s.oauthFor(r)
	if conf == nil {
		writeJSON(w, http.StatusInternalServerError, "SSO is not configured")
		return
	}
	state, err := randomState()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, "Failed to start login")
		return
	}
	session, _ := s.store.Get(r, sessionName)
	session.Values[sessionStateKey] = state
	if saved != "" {
		session.Values[sessionSavedKey] = saved
	}
	_ = session.Save(r, w)
	http.Redirect(w, r, conf.AuthCodeURL(state), http.StatusFound)
}

func (s *Service) Callback(w http.ResponseWriter, r *http.Request) {
	conf := s.oauthFor(r)
	if conf == nil {
		writeJSON(w, http.StatusInternalServerError, "SSO is not configured")
		return
	}
	session, _ := s.store.Get(r, sessionName)
	state, _ := session.Values[sessionStateKey].(string)
	if state == "" || r.URL.Query().Get("state") != state {
		writeJSON(w, http.StatusForbidden, "Access is denied")
		return
	}
	code := r.URL.Query().Get("code")
	if code == "" {
		writeJSON(w, http.StatusBadRequest, "Missing authorization code")
		return
	}
	tok, err := conf.Exchange(r.Context(), code)
	if err != nil {
		slog.Error("oauth token exchange failed", "err", err)
		writeJSON(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	user, err := s.fetchUserInfo(r.Context(), tok.AccessToken)
	if err != nil {
		slog.Error("oauth userinfo failed", "err", err)
		writeJSON(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	saved, _ := session.Values[sessionSavedKey].(string)
	session.Values = map[any]any{sessionUserKey: mustJSON(user)}
	_ = session.Save(r, w)
	if saved == "" {
		saved = "/"
	}
	http.Redirect(w, r, saved, http.StatusFound)
}

func (s *Service) Logout(w http.ResponseWriter, r *http.Request) {
	session, _ := s.store.Get(r, sessionName)
	session.Options.MaxAge = -1
	_ = session.Save(r, w)
	target := s.cfg.SSOBaseURL + "/logout"
	if s.cfg.SSOBaseURL == "" {
		target = "/"
	}
	http.Redirect(w, r, target, http.StatusFound)
}

func (s *Service) Me(w http.ResponseWriter, r *http.Request) {
	user := UserFrom(r.Context())
	if user == nil {
		if s.cfg.Production {
			writeJSON(w, http.StatusForbidden, "Access is denied")
			return
		}
		writeJSONValue(w, http.StatusOK, User{
			Name:     "User",
			UserName: "user@example.com",
			Avatar:   "https://i.imgur.com/lkAhvIs.png",
		})
		return
	}
	avatar := user.Avatar
	if avatar == "" {
		avatar = "https://i.imgur.com/lkAhvIs.png"
	}
	writeJSONValue(w, http.StatusOK, User{
		Name:     firstNonEmpty(user.DisplayName, user.Name),
		UserName: user.UserName,
		Avatar:   avatar,
	})
}

func (s *Service) LoginRedirect(w http.ResponseWriter, r *http.Request) {
	gotoURL := r.URL.Query().Get("goto")
	if gotoURL == "" {
		gotoURL = "/"
	}
	w.Header().Set("Location", gotoURL)
	w.WriteHeader(http.StatusFound)
}

func (s *Service) CurrentUser(r *http.Request) *User {
	if u := UserFrom(r.Context()); u != nil {
		return u
	}
	if !s.cfg.Production {
		return &User{Name: "anonymousUser", UserName: "anonymousUserId", DisplayName: "anonymousUser"}
	}
	return nil
}

func (s *Service) sessionUser(r *http.Request) *User {
	session, err := s.store.Get(r, sessionName)
	if err != nil {
		return nil
	}
	raw, _ := session.Values[sessionUserKey].(string)
	if raw == "" {
		return nil
	}
	var user User
	if err := json.Unmarshal([]byte(raw), &user); err != nil {
		return nil
	}
	return &user
}

func (s *Service) fetchUserInfo(ctx context.Context, accessToken string) (*User, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, s.cfg.SSOBaseURL+"/user", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil, err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("userinfo status %d", resp.StatusCode)
	}
	var attrs map[string]any
	if err := json.Unmarshal(body, &attrs); err != nil {
		return nil, err
	}
	user := &User{
		UserName:    stringAttr(attrs, "username"),
		DisplayName: stringAttr(attrs, "displayName"),
		Name:        stringAttr(attrs, "displayName"),
		Avatar:      stringAttr(attrs, "avatar"),
		Authorities: authoritiesFromUserInfo(attrs),
	}
	if user.UserName == "" {
		return nil, errors.New("userinfo missing username")
	}
	return user, nil
}

func (s *Service) userFromJWT(ctx context.Context, token string) (*User, error) {
	jwks, err := s.jwtKeyfunc()
	if err != nil {
		return nil, err
	}
	parsed, err := jwt.Parse(token, jwks.KeyfuncCtx(ctx))
	if err != nil || !parsed.Valid {
		return nil, errors.New("invalid jwt")
	}
	claims, ok := parsed.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("invalid claims")
	}
	username := firstNonEmpty(stringClaim(claims, "username"), stringClaim(claims, "sub"), stringClaim(claims, "preferred_username"))
	display := firstNonEmpty(stringClaim(claims, "displayName"), stringClaim(claims, "name"))
	return &User{
		UserName:    username,
		DisplayName: display,
		Name:        display,
		Avatar:      stringClaim(claims, "avatar"),
		Authorities: authoritiesFromClaims(claims),
	}, nil
}

func (s *Service) jwtKeyfunc() (keyfunc.Keyfunc, error) {
	s.jwksMu.Lock()
	defer s.jwksMu.Unlock()
	if s.jwks != nil && time.Since(s.jwksAt) < time.Hour {
		return s.jwks, s.jwksErr
	}
	if s.cfg.SSOBaseURL == "" {
		s.jwksErr = errors.New("SSO is not configured")
		return nil, s.jwksErr
	}
	jwks, err := keyfunc.NewDefaultCtx(context.Background(), []string{s.cfg.SSOBaseURL + "/oauth/jwk"})
	s.jwks = jwks
	s.jwksErr = err
	s.jwksAt = time.Now()
	return jwks, err
}

func authoritiesFromUserInfo(attrs map[string]any) []string {
	raw, ok := attrs["authorities"]
	if !ok {
		return nil
	}
	return parseAuthorities(raw)
}

func authoritiesFromClaims(claims jwt.MapClaims) []string {
	var out []string
	// JwtGrantedAuthoritiesConverter: scope / scp, no prefix.
	if v, ok := claims["scope"]; ok {
		out = append(out, parseAuthorities(v)...)
	} else if v, ok := claims["scp"]; ok {
		out = append(out, parseAuthorities(v)...)
	}
	if v, ok := claims["authorities"]; ok {
		out = append(out, parseAuthorities(v)...)
	}
	return unique(out)
}

func parseAuthorities(raw any) []string {
	switch v := raw.(type) {
	case string:
		if v == "" {
			return nil
		}
		return strings.Fields(v)
	case []any:
		var out []string
		for _, item := range v {
			switch t := item.(type) {
			case string:
				out = append(out, t)
			case map[string]any:
				if a, ok := t["authority"].(string); ok && a != "" {
					out = append(out, a)
				}
			}
		}
		return out
	case []string:
		return v
	default:
		return nil
	}
}

func stringAttr(attrs map[string]any, key string) string {
	if v, ok := attrs[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

func stringClaim(claims jwt.MapClaims, key string) string {
	v, ok := claims[key]
	if !ok {
		return ""
	}
	s, _ := v.(string)
	return s
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if v != "" {
			return v
		}
	}
	return ""
}

func unique(in []string) []string {
	seen := map[string]struct{}{}
	var out []string
	for _, v := range in {
		if v == "" {
			continue
		}
		if _, ok := seen[v]; ok {
			continue
		}
		seen[v] = struct{}{}
		out = append(out, v)
	}
	return out
}

func randomState() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

func mustJSON(v any) string {
	b, _ := json.Marshal(v)
	return string(b)
}

func baseURL(r *http.Request) string {
	scheme := "http"
	if r.TLS != nil || strings.EqualFold(r.Header.Get("X-Forwarded-Proto"), "https") {
		scheme = "https"
	}
	host := r.Host
	if fwd := r.Header.Get("X-Forwarded-Host"); fwd != "" {
		host = fwd
	}
	return scheme + "://" + host
}

func currentURL(r *http.Request) string {
	u := url.URL{
		Scheme:   "http",
		Host:     r.Host,
		Path:     r.URL.Path,
		RawQuery: r.URL.RawQuery,
	}
	if r.TLS != nil || strings.EqualFold(r.Header.Get("X-Forwarded-Proto"), "https") {
		u.Scheme = "https"
	}
	return u.String()
}

func writeJSON(w http.ResponseWriter, status int, message string) {
	writeJSONValue(w, status, map[string]string{"message": message})
}

func writeJSONValue(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
