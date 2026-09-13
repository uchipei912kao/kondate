/* きょうのごはん — AIもネットも使わない献立アプリ。データはこのスマホの中(localStorage)だけ */
(function () {
  'use strict';
  var KEY = 'kondate_v1';
  var $ = function (id) { return document.getElementById(id); };
  var NG = [
    { id: 'raw', label: '生もの禁止（すべて加熱）', tags: ['生'] },
    { id: 'salt', label: '減塩', tags: ['塩分高め'] },
    { id: 'soft', label: 'やわらかめ', tags: ['かたい'] },
    { id: 'swallow', label: '飲み込みにくい', tags: ['かたい', 'ばらける'] },
    { id: 'sugar', label: '糖質ひかえめ', tags: ['糖質高め'] },
    { id: 'fat', label: '脂ひかえめ', tags: ['脂多め'] },
    { id: 'gentle', label: '消化にやさしく', tags: ['脂多め', '辛い', 'かたい'] },
    { id: 'spicy', label: '辛いものNG', tags: ['辛い'] },
    { id: 'egg', label: '卵NG', tags: ['卵'] }, { id: 'milk', label: '乳製品NG', tags: ['乳'] }, { id: 'wheat', label: '小麦NG', tags: ['小麦'] },
    { id: 'shrimp', label: 'えび・かにNG', tags: ['えびかに'] }, { id: 'soba', label: 'そばNG', tags: ['そば'] }, { id: 'peanut', label: '落花生NG', tags: ['落花生'] }, { id: 'soy', label: '大豆NG', tags: ['大豆'] },
    { id: 'beef', label: '牛肉NG', tags: ['牛'] }, { id: 'pork', label: '豚肉NG', tags: ['豚'] }, { id: 'chicken', label: '鶏肉NG', tags: ['鶏'] }, { id: 'fish', label: '魚NG', tags: ['魚'] },
    { id: 'shell', label: '貝NG', tags: ['貝'] }, { id: 'mushroom', label: 'きのこNG', tags: ['きのこ'] }
  ];
  var BASIC = /^(しょうゆ|みりん|砂糖|塩|塩こしょう|こしょう|酒|みそ|だし|水|サラダ油|ごま油|オリーブ油|片栗粉|片栗粉\(あん用\)|小麦粉|酢|ケチャップ|マヨネーズ|コンソメ|鶏がらスープの素|ウスターソース|ソース|めんつゆ|ポン酢|ごまだれ|すし酢|白ごま|すりごま|かつお節|しょうが|しょうが\(すりおろし\)|にんにく|わさび|昆布|レモン汁|バター|粉チーズ|梅干し|ドレッシング|ご飯|米)$/;
  var ING_GROUPS = [
    ['肉', ['豚こま', '豚ロース', '豚バラ', '豚ヒレ', '鶏もも', '鶏むね', '鶏ひき肉', '合いびき', '豚ひき肉', '牛切り落とし', '手羽', 'ベーコン', 'ハム', 'ウインナー']],
    ['魚・その他', ['鮭', 'さば', 'たら', 'ぶり', 'あじ', 'いわし', 'かれい', 'さわら', 'えび', 'あさり', 'ツナ', 'かまぼこ', '卵', '豆腐', '厚揚げ', '油揚げ', '納豆']],
    ['野菜', ['キャベツ', '白菜', '大根', 'にんじん', '玉ねぎ', 'じゃがいも', 'かぼちゃ', 'さつまいも', '里いも', 'なす', 'ピーマン', 'トマト', 'きゅうり', 'ほうれん草', '小松菜', 'ブロッコリー', 'もやし', '長ねぎ', 'ごぼう', 'れんこん', 'かぶ', 'しめじ', 'しいたけ', 'オクラ', 'ズッキーニ', 'アスパラ', 'レタス']],
    ['その他', ['うどん', 'スパゲッティ', '中華麺', '牛乳', 'チーズ', 'トマト缶', '大豆(水煮)', 'ひじき', '切り干し大根', 'わかめ', '春雨', 'コーン']]
  ];
  var ING_TAGS = [
    ['卵', /卵|マヨネーズ|うずら/], ['乳', /牛乳|バター|チーズ|生クリーム|ヨーグルト|クリームコーン/], ['小麦', /小麦粉|パン粉|うどん|スパゲッティ|マカロニ|中華麺|焼きそば麺|そうめん|餃子|ルー|パン(?!粉)|お好み/],
    ['豚', /豚|ベーコン|ハム|ウインナー|合いびき/], ['牛', /牛(?!乳)|合いびき/], ['鶏', /鶏|ささみ|手羽/],
    ['魚', /鮭|さば|たら|ぶり|かれい|さわら|あじ|いわし|まぐろ|かつお|ツナ|じゃこ|しらす|かまぼこ|刺身|魚|白身/], ['えびかに', /えび|かに/], ['貝', /あさり|しじみ|ほたて|牡蠣|貝/],
    ['大豆', /豆腐|油揚げ|厚揚げ|納豆|大豆|豆乳|きな粉|枝豆|焼き豆腐/], ['きのこ', /しいたけ|しめじ|えのき|まいたけ|エリンギ|なめこ|きのこ|マッシュルーム/], ['落花生', /ピーナッツ|落花生/]
  ];
  var SEASON = { 12: '冬', 1: '冬', 2: '冬', 3: '春', 4: '春', 5: '春', 6: '夏', 7: '夏', 8: '夏', 9: '秋', 10: '秋', 11: '秋' };

  // ---------- データ ----------
  var S;
  function defaults() {
    return { profiles: [{ id: 'p1', name: 'お父さん', kind: '家族', ng: ['raw'], words: '', note: '' }, { id: 'p2', name: 'みんな', kind: '家族', ng: [], words: '', note: '' }],
      history: [], shopping: [], ratings: {}, settings: { avoidDays: 14, font: '大' }, lastPlan: null };
  }
  function load() { try { var j = JSON.parse(localStorage.getItem(KEY)); if (j && j.profiles) return j; } catch (e) {} return defaults(); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { trimPhotos(20); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e2) { toast('保存できません(容量いっぱい)'); } } }
  function trimPhotos(keep) { var n = 0; for (var i = 0; i < S.history.length; i++) { if (S.history[i].photo) { n++; if (n > keep) S.history[i].photo = ''; } } }
  function uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }

  // レシピに材料タグを付ける
  var RECIPES = (window.RECIPES || []).map(function (r) {
    var names = r.ing.map(function (x) { return x[0]; }).join(' ');
    var tags = r.tags.slice();
    ING_TAGS.forEach(function (t) { if (t[1].test(names) && tags.indexOf(t[0]) < 0) tags.push(t[0]); });
    if (/そば/.test(names) && !/焼きそば/.test(names) && tags.indexOf('そば') < 0) tags.push('そば');
    if (r.time <= 15) tags.push('15分');
    return { id: r.id, name: r.name, cat: r.cat, time: r.time, tags: tags, ing: r.ing, steps: r.steps, tip: r.tip, text: r.name + ' ' + names };
  });
  var byId = {}; RECIPES.forEach(function (r) { byId[r.id] = r; });

  // ---------- 画面 ----------
  var stack = [];
  var TITLES = { home: 'きょうのごはん', who: 'だれに作る？', plan: '今日の献立', recipe: '作り方', made: '作った！', history: '作った記録', histdetail: '記録', ing: 'ある食材から', shop: '買い物リスト', settings: '設定', person: '人の登録', usage: '使い方' };
  function show(id, push) {
    if (push !== false && cur && cur !== id) stack.push(cur);
    cur = id;
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.toggle('active', s.id === 's-' + id); });
    $('title').textContent = TITLES[id] || 'きょうのごはん';
    document.querySelector('.top').classList.toggle('home', id === 'home');
    window.scrollTo(0, 0);
  }
  var cur = null;
  function back() { var p = stack.pop() || 'home'; show(p, false); if (p === 'home') stack = []; if (p === 'plan') renderPlan(); if (p === 'history') renderHistory(); if (p === 'shop') renderShop(); if (p === 'settings') renderSettings(); }
  function toast(msg) { var t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.tm); toast.tm = setTimeout(function () { t.classList.remove('show'); }, 2600); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // ---------- 提案ロジック ----------
  var ctx = { pid: null, ingredients: [], time: 0, mood: '', mode: 'set', shown: {} };
  function profile() { return S.profiles.filter(function (p) { return p.id === ctx.pid; })[0] || S.profiles[0]; }
  function forbiddenTags(p) { var t = []; (p.ng || []).forEach(function (id) { NG.forEach(function (n) { if (n.id === id) t = t.concat(n.tags); }); }); return t; }
  function ngWords(p) { return String(p.words || '').split(/[、,\s]+/).map(function (w) { return w.trim(); }).filter(Boolean); }
  function recentIds(pid) {
    var days = Number(S.settings.avoidDays || 14), lim = Date.now() - days * 86400000, set = {};
    S.history.forEach(function (h) { if (h.ts >= lim && (!pid || h.pid === pid)) set[h.rid] = 1; });
    return set;
  }
  function allowed(r, p, recent, relax) {
    var ft = forbiddenTags(p);
    for (var i = 0; i < ft.length; i++) if (r.tags.indexOf(ft[i]) >= 0) return false;
    var w = ngWords(p);
    for (var j = 0; j < w.length; j++) if (w[j] && (r.text.indexOf(w[j]) >= 0 || r.tags.indexOf(w[j]) >= 0)) return false;   // 「きのこ」などはタグでも一致
    if (!relax && recent[r.id]) return false;
    if (ctx.time && r.time > ctx.time && !relax) return false;
    return true;
  }
  function score(r, p) {
    var s = Math.random() * 2;
    ctx.ingredients.forEach(function (w) { if (w && r.text.indexOf(w) >= 0) s += 4; });
    var rt = S.ratings[r.id]; if (rt) s += (rt.up || 0) * 1.5 - (rt.down || 0) * 3;
    var season = SEASON[new Date().getMonth() + 1]; if (r.tags.indexOf(season) >= 0) s += 0.8;
    var soft = (p.ng || []).some(function (x) { return x === 'soft' || x === 'swallow' || x === 'gentle'; });
    if (soft && r.tags.indexOf('やわらか') >= 0) s += 1.2;
    if (ctx.mood === 'light' && r.tags.indexOf('軽め') >= 0) s += 1.5;
    if (ctx.mood === 'light' && r.tags.indexOf('脂多め') >= 0) s -= 2;
    if (ctx.mood === 'quick' && r.time <= 15) s += 1.5;
    return s;
  }
  function pick(cat, exclude, avoidWords) {
    var p = profile(), recent = recentIds(ctx.pid);
    var list = RECIPES.filter(function (r) { return r.cat === cat && exclude.indexOf(r.id) < 0 && allowed(r, p, recent, false); });
    if (!list.length) list = RECIPES.filter(function (r) { return r.cat === cat && exclude.indexOf(r.id) < 0 && allowed(r, p, recent, true); });
    if (!list.length) return null;
    list.forEach(function (r) { r._s = score(r, p); (avoidWords || []).forEach(function (w) { if (w && r.text.indexOf(w) >= 0) r._s -= 3; }); });
    list.sort(function (a, b) { return b._s - a._s; });
    return list[0];
  }
  function mainWords(r) { return r.ing.slice(0, 2).map(function (x) { return x[0].replace(/\(.*\)|切り落とし|薄切り|こま切れ/g, '').slice(0, 2); }); }
  function makePlan() {
    var mainCat = ctx.mode === 'one' ? '一品' : '主菜';
    var main = pick(mainCat, []);
    var aw = main ? mainWords(main) : [];
    var side = pick('副菜', main ? [main.id] : [], aw);
    var soup = pick('汁物', [main && main.id, side && side.id].filter(Boolean), aw.concat(side ? mainWords(side) : []));
    ctx.shown = {};
    S.lastPlan = { pid: ctx.pid, ts: Date.now(), slots: [{ label: ctx.mode === 'one' ? '一品' : '主菜', rid: main && main.id }, { label: '副菜', rid: side && side.id }, { label: '汁物', rid: soup && soup.id }] };
    save();
  }
  function swapSlot(i) {
    var plan = S.lastPlan, slot = plan.slots[i];
    var shown = ctx.shown[i] = (ctx.shown[i] || []).concat(slot.rid ? [slot.rid] : []);
    var others = plan.slots.map(function (s) { return s.rid; }).filter(Boolean);
    var aw = [];
    plan.slots.forEach(function (s, j) { if (j !== i && s.rid) aw = aw.concat(mainWords(byId[s.rid])); });
    var cat = slot.label === '副菜' ? '副菜' : slot.label === '汁物' ? '汁物' : (ctx.mode === 'one' ? '一品' : '主菜');
    var r = pick(cat, others.concat(shown), aw);
    if (!r) { ctx.shown[i] = []; r = pick(cat, others, aw); }
    if (!r) { toast('ほかの候補がありません'); return; }
    slot.rid = r.id; save(); renderPlan();
  }
  function renderPlan() {
    var p = profile(), plan = S.lastPlan;
    $('planFor').textContent = p.name + 'に作る献立' + (ctx.ingredients.length ? '（' + ctx.ingredients.join('・') + 'を使って）' : '');
    var chips = [['quick', '⏱ 15分で'], ['light', '🥗 あっさり'], ['one', '🍜 一品もの(丼・麺)']];
    $('planChips').innerHTML = chips.map(function (c) {
      var on = c[0] === 'one' ? ctx.mode === 'one' : ctx.mood === c[0];
      return '<button class="chip' + (on ? ' on' : '') + '" data-c="' + c[0] + '">' + c[1] + '</button>';
    }).join('');
    $('planChips').querySelectorAll('.chip').forEach(function (b) {
      b.onclick = function () {
        var c = b.getAttribute('data-c');
        if (c === 'one') ctx.mode = ctx.mode === 'one' ? 'set' : 'one';
        else ctx.mood = ctx.mood === c ? '' : c;
        ctx.time = ctx.mood === 'quick' ? 15 : 0;
        makePlan(); renderPlan();
      };
    });
    $('planList').innerHTML = plan.slots.map(function (s, i) {
      var r = s.rid ? byId[s.rid] : null;
      if (!r) return '<div class="card"><span class="slot-label">' + s.label + '</span><div>条件に合う料理がありません</div></div>';
      var mains = r.ing.filter(function (x) { return !BASIC.test(x[0]); }).slice(0, 4).map(function (x) { return x[0]; }).join('・');
      return '<div class="card"><span class="slot-label">' + s.label + '</span><h3>' + esc(r.name) + '</h3><div class="meta">約' + r.time + '分　' + esc(mains) + (r.tip ? '<br>' + esc(r.tip) : '') + '</div>' +
        '<div class="row"><button class="btn blue small" data-open="' + r.id + '">📖 作り方</button><button class="btn gray small" data-swap="' + i + '">🔄 別のに</button></div></div>';
    }).join('');
    $('planList').querySelectorAll('[data-open]').forEach(function (b) { b.onclick = function () { openRecipe(b.getAttribute('data-open')); }; });
    $('planList').querySelectorAll('[data-swap]').forEach(function (b) { b.onclick = function () { swapSlot(Number(b.getAttribute('data-swap'))); }; });
  }

  // ---------- レシピ ----------
  var curRecipe = null, checked = {};
  function openRecipe(rid) {
    var r = byId[rid]; if (!r) return; curRecipe = r; checked = {};
    $('rName').textContent = r.name; $('rMeta').textContent = r.cat + '　約' + r.time + '分';
    $('rTip').style.display = r.tip ? 'block' : 'none'; $('rTip').textContent = r.tip;
    $('rIng').innerHTML = r.ing.map(function (x, i) {
      var basic = BASIC.test(x[0]);
      return '<li class="' + (basic ? 'basic' : '') + '"><span><span class="chk-ing" data-i="' + i + '" style="display:inline-block;width:34px;height:34px;border:3px solid #3aa76d;border-radius:8px;vertical-align:middle;margin-right:10px;text-align:center;line-height:30px;font-weight:900;color:#fff"></span>' + esc(x[0]) + '</span><span class="q">' + esc(x[1]) + '</span></li>';
    }).join('');
    $('rIng').querySelectorAll('.chk-ing').forEach(function (el) { el.onclick = function () { var i = el.getAttribute('data-i'); checked[i] = !checked[i]; el.style.background = checked[i] ? '#3aa76d' : ''; el.textContent = checked[i] ? '✓' : ''; }; });
    $('rSteps').innerHTML = r.steps.map(function (s) { return '<li><span>' + esc(s) + '</span></li>'; }).join('');
    show('recipe');
  }
  function addToShop(items) {
    var n = 0;
    items.forEach(function (t) { t = String(t).trim(); if (!t) return; if (S.shopping.some(function (s) { return s.text === t && !s.done; })) return; S.shopping.push({ id: uid(), text: t, done: false }); n++; });
    save(); toast(n ? n + '品を買い物リストに入れました' : 'すでに入っています');
  }

  // ---------- 作った！ ----------
  var pending = null; // {rid,name,pid}
  function openMade(rid, name) {
    pending = { rid: rid || '', name: name, pid: ctx.pid || (S.lastPlan && S.lastPlan.pid) || S.profiles[0].id, photo: '' };
    $('ovName').textContent = name; $('ovPhoto').style.display = 'none'; $('ovPhoto').src = ''; $('ovFile').value = '';
    $('ov').classList.add('show');
  }
  function resizeImage(file, cb) {
    var img = new Image(), url = URL.createObjectURL(file);
    img.onload = function () {
      var max = 480, w = img.width, h = img.height, s = Math.min(1, max / Math.max(w, h));
      var c = document.createElement('canvas'); c.width = Math.round(w * s); c.height = Math.round(h * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); cb(c.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = function () { URL.revokeObjectURL(url); cb(''); };
    img.src = url;
  }
  function saveMade() {
    if (!pending) return;
    S.history.unshift({ id: uid(), ts: Date.now(), pid: pending.pid, rid: pending.rid, name: pending.name, photo: pending.photo || '', rating: 0 });
    trimPhotos(100); save();
    $('ov').classList.remove('show'); pending = null;
    toast('記録しました。しばらく同じ料理は出ません');
    renderHistory(); show('history');
  }
  function renderMadeList() {
    var plan = S.lastPlan, ids = [];
    if (plan) plan.slots.forEach(function (s) { if (s.rid) ids.push(s.rid); });
    // 直近の履歴に無い最近の提案も
    var html = ids.map(function (rid) { var r = byId[rid]; return r ? '<button class="btn gray" data-made="' + rid + '">' + esc(r.name) + '</button>' : ''; }).join('');
    $('madeList').innerHTML = html || '<div class="hint">まだ今日の献立がありません。下に料理名を入れてください</div>';
    $('madeList').querySelectorAll('[data-made]').forEach(function (b) { b.onclick = function () { openMade(b.getAttribute('data-made'), byId[b.getAttribute('data-made')].name); }; });
  }

  // ---------- 記録 ----------
  function pname(pid) { var p = S.profiles.filter(function (x) { return x.id === pid; })[0]; return p ? p.name : ''; }
  function fmt(ts) { var d = new Date(ts); return (d.getMonth() + 1) + '/' + d.getDate() + '（' + '日月火水木金土'[d.getDay()] + '）'; }
  function renderHistory() {
    if (!S.history.length) { $('histList').innerHTML = '<div class="hint">まだ記録がありません</div>'; return; }
    $('histList').innerHTML = S.history.slice(0, 200).map(function (h) {
      return '<div class="hist" data-h="' + h.id + '">' + (h.photo ? '<img src="' + h.photo + '">' : '<div class="noimg">🍽</div>') + '<div class="t"><b>' + esc(h.name) + '</b><span>' + fmt(h.ts) + '　' + esc(pname(h.pid)) + (h.rating > 0 ? '　👍' : h.rating < 0 ? '　👎' : '') + '</span></div></div>';
    }).join('');
    $('histList').querySelectorAll('[data-h]').forEach(function (el) { el.onclick = function () { openHist(el.getAttribute('data-h')); }; });
  }
  var curHist = null;
  function openHist(id) {
    var h = S.history.filter(function (x) { return x.id === id; })[0]; if (!h) return; curHist = h;
    $('hdPhoto').style.display = h.photo ? 'block' : 'none'; $('hdPhoto').src = h.photo || '';
    $('hdName').textContent = h.name; $('hdMeta').textContent = fmt(h.ts) + '　' + pname(h.pid) + (h.rating > 0 ? '　👍また作りたい' : h.rating < 0 ? '　👎イマイチ' : '');
    $('hdRecipe').style.display = h.rid ? 'block' : 'none';
    show('histdetail');
  }
  function rate(v) {
    if (!curHist) return;
    if (curHist.rid) { var rt = S.ratings[curHist.rid] = S.ratings[curHist.rid] || { up: 0, down: 0 }; if (curHist.rating > 0) rt.up--; if (curHist.rating < 0) rt.down--; if (v > 0) rt.up++; if (v < 0) rt.down++; }
    curHist.rating = v; save(); openHist(curHist.id); toast(v > 0 ? '「また作りたい」にしました' : '「イマイチ」にしました');
  }

  // ---------- 食材 ----------
  var selIng = {};
  function renderIng() {
    $('ingGroups').innerHTML = ING_GROUPS.map(function (g) {
      return '<h2>' + g[0] + '</h2><div class="chips">' + g[1].map(function (n) { return '<button class="chip' + (selIng[n] ? ' on' : '') + '" data-ing="' + esc(n) + '">' + esc(n) + '</button>'; }).join('') + '</div>';
    }).join('');
    $('ingGroups').querySelectorAll('[data-ing]').forEach(function (b) { b.onclick = function () { var n = b.getAttribute('data-ing'); selIng[n] = !selIng[n]; b.classList.toggle('on', !!selIng[n]); }; });
  }

  // ---------- 買い物 ----------
  function renderShop() {
    var L = S.shopping;
    $('shopEmpty').style.display = L.length ? 'none' : 'block';
    $('shopList').innerHTML = L.map(function (s) { return '<li class="' + (s.done ? 'done' : '') + '" data-s="' + s.id + '"><span class="chk">' + (s.done ? '✓' : '') + '</span><span>' + esc(s.text) + '</span></li>'; }).join('');
    $('shopList').querySelectorAll('[data-s]').forEach(function (el) { el.onclick = function () { var s = S.shopping.filter(function (x) { return x.id === el.getAttribute('data-s'); })[0]; s.done = !s.done; save(); renderShop(); }; });
  }

  // ---------- だれに / 設定 ----------
  function personBtn(p, attr) {
    var ngs = (p.ng || []).map(function (id) { var n = NG.filter(function (x) { return x.id === id; })[0]; return n ? n.label.replace(/（.*）/, '') : ''; }).filter(Boolean).join('・');
    return '<button class="btn gray" ' + attr + '="' + p.id + '"><span class="person"><span class="em">' + (p.kind === '訪問先' ? '🏠' : '👨‍👩‍👧') + '</span><span>' + esc(p.name) + '<span class="ngs">' + esc(ngs || '制限なし') + (p.note ? '　' + esc(p.note) : '') + '</span></span></span></button>';
  }
  function renderWho() {
    var fam = S.profiles.filter(function (p) { return p.kind !== '訪問先'; }), work = S.profiles.filter(function (p) { return p.kind === '訪問先'; });
    $('whoList').innerHTML = fam.map(function (p) { return personBtn(p, 'data-who'); }).join('') + (work.length ? '<h2>訪問先</h2>' + work.map(function (p) { return personBtn(p, 'data-who'); }).join('') : '');
    $('whoList').querySelectorAll('[data-who]').forEach(function (b) { b.onclick = function () { ctx.pid = b.getAttribute('data-who'); ctx.mood = ''; ctx.time = 0; ctx.mode = 'set'; makePlan(); renderPlan(); show('plan'); }; });
  }
  function renderSettings() {
    $('setPeople').innerHTML = S.profiles.map(function (p) { return personBtn(p, 'data-edit'); }).join('');
    $('setPeople').querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function () { openPerson(b.getAttribute('data-edit')); }; });
    $('fontL').classList.toggle('on', S.settings.font !== '特大'); $('fontXL').classList.toggle('on', S.settings.font === '特大');
    $('avoidDays').value = String(S.settings.avoidDays || 14);
  }
  var editP = null;
  function openPerson(id) {
    editP = id ? S.profiles.filter(function (p) { return p.id === id; })[0] : { id: '', name: '', kind: '家族', ng: [], words: '', note: '' };
    editP = JSON.parse(JSON.stringify(editP));
    $('pName').value = editP.name; $('pWords').value = editP.words || ''; $('pNote').value = editP.note || '';
    $('pKindFam').classList.toggle('on', editP.kind !== '訪問先'); $('pKindWork').classList.toggle('on', editP.kind === '訪問先');
    $('pNg').innerHTML = NG.map(function (n) { return '<button class="chip ng' + (editP.ng.indexOf(n.id) >= 0 ? ' on' : '') + '" data-ng="' + n.id + '">' + n.label + '</button>'; }).join('');
    $('pNg').querySelectorAll('[data-ng]').forEach(function (b) { b.onclick = function () { var id = b.getAttribute('data-ng'), i = editP.ng.indexOf(id); if (i >= 0) editP.ng.splice(i, 1); else editP.ng.push(id); b.classList.toggle('on', i < 0); }; });
    $('pDelete').style.display = id ? 'block' : 'none';
    show('person');
  }
  function applyFont() { document.documentElement.classList.toggle('xl', S.settings.font === '特大'); }

  // ---------- イベント ----------
  $('backBtn').onclick = back;
  $('goSuggest').onclick = function () { ctx.ingredients = []; renderWho(); show('who'); };
  $('goIng').onclick = function () { renderIng(); show('ing'); };
  $('goMade').onclick = function () { renderMadeList(); $('madeText').value = ''; show('made'); };
  $('goHistory').onclick = function () { renderHistory(); show('history'); };
  $('goShop').onclick = function () { renderShop(); show('shop'); };
  $('goSettings').onclick = function () { renderSettings(); show('settings'); };
  $('whoAdd').onclick = function () { openPerson(''); };
  $('planAgain').onclick = function () { makePlan(); renderPlan(); toast('作り直しました'); };
  $('rMade').onclick = function () { if (curRecipe) openMade(curRecipe.id, curRecipe.name); };
  $('rShop').onclick = function () { if (!curRecipe) return; var items = curRecipe.ing.filter(function (x, i) { return checked[i]; }).map(function (x) { return x[0]; }); if (!items.length) { toast('材料の □ を押してから'); return; } addToShop(items); };
  $('madeTextBtn').onclick = function () { var t = $('madeText').value.trim(); if (!t) { toast('料理名を入れてください'); return; } var r = RECIPES.filter(function (x) { return x.name === t; })[0]; openMade(r ? r.id : '', t); };
  $('ovFile').onchange = function () { var f = this.files && this.files[0]; if (!f) return; resizeImage(f, function (d) { if (pending) pending.photo = d; $('ovPhoto').src = d; $('ovPhoto').style.display = d ? 'block' : 'none'; }); };
  $('ovSave').onclick = saveMade;
  $('ovCancel').onclick = function () { $('ov').classList.remove('show'); pending = null; };
  $('hdUp').onclick = function () { rate(1); }; $('hdDown').onclick = function () { rate(-1); };
  $('hdRecipe').onclick = function () { if (curHist && curHist.rid) openRecipe(curHist.rid); };
  $('hdDelete').onclick = function () { if (!curHist) return; if (!confirm('この記録を消しますか？')) return; S.history = S.history.filter(function (h) { return h.id !== curHist.id; }); save(); renderHistory(); show('history', false); };
  $('ingGo').onclick = function () {
    var extra = $('ingText').value.split(/[、,\s]+/).map(function (w) { return w.trim(); }).filter(Boolean);
    ctx.ingredients = Object.keys(selIng).filter(function (k) { return selIng[k]; }).map(function (k) { return k.replace(/\(.*\)/, ''); }).concat(extra);
    if (!ctx.ingredients.length) { toast('食材を選んでください'); return; }
    renderWho(); show('who');
  };
  $('shopAdd').onclick = function () { var t = $('shopText').value.trim(); if (!t) return; addToShop([t]); $('shopText').value = ''; renderShop(); };
  $('shopShare').onclick = function () {
    var items = S.shopping.filter(function (s) { return !s.done; }).map(function (s) { return '・' + s.text; });
    if (!items.length) { toast('リストが空です'); return; }
    var text = '【買い物リスト】\n' + items.join('\n');
    if (navigator.share) navigator.share({ text: text }).catch(function () {}); else { try { navigator.clipboard.writeText(text); toast('コピーしました'); } catch (e) { prompt('コピーしてください', text); } }
  };
  $('shopClear').onclick = function () { S.shopping = S.shopping.filter(function (s) { return !s.done; }); save(); renderShop(); };
  $('setAdd').onclick = function () { openPerson(''); };
  $('fontL').onclick = function () { S.settings.font = '大'; save(); applyFont(); renderSettings(); };
  $('fontXL').onclick = function () { S.settings.font = '特大'; save(); applyFont(); renderSettings(); };
  $('avoidDays').onchange = function () { S.settings.avoidDays = Number(this.value); save(); };
  $('goUsage').onclick = function () { show('usage'); };
  $('pKindFam').onclick = function () { editP.kind = '家族'; $('pKindFam').classList.add('on'); $('pKindWork').classList.remove('on'); };
  $('pKindWork').onclick = function () { editP.kind = '訪問先'; $('pKindWork').classList.add('on'); $('pKindFam').classList.remove('on'); };
  $('pSave').onclick = function () {
    editP.name = $('pName').value.trim(); if (!editP.name) { toast('名前を入れてください'); return; }
    editP.words = $('pWords').value.trim(); editP.note = $('pNote').value.trim();
    if (editP.id) { S.profiles = S.profiles.map(function (p) { return p.id === editP.id ? editP : p; }); } else { editP.id = uid(); S.profiles.push(editP); }
    save(); toast('保存しました'); back();
  };
  $('pDelete').onclick = function () { if (!editP.id || S.profiles.length <= 1) { toast('最後の1人は消せません'); return; } if (!confirm(editP.name + ' を削除しますか？')) return; S.profiles = S.profiles.filter(function (p) { return p.id !== editP.id; }); save(); back(); };
  $('backupOut').onclick = function () {
    var data = JSON.stringify(S), name = 'kondate-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    try {
      var file = new File([data], name, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: 'きょうのごはん バックアップ' }).catch(function () {}); return; }
    } catch (e) {}
    var a = document.createElement('a'); a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(data); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  };
  $('backupIn').onchange = function () {
    var f = this.files && this.files[0]; if (!f) return;
    var rd = new FileReader(); rd.onload = function () { try { var j = JSON.parse(rd.result); if (!j.profiles) throw 0; if (!confirm('今のデータを置き換えて読み込みますか？')) return; S = j; save(); applyFont(); renderSettings(); toast('読み込みました'); } catch (e) { toast('読み込めませんでした'); } }; rd.readAsText(f);
  };

  // ---------- 起動 ----------
  S = load(); applyFont();
  window.__kondate = { recipes: RECIPES, ng: NG, allowed: function (r, p) { return allowed(r, p, {}, true); }, state: function () { return S; } };   // 動作確認用
  var hour = new Date().getHours();
  $('homeGreet').textContent = hour < 10 ? '朝ごはん・お弁当の参考にも' : hour < 15 ? '今日の晩ごはん、何にしましょう' : '今日は何にしましょう';
  show('home');
  if ('serviceWorker' in navigator) { navigator.serviceWorker.register('sw.js').catch(function () {}); }
})();
