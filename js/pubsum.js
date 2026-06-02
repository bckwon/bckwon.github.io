/* ═══════════════════════════════════════════════════════════════════════════
   pubsum.js — Interactive publication summary visualization
   Requires: D3.js v7  |  Data: /data/pubvis.csv
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Timing constants (ms) — tweak freely to experiment ─────────────────── */
const T = {
  BLOCK_STAGGER:    22,    // delay per block when appearing in scene 1
  BLOCK_MOVE:      750,    // block movement transition
  AXIS_IN:         600,    // axis fade-in duration
  AXIS_DELAY:      700,    // wait after x-axis before moving blocks
  COLOR_CHANGE:    650,    // venue / color transition
  FADE_OUT:        350,    // opacity → 0
  FADE_IN:         600,    // opacity → 1 (with stagger)
  BAR_MOVE:        800,    // citation bar chart reveal
  SCENE_PAUSE:    3200,    // auto-advance pause between scenes
  ANNOT_IN:        450,    // annotation fade-in
  ANNOT_OUT:       380,    // annotation fade-out
  NET_INTERVAL0:   800,    // first paper delay in network scene
  NET_DECAY:      0.88,    // per-paper interval decay
  NET_MIN:          50,    // minimum per-paper interval (ms)
  LOOP_NET_FADE:   600,    // loop-back: network fade-out
  LOOP_RETURN:     800,    // loop-back: blocks return to centre
};

/* ═══════════════════════════════════════════════════════════════════════════
   COLOR PALETTE  — single source of truth for every hex / rgb value
   ═══════════════════════════════════════════════════════════════════════════ */
const PV_COLORS = {

  /* ── venue → fill colors (scenes 3-4) ──────────────────────────────── */
  venue: {
    TVCG: '#4e79a7', CHI: '#f28e2b', VIS: '#e15759', InfoVis: '#e15759',
    'EuroVis-Short': '#76b7b2', 'EuroVis-STAR': '#76b7b2',
    JMIR: '#59a14f', IJHCI: '#b07aa1', IDEA: '#ff9da7',
    'Nature Communications': '#9c755f', JAMIA: '#bab0ac',
  },
  venueOther: '#adb5bd',

  /* ── UMAP cluster fills (scene 5) ───────────────────────────────────── */
  cluster: ['#4c9be8', '#f4a261', '#2a9d8f', '#e76f51', '#a8dadc'],

  /* ── Light mode tokens ──────────────────────────────────────────────── */
  LIGHT: {
    /* container / chrome */
    containerBg:      '#fff',
    containerBorder:  '#e2e8f0',
    ctrlBg:           '#f8fafc',
    ctrlBorder:       '#e2e8f0',
    /* play / stop buttons */
    btnBg:            '#fff',
    btnText:          '#1e293b',
    btnBorder:        '#cbd5e1',
    /* scene label */
    sceneLabel:       '#64748b',
    /* scene-dot buttons (inactive) */
    dotBg:            '#fff',
    dotText:          '#475569',
    dotBorder:        '#e2e8f0',
    /* scene-dot buttons (active) */
    dotBgActive:      '#eff6ff',
    dotTextActive:    '#1d4ed8',
    dotBorderActive:  '#3b82f6',
    /* floating tooltip */
    tooltipBg:        'rgba(255,255,255,0.97)',
    tooltipBorder:    '#e2e8f0',
    tooltipTitle:     '#1e293b',
    tooltipSub:       '#64748b',
    tooltipMuted:     '#94a3b8',
    /* filter bar (above pub list) */
    filterBg:         '#fff7ed',
    filterBorder:     '#fed7aa',
    filterText:       '#92400e',
    /* axes */
    axisDomain:       '#cbd5e1',
    axisGrid:         '#f1f5f9',
    axisTickText:     '#64748b',
    axisLabel:        '#475569',
    /* legend */
    legendText:       '#475569',
    /* annotation box */
    annotBg:          'rgba(248,250,252,0.95)',
    annotBorder:      '#e2e8f0',
    annotTitle:       '#1e293b',
    annotSub:         '#64748b',
    /* default block squares (scenes 1-2, top row in scene 6) */
    blockFill:        '#1a1a1a',
    blockStroke:      '#555',
    /* co-authorship network */
    netEdge:          '#94a3b8',
    netNodeFill:      '#bfdbfe',
    netNodeStroke:    '#60a5fa',
    netBcFill:        '#1e40af',
    netBcStroke:      '#1e3a8a',
    netBcText:        'white',
    /* network animation – block reveal flash */
    blockReveal:      '#84cc16',
    blockRevealStroke:'#3f6212',
    /* selection / brush / lasso (same value in dark mode) */
    selectOrange:     '#f97316',
    lassoBg:          'rgba(249,115,22,0.07)',
    lassoStroke:      '#f97316',
    brushFill:        'rgba(245,158,11,0.10)',
    brushStroke:      '#f59e0b',
  },

  /* ── Dark mode tokens ───────────────────────────────────────────────── */
  DARK: {
    containerBg:      '#0f172a',
    containerBorder:  '#334155',
    ctrlBg:           '#1e293b',
    ctrlBorder:       '#334155',
    btnBg:            '#1e293b',
    btnText:          '#e2e8f0',
    btnBorder:        '#475569',
    sceneLabel:       '#94a3b8',
    dotBg:            '#0f172a',
    dotText:          '#94a3b8',
    dotBorder:        '#334155',
    dotBgActive:      '#1e3a8a',
    dotTextActive:    '#93c5fd',
    dotBorderActive:  '#3b82f6',
    tooltipBg:        'rgba(15,23,42,0.97)',
    tooltipBorder:    '#334155',
    tooltipTitle:     '#f1f5f9',
    tooltipSub:       '#94a3b8',
    tooltipMuted:     '#64748b',
    filterBg:         '#1e2d3d',
    filterBorder:     '#334155',
    filterText:       '#fbbf24',
    axisDomain:       '#334155',
    axisGrid:         '#1e3a5f',
    axisTickText:     '#94a3b8',
    axisLabel:        '#94a3b8',
    legendText:       '#94a3b8',
    annotBg:          'rgba(15,23,42,0.95)',
    annotBorder:      '#334155',
    annotTitle:       '#f1f5f9',
    annotSub:         '#94a3b8',
    blockFill:        '#cbd5e1',
    blockStroke:      '#64748b',
    /* network (same as light) */
    netEdge:          '#94a3b8',
    netNodeFill:      '#bfdbfe',
    netNodeStroke:    '#60a5fa',
    netBcFill:        '#1e40af',
    netBcStroke:      '#1e3a8a',
    netBcText:        'white',
    blockReveal:      '#84cc16',
    blockRevealStroke:'#3f6212',
    /* selection / brush / lasso (same as light) */
    selectOrange:     '#f97316',
    lassoBg:          'rgba(249,115,22,0.07)',
    lassoStroke:      '#f97316',
    brushFill:        'rgba(245,158,11,0.10)',
    brushStroke:      '#f59e0b',
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   PubVis CLASS
   ═══════════════════════════════════════════════════════════════════════════ */
class PubVis {

  /* ── layout constants ────────────────────────────────────────────────── */
  static BS  = 7;
  static GAP = 2;
  static CR  = 5;
  static M   = { top: 18, right: 178, bottom: 46, left: 52 };

  static SCENE_NAMES = ['Center', 'Timeline', 'Venues', 'Citations', 'UMAP', 'Network'];

  /* ── constructor ─────────────────────────────────────────────────────── */
  constructor(containerSel) {
    this.sel  = containerSel;
    this.data = [];
    this.netNodes = [];
    this.netLinks = [];

    // play-state machine
    this.playState    = 'idle';   // 'idle' | 'playing' | 'paused' | 'stopped'
    this.currentScene = 0;
    this._sceneReady  = false;    // has current scene's animation been shown?
    this._timer       = null;

    // filter state
    this._filter     = null;      // null = show all; Set of pub IDs when active
    this._dragging   = false;     // lasso / brush drag in progress
    this._brushG     = null;
    this._brushObj   = null;
    this._lassoOn    = false;
    this._lassoFired       = false;  // suppresses click handlers immediately after lasso mouseup
    this._playPausedByClick = false;  // suppresses click.filter immediately after pause-by-click

    // dark mode
    this._isDark = document.documentElement.classList.contains('dark');

    // animation control
    this._animGen         = 0;    // incremented on pause/stop to cancel pending _sched callbacks
    this._netAnimRunning  = false; // true while _runNetworkAnimation timers are active
    this._netAnimStartIdx = 0;    // index into this.data to resume network animation from

    // pre-computed layout flags
    this._l2 = this._l4 = false;
  }

  /* Look up a color token from PV_COLORS for the current mode */
  _c(key) { return (this._isDark ? PV_COLORS.DARK : PV_COLORS.LIGHT)[key]; }

  /* Apply or remove dark mode across all pubvis HTML and SVG elements.
     All token lookups go through PV_COLORS — no hex literals here. */
  _applyColorScheme(isDark) {
    this._isDark = isDark;

    /* ── container div ── */
    const cont = document.getElementById('pub-vis-container');
    if (cont) {
      cont.style.background  = this._c('containerBg');
      cont.style.borderColor = this._c('containerBorder');
    }

    /* ── control bar ── */
    if (this.ctrlBar) {
      this.ctrlBar
        .style('background',    this._c('ctrlBg'))
        .style('border-bottom', `1px solid ${this._c('ctrlBorder')}`);
    }

    /* ── dots bar ── */
    if (this.dotsBar) {
      this.dotsBar
        .style('background', this._c('ctrlBg'))
        .style('border-top', `1px solid ${this._c('ctrlBorder')}`);
    }

    /* ── play / stop buttons ── */
    [this.btnPlay, this.btnStop].forEach(btn => {
      if (btn) btn.style('background', this._c('btnBg'))
                  .style('color',      this._c('btnText'))
                  .style('border',     `1px solid ${this._c('btnBorder')}`);
    });

    /* ── scene label ── */
    if (this.ctrlLabel) this.ctrlLabel.style('color', this._c('sceneLabel'));

    /* ── scene dot buttons ── */
    if (this.dotBtns) {
      this.dotBtns.forEach((btn, i) => this._styleDot(btn, i + 1 === this.currentScene));
    }

    /* ── tooltip ── */
    if (this.tooltipEl) {
      this.tooltipEl
        .style('background',   this._c('tooltipBg'))
        .style('border-color', this._c('tooltipBorder'))
        .style('color',        this._c('tooltipTitle'));
    }

    /* ── filter bar ── */
    if (this.filterBarEl) {
      this.filterBarEl.style.background  = this._c('filterBg');
      this.filterBarEl.style.borderColor = this._c('filterBorder');
      this.filterBarEl.style.color       = this._c('filterText');
    }

    /* ── live SVG elements (if a scene is currently shown) ── */
    if (this.currentScene > 0) {
      [this.xAxisG, this.yAxisG].forEach(g => {
        g.select('.domain').attr('stroke',     this._c('axisDomain'));
        g.selectAll('.tick line').attr('stroke', this._c('axisGrid'));
        g.selectAll('text').attr('fill',        this._c('axisTickText'));
        g.selectAll('.ax-lbl').attr('fill',     this._c('axisLabel'));
      });
      this.legendG.selectAll('text').attr('fill', this._c('legendText'));
      this.annotG.select('rect')
        .attr('fill',   this._c('annotBg'))
        .attr('stroke', this._c('annotBorder'));
      this.annotG.selectAll('text').each((_, i, nodes) => {
        d3.select(nodes[i]).attr('fill',
          +d3.select(nodes[i]).attr('font-weight') >= 600
            ? this._c('annotTitle') : this._c('annotSub'));
      });
      /* re-snap so block colors and network colors use the new palette.
         _applySceneSnap must be skipped when a scene is mid-animation (!_sceneReady)
         because it instantly sets final positions/shapes, destroying in-progress D3
         transitions. Chrome elements (axes, legend, annotation) are already updated
         above. Block fills only need live-updating for scenes that use mode-sensitive
         blockFill/blockStroke colors (scenes 1–2). Scenes 3–5 use venue/cluster
         colors that are identical in both modes. */
      if (this.currentScene === 6 && this._netAnimRunning) {
        this._recolorScene6Live();
      } else if (!this._sceneReady) {
        /* mid-animation: update block fill only for scenes that use mode-sensitive colors */
        if (this.currentScene <= 2) {
          this.blocks
            .attr('fill',   this._c('blockFill'))
            .attr('stroke', this._c('blockStroke'));
        }
      } else {
        this._applySceneSnap(this.currentScene);
      }
    }
  }

  /* Recolor scene 6 elements in place without interrupting the network animation.
     Called by _applyColorScheme when a theme switch happens mid-animation.
     - Unrevealed blocks (idx >= _netAnimStartIdx) get updated fill/stroke.
     - Already-revealed blocks are in blockReveal color (same in both modes, no change needed).
     - Network node/edge colors are updated directly; no opacity/r transitions are active on them. */
  _recolorScene6Live() {
    const self = this;
    const revealedUpto = this._netAnimStartIdx;

    this.blocks.each(function(d) {
      if (d.idx >= revealedUpto) {
        d3.select(this)
          .attr('fill', self._c('blockFill'))
          .attr('stroke', self._c('blockStroke'));
      }
    });

    this.netG.selectAll('line.pv-link').attr('stroke', this._c('netEdge'));

    this.netG.selectAll('g.pv-node circle')
      .attr('fill',   d => d.isBC ? self._c('netBcFill')   : self._c('netNodeFill'))
      .attr('stroke', d => d.isBC ? self._c('netBcStroke') : self._c('netNodeStroke'));

    this.netG.selectAll('g.pv-node text').attr('fill', this._c('netBcText'));
  }

  /* generation-aware setTimeout: automatically a no-op if pause/stop fires before it runs */
  _sched(fn, ms) {
    const gen = this._animGen;
    setTimeout(() => { if (this._animGen === gen) fn(); }, ms);
  }

  /* interrupt all in-progress D3 transitions to freeze visuals */
  _interruptAll() {
    this.blocks.interrupt();
    this.xAxisG.interrupt(); this.yAxisG.interrupt();
    this.legendG.interrupt(); this.annotG.interrupt();
    this.netG.selectAll('*').interrupt();
  }

  /* ── init ────────────────────────────────────────────────────────────── */
  async init() {
    try {
      this.data = await d3.csv('/data/pubvis.csv', d => ({
        ...d,
        year:           +d.year,
        citation_count: +d.citation_count,
        x: +d.x, y: +d.y,
        cluster_index:  +d.cluster_index,
      }));
    } catch (e) {
      console.error('PubVis: cannot load /data/pubvis.csv', e);
      return;
    }
    this.data.sort((a, b) => a.year - b.year || a.title.localeCompare(b.title));
    this.data.forEach((d, i) => { d.idx = i; });

    this._buildUI();
    this._setupSVG();
    this._buildNetwork();
    this._prerunForce();
    this._createBlocks();
    this._addBlockInteractions();
    this._setupPlayingInteraction();
    this._updateUI();
    /* apply initial color scheme and watch for dark-mode toggle */
    this._applyColorScheme(document.documentElement.classList.contains('dark'));
    new MutationObserver(() => {
      const nowDark = document.documentElement.classList.contains('dark');
      if (nowDark !== this._isDark) this._applyColorScheme(nowDark);
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    /* auto-start after a short delay to let the layout paint */
    setTimeout(() => {
      this.playState = 'playing';
      this._updateUI();
      this._scene1();
    }, 500);
  }

  /* ══════════════════════════════════════════════════════════════════════
     SECTION: UI (controls + tooltip + filter bar)
  ══════════════════════════════════════════════════════════════════════ */

  _buildUI() {
    const cont = d3.select(this.sel).style('position', 'relative').style('overflow', 'visible');

    /* ── control bar ── */
    const L = PV_COLORS.LIGHT;  // initial colors; _applyColorScheme overwrites for dark mode
    const ctrl = cont.append('div').attr('class', 'pv-ctrl')
      .style('display', 'flex').style('align-items', 'center')
      .style('gap', '8px').style('padding', '6px 12px')
      .style('background', L.ctrlBg).style('border-bottom', `1px solid ${L.ctrlBorder}`)
      .style('border-radius', '8px 8px 0 0').style('flex-wrap', 'wrap');
    this.ctrlBar = ctrl;

    const btnStyle = (el) => el
      .style('padding', '4px 12px').style('border', `1px solid ${L.btnBorder}`)
      .style('border-radius', '5px').style('background', L.btnBg)
      .style('font-size', '12px').style('cursor', 'pointer')
      .style('font-family', 'Inter, system-ui, sans-serif')
      .style('color', L.btnText).style('transition', 'background 0.15s');

    this.btnPlay = btnStyle(ctrl.append('button').text('▶ Play'))
      .on('click', () => this._handlePlayPause());
    this.btnStop = btnStyle(ctrl.append('button').text('■ Stop'))
      .on('click', () => this._handleStop());

    this.ctrlLabel = ctrl.append('span')
      .style('margin-left', 'auto').style('font-size', '11px')
      .style('color', L.sceneLabel).style('font-family', 'Inter, system-ui, sans-serif')
      .text('Scene 1 · Center');

    /* ── scene dots ── */
    const dots = cont.append('div').attr('class', 'pv-dots')
      .style('display', 'flex').style('gap', '6px')
      .style('padding', '5px 12px').style('justify-content', 'center')
      .style('background', L.ctrlBg).style('border-top', `1px solid ${L.ctrlBorder}`)
      .style('border-radius', '0 0 8px 8px').style('flex-wrap', 'wrap');
    this.dotsBar = dots;

    this.dotBtns = PubVis.SCENE_NAMES.map((name, i) => {
      const btn = dots.append('button')
        .attr('data-scene', i + 1)
        .style('padding', '3px 10px').style('border-radius', '12px')
        .style('font-size', '11px').style('cursor', 'pointer')
        .style('font-family', 'Inter, system-ui, sans-serif')
        .style('transition', 'all 0.2s').style('white-space', 'nowrap')
        .text(`${i + 1}: ${name}`)
        .on('click', () => this._jumpToScene(i + 1));
      this._styleDot(btn, false);
      return btn;
    });

    /* ── tooltip div ── */
    this.tooltipEl = d3.select(this.sel).append('div')
      .attr('id', 'pv-tooltip')
      .style('position', 'fixed').style('display', 'none')
      .style('background', L.tooltipBg)
      .style('border', `1px solid ${L.tooltipBorder}`)
      .style('border-radius', '7px').style('padding', '9px 12px')
      .style('box-shadow', '0 4px 16px rgba(0,0,0,0.12)')
      .style('pointer-events', 'none').style('z-index', '9999')
      .style('max-width', '240px').style('font-family', 'Inter, system-ui, sans-serif');

    /* ── filter bar (injected before pub list) ── */
    const filterBar = d3.select(this.sel.replace('#', '') !== this.sel
      ? this.sel : `${this.sel}`)
      .node().closest('section, .hbb-section')
      ?.querySelector('.max-w-3xl');

    if (filterBar) {
      this.filterBarEl = document.createElement('div');
      this.filterBarEl.id = 'pv-filter-bar';
      Object.assign(this.filterBarEl.style, {
        padding: '6px 12px', marginBottom: '8px',
        background: L.filterBg, borderRadius: '6px', border: `1px solid ${L.filterBorder}`,
        fontSize: '12px', color: L.filterText,
        alignItems: 'center', gap: '8px', flexWrap: 'wrap',
        fontFamily: 'Inter, system-ui, sans-serif',
      });
      this.filterBarEl.style.display = 'none'; // hidden until filter is active
      filterBar.prepend(this.filterBarEl);
    }
  }

  _styleDot(btn, active) {
    btn.style('border',      `1px solid ${active ? this._c('dotBorderActive') : this._c('dotBorder')}`)
       .style('background',  active ? this._c('dotBgActive')   : this._c('dotBg'))
       .style('color',       active ? this._c('dotTextActive')  : this._c('dotText'))
       .style('font-weight', active ? '600' : '400');
  }

  /* ══════════════════════════════════════════════════════════════════════
     SECTION: SVG setup
  ══════════════════════════════════════════════════════════════════════ */

  _setupSVG() {
    const { M } = PubVis;
    const cont   = d3.select(this.sel);
    const totalW = Math.max(500, cont.node().getBoundingClientRect().width);
    const totalH = 320;

    this.TW = totalW; this.TH = totalH;
    this.W  = totalW - M.left - M.right;
    this.H  = totalH - M.top  - M.bottom;

    // SVG is sandwiched between ctrl bar and dots bar (created in _buildUI)
    const dotsBars = cont.selectAll('.pv-dots').node();
    this.svg = cont.insert('svg', () => dotsBars)
      .attr('width', '100%').attr('height', totalH)
      .attr('viewBox', `0 0 ${totalW} ${totalH}`)
      .style('display', 'block').style('cursor', 'default');

    this.g = this.svg.append('g').attr('transform', `translate(${M.left},${M.top})`);

    this.xAxisG = this.g.append('g').attr('class', 'x-axis')
      .attr('transform', `translate(0,${this.H})`).style('opacity', 0);
    this.yAxisG = this.g.append('g').attr('class', 'y-axis').style('opacity', 0);

    this.netG    = this.g.append('g').attr('class', 'pv-net').style('opacity', 0);
    this.blocksG = this.g.append('g').attr('class', 'pv-blocks');
    this.legendG = this.g.append('g').attr('class', 'pv-legend')
      .attr('transform', `translate(${this.W + 10}, 8)`).style('opacity', 0);
    this.annotG  = this.g.append('g').attr('class', 'pv-annot').style('opacity', 0);
  }

  /* ══════════════════════════════════════════════════════════════════════
     SECTION: Path helpers
  ══════════════════════════════════════════════════════════════════════ */

  _sq(cx, cy, w, h) {
    const hw = w / 2, hh = h / 2;
    return `M ${cx-hw},${cy-hh} L ${cx+hw},${cy-hh} L ${cx+hw},${cy+hh} L ${cx-hw},${cy+hh} Z`;
  }

  _circle(cx, cy, r) {
    const k = 0.5523 * r;
    return `M ${cx},${cy-r} C ${cx+k},${cy-r} ${cx+r},${cy-k} ${cx+r},${cy} ` +
           `C ${cx+r},${cy+k} ${cx+k},${cy+r} ${cx},${cy+r} ` +
           `C ${cx-k},${cy+r} ${cx-r},${cy+k} ${cx-r},${cy} ` +
           `C ${cx-r},${cy-k} ${cx-k},${cy-r} ${cx},${cy-r} Z`;
  }

  /* ══════════════════════════════════════════════════════════════════════
     SECTION: Block creation & default appearance
  ══════════════════════════════════════════════════════════════════════ */

  _createBlocks() {
    const cx0 = this.W / 2, cy0 = this.H / 2;
    this.blocks = this.blocksG.selectAll('path.pv-block')
      .data(this.data).join('path')
        .attr('class', 'pv-block')
        .attr('d', () => this._sq(cx0, cy0, PubVis.BS, PubVis.BS))
        .attr('fill', this._c('blockFill')).attr('stroke', this._c('blockStroke')).attr('stroke-width', 0.5)
        .attr('opacity', 0).attr('data-id', d => d.id)
        .style('cursor', 'default');
  }

  _defaultStroke(d) {
    // return the current scene's default stroke for a block
    if (this.currentScene === 2) return d3.color(this._venueColor(d.venue)).darker(0.6);
    if (this.currentScene === 3) return d3.color(this._venueColor(d.venue)).darker(0.6);
    if (this.currentScene === 4) return d3.color(this._venueColor(d.venue)).darker(0.6);
    if (this.currentScene === 5) return d3.color(PV_COLORS.cluster[d.cluster_index]).darker(0.6);
    return this._c('blockStroke');
  }

  _defaultFill(d) {
    if (this.currentScene === 3 || this.currentScene === 4) return this._venueColor(d.venue);
    if (this.currentScene === 5) return PV_COLORS.cluster[d.cluster_index];
    return this._c('blockFill');
  }

  /* ══════════════════════════════════════════════════════════════════════
     SECTION: Network data
  ══════════════════════════════════════════════════════════════════════ */

  _buildNetwork() {
    const nodeMap = new Map(), linkMap = new Map();
    this.data.forEach((pub, pi) => {
      const authors = pub.authors.split(';').map(a => a.trim()).filter(Boolean);
      authors.forEach(a => {
        if (!nodeMap.has(a))
          nodeMap.set(a, { id: a, isBC: a === 'Bum Chul Kwon', count: 0, firstPub: pi, papers: [] });
        const n = nodeMap.get(a);
        n.count++;
        n.papers.push(pi);
      });
      for (let i = 0; i < authors.length; i++)
        for (let j = i + 1; j < authors.length; j++) {
          const key = [authors[i], authors[j]].sort().join('\x00');
          if (!linkMap.has(key))
            linkMap.set(key, { source: authors[i], target: authors[j], firstPub: pi, weight: 0 });
          linkMap.get(key).weight++;
        }
    });
    this.netNodes = [...nodeMap.values()];
    this.netLinks = [...linkMap.values()];
    /* shared scales — used by all network renderers */
    const maxCount  = d3.max(this.netNodes, n => n.count)  || 1;
    const maxWeight = d3.max(this.netLinks,  l => l.weight) || 1;
    this._rScale = d3.scaleSqrt().domain([1, maxCount]).range([3, 20]).clamp(true);
    this._wScale = d3.scaleSqrt().domain([1, maxWeight]).range([1, 10]).clamp(true);
  }

  _prerunForce() {
    const BS = PubVis.BS, step = BS + PubVis.GAP;
    const perRow = Math.floor(this.W / step);
    const topRows = Math.ceil(this.data.length / perRow);
    this._netTop = topRows * step + 22;

    const netH = this.H - this._netTop;
    const cx = this.W / 2, cy = this._netTop + netH / 2;

    const snapNodes = this.netNodes.map(n => ({
      id: n.id, isBC: n.isBC, count: n.count,
      x: cx + (Math.random() - 0.5) * this.W * 0.8,
      y: this._netTop + (Math.random()) * netH,
    }));
    const snapLinks = this.netLinks.map(l => ({ source: l.source, target: l.target }));

    /* strong spread forces to fill the canvas */
    const sim = d3.forceSimulation(snapNodes)
      .force('link', d3.forceLink(snapLinks).id(d => d.id).distance(55).strength(0.25))
      .force('charge', d3.forceManyBody().strength(-90))
      .force('center', d3.forceCenter(cx, cy).strength(0.02))
      .force('collision', d3.forceCollide(d => this._rScale(d.count) + 4).strength(0.9))
      .force('x', d3.forceX(cx).strength(0.008))
      .force('y', d3.forceY(cy).strength(0.02))
      .stop();

    /* custom boundary force */
    const pad = 14, yTop = this._netTop + 4, yBot = this.H - 6;
    for (let i = 0; i < 1000; i++) {
      sim.tick();
      snapNodes.forEach(n => {
        n.x = Math.max(pad, Math.min(this.W - pad, n.x));
        n.y = Math.max(yTop, Math.min(yBot, n.y));
      });
    }

    const posMap = new Map(snapNodes.map(n => [n.id, { x: n.x, y: n.y }]));
    this.netNodes.forEach(n => {
      const p = posMap.get(n.id);
      n.px = p.x; n.py = p.y;
    });
  }

  /* ══════════════════════════════════════════════════════════════════════
     SECTION: Axis / legend / annotation helpers
  ══════════════════════════════════════════════════════════════════════ */

  _drawXAxis(scale, label) {
    this.xAxisG
      .call(d3.axisBottom(scale).tickFormat(d => `${d}`).tickSize(-this.H))
      .call(g => g.select('.domain').attr('stroke', this._c('axisDomain')))
      .call(g => g.selectAll('.tick line').attr('stroke', this._c('axisGrid')).attr('stroke-dasharray', '2,3'))
      .call(g => g.selectAll('text').attr('fill', this._c('axisTickText')).attr('font-size', 10));

    /* Rotate band-scale labels 45° on narrow displays to prevent overlap.
       rotate(-45, 0, 9) pivots around the label's original position so the
       right end of each rotated label stays horizontally aligned with its bar. */
    const isBand = typeof scale.bandwidth === 'function';
    const shouldRotate = isBand && this.W < 380;
    const tickTexts = this.xAxisG.selectAll('.tick text');
    if (shouldRotate) {
      tickTexts
        .attr('y', 9).attr('dy', '0')
        .attr('text-anchor', 'end')
        .attr('transform', 'rotate(-45, 0, 9)');
    } else {
      tickTexts.attr('transform', null);
    }

    this.xAxisG.selectAll('.ax-lbl').remove();
    this.xAxisG.append('text').attr('class', 'ax-lbl')
      .attr('x', this.W / 2).attr('y', 36)
      .attr('fill', this._c('axisLabel')).attr('font-size', 10.5).attr('text-anchor', 'middle')
      .text(label);
    this.xAxisG.transition().duration(T.AXIS_IN).style('opacity', 1);
  }

  _drawYAxis(scale, label) {
    this.yAxisG
      .call(d3.axisLeft(scale).tickFormat(d => d >= 1000 ? `${d/1000}k` : `${d}`).tickSize(-this.W))
      .call(g => g.select('.domain').attr('stroke', this._c('axisDomain')))
      .call(g => g.selectAll('.tick line').attr('stroke', this._c('axisGrid')).attr('stroke-dasharray', '2,3'))
      .call(g => g.selectAll('text').attr('fill', this._c('axisTickText')).attr('font-size', 10));
    this.yAxisG.selectAll('.ax-lbl').remove();
    this.yAxisG.append('text').attr('class', 'ax-lbl')
      .attr('transform', 'rotate(-90)').attr('x', -this.H / 2).attr('y', -40)
      .attr('fill', this._c('axisLabel')).attr('font-size', 10.5).attr('text-anchor', 'middle')
      .text(label);
    this.yAxisG.transition().duration(T.AXIS_IN).style('opacity', 1);
  }

  _hideAxes(done) {
    let n = 2;
    const chk = () => { if (--n === 0 && done) done(); };
    this.xAxisG.transition().duration(350).style('opacity', 0).on('end', chk);
    this.yAxisG.transition().duration(350).style('opacity', 0).on('end', chk);
  }

  _showLegend(entries) {
    this.legendG.selectAll('*').remove();
    const rowH = 15;
    entries.forEach(({ color, label }, i) => {
      const row = this.legendG.append('g').attr('transform', `translate(0,${i * rowH})`);
      row.append('rect').attr('width', 8).attr('height', 8).attr('rx', 1)
        .attr('y', -6).attr('fill', color);
      row.append('text').attr('x', 11).attr('y', 1)
        .attr('fill', this._c('legendText')).attr('font-size', 9.5)
        .attr('font-family', 'Inter, system-ui, sans-serif')
        .text(label.length > 26 ? label.slice(0, 25) + '…' : label);
    });
    this.legendG.style('opacity', 0).transition().duration(500).style('opacity', 1);
  }

  _hideLegend() { this.legendG.transition().duration(350).style('opacity', 0); }

  _showAnnotation(lines, opts = {}) {
    const cx = opts.x != null ? opts.x : this.W / 2;
    const cy = opts.y != null ? opts.y : this.H / 2;
    const fs = opts.fontSize || 12.5, lh = fs + 5;
    const arr = Array.isArray(lines) ? lines : [lines];

    this.annotG.selectAll('*').remove();
    const bg = this.annotG.append('rect').attr('rx', 6)
      .attr('fill', this._c('annotBg'))
      .attr('stroke', this._c('annotBorder'))
      .attr('stroke-width', 1).style('filter', 'drop-shadow(0 2px 6px rgba(0,0,0,0.09))');
    const tg = this.annotG.append('g');
    arr.forEach((line, i) => {
      tg.append('text').attr('text-anchor', 'middle').attr('dy', `${i * lh}px`)
        .attr('fill', i === 0 ? this._c('annotTitle') : this._c('annotSub'))
        .attr('font-size', i === 0 ? fs : fs - 1)
        .attr('font-weight', i === 0 ? 600 : 400)
        .attr('font-family', 'Inter, system-ui, sans-serif')
        .text(line);
    });
    const bb = tg.node().getBBox();
    const px = 14, py = 9, bw = bb.width + px * 2, bh = arr.length * lh + py * 2;
    bg.attr('x', cx - bw/2).attr('y', cy - bh/2).attr('width', bw).attr('height', bh);
    tg.attr('transform', `translate(${cx},${cy - (arr.length - 1) * lh / 2})`);
    this.annotG.style('opacity', 0).transition().duration(T.ANNOT_IN).style('opacity', 1);
  }

  _hideAnnotation(done) {
    this.annotG.transition().duration(T.ANNOT_OUT).style('opacity', 0)
      .on('end', () => { this.annotG.selectAll('*').remove(); if (done) done(); });
  }

  _venueColor(v) { return PV_COLORS.venue[v] || PV_COLORS.venueOther; }

  /* ══════════════════════════════════════════════════════════════════════
     SECTION: Scene runner (state machine)
  ══════════════════════════════════════════════════════════════════════ */

  _schedule(fn, ms) {
    clearTimeout(this._timer);
    this._timer = setTimeout(fn, ms);
  }

  /** Called at the end of each animated scene */
  _sceneComplete() {
    this._sceneReady = true;
    this._enableInteractionsForScene(this.currentScene);
    this._updateUI();
    if (this.playState === 'playing') {
      this._schedule(() => this._nextScene(), T.SCENE_PAUSE);
    }
  }

  _nextScene() {
    if (this.playState !== 'playing') return;
    if (this.currentScene >= PubVis.SCENE_NAMES.length) {
      this._loopBack();
    } else {
      this.currentScene++;
      this._removeInteractions();
      this[`_scene${this.currentScene}`]();
    }
  }

  /* ── Jump to a scene instantly ────────────────────────────────────── */
  _jumpToScene(n) {
    clearTimeout(this._timer);
    this.blocks.interrupt();
    this.xAxisG.interrupt(); this.yAxisG.interrupt();
    this.legendG.interrupt(); this.annotG.interrupt();
    this.netG.interrupt();

    this.playState = 'stopped';
    this.currentScene = n;
    this._sceneReady = true;

    this._removeInteractions();
    this._applySceneSnap(n);
    this._updateUI();
    this._enableInteractionsForScene(n);
  }

  _applySceneSnap(n) {
    /* reset transient state */
    this.netG.style('opacity', 0).selectAll('*').remove();
    this.xAxisG.style('opacity', 0); this.yAxisG.style('opacity', 0);
    this.legendG.selectAll('*').remove(); this.legendG.style('opacity', 0);
    this.annotG.selectAll('*').remove(); this.annotG.style('opacity', 0);

    const snaps = [null, '_snapS1', '_snapS2', '_snapS3', '_snapS4', '_snapS5', '_snapS6'];
    this[snaps[n]]();
  }

  /* ── per-scene layout ensurers (compute lazily, once) ─────────────── */

  _ensureScene2Layout() {
    if (this._l2) return;
    const BS = PubVis.BS, step = BS + PubVis.GAP;
    const years = [...new Set(this.data.map(d => d.year))].sort((a, b) => a - b);
    this.xScale2 = d3.scaleBand().domain(years).range([0, this.W]).padding(0.35);
    const yg = d3.group(this.data, d => d.year);
    yg.forEach(p => p.sort((a, b) => a.title.localeCompare(b.title)));
    this.data.forEach(d => {
      const g = yg.get(d.year), si = g.indexOf(d);
      d._tx = this.xScale2(d.year) + this.xScale2.bandwidth() / 2;
      d._ty = this.H - (si + 0.5) * step;
    });
    const maxC = d3.max([...yg.values()], v => v.length);
    this.yScale2 = d3.scaleLinear().domain([0, maxC + 1]).range([this.H, 0]);
    this._l2 = true;
  }

  _ensureScene4Layout() {
    if (this._l4) return;
    this._ensureScene2Layout();
    const sorted = [...this.data].sort((a, b) => b.citation_count - a.citation_count);
    sorted.forEach((d, i) => { d._rank = i; });
    const n = sorted.length;
    const bw = Math.max(3, Math.floor(this.W / n) - 1);
    this._barW = bw;
    this.xScale4 = d3.scaleLinear().domain([0, n - 1]).range([bw, this.W - bw]);
    this.yScale4 = d3.scaleLinear()
      .domain([0, d3.max(this.data, d => d.citation_count)])
      .range([this.H, 2]);
    this._l4 = true;
  }

  _ensureScene5Layout() {
    const pad = 18;
    const xExt = d3.extent(this.data, d => d.x);
    const yExt = d3.extent(this.data, d => d.y);
    this.xScaleU = d3.scaleLinear().domain(xExt).range([pad, this.W - pad]);
    this.yScaleU = d3.scaleLinear().domain(yExt).range([this.H - pad, pad]);
  }

  _ensureScene6Layout() {
    const BS = PubVis.BS, step = BS + PubVis.GAP;
    const perRow = Math.floor(this.W / step);
    this.data.forEach(d => {
      d._topX = (d.idx % perRow) * step + BS / 2;
      d._topY = Math.floor(d.idx / perRow) * step + BS / 2 + 2;
    });
  }

  /* ── Instant snap renderers ───────────────────────────────────────── */

  _snapS1() {
    const cx = this.W / 2, cy = this.H / 2;
    this.blocks.attr('d', () => this._sq(cx, cy, PubVis.BS, PubVis.BS))
      .attr('fill', this._c('blockFill')).attr('stroke', this._c('blockStroke')).attr('stroke-width', 0.5)
      .attr('opacity', 0.88);
  }

  _snapS2() {
    this._ensureScene2Layout();
    this.blocks.attr('d', d => this._sq(d._tx, d._ty, PubVis.BS, PubVis.BS))
      .attr('fill', this._c('blockFill')).attr('stroke', this._c('blockStroke')).attr('stroke-width', 0.5)
      .attr('opacity', 0.88);
    this._drawXAxis(this.xScale2, 'Year');
    this._drawYAxis(this.yScale2, '# publications');
    this.xAxisG.style('opacity', 1); this.yAxisG.style('opacity', 1);
  }

  _snapS3() {
    this._ensureScene2Layout();
    this.blocks.attr('d', d => this._sq(d._tx, d._ty, PubVis.BS, PubVis.BS))
      .attr('fill', d => this._venueColor(d.venue))
      .attr('stroke', d => d3.color(this._venueColor(d.venue)).darker(0.6))
      .attr('stroke-width', 0.5).attr('opacity', 0.88);
    this._drawXAxis(this.xScale2, 'Year');
    this._drawYAxis(this.yScale2, '# publications');
    this.xAxisG.style('opacity', 1); this.yAxisG.style('opacity', 1);
    const entries = this._venueLegendEntries();
    this.legendG.selectAll('*').remove();
    const rowH = 15;
    entries.forEach(({ color, label }, i) => {
      const row = this.legendG.append('g').attr('transform', `translate(0,${i * rowH})`);
      row.append('rect').attr('width', 8).attr('height', 8).attr('rx', 1).attr('y', -6).attr('fill', color);
      row.append('text').attr('x', 11).attr('y', 1).attr('fill', this._c('legendText')).attr('font-size', 9.5)
        .attr('font-family', 'Inter, system-ui, sans-serif')
        .text(label.length > 26 ? label.slice(0, 25) + '…' : label);
    });
    this.legendG.style('opacity', 1);
  }

  _snapS4() {
    this._ensureScene4Layout();
    const bw = this._barW;
    this.blocks
      .attr('fill', d => this._venueColor(d.venue))
      .attr('stroke', d => d3.color(this._venueColor(d.venue)).darker(0.6))
      .attr('stroke-width', 0.5).attr('opacity', 0.88)
      .attr('d', d => {
        const cx = this.xScale4(d._rank);
        const top = this.yScale4(Math.max(0, d.citation_count));
        return `M ${cx-bw/2},${top} L ${cx+bw/2},${top} L ${cx+bw/2},${this.H} L ${cx-bw/2},${this.H} Z`;
      });
    const xBand = d3.scaleLinear().domain([1, this.data.length]).range([this._barW, this.W - this._barW]);
    this._drawXAxis(xBand, '← more cited  ·  rank  ·  less cited →');
    this._drawYAxis(this.yScale4, 'Citations');
    this.xAxisG.style('opacity', 1); this.yAxisG.style('opacity', 1);
  }

  _snapS5() {
    this._ensureScene5Layout();
    const cc = PV_COLORS.cluster;
    this.blocks
      .attr('d', d => this._circle(this.xScaleU(d.x), this.yScaleU(d.y), PubVis.CR))
      .attr('fill', d => cc[d.cluster_index])
      .attr('stroke', d => d3.color(cc[d.cluster_index]).darker(0.6))
      .attr('stroke-width', 0.8).attr('opacity', 0.85);
    const topics = d3.rollups(this.data, v => v[0].topic_summary, d => d.cluster_index)
      .sort((a, b) => a[0] - b[0])
      .map(([ci, label]) => ({ color: cc[ci], label: label || `Cluster ${ci}` }));
    this.legendG.selectAll('*').remove();
    const rowH = 15;
    topics.forEach(({ color, label }, i) => {
      const row = this.legendG.append('g').attr('transform', `translate(0,${i * rowH})`);
      row.append('rect').attr('width', 8).attr('height', 8).attr('rx', 1).attr('y', -6).attr('fill', color);
      row.append('text').attr('x', 11).attr('y', 1).attr('fill', this._c('legendText')).attr('font-size', 9.5)
        .attr('font-family', 'Inter, system-ui, sans-serif')
        .text(label.length > 26 ? label.slice(0, 25) + '…' : label);
    });
    this.legendG.style('opacity', 1);
  }

  _snapS6() {
    this._ensureScene6Layout();
    const BS = PubVis.BS;
    this.blocks.attr('d', d => this._sq(d._topX, d._topY, BS, BS))
      .attr('fill', this._c('blockFill')).attr('stroke', this._c('blockStroke')).attr('stroke-width', 0.5)
      .attr('opacity', 0.9);
    this._buildFullNetwork();
  }

  _buildFullNetwork() {
    const nodeMap = new Map(this.netNodes.map(n => [n.id, n]));

    this.netG.selectAll('line.pv-link')
      .data(this.netLinks).join('line')
        .attr('class', 'pv-link').attr('stroke', this._c('netEdge'))
        .attr('stroke-width', d => this._wScale(d.weight))
        .attr('opacity', 0.7)
        .attr('x1', d => nodeMap.get(d.source).px).attr('y1', d => nodeMap.get(d.source).py)
        .attr('x2', d => nodeMap.get(d.target).px).attr('y2', d => nodeMap.get(d.target).py);

    const ngs = this.netG.selectAll('g.pv-node')
      .data(this.netNodes).join('g')
        .attr('class', 'pv-node')
        .attr('transform', d => `translate(${d.px},${d.py})`);

    ngs.append('circle')
      .attr('r', d => this._rScale(d.count))
      .attr('fill',   d => d.isBC ? this._c('netBcFill')    : this._c('netNodeFill'))
      .attr('stroke', d => d.isBC ? this._c('netBcStroke')  : this._c('netNodeStroke'))
      .attr('stroke-width', d => d.isBC ? 2 : 1);

    ngs.filter(d => d.isBC).append('text')
      .attr('text-anchor', 'middle').attr('dy', '0.35em')
      .attr('fill', this._c('netBcText')).attr('font-size', 7.5).attr('font-weight', 700)
      .attr('pointer-events', 'none').text('BC');

    this.netG.style('opacity', 1);
  }

  _venueLegendEntries() {
    const counts = d3.rollups(this.data, v => v.length, d => d.venue).sort((a, b) => b[1] - a[1]);
    const seen = new Set(), entries = [];
    counts.forEach(([v]) => {
      const c = this._venueColor(v);
      if (PV_COLORS.venue[v] && !seen.has(c)) {
        seen.add(c);
        /* strip variant suffixes so "EuroVis-Short" → "EuroVis" in the legend */
        const label = v.replace(/-Short$|-STAR$/, '');
        entries.push({ color: c, label });
      }
    });
    entries.push({ color: PV_COLORS.venueOther, label: 'Other venues' });
    return entries;
  }

  /* ══════════════════════════════════════════════════════════════════════
     SECTION: Animated scenes
  ══════════════════════════════════════════════════════════════════════ */

  _scene1() {
    this.currentScene = 1; this._sceneReady = false;
    this._updateUI();
    const cx = this.W / 2, cy = this.H / 2;
    this.blocks.attr('d', () => this._sq(cx, cy, PubVis.BS, PubVis.BS))
      .attr('fill', this._c('blockFill')).attr('stroke', this._c('blockStroke')).attr('stroke-width', 0.5);
    this.blocks.transition().delay((d, i) => i * T.BLOCK_STAGGER).duration(280).attr('opacity', 0.88);
    this._sched(() => this._sceneComplete(), this.data.length * T.BLOCK_STAGGER + 280 + 200);
  }

  _scene2() {
    this.currentScene = 2; this._sceneReady = false;
    this._updateUI();
    this._ensureScene2Layout();

    this._drawXAxis(this.xScale2, 'Year');
    /* on resume the x-axis is already visible — skip the draw-wait preamble */
    const xReady2 = +this.xAxisG.style('opacity') > 0.5;
    this._sched(() => {
      this._drawYAxis(this.yScale2, '# publications');
      this.blocks.transition().delay((d, i) => i * 12).duration(T.BLOCK_MOVE)
        .attr('d', d => this._sq(d._tx, d._ty, PubVis.BS, PubVis.BS));

      const years = [...new Set(this.data.map(d => d.year))].sort((a, b) => a - b);
      this._sched(() => {
        this._showAnnotation([
          `${this.data.length} selected publications`,
          `spanning ${years[0]} – ${years[years.length - 1]}`,
        ], { y: this.H * 0.28 });
        this._sched(() => this._sceneComplete(), 1200);
      }, this.data.length * 12 + T.BLOCK_MOVE + 200);
    }, xReady2 ? 0 : T.AXIS_DELAY);
  }

  _scene3() {
    this.currentScene = 3; this._sceneReady = false;
    this._updateUI();
    this._hideAnnotation(() => {
      this._hideLegend();
      this.blocks.transition().duration(T.COLOR_CHANGE)
        .attr('fill', d => this._venueColor(d.venue))
        .attr('stroke', d => d3.color(this._venueColor(d.venue)).darker(0.6))
        .attr('stroke-width', 0.5);
      this._sched(() => {
        this._showLegend(this._venueLegendEntries());
        this._showAnnotation([
          'Publications across diverse venues',
          'TVCG · CHI · VIS · EuroVis · JMIR and more',
        ], { y: this.H * 0.28 });
        this._sched(() => this._sceneComplete(), 800);
      }, T.COLOR_CHANGE + 100);
    });
  }

  _scene4() {
    this.currentScene = 4; this._sceneReady = false;
    this._updateUI();
    this._hideAnnotation(() => {
      this._hideLegend();
      this._hideAxes(() => {
        this._ensureScene4Layout();
        const bw = this._barW;
        const xBand = d3.scaleLinear().domain([1, this.data.length]).range([bw, this.W - bw]);
        /* on resume the citation axes may already be visible — skip the draw-wait */
        const xReady4 = +this.xAxisG.style('opacity') > 0.5;
        this._drawXAxis(xBand, '← more cited  ·  rank  ·  less cited →');
        this._drawYAxis(this.yScale4, 'Citations');
        this._sched(() => {
          this.blocks.transition().delay(d => d._rank * 7).duration(T.BAR_MOVE)
            .attr('fill', d => this._venueColor(d.venue))
            .attr('d', d => {
              const cx = this.xScale4(d._rank);
              const top = this.yScale4(Math.max(0, d.citation_count));
              return `M ${cx-bw/2},${top} L ${cx+bw/2},${top} L ${cx+bw/2},${this.H} L ${cx-bw/2},${this.H} Z`;
            });
          const total = d3.sum(this.data, d => d.citation_count);
          const topPub = [...this.data].sort((a, b) => b.citation_count - a.citation_count)[0];
          this._sched(() => {
            this._showAnnotation([
              `Cited by others ${total.toLocaleString()} times in total`,
              `Most cited: ${topPub.title.slice(0, 44)}${topPub.title.length > 44 ? '…' : ''}`,
            ], { y: this.H * 0.3 });
            this._sched(() => this._sceneComplete(), 1000);
          }, this.data.length * 7 + T.BAR_MOVE + 250);
        }, xReady4 ? 0 : T.AXIS_DELAY);
      });
    });
  }

  _scene5() {
    this.currentScene = 5; this._sceneReady = false;
    this._updateUI();
    this._hideAnnotation(() => {
      this._hideLegend();
      this._hideAxes(() => {
        this._ensureScene5Layout();
        const cc = PV_COLORS.cluster;
        this.blocks.transition().duration(T.FADE_OUT).attr('opacity', 0);
        this._sched(() => {
          this.blocks
            .attr('d', d => this._circle(this.xScaleU(d.x), this.yScaleU(d.y), PubVis.CR))
            .attr('fill', d => cc[d.cluster_index])
            .attr('stroke', d => d3.color(cc[d.cluster_index]).darker(0.6))
            .attr('stroke-width', 0.8);
          this.blocks.transition().duration(T.FADE_IN).delay((d, i) => i * 8).attr('opacity', 0.85);
          const topics = d3.rollups(this.data, v => v[0].topic_summary, d => d.cluster_index)
            .sort((a, b) => a[0] - b[0])
            .map(([ci, label]) => ({ color: cc[ci], label: label || `Cluster ${ci}` }));
          this._sched(() => {
            this._showLegend(topics);
            this._showAnnotation([
              'A variety of research topics explored',
              'Grouped by abstract similarity (UMAP + K-Means)',
            ], { y: this.H * 0.15 });
            this._sched(() => this._sceneComplete(), 900);
          }, this.data.length * 8 + T.FADE_IN + 200);
        }, T.FADE_OUT + 20);
      });
    });
  }

  _scene6() {
    this.currentScene = 6; this._sceneReady = false;
    this._updateUI();
    this._hideAnnotation(() => {
      this._hideLegend();
      this._ensureScene6Layout();
      const BS = PubVis.BS;

      /* step 1: to black */
      this.blocks.transition().duration(500)
        .attr('fill', this._c('blockFill')).attr('stroke', this._c('blockStroke')).attr('stroke-width', 0.5);
      /* step 2: change shape + move to top row */
      this._sched(() => {
        this.blocks.transition().duration(T.FADE_OUT).attr('opacity', 0);
        this._sched(() => {
          this.blocks.attr('d', d => this._sq(d._topX, d._topY, BS, BS));
          this.blocks.transition().duration(450).attr('opacity', 0.9);
          this._sched(() => this._runNetworkAnimation(), 470);
        }, T.FADE_OUT + 20);
      }, 520);
    });
  }

  /* startIdx — index into this.data of the first paper to reveal.
     On fresh start (or stop→play) pass 0.
     On pause→play pass this._netAnimStartIdx so the animation resumes from where it froze. */
  _runNetworkAnimation(startIdx = 0) {
    this._netAnimRunning  = true;
    this._netAnimStartIdx = startIdx;
    const self    = this;
    const nodeMap = new Map(this.netNodes.map(n => [n.id, n]));

    /* pre-compute cumulative state for papers 0 .. startIdx-1 so already-revealed
       nodes/edges appear at their correct size/opacity immediately */
    const nodeCounts  = new Map(this.netNodes.map(n => [n.id, 0]));
    const linkWeights = new Map(this.netLinks.map(l =>
      [[l.source, l.target].sort().join('\x00'), 0]
    ));
    for (let si = 0; si < startIdx; si++) {
      const p  = this.data[si];
      const au = p.authors.split(';').map(a => a.trim()).filter(Boolean);
      au.forEach(a => nodeCounts.set(a, (nodeCounts.get(a) || 0) + 1));
      for (let i = 0; i < au.length; i++)
        for (let j = i + 1; j < au.length; j++) {
          const k = [au[i], au[j]].sort().join('\x00');
          linkWeights.set(k, (linkWeights.get(k) || 0) + 1);
        }
    }

    /* clear and rebuild the network DOM so no stale duplicate children remain
       after a resume — JS is synchronous so the browser renders only the final state */
    this.netG.selectAll('*').remove();

    const linkSels = this.netG.selectAll('line.pv-link')
      .data(this.netLinks).join('line')
        .attr('class', 'pv-link').attr('stroke', self._c('netEdge'))
        /* already-revealed edges → final width; not-yet-revealed → width 1 */
        .attr('stroke-width', d => {
          if (d.firstPub >= startIdx) return 1;
          const k = [d.source, d.target].sort().join('\x00');
          return self._wScale(linkWeights.get(k) || 1);
        })
        .attr('opacity', d => d.firstPub < startIdx ? 0.7 : 0)
        .attr('x1', d => nodeMap.get(d.source).px).attr('y1', d => nodeMap.get(d.source).py)
        .attr('x2', d => nodeMap.get(d.target).px).attr('y2', d => nodeMap.get(d.target).py);

    const nodeGs = this.netG.selectAll('g.pv-node')
      .data(this.netNodes).join('g')
        .attr('class', 'pv-node')
        .attr('transform', d => `translate(${d.px},${d.py})`)
        /* already-revealed nodes → visible; not-yet → hidden */
        .attr('opacity', d => d.firstPub < startIdx ? 1 : 0);

    nodeGs.append('circle')
      /* already-revealed nodes → final radius; not-yet → start at minimum */
      .attr('r', d => d.firstPub < startIdx ? self._rScale(nodeCounts.get(d.id) || 1) : 3)
      .attr('fill',   d => d.isBC ? self._c('netBcFill')   : self._c('netNodeFill'))
      .attr('stroke', d => d.isBC ? self._c('netBcStroke') : self._c('netNodeStroke'))
      .attr('stroke-width', d => d.isBC ? 2 : 1);

    nodeGs.filter(d => d.isBC).append('text')
      .attr('text-anchor', 'middle').attr('dy', '0.35em')
      .attr('fill', self._c('netBcText')).attr('font-size', 7.5).attr('font-weight', 700)
      .attr('pointer-events', 'none').text('BC');

    this.netG.style('opacity', 1);

    /* advance interval decay to match the speed we'd be at after startIdx papers */
    let elapsed = 0, interval = T.NET_INTERVAL0;
    for (let si = 0; si < startIdx; si++) {
      interval = Math.max(interval * T.NET_DECAY, T.NET_MIN);
    }

    /* schedule only the remaining papers; delays are relative to now (elapsed = 0) */
    this.data.slice(startIdx).forEach(pub => {
      const delay = elapsed;
      elapsed += interval;
      interval = Math.max(interval * T.NET_DECAY, T.NET_MIN);

      self._sched(() => {
        self._netAnimStartIdx = pub.idx + 1;  /* track for next resume */

        d3.select(self.blocksG.selectAll('path.pv-block').nodes()[pub.idx])
          .transition().duration(Math.min(interval * 0.7, 280))
          .attr('fill', self._c('blockReveal')).attr('stroke', self._c('blockRevealStroke')).attr('stroke-width', 1);

        const authors = pub.authors.split(';').map(a => a.trim()).filter(Boolean);
        const authorSet = new Set(authors);

        authors.forEach(a => nodeCounts.set(a, (nodeCounts.get(a) || 0) + 1));
        for (let i = 0; i < authors.length; i++)
          for (let j = i + 1; j < authors.length; j++) {
            const k = [authors[i], authors[j]].sort().join('\x00');
            linkWeights.set(k, (linkWeights.get(k) || 0) + 1);
          }

        nodeGs.filter(d => authorSet.has(d.id)).each(function(d) {
          const g = d3.select(this);
          const newR = self._rScale(nodeCounts.get(d.id) || 1);
          if (d.firstPub === pub.idx) g.transition().duration(300).attr('opacity', 1);
          g.select('circle').transition().duration(300).attr('r', newR);
        });

        linkSels.filter(d => authorSet.has(d.source) && authorSet.has(d.target)).each(function(d) {
          const sel = d3.select(this);
          const k = [d.source, d.target].sort().join('\x00');
          const newW = self._wScale(linkWeights.get(k) || 1);
          const t = sel.transition().duration(300);
          if (d.firstPub === pub.idx) t.attr('opacity', 0.7);
          t.attr('stroke-width', newW);
        });
      }, delay);
    });

    /* final annotation */
    self._sched(() => {
      self._netAnimRunning = false;
      self._showAnnotation([
        'A growing network of collaborations',
        `${self.netNodes.length} collaborators · ${self.netLinks.length} co-authorship links`,
      ], { y: self._netTop + (self.H - self._netTop) * 0.12 });
      self._sched(() => self._sceneComplete(), 1200);
    }, elapsed + 400);
  }

  /* ══════════════════════════════════════════════════════════════════════
     SECTION: Loop-back to initial state
  ══════════════════════════════════════════════════════════════════════ */

  _loopBack() {
    this._hideAnnotation(() => {
      /* fade out network */
      this.netG.transition().duration(T.LOOP_NET_FADE).style('opacity', 0);
      this._sched(() => {
        this.netG.selectAll('*').remove();
        /* move blocks back to centre in black */
        const cx = this.W / 2, cy = this.H / 2;
        this.blocks.transition().duration(T.LOOP_RETURN)
          .attr('fill', this._c('blockFill')).attr('stroke', this._c('blockStroke')).attr('stroke-width', 0.5)
          .attr('d', () => this._sq(cx, cy, PubVis.BS, PubVis.BS));
        this._sched(() => {
          this.currentScene = 1;
          this._sceneReady = true;
          if (this.playState === 'playing') {
            this._schedule(() => this._nextScene(), T.SCENE_PAUSE);
          }
          this._updateUI();
        }, T.LOOP_RETURN + 100);
      }, T.LOOP_NET_FADE + 50);
    });
  }

  /* ══════════════════════════════════════════════════════════════════════
     SECTION: Block interactions (hover tooltip + click nav)
  ══════════════════════════════════════════════════════════════════════ */

  _addBlockInteractions() {
    this.blocks
      .on('mouseover.pv', (event, d) => { this._showTooltip(d, event); })
      .on('mousemove.pv', (event) => { this._moveTooltip(event); })
      .on('mouseout.pv', () => this._hideTooltip())
      .on('click.pv', (event, d) => {
        if (this.playState === 'playing' || this._lassoFired) return;
        event.stopPropagation();
        const ids = new Set([d.id]);
        this._highlightBlocks(ids);
        this._applyFilter(ids);
      });
  }

  _addNetNodeInteractions(nodeGs, linkSels) {
    const nodeMap = new Map(this.netNodes.map(n => [n.id, n]));
    nodeGs
      .style('cursor', 'pointer')
      .on('mouseover.pv', (event, d) => { this._showAuthorTooltip(d, event); })
      .on('mousemove.pv', (event) => { this._moveTooltip(event); })
      .on('mouseout.pv', () => this._hideTooltip())
      .on('click.pv', (event, d) => {
        if (this.playState === 'playing' || this._lassoFired) return;
        event.stopPropagation();
        /* highlight clicked node with orange stroke */
        this.netG.selectAll('g.pv-node').select('circle')
          .attr('stroke', nd => nd.id === d.id ? this._c('selectOrange') : (nd.isBC ? this._c('netBcStroke') : this._c('netNodeStroke')))
          .attr('stroke-width', nd => nd.id === d.id ? 3 : (nd.isBC ? 2 : 1));
        /* filter pubs by this author */
        const ids = new Set(this.data.filter(p =>
          p.authors.split(';').map(a => a.trim()).includes(d.id)
        ).map(p => p.id));
        this._highlightBlocks(ids);
        this._applyFilter(ids);
      });
  }

  /* ══════════════════════════════════════════════════════════════════════
     SECTION: Tooltip
  ══════════════════════════════════════════════════════════════════════ */

  _showTooltip(d, event) {
    const auths = d.authors.split(';').map(a => a.trim()).filter(Boolean);
    const authStr = auths.length > 3
      ? auths.slice(0, 3).join(', ') + ', et al.'
      : auths.join(', ');
    this.tooltipEl.html(`
      <div style="font-weight:600;font-size:11.5px;line-height:1.4;margin-bottom:4px;color:${this._c('tooltipTitle')}">${d.title}</div>
      <div style="color:${this._c('tooltipSub')};font-size:10.5px;">${d.year} · <em>${d.venue}</em></div>
      <div style="color:${this._c('tooltipSub')};font-size:10px;margin-top:2px;">${authStr}</div>
      <div style="color:${this._c('tooltipSub')};font-size:10px;margin-top:2px;">${d.citation_count} citations</div>
    `);
    this.tooltipEl.style('display', 'block');
    this._moveTooltip(event);
  }

  _showAuthorTooltip(d, event) {
    const pubCount = this.data.filter(p =>
      p.authors.split(';').map(a => a.trim()).includes(d.id)
    ).length;
    this.tooltipEl.html(`
      <div style="font-weight:600;font-size:11.5px;color:${this._c('tooltipTitle')}">${d.id}</div>
      <div style="color:${this._c('tooltipSub')};font-size:10.5px;margin-top:2px;">${pubCount} co-authored publications</div>
      <div style="color:${this._c('tooltipMuted')};font-size:10px;margin-top:2px;">Click to filter publication list</div>
    `);
    this.tooltipEl.style('display', 'block');
    this._moveTooltip(event);
  }

  _moveTooltip(event) {
    const x = Math.min(event.clientX + 14, window.innerWidth - 260);
    const y = Math.max(event.clientY - 20, 8);
    this.tooltipEl.style('left', x + 'px').style('top', y + 'px');
  }

  _hideTooltip() {
    this.tooltipEl.style('display', 'none');
  }

  /* ══════════════════════════════════════════════════════════════════════
     SECTION: Interactions per scene (brush / lasso)
  ══════════════════════════════════════════════════════════════════════ */

  _enableInteractionsForScene(n) {
    if (this.playState === 'playing') return;
    /* clicking on empty SVG space clears any active filter */
    this.svg.on('click.filter', (event) => {
      if (this._lassoFired || this._playPausedByClick) return;
      if (event.target.closest('path.pv-block, .pv-node, circle')) return;
      this._clearFilter();
    });
    this.blocks.style('cursor', n <= 5 ? 'pointer' : 'default');
    if (n === 2 || n === 3) {
      this._addBrush();
    } else if (n === 5) {
      this._addLasso((polygon) => this._handleUmapLasso(polygon), true);
    } else if (n === 6) {
      this._addLasso((polygon) => this._handleNetLasso(polygon), false);
      // Wire up author-node interactions on whichever nodes exist in the DOM
      const nodeGs  = this.netG.selectAll('g.pv-node');
      const linkSels = this.netG.selectAll('line.pv-link');
      if (!nodeGs.empty()) this._addNetNodeInteractions(nodeGs, linkSels);
    }
  }

  /* SVG-level mousedown active during playback:
     pauses the animation at the exact visual state then performs the appropriate action.
     Users can resume playing afterward. */
  _setupPlayingInteraction() {
    const self = this;
    this.svg.on('mousedown.playingClick', function(event) {
      if (self.playState !== 'playing') return;

      /* PAUSE (not stop): freeze in place, enable interactions, keep current visual state */
      self._handlePlayPause();
      /* suppress the click event that fires after mouseup from accidentally clearing filters */
      self._playPausedByClick = true;
      setTimeout(() => { self._playPausedByClick = false; }, 100);

      const block = event.target.closest('path.pv-block');
      const pNode = event.target.closest('.pv-node');

      if (block && !self._lassoFired) {
        /* clicked a publication block → filter by it */
        const d = d3.select(block).datum();
        if (d) { self._highlightBlocks(new Set([d.id])); self._applyFilter(new Set([d.id])); }
      } else if (pNode && !self._lassoFired) {
        /* clicked an author node → highlight + filter */
        const d = d3.select(pNode).datum();
        if (d) {
          self.netG.selectAll('g.pv-node').select('circle')
            .attr('stroke', nd => nd.id === d.id ? this._c('selectOrange') : (nd.isBC ? this._c('netBcStroke') : this._c('netNodeStroke')))
            .attr('stroke-width', nd => nd.id === d.id ? 3 : (nd.isBC ? 2 : 1));
          const ids = new Set(self.data.filter(p =>
            p.authors.split(';').map(a => a.trim()).includes(d.id)
          ).map(p => p.id));
          self._highlightBlocks(ids); self._applyFilter(ids);
        }
      } else if (self.currentScene === 5 || self.currentScene === 6) {
        /* drag in UMAP/network → _handlePlayPause already added lasso via
           _enableInteractionsForScene; remove it and re-add with the forwarded
           startEvent so the drag continues from this mousedown position */
        self._removeLasso();
        const allowOnBlocks = self.currentScene === 5;
        const cb = self.currentScene === 5
          ? poly => self._handleUmapLasso(poly)
          : poly => self._handleNetLasso(poly);
        self._addLasso(cb, allowOnBlocks, event);
      }
      /* For scenes 2/3: brush is active after pause; user drags to make a selection */
    });

    /* Mirror the mousedown handler for touch so tap/drag during playback
       pauses and activates lasso on UMAP/Network scenes on mobile. */
    this.svg.on('touchstart.playingClick', function(event) {
      if (self.playState !== 'playing') return;
      if (event.touches.length !== 1) return;

      self._handlePlayPause();
      self._playPausedByClick = true;
      setTimeout(() => { self._playPausedByClick = false; }, 100);

      const touch = event.touches[0];
      const block = touch.target.closest('path.pv-block');
      const pNode = touch.target.closest('.pv-node');

      if (block && !self._lassoFired) {
        const d = d3.select(block).datum();
        if (d) { self._highlightBlocks(new Set([d.id])); self._applyFilter(new Set([d.id])); }
      } else if (pNode && !self._lassoFired) {
        const d = d3.select(pNode).datum();
        if (d) {
          self.netG.selectAll('g.pv-node').select('circle')
            .attr('stroke', nd => nd.id === d.id ? self._c('selectOrange') : (nd.isBC ? self._c('netBcStroke') : self._c('netNodeStroke')))
            .attr('stroke-width', nd => nd.id === d.id ? 3 : (nd.isBC ? 2 : 1));
          const ids = new Set(self.data.filter(p =>
            p.authors.split(';').map(a => a.trim()).includes(d.id)
          ).map(p => p.id));
          self._highlightBlocks(ids); self._applyFilter(ids);
        }
      } else if (self.currentScene === 5 || self.currentScene === 6) {
        /* finger drag in UMAP/network: prevent scroll and start lasso from touch point */
        event.preventDefault();
        self._removeLasso();
        const allowOnBlocks = self.currentScene === 5;
        const cb = self.currentScene === 5
          ? poly => self._handleUmapLasso(poly)
          : poly => self._handleNetLasso(poly);
        self._addLasso(cb, allowOnBlocks, event);
      }
    }, { passive: false });
  }

  _removeInteractions() {
    this._removeBrush();
    this._removeLasso();
    this._hideTooltip();
    this.svg.on('click.filter', null);
    this.netG.selectAll('g.pv-node').on('mouseover.pv', null).on('mousemove.pv', null)
      .on('mouseout.pv', null).on('click.pv', null).style('cursor', null);
  }

  /* ── Brush (scene 2) ──────────────────────────────────────────────── */

  _addBrush() {
    if (this._brushG) return;
    const self = this;
    this._brushObj = d3.brushX()
      .extent([[0, 0], [this.W, this.H]])
      .on('brush', function(event) {
        if (!event.selection || !event.sourceEvent) return;
        self._dragging = true;
        const [x0, x1] = event.selection;
        self._previewBrush(x0, x1);
      })
      .on('end', function(event) {
        self._dragging = false;
        if (!event.selection || !event.sourceEvent) {
          self._clearFilter(); return;
        }
        const [x0, x1] = event.selection;
        self._applyBrush(x0, x1);
      });

    /* append AFTER blocks so brush overlay is on top and captures drag events */
    this._brushG = this.g.append('g').attr('class', 'pv-brush');
    this._brushG.call(this._brushObj);
    this._brushG.select('.overlay').style('cursor', 'crosshair');
    this._brushG.select('.selection')
      .attr('fill', this._c('brushFill'))
      .attr('stroke', this._c('brushStroke')).attr('stroke-width', 1.5);

    /* forward hover tooltips through the brush overlay by checking which
       block center is under the cursor (blocks are exactly BS×BS squares) */
    this._ensureScene2Layout();
    const half = PubVis.BS / 2 + 1;   // allow 1px tolerance
    this._brushG.select('.overlay')
      .on('mousemove.tooltip', (event) => {
        if (this._dragging) return;
        const [mx, my] = d3.pointer(event, this.g.node());
        const hit = this.data.find(d =>
          Math.abs((d._tx || 0) - mx) <= half && Math.abs((d._ty || 0) - my) <= half
        );
        if (hit) this._showTooltip(hit, event);
        else this._hideTooltip();
      })
      .on('mouseleave.tooltip', () => this._hideTooltip());
  }

  _removeBrush() {
    if (this._brushG) { this._brushG.remove(); this._brushG = null; this._brushObj = null; }
  }

  _previewBrush(x0, x1) {
    this.blocks.attr('opacity', d => (d._tx >= x0 && d._tx <= x1) ? 1 : 0.25);
  }

  _applyBrush(x0, x1) {
    this._ensureScene2Layout();
    const sel = new Set(this.data.filter(d => d._tx >= x0 && d._tx <= x1).map(d => d.id));
    if (sel.size === 0) { this._clearFilter(); return; }
    this._highlightBlocks(sel);
    this._applyFilter(sel);
    const years = this.data.filter(d => sel.has(d.id)).map(d => d.year);
    const yr = `${Math.min(...years)}–${Math.max(...years)}`;
    this._showAnnotation([
      `${sel.size} publications selected (${yr})`,
      'Drag to change selection · click outside to clear',
    ], { y: this.H * 0.25 });
  }

  /* ── Lasso (scenes 5 & 6) ─────────────────────────────────────────── */

  _addLasso(onComplete, allowOnBlocks = false, startEvent = null) {
    if (this._lassoOn) return;
    this._lassoOn = true;
    const self = this;
    let pts = [], lpath = null, _touchOrigin = null;
    const DRAG_THRESHOLD = 8; // SVG-coordinate pixels before touch lasso path appears

    /* Extract SVG coordinates from either a mouse event or a Touch object */
    const _getPoint = (event) => {
      const src = event.touches && event.touches.length > 0
        ? event.touches[0]
        : event.changedTouches && event.changedTouches.length > 0
          ? event.changedTouches[0]
          : event;
      return d3.pointer(src, self.g.node());
    };

    const _startLasso = (event) => {
      pts = [_getPoint(event)];
      if (lpath) lpath.remove();
      lpath = self.g.append('path').attr('class', 'pv-lasso')
        .attr('fill', self._c('lassoBg')).attr('stroke', self._c('lassoStroke'))
        .attr('stroke-width', 1.5).attr('stroke-dasharray', '5,3')
        .attr('pointer-events', 'none')
        .attr('d', `M ${pts[0].map(v => v.toFixed(1)).join(',')} Z`);
    };

    const _endLasso = () => {
      if (!lpath) return;
      lpath.remove(); lpath = null;
      const poly = pts; pts = [];
      if (poly.length >= 3) {
        /* suppress the click/tap that fires right after release so it doesn't
           immediately override the lasso filter */
        self._lassoFired = true;
        setTimeout(() => { self._lassoFired = false; }, 100);
        onComplete(poly);
      }
    };

    /* if forwarded from a playing-click/tap, start the lasso immediately */
    if (startEvent) {
      _startLasso(startEvent);
      /* For touch forwarding: set _touchOrigin so touchmove events extend the path */
      if (startEvent.touches || startEvent.changedTouches) _touchOrigin = pts[0];
    }

    /* ── Mouse events ──────────────────────────────────────────────────── */
    /* Attach to svg so empty-space drags register (<g> has no fill). */
    this.svg.on('mousedown.lasso', function(event) {
      if (event.button !== 0) return;
      if (event.target.closest('.pv-node')) return;
      if (!allowOnBlocks && event.target.closest('path.pv-block')) return;
      event.preventDefault();
      _startLasso(event);
    });

    /* Use window so drag continues when cursor leaves the SVG */
    d3.select(window).on('mousemove.lasso', function(event) {
      if (!lpath) return;
      event.preventDefault();
      pts.push(d3.pointer(event, self.g.node()));
      lpath.attr('d', 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(',')).join('L') + 'Z');
    });

    d3.select(window).on('mouseup.lasso', function() {
      _endLasso();
    });

    /* ── Touch events ──────────────────────────────────────────────────── */
    /* Two fixes for mobile:
       1. touch-action:none on the SVG tells Chrome not to claim the gesture
          for scrolling before our handlers run (Safari works without it but
          Chrome requires it). { passive:false } is belt-and-suspenders so
          event.preventDefault() is honoured in all browsers.
       2. Drag threshold: lasso path is created only after the finger has moved
          ≥ DRAG_THRESHOLD px. A brief tap (no movement) is instead treated as
          a "touch-out" that clears the current filter selection. */
    this.svg.style('touch-action', 'none');

    this.svg.on('touchstart.lasso', function(event) {
      if (event.touches.length !== 1) return;
      if (event.target.closest('.pv-node')) return;
      if (!allowOnBlocks && event.target.closest('path.pv-block')) return;
      event.preventDefault();
      _touchOrigin = _getPoint(event);
      pts = [_touchOrigin]; // record start — lpath created only after drag threshold
    }, { passive: false });

    this.svg.on('touchmove.lasso', function(event) {
      if (!_touchOrigin) return;
      event.preventDefault();
      const pt = _getPoint(event);
      if (!lpath) {
        /* Only start drawing once the finger has actually dragged */
        const dx = pt[0] - _touchOrigin[0], dy = pt[1] - _touchOrigin[1];
        if (dx * dx + dy * dy < DRAG_THRESHOLD * DRAG_THRESHOLD) return;
        lpath = self.g.append('path').attr('class', 'pv-lasso')
          .attr('fill', self._c('lassoBg')).attr('stroke', self._c('lassoStroke'))
          .attr('stroke-width', 1.5).attr('stroke-dasharray', '5,3')
          .attr('pointer-events', 'none')
          .attr('d', `M ${pts[0].map(v => v.toFixed(1)).join(',')} Z`);
      }
      pts.push(pt);
      lpath.attr('d', 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(',')).join('L') + 'Z');
    }, { passive: false });

    this.svg.on('touchend.lasso touchcancel.lasso', function(event) {
      if (!_touchOrigin) return;
      _touchOrigin = null;
      if (lpath) {
        /* Finger dragged → complete the lasso selection */
        _endLasso();
      } else {
        /* Brief tap (no drag) → treat as touch-out: clear filter if on empty space */
        pts = [];
        const touch = event.changedTouches && event.changedTouches[0];
        if (touch && !touch.target.closest('path.pv-block, .pv-node, circle')) {
          if (!self._lassoFired) self._clearFilter();
        }
      }
    }, { passive: false });
  }

  _removeLasso() {
    if (!this._lassoOn) return;
    this._lassoOn = false;
    this.svg.style('touch-action', null);
    this.svg.on('mousedown.lasso', null);
    this.svg.on('touchstart.lasso', null).on('touchmove.lasso', null)
      .on('touchend.lasso', null).on('touchcancel.lasso', null);
    d3.select(window).on('mousemove.lasso', null).on('mouseup.lasso', null);
    this.g.selectAll('.pv-lasso').remove();
  }

  _pointInPolygon([x, y], polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi))
        inside = !inside;
    }
    return inside;
  }

  _handleUmapLasso(polygon) {
    this._ensureScene5Layout();
    const sel = new Set(this.data.filter(d =>
      this._pointInPolygon([this.xScaleU(d.x), this.yScaleU(d.y)], polygon)
    ).map(d => d.id));
    if (sel.size === 0) { this._clearFilter(); return; }
    this._highlightBlocks(sel);
    this._applyFilter(sel);
  }

  _handleNetLasso(polygon) {
    const selectedAuthors = new Set(
      this.netNodes.filter(n => this._pointInPolygon([n.px, n.py], polygon)).map(n => n.id)
    );
    if (selectedAuthors.size === 0) { this._clearFilter(); return; }

    /* highlight selected author nodes */
    this.netG.selectAll('g.pv-node').select('circle')
      .attr('stroke', d => selectedAuthors.has(d.id) ? this._c('selectOrange') : (d.isBC ? this._c('netBcStroke') : this._c('netNodeStroke')))
      .attr('stroke-width', d => selectedAuthors.has(d.id) ? 3 : (d.isBC ? 2 : 1));

    const sel = new Set(this.data.filter(p =>
      p.authors.split(';').map(a => a.trim()).some(a => selectedAuthors.has(a))
    ).map(d => d.id));
    this._highlightBlocks(sel);
    this._applyFilter(sel);
  }

  /* ══════════════════════════════════════════════════════════════════════
     SECTION: Highlight + filter
  ══════════════════════════════════════════════════════════════════════ */

  _highlightBlocks(selectedIds) {
    if (!selectedIds || selectedIds.size === 0) {
      this.blocks
        .attr('stroke', d => this._defaultStroke(d))
        .attr('stroke-width', 0.5).attr('opacity', 0.88);
      return;
    }
    this.blocks
      .attr('stroke', d => selectedIds.has(d.id) ? this._c('selectOrange') : this._defaultStroke(d))
      .attr('stroke-width', d => selectedIds.has(d.id) ? 2.5 : 0.5)
      .attr('opacity', d => selectedIds.has(d.id) ? 1 : 0.25);
  }

  _applyFilter(selectedIds) {
    this._filter = selectedIds;
    document.querySelectorAll('[data-pub-id]').forEach(el => {
      el.style.display = selectedIds.has(el.dataset.pubId) ? '' : 'none';
    });
    this._updateFilterBar(selectedIds.size);
  }

  _clearFilter() {
    this._filter = null;
    document.querySelectorAll('[data-pub-id]').forEach(el => { el.style.display = ''; });
    this._updateFilterBar(0);
    this._highlightBlocks(null);
    /* reset net node colours */
    this.netG.selectAll('g.pv-node').select('circle')
      .attr('stroke', d => d.isBC ? this._c('netBcStroke') : this._c('netNodeStroke'))
      .attr('stroke-width', d => d.isBC ? 2 : 1);
    this.annotG.selectAll('*').remove();
    this.annotG.style('opacity', 0);
    /* clear brush if present */
    if (this._brushG && this._brushObj) {
      this._brushG.call(this._brushObj.clear);
    }
    /* reset opacity */
    this.blocks.attr('opacity', 0.88);
  }

  _updateFilterBar(count) {
    if (!this.filterBarEl) return;
    if (count === 0) {
      this.filterBarEl.style.display = 'none';
      return;
    }
    this.filterBarEl.innerHTML = `
      Showing <strong>${count}</strong> of <strong>${this.data.length}</strong> publications
      &nbsp;
      <button onclick="window._pubVis && window._pubVis._clearFilter()"
        style="padding:2px 8px;border:1px solid ${this._c('selectOrange')};border-radius:4px;
               background:${this._c('btnBg')};cursor:pointer;font-size:11px;color:${this._c('selectOrange')};">
        ✕ Clear filter
      </button>`;
    this.filterBarEl.style.display = 'flex';
  }

  /* ══════════════════════════════════════════════════════════════════════
     SECTION: Controls
  ══════════════════════════════════════════════════════════════════════ */

  _handlePlayPause() {
    if (this.playState === 'playing') {
      /* PAUSE — freeze all active transitions in place via D3 interrupt */
      this.playState = 'paused';
      this._animGen++;                         // cancel pending _sched callbacks
      clearTimeout(this._timer); this._timer = null;
      this._interruptAll();
      this._updateUI();
      this._enableInteractionsForScene(this.currentScene);
    } else {
      /* PLAY / RESUME */
      this._removeInteractions();
      this.playState = 'playing';
      this._updateUI();
      if (this.currentScene === 0) {
        this._scene1();
      } else if (this._sceneReady) {
        /* scene animation already completed; advance to next */
        this._schedule(() => this._nextScene(), T.SCENE_PAUSE);
      } else if (this.currentScene === 6 && this._netAnimRunning) {
        /* resume mid-network: rebuild from exactly where we left off */
        this._runNetworkAnimation(this._netAnimStartIdx);
      } else {
        /* resume other scenes: D3 interpolates from current frozen visual state */
        this[`_scene${this.currentScene}`]();
      }
    }
  }

  _handleStop() {
    this._animGen++;                           // cancel pending _sched callbacks
    clearTimeout(this._timer); this._timer = null;
    this._netAnimRunning = false;
    this._interruptAll();
    this.playState = 'stopped';
    this._sceneReady = true;
    /* jump immediately to the complete final state of the current scene */
    if (this.currentScene > 0) this._applySceneSnap(this.currentScene);
    this._updateUI();
    this._enableInteractionsForScene(this.currentScene);
  }

  _updateUI() {
    /* play button label */
    const label = this.playState === 'playing' ? '⏸ Pause' : '▶ Play';
    if (this.btnPlay) this.btnPlay.text(label);

    /* scene label */
    const n = this.currentScene;
    const name = n >= 1 && n <= 6 ? PubVis.SCENE_NAMES[n - 1] : 'Intro';
    if (this.ctrlLabel) this.ctrlLabel.text(`Scene ${n || 1} · ${name}`);

    /* dot styles */
    if (this.dotBtns) {
      this.dotBtns.forEach((btn, i) => {
        this._styleDot(btn, i + 1 === (n || 1));
      });
    }
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════════════════════════════════ */
(function () {
  function boot() {
    const el = document.getElementById('pub-vis-container');
    if (!el || typeof d3 === 'undefined') return;
    const vis = new PubVis('#pub-vis-container');
    window._pubVis = vis; // expose for filter-bar "Clear" button
    vis.init();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
