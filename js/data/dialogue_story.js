// Story dialogue (Agent B). A line is a string or { who, text, ms }.
TG.Dialogue.ring_road = {
  relic: [
    { who: 'Guide', text: 'Someone left a ring here, a long time ago. Faintly warm, isn\'t it?', ms: 3800 },
    { who: 'Guide', text: 'Take it or leave it. It is your road.', ms: 2800 }
  ],
  taken: [
    { text: 'It fits perfectly. You cannot find the clasp.', ms: 3200 }
  ],
  skipped: [
    { text: 'You leave it on the stone and walk on.', ms: 2600 }
  ]
};

TG.Dialogue.cliff_betrayal = {
  intro: [
    { text: 'Three days later.', ms: 2200 },
    { who: 'Guide', text: 'Almost there. The Monster King\'s lair is just past the cliff.', ms: 3200 }
  ],
  edge: [
    { who: 'Guide', text: 'There. The lair, across the lava. We made it.', ms: 3200 },
    { who: 'Guide', text: 'You never asked why I knew the way so well.', ms: 3200 },
    { who: 'Guide', text: 'Thank you for carrying my war this far.', ms: 3200 }
  ],
  betray: [
    { who: 'Guide', text: 'The hero fell to the Monster King\'s trap. I alone survived.', ms: 3800 },
    { who: 'Guide', text: 'The royal army will need someone to lead it.', ms: 3200 }
  ],
  aftermathTaken: [
    { text: 'The ring drank the fire, and took its price.', ms: 3400 },
    { text: 'You crawl out of the ash. Something of you stayed in the lava.', ms: 4000 }
  ],
  aftermathDead: [
    { text: 'The lava takes all of you.', ms: 3200 },
    { text: 'It was only a ring. It would have been enough.', ms: 3600 }
  ]
};

TG.Dialogue.girl_guard = {
  intro: [
    { who: 'Hollow Attendant', text: 'The court is long over. I still sweep these halls. Nobody dances here anymore.', ms: 4600 },
    { who: 'Hollow Attendant', text: 'Please. Do not track the king\'s colours across my floor.', ms: 3400 }
  ],
  phase2: [{ who: 'Hollow Attendant', text: 'If I stop moving, I remember too much.', ms: 3200 }],
  defeat: [
    { who: 'Hollow Attendant', text: 'I only wanted the floors clean for when they came home.', ms: 4400 }
  ]
};
