import Phaser from "phaser";
import { GameScene } from "./scenes/GameScene";
import "./style.css";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#090b14",
  width: 1280,
  height: 720,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720
  },
  physics: {
    default: "arcade",
    arcade: { gravity: { x: 0, y: 1500 }, debug: false }
  },
  render: {
    antialias: false,
    pixelArt: true,
    roundPixels: true
  },
  scene: [GameScene]
};

const game = new Phaser.Game(config);

window.addEventListener("beforeunload", () => game.destroy(true));
