package db

import (
	"database/sql"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/fmning/drive/internal/config"
	"github.com/fmning/drive/internal/status"

	_ "github.com/jackc/pgx/v5/stdlib"
	_ "modernc.org/sqlite"
)

type Share struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	Path        string     `json:"path"`
	Expiration  *time.Time `json:"expiration"`
	Created     *time.Time `json:"created"`
	WriteAccess bool       `json:"writeAccess"`
	CreatorID   string     `json:"creatorId"`
	CreatorName string     `json:"creatorName"`
}

type Store struct {
	DB *sql.DB
}

func Open(cfg config.Config, rootDir string) (*Store, error) {
	var (
		driver string
		dsn    string
	)

	if cfg.IsPostgres() {
		driver = "pgx"
		dsn = postgresDSN(cfg)
		if dsn == "" {
			status.MarkDatabaseInvalid()
			driver, dsn = memorySQLite()
		} else if err := ping(driver, dsn); err != nil {
			status.MarkDatabaseInvalid()
			driver, dsn = memorySQLite()
		}
	} else {
		if status.Get() != status.OK {
			driver, dsn = memorySQLite()
		} else {
			driver = "sqlite"
			dsn = filepath.Join(rootDir, config.InternalFolder, "drive.sqlite")
			if err := ping(driver, dsn); err != nil {
				status.MarkDatabaseInvalid()
				driver, dsn = memorySQLite()
			}
		}
	}

	sqlDB, err := sql.Open(driver, dsn)
	if err != nil {
		return nil, err
	}
	if err := sqlDB.Ping(); err != nil {
		return nil, err
	}
	store := &Store{DB: sqlDB}
	if err := store.migrate(); err != nil {
		return nil, err
	}
	return store, nil
}

func ping(driver, dsn string) error {
	sqlDB, err := sql.Open(driver, dsn)
	if err != nil {
		return err
	}
	defer sqlDB.Close()
	return sqlDB.Ping()
}

func memorySQLite() (string, string) {
	return "sqlite", "file:drive?mode=memory&cache=shared"
}

func postgresDSN(cfg config.Config) string {
	raw := strings.TrimSpace(cfg.DBURL)
	if raw == "" {
		return ""
	}
	raw = strings.TrimPrefix(raw, "jdbc:")
	if strings.HasPrefix(raw, "postgresql://") {
		raw = "postgres://" + strings.TrimPrefix(raw, "postgresql://")
	}
	if strings.HasPrefix(raw, "postgres://") || strings.HasPrefix(raw, "postgresql://") {
		u, err := url.Parse(raw)
		if err != nil {
			return raw
		}
		if u.User == nil && cfg.DBUsername != "" {
			u.User = url.UserPassword(cfg.DBUsername, cfg.DBPassword)
		}
		return u.String()
	}
	// jdbc:postgresql://host:5432/db
	raw = strings.TrimPrefix(raw, "postgresql://")
	user := url.UserPassword(cfg.DBUsername, cfg.DBPassword)
	return fmt.Sprintf("postgres://%s@%s", user.String(), raw)
}

func (s *Store) migrate() error {
	_, err := s.DB.Exec(`
CREATE TABLE IF NOT EXISTS dr_shares (
	id TEXT PRIMARY KEY,
	name TEXT,
	path TEXT,
	expiration TIMESTAMP,
	created TIMESTAMP,
	write_access BOOLEAN,
	creator_id TEXT,
	creator_name TEXT
)`)
	return err
}

func (s *Store) FindAll() ([]Share, error) {
	rows, err := s.DB.Query(`SELECT id, name, path, expiration, created, write_access, creator_id, creator_name FROM dr_shares`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	shares := make([]Share, 0)
	for rows.Next() {
		share, err := scanShare(rows)
		if err != nil {
			return nil, err
		}
		shares = append(shares, share)
	}
	return shares, rows.Err()
}

func (s *Store) FindByID(id string) (*Share, error) {
	row := s.DB.QueryRow(`SELECT id, name, path, expiration, created, write_access, creator_id, creator_name FROM dr_shares WHERE id = $1`, id)
	share, err := scanShare(row)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &share, nil
}

func (s *Store) Save(share Share) error {
	_, err := s.DB.Exec(`
INSERT INTO dr_shares (id, name, path, expiration, created, write_access, creator_id, creator_name)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
ON CONFLICT (id) DO UPDATE SET
	name = excluded.name,
	path = excluded.path,
	expiration = excluded.expiration,
	created = excluded.created,
	write_access = excluded.write_access,
	creator_id = excluded.creator_id,
	creator_name = excluded.creator_name
`, share.ID, share.Name, share.Path, nullTime(share.Expiration), nullTime(share.Created), share.WriteAccess, share.CreatorID, share.CreatorName)
	return err
}

func (s *Store) Delete(id string) (bool, error) {
	res, err := s.DB.Exec(`DELETE FROM dr_shares WHERE id = $1`, id)
	if err != nil {
		return false, err
	}
	n, err := res.RowsAffected()
	return n > 0, err
}

func (s *Store) IDExists(id string) (bool, error) {
	var n int
	err := s.DB.QueryRow(`SELECT COUNT(1) FROM dr_shares WHERE id = $1`, id).Scan(&n)
	return n > 0, err
}

type scanner interface {
	Scan(dest ...any) error
}

func scanShare(s scanner) (Share, error) {
	var share Share
	var exp, created sql.NullTime
	var name, path, creatorID, creatorName sql.NullString
	err := s.Scan(&share.ID, &name, &path, &exp, &created, &share.WriteAccess, &creatorID, &creatorName)
	share.Name = name.String
	share.Path = path.String
	share.CreatorID = creatorID.String
	share.CreatorName = creatorName.String
	if exp.Valid {
		t := exp.Time.UTC()
		share.Expiration = &t
	}
	if created.Valid {
		t := created.Time.UTC()
		share.Created = &t
	}
	return share, err
}

func nullTime(t *time.Time) any {
	if t == nil {
		return nil
	}
	return *t
}

func EnsureDir(path string) error {
	return os.MkdirAll(path, 0777)
}
