(function (T) {
  'use strict';
  const KEY = 'tika-tarot:v1';
  const text = (v, max) => { if (typeof v !== 'string' || v.length > max) throw new Error('文本字段无效或过长'); return v; };
  const bool = v => { if (typeof v !== 'boolean') throw new Error('设置格式无效'); return v; };
  const date = v => { if (typeof v !== 'string' || !/^\d{4}-\d\d-\d\dT/.test(v) || !Number.isFinite(Date.parse(v))) throw new Error('日期格式无效'); return v; };
  function reading(r) {
    if (!r || typeof r !== 'object' || !Object.hasOwn(T.spreads, r.spreadId)) throw new Error('记录或牌阵无效');
    const spread = T.spreads[r.spreadId], inverse = bool(r.reversalEnabled);
    if (!Array.isArray(r.cards) || r.cards.length !== spread.positions.length) throw new Error('牌位数量无效');
    const seen = new Set();
    const cards = r.cards.map((c,i) => {
      if (!c || !T.cards.some(d => d.id === c.cardId) || seen.has(c.cardId) || c.positionId !== spread.positions[i].id) throw new Error('卡片或牌位无效');
      seen.add(c.cardId);
      const reversed = bool(c.reversed);
      if (reversed && !inverse) throw new Error('逆位设置不一致');
      const a = c.interpretation;
      if (!a || !Array.isArray(a.keywords) || a.keywords.length < 2 || a.keywords.length > 4) throw new Error('释义无效');
      return { cardId: c.cardId, nameZh: text(c.nameZh,50), nameEn: text(c.nameEn,80), reversed,
        positionId: c.positionId, positionLabel: text(c.positionLabel,50),
        interpretation: { keywords: a.keywords.map(k => text(k,50)), meaning: text(a.meaning,500), reflection: text(a.reflection,500) } };
    });
    if (r.deckVersion !== 1 || r.contentVersion !== 1) throw new Error('不支持的牌组版本');
    const id = text(r.id,100); if (!id) throw new Error('记录 ID 为空');
    return { id, createdAt: date(r.createdAt), updatedAt: date(r.updatedAt), deckVersion: 1, contentVersion: 1,
      question: text(r.question,200), note: text(r.note,2000), spreadId: r.spreadId, spreadName: text(r.spreadName,80), reversalEnabled: inverse, cards };
  }
  function envelope(input, backup = false) {
    if (!input || input.schemaVersion !== 1 || (backup && input.appId !== 'tika-tarot')) throw new Error('不是有效备份，或版本暂不支持');
    if (!Array.isArray(input.readings) || (backup && input.readings.length > 1000)) throw new Error('记录数量无效，单次最多导入 1,000 条');
    const readings = input.readings.map(reading), ids = new Set();
    readings.forEach(r => { if(ids.has(r.id)) throw new Error('备份内记录 ID 重复'); ids.add(r.id); });
    if (!input.settings) throw new Error('缺少设置');
    return { schemaVersion: 1, readings, settings: { reversalEnabled: bool(input.settings.reversalEnabled), reduceMotion: bool(input.settings.reduceMotion) } };
  }
  T.validateBackup = input => envelope(input, true);
  T.createStore = function (getStorage = () => window.localStorage) {
    let storage, raw = null, lastRaw = null, mode = 'persistent', error = '', dirty = false, external = false;
    let data = { schemaVersion: 1, readings: [], settings: { reversalEnabled: false, reduceMotion: false } };
    try {
      storage = getStorage();
      raw = storage.getItem(KEY); lastRaw = raw;
      if (raw !== null) data = envelope(JSON.parse(raw));
      const probe = `${KEY}:probe`; storage.setItem(probe, '1');
      if (storage.getItem(probe) !== '1') throw new Error('存储验证失败');
      storage.removeItem(probe);
    } catch (e) { mode = 'memory'; error = raw !== null ? '原有记录无法读取，已保留原始数据；新记录仅保留在本次会话。' : '当前无法长期保存，关闭前请导出记录。'; }
    function persist() {
      dirty = true;
      if (mode === 'memory') return false;
      try {
        if (storage.getItem(KEY) !== lastRaw) { external = true; throw new Error('其他窗口已更新记录，请先导出本次数据，再重新打开页面。'); }
        const next = JSON.stringify(data); storage.setItem(KEY,next); lastRaw = next; dirty = false; error = ''; return true;
      } catch (e) { error = external ? e.message : '保存失败，记录仍在本次会话中，请导出备份。'; return false; }
    }
    return {
      get data() { return data; }, get mode() { return mode; }, get error() { return error; }, get raw() { return mode === 'memory' ? raw : null; },
      get dirty() { return dirty; },
      save(r) { const clean = reading(r), i = data.readings.findIndex(x => x.id === clean.id); if (i < 0) data.readings.unshift(clean); else data.readings[i] = clean; return persist(); },
      settings(patch) { data.settings = { ...data.settings, ...patch }; return persist(); },
      remove(id) { data.readings = data.readings.filter(r => r.id !== id); return persist(); },
      retry: persist,
      export() { return { appId: 'tika-tarot', ...JSON.parse(JSON.stringify(data)), exportedAt: new Date().toISOString() }; },
      plan(input) {
        const clean = T.validateBackup(input); let skipped = 0, conflicts = 0;
        clean.readings.forEach(r => { const old = data.readings.find(x => x.id === r.id); if (old) { if (JSON.stringify(old) === JSON.stringify(r)) skipped++; else conflicts++; } });
        return { clean, skipped, conflicts, added: clean.readings.length-skipped };
      },
      merge(input) {
        const plan = this.plan(input), next = data.readings.slice(), used = new Set(next.map(r => r.id));
        plan.clean.readings.forEach(r => {
          const old = next.find(x => x.id === r.id);
          if (old && JSON.stringify(old) === JSON.stringify(r)) return;
          if (old) { do { r.id = T.uid(); } while (used.has(r.id)); }
          used.add(r.id); next.push(r);
        });
        data = { ...data, readings: next, settings: plan.clean.settings }; persist(); return plan;
      }
    };
  };
})(window.TikaTarot);
