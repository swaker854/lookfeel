// Composer — Dialog patterns mock (4-bucket model)
// =================================================================
// Demonstrates the four surface patterns that replace today's ~50
// modal dialogs. See specs/stage2/dialog-strategy.md for the full
// rationale.
//
//   Bucket 1 — Object properties → RIGHT INSPECTOR (gauge selected)
//   Bucket 2 — Wizards          → SIDE SHEET (Import CSV)
//   Bucket 3a — Quick / anchored → POPOVER (Sort column)
//   Bucket 3b — Quick / global   → COMPACT MODAL (Save viewsheet)
//   Bucket 4 — Routable mini-apps → same chrome as Bucket 2 + URL
//                                  (deferred — not mocked here)
//   Bucket 5 — Chart properties  → see composer-binding-editor-v3.html
//
// Tweaks panel cycles which pattern is open so the team can compare
// side-by-side.
// =================================================================

const { useState } = React;
const Icon = window.Icon;
const {
  useTweaks, TweaksPanel, TweakSection,
  TweakSelect, TweakToggle,
} = window;

// =================================================================
// Shared shell — minimal v3 chrome so the dialog patterns sit in
// realistic context. Top bar + rail + left panel + canvas + right
// inspector. No status bar, no Ask AI — those aren't needed to read
// the patterns.
// =================================================================
function TopBar() {
  return (
    <div style={s.topBar}>
      <div style={s.tabStrip}>
        <div style={s.tab}>
          <Icon name="doc" size={12} color="var(--info)"/>
          <span>Sales Dashboard</span>
          <span style={s.savedChip}>Saved</span>
        </div>
      </div>
      <div style={s.topRight}>
        <button style={s.previewBtn}>Preview</button>
      </div>
    </div>
  );
}

function Rail({ active, onSelect }) {
  const items = [
    { id: 'assets',     icon: 'data',       label: 'Assets' },
    { id: 'toolbox',    icon: 'toolbox',    label: 'Toolbox' },
    { id: 'components', icon: 'layers',     label: 'Components' },
    { id: 'inspector',  icon: 'sliders',    label: 'Inspector' },
  ];
  return (
    <div style={s.rail}>
      {items.map((it) => (
        <button
          key={it.id}
          title={it.label}
          onClick={() => onSelect(it.id)}
          style={{ ...s.railBtn, ...(active === it.id ? s.railBtnOn : null) }}>
          <Icon name={it.icon} size={16} color="currentColor"/>
        </button>
      ))}
    </div>
  );
}

function LeftPanel() {
  const items = ['Revenue by region', 'Top accounts', 'Pipeline by stage', 'Spacer', 'KPI strip'];
  return (
    <div style={s.leftPanel}>
      <div style={s.panelHeader}>
        <span style={s.panelTitle}>Components</span>
      </div>
      <div style={s.panelBody}>
        {items.map((label, i) => (
          <div key={label} style={{ ...s.row, ...(i === 1 ? s.rowSelected : null) }}>
            <Icon name={i === 1 ? 'table' : i === 0 ? 'chart' : 'square'} size={12}
                  color={i === 1 ? 'var(--c-selected-text)' : 'var(--ink-muted)'}/>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =================================================================
// Bucket 1 — Right inspector (object property dialog replacement)
// Always visible. Header shows selection. Tabs: General / Format / Script.
// =================================================================
function RightInspector({ selection }) {
  const [tab, setTab] = useState('general');
  if (!selection) {
    return (
      <div style={s.rightPanel}>
        <div style={s.inspEmpty}>Select an object to edit its properties</div>
      </div>
    );
  }
  return (
    <div style={s.rightPanel}>
      <div style={s.inspHeader}>
        <div style={s.inspSelChip}>
          <Icon name="gauge" size={12} color="var(--c-selected-text)"/>
          <span>{selection.name}</span>
        </div>
        <button style={s.inspRevert} title="Revert this object's properties">
          <Icon name="undo" size={11} color="currentColor"/>
          <span>Revert</span>
        </button>
      </div>
      <div style={s.inspTabs}>
        {['general', 'format', 'script'].map((id) => (
          <button key={id}
                  onClick={() => setTab(id)}
                  style={{ ...s.inspTab, ...(tab === id ? s.inspTabOn : null) }}>
            {id[0].toUpperCase() + id.slice(1)}
          </button>
        ))}
      </div>
      <div style={s.inspBody}>
        {tab === 'general' && (
          <>
            <Field label="Name" value="gauge1"/>
            <Field label="Title" value="Quota attainment"/>
            <FieldRow>
              <Field label="Min" value="0" w={60}/>
              <Field label="Max" value="120" w={60}/>
              <Field label="Target" value="100" w={60}/>
            </FieldRow>
            <Field label="Value" value="=sum([Revenue])"/>
            <FieldRow>
              <Field label="Width" value="220" w={80}/>
              <Field label="Height" value="220" w={80}/>
            </FieldRow>
            <Toggle label="Show needle" on/>
            <Toggle label="Show value label" on/>
            <div style={s.helperLine}>Live edit — Esc to revert object</div>
          </>
        )}
        {tab === 'format' && (
          <>
            <Field label="Background" value="#FFFFFF"/>
            <Field label="Border" value="1 · solid · #D9D5CC"/>
            <Field label="Corner radius" value="8"/>
            <Field label="Font" value="Inter · 12 · Regular"/>
          </>
        )}
        {tab === 'script' && (
          <div style={s.scriptBox}>
            <div style={s.scriptLine}><span style={s.scriptK}>onInit</span>(<span style={s.scriptS}>()</span> {'=>'} {'{'}</div>
            <div style={s.scriptLine}>  gauge1.value = sum(Revenue);</div>
            <div style={s.scriptLine}>{'}'});</div>
          </div>
        )}
      </div>
    </div>
  );
}

const Field = ({ label, value, w }) => (
  <label style={{ ...s.field, ...(w ? { width: w } : null) }}>
    <span style={s.fieldLabel}>{label}</span>
    <input style={s.fieldInput} defaultValue={value}/>
  </label>
);
const FieldRow = ({ children }) => (
  <div style={{ display: 'flex', gap: 8 }}>{children}</div>
);
const Toggle = ({ label, on }) => (
  <div style={s.toggleRow}>
    <span>{label}</span>
    <span style={{ ...s.toggleTrack, ...(on ? s.toggleTrackOn : null) }}>
      <span style={{ ...s.toggleThumb, ...(on ? s.toggleThumbOn : null) }}/>
    </span>
  </div>
);

// =================================================================
// Canvas — viewsheet preview with a gauge selected
// =================================================================
function Canvas({ onColumnHeaderClick, sortOpenAt }) {
  return (
    <div style={s.canvasWrap}>
      <div style={s.frame}>
        {/* Title band */}
        <div style={s.vsTitle}>Sales Dashboard</div>
        {/* KPI strip */}
        <div style={s.kpiStrip}>
          {[
            { label: 'Revenue MTD', val: '$1.42M', delta: '+8.2%' },
            { label: 'New accounts', val: '47',    delta: '+12' },
            { label: 'Pipeline',     val: '$8.9M', delta: '+1.1%' },
            { label: 'Forecast',     val: '92%',   delta: '-2pts' },
          ].map((k) => (
            <div key={k.label} style={s.kpi}>
              <div style={s.kpiLabel}>{k.label}</div>
              <div style={s.kpiVal}>{k.val}</div>
              <div style={s.kpiDelta}>{k.delta}</div>
            </div>
          ))}
        </div>
        {/* Body */}
        <div style={s.vsBody}>
          {/* Left: bar chart */}
          <div style={s.vsCol}>
            <div style={s.objHeader}>Revenue by region</div>
            <BarChart/>
          </div>
          {/* Right: table */}
          <div style={s.vsCol}>
            <div style={s.objHeader}>Top accounts</div>
            <TablePreview onColumnHeaderClick={onColumnHeaderClick} sortOpenAt={sortOpenAt}/>
          </div>
        </div>
        {/* Bottom: selected gauge */}
        <div style={s.vsRow}>
          <SelectedGauge/>
        </div>
      </div>
    </div>
  );
}

const SelectedGauge = () => (
  <div style={s.gaugeWrap}>
    {/* selection chrome */}
    <div style={s.selRing}/>
    <div style={s.selChip}>gauge1</div>
    <div style={s.gauge}>
      <svg viewBox="0 0 200 110" width="100%" height="100%">
        <path d="M 20 100 A 80 80 0 0 1 180 100" stroke="#E8E4DB" strokeWidth="14" fill="none" strokeLinecap="round"/>
        <path d="M 20 100 A 80 80 0 0 1 145 32" stroke="var(--primary)" strokeWidth="14" fill="none" strokeLinecap="round"/>
        <circle cx="100" cy="100" r="5" fill="var(--ink)"/>
        <line x1="100" y1="100" x2="138" y2="42" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
      <div style={s.gaugeVal}>92%</div>
      <div style={s.gaugeLabel}>Quota attainment</div>
    </div>
  </div>
);

const BarChart = () => {
  const bars = [62, 88, 41, 73, 55, 91, 38];
  return (
    <div style={s.chartBox}>
      <div style={s.barRow}>
        {bars.map((h, i) => (
          <div key={i} style={{ ...s.bar, height: `${h}%`, background: i === 5 ? 'var(--primary)' : 'var(--info)' }}/>
        ))}
      </div>
      <div style={s.barAxis}>
        {['NE', 'NW', 'SE', 'SW', 'C', 'W', 'INT'].map((l) => <span key={l}>{l}</span>)}
      </div>
    </div>
  );
};

const TablePreview = ({ onColumnHeaderClick, sortOpenAt }) => (
  <div style={s.tableBox}>
    <div style={s.tHead}>
      {['Account', 'Region', 'Revenue', 'Δ'].map((c, i) => (
        <button key={c}
                data-th={c}
                onClick={(e) => onColumnHeaderClick(e, c, i)}
                style={{ ...s.tHeadCell, ...(sortOpenAt === i ? s.tHeadCellOn : null) }}>
          <span>{c}</span>
          <Icon name="chevron-down" size={9} color="currentColor"/>
        </button>
      ))}
    </div>
    {[
      ['Acme Corp',     'NW', '$240k', '+12%'],
      ['Nimbus Group',  'NE', '$198k', '+8%'],
      ['Bridgepoint',   'SE', '$172k', '+4%'],
      ['Solstice Labs', 'W',  '$154k', '-2%'],
      ['Vega Holdings', 'C',  '$131k', '+9%'],
    ].map((row) => (
      <div key={row[0]} style={s.tRow}>
        {row.map((c, i) => <div key={i} style={s.tCell}>{c}</div>)}
      </div>
    ))}
  </div>
);

// =================================================================
// Bucket 2 — Side sheet (Import CSV wizard)
// 60% viewport width, scrim, step indicator, Back/Next/Cancel.
// =================================================================
function ImportCsvSheet({ onClose }) {
  const [step, setStep] = useState(1);
  return (
    <>
      <div style={s.scrim} onClick={onClose}/>
      <div style={s.sideSheet}>
        <div style={s.sheetHeader}>
          <div>
            <div style={s.sheetEyebrow}>Import data</div>
            <div style={s.sheetTitle}>Bring in a CSV file</div>
          </div>
          <button style={s.sheetClose} onClick={onClose} title="Close">
            <Icon name="close" size={14} color="currentColor"/>
          </button>
        </div>
        <div style={s.stepper}>
          {['File', 'Mapping', 'Preview', 'Commit'].map((label, i) => {
            const idx = i + 1;
            const state = idx < step ? 'done' : idx === step ? 'active' : 'idle';
            return (
              <div key={label} style={s.step}>
                <span style={{
                  ...s.stepDot,
                  ...(state === 'active' ? s.stepDotActive : null),
                  ...(state === 'done' ? s.stepDotDone : null),
                }}>{state === 'done' ? '✓' : idx}</span>
                <span style={{ ...s.stepLabel, ...(state === 'active' ? s.stepLabelActive : null) }}>{label}</span>
                {idx < 4 && <span style={s.stepConnector}/>}
              </div>
            );
          })}
        </div>
        <div style={s.sheetBody}>
          {step === 1 && (
            <>
              <div style={s.dropzone}>
                <Icon name="upload" size={24} color="var(--ink-muted)"/>
                <div style={s.dropTitle}>Drop a CSV file here</div>
                <div style={s.dropHint}>or <span style={s.dropLink}>browse to upload</span></div>
                <div style={s.dropMeta}>UTF-8 · up to 200 MB · headers in first row</div>
              </div>
              <div style={s.recent}>
                <div style={s.recentHeader}>Recent imports</div>
                {['accounts_2024Q4.csv', 'pipeline_snapshot.csv', 'forecasts_clean.csv'].map((f) => (
                  <div key={f} style={s.recentRow}>
                    <Icon name="doc" size={11} color="var(--ink-muted)"/>
                    <span>{f}</span>
                    <span style={s.recentMeta}>2 days ago · 1.4 MB</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <div style={s.mapHint}>Pick the type for each column. Detected types in muted text.</div>
              <div style={s.mapTable}>
                {[
                  ['account_name', 'text', 'Text'],
                  ['region', 'text', 'Text'],
                  ['revenue', 'number', 'Number (USD)'],
                  ['close_date', 'date', 'Date (YYYY-MM-DD)'],
                  ['stage', 'enum', 'Category'],
                ].map(([col, detected, choice]) => (
                  <div key={col} style={s.mapRow}>
                    <div style={s.mapCol}>{col}</div>
                    <div style={s.mapDetected}>detected: {detected}</div>
                    <div style={s.mapSelect}>{choice} <Icon name="chevron-down" size={9}/></div>
                  </div>
                ))}
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <div style={s.previewMeta}>1,247 rows · 5 columns · no parse errors</div>
              <div style={s.tableBox}>
                <div style={s.tHead}>
                  {['Account', 'Region', 'Revenue', 'Close date', 'Stage'].map((c) => (
                    <div key={c} style={s.tHeadCellStatic}>{c}</div>
                  ))}
                </div>
                {[
                  ['Acme Corp', 'NW', '$240,000', '2024-11-08', 'Won'],
                  ['Nimbus Group', 'NE', '$198,500', '2024-12-02', 'Won'],
                  ['Bridgepoint', 'SE', '$172,300', '2025-01-15', 'Negotiating'],
                  ['Solstice Labs', 'W', '$154,100', '2024-10-22', 'Won'],
                  ['Vega Holdings', 'C', '$131,800', '2025-02-04', 'Discovery'],
                ].map((row, i) => (
                  <div key={i} style={s.tRow}>
                    {row.map((c, j) => <div key={j} style={s.tCell}>{c}</div>)}
                  </div>
                ))}
              </div>
            </>
          )}
          {step === 4 && (
            <div style={s.commitBox}>
              <Icon name="check-circle" size={28} color="var(--primary)"/>
              <div style={s.commitTitle}>Ready to import</div>
              <div style={s.commitDesc}>1,247 rows will land as a new worksheet named <strong>accounts_2024Q4</strong>.</div>
              <Field label="Worksheet name" value="accounts_2024Q4"/>
              <Toggle label="Open as new tab after import" on/>
            </div>
          )}
        </div>
        <div style={s.sheetFooter}>
          <button style={s.btnGhost} onClick={onClose}>Cancel</button>
          <div style={{ flex: 1 }}/>
          {step > 1 && <button style={s.btnSecondary} onClick={() => setStep(step - 1)}>Back</button>}
          {step < 4 && <button style={s.btnPrimary} onClick={() => setStep(step + 1)}>Next</button>}
          {step === 4 && <button style={s.btnPrimary} onClick={onClose}>Import</button>}
        </div>
      </div>
    </>
  );
}

// =================================================================
// Bucket 3a — Anchored popover (Sort column)
// No scrim, click-outside dismisses, anchored to trigger.
// =================================================================
function SortPopover({ at, col, onClose }) {
  if (!at) return null;
  return (
    <>
      <div style={s.popOutside} onClick={onClose}/>
      <div style={{ ...s.popover, top: at.y, left: at.x }}>
        <div style={s.popHeader}>
          <span style={s.popEyebrow}>Sort</span>
          <span style={s.popCol}>{col}</span>
        </div>
        <div style={s.popList}>
          <button style={{ ...s.popRow, ...s.popRowOn }}>
            <Icon name="arrow-down" size={11} color="currentColor"/>
            <span>Descending</span>
            <span style={s.popKbd}>↓</span>
          </button>
          <button style={s.popRow}>
            <Icon name="arrow-up" size={11} color="currentColor"/>
            <span>Ascending</span>
            <span style={s.popKbd}>↑</span>
          </button>
          <button style={s.popRow}>
            <Icon name="close" size={11} color="currentColor"/>
            <span>Clear sort</span>
          </button>
        </div>
        <div style={s.popDivider}/>
        <button style={s.popMore}>
          <span>Sort by multiple columns…</span>
          <Icon name="chevron-right" size={9} color="currentColor"/>
        </button>
      </div>
    </>
  );
}

// =================================================================
// Bucket 3b — Compact center modal (Save viewsheet)
// 420px wide, scrim, simple form, primary action right.
// =================================================================
function SaveModal({ onClose }) {
  return (
    <>
      <div style={s.scrim} onClick={onClose}/>
      <div style={s.modal}>
        <div style={s.modalHeader}>
          <div style={s.modalTitle}>Save viewsheet</div>
          <button style={s.sheetClose} onClick={onClose} title="Close">
            <Icon name="close" size={14} color="currentColor"/>
          </button>
        </div>
        <div style={s.modalBody}>
          <Field label="Name" value="Sales Dashboard"/>
          <Field label="Folder" value="/Reports/Sales/2025"/>
          <Field label="Description (optional)" value=""/>
          <Toggle label="Save as snapshot (version)" on={false}/>
        </div>
        <div style={s.modalFooter}>
          <button style={s.btnGhost} onClick={onClose}>Cancel</button>
          <button style={s.btnPrimary} onClick={onClose}>Save</button>
        </div>
      </div>
    </>
  );
}

// =================================================================
// App root
// =================================================================
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [activeRail, setActiveRail] = useState('components');
  const [sortAnchor, setSortAnchor] = useState(null);

  // Tweak pattern → which overlay is open
  const showSheet  = t.pattern === 'wizard';
  const showModal  = t.pattern === 'modal';
  const showSort   = t.pattern === 'popover';

  // Auto-open popover near the table header column 2 (Revenue)
  React.useEffect(() => {
    if (showSort) {
      // Defer until DOM has table rendered
      const id = setTimeout(() => {
        const headers = document.querySelectorAll('[data-th]');
        const target = headers[2];
        if (target) {
          const r = target.getBoundingClientRect();
          setSortAnchor({ x: r.left, y: r.bottom + 4, col: 'Revenue' });
        }
      }, 50);
      return () => clearTimeout(id);
    } else {
      setSortAnchor(null);
    }
  }, [showSort]);

  // Right inspector — only shown when pattern = inspector
  const inspectorSelection = t.pattern === 'inspector' ? { name: 'gauge1' } : null;

  const handleHeaderClick = (e, col, i) => {
    const r = e.currentTarget.getBoundingClientRect();
    setSortAnchor({ x: r.left, y: r.bottom + 4, col });
    setTweak('pattern', 'popover');
  };

  return (
    <div data-screen-label="01 Composer — dialog patterns" style={s.app}>
      <TopBar/>
      <div style={s.body}>
        <Rail active={activeRail} onSelect={setActiveRail}/>
        <LeftPanel/>
        <Canvas
          onColumnHeaderClick={handleHeaderClick}
          sortOpenAt={sortAnchor && t.pattern === 'popover' ? null : null}
        />
        <RightInspector selection={inspectorSelection}/>
      </div>

      {/* Overlays */}
      {showSheet && <ImportCsvSheet onClose={() => setTweak('pattern', 'none')}/>}
      {showModal && <SaveModal onClose={() => setTweak('pattern', 'none')}/>}
      {showSort && sortAnchor && (
        <SortPopover
          at={sortAnchor}
          col={sortAnchor.col || 'Revenue'}
          onClose={() => setTweak('pattern', 'none')}
        />
      )}

      <TweaksPanel title="Dialog patterns">
        <TweakSection label="Show pattern">
          <TweakSelect
            label="Pattern"
            value={t.pattern}
            onChange={(v) => setTweak('pattern', v)}
            options={[
              { value: 'none',      label: 'Baseline — empty inspector' },
              { value: 'inspector', label: 'Bucket 1 — Right inspector (gauge)' },
              { value: 'wizard',    label: 'Bucket 2 — Side sheet (Import CSV)' },
              { value: 'popover',   label: 'Bucket 3a — Popover (Sort column)' },
              { value: 'modal',     label: 'Bucket 3b — Compact modal (Save)' },
            ]}
          />
        </TweakSection>
        <TweakSection label="Notes">
          <div style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--ink-muted)' }}>
            See <code>specs/stage2/dialog-strategy.md</code> for the
            full 4-bucket model. Bucket 4 (routable mini-apps) reuses
            Bucket 2's chrome plus URL state — not separately mocked.
            Bucket 5 (chart properties) lives in <code>composer-binding-editor-v3.html</code>.
          </div>
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

// =================================================================
// Defaults
// =================================================================
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "pattern": "inspector"
}/*EDITMODE-END*/;

// =================================================================
// Styles
// =================================================================
const s = {
  app: { position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg)' },
  body: { flex: 1, position: 'relative', display: 'flex', minHeight: 0 },

  // Top bar
  topBar: {
    flex: '0 0 44px', height: 44, background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'stretch', padding: '0 12px', gap: 12,
  },
  tabStrip: { display: 'flex', alignItems: 'center', gap: 4, flex: 1 },
  tab: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    height: 32, padding: '0 12px', background: 'var(--c-context-bg)',
    border: '1px solid var(--c-context-border)', borderRadius: 6,
    fontSize: 12, fontWeight: 500, color: 'var(--c-context-text)',
  },
  savedChip: {
    fontSize: 10, fontWeight: 500, padding: '1px 6px', borderRadius: 4,
    background: 'var(--primary-soft)', color: 'var(--primary-text)',
  },
  topRight: { display: 'flex', alignItems: 'center', gap: 8 },
  previewBtn: {
    height: 28, padding: '0 14px', borderRadius: 6,
    background: 'var(--primary)', color: '#fff', fontWeight: 600,
  },

  // Rail
  rail: {
    flex: '0 0 44px', width: 44, background: 'var(--chrome)',
    borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', padding: '8px 0', gap: 4, alignItems: 'center',
  },
  railBtn: {
    width: 32, height: 32, borderRadius: 6,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--ink-muted)',
  },
  railBtnOn: { background: 'var(--c-selected-bg)', color: 'var(--c-selected-text)' },

  // Left panel
  leftPanel: {
    flex: '0 0 240px', width: 240, background: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', minHeight: 0,
  },
  panelHeader: {
    height: 36, padding: '0 12px', display: 'flex', alignItems: 'center',
    borderBottom: '1px solid var(--hairline)',
  },
  panelTitle: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--ink-muted)' },
  panelBody: { padding: 6, overflow: 'auto', flex: 1 },
  row: {
    display: 'flex', alignItems: 'center', gap: 8,
    height: 26, padding: '0 8px', borderRadius: 4,
    fontSize: 12, color: 'var(--ink-default)', cursor: 'pointer',
  },
  rowSelected: { background: 'var(--c-selected-bg)', color: 'var(--c-selected-text)', fontWeight: 500 },

  // Canvas
  canvasWrap: {
    flex: 1, background: 'var(--canvas)',
    backgroundImage: 'radial-gradient(circle, #DDD8CC 1px, transparent 1px)',
    backgroundSize: '16px 16px',
    padding: 20, overflow: 'auto',
  },
  frame: {
    width: '100%', maxWidth: 980, margin: '0 auto',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 16,
    boxShadow: 'var(--shadow-elev)',
  },
  vsTitle: { fontSize: 18, fontWeight: 700, color: 'var(--ink)' },
  kpiStrip: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  kpi: {
    border: '1px solid var(--hairline)', borderRadius: 8, padding: '10px 12px',
    display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--surface)',
  },
  kpiLabel: { fontSize: 10, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: 0.3 },
  kpiVal: { fontSize: 20, fontWeight: 700, color: 'var(--ink)' },
  kpiDelta: { fontSize: 10, color: 'var(--info)', fontWeight: 500 },
  vsBody: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  vsRow: { display: 'flex', justifyContent: 'center' },
  vsCol: { display: 'flex', flexDirection: 'column', gap: 8 },
  objHeader: { fontSize: 12, fontWeight: 600, color: 'var(--ink)' },

  chartBox: { border: '1px solid var(--hairline)', borderRadius: 6, padding: 10, height: 180, display: 'flex', flexDirection: 'column' },
  barRow: { flex: 1, display: 'flex', alignItems: 'flex-end', gap: 8, padding: '4px 4px 0' },
  bar: { flex: 1, borderRadius: '3px 3px 0 0', minHeight: 8 },
  barAxis: { display: 'flex', justifyContent: 'space-around', fontSize: 9, color: 'var(--ink-muted)', marginTop: 6 },

  tableBox: { border: '1px solid var(--hairline)', borderRadius: 6, overflow: 'hidden' },
  tHead: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'var(--surface-muted)', borderBottom: '1px solid var(--hairline)' },
  tHeadCell: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 10px', fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)',
    borderRight: '1px solid var(--hairline)', textAlign: 'left',
  },
  tHeadCellOn: { background: 'var(--c-selected-bg)', color: 'var(--c-selected-text)' },
  tHeadCellStatic: { padding: '8px 10px', fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', borderRight: '1px solid var(--hairline)' },
  tRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid var(--hairline)' },
  tCell: { padding: '6px 10px', fontSize: 11, borderRight: '1px solid var(--hairline)' },

  // Gauge + selection chrome
  gaugeWrap: { position: 'relative', padding: 12 },
  selRing: {
    position: 'absolute', inset: 0,
    border: '1.5px solid var(--info)', borderRadius: 8,
    boxShadow: '0 0 0 3px rgba(62,127,196,0.18)',
    pointerEvents: 'none',
  },
  selChip: {
    position: 'absolute', top: -10, left: 8,
    background: 'var(--info)', color: '#fff',
    fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
  },
  gauge: { width: 220, height: 140, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  gaugeVal: { position: 'absolute', top: 78, fontSize: 22, fontWeight: 700, color: 'var(--ink)' },
  gaugeLabel: { position: 'absolute', bottom: 8, fontSize: 11, color: 'var(--ink-muted)' },

  // Right inspector
  rightPanel: {
    flex: '0 0 280px', width: 280, background: 'var(--surface)',
    borderLeft: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', minHeight: 0,
  },
  inspEmpty: { padding: '24px 16px', fontSize: 11, color: 'var(--ink-subtle)', textAlign: 'center' },
  inspHeader: { padding: 10, borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 8 },
  inspSelChip: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '3px 8px', borderRadius: 4,
    background: 'var(--c-selected-bg)', color: 'var(--c-selected-text)',
    fontSize: 11, fontWeight: 600, flex: 1,
  },
  inspRevert: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 8px', borderRadius: 4, fontSize: 10, color: 'var(--ink-muted)',
    border: '1px solid var(--hairline)',
  },
  inspTabs: { display: 'flex', borderBottom: '1px solid var(--hairline)', padding: '0 6px' },
  inspTab: { padding: '8px 10px', fontSize: 11, fontWeight: 500, color: 'var(--ink-muted)', borderBottom: '2px solid transparent', marginBottom: -1 },
  inspTabOn: { color: 'var(--ink)', borderBottom: '2px solid var(--primary)' },
  inspBody: { padding: 12, overflow: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  fieldLabel: { fontSize: 10, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: 0.3 },
  fieldInput: {
    height: 26, padding: '0 8px', border: '1px solid var(--border)', borderRadius: 4,
    background: 'var(--surface)', fontSize: 12,
  },
  toggleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 },
  toggleTrack: { width: 26, height: 14, borderRadius: 8, background: '#D8D2C5', position: 'relative', display: 'inline-block' },
  toggleTrackOn: { background: 'var(--primary)' },
  toggleThumb: { position: 'absolute', top: 2, left: 2, width: 10, height: 10, borderRadius: '50%', background: '#fff', transition: 'left 120ms' },
  toggleThumbOn: { left: 14 },
  helperLine: { fontSize: 10, color: 'var(--ink-subtle)', marginTop: 4 },
  scriptBox: { background: '#FAF8F4', border: '1px solid var(--hairline)', borderRadius: 6, padding: 10, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink)' },
  scriptLine: { whiteSpace: 'pre' },
  scriptK: { color: 'var(--info)' },
  scriptS: { color: 'var(--ink-muted)' },

  // Scrim + side sheet
  scrim: { position: 'absolute', inset: 0, background: 'rgba(20,15,5,0.35)', zIndex: 50, animation: 'fadeIn 120ms ease-out' },
  sideSheet: {
    position: 'absolute', top: 0, right: 0, bottom: 0, width: '60%', minWidth: 520,
    background: 'var(--surface)', boxShadow: '-8px 0 24px -8px rgba(40,30,15,0.2)',
    zIndex: 51, display: 'flex', flexDirection: 'column',
  },
  sheetHeader: { padding: '16px 20px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
  sheetEyebrow: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--ink-muted)', fontWeight: 600 },
  sheetTitle: { fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginTop: 2 },
  sheetClose: {
    width: 28, height: 28, borderRadius: 6, color: 'var(--ink-muted)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  },
  stepper: { padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 0, borderBottom: '1px solid var(--hairline)', background: 'var(--surface-muted)' },
  step: { display: 'flex', alignItems: 'center', gap: 6 },
  stepDot: {
    width: 18, height: 18, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 10, fontWeight: 600, color: 'var(--ink-muted)',
    background: 'var(--surface)', border: '1px solid var(--border)',
  },
  stepDotActive: { background: 'var(--primary)', color: '#fff', border: '1px solid var(--primary)' },
  stepDotDone: { background: 'var(--primary-soft)', color: 'var(--primary-text)', border: '1px solid var(--primary-soft)' },
  stepLabel: { fontSize: 11, color: 'var(--ink-muted)' },
  stepLabelActive: { color: 'var(--ink)', fontWeight: 600 },
  stepConnector: { flex: 1, width: 32, height: 1, background: 'var(--border)', margin: '0 10px' },
  sheetBody: { flex: 1, padding: 20, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 14 },
  sheetFooter: { padding: '12px 20px', borderTop: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 8 },

  dropzone: {
    border: '2px dashed var(--border-strong)', borderRadius: 10, padding: '32px 20px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    background: 'var(--surface-muted)',
  },
  dropTitle: { fontSize: 14, fontWeight: 600, marginTop: 6 },
  dropHint: { fontSize: 12, color: 'var(--ink-muted)' },
  dropLink: { color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' },
  dropMeta: { fontSize: 10, color: 'var(--ink-subtle)', marginTop: 6 },
  recent: { display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 },
  recentHeader: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--ink-muted)', fontWeight: 600, marginBottom: 4 },
  recentRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 4, fontSize: 11 },
  recentMeta: { marginLeft: 'auto', color: 'var(--ink-subtle)', fontSize: 10 },

  mapHint: { fontSize: 11, color: 'var(--ink-muted)' },
  mapTable: { border: '1px solid var(--hairline)', borderRadius: 6, overflow: 'hidden' },
  mapRow: { display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, padding: '10px 12px', borderBottom: '1px solid var(--hairline)', alignItems: 'center' },
  mapCol: { fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink)' },
  mapDetected: { fontSize: 10, color: 'var(--ink-subtle)' },
  mapSelect: { fontSize: 11, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--surface)', display: 'inline-flex', alignItems: 'center', gap: 6 },

  previewMeta: { fontSize: 11, color: 'var(--ink-muted)' },

  commitBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '24px 16px', maxWidth: 360, margin: '0 auto', width: '100%' },
  commitTitle: { fontSize: 16, fontWeight: 700 },
  commitDesc: { fontSize: 12, color: 'var(--ink-muted)', textAlign: 'center', marginBottom: 8 },

  // Compact modal
  modal: {
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    width: 420, background: 'var(--surface)', borderRadius: 10,
    boxShadow: '0 24px 64px -12px rgba(40,30,15,0.25), 0 0 0 1px rgba(40,30,15,0.05)',
    zIndex: 51, display: 'flex', flexDirection: 'column',
  },
  modalHeader: { padding: '12px 16px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 14, fontWeight: 700 },
  modalBody: { padding: 16, display: 'flex', flexDirection: 'column', gap: 10 },
  modalFooter: { padding: '10px 16px', borderTop: '1px solid var(--hairline)', display: 'flex', justifyContent: 'flex-end', gap: 8 },

  // Buttons
  btnGhost: { height: 28, padding: '0 12px', borderRadius: 6, color: 'var(--ink-default)' },
  btnSecondary: { height: 28, padding: '0 12px', borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', fontWeight: 500 },
  btnPrimary: { height: 28, padding: '0 14px', borderRadius: 6, background: 'var(--primary)', color: '#fff', fontWeight: 600 },

  // Popover
  popOutside: { position: 'absolute', inset: 0, zIndex: 50 },
  popover: {
    position: 'absolute', minWidth: 240,
    background: 'var(--surface)', borderRadius: 8,
    boxShadow: '0 12px 32px -8px rgba(40,30,15,0.22), 0 0 0 1px rgba(40,30,15,0.06)',
    zIndex: 51, padding: 6, display: 'flex', flexDirection: 'column',
  },
  popHeader: { padding: '6px 8px 4px', display: 'flex', alignItems: 'center', gap: 6 },
  popEyebrow: { fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--ink-subtle)', fontWeight: 600 },
  popCol: { fontSize: 11, fontWeight: 600, color: 'var(--ink)' },
  popList: { display: 'flex', flexDirection: 'column' },
  popRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 8px', borderRadius: 4, fontSize: 12, color: 'var(--ink-default)',
  },
  popRowOn: { background: 'var(--c-selected-bg)', color: 'var(--c-selected-text)', fontWeight: 500 },
  popKbd: { marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-subtle)' },
  popDivider: { height: 1, background: 'var(--hairline)', margin: '4px 0' },
  popMore: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', fontSize: 11, color: 'var(--ink-muted)', borderRadius: 4 },
};

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
