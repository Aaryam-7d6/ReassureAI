# What Is Not Working

## Auth frontend/backend contract

Status: resolved.

The current codebase now exposes the expected auth routes under the frontend’s API base URL, so the auth flow works with the existing React app without a contract mismatch.

### What is now in place

- The auth router is mounted from [backend/main.py](backend/main.py) under the expected /api/v1 prefix.
- The backend auth endpoints are available at /api/v1/auth/register, /api/v1/auth/login, /api/v1/auth/logout, and /api/v1/auth/me via [backend/app/api/v1/endpoints/auth.py](backend/app/api/v1/endpoints/auth.py).
- The frontend uses the matching paths from [frontend/src/api/authApi.js](frontend/src/api/authApi.js) and the cookie-based Axios config in [frontend/src/api/axios.js](frontend/src/api/axios.js).
- The current-user lookup in the auth endpoint resolves the user from the httpOnly cookie or Bearer token.
- JWT creation uses the active settings from [backend/config.py](backend/config.py) and [backend/app/utils/security.py](backend/app/utils/security.py).

### Non-blocking warnings still present

- Pydantic deprecation warnings related to BaseSettings config.
- datetime.utcnow() deprecation warnings.

These do not break the current auth flow, but they are worth cleaning up later if you want a quieter test run.
