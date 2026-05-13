// Composer v3 — Webflow / Framer-era component-canvas pattern
// =================================================================
// What changes vs v2:
//
//   1. LEFT PANEL SPLITS VERTICALLY (Webflow / Framer move).
//      - Top half: Assets or Toolbox (the *catalogues* — things you
//        bring INTO the viewsheet). Tabbed.
//      - Bottom half: Components tree (the outline of what's already
//        ON the viewsheet). ALWAYS VISIBLE, never hidden behind a tab.
//      Rationale: the outline is referenced constantly while editing;
//      hiding it behind a tab makes you toggle. Modern authoring apps
//      (Webflow, Framer, Spline, Rive) all keep the hierarchy
//      co-visible with the asset/element catalog.
//
//   2. RIGHT PANEL DEFAULTS TO **BINDINGS** WHEN SOMETHING IS SELECTED.
//      In v2 the order was Format / Data / Script with Format active.
//      For data-viz authoring, you almost always edit data shape
//      before pixels. Mirrors Power BI / Tableau muscle memory while
//      keeping the modern shell. Tab renamed Data → Bindings to
//      match the existing StyleBI binding-editor vocabulary
//      (vs-binding-pane / wizard).
//
//   3. BINDINGS = TYPED-INPUT FORM, not a flat property list.
//      Renders the Chart/Crosstab/Table binding API as drop-zones:
//      Dimensions · Measures · Filters · Color/Detail.
//      Each row is a typed pill (dimension vs measure vs filter)
//      with aggregation/role inline — same idea as Tableau's shelves
//      but with Figma-component-properties styling.
//
//   4. FLOATING SELECTION TOOLBAR (Figma "auto-layout chip" idea).
//      Anchored above the selected widget on the canvas. Holds the
//      3 most-edited verbs for that object type. For a Table: Change
//      type · Edit bindings · Format. One click jumps the right panel
//      to the matching tab and (if relevant) opens the matching
//      section. Saves the right-panel round-trip for common edits.
//
//   5. EMPTY VIEWSHEET STATE = three starter actions, not a blank
//      grid. Mirrors v0 / Cursor / Framer empty states: Drag a
//      widget · Connect data · Start from a template. Demonstrated
//      side-by-side with the populated frame so reviewer can see both.
//
//   6. INSERT TOOLBAR DEMOTED. Canvas modes (select / snap-grid /
//      snap-objects / annotation) become small chips inside the
//      bottom-right zoom cluster rather than a hero floating bar.
//      Insertion is drag-from-Toolbox (real StyleBI flow), so the
//      hero bar was visual ceremony not earning its keep.
//
// EVERYTHING ELSE INHERITS FROM v2: top bar, app switcher, file tabs,
// canvas frame model, share/save, color tokens.
//
// MAPPING TO REAL STYLEBI (per CLAUDE.md "every panel maps to real
// function"):
//   • Left top tabs → SidebarTab.Assets, SidebarTab.Toolbox
//     (asset-tree-pane.ts, composer-toolbox-pane.ts)
//   • Left bottom → SidebarTab.Components (components-pane.ts /
//     sheet.objectTree)
//   • Right tabs → Bindings (vs-binding-pane.ts),
//     Format (vs-formats-pane.ts), Script (per-assembly script)
//   • Script / Regions tabs only render when editing a script asset
//     or table style — same conditional as v2.

const { useState, useMemo, useRef, useEffect } = React;

// ---- Mock data ---------------------------------------------------
const LAYERS = [
  { id: 'page',  label: 'AITesting',          type: 'page',   depth: 0, open: true, selected: false },
  { id: 'g1',    label: 'Section / Tables',   type: 'group',  depth: 1, open: true, selected: false },
  { id: 'tbl1',  label: 'column width 50',    type: 'table',  depth: 2, selected: false },
  { id: 'chart1', label: 'Revenue by Region',   type: 'chart',  depth: 2, selected: true  },
  { id: 'tbl3',  label: 'column width 150',   type: 'table',  depth: 2, selected: false },
  { id: 'g2',    label: 'Header',             type: 'group',  depth: 1, open: false, selected: false },
];

const OPEN_TABS = [
  { id: 'sales-q4',  label: 'Q4 Sales Review', kind: 'vs', dirty: true,  active: false },
  { id: 'AITesting', label: 'AITesting',        kind: 'vs', dirty: false, active: true  },
  { id: 'wsRollup',  label: 'sales_rollup_q4',  kind: 'ws', dirty: false, active: false },
];

// =================================================================
// Top bar — file tabs respect stage. When stage=noTabs, the tab strip
// is empty (just the New button) to mirror StyleBI's cold-start state.
// =================================================================
function TopBar({ stage, assistantOn, assistantOpen, onToggleAssistant, panelsDocked, onToggleDocked }) {
  const showTabs = stage !== 'noTabs';
  const [newTabOpen, setNewTabOpen] = useState(false);
  const [appSwOpen, setAppSwOpen] = useState(false);
  const [appMenuOpen, setAppMenuOpen] = useState(false);
  const newTabRef = React.useRef(null);
  const appSwRef = React.useRef(null);
  const appMenuRef = React.useRef(null);
  React.useEffect(() => {
    if (!newTabOpen) return;
    const off = (e) => {
      if (!newTabRef.current?.contains(e.target)) setNewTabOpen(false);
    };
    document.addEventListener('mousedown', off);
    return () => document.removeEventListener('mousedown', off);
  }, [newTabOpen]);
  React.useEffect(() => {
    if (!appSwOpen) return;
    const off = (e) => {
      if (!appSwRef.current?.contains(e.target)) setAppSwOpen(false);
    };
    document.addEventListener('mousedown', off);
    return () => document.removeEventListener('mousedown', off);
  }, [appSwOpen]);
  React.useEffect(() => {
    if (!appMenuOpen) return;
    const off = (e) => {
      if (!appMenuRef.current?.contains(e.target)) setAppMenuOpen(false);
    };
    document.addEventListener('mousedown', off);
    return () => document.removeEventListener('mousedown', off);
  }, [appMenuOpen]);
  // Active tab follows the canvas stage so the chrome stays coherent.
  const stageTab = {
    populated:      { id: 'aitesting',  label: 'AITesting',          kind: 'vs', dirty: false },
    emptyViewsheet: { id: 'new-vs',     label: 'New Dashboard',      kind: 'vs', dirty: true  },
    emptyWorksheet: { id: 'new-ws',     label: 'New Worksheet',      kind: 'ws', dirty: true  },
    emptyWidget:    { id: 'q4-review',  label: 'Q4 Executive Review', kind: 'vs', dirty: true  },
  }[stage];
  const tabs = stageTab
    ? [{ ...OPEN_TABS[0], active: false }, { ...stageTab, active: true }]
    : OPEN_TABS;
  // Context-aware primary verb, keyed off active tab's doc kind.
  // Mirrors composer-toolbar (bug #21103: no preview button on worksheet).
  const activeTab = tabs.find(t => t.active) || tabs[0];
  const primary = {
    vs:     { label: 'Preview', icon: 'preview', title: 'Open runtime preview' },
    ws:     { label: 'Run',     icon: 'play',    title: 'Execute query and show results' },
    script: { label: 'Run',     icon: 'play',    title: 'Execute script in test sandbox' },
    style:  { label: 'Preview', icon: 'preview', title: 'Apply style to sample table' },
  }[activeTab?.kind] || { label: 'Preview', icon: 'preview', title: 'Preview' };
  return (
    <div style={tb.bar}>
      <div style={tb.zone}>
        <div ref={appSwRef} style={{ position: 'relative' }}>
          <button style={tb.brand} title="Switch app" onClick={() => setAppSwOpen(v => !v)}>
            <Icon name="logo" size={18}/>
            <span style={tb.app}>Composer</span>
            <Icon name="chevron-d" size={11} color="var(--ink-subtle)"/>
          </button>
          {appSwOpen && (
            <div style={tb.newMenu}>
              <div style={tb.newMenuEyebrow}>Switch to</div>
              {[
                { id: 'portal',   title: 'Portal',             desc: 'View dashboards, schedules, and data.',     tint: 'var(--info)',    tintSoft: 'var(--info-soft)',    icon: 'data' },
                { id: 'composer', title: 'Composer',           desc: 'Author worksheets and dashboards.',          tint: 'var(--primary)', tintSoft: 'var(--primary-soft, rgba(229,138,42,0.12))', icon: 'doc',  active: true },
                { id: 'em',       title: 'Enterprise Manager', desc: 'Manage users, security, and system settings.', tint: 'var(--ink-muted)', tintSoft: 'rgba(40,30,15,0.06)', icon: 'settings' },
              ].map(app => (
                <button key={app.id} style={tb.newMenuRow} onClick={() => setAppSwOpen(false)}>
                  <span style={{ ...tb.newMenuIcon, background: app.tintSoft, color: app.tint }}>
                    <Icon name={app.icon} size={13} color="currentColor"/>
                  </span>
                  <div style={tb.newMenuText}>
                    <div style={tb.newMenuTitle}>{app.title}</div>
                    <div style={tb.newMenuDesc}>{app.desc}</div>
                  </div>
                  {app.active && <span style={{ fontSize: 10, color: 'var(--ink-subtle)' }}>Current</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <div ref={appMenuRef} style={{ position: 'relative' }}>
          <button style={{ ...tb.iconBtn, ...(appMenuOpen ? { background: 'var(--surface)' } : null) }}
                  title="Menu"
                  onClick={() => setAppMenuOpen(v => !v)}>
            <Icon name="more" size={14}/>
          </button>
          {appMenuOpen && (
            <div style={tb.appMenu}>
              <AppMenuSection label="File">
                <AppMenuRow label="Open recent…"                  hint="⌘O"        onClick={() => setAppMenuOpen(false)}/>
                <AppMenuRow label="Import data…"                                    onClick={() => setAppMenuOpen(false)}/>
                <AppMenuRow label="Export…"                                         onClick={() => setAppMenuOpen(false)}/>
                <AppMenuRow label="Print…"                       hint="⌘P"          onClick={() => setAppMenuOpen(false)}/>
                <AppMenuRow label="Close all tabs"                                  onClick={() => setAppMenuOpen(false)}/>
              </AppMenuSection>
              <AppMenuSection label="View">
                <AppMenuRow label="Zoom to fit"                  hint="⌘0"          onClick={() => setAppMenuOpen(false)}/>
                <AppMenuRow label="Zoom 100%"                    hint="⌘1"          onClick={() => setAppMenuOpen(false)}/>
                <AppMenuRow label="Show grid"                    checked            onClick={() => setAppMenuOpen(false)}/>
                <AppMenuRow label="Show rulers"                                     onClick={() => setAppMenuOpen(false)}/>
                <AppMenuRow label="Snap to grid"                 checked            onClick={() => setAppMenuOpen(false)}/>
                <AppMenuRow label="Show left rail"               checked            onClick={() => setAppMenuOpen(false)}/>
                <AppMenuRow label="Show status bar"              checked            onClick={() => setAppMenuOpen(false)}/>
                <AppMenuRow label="Dock side panels"             hint={panelsDocked ? '' : 'overlay'} checked={panelsDocked} onClick={() => { onToggleDocked && onToggleDocked(); setAppMenuOpen(false); }}/>
              </AppMenuSection>
              <AppMenuSection label="Help">
                <AppMenuRow label="Documentation"                                   onClick={() => setAppMenuOpen(false)}/>
                <AppMenuRow label="Keyboard shortcuts"           hint="⌘/"          onClick={() => setAppMenuOpen(false)}/>
                <AppMenuRow label="What's new"                                      onClick={() => setAppMenuOpen(false)}/>
                <AppMenuRow label="Send feedback"                                   onClick={() => setAppMenuOpen(false)}/>
                <AppMenuRow label="About StyleBI"                                   onClick={() => setAppMenuOpen(false)}/>
              </AppMenuSection>
            </div>
          )}
        </div>
      </div>

      <div style={tb.center}>
        {showTabs && tabs.map(t => (
          <button key={t.id} style={{ ...tb.tab, ...(t.active ? tb.tabActive : null) }}>
            <Icon name={t.kind === 'ws' ? 'data' : 'doc'} size={11}
                  color={t.active ? (t.kind === 'ws' ? 'var(--info)' : 'var(--primary)') : 'var(--ink-subtle)'}/>
            <span style={{ color: t.active ? 'var(--ink)' : 'var(--ink-muted)' }}>{t.label}{t.dirty ? '•' : ''}</span>
            {t.active && <Icon name="close" size={10} color="var(--ink-subtle)"/>}
          </button>
        ))}
        <div ref={newTabRef} style={{ position: 'relative' }}>
          <button style={tb.tabNew} title="New…" onClick={() => setNewTabOpen(v => !v)}>
            <Icon name="plus" size={12}/>
          </button>
          {newTabOpen && (
            <div style={tb.newMenu}>
              <div style={tb.newMenuEyebrow}>Create</div>
              <button style={tb.newMenuRow} onClick={() => setNewTabOpen(false)}>
                <span style={{ ...tb.newMenuIcon, background: 'var(--info-soft)', color: 'var(--info)' }}>
                  <Icon name="data" size={13} color="currentColor"/>
                </span>
                <div style={tb.newMenuText}>
                  <div style={tb.newMenuTitle}>New Worksheet</div>
                  <div style={tb.newMenuDesc}>Shape data into a reusable query.</div>
                </div>
                <span style={tb.newMenuKbd}>⌘⇧W</span>
              </button>
              <button style={tb.newMenuRow} onClick={() => setNewTabOpen(false)}>
                <span style={{ ...tb.newMenuIcon, background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                  <Icon name="doc" size={13} color="currentColor"/>
                </span>
                <div style={tb.newMenuText}>
                  <div style={tb.newMenuTitle}>New Dashboard</div>
                  <div style={tb.newMenuDesc}>Author charts, tables, and filters on a canvas.</div>
                </div>
                <span style={tb.newMenuKbd}>⌘N</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={tb.zone}>
        <div style={tb.savedChip}>
          <span style={tb.savedDot}/>
          <span style={{ color: 'var(--ink-muted)' }}>Saved</span>
        </div>
        <button style={tb.iconBtn} title="History"><Icon name="undo" size={14}/></button>
        <button style={{ ...tb.iconBtn, color: 'var(--ink-subtle)' }} title="Redo"><Icon name="redo" size={14}/></button>
        <div style={tb.vsep}/>
        {assistantOn && (
          <button onClick={onToggleAssistant}
                  style={{ ...tb.assistantPill, ...(assistantOpen ? tb.assistantPillOn : null) }}
                  title="Ask AI assistant">
            <Icon name="sparkle" size={12} color={assistantOpen ? '#fff' : 'var(--primary)'}/>
            <span>Ask AI</span>
          </button>
        )}
        <button style={tb.shareBtn} onClick={() => window.__composerDialogs?.setSaveOpen(true)}>Save</button>
        <button style={tb.publishBtn} title={primary.title}>
          <Icon name={primary.icon} size={13} color="#fff"/>
          <span>{primary.label}</span>
        </button>
        <div style={tb.avatar}>FZ</div>
      </div>
    </div>
  );
}
function AppMenuSection({ label, children }) {
  return (
    <div style={tb.appMenuSection}>
      <div style={tb.appMenuLabel}>{label}</div>
      {children}
    </div>
  );
}
function AppMenuRow({ label, hint, checked, onClick }) {
  return (
    <button style={tb.appMenuRow} onClick={onClick}>
      <span style={tb.appMenuCheck}>{checked ? <Icon name="check" size={11} color="currentColor"/> : null}</span>
      <span style={tb.appMenuRowText}>{label}</span>
      {hint && <span style={tb.appMenuHint}>{hint}</span>}
    </button>
  );
}
const tb = {
  bar: { display: 'flex', alignItems: 'center', height: 44, padding: '0 8px', flexShrink: 0, background: 'var(--chrome)', borderBottom: '1px solid var(--border)', position: 'relative', zIndex: 10 },
  zone: { display: 'flex', alignItems: 'center', gap: 2, flex: '0 0 auto', minWidth: 220 },
  brand: { display: 'flex', alignItems: 'center', gap: 7, height: 28, padding: '0 8px 0 6px', borderRadius: 6, fontSize: 12, fontWeight: 600, color: 'var(--ink)' },
  app: { fontWeight: 600 },
  iconBtn: { width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, color: 'var(--ink-muted)' },
  center: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, minWidth: 0 },
  tab: { display: 'inline-flex', alignItems: 'center', gap: 6, height: 26, padding: '0 8px 0 10px', borderRadius: 5, fontSize: 11, fontWeight: 500, maxWidth: 200 },
  tabActive: { background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--border)' },
  tabNew: { width: 26, height: 26, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 5, color: 'var(--ink-muted)' },
  newMenu: {
    position: 'absolute', top: 32, left: 0, zIndex: 60,
    width: 300, padding: 6,
    background: 'var(--surface)', borderRadius: 8,
    boxShadow: '0 12px 32px -8px rgba(40,30,15,0.22), 0 0 0 1px rgba(40,30,15,0.06)',
  },
  newMenuEyebrow: { padding: '6px 8px 4px', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--ink-subtle)', fontWeight: 600 },
  newMenuRow: { display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 8px', borderRadius: 6, textAlign: 'left' },
  newMenuIcon: { width: 26, height: 26, borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 26px' },
  newMenuText: { flex: 1, minWidth: 0 },
  newMenuTitle: { fontSize: 12, fontWeight: 600, color: 'var(--ink)' },
  newMenuDesc: { fontSize: 10.5, color: 'var(--ink-muted)', marginTop: 1, lineHeight: 1.4 },
  newMenuKbd: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-subtle)' },
  appMenu: {
    position: 'absolute', top: 32, left: 0, zIndex: 60,
    width: 240, padding: '4px 0',
    background: 'var(--surface)', borderRadius: 8,
    boxShadow: '0 12px 32px -8px rgba(40,30,15,0.22), 0 0 0 1px rgba(40,30,15,0.06)',
  },
  appMenuSection: { padding: '4px 0', borderTop: '1px solid var(--border)' },
  appMenuSectionFirst: { padding: '4px 0' },
  appMenuLabel: { padding: '6px 10px 4px', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--ink-subtle)', fontWeight: 600 },
  appMenuRow: { display: 'flex', alignItems: 'center', gap: 8, width: '100%', height: 28, padding: '0 10px', textAlign: 'left', fontSize: 12, color: 'var(--ink)' },
  appMenuRowText: { flex: 1 },
  appMenuCheck: { width: 12, display: 'inline-flex', justifyContent: 'center', color: 'var(--primary)' },
  appMenuHint: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-subtle)' },
  savedChip: { display: 'inline-flex', alignItems: 'center', gap: 5, height: 24, padding: '0 8px', borderRadius: 999, fontSize: 11 },
  savedDot: { width: 6, height: 6, borderRadius: 999, background: '#2E8B57' },
  vsep: { width: 1, height: 18, background: 'var(--border)', margin: '0 4px' },
  ghostBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px', borderRadius: 6, fontSize: 12, fontWeight: 500, color: 'var(--ink)' },
  shareBtn: { height: 28, padding: '0 12px', borderRadius: 6, background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--border)', fontSize: 12, fontWeight: 500, color: 'var(--ink)' },
  publishBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, height: 28, padding: '0 12px', borderRadius: 6, background: 'var(--primary)', color: 'white', fontSize: 12, fontWeight: 600 },
  assistantPill: { display: 'inline-flex', alignItems: 'center', gap: 5, height: 26, padding: '0 10px 0 8px', borderRadius: 999, fontSize: 11.5, fontWeight: 500, color: 'var(--ink)', background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--border)', marginRight: 2 },
  assistantPillOn: { background: 'var(--primary)', color: '#fff', boxShadow: 'none' },
  avatar: { width: 28, height: 28, borderRadius: 999, background: 'var(--info-soft)', color: 'var(--info)', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
};

// =================================================================
// Left panel — SPLIT VERTICALLY: Catalogue (top) + Components (bottom)
// =================================================================
// Now controlled by LeftRail. `tab` is one of 'assets' | 'toolbox' | 'components'.
function LeftPanel({ tab, onClose, docked = false }) {
  const title = tab === 'assets' ? 'Assets' : tab === 'toolbox' ? 'Toolbox' : 'Components';
  const count = tab === 'components' ? 5 : null;
  const panelStyle = docked
    ? { ...lp.panel, position: 'relative', top: 'auto', left: 'auto', bottom: 'auto', width: 256, height: '100%', boxShadow: 'none', borderRadius: 0, borderRight: '1px solid var(--hairline)', zIndex: 'auto', flexShrink: 0 }
    : lp.panel;
  return (
    <div style={panelStyle}>
      <div style={lp.header}>
        <div style={lp.headerTitle}>{title}</div>
        {count != null && <div style={lp.headerCount}>{count}</div>}
        <div style={{ flex: 1 }}/>
        <button style={lp.tabIcon} title="Search"><Icon name="search" size={12}/></button>
        {tab === 'components' && (
          <button style={lp.tabIcon} title="Add group"><Icon name="plus" size={12}/></button>
        )}
        <button style={lp.tabIcon} title="Close panel" onClick={onClose}>
          <Icon name="close" size={12}/>
        </button>
      </div>
      <div style={lp.body}>
        {tab === 'assets'     && <AssetsTree/>}
        {tab === 'toolbox'    && <ToolboxGrid/>}
        {tab === 'components' && <ComponentsOutline/>}
      </div>
    </div>
  );
}

function ComponentsOutline() {
  return (
    <div style={{ padding: '4px 4px 6px' }}>
      {LAYERS.map(l => <LayerRow key={l.id} layer={l}/>)}
    </div>
  );
}

function AssetsTree() {
  const groups = [
    { label: 'Data Sources', items: [
      { name: 'Construction Data', icon: 'data', kind: 'Worksheet · Examples', highlight: true },
      { name: 'Sales Postgres',    icon: 'data', kind: 'Data Source' },
    ]},
    { label: 'Worksheets', items: [
      { name: 'sales_rollup_q4', icon: 'data', kind: 'My Worksheets' },
      { name: 'customer_cohorts', icon: 'data', kind: 'My Worksheets' },
    ]},
    { label: 'Dashboards', items: [
      { name: 'Q4 Sales Review', icon: 'doc',  kind: 'My Dashboards' },
    ]},
  ];
  return (
    <div style={{ padding: '8px 10px 10px' }}>
      <button
        onClick={() => window.__composerDialogs?.setImportOpen(true)}
        style={{
          width: '100%', height: 28, marginBottom: 10, borderRadius: 5,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--border)',
          fontSize: 11, fontWeight: 600, color: 'var(--ink-default)',
        }}>
        <Icon name="upload" size={12} color="currentColor"/>
        <span>Import CSV…</span>
      </button>
      {groups.map(g => (
        <div key={g.label}>
          <div style={lp.section}>{g.label}</div>
          {g.items.map(it => (
            <div key={it.name} style={{ ...lp.assetCard, ...(it.highlight ? { boxShadow: 'inset 0 0 0 1px var(--info)', background: 'var(--info-soft)' } : null) }}>
              <Icon name={it.icon} size={13} color="var(--info)"/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</div>
                <div style={{ color: 'var(--ink-subtle)', fontSize: 10 }}>{it.kind}</div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function ToolboxGrid() {
  const groups = [
    { label: 'Data View', items: [
      { name: 'Chart',          icon: 'chart' },
      { name: 'Crosstab',       icon: 'crosstab' },
      { name: 'Table',          icon: 'table' },
      { name: 'Freehand Table', icon: 'freehand-table' },
    ]},
    { label: 'Filter', items: [
      { name: 'Selection List',      icon: 'selection-list' },
      { name: 'Selection Tree',      icon: 'selection-tree' },
      { name: 'Range Slider',        icon: 'range-slider' },
      { name: 'Calendar',            icon: 'calendar' },
    ]},
    { label: 'Output', items: [
      { name: 'Text',  icon: 'text' },
      { name: 'Image', icon: 'image' },
      { name: 'Gauge', icon: 'gauge' },
    ]},
    { label: 'Form', items: [
      { name: 'Slider',      icon: 'slider' },
      { name: 'ComboBox',    icon: 'combo' },
      { name: 'TextInput',   icon: 'textinput' },
      { name: 'Submit',      icon: 'submit' },
    ]},
    { label: 'Shape', items: [
      { name: 'Line',      icon: 'line' },
      { name: 'Rectangle', icon: 'rect' },
      { name: 'Oval',      icon: 'oval' },
    ]},
  ];
  return (
    <div style={{ padding: '8px 10px 10px' }}>
      {groups.map(g => (
        <div key={g.label}>
          <div style={lp.section}>{g.label}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 6 }}>
            {g.items.map(it => (
              <div key={it.name} draggable style={lp.toolChip} title={`Drag to add ${it.name}`}>
                <Icon name={it.icon} size={13} color="var(--ink-default)"/>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function LayerRow({ layer }) {
  const ICON_MAP = { page: 'doc', group: 'folder', table: 'table', chart: 'chart' };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      height: 24, paddingLeft: 6 + layer.depth * 14, paddingRight: 8,
      borderRadius: 4, fontSize: 11,
      ...(layer.selected ? { background: 'var(--c-selected-bg)', color: 'var(--c-selected-text)' } : { color: 'var(--ink-default)' }),
    }}>
      {layer.type !== 'table' && layer.type !== 'chart'
        ? <span style={{ width: 12, color: 'var(--ink-subtle)' }}><Icon name={layer.open ? 'chevron-d' : 'chevron-r'} size={10}/></span>
        : <span style={{ width: 12 }}/>}
      <Icon name={ICON_MAP[layer.type] || 'rect'} size={12}
            color={layer.selected ? 'var(--c-selected-text)' : (layer.type === 'page' ? 'var(--primary)' : 'var(--ink-muted)')}/>
      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{layer.label}</span>
      {layer.selected && <Icon name="lock" size={10} color="var(--c-selected-text)"/>}
    </div>
  );
}

const lp = {
  panel: {
    position: 'absolute', top: 8, left: 8, bottom: 8, width: 256,
    background: 'var(--chrome)', borderRadius: 8,
    boxShadow: 'var(--shadow-elev)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    zIndex: 5,
  },
  header: { display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 6px 0 10px', borderBottom: '1px solid var(--hairline)' },
  headerTitle: { fontSize: 11, fontWeight: 700, color: 'var(--ink)', letterSpacing: 0.3, textTransform: 'uppercase' },
  headerCount: { fontSize: 10, color: 'var(--ink-subtle)', fontFamily: 'var(--font-mono)', marginLeft: -2 },
  tabIcon: { width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-muted)', borderRadius: 4 },
  body: { flex: 1, overflow: 'auto', minHeight: 0 },
  section: { fontSize: 10, fontWeight: 700, color: 'var(--ink-subtle)', letterSpacing: 0.5, textTransform: 'uppercase', padding: '8px 4px 6px' },
  assetCard: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 5, marginBottom: 4, fontSize: 11 },
  toolChip: { display: 'inline-flex', alignItems: 'center', gap: 6, height: 28, padding: '0 8px', background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 5, fontSize: 11, color: 'var(--ink)', cursor: 'grab', userSelect: 'none' },
  footer: { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px 6px 10px', borderTop: '1px solid var(--hairline)', minHeight: 32 },
  footerBinding: { display: 'flex', alignItems: 'center', gap: 5, flex: 1, fontSize: 11, minWidth: 0 },
  footerConsole: { position: 'relative', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, color: 'var(--ink-muted)' },
  footerConsoleDot: { position: 'absolute', top: 3, right: 2, width: 5, height: 5, borderRadius: 999, background: '#2E8B57' },
  reopenTab: {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    width: 22, height: 56, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--chrome)', boxShadow: 'var(--shadow-elev)',
    borderRadius: '0 8px 8px 0', zIndex: 5,
  },
};

// =================================================================
// Right panel — Bindings (default) / Format / Script
// =================================================================
function RightPanel({ hasSelection = true, onClose, docked = false, selectedWidget, onOpenEditor }) {
  const [tab, setTab] = useState('bindings');
  const panelStyle = docked
    ? { ...rp.panel, position: 'relative', top: 'auto', right: 'auto', bottom: 'auto', width: 280, height: '100%', boxShadow: 'none', borderRadius: 0, borderLeft: '1px solid var(--hairline)', zIndex: 'auto', flexShrink: 0 }
    : rp.panel;
  if (!hasSelection) {
    return (
      <div style={panelStyle}>
        <button onClick={onClose} style={rp.collapseFloater} title="Close inspector">
          <Icon name="close" size={12}/>
        </button>
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center',
          padding: '40px 24px', color: 'var(--ink-subtle)', fontSize: 12, lineHeight: 1.55, gap: 10,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: 'var(--surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'inset 0 0 0 1px var(--border)',
          }}>
            <Icon name="paint" size={15} color="var(--ink-subtle)"/>
          </div>
          <div style={{ color: 'var(--ink)', fontWeight: 500 }}>Nothing selected</div>
          <div>Select a widget on the canvas to edit its bindings, format, and script.</div>
        </div>
      </div>
    );
  }
  return (
    <div style={panelStyle}>
      {/* Selection summary header — what the inspector is editing */}
      <div style={rp.selectionHdr}>
        <Icon name={selectedWidget?.kind === 'table' ? 'table' : 'chart'} size={13} color="var(--primary)"/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={rp.selTitle}>{selectedWidget?.name || 'Revenue by Region'}</div>
          <div style={rp.selKind}>{selectedWidget?.kind === 'table' ? 'Table' : 'Chart'} · {selectedWidget?.source || 'Construction Data'}</div>
        </div>
        <button style={rp.hdrIcon} title="Lock"><Icon name="lock" size={11}/></button>
        <button style={rp.hdrIcon} title="Hide"><Icon name="eye" size={11}/></button>
        <button style={rp.hdrIcon} title="Close inspector" onClick={onClose}>
          <Icon name="close" size={11}/>
        </button>
      </div>

      <div style={rp.tabs}>
        {[
          { id: 'bindings', label: 'Bindings' },
          { id: 'format',   label: 'Format'   },
          { id: 'script',   label: 'Script'   },
        ].map(t => (
          <button key={t.id}
                  style={{ ...rp.tab, ...(tab === t.id ? rp.tabActive : null) }}
                  onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={rp.body}>
        {tab === 'bindings' && (
          selectedWidget?.kind === 'chart'
            ? <ChartBindingsSummary onOpenEditor={onOpenEditor}/>
            : selectedWidget?.kind === 'table'
              ? <TableBindingsProps/>
              : <BindingsProps/>
        )}
        {tab === 'format'   && <FormatProps/>}
        {tab === 'script'   && <ScriptProps/>}
      </div>
    </div>
  );
}

// Bindings shelf for SIMPLE widgets (Tables, Crosstabs, Selection Lists, etc).
// Per Option B — fully editable inline. Maps to existing composer-binding-tree
// services but renders as a compact shelf in the right panel.
function TableBindingsProps() {
  return (
    <div>
      <PropSection title="Source">
        <div style={rp.assetCard}>
          <Icon name="data" size={13} color="var(--info)"/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 500, color: 'var(--ink)' }}>Customers</div>
            <div style={{ color: 'var(--ink-subtle)', fontSize: 10 }}>Examples · 412 rows · 12 columns</div>
          </div>
          <button style={rp.hdrIcon} title="Change source"><Icon name="more" size={11}/></button>
        </div>
      </PropSection>

      <PropSection title="Columns">
        <BindingPill type="dim"  label="Account name" role="Text"/>
        <BindingPill type="dim"  label="Segment"      role="Text"/>
        <BindingPill type="meas" label="Revenue"      agg="Sum"/>
        <BindingPill type="meas" label="Δ YoY"        role="Computed"/>
        <DropZone label="Drop column to add"/>
      </PropSection>

      <PropSection title="Filters">
        <BindingPill type="filter" label="Revenue" rule="&gt; $100k"/>
        <DropZone label="Add filter"/>
      </PropSection>

      <PropSection title="Sort">
        <Row>
          <SelectField label="By"  v="Revenue"/>
          <SelectField label="Dir" v="Descending"/>
        </Row>
      </PropSection>
    </div>
  );
}

// Bindings SUMMARY for CHART widgets. Read-only; the primary CTA opens
// the full-screen chart editor (matches existing vs-binding-pane flow).
function ChartBindingsSummary({ onOpenEditor }) {
  return (
    <div>
      <PropSection title="Source">
        <div style={rp.assetCard}>
          <Icon name="data" size={13} color="var(--info)"/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 500, color: 'var(--ink)' }}>Construction Data</div>
            <div style={{ color: 'var(--ink-subtle)', fontSize: 10 }}>Examples · 412 rows · 7 columns</div>
          </div>
        </div>
      </PropSection>

      <div style={{ padding: '8px 12px 4px' }}>
        <button onClick={onOpenEditor} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', height: 32, padding: '0 12px', borderRadius: 5,
          background: 'var(--primary)', color: '#fff', fontSize: 12, fontWeight: 600,
          cursor: 'pointer',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="edit" size={12} color="#fff"/>
            <span>Open chart editor</span>
          </span>
          <Icon name="chevron-r" size={11} color="rgba(255,255,255,0.85)"/>
        </button>
      </div>

      <PropSection title="Chart type">
        <Row>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px 3px 7px', borderRadius: 999, background: 'var(--primary-tint, #FDF5ED)', border: '1px solid var(--primary-soft)', color: 'var(--primary-text)', fontSize: 11, fontWeight: 500 }}>
            <Icon name="chart" size={11} color="var(--primary)"/>
            <span>Column</span>
          </span>
        </Row>
      </PropSection>

      <PropSection title="Bindings (read-only)">
        <SummaryRow label="X axis"  pills={[{ type: 'dim',  label: 'Date',           sub: 'By Month' }]}/>
        <SummaryRow label="Y axis"  pills={[{ type: 'meas', label: 'Revenue',        sub: 'Sum' }]}/>
        <SummaryRow label="Color"   pills={[{ type: 'dim',  label: 'Region' }]}/>
        <SummaryRow label="Detail"  pills={[{ type: 'dim',  label: 'Salesperson' }]}/>
        <SummaryRow label="Filters" pills={[{ type: 'filter', label: 'Date', sub: '≥ 2018-09-01' }]}/>
      </PropSection>
    </div>
  );
}

function SummaryRow({ label, pills }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr', gap: 8, alignItems: 'start', marginBottom: 4 }}>
      <div style={{ fontSize: 10, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: 0.4, paddingTop: 5 }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {pills.map((p, i) => (
          <div key={i} style={{ ...rp.pill, padding: '3px 6px', marginBottom: 0 }}>
            <span style={{ ...rp.pillKind, color: p.type === 'dim' ? '#5F8FE0' : p.type === 'meas' ? '#2E8B57' : '#C97A3A', borderColor: p.type === 'dim' ? '#5F8FE0' : p.type === 'meas' ? '#2E8B57' : '#C97A3A' }}>{p.type === 'dim' ? 'Dim' : p.type === 'meas' ? 'Mea' : 'Flt'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={rp.pillLabel}>{p.label}</div>
              {p.sub && <div style={rp.pillSub}>{p.sub}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Bindings = typed-input form modeling the Chart/Crosstab/Table binding API.
// Reads as Tableau's shelves but rendered with Figma component-property styling.
function BindingsProps() {
  return (
    <div>
      <PropSection title="Source">
        <div style={rp.assetCard}>
          <Icon name="data" size={13} color="var(--info)"/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 500, color: 'var(--ink)' }}>Construction Data</div>
            <div style={{ color: 'var(--ink-subtle)', fontSize: 10 }}>Examples · 412 rows · 7 columns</div>
          </div>
          <button style={rp.hdrIcon} title="Change source"><Icon name="more" size={11}/></button>
        </div>
      </PropSection>

      <PropSection title="Dimensions">
        <BindingPill type="dim" label="Date" role="Group · By Month"/>
        <BindingPill type="dim" label="Delay Reason"/>
        <DropZone label="Drag a dimension column here"/>
      </PropSection>

      <PropSection title="Measures">
        <BindingPill type="meas" label="Accident" agg="Sum"/>
        <DropZone label="Drag a measure column here"/>
      </PropSection>

      <PropSection title="Filters">
        <BindingPill type="filter" label="Date" rule="≥ 2018-09-01"/>
        <DropZone label="Add filter"/>
      </PropSection>

      <PropSection title="Sort">
        <Row>
          <SelectField label="By"  v="Accident"/>
          <SelectField label="Dir" v="Descending"/>
        </Row>
      </PropSection>
    </div>
  );
}

// Typed binding pill — the row inside Dimensions/Measures/Filters.
function BindingPill({ type, label, role, agg, rule }) {
  const styles = {
    dim:    { swatch: '#5F8FE0', kindLabel: 'Dim' },
    meas:   { swatch: '#2E8B57', kindLabel: 'Mea' },
    filter: { swatch: '#C97A3A', kindLabel: 'Filt' },
  }[type] || { swatch: '#888', kindLabel: '·' };
  const sub = role || (agg ? `Aggregate · ${agg}` : null) || rule;
  return (
    <div style={rp.pill}>
      <span style={{ ...rp.pillKind, color: styles.swatch, borderColor: styles.swatch }}>{styles.kindLabel}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={rp.pillLabel}>{label}</div>
        {sub && <div style={rp.pillSub}>{sub}</div>}
      </div>
      <button style={rp.pillCog} title="Configure"><Icon name="settings" size={11}/></button>
      <button style={rp.pillX} title="Remove"><Icon name="close" size={10}/></button>
    </div>
  );
}

function DropZone({ label }) {
  return (
    <div style={rp.dropZone}>
      <Icon name="plus" size={11} color="var(--ink-subtle)"/>
      <span>{label}</span>
    </div>
  );
}

function FormatProps() {
  return (
    <div>
      <PropSection title="Position & Size">
        <Grid2><NumField label="X" v="320"/><NumField label="Y" v="220"/></Grid2>
        <Grid2><NumField label="W" v="460"/><NumField label="H" v="60"/></Grid2>
      </PropSection>
      <PropSection title="Fill">
        <Row><Swatch color="#FFFFFF"/><Mono>#FFFFFF</Mono><Pct>100%</Pct></Row>
      </PropSection>
      <PropSection title="Stroke">
        <Row><Swatch color="#D9D5CC"/><Mono>#D9D5CC</Mono><NumChip>1</NumChip></Row>
      </PropSection>
      <PropSection title="Typography">
        <Grid2><SelectField label="Font" v="Inter"/><NumField label="Size" v="12"/></Grid2>
      </PropSection>
      <PropSection title="Effects">
        <button style={rp.addProp}><Icon name="plus" size={11}/><span>Add shadow</span></button>
      </PropSection>
    </div>
  );
}

function ScriptProps() {
  return (
    <div>
      <PropSection title="OnLoad">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: 8, color: 'var(--ink)', whiteSpace: 'pre', overflow: 'auto' }}>{`// runs when this Table loads
this.title = "Construction " + year;`}</div>
      </PropSection>
      <PropSection title="OnClick">
        <div style={{ color: 'var(--ink-subtle)', fontSize: 11, padding: '4px 0' }}>No OnClick script defined.</div>
        <button style={rp.addProp}><Icon name="plus" size={11}/><span>Add script</span></button>
      </PropSection>
      <PropSection title="Functions available">
        <a href="#" style={{ color: 'var(--info)', fontSize: 11, textDecoration: 'none' }}>Open function tree →</a>
      </PropSection>
    </div>
  );
}

const PropSection = ({ title, children }) => (
  <div style={rp.section}>
    <div style={rp.sectionHead}>
      <span>{title}</span>
      <button style={rp.sectionAdd} title="Add"><Icon name="plus" size={10}/></button>
    </div>
    <div style={rp.sectionBody}>{children}</div>
  </div>
);
const Grid2 = ({ children }) => <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>{children}</div>;
const Row = ({ children }) => <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>{children}</div>;
const isAxisLabel = (s) => /^[XYWH]$/.test(s);
const NumField = ({ label, v }) => {
  if (isAxisLabel(label)) {
    return (
      <label style={rp.input}>
        <span style={rp.axisLabel}>{label}</span>
        <input defaultValue={v} style={rp.inputCtrl}/>
      </label>
    );
  }
  return (
    <label style={rp.stacked}>
      <span style={rp.stackedLabel}>{label}</span>
      <input defaultValue={v} style={rp.inputCtrl}/>
    </label>
  );
};
const SelectField = ({ label, v }) => (
  <label style={rp.stacked}>
    <span style={rp.stackedLabel}>{label}</span>
    <div style={{ ...rp.inputCtrl, display: 'flex', alignItems: 'center' }}>
      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v}</span>
      <Icon name="chevron-d" size={10} color="var(--ink-subtle)"/>
    </div>
  </label>
);
const Swatch = ({ color }) => <span style={{ width: 16, height: 16, borderRadius: 3, background: color, boxShadow: 'inset 0 0 0 1px var(--border)' }}/>;
const Mono = ({ children }) => <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink)' }}>{children}</span>;
const Pct = ({ children }) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-muted)' }}>{children}</span>;
const NumChip = ({ children }) => <span style={{ minWidth: 24, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px', background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--border)', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 11 }}>{children}</span>;

const rp = {
  panel: {
    position: 'absolute', top: 8, right: 8, bottom: 8, width: 280,
    background: 'var(--chrome)', borderRadius: 8,
    boxShadow: 'var(--shadow-elev)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    zIndex: 5,
  },
  selectionHdr: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
    borderBottom: '1px solid var(--hairline)',
  },
  selTitle: { fontSize: 12, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  selKind: { fontSize: 10, color: 'var(--ink-subtle)' },
  hdrIcon: { width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, color: 'var(--ink-muted)' },
  collapseFloater: { position: 'absolute', top: 8, right: 8, width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, color: 'var(--ink-muted)', zIndex: 1 },
  reopenTab: {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    width: 22, height: 56, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--chrome)', boxShadow: 'var(--shadow-elev)',
    borderRadius: '8px 0 0 8px', zIndex: 5,
  },
  tabs: { display: 'flex', padding: 6, gap: 2, borderBottom: '1px solid var(--hairline)' },
  tab: { flex: 1, height: 26, borderRadius: 5, fontSize: 11, fontWeight: 500, color: 'var(--ink-muted)' },
  tabActive: { background: 'var(--surface)', color: 'var(--ink)', boxShadow: 'inset 0 0 0 1px var(--border)' },
  body: { flex: 1, overflow: 'auto' },
  section: { borderBottom: '1px solid var(--hairline)' },
  sectionHead: { display: 'flex', alignItems: 'center', padding: '8px 12px 4px', fontSize: 11, fontWeight: 600, color: 'var(--ink)' },
  sectionAdd: { marginLeft: 'auto', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-subtle)', borderRadius: 3 },
  sectionBody: { padding: '0 12px 10px' },
  input: { display: 'flex', alignItems: 'center', gap: 4 },
  axisLabel: { width: 12, fontSize: 10, color: 'var(--ink-subtle)', fontFamily: 'var(--font-mono)' },
  stacked: { display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 },
  stackedLabel: { fontSize: 10, color: 'var(--ink-subtle)', fontWeight: 500 },
  inputCtrl: { flex: 1, height: 24, padding: '0 7px', background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--border)', borderRadius: 4, border: 0, outline: 0, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink)' },
  addProp: { display: 'inline-flex', alignItems: 'center', gap: 6, height: 24, padding: '0 8px', borderRadius: 4, color: 'var(--ink-muted)', fontSize: 11, fontWeight: 500, border: '1px dashed var(--border)', marginTop: 4 },
  assetCard: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 5, fontSize: 11 },
  pill: {
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '5px 4px 5px 6px',
    background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 5,
    marginBottom: 4,
  },
  pillKind: {
    fontSize: 9, fontWeight: 700, letterSpacing: 0.4,
    border: '1px solid', borderRadius: 3,
    padding: '1px 4px',
    fontFamily: 'var(--font-mono)',
    flexShrink: 0,
  },
  pillLabel: { fontSize: 11, fontWeight: 500, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  pillSub: { fontSize: 9.5, color: 'var(--ink-subtle)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  pillCog: { width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-subtle)', borderRadius: 3 },
  pillX: { width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-subtle)', borderRadius: 3 },
  dropZone: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
    height: 28, marginTop: 2,
    border: '1px dashed var(--border)', borderRadius: 5,
    fontSize: 10.5, color: 'var(--ink-subtle)',
  },
};

// =================================================================
// Canvas — layout follows stage:
//   noTabs          → composer-empty-editor hints, no frames
//   emptyWorksheet  → worksheet doc, no tables yet
//   emptyViewsheet  → viewsheet doc, no widgets yet
//   emptyWidget     → viewsheet with a chart placed but unbound
//   populated       → viewsheet with widgets (reference baseline)
// =================================================================
function Canvas({ t, selectedWidget, setSelectedWidget, setBindingEditorOpen }) {
  const stage = t.stage;

  if (stage === 'noTabs') {
    return (
      <div style={cv.world}>
        <div style={cv.bg}/>
        <NoTabsHints/>
      </div>
    );
  }

  const frameLeft = 380;

  return (
    <div style={cv.world}>
      <div style={cv.bg}/>

      {stage === 'populated' && (
        <div style={{ ...cv.frameWrap, left: frameLeft }}>
          <div style={cv.frameLabel}>
            <Icon name="doc" size={11} color="var(--primary)"/>
            <span>AITesting</span>
            <span style={cv.frameMeta}>1440 × 900</span>
          </div>
          <div style={cv.frame}>
            <CanvasTable y={40}  label="column width 50"  w={300}
                         selected={selectedWidget?.id === 'tbl-1'}
                         onSelect={() => setSelectedWidget({ id: 'tbl-1', kind: 'table', name: 'column width 50',  source: 'Customers' })}/>
            <CanvasChart y={180} label="Revenue by Region" w={400}
                         selected={selectedWidget?.id === 'chart-1'}
                         onClick={() => setSelectedWidget({ id: 'chart-1', kind: 'chart', name: 'Revenue by Region', source: 'Construction Data' })}
                         onOpen={() => setBindingEditorOpen(true)}/>
            <CanvasTable y={420} label="column width 150" w={500}
                         selected={selectedWidget?.id === 'tbl-2'}
                         onSelect={() => setSelectedWidget({ id: 'tbl-2', kind: 'table', name: 'column width 150', source: 'Customers' })}/>
            <SelectionToolbar x={60} y={180} widgetType="chart"
                              style={t.chartToolbarStyle}
                              chartType={t.chartType || 'Column'}
                              onChartType={(v) => {}}
                              onOpenEditor={() => { const m = window.__composerSetEditor; if (m) m(true); }}/>
          </div>
        </div>
      )}

      {stage === 'emptyViewsheet' && (
        <div style={{ ...cv.emptyWrap, left: 460 }}>
          <div style={cv.frameLabel}>
            <Icon name="doc" size={11} color="var(--primary)"/>
            <span>New Dashboard</span>
            <span style={cv.frameMeta}>1440 × 900</span>
          </div>
          <div style={cv.emptyFrame}>
            <EmptyState t={t}/>
          </div>
        </div>
      )}

      {stage === 'emptyWorksheet' && (
        <div style={{ ...cv.frameWrap, left: frameLeft }}>
          <div style={cv.frameLabel}>
            <Icon name="data" size={11} color="var(--info)"/>
            <span>New Worksheet</span>
            <span style={cv.frameMeta}>data prep</span>
          </div>
          <div style={cv.frame}>
            <EmptyWorksheet t={t}/>
          </div>
        </div>
      )}

      {stage === 'emptyWidget' && (
        <div style={{ ...cv.frameWrap, left: frameLeft }}>
          <div style={cv.frameLabel}>
            <Icon name="doc" size={11} color="var(--primary)"/>
            <span>Q4 Executive Review</span>
            <span style={cv.frameMeta}>1440 × 900</span>
          </div>
          <div style={cv.frame}>
            <UnboundChart x={60} y={60} w={420} h={280} selected={true} t={t}/>
            <SelectionToolbar x={60} y={60} widgetType="chart"/>
          </div>
        </div>
      )}

      <BottomCluster/>
    </div>
  );
}

function EmptyWorksheet({ t }) {
  const starters = [
    { icon: 'data',   title: 'Drag a data source', body: 'Open Assets and drop a database table, query, or upload onto the canvas.', kbd: 'D' },
    { icon: 'plus',   title: 'New embedded table', body: 'Hand-type a small lookup table inline. Useful for mappings and dimensions.', kbd: 'T' },
    { icon: 'script', title: 'SQL query',          body: 'Write a query against a configured data source. Joins, unions, and CTEs supported.', kbd: 'Q' },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ width: 560, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>Build the data behind a dashboard</div>
          <div style={{ fontSize: 12, color: 'var(--ink-subtle)', marginTop: 4 }}>A worksheet shapes raw sources into a reusable table.</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {starters.map(s => (
            <button key={s.title} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6,
              padding: 14, borderRadius: 8, textAlign: 'left',
              background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--border)', cursor: 'pointer',
            }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--info-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
                <Icon name={s.icon} size={13} color="var(--info)"/>
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>{s.title}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-muted)', lineHeight: 1.45 }}>{s.body}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-subtle)', padding: '2px 6px', borderRadius: 3, boxShadow: 'inset 0 0 0 1px var(--hairline)', marginTop: 4 }}>{s.kbd}</div>
            </button>
          ))}
        </div>
        {t && t.showAssistantHint && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
            <button onClick={t.onOpenAssistant} style={es.assistHint}>
              <Icon name="sparkle" size={11} color="var(--primary)"/>
              <span>Stuck? <span style={{ color: 'var(--ink)', fontWeight: 500 }}>Ask AI</span></span>
              <Icon name="chevron-r" size={10} color="var(--ink-subtle)"/>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function UnboundChart({ x, y, w, h, selected, t }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, height: h,
      borderRadius: 6, background: '#FFFFFF',
      boxShadow: selected ? '0 0 0 1.5px var(--primary)' : 'inset 0 0 0 1px var(--border)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderBottom: '1px dashed var(--border)', fontSize: 11, color: 'var(--ink-subtle)' }}>
        <Icon name="chart" size={11} color="var(--ink-subtle)"/>
        <span>Untitled Chart</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, padding: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--primary-soft, rgba(229,138,42,0.12))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="data" size={15} color="var(--primary)"/>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Chart has no bindings</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', textAlign: 'center', maxWidth: 280, lineHeight: 1.5 }}>
          Drag fields from the Bindings panel onto X, Y, or Color — or click <span style={{ color: 'var(--ink)', fontWeight: 500 }}>Auto-suggest</span> to let Composer pick a starting layout.
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <button style={{ height: 26, padding: '0 12px', borderRadius: 5, background: 'var(--primary)', color: '#fff', fontSize: 11.5, fontWeight: 600 }}>Auto-suggest</button>
          <button style={{ height: 26, padding: '0 12px', borderRadius: 5, background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--border)', color: 'var(--ink)', fontSize: 11.5, fontWeight: 500 }}>Open bindings</button>
        </div>
        {t && t.showAssistantHint && (
          <button onClick={t.onOpenAssistant} style={{ ...es.assistHint, marginTop: 6 }}>
            <Icon name="sparkle" size={11} color="var(--primary)"/>
            <span>Need a starting layout? <span style={{ color: 'var(--ink)', fontWeight: 500 }}>Ask AI</span></span>
          </button>
        )}
      </div>
    </div>
  );
}

// Floating selection toolbar — the chip that floats above the selected widget.
//
// Supports two styles (toggled via Tweaks → Selection toolbar):
//
//   'peers'   — original. Three equal-weight verbs side by side
//               (Change type · Bindings · Format). Reads like a quick-action menu.
//
//   'primary' — NEW. For charts only, since charts have a dedicated full-screen
//               editor. One filled primary button "Edit chart" leads to the deep
//               surface; the inline type picker stays on the canvas because it's
//               a common tweak; Format is secondary; Bindings is dropped
//               (now belongs inside the editor). Mirrors how Figma surfaces
//               components: one obvious door inward, plus a couple of inline tweaks.
function SelectionToolbar({ x, y, widgetType, style = 'peers', chartType = 'Column', onOpenEditor, onChartType }) {
  if (widgetType === 'chart' && style === 'primary') {
    return <SelectionToolbarPrimary x={x} y={y} chartType={chartType} onOpenEditor={onOpenEditor} onChartType={onChartType}/>;
  }
  const verbs = {
    table:    [{ id: 'type',     icon: 'crosstab', label: 'Change type' }, { id: 'bindings', icon: 'data', label: 'Bindings' }, { id: 'format', icon: 'paint', label: 'Format' }],
    chart:    [{ id: 'type',     icon: 'chart',    label: 'Change type' }, { id: 'bindings', icon: 'data', label: 'Bindings' }, { id: 'format', icon: 'paint', label: 'Format' }],
  }[widgetType] || [];
  return (
    <div style={{ position: 'absolute', left: x, top: y - 36, display: 'inline-flex', gap: 0, alignItems: 'center', background: 'var(--ink)', color: '#fff', borderRadius: 6, padding: 2, boxShadow: '0 6px 20px -6px rgba(0,0,0,0.35)' }}>
      {verbs.map((v, i) => (
        <React.Fragment key={v.label}>
          {i > 0 && <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.12)' }}/>}
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 24, padding: '0 8px', borderRadius: 4, color: '#fff', fontSize: 11, fontWeight: 500, cursor: v.id === 'bindings' ? 'pointer' : 'default' }}
                  onClick={v.id === 'bindings' ? onOpenEditor : undefined}
                  title={v.id === 'bindings' ? 'Open chart editor (Bindings)' : v.label}>
            <Icon name={v.icon} size={11} color="#fff"/>
            <span>{v.label}</span>
          </button>
        </React.Fragment>
      ))}
      <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.12)' }}/>
      <button style={{ width: 22, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', borderRadius: 4 }}><Icon name="more" size={12}/></button>
      {/* Pointer */}
      <div style={{ position: 'absolute', left: 16, bottom: -4, width: 8, height: 8, background: 'var(--ink)', transform: 'rotate(45deg)' }}/>
    </div>
  );
}

// Primary-action variant of the chart toolbar. The filled "Edit chart" button
// IS the affordance users were missing: a discoverable, can't-miss door into
// the dedicated chart binding editor.
function SelectionToolbarPrimary({ x, y, chartType, onOpenEditor, onChartType }) {
  const types = ['Column', 'Bar', 'Line', 'Area', 'Pie', 'Scatter'];
  const [typeOpen, setTypeOpen] = useState(false);
  return (
    <div style={{ position: 'absolute', left: x, top: y - 38, display: 'inline-flex', gap: 0, alignItems: 'center', background: 'var(--ink)', color: '#fff', borderRadius: 6, padding: 3, boxShadow: '0 6px 20px -6px rgba(0,0,0,0.35)' }}>
      {/* Primary — filled, prominent. Opens the chart editor. */}
      <button onClick={onOpenEditor}
              title="Open chart editor (\u23CE)"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 24, padding: '0 10px 0 9px', borderRadius: 4, background: 'var(--primary)', color: '#fff', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 0 rgba(0,0,0,0.2)' }}>
        <Icon name="edit" size={11} color="#fff"/>
        <span>Edit chart</span>
      </button>
      <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.12)', margin: '0 2px' }}/>
      {/* Inline chart-type picker — stays on the canvas because it's a common
          tweak that doesn't justify a context switch. */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => setTypeOpen(o => !o)}
                title="Change chart type"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 24, padding: '0 6px 0 8px', borderRadius: 4, color: '#fff', fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>
          <Icon name="chart" size={11} color="#fff"/>
          <span>{chartType}</span>
          <Icon name="chevron-d" size={10} color="rgba(255,255,255,0.7)"/>
        </button>
        {typeOpen && (
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, minWidth: 132, background: 'var(--ink)', borderRadius: 6, padding: 4, boxShadow: '0 8px 24px -6px rgba(0,0,0,0.4)', zIndex: 10 }}>
            {types.map(tp => (
              <button key={tp}
                      onClick={() => { onChartType && onChartType(tp); setTypeOpen(false); }}
                      style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8, height: 24, padding: '0 8px', borderRadius: 4, color: '#fff', fontSize: 11, textAlign: 'left',
                               background: tp === chartType ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
                <span style={{ width: 10, fontSize: 10, color: tp === chartType ? 'var(--primary)' : 'transparent' }}>✓</span>
                <span>{tp}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.12)', margin: '0 2px' }}/>
      {/* Format — secondary, plain. Edits the container (fill, border, size). */}
      <button title="Format container"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 24, padding: '0 8px', borderRadius: 4, color: '#fff', fontSize: 11, fontWeight: 500 }}>
        <Icon name="paint" size={11} color="#fff"/>
        <span>Format</span>
      </button>
      <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.12)' }}/>
      <button title="More…"
              style={{ width: 22, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', borderRadius: 4 }}>
        <Icon name="more" size={12}/>
      </button>
      {/* Pointer */}
      <div style={{ position: 'absolute', left: 22, bottom: -4, width: 8, height: 8, background: 'var(--ink)', transform: 'rotate(45deg)' }}/>
    </div>
  );
}

// =================================================================
// NoTabsHints — the StyleBI ComposerEmptyEditor cold-start.
// Mirrors the real Angular component: two big affordances stacked
// in the empty canvas area inviting the user to create their first
// Worksheet (data) or Viewsheet (dashboard). No frame chrome — this
// IS the canvas when nothing is open.
// =================================================================
function NoTabsHints() {
  const rows = [
    {
      kind: 'ws',  icon: 'data', tint: 'var(--info)', tintSoft: 'var(--info-soft)',
      title: 'New Worksheet',
      body: 'Shape and combine data sources into a reusable query. Worksheets are the data behind dashboards.',
      kbd: '\u2318\u21E7W',
    },
    {
      kind: 'vs',  icon: 'doc', tint: 'var(--primary)', tintSoft: 'var(--primary-soft, rgba(229,138,42,0.12))',
      title: 'New Dashboard',
      body: 'Author charts, tables, crosstabs, and filters on a canvas, then bind them to data.',
      kbd: '\u2318N',
    },
  ];
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 296px 0 296px',
    }}>
      <div style={{ width: 560, display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'stretch' }}>
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
            Composer
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-subtle)', marginTop: 4 }}>
            Nothing open. Create a worksheet or dashboard to begin.
          </div>
        </div>
        {rows.map(r => (
          <button key={r.kind} style={{
            display: 'flex', alignItems: 'flex-start', gap: 16,
            padding: '18px 20px', borderRadius: 10, textAlign: 'left',
            background: 'var(--surface)',
            boxShadow: 'inset 0 0 0 1px var(--border)',
            cursor: 'pointer',
          }}>
            <div style={{
              width: 40, height: 40, flexShrink: 0, borderRadius: 8,
              background: r.tintSoft,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={r.icon} size={18} color={r.tint}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{r.title}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.5, marginTop: 3 }}>{r.body}</div>
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-subtle)',
              padding: '3px 7px', borderRadius: 4,
              boxShadow: 'inset 0 0 0 1px var(--hairline)', alignSelf: 'flex-start',
            }}>
              {r.kbd}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ t }) {
  const starters = [
    { icon: 'toolbox', title: 'Drag a widget',   body: 'Open Toolbox and drop a Chart, Crosstab, or Selection onto the canvas.', kbd: 'T' },
    { icon: 'data',    title: 'Connect data',    body: 'Pick a worksheet or data source. Composer infers an initial layout.',  kbd: 'D' },
    { icon: 'sparkle', title: 'From a template', body: 'Start from KPI Overview, Sales Funnel, or Cohort Explorer.',             kbd: '\u2318N' },
  ];
  const HEAD_SIZE = { S: 14, M: 16, L: 20 }[t.headingSize] || 16;
  const cardStyle = {
    outlined: { background: 'var(--surface)', border: '1px solid var(--hairline)' },
    filled:   { background: 'var(--primary-tint)', border: '1px solid transparent' },
    minimal:  { background: 'transparent', border: '1px solid transparent' },
  }[t.cardStyle] || { background: 'var(--surface)', border: '1px solid var(--hairline)' };
  const iconBg = t.iconBg
    ? { background: 'var(--primary-soft, rgba(229,138,42,0.12))' }
    : { background: 'transparent' };
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8% 8%', gap: t.showSubheading ? 18 : 22 }}>
      <div style={{ fontSize: HEAD_SIZE, fontWeight: 600, color: 'var(--ink)' }}>{t.heading}</div>
      {t.showSubheading && (
        <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: -10 }}>{t.subheading}</div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, width: '100%', maxWidth: 560 }}>
        {starters.map(s => (
          <div key={s.title} style={{ ...es.card, ...cardStyle }}>
            <div style={{ ...es.iconWrap, ...iconBg }}><Icon name={s.icon} size={16} color="var(--primary)"/></div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{s.title}</div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-muted)', lineHeight: 1.4 }}>{s.body}</div>
            {t.showKbd && <div style={es.kbd}>{s.kbd}</div>}
          </div>
        ))}
      </div>
      {t.showAssistantHint && (
        <button onClick={t.onOpenAssistant} style={es.assistHint} title="Open the chat assistant">
          <Icon name="sparkle" size={11} color="var(--primary)"/>
          <span>Stuck? <span style={{ color: 'var(--ink)', fontWeight: 500 }}>Ask AI</span></span>
          <Icon name="chevron-r" size={10} color="var(--ink-subtle)"/>
        </button>
      )}
    </div>
  );
}
const es = {
  card: {
    position: 'relative',
    background: 'var(--surface)',
    border: '1px solid var(--hairline)',
    borderRadius: 8,
    padding: '14px 12px 16px',
    display: 'flex', flexDirection: 'column', gap: 6,
  },
  iconWrap: {
    width: 28, height: 28, borderRadius: 6,
    background: 'var(--primary-soft, rgba(229,138,42,0.12))',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  kbd: {
    position: 'absolute', top: 10, right: 10,
    fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--ink-subtle)',
    border: '1px solid var(--border)', borderRadius: 3, padding: '1px 4px',
    background: 'var(--chrome)',
  },
  prompt: {
    display: 'flex', alignItems: 'center', gap: 6,
    width: '100%', maxWidth: 560, height: 36, padding: '0 6px 0 12px',
    background: 'var(--surface)', borderRadius: 8,
    boxShadow: 'inset 0 0 0 1px var(--border)',
  },
  assistHint: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    height: 26, padding: '0 8px 0 10px', borderRadius: 999,
    background: 'transparent',
    boxShadow: 'inset 0 0 0 1px var(--hairline)',
    fontSize: 11, color: 'var(--ink-muted)', cursor: 'pointer',
  },
};

function CanvasTable({ y, label, w, selected, onSelect }) {
  const x = 60;
  const cols = ['Accident', 'Date', 'Delay Reason'];
  const openSort = (e, col) => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    window.__composerDialogs?.setSortAnchor({ x: r.left, y: r.bottom + 4, col });
  };
  return (
    <div onClick={onSelect} style={{
      position: 'absolute', left: x, top: y, width: w, cursor: 'pointer',
      ...(selected ? { boxShadow: '0 0 0 2px var(--primary)', borderRadius: 4 } : null),
    }}>
      <div style={{ position: 'absolute', top: -18, left: 0, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 7px', fontSize: 10, fontWeight: 600, color: selected ? 'var(--primary)' : 'var(--ink-subtle)' }}>
        <Icon name="table" size={10}/>
        <span>{label}</span>
      </div>
      <div style={{ background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ display: 'flex', background: '#F4F2EC', borderBottom: '1px solid var(--border)' }}>
          {cols.map((c, i) => (
            <div key={c} onClick={(e) => openSort(e, c)} style={{ flex: 1, padding: '5px 8px', fontSize: 10, fontWeight: 600, color: 'var(--ink)', borderRight: i < cols.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{c}</span>
              <span style={{ opacity: 0.5, fontSize: 9 }}>▾</span>
            </div>
          ))}
        </div>
        {[['3','2018-09-28','No Delay'], ['7','2018-10-04','Material'], ['12','2018-10-11','Weather']].map((row, r) => (
          <div key={r} style={{ display: 'flex', borderBottom: r < 2 ? '1px solid var(--hairline)' : 'none' }}>
            {row.map((v, i) => (
              <div key={i} style={{ flex: 1, padding: '5px 8px', fontSize: 10, color: 'var(--ink-default)', borderRight: i < 2 ? '1px solid var(--hairline)' : 'none' }}>{v}</div>
            ))}
          </div>
        ))}
      </div>
      {selected && <Handles/>}
    </div>
  );
}
// CanvasChart — mock chart widget on the viewsheet canvas. Renders a
// small column-chart preview with axis ticks. Clickable: invoking it
// opens the full-screen chart binding editor (matches the StyleBI
// double-click-to-edit-chart behaviour). Selected state mirrors
// CanvasTable so the two read as siblings on the canvas.
function CanvasChart({ y, label, w, selected, onOpen, onClick }) {
  const x = 60;
  const bars = [
    { region: 'West',     v: 78, fam: 'Concrete' },
    { region: 'Central',  v: 92, fam: 'Steel'    },
    { region: 'East',     v: 64, fam: 'Concrete' },
    { region: 'South',    v: 48, fam: 'Lumber'   },
    { region: 'North',    v: 71, fam: 'Steel'    },
    { region: 'Mountain', v: 55, fam: 'Lumber'   },
  ];
  // Series color via simple family → swatch lookup.
  const famColor = { Concrete: '#4B7BD9', Steel: '#E58A2A', Lumber: '#7A9E5C' };
  const families = ['Concrete', 'Steel', 'Lumber'];
  return (
    <div onClick={onClick} style={{
      position: 'absolute', left: x, top: y, width: w, cursor: 'pointer',
      ...(selected ? { boxShadow: '0 0 0 2px var(--primary)', borderRadius: 4 } : null),
    }}>
      <div style={{ position: 'absolute', top: -18, left: 0, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 7px', fontSize: 10, fontWeight: 600, color: selected ? 'var(--primary)' : 'var(--ink-subtle)' }}>
        <Icon name="chart" size={10}/>
        <span>{label}</span>
      </div>
      <div onDoubleClick={onOpen}
           title="Double-click to edit chart"
           style={{ background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden', cursor: 'pointer' }}>
        {/* Chart title */}
        <div style={{ padding: '8px 12px 4px', fontSize: 11, fontWeight: 600, color: 'var(--ink)' }}>
          Revenue by Region
        </div>
        {/* Plot + Y axis */}
        <div style={{ display: 'flex', padding: '4px 12px 6px', gap: 6, height: 180 }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: 9, color: 'var(--ink-subtle)', fontFamily: 'var(--font-mono)', textAlign: 'right', paddingTop: 2, paddingBottom: 18 }}>
            <span>$100K</span><span>$75K</span><span>$50K</span><span>$25K</span><span>$0</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {/* Plot area with gridlines + bars */}
            <div style={{ flex: 1, position: 'relative', borderLeft: '1px solid var(--hairline)', borderBottom: '1px solid var(--hairline)' }}>
              {/* Gridlines */}
              {[0.25, 0.5, 0.75].map((p) => (
                <div key={p} style={{ position: 'absolute', left: 0, right: 0, top: `${(1-p) * 100}%`, height: 1, background: 'var(--hairline)' }}/>
              ))}
              {/* Bars */}
              <div style={{ position: 'absolute', inset: 0, padding: '6px 4px 0', display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                {bars.map((b, i) => (
                  <div key={i} style={{ flex: 1, height: `${b.v}%`, background: famColor[b.fam], borderRadius: '2px 2px 0 0', minHeight: 4 }}/>
                ))}
              </div>
            </div>
            {/* X-axis labels */}
            <div style={{ display: 'flex', gap: 8, padding: '4px 4px 0', fontSize: 9, color: 'var(--ink-muted)' }}>
              {bars.map((b) => (
                <div key={b.region} style={{ flex: 1, textAlign: 'center' }}>{b.region}</div>
              ))}
            </div>
          </div>
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', gap: 12, padding: '0 12px 8px', fontSize: 9.5, color: 'var(--ink-muted)' }}>
          {families.map(f => (
            <div key={f} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, background: famColor[f], borderRadius: 2 }}/>
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>
      {selected && <Handles/>}
    </div>
  );
}

function Handles() {
  const dots = [
    { top: -3, left: -3 }, { top: -3, right: -3 },
    { bottom: -3, left: -3 }, { bottom: -3, right: -3 },
  ];
  return dots.map((s, i) => (
    <div key={i} style={{ position: 'absolute', width: 6, height: 6, background: '#fff', border: '1.5px solid var(--primary)', borderRadius: 1, ...s }}/>
  ));
}
// Bottom cluster — zoom + canvas modes merged into a single chip (right-aligned).
function BottomCluster() {
  const [mode, setMode] = useState('select');
  const modes = [
    { id: 'select',    icon: 'arrange', label: 'Select (V)' },
    { id: 'snap-grid', icon: 'snap',    label: 'Snap to Grid (G)' },
    { id: 'annotate',  icon: 'pin',     label: 'Annotation (M)' },
  ];
  return (
    <div style={bc.cluster}>
      {modes.map(m => (
        <button key={m.id}
                style={{ ...bc.btn, ...(mode === m.id ? bc.btnActive : null) }}
                onClick={() => setMode(m.id)}
                title={m.label}>
          <Icon name={m.icon} size={12} color={mode === m.id ? '#fff' : 'var(--ink)'}/>
        </button>
      ))}
    </div>
  );
}
const bc = {
  cluster: {
    position: 'absolute', bottom: 16, right: 16,
    display: 'inline-flex', alignItems: 'center', gap: 2, height: 34, padding: 3,
    borderRadius: 8, background: 'var(--chrome)', boxShadow: 'var(--shadow-float)',
    fontSize: 11, fontWeight: 500, color: 'var(--ink)', zIndex: 6,
  },
  btn: { width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, color: 'var(--ink)' },
  btnActive: { background: 'var(--primary)', color: '#fff' },
};

// =================================================================
// LeftRail — vertical activity bar (VS Code / Cursor pattern). Owns
// which panels are visible. Top group: editor panels (Assets, Toolbox,
// Components, Inspector). Bottom: Assistant.
// Clicking a rail icon toggles its panel; for the three left-panel
// tabs, clicking switches content if already open.
// =================================================================
function railToolboxSvg() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h18v11a1 1 0 01-1 1H4a1 1 0 01-1-1V8z"/><path d="M8 8V5a2 2 0 012-2h4a2 2 0 012 2v3"/><path d="M3 13h18"/></svg>;
}
function LeftRail({ leftTab, leftOpen, onLeftTab, rightOpen, onToggleRight, assistantOpen, onToggleAssistant }) {
  const top = [
    { id: 'assets',     label: 'Assets',     icon: 'data' },
    { id: 'toolbox',    label: 'Toolbox',    svg: railToolboxSvg() },
    { id: 'components', label: 'Components', icon: 'arrange' },
  ];
  const isActive = (id) => leftOpen && leftTab === id;
  return (
    <div style={rail.bar} aria-label="Activity bar">
      {top.map(it => {
        const on = isActive(it.id);
        return (
          <button key={it.id} onClick={() => onLeftTab(it.id)} title={it.label}
                  style={{ ...rail.btn, ...(on ? rail.btnOn : null) }}>
            <span style={{ color: on ? 'var(--primary)' : 'var(--ink-muted)', display: 'inline-flex' }}>
              {it.svg ? it.svg : <Icon name={it.icon} size={16}/>}
            </span>
          </button>
        );
      })}
      <div style={rail.sep}/>
      <button onClick={onToggleRight} title="Inspector"
              style={{ ...rail.btn, ...(rightOpen ? rail.btnOn : null) }}>
        <Icon name="options" size={16} color={rightOpen ? 'var(--primary)' : 'var(--ink-muted)'}/>
      </button>
      <div style={{ flex: 1 }}/>
      <button onClick={onToggleAssistant} title="Ask AI"
              style={{ ...rail.btn, ...(assistantOpen ? rail.btnOn : null) }}>
        <Icon name="sparkle" size={16} color={assistantOpen ? 'var(--primary)' : 'var(--ink-muted)'}/>
      </button>
    </div>
  );
}
const rail = {
  bar: {
    width: 44, flex: '0 0 44px',
    background: 'var(--chrome)',
    borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '6px 0', gap: 2,
  },
  btn: {
    position: 'relative', width: 32, height: 32,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 6, color: 'var(--ink-muted)',
  },
  btnOn: { background: 'var(--primary-soft, rgba(229,138,42,0.10))' },
  activeStripe: {
    position: 'absolute', left: -6, top: 6, bottom: 6, width: 2,
    background: 'var(--primary)', borderRadius: '0 2px 2px 0',
  },
  sep: { width: 20, height: 1, background: 'var(--border)', margin: '4px 0' },
};

// =================================================================
// StatusBar — passive readouts across the full width below the canvas.
// Selection / binding / save state on the left; zoom + grid + snap on
// the right. Tool modes (Select/Pan/Annotate) stay floating on the
// canvas — those are TOOLS, not status.
// =================================================================
function StatusBar({ stage }) {
  const [zoom, setZoom] = useState(100);
  const [snap, setSnap] = useState(true);
  const [grid, setGrid] = useState(true);
  const populated = stage === 'populated' || stage === 'emptyWidget';
  return (
    <div style={sb.bar} role="status">
      <button style={sb.item} title="Console — 0 messages">
        <Icon name="console" size={12}/>
        <span>Console</span>
        <span style={sb.dot}/>
      </button>
      <div style={sb.sep}/>
      <button style={sb.item} title="Bound data source">
        <Icon name="data" size={12} color="var(--info)"/>
        <span style={{ color: 'var(--info)', fontWeight: 500 }}>Construction Data</span>
      </button>
      {populated && (<>
        <div style={sb.sep}/>
        <span style={sb.item}>
          <Icon name="chart" size={12}/>
          <span>Chart · </span>
          <span style={sb.mono}>Column · 3 fields bound</span>
        </span>
      </>)}
      <div style={{ flex: 1 }}/>
      <span style={sb.saved}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: '#2E8B57' }}/>
        Saved · 2m ago
      </span>
      <div style={sb.sep}/>
      <button style={sb.item} onClick={() => setGrid(g => !g)} title="Show grid (Cmd+')">
        <Icon name="snap" size={12} color={grid ? 'var(--primary)' : 'var(--ink-muted)'}/>
        <span style={{ color: grid ? 'var(--ink)' : 'var(--ink-muted)' }}>Grid</span>
      </button>
      <button style={sb.item} onClick={() => setSnap(s => !s)} title="Snap to grid (Shift+G)">
        <span style={{ color: snap ? 'var(--ink)' : 'var(--ink-muted)' }}>Snap</span>
      </button>
      <div style={sb.sep}/>
      <button style={sb.zoomBtn} onClick={() => setZoom(z => Math.max(25, z - 10))} title="Zoom out">−</button>
      <span style={sb.zoomVal}>{zoom}%</span>
      <button style={sb.zoomBtn} onClick={() => setZoom(z => Math.min(400, z + 10))} title="Zoom in">+</button>
    </div>
  );
}
const sb = {
  bar: {
    flex: '0 0 26px', height: 26,
    display: 'flex', alignItems: 'center', gap: 0,
    padding: '0 4px 0 8px',
    background: 'var(--chrome)',
    borderTop: '1px solid var(--border)',
    fontSize: 11, color: 'var(--ink-muted)',
  },
  item: {
    height: 22, padding: '0 8px',
    display: 'inline-flex', alignItems: 'center', gap: 5,
    borderRadius: 4, color: 'var(--ink)',
  },
  sep: { width: 1, height: 14, background: 'var(--border)', margin: '0 2px' },
  dot: { width: 5, height: 5, borderRadius: 999, background: '#2E8B57', marginLeft: 2 },
  mono: { fontFamily: 'var(--font-mono)', color: 'var(--ink-subtle)' },
  saved: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0 8px', color: 'var(--ink-muted)' },
  zoomBtn: { width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, fontSize: 13, color: 'var(--ink-muted)' },
  zoomVal: { fontFamily: 'var(--font-mono)', padding: '0 4px', color: 'var(--ink)', minWidth: 38, textAlign: 'center' },
};

const cv = {
  world: { position: 'absolute', inset: 0, overflow: 'hidden' },
  bg: {
    position: 'absolute', inset: 0,
    background: '#EEEBE4',
    backgroundImage: 'radial-gradient(circle, #DDD8CC 1px, transparent 1px)',
    backgroundSize: '24px 24px',
    backgroundPosition: '0 0',
    opacity: 0.7,
  },
  frameWrap: { position: 'absolute', top: 48, width: 720, paddingBottom: 32 },
  frameLabel: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 0 6px 4px', fontSize: 11, fontWeight: 600, color: 'var(--ink)' },
  frameMeta: { color: 'var(--ink-subtle)', fontWeight: 400, fontFamily: 'var(--font-mono)', marginLeft: 6 },
  frame: {
    position: 'relative', width: 720, height: 540,
    background: '#FFFFFF', borderRadius: 4,
    boxShadow: '0 0 0 1px var(--border), 0 8px 30px -10px rgba(40,30,15,0.12)',
  },
  emptyWrap: { position: 'absolute', top: 48, width: 620, paddingBottom: 32 },
  emptyFrame: {
    position: 'relative', width: 620, height: 540,
    background: '#FFFFFF', borderRadius: 4,
    boxShadow: '0 0 0 1px var(--border), 0 8px 30px -10px rgba(40,30,15,0.12)',
  },
};

// =================================================================
// Tweak defaults — empty-state copy + layout
// =================================================================
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "stage": "noTabs",
  "heading": "Start your dashboard",
  "subheading": "Three ways to begin.",
  "showSubheading": true,
  "headingSize": "M",
  "cardStyle": "outlined",
  "iconBg": true,
  "showKbd": true,
  "showAssistantPill": true,
  "showAssistantHint": true,
  "showRail": true,
  "showStatusBar": true,
  "chartToolbarStyle": "primary",
  "dockedPanels": false
}/*EDITMODE-END*/;

// =================================================================
// AssistantPanel — docked chat surface. Slides in from the right,
// pushes nothing (overlay above the inspector). Mirrors the portal's
// always-visible chat-button → chat-panel pattern.
// =================================================================
function AssistantPanel({ onClose }) {
  const [text, setText] = useState('');
  const messages = [
    { role: 'bot',  body: "Hi — I'm the StyleBI assistant. Ask me how to bind data, format a chart, write a script, or share this dashboard." },
    { role: 'user', body: 'How do I change the chart type?' },
    { role: 'bot',  body: "Select the chart on the canvas, then on the right panel open the Bindings tab. The chart-type picker is at the top of that tab — you can switch between Bar, Line, Area, Scatter, Pie, and 14 other chart types without losing your bindings." },
  ];
  return (
    <div style={ap.panel} role="dialog" aria-label="StyleBI assistant">
      <div style={ap.header}>
        <Icon name="sparkle" size={14} color="var(--primary)"/>
        <div style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>Assistant</div>
        <button style={ap.headerBtn} title="New conversation"><Icon name="plus" size={12}/></button>
        <button style={ap.headerBtn} onClick={onClose} title="Close"><Icon name="close" size={12}/></button>
      </div>
      <div style={ap.thread}>
        {messages.map((m, i) => (
          <div key={i} style={{ ...ap.msg, ...(m.role === 'user' ? ap.msgUser : ap.msgBot) }}>
            <div style={ap.msgBody}>{m.body}</div>
          </div>
        ))}
      </div>
      <div style={ap.composer}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask anything about this dashboard…"
          style={ap.input}
        />
        <button style={ap.send} disabled={!text.trim()} title="Send">
          <Icon name="chevron-r" size={12} color={text.trim() ? '#fff' : 'var(--ink-subtle)'}/>
        </button>
      </div>
      <div style={ap.disclaimer}>The assistant is a chatbot. It explains Composer and suggests next steps — it does not take actions on your dashboard.</div>
    </div>
  );
}
const ap = {
  panel: {
    position: 'absolute', top: 8, right: 8, bottom: 8, width: 340,
    background: 'var(--surface)', borderRadius: 10,
    boxShadow: '0 12px 32px rgba(13,15,17,0.18), 0 0 0 1px var(--border)',
    display: 'flex', flexDirection: 'column', zIndex: 20,
  },
  header: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 10px 10px 12px', borderBottom: '1px solid var(--hairline)' },
  headerBtn: { width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 5, color: 'var(--ink-muted)' },
  thread: { flex: 1, overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 },
  msg: { maxWidth: '85%', borderRadius: 8, padding: '8px 10px', fontSize: 12, lineHeight: 1.5 },
  msgBot:  { background: 'var(--chrome)', color: 'var(--ink)', alignSelf: 'flex-start' },
  msgUser: { background: 'var(--primary)', color: '#fff', alignSelf: 'flex-end' },
  msgBody: { whiteSpace: 'pre-wrap' },
  composer: { display: 'flex', alignItems: 'center', gap: 6, padding: 8, borderTop: '1px solid var(--hairline)' },
  input: { flex: 1, height: 32, padding: '0 10px', borderRadius: 6, border: 0, outline: 0, background: 'var(--chrome)', fontSize: 12, color: 'var(--ink)', fontFamily: 'var(--font-sans, inherit)' },
  send: { width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: 'var(--primary)' },
  disclaimer: { padding: '8px 12px 10px', fontSize: 10.5, color: 'var(--ink-subtle)', lineHeight: 1.5, borderTop: '1px solid var(--hairline)' },
};

// =================================================================
// BindingEditorOverlay — Option B chart editor.
// Slides in from the right as an overlay, leaving the composer
// chrome visible behind a dimmed scrim. Reuses existing
// vs-binding-pane content (mocked here as the same 3-column layout
// from composer-binding-editor-v3.html).
// =================================================================
function BindingEditorOverlay({ onClose }) {
  return (
    <>
      <div onClick={onClose} style={beo.scrim}/>
      <div style={beo.shell} role="dialog" aria-label="Chart editor">
        <div style={beo.header}>
          <button onClick={onClose} style={beo.backChip} title="Return to composer">
            <Icon name="chevron-l" size={11} color="var(--ink-muted)"/>
            <span style={{ color: 'var(--ink-muted)' }}>Back to Composer ·</span>
            <span style={{ color: 'var(--ink)', fontWeight: 500 }}>Sales Dashboard</span>
          </button>
          <div style={{ flex: 1 }}/>
          <button onClick={onClose} style={beo.cancel}>Cancel</button>
          <button onClick={onClose} style={beo.done}>
            <Icon name="check" size={11} color="#fff"/>
            <span>Done</span>
          </button>
        </div>
        <div style={beo.titleBar}>
          <Icon name="chart" size={14} color="var(--primary)"/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Edit chart bindings</div>
            <div style={{ fontSize: 11, color: 'var(--ink-subtle)' }}>Revenue by Region · Construction Data</div>
          </div>
        </div>
        <div style={beo.body}>
          {/* Left: data picker */}
          <div style={beo.col}>
            <div style={beo.colHdr}>Construction Data</div>
            <div style={beo.search}>
              <Icon name="search" size={11} color="var(--ink-subtle)"/>
              <span style={{ color: 'var(--ink-subtle)' }}>Search columns</span>
            </div>
            {[
              { kind: 'dim',  name: 'Date',          icon: 'calendar' },
              { kind: 'dim',  name: 'Region',        icon: 'selection-list' },
              { kind: 'dim',  name: 'Salesperson',   icon: 'text' },
              { kind: 'dim',  name: 'Deal stage',    icon: 'selection-list' },
              { kind: 'meas', name: 'Revenue',       icon: 'gauge' },
              { kind: 'meas', name: 'Avg deal size', icon: 'gauge' },
              { kind: 'meas', name: 'Accounts',      icon: 'gauge' },
            ].map((c, i) => (
              <div key={i} style={beo.dpRow}>
                <span style={{ ...beo.dpKind, color: c.kind === 'dim' ? '#5F8FE0' : '#2E8B57', borderColor: c.kind === 'dim' ? '#5F8FE0' : '#2E8B57' }}>{c.kind === 'dim' ? 'Dim' : 'Mea'}</span>
                <Icon name={c.icon} size={11} color="var(--ink-muted)"/>
                <span style={{ fontSize: 11, color: 'var(--ink)' }}>{c.name}</span>
              </div>
            ))}
          </div>
          {/* Center: shelves + preview */}
          <div style={beo.colMain}>
            <div style={beo.shelfBlock}>
              <div style={beo.colHdr}>Shelves</div>
              {[
                { l: 'X axis',  pills: [{ type: 'dim',  label: 'Date',           sub: 'By Month' }] },
                { l: 'Y axis',  pills: [{ type: 'meas', label: 'Revenue',        sub: 'Sum' }] },
                { l: 'Color',   pills: [{ type: 'dim',  label: 'Region' }] },
                { l: 'Detail',  pills: [{ type: 'dim',  label: 'Salesperson' }] },
                { l: 'Tooltip', pills: [{ type: 'meas', label: 'Avg deal size', sub: 'Avg' }] },
                { l: 'Filters', pills: [{ type: 'filter', label: 'Date', sub: '≥ 2018-09-01' }] },
              ].map((s, i) => (
                <div key={i} style={beo.shelf}>
                  <div style={beo.shelfLbl}>{s.l}</div>
                  <div style={beo.shelfBin}>
                    {s.pills.map((p, j) => (
                      <div key={j} style={{ ...rp.pill, padding: '3px 6px', marginBottom: 0 }}>
                        <span style={{ ...rp.pillKind, color: p.type === 'dim' ? '#5F8FE0' : p.type === 'meas' ? '#2E8B57' : '#C97A3A', borderColor: p.type === 'dim' ? '#5F8FE0' : p.type === 'meas' ? '#2E8B57' : '#C97A3A' }}>{p.type === 'dim' ? 'Dim' : p.type === 'meas' ? 'Mea' : 'Flt'}</span>
                        <span style={rp.pillLabel}>{p.label}</span>
                        {p.sub && <span style={rp.pillSub}>{p.sub}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={beo.previewBox}>
              <div style={beo.colHdr}>Preview</div>
              <div style={beo.previewSurface}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: '100%' }}>
                  {[80, 110, 70, 130, 95, 60].map((h, i) => (
                    <div key={i} style={{ flex: 1, height: `${(h/140)*100}%`, background: ['#5F8FE0','#2E8B57','#C97A3A','#9B6BB1','#E58A2A','#6BA0B8'][i], borderRadius: '3px 3px 0 0' }}/>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
const beo = {
  scrim: { position: 'absolute', inset: 0, background: 'rgba(40,30,15,0.35)', zIndex: 100 },
  shell: { position: 'absolute', top: 0, right: 0, bottom: 0, width: '78%', minWidth: 920, background: 'var(--chrome)', boxShadow: '-12px 0 32px -8px rgba(40,30,15,0.25)', zIndex: 101, display: 'flex', flexDirection: 'column', animation: 'beoSlide 200ms ease-out forwards' },
  header: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid var(--hairline)', background: 'var(--surface)' },
  backChip: { display: 'inline-flex', alignItems: 'center', gap: 6, height: 26, padding: '0 10px 0 8px', borderRadius: 999, background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--border)', fontSize: 11 },
  cancel: { height: 26, padding: '0 12px', borderRadius: 5, color: 'var(--ink-muted)', fontSize: 11 },
  done: { display: 'inline-flex', alignItems: 'center', gap: 5, height: 26, padding: '0 12px', borderRadius: 5, background: 'var(--primary)', color: '#fff', fontSize: 11, fontWeight: 600 },
  titleBar: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '1px solid var(--hairline)' },
  body: { flex: 1, display: 'grid', gridTemplateColumns: '220px 1fr', gap: 0, overflow: 'hidden' },
  col: { padding: 14, borderRight: '1px solid var(--hairline)', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 4 },
  colMain: { padding: 14, display: 'grid', gridTemplateRows: '1fr 240px', gap: 12, overflow: 'hidden' },
  colHdr: { fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--ink-muted)', marginBottom: 8 },
  search: { display: 'flex', alignItems: 'center', gap: 6, height: 26, padding: '0 8px', borderRadius: 4, background: 'var(--surface-muted)', boxShadow: 'inset 0 0 0 1px var(--hairline)', marginBottom: 8 },
  dpRow: { display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', borderRadius: 4 },
  dpKind: { fontSize: 8, fontFamily: 'var(--font-mono)', fontWeight: 700, padding: '1px 3px', borderRadius: 3, border: '1px solid currentColor', lineHeight: 1, letterSpacing: 0.4, textTransform: 'uppercase' },
  shelfBlock: { background: 'var(--surface)', borderRadius: 6, boxShadow: 'inset 0 0 0 1px var(--hairline)', padding: 12, overflow: 'auto' },
  shelf: { display: 'grid', gridTemplateColumns: '76px 1fr', gap: 10, alignItems: 'start', marginBottom: 8 },
  shelfLbl: { fontSize: 11, color: 'var(--ink)', fontWeight: 500, paddingTop: 6 },
  shelfBin: { display: 'flex', flexWrap: 'wrap', gap: 6, padding: 6, borderRadius: 5, background: 'var(--surface-muted)', boxShadow: 'inset 0 0 0 1px var(--hairline)', minHeight: 32 },
  previewBox: { background: 'var(--surface)', borderRadius: 6, boxShadow: 'inset 0 0 0 1px var(--hairline)', padding: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  previewSurface: { flex: 1, padding: 8 },
};

// =================================================================
// App root
// =================================================================
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [leftOpen, setLeftOpen]           = useState(true);
  const [leftTab, setLeftTab]             = useState('toolbox');
  const [rightOpen, setRightOpen]         = useState(true);
  // Option B: selected widget drives the right-panel Bindings flavor.
  // chart → summary + "Open chart editor" CTA. table → inline editable shelf.
  const [selectedWidget, setSelectedWidget] = useState({ id: 'chart-1', kind: 'chart', name: 'Revenue by Region', source: 'Construction Data' });
  const [bindingEditorOpen, setBindingEditorOpen] = useState(false);
  // Bridge so Canvas / SelectionToolbar (rendered through stageT, not props)
  // can open the editor without prop-threading.
  window.__composerSetEditor = setBindingEditorOpen;
  // Dialog patterns (see specs/stage2/dialog-strategy.md)
  const [saveOpen, setSaveOpen]           = useState(false);
  const [importOpen, setImportOpen]       = useState(false);
  const [sortAnchor, setSortAnchor]       = useState(null);
  // Expose to children via window so we don't have to thread props
  // through Canvas / LeftPanel just for this demo.
  window.__composerDialogs = { setSaveOpen, setImportOpen, setSortAnchor };

  const onLeftTab = (id) => {
    if (leftOpen && leftTab === id) setLeftOpen(false);
    else { setLeftTab(id); setLeftOpen(true); }
  };
  const onOpenAssistant = () => setAssistantOpen(true);
  const stageT = { ...t, onOpenAssistant };
  const docked = !!t.dockedPanels;

  return (
    <div data-screen-label="01 Composer v3 — Webflow/Framer-era pattern"
         style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopBar stage={t.stage}
              assistantOn={t.showAssistantPill}
              assistantOpen={assistantOpen}
              onToggleAssistant={() => setAssistantOpen(o => !o)}
              panelsDocked={t.dockedPanels}
              onToggleDocked={() => setTweak('dockedPanels', !t.dockedPanels)}/>
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {t.showRail && (
          <LeftRail
            leftTab={leftTab} leftOpen={leftOpen} onLeftTab={onLeftTab}
            rightOpen={rightOpen} onToggleRight={() => setRightOpen(o => !o)}
            assistantOpen={assistantOpen} onToggleAssistant={() => setAssistantOpen(o => !o)}
          />
        )}
        {docked && leftOpen && (
          <LeftPanel docked tab={leftTab} onClose={() => setLeftOpen(false)}/>
        )}
        <div style={{ flex: 1, position: 'relative', background: '#EEEBE4', minHeight: 0 }}>
          <Canvas t={stageT}
                  selectedWidget={selectedWidget}
                  setSelectedWidget={setSelectedWidget}
                  setBindingEditorOpen={setBindingEditorOpen}/>
          {!docked && leftOpen && <LeftPanel tab={leftTab} onClose={() => setLeftOpen(false)}/>}
          {!docked && rightOpen && (
            <RightPanel hasSelection={t.stage === 'populated' || t.stage === 'emptyWidget'}
                        selectedWidget={selectedWidget}
                        onOpenEditor={() => setBindingEditorOpen(true)}
                        onClose={() => setRightOpen(false)}/>
          )}
          {assistantOpen && <AssistantPanel onClose={() => setAssistantOpen(false)}/>}
          {saveOpen   && <SaveModal       onClose={() => setSaveOpen(false)}/>}
          {importOpen && <ImportCsvSheet  onClose={() => setImportOpen(false)}/>}
          {sortAnchor && <SortPopover     at={sortAnchor} onClose={() => setSortAnchor(null)}/>}
        </div>
        {docked && rightOpen && (
          <RightPanel docked hasSelection={t.stage === 'populated' || t.stage === 'emptyWidget'}
                      selectedWidget={selectedWidget}
                      onOpenEditor={() => setBindingEditorOpen(true)}
                      onClose={() => setRightOpen(false)}/>
        )}
      </div>
      {t.showStatusBar && <StatusBar stage={t.stage}/>}
      {bindingEditorOpen && <BindingEditorOverlay onClose={() => setBindingEditorOpen(false)}/>}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Scenario">
          <TweakSelect
            label="Stage"
            value={t.stage}
            onChange={(v) => setTweak('stage', v)}
            options={[
              { value: 'noTabs',         label: '1 \u2014 No open tabs (cold start)' },
              { value: 'emptyWorksheet', label: '2 \u2014 New worksheet (no tables)' },
              { value: 'emptyViewsheet', label: '3 \u2014 New dashboard (no widgets)' },
              { value: 'emptyWidget',    label: '4 \u2014 Widget placed, no bindings' },
              { value: 'populated',      label: 'Reference \u2014 populated dashboard' },
            ]}
          />
          <div style={{ fontSize: 11, color: 'var(--ink-subtle)', lineHeight: 1.5, margin: '4px 0 0' }}>
            Switches the canvas between the four states Composer can be in. The empty-state controls below only affect stages that show the empty dashboard.
          </div>
        </TweakSection>
        <TweakSection label="Selection toolbar (chart)">
          <TweakRadio label="Style" value={t.chartToolbarStyle}
                      options={[{value:'primary',label:'Primary CTA'},{value:'peers',label:'Peer verbs'}]}
                      onChange={(v) => setTweak('chartToolbarStyle', v)}/>
          <div style={{ fontSize: 11, color: 'var(--ink-subtle)', lineHeight: 1.5, marginTop: 4 }}>
            <b>Primary CTA:</b> filled "Edit chart" leads to the dedicated editor; inline type dropdown stays on canvas; Bindings is dropped (now lives in the editor).<br/>
            <b>Peer verbs:</b> original \u2014 three equal verbs (Change type \u00b7 Bindings \u00b7 Format).
          </div>
        </TweakSection>
        <TweakSection label="Chrome">
          <TweakToggle label="Activity rail (left)" value={t.showRail} onChange={(v) => setTweak('showRail', v)}/>
          <TweakToggle label="Status bar (bottom)"  value={t.showStatusBar} onChange={(v) => setTweak('showStatusBar', v)}/>
          <TweakRadio  label="Side panels" value={t.dockedPanels ? 'docked' : 'overlay'}
                       options={[{value:'overlay',label:'Overlay'},{value:'docked',label:'Docked'}]}
                       onChange={(v) => setTweak('dockedPanels', v === 'docked')}/>
          <div style={{ fontSize: 11, color: 'var(--ink-subtle)', lineHeight: 1.5, marginTop: 4 }}>
            Rail toggles panels (Assets / Toolbox / Components / Inspector / Assistant). Status bar handles passive readouts — console, binding, save state, zoom. Tool modes (Select / Pan / Comment) stay floating on the canvas.
          </div>
        </TweakSection>
        {t.stage === 'emptyViewsheet' && (<>
        <TweakSection label="Empty state — Copy">
          <TweakText label="Heading"    value={t.heading}    onChange={(v) => setTweak('heading', v)}/>
          <TweakToggle label="Subheading" value={t.showSubheading} onChange={(v) => setTweak('showSubheading', v)}/>
          {t.showSubheading && (
            <TweakText label="Subheading text" value={t.subheading} onChange={(v) => setTweak('subheading', v)}/>
          )}
        </TweakSection>
        <TweakSection label="Layout">
          <TweakRadio label="Heading size" value={t.headingSize} options={['S','M','L']}
                      onChange={(v) => setTweak('headingSize', v)}/>
          <TweakRadio label="Card style"   value={t.cardStyle}
                      options={[{value:'outlined',label:'Outlined'},{value:'filled',label:'Filled'},{value:'minimal',label:'Minimal'}]}
                      onChange={(v) => setTweak('cardStyle', v)}/>
          <TweakToggle label="Icon tint"        value={t.iconBg}  onChange={(v) => setTweak('iconBg', v)}/>
          <TweakToggle label="Shortcut keys"    value={t.showKbd} onChange={(v) => setTweak('showKbd', v)}/>
        </TweakSection>
        <TweakSection label="AI assistant">
          <TweakToggle label="Show 'Ask AI' pill in top bar" value={t.showAssistantPill} onChange={(v) => setTweak('showAssistantPill', v)}/>
          <TweakToggle label="Inline hint in empty states" value={t.showAssistantHint} onChange={(v) => setTweak('showAssistantHint', v)}/>
          <div style={{ fontSize: 11, color: 'var(--ink-subtle)', lineHeight: 1.5, marginTop: 4 }}>
            The assistant is a chatbot, not a generation engine. It lives as a persistent destination, not a one-shot prompt baked into empty states.
          </div>
        </TweakSection>
        </>)}
      </TweaksPanel>

      <style>{`
        button:hover { background: var(--chrome-hover); }
        button[style*="background: var(--primary)"]:hover { background: var(--primary-hover) !important; }
        a:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}

// =================================================================
// Dialog patterns wired into composer-v3
// See specs/stage2/dialog-strategy.md and composer-dialogs-v3.html
// (demo gallery) for the full rationale + side-by-side comparison.
// =================================================================

const dlg = {
  scrim: {
    position: 'fixed', inset: 0, background: 'rgba(31,31,27,0.32)',
    zIndex: 200, animation: 'dlgFade 120ms ease-out',
  },
  // — Compact modal (Save) —
  modal: {
    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
    width: 440, background: 'var(--surface)', borderRadius: 8,
    boxShadow: 'var(--shadow-float)', zIndex: 201, overflow: 'hidden',
    animation: 'dlgPop 140ms ease-out',
  },
  modalHeader: {
    height: 44, padding: '0 16px', borderBottom: '1px solid var(--hairline)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  modalTitle: { fontSize: 13, fontWeight: 600, color: 'var(--ink)' },
  modalBody: { padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
  modalFooter: {
    padding: '12px 16px', borderTop: '1px solid var(--hairline)',
    display: 'flex', gap: 8, justifyContent: 'flex-end', background: 'var(--chrome)',
  },
  // — Side sheet (Import CSV) —
  sheet: {
    position: 'fixed', top: 0, right: 0, bottom: 0, width: '60%', minWidth: 720,
    background: 'var(--surface)', boxShadow: 'var(--shadow-float)', zIndex: 201,
    display: 'flex', flexDirection: 'column',
    animation: 'dlgSlide 180ms ease-out',
  },
  sheetHeader: {
    padding: '14px 20px', borderBottom: '1px solid var(--hairline)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  sheetEyebrow: { fontSize: 11, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  sheetTitle: { fontSize: 16, fontWeight: 600, color: 'var(--ink)' },
  closeX: {
    width: 28, height: 28, borderRadius: 6, display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center', color: 'var(--ink-muted)',
  },
  stepper: {
    padding: '10px 20px', borderBottom: '1px solid var(--hairline)',
    display: 'flex', alignItems: 'center', gap: 8, background: 'var(--chrome)',
  },
  stepDot: {
    width: 20, height: 20, borderRadius: 10, fontSize: 11, fontWeight: 600,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--border)', color: 'var(--ink-muted)',
  },
  stepDotActive: { background: 'var(--primary)', color: 'white', boxShadow: 'none' },
  stepDotDone:   { background: 'var(--primary-soft)', color: 'var(--primary-text)', boxShadow: 'none' },
  stepLabel: { fontSize: 12, color: 'var(--ink-muted)' },
  stepLabelActive: { color: 'var(--ink)', fontWeight: 600 },
  stepConn: { flex: 1, height: 1, background: 'var(--border)', maxWidth: 40 },
  sheetBody: { flex: 1, overflow: 'auto', padding: 20 },
  sheetFooter: {
    padding: '12px 20px', borderTop: '1px solid var(--hairline)',
    display: 'flex', gap: 8, alignItems: 'center', background: 'var(--chrome)',
  },
  // — Popover (Sort column) —
  popOutside: { position: 'fixed', inset: 0, zIndex: 200 },
  popover: {
    position: 'fixed', minWidth: 200, background: 'var(--surface)',
    borderRadius: 6, boxShadow: 'var(--shadow-float)', zIndex: 201,
    padding: 4,
  },
  popHeader: {
    padding: '8px 10px 6px', display: 'flex', alignItems: 'baseline',
    gap: 6, borderBottom: '1px solid var(--hairline)', marginBottom: 4,
  },
  popEyebrow: { fontSize: 10, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: 0.4 },
  popCol: { fontSize: 12, fontWeight: 600, color: 'var(--ink)' },
  popRow: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 8px', borderRadius: 4, fontSize: 12, color: 'var(--ink-default)',
    textAlign: 'left',
  },
  popRowOn: { background: 'var(--primary-tint)', color: 'var(--primary-text)' },
  popKbd: {
    marginLeft: 'auto', fontSize: 10, color: 'var(--ink-muted)',
    fontFamily: 'var(--font-mono)',
  },
  // — Form bits —
  fieldRow: { display: 'flex', flexDirection: 'column', gap: 5 },
  fieldLabel: { fontSize: 11, fontWeight: 600, color: 'var(--ink-default)' },
  fieldInput: {
    height: 30, padding: '0 10px', borderRadius: 5, fontSize: 12,
    background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--border)',
    color: 'var(--ink)', outline: 'none',
  },
  toggleRow: {
    display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink-default)',
  },
  toggle: (on) => ({
    width: 28, height: 16, borderRadius: 8, background: on ? 'var(--primary)' : 'var(--border-strong)',
    position: 'relative', flexShrink: 0, transition: 'background 120ms',
  }),
  toggleKnob: (on) => ({
    position: 'absolute', top: 2, left: on ? 14 : 2, width: 12, height: 12,
    borderRadius: 6, background: 'white', transition: 'left 120ms',
  }),
  btnPrimary: {
    height: 28, padding: '0 14px', borderRadius: 5, fontSize: 12, fontWeight: 600,
    background: 'var(--primary)', color: 'white',
  },
  btnGhost: {
    height: 28, padding: '0 12px', borderRadius: 5, fontSize: 12, fontWeight: 500,
    background: 'transparent', color: 'var(--ink-default)',
    boxShadow: 'inset 0 0 0 1px var(--border)',
  },
  btnSecondary: {
    height: 28, padding: '0 12px', borderRadius: 5, fontSize: 12, fontWeight: 500,
    background: 'var(--surface)', color: 'var(--ink-default)',
    boxShadow: 'inset 0 0 0 1px var(--border)',
  },
  // — Save layout helper —
  dropzone: {
    border: '1.5px dashed var(--border-strong)', borderRadius: 8,
    padding: '32px 20px', textAlign: 'center', background: 'var(--chrome)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
  },
  dropTitle: { fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginTop: 4 },
  dropHint:  { fontSize: 12, color: 'var(--ink-muted)' },
  dropLink:  { color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' },
  dropMeta:  { fontSize: 11, color: 'var(--ink-subtle)', marginTop: 4 },
};

function DlgField({ label, value, type = 'text', placeholder }) {
  const [v, setV] = useState(value);
  return (
    <div style={dlg.fieldRow}>
      <label style={dlg.fieldLabel}>{label}</label>
      <input style={dlg.fieldInput} type={type} value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)}/>
    </div>
  );
}
function DlgToggle({ label, defaultOn }) {
  const [on, setOn] = useState(!!defaultOn);
  return (
    <div style={dlg.toggleRow} onClick={() => setOn(!on)}>
      <div style={dlg.toggle(on)}><div style={dlg.toggleKnob(on)}/></div>
      <span style={{ cursor: 'pointer' }}>{label}</span>
    </div>
  );
}

function SaveModal({ onClose }) {
  return (
    <>
      <div style={dlg.scrim} onClick={onClose}/>
      <div style={dlg.modal}>
        <div style={dlg.modalHeader}>
          <div style={dlg.modalTitle}>Save dashboard</div>
          <button style={dlg.closeX} onClick={onClose} title="Close">
            <Icon name="close" size={14} color="currentColor"/>
          </button>
        </div>
        <div style={dlg.modalBody}>
          <DlgField label="Name" value="Sales Dashboard"/>
          <DlgField label="Folder" value="/Reports/Sales/2025"/>
          <DlgField label="Description (optional)" value=""/>
          <DlgToggle label="Save as snapshot (version)"/>
        </div>
        <div style={dlg.modalFooter}>
          <button style={dlg.btnGhost} onClick={onClose}>Cancel</button>
          <button style={dlg.btnPrimary} onClick={onClose}>Save</button>
        </div>
      </div>
    </>
  );
}

function ImportCsvSheet({ onClose }) {
  const [step, setStep] = useState(1);
  const labels = ['File', 'Mapping', 'Preview', 'Commit'];
  return (
    <>
      <div style={dlg.scrim} onClick={onClose}/>
      <div style={dlg.sheet}>
        <div style={dlg.sheetHeader}>
          <div>
            <div style={dlg.sheetEyebrow}>Import data</div>
            <div style={dlg.sheetTitle}>Bring in a CSV file</div>
          </div>
          <button style={dlg.closeX} onClick={onClose} title="Close">
            <Icon name="close" size={14} color="currentColor"/>
          </button>
        </div>
        <div style={dlg.stepper}>
          {labels.map((label, i) => {
            const idx = i + 1;
            const state = idx < step ? 'done' : idx === step ? 'active' : 'idle';
            const dotStyle = { ...dlg.stepDot, ...(state === 'active' ? dlg.stepDotActive : state === 'done' ? dlg.stepDotDone : null) };
            const lblStyle = { ...dlg.stepLabel, ...(state === 'active' ? dlg.stepLabelActive : null) };
            return (
              <React.Fragment key={label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={dotStyle}>{state === 'done' ? '✓' : idx}</span>
                  <span style={lblStyle}>{label}</span>
                </div>
                {idx < 4 && <span style={dlg.stepConn}/>}
              </React.Fragment>
            );
          })}
        </div>
        <div style={dlg.sheetBody}>
          {step === 1 && (
            <div style={dlg.dropzone}>
              <Icon name="upload" size={28} color="var(--ink-muted)"/>
              <div style={dlg.dropTitle}>Drop a CSV file here</div>
              <div style={dlg.dropHint}>or <span style={dlg.dropLink}>browse to upload</span></div>
              <div style={dlg.dropMeta}>UTF-8 · up to 200 MB · headers in first row</div>
            </div>
          )}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 4 }}>
                Pick the type for each column. Detected types in muted text.
              </div>
              {[
                ['account_name', 'text', 'Text'],
                ['region', 'text', 'Text'],
                ['revenue', 'number', 'Number (USD)'],
                ['close_date', 'date', 'Date (YYYY-MM-DD)'],
                ['stage', 'enum', 'Category'],
              ].map(([col, detected, choice]) => (
                <div key={col} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', background: 'var(--chrome)', borderRadius: 5, boxShadow: 'inset 0 0 0 1px var(--hairline)' }}>
                  <div style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink)' }}>{col}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>detected: {detected}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: 'var(--surface)', borderRadius: 4, boxShadow: 'inset 0 0 0 1px var(--border)', fontSize: 12, color: 'var(--ink)' }}>
                    {choice} <Icon name="chevron-down" size={9}/>
                  </div>
                </div>
              ))}
            </div>
          )}
          {step === 3 && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginBottom: 8 }}>1,247 rows · 5 columns · no parse errors</div>
              <div style={{ border: '1px solid var(--border)', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ display: 'flex', background: 'var(--chrome)', borderBottom: '1px solid var(--border)' }}>
                  {['Account', 'Region', 'Revenue', 'Close date', 'Stage'].map((c) => (
                    <div key={c} style={{ flex: 1, padding: '6px 10px', fontSize: 11, fontWeight: 600, color: 'var(--ink)' }}>{c}</div>
                  ))}
                </div>
                {[
                  ['Acme Corp', 'NW', '$240,000', '2024-11-08', 'Won'],
                  ['Nimbus Group', 'NE', '$198,500', '2024-12-02', 'Won'],
                  ['Bridgepoint', 'SE', '$172,300', '2025-01-15', 'Negotiating'],
                  ['Solstice Labs', 'W', '$154,100', '2024-10-22', 'Won'],
                  ['Vega Holdings', 'C', '$131,800', '2025-02-04', 'Discovery'],
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', borderTop: i > 0 ? '1px solid var(--hairline)' : 'none' }}>
                    {row.map((c, j) => (
                      <div key={j} style={{ flex: 1, padding: '6px 10px', fontSize: 11, color: 'var(--ink-default)' }}>{c}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 440 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: 'var(--primary-tint)', borderRadius: 6 }}>
                <Icon name="check-circle" size={22} color="var(--primary)"/>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Ready to import</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>1,247 rows will land as a new worksheet.</div>
                </div>
              </div>
              <DlgField label="Worksheet name" value="accounts_2024Q4"/>
              <DlgToggle label="Open as new tab after import" defaultOn/>
            </div>
          )}
        </div>
        <div style={dlg.sheetFooter}>
          <button style={dlg.btnGhost} onClick={onClose}>Cancel</button>
          <div style={{ flex: 1 }}/>
          {step > 1 && <button style={dlg.btnSecondary} onClick={() => setStep(step - 1)}>Back</button>}
          {step < 4 && <button style={dlg.btnPrimary} onClick={() => setStep(step + 1)}>Next</button>}
          {step === 4 && <button style={dlg.btnPrimary} onClick={onClose}>Import</button>}
        </div>
      </div>
    </>
  );
}

function SortPopover({ at, onClose }) {
  if (!at) return null;
  const col = at.col || 'Column';
  return (
    <>
      <div style={dlg.popOutside} onClick={onClose}/>
      <div style={{ ...dlg.popover, top: at.y, left: at.x }}>
        <div style={dlg.popHeader}>
          <span style={dlg.popEyebrow}>Sort</span>
          <span style={dlg.popCol}>{col}</span>
        </div>
        <button style={{ ...dlg.popRow, ...dlg.popRowOn }} onClick={onClose}>
          <Icon name="arrow-down" size={11} color="currentColor"/>
          <span>Descending</span>
          <span style={dlg.popKbd}>↓</span>
        </button>
        <button style={dlg.popRow} onClick={onClose}>
          <Icon name="arrow-up" size={11} color="currentColor"/>
          <span>Ascending</span>
          <span style={dlg.popKbd}>↑</span>
        </button>
        <button style={dlg.popRow} onClick={onClose}>
          <Icon name="close" size={11} color="currentColor"/>
          <span>Clear sort</span>
        </button>
      </div>
    </>
  );
}

// Inject animation keyframes once
if (typeof document !== 'undefined' && !document.getElementById('__composer_dlg_anim')) {
  const styleEl = document.createElement('style');
  styleEl.id = '__composer_dlg_anim';
  styleEl.textContent = `
    @keyframes dlgFade  { from { opacity: 0 } to { opacity: 1 } }
    @keyframes dlgPop   { from { opacity: 0; transform: translate(-50%,-50%) scale(0.96) } to { opacity: 1; transform: translate(-50%,-50%) scale(1) } }
    @keyframes dlgSlide { from { transform: translateX(100%) } to { transform: translateX(0) } }
  `;
  document.head.appendChild(styleEl);
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
