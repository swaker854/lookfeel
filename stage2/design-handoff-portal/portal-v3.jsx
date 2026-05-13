const { useState, useMemo, useEffect, useRef } = React;

// ============================================================
// Naming glossary — read before adding new screens
// ============================================================
// "Workspace"   → the left-rail destination (designer landing page,
//                 view === 'workspace'). Canonical user-facing label,
//                 rendered by HomeView / EmptySystemHome / PartialHome.
//                 Formerly called "Home"; do NOT reintroduce that label
//                 in code or copy. Component names like HomeView are kept
//                 to avoid mass refactor; the canonical term is Workspace.
// "App Switcher"→ the top-header pill that swaps between Dashboard Portal,
//                 Composer, and Enterprise Manager (AppSwitcherMenu /
//                 onSwitchApp). NOT a workspace; different scope.
// "Work surface"→ the main content area inside a single view (e.g.
//                 EmptyDashboardsWorkSurface, ScheduleEmptyWorkSurface).
//                 Implementation term for "the right-hand panel"; never
//                 user-facing.
// "Repository"  → the dashboard tree in the Sidebar (folders + dashboards).
//                 The label "Repository" is what users see; in code it is
//                 MOCK_TREE / TreeRow / Sidebar.
// State keys: view ∈ 'workspace' | 'dashboards' | 'schedule' | 'data' |
// 'dashboard'. The 'workspace' key matches the user-facing label.
// ============================================================

// ============================================================
// Color tokens (StyleBI brand palette)
// ============================================================
const C = {
  // Surface tiers (shell-palette-spec)
  // canvas (lightest) → main page bg
  // bg / surfaceMuted (subtle, darker) → side areas, headers, toolbars, banners
  // surface (white) → raised cards, tables, inputs
  canvas: '#F8F7F4',
  bg: '#F1EFEA',
  surface: '#FFFFFF',
  surfaceMuted: '#F1EFEA',
  border: '#D9D5CC',
  borderStrong: '#C8C2B7',
  ink: '#1F1F1B',
  inkMuted: '#6A685F',
  inkSubtle: '#99958C',
  accent: '#E58A2A',
  accentSoft: '#F6E2C8',
  accentTint: '#FDF5ED',
  accentInk: '#C96F12',
  hover: '#ECE9E2',
  // railBg — legacy alias retained for compatibility; points at subtle so the
  // rail joins the chrome frame (was #F8F7F4, which created an awkward
  // lighter "cut-out" against the darker header/sidebar).
  railBg: '#F1EFEA',
  selected: '#E7E2D8',

  // Codebase support families ($shell-secondary / -third / -fourth in _variables.scss).
  // Constrained — never use as routine action colors. Reserved for identity + structural meaning.
  secondary: '#7455A8',          // violet — Dashboards identity
  secondarySoft: '#EDE8F5',
  secondaryText: '#3D2070',
  third: '#B54B6E',              // rose — Pinboard identity
  thirdSoft: '#F5DCEA',
  thirdText: '#6B1F3A',
  fourth: '#1D8A86',             // teal — Data identity
  fourthSoft: '#D5EDEC',
  fourthText: '#0F4E4C',

  // Codebase semantic families ($shell-success / -warning / -danger / -info)
  success: '#2E8B57',
  successSoft: '#E2F3E8',
  successText: '#1D5B39',
  warning: '#B7791F',            // mustard — also stands in as Schedule identity
  warningSoft: '#F8E8CC',
  warningText: '#7A4E10',
  danger: '#C84C4C',
  dangerSoft: '#F7DEDE',
  dangerText: '#7F2E2E',
  info: '#3E7FC4',               // denim — avatar, neutral info accents
  infoSoft: '#E4EFFA',
  infoText: '#1F548A',
};

// Map destination → identity color (rail, decorative icons inside that area).
// Pulled from codebase support families. Schedule shares $shell-warning until a
// fifth support family lands in _variables.scss.
const IDENTITY = {
  workspace:  { color: C.accent,    tint: C.accentTint },
  dashboards: { color: C.secondary, tint: C.secondarySoft },
  data:       { color: C.fourth,    tint: C.fourthSoft },
  schedule:   { color: C.warning,   tint: C.warningSoft },
  pinboard:   { color: C.third,     tint: C.thirdSoft },
};

// ============================================================
// Icons
// ============================================================
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.5 }) => {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  switch (name) {
    case 'home': return <svg {...props}><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>;
    case 'workspace': return <svg {...props}><path d="M4 7l8-4 8 4-8 4-8-4z"/><path d="M4 12l8 4 8-4"/><path d="M4 17l8 4 8-4"/></svg>;
    case 'tree': return <svg {...props}><circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="12" r="2"/><path d="M8 6h6a2 2 0 012 2v2"/><path d="M8 18h6a2 2 0 002-2v-2"/></svg>;
    case 'schedule': return <svg {...props}><circle cx="12" cy="13" r="7"/><path d="M12 10v3l2 2"/><path d="M9 3h6"/></svg>;
    case 'pinboard': return <svg {...props}><path d="M12 17v5"/><path d="M9 3h6l-1 6 3 3v2H7v-2l3-3-1-6z"/></svg>;
    case 'database': return <svg {...props}><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>;
    case 'worksheet': return <svg {...props}><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M7.5 7.5L11 16"/><path d="M16.5 7.5L13 16"/></svg>;
    case 'dashboard': return <svg {...props}><rect x="3" y="3" width="8" height="10" rx="1"/><rect x="13" y="3" width="8" height="6" rx="1"/><rect x="13" y="11" width="8" height="10" rx="1"/><rect x="3" y="15" width="8" height="6" rx="1"/></svg>;
    case 'folder': return <svg {...props}><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>;
    case 'search': return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>;
    case 'star': return <svg {...props}><path d="M12 3l2.6 5.8 6.4.6-4.8 4.4 1.4 6.2L12 17l-5.6 3 1.4-6.2L3 9.4l6.4-.6L12 3z"/></svg>;
    case 'star-fill': return <svg {...props} fill={color}><path d="M12 3l2.6 5.8 6.4.6-4.8 4.4 1.4 6.2L12 17l-5.6 3 1.4-6.2L3 9.4l6.4-.6L12 3z"/></svg>;
    case 'chevron': return <svg {...props}><path d="M9 6l6 6-6 6"/></svg>;
    case 'chevron-down': return <svg {...props}><path d="M6 9l6 6 6-6"/></svg>;
    case 'plus': return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
    case 'help': return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 4"/><circle cx="12" cy="17" r=".5" fill={color}/></svg>;
    case 'ai': return <svg {...props}><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'panel-left': return <svg {...props}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></svg>;
    case 'arrow-right': return <svg {...props}><path d="M5 12h14M13 5l7 7-7 7"/></svg>;
    case 'lock': return <svg {...props}><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>;
    case 'edit': return <svg {...props}><path d="M14 4l6 6L8 22H2v-6L14 4z"/></svg>;
    case 'list': return <svg {...props}><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1" fill={color}/><circle cx="4" cy="12" r="1" fill={color}/><circle cx="4" cy="18" r="1" fill={color}/></svg>;
    case 'data': return <svg {...props}><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>;
    case 'share': return <svg {...props}><circle cx="6" cy="12" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M8.5 10.5l7-3M8.5 13.5l7 3"/></svg>;
    case 'refresh': return <svg {...props}><path d="M3 12a9 9 0 0115-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 01-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>;
    case 'export': return <svg {...props}><path d="M12 3v12"/><path d="M7 8l5-5 5 5"/><path d="M5 21h14"/></svg>;
    case 'close': return <svg {...props}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case 'more': return <svg {...props}><circle cx="6" cy="12" r="1.4" fill={color}/><circle cx="12" cy="12" r="1.4" fill={color}/><circle cx="18" cy="12" r="1.4" fill={color}/></svg>;
    default: return null;
  }
};

// ============================================================
// Mock data
// ============================================================
const MOCK_TREE = [
  { id: 'my', name: 'My Dashboards', type: 'folder', count: 8, owner: 'You',
    children: [
      { id: 'my-q4', name: 'Q4 Review', type: 'dashboard', starred: true },
      { id: 'my-pipeline', name: 'Pipeline Health', type: 'dashboard', starred: true },
      { id: 'my-drafts', name: 'Drafts', type: 'folder', count: 3, children: [] },
    ] },
  { id: 'examples', name: 'Examples', type: 'folder', count: 24, owner: 'StyleBI',
    children: [
      { id: 'ex-charts', name: 'Chart Gallery', type: 'folder', count: 18, children: [] },
      { id: 'ex-tutorial', name: 'Tutorial Dashboards', type: 'folder', count: 6, children: [] },
    ] },
  { id: 'shared', name: 'Shared with me', type: 'folder', count: 12, owner: 'Team',
    children: [
      { id: 'sh-sales', name: 'Sales Performance', type: 'dashboard', starred: true },
      { id: 'sh-ops', name: 'Operations Daily', type: 'dashboard' },
    ] },
  { id: 'dark', name: 'Dark Flat Examples', type: 'folder', count: 9, owner: 'Franky', children: [] },
  { id: 'area_flat', name: 'area_flat', type: 'dashboard' },
  { id: 'bar_flat_single', name: 'bar_flat_single', type: 'dashboard' },
  { id: 'boxplot', name: 'boxplot', type: 'dashboard', starred: true },
  { id: 'circle_packing_funnel', name: 'circle_packing_funnel', type: 'dashboard' },
  { id: 'donut_flat', name: 'donut_flat', type: 'dashboard', starred: true },
  { id: 'icicle', name: 'icicle', type: 'dashboard' },
  { id: 'line_flat', name: 'line_flat', type: 'dashboard' },
  { id: 'mekko', name: 'mekko', type: 'dashboard' },
  { id: 'orgTree', name: 'orgTree', type: 'dashboard' },
  { id: 'pareto_multi', name: 'pareto_multi', type: 'dashboard' },
  { id: 'radar', name: 'radar', type: 'dashboard' },
];

// Recently edited — designer's WIP. Powers Home (launch pad).
// Distinct from RECENT_VIEWED (Dashboards root) — different intent.
const RECENT_EDITED = [
  { id: 'd1', name: 'Q4 Executive Review', folder: 'My Dashboards', updated: 'Edited 2h ago' },
  { id: 'd3', name: 'Pipeline Health', folder: 'My Dashboards', updated: 'Edited yesterday' },
  { id: 'd5', name: 'Marketing Funnel', folder: 'My Dashboards', updated: 'Edited 3 days ago' },
  { id: 'd6', name: 'Customer Health (draft)', folder: 'My Dashboards', updated: 'Edited 5 days ago' },
];

// Recently viewed — consumption history. Powers Dashboards root.
const RECENT_VIEWED = [
  { id: 'd1', name: 'Q4 Executive Review', folder: 'My Dashboards', updated: 'Opened 2h ago' },
  { id: 'd2', name: 'Sales Performance', folder: 'Shared with me', updated: 'Opened yesterday' },
  { id: 'd3', name: 'Pipeline Health', folder: 'My Dashboards', updated: 'Opened 2 days ago' },
  { id: 'd4', name: 'Operations Daily', folder: 'Shared with me', updated: 'Opened 3 days ago' },
];

const RECENT_WORKSHEETS = [
  { id: 'w1', name: 'Sales rollup Q4', folder: 'My Worksheets', updated: '1h ago' },
  { id: 'w2', name: 'Customer cohorts', folder: 'My Worksheets', updated: 'Yesterday' },
  { id: 'w3', name: 'Pipeline source join', folder: 'Shared', updated: '4 days ago' },
];

const RECENT_DATASOURCES = [
  { id: 'ds1', name: 'Production Postgres', kind: 'PostgreSQL', updated: 'Connected' },
  { id: 'ds2', name: 'Salesforce', kind: 'API', updated: 'Connected' },
  { id: 'ds3', name: 'Customer CSV upload', kind: 'File', updated: 'Updated 2d ago' },
];

// Favorites — dashboards the user has marked with a star. Mixes a few
// curated examples in to fill the row for users with a sparse starred set.
// Distinct from "Pinboard" (a separate tab/destination) — favorites are
// just a lightweight bookmark on the dashboard itself.
const FAVORITES = [
  { id: 'f1', name: 'Q4 Executive Review', folder: 'My Dashboards' },
  { id: 'f2', name: 'Sales Performance',   folder: 'Shared with me' },
  { id: 'f3', name: 'Pipeline Health',     folder: 'My Dashboards' },
  { id: 'ex1', name: 'Marketing Funnel',   folder: 'Examples', isExample: true },
  { id: 'ex2', name: 'Customer Cohorts',   folder: 'Examples', isExample: true },
];

// Curated example dashboards — used as Recents fallback for new users
// who haven't opened anything yet. Marked isExample so the card can badge
// honestly ("Example") instead of pretending to be a real recent.
const EXAMPLE_DASHBOARDS = [
  { id: 'ex1', name: 'Sales Performance', folder: 'Examples', updated: 'Sample data', isExample: true },
  { id: 'ex2', name: 'Marketing Funnel',  folder: 'Examples', updated: 'Sample data', isExample: true },
  { id: 'ex3', name: 'Operations Daily',  folder: 'Examples', updated: 'Sample data', isExample: true },
  { id: 'ex4', name: 'Customer Cohorts',  folder: 'Examples', updated: 'Sample data', isExample: true },
];

// ============================================================
// Left rail — persistent destination nav
// ============================================================
const RailButton = ({ icon, label, active, onClick, identityKey = 'workspace' }) => {
  const id = IDENTITY[identityKey] || IDENTITY.workspace;
  return (
  <button
    onClick={onClick}
    title={label}
    style={{
      width: 40, height: 40,
      display: 'grid', placeItems: 'center',
      background: active ? id.tint : 'transparent',
      border: `1px solid transparent`,
      borderRadius: 9,
      cursor: 'pointer',
      position: 'relative',
      color: active ? id.color : C.inkMuted,
      transition: 'all 120ms ease',
    }}
    onMouseEnter={e => { 
      if (!active) {
        e.currentTarget.style.background = C.hover;
      }
    }}
    onMouseLeave={e => { 
      if (!active) {
        e.currentTarget.style.background = 'transparent';
      }
    }}
  >
    <Icon name={icon} size={18} color={active ? id.color : C.inkMuted} />
  </button>
  );
};

const LeftRail = ({ view, setView, isEmpty, showData, showHome }) => (
  <nav style={{
    width: 56,
    background: C.railBg,
    borderRight: `1px solid ${C.border}`,
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  }}>
    {/* InetSoft mark — solid-fill silhouette, intentionally weighted lighter
        than stroked rail icons to compensate for ink density. */}
    <div style={{
      width: 32, height: 32,
      display: 'grid', placeItems: 'center',
      marginBottom: 12,
    }} title="InetSoft">
      <svg width="28" height="28" viewBox="-0.5 -0.5 24 24" fill={C.inkSubtle} aria-label="InetSoft">
        <path d="M3.521,9.802c0,0,0.054-0.303,0.352-0.502c1.253-0.836,4.69-3.794,7.074-1.408c1.934,1.939,2.29,1.701,3.535,1.733c1.268,0.035,2.574-0.64,3.561-0.979c0.373-0.128,0.329-0.218,0.602-0.13c0.018,0.002-0.008,0.099-0.009,0.122c-0.01,0.275-0.487,0.875-2.583,1.962c0,0-0.005,0.958-0.005,0.995c0,0.035,0.824-0.267,1.29-0.503c0.171-0.087,0.364-0.046,0.364-0.017c0,0.087-0.024,0.279-0.223,0.503c-0.358,0.405-1.118,0.845-1.438,1.051c0,0,0.006,0.574,0.006,1.15c0,0.014,0.185-0.057,0.313-0.121c0.076-0.038,0.287-0.019,0.293,0.024c0.078,0.77-2.828,2.242-3.6,2.53c-1.901,0.705-3.213-0.076-3.502-0.39c-0.273-0.293-0.903-0.734-1.232-1.044c-1.566-1.461-3.779-0.748-4.873-0.441c-0.36,0.099-0.824,0.324-1.255,0.525c-0.244,0.113-0.368,0.14-0.69,0.015c0,0,0.115-0.313,0.311-0.468c0.151-0.117,0.434-0.298,0.53-0.355c1.111-0.691,2.655-1.934,4.741-1.905c1.34,0.019,1.977,1.53,3.724,2.416c0.898,0.453,1.94,0.211,1.94,0.211V13.86c0,0-1.188,0.122-1.916-0.41c-0.316-0.231-0.519-0.422-0.704-0.58c-1.403-1.176-1.935-1.66-2.95-1.667c-0.692-0.004-1.669,0.012-3.306,0.788c-0.816,0.39-0.926,0.444-1.311,0.286c0,0,0.143-0.429,0.511-0.604c0.09-0.044,0.668-0.463,0.901-0.616c1.036-0.665,2.399-1.582,3.771-1.503c0.636,0.037,1.354-0.141,2.964,1.539c1.15,1.197,2.046,1.059,2.046,1.059l-0.011-0.866c0,0-0.023-0.012-0.042-0.014c-0.725-0.061-1.34-0.78-2.362-1.641c-0.012-0.01-0.023-0.024-0.036-0.036c-2.129-1.94-4.247-0.588-5.603-0.016C3.796,9.956,3.521,9.802,3.521,9.802z"/>
        <ellipse cx="20.793" cy="8.171" rx="0.707" ry="0.783"/>
        <ellipse cx="14.363" cy="7.576" rx="1.884" ry="1.076"/>
      </svg>
    </div>

    {showHome && <RailButton icon="workspace" label="Workspace" active={view === 'workspace'} onClick={() => setView('workspace')} identityKey="workspace" />}
    <RailButton icon="dashboard" label="Dashboards" active={view === 'dashboards'} onClick={() => setView('dashboards')} identityKey="dashboards" />
    <RailButton icon="schedule" label="Schedule" active={view === 'schedule'} onClick={() => setView('schedule')} identityKey="schedule" />

    {showData && (
      <>
        <div style={{ width: 24, height: 1, background: C.border, margin: '8px 0 4px' }} />
        <RailButton icon="database" label="Data" active={view === 'data'} onClick={() => setView('data')} identityKey="data" />
      </>
    )}

    <div style={{ flex: 1 }} />

    <div style={{
      width: 30, height: 30, borderRadius: '50%',
      background: C.infoSoft,
      display: 'grid', placeItems: 'center',
      color: C.infoText, fontSize: 11, fontWeight: 600,
      marginTop: 6,
      cursor: 'pointer',
    }} title="Profile">JD</div>
  </nav>
);

// ============================================================
// Top header — global search + create menu + app switcher pill
// Naming note: "Workspace" is reserved for the left-rail destination (the
// designer landing page formerly called "Home"). The portal/composer/EM
// chooser below is the "App Switcher" — different scope, different name.
// ============================================================
const CreateMenu = ({ onSelect }) => {
  const items = [
    { id: 'dashboard', icon: 'dashboard', title: 'Dashboard', body: 'Charts, tables, KPIs' },
    { id: 'worksheet', icon: 'worksheet', title: 'Data worksheet', body: 'Transform & filter' },
    { id: 'data', icon: 'database', title: 'Data source', body: 'Connect a database or file' },
  ];
  return (
    <div style={{
      position: 'absolute',
      top: 'calc(100% + 6px)',
      right: 0,
      width: 240,
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
      padding: 6,
      zIndex: 100,
    }}>
      {items.map(it => (
        <button key={it.id}
          onClick={() => onSelect(it.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%',
            padding: '8px 10px',
            background: 'transparent',
            border: 'none', borderRadius: 7,
            cursor: 'pointer', textAlign: 'left',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = C.hover; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: C.surfaceMuted,
            display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>
            <Icon name={it.icon} size={14} color={C.inkMuted} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{it.title}</div>
            <div style={{ fontSize: 11.5, color: C.inkSubtle }}>{it.body}</div>
          </div>
        </button>
      ))}
    </div>
  );
};

const AppSwitcherMenu = ({ onSwitch, currentMode }) => {
  const items = [
    { id: 'portal', title: 'Dashboard Portal', sub: 'User & Designer', icon: 'dashboard' },
    { id: 'em', title: 'Enterprise Manager', sub: 'Administrator', icon: 'lock' },
  ];
  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 6px)', left: 0,
      width: 240,
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
      padding: 6, zIndex: 100,
    }}>
      <div style={{ padding: '6px 10px 4px', fontSize: 11, fontWeight: 600,
        color: C.inkSubtle, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Switch app</div>
      {items.map(it => {
        const active = it.id === currentMode;
        return (
          <button key={it.id} onClick={() => onSwitch(it.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '8px 10px', background: active ? C.accentTint : 'transparent',
              border: 'none', borderRadius: 7, cursor: 'pointer',
              textAlign: 'left', fontFamily: 'inherit',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.hover; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: active ? C.accentSoft : C.surfaceMuted,
              display: 'grid', placeItems: 'center', flexShrink: 0,
            }}>
              <Icon name={it.icon} size={14} color={active ? C.accentInk : C.inkMuted} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{it.title}</div>
              <div style={{ fontSize: 11.5, color: C.inkSubtle }}>{it.sub}</div>
            </div>
            {active && <Icon name="star-fill" size={12} color={C.accent} />}
          </button>
        );
      })}
      <div style={{ borderTop: `1px solid ${C.border}`, margin: '6px 4px' }} />
      <button style={{
        display: 'block', width: '100%', padding: '8px 10px',
        background: 'transparent', border: 'none', borderRadius: 7,
        textAlign: 'left', cursor: 'pointer', fontSize: 12.5, color: C.inkMuted,
        fontFamily: 'inherit',
      }}>Sign out</button>
    </div>
  );
};

// ============================================================
// TopHeader — Composer-aligned chrome (v3)
// ============================================================
// Convergence rules (per kickoff + plan items 1, 2, 4, 5):
//   1) Bar height 56 → 44. Inner controls run 28-30px tall so they breathe
//      inside the strip. Padding 0 12px (Composer parity).
//   2) App-switcher pill: 28px, 12px/600 label, single hairline border —
//      pixel-match to Composer's pill. Stays gated on hasEMAccess.
//   4) Compact control sizing: all right-cluster buttons 28px high,
//      12.5px label (was 32-36px / 12.5-13px). Removes the chunky feel
//      vs. Composer's denser chrome without changing semantics.
//   5) AI copywriting: button label stays "Ask AI" (already lookup-
//      framed per kickoff). Tooltip + aria reinforce "find / answer"
//      framing — never "build / suggest / generate". The panel content
//      itself is owned elsewhere; this is a contract enforced at entry.
//
// What is NOT changed (per user direction):
//   • Color tokens (C.*) — portal.jsx palette is authoritative; any
//     Composer drift is Composer's problem, not Portal's.
//   • Rail density, empty states, AI as agent surfaces — out of scope.
// ============================================================
const TOP_BAR_H = 44;

const TopHeader = ({ tweaks, onToggleSidebar, onCreate, onSwitchApp, onOpenAI, onOpenSecurityHome }) => {
  const [createOpen, setCreateOpen] = useState(false);
  const [wsOpen, setWsOpen] = useState(false);
  const wrapRef = useRef(null);
  const wsRef = useRef(null);
  useEffect(() => {
    const close = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setCreateOpen(false);
      if (wsRef.current && !wsRef.current.contains(e.target)) setWsOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <header style={{
      background: C.bg,
      borderBottom: `1px solid ${C.border}`,
      height: TOP_BAR_H,
      padding: '0 12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onToggleSidebar} style={iconBtn} title="Toggle tree">
          <Icon name="panel-left" size={16} color={C.inkMuted} />
        </button>
        <span style={{ fontWeight: 700, fontSize: 14, color: C.ink, letterSpacing: '-0.01em' }}>StyleBI</span>
        {tweaks.isSaaS && (
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            height: 26,
            padding: '0 9px 0 4px',
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 999,
            fontSize: 11.5, fontWeight: 600, color: C.ink,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <span style={{
              width: 18, height: 18, borderRadius: 5,
              background: '#5A4FCF', color: '#fff',
              display: 'grid', placeItems: 'center',
              fontSize: 10, fontWeight: 700,
            }}>{(tweaks.orgName || 'A')[0]}</span>
            {tweaks.orgName || 'Acme Corp'}
            <Icon name="chevron-down" size={11} color={C.inkMuted} />
          </button>
        )}
        {tweaks.hasEMAccess && (
          <div ref={wsRef} style={{ position: 'relative' }}>
            <button onClick={() => setWsOpen(o => !o)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              height: 28,
              padding: '0 10px',
              background: C.surface,
              border: `1px solid ${C.border}`, borderRadius: 999,
              color: C.ink, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', letterSpacing: '0.01em', fontFamily: 'inherit',
              transition: 'background 0.12s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.hover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = C.surface; }}>
              Dashboard Portal
              <Icon name="chevron-down" size={12} color={C.accentInk} />
            </button>
            {wsOpen && (
              <AppSwitcherMenu currentMode="portal"
                onSwitch={(id) => { setWsOpen(false); onSwitchApp(id); }} />
            )}
          </div>
        )}
      </div>

      <div style={{ flex: 1, maxWidth: 480, position: 'relative' }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}>
          <Icon name="search" size={14} color={C.inkSubtle} />
        </span>
        <input
          placeholder="Search dashboards, folders, worksheets, schedules…"
          style={{
            width: '100%',
            height: 28,
            padding: '0 44px 0 30px',
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            fontSize: 12.5,
            color: C.ink,
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <kbd style={{
          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
          padding: '1px 5px', fontSize: 10.5,
          background: C.surfaceMuted, color: C.inkSubtle,
          border: `1px solid ${C.border}`, borderRadius: 4,
          fontFamily: 'inherit', lineHeight: 1.5,
        }}>⌘K</kbd>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {!tweaks.securityEnabled && !tweaks.isSaaS && (
          <button onClick={onOpenSecurityHome} title="Security is not configured. Click to learn more." style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            height: 26,
            padding: '0 9px 0 8px',
            background: C.warningSoft,
            border: `1px solid ${C.warning}`,
            borderRadius: 999,
            color: C.warningText,
            fontSize: 11, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'background 0.12s ease',
            marginRight: 2,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F1DBA8'; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.warningSoft; }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <path d="M12 9v4"/>
              <path d="M12 17h.01"/>
            </svg>
            Security off
          </button>
        )}
        <button
          onClick={onOpenAI}
          aria-label="Ask AI — find dashboards, answer product questions"
          title="Ask AI — find dashboards, answer product questions"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            height: 28,
            padding: '0 10px 0 8px',
            background: 'transparent',
            border: `1px solid ${C.borderStrong}`,
            borderRadius: 6,
            cursor: 'pointer',
            color: C.inkMuted,
            fontSize: 12.5, fontWeight: 500,
            fontFamily: 'inherit',
            transition: 'all 0.12s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = C.hover;
            e.currentTarget.style.color = C.ink;
            e.currentTarget.style.borderColor = C.accent;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = C.inkMuted;
            e.currentTarget.style.borderColor = C.borderStrong;
          }}>
          <Icon name="ai" size={14} color={C.inkMuted} />
          Ask AI
        </button>
        {tweaks.isDesigner && (
          <div ref={wrapRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setCreateOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                height: 28,
                padding: '0 11px',
                background: 'transparent',
                color: C.inkMuted,
                border: `1px solid ${C.borderStrong}`,
                borderRadius: 6,
                fontSize: 12.5, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.12s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = C.hover;
                e.currentTarget.style.color = C.ink;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = C.inkMuted;
              }}>
              <Icon name="plus" size={13} />
              Create
              <Icon name="chevron-down" size={11} />
            </button>
            {createOpen && (
              <CreateMenu onSelect={(id) => { setCreateOpen(false); onCreate(id); }} />
            )}
          </div>
        )}
      </div>
    </header>
  );
};

const iconBtn = {
  width: 28, height: 28,
  display: 'grid', placeItems: 'center',
  background: 'transparent',
  border: 'none', borderRadius: 6,
  cursor: 'pointer',
};

// ============================================================
// Tree sidebar — no internal search; filter via global ⌘K
// ============================================================
const TreeRow = ({ node, depth = 0, expanded, onToggle, selected, onSelect, starred, onToggleStar }) => {
  const isFolder = node.type === 'folder';
  const isOpen = expanded.has(node.id);
  const isSelected = selected === node.id;
  const hasChildren = isFolder && node.children && node.children.length > 0;
  const isStarred = !isFolder && starred && starred.has(node.id);
  const [hover, setHover] = useState(false);
  const showStar = !isFolder && (isStarred || hover);

  return (
    <>
      <div
        onClick={() => {
          onSelect(node);
          if (hasChildren) onToggle(node.id);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          paddingLeft: 10 + depth * 16,
          fontSize: 13,
          color: isSelected ? C.ink : C.inkMuted,
          background: isSelected ? C.selected : 'transparent',
          borderRadius: 6,
          cursor: 'pointer',
          fontWeight: isSelected ? 600 : (isFolder ? 500 : 400),
          margin: '1px 6px',
          transition: 'background 120ms ease',
        }}
        onMouseEnter={e => { setHover(true); if (!isSelected) e.currentTarget.style.background = C.hover; }}
        onMouseLeave={e => { setHover(false); if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
      >
        <span style={{
          width: 14, display: 'grid', placeItems: 'center',
          opacity: hasChildren ? 1 : 0,
          transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 150ms ease',
          flexShrink: 0,
        }}>
          <Icon name="chevron" size={12} color={C.inkSubtle} />
        </span>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.name}
        </span>
        {isFolder && node.count != null && (
          <span style={{ fontSize: 11, color: C.inkSubtle, fontVariantNumeric: 'tabular-nums' }}>
            {node.count}
          </span>
        )}
        {showStar && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleStar && onToggleStar(node.id); }}
            title={isStarred ? 'Remove from favorites' : 'Add to favorites'}
            style={{
              border: 'none', background: 'transparent', padding: 0, margin: 0,
              display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0,
              opacity: isStarred ? 1 : 0.55,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = isStarred ? 1 : 0.55; }}
          >
            <Icon name={isStarred ? 'star-fill' : 'star'} size={13} color={isStarred ? C.warning : C.inkSubtle} />
          </button>
        )}
      </div>
      {hasChildren && isOpen && node.children.map(child => (
        <TreeRow key={child.id} node={child} depth={depth + 1}
          expanded={expanded} onToggle={onToggle} selected={selected} onSelect={onSelect}
          starred={starred} onToggleStar={onToggleStar} />
      ))}
    </>
  );
};

// Walk MOCK_TREE and collect ids of every dashboard with starred:true.
// Also returns a flat lookup of dashboard nodes (id -> { node, folderName }).
const collectStarredFromTree = (nodes, parentName = null, acc = { ids: new Set(), flat: [] }) => {
  for (const n of nodes) {
    if (n.type === 'dashboard') {
      if (n.starred) acc.ids.add(n.id);
      acc.flat.push({ node: n, folderName: parentName });
    } else if (n.type === 'folder' && n.children) {
      collectStarredFromTree(n.children, n.name, acc);
    }
  }
  return acc;
};

const Sidebar = ({ selectedId, onSelectNode, isEmpty, isDesigner }) => {
  const [expanded, setExpanded] = useState(new Set(['my', 'shared']));
  const [mode, setMode] = useState('all'); // 'all' | 'favorites'
  const initial = useMemo(() => collectStarredFromTree(MOCK_TREE), []);
  const [starred, setStarred] = useState(initial.ids);
  const flatDashboards = initial.flat;

  const toggle = (id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleStar = (id) => {
    setStarred(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const starredCount = starred.size;
  const favorites = flatDashboards
    .filter(d => starred.has(d.node.id))
    .sort((a, b) => a.node.name.localeCompare(b.node.name));

  return (
    <aside style={{
      width: 268,
      background: C.surfaceMuted,
      borderRight: `1px solid ${C.border}`,
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      <div style={{ padding: '12px 12px 8px' }}>
        <div style={{
          display: 'flex',
          background: C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: 3,
        }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'favorites', label: 'Favorites', icon: 'star-fill' },
          ].map(t => {
            const active = mode === t.id;
            return (
              <button key={t.id}
                onClick={() => setMode(t.id)}
                style={{
                  flex: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  padding: '5px 8px',
                  fontSize: 12, fontWeight: active ? 600 : 500,
                  color: active ? C.ink : C.inkMuted,
                  background: active ? C.surface : 'transparent',
                  border: 'none',
                  borderRadius: 6,
                  boxShadow: active ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'background 120ms ease, color 120ms ease',
                }}>
                {t.icon && <Icon name={t.icon} size={11} color={active ? C.warning : C.inkSubtle} />}
                {t.label}
                {t.id === 'favorites' && starredCount > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    color: active ? C.inkMuted : C.inkSubtle,
                    fontVariantNumeric: 'tabular-nums',
                  }}>{starredCount}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{
        padding: '6px 16px 8px',
        fontSize: 11, fontWeight: 600, color: C.inkSubtle,
        letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>{mode === 'favorites' ? 'Starred' : 'Repository'}</div>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
        {isEmpty ? (
          <EmptyTreeState isDesigner={isDesigner} />
        ) : mode === 'favorites' ? (
          favorites.length === 0 ? (
            <div style={{
              margin: '8px 14px',
              padding: '20px 14px',
              background: C.surface,
              border: `1px dashed ${C.border}`,
              borderRadius: 10,
              textAlign: 'center',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: C.surfaceMuted,
                display: 'grid', placeItems: 'center',
                margin: '0 auto 8px',
              }}>
                <Icon name="star" size={14} color={C.inkSubtle} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 3 }}>
                No favorites yet
              </div>
              <div style={{ fontSize: 11.5, color: C.inkSubtle, lineHeight: 1.45 }}>
                Hover any dashboard and tap the star to add it here.
              </div>
            </div>
          ) : (
            favorites.map(({ node, folderName }) => {
              const isSel = selectedId === node.id;
              return (
                <div key={node.id}
                  onClick={() => onSelectNode(node)}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = C.hover; }}
                  onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 10px',
                    margin: '1px 6px',
                    fontSize: 13,
                    color: isSel ? C.ink : C.inkMuted,
                    background: isSel ? C.selected : 'transparent',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: isSel ? 600 : 400,
                    transition: 'background 120ms ease',
                  }}>
                  <Icon name="star-fill" size={12} color={C.warning} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {node.name}
                    </div>
                    {folderName && (
                      <div style={{ fontSize: 10.5, color: C.inkSubtle, marginTop: 1,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {folderName}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleStar(node.id); }}
                    title="Remove from favorites"
                    style={{
                      border: 'none', background: 'transparent', padding: 0, margin: 0,
                      display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0,
                    }}>
                    <Icon name="star-fill" size={13} color={C.warning} />
                  </button>
                </div>
              );
            })
          )
        ) : MOCK_TREE.map(node => (
          <TreeRow key={node.id} node={node}
            expanded={expanded} onToggle={toggle}
            selected={selectedId} onSelect={onSelectNode}
            starred={starred} onToggleStar={toggleStar} />
        ))}
      </div>
    </aside>
  );
};

// ============================================================
// Folder card
// ============================================================
const FolderCard = ({ folder, accent, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', flexDirection: 'column', gap: 14,
      padding: '20px',
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all 160ms ease',
      fontFamily: 'inherit',
      minHeight: 144,
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = C.borderStrong;
      e.currentTarget.style.transform = 'translateY(-1px)';
      e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.06)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = C.border;
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.boxShadow = 'none';
    }}>
    <div style={{
      width: 38, height: 38, borderRadius: 9,
      background: accent ? C.accentSoft : C.surfaceMuted,
      display: 'grid', placeItems: 'center',
    }}>
      <Icon name="folder" size={20} color={accent ? C.accentInk : C.inkMuted} />
    </div>
    <div>
      <div style={{ fontSize: 15, fontWeight: 600, color: C.ink, marginBottom: 4, letterSpacing: '-0.01em' }}>
        {folder.name}
      </div>
      <div style={{ fontSize: 12.5, color: C.inkSubtle, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>{folder.count} {folder.count === 1 ? 'item' : 'items'}</span>
        <span style={{ width: 3, height: 3, borderRadius: '50%', background: C.borderStrong }} />
        <span>{folder.owner}</span>
      </div>
    </div>
  </button>
);

const ActionCard = ({ icon, title, body, cta, onClick, primary }) => (
  <div style={{
    display: 'flex', flexDirection: 'column',
    padding: '18px 20px 16px',
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    minHeight: 152,
  }}>
    <div style={{
      width: 32, height: 32, borderRadius: 8,
      background: primary ? C.accentSoft : C.surfaceMuted,
      display: 'grid', placeItems: 'center',
      marginBottom: 12,
    }}>
      <Icon name={icon} size={16} color={primary ? C.accentInk : C.inkMuted} />
    </div>
    <div style={{ fontSize: 14.5, fontWeight: 600, color: C.ink, marginBottom: 4 }}>{title}</div>
    <div style={{ fontSize: 12.5, color: C.inkMuted, lineHeight: 1.5, flex: 1 }}>{body}</div>
    <button onClick={onClick} style={{
      marginTop: 12,
      alignSelf: 'flex-start',
      display: 'flex', alignItems: 'center', gap: 6,
      padding: 0,
      background: 'transparent', border: 'none',
      color: primary ? C.accentInk : C.ink,
      fontSize: 13, fontWeight: 600,
      cursor: 'pointer', fontFamily: 'inherit',
    }}>
      {cta}
      <Icon name="arrow-right" size={13} />
    </button>
  </div>
);

const Greeting = ({ tweaks }) => {
  const greeting = tweaks.firstTime
    ? (tweaks.isSaaS && tweaks.orgName ? `Welcome to ${tweaks.orgName}` : 'Welcome to StyleBI')
    : 'Welcome back, Jordan';
  const sub = tweaks.firstTime
    ? 'Your currently accessible assets are listed below.'
    : 'Your currently accessible assets are listed below.';
  return (
    <div style={{ marginBottom: 28 }}>
      <h1 style={{
        margin: 0, fontSize: 30, fontWeight: 700, color: C.ink,
        letterSpacing: '-0.02em', marginBottom: 8,
      }}>{greeting}</h1>
      <p style={{ margin: 0, fontSize: 15, color: C.inkMuted, lineHeight: 1.5, maxWidth: 620 }}>{sub}</p>
    </div>
  );
};

const SecurityBanner = ({ onConfigure }) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', gap: 14,
    padding: '16px 18px',
    background: C.warningSoft,
    border: `1px solid #D9B86A`,
    borderRadius: 10,
    marginBottom: 24,
  }}>
    <div style={{
      width: 38, height: 38, borderRadius: 8,
      background: '#EDD9A8',
      display: 'grid', placeItems: 'center',
      flexShrink: 0,
    }}>
      <Icon name="lock" size={18} color={C.warningText} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.warningText, marginBottom: 4 }}>
        Security not enabled
      </div>
      <div style={{ fontSize: 12.5, color: C.inkMuted, lineHeight: 1.5, marginBottom: 12 }}>
        <strong style={{ fontWeight: 600, color: C.warningText }}>Warning:</strong> Anything you create without security configured is publicly accessible. 
        Set up authentication in Enterprise Manager to control access by user, group, or role, and to enable sharing.
      </div>
      <button style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 14px',
        background: C.accent,
        color: '#fff',
        border: 'none',
        borderRadius: 7,
        fontSize: 12.5,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
        flexShrink: 0,
        transition: 'all 0.12s ease',
      }}
      onClick={onConfigure}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = C.accentInk;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = C.accent;
      }}>
        Set up security in EM
        <Icon name="arrow-right" size={12} color="#fff" />
      </button>
    </div>
  </div>
);

const SectionHeader = ({ label, hint }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
    <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{label}</div>
    {hint && <div style={{ fontSize: 12, color: C.inkSubtle }}>{hint}</div>}
  </div>
);

// ============================================================
// Empty-system home — onboarding for first-time dual-role on a fresh install
// ============================================================
const OnboardingStep = ({ num, icon, title, body, cta, primary, complete, onClick }) => (
  <div style={{
    display: 'flex',
    gap: 16,
    padding: '20px 22px',
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    boxShadow: 'none',
    alignItems: 'flex-start',
    transition: 'all 160ms ease',
  }}
  onMouseEnter={e => {
    e.currentTarget.style.borderColor = C.borderStrong;
    e.currentTarget.style.transform = 'translateY(-1px)';
    e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.06)';
    const icon = e.currentTarget.querySelector(`#step-${num}-icon`);
    if (icon && !complete) {
      icon.style.background = C.accentSoft;
      icon.style.color = C.accentInk;
    }
  }}
  onMouseLeave={e => {
    e.currentTarget.style.borderColor = C.border;
    e.currentTarget.style.transform = 'none';
    e.currentTarget.style.boxShadow = 'none';
    const icon = e.currentTarget.querySelector(`#step-${num}-icon`);
    if (icon && !complete) {
      icon.style.background = C.surfaceMuted;
      icon.style.color = C.inkMuted;
    }
  }}>
    <div style={{
      width: 36, height: 36, borderRadius: 10,
      background: complete ? C.successSoft : C.surfaceMuted,
      display: 'grid', placeItems: 'center', flexShrink: 0,
      color: complete ? C.successText : C.inkMuted,
      fontWeight: 700, fontSize: 14,
      transition: 'all 160ms ease',
    }}
    id={`step-${num}-icon`}>
      {complete ? '✓' : num}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Icon name={icon} size={15} color={C.inkMuted} />
        <div style={{ fontSize: 14.5, fontWeight: 600, color: C.ink }}>{title}</div>
      </div>
      <div style={{ fontSize: 13, color: C.inkMuted, lineHeight: 1.5, marginBottom: 12 }}>{body}</div>
      <button onClick={onClick} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '7px 13px',
        background: primary ? C.accent : 'transparent',
        color: primary ? '#fff' : C.inkMuted,
        border: primary ? 'none' : `1px solid ${C.borderStrong}`,
        borderRadius: 7,
        fontSize: 12.5, fontWeight: 500,
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'all 0.12s ease',
      }}
      onMouseEnter={(e) => {
        if (primary) {
          e.currentTarget.style.background = C.accentInk;
        } else {
          e.currentTarget.style.background = C.hover;
          e.currentTarget.style.color = C.ink;
        }
      }}
      onMouseLeave={(e) => {
        if (primary) {
          e.currentTarget.style.background = C.accent;
        } else {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = C.inkMuted;
        }
      }}>
        {cta}
        <Icon name="arrow-right" size={12} color={primary ? '#fff' : 'currentColor'} />
      </button>
    </div>
  </div>
);

const EmptySystemHome = ({ tweaks, onConfigureSecurity, onOpenAI }) => {
  const securityBanner = !tweaks.securityEnabled;
  return (
  <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 40px 60px' }}>
    <h1 style={{
      margin: 0, fontSize: 32, fontWeight: 700, color: C.ink,
      letterSpacing: '-0.02em', marginBottom: 10,
    }}>Let's set up StyleBI</h1>
    <p style={{ margin: 0, fontSize: 15, color: C.inkMuted, lineHeight: 1.55, marginBottom: 28, maxWidth: 580 }}>
      Your repository is empty. Follow these steps to bring in data and ship your first dashboard.
    </p>

    {!tweaks.securityEnabled && (
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 14,
        padding: '16px 18px',
        background: C.warningSoft,
        border: `1px solid #D9B86A`,
        borderRadius: 10,
        marginBottom: 24,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 8,
          background: '#EDD9A8',
          display: 'grid', placeItems: 'center',
          flexShrink: 0,
        }}>
          <Icon name="lock" size={18} color={C.warningText} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.warningText, marginBottom: 4 }}>
            Security not enabled
          </div>
          <div style={{ fontSize: 12.5, color: C.inkMuted, lineHeight: 1.5, marginBottom: 12 }}>
            <strong style={{ fontWeight: 600, color: C.warningText }}>Warning:</strong> Anything you create without security configured is publicly accessible. 
            Set up authentication in Enterprise Manager to control access by user, group, or role, and to enable sharing.
          </div>
          <button style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            background: C.accent,
            color: '#fff',
            border: 'none',
            borderRadius: 7,
            fontSize: 12.5,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            flexShrink: 0,
            transition: 'all 0.12s ease',
          }}
          onClick={onConfigureSecurity}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = C.accentInk;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = C.accent;
          }}>
            Set up security in EM
            <Icon name="arrow-right" size={12} color="#fff" />
          </button>
        </div>
      </div>
    )}

    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OnboardingStep num={1} icon="database" title="Connect a data source"
        body="Link a database or set up an API connection. If you want to use an uploaded file, skip to step 2."
        cta="Connect data" primary={!securityBanner} />
      <OnboardingStep num={2} icon="worksheet" title="Create a data worksheet"
        body="Shape your raw data — join, filter, and transform it into a clean dataset. Database sources can also use a data model, used directly or inside a worksheet."
        cta="New worksheet" />
      <OnboardingStep num={3} icon="dashboard" title="Design your first dashboard"
        body="Compose interactive charts, tables, and KPIs into a portal dashboard your team can use."
        cta="New dashboard" />
    </div>
  </div>
  );
};

// ============================================================
// Partial home — data is connected, but no dashboards yet
// ============================================================
const PartialHome = ({ tweaks, onConfigureSecurity, onCreateDashboard }) => {
  const securityBanner = !tweaks.securityEnabled && !tweaks.isSaaS;
  return (
  <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 40px 60px' }}>
    <Greeting tweaks={tweaks} />
    {!tweaks.securityEnabled && !tweaks.isSaaS && <SecurityBanner onConfigure={onConfigureSecurity} />}

    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      margin: '0 0 14px',
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Foundation</div>
      <div style={{ fontSize: 12, color: C.inkSubtle }}>Data connected · 1 dashboard to go</div>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 18px',
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: C.successSoft, color: C.successText,
          display: 'grid', placeItems: 'center',
          flexShrink: 0, fontSize: 14, fontWeight: 700,
        }}>✓</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 2 }}>
            Data is connected
          </div>
          <div style={{ fontSize: 12.5, color: C.inkMuted, lineHeight: 1.5 }}>
            Sources and worksheets are set up. Manage them on the Data page.
          </div>
        </div>
      </div>

      <OnboardingStep num={2} icon="dashboard" title="Design your first dashboard"
        body="Compose interactive charts, tables, and KPIs from your worksheets into a dashboard your team can use."
        cta="New dashboard"
        primary={!securityBanner}
        onClick={onCreateDashboard} />
    </div>
  </div>
  );
};

const EmptyTreeState = ({ isDesigner }) => (
  <div style={{
    margin: '12px 14px',
    padding: '20px 16px',
    background: C.surfaceMuted,
    border: `1px dashed ${C.borderStrong}`,
    borderRadius: 10,
    textAlign: 'center',
  }}>
    <div style={{
      width: 32, height: 32, borderRadius: 8,
      background: C.surface,
      display: 'grid', placeItems: 'center',
      margin: '0 auto 10px',
    }}>
      <Icon name="folder" size={16} color={C.inkSubtle} />
    </div>
    <div style={{ fontSize: 12.5, color: C.ink, fontWeight: 600, marginBottom: 4 }}>
      No dashboards yet
    </div>
    <div style={{ fontSize: 11.5, color: C.inkSubtle, lineHeight: 1.5, marginBottom: isDesigner ? 12 : 0 }}>
      {isDesigner
        ? 'Items you create will appear here.'
        : 'Once a designer publishes dashboards, you\u2019ll see them here.'}
    </div>
    {isDesigner && (
      <button style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '6px 11px',
        background: C.accent, color: '#fff',
        border: 'none', borderRadius: 7,
        fontSize: 11.5, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'all 0.12s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = C.accentInk; }}
      onMouseLeave={e => { e.currentTarget.style.background = C.accent; }}>
        <Icon name="plus" size={11} color="#fff" />
        New dashboard
      </button>
    )}
  </div>
);

// ============================================================
// Home view
// ============================================================
const HomeView = ({ tweaks, onOpenDashboard, onConfigureSecurity, onOpenAI }) => {
  const topFolders = MOCK_TREE.filter(n => n.type === 'folder');
  const showSecurity = !tweaks.securityEnabled;
  const securityBanner = showSecurity && !tweaks.isSaaS;
  const showFavorites = FAVORITES.length > 0;
  const isDesigner = tweaks.isDesigner;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 40px 60px' }}>
      <Greeting tweaks={tweaks} />
      {showSecurity && !tweaks.isSaaS && <SecurityBanner onConfigure={onConfigureSecurity} />}
      
      {false && showFavorites && (
        <section style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="star-fill" size={14} color={C.warning} />
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Favorites</div>
            </div>
            <div style={{ fontSize: 12, color: C.inkSubtle }}>
              {FAVORITES.filter(f => !f.isExample).length} starred
            </div>
          </div>
          <div style={{
            padding: '14px 16px',
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {FAVORITES.map(f => (
                <button key={f.id}
                  onClick={() => onOpenDashboard(f)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px',
                    background: C.surfaceMuted,
                    border: `1px solid transparent`,
                    borderRadius: 8,
                    textAlign: 'left',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.borderColor = C.border; }}
                  onMouseLeave={e => { e.currentTarget.style.background = C.surfaceMuted; e.currentTarget.style.borderColor = 'transparent'; }}>
                  <Icon name={f.isExample ? 'dashboard' : 'star-fill'} size={14} color={f.isExample ? C.inkMuted : C.warning} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.ink, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.name}
                    </div>
                    <div style={{ fontSize: 11, color: C.inkSubtle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.isExample ? 'Example' : f.folder}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <AssetSection
        label="Recently edited dashboards"
        icon="dashboard"
        items={tweaks.recentsEmpty ? [] : RECENT_EDITED}
        totalCount={14}
        onOpen={onOpenDashboard}
        onCreate={() => {}}
        createLabel="New dashboard"
        primary={!securityBanner}
        showFolder
      />
      {tweaks.isDesigner && (
        <>
          <AssetSection
            label="Recently edited worksheets"
            icon="worksheet"
            items={tweaks.recentsEmpty ? [] : RECENT_WORKSHEETS}
            totalCount={6}
            onOpen={() => {}}
            onCreate={() => {}}
            createLabel="New worksheet"
            showFolder
          />
          <AssetSection
            label="Recently edited data sources"
            icon="database"
            items={tweaks.recentsEmpty ? [] : RECENT_DATASOURCES}
            totalCount={5}
            onOpen={() => {}}
            onCreate={() => {}}
            createLabel="New connection"
          />
        </>
      )}
    </div>
  );
};

// ============================================================
// Asset section — recent items by type with inline create
// ============================================================
const AssetSection = ({ label, icon, items, totalCount, onOpen, onCreate, createLabel, primary }) => (
  <section style={{ marginBottom: 32 }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{label}</div>
        <div style={{ fontSize: 12, color: C.inkSubtle }}>
          {items.length === 0 ? `${totalCount} total` : `${items.length} of ${totalCount} recent`}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button style={{
          padding: '5px 10px',
          background: 'transparent',
          border: 'none',
          color: C.inkMuted,
          fontSize: 12, fontWeight: 500,
          cursor: 'pointer', fontFamily: 'inherit',
          borderRadius: 6,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = C.hover; e.currentTarget.style.color = C.ink; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.inkMuted; }}>
          View all →
        </button>
        <button onClick={onCreate} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '6px 11px',
          background: primary ? C.accent : 'transparent',
          border: primary ? 'none' : `1px solid ${C.borderStrong}`,
          borderRadius: 7,
          color: primary ? '#fff' : C.inkMuted,
          fontSize: 12, fontWeight: primary ? 600 : 500,
          cursor: 'pointer', fontFamily: 'inherit',
          transition: 'all 0.12s ease',
        }}
        onMouseEnter={e => {
          if (primary) {
            e.currentTarget.style.background = C.accentInk;
          } else {
            e.currentTarget.style.background = C.hover;
            e.currentTarget.style.color = C.ink;
          }
        }}
        onMouseLeave={e => {
          if (primary) {
            e.currentTarget.style.background = C.accent;
          } else {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = C.inkMuted;
          }
        }}>
          <Icon name="plus" size={12} color={primary ? '#fff' : 'currentColor'} />
          {createLabel}
        </button>
      </div>
    </div>
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
      gap: 10,
    }}>
      {items.length === 0 && (
        <div style={{
          gridColumn: '1 / -1',
          padding: '14px 16px',
          background: C.surface,
          border: `1px dashed ${C.border}`,
          borderRadius: 10,
          fontSize: 12.5,
          color: C.inkSubtle,
        }}>
          No recent activity yet.
        </div>
      )}
      {items.map(it => (
        <button key={it.id}
          onClick={() => onOpen(it)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px',
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            textAlign: 'left',
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 140ms ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = C.borderStrong;
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.06)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = C.border;
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: C.surfaceMuted,
            display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>
            <Icon name={icon} size={15} color={C.inkMuted} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {it.name}
            </div>
            <div style={{
              fontSize: 11.5, color: C.inkSubtle,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {it.folder ? `${it.folder} · ${it.updated}` : (it.kind ? `${it.kind} · ${it.updated}` : it.updated)}
            </div>
          </div>
        </button>
      ))}
    </div>
  </section>
);

// ============================================================
// Dashboard view — opened-dashboard with sub-toolbar
// ============================================================
const DashboardView = ({ dashboard, tweaks, onClose }) => {
  const [mode, setMode] = useState('view'); // view | edit | data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.surface }}>
      {/* Dashboard sub-toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 20px',
        borderBottom: `1px solid ${C.border}`,
        background: C.surface,
        gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <button onClick={onClose} style={{ ...iconBtn, width: 28, height: 28 }} title="Close dashboard">
            <Icon name="close" size={16} color={C.inkMuted} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: C.inkSubtle, minWidth: 0 }}>
            <span>{dashboard.folder || 'Repository'}</span>
            <Icon name="chevron" size={11} color={C.inkSubtle} />
            <span style={{ color: C.ink, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {dashboard.name}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Mode tabs — Edit / Data only show for designers */}
          {tweaks.isDesigner && (
            <div style={{
              display: 'flex',
              background: C.surfaceMuted,
              borderRadius: 8,
              padding: 3,
              marginRight: 8,
            }}>
              {[
                { id: 'view', label: 'View', icon: null },
                { id: 'edit', label: 'Edit', icon: 'edit' },
                { id: 'data', label: 'Data', icon: 'data' },
              ].map(t => (
                <button key={t.id}
                  onClick={() => setMode(t.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 12px',
                    background: mode === t.id ? C.surface : 'transparent',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 12.5,
                    fontWeight: mode === t.id ? 600 : 500,
                    color: mode === t.id ? C.ink : C.inkMuted,
                    cursor: 'pointer',
                    boxShadow: mode === t.id ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
                  }}>
                  {t.icon && <Icon name={t.icon} size={13} color={mode === t.id ? C.ink : C.inkMuted} />}
                  {t.label}
                </button>
              ))}
            </div>
          )}

          <button style={toolBtn} title="Refresh"><Icon name="refresh" size={15} color={C.inkMuted} /></button>
          <button style={toolBtn} title="Share"><Icon name="share" size={15} color={C.inkMuted} /></button>
          <button style={toolBtn} title="Export"><Icon name="export" size={15} color={C.inkMuted} /></button>
          <button style={toolBtn} title="More"><Icon name="more" size={15} color={C.inkMuted} /></button>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px',
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 7,
            fontSize: 12.5, fontWeight: 500,
            color: C.ink, cursor: 'pointer',
            marginLeft: 4, fontFamily: 'inherit',
          }}>
            <Icon name="star" size={13} color={C.inkMuted} />
            Pin
          </button>
        </div>
      </div>

      {/* Mode banner for designer modes */}
      {mode === 'edit' && tweaks.isDesigner && (
        <div style={{
          padding: '8px 20px',
          background: C.accentTint,
          borderBottom: `1px solid ${C.accentSoft}`,
          fontSize: 12.5, color: C.accentInk,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Icon name="edit" size={13} color={C.accentInk} />
          <span><strong style={{ fontWeight: 600 }}>Edit mode.</strong> Changes are saved as a draft until published.</span>
        </div>
      )}
      {mode === 'data' && tweaks.isDesigner && (
        <div style={{
          padding: '8px 20px',
          background: '#EEF4FB',
          borderBottom: `1px solid #DCE7F2`,
          fontSize: 12.5, color: '#2A5478',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Icon name="data" size={13} color="#2A5478" />
          <span><strong style={{ fontWeight: 600 }}>Data panel.</strong> Inspect bindings, filters, and source connections.</span>
        </div>
      )}

      {/* Dashboard placeholder content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24, background: C.canvas }}>
        <DashboardPlaceholder dashboard={dashboard} mode={mode} />
      </div>
    </div>
  );
};

const toolBtn = {
  width: 30, height: 30,
  display: 'grid', placeItems: 'center',
  background: 'transparent',
  border: 'none', borderRadius: 6,
  cursor: 'pointer',
};

const DashboardPlaceholder = ({ dashboard, mode }) => (
  <div style={{ maxWidth: 1100, margin: '0 auto' }}>
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 12,
      marginBottom: 16,
    }}>
      {['Revenue', 'Active users', 'Conversion', 'Churn'].map((kpi, i) => (
        <div key={kpi} style={{
          padding: '16px 18px',
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
        }}>
          <div style={{ fontSize: 11.5, color: C.inkSubtle, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>{kpi}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>
            {['$2.4M', '18,402', '4.7%', '1.2%'][i]}
          </div>
          <div style={{ fontSize: 11.5, color: i === 3 ? C.dangerText : C.successText, marginTop: 4, fontWeight: 500 }}>
            {['+12.4%', '+8.1%', '+0.3 pp', '+0.2 pp'][i]} vs prev period
          </div>
        </div>
      ))}
    </div>
    <div style={{
      padding: 20,
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      minHeight: 260,
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: 16,
    }}>
      <div style={{
        background: C.surfaceMuted,
        borderRadius: 8,
        display: 'grid', placeItems: 'center',
        color: C.inkSubtle,
        fontSize: 12,
      }}>
        {mode === 'edit' ? 'Click any chart to edit bindings' : `${dashboard.name} — chart`}
      </div>
      <div style={{
        background: C.surfaceMuted,
        borderRadius: 8,
        display: 'grid', placeItems: 'center',
        color: C.inkSubtle,
        fontSize: 12,
      }}>
        {mode === 'data' ? 'Data sources & filters' : 'Breakdown'}
      </div>
    </div>
  </div>
);

// ============================================================
// Dashboards root view — shows top-level folders when nothing selected
// ============================================================
const DashboardCard = ({ item, onOpen }) => (
  <button
    onClick={() => onOpen(item)}
    style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px',
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      textAlign: 'left',
      cursor: 'pointer', fontFamily: 'inherit',
      transition: 'all 140ms ease',
      position: 'relative',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = C.borderStrong;
      e.currentTarget.style.transform = 'translateY(-1px)';
      e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.06)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = C.border;
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.boxShadow = 'none';
    }}>
    <div style={{
      width: 32, height: 32, borderRadius: 8,
      background: C.surfaceMuted,
      display: 'grid', placeItems: 'center', flexShrink: 0,
    }}>
      <Icon name="dashboard" size={15} color={C.inkMuted} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 2,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{item.name}</div>
      <div style={{
        fontSize: 11.5, color: C.inkSubtle,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{item.folder} · {item.updated || ''}</div>
    </div>
    {item.isExample && (
      <div style={{
        fontSize: 9.5, fontWeight: 600,
        color: C.inkMuted,
        background: C.surfaceMuted,
        border: `1px solid ${C.border}`,
        padding: '2px 6px',
        borderRadius: 4,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        flexShrink: 0,
      }}>Example</div>
    )}
  </button>
);

const DashboardsRootView = ({ onSelectFolder, isEmpty, aiVisible, onOpenAI, onOpenDashboard, recentsEmpty, isDesigner }) => {
  if (isEmpty) return <EmptyDashboardsWorkSurface aiVisible={aiVisible} onOpenAI={onOpenAI} isDesigner={isDesigner} />;

  // Recents fallback: when the user has no recents yet, swap the section
  // for curated examples — same affordance (clickable cards), but honestly
  // labeled. Once Recents has 1+ entries, we show recents and offer
  // examples as a small inline link. 4+ recents → examples drop off.
  const recents = recentsEmpty ? [] : RECENT_VIEWED;
  const showExamplesAsRecents = recents.length === 0;
  const showExamplesHint = recents.length >= 1 && recents.length < 4;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 40px 60px' }}>
      <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, color: C.ink, letterSpacing: '-0.02em' }}>Dashboards</h1>
      <p style={{ margin: '8px 0 36px 0', fontSize: 14, color: C.inkMuted }}>
        {showExamplesAsRecents
          ? 'Open an example to see how dashboards work, or browse the folders below.'
          : 'Pick up where you left off, or browse the folders below.'}
      </p>

      {/* Recents (or Examples fallback) */}
      <section style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>
            {showExamplesAsRecents ? 'Examples to explore' : 'Recently viewed'}
          </div>
          <div style={{ fontSize: 12, color: C.inkSubtle }}>
            {showExamplesAsRecents
              ? `${EXAMPLE_DASHBOARDS.length} curated`
              : `${recents.length} recently opened`}
          </div>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 10,
        }}>
          {(showExamplesAsRecents ? EXAMPLE_DASHBOARDS : recents).map(item => (
            <DashboardCard key={item.id} item={item} onOpen={onOpenDashboard} />
          ))}
        </div>
        {showExamplesHint && (
          <div style={{ marginTop: 10, fontSize: 12, color: C.inkSubtle }}>
            New here?{' '}
            <button
              onClick={() => onSelectFolder('examples')}
              style={{
                background: 'none', border: 'none', padding: 0,
                color: C.accentInk, cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 12, fontWeight: 500,
              }}>
              Try an example →
            </button>
          </div>
        )}
      </section>

      {/* Favorites strip — starred dashboards plus a couple curated examples
          to fill the row. Distinct from the Pinboard tab. */}
      {!recentsEmpty && FAVORITES.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="star" size={14} color={C.warning} />
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Favorites</div>
            </div>
            <div style={{ fontSize: 12, color: C.inkSubtle }}>{FAVORITES.filter(f => !f.isExample).length} starred</div>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 8,
            padding: '14px 16px',
            background: C.surfaceMuted,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
          }}>
            {FAVORITES.map(f => (
              <button key={f.id}
                onClick={() => onOpenDashboard(f)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px',
                  background: 'transparent',
                  border: '1px solid transparent',
                  borderRadius: 7,
                  textAlign: 'left',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.borderColor = C.border; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}>
                <Icon name={f.isExample ? 'dashboard' : 'star'} size={14} color={f.isExample ? C.inkMuted : C.warning} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                  <div style={{ fontSize: 11, color: C.inkSubtle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.isExample ? 'Example' : f.folder}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Browse folders — demoted from hero to a section */}
      <section>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Browse</div>
          <div style={{ fontSize: 12, color: C.inkSubtle }}>2 folders</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {[
            { id: 'private', name: 'Private', count: 0 },
            { id: 'examples', name: 'Examples', count: 24 }
          ].map(folder => (
            <button key={folder.id}
              onClick={() => onSelectFolder(folder.id)}
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: 20,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                transition: 'all 160ms ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = C.borderStrong;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.transform = 'none';
              }}>
              <Icon name="folder" size={26} color={C.accent} />
              <div style={{ marginTop: 10, fontSize: 14, fontWeight: 500, color: C.ink }}>{folder.name}</div>
              <div style={{ marginTop: 2, fontSize: 12, color: C.inkMuted }}>{folder.count} items</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

// ============================================================
// Empty-state work surface for Dashboards — AI prompt + template gallery
// ============================================================
const TEMPLATE_GALLERY = [
  { id: 't1', name: 'Sales Performance', tag: 'Sales', accent: '#7455A8',
    desc: 'Revenue, pipeline, win rate by rep and region.' },
  { id: 't2', name: 'Operations Daily', tag: 'Operations', accent: '#1D8A86',
    desc: 'SLA, throughput, and incident tracking.' },
  { id: 't3', name: 'Marketing Funnel', tag: 'Marketing', accent: '#9580BD',
    desc: 'Channel performance and conversion stages.' },
  { id: 't4', name: 'Financial KPIs', tag: 'Finance', accent: '#3E7FC4',
    desc: 'Revenue, expenses, and runway at a glance.' },
  { id: 't5', name: 'Customer Cohorts', tag: 'Product', accent: '#B54B6E',
    desc: 'Retention curves and cohort comparisons.' },
  { id: 't6', name: 'Executive Overview', tag: 'Leadership', accent: '#2E8B57',
    desc: 'Cross-team summary for weekly review.' },
];

const TemplateThumbnail = ({ accent }) => (
  <svg viewBox="0 0 240 110" style={{ width: '100%', height: '100%', display: 'block' }}>
    <rect width="240" height="110" fill="#FBF9F4" />
    <rect x="14" y="14" width="60" height="8" rx="2" fill={accent} opacity="0.6" />
    <rect x="14" y="28" width="92" height="5" rx="2" fill="#C8C2B7" />
    <rect x="14" y="46" width="68" height="48" rx="4" fill="#fff" stroke="#E5E0D2" />
    <rect x="22" y="76" width="8" height="12" fill={accent} opacity="0.85" />
    <rect x="34" y="68" width="8" height="20" fill={accent} opacity="0.6" />
    <rect x="46" y="58" width="8" height="30" fill={accent} opacity="0.85" />
    <rect x="58" y="64" width="8" height="24" fill={accent} opacity="0.5" />
    <rect x="90" y="46" width="64" height="22" rx="4" fill="#fff" stroke="#E5E0D2" />
    <rect x="98" y="54" width="34" height="3" rx="1.5" fill={accent} />
    <rect x="98" y="60" width="22" height="3" rx="1.5" fill="#C8C2B7" />
    <rect x="90" y="72" width="64" height="22" rx="4" fill="#fff" stroke="#E5E0D2" />
    <path d={`M98 86 L106 80 L114 84 L122 76 L130 82 L138 78 L146 82`}
      stroke={accent} strokeWidth="1.5" fill="none" opacity="0.85" />
    <rect x="162" y="46" width="64" height="48" rx="4" fill="#fff" stroke="#E5E0D2" />
    <circle cx="194" cy="70" r="14" fill="none" stroke={accent} strokeWidth="3.5" opacity="0.85" />
    <circle cx="194" cy="70" r="14" fill="none" stroke="#E5E0D2" strokeWidth="3.5"
      strokeDasharray="44 88" strokeDashoffset="-22" />
  </svg>
);

const FoundationStepper = () => {
  const steps = [
    { n: 1, label: 'Connect data', sub: 'Set up a source', done: false, current: false },
    { n: 2, label: 'Model your data', sub: 'Worksheet or data model', done: false, current: false },
    { n: 3, label: 'Build dashboard', sub: 'You are here', done: false, current: true },
  ];
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', gap: 0,
      marginBottom: 24,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      overflow: 'hidden',
      background: C.surface,
    }}>
      {steps.map((s, i) => (
        <React.Fragment key={s.n}>
          <div style={{
            flex: 1,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px',
            background: s.current ? C.accentTint : 'transparent',
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              display: 'grid', placeItems: 'center',
              background: s.current ? C.accent : C.surfaceMuted,
              color: s.current ? '#fff' : C.inkMuted,
              fontSize: 12, fontWeight: 600,
              border: s.current ? 'none' : `1px solid ${C.border}`,
              flexShrink: 0,
            }}>{s.n}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 600,
                color: s.current ? C.ink : C.inkMuted,
                lineHeight: 1.2,
              }}>{s.label}</div>
              <div style={{ fontSize: 11.5, color: C.inkSubtle, marginTop: 2 }}>{s.sub}</div>
            </div>
          </div>
          {i < steps.length - 1 && (
            <div style={{ display: 'grid', placeItems: 'center', padding: '0 4px', color: C.inkSubtle }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const EmptyDashboardsWorkSurface = ({ aiVisible, onOpenAI, isDesigner }) => {
  if (!isDesigner) {
    // Viewer in a brand-new system: nothing has been published yet, and they
    // can't create. Frame it as a waiting state, not a getting-started state.
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '80px 40px 60px', textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: C.surfaceMuted,
          border: `1px solid ${C.border}`,
          display: 'grid', placeItems: 'center',
          margin: '0 auto 20px',
        }}>
          <Icon name="dashboard" size={26} color={C.inkSubtle} />
        </div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: C.ink, letterSpacing: '-0.01em' }}>
          No dashboards yet
        </h1>
        <p style={{ margin: '10px 0 24px 0', fontSize: 14, color: C.inkMuted, lineHeight: 1.55, maxWidth: 460, marginInline: 'auto' }}>
          Once a designer on your team publishes dashboards to this portal, you’ll be able to open them from here.
        </p>
        {aiVisible && (
          <button onClick={onOpenAI} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '9px 16px',
            background: C.surface,
            color: C.ink,
            border: `1px solid ${C.borderStrong}`,
            borderRadius: 8,
            fontSize: 13, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.12s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = C.hover; e.currentTarget.style.borderColor = C.accent; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.borderColor = C.borderStrong; }}>
            <Icon name="ai" size={14} color={C.inkMuted} />
            Ask AI about StyleBI
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 40px 60px' }}>
      <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, color: C.ink, letterSpacing: '-0.02em' }}>
        Start a dashboard
      </h1>
      <p style={{ margin: '8px 0 36px 0', fontSize: 14, color: C.inkMuted, lineHeight: 1.5, maxWidth: 620 }}>
        Dashboards visualize data from a source you've connected and a worksheet you've shaped.
      </p>

      {/* Template gallery */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Start from a template</div>
        <div style={{ fontSize: 12, color: C.inkSubtle }}>{TEMPLATE_GALLERY.length} templates</div>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 14,
      }}>
        {TEMPLATE_GALLERY.map(t => (
          <button key={t.id} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'stretch',
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: 0,
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'left',
            overflow: 'hidden',
            transition: 'all 160ms ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = C.borderStrong;
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.06)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = C.border;
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}>
            <div style={{ height: 110, overflow: 'hidden', borderBottom: `1px solid ${C.border}` }}>
              <TemplateThumbnail accent={t.accent} />
            </div>
            <div style={{ padding: '12px 14px 14px' }}>
              <div style={{
                display: 'inline-block',
                fontSize: 10.5, fontWeight: 600,
                color: C.inkMuted,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}>{t.tag}</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, marginBottom: 2 }}>{t.name}</div>
              <div style={{ fontSize: 12, color: C.inkSubtle, lineHeight: 1.4 }}>{t.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// Schedule view — task list with scheduler status header
// ============================================================
const SCHEDULE_TASKS = [
  { id: 's1', folder: 'Tasks', name: 'Daily Sales Snapshot',
    description: 'Email PDF of Sales Performance to executives',
    status: 'Ready', statusKind: 'ok',
    lastRun: 'Today, 6:00 AM',
    schedule: 'Daily at 6:00 AM' },
  { id: 's2', folder: 'Tasks', name: 'Weekly Operations Report',
    description: 'Operations Daily dashboard → ops-team@company.com',
    status: 'Ready', statusKind: 'ok',
    lastRun: 'Mon Nov 17, 8:00 AM',
    schedule: 'Weekly on Monday at 8:00 AM' },
  { id: 's3', folder: 'Tasks', name: 'Marketing Funnel — Monthly',
    description: 'Refresh and email funnel report on first of month',
    status: 'Paused', statusKind: 'paused',
    lastRun: 'Nov 1, 2024, 9:00 AM',
    schedule: 'Monthly on day 1 at 9:00 AM' },
  { id: 's4', folder: 'Tasks', name: 'Cohort Refresh',
    description: 'Refresh customer cohort cube every 4 hours',
    status: 'Ready', statusKind: 'ok',
    lastRun: 'Today, 2:00 PM',
    schedule: 'Every 4 hours' },
  { id: 's5', folder: 'Finance', name: 'Quarter Close Bundle',
    description: 'Bundle and archive financial dashboards for QBR',
    status: 'Failed', statusKind: 'fail',
    lastRun: 'Sep 30, 11:48 PM',
    schedule: 'Quarterly on last day at 11:00 PM' },
  { id: 's6', folder: 'Finance', name: 'Expense Audit',
    description: 'Email anomaly report to finance-leads@company.com',
    status: 'Ready', statusKind: 'ok',
    lastRun: 'Yesterday, 7:00 PM',
    schedule: 'Daily at 7:00 PM' },
];

const SCHEDULE_FOLDERS = [
  { id: 'tasks', name: 'Tasks', count: 4 },
  { id: 'finance', name: 'Finance', count: 2 },
  { id: 'archive', name: 'Archive', count: 0 },
];

const StatusPill = ({ kind, children }) => {
  const styles = {
    ok:     { bg: C.successSoft, fg: C.successText, dot: C.success },
    paused: { bg: C.surfaceMuted, fg: C.inkMuted, dot: '#A39E92' },
    fail:   { bg: C.dangerSoft,  fg: C.dangerText,  dot: C.danger },
    run:    { bg: C.successSoft, fg: C.successText, dot: C.success },
  }[kind] || { bg: C.surfaceMuted, fg: C.inkMuted, dot: '#A39E92' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 9px',
      background: styles.bg, color: styles.fg,
      borderRadius: 999,
      fontSize: 11.5, fontWeight: 600,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: styles.dot }} />
      {children}
    </span>
  );
};

const SchedulerStatusBar = ({ running, onToggle, isDesigner }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '10px 20px',
    background: C.surfaceMuted,
    borderBottom: `1px solid ${C.border}`,
    minHeight: 48,
  }}>
    <div style={{
      fontSize: 11, fontWeight: 700, color: C.inkMuted,
      letterSpacing: '0.06em', textTransform: 'uppercase',
    }}>Scheduler Status</div>
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 11px',
      background: running ? C.successSoft : C.dangerSoft,
      color: running ? C.successText : C.dangerText,
      borderRadius: 999,
      fontSize: 12, fontWeight: 600,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: running ? C.success : C.danger,
      }} />
      {running ? 'Running' : 'Stopped'}
    </span>
    <button style={{
      background: 'none', border: 'none', padding: '4px 6px',
      color: C.inkMuted, fontSize: 13, fontWeight: 500,
      cursor: 'pointer', fontFamily: 'inherit', borderRadius: 5,
    }}
    onMouseEnter={e => { e.currentTarget.style.background = C.hover; e.currentTarget.style.color = C.ink; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.inkMuted; }}>
      Refresh Status
    </button>
    <div style={{ fontSize: 13, color: C.inkMuted, flex: 1 }}>
      {running
        ? 'Scheduler is running. Tasks will execute on their defined schedule.'
        : isDesigner
          ? (
            <span>
              Scheduler is stopped, so scheduled tasks will not run automatically.{' '}
              <a href="#" onClick={(e) => e.preventDefault()} style={{
                color: C.accent, textDecoration: 'none', fontWeight: 500,
              }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                Go to Enterprise Manager to start it →
              </a>
            </span>
          )
          : 'Scheduler is stopped. Contact an administrator to start it.'}
    </div>
  </div>
);

const ScheduleToolbar = ({ selectedCount, onNewTask }) => {
  const hasSelection = selectedCount > 0;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '12px 20px',
      borderBottom: `1px solid ${C.border}`,
      background: C.surface,
    }}>
      <button onClick={onNewTask} style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '7px 13px',
        background: C.accent, color: '#fff',
        border: 'none', borderRadius: 7,
        fontSize: 12.5, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'background 0.12s ease',
      }}
      onMouseEnter={e => e.currentTarget.style.background = C.accentInk}
      onMouseLeave={e => e.currentTarget.style.background = C.accent}>
        <Icon name="plus" size={12} color="#fff" />
        New Task
      </button>
      <div style={{ width: 1, height: 22, background: C.border, margin: '0 4px' }} />
      <button style={{
        padding: '6px 11px', background: 'transparent',
        border: 'none', color: C.inkMuted,
        fontSize: 12.5, fontWeight: 500,
        cursor: 'pointer', fontFamily: 'inherit', borderRadius: 6,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = C.hover; e.currentTarget.style.color = C.ink; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.inkMuted; }}>
        Refresh List
      </button>
      <button disabled={!hasSelection} style={{
        padding: '6px 11px', background: 'transparent',
        border: 'none',
        color: hasSelection ? C.inkMuted : C.inkSubtle,
        fontSize: 12.5, fontWeight: 500,
        cursor: hasSelection ? 'pointer' : 'default',
        fontFamily: 'inherit', borderRadius: 6,
        opacity: hasSelection ? 1 : 0.5,
      }}
      onMouseEnter={e => { if (hasSelection) { e.currentTarget.style.background = C.hover; e.currentTarget.style.color = C.ink; } }}
      onMouseLeave={e => { if (hasSelection) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.inkMuted; } }}>
        Move
      </button>
      <button disabled={!hasSelection} style={{
        padding: '6px 11px', background: 'transparent',
        border: 'none',
        color: hasSelection ? C.dangerText : C.inkSubtle,
        fontSize: 12.5, fontWeight: 500,
        cursor: hasSelection ? 'pointer' : 'default',
        fontFamily: 'inherit', borderRadius: 6,
        opacity: hasSelection ? 1 : 0.5,
      }}
      onMouseEnter={e => { if (hasSelection) { e.currentTarget.style.background = C.dangerSoft; } }}
      onMouseLeave={e => { if (hasSelection) { e.currentTarget.style.background = 'transparent'; } }}>
        Delete
      </button>
      {hasSelection && (
        <div style={{ marginLeft: 'auto', fontSize: 12.5, color: C.inkMuted }}>
          {selectedCount} selected
        </div>
      )}
    </div>
  );
};

const ScheduleSidebar = ({ activeFolder, onSelectFolder }) => (
  <aside style={{
    width: 240, flexShrink: 0,
    background: C.surfaceMuted,
    borderRight: `1px solid ${C.border}`,
    padding: '16px 12px',
    overflow: 'auto',
  }}>
    <button style={{
      width: '100%',
      padding: '7px 11px',
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 7,
      fontSize: 12.5, fontWeight: 500,
      color: C.ink, fontFamily: 'inherit',
      cursor: 'pointer',
      textAlign: 'left',
      display: 'flex', alignItems: 'center', gap: 6,
      marginBottom: 14,
    }}>
      <Icon name="list" size={13} color={C.inkMuted} />
      Show as List
    </button>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {SCHEDULE_FOLDERS.map(f => {
        const active = f.id === activeFolder;
        return (
          <button key={f.id} onClick={() => onSelectFolder(f.id)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 8px',
            background: active ? C.selected : 'transparent',
            border: 'none',
            borderRadius: 6,
            fontFamily: 'inherit',
            fontSize: 13,
            color: C.ink,
            fontWeight: active ? 600 : 500,
            cursor: 'pointer',
            textAlign: 'left',
          }}
          onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.hover; }}
          onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
            <Icon name="folder" size={14} color={C.accent} />
            <span style={{ flex: 1 }}>{f.name}</span>
            <span style={{ fontSize: 11.5, color: C.inkSubtle, fontWeight: 500 }}>{f.count}</span>
          </button>
        );
      })}
    </div>
  </aside>
);

const ScheduleTable = ({ tasks, selected, onToggle, onToggleAll }) => {
  const allSelected = tasks.length > 0 && tasks.every(t => selected.has(t.id));
  return (
    <div style={{ flex: 1, overflow: 'auto', background: C.surface }}>
      <table style={{
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: 0,
        fontSize: 13,
      }}>
        <thead>
          <tr style={{ background: C.surfaceMuted }}>
            <th style={thStyle({ width: 40 })}>
              <input type="checkbox" checked={allSelected} onChange={onToggleAll}
                style={{ accentColor: C.accent, cursor: 'pointer' }} />
            </th>
            <th style={thStyle()}>Name</th>
            <th style={thStyle()}>Description</th>
            <th style={thStyle({ width: 110 })}>Status</th>
            <th style={thStyle({ width: 170 })}>Last Run End</th>
            <th style={thStyle({ width: 220 })}>Schedule</th>
            <th style={thStyle({ width: 90, textAlign: 'right' })}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(t => {
            const isSelected = selected.has(t.id);
            return (
              <tr key={t.id} style={{
                background: isSelected ? C.accentTint : 'transparent',
                transition: 'background 120ms ease',
              }}>
                <td style={tdStyle()}>
                  <input type="checkbox" checked={isSelected}
                    onChange={() => onToggle(t.id)}
                    style={{ accentColor: C.accent, cursor: 'pointer' }} />
                </td>
                <td style={tdStyle()}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="schedule" size={14} color={C.inkMuted} />
                    <span style={{ fontWeight: 500, color: C.ink }}>{t.name}</span>
                  </div>
                </td>
                <td style={{ ...tdStyle(), color: C.inkMuted }}>{t.description}</td>
                <td style={tdStyle()}>
                  <StatusPill kind={t.statusKind}>{t.status}</StatusPill>
                </td>
                <td style={{ ...tdStyle(), color: C.inkMuted, fontVariantNumeric: 'tabular-nums' }}>{t.lastRun}</td>
                <td style={{ ...tdStyle(), color: C.inkMuted }}>{t.schedule}</td>
                <td style={{ ...tdStyle(), textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: 2 }}>
                    <ScheduleIconButton title="Run now" icon="play" />
                    <ScheduleIconButton title="Edit" icon="edit" />
                    <ScheduleIconButton title="More" icon="more" />
                  </div>
                </td>
              </tr>
            );
          })}
          {tasks.length === 0 && (
            <tr>
              <td colSpan={7} style={{
                padding: 60, textAlign: 'center',
                color: C.inkSubtle, fontSize: 13,
              }}>No tasks in this folder yet. Click <strong>New Task</strong> to create one.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const thStyle = (extra = {}) => ({
  padding: '10px 14px',
  textAlign: extra.textAlign || 'left',
  fontSize: 11.5,
  fontWeight: 600,
  color: C.inkMuted,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  borderBottom: `1px solid ${C.border}`,
  whiteSpace: 'nowrap',
  width: extra.width,
});

const tdStyle = () => ({
  padding: '11px 14px',
  borderBottom: `1px solid ${C.border}`,
  verticalAlign: 'middle',
});

const ScheduleIconButton = ({ icon, title }) => (
  <button title={title} style={{
    width: 26, height: 26,
    display: 'grid', placeItems: 'center',
    background: 'transparent', border: 'none',
    borderRadius: 5, cursor: 'pointer',
    color: C.inkMuted,
  }}
  onMouseEnter={e => { e.currentTarget.style.background = C.hover; e.currentTarget.style.color = C.ink; }}
  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.inkMuted; }}>
    {icon === 'play' && (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z" />
      </svg>
    )}
    {icon === 'edit' && (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    )}
    {icon === 'more' && (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="5" cy="12" r="1.6"/>
        <circle cx="12" cy="12" r="1.6"/>
        <circle cx="19" cy="12" r="1.6"/>
      </svg>
    )}
  </button>
);

const ScheduleView = ({ isEmpty, aiVisible, onOpenAI, isDesigner }) => {
  const [running, setRunning] = useState(false);
  const [activeFolder, setActiveFolder] = useState('tasks');
  const [selected, setSelected] = useState(new Set());
  const folderName = (SCHEDULE_FOLDERS.find(f => f.id === activeFolder) || {}).name;
  const tasks = isEmpty ? [] : SCHEDULE_TASKS.filter(t => t.folder === folderName);
  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    setSelected(prev => {
      if (tasks.every(t => prev.has(t.id))) {
        const next = new Set(prev);
        tasks.forEach(t => next.delete(t.id));
        return next;
      }
      const next = new Set(prev);
      tasks.forEach(t => next.add(t.id));
      return next;
    });
  };
  if (isEmpty) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <SchedulerStatusBar running={running} onToggle={() => setRunning(r => !r)} isDesigner={isDesigner} />
        <ScheduleEmptyWorkSurface aiVisible={aiVisible} onOpenAI={onOpenAI} />
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <SchedulerStatusBar running={running} onToggle={() => setRunning(r => !r)} isDesigner={isDesigner} />
      <ScheduleToolbar selectedCount={[...selected].filter(id => tasks.some(t => t.id === id)).length}
        onNewTask={() => {}} />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <ScheduleSidebar activeFolder={activeFolder} onSelectFolder={setActiveFolder} />
        <ScheduleTable tasks={tasks} selected={selected}
          onToggle={toggle} onToggleAll={toggleAll} />
      </div>
    </div>
  );
};

// ============================================================
// Schedule empty-state work surface — task pattern gallery
// ============================================================
const SCHEDULE_PATTERNS = [
  { id: 'p1', name: 'Email a dashboard', icon: 'share',
    desc: 'Send a snapshot to a distribution list on a recurring schedule.',
    example: 'Daily at 6:00 AM' },
  { id: 'p2', name: 'Refresh a data cube', icon: 'data',
    desc: 'Re-materialize a worksheet or cube so dashboards stay current.',
    example: 'Every 4 hours' },
  { id: 'p3', name: 'Archive a report', icon: 'export',
    desc: 'Save a PDF/Excel snapshot to storage for compliance.',
    example: 'Weekly on Friday' },
  { id: 'p4', name: 'Run on data change', icon: 'schedule',
    desc: 'Trigger when an upstream table or condition changes.',
    example: 'Event-based' },
];

const ScheduleEmptyWorkSurface = ({ aiVisible, onOpenAI }) => {
  return (
    <div style={{ flex: 1, overflow: 'auto', background: C.surface }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 40px 60px' }}>
        <h1 style={{
          margin: 0, fontSize: 28, fontWeight: 600,
          color: C.ink, letterSpacing: '-0.02em',
          marginBottom: 8,
        }}>
          Automate your reports and refreshes
        </h1>
        <p style={{
          margin: 0, fontSize: 14.5, color: C.inkMuted, lineHeight: 1.55,
          maxWidth: 580, marginBottom: 32,
        }}>
          Tasks run dashboards, refresh data, and deliver reports on a schedule
          you define — daily, weekly, or when something changes upstream.
        </p>

        <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 4 }}>
          Pick a pattern to get started
        </div>
        <div style={{ fontSize: 12.5, color: C.inkSubtle, marginBottom: 16, lineHeight: 1.5 }}>
          Each one is a complete starting point — adjust the schedule and details after.
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 12,
        }}>
          {SCHEDULE_PATTERNS.map(p => (
            <button key={p.id} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
              textAlign: 'left',
              padding: '16px 16px 14px',
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 160ms ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = C.borderStrong;
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.06)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%', marginBottom: 10,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: C.warningSoft,
                  display: 'grid', placeItems: 'center',
                }}>
                  <Icon name={p.icon} size={16} color={C.warning} />
                </div>
                <span style={{
                  fontSize: 11, color: C.inkSubtle,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {p.example}
                </span>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, marginBottom: 4 }}>
                {p.name}
              </div>
              <div style={{ fontSize: 12.5, color: C.inkMuted, lineHeight: 1.45 }}>
                {p.desc}
              </div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 20, fontSize: 12.5 }}>
          <a href="#" style={{
            color: C.inkMuted, textDecoration: 'none',
            fontWeight: 500,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = C.ink; }}
          onMouseLeave={e => { e.currentTarget.style.color = C.inkMuted; }}>
            Or start with a blank task →
          </a>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Data view — designer-only destination for data sources
// ============================================================
const DATA_SOURCE_TYPES = [
  { id: 'database', icon: 'database', name: 'Database',
    desc: 'Connect to PostgreSQL, MySQL, SQL Server, Snowflake, Oracle, and more.',
    note: 'Build a data model directly, or use it inside a worksheet.', primary: true },
  { id: 'rest', icon: 'share', name: 'REST API',
    desc: 'Pull from any HTTP endpoint and shape the response.' },
  { id: 'file', icon: 'worksheet', name: 'File upload',
    desc: 'CSV, Excel, or JSON files — embedded into a worksheet.' },
];

const WORKSHEET_STARTERS = [
  { id: 'ws-source', icon: 'database', name: 'From a data source',
    desc: 'Pull from a connected database, REST API, or file source — then join, filter, and transform.' },
  { id: 'ws-embed', icon: 'worksheet', name: 'Upload or embed data',
    desc: 'Build a worksheet directly from a CSV, Excel file, or hand-entered values — no source needed.' },
];

const EXISTING_WORKSHEETS = [
  { id: 'w1', name: 'Sales by Region (joined)', updated: '1 hour ago', source: 'Production Postgres' },
  { id: 'w2', name: 'Q4 Pipeline Snapshot', updated: 'yesterday', source: 'Salesforce Pipeline' },
  { id: 'w3', name: 'Customer Cohort Analysis', updated: '4 days ago', source: 'embedded data' },
];

const EXISTING_DATA_SOURCES = [
  { id: 'd1', name: 'Production Postgres', type: 'PostgreSQL', updated: '2 hours ago', status: 'connected' },
  { id: 'd2', name: 'Salesforce Pipeline', type: 'REST API', updated: 'yesterday', status: 'connected' },
  { id: 'd3', name: 'Q4 Sales Upload', type: 'CSV', updated: '3 days ago', status: 'connected' },
  { id: 'd4', name: 'Warehouse — Snowflake', type: 'Snowflake', updated: '1 week ago', status: 'connected' },
];

const DataSourceTile = ({ src, primary }) => (
  <button style={{
    display: 'flex', flexDirection: 'column', alignItems: 'stretch',
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: '18px 18px 16px',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
    transition: 'all 120ms ease',
    minHeight: 132,
  }}
  onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderStrong; e.currentTarget.style.boxShadow = `0 1px 0 ${C.border}, 0 4px 12px rgba(0,0,0,0.04)`; }}
  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none'; }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: primary ? C.fourthSoft : C.surfaceMuted,
        display: 'grid', placeItems: 'center',
        flexShrink: 0,
      }}>
        <Icon name={src.icon} size={16} color={primary ? C.fourth : C.inkMuted} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{src.name}</div>
    </div>
    <div style={{ fontSize: 12.5, color: C.inkMuted, lineHeight: 1.5 }}>
      {src.desc}
    </div>
    {src.note && (
      <div style={{ fontSize: 11.5, color: C.inkSubtle, marginTop: 8, lineHeight: 1.5, fontStyle: 'italic' }}>
        {src.note}
      </div>
    )}
  </button>
);

const EmptyDataWorkSurface = ({ aiVisible, onOpenAI }) => (
  <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 40px 60px' }}>
    <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, color: C.ink, letterSpacing: '-0.02em' }}>
      Connect your data
    </h1>
    <p style={{ margin: '8px 0 24px 0', fontSize: 14, color: C.inkMuted, lineHeight: 1.5, maxWidth: 620 }}>
      Data sources are the foundation for worksheets, data models, and dashboards.
      Pick how you want to bring data into StyleBI.
    </p>

    <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 6 }}>
      Connect a data source
    </div>
    <div style={{ fontSize: 12, color: C.inkSubtle, marginBottom: 14, lineHeight: 1.5 }}>
      The foundation for worksheets, data models, and dashboards.
    </div>
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
      gap: 14,
      marginBottom: 32,
    }}>
      {DATA_SOURCE_TYPES.map(src => (
        <DataSourceTile key={src.id} src={src} primary={src.primary} />
      ))}
    </div>

    <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 6 }}>
      …or start with a worksheet
    </div>
    <div style={{ fontSize: 12, color: C.inkSubtle, marginBottom: 14, lineHeight: 1.5 }}>
      Worksheets shape data into a clean dataset. They can pull from a source, or stand alone with uploaded or embedded data.
    </div>
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
      gap: 14,
    }}>
      {WORKSHEET_STARTERS.map(src => (
        <DataSourceTile key={src.id} src={src} primary={false} />
      ))}
    </div>
  </div>
);

const DataView = ({ isEmpty, aiVisible, onOpenAI }) => {
  if (isEmpty) {
    return (
      <div style={{ flex: 1, overflow: 'auto', background: C.surface }}>
        <EmptyDataWorkSurface aiVisible={aiVisible} onOpenAI={onOpenAI} />
      </div>
    );
  }
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 40px 60px' }}>
      <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 600, color: C.ink, letterSpacing: '-0.02em' }}>
        Data
      </h1>
      <p style={{ margin: '0 0 32px 0', fontSize: 14, color: C.inkMuted, lineHeight: 1.5 }}>
        Manage data sources and worksheets — the foundations for dashboards and reports.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.ink }}>
          Data sources
          <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 500, color: C.inkSubtle }}>{EXISTING_DATA_SOURCES.length}</span>
        </h2>
        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 13px',
          background: C.accent, color: '#fff',
          border: `1px solid ${C.accent}`,
          borderRadius: 7,
          fontSize: 12.5, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <Icon name="plus" size={12} color="#fff" />
          New source
        </button>
      </div>
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 36,
      }}>
        {EXISTING_DATA_SOURCES.map((s, i) => (
          <div key={s.id} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 18px',
            borderTop: i === 0 ? 'none' : `1px solid ${C.border}`,
            cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.background = C.hover}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{
              width: 32, height: 32, borderRadius: 7,
              background: C.surfaceMuted,
              display: 'grid', placeItems: 'center',
              flexShrink: 0,
            }}>
              <Icon name="database" size={15} color={C.inkMuted} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, marginBottom: 2 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: C.inkSubtle }}>
                {s.type} · Updated {s.updated}
              </div>
            </div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '2px 9px',
              background: C.successSoft, color: C.successText,
              borderRadius: 999,
              fontSize: 11, fontWeight: 600,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.success }} />
              Connected
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.ink }}>
          Worksheets
          <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 500, color: C.inkSubtle }}>{EXISTING_WORKSHEETS.length}</span>
        </h2>
        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 13px',
          background: 'transparent', color: C.inkMuted,
          border: `1px solid ${C.borderStrong}`,
          borderRadius: 7,
          fontSize: 12.5, fontWeight: 500,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <Icon name="plus" size={12} color="currentColor" />
          New worksheet
        </button>
      </div>
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        overflow: 'hidden',
      }}>
        {EXISTING_WORKSHEETS.map((w, i) => (
          <div key={w.id} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 18px',
            borderTop: i === 0 ? 'none' : `1px solid ${C.border}`,
            cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.background = C.hover}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{
              width: 32, height: 32, borderRadius: 7,
              background: C.surfaceMuted,
              display: 'grid', placeItems: 'center',
              flexShrink: 0,
            }}>
              <Icon name="worksheet" size={15} color={C.inkMuted} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, marginBottom: 2 }}>{w.name}</div>
              <div style={{ fontSize: 12, color: C.inkSubtle }}>
                Source: {w.source} · Updated {w.updated}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// Pinboard placeholder view
// ============================================================
const SimpleView = ({ title, body, icon }) => (
  <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 40px 60px' }}>
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '4px 11px',
      background: C.accentSoft,
      border: `1px solid transparent`,
      borderRadius: 999,
      color: C.accentInk,
      fontSize: 11.5, fontWeight: 600,
      letterSpacing: '0.04em',
      marginBottom: 14,
      transition: 'border-color 120ms ease',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderStrong; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; }}>
      <Icon name={icon} size={12} color={C.inkMuted} />
      {title}
    </div>
    <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em', marginBottom: 8 }}>{title}</h1>
    <p style={{ margin: 0, fontSize: 14.5, color: C.inkMuted, lineHeight: 1.5, marginBottom: 24 }}>{body}</p>
    <div style={{
      padding: 40,
      background: C.surface,
      border: `1px dashed ${C.borderStrong}`,
      borderRadius: 12,
      textAlign: 'center',
      color: C.inkSubtle,
      fontSize: 13,
    }}>
      {title} content area
    </div>
  </div>
);

// ============================================================
// EM gate + Security section stubs
// ============================================================
// ============================================================
// AI Assistant Panel
// ============================================================
const AIAssistantPanel = ({ onClose }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I can help you with questions about StyleBI, your dashboards, and data sources. What would you like to know?' }
  ]);
  
  const handleSend = () => {
    if (!message.trim()) return;
    setMessages(m => [...m, { role: 'user', text: message }]);
    setMessage('');
    // Simulate response
    setTimeout(() => {
      setMessages(m => [...m, { 
        role: 'assistant', 
        text: 'I can help you with that. Here are some things I can do:\n\n• Answer questions about dashboards\n• Explain data sources\n• Guide you through features\n• Help troubleshoot issues' 
      }]);
    }, 800);
  };

  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: 0,
      bottom: 0,
      width: 420,
      background: C.surface,
      borderLeft: `1px solid ${C.border}`,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: C.accentSoft,
            display: 'grid', placeItems: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>AI Assistant</div>
            <div style={{ fontSize: 11.5, color: C.inkMuted }}>Always here to help</div>
          </div>
        </div>
        <button onClick={onClose} style={{
          width: 28, height: 28,
          display: 'grid', placeItems: 'center',
          background: 'transparent',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = C.hover; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
          <Icon name="close" size={16} color={C.inkMuted} />
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
          }}>
            {msg.role === 'assistant' && (
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: C.accentSoft,
                display: 'grid', placeItems: 'center',
                flexShrink: 0,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </div>
            )}
            <div style={{
              flex: 1,
              padding: '10px 14px',
              background: msg.role === 'user' ? C.surfaceMuted : 'transparent',
              borderRadius: 10,
              fontSize: 13,
              color: C.ink,
              lineHeight: 1.5,
              whiteSpace: 'pre-line',
              marginLeft: msg.role === 'user' ? 38 : 0,
            }}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{
        padding: '16px 20px',
        borderTop: `1px solid ${C.border}`,
      }}>
        <div style={{
          display: 'flex',
          gap: 8,
          padding: '8px 12px',
          background: C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
        }}>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            placeholder="Ask me anything..."
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: 13,
              color: C.ink,
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            style={{
              padding: '6px 12px',
              background: message.trim() ? C.accent : C.surfaceMuted,
              color: message.trim() ? '#fff' : C.inkSubtle,
              border: 'none',
              borderRadius: 6,
              fontSize: 12.5,
              fontWeight: 500,
              cursor: message.trim() ? 'pointer' : 'default',
              fontFamily: 'inherit',
            }}>
            Send
          </button>
        </div>
        <div style={{
          marginTop: 10,
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
        }}>
          {['How do I create a dashboard?', 'Show my recent reports', 'Explain data sources'].map((q) => (
            <button key={q}
              onClick={() => setMessage(q)}
              style={{
                padding: '5px 10px',
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                fontSize: 11.5,
                color: C.inkMuted,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.hover; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.surface; }}>
              {q}
            </button>
          ))}
        </div>
        
        {/* Documentation link */}
        <div style={{
          marginTop: 14,
          paddingTop: 14,
          borderTop: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <Icon name="help" size={14} color={C.inkMuted} />
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); window.open('https://www.inetsoft.com/docs/stylebi', '_blank'); }}
            style={{
              fontSize: 12.5,
              color: C.inkMuted,
              textDecoration: 'none',
              flex: 1,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = C.accent; }}
            onMouseLeave={e => { e.currentTarget.style.color = C.inkMuted; }}>
            Can't find what you need? Browse full documentation
          </a>
          <Icon name="arrow-right" size={12} color={C.inkMuted} />
        </div>
      </div>
    </div>
  );
};

const EMGate = ({ isEmpty, onProceed, onCancel, isSaaS, orgName }) => (
  <div style={{
    position: 'fixed', inset: 0,
    background: 'rgba(26, 26, 26, 0.45)',
    display: 'grid', placeItems: 'center', zIndex: 200,
    backdropFilter: 'blur(2px)',
  }} onClick={onCancel}>
    <div onClick={e => e.stopPropagation()} style={{
      width: 420,
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: 28,
      boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: C.accentSoft,
        display: 'grid', placeItems: 'center',
        marginBottom: 14,
      }}>
        <Icon name="lock" size={18} color={C.accentInk} />
      </div>
      <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: C.ink, letterSpacing: '-0.01em', marginBottom: 6 }}>
        {isSaaS
          ? `Sign in to ${orgName || 'your organization'} admin`
          : (isEmpty ? 'Create an admin account' : 'Sign in to Enterprise Manager')}
      </h2>
      <p style={{ margin: 0, fontSize: 13.5, color: C.inkMuted, lineHeight: 1.5, marginBottom: 18 }}>
        {isSaaS
          ? 'Tenant admin access lets you manage users, groups, and permissions for your organization.'
          : (isEmpty
            ? 'Security setup happens in Enterprise Manager. First, set an admin password — this becomes the gate for all future admin access.'
            : "You're leaving the Dashboard Portal. Sign in to continue to the Security section.")}
      </p>
      <input placeholder="Username" style={{
        width: '100%', padding: '9px 12px', marginBottom: 8,
        background: C.bg, border: `1px solid ${C.border}`,
        borderRadius: 7, fontSize: 13, color: C.ink,
        outline: 'none', fontFamily: 'inherit',
      }} defaultValue="admin" />
      <input placeholder={(!isSaaS && isEmpty) ? 'Set password' : 'Password'} type="password" style={{
        width: '100%', padding: '9px 12px',
        background: C.bg, border: `1px solid ${C.border}`,
        borderRadius: 7, fontSize: 13, color: C.ink,
        outline: 'none', fontFamily: 'inherit',
      }} defaultValue="••••••" />
      <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{
          padding: '8px 14px', background: 'transparent',
          border: `1px solid ${C.border}`, borderRadius: 7,
          fontSize: 12.5, fontWeight: 500, color: C.ink,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>Cancel</button>
        <button onClick={onProceed} style={{
          padding: '8px 14px', background: C.ink, color: '#fff',
          border: 'none', borderRadius: 7,
          fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
        }}>{(!isSaaS && isEmpty) ? 'Create & continue' : 'Sign in'}</button>
      </div>
    </div>
  </div>
);

const EMSecurityStub = ({ onBackToPortal, isSaaS, orgName }) => {
  const sections = isSaaS
    ? ['Users', 'Groups', 'Permissions', 'Audit log']
    : ['Authentication provider', 'User & group sync', 'Permission policies', 'Single sign-on'];
  const subtitle = isSaaS
    ? `Manage users, groups, and permissions within ${orgName || 'your organization'}.`
    : 'Configure how users sign in and what they can access. Once security is active, your Dashboard Portal users will have sharing and per-folder permissions.';
  return (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#1F1F1F', color: '#fff' }}>
    <div style={{
      padding: '12px 20px',
      borderBottom: `1px solid #333`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>{isSaaS ? 'Tenant Admin' : 'Enterprise Manager'}</span>
        {isSaaS && orgName && (
          <span style={{ fontSize: 12, color: '#888' }}>· {orgName}</span>
        )}
        <span style={{ fontSize: 12, color: '#888' }}>/</span>
        <span style={{ fontSize: 13, color: '#E89346', fontWeight: 600 }}>{isSaaS ? 'Users' : 'Security'}</span>
      </div>
      <button onClick={onBackToPortal} style={{
        padding: '6px 12px', background: 'transparent',
        border: `1px solid #444`, borderRadius: 6,
        color: '#fff', fontSize: 12, fontWeight: 500,
        cursor: 'pointer', fontFamily: 'inherit',
      }}>Back to Portal</button>
    </div>
    <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ fontSize: 11.5, color: '#E89346', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>{isSaaS ? 'Users & access' : 'Security'}</div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.01em' }}>{isSaaS ? 'Users, groups, and permissions' : 'Authentication & access'}</h1>
        <p style={{ margin: 0, fontSize: 14, color: '#AAA', marginBottom: 28, lineHeight: 1.5 }}>{subtitle}</p>
        <div style={{ display: 'grid', gap: 12 }}>
          {sections.map(s => (
            <div key={s} style={{
              padding: '14px 18px',
              background: '#2A2A2A', border: `1px solid #383838`,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>{s}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{isSaaS ? 'Manage' : 'Not configured'}</div>
              </div>
              <button style={{
                padding: '6px 12px', background: '#E89346', color: '#1F1F1F',
                border: 'none', borderRadius: 6,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
              }}>{isSaaS ? 'Open' : 'Configure'}</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
  );
};
const App = () => {
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "stage": "brandNew",
    "scheduleEmpty": true,
    "recentsEmpty": false,
    "securityEnabled": false,
    "hasEMAccess": true,
    "role": "designer"
  }/*EDITMODE-END*/;

  const [rawTweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Stage-driven derived flags. Stage controls foundation state (data + dashboards).
  // Schedule empty state is an independent toggle.
  const stage = rawTweaks.stage || 'brandNew';
  const dataEmpty = stage === 'brandNew';
  const dashboardsEmpty = stage !== 'populated';
  // Designer implies viewer — there's no separate "both roles" state because
  // it would be identical to designer (highest-privilege role wins). When
  // security is off, everyone has full designer privileges.
  const isDesigner = !rawTweaks.securityEnabled || rawTweaks.role === 'designer';
  const scheduleEmpty = rawTweaks.scheduleEmpty !== false;
  const recentsEmpty = rawTweaks.recentsEmpty === true;
  // Home variants: full empty (no foundation), partial (data only), populated.
  const homeEmpty = stage === 'brandNew';
  const homePartial = stage === 'dataOnly';

  const tweaks = {
    ...rawTweaks,
    stage,
    dataEmpty,
    dashboardsEmpty,
    isDesigner,
    scheduleEmpty,
    recentsEmpty,
    homeEmpty,
    homePartial,
    // Legacy alias — some components still read this for "is everything empty".
    isEmptySystem: stage === 'brandNew',
    firstTime: stage !== 'populated',
    aiAssistantVisible: true,
  };
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [view, setView] = useState(rawTweaks.securityEnabled && rawTweaks.role === 'viewer' ? 'dashboards' : 'workspace');
  // Keep view in sync with role: viewers can't sit on the Workspace rail destination.
  useEffect(() => {
    if (!isDesigner && view === 'workspace') setView('dashboards');
  }, [isDesigner, view]);
  const [activeDashboard, setActiveDashboard] = useState(null);
  const [selectedTreeId, setSelectedTreeId] = useState(null);
  const [emGate, setEmGate] = useState(null); // null | 'security' | 'em-home' (EM landing, distinct from the portal Workspace view)
  const [inEM, setInEM] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const requestSecuritySetup = () => setEmGate('security');
  const proceedToEM = () => {
    const target = emGate;
    setEmGate(null);
    setInEM(true);
    // target === 'security' → EMSecurityStub renders Security section
    void target;
  };

  const handleSelectNode = (node) => {
    setSelectedTreeId(node.id);
    if (node.type === 'dashboard') {
      setActiveDashboard({ id: node.id, name: node.name, folder: 'Repository' });
      setView('dashboard');
    }
  };

  const handleOpenDashboard = (d) => {
    setActiveDashboard(d);
    setView('dashboard');
    setSelectedTreeId(d.id);
  };

  const handleCloseDashboard = () => {
    setActiveDashboard(null);
    setView('dashboards');
    setSelectedTreeId(null);
  };

  // The rail's "active" indicator
  // When an opened dashboard is showing, the rail still highlights the
  // Workspace destination (it's the parent context for the dashboard view).
  const railView = view === 'dashboard' ? 'workspace' : view;

  if (inEM) {
    return (
      <div style={{ height: '100vh', fontFamily: '"Inter", -apple-system, sans-serif' }}>
        <EMSecurityStub onBackToPortal={() => setInEM(false)} />
        <TweaksPanel title="Tweaks">
          <TweakSection label="System state">
            <TweakSelect label="Stage" value={tweaks.stage}
              onChange={(v) => setTweak('stage', v)}
              options={[
                { value: 'brandNew', label: 'Brand new' },
                { value: 'dataOnly', label: 'Data only' },
                { value: 'populated', label: 'Populated' },
              ]} />
          </TweakSection>
        </TweaksPanel>
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      background: C.bg,
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
      color: C.ink,
      overflow: 'hidden',
    }}>
      <LeftRail view={railView} isEmpty={tweaks.dashboardsEmpty}
        showData={tweaks.isDesigner}
        showHome={tweaks.isDesigner}
        setView={(v) => {
        setView(v);
        if (v === 'dashboards') {
          // Opening dashboards view, make sure sidebar is visible
          setSidebarOpen(true);
          // Clear any stale folder selection so we land on the root
          // (template gallery in empty stages, folder grid otherwise).
          setSelectedTreeId(null);
        }
        if (v !== 'dashboard') setActiveDashboard(null);
      }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopHeader
          tweaks={tweaks}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onCreate={(id) => {
            if (id === 'data') setView('data');
            else if (id === 'worksheet') setView('worksheets');
            else if (id === 'dashboard') setView('dashboards');
          }}
          onSwitchApp={(id) => {
            if (id === 'em') setEmGate('em-home');
          }}
          onOpenAI={() => setAiOpen(true)}
          onOpenSecurityHome={() => setView('workspace')}
        />
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {sidebarOpen && view === 'dashboards' && (
            <Sidebar selectedId={selectedTreeId} onSelectNode={handleSelectNode} isEmpty={tweaks.dashboardsEmpty} isDesigner={tweaks.isDesigner} />
          )}
          <main style={{ flex: 1, overflowY: 'auto', background: C.surface }}>
            {view === 'workspace' && (
              tweaks.homeEmpty
                ? <EmptySystemHome tweaks={tweaks} onConfigureSecurity={requestSecuritySetup} onOpenAI={() => setAiOpen(true)} />
                : tweaks.homePartial
                  ? <PartialHome tweaks={tweaks} onConfigureSecurity={requestSecuritySetup} onCreateDashboard={() => setView('dashboards')} onOpenAI={() => setAiOpen(true)} />
                  : <HomeView tweaks={tweaks} onOpenDashboard={handleOpenDashboard} onConfigureSecurity={requestSecuritySetup} onOpenAI={() => setAiOpen(true)} />
            )}
            {view === 'dashboards' && !selectedTreeId && (
              <DashboardsRootView
                onSelectFolder={(id) => setSelectedTreeId(id)}
                onOpenDashboard={handleOpenDashboard}
                isEmpty={tweaks.dashboardsEmpty}
                recentsEmpty={tweaks.recentsEmpty}
                aiVisible={tweaks.aiAssistantVisible}
                isDesigner={tweaks.isDesigner}
                onOpenAI={() => setAiOpen(true)} />
            )}
            {view === 'dashboards' && selectedTreeId && (
              <SimpleView title="Folder contents" icon="folder"
                body="Selected folder contents will appear here." />
            )}
            {view === 'schedule' && <ScheduleView isEmpty={tweaks.scheduleEmpty} aiVisible={tweaks.aiAssistantVisible} isDesigner={tweaks.isDesigner} onOpenAI={() => setAiOpen(true)} />}
            {view === 'data' && <DataView isEmpty={tweaks.dataEmpty} aiVisible={tweaks.aiAssistantVisible} onOpenAI={() => setAiOpen(true)} />}

            {view === 'dashboard' && activeDashboard && (
              <DashboardView dashboard={activeDashboard} tweaks={tweaks} onClose={handleCloseDashboard} />
            )}
          </main>
        </div>
      </div>

      {emGate && (
        <EMGate
          isEmpty={tweaks.homeEmpty}
          onProceed={proceedToEM}
          onCancel={() => setEmGate(null)}
        />
      )}
      
      {aiOpen && (
        <AIAssistantPanel onClose={() => setAiOpen(false)} />
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Security">
          <TweakToggle
            label="Security enabled"
            value={tweaks.securityEnabled}
            onChange={(v) => {
              setTweak('securityEnabled', v);
            }}
          />
          {tweaks.securityEnabled && (
            <>
              <TweakRadio
                label="Portal role"
                value={rawTweaks.role}
                onChange={(v) => setTweak('role', v)}
                options={[
                  { value: 'viewer', label: 'Viewer' },
                  { value: 'designer', label: 'Designer' },
                ]}
              />
              <div style={{
                fontSize: 11, color: C.inkSubtle, lineHeight: 1.5,
                margin: '-4px 0 4px',
              }}>
                Viewer here is the advanced viewer (with Schedule access).
                Dual-role users are treated as designer.
              </div>
            </>
          )}
          {!tweaks.securityEnabled && (
            <div style={{
              padding: '8px 10px',
              background: C.surfaceMuted,
              borderRadius: 6,
              fontSize: 11.5,
              color: C.inkMuted,
              lineHeight: 1.4,
              marginTop: 8,
            }}>
              All users are viewer/designer dual role. EM always available.
            </div>
          )}
        </TweakSection>
        
        <TweakSection label="Scenario">
          <TweakSelect
            label="Stage"
            value={tweaks.stage}
            onChange={(v) => setTweak('stage', v)}
            options={[
              { value: 'brandNew', label: 'Brand new — nothing exists' },
              { value: 'dataOnly', label: 'Data only — no dashboards yet' },
              { value: 'populated', label: 'Populated — data + dashboards' },
            ]}
          />
          <div style={{
            fontSize: 11, color: C.inkSubtle, lineHeight: 1.5,
            margin: '4px 0 10px',
          }}>
            Drives Home, Dashboards, and Data empty states.
          </div>
          <TweakToggle
            label="Recents & Favorites empty"
            value={tweaks.recentsEmpty}
            onChange={(v) => setTweak('recentsEmpty', v)}
          />
          <TweakToggle
            label="Schedule empty"
            value={tweaks.scheduleEmpty}
            onChange={(v) => setTweak('scheduleEmpty', v)}
          />
          <div style={{
            fontSize: 11, color: C.inkSubtle, lineHeight: 1.5,
            margin: '-4px 0 4px',
          }}>
            Only affects the Schedule tab.
          </div>
          {tweaks.securityEnabled && (
            <>
              <TweakToggle
                label="Has EM access"
                value={rawTweaks.hasEMAccess}
                onChange={(v) => setTweak('hasEMAccess', v)}
              />
              <div style={{
                fontSize: 11, color: C.inkSubtle, lineHeight: 1.5,
                margin: '-4px 0 4px',
              }}>
                Only affects the Portal/EM pill in the header.
              </div>
            </>
          )}
        </TweakSection>
        
      
        
        <TweakSection label="Demo">
          <TweakButton
            label="Open sample dashboard"
            onClick={() => handleOpenDashboard({ id: 'demo', name: 'Q4 Executive Review', folder: 'My Dashboards' })}
          />
          <TweakButton
            label="Return home"
            onClick={handleCloseDashboard}
            secondary
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
