# Supplement Tracker API — LLM Quickstart

**Base URL**: `http://hae-server` (Tailscale only)
**Auth**: `api-key` header with either the read or write token (get from 1Password "Health Auto Export Secrets")
**Web UI**: `http://hae-server/supplements/` (Tailscale) or `https://supplements.designbuildautomate.io/supplements/` (Cloudflare Access)

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| **GET** | `/api/supplements?active=true` | List active supplements |
| **POST** | `/api/supplements` | Create a supplement definition |
| **PUT** | `/api/supplements/:id` | Update a supplement |
| **DELETE** | `/api/supplements/:id` | Deactivate a supplement (soft delete) |
| **GET** | `/api/supplement-stack` | Get full weekly stack (populated with supplement names) |
| **GET** | `/api/supplement-stack/today?tz=America/Denver` | Today's stack with slot details |
| **PUT** | `/api/supplement-stack` | Replace entire weekly stack |
| **POST** | `/api/supplement-logs` | Log a dose (by supplement ID) |
| **POST** | `/api/supplement-logs/quick` | Log a dose (by supplement name — easiest) |
| **GET** | `/api/supplement-logs?start_date=...&end_date=...` | Get dose logs (default: last 7 days) |
| **DELETE** | `/api/supplement-logs/:id` | Delete a dose log |
| **GET** | `/api/supplement-inventory?active=true` | List active inventory |
| **POST** | `/api/supplement-inventory` | Add inventory record |
| **PUT** | `/api/supplement-inventory/:id` | Update inventory record |
| **DELETE** | `/api/supplement-inventory/:id` | Delete inventory record |

## Quick Log (recommended for LLMs)

The easiest way to log a dose — use the supplement name instead of looking up IDs:

```bash
curl -X POST http://hae-server/api/supplement-logs/quick \
  -H "Content-Type: application/json" \
  -H "api-key: sk-..." \
  -d '{"name": "Vitamin D", "slot": "morning"}'
```

- `name` — case-insensitive match against active supplements
- `slot` — `morning`, `noon`, `night`, or `other`
- `dose_quantity` — optional, defaults to the supplement's `default_dose`
- `timestamp` — optional, defaults to now

Inventory auto-decrements from the oldest active batch (FIFO).

Response includes `inventory_decremented: true/false` and `pills_remaining`.

## Log by ID

```bash
curl -X POST http://hae-server/api/supplement-logs \
  -H "Content-Type: application/json" \
  -H "api-key: sk-..." \
  -d '{"supplement_id": "...", "dose_quantity": 1, "slot": "morning"}'
```

## Create Supplement

```bash
curl -X POST http://hae-server/api/supplements \
  -H "Content-Type: application/json" \
  -H "api-key: sk-..." \
  -d '{
    "name": "Magnesium Glycinate",
    "default_dose": 400,
    "dose_unit": "mg",
    "category": "mineral"
  }'
```

**dose_unit** (enum): `mg`, `mcg`, `g`, `iu`, `capsule`, `tablet`, `ml`, `drop`, `scoop`
**category** (enum): `vitamin`, `mineral`, `amino_acid`, `herb`, `probiotic`, `omega`, `other`

## Add Inventory

```bash
curl -X POST http://hae-server/api/supplement-inventory \
  -H "Content-Type: application/json" \
  -H "api-key: sk-..." \
  -d '{
    "supplement_id": "...",
    "quantity_purchased": 120,
    "unit_cost": 0.15,
    "purchase_date": "2026-02-21",
    "expiration_date": "2027-02-21"
  }'
```

- `pills_remaining` is auto-set to `quantity_purchased`
- `expiration_date` is optional
- Inventory auto-decrements when doses are logged (FIFO by purchase date)
- When `pills_remaining` hits 0, the record is marked `active: false`

## Update Weekly Stack

```bash
curl -X PUT http://hae-server/api/supplement-stack \
  -H "Content-Type: application/json" \
  -H "api-key: sk-..." \
  -d '{
    "name": "Daily Stack v1",
    "monday": {
      "morning": [
        {"supplement_id": "...", "dose_quantity": 1},
        {"supplement_id": "...", "dose_quantity": 2}
      ],
      "noon": [],
      "night": [{"supplement_id": "...", "dose_quantity": 1}]
    },
    "tuesday": { "morning": [], "noon": [], "night": [] }
  }'
```

- Each day has 3 slots: `morning`, `noon`, `night`
- Days not included default to empty slots
- Any previous active stack is deactivated (only one active stack at a time)

## Query Logs

```bash
# Last 7 days (default)
curl http://hae-server/api/supplement-logs -H "api-key: sk-..."

# Custom range
curl "http://hae-server/api/supplement-logs?start_date=2026-02-01&end_date=2026-02-28&limit=500" \
  -H "api-key: sk-..."

# Filter by supplement or slot
curl "http://hae-server/api/supplement-logs?supplement_id=...&slot=morning" \
  -H "api-key: sk-..."
```

Logs are returned newest-first with populated supplement names.
