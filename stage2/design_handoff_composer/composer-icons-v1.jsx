// Composer-specific icon set. Same stroke style as Portal's Icon.
const Icon = ({ name, size = 16, color = 'currentColor', strokeWidth = 1.6, fill = 'none' }) => {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill, stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    // Brand
    case 'logo': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M5 5h14v14H5z" fill="#E58A2A"/><path d="M9 9h6v6H9z" fill="#fff"/></svg>;
    // Toolbar
    case 'create': return <svg {...p}><path d="M12 3v18M3 12h18"/></svg>;
    case 'save': return <svg {...p}><path d="M5 4h11l3 3v13a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z"/><path d="M8 4v5h7V4M8 19v-5h8v5"/></svg>;
    case 'save-as': return <svg {...p}><path d="M5 4h11l3 3v13a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z"/><path d="M8 4v5h7V4"/><circle cx="17" cy="17" r="3"/></svg>;
    case 'preview': return <svg {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'play': return <svg {...p}><path d="M6 4l14 8-14 8V4z"/></svg>;
    case 'refresh': return <svg {...p}><path d="M3 12a9 9 0 0115-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 01-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>;
    case 'undo': return <svg {...p}><path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 010 10h-3"/></svg>;
    case 'redo': return <svg {...p}><path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 000 10h3"/></svg>;
    case 'cut': return <svg {...p}><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.5 15.5"/><path d="M14 14l6 6"/><path d="M8.5 8.5L20 20"/></svg>;
    case 'copy': return <svg {...p}><rect x="9" y="9" width="11" height="11" rx="1.5"/><path d="M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1"/></svg>;
    case 'paste': return <svg {...p}><path d="M9 3h6v3H9z"/><path d="M9 4H6a1 1 0 00-1 1v15a1 1 0 001 1h12a1 1 0 001-1V5a1 1 0 00-1-1h-3"/></svg>;
    case 'copy-format': return <svg {...p}><path d="M14 4H6a1 1 0 00-1 1v4h13V5a1 1 0 00-1-1h-1"/><path d="M5 9v3h13V9"/><path d="M11 12v8h2v-8"/></svg>;
    case 'snap': return <svg {...p}><path d="M3 3h4M3 21h4M21 3h-4M21 21h-4M3 12h2M19 12h2M12 3v2M12 19v2"/><rect x="8" y="8" width="8" height="8" rx="1"/></svg>;
    case 'arrange': return <svg {...p}><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1" strokeDasharray="2 2"/><rect x="3" y="13" width="8" height="8" rx="1" strokeDasharray="2 2"/></svg>;
    case 'zoom': return <svg {...p}><circle cx="11" cy="11" r="6"/><path d="M11 8v6M8 11h6"/><path d="M20 20l-4.3-4.3"/></svg>;
    case 'options': return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 00.3 1.7l.1.1a2 2 0 01-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.7-.3 1.6 1.6 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.6 1.6 0 00-1.1-1.5 1.6 1.6 0 00-1.7.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.7 1.6 1.6 0 00-1.5-1H3a2 2 0 110-4h.1a1.6 1.6 0 001.5-1.1 1.6 1.6 0 00-.3-1.7l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.7.3H9a1.6 1.6 0 001-1.5V3a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.7-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.7V9a1.6 1.6 0 001.5 1H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z"/></svg>;
    case 'fullscreen': return <svg {...p}><path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3"/></svg>;
    // Tree / library
    case 'chevron-r': return <svg {...p}><path d="M9 6l6 6-6 6"/></svg>;
    case 'chevron-d': return <svg {...p}><path d="M6 9l6 6 6-6"/></svg>;
    case 'chevron-l': return <svg {...p}><path d="M15 18l-6-6 6-6"/></svg>;
    case 'folder': return <svg {...p}><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>;
    case 'data': return <svg {...p}><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>;
    case 'table': return <svg {...p}><rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M3 9h18M3 14h18M9 4v16M15 4v16"/></svg>;
    case 'chart': return <svg {...p}><path d="M3 3v18h18"/><path d="M7 14l3-3 3 3 4-5"/></svg>;
    case 'crosstab': return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M9 3v18M3 9h18"/></svg>;
    case 'freehand-table': return <svg {...p}><rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M3 9h18M9 9v11"/><path d="M14 14l3 3"/></svg>;
    case 'selection-list': return <svg {...p}><rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M7 9h10M7 13h10M7 17h6"/></svg>;
    case 'selection-tree': return <svg {...p}><circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="12" r="2"/><path d="M8 6h6a2 2 0 012 2v2M8 18h6a2 2 0 002-2v-2"/></svg>;
    case 'range-slider': return <svg {...p}><path d="M3 12h18"/><circle cx="9" cy="12" r="2.5" fill="currentColor"/><circle cx="16" cy="12" r="2.5"/></svg>;
    case 'calendar': return <svg {...p}><rect x="3" y="5" width="18" height="16" rx="1.5"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>;
    case 'selection-container': return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="1.5" strokeDasharray="3 2"/><rect x="7" y="7" width="10" height="4" rx="1"/></svg>;
    case 'text': return <svg {...p}><path d="M5 5h14M12 5v14M9 19h6"/></svg>;
    case 'image': return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="1.5"/><circle cx="9" cy="9" r="2"/><path d="M21 16l-5-5-9 9"/></svg>;
    case 'gauge': return <svg {...p}><path d="M4 18a8 8 0 1116 0"/><path d="M12 18l4-6"/></svg>;
    case 'slider': return <svg {...p}><path d="M3 12h18"/><circle cx="14" cy="12" r="3"/></svg>;
    case 'spinner': return <svg {...p}><rect x="3" y="8" width="18" height="8" rx="1.5"/><path d="M16 11l2 1-2 1"/></svg>;
    case 'checkbox': return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 12l3.5 3.5L17 9"/></svg>;
    case 'radio': return <svg {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5" fill={color}/></svg>;
    case 'combo': return <svg {...p}><rect x="3" y="6" width="18" height="12" rx="1.5"/><path d="M14 11l2 2 2-2"/><path d="M14 6v12"/></svg>;
    case 'textinput': return <svg {...p}><rect x="3" y="6" width="18" height="12" rx="1.5"/><path d="M7 9v6M7 12h0"/></svg>;
    case 'submit': return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>;
    case 'line': return <svg {...p}><path d="M5 19L19 5"/></svg>;
    case 'rect': return <svg {...p}><rect x="4" y="6" width="16" height="12" rx="1"/></svg>;
    case 'oval': return <svg {...p}><ellipse cx="12" cy="12" rx="8" ry="6"/></svg>;
    // Misc
    case 'search': return <svg {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>;
    case 'plus': return <svg {...p}><path d="M12 5v14M5 12h14"/></svg>;
    case 'close': return <svg {...p}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case 'more': return <svg {...p}><circle cx="6" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="18" cy="12" r="1.4" fill="currentColor"/></svg>;
    case 'console': return <svg {...p}><rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M7 9l3 3-3 3M13 15h4"/></svg>;
    case 'doc': return <svg {...p}><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5"/></svg>;
    case 'app-switch': return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
    case 'help': return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 4"/><circle cx="12" cy="17" r=".5" fill={color}/></svg>;
    case 'pin': return <svg {...p}><path d="M12 17v5"/><path d="M9 3h6l-1 6 3 3v2H7v-2l3-3-1-6z"/></svg>;
    case 'collapse-r': return <svg {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/><path d="M11 9l-3 3 3 3"/></svg>;
    case 'collapse-l': return <svg {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/><path d="M13 9l3 3-3 3"/></svg>;
    case 'star': return <svg {...p}><path d="M12 3l2.6 5.8 6.4.6-4.8 4.4 1.4 6.2L12 17l-5.6 3 1.4-6.2L3 9.4l6.4-.6L12 3z"/></svg>;
    case 'lock': return <svg {...p}><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>;
    case 'sparkle': return <svg {...p}><path d="M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15l-1.8-4.7L5.5 9l4.7-1.8L12 3z"/><path d="M19 16l.8 1.7L21.5 18l-1.7.8L19 20.5l-.8-1.7L16.5 18l1.7-.5L19 16z"/></svg>;
    case 'upload': return <svg {...p}><path d="M12 3v13"/><path d="M7 8l5-5 5 5"/><path d="M5 20h14"/></svg>;
    case 'paint': return <svg {...p}><path d="M4 4h16v8H4z"/><path d="M9 12v4a2 2 0 002 2h2v3h-2"/></svg>;
    case 'eye': return <svg {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'settings': return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 00.3 1.7l.1.1a2 2 0 01-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.7-.3 1.6 1.6 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.6 1.6 0 00-1.1-1.5 1.6 1.6 0 00-1.7.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.7 1.6 1.6 0 00-1.5-1H3a2 2 0 110-4h.1a1.6 1.6 0 001.5-1.1 1.6 1.6 0 00-.3-1.7l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.7.3H9a1.6 1.6 0 001-1.5V3a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.7-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.7V9a1.6 1.6 0 001.5 1H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z"/></svg>;
    case 'edit': return <svg {...p}><path d="M4 20h4l10-10-4-4L4 16v4z"/><path d="M14 6l4 4"/></svg>;
    case 'chevron-down': return <svg {...p}><path d="M6 9l6 6 6-6"/></svg>;
    case 'check-circle': return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>;
    case 'check': return <svg {...p}><path d="M5 12l4 4 10-10"/></svg>;
    case 'arrow-down': return <svg {...p}><path d="M12 5v14"/><path d="M6 13l6 6 6-6"/></svg>;
    case 'arrow-up': return <svg {...p}><path d="M12 19V5"/><path d="M6 11l6-6 6 6"/></svg>;
    default: return <svg {...p}><circle cx="12" cy="12" r="3"/></svg>;
  }
};

window.Icon = Icon;
