# WireLog — Analytics for Agents & LLMs

> Headless, API-first analytics. Events in, Markdown out. Agents can query directly or author lightweight YAML dashboards.

Alternative to PostHog, Amplitude, and Mixpanel designed for AI agents. Track events via HTTP, query with a pipe DSL, get Markdown tables back.

## API Keys

| Prefix | Name | Permissions | Where to use |
|--------|------|-------------|--------------|
| `pk_` | Public | Track only | Client-side (browsers, mobile, agents) |
| `sk_` | Secret | Track + query + identify + admin + dashboards | Server-side only — never expose |
| `aat_` | Access token | Scoped track/query/admin/dashboard access, time-limited | Personal CLI/dashboard tokens, agents, integrations |

Auth: send keys as `X-API-Key`. Only public `pk_` tracking keys may use `?key=`.

---

## Setup

### Browser Script Tag

```html
<script src="https://cdn.wirelog.ai/public/wirelog.js" data-key="pk_YOUR_KEY"></script>
```

Auto-tracks `page_view` on load and SPA navigations. Auto-captures: url, previous_url, referrer, referring_domain, title, viewport, language, timezone, utm_source/medium/campaign/term/content, gclid, fbclid.

| Attribute | Description |
|-----------|-------------|
| `data-key` | Public key (required) |
| `data-host` | API URL override (defaults to script src origin) |
| `data-consent` | `"true"` = require `wl.optIn()` before tracking |
| `data-auto` | `"false"` = disable auto page_view |
| `data-spa` | `"false"` = disable SPA navigation tracking |
| `data-env` | Choice result environment |
| `data-choice-seed` | Stable choice assignment seed, usually project ID |

JS API:
```javascript
wl.track("event_name", { key: "value" })       // custom event
wl.identify("user_id", { name: "Alice" })       // bind device to user + set profile
wl.reset()                                       // clear identity (logout)
wl.optIn() / wl.optOut()                         // consent management
wl.flush()                                       // manual flush
wl.choice("landing_h1", [{ key: "welcome", value: "landing.h1.welcome" }])
wl.assignment("landing_h1", [{ key: "welcome", value: "landing.h1.welcome", weight: 1 }])
```

Identity: device_id in localStorage, session_id in sessionStorage (30-min timeout), user_id in localStorage. Batches 10 events or every 2s. sendBeacon on page close.

### TypeScript / Node.js

```bash
npm install wirelog
```

```typescript
import { wl } from "wirelog";

wl.init({ apiKey: "pk_YOUR_KEY" });

wl.track({ event_type: "signup", user_id: "u_123", event_properties: { plan: "free" } });
wl.identify({ user_id: "u_123", user_properties: { name: "Alice", plan: "pro" } });
await wl.close(); // flush on shutdown
```

Zero runtime dependencies. Node 18+ and all modern browsers. In browsers, shares identity with the script tag (same localStorage keys). Batches 10 events or every 2s with retry.

### Python

```bash
pip install wirelog
```

```python
from wirelog import WireLog

wl = WireLog(api_key="pk_YOUR_KEY")

wl.track("signup", user_id="u_123", event_properties={"plan": "free"})
wl.identify("u_123", user_properties={"name": "Alice", "plan": "pro"})
wl.close()  # flush on shutdown
```

Zero external dependencies. Python 3.9+. Background thread batches 10 events or every 2s with retry. Context manager supported: `with WireLog() as wl:`.

### Go

```bash
go get github.com/wirelogai/wirelog-go
```

```go
import wirelog "github.com/wirelogai/wirelog-go"

client := wirelog.New(wirelog.Config{APIKey: "pk_YOUR_KEY"})
defer client.Close()

client.Track(wirelog.Event{EventType: "signup", UserID: "u_123", EventProperties: map[string]any{"plan": "free"}})
client.Identify(ctx, wirelog.IdentifyParams{UserID: "u_123", UserProperties: map[string]any{"name": "Alice", "plan": "pro"}})
```

Zero external dependencies. Go 1.22+. `Track()` is non-blocking — background goroutine batches 10 events or every 2s with retry. Queue capped at 10,000.

### CLI

```bash
brew install wirelogai/tap/wl
# or: go install github.com/wirelogai/wirelog-cli@latest
```

```bash
wl config init                                         # interactive setup
wl inspect                                             # discover events
wl query "* | last 7d | count by event_type"           # query
wl query --query "inspect * | last 30d" --query "users | count" --json
wl track page_view --user-id u1 --prop path=/home      # track
wl identify --user-id u1 --prop plan=pro               # identify
```

Auto-detects TTY: styled tables for humans, `--json` for agents. For multiple independent queries, prefer repeated `--query` flags; the CLI returns `{"results":[...]}` in JSON mode. Config precedence: flags > env vars (`WIRELOG_API_KEY`/`WIRELOG_HOST`) > `.wirelog.json` > `~/.config/wirelog/config.json`.

### Dashboard YAML

Dashboards are agent-authored YAML files for related WireLog queries. They can be validated, run as data, viewed locally, exported as HTML, or synced into the authenticated project page.

```bash
wl dashboard schema --output -
wl dashboard init --output -
wl dashboard validate --file dashboard.yaml
wl dashboard validate --file - --json
wl dashboard run --file dashboard.yaml --json
wl dashboard run --file dashboard.yaml --var range=7d --format markdown
wl dashboard view --file dashboard.yaml --open
wl dashboard view --file ./dashboards
wl dashboard sync --file dashboard.yaml
wl dashboard sync --file ./dashboards --visibility project
wl dashboard save --file dashboard.yaml --output index.html --mode report
wl dashboard save --file dashboard.yaml --output - --mode report
```

- `report`: fixed data, no token embedded. Prefer for sharing.
- `interactive`: browser can re-query; requires a query-scoped `aat_` token. Team members should use a personal query token. Never embed `sk_`, `pk_`, or `ak_`.
- `view --file <dir>` renders a sidebar for `.yaml`/`.yml` dashboards.
- `sync --file <path>` validates and versions one file or a directory in the credential's project. Use a stable root `id`; `--visibility personal|project` explicitly changes access, while omission preserves an existing dashboard's visibility. The indented project-sidebar document rail and title-adjacent switcher include shared dashboards and the current user's personal dashboards. Use a project-visible directory sync when the team should see every file. The empty web workspace shows the starter, preview, and sync commands and links to the guide and token workflow. Sync creates no public or standalone URL.
- Directory dashboards have stable local routes like `/dashboard/usage.yaml`; extensionless routes like `/dashboard/usage` work when unambiguous.
- Root `order: 10` controls sidebar order; leave gaps like `10`, `20`, `30`.
- Root `timezone: UTC` controls display timezone; use the user's preferred IANA timezone when known.

Start every dashboard from discovery:

```bash
wl query --query "inspect * | last 30d" --query "* | last 30d | count by event_type | top 20" --json
```

Test dashboard queries as you author them. For each important source, filter, user variable, and metric, run a representative `wl query "..." --json` and verify the returned rows, columns, and values match the card you are building. Do not assume field names or identity filters work because they look plausible.

Before handing off a dashboard, run it as data:

```bash
wl dashboard run --file dashboard.yaml --json
wl dashboard run --file dashboard.yaml --var range=7d --format markdown
```

Treat unexpected zeros, empty rows, missing columns, or wrong modes as query bugs and fix the YAML before viewing/exporting.

Every dashboard gets a built-in `range` date-range control unless it defines `variables.range`. Prefer `{{range.stage}}` in queries; it expands to a full time stage such as `| last 30d`, last month, or a custom `from/to` range. Old `| last {{range}}` templates are accepted for compatibility.

For chart cards, set `options.x`, `options.y`, and `options.series` when a result has multiple plausible columns. Time bucket charts render chronologically and align multi-series buckets; missing bucket values display as gaps. Line and area charts keep the active bucket live, draw its final segment as dashed, and mark its tooltip `partial`.

Local dashboards start the first two visible cards immediately, then start the next card in layout order whenever one finishes. Each card paints independently. The local server caps the whole dashboard at four active ClickHouse queries; identical in-flight queries are coalesced and recent results use a short, refresh-aware cache. Manual refresh bypasses older cached results while preserving deduplication within that refresh. Interactive exports retain bounded multi-card requests, and synced project dashboards load two cards at a time in visual order. Cards entering the viewport settle for 400 ms. Required inputs are prompted before any scroll-to-load copy appears. Query rate limits are surfaced immediately instead of being retried invisibly.

### Choices

Agents should analyze `wirelog.choice()` experiments from discovered conversion
events, not guessed event names:

```bash
wl query "inspect * | last 30d" --json
wl choice results landing_h1 --conversion signup --window 7d
```

Choice result queries:

```text
choice landing_h1 | results signup
choice landing_h1 | results signup | window 7d | unit user_id
choice landing_h1 | last 7d | count by variant_key
```

Choices are declared in application code with `choice()`; keep analysis and
dashboards on the `choice <key>` query source and `wl choice results`.
Keep variant keys stable for i18n; `choice_version` ignores localized `value`.
Use a stable choice seed/project ID when assignments must survive API key
rotation.

Minimal dashboard:

```yaml
version: 1
id: product-growth
title: Product Growth
order: 10
refresh: 60s
timezone: UTC
variables:
  range:
    label: Range
    type: date_range
    default: 30d
sections:
  - title: Overview
    cards:
      - id: events-by-day
        title: Events by Day
        kind: chart
        viz: line
        layout: {w: 6, h: 4}
        query: '* {{range.stage}} | count by day'
      - id: top-events
        title: Top Events
        kind: table
        viz: table
        layout: {w: 6, h: 4}
        query: '* {{range.stage}} | count by event_type | top 20'
```

Shared filters use author-controlled fragments:

```yaml
variables:
  range:
    label: Range
    type: date_range
    default: 30d
  platform:
    label: Platform
    type: select
    default: all
    options:
      - {label: All, value: all, fragment: ""}
      - {label: Web, value: web, fragment: '| where _platform = "web"'}
query: 'signup {{range.stage}} {{platform.fragment}} | count by day'
```

Dynamic dropdowns can come from data:

```yaml
variables:
  country:
    label: Country
    type: select
    default: all
    options:
      - {label: All, value: all, fragment: ""}
    query: '* | last 30d | count by _country | top 25'
    value_column: _country
    label_column: _country
    fragment_template: '| where _country = "{{value}}"'
```

User lookup dashboards use submitted input variables with safe named fragments. Exact emails become equality filters; `*@example.com` becomes a domain equality filter when allowed:

```yaml
variables:
  subject:
    label: User
    type: input
    input: email
    required: true
    submit: true
    placeholder: "email or *@example.com"
    allow_domain_wildcard: true
    fragments:
      events: {exact_field: user.email, domain_field: user.email_domain}
      users: {exact_field: email, domain_field: email_domain}
query: '* {{subject.events_fragment}} {{range.stage}} | list | limit 100'
```

Chart hints:

```yaml
options: {x: day, y: value, series: _browser}
query: 'page_view {{range.stage}} | count by day, _browser | top 50'
```

Dashboard-side ratios use two normal aggregate queries:

```yaml
options: {calculate: ratio, x: day, y: value}
queries:
  - {name: Purchases, query: 'purchase {{range.stage}} | count by day'}
  - {name: Signups, query: 'signup {{range.stage}} | count by day'}
```

Dashboard rules:
- Use real event names from `inspect`; do not invent project-specific events.
- Use `query` for one series, `queries` for overlays or ratios.
- Use `select` for dropdowns; use `input` only with safe named fragments.
- Never splice raw user text into a query.
- Validate and run before exporting.

### Raw HTTP (cURL)

```bash
# Track
curl -X POST https://api.wirelog.ai/track \
  -H "X-API-Key: pk_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"page_view","user_id":"u_123","event_properties":{"page":"/pricing"}}'

# Query (requires a personal query aat_ token or sk_ key)
curl -X POST https://api.wirelog.ai/query \
  -H "X-API-Key: sk_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"q":"page_view | last 7d | count by _browser","format":"llm"}'

# Identify
curl -X POST https://api.wirelog.ai/identify \
  -H "X-API-Key: pk_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"u_123","device_id":"dev_abc","user_properties":{"plan":"pro"}}'
```

All SDKs support env vars: `WIRELOG_API_KEY` and `WIRELOG_HOST` (default: `https://api.wirelog.ai`).

---

## Event Schema

```json
{
  "event_type": "string (required)",
  "user_id": "string",
  "device_id": "string",
  "session_id": "string",
  "time": "ISO 8601 (defaults to now)",
  "event_properties": { "key": "string|number|bool|null" },
  "user_properties": { "key": "string|number|bool|null" },
  "insert_id": "string (auto-generated for deduplication)",
  "clientOriginated": true
}
```

Batch: `{ "events": [ ...up to 2000 ] }`
Response: `{"accepted": N}` (invalid events silently skipped).

### What to Track

- **SaaS**: signup, login, feature_used (with `event_properties.feature`), subscription_started, payment_completed
- **E-Commerce**: page_view, search, item_viewed, add_to_cart, checkout_started, purchase
- **AI Agent**: agent_action, agent_error, token_usage, user_feedback
- **General**: use `event_properties` for event data, `user_properties`/identify for user data, send `device_id` on every event

---

## Identity & Profiles

Call `POST /identify` when a user is known (login/signup/account-link):

```json
{
  "user_id": "alice@acme.org",
  "device_id": "dev_abc",
  "user_properties": { "email": "alice@acme.org", "plan": "pro" },
  "user_property_ops": {
    "$set": { "plan": "pro" },
    "$set_once": { "signup_source": "ads" },
    "$add": { "login_count": 1 },
    "$unset": ["legacy_flag"]
  }
}
```

Response: `{"ok": true}`

- `distinct_id = coalesce(user_id, mapped_user_id, device_id)` — stitched identity across anonymous and known users
- Pre-identify anonymous events are retroactively attributed once the device is identified
- Recommended profile fields — B2B: `email`, `plan`, `company_id`, `company`, `account_tier`; B2C: `email`, `acquisition_channel`, `persona`, `country`

---

## Query Language

### Structure

```
source | stage | stage | ...
```

```bash
POST /query  {"q": "signup | last 7d | count by day", "format": "llm"}
```

Output formats: `llm` (Markdown tables, default), `json`, `csv`.
JSON responses include `rows_scanned`, the ClickHouse source rows read during execution rather than the number of returned rows.

### Discover Events First

Always discover before writing event-specific queries:

```
inspect * | last 30d                              -- event overview with properties
inspect signup | last 7d                          -- single event property detail
* | last 30d | count by event_type | top 20       -- lightweight event counts
fields | last 7d                                   -- all available fields
```

### Sources

| Source | Syntax | Description |
|--------|--------|-------------|
| Event | `page_view`, `"landing:cta_click"`, `*` | Events by name. `*` = all. Quotes for special chars. |
| Funnel | `funnel a -> b -> c` | Conversion funnel. Optional: `exclude x, y` (between-step). |
| Retention | `retention signup` | Week-over-week cohort. Optional: `returning <event>`. |
| Paths | `paths from signup` or `paths to purchase` | Event sequences. Use `\| by _path` for URL nav flows. |
| Sessions | `sessions` | Session-level analysis. |
| Lifecycle | `lifecycle page_view` | New / Returning / Resurrected / Dormant segments. |
| Stickiness | `stickiness page_view` | Days active per period distribution. |
| User timeline | `user "alice@acme.org"` | Single user event history. |
| Users directory | `users` | User profile listing. |
| Formula | `formula count(a) / count(b)` | Ratios. Supports: count, unique, sum, avg. |
| Fields | `fields` | Available field names including dynamic properties. |
| Inspect | `inspect *` or `inspect signup` | Schema discovery with coverage %, types, samples. |

### Stages

| Stage | Syntax |
|-------|--------|
| Filter | `\| where field = "value"` |
| Operators | `=`, `!=`, `>`, `<`, `>=`, `<=`, `contains`, `not contains`, `~` (regex), `!~`, `in ("a","b")`, `not in`, `exists`, `not exists` |
| Boolean | `\| where (a = "x" or b = "y") and c = "z"` — nested parentheses supported |
| Time range | `\| last 7d` / `\| last 12w` / `\| from 2026-01-01 to 2026-02-01` / `\| today` / `\| yesterday` / `\| this week` / `\| this month` / `\| this quarter` / `\| this year` |
| Aggregation | `\| count`, `\| unique distinct_id`, `\| sum field`, `\| avg field`, `\| min field`, `\| max field`, `\| median field`, `\| p90 field`, `\| p95 field`, `\| p99 field` |
| Latest value | `\| latest event_properties.theme [per distinct_id]` — one latest value per entity; aggregate with `count by last_value` |
| Group by | `\| count by day`, `\| count by week, _browser` — granularities: hour, day, week, month, quarter |
| List | `\| list` — raw event rows |
| Sort | `\| sort field desc` |
| Limit | `\| limit 100`, `\| top 20` (top = sort desc + limit) |
| Window | `\| window 7d` — for funnel/paths (default 1h) |
| Depth | `\| depth 8` — for paths |
| By | `\| by _path` — relabel path nodes by field instead of event_type |

### Fields

**Core**: `event_type`, `user_id`, `distinct_id`, `device_id`, `session_id`, `time`, `insert_id`

**Page/Content**: `_url`, `_path`, `_path_clean` (ID-normalized: `/users/{id}/settings`), `_hostname`, `_title`

**Referrer**: `_referrer`, `_referrer_domain`

**Device**: `_browser`, `_browser_version`, `_os`, `_os_version`, `_platform`, `_device_type`

**Geography**: `_country`, `_city`, `_region`, `_continent`, `_timezone` (short aliases). Full: `_geo_country`, `_geo_region`, `_geo_region_code`, `_geo_city`, `_geo_continent`, `_geo_timezone`, `_geo_metro_code`, `_geo_postal_code`, `_geo_latitude`, `_geo_longitude`

**Other system**: `_ip`, `_ua`, `_library`, `_ingest_origin`

**Custom properties**: `event_properties.KEY`, `user_properties.KEY`

**User profile** (from identify): `user.email`, `user.email_domain`, `user.plan`, `user.first_seen`, `user.last_seen`, `user.KEY`

**Session** (35 fields): `session.start_time`, `session.end_time`, `session.duration`, `session.event_count`, `session.landing_url`, `session.landing_path`, `session.landing_path_clean`, `session.landing_hostname`, `session.exit_url`, `session.exit_path`, `session.exit_path_clean`, `session.referrer`, `session.referring_domain`, `session.utm_source`, `session.utm_medium`, `session.utm_campaign`, `session.utm_term`, `session.utm_content`, `session.gclid`, `session.fbclid`, `session.language`, `session.timezone`, `session.ingest_origin`, `session.country`, `session.city`, `session.region`, `session.continent`, plus full `session.geo_*` variants

**Latest stitched session**: `user_last_session.KEY` — same key space as `session.*`, resolves to each user's most recent session

**Identity note**: `distinct_id = coalesce(user_id, mapped_user_id, device_id)`. Use `unique distinct_id` for user-level uniques.

**Latest event-derived state**: use `latest <field>` on an event source when a value is represented by setter/change events. Default entity is stitched `distinct_id`; override with `per event_properties.account_id` or another entity field. Latest aggregate rows use `last_value`; latest list rows return `entity`, `last_value`, `set_at`. Without an explicit time range, latest uses the bounded event default window.

Prefer user profile properties for durable current state when you control instrumentation:

```
users | count by user.theme
```

### Examples

Replace placeholder event names with your own. Run `inspect * | last 30d` first to discover them.

**Discovery**
```
inspect * | last 30d
inspect signup | last 7d
* | last 30d | count by event_type | top 20
fields | last 7d
```

**Counts & trends**
```
signup | last 7d | count
signup | last 30d | count by day
signup | last 90d | unique distinct_id by week
page_view | where _platform = "web" | last 30d | count
* | last 24h | count by event_type
```

**Funnels**
```
funnel signup -> activate -> purchase | last 30d
funnel signup -> activate -> purchase exclude support_ticket | window 7d
funnel signup -> activate -> purchase | last 30d | by _platform
```

**Retention**
```
retention signup | last 90d
retention signup returning core_usage | last 90d
```

**Paths**
```
paths from signup | window 7d | last 30d | depth 8
paths from page_view | last 30d | by _path
paths from page_view | last 30d | by _path_clean
```

**Sessions & attribution**
```
sessions | where session.utm_source = "google" | last 30d | count by day
sessions | last 30d | count by session.utm_source
sessions | last 30d | count by session.referring_domain | top 10
sessions | last 7d | count by session.landing_path | top 20
```

**Lifecycle & stickiness**
```
lifecycle page_view | last 12w | by week
stickiness page_view | last 30d
```

**Users & B2B**
```
users | where email_domain = "acme.org" | list
user "alice@acme.org" | last 90d | list
* | where user.email_domain = "acme.org" | last 30d | count by event_type
* | where user.plan = "enterprise" | last 12w | count by week
```

**Latest event-derived state**
```
themeSwitch | latest event_properties.theme | count by last_value | top 10
themeSwitch | last 30d | latest event_properties.theme | count by last_value
themeSwitch | latest event_properties.theme | list
themeSwitch | latest event_properties.theme per event_properties.account_id | count by last_value
purchase | latest event_properties.amount | avg last_value
```

**Pages & content**
```
page_view | last 7d | count by _path | top 20
page_view | last 30d | count by _path_clean | top 20
page_view | where _path = "/pricing" | last 30d | count by day
page_view | last 7d | count by _country | top 10
```

**Formulas**
```
formula count(purchase) / count(signup) | last 30d
```

**Advanced**
```
purchase | where user_last_session.region = "DE" | last 30d | sum event_properties.amount
"landing:cta_click" | last 7d | count
```

---

## Building a Custom Client

Only needed for languages without an official SDK (Go, Python, TypeScript, and browser are covered).

### Safety Requirements

- **`track()` must be non-blocking.** Buffer events in memory, send asynchronously via background thread/goroutine/worker. Never make HTTP calls on the caller's thread.
- **Bounded queue.** Cap at ~10,000 events. When full, drop events rather than blocking. Report via optional `on_error` callback.
- **Graceful shutdown.** `close()` flushes remaining events with a timeout (~10s). Idempotent.
- **Error isolation.** All HTTP/network errors caught internally. Never let analytics errors propagate.
- **Thread-safe.** Safe for concurrent use from multiple threads/goroutines/tasks.

### Batching & Retry

- Queue events, flush as `{ "events": [...] }` at **10 events** or every **2 seconds**.
- Retry 429 and 5xx with exponential backoff (1s, 2s, 4s), max 3 attempts. Drop after max retries.
- Do NOT retry 4xx (except 429).

### Checklist

1. `track(event_type, props?, user_props?)` — non-blocking, enqueues and returns immediately
2. `identify(user_id, user_props?, user_prop_ops?)` — rejects empty user_id
3. `flush()` — blocks until queue drained
4. `close()` — flush + stop background worker, idempotent
5. Auto-generate `insert_id` (UUID/random hex) for deduplication
6. Auto-set `time` to current ISO 8601 UTC
7. Auto-set `library` field (e.g. `wirelog-ruby/0.1.0`)
8. Config via constructor AND env vars (`WIRELOG_API_KEY`, `WIRELOG_HOST`)
9. `disabled` mode for test environments (track = no-op)
10. Optional `on_error` callback for background errors
11. For browser clients: persist device_id (localStorage), manage session_id (30-min timeout), set `clientOriginated: true`, use sendBeacon on page unload
