// Boots Phaser. Loaded last, after every manifest script.
(function () {
  var game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: TG.W,
    height: TG.H,
    backgroundColor: '#000000',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, powerPreference: 'low-power', batchSize: 2048 },
    fps: { target: 60, smoothStep: false },
    scene: [TG.BootScene, TG.MenuScene, TG.ArenaScene, TG.DecisionScene, TG.DeathScene, TG.SummaryScene, TG.CutsceneScene]
  });
  window.TG_GAME = game;
})();
