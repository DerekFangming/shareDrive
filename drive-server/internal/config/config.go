package config

import (
	"os"
	"strconv"
	"strings"
)

const (
	DefaultPort       = 9102
	MaxUploadBytes    = 4294967296 // 4 GiB, matching Spring multipart limits
	MultipartMemBytes = 2 << 20    // 2 MiB threshold before spilling to disk
	OAuthClientID     = "drive"
	AuthorityDR       = "DR"
	InternalFolder    = ".dr_internal"
	StaticDir         = "static"
)

type Config struct {
	Host          string
	Port          int
	Production    bool
	RootDir       string
	DBType        string
	DBURL         string
	DBUsername    string
	DBPassword    string
	SSOBaseURL    string
	ClientSecret  string
	SessionSecret string
}

func Load() Config {
	cfg := Config{
		Host:          env("HOST", "localhost"),
		Port:          envInt("PORT", DefaultPort),
		Production:    envBool("PRODUCTION"),
		RootDir:       env("DR_ROOT_DIRECTORY", ""),
		DBType:        env("DR_DB_TYPE", "h2"),
		DBURL:         env("DR_DB_URL", ""),
		DBUsername:    env("DR_DB_USERNAME", "sa"),
		DBPassword:    env("DR_DB_PASSWORD", "password"),
		SSOBaseURL:    strings.TrimRight(env("SSO_BASE_URL", ""), "/"),
		ClientSecret:  env("DR_CLIENT_SECRET", ""),
		SessionSecret: env("DR_SESSION_SECRET", ""),
	}
	if cfg.SessionSecret == "" {
		cfg.SessionSecret = cfg.ClientSecret
	}
	if cfg.SessionSecret == "" {
		cfg.SessionSecret = "drive-session-secret"
	}

	return cfg
}

func (c Config) IsPostgres() bool {
	t := strings.ToLower(c.DBType)
	return t == "postgres" || t == "postgresql"
}

func env(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok {
		return v
	}
	return fallback
}

func envBool(key string) bool {
	v, ok := os.LookupEnv(key)
	if !ok {
		return false
	}
	b, err := strconv.ParseBool(v)
	return err == nil && b
}

func envInt(key string, fallback int) int {
	v, ok := os.LookupEnv(key)
	if !ok {
		return fallback
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return fallback
	}
	return n
}
