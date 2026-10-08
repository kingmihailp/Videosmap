// ---------------------------------------------------------------- multiplayer client: WebSocket link, shared cabinet mirror, remote players
const Net = (() => {
  const N = { on: false, ws: null, id: 0, idx: 0, name: '', url: '', list: [], loc: null, host: false, remote: {}, seeds: {}, hooks: {}, status: '', chat: [] };
  let joinWait = null, joinRej = null, connWait = null, lastErr = '';
  const EUL = new THREE.Euler();
  N.defaultUrl = () => (location.protocol === 'http:' || location.protocol === 'https:') ? location.host : 'localhost:3000';
  N.send = (t, o) => { if (N.ws && N.ws.readyState === 1) N.ws.send(JSON.stringify(Object.assign({ t }, o))); };
  N.sendOp = op => N.send('op', { op });
  N.count = () => N.list.length;
  N.names = loc => N.list.filter(p => (loc === undefined || p.loc === loc)).map(p => p.name);

  N.connect = (addr, name) => new Promise((res, rej) => {
    if (N.ws) try { N.ws.close(); } catch (e) {}
    let url = addr.trim(); if (!/^wss?:\/\//.test(url)) url = (location.protocol === 'https:' ? 'wss://' : 'ws://') + url;
    N.status = 'Подключение…'; let done = false, ws;
    try { ws = new WebSocket(url); } catch (e) { rej(new Error('Неверный адрес')); return; }
    N.ws = ws; N.url = addr.trim(); connWait = { res, rej };
    const to = setTimeout(() => { if (!done) { done = true; try { ws.close(); } catch (e) {} rej(new Error('Сервер не отвечает')); } }, 15000);
    ws.onopen = () => ws.send(JSON.stringify({ t: 'hello', name }));
    ws.onmessage = ev => { let m; try { m = JSON.parse(ev.data); } catch (e) { return; } if (m.t === 'welcome') { done = true; clearTimeout(to); } handle(m); };
    ws.onerror = () => { lastErr = 'Не удалось подключиться'; };
    ws.onclose = () => { clearTimeout(to); if (!done) { done = true; rej(new Error(lastErr || 'Соединение закрыто')); } if (ws === N.ws) { const was = N.on; N.on = false; N.ws = null; N.remote = {}; N.list = []; N.loc = null; N.host = false; Save.leaveMP(!N.bye); N.bye = false; N.status = ''; if (was && N.hooks.closed) N.hooks.closed(); } };
  });
  N.disconnect = () => { if (N.ws) { N.bye = true; try { N.ws.close(); } catch (e) {} } };
  // join a location ('cabinet' or a biome id); resolves with the server's answer (seed, host, butterfly snapshot, modifier)
  N.join = loc => new Promise((res, rej) => { N.remote = {}; N.loc = loc; if (!N.on) { rej(new Error('offline')); return; } joinWait = res; joinRej = rej; N.send('join', { loc, maps: Maps.owned() }); setTimeout(() => { if (joinWait === res) { joinWait = null; rej(new Error('timeout')); } }, 15000); });
  const sys = text => { N.chat.push({ name: 'Голосование', text, at: performance.now(), sys: true }); if (N.chat.length > 8) N.chat.shift(); };
  N.voteReply = ok => { const v = N.vote; if (!v || v.mine) return false; v.mine = ok ? 'yes' : 'no'; if (ok) v.yes++; N.send('voteReply', { vid: v.vid, ok: !!ok }); return true; };
  N.say = text => { if (N.on && text) N.send('chat', { text }); };
  N.leave = () => { N.vote = null; N.loc = null; N.host = false; N.remote = {}; if (N.on) N.send('join', { loc: null }); };

  function handle(m) {
    switch (m.t) {
      case 'welcome': N.on = true; N.id = m.id; N.idx = m.idx; N.name = m.name; N.seeds = m.seeds; N.list = m.players; Save.enterMP(m.cab, m.idx); N.status = 'Онлайн'; if (connWait) { connWait.res(m); connWait = null; } break;
      case 'plist': N.list = m.list; break;
      case 'joined': N.vote = null; N.host = m.host === N.id; for (const p of m.players) N.remote[p.id] = mkRemote(p.id, p.name); if (joinWait) { const r = joinWait; joinWait = null; r(m); } break;
      case 'denied': if (joinWait) { joinWait = null; if (joinRej) joinRej(new Error('для этого места нужна карта')); } break;
      case 'pjoin': N.remote[m.id] = mkRemote(m.id, m.name); if (N.hooks.pjoin) N.hooks.pjoin(m); break;
      case 'pleave': { const r = N.remote[m.id]; delete N.remote[m.id]; if (N.hooks.pleave) N.hooks.pleave(m, r); break; }
      case 'p': { const r = N.remote[m.id] || (N.remote[m.id] = mkRemote(m.id, (N.list.find(p => p.id === m.id) || {}).name || '?')); r.pos.set(m.x, m.y, m.z); r.yaw = m.yaw; r.pitch = m.pitch; EUL.set(m.pitch, m.yaw, 0, 'YXZ'); r.fwd.set(0, 0, -1).applyEuler(EUL); r.nt = typeof m.nt === 'string' ? m.nt : ''; r.noise = m.nz || 0; r.flashOn = !!m.fl; r.swinging = !!m.sw; r.speedNow = m.sp || 0; r.sit = m.st || 0; r.t = performance.now(); r.fresh = true; break; }
      case 'host': N.host = m.id === N.id; if (N.hooks.host) N.hooks.host(m); break;
      case 'op': Save.applyOp(m.op); if (N.hooks.cab) N.hooks.cab(m.op); break;
      case 'opNo': if (m.k === 'delSpec') Save.sellRejected(m.uid); break;
      case 'resync': Save.setCab(m.cab); if (N.hooks.cab) N.hooks.cab(null); break;
      case 'vote': N.vote = { vid: m.vid, by: m.by, yes: m.yes, need: m.need, end: performance.now() + m.ms, ms: m.ms, mine: m.byId === N.id ? 'yes' : null }; sys(`${m.by} предлагает сгенерировать новую местность`); if (m.byId !== N.id && N.hooks.voteNew) N.hooks.voteNew(m); break;
      case 'voteUpd': if (N.vote && N.vote.vid === m.vid) { N.vote.yes = m.yes; N.vote.need = m.need; } break;
      case 'voteEnd': if (N.vote && N.vote.vid === m.vid) { N.vote = null; if (!m.ok) sys(m.why === 'no' ? 'Голосование: кто-то против — местность остаётся' : m.why === 'join' ? 'Голосование отменено: пришёл новый игрок' : 'Голосование: не набралось согласия — местность остаётся'); else sys('Все согласны — местность создаётся заново'); } break;
      case 'chat': m.at = performance.now(); N.chat.push(m); if (N.chat.length > 8) N.chat.shift(); if (N.hooks.chat) N.hooks.chat(m); break;
      default: if (N.hooks[m.t]) N.hooks[m.t](m);   // flies, caught, catchOk, catchNo, mod, reseed, regenNo
    }
  }
  function mkRemote(id, name) { return { id, name, pos: new THREE.Vector3(0, -50, 0), fwd: new THREE.Vector3(0, 0, -1), yaw: 0, pitch: 0, noise: 0, flashOn: false, swinging: false, speedNow: 0, t: 0, nt: '' }; }
  return N;
})();
