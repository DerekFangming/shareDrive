# drive-server-go

Go rewrite of `drive-server`. HTTP routes, file behavior, and JSON shapes match the Spring app so the existing Angular UI can keep using the same endpoints.

## Security (Spring Security equivalent)

Production (`PRODUCTION=true`) uses the same two authentication mechanisms as the Java server:

1. **OAuth2 authorization-code login** (browser session cookie)
   - Authorization: `{SSO_BASE_URL}/oauth/authorize`
   - Token: `{SSO_BASE_URL}/oauth/token`
   - User info: `{SSO_BASE_URL}/user`
   - Callback: `{baseUrl}/login/oauth2/code/drive`
   - Client id `drive`, secret `DR_CLIENT_SECRET`
   - Authorities are read from userinfo `authorities[].authority` (same mapper as `SecurityConfig`)
2. **JWT resource server** (`Authorization: Bearer`)
   - Keys from `{SSO_BASE_URL}/oauth/jwk`
   - Authorities from JWT `scope` / `scp` with no `SCOPE_` prefix, plus `authorities` if present

Access control:

| Layer | Behavior |
| --- | --- |
| Authenticated (any logged-in user) | `/login-redirect`, `/me`, `/api/directory/**`, `/api/shares` |
| `hasAuthority('DR')` | download/upload/rename/move/delete/search, capacity, directory size, create directory, share mutations |
| Public | shared-directory / download-shared-file / upload-shared-file (valid, unexpired share code; write shares only for upload) |

When `PRODUCTION` is not true, auth checks are skipped and `/me` returns the same dummy user as the Java server.

Logout goes to `{SSO_BASE_URL}/logout`.

## Run

```bash
export DR_ROOT_DIRECTORY=/path/to/files
export SSO_BASE_URL=https://sso.example.com
export DR_CLIENT_SECRET=...
export PRODUCTION=true
go run ./cmd/drive
```

Listens on port **9102** (override with `PORT`).

### Datastore

- Default (Java H2 file): SQLite at `{root}/.dr_internal/drive.sqlite`
- Postgres: `DR_DB_TYPE=postgres` and `DR_DB_URL` (`jdbc:postgresql://host:5432/drive` or `postgres://...`)

Put the Angular build in `static/` (or `DRIVE_STATIC_DIR`) so the server can serve the SPA, including fallback to `index.html`.
