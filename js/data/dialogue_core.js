// Agent A's dialogue: the Warden and the Mirror (the conscience). Agent B writes the rest in dialogue_story.js.
TG.Dialogue.warden = {
  intro: [
    { who: 'The Warden', text: 'You wear the royal sigil. So they sent another to burn what is left of us.', ms: 3800 },
    { who: 'The Warden', text: 'The Gate is all we have. I will not step aside.', ms: 3000 }
  ],
  phase2: [{ who: 'The Warden', text: 'Then let the mountain judge us both!', ms: 2400 }],
  defeat: [
    { who: 'The Warden', text: '...Our children sleep below the Gate. They never harmed anyone.', ms: 4200 }
  ]
};

// The Mirror speaks from the player's record. R = TG.Record, p = TG.Record.profile(5)
TG.Dialogue.mirror = {
  intro: function (R, p) {
    var out = [{ who: 'Hero?', text: 'You finally came. Look at me.', ms: 2800 }];
    var kills = R.count('kill'), spares = R.count('spare');
    if (kills > 0) out.push({ who: 'Hero?', text: 'You killed ' + kills + (kills > 1 ? ' of them' : ' of them') + '. They were only guarding their homes.', ms: 4200 });
    else if (spares > 0) out.push({ who: 'Hero?', text: 'You spared ' + spares + '. Then why did you keep swinging at the rest?', ms: 4200 });
    else out.push({ who: 'Hero?', text: 'Every one of them was defending something. Did you ask what?', ms: 3600 });
    return out;
  },
  habit: function (R, p) {
    if (p.light > 1.6) return { who: 'Hero?', text: 'You never stop swinging. Did you ever look at who was in front of you?', ms: 4200 };
    if (p.dash + p.roll > 0.6) return { who: 'Hero?', text: 'You run from every blow. They could not run. This was their home.', ms: 4200 };
    if (p.heavy > 0.3) return { who: 'Hero?', text: 'You wait, then crush. Is that all that is left of us?', ms: 3800 };
    return { who: 'Hero?', text: 'This is how we fight. Every step of it is ours.', ms: 3200 };
  },
  mid: [{ who: 'Hero?', text: 'How did we become so cold?', ms: 3000 }],
  low: [{ who: 'Hero?', text: 'Where is our judgment?', ms: 3000 }],
  defeat: [
    { who: 'Hero?', text: '...You remember them now. Do not forget again.', ms: 4000 }
  ]
};
