# Operator guide

The console is read-only. It polls one sensor snapshot and does not change
sensor configuration, policy, episodes, or evidence.

## Navigation

| Route | Contents |
|---|---|
| `/` | Health chips, counters, derived rates, charts, and compact lists |
| `/episodes` | Full active-episode table |
| `/evidence` | Full recent-evidence table |
| `/rules` | Full current-policy table |

The overview shows at most eight rows in each compact list. Use **View all** to
open the complete snapshot returned by the sensor.

## Header and readiness

The header reports the sensor ID, policy revision, age of the last successful
fetch, data mode, poll interval, and current synchronization state.

| Display | Meaning |
|---|---|
| Sensor state or `ready` | The latest snapshot is operational |
| `degraded` / `not ready` | The sensor responded but reports readiness reasons or source errors |
| `connection lost` | No usable snapshot was loaded and the request failed |
| `invalid data` | `/api/state` responded, but its JSON failed contract validation |
| `poll error` | A later poll failed; the previous valid snapshot remains displayed |
| `sync…` | A poll is currently in progress |

Hover or focus the readiness badge to see all reported reasons. A warning
banner also combines `operational.reasons` with capture-source `last_error`
values when the sensor is not ready.

Connection failures and invalid payloads are different problems. For invalid
data, compare sensor and console versions against the
[`GET /api/state` contract](./api/ops-state.md).

## Overview health and metrics

Health chips summarize journal health, notifier counters, and each capture
source. Metric cards show sensor totals, queue utilization, and drop counters.

Rates appear after two suitable successful samples. They are computed as:

```text
(current counter - previous counter) / elapsed seconds
```

The console retains up to 90 totals samples while it is open. Windows shorter
than the larger of 250 ms or half the configured poll interval are combined
with a later sample. A counter decrease produces a zero rate for that series,
which avoids a misleading negative spike after sensor restart. History is kept
when navigating between console pages, but not across a page reload.

## Tables

On full list pages:

- type in the search box to filter all displayed column values;
- select a severity facet for episodes or an event-type facet for evidence;
- click a sortable heading to cycle ascending, descending, and unsorted;
- use Enter or Space on a focused heading for keyboard sorting.

Episodes initially sort by latest observation descending. Evidence initially
sorts by sequence descending. Rules initially sort by ID ascending.

Episode and evidence lists switch to virtual scrolling above 12 visible rows
and return to a regular table at 8 or fewer rows. Rules always use a regular
table. This is a rendering optimization and does not change filtering or
sorting.

## Truncated snapshots

A truncation notice means the sensor set `active_episodes_truncated` or
`recent_events_truncated`. The console can only search, sort, and count the
rows present in that snapshot; it cannot retrieve omitted records. Investigate
the sensor's retention or response limits if the full set is required.

## Troubleshooting

1. Check the header mode. Use `mock` to verify the UI independently of a
   sensor.
2. For `connection lost`, confirm the listener and reverse proxy are reachable
   at `/api/state`.
3. For `invalid data`, inspect the response against the contract and ensure
   the console is paired with a compatible sensor release.
4. For `not ready`, use the banner and readiness tooltip to identify source or
   sensor reasons.
5. For a stale `poll error`, remember that displayed values are from the last
   successful fetch; use the age indicator to judge staleness.
