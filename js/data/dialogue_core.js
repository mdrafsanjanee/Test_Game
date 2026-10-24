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

// The Mirror speaks from the player's record, and its story unfolds during the fight:
// it is the hero's own soul, trapped in the chaos stone, trying to stop him from becoming what he fought.
// R = TG.Record, p = TG.Record.profile(5), style = 'flank' | 'direct' | 'mixed'
TG.Dialogue.mirror = {
  intro: function (R, p, style) {
    var out = [{ who: 'Hero?', text: 'You came all this way. Look at me.', ms: 2800 }];
    var kills = R.count('kill'), spares = R.count('spare');
    if (kills > 0) out.push({ who: 'Hero?', text: 'You struck down ' + (kills > 1 ? kills + ' of them' : 'one of them') + '. They were only guarding their homes.', ms: 4200 });
    else if (spares > 0) out.push({ who: 'Hero?', text: 'You spared ' + (spares > 1 ? spares : 'one') + '. Then why did you keep swinging at the rest?', ms: 4200 });
    else out.push({ who: 'Hero?', text: 'Every one of them was defending something. Did you ask what?', ms: 3600 });
    return out;
  },

  // said once it has lost a fifth of its strength; names how you actually fight
  habit: function (R, p, style) {
    if (style === 'flank') return [{ who: 'Hero?', text: 'You always slip behind them. Did any of them ever see you coming?', ms: 4200 }];
    if (style === 'direct') return [{ who: 'Hero?', text: 'You walk straight in, every time. Did you ever look at who was in front of you?', ms: 4400 }];
    if (p.light > 1.6) return [{ who: 'Hero?', text: 'You never stop swinging. Did you ever stop to listen?', ms: 4000 }];
    if (p.dash + p.roll > 0.6) return [{ who: 'Hero?', text: 'You run from every blow. They could not run. This was their home.', ms: 4200 }];
    return [{ who: 'Hero?', text: 'This is how we fight. Every step of it is ours.', ms: 3200 }];
  },
  mid: [
    { who: 'Hero?', text: 'I am not a monster the stone made. It only gave me a mouth.', ms: 3600 },
    { who: 'Hero?', text: 'How did we become so cold?', ms: 2800 }
  ],
  low: [
    { who: 'Hero?', text: 'When the chaos stone woke, it needed something to hold. It took what you stopped using.', ms: 4600 },
    { who: 'Hero?', text: 'Where is our judgment?', ms: 3000 }
  ],

  // the protective layer breaks
  shatter: [
    { who: 'Hero?', text: 'That was never armour. It was the only thing holding me back from you.', ms: 4600 },
    { who: 'Hero?', text: 'Now it is gone. Every blow you land, you will feel.', ms: 4000 }
  ],
  p2a: [{ who: 'Hero?', text: 'Do you feel it? It always came back to you. You never felt it before.', ms: 4600 }],
  p2b: [
    { who: 'Hero?', text: 'I am your soul. The stone trapped the part of you that would have stopped.', ms: 4600 },
    { who: 'Hero?', text: 'Please. Put the blade down.', ms: 3000 }
  ],
  p2c: [{ who: 'Hero?', text: 'I cannot let you finish this. I cannot be the thing that kills you.', ms: 4400 }],

  // the way out: stop swinging
  yield: [
    { who: 'Hero?', text: '...You stopped.', ms: 2600 },
    { who: 'Hero?', text: 'Do you hear that? That quiet is all I was ever waiting for.', ms: 4200 }
  ],
  unyield: [{ who: 'Hero?', text: '...Then I will have to stop you myself.', ms: 3000 }],
  forgiven: [
    { who: 'Hero?', text: 'Thank you for remembering them.', ms: 3400 },
    { who: 'Hero?', text: 'We were one person. Let us finally be one again.', ms: 4400 }
  ],

  // you finished it, and so did it finish you
  mutual: [
    { who: 'Hero?', text: '...There. Now we both know what it cost.', ms: 4200 },
    { who: 'Hero?', text: 'Do not forget them.', ms: 3200 }
  ],
  defeat: [
    { who: 'Hero?', text: '...You remember them now. Do not forget again.', ms: 4000 }
  ]
};
