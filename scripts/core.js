(function (T) {
  'use strict';
  T.spreads = {
    single: { name: '此刻提示', positions: [{ id: 'present', label: '此刻', prompt: '此刻，有什么值得你留意？' }] },
    'situation-obstacle-advice': { name: '现状 · 阻碍 · 建议', positions: [
      { id: 'situation', label: '现状', prompt: '看见你正在经历的状态。' },
      { id: 'obstacle', label: '阻碍', prompt: '辨认需要理解与面对的阻力。' },
      { id: 'advice', label: '建议', prompt: '寻找一个可以尝试的行动。' }
    ] }
  };
  T.randomInt = function (max, source = () => crypto.getRandomValues(new Uint32Array(1))[0]) {
    if (!Number.isInteger(max) || max < 1 || max > 0x100000000) throw new Error('随机范围无效');
    const limit = Math.floor(0x100000000 / max) * max;
    let value;
    do { value = source(); } while (value >= limit);
    return value % max;
  };
  T.uid = () => Array.from(crypto.getRandomValues(new Uint32Array(4)), x => x.toString(16).padStart(8, '0')).join('');
  T.shuffle = function (cards, inverse, random = T.randomInt) {
    const deck = cards.map(c => ({ cardId: c.id, reversed: inverse ? random(2) === 1 : false }));
    for (let i = deck.length - 1; i > 0; i--) { const j = random(i + 1); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    return deck;
  };
  T.createSession = function (question, spreadId, inverse) {
    if (!T.spreads[spreadId]) throw new Error('牌阵无效');
    return { id: T.uid(), createdAt: new Date().toISOString(), question: question.trim().slice(0,200) || '此刻的指引', spreadId,
      reversalEnabled: inverse, deck: T.shuffle(T.cards, inverse), selected: [], revealed: [], phase: 'shuffling', active: 0 };
  };
  T.select = function (s, index) {
    if (s.phase !== 'selecting' || !Number.isInteger(index) || !s.deck[index] || s.selected.includes(index)) return false;
    s.selected.push(index);
    if (s.selected.length === T.spreads[s.spreadId].positions.length) s.phase = 'revealing';
    return true;
  };
  T.reveal = function (s, index) {
    if (!['revealing', 'complete'].includes(s.phase) || !Number.isInteger(index) || index < 0 || index >= s.selected.length) return false;
    s.active = index;
    if (s.revealed.includes(index)) return false;
    s.revealed.push(index);
    if (s.revealed.length === s.selected.length) s.phase = 'complete';
    return true;
  };
  T.toReading = function (s) {
    if (s.phase !== 'complete') throw new Error('尚未完成翻牌');
    const spread = T.spreads[s.spreadId];
    return { id: s.id, createdAt: s.createdAt, updatedAt: new Date().toISOString(), deckVersion: 1, contentVersion: 1,
      question: s.question, note: '', spreadId: s.spreadId, spreadName: spread.name, reversalEnabled: s.reversalEnabled,
      cards: s.selected.map((index,i) => {
        const draw = s.deck[index], card = T.cards.find(c => c.id === draw.cardId), pos = spread.positions[i];
        return { cardId: card.id, nameZh: card.nameZh, nameEn: card.nameEn, reversed: draw.reversed, positionId: pos.id,
          positionLabel: pos.label, interpretation: JSON.parse(JSON.stringify(card[draw.reversed ? 'reversed' : 'upright'])) };
      }) };
  };
})(window.TikaTarot);
