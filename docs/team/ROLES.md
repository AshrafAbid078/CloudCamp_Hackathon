# ROLES.md — Meridian Grid Role Reference Card

**Last Updated:** 2026-09-19

---

## Role Hierarchy

```
admin
  └── grid_operator
        └── facility_manager
```

Higher roles have **all** permissions of the roles below them, plus their own extras.

---

## Permissions Matrix

| Endpoint | facility_manager | grid_operator | admin |
|---|:---:|:---:|:---:|
| `POST /auth/login` | ✅ | ✅ | ✅ |
| `GET /auth/me` | ✅ | ✅ | ✅ |
| `PUT /auth/me/password` | ✅ | ✅ | ✅ |
| `GET /forecast/{region}` | ✅ | ✅ | ✅ |
| `GET /dispatch/plan` | ✅ | ✅ | ✅ |
| `GET /dispatch/history` | ❌ | ✅ | ✅ |
| `POST /auth/register` | ❌ | ❌ | ✅ |
| `GET /auth/users` | ❌ | ❌ | ✅ |
| `DELETE /auth/users/{id}` | ❌ | ❌ | ✅ |
| `GET /health` | Public | Public | Public |
| `GET /` | Public | Public | Public |

---

## Role Definitions

### `facility_manager`
**Primary user.** A factory or industrial facility operator who wants to shift their load to cheaper, greener hours.

- Can run dispatch plans and see optimized schedules for their assets
- Can view solar + carbon forecasts for Bangladesh
- Cannot see other users' dispatch history
- Cannot create or manage user accounts

**Copilot tone:** Action-first. "Run the dryer at 02:00 — saves ৳420 and 3.2 kg CO2."

---

### `grid_operator`
**Power grid manager.** A BPDB or distribution company operator who needs system-level visibility.

- All `facility_manager` permissions
- Can view `GET /dispatch/history` to see all past runs across all facilities
- Cannot manage users

**Copilot tone:** Numbers-first, technical. "System peak shaved by 42 kW across 8 assets. Grid stress at 14:00–16:00 highest — recommend battery discharge window."

---

### `admin`
**System administrator.** Manages users and the platform itself.

- All `grid_operator` permissions
- Can create new user accounts (`POST /auth/register`)
- Can list all users (`GET /auth/users`)
- Can deactivate users (`DELETE /auth/users/{id}`) — soft-delete, data is retained
- Cannot deactivate their own account

---

## Default Credentials

On first server boot, a default admin is seeded if no users exist:

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `admin123` |
| Role | `admin` |
| `must_change_password` | `true` |

> ⚠️ **Change this password immediately** via `PUT /auth/me/password` before any real usage.

---

## Creating Users (Admin Only)

```bash
# 1. Get admin token
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r .access_token)

# 2. Create a grid_operator
curl -X POST http://localhost:8000/auth/register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "grid_op_dhaka",
    "password": "SecurePass123",
    "role": "grid_operator"
  }'

# 3. Create a facility_manager
curl -X POST http://localhost:8000/auth/register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "factory_chittagong",
    "password": "SecurePass456",
    "role": "facility_manager"
  }'
```

---

## Using the JWT in Requests

All protected endpoints require the token in the `Authorization` header:

```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r .access_token)

# Use token
curl -X GET "http://localhost:8000/forecast/bd?horizon_hours=24" \
  -H "Authorization: Bearer $TOKEN"

curl -X GET "http://localhost:8000/dispatch/plan?hours=24" \
  -H "Authorization: Bearer $TOKEN"
```

Tokens expire after **60 minutes** (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES` in `.env`). Re-login to get a new token.

---

## Deactivating a User

Deactivation is a **soft-delete** — the user row stays in the DB with `is_active=False`. All their `dispatch_runs` history is retained. The user can no longer log in.

```bash
# List users to find the ID
curl -X GET http://localhost:8000/auth/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Deactivate user with id=3
curl -X DELETE http://localhost:8000/auth/users/3 \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```
