// End of the current build. Reads the Record and picks a closing note.
// Agent B: replace/extend TG.endings with the real endings (each: {when(R), title, text}).
TG.endings = [
  { id: 'mutual', when: function () { return TG.Story.flag('mirror_outcome') === 'mutual'; },
    title: 'The Last Reflection', text: 'You struck down the last of yourself, and it struck you back. The stone is quiet now.' },
  { id: 'forgiven', when: function () { return TG.Story.flag('mirror_outcome') === 'forgiven'; },
    title: 'One Again', text: 'You lowered the blade. What the stone had taken came home.' },
  { id: 'cold', when: function (R) { return R.count('kill') > R.count('spare'); },
    title: 'The Cold Blade', text: 'You won every fight. You did not ask what any of them were protecting.' },
  { id: 'merciful', when: function (R) { return R.count('spare') > 0 && R.count('kill') === 0; },
    title: 'The Open Hand', text: 'You could have ended them, and chose not to. The mirror remembers.' },
  { id: 'default', when: function () { return true; },
    title: 'The Reflection', text: 'You saw yourself. What you do with it is still yours to decide.' }
];

TG.SummaryScene = class extends Phaser.Scene {
  constructor() { super('Summary'); }

  create() {
    var W = TG.W, H = TG.H, R = TG.Record, st = { fontFamily: 'Georgia, serif', color: '#e8e6f0' };
    this.cameras.main.setBackgroundColor(0x040308);
    var end = TG.endings.filter(function (e) { return e.when(R); })[0];
    var p = R.profile(5);

    this.add.text(W / 2, 190, end.title, Object.assign({ fontSize: '48px', letterSpacing: 6 }, st)).setOrigin(0.5);
    this.add.text(W / 2, 270, end.text, Object.assign({ fontSize: '22px', align: 'center', wordWrap: { width: 880 }, fontStyle: 'italic', color: '#c9c4dc' }, st)).setOrigin(0.5);

    var style = [];
    if (p.light > 1.5) style.push('relentless');
    if (p.heavy > 0.3) style.push('patient');
    if (p.dash + p.roll > 0.6) style.push('evasive');
    if (p.air > 0.35) style.push('airborne');
    if (!style.length) style.push('measured');
    var lines = [
      'Spared: ' + R.count('spare') + '      Slain: ' + R.count('kill') + '      Falls: ' + R.save.deaths,
      'How you fought: ' + style.join(', ')
    ];
    this.add.text(W / 2, 400, lines.join('\n'), Object.assign({ fontSize: '18px', align: 'center', lineSpacing: 10, color: '#a7a2bd' }, st)).setOrigin(0.5);
    this.add.text(W / 2, 560, 'Enter  menu', Object.assign({ fontSize: '15px', color: '#6f6a86' }, st)).setOrigin(0.5);

    this.input.keyboard.on('keydown-ENTER', function () { this.scene.start('Menu'); }, this);
    this.cameras.main.fadeIn(900, 0, 0, 0);
    if (TG.Music) TG.Music.play('menu');
  }
};
