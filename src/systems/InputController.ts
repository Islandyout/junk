import Phaser from "phaser";

export class InputController {
  readonly keys: Record<string, Phaser.Input.Keyboard.Key>;
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) throw new Error("Keyboard input is unavailable.");

    this.cursors = keyboard.createCursorKeys();
    this.keys = keyboard.addKeys(
      "W,A,S,D,J,K,L,Q,E,TAB,ESC,SHIFT,SPACE"
    ) as Record<string, Phaser.Input.Keyboard.Key>;
  }

  get left(): boolean {
    return this.keys.A.isDown || this.cursors.left.isDown;
  }

  get right(): boolean {
    return this.keys.D.isDown || this.cursors.right.isDown;
  }

  get jumpPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.keys.W) ||
      Phaser.Input.Keyboard.JustDown(this.keys.SPACE) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.up);
  }

  get attackPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.keys.J);
  }

  get heavyPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.keys.K);
  }

  get specialPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.keys.L);
  }

  get dodgePressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.keys.SHIFT);
  }

  get interactPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.keys.E);
  }

  get switchPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.keys.Q);
  }

  get statusPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.keys.TAB);
  }

  get pausePressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.keys.ESC);
  }
}