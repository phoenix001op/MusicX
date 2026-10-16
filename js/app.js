/* MusicX
 * Music data: Audius API (full songs) and iTunes Search API (30s previews), no keys needed.
 * Guest data (playlists, likes) lives in localStorage on this browser only.
 */
(() => {
  'use strict';

  // ---------- tiny helpers ----------
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  function el(tag, attrs = {}, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') n.className = v;
      else if (k === 'html') n.innerHTML = v; // only used for our own static svg strings
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) n.setAttribute(k, v);
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      n.append(kid.nodeType ? kid : document.createTextNode(kid));
    }
    return n;
  }

  const uid = () => Math.random().toString(36).slice(2, 9);
  const fmt = s => {
    if (!isFinite(s)) s = 0;
    const m = Math.floor(s / 60);
    return m + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  };

  // ---------- icons ----------
  const ICONS = {
    play: 'M8 5v14l11-7z',
    pause: 'M6 19h4V5H6v14zm8-14v14h4V5h-4z',
    next: 'M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z',
    prev: 'M6 6h2v12H6zm3.5 6l8.5 6V6z',
    shuffle: 'M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z',
    repeat: 'M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z',
    heart: 'M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z',
    heartfill: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    addlist: 'M14 10H3v2h11v-2zm0-4H3v2h11V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM3 16h7v-2H3v2z',
    home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    search: 'M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    library: 'M4 6h2v12H4zm4 0h2v12H8zm4.5.5l4.5 11.5 1.9-.7L14.4 5.8z',
    volume: 'M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z',
    trash: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
    close: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
    plus: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
    left: 'M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z',
    right: 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
    edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z'
  };
  const icon = (name, size = 24) =>
    `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><path d="${ICONS[name]}"/></svg>`;

  function paintIcons(root = document) {
    $$('[data-icon]', root).forEach(n => {
      n.innerHTML = icon(n.dataset.icon, n.closest('.row-actions') ? 20 : 24);
      n.style.display = 'inline-flex';
    });
  }

  // ---------- saved data (guest account) ----------
  const STORE_KEY = 'musicx:v1';
  function loadState() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY));
      return { user: null, playlists: [], liked: [], ...(s || {}) };
    } catch {
      return { user: null, playlists: [], liked: [] };
    }
  }
  let state = loadState();
  const save = () => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
    catch { toast('Could not save, browser storage is full or blocked'); }
  };
  const userName = () => (state.user && state.user.name) || 'Guest';

  // ---------- music api ----------
  const cache = new Map();

  function normalize(results) {
    const seen = new Set();
    const out = [];
    for (const r of results || []) {
      if (!r.previewUrl || !r.trackId) continue;
      const key = (r.trackName + '|' + r.artistName).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        id: String(r.trackId),
        title: r.trackName,
        artist: r.artistName,
        album: r.collectionName || '',
        art: (r.artworkUrl100 || '').replace('100x100bb', '400x400bb'),
        preview: r.previewUrl,
        duration: 30
      });
    }
    return out;
  }

  function fetchItunes(term, limit = 20) {
    const key = 'i|' + term + '|' + limit;
    if (cache.has(key)) return cache.get(key);
    const params = new URLSearchParams({
      term, media: 'music', entity: 'song', limit: String(limit), country: 'IN'
    });
    const p = fetch('https://itunes.apple.com/search?' + params)
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(d => normalize(d.results));
    cache.set(key, p);
    p.catch(() => cache.delete(key));
    return p;
  }

  // Full songs: Audius (free, no key). Mostly independent artists, full length.
  let hostP = null;
  function getHost() {
    if (!hostP) {
      hostP = fetch('https://api.audius.co').then(r => r.json()).then(d => {
        const l = d.data || [];
        if (!l.length) throw new Error('no host');
        return l[Math.floor(Math.random() * l.length)];
      });
      hostP.catch(() => { hostP = null; });
    }
    return hostP;
  }

  function fetchAudius(term, limit = 20) {
    const key = 'a|' + term + '|' + limit;
    if (cache.has(key)) return cache.get(key);
    const p = getHost()
      .then(h => fetch(h + '/v1/tracks/search?' + new URLSearchParams({ query: term, limit: String(limit), app_name: 'MusicX' })))
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(d => (d.data || [])
        .filter(t => t.is_streamable !== false && t.duration > 30)
        .map(t => ({
          id: t.id,
          title: t.title,
          artist: (t.user && t.user.name) || 'Unknown',
          album: t.genre || '',
          art: (t.artwork && (t.artwork['480x480'] || t.artwork['150x150'])) || '',
          audius: true,
          duration: t.duration
        })));
    cache.set(key, p);
    p.catch(() => { cache.delete(key); hostP = null; });
    return p;
  }

  // Always use Audius for full-length, streamable tracks. Preview-only catalogs
  // such as iTunes must not silently become the active source after a reload.
  const source = 'full';
  const fetchTracks = (term, limit = 20) => fetchAudius(term, limit);

  // ---------- home content ----------
  const SHELVES = [
    { title: 'Bollywood hits', q: 'bollywood hits' },
    { title: 'Hollywood chart toppers', q: 'top english pop hits' },
    { title: 'Arijit Singh', q: 'arijit singh' },
    { title: 'Punjabi vibes', q: 'punjabi songs' },
    { title: 'Taylor Swift', q: 'taylor swift' },
    { title: 'Old is gold', q: 'kishore kumar lata mangeshkar' },
    { title: 'Rock classics', q: 'classic rock hits' }
  ];

  const CHIPS = {
    Bollywood: [
      { title: 'Latest Bollywood', q: 'new bollywood songs' },
      { title: 'Arijit Singh', q: 'arijit singh' },
      { title: 'Shreya Ghoshal', q: 'shreya ghoshal' },
      { title: 'A. R. Rahman', q: 'a r rahman' },
      { title: 'Retro Bollywood', q: 'kishore kumar' }
    ],
    Hollywood: [
      { title: 'Pop hits', q: 'top pop songs' },
      { title: 'Ed Sheeran', q: 'ed sheeran' },
      { title: 'The Weeknd', q: 'the weeknd' },
      { title: 'Billie Eilish', q: 'billie eilish' },
      { title: 'Eminem', q: 'eminem' }
    ],
    Punjabi: [
      { title: 'Punjabi hits', q: 'punjabi hits' },
      { title: 'Diljit Dosanjh', q: 'diljit dosanjh' },
      { title: 'Sidhu Moose Wala', q: 'sidhu moose wala' },
      { title: 'AP Dhillon', q: 'ap dhillon' }
    ],
    Romantic: [
      { title: 'Hindi love songs', q: 'hindi romantic songs' },
      { title: 'English love songs', q: 'english love songs' },
      { title: 'Atif Aslam', q: 'atif aslam' },
      { title: 'Jubin Nautiyal', q: 'jubin nautiyal' }
    ],
    Party: [
      { title: 'Bollywood party', q: 'bollywood party songs' },
      { title: 'Dance floor', q: 'dance hits' },
      { title: 'Badshah', q: 'badshah' },
      { title: 'Honey Singh', q: 'yo yo honey singh' }
    ],
    Workout: [
      { title: 'Gym energy', q: 'workout motivation songs' },
      { title: 'Hip hop', q: 'hip hop hits' },
      { title: 'Rock power', q: 'rock workout' }
    ],
    Chill: [
      { title: 'Chill Hindi', q: 'hindi lofi chill' },
      { title: 'Acoustic', q: 'acoustic chill songs' },
      { title: 'Late night', q: 'late night songs' }
    ],
    'Old Hindi': [
      { title: 'Kishore Kumar', q: 'kishore kumar' },
      { title: 'Lata Mangeshkar', q: 'lata mangeshkar' },
      { title: 'Mohammed Rafi', q: 'mohammed rafi' },
      { title: 'R. D. Burman', q: 'r d burman' }
    ]
  };

  // ---------- toast & modal ----------
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  const dlg = $('#dlg');
  function modal(title, body) {
    dlg.replaceChildren(
      el('div', { class: 'dlg-head' },
        el('h2', {}, title),
        el('button', { class: 'icon-btn', 'aria-label': 'Close', onclick: () => dlg.close(), html: icon('close') })),
      el('div', { class: 'dlg-body' }, body)
    );
    if (!dlg.open) dlg.showModal();
  }
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

  function askText(title, label, initial, okText, onOk) {
    const input = el('input', { class: 'field', type: 'text', maxlength: '40', value: initial || '', placeholder: label });
    const submit = () => {
      const v = input.value.trim();
      if (!v) { input.focus(); return; }
      dlg.close();
      onOk(v);
    };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    modal(title, [
      input,
      el('div', { class: 'dlg-actions' },
        el('button', { class: 'btn ghost', onclick: () => dlg.close() }, 'Cancel'),
        el('button', { class: 'btn', onclick: submit }, okText))
    ]);
    setTimeout(() => { input.focus(); input.select(); }, 30);
  }

  // ---------- playlists / likes ----------
  const isLiked = id => state.liked.some(t => t.id === id);

  function toggleLike(track) {
    if (isLiked(track.id)) {
      state.liked = state.liked.filter(t => t.id !== track.id);
      toast('Removed from liked songs');
    } else {
      state.liked.unshift(track);
      toast('Added to liked songs');
    }
    save();
    refreshLikeButtons();
    if (currentRoute().page === 'liked') route();
  }

  function refreshLikeButtons() {
    $$('[data-like]').forEach(b => {
      const on = isLiked(b.dataset.like);
      b.classList.toggle('liked', on);
      b.innerHTML = icon(on ? 'heartfill' : 'heart', b.closest('.row-actions') ? 20 : 24);
    });
  }

  function createPlaylist(name, firstTrack) {
    const pl = { id: uid(), name, tracks: firstTrack ? [firstTrack] : [] };
    state.playlists.push(pl);
    save();
    renderSidePlaylists();
    return pl;
  }

  function addToPlaylist(pl, track) {
    if (pl.tracks.some(t => t.id === track.id)) {
      toast('Already in ' + pl.name);
      return;
    }
    pl.tracks.push(track);
    save();
    toast('Added to ' + pl.name);
    renderSidePlaylists();
  }

  function pickPlaylist(track) {
    const body = [];
    if (state.playlists.length) {
      body.push(el('div', { class: 'pick-list' }, state.playlists.map(pl =>
        el('button', { onclick: () => { addToPlaylist(pl, track); dlg.close(); } },
          el('span', { class: 'pl-mini' }, pl.tracks[0] ? el('img', { src: pl.tracks[0].art, alt: '' }) : '♪'),
          el('span', {}, pl.name, el('small', {}, pl.tracks.length + (pl.tracks.length === 1 ? ' song' : ' songs')))
        ))));
    } else {
      body.push(el('p', {}, 'You have no playlists yet. Make your first one.'));
    }
    body.push(el('div', { class: 'dlg-actions' },
      el('button', {
        class: 'btn',
        onclick: () => askText('New playlist', 'Playlist name', '', 'Create', name => {
          createPlaylist(name, track);
          toast('Created ' + name);
        })
      }, 'New playlist')));
    modal('Add to playlist', body);
  }

  function newPlaylistDialog() {
    askText('New playlist', 'Playlist name', '', 'Create', name => {
      const pl = createPlaylist(name);
      location.hash = '#/playlist/' + pl.id;
    });
  }

  function renderSidePlaylists() {
    const box = $('#sidePlaylists');
    box.replaceChildren(...state.playlists.map(pl =>
      el('a', { class: 'side-link', href: '#/playlist/' + pl.id, 'data-pl': pl.id },
        el('span', { html: icon('library', 20) }),
        el('span', { class: 'name' }, pl.name))));
    markActive();
  }

  // ---------- player ----------
  const audio = $('#audio');
  const player = $('#player');
  const P = { queue: [], idx: -1, shuffle: false, repeat: 0 }; // repeat: 0 off, 1 all, 2 one
  const cur = () => P.queue[P.idx];

  function playQueue(list, i) {
    P.queue = list.slice();
    P.idx = i;
    loadCurrent(true);
  }

  async function srcFor(t) {
    if (!t.audius) return t.preview;
    const h = await getHost();
    return h + '/v1/tracks/' + t.id + '/stream?app_name=MusicX';
  }

  function loadCurrent(autoplay) {
    const t = cur();
    if (!t) return;
    player.hidden = false;
    $('#pArt').src = t.art;
    $('#pTitle').textContent = t.title;
    $('#pArtist').textContent = t.artist;
    document.title = t.title + ' - MusicX';
    updateLikeBtn();
    srcFor(t).then(src => {
      if (cur() !== t) return;
      audio.src = src;
      if (autoplay) audio.play().catch(() => toast('Tap play to start the song'));
    }).catch(() => toast('Could not load this song'));
    markPlaying();
    setMediaSession(t);
  }

  function updateLikeBtn() {
    const t = cur();
    const b = $('#pLike');
    if (!t) return;
    b.dataset.like = t.id;
    b.classList.toggle('liked', isLiked(t.id));
    b.innerHTML = icon(isLiked(t.id) ? 'heartfill' : 'heart');
  }

  function setPlayIcon() {
    $('#playBtn').innerHTML = icon(audio.paused ? 'play' : 'pause', 28);
    $('#playBtn').setAttribute('aria-label', audio.paused ? 'Play' : 'Pause');
    markPlaying();
  }

  function togglePlay() {
    if (!cur()) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }

  function next(auto) {
    if (!P.queue.length) return;
    if (P.repeat === 2 && auto) { audio.currentTime = 0; audio.play(); return; }
    if (P.shuffle && P.queue.length > 1) {
      let n;
      do { n = Math.floor(Math.random() * P.queue.length); } while (n === P.idx);
      P.idx = n;
    } else if (P.idx < P.queue.length - 1) {
      P.idx++;
    } else if (P.repeat === 1 || !auto) {
      P.idx = 0;
    } else {
      audio.pause();
      audio.currentTime = 0;
      return;
    }
    loadCurrent(true);
  }

  function prev() {
    if (!P.queue.length) return;
    if (audio.currentTime > 3) { audio.currentTime = 0; return; }
    P.idx = P.idx > 0 ? P.idx - 1 : P.queue.length - 1;
    loadCurrent(true);
  }

  function markPlaying() {
    const t = cur();
    $$('[data-track]').forEach(n => {
      const on = !!t && n.dataset.track === t.id;
      n.classList.toggle('playing', on);
      const ov = $('.overlay, .card-play', n);
      if (ov) ov.innerHTML = icon(on && !audio.paused ? 'pause' : 'play', n.classList.contains('card') ? 22 : 24);
    });
  }

  function setMediaSession(t) {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: t.title, artist: t.artist, album: t.album,
        artwork: t.art ? [{ src: t.art, sizes: '400x400', type: 'image/jpeg' }] : []
      });
      navigator.mediaSession.setActionHandler('play', togglePlay);
      navigator.mediaSession.setActionHandler('pause', togglePlay);
      navigator.mediaSession.setActionHandler('previoustrack', prev);
      navigator.mediaSession.setActionHandler('nexttrack', () => next(false));
    } catch { /* not supported, ignore */ }
  }

  const seek = $('#seek');
  let seeking = false;
  function paintSeek(pct) {
    seek.style.setProperty('--pct', pct + '%');
  }

  audio.addEventListener('timeupdate', () => {
    const d = audio.duration || 30;
    if (!seeking) {
      seek.value = Math.round((audio.currentTime / d) * 1000);
      paintSeek((audio.currentTime / d) * 100);
    }
    $('#timeLabel').textContent = fmt(audio.currentTime) + ' / ' + fmt(d);
  });
  audio.addEventListener('play', setPlayIcon);
  audio.addEventListener('pause', setPlayIcon);
  audio.addEventListener('ended', () => next(true));
  audio.addEventListener('error', () => {
    if (!audio.src) return;
    toast('This song could not be played, skipping');
    setTimeout(() => next(true), 800);
  });

  seek.addEventListener('input', () => {
    seeking = true;
    paintSeek(seek.value / 10);
  });
  seek.addEventListener('change', () => {
    const d = audio.duration || 30;
    audio.currentTime = (seek.value / 1000) * d;
    seeking = false;
  });

  $('#playBtn').addEventListener('click', togglePlay);
  $('#nextBtn').addEventListener('click', () => next(false));
  $('#prevBtn').addEventListener('click', prev);
  $('#pLike').addEventListener('click', () => cur() && toggleLike(cur()));
  $('#pAdd').addEventListener('click', () => cur() && pickPlaylist(cur()));

  $('#shuffleBtn').addEventListener('click', e => {
    P.shuffle = !P.shuffle;
    e.currentTarget.classList.toggle('on', P.shuffle);
    toast('Shuffle ' + (P.shuffle ? 'on' : 'off'));
  });
  $('#repeatBtn').addEventListener('click', e => {
    P.repeat = (P.repeat + 1) % 3;
    e.currentTarget.classList.toggle('on', P.repeat > 0);
    toast(['Repeat off', 'Repeat all', 'Repeat one'][P.repeat]);
  });

  const vol = $('#volume');
  try {
    const v = localStorage.getItem('musicx:vol');
    if (v !== null) vol.value = v;
  } catch { /* ignore */ }
  audio.volume = vol.value / 100;
  vol.addEventListener('input', () => {
    audio.volume = vol.value / 100;
    try { localStorage.setItem('musicx:vol', vol.value); } catch { /* ignore */ }
  });

  document.addEventListener('keydown', e => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || dlg.open) return;
    if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
    else if (e.key === 'ArrowRight' && e.shiftKey) next(false);
    else if (e.key === 'ArrowLeft' && e.shiftKey) prev();
  });

  // ---------- ui pieces ----------
  function artImg(t) {
    return t.art
      ? el('img', { src: t.art, alt: '', loading: 'lazy' })
      : el('div', { class: 'cover-ph' }, '♪');
  }

  function trackCard(t, list, i) {
    const card = el('div', { class: 'card', 'data-track': t.id, tabindex: '0', role: 'button', 'aria-label': 'Play ' + t.title },
      el('div', { class: 'card-art' }, artImg(t), el('span', { class: 'card-play', html: icon('play', 22) })),
      el('div', { class: 'card-title', title: t.title }, t.title),
      el('div', { class: 'card-sub' }, t.artist));
    const go = () => playQueue(list, i);
    card.addEventListener('click', go);
    card.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    return card;
  }

  function trackRow(t, list, i, opts = {}) {
    const likeBtn = el('button', { class: 'icon-btn small', 'data-like': t.id, 'aria-label': 'Like', onclick: e => { e.stopPropagation(); toggleLike(t); } });
    likeBtn.innerHTML = icon(isLiked(t.id) ? 'heartfill' : 'heart', 20);
    likeBtn.classList.toggle('liked', isLiked(t.id));

    const actions = el('div', { class: 'row-actions' },
      likeBtn,
      el('button', { class: 'icon-btn small', 'aria-label': 'Add to playlist', title: 'Add to playlist', html: icon('addlist', 20), onclick: e => { e.stopPropagation(); pickPlaylist(t); } }),
      opts.onRemove && el('button', { class: 'icon-btn small', 'aria-label': 'Remove', title: 'Remove from this playlist', html: icon('trash', 20), onclick: e => { e.stopPropagation(); opts.onRemove(t); } }),
      el('span', { class: 'dur' }, fmt(t.duration)));

    const row = el('div', { class: 'row', 'data-track': t.id },
      el('div', { class: 'row-art' }, artImg(t), el('div', { class: 'overlay', html: icon('play', 24) })),
      el('div', { class: 'row-main' },
        el('div', { class: 'row-title', title: t.title }, t.title),
        el('div', { class: 'row-artist' }, t.artist)),
      el('div', { class: 'row-album' }, t.album),
      actions);
    row.addEventListener('click', () => playQueue(list, i));
    return row;
  }

  function shelf(title) {
    const scroller = el('div', { class: 'track-row-scroll' });
    for (let i = 0; i < 7; i++) {
      scroller.append(el('div', { class: 'card skeleton' },
        el('div', { class: 'card-art' }), el('div', { class: 'skel-line' }), el('div', { class: 'skel-line short' })));
    }
    const scrollBy = dir => scroller.scrollBy({ left: dir * scroller.clientWidth * 0.8, behavior: 'smooth' });
    const node = el('section', { class: 'shelf' },
      el('div', { class: 'shelf-head' },
        el('h2', { class: 'shelf-title' }, title),
        el('div', { class: 'shelf-nav' },
          el('button', { 'aria-label': 'Scroll left', html: icon('left'), onclick: () => scrollBy(-1) }),
          el('button', { 'aria-label': 'Scroll right', html: icon('right'), onclick: () => scrollBy(1) }))),
      scroller);
    return {
      node,
      fill(tracks) {
        if (!tracks.length) { node.remove(); return; }
        scroller.replaceChildren(...tracks.map((t, i) => trackCard(t, tracks, i)));
        markPlaying();
      },
      fail() {
        scroller.replaceChildren(el('div', { class: 'empty' }, 'Could not load this section. Check your internet and try again.'));
      }
    };
  }

  // ---------- views ----------
  const view = $('#view');
  let homeChip = 'All';
  let token = 0;

  function viewHome() {
    view.replaceChildren();
    const h = new Date().getHours();
    const hello = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

    const chipBar = el('div', { class: 'chips' }, ['All', ...Object.keys(CHIPS)].map(name =>
      el('button', {
        class: 'chip' + (name === homeChip ? ' active' : ''),
        onclick: () => { homeChip = name; viewHome(); }
      }, name)));

    const shelves = el('div');
    view.append(
      el('div', { class: 'greeting' }, hello + ', ' + userName()),
      el('h1', { class: 'page-title' }, 'Listen now'),
      chipBar, shelves);

    const defs = homeChip === 'All' ? SHELVES : CHIPS[homeChip];
    defs.forEach(def => {
      const s = shelf(def.title);
      shelves.append(s.node);
      fetchTracks(def.q).then(s.fill).catch(s.fail);
    });
  }

  function viewSearch(q) {
    view.replaceChildren();
    const input = $('#searchInput');
    if (input.value !== q) input.value = q;

    if (!q) {
      view.append(el('h1', { class: 'page-title' }, 'Search'));
      const ideas = ['Arijit Singh', 'Taylor Swift', 'Kesariya', 'Shape of You', 'Diljit', 'Weeknd', 'Lata Mangeshkar', 'Imagine Dragons', 'Atif Aslam', 'Eminem', 'Badshah', 'Ed Sheeran'];
      view.append(
        el('p', { class: 'greeting', style: 'margin-bottom:12px' }, 'Try one of these'),
        el('div', { class: 'chips', style: 'flex-wrap:wrap' }, ideas.map(s =>
          el('button', { class: 'chip', onclick: () => { location.hash = '#/search/' + encodeURIComponent(s); } }, s))));
      return;
    }

    view.append(el('h1', { class: 'page-title' }, 'Results for "' + q + '"'));
    const holder = el('div', { class: 'list' }, el('div', { class: 'empty' }, 'Searching...'));
    view.append(holder);
    const my = ++token;
    fetchTracks(q, 40).then(tracks => {
      if (my !== token) return;
      if (!tracks.length) {
        holder.replaceChildren(el('div', { class: 'empty' }, el('h3', {}, 'Nothing found'), 'Try a different spelling or another artist.'));
        return;
      }
      holder.replaceChildren(...tracks.map((t, i) => trackRow(t, tracks, i)));
      markPlaying();
    }).catch(() => {
      if (my !== token) return;
      holder.replaceChildren(el('div', { class: 'empty' }, el('h3', {}, 'Could not reach the music service'), 'Check your internet and search again.'));
    });
  }

  function playlistCover(tracks) {
    return tracks[0] && tracks[0].art ? el('img', { src: tracks[0].art, alt: '' }) : '♪';
  }

  function viewLibrary() {
    view.replaceChildren(el('h1', { class: 'page-title' }, 'Library'));

    const grid = el('div', { class: 'grid' });

    const newCard = el('div', { class: 'card new', tabindex: '0', role: 'button' },
      el('div', { class: 'card-art', html: icon('plus', 40) }),
      el('div', { class: 'card-title' }, 'New playlist'));
    newCard.addEventListener('click', newPlaylistDialog);
    newCard.addEventListener('keydown', e => { if (e.key === 'Enter') newPlaylistDialog(); });
    grid.append(newCard);

    const likedCard = el('a', { class: 'card', href: '#/liked' },
      el('div', { class: 'card-art' }, el('div', { class: 'cover-ph', style: 'color:var(--accent)', html: icon('heartfill', 44) })),
      el('div', { class: 'card-title' }, 'Liked songs'),
      el('div', { class: 'card-sub' }, state.liked.length + ' songs'));
    grid.append(likedCard);

    state.playlists.forEach(pl => {
      grid.append(el('a', { class: 'card', href: '#/playlist/' + pl.id },
        el('div', { class: 'card-art' }, el('div', { class: 'cover-ph' }, playlistCover(pl.tracks))),
        el('div', { class: 'card-title' }, pl.name),
        el('div', { class: 'card-sub' }, pl.tracks.length + (pl.tracks.length === 1 ? ' song' : ' songs'))));
    });

    view.append(grid);
    if (!state.playlists.length) {
      view.append(el('p', { class: 'greeting', style: 'margin-top:22px' },
        'Tip: press the add button next to any song to put it in a playlist. Your playlists stay in this browser.'));
    }
  }

  function trackListView(tracks, onRemove) {
    const list = el('div', { class: 'list' });
    tracks.forEach((t, i) => list.append(trackRow(t, tracks, i, { onRemove })));
    return list;
  }

  function playlistHeader({ title, tracks, cover, extraButtons }) {
    return el('div', { class: 'pl-head' },
      el('div', { class: 'pl-cover' }, cover || playlistCover(tracks)),
      el('div', { class: 'pl-info' },
        el('h1', {}, title),
        el('p', {}, userName() + ' · ' + tracks.length + (tracks.length === 1 ? ' song' : ' songs')),
        el('div', { class: 'pl-btns' },
          el('button', {
            class: 'btn',
            onclick: () => tracks.length ? playQueue(tracks, 0) : toast('Add some songs first'),
            html: icon('play', 20) + '<span>Play</span>'
          }),
          el('button', {
            class: 'btn ghost',
            onclick: () => {
              if (!tracks.length) return toast('Add some songs first');
              P.shuffle = true;
              $('#shuffleBtn').classList.add('on');
              playQueue(tracks, Math.floor(Math.random() * tracks.length));
            },
            html: icon('shuffle', 20) + '<span>Shuffle</span>'
          }),
          extraButtons)));
  }

  function viewLiked() {
    view.replaceChildren(playlistHeader({
      title: 'Liked songs',
      tracks: state.liked,
      cover: el('span', { style: 'color:var(--accent)', html: icon('heartfill', 70) })
    }));
    if (!state.liked.length) {
      view.append(el('div', { class: 'empty' }, el('h3', {}, 'No liked songs yet'), 'Tap the heart on any song and it shows up here.'));
      return;
    }
    view.append(trackListView(state.liked));
    markPlaying();
  }

  function viewPlaylist(id) {
    const pl = state.playlists.find(p => p.id === id);
    if (!pl) {
      view.replaceChildren(el('div', { class: 'empty' }, el('h3', {}, 'Playlist not found'), el('a', { href: '#/library', class: 'btn', style: 'margin-top:14px' }, 'Back to library')));
      return;
    }

    const extra = [
      el('button', {
        class: 'btn ghost', 'aria-label': 'Rename playlist',
        html: icon('edit', 18) + '<span>Rename</span>',
        onclick: () => askText('Rename playlist', 'Playlist name', pl.name, 'Save', name => {
          pl.name = name; save(); renderSidePlaylists(); route();
        })
      }),
      el('button', {
        class: 'btn ghost danger', 'aria-label': 'Delete playlist',
        html: icon('trash', 18) + '<span>Delete</span>',
        onclick: () => {
          modal('Delete playlist?', [
            el('p', {}, '"' + pl.name + '" will be removed from this browser.'),
            el('div', { class: 'dlg-actions' },
              el('button', { class: 'btn ghost', onclick: () => dlg.close() }, 'Keep it'),
              el('button', {
                class: 'btn', onclick: () => {
                  state.playlists = state.playlists.filter(p => p.id !== pl.id);
                  save(); dlg.close(); renderSidePlaylists();
                  location.hash = '#/library';
                  toast('Playlist deleted');
                }
              }, 'Delete'))
          ]);
        }
      })
    ];

    view.replaceChildren(playlistHeader({ title: pl.name, tracks: pl.tracks, extraButtons: extra }));

    if (!pl.tracks.length) {
      view.append(el('div', { class: 'empty' },
        el('h3', {}, 'This playlist is empty'),
        'Search for songs and use the add button to put them here.',
        el('div', { style: 'margin-top:16px' }, el('a', { href: '#/search', class: 'btn' }, 'Find songs'))));
      return;
    }
    view.append(trackListView(pl.tracks, t => {
      pl.tracks = pl.tracks.filter(x => x.id !== t.id);
      save(); renderSidePlaylists(); route();
      toast('Removed from ' + pl.name);
    }));
    markPlaying();
  }

  // ---------- router ----------
  function currentRoute() {
    const parts = (location.hash.slice(1) || '/home').split('/');
    return { page: parts[1] || 'home', arg: decodeURIComponent(parts.slice(2).join('/') || '') };
  }

  function markActive() {
    const { page, arg } = currentRoute();
    $$('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === page || (page === 'playlist' && a.dataset.nav === 'library') || (page === 'liked' && a.dataset.nav === 'library')));
    $$('.side-link').forEach(a => {
      const isLikedLink = a.getAttribute('href') === '#/liked' && page === 'liked';
      const isPl = a.dataset.pl && page === 'playlist' && a.dataset.pl === arg;
      a.classList.toggle('active', !!(isLikedLink || isPl));
    });
  }

  function route() {
    const { page, arg } = currentRoute();
    switch (page) {
      case 'search': viewSearch(arg); break;
      case 'library': viewLibrary(); break;
      case 'liked': viewLiked(); break;
      case 'playlist': viewPlaylist(arg); break;
      default: viewHome();
    }
    markActive();
    markPlaying();
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', route);

  // ---------- search box ----------
  const searchInput = $('#searchInput');
  let searchTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const q = searchInput.value.trim();
    searchTimer = setTimeout(() => {
      if (q.length >= 2) location.hash = '#/search/' + encodeURIComponent(q);
      else if (!q && currentRoute().page === 'search') location.hash = '#/search';
    }, 450);
  });
  $('#searchForm').addEventListener('submit', e => {
    e.preventDefault();
    clearTimeout(searchTimer);
    const q = searchInput.value.trim();
    if (q) location.hash = '#/search/' + encodeURIComponent(q);
  });

  // ---------- account (guest) ----------
  function updateAvatar() {
    $('#avatarLetter').textContent = userName().charAt(0).toUpperCase();
  }

  function welcomeDialog() {
    const input = el('input', { class: 'field', type: 'text', maxlength: '24', placeholder: 'Your name (optional)' });
    const go = () => {
      state.user = { name: input.value.trim() || 'Guest', guest: true };
      save(); updateAvatar(); dlg.close();
      if (currentRoute().page === 'home') viewHome();
    };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    modal('Welcome to MusicX', [
      el('p', {}, 'Play Bollywood, Hollywood and everything in between. No sign up needed, continue as a guest and your playlists will be saved on this device.'),
      input,
      el('div', { class: 'dlg-actions' }, el('button', { class: 'btn', onclick: go }, 'Continue as guest'))
    ]);
  }

  function accountDialog() {
    const input = el('input', { class: 'field', type: 'text', maxlength: '24', value: userName() === 'Guest' ? '' : userName(), placeholder: 'Your name' });
    modal('Your account', [
      el('p', {}, 'You are using MusicX as a guest. ' + state.playlists.length + ' playlists and ' + state.liked.length + ' liked songs are saved in this browser.'),
      input,
      el('div', { class: 'dlg-actions' },
        el('button', {
          class: 'btn ghost danger',
          onclick: () => {
            if (!confirm('This deletes all your playlists and liked songs from this browser. Continue?')) return;
            state = { user: state.user, playlists: [], liked: [] };
            save(); renderSidePlaylists(); dlg.close(); route();
            toast('All data cleared');
          }
        }, 'Clear my data'),
        el('button', {
          class: 'btn',
          onclick: () => {
            state.user = { name: input.value.trim() || 'Guest', guest: true };
            save(); updateAvatar(); dlg.close(); route();
          }
        }, 'Save'))
    ]);
  }

  $('#userBtn').addEventListener('click', accountDialog);
  $('#newPlaylistSide').addEventListener('click', newPlaylistDialog);

  const srcBtn = $('#srcBtn');
  const paintSrc = () => {
    srcBtn.textContent = 'Full-length tracks';
    srcBtn.title = 'MusicX uses Audius for full-length tracks. Popular commercial songs may not be available.';
    srcBtn.setAttribute('aria-label', srcBtn.title);
  };
  srcBtn.addEventListener('click', () => {
    toast('Full-length tracks use Audius. Commercial hits may only be available as previews on other services.');
  });

  // ---------- start ----------
  paintSrc();
  paintIcons();
  setPlayIcon();
  updateAvatar();
  renderSidePlaylists();
  route();
  if (!state.user) welcomeDialog();
})();
