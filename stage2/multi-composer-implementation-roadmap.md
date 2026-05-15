# Multi-Composer Implementation Roadmap

## Problems this enhancement is solving

The current Composer launch and reuse model creates several user-facing problems:

- Launch Composer and portal edit actions often treat Composer as a single target for the whole user session, even though users may need multiple simultaneous editing workspaces.
- Users cannot intentionally keep one asset open for reference in one Composer window while actively editing a different asset in another Composer window.
- Hidden, stale, or unreachable Composer windows can leave the user stuck in a confusing state because the system only knows that some Composer is open.

This enhancement is intended to solve those problems by introducing explicit Composer-window routing, explicit in-window tab behavior, and clear ownership rules for editable assets.

## Purpose

This document records a roadmap for supporting multiple editable Composer windows for the same logged-in user session.

It is intended to answer:

- whether the current codebase is structurally limited to one editable Composer per user session
- which parts of the system already support multiple live Composer websocket clients
- which parts still collapse the model to a single Composer target
- what implementation phases are needed to move from single-target routing to multi-composer routing
- which risks should be investigated before behavior changes are enabled

This is a roadmap document only. It does not propose shipping behavior changes without follow-up implementation and validation.

## Current Conclusion

The current codebase does not appear to be fundamentally limited to one editable Composer runtime per logged-in user.

The deeper editing/runtime model already supports:

- multiple websocket sessions
- multiple runtime sheets
- per-runtime command dispatch state
- multiple tabs inside a Composer window

The main structural limitation today is that portal-side Composer discovery and routing still treat Composer as a boolean or a single target per HTTP session.

In other words:

- the engine and runtime layers look multi-instance capable
- the portal and routing layers still behave as single-instance selectors

## Key Current Behavior

### 1. Composer-open detection is boolean

The portal-side API only answers whether some Composer is open for the HTTP session:

- [PortalController.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\portal\controller\PortalController.java:189)
- [open-composer.service.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\common\services\open-composer.service.ts:1)

This is the first place that will need to change. A boolean cannot represent:

- zero composers
- one composer
- several composers
- stale or hidden composers
- a preferred target composer

### 2. Multiple Composer websocket clients are already tracked

The backend already records multiple Composer websocket session ids per HTTP session:

- [ComposerClientService.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\viewsheet\service\ComposerClientService.java:1)
- [ComposerClientController.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\viewsheet\controller\ComposerClientController.java:1)

This is an important signal: the backend already knows that one HTTP session may own multiple Composer websocket clients.

The limiting behavior is not the registry itself. The limiting behavior is that callers only ask for the first session id via `getFirstSimpSessionId(...)`.

### 3. Portal edit/open actions route to the first Composer websocket

The central routing bottleneck is here:

- [ComposerController.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\viewsheet\controller\ComposerController.java:53)
- [ComposerController.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\viewsheet\controller\ComposerController.java:86)
- [ComposerController.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\viewsheet\controller\ComposerController.java:122)

These handlers currently:

- resolve the HTTP session id
- ask `ComposerClientService.getFirstSimpSessionId(httpSessionId)`
- send the open/edit command to that one websocket session

That means the current structural model is not “only one Composer can exist.”
It is “portal actions only know how to target one Composer.”

### 4. Composer windows themselves already act like independent clients

Each Composer window opens its own websocket connection and subscribes to its own Composer command topic:

- [composer-client.service.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\composer\gui\composer-client.service.ts:1)
- [composer-main.component.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\composer\gui\composer-main.component.ts:2777)

This supports the conclusion that multiple editable Composer windows are not blocked at the connection model.

It also matters that a single Composer window is already a multi-asset editing client, not a single-asset editor.

### 5. Runtime state is already keyed per websocket session and runtime id

Command dispatch state is maintained per STOMP session id and per runtime id:

- [CommandDispatcher.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\viewsheet\service\CommandDispatcher.java:68)
- [CommandDispatcher.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\viewsheet\service\CommandDispatcher.java:461)
- [RuntimeViewsheetRef.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\viewsheet\model\RuntimeViewsheetRef.java:1)

This is another sign that the editing/runtime path is already more granular than the current portal discovery path.

### 6. Composer windows already support multiple open assets internally

The main Composer UI already manages multiple open tabs and sheets within a single Composer window:

- [composer-main.component.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\composer\gui\composer-main.component.ts:262)
- [composer-main.component.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\composer\gui\composer-main.component.ts:305)
- [composer-main.component.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\composer\gui\composer-main.component.ts:474)

This means the registry and routing model must not assume one Composer window maps to one asset. The correct mental model is:

- one user session may have many Composer windows
- one Composer window may have many open assets
- one Composer window has one currently focused asset tab

That does not solve the multi-window question by itself, but it does show the product already tolerates multiple editable assets in one editing client.

## Primary Code Targets

### Backend routing and registry

- [ComposerClientService.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\viewsheet\service\ComposerClientService.java:1)
- [ComposerClientController.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\viewsheet\controller\ComposerClientController.java:1)
- [PortalController.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\portal\controller\PortalController.java:189)
- [ComposerController.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\viewsheet\controller\ComposerController.java:53)

### Composer lifecycle and cleanup

- [RuntimeViewsheetManager.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\viewsheet\service\RuntimeViewsheetManager.java:1)
- [ComposerDisconnectListener.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\composer\ComposerDisconnectListener.java:1)
- [SessionConnectionService.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\messaging\SessionConnectionService.java:205)

### Composer window command consumption

- [composer-client.service.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\composer\gui\composer-client.service.ts:1)
- [composer-main.component.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\composer\gui\composer-main.component.ts:2777)

### Portal action entry points

- [app.component.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\app.component.ts:401)
- [report-tab.component.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\report\report-tab.component.ts:353)
- [data-browser.service.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\data\data-folder-browser\data-browser.service.ts:56)
- [data-datasource-browser.component.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\data\data-datasource-browser\data-datasource-browser.component.ts:834)
- [data-sources-tree-view.component.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\data\data-navigation-tree\data-sources-tree-view.component.ts:2584)
- [viewer-app.component.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\vsobjects\viewer-app.component.ts:1371)

### Existing open flows worth reviewing during implementation

- [OpenWorksheetController.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\composer\ws\OpenWorksheetController.java:1)
- [ComposerViewsheetController.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\composer\vs\controller\ComposerViewsheetController.java:1)

## Roadmap Phases

## Phase 0: Product decisions

The following product rules are now part of the roadmap baseline.

### Confirmed decisions

- More than one editable Composer window is officially supported for one logged-in user session.
- The same asset must not be editable in two Composer windows at the same time for the same user session.
- If a worksheet or dashboard is opened again while it is already open in another Composer window, the existing Composer window editing that asset should be shown and focused instead of opening a new window.

These decisions simplify routing, reduce user confusion, and avoid creating same-user edit conflicts by design.

### Same-asset single-editor constraint

The same worksheet or dashboard must not be opened in two editable Composer windows for the same user session.

Required behavior:

- if the asset is already open in any tab of any Composer window, route to and focus that Composer window and select the existing asset tab
- do not open a second editable copy of that asset as an escape hatch
- explicit inside-Composer move behavior may transfer the asset to another Composer window, but must not leave duplicate editable copies behind

Implementation consequence:

The Composer registry must be able to answer at least these questions reliably:

- which Composer window currently has a given asset open among its tabs
- whether that Composer window is still live and reachable
- which asset tab is currently focused in that Composer window
- how to focus that Composer window and select the existing asset tab

This is not only a UX decision. It affects registry metadata, routing rules, and liveness detection.

### Portal and viewer routing

Portal and viewer requests should follow a two-step model:

1. window routing
2. tab routing

At a high level:

- first determine whether the target asset is already open in any Composer window
- if it is already open, route to that Composer window and focus the existing asset tab
- if it is not already open, choose a destination Composer window using the default window routing matrix below
- once a destination window is chosen, inside that window the request should resolve as `focus existing tab if present` or `open a new tab if absent`

This section defines the routing model.
The matrix below defines the default action-by-action window-selection policy.

#### Default window routing matrix

Use the following routing matrix as the default behavior unless a future requirement explicitly overrides it.

| Action | Preferred behavior | Fallback behavior |
|---|---|---|
| `Launch Composer` | If no Composer is open, open a new empty Composer. If one or more Composer windows are already open, show a lightweight chooser listing the available Composer windows and an `Open New Composer` option. | If registry data is stale or unavailable, open a new Composer. |
| `New Worksheet` | If exactly one idle or compatible Composer target exists, reuse it. If multiple plausible targets exist, show a chooser. Always offer `Open in New Composer`. | If no Composer is open, open a new Composer in worksheet-creation mode. |
| `New Viewsheet` | If exactly one idle or compatible Composer target exists, reuse it. If multiple plausible targets exist, show a chooser. Always offer `Open in New Composer`. | If no Composer is open, open a new Composer in viewsheet-creation mode. |
| `Edit Worksheet` | If that worksheet is already open in any Composer window, focus that Composer and select the existing asset tab. Otherwise, if exactly one compatible Composer target exists, reuse it. If multiple plausible targets exist, show a chooser. | If no Composer is open, open a new Composer with that worksheet. |
| `Edit Dashboard` | If that dashboard is already open in any Composer window, focus that Composer and select the existing asset tab. Otherwise, if exactly one compatible Composer target exists, reuse it. If multiple plausible targets exist, show a chooser. | If no Composer is open, open a new Composer with that dashboard. |
| `Create Query` | If exactly one worksheet-capable Composer target exists, reuse it. If multiple plausible targets exist, show a chooser. Always offer `Open in New Composer`. | If no Composer is open, open a new Composer in query or worksheet flow. |
| Viewer-side `Edit Viewsheet` | If that dashboard is already open in any Composer window, focus that Composer and select the existing asset tab. Otherwise follow the same rules as portal `Edit Dashboard`. | If no Composer is open, open a new Composer with that dashboard. |

#### Routing notes

- `Launch Composer` is a workspace-selection action, so it should not silently hijack an arbitrary already-open Composer window.
- Asset edit actions should strongly prefer routing to the Composer window that already has that same asset open, even if that Composer also has other assets open in separate tabs.
- When more than one possible target remains after same-asset matching, the system should prefer an explicit chooser over a silent best guess.
- `Open New Composer` should remain available as an escape hatch for creation flows, but not for opening an asset that is already being edited in another Composer window.

These decisions control the backend registry shape, the portal routing API, and the eventual ambiguity UX.

### inside-composer routing

#### Inside-Composer tab behavior

Inside Composer, an asset-open request should normally behave like `select existing tab or open a new tab`, not `replace the current asset`.

Use this rule set:

- If the requested asset is already open in the current Composer window, focus that existing tab.
- If the requested asset is not open in the current Composer window, open it as a new tab in that Composer window.
- Do not replace the currently focused asset just because a new asset-open request is routed into that Composer window.
- If the same asset is already open in a different Composer window, the request should route to that other Composer window instead of creating a duplicate editable tab locally.

#### Inside-Composer move behavior

A separate workflow should be recognized inside Composer itself:

- a user may already have multiple assets open in one Composer window
- the user may decide that one of those assets should be moved into a different Composer window for side-by-side work

That is not the same as an ordinary asset-open request from portal.

Use this rule set:

- `Open` from portal or viewer should follow the normal portal and viewer routing rules above.
- `Move to New Composer` from inside Composer should be treated as an explicit relocation action initiated by the user.
- When `Move to New Composer` is used, the target asset should open in a new Composer window and the original tab in the current Composer window should close after the new window successfully takes ownership.
- Ownership transfer should preserve the same single-editor rule: after the move completes, only one editable Composer window should still contain that asset.
- If the move fails, the original tab should remain in place and editable.
- A future `Move to Another Composer` action could also be supported, but it should still transfer ownership rather than duplicate the editable asset.

This gives users an intentional escape hatch for reorganizing work across Composer windows without weakening the rule that the same asset should not be editable in two Composer windows at once.

## Phase 1: Replace boolean discovery with a Composer session registry

Goal:

Move from `is composer open` to `which composer clients are available`.

Implementation direction:

- extend the Composer client registry so it can return all Composer websocket clients for an HTTP session instead of only the first one
- add metadata needed for routing decisions
- provide a backend API that returns a list of live Composer sessions rather than a boolean

Required registry metadata for routing:

- composer client id or websocket session id
- HTTP session id
- last-seen timestamp or equivalent liveness marker
- whether the Composer is reachable
- open asset ids with asset types for that Composer window
- focused asset id
- focused asset type

Required registry metadata for chooser display:

- focused tab label or another human-readable label for the currently focused asset
- a human-readable Composer window label if the product wants to distinguish windows beyond asset names

Likely code targets:

- [ComposerClientService.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\viewsheet\service\ComposerClientService.java:1)
- [PortalController.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\portal\controller\PortalController.java:189)
- [open-composer.service.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\common\services\open-composer.service.ts:1)

## Phase 2: Introduce explicit routing instead of first-session routing

Goal:

Allow portal-side actions to target a chosen Composer client instead of always selecting the first one.

Implementation direction:

- replace `getFirstSimpSessionId(...)` usage in portal edit/open routing
- add a routing policy abstraction for Composer-targeted actions
- make server-side handlers accept either an explicit target Composer id or a policy result

Possible routing policies:

- reuse the Composer already editing the same asset
- reuse the most recently active compatible Composer
- if ambiguous, let the client ask the user
- if no target is selected, open a new Composer window

Likely code targets:

- [ComposerController.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\viewsheet\controller\ComposerController.java:53)
- [ComposerController.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\viewsheet\controller\ComposerController.java:86)
- [ComposerController.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\viewsheet\controller\ComposerController.java:122)

## Phase 3: Add Composer identity and heartbeat metadata from the client

Goal:

Make each Composer window identifiable and observable enough for routing.

Implementation direction:

- have each Composer client register itself with stable metadata when it subscribes
- optionally report focused asset and active mode changes
- keep a heartbeat or last-active marker so hidden, stale, or dead sessions can be filtered

This phase is especially helpful for solving both problems at once:

- hidden but technically open Composer windows
- multiple live Composer windows with ambiguous routing

Likely code targets:

- [ComposerClientController.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\viewsheet\controller\ComposerClientController.java:1)
- [ComposerClientService.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\viewsheet\service\ComposerClientService.java:1)
- [composer-client.service.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\composer\gui\composer-client.service.ts:1)
- [composer-main.component.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\composer\gui\composer-main.component.ts:2777)

## Phase 4: Update portal entry points to use routing decisions

Goal:

Make every Composer launch/edit action follow the same target-selection model.

Actions that need consistent treatment:

- `Launch Composer`
- `New Worksheet`
- `New Viewsheet`
- `Edit Worksheet`
- `Edit Dashboard`
- `Create Query`
- viewer-side `Edit Viewsheet`

Likely code targets:

- [app.component.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\app.component.ts:401)
- [report-tab.component.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\report\report-tab.component.ts:353)
- [data-browser.service.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\data\data-folder-browser\data-browser.service.ts:56)
- [data-datasource-browser.component.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\data\data-datasource-browser\data-datasource-browser.component.ts:834)
- [data-sources-tree-view.component.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\data\data-navigation-tree\data-sources-tree-view.component.ts:2584)
- [viewer-app.component.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\vsobjects\viewer-app.component.ts:1371)

## Phase 5: Define ambiguity UX

Goal:

Make target selection understandable when more than one Composer is open.

Roadmap rule:

- if exactly one obvious target exists, route automatically
- if the same asset is already open anywhere, focus that Composer and do not offer a duplicate editable open
- if multiple candidates remain after same-asset matching, show a picker
- creation flows should offer `Open in New Composer`
- if the chosen target is stale or unreachable, fall back gracefully

Important distinction:

- `Launch Composer` is a workspace-selection action
- `Edit Worksheet` or `Edit Dashboard` is an asset-targeting action

Those two actions should share the same registry and routing infrastructure, but not necessarily the same default target choice.

## Phase 6: Review lifecycle and cleanup assumptions

Goal:

Ensure multi-window support does not create cross-window cleanup bugs.

The most important lifecycle area to review is:

- [RuntimeViewsheetManager.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\viewsheet\service\RuntimeViewsheetManager.java:1)
- [ComposerDisconnectListener.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\composer\ComposerDisconnectListener.java:1)

Why this matters:

- `RuntimeViewsheetManager` is websocket-scoped
- reconnect debounce keys are based on principal session id
- that coupling may be correct for reconnect protection, but it should be verified under two simultaneous Composer windows owned by the same user session

Validated findings:

### Finding 1

One Composer window disconnecting does not appear to immediately close another still-open Composer window's runtime sheets.

Evidence:

- `RuntimeViewsheetManager` is websocket-scoped and keeps its own `openSheets` set per websocket-scoped bean:
  - [RuntimeViewsheetManager.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\viewsheet\service\RuntimeViewsheetManager.java:39)
- viewsheet and worksheet open flows register runtime ids into that websocket-scoped manager:
  - [ComposerViewsheetController.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\composer\vs\controller\ComposerViewsheetController.java:128)
  - [OpenWorksheetController.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\composer\ws\OpenWorksheetController.java:139)
- explicit close flows remove runtime ids from that same manager:
  - [ComposerViewsheetController.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\composer\vs\controller\ComposerViewsheetController.java:278)
  - [CloseWorksheetController.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\composer\ws\CloseWorksheetController.java:54)
- command-dispatch cleanup is also isolated per websocket session id:
  - [CommandDispatcherSessionCleanup.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\viewsheet\service\CommandDispatcherSessionCleanup.java:27)

Conclusion:

- immediate wrong-window cleanup does not look like the main risk
- per-websocket runtime ownership is already present

### Finding 2

Reconnect cancellation is too coarse for same-session multi-window support.

Evidence:

- delayed cleanup is scheduled on disconnect using a debounce key derived only from the principal session id:
  - [RuntimeViewsheetManager.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\viewsheet\service\RuntimeViewsheetManager.java:62)
  - [RuntimeViewsheetManager.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\viewsheet\service\RuntimeViewsheetManager.java:95)
  - [RuntimeViewsheetManager.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\viewsheet\service\RuntimeViewsheetManager.java:99)
- any reconnect from that same logged-in session cancels the pending cleanup using the same coarse key:
  - [ComposerDisconnectListener.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\composer\ComposerDisconnectListener.java:46)
  - [RuntimeViewsheetManager.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\viewsheet\service\RuntimeViewsheetManager.java:68)

Why this is a real issue:

- if Composer window A disconnects, its runtime cleanup is delayed for one minute
- if Composer window B, owned by the same logged-in session, connects or reconnects before that timer fires, B cancels A's pending cleanup because both windows share the same debounce key
- that means cleanup protection is currently scoped to the user session, not to the specific Composer websocket session

Conclusion:

- this is a real structural issue for multi-composer support
- the reconnect protection should likely be keyed by websocket session identity, or by a richer Composer client identity, instead of only the principal session id

### Finding 3

There is still a stale Composer registry risk if a Composer window closes unexpectedly.

Evidence:

- Composer client routing state is stored in a static map keyed by HTTP session id:
  - [ComposerClientService.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\viewsheet\service\ComposerClientService.java:79)
- normal removal happens in two ways:
  - explicit client-side `/leave` during normal disconnect:
    - [composer-client.service.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\composer\gui\composer-client.service.ts:68)
    - [ComposerController.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\viewsheet\controller\ComposerController.java:157)
  - bean destruction through `@PreDestroy` on the websocket-scoped service:
    - [ComposerClientService.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\viewsheet\service\ComposerClientService.java:44)
- unlike command-dispatch state, there is no dedicated `SessionDisconnectEvent` cleanup listener for the Composer client registry

Conclusion:

- the code has cleanup paths, so stale entries are not guaranteed
- but the registry is still weaker than the command-dispatch cleanup path because it lacks a direct event-driven disconnect fallback
- for multi-composer support, this should be treated as a real risk until the registry has explicit disconnect cleanup or liveness validation

### Finding 4

The current Composer registry is too thin for safe multi-window routing even when cleanup works.

Evidence:

- `ComposerClientService` stores only a list of websocket session ids per HTTP session:
  - [ComposerClientService.java](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\core\src\main\java\inetsoft\web\viewsheet\service\ComposerClientService.java:79)
- it does not record:
  - focused asset id
  - asset type
  - focused tab
  - last-seen timestamp
  - reachability state

Conclusion:

- even if cleanup were perfect, the current registry cannot answer the questions needed for safe same-asset routing and chooser UX
- phase 1 and phase 3 remain necessary, not optional


## Suggested First Shipping Slice

A conservative first implementation slice would be:

1. replace boolean Composer discovery with session list discovery
2. record enough metadata to identify a live Composer window and its currently open assets
3. enforce same-asset single-editor routing so repeated opens focus the existing editor tab inside the owning Composer window
4. let `Launch Composer` show a chooser when Composer windows already exist and still offer `Open New Composer`
5. keep asset edit actions reusing a single obvious target automatically
6. use a chooser only when multiple live targets remain and no target is clearly preferred

This slice solves the biggest architectural issue without requiring a full redesign of broader creation-flow preferences on day one.

## Risks

### Routing risk

If routing remains based on `first session`, multi-composer support will feel random and unreliable.

### Lifecycle risk

If disconnect and reconnect handling are still effectively session-global, one Composer window may interfere with another window owned by the same login session.

### Stale-session risk

A composer registry without heartbeat or cleanup discipline will eventually misroute to dead tabs.

### Same-asset conflict risk

If the same asset can be edited in two windows, save and refresh behavior must be validated carefully.

### UX risk

Even if the backend supports multiple Composer windows, users will still feel the feature is broken if portal actions open the wrong window without explanation.

## Testing Plan

### Backend validation

- verify multiple Composer websocket clients can register under one HTTP session
- verify registry cleanup when a Composer window closes normally
- verify registry cleanup when a Composer window disappears unexpectedly
- verify routing can target a specific Composer client instead of the first one

### Frontend validation

- open two Composer windows from the same login session
- edit a worksheet from portal and confirm target behavior is deterministic
- edit a dashboard from portal and confirm target behavior is deterministic
- use viewer-side edit and confirm it follows the same routing policy
- confirm `Launch Composer` can still open a new window when desired

### Lifecycle validation

- close one Composer window while another remains open
- reload one Composer window while another remains open
- lose websocket connectivity in one window and confirm the other continues normally
- verify runtime cleanup only affects the intended window and asset

### Same-asset validation

- open the same worksheet twice if policy allows it
- open the same dashboard twice if policy allows it
- confirm save, refresh, expired-sheet handling, and autosave behavior are acceptable

## Recommendation

Treat this as a routing-and-lifecycle project first, not an editor-engine rewrite.

The current code suggests that multi-composer support is mainly blocked by:

- session-to-first-composer routing
- lack of Composer identity metadata
- lack of ambiguity handling in portal UX
- lifecycle assumptions that should be reviewed under same-session multi-window use

That is a meaningful project, but it is smaller and more contained than a full structural rewrite of Composer editing internals.
















