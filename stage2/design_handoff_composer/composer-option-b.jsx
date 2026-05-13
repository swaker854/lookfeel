// Composer — Option B mockup
// =================================================================
// Visual reference for the binding-editor architecture decision.
// Three frames showing the hybrid pattern:
//
//   Frame A — Table widget selected. Right-panel Bindings tab is
//             FULLY EDITABLE inline (compact shelf). No takeover.
//   Frame B — Chart widget selected. Right-panel Bindings tab shows
//             a READ-ONLY summary of the current chart bindings +
//             "Open chart editor" primary CTA.
//   Frame C — Chart editor (full-screen takeover triggered from B).
//             Reuses the existing vs-binding-pane in v3 chrome.
//
// Same brand tokens as composer-v3.html. This file is presentation-
// only — no interactivity beyond hover states.
// =================================================================

const { useState } = React;
const Icon = window.Icon;

// =================================================================
// Page shell
// =================================================================
function Page() {
  return (
    <div style={page.root}>
      <header style={page.head}>
        <div style={page.eyebrow}>Decision A · Option B (recommended)</div>
        <h1 style={page.h1}>Bindings live <em style={{ fontStyle: 'normal', color: 'var(--primary)' }}>where they fit</em>.</h1>
        <p style={page.lede}>
          Simple widgets — Tables, Crosstabs, Selection Lists, Form widgets — get an inline,
          editable Bindings shelf in the right panel. Charts and other widgets whose binding
          tree needs breathing room keep the full-screen <code style={page.code}>vs-binding-pane</code> takeover,
          opened from a summary card in the right panel. One pattern for ~80% of widgets, a
          dedicated workspace for the cases that genuinely need it.
        </p>
      </header>

      <Frame
        label="Frame A — Table widget"
        title="Inline editor (right panel)"
        caption="The Bindings tab is fully editable. Add a column to a shelf by dragging from the Components / Assets tree, or click a chip to configure aggregation, sort, format. No takeover — the canvas stays visible behind the inspector."
      >
        <ComposerShell stage="table"/>
      </Frame>

      <Frame
        label="Frame B — Chart widget"
        title="Summary + escape hatch (right panel)"
        caption="A chart's binding tree (markers, color, detail, axis, legend) is too deep to fit a 280 px panel. Right panel shows a read-only summary of current bindings, with an 'Open chart editor' primary CTA. Single click takes you into Frame C."
      >
        <ComposerShell stage="chart-summary"/>
      </Frame>

      <Frame
        label="Frame C — Chart editor (full-screen takeover)"
        title="Existing vs-binding-pane in v3 chrome"
        caption="What the 'Open chart editor' CTA opens. Reuses the existing chart binding implementation. The 'Back to Composer / Sales Dashboard' chip top-left exits back to Frame B."
      >
        <ChartEditorShell/>
      </Frame>

      <footer style={page.foot}>
        <div style={page.footRow}>
          <div style={page.footCol}>
            <h3 style={page.h3}>Which widgets get inline?</h3>
            <ul style={page.list}>
              <li>Table</li>
              <li>Crosstab</li>
              <li>Selection List / Tree</li>
              <li>Text · Image · Gauge (degenerate — just a value binding)</li>
              <li>Form widgets (Input · Slider · Calendar)</li>
            </ul>
          </div>
          <div style={page.footCol}>
            <h3 style={page.h3}>Which widgets keep full-screen?</h3>
            <ul style={page.list}>
              <li>Chart (all subtypes — bar, line, scatter, map, etc.)</li>
              <li>Future: any widget whose shelves exceed ~5 binding slots</li>
            </ul>
          </div>
          <div style={page.footCol}>
            <h3 style={page.h3}>What this lets us reuse</h3>
            <ul style={page.list}>
              <li><code style={page.code}>vs-binding-pane</code> — unchanged for charts</li>
              <li><code style={page.code}>composer-binding-tree</code> services — feed both surfaces</li>
              <li>New: <code style={page.code}>&lt;compact-binding-shelf&gt;</code> component (~2 wks)</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}

const page = {
  root: { maxWidth: 1480, margin: '0 auto', padding: '40px 32px 80px' },
  head: { marginBottom: 28 },
  eyebrow: { fontSize: 11, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--primary)', marginBottom: 8 },
  h1: { fontSize: 32, fontWeight: 600, letterSpacing: -0.3, margin: '0 0 14px', color: 'var(--ink)', textWrap: 'pretty' },
  lede: { fontSize: 14, lineHeight: 1.55, color: 'var(--ink-muted)', maxWidth: 860, margin: 0, textWrap: 'pretty' },
  code: { fontFamily: 'var(--font-mono)', fontSize: '0.9em', background: 'var(--surface)', padding: '1px 5px', borderRadius: 3, border: '1px solid var(--hairline)', color: 'var(--ink-default)' },
  foot: { marginTop: 32, padding: '24px 28px', background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 10, boxShadow: 'var(--shadow-elev)' },
  footRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 },
  footCol: {},
  h3: { fontSize: 12, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase', color: 'var(--ink)', margin: '0 0 10px' },
  list: { margin: 0, padding: '0 0 0 18px', color: 'var(--ink-muted)', fontSize: 12, lineHeight: 1.7 },
};

// =================================================================
// Frame wrapper — caption + label chip + scaled composer shell
// =================================================================
function Frame({ label, title, caption, children }) {
  return (
    <section style={frame.root}>
      <div style={frame.head}>
        <div style={frame.labelChip}>{label}</div>
        <div style={frame.title}>{title}</div>
        <p style={frame.caption}>{caption}</p>
      </div>
      <div style={frame.canvas}>{children}</div>
    </section>
  );
}
const frame = {
  root: { marginTop: 40 },
  head: { marginBottom: 14, display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 14, rowGap: 6, alignItems: 'baseline' },
  labelChip: { fontSize: 10, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--ink-muted)', background: 'var(--surface)', padding: '4px 8px', borderRadius: 4, border: '1px solid var(--hairline)', whiteSpace: 'nowrap', gridRow: 1, gridColumn: 1 },
  title: { fontSize: 18, fontWeight: 600, color: 'var(--ink)', gridRow: 1, gridColumn: 2 },
  caption: { fontSize: 13, lineHeight: 1.55, color: 'var(--ink-muted)', margin: 0, gridRow: 2, gridColumn: '1 / -1', maxWidth: 900, textWrap: 'pretty' },
  canvas: { width: '100%', height: 760, borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-float)', position: 'relative', background: 'var(--canvas)' },
};

// =================================================================
// Composer shell (Frames A and B share this — only the canvas
// widget and the right-panel content differ)
// =================================================================
function ComposerShell({ stage }) {
  return (
    <div style={shell.root}>
      <TopBar previewLabel="Preview" filename={stage === 'table' ? 'Sales Dashboard' : 'Sales Dashboard'}/>
      <div style={shell.body}>
        <ActivityRail active="components"/>
        <LeftPanel selectionLabel={stage === 'table' ? 'Top accounts table' : 'Revenue by Region chart'}/>
        <CanvasArea stage={stage}/>
        <RightPanel stage={stage}/>
      </div>
      <StatusBar/>
    </div>
  );
}
const shell = {
  root: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' },
  body: { flex: 1, display: 'flex', position: 'relative', minHeight: 0 },
};

// =================================================================
// Top bar (compact, non-interactive)
// =================================================================
function TopBar({ previewLabel, filename }) {
  return (
    <div style={tb.bar}>
      <div style={tb.zone}>
        <button style={tb.brand}>
          <span style={tb.brandIcon}><Icon name="logo" size={14}/></span>
          <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Composer</span>
          <Icon name="chevron-down" size={11} color="var(--ink-subtle)"/>
        </button>
        <button style={tb.iconBtn} title="Menu"><Icon name="more" size={14}/></button>
      </div>

      <div style={tb.fileTabs}>
        <div style={tb.tab}>
          <Icon name="doc" size={11} color="var(--primary)"/>
          <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{filename}</span>
          <span style={tb.dirty}/>
          <button style={tb.tabClose}><Icon name="close" size={9}/></button>
        </div>
        <div style={tb.tabInactive}>
          <Icon name="doc" size={11} color="var(--ink-subtle)"/>
          <span>Q4 Sales Review</span>
          <button style={tb.tabClose}><Icon name="close" size={9}/></button>
        </div>
        <button style={tb.newTab} title="New tab"><Icon name="plus" size={11}/></button>
      </div>

      <div style={tb.zoneRight}>
        <button style={tb.iconBtn}><Icon name="undo" size={13}/></button>
        <button style={tb.iconBtn}><Icon name="redo" size={13}/></button>
        <button style={tb.askPill}>
          <Icon name="sparkle" size={11}/>
          <span>Ask AI</span>
        </button>
        <button style={tb.saveBtn}><Icon name="save" size={11}/><span>Save</span></button>
        <button style={tb.previewBtn}>
          <Icon name="eye" size={11}/>
          <span>{previewLabel}</span>
        </button>
      </div>
    </div>
  );
}
const tb = {
  bar: { display: 'flex', alignItems: 'center', height: 40, padding: '0 8px', background: 'var(--chrome)', borderBottom: '1px solid var(--hairline)', gap: 8 },
  zone: { display: 'flex', alignItems: 'center', gap: 4 },
  zoneRight: { display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' },
  brand: { display: 'flex', alignItems: 'center', gap: 6, height: 28, padding: '0 8px 0 6px', borderRadius: 5 },
  brandIcon: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: 4, background: 'var(--primary-tint)', color: 'var(--primary)' },
  iconBtn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 5, color: 'var(--ink-muted)' },
  fileTabs: { display: 'flex', alignItems: 'center', gap: 2, height: 28, marginLeft: 4 },
  tab: { display: 'flex', alignItems: 'center', gap: 6, height: 28, padding: '0 8px', borderRadius: '6px 6px 0 0', background: 'var(--surface)', boxShadow: 'inset 0 1px 0 var(--border), inset 1px 0 0 var(--border), inset -1px 0 0 var(--border)', fontSize: 12 },
  tabInactive: { display: 'flex', alignItems: 'center', gap: 6, height: 28, padding: '0 8px', borderRadius: '6px 6px 0 0', color: 'var(--ink-muted)', fontSize: 12 },
  dirty: { width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' },
  tabClose: { width: 14, height: 14, borderRadius: 3, color: 'var(--ink-subtle)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  newTab: { width: 24, height: 24, borderRadius: 4, color: 'var(--ink-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  askPill: { display: 'inline-flex', alignItems: 'center', gap: 4, height: 26, padding: '0 10px 0 9px', borderRadius: 999, background: 'var(--primary-tint)', color: 'var(--primary-text)', fontSize: 11, fontWeight: 500, boxShadow: 'inset 0 0 0 1px var(--primary-soft)' },
  saveBtn: { display: 'inline-flex', alignItems: 'center', gap: 5, height: 26, padding: '0 10px', borderRadius: 5, background: 'var(--surface)', color: 'var(--ink)', fontSize: 11, fontWeight: 500, boxShadow: 'inset 0 0 0 1px var(--border)' },
  previewBtn: { display: 'inline-flex', alignItems: 'center', gap: 5, height: 26, padding: '0 11px', borderRadius: 5, background: 'var(--primary)', color: '#fff', fontSize: 11, fontWeight: 500, boxShadow: '0 1px 0 rgba(0,0,0,0.04)' },
};

// =================================================================
// Activity rail (left, 44 px)
// =================================================================
function ActivityRail({ active }) {
  const items = [
    { id: 'assets',     icon: 'data' },
    { id: 'toolbox',    icon: 'arrange' },
    { id: 'components', icon: 'folder' },
    { id: 'inspector',  icon: 'settings' },
    { id: 'comments',   icon: 'help' },
  ];
  return (
    <div style={rail.bar}>
      {items.map(it => (
        <div key={it.id} style={{ ...rail.btn, ...(active === it.id ? rail.btnOn : null) }}>
          <Icon name={it.icon} size={15} color={active === it.id ? 'var(--ink)' : 'var(--ink-muted)'}/>
        </div>
      ))}
      <div style={{ flex: 1 }}/>
      <div style={rail.btn}><Icon name="sparkle" size={15} color="var(--ink-muted)"/></div>
    </div>
  );
}
const rail = {
  bar: { width: 44, background: 'var(--chrome)', borderRight: '1px solid var(--hairline)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', gap: 4, flexShrink: 0 },
  btn: { width: 30, height: 30, borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  btnOn: { background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--border)' },
};

// =================================================================
// Left panel — Components outline (because rail.active = components)
// =================================================================
function LeftPanel({ selectionLabel }) {
  const items = [
    { name: 'Filters group',   icon: 'folder', children: [
      { name: 'Region',           icon: 'selection-list' },
      { name: 'Date range',       icon: 'calendar' },
    ]},
    { name: 'KPI cards',       icon: 'gauge' },
    { name: 'Revenue by Region', icon: 'chart', selected: selectionLabel === 'Revenue by Region chart' },
    { name: 'Top accounts',    icon: 'table', selected: selectionLabel === 'Top accounts table' },
    { name: 'Notes',           icon: 'text' },
  ];
  return (
    <div style={lp.panel}>
      <div style={lp.tabs}>
        <button style={lp.tab}>Assets</button>
        <button style={lp.tab}>Toolbox</button>
      </div>
      <div style={lp.body}>
        <div style={lp.muted}>Search assets, drag onto canvas</div>
      </div>
      <div style={lp.split}/>
      <div style={lp.subHdr}>
        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Components</span>
        <span style={lp.count}>{5}</span>
      </div>
      <div style={lp.tree}>
        {items.map((it, i) => (
          <ComponentRow key={i} item={it}/>
        ))}
      </div>
    </div>
  );
}
function ComponentRow({ item, depth = 0 }) {
  return (
    <>
      <div style={{ ...lp.row, ...(item.selected ? lp.rowSel : null), paddingLeft: 6 + depth * 14 }}>
        {item.children ? <Icon name="chevron-down" size={10} color="var(--ink-subtle)"/> : <span style={{ width: 10 }}/>}
        <Icon name={item.icon} size={12} color={item.selected ? 'var(--primary)' : 'var(--ink-muted)'}/>
        <span style={{ flex: 1, color: item.selected ? 'var(--primary-text)' : 'var(--ink)', fontWeight: item.selected ? 500 : 400 }}>{item.name}</span>
        <Icon name="eye" size={11} color="var(--ink-subtle)"/>
      </div>
      {item.children && item.children.map((c, i) => <ComponentRow key={i} item={c} depth={depth + 1}/>)}
    </>
  );
}
const lp = {
  panel: { width: 240, background: 'var(--surface)', borderRight: '1px solid var(--hairline)', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  tabs: { display: 'flex', borderBottom: '1px solid var(--hairline)', padding: '4px 4px 0' },
  tab: { padding: '6px 10px', fontSize: 11, color: 'var(--ink-muted)', borderRadius: '4px 4px 0 0' },
  body: { padding: 10, color: 'var(--ink-subtle)', fontSize: 11, minHeight: 100, borderBottom: '1px solid var(--hairline)' },
  muted: { color: 'var(--ink-subtle)' },
  split: { height: 6, background: 'var(--surface-muted)', borderTop: '1px solid var(--hairline)', borderBottom: '1px solid var(--hairline)' },
  subHdr: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px 4px', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--ink-muted)' },
  count: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 16, height: 14, borderRadius: 3, padding: '0 4px', background: 'var(--surface-muted)', color: 'var(--ink-muted)', fontSize: 10 },
  tree: { flex: 1, overflow: 'auto', paddingBottom: 8 },
  row: { display: 'flex', alignItems: 'center', gap: 6, height: 24, padding: '0 8px', fontSize: 11, color: 'var(--ink)' },
  rowSel: { background: 'var(--c-selected-bg, #DDF1F5)' },
};

// =================================================================
// Canvas — viewsheet frame with one widget highlighted
// =================================================================
function CanvasArea({ stage }) {
  return (
    <div style={cv.world}>
      <div style={cv.frame}>
        <div style={cv.frameHdr}>
          <Icon name="doc" size={11} color="var(--primary)"/>
          <span style={{ fontWeight: 500, color: 'var(--ink)' }}>Sales Dashboard</span>
          <span style={cv.frameSub}>1440 × 900</span>
        </div>
        <div style={cv.surface}>
          {/* KPI strip */}
          <div style={cv.kpiRow}>
            {['Revenue', 'New accts', 'Avg deal', 'Churn'].map((k, i) => (
              <div key={k} style={cv.kpi}>
                <div style={cv.kpiLabel}>{k}</div>
                <div style={cv.kpiVal}>{['$4.2M', '128', '$32K', '2.1%'][i]}</div>
              </div>
            ))}
          </div>
          {/* Chart */}
          <div style={{ ...cv.widget, ...(stage === 'chart-summary' ? cv.widgetSel : null) }}>
            <div style={cv.widgetHdr}>Revenue by Region</div>
            <ChartMock/>
            {stage === 'chart-summary' && <SelectionToolbar kind="chart"/>}
          </div>
          {/* Table */}
          <div style={{ ...cv.widget, ...(stage === 'table' ? cv.widgetSel : null) }}>
            <div style={cv.widgetHdr}>Top accounts</div>
            <TableMock/>
            {stage === 'table' && <SelectionToolbar kind="table"/>}
          </div>
        </div>
      </div>
    </div>
  );
}
const cv = {
  world: { flex: 1, padding: '24px 28px', background: '#EEEBE4', backgroundImage: 'radial-gradient(circle, #DDD8CC 1px, transparent 1px)', backgroundSize: '14px 14px', overflow: 'auto', minWidth: 0 },
  frame: { background: 'var(--canvas)', borderRadius: 8, boxShadow: '0 4px 16px -4px rgba(40,30,15,0.12), 0 0 0 1px var(--border)', overflow: 'hidden', maxWidth: 720, margin: '0 auto' },
  frameHdr: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'var(--chrome)', borderBottom: '1px solid var(--hairline)', fontSize: 11 },
  frameSub: { marginLeft: 'auto', color: 'var(--ink-subtle)', fontFamily: 'var(--font-mono)', fontSize: 10 },
  surface: { padding: 14, display: 'flex', flexDirection: 'column', gap: 12 },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 },
  kpi: { background: 'var(--surface)', borderRadius: 6, padding: '10px 12px', boxShadow: 'inset 0 0 0 1px var(--hairline)' },
  kpiLabel: { fontSize: 10, color: 'var(--ink-subtle)', textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiVal: { fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginTop: 2 },
  widget: { background: 'var(--surface)', borderRadius: 6, boxShadow: 'inset 0 0 0 1px var(--hairline)', padding: 10, position: 'relative' },
  widgetSel: { boxShadow: 'inset 0 0 0 2px var(--primary), 0 0 0 4px var(--primary-soft)' },
  widgetHdr: { fontSize: 11, fontWeight: 500, color: 'var(--ink)', marginBottom: 8 },
};

function ChartMock() {
  const bars = [80, 110, 70, 130, 95, 60];
  const max = 140;
  const colors = ['#5F8FE0', '#2E8B57', '#C97A3A', '#9B6BB1', '#E58A2A', '#6BA0B8'];
  return (
    <div style={{ height: 140, padding: '0 4px 16px', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '100%', gap: 8 }}>
        {bars.map((b, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: '100%', height: (b / max) * 100 + '%', background: colors[i], borderRadius: '3px 3px 0 0' }}/>
            <span style={{ fontSize: 9, color: 'var(--ink-subtle)' }}>{['N','S','E','W','Cn','Pa'][i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TableMock() {
  const rows = [
    ['Northwind Trading',  'Enterprise', '$424k', '+12%'],
    ['Globex Industries',  'Mid',        '$318k', '+4%'],
    ['Initech',            'Mid',        '$210k', '-2%'],
    ['Acme Corp',          'SMB',        '$184k', '+18%'],
    ['Vega Holdings',      'Enterprise', '$131k', '+9%'],
  ];
  return (
    <div style={{ border: '1px solid var(--hairline)', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', background: 'var(--surface-muted)', padding: '6px 10px', fontSize: 10, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
        <span>Account</span><span>Segment</span><span>Revenue</span><span>Δ YoY</span>
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '7px 10px', fontSize: 11, color: 'var(--ink)', borderTop: '1px solid var(--hairline)' }}>
          <span>{r[0]}</span><span style={{ color: 'var(--ink-muted)' }}>{r[1]}</span><span style={{ fontWeight: 500 }}>{r[2]}</span><span style={{ color: r[3].startsWith('-') ? '#B23D2C' : '#2E8B57' }}>{r[3]}</span>
        </div>
      ))}
    </div>
  );
}

// Floating selection toolbar — primary CTA is the *editor verb*
function SelectionToolbar({ kind }) {
  return (
    <div style={st.bar}>
      <button style={st.primary}>
        <Icon name="edit" size={11}/>
        <span>{kind === 'chart' ? 'Edit chart' : 'Edit bindings'}</span>
      </button>
      <div style={st.div}/>
      {kind === 'chart' && (
        <button style={st.verb}>
          <span>Column</span>
          <Icon name="chevron-down" size={10} color="var(--ink-subtle)"/>
        </button>
      )}
      <button style={st.verb}>Format</button>
      <div style={st.div}/>
      <button style={st.iconBtn}><Icon name="more" size={11}/></button>
    </div>
  );
}
const st = {
  bar: { position: 'absolute', top: -38, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', height: 30, padding: '0 4px', background: 'var(--surface)', borderRadius: 6, boxShadow: 'var(--shadow-float)', gap: 2 },
  primary: { display: 'inline-flex', alignItems: 'center', gap: 5, height: 22, padding: '0 9px 0 8px', borderRadius: 4, background: 'var(--primary)', color: '#fff', fontSize: 11, fontWeight: 500 },
  verb: { display: 'inline-flex', alignItems: 'center', gap: 4, height: 22, padding: '0 8px', borderRadius: 4, color: 'var(--ink)', fontSize: 11 },
  div: { width: 1, height: 16, background: 'var(--hairline)', margin: '0 2px' },
  iconBtn: { width: 22, height: 22, borderRadius: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-muted)' },
};

// =================================================================
// Right panel — the variable surface (Frames A vs B)
// =================================================================
function RightPanel({ stage }) {
  return (
    <div style={rp.panel}>
      <div style={rp.selHdr}>
        <Icon name={stage === 'table' ? 'table' : 'chart'} size={13} color="var(--primary)"/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={rp.selTitle}>{stage === 'table' ? 'Top accounts' : 'Revenue by Region'}</div>
          <div style={rp.selKind}>{stage === 'table' ? 'Table · Customers' : 'Chart · Construction Data'}</div>
        </div>
        <button style={rp.hdrIcon}><Icon name="more" size={11}/></button>
      </div>

      <div style={rp.tabs}>
        <button style={{ ...rp.tab, ...rp.tabOn }}>Bindings</button>
        <button style={rp.tab}>Format</button>
        <button style={rp.tab}>Script</button>
      </div>

      <div style={rp.body}>
        {stage === 'table' ? <TableBindings/> : <ChartBindingsSummary/>}
      </div>
    </div>
  );
}

// ---- A) Table inline bindings (editable) ----------------------
function TableBindings() {
  return (
    <div>
      <Section title="Source">
        <div style={rp.asset}>
          <Icon name="data" size={13} color="var(--info)"/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 500, color: 'var(--ink)' }}>Customers</div>
            <div style={{ color: 'var(--ink-subtle)', fontSize: 10 }}>Examples · 412 rows · 12 columns</div>
          </div>
          <button style={rp.hdrIcon}><Icon name="more" size={11}/></button>
        </div>
      </Section>

      <Section title="Columns" hint="Drag to reorder">
        <Pill type="dim"  label="Account name"  meta="Text"/>
        <Pill type="dim"  label="Segment"       meta="Text"/>
        <Pill type="meas" label="Revenue"       meta="Sum · USD"/>
        <Pill type="meas" label="Δ YoY"         meta="Computed"/>
        <DropZone label="Drop column to add"/>
      </Section>

      <Section title="Filters">
        <Pill type="filter" label="Revenue"     meta="> $100k"/>
        <DropZone label="Add filter"/>
      </Section>

      <Section title="Sort">
        <div style={rp.row2}>
          <Select label="By"  v="Revenue"/>
          <Select label="Dir" v="Descending"/>
        </div>
      </Section>

      <Section title="Display">
        <div style={rp.row2}>
          <Select label="Rows/page" v="25"/>
          <Toggle  label="Show totals" on/>
        </div>
      </Section>

      <Callout
        tone="ok"
        title="Inline editor"
        body="Tables, crosstabs, selection lists, gauges, and form widgets all edit here. No takeover."
      />
    </div>
  );
}

// ---- B) Chart summary + escape hatch (read-only) --------------
function ChartBindingsSummary() {
  return (
    <div>
      <Section title="Source">
        <div style={rp.asset}>
          <Icon name="data" size={13} color="var(--info)"/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 500, color: 'var(--ink)' }}>Construction Data</div>
            <div style={{ color: 'var(--ink-subtle)', fontSize: 10 }}>Examples · 412 rows · 7 columns</div>
          </div>
          <button style={rp.hdrIcon}><Icon name="more" size={11}/></button>
        </div>
      </Section>

      <button style={rp.openEditor}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="edit" size={12}/>
          <span style={{ fontWeight: 500 }}>Open chart editor</span>
        </span>
        <Icon name="chevron-down" size={11} color="rgba(255,255,255,0.85)" style={{ transform: 'rotate(-90deg)' }}/>
      </button>

      <Section title="Chart type">
        <div style={rp.chartTypeRow}>
          <div style={rp.chartTypeChip}>
            <Icon name="chart" size={12} color="var(--primary)"/>
            <span>Column</span>
          </div>
          <button style={rp.linkBtn}>Change…</button>
        </div>
      </Section>

      <Section title="Bindings summary" hint="Read-only — edit in chart editor">
        <SummaryRow shelf="X axis"  pills={[{ type: 'dim',  label: 'Date',         meta: 'By Month' }]}/>
        <SummaryRow shelf="Y axis"  pills={[{ type: 'meas', label: 'Revenue',      meta: 'Sum' }]}/>
        <SummaryRow shelf="Color"   pills={[{ type: 'dim',  label: 'Region' }]}/>
        <SummaryRow shelf="Details" pills={[{ type: 'dim',  label: 'Salesperson' }, { type: 'dim', label: 'Deal stage' }]}/>
        <SummaryRow shelf="Tooltip" pills={[{ type: 'meas', label: 'Avg deal size', meta: 'Avg' }]}/>
        <SummaryRow shelf="Filters" pills={[{ type: 'filter', label: 'Date', meta: '≥ 2018-09-01' }, { type: 'filter', label: 'Region', meta: 'in 4 values' }]}/>
      </Section>

      <Callout
        tone="info"
        title="Why a separate editor?"
        body="A chart has 8-12 binding slots once color, detail, tooltip, ranges and legends are counted — too deep for 280 px. The full editor gives them breathing room."
      />
    </div>
  );
}

function SummaryRow({ shelf, pills }) {
  return (
    <div style={rp.summaryRow}>
      <div style={rp.shelfLabel}>{shelf}</div>
      <div style={rp.shelfPills}>
        {pills.map((p, i) => <Pill key={i} compact {...p}/>)}
      </div>
    </div>
  );
}

// ---- Right-panel primitives -----------------------------------
function Section({ title, hint, children }) {
  return (
    <div style={rp.section}>
      <div style={rp.sectionHead}>
        <span style={{ fontWeight: 600, color: 'var(--ink)', textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.6 }}>{title}</span>
        {hint ? <span style={rp.sectionHint}>{hint}</span> : <button style={rp.sectionAdd}><Icon name="plus" size={10}/></button>}
      </div>
      <div style={rp.sectionBody}>{children}</div>
    </div>
  );
}
function Pill({ type, label, meta, compact }) {
  const c = {
    dim:    { color: '#5F8FE0', kind: 'Dim' },
    meas:   { color: '#2E8B57', kind: 'Mea' },
    filter: { color: '#C97A3A', kind: 'Flt' },
  }[type] || { color: '#888', kind: '·' };
  return (
    <div style={{ ...rp.pill, ...(compact ? rp.pillCompact : null) }}>
      <span style={{ ...rp.pillKind, color: c.color, borderColor: c.color }}>{c.kind}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={rp.pillLabel}>{label}</div>
        {meta && <div style={rp.pillSub}>{meta}</div>}
      </div>
      {!compact && (
        <>
          <button style={rp.pillIcon}><Icon name="settings" size={10}/></button>
          <button style={rp.pillIcon}><Icon name="close" size={10}/></button>
        </>
      )}
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
function Select({ label, v }) {
  return (
    <div style={rp.field}>
      <span style={rp.fieldLabel}>{label}</span>
      <span style={rp.fieldVal}>{v}</span>
      <Icon name="chevron-down" size={9} color="var(--ink-subtle)"/>
    </div>
  );
}
function Toggle({ label, on }) {
  return (
    <div style={rp.field}>
      <span style={{ ...rp.fieldLabel, flex: 1 }}>{label}</span>
      <span style={{ ...rp.toggleTrack, background: on ? 'var(--primary)' : '#CCC8BE' }}>
        <span style={{ ...rp.toggleThumb, transform: on ? 'translateX(10px)' : 'translateX(0)' }}/>
      </span>
    </div>
  );
}
function Callout({ tone, title, body }) {
  const palette = tone === 'ok'
    ? { bg: '#EFF8EE', border: '#CDE3CA', text: '#1F5A1F', icon: '#2E8B57' }
    : { bg: 'var(--info-soft)', border: '#C4DCF1', text: '#1A3F66', icon: 'var(--info)' };
  return (
    <div style={{ margin: '12px 12px 14px', padding: '10px 12px', borderRadius: 6, background: palette.bg, border: '1px solid ' + palette.border, color: palette.text, fontSize: 11, lineHeight: 1.5, display: 'flex', gap: 8 }}>
      <Icon name="check-circle" size={12} color={palette.icon} style={{ flexShrink: 0, marginTop: 1 }}/>
      <div>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>{title}</div>
        <div>{body}</div>
      </div>
    </div>
  );
}

const rp = {
  panel: { width: 304, background: 'var(--surface)', borderLeft: '1px solid var(--hairline)', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  selHdr: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 12px 10px', borderBottom: '1px solid var(--hairline)' },
  selTitle: { fontSize: 12, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  selKind: { fontSize: 10, color: 'var(--ink-subtle)' },
  hdrIcon: { width: 22, height: 22, borderRadius: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-muted)' },
  tabs: { display: 'flex', padding: '0 8px', borderBottom: '1px solid var(--hairline)', gap: 2 },
  tab: { padding: '8px 10px', fontSize: 11, color: 'var(--ink-muted)', borderBottom: '2px solid transparent', marginBottom: -1 },
  tabOn: { color: 'var(--ink)', borderBottomColor: 'var(--primary)', fontWeight: 500 },
  body: { flex: 1, overflow: 'auto' },
  section: { borderBottom: '1px solid var(--hairline)', padding: '10px 12px 12px' },
  sectionHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionHint: { fontSize: 10, color: 'var(--ink-subtle)', fontStyle: 'italic' },
  sectionAdd: { width: 16, height: 16, borderRadius: 3, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-muted)' },
  sectionBody: { display: 'flex', flexDirection: 'column', gap: 6 },
  asset: { display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderRadius: 5, background: 'var(--surface-muted)', boxShadow: 'inset 0 0 0 1px var(--hairline)' },
  pill: { display: 'flex', alignItems: 'center', gap: 8, height: 30, padding: '0 6px', borderRadius: 5, background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--hairline)' },
  pillCompact: { height: 24, paddingRight: 8 },
  pillKind: { fontSize: 8, fontFamily: 'var(--font-mono)', fontWeight: 600, padding: '2px 4px', borderRadius: 3, border: '1px solid currentColor', flexShrink: 0, lineHeight: 1, letterSpacing: 0.4, textTransform: 'uppercase' },
  pillLabel: { fontSize: 11, color: 'var(--ink)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  pillSub: { fontSize: 9, color: 'var(--ink-subtle)' },
  pillIcon: { width: 18, height: 18, borderRadius: 3, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-subtle)' },
  dropZone: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 28, borderRadius: 5, border: '1px dashed var(--border)', color: 'var(--ink-subtle)', fontSize: 11 },
  field: { display: 'flex', alignItems: 'center', gap: 6, height: 26, padding: '0 8px', borderRadius: 4, background: 'var(--surface-muted)', boxShadow: 'inset 0 0 0 1px var(--hairline)', fontSize: 11 },
  fieldLabel: { color: 'var(--ink-subtle)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4 },
  fieldVal: { flex: 1, color: 'var(--ink)' },
  toggleTrack: { width: 22, height: 12, borderRadius: 999, position: 'relative', transition: 'background 0.15s' },
  toggleThumb: { position: 'absolute', top: 1, left: 1, width: 10, height: 10, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.2)', transition: 'transform 0.15s' },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 },
  openEditor: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: 'calc(100% - 24px)', margin: '12px', height: 32, padding: '0 12px', borderRadius: 5, background: 'var(--primary)', color: '#fff', fontSize: 12 },
  chartTypeRow: { display: 'flex', alignItems: 'center', gap: 8 },
  chartTypeChip: { display: 'inline-flex', alignItems: 'center', gap: 6, height: 26, padding: '0 10px 0 8px', borderRadius: 999, background: 'var(--primary-tint)', boxShadow: 'inset 0 0 0 1px var(--primary-soft)', color: 'var(--primary-text)', fontSize: 11, fontWeight: 500 },
  linkBtn: { fontSize: 11, color: 'var(--info)', textDecoration: 'underline', textUnderlineOffset: 2 },
  summaryRow: { display: 'grid', gridTemplateColumns: '60px 1fr', gap: 8, alignItems: 'start' },
  shelfLabel: { fontSize: 10, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: 0.4, paddingTop: 4 },
  shelfPills: { display: 'flex', flexDirection: 'column', gap: 4 },
};

// =================================================================
// Status bar
// =================================================================
function StatusBar() {
  return (
    <div style={sb.bar}>
      <span style={sb.item}><Icon name="console" size={11} color="var(--ink-muted)"/><span>Console</span></span>
      <span style={sb.div}/>
      <span style={sb.item}><span style={sb.dot}/><span>Construction Data</span></span>
      <span style={{ flex: 1 }}/>
      <span style={sb.item}>1440 × 900</span>
      <span style={sb.div}/>
      <span style={sb.item}>100%</span>
      <span style={sb.div}/>
      <span style={sb.item}>Saved · 2 min ago</span>
    </div>
  );
}
const sb = {
  bar: { display: 'flex', alignItems: 'center', height: 24, padding: '0 12px', background: 'var(--chrome)', borderTop: '1px solid var(--hairline)', fontSize: 10, color: 'var(--ink-muted)', gap: 8 },
  item: { display: 'inline-flex', alignItems: 'center', gap: 5 },
  div: { width: 1, height: 10, background: 'var(--hairline)' },
  dot: { width: 6, height: 6, borderRadius: '50%', background: '#2E8B57' },
};

// =================================================================
// Frame C — Full-screen chart editor (the takeover)
// =================================================================
function ChartEditorShell() {
  return (
    <div style={shell.root}>
      <TopBar previewLabel="Refresh" filename="Revenue by Region"/>
      <div style={ed.scrim}>
        <div style={ed.backChip}>
          <Icon name="arrow-down" size={11} color="var(--ink-muted)" style={{ transform: 'rotate(90deg)' }}/>
          <span style={{ color: 'var(--ink-muted)' }}>Back to Composer ·</span>
          <span style={{ color: 'var(--ink)', fontWeight: 500 }}>Sales Dashboard</span>
        </div>
        <div style={ed.modal}>
          <div style={ed.modalHdr}>
            <Icon name="chart" size={13} color="var(--primary)"/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Edit chart bindings</div>
              <div style={{ fontSize: 10, color: 'var(--ink-subtle)' }}>Revenue by Region · Construction Data</div>
            </div>
            <button style={ed.cancel}>Cancel</button>
            <button style={ed.done}><Icon name="check-circle" size={11}/><span>Done</span></button>
          </div>
          <div style={ed.modalBody}>
            <div style={ed.shelves}>
              <ShelfBlock title="Chart type">
                <div style={ed.typeGrid}>
                  {['Column','Bar','Line','Area','Pie','Scatter','Map','Heat'].map((n, i) => (
                    <div key={n} style={{ ...ed.typeCard, ...(i === 0 ? ed.typeCardOn : null) }}>
                      <span style={ed.typeIco}/>
                      <span>{n}</span>
                    </div>
                  ))}
                </div>
              </ShelfBlock>
              <ShelfBlock title="Shelves">
                <FullShelf label="X axis"   pills={[{ type: 'dim',  label: 'Date',          meta: 'By Month' }]}/>
                <FullShelf label="Y axis"   pills={[{ type: 'meas', label: 'Revenue',       meta: 'Sum' }]}/>
                <FullShelf label="Color"    pills={[{ type: 'dim',  label: 'Region' }]}/>
                <FullShelf label="Details"  pills={[{ type: 'dim',  label: 'Salesperson' }, { type: 'dim', label: 'Deal stage' }]}/>
                <FullShelf label="Tooltip"  pills={[{ type: 'meas', label: 'Avg deal size', meta: 'Avg' }]}/>
                <FullShelf label="Legend"   pills={[]}/>
                <FullShelf label="Filters"  pills={[{ type: 'filter', label: 'Date',   meta: '≥ 2018-09-01' }, { type: 'filter', label: 'Region', meta: 'in 4 values' }]}/>
              </ShelfBlock>
            </div>
            <div style={ed.preview}>
              <div style={ed.previewHdr}>Preview</div>
              <div style={ed.previewBody}>
                <ChartMock/>
              </div>
              <div style={ed.previewFoot}>
                <span>412 rows aggregated · 6 series</span>
                <span style={{ flex: 1 }}/>
                <button style={ed.previewBtn}>Refresh</button>
              </div>
            </div>
            <div style={ed.dataPicker}>
              <div style={ed.dpHdr}>Construction Data</div>
              <div style={ed.dpSearch}>
                <Icon name="search" size={11} color="var(--ink-subtle)"/>
                <span style={{ color: 'var(--ink-subtle)' }}>Search columns</span>
              </div>
              {[
                { kind: 'dim',  name: 'Date',         icon: 'calendar' },
                { kind: 'dim',  name: 'Region',       icon: 'selection-list' },
                { kind: 'dim',  name: 'Salesperson',  icon: 'text' },
                { kind: 'dim',  name: 'Deal stage',   icon: 'selection-list' },
                { kind: 'dim',  name: 'Channel',      icon: 'selection-list' },
                { kind: 'meas', name: 'Revenue',      icon: 'gauge' },
                { kind: 'meas', name: 'Avg deal size',icon: 'gauge' },
                { kind: 'meas', name: 'Accounts',     icon: 'gauge' },
              ].map((c, i) => (
                <div key={i} style={ed.dpRow}>
                  <span style={{ ...ed.dpKind, color: c.kind === 'dim' ? '#5F8FE0' : '#2E8B57', borderColor: c.kind === 'dim' ? '#5F8FE0' : '#2E8B57' }}>{c.kind === 'dim' ? 'Dim' : 'Mea'}</span>
                  <Icon name={c.icon} size={11} color="var(--ink-muted)"/>
                  <span>{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShelfBlock({ title, children }) {
  return (
    <div style={ed.block}>
      <div style={ed.blockHdr}>{title}</div>
      <div style={ed.blockBody}>{children}</div>
    </div>
  );
}
function FullShelf({ label, pills }) {
  return (
    <div style={ed.shelf}>
      <div style={ed.shelfLabel}>{label}</div>
      <div style={ed.shelfBin}>
        {pills.length === 0
          ? <div style={ed.shelfEmpty}>Drop column</div>
          : pills.map((p, i) => <Pill key={i} {...p}/>)}
      </div>
    </div>
  );
}

const ed = {
  scrim: { flex: 1, position: 'relative', background: 'rgba(40,30,15,0.35)', padding: '24px 32px', overflow: 'auto' },
  backChip: { position: 'absolute', top: 12, left: 16, display: 'flex', alignItems: 'center', gap: 6, height: 26, padding: '0 12px 0 8px', borderRadius: 999, background: 'var(--surface)', boxShadow: 'var(--shadow-elev)', fontSize: 11, zIndex: 1 },
  modal: { background: 'var(--chrome)', borderRadius: 10, boxShadow: 'var(--shadow-float)', overflow: 'hidden', maxWidth: 1240, margin: '24px auto 0', display: 'flex', flexDirection: 'column' },
  modalHdr: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--surface)', borderBottom: '1px solid var(--hairline)' },
  cancel: { height: 26, padding: '0 12px', borderRadius: 5, color: 'var(--ink-muted)', fontSize: 11 },
  done: { display: 'inline-flex', alignItems: 'center', gap: 5, height: 26, padding: '0 12px', borderRadius: 5, background: 'var(--primary)', color: '#fff', fontSize: 11, fontWeight: 500 },
  modalBody: { display: 'grid', gridTemplateColumns: '1fr 380px 200px', gap: 0 },
  shelves: { padding: 14, borderRight: '1px solid var(--hairline)', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 480 },
  block: { background: 'var(--surface)', borderRadius: 6, boxShadow: 'inset 0 0 0 1px var(--hairline)', overflow: 'hidden' },
  blockHdr: { padding: '8px 12px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--ink-muted)', background: 'var(--surface-muted)', borderBottom: '1px solid var(--hairline)' },
  blockBody: { padding: 10, display: 'flex', flexDirection: 'column', gap: 6 },
  typeGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 },
  typeCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 4px', borderRadius: 5, boxShadow: 'inset 0 0 0 1px var(--hairline)', fontSize: 11, color: 'var(--ink-muted)' },
  typeCardOn: { boxShadow: 'inset 0 0 0 2px var(--primary)', color: 'var(--primary-text)', background: 'var(--primary-tint)' },
  typeIco: { width: 24, height: 16, borderRadius: 3, background: 'currentColor', opacity: 0.4 },
  shelf: { display: 'grid', gridTemplateColumns: '88px 1fr', gap: 8, alignItems: 'start' },
  shelfLabel: { fontSize: 11, color: 'var(--ink)', fontWeight: 500, paddingTop: 7 },
  shelfBin: { display: 'flex', flexWrap: 'wrap', gap: 6, padding: 6, borderRadius: 5, background: 'var(--surface-muted)', boxShadow: 'inset 0 0 0 1px var(--hairline)', minHeight: 32 },
  shelfEmpty: { fontSize: 10, color: 'var(--ink-subtle)', padding: '4px 6px' },
  preview: { padding: 14, borderRight: '1px solid var(--hairline)', display: 'flex', flexDirection: 'column' },
  previewHdr: { fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--ink-muted)', marginBottom: 10 },
  previewBody: { flex: 1, background: 'var(--surface)', borderRadius: 6, boxShadow: 'inset 0 0 0 1px var(--hairline)', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  previewFoot: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 10, color: 'var(--ink-muted)' },
  previewBtn: { height: 22, padding: '0 10px', borderRadius: 4, background: 'var(--surface)', color: 'var(--ink)', fontSize: 11, boxShadow: 'inset 0 0 0 1px var(--border)' },
  dataPicker: { padding: 14, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 },
  dpHdr: { fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--ink-muted)', marginBottom: 4 },
  dpSearch: { display: 'flex', alignItems: 'center', gap: 6, height: 26, padding: '0 8px', borderRadius: 4, background: 'var(--surface-muted)', boxShadow: 'inset 0 0 0 1px var(--hairline)', marginBottom: 6 },
  dpRow: { display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', borderRadius: 4, color: 'var(--ink)' },
  dpKind: { fontSize: 8, fontFamily: 'var(--font-mono)', fontWeight: 600, padding: '1px 3px', borderRadius: 3, border: '1px solid currentColor', lineHeight: 1, letterSpacing: 0.4, textTransform: 'uppercase' },
};

ReactDOM.createRoot(document.getElementById('root')).render(<Page/>);
