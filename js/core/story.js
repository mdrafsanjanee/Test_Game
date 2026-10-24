// Story flags (persisted via the Record) and the shared dialogue table.
// Convention: TG.Dialogue.<id> = { intro:[], ... }. A line is { who:'Name', text:'...', ms:3200 }
// or a plain string. Agent A owns js/data/dialogue_core.js, Agent B owns js/data/dialogue_story.js.
TG.Dialogue = TG.Dialogue || {};

TG.Story = {
  flag: function (key, value) {
    if (value === undefined) return TG.Record.save.flags[key];
    TG.Record.save.flags[key] = value;
    TG.Record.persist();
    return value;
  },
  has: function (key) { return !!TG.Record.save.flags[key]; },

  // Normalise a line to {who,text,ms}
  line: function (l) {
    if (typeof l === 'string') l = { text: l };
    return { who: l.who || '', text: l.text, ms: l.ms || Math.max(2200, l.text.length * 55) };
  }
};

// Flow: moves the player through TG.sequence.
TG.Flow = {
  index: function (id) { return TG.sequence.indexOf(id); },
  start: function (scene, idx) {
    var item = TG.sequence[idx];
    if (!item) { scene.scene.start('Summary'); return; }
    if (item.indexOf('cut:') === 0) scene.scene.start('Cutscene', { id: item.slice(4), idx: idx });
    else scene.scene.start('Arena', { boss: item, idx: idx, tries: 0 });
  },
  next: function (scene, idx) { this.start(scene, idx + 1); }
};
