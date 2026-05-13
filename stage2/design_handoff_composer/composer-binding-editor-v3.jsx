// Composer — Binding Editor (Option A: Modal Takeover)
// =================================================================
// What this mocks
//
// The current StyleBI binding editor (chart / table / crosstab) is a
// full-window takeover of the viewsheet canvas. This file mocks how
// that takeover should look once routed through the v3 shell.
//
// Decisions baked in:
//
//   1. KEEP THE FILE-TAB STRIP at the top of the window. The user has
//      to know which document the chart belongs to, and that they'll
//      land back there when they hit Done. Tab strip is read-only
//      while editing — no new-tab affordance.
//
//   2. TOP-BAR SLOT CHANGES: app switcher + global actions are
//      replaced by a context band — "Editing chart: <name>" on the
//      left, Cancel + Done on the right. No Ask AI (focused task,
//      not a general authoring surface).
//
//   3. ACTIVITY RAIL + STATUS BAR HIDE. This isn't a multi-panel
//      surface; it's a focused editor. Everything the user needs is
//      visible in the editor itself.
//
//   4. THREE-PANE BODY: data tree (left, 240) · shelves + preview
//      (center, flex) · format (right, 280). All three are FIXED
//      docked panels — no floating, no overlap — because this is a
//      task with a clear stopping point, not a long authoring
//      session. (The main composer keeps the floating model.)
//
//   5. CHART TYPE PICKER lives above the shelves. Switching type is
//      a top-level decision and surfaces all candidate types
//      without diving into a menu.
//
//   6. LIVE PREVIEW renders below the shelves at fixed aspect ratio.
//      Matches today's StyleBI binding pane behaviour.
// =================================================================

const { useState, useMemo } = React;
const Icon = window.Icon;
const {
  useTweaks, TweaksPanel, TweakSection,
  TweakToggle, TweakSelect, TweakText,
} = window;

// =================================================================
// Top bar — context band replaces the app-switcher + global actions
// =================================================================
function EditorTopBar({ assetName, chartName, onCancel, onDone, exitAffordance, verboseDone }) {
  const showBackChip = exitAffordance === 'backChip' || exitAffordance === 'both';
  const showTab      = exitAffordance === 'standard' || exitAffordance === 'both';
  const doneLabel    = verboseDone ? 'Done editing chart' : 'Done';

  return (
    <div style={tb.bar}>
      {/* Left: either a Back-to-Composer breadcrumb chip, the file-tab,
          or both. The breadcrumb is the high-impact exit affordance —
          users look LEFT for back. */}
      <div style={tb.tabs}>
        {showBackChip && (
          <button style={tb.backChip} onClick={onCancel} title="Return to Composer (Esc)">
            <Icon name="chevron-l" size={12} color="var(--ink)"/>
            <span style={tb.backChipLabel}>Back to Composer</span>
            <span style={tb.backChipSep}>/</span>
            <Icon name="doc" size={11} color="var(--info)"/>
            <span style={tb.backChipAsset}>{assetName}</span>
          </button>
        )}
        {showTab && !showBackChip && (
          <div style={tb.tab}>
            <Icon name="doc" size={12} color="var(--info)"/>
            <span>{assetName}</span>
          </div>
        )}
      </div>

      {/* Center: editing context */}
      <div style={tb.context}>
        <Icon name="chart" size={14} color="var(--c-context-text)"/>
        <span style={tb.contextLabel}>Editing chart</span>
        <span style={tb.contextName}>{chartName}</span>
      </div>

      {/* Right: Cancel + Done. Done label can name its target. */}
      <div style={tb.actions}>
        <span style={tb.escHint}>Esc</span>
        <button style={tb.cancelBtn} onClick={onCancel}>Cancel</button>
        <button style={tb.doneBtn} onClick={onDone}>
          <span style={{ fontSize: 14, lineHeight: 1, marginRight: 1 }}>✓</span>
          <span>{doneLabel}</span>
        </button>
      </div>
    </div>
  );
}
const tb = {
  bar: {
    flex: '0 0 44px', height: 44,
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '0 8px 0 4px',
    background: 'var(--chrome)',
    borderBottom: '1px solid var(--border)',
  },
  tabs: { display: 'flex', alignItems: 'center', gap: 4, minWidth: 220 },
  tab: {
    height: 28, padding: '0 10px',
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'var(--surface)',
    boxShadow: 'inset 0 0 0 1px var(--border)',
    borderRadius: 6,
    fontSize: 12, fontWeight: 500, color: 'var(--ink)',
  },
  backChip: {
    height: 28, padding: '0 10px 0 6px',
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'var(--surface)',
    boxShadow: 'inset 0 0 0 1px var(--border)',
    borderRadius: 6,
    fontSize: 12, color: 'var(--ink)',
  },
  backChipLabel: { fontWeight: 600 },
  backChipSep: { color: 'var(--ink-subtle)', margin: '0 -2px' },
  backChipAsset: { color: 'var(--ink-muted)', fontWeight: 500 },
  escHint: {
    fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-subtle)',
    padding: '0 6px', height: 18, display: 'inline-flex', alignItems: 'center',
    background: 'var(--bg)', boxShadow: 'inset 0 0 0 1px var(--hairline)',
    borderRadius: 3, marginRight: 2,
  },
  context: {
    flex: 1,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 28,
    fontSize: 13,
  },
  contextLabel: { color: 'var(--ink-muted)' },
  contextName: { color: 'var(--c-context-text)', fontWeight: 600 },
  actions: { display: 'flex', alignItems: 'center', gap: 6 },
  cancelBtn: {
    height: 28, padding: '0 12px', borderRadius: 6,
    background: 'var(--surface)',
    boxShadow: 'inset 0 0 0 1px var(--border)',
    fontSize: 12, fontWeight: 500, color: 'var(--ink)',
  },
  doneBtn: {
    height: 28, padding: '0 12px', borderRadius: 6,
    display: 'inline-flex', alignItems: 'center', gap: 5,
    background: 'var(--primary)',
    color: '#fff',
    fontSize: 12, fontWeight: 600,
  },
};

// =================================================================
// Data tree — left panel. Two groups: Measures (numbers) and
// Dimensions (categoricals/dates). Calculated fields get a separate
// subgroup. Each field is draggable to a shelf.
// =================================================================
const FIELDS = {
  measures: [
    { name: 'Revenue',        type: 'num$' },
    { name: 'Cost',           type: 'num$' },
    { name: 'Profit',         type: 'num$', calc: true },
    { name: 'Margin %',       type: 'num%', calc: true },
    { name: 'Units Sold',     type: 'num' },
    { name: 'Avg Order Size', type: 'num' },
  ],
  dimensions: [
    { name: 'Region',        type: 'cat' },
    { name: 'Country',       type: 'geo' },
    { name: 'City',          type: 'geo' },
    { name: 'Product',       type: 'cat' },
    { name: 'Product Family',type: 'cat' },
    { name: 'Customer',      type: 'cat' },
    { name: 'Order Date',    type: 'date' },
    { name: 'Ship Date',     type: 'date' },
    { name: 'Quarter',       type: 'date' },
  ],
};

function DataTree({ dataSource, search, setSearch, dragged, setDragged }) {
  const filt = (arr) => arr.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  const measures = filt(FIELDS.measures);
  const dimensions = filt(FIELDS.dimensions);
  return (
    <div style={dt.panel}>
      <div style={dt.header}>
        <Icon name="data" size={13} color="var(--info)"/>
        <span style={dt.headerTitle}>{dataSource}</span>
        <button style={dt.refresh} title="Refresh data source">
          <Icon name="refresh" size={12} color="var(--ink-muted)"/>
        </button>
      </div>
      <div style={dt.searchRow}>
        <Icon name="search" size={12} color="var(--ink-subtle)"/>
        <input style={dt.searchInput}
               placeholder="Search fields"
               value={search}
               onChange={(e) => setSearch(e.target.value)}/>
      </div>
      <div style={dt.scroll}>
        <FieldGroup title="Measures"   fields={measures}   dragged={dragged} setDragged={setDragged}/>
        <FieldGroup title="Dimensions" fields={dimensions} dragged={dragged} setDragged={setDragged}/>
        <div style={dt.calcBtnWrap}>
          <button style={dt.calcBtn}>
            <Icon name="plus" size={11}/>
            <span>New calculated field</span>
          </button>
        </div>
      </div>
    </div>
  );
}
function FieldGroup({ title, fields, dragged, setDragged }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button style={dt.groupHeader} onClick={() => setOpen(o => !o)}>
        <Icon name={open ? 'chevron-d' : 'chevron-r'} size={11} color="var(--ink-subtle)"/>
        <span style={dt.groupTitle}>{title}</span>
        <span style={dt.groupCount}>{fields.length}</span>
      </button>
      {open && (
        <div style={dt.fields}>
          {fields.map((f) => <FieldChip key={f.name} field={f} dragged={dragged} setDragged={setDragged}/>)}
        </div>
      )}
    </div>
  );
}
function FieldChip({ field, dragged, setDragged }) {
  const isDragged = dragged === field.name;
  return (
    <div style={{ ...dt.chip, ...(isDragged ? dt.chipDragged : null) }}
         draggable
         onDragStart={() => setDragged(field.name)}
         onDragEnd={() => setDragged(null)}>
      <span style={dt.typeBadge} data-type={field.type}>{labelForType(field.type)}</span>
      <span style={dt.chipName}>{field.name}</span>
      {field.calc && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-subtle)', fontWeight: 600 }}>fx</span>}
    </div>
  );
}
function labelForType(t) {
  if (t === 'num$') return '$';
  if (t === 'num%') return '%';
  if (t === 'num')  return '#';
  if (t === 'date') return '📅';
  if (t === 'geo')  return '◎';
  return 'A';
}
const dt = {
  panel: {
    flex: '0 0 240px', width: 240,
    display: 'flex', flexDirection: 'column',
    background: 'var(--chrome)',
    borderRight: '1px solid var(--border)',
    minHeight: 0,
  },
  header: {
    flex: '0 0 36px',
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '0 8px', borderBottom: '1px solid var(--hairline)',
  },
  headerTitle: { flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  refresh: { width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 },
  searchRow: {
    flex: '0 0 32px',
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '0 8px', borderBottom: '1px solid var(--hairline)',
    background: 'var(--surface)',
  },
  searchInput: { flex: 1, height: 22, background: 'transparent', border: 0, outline: 0, fontSize: 12, color: 'var(--ink)' },
  scroll: { flex: 1, overflowY: 'auto', padding: '4px 0 8px' },
  groupHeader: {
    width: '100%', height: 26,
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '0 8px',
    fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: 0.4,
  },
  groupTitle: { flex: 1, textAlign: 'left' },
  groupCount: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-subtle)', fontWeight: 500 },
  fields: { padding: '2px 0' },
  chip: {
    display: 'flex', alignItems: 'center', gap: 6,
    height: 24, padding: '0 8px 0 12px',
    fontSize: 12, color: 'var(--ink)',
    cursor: 'grab',
  },
  chipDragged: { background: 'var(--primary-soft)', color: 'var(--primary-text)' },
  typeBadge: {
    minWidth: 16, height: 16,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
    color: 'var(--info)',
    background: 'var(--info-soft)',
    borderRadius: 3,
    padding: '0 3px',
  },
  chipName: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  calcBtnWrap: { padding: '6px 8px' },
  calcBtn: {
    width: '100%', height: 26,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
    background: 'var(--surface)',
    boxShadow: 'inset 0 0 0 1px var(--border)',
    borderRadius: 5,
    fontSize: 12, fontWeight: 500, color: 'var(--ink-muted)',
  },
};

// =================================================================
// Chart type picker — small grid above the shelves
// =================================================================
const CHART_TYPES = [
  { id: 'bar',     label: 'Bar' },
  { id: 'column',  label: 'Column' },
  { id: 'line',    label: 'Line' },
  { id: 'area',    label: 'Area' },
  { id: 'pie',     label: 'Pie' },
  { id: 'donut',   label: 'Donut' },
  { id: 'scatter', label: 'Scatter' },
  { id: 'heat',    label: 'Heatmap' },
  { id: 'map',     label: 'Map' },
];

function ChartTypePicker({ active, onPick }) {
  return (
    <div style={ctp.panel}>
      <span style={ctp.label}>Chart type</span>
      <div style={ctp.grid}>
        {CHART_TYPES.map((c) => (
          <button key={c.id}
                  style={{ ...ctp.swatch, ...(active === c.id ? ctp.swatchOn : null) }}
                  onClick={() => onPick(c.id)}
                  title={c.label}>
            <ChartTypeGlyph kind={c.id} active={active === c.id}/>
            <span style={ctp.swatchLabel}>{c.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
function ChartTypeGlyph({ kind, active }) {
  const fill = active ? 'var(--primary)' : 'var(--ink-muted)';
  const muted = active ? 'var(--primary)' : 'var(--ink-subtle)';
  if (kind === 'column') return (
    <svg width="24" height="16" viewBox="0 0 24 16">
      <rect x="2"  y="8" width="3" height="8" fill={fill}/>
      <rect x="7"  y="4" width="3" height="12" fill={fill}/>
      <rect x="12" y="2" width="3" height="14" fill={fill}/>
      <rect x="17" y="6" width="3" height="10" fill={fill}/>
    </svg>
  );
  if (kind === 'bar') return (
    <svg width="24" height="16" viewBox="0 0 24 16">
      <rect x="0" y="2"  width="10" height="3" fill={fill}/>
      <rect x="0" y="7"  width="20" height="3" fill={fill}/>
      <rect x="0" y="12" width="14" height="3" fill={fill}/>
    </svg>
  );
  if (kind === 'line') return (
    <svg width="24" height="16" viewBox="0 0 24 16">
      <polyline points="1,12 7,7 13,9 19,3 23,5" fill="none" stroke={fill} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
  if (kind === 'area') return (
    <svg width="24" height="16" viewBox="0 0 24 16">
      <path d="M1,14 L7,8 L13,10 L19,4 L23,6 L23,15 L1,15 Z" fill={fill} opacity="0.4"/>
      <polyline points="1,14 7,8 13,10 19,4 23,6" fill="none" stroke={fill} strokeWidth="1.5"/>
    </svg>
  );
  if (kind === 'pie') return (
    <svg width="24" height="16" viewBox="0 0 24 16">
      <circle cx="12" cy="8" r="6" fill={muted} opacity="0.4"/>
      <path d="M12,8 L12,2 A6,6 0 0 1 18,8 Z" fill={fill}/>
    </svg>
  );
  if (kind === 'donut') return (
    <svg width="24" height="16" viewBox="0 0 24 16">
      <circle cx="12" cy="8" r="6" fill="none" stroke={muted} strokeWidth="3" opacity="0.4"/>
      <path d="M12,8 m0,-6 a6,6 0 0 1 6,6" fill="none" stroke={fill} strokeWidth="3"/>
    </svg>
  );
  if (kind === 'scatter') return (
    <svg width="24" height="16" viewBox="0 0 24 16">
      {[[4,11],[8,7],[10,12],[14,5],[17,9],[20,3],[22,8]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="1.5" fill={fill}/>
      ))}
    </svg>
  );
  if (kind === 'heat') return (
    <svg width="24" height="16" viewBox="0 0 24 16">
      {[0,1,2,3].map(r =>
        [0,1,2,3,4,5].map(c => {
          const op = (r + c) % 5 / 4.5 + 0.2;
          return <rect key={`${r}-${c}`} x={c*4} y={r*4} width="3.5" height="3.5" fill={fill} opacity={op}/>;
        })
      )}
    </svg>
  );
  if (kind === 'map') return (
    <svg width="24" height="16" viewBox="0 0 24 16">
      <path d="M3,5 Q8,2 12,5 T21,5 L20,12 Q15,14 10,12 T3,12 Z" fill={fill} opacity="0.3" stroke={fill} strokeWidth="1"/>
      <circle cx="9"  cy="7"  r="1.5" fill={fill}/>
      <circle cx="16" cy="9"  r="1.5" fill={fill}/>
    </svg>
  );
  return null;
}
const ctp = {
  panel: { padding: '12px 16px', borderBottom: '1px solid var(--hairline)' },
  label: { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 6 },
  swatch: {
    height: 48,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
    background: 'var(--surface)',
    boxShadow: 'inset 0 0 0 1px var(--border)',
    borderRadius: 6,
  },
  swatchOn: {
    background: 'var(--primary-tint)',
    boxShadow: 'inset 0 0 0 1.5px var(--primary)',
  },
  swatchLabel: { fontSize: 10, color: 'var(--ink-muted)', fontWeight: 500 },
};

// =================================================================
// Shelves — the actual bindings. Each shelf accepts drops.
// =================================================================
const SHELF_DEFS = [
  { id: 'x',       label: 'X-Axis',  accepts: 'dim',  hint: 'Dimension' },
  { id: 'y',       label: 'Y-Axis',  accepts: 'meas', hint: 'Measure' },
  { id: 'color',   label: 'Color',   accepts: 'any',  hint: 'Dimension or measure' },
  { id: 'shape',   label: 'Shape',   accepts: 'dim',  hint: 'Dimension' },
  { id: 'size',    label: 'Size',    accepts: 'meas', hint: 'Measure' },
  { id: 'text',    label: 'Text',    accepts: 'any',  hint: 'Label fields' },
  { id: 'tooltip', label: 'Tooltip', accepts: 'any',  hint: 'Extra detail on hover' },
  { id: 'detail',  label: 'Detail',  accepts: 'dim',  hint: 'Disaggregate by' },
];

function Shelves({ shelves, dragged, onDrop, onRemove }) {
  return (
    <div style={sh.panel}>
      <span style={sh.label}>Bindings</span>
      <div style={sh.list}>
        {SHELF_DEFS.map((def) => (
          <Shelf key={def.id}
                 def={def}
                 fields={shelves[def.id] || []}
                 dragged={dragged}
                 onDrop={() => onDrop(def.id)}
                 onRemove={(name) => onRemove(def.id, name)}/>
        ))}
      </div>
    </div>
  );
}
function Shelf({ def, fields, dragged, onDrop, onRemove }) {
  const [over, setOver] = useState(false);
  return (
    <div style={sh.row}>
      <div style={sh.shelfLabel}>
        <span style={sh.shelfName}>{def.label}</span>
        <span style={sh.shelfAccepts}>{def.accepts === 'meas' ? '#' : def.accepts === 'dim' ? 'A' : '◇'}</span>
      </div>
      <div
        style={{ ...sh.dropzone, ...(over ? sh.dropzoneOver : null), ...(fields.length === 0 ? sh.dropzoneEmpty : null) }}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); onDrop(); }}
      >
        {fields.length === 0 ? (
          <span style={sh.dropHint}>{dragged ? 'Drop here' : def.hint}</span>
        ) : (
          fields.map((f) => (
            <div key={f.name + (f.agg || '')} style={sh.pill}>
              {f.agg && <span style={sh.aggBadge}>{f.agg}</span>}
              <span>{f.name}</span>
              <button style={sh.pillX} onClick={() => onRemove(f.name)} title="Remove">×</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
const sh = {
  panel: { padding: '12px 16px', borderBottom: '1px solid var(--hairline)' },
  label: { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  list: { display: 'flex', flexDirection: 'column', gap: 6 },
  row: { display: 'flex', alignItems: 'flex-start', gap: 8 },
  shelfLabel: {
    flex: '0 0 80px',
    display: 'inline-flex', alignItems: 'center', gap: 6,
    height: 28,
    fontSize: 12, color: 'var(--ink)', fontWeight: 500,
  },
  shelfName: { flex: 1 },
  shelfAccepts: {
    width: 16, height: 16,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
    color: 'var(--ink-subtle)',
    background: 'var(--bg)',
    borderRadius: 3,
  },
  dropzone: {
    flex: 1, minHeight: 28,
    display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4,
    padding: '4px 6px',
    background: 'var(--surface)',
    boxShadow: 'inset 0 0 0 1px var(--border)',
    borderRadius: 5,
  },
  dropzoneEmpty: { background: 'var(--bg)', boxShadow: 'inset 0 0 0 1px var(--hairline)' },
  dropzoneOver:  { background: 'var(--primary-tint)', boxShadow: 'inset 0 0 0 1.5px var(--primary)' },
  dropHint: { fontSize: 11, color: 'var(--ink-subtle)', fontStyle: 'italic', padding: '0 4px' },
  pill: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    height: 22, padding: '0 4px 0 6px',
    background: 'var(--info-soft)',
    color: 'var(--info)',
    boxShadow: 'inset 0 0 0 1px rgba(62,127,196,0.25)',
    borderRadius: 4,
    fontSize: 12, fontWeight: 500,
  },
  aggBadge: {
    fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
    color: 'var(--info)',
    background: '#fff',
    padding: '1px 4px', borderRadius: 3,
    boxShadow: 'inset 0 0 0 1px rgba(62,127,196,0.2)',
  },
  pillX: { width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'var(--info)', lineHeight: 1 },
};

// =================================================================
// Live preview — the chart, rendered live as bindings change
// =================================================================
function LivePreview({ chartType, shelves }) {
  const hasX = (shelves.x || []).length > 0;
  const hasY = (shelves.y || []).length > 0;
  const hasColor = (shelves.color || []).length > 0;
  const ready = hasX && hasY;
  return (
    <div style={lp.panel}>
      <div style={lp.header}>
        <span style={lp.label}>Preview</span>
        <div style={lp.controls}>
          <button style={lp.ctrlBtn}><Icon name="refresh" size={11}/><span>Refresh</span></button>
          <button style={lp.ctrlBtn}><span style={{ fontSize: 11 }}>▽</span><span>Filters</span></button>
          <div style={lp.divider}/>
          <button style={lp.ctrlBtn}><Icon name="zoom" size={11}/><span>Fit</span></button>
        </div>
      </div>
      <div style={lp.canvas}>
        {ready ? (
          <SamplePreview chartType={chartType} colored={hasColor}/>
        ) : (
          <div style={lp.empty}>
            <Icon name="chart" size={28} color="var(--ink-subtle)"/>
            <div style={lp.emptyTitle}>Drag fields to X-Axis and Y-Axis to preview</div>
            <div style={lp.emptyHint}>
              Drag <strong>Dimensions</strong> to <strong>X</strong>, <strong>Measures</strong> to <strong>Y</strong>.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function SamplePreview({ chartType, colored }) {
  // A simple SVG that visually responds to chart type + color binding
  const w = 520, h = 280;
  const palette = colored
    ? ['#E58A2A', '#3E7FC4', '#2E8B57', '#B85C9A', '#C96F12']
    : ['#3E7FC4'];
  const data = [
    [120, 95, 140, 165, 80],
    [80, 70, 110, 60, 95],
    [60, 85, 75, 55, 110],
    [40, 100, 90, 75, 65],
  ];
  if (chartType === 'column' || chartType === 'bar') {
    const groups = ['Q1','Q2','Q3','Q4'];
    const gw = (w - 80) / groups.length;
    const bw = colored ? gw / 6 : gw / 2;
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`}>
        <line x1="40" y1={h-30} x2={w-20} y2={h-30} stroke="var(--border)"/>
        <line x1="40" y1="20" x2="40" y2={h-30} stroke="var(--border)"/>
        {[0,50,100,150].map((v,i) => (
          <text key={v} x="36" y={h-30 - (v/170)*(h-60)} textAnchor="end" fontSize="9" fill="var(--ink-subtle)">{v}</text>
        ))}
        {groups.map((g, gi) => (
          <g key={g}>
            {(colored ? data[gi] : [data[gi][0]]).map((v, vi) => (
              <rect key={vi}
                    x={50 + gi*gw + vi*bw + bw*0.2}
                    y={h - 30 - (v/170)*(h-60)}
                    width={bw*0.7}
                    height={(v/170)*(h-60)}
                    fill={palette[vi % palette.length]}
                    opacity="0.92"/>
            ))}
            <text x={50 + gi*gw + gw/2} y={h-16} textAnchor="middle" fontSize="10" fill="var(--ink-muted)">{g}</text>
          </g>
        ))}
        {colored && (
          <g transform={`translate(${w-130}, 30)`}>
            {['North','South','East','Central','West'].map((label, i) => (
              <g key={label} transform={`translate(0, ${i*16})`}>
                <rect width="10" height="10" fill={palette[i % palette.length]}/>
                <text x="14" y="9" fontSize="10" fill="var(--ink)">{label}</text>
              </g>
            ))}
          </g>
        )}
      </svg>
    );
  }
  if (chartType === 'line' || chartType === 'area') {
    const pts = [120, 95, 140, 165, 80, 110, 145];
    const xs = pts.map((_, i) => 40 + i * ((w - 60) / (pts.length - 1)));
    const ys = pts.map(v => h - 30 - (v/170) * (h - 60));
    const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ');
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`}>
        <line x1="40" y1={h-30} x2={w-20} y2={h-30} stroke="var(--border)"/>
        <line x1="40" y1="20" x2="40" y2={h-30} stroke="var(--border)"/>
        {chartType === 'area' && <path d={`${path} L${xs[xs.length-1]},${h-30} L${xs[0]},${h-30} Z`} fill={palette[0]} opacity="0.18"/>}
        <path d={path} fill="none" stroke={palette[0]} strokeWidth="2"/>
        {xs.map((x, i) => <circle key={i} cx={x} cy={ys[i]} r="3" fill={palette[0]}/>)}
        {['Jan','Feb','Mar','Apr','May','Jun','Jul'].map((m, i) => (
          <text key={m} x={xs[i]} y={h-16} textAnchor="middle" fontSize="10" fill="var(--ink-muted)">{m}</text>
        ))}
      </svg>
    );
  }
  if (chartType === 'pie' || chartType === 'donut') {
    const total = 100;
    const segs = [38, 24, 18, 12, 8];
    let acc = 0;
    const cx = w/2, cy = h/2 - 10, R = 90, r = chartType === 'donut' ? 50 : 0;
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`}>
        {segs.map((s, i) => {
          const a0 = (acc / total) * Math.PI * 2 - Math.PI/2;
          acc += s;
          const a1 = (acc / total) * Math.PI * 2 - Math.PI/2;
          const large = s > 50 ? 1 : 0;
          const x0 = cx + Math.cos(a0)*R, y0 = cy + Math.sin(a0)*R;
          const x1 = cx + Math.cos(a1)*R, y1 = cy + Math.sin(a1)*R;
          if (r > 0) {
            const x2 = cx + Math.cos(a1)*r, y2 = cy + Math.sin(a1)*r;
            const x3 = cx + Math.cos(a0)*r, y3 = cy + Math.sin(a0)*r;
            return <path key={i} d={`M${x0},${y0} A${R},${R} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${r},${r} 0 ${large} 0 ${x3},${y3} Z`} fill={palette[i % palette.length]}/>;
          }
          return <path key={i} d={`M${cx},${cy} L${x0},${y0} A${R},${R} 0 ${large} 1 ${x1},${y1} Z`} fill={palette[i % palette.length]}/>;
        })}
      </svg>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ink-muted)', fontSize: 12 }}>
      Preview not implemented for this chart type
    </div>
  );
}
const lp = {
  panel: { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 },
  header: {
    flex: '0 0 36px',
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '0 16px',
    borderBottom: '1px solid var(--hairline)',
  },
  label: { flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: 0.4 },
  controls: { display: 'flex', alignItems: 'center', gap: 4 },
  ctrlBtn: {
    height: 24, padding: '0 8px',
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 11, color: 'var(--ink)',
    borderRadius: 4,
  },
  divider: { width: 1, height: 14, background: 'var(--border)', margin: '0 4px' },
  canvas: {
    flex: 1, minHeight: 0,
    margin: 16,
    background: 'var(--surface)',
    boxShadow: 'inset 0 0 0 1px var(--hairline)',
    borderRadius: 6,
    padding: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  empty: {
    textAlign: 'center',
    color: 'var(--ink-muted)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    maxWidth: 320,
  },
  emptyTitle: { fontSize: 14, fontWeight: 600, color: 'var(--ink)' },
  emptyHint: { fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.5 },
};

// =================================================================
// Format panel — right side, style options
// =================================================================
function FormatPanel({ chartType }) {
  return (
    <div style={fp.panel}>
      <div style={fp.tabs}>
        <button style={{ ...fp.tab, ...fp.tabOn }}>Style</button>
        <button style={fp.tab}>Axis</button>
        <button style={fp.tab}>Legend</button>
        <button style={fp.tab}>More</button>
      </div>
      <div style={fp.scroll}>
        <FormatSection title="Title">
          <FormatRow label="Show">
            <input type="checkbox" defaultChecked/>
          </FormatRow>
          <FormatRow label="Text">
            <input style={fp.input} defaultValue="Revenue by Region"/>
          </FormatRow>
          <FormatRow label="Align">
            <Segment options={['Left','Center','Right']} active="Center"/>
          </FormatRow>
        </FormatSection>

        <FormatSection title="Colors">
          <FormatRow label="Palette">
            <div style={fp.palette}>
              {['#E58A2A','#3E7FC4','#2E8B57','#B85C9A','#C96F12'].map(c => (
                <span key={c} style={{ ...fp.swatch, background: c }}/>
              ))}
              <button style={fp.paletteBtn} title="Change palette">▾</button>
            </div>
          </FormatRow>
          <FormatRow label="Background">
            <span style={{ ...fp.swatch, background: '#FFFFFF', boxShadow: 'inset 0 0 0 1px var(--border)' }}/>
            <span style={fp.colorLabel}>White</span>
          </FormatRow>
        </FormatSection>

        <FormatSection title="Data labels">
          <FormatRow label="Show">
            <input type="checkbox"/>
          </FormatRow>
          <FormatRow label="Format">
            <select style={fp.input} defaultValue="$#,##0">
              <option>Auto</option>
              <option>$#,##0</option>
              <option>0.00</option>
              <option>0%</option>
            </select>
          </FormatRow>
        </FormatSection>

        <FormatSection title="Gridlines">
          <FormatRow label="Horizontal">
            <Segment options={['On','Off']} active="On"/>
          </FormatRow>
          <FormatRow label="Vertical">
            <Segment options={['On','Off']} active="Off"/>
          </FormatRow>
        </FormatSection>

        <FormatSection title="Sort">
          <FormatRow label="By">
            <select style={fp.input}>
              <option>X-Axis (label)</option>
              <option>Y-Axis (value)</option>
              <option>None</option>
            </select>
          </FormatRow>
          <FormatRow label="Direction">
            <Segment options={['Asc','Desc']} active="Asc"/>
          </FormatRow>
        </FormatSection>
      </div>
    </div>
  );
}
function FormatSection({ title, children }) {
  return (
    <div style={fp.section}>
      <div style={fp.sectionTitle}>{title}</div>
      <div style={fp.sectionBody}>{children}</div>
    </div>
  );
}
function FormatRow({ label, children }) {
  return (
    <div style={fp.row}>
      <span style={fp.rowLabel}>{label}</span>
      <div style={fp.rowControl}>{children}</div>
    </div>
  );
}
function Segment({ options, active }) {
  return (
    <div style={fp.segment}>
      {options.map((o) => (
        <button key={o} style={{ ...fp.segBtn, ...(o === active ? fp.segBtnOn : null) }}>{o}</button>
      ))}
    </div>
  );
}
const fp = {
  panel: {
    flex: '0 0 280px', width: 280,
    display: 'flex', flexDirection: 'column',
    background: 'var(--chrome)',
    borderLeft: '1px solid var(--border)',
    minHeight: 0,
  },
  tabs: {
    flex: '0 0 36px',
    display: 'flex', alignItems: 'center', gap: 0,
    padding: '0 4px',
    borderBottom: '1px solid var(--hairline)',
  },
  tab: { height: 28, padding: '0 10px', borderRadius: 5, fontSize: 12, fontWeight: 500, color: 'var(--ink-muted)' },
  tabOn: { background: 'var(--surface)', color: 'var(--ink)', boxShadow: 'inset 0 0 0 1px var(--border)' },
  scroll: { flex: 1, overflowY: 'auto', padding: '4px 0' },
  section: { padding: '8px 0', borderBottom: '1px solid var(--hairline)' },
  sectionTitle: { padding: '6px 16px 4px', fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: 0.4 },
  sectionBody: { padding: '2px 0' },
  row: { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 16px', minHeight: 28 },
  rowLabel: { flex: '0 0 80px', fontSize: 12, color: 'var(--ink-muted)' },
  rowControl: { flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 },
  input: {
    width: '100%', height: 26,
    padding: '0 8px',
    background: 'var(--surface)',
    boxShadow: 'inset 0 0 0 1px var(--border)',
    borderRadius: 4,
    fontSize: 12, color: 'var(--ink)',
    border: 0, outline: 0,
  },
  palette: { display: 'inline-flex', alignItems: 'center', gap: 3 },
  swatch: { width: 18, height: 18, borderRadius: 3 },
  paletteBtn: { width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3, color: 'var(--ink-muted)' },
  colorLabel: { fontSize: 12, color: 'var(--ink)' },
  segment: {
    display: 'inline-flex', alignItems: 'center', gap: 0,
    background: 'var(--bg)',
    borderRadius: 4,
    padding: 2,
  },
  segBtn: { height: 22, padding: '0 8px', borderRadius: 3, fontSize: 11, color: 'var(--ink-muted)' },
  segBtnOn: { background: 'var(--surface)', color: 'var(--ink)', boxShadow: '0 1px 2px rgba(40,30,15,0.06)' },
};

// =================================================================
// Modal-frame layer — wraps the editor card and shows a dimmed
// composer underneath. This is fix #2 from the "users can't find
// their way back" complaint: when the editor looks like a card
// floating over the viewsheet (rather than fully replacing it),
// users intuitively read it as a temporary layer and look for an
// exit. The dim is just a backdrop, not interactive.
// =================================================================
function ComposerBackdrop() {
  // A flat, blurred-looking impression of the underlying composer —
  // the file-tab strip, a dashboard with a chart card and a couple of
  // table cards. Just enough to read as "there's a dashboard back
  // there" without competing for attention.
  return (
    <div style={cb.root} aria-hidden="true">
      <div style={cb.tabStrip}>
        <div style={{ ...cb.tabPill, ...cb.tabPillActive }}>
          <div style={{ ...cb.tabDot, background: '#4B7BD9' }}/>
          <div style={cb.tabLabel}>Sales Dashboard</div>
        </div>
        <div style={cb.tabPill}>
          <div style={{ ...cb.tabDot, background: '#7A9E5C' }}/>
          <div style={cb.tabLabel}>Pipeline</div>
        </div>
      </div>
      <div style={cb.canvas}>
        <div style={{ ...cb.card, gridColumn: '1 / span 2', gridRow: '1 / span 2' }}>
          <div style={cb.cardTitle}/>
          <div style={cb.chartMock}>
            {[42, 68, 51, 78, 60, 88, 72].map((h, i) => (
              <div key={i} style={{ ...cb.bar, height: `${h}%` }}/>
            ))}
          </div>
        </div>
        <div style={cb.card}>
          <div style={cb.cardTitle}/>
          <div style={cb.tableMock}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={cb.tableRow}>
                <div style={{ ...cb.tableCell, flex: 2 }}/>
                <div style={cb.tableCell}/>
                <div style={cb.tableCell}/>
              </div>
            ))}
          </div>
        </div>
        <div style={cb.card}>
          <div style={cb.cardTitle}/>
          <div style={cb.kpiMock}>
            <div style={cb.kpiNum}/>
            <div style={cb.kpiSub}/>
          </div>
        </div>
      </div>
    </div>
  );
}
const cb = {
  root: {
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column',
    background: '#EEEBE4',
  },
  tabStrip: {
    flex: '0 0 36px', display: 'flex', alignItems: 'center', gap: 4,
    padding: '0 12px',
    background: '#E5DFD2',
    borderBottom: '1px solid #C9C1AF',
  },
  tabPill: {
    height: 24, padding: '0 10px',
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'rgba(255,255,255,0.4)',
    border: '1px solid rgba(180,170,150,0.5)',
    borderRadius: 4,
  },
  tabPillActive: { background: '#F6F2E9', borderColor: '#C9C1AF' },
  tabDot: { width: 8, height: 8, borderRadius: 2, opacity: 0.7 },
  tabLabel: { width: 70, height: 6, borderRadius: 2, background: 'rgba(80,70,50,0.35)' },
  canvas: {
    flex: 1, padding: 24,
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gridTemplateRows: 'repeat(2, 1fr)',
    gap: 16,
  },
  card: {
    background: '#FFFFFF',
    border: '1px solid #D8D0BC',
    borderRadius: 6,
    padding: 16,
    display: 'flex', flexDirection: 'column', gap: 12,
    minHeight: 0, minWidth: 0,
  },
  cardTitle: { width: '40%', height: 8, borderRadius: 2, background: '#D8D0BC' },
  chartMock: {
    flex: 1,
    display: 'flex', alignItems: 'flex-end', gap: 8,
    paddingTop: 8,
  },
  bar: { flex: 1, background: 'linear-gradient(180deg, #C4B999 0%, #A89C7A 100%)', borderRadius: '2px 2px 0 0', minHeight: 8 },
  tableMock: { flex: 1, display: 'flex', flexDirection: 'column', gap: 6 },
  tableRow: { display: 'flex', gap: 8 },
  tableCell: { flex: 1, height: 6, borderRadius: 2, background: '#E5DFD2' },
  kpiMock: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 },
  kpiNum: { width: '60%', height: 22, borderRadius: 3, background: '#C4B999' },
  kpiSub: { width: '40%', height: 6, borderRadius: 2, background: '#D8D0BC' },
};

const mf = {
  // Outer stage fills the viewport with a dark "behind-the-page" tone.
  stage: {
    position: 'relative',
    flex: 1, minHeight: 0,
    overflow: 'hidden',
  },
  // Dim layer between the composer impression and the editor card.
  // Soft brown-black to match the warm StyleBI palette.
  dim: {
    position: 'absolute', inset: 0,
    background: 'rgba(20, 14, 4, 0.55)',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
  },
  // Positioning wrapper for the floating editor card.
  cardWrap: {
    position: 'absolute',
    top: 16, right: 16, bottom: 16, left: 16,
    display: 'flex',
  },
  // Styles merged onto the editor root when modalFrame is on.
  card: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    boxShadow: '0 24px 64px -12px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(0, 0, 0, 0.2)',
  },
};

// =================================================================
// App
// =================================================================
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [chartType, setChartType] = useState('column');
  const [dragged, setDragged] = useState(null);
  const [search, setSearch] = useState('');

  // Pre-populated for "bound" stage; cleared for "empty"
  const populatedShelves = {
    x:     [{ name: 'Region',  type: 'cat' }],
    y:     [{ name: 'Revenue', type: 'num$', agg: 'SUM' }],
    color: [{ name: 'Product Family', type: 'cat' }],
  };
  const [shelves, setShelves] = useState(populatedShelves);

  // Stage-driven seeding
  useMemo(() => {
    if (t.stage === 'empty')    setShelves({});
    if (t.stage === 'partial')  setShelves({ x: [{ name: 'Region', type: 'cat' }] });
    if (t.stage === 'populated') setShelves(populatedShelves);
  }, [t.stage]);

  const onDrop = (shelfId) => {
    if (!dragged) return;
    const field = [...FIELDS.measures, ...FIELDS.dimensions].find(f => f.name === dragged);
    if (!field) return;
    const isMeasure = field.type.startsWith('num');
    const item = isMeasure ? { ...field, agg: 'SUM' } : { ...field };
    setShelves((s) => {
      const cur = s[shelfId] || [];
      if (cur.some(f => f.name === field.name)) return s;
      return { ...s, [shelfId]: [...cur, item] };
    });
    setDragged(null);
  };
  const onRemove = (shelfId, name) => {
    setShelves((s) => ({ ...s, [shelfId]: (s[shelfId] || []).filter(f => f.name !== name) }));
  };

  // The editor body — wrapped in a modal-frame layer when t.modalFrame
  // is on. The composer underneath is shown dimmed so users perceive
  // the editor as a temporary layer over the dashboard, not as the
  // current screen.
  const editor = (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0,
                  background: 'var(--chrome)',
                  ...(t.modalFrame ? mf.card : null) }}>
      <EditorTopBar assetName={t.assetName}
                    chartName={t.chartName}
                    exitAffordance={t.exitAffordance}
                    verboseDone={t.verboseDone}
                    onCancel={() => {}}
                    onDone={() => {}}/>
      <div style={{ flex: 1, display: 'flex', minHeight: 0, background: '#EEEBE4' }}>
        {t.showDataTree && (
          <DataTree dataSource={t.dataSource}
                    search={search} setSearch={setSearch}
                    dragged={dragged} setDragged={setDragged}/>
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--bg)' }}>
          <ChartTypePicker active={chartType} onPick={setChartType}/>
          <Shelves shelves={shelves} dragged={dragged}
                   onDrop={onDrop} onRemove={onRemove}/>
          <LivePreview chartType={chartType} shelves={shelves}/>
        </div>
        {t.showFormat && <FormatPanel chartType={chartType}/>}
      </div>
    </div>
  );

  return (
    <div data-screen-label="01 Binding Editor v3 (Option A — Modal Takeover)"
         style={{ height: '100vh', display: 'flex', flexDirection: 'column',
                  background: t.modalFrame ? '#1F1B16' : 'var(--chrome)' }}>
      {t.modalFrame ? (
        <div style={mf.stage}>
          <ComposerBackdrop/>
          <div style={mf.dim}/>
          <div style={mf.cardWrap}>{editor}</div>
        </div>
      ) : editor}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Exit affordance">
          <TweakSelect
            label="Top-left"
            value={t.exitAffordance}
            onChange={(v) => setTweak('exitAffordance', v)}
            options={[
              { value: 'standard', label: 'File tab only (current)' },
              { value: 'backChip', label: '\u2190 Back to Composer / Asset' },
              { value: 'both',     label: 'Back chip + file tab' },
            ]}
          />
          <TweakToggle label='Verbose Done ("Done editing chart")'
                       value={t.verboseDone}
                       onChange={(v) => setTweak('verboseDone', v)}/>
          <TweakToggle label='Modal frame (dim composer behind)'
                       value={t.modalFrame}
                       onChange={(v) => setTweak('modalFrame', v)}/>
          <div style={{ fontSize: 11, color: 'var(--ink-subtle)', lineHeight: 1.5, marginTop: 4 }}>
            Three fixes for the "how do I get back?" complaint. Compare them individually, then layer.
          </div>
        </TweakSection>
        <TweakSection label="Scenario">
          <TweakSelect
            label="Stage"
            value={t.stage}
            onChange={(v) => setTweak('stage', v)}
            options={[
              { value: 'empty',     label: '1 \u2014 Empty (just opened)' },
              { value: 'partial',   label: '2 \u2014 Partial (X bound)' },
              { value: 'populated', label: '3 \u2014 Populated (real bindings)' },
            ]}
          />
        </TweakSection>
        <TweakSection label="Context">
          <TweakText  label="Asset name" value={t.assetName}  onChange={(v) => setTweak('assetName', v)}/>
          <TweakText  label="Chart name" value={t.chartName}  onChange={(v) => setTweak('chartName', v)}/>
          <TweakText  label="Data source" value={t.dataSource} onChange={(v) => setTweak('dataSource', v)}/>
        </TweakSection>
        <TweakSection label="Panels">
          <TweakToggle label="Data tree (left)" value={t.showDataTree} onChange={(v) => setTweak('showDataTree', v)}/>
          <TweakToggle label="Format (right)"   value={t.showFormat}   onChange={(v) => setTweak('showFormat', v)}/>
          <div style={{ fontSize: 11, color: 'var(--ink-subtle)', lineHeight: 1.5, marginTop: 4 }}>
            Option A docks both side panels (no floating). If your layout is constrained, format collapses first.
          </div>
        </TweakSection>
      </TweaksPanel>

      <style>{`
        button:hover { background: var(--chrome-hover); }
        button[style*="background: var(--primary)"]:hover { background: var(--primary-hover) !important; }
      `}</style>
    </div>
  );
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "stage": "populated",
  "assetName": "Sales Dashboard",
  "chartName": "Revenue by Region",
  "dataSource": "Construction Data",
  "showDataTree": true,
  "showFormat": true,
  "exitAffordance": "backChip",
  "verboseDone": true,
  "modalFrame": true
}/*EDITMODE-END*/;

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
