import Phaser from "phaser";
import { InputController } from "../systems/InputController";

type CombatAction = "attack" | "heavy" | "special";

export class GameScene extends Phaser.Scene {
  private controls!: InputController;
  private player!: Phaser.Physics.Arcade.Sprite;
  private enemy!: Phaser.Physics.Arcade.Sprite;
  private enemyHealth = 100;
  private enemyDirection: 1 | -1 = -1;
  private lastEnemyHit = 0;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private hud!: Phaser.GameObjects.Container;
  private prompt!: Phaser.GameObjects.Text;
  private statusPanel!: Phaser.GameObjects.Container;
  private paused = false;
  private attacking = false;
  private dodging = false;
  private weaponIndex = 0;
  private health = 100;
  private energy = 100;
  private lastDodge = 0;
  private lastSpecial = 0;
  private facing: 1 | -1 = 1;
  private readonly weapons = ["VOID EDGE", "TWIN FANGS", "PHASE CASTER"];
  private readonly worldWidth = 3600;

  constructor() {
    super("GameScene");
  }

  create(): void {
    this.createTextures();
    this.createWorld();
    this.createPlayer();
    this.createEnemy();
    this.createInterface();
    this.controls = new InputController(this);

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemy, this.platforms);
    this.cameras.main.startFollow(this.player, true, 0.085, 0.085);
    this.cameras.main.setBounds(0, 0, this.worldWidth, 720);
    this.cameras.main.setDeadzone(250, 120);
    this.cameras.main.setBackgroundColor("#0b1020");

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.button === 0 && !this.paused && !this.statusPanel.visible) {
        this.performAttack("attack", this.time.now);
      }
    });

    this.add.text(44, 670, "ASHEN VERGE  /  THE FIRST WOUND", {
      fontFamily: "DM Mono, monospace", fontSize: "10px",
      color: "#74809a", letterSpacing: 2
    }).setScrollFactor(0).setDepth(30);

    this.cameras.main.fadeIn(900, 7, 9, 18);
  }

  private createTextures(): void {
    // Crisp, hand-authored pixel frames. Each pose is its own texture so Phaser
    // can animate the fighter without scaling or smoothing a vector placeholder.
    const makeFrame = (key: string, pose: number, foe = false) => {
      const g = this.make.graphics({ x: 0, y: 0 });
      const px = (x: number, y: number, w: number, h: number, c: number) => {
        g.fillStyle(c, 1); g.fillRect(x, y, w, h);
      };
      const outline = foe ? 0x160f20 : 0x11111b;
      const skin = foe ? 0x9d7898 : 0xd9b99d;
      const cloth = foe ? 0x39243e : 0x20283b;
      const trim = foe ? 0xb65c91 : 0x8297bd;
      const glow = foe ? 0xff82c5 : 0xa9d8ef;
      const bob = pose === 1 ? -2 : pose === 3 ? 1 : 0;
      const stride = pose === 1 ? 5 : pose === 3 ? -5 : pose === 2 ? 2 : 0;

      // Rear silhouette, boots and split coat.
      px(21, 49 + bob, 26, 29, outline);
      px(24, 52 + bob, 20, 26, cloth);
      px(19, 70 + stride, 11, 20, outline);
      px(36, 70 - stride, 11, 20, outline);
      px(21, 73 + stride, 9, 14, foe ? 0x24172a : 0x30364b);
      px(38, 73 - stride, 8, 14, foe ? 0x24172a : 0x30364b);
      px(17, 85 + stride, 16, 5, outline);
      px(35, 85 - stride, 16, 5, outline);
      px(25, 55 + bob, 4, 18, trim);
      px(37, 55 + bob, 3, 17, trim);
      // Shoulders, torso plates and belt.
      px(15, 39 + bob, 38, 20, outline);
      px(19, 42 + bob, 30, 16, cloth);
      px(14, 42 + bob, 9, 13, trim);
      px(45, 41 + bob, 10, 14, outline);
      px(47, 43 + bob, 6, 10, trim);
      px(23, 46 + bob, 22, 5, foe ? 0x5a3156 : 0x566b91);
      px(27, 52 + bob, 13, 3, outline);
      px(31, 51 + bob, 5, 5, glow);
      // Neck and head, with a readable hair silhouette and face profile.
      px(29, 31 + bob, 12, 12, outline);
      px(25, 12 + bob, 23, 25, outline);
      px(28, 15 + bob, 17, 18, skin);
      px(26, 12 + bob, 22, 8, foe ? 0x25172d : 0x171923);
      px(24, 17 + bob, 7, 12, foe ? 0x25172d : 0x171923);
      px(42, 19 + bob, 5, 4, outline);
      px(41, 22 + bob, 3, 2, glow);
      px(29, 29 + bob, 12, 3, foe ? 0x6f456d : 0xb18c83);
      // Scarf / trailing mantle, broken into hard-edged pixel clusters.
      if (!foe) {
        px(12 - (pose === 2 ? 5 : 0), 43 + bob, 13, 7, 0x697da4);
        px(7 - (pose === 2 ? 7 : 0), 49 + bob, 13, 5, 0x394765);
        px(3 - (pose === 2 ? 8 : 0), 54 + bob, 12, 4, 0x252d43);
      } else {
        px(8, 44 + bob, 15, 7, 0x6f3a69);
        px(2, 51 + bob, 13, 5, 0x40243f);
        px(0, 56 + bob, 11, 4, 0x27192d);
      }
      // Foreground arm and weapon pose.
      const armY = pose === 2 ? 34 : 43 + bob;
      px(43, armY, 9, 8, outline);
      px(47, armY + 5, 7, 8, skin);
      if (!foe) {
        const bladeX = pose === 2 ? 52 : 51;
        const bladeY = pose === 2 ? 18 : 30 + bob;
        px(bladeX, bladeY, 4, 29, 0xc9d9e8);
        px(bladeX + 1, bladeY - 5, 2, 7, 0xf3f2df);
        px(bladeX - 2, bladeY + 23, 8, 4, 0x9b79bf);
        px(bladeX + 1, bladeY + 28, 2, 5, outline);
      } else {
        px(48, 36 + bob, 8, 7, 0x24172a);
        px(53, 41 + bob, 5, 4, 0xd15e9c);
      }
      // Small highlights make the silhouette legible at native pixel scale.
      px(28, 16 + bob, 10, 2, foe ? 0x55304f : 0x3c455d);
      px(20, 43 + bob, 7, 2, foe ? 0x9e5487 : 0xa6b6d2);
      g.generateTexture(key, 64, 96);
      g.destroy();
    };

    for (let i = 0; i < 4; i++) makeFrame(`hero_walk_${i}`, i);
    makeFrame("hero_idle_0", 0); makeFrame("hero_idle_1", 1);
    makeFrame("hero_attack_0", 2); makeFrame("hero_attack_1", 3);
    makeFrame("hero_attack_2", 2);
    makeFrame("hero_jump", 2); makeFrame("hero_dodge", 3);
    for (let i = 0; i < 4; i++) makeFrame(`hollow_walk_${i}`, i, true);
    makeFrame("hollow_idle_0", 0, true); makeFrame("hollow_idle_1", 1, true);

    const anim = (key: string, prefix: string, count: number, rate: number, repeat: number) =>
      this.anims.create({ key, frames: Array.from({ length: count }, (_, i) => ({ key: `${prefix}${i}` })), frameRate: rate, repeat });
    anim("hero_idle", "hero_idle_", 2, 3, -1);
    anim("hero_walk", "hero_walk_", 4, 10, -1);
    anim("hero_attack", "hero_attack_", 3, 15, 0);
    anim("hollow_idle", "hollow_idle_", 2, 3, -1);
    anim("hollow_walk", "hollow_walk_", 4, 7, -1);

    const floor = this.make.graphics({ x: 0, y: 0 });
    floor.fillStyle(0x171b2a); floor.fillRect(0, 0, 128, 40);
    floor.lineStyle(1, 0x34384d, 0.8); floor.lineBetween(0, 1, 128, 1);
    floor.lineStyle(1, 0x242a3b, 0.7);
    for (let x = 16; x < 128; x += 32) floor.lineBetween(x, 8, x - 9, 40);
    floor.generateTexture("floor", 128, 40); floor.destroy();
  }

  private createWorld(): void {
    const bg = this.add.graphics().setDepth(-20).setScrollFactor(0.2, 0.35);
    bg.fillGradientStyle(0x11172a, 0x11172a, 0x080b16, 0x080b16, 1);
    bg.fillRect(0, 0, 4500, 720);

    const moon = this.add.graphics().setDepth(-18).setScrollFactor(0.22);
    moon.fillStyle(0x8b8eb8, 0.08); moon.fillCircle(940, 170, 112);
    moon.fillStyle(0xbfc3e8, 0.16); moon.fillCircle(940, 170, 74);
    moon.fillStyle(0xe2dddc, 0.85); moon.fillCircle(940, 170, 53);
    moon.fillStyle(0x9da2c3, 0.18);
    moon.fillCircle(920, 151, 10); moon.fillCircle(963, 184, 14);
    moon.fillCircle(953, 137, 6);

    const distant = this.add.graphics().setDepth(-15).setScrollFactor(0.38, 0.65);
    distant.fillStyle(0x171c31);
    for (let x = -50; x < 4500; x += 260) {
      distant.fillTriangle(x, 530, x + 130, 220 + Phaser.Math.Between(-35, 60), x + 290, 530);
    }
    const ruins = this.add.graphics().setDepth(-10).setScrollFactor(0.62, 0.85);
    ruins.fillStyle(0x20243a);
    for (let x = 160; x < 4400; x += 560) {
      ruins.fillRect(x, 360, 32, 190);
      ruins.fillRect(x - 24, 350, 80, 18);
      ruins.fillRect(x + 8, 300, 14, 54);
    }

    const stars = this.add.graphics().setDepth(-19).setScrollFactor(0.15);
    for (let i = 0; i < 150; i++) {
      const x = Phaser.Math.Between(0, 4500);
      const y = Phaser.Math.Between(25, 400);
      stars.fillStyle(0xc5c9e8, Phaser.Math.FloatBetween(0.18, 0.65));
      stars.fillCircle(x, y, Phaser.Math.FloatBetween(0.6, 1.6));
    }

    this.platforms = this.physics.add.staticGroup();
    const ground = this.platforms.create(this.worldWidth / 2, 700, "floor")
      .setScale(this.worldWidth / 128, 1).refreshBody();
    ground.setVisible(false);

    for (const [x, y, width] of [[720, 555, 180], [1120, 475, 180], [1570, 555, 220], [2110, 485, 180], [2580, 555, 220], [3090, 465, 200]] as number[][]) {
      const ledge = this.add.rectangle(x, y, width, 18, 0x34364c).setDepth(2);
      ledge.setStrokeStyle(1, 0x77718f, 0.6);
      this.physics.add.existing(ledge, true);
      this.platforms.add(ledge);
      const glow = this.add.rectangle(x, y - 9, width - 8, 2, 0x9d82cb, 0.7).setDepth(3);
      glow.setBlendMode(Phaser.BlendModes.ADD);
    }

    const foreground = this.add.graphics().setDepth(12).setScrollFactor(1);
    foreground.fillStyle(0x090c16, 0.8);
    for (let x = 0; x < this.worldWidth; x += 190) {
      foreground.fillTriangle(x, 690, x + 55, 610 + Phaser.Math.Between(-20, 30), x + 110, 690);
    }

    this.add.text(560, 390, "THE ASHEN VERGE", {
      fontFamily: "Manrope, sans-serif", fontSize: "18px", color: "#9b91b5",
      letterSpacing: 8
    }).setAlpha(0.52).setDepth(-5);
  }

  private createPlayer(): void {
    this.player = this.physics.add.sprite(180, 590, "hero_idle_0");
    this.player.setDepth(8).setScale(1.65).play("hero_idle");
    this.player.setCollideWorldBounds(true);
    this.player.setDragX(1800);
    this.player.setMaxVelocity(360, 1100);
    this.player.setSize(27, 74).setOffset(18, 15);
    this.player.setBounce(0);
  }

  private createEnemy(): void {
    this.enemy = this.physics.add.sprite(620, 590, "hollow_idle_0");
    this.enemy.setDepth(8).setScale(1.65).play("hollow_idle").setCollideWorldBounds(true);
    this.enemy.setSize(34, 72).setOffset(15, 12);
    this.enemy.setBounce(0).setDragX(900).setMaxVelocity(150, 900);
    this.enemy.setTint(0xc7a0c9);
  }

  private createInterface(): void {
    this.hud = this.add.container(0, 0).setScrollFactor(0).setDepth(40);
    const plate = this.add.rectangle(170, 76, 292, 104, 0x0b0e19, 0.78).setOrigin(0.5);
    plate.setStrokeStyle(1, 0x55516f, 0.55);
    const name = this.add.text(38, 31, "THE WANDERER", {
      fontFamily: "Manrope, sans-serif", fontSize: "11px", color: "#e4dfed",
      fontStyle: "bold", letterSpacing: 2
    });
    const hpLabel = this.add.text(38, 57, "VITALITY", { fontFamily: "DM Mono", fontSize: "9px", color: "#9d9bb0" });
    const hpBack = this.add.rectangle(117, 75, 150, 7, 0x282536).setOrigin(0, 0.5);
    const hp = this.add.rectangle(117, 75, 150, 7, 0xb85d72).setOrigin(0, 0.5).setName("hpBar");
    const enLabel = this.add.text(38, 91, "VOID", { fontFamily: "DM Mono", fontSize: "9px", color: "#9d9bb0" });
    const enBack = this.add.rectangle(117, 109, 150, 5, 0x282536).setOrigin(0, 0.5);
    const en = this.add.rectangle(117, 109, 150, 5, 0x8d79c6).setOrigin(0, 0.5).setName("energyBar");
    this.hud.add([plate, name, hpLabel, hpBack, hp, enLabel, enBack, en]);

    const weapon = this.add.text(1240, 42, "01  /  VOID EDGE", {
      fontFamily: "DM Mono", fontSize: "11px", color: "#d6cce9",
      letterSpacing: 2
    }).setOrigin(1, 0);
    this.hud.add(weapon.setName("weaponLabel"));

    const controls = this.add.text(1240, 68,
      "A / D  MOVE     SPACE  JUMP\nJ  QUICK   K  HEAVY   L  VOID\nSHIFT  DODGE     Q  WEAPON", {
        fontFamily: "DM Mono", fontSize: "9px", color: "#a9a2bd",
        align: "right", lineSpacing: 7, letterSpacing: 1
      }).setOrigin(1, 0).setAlpha(0.9);
    this.hud.add(controls);

    const foeLabel = this.add.text(640, 32, "THE HOLLOW // 100", {
      fontFamily: "DM Mono", fontSize: "10px", color: "#d6a5c4", letterSpacing: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(41).setAlpha(0);
    foeLabel.setName("enemyLabel");
    this.hud.add(foeLabel);

    this.prompt = this.add.text(640, 625, "E  •  EXAMINE THE BROKEN SHRINE", {
      fontFamily: "DM Mono", fontSize: "11px", color: "#d7c9e9",
      backgroundColor: "#101321", padding: { x: 14, y: 9 }, letterSpacing: 1
    }).setOrigin(0.5).setScrollFactor(0).setDepth(41).setAlpha(0);

    this.statusPanel = this.add.container(640, 360).setScrollFactor(0).setDepth(60).setVisible(false);
    const panel = this.add.rectangle(0, 0, 430, 330, 0x0b0e19, 0.97).setStrokeStyle(1, 0x8274a5, 0.8);
    const title = this.add.text(-180, -135, "CHARACTER / FIELD STATUS", {
      fontFamily: "Manrope", fontSize: "15px", color: "#e8e0f3", fontStyle: "bold", letterSpacing: 2
    });
    const body = this.add.text(-180, -88,
      "THE WANDERER\nA nameless survivor drawn toward the wound in the sky.\n\nCURRENT REGION   Ashen Verge\nWEAPON              Void Edge\nDISCOVERIES       0 / 3\n\nMovement and combat are active. The wider journey\nwill be added after the controls are tuned.",
      { fontFamily: "DM Mono", fontSize: "11px", color: "#a9a5bd", lineSpacing: 9, wordWrap: { width: 360 } }
    );
    const close = this.add.text(0, 135, "TAB  /  CLOSE", {
      fontFamily: "DM Mono", fontSize: "10px", color: "#b9a7d7", letterSpacing: 2
    }).setOrigin(0.5);
    this.statusPanel.add([panel, title, body, close]);
  }

  update(time: number, delta: number): void {
    if (this.paused) return;
    if (this.controls.statusPressed) this.toggleStatus();
    if (this.statusPanel.visible) {
      if (this.controls.pausePressed) this.toggleStatus();
      return;
    }

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    this.updateEnemy(time);
    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.enemy.x, this.enemy.y) < 48 && time - this.lastEnemyHit > 1100 && this.enemyHealth > 0) {
      this.lastEnemyHit = time;
      this.health = Math.max(0, this.health - 9);
      this.cameras.main.shake(90, 0.002);
      this.player.setTint(0xe58b9d);
      this.time.delayedCall(180, () => this.player.clearTint());
      this.updateBars();
      if (this.health <= 0) this.respawnPlayer();
    }
    if (this.controls.left) {
      this.player.setAccelerationX(-1900);
      this.facing = -1;
    } else if (this.controls.right) {
      this.player.setAccelerationX(1900);
      this.facing = 1;
    } else {
      this.player.setAccelerationX(0);
    }
    this.player.setFlipX(this.facing < 0);\n    if (this.attacking) this.player.anims.play("hero_attack", true);\n    else if (!body.blocked.down) this.player.setTexture("hero_jump");\n    else if (this.dodging) this.player.setTexture("hero_dodge");\n    else if (Math.abs(body.velocity.x) > 35) this.player.anims.play("hero_walk", true);\n    else this.player.anims.play("hero_idle", true);

    if (this.controls.jumpPressed && body.blocked.down) {
      this.player.setVelocityY(-610);
      this.spawnDust(this.player.x, this.player.y + 42);
    }

    if (this.controls.dodgePressed && time - this.lastDodge > 850 && !this.dodging) {
      this.lastDodge = time;
      this.dodging = true;
      this.player.setVelocityX(this.facing * 620);
      this.player.setAlpha(0.45);
      this.time.delayedCall(230, () => {
        this.dodging = false;
        this.player.setAlpha(1);
      });
    }

    if (this.controls.attackPressed) this.performAttack("attack", time);
    if (this.controls.heavyPressed) this.performAttack("heavy", time);
    if (this.controls.specialPressed && time - this.lastSpecial > 4200 && this.energy >= 35) {
      this.lastSpecial = time;
      this.energy -= 35;
      this.performAttack("special", time);
      this.updateBars();
    }

    if (this.controls.switchPressed) {
      this.weaponIndex = (this.weaponIndex + 1) % this.weapons.length;
      const label = this.hud.getByName("weaponLabel") as Phaser.GameObjects.Text;
      label.setText(`0${this.weaponIndex + 1}  /  ${this.weapons[this.weaponIndex]}`);
    }

    if (this.controls.interactPressed) {
      this.prompt.setText("THE SHRINE IS COLD. SOMETHING ANSWERS FAR BELOW.");
      this.prompt.setAlpha(1);
      this.time.delayedCall(2200, () => this.prompt.setAlpha(0));
    }

    if (this.controls.pausePressed) this.togglePause();

    if (this.player.y > 820) {
      this.player.setPosition(180, 590);
      this.player.setVelocity(0, 0);
      this.cameras.main.flash(180, 120, 90, 150);
    }

    this.energy = Math.min(100, this.energy + delta * 0.003);
    this.updateBars();
  }

  private performAttack(action: CombatAction, time: number): void {
    if (this.attacking || this.dodging) return;
    this.attacking = true;
    const heavy = action === "heavy";
    const special = action === "special";
    const reach = special ? 170 : heavy ? 112 : 84;
    const y = this.player.y - (special ? 5 : 0);
    const slash = this.add.graphics().setDepth(20);
    const color = special ? 0xb69aff : heavy ? 0xe0b77e : 0x9dcae6;
    slash.lineStyle(special ? 8 : 5, color, 0.9);
    slash.beginPath();
    slash.arc(this.player.x + this.facing * 18, y, reach * 0.55,
      this.facing === 1 ? -1.15 : Math.PI - 1.15,
      this.facing === 1 ? 1.15 : Math.PI + 1.15, false);
    slash.strokePath();
    slash.setBlendMode(Phaser.BlendModes.ADD);
    if (this.enemyHealth > 0) {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.enemy.x, this.enemy.y);
      const inFront = (this.enemy.x - this.player.x) * this.facing > -18;
      if (distance < reach + 34 && inFront && Math.abs(this.enemy.y - this.player.y) < 75) {
        const damage = special ? 48 : heavy ? 30 : 16;
        this.enemyHealth = Math.max(0, this.enemyHealth - damage);
        this.enemy.setVelocityX(this.facing * (special ? 430 : heavy ? 300 : 190));
        this.enemy.setTint(0xffffff);
        this.time.delayedCall(110, () => { if (this.enemy.active) this.enemy.setTint(0xc7a0c9); });
        this.cameras.main.shake(75, 0.0025);
        const label = this.hud.getByName("enemyLabel") as Phaser.GameObjects.Text;
        label.setText(this.enemyHealth > 0 ? `THE HOLLOW // ${this.enemyHealth}` : "THE HOLLOW // BANISHED");
        label.setAlpha(1);
        if (this.enemyHealth <= 0) {
          this.enemy.setVelocity(0, 0);
          this.tweens.add({ targets: this.enemy, alpha: 0, scale: 0.2, duration: 650 });
          this.time.delayedCall(2600, () => {
            this.enemyHealth = 100;
            this.enemy.setPosition(this.player.x + 420, 590).setAlpha(1).setScale(1.65);
            (this.hud.getByName("enemyLabel") as Phaser.GameObjects.Text).setText("THE HOLLOW // 100");
          });
        }
      }
    }
    this.tweens.add({ targets: slash, alpha: 0, scale: 1.22, duration: special ? 420 : heavy ? 310 : 210, onComplete: () => slash.destroy() });
    this.cameras.main.shake(special ? 110 : 45, special ? 0.003 : 0.0015);
    this.player.setVelocityX(this.facing * (special ? 110 : heavy ? 40 : 70));
    this.time.delayedCall(special ? 460 : heavy ? 390 : 240, () => { this.attacking = false; });
    void time;
  }

  private updateEnemy(time: number): void {
    if (!this.enemy.active || this.enemyHealth <= 0) return;
    const distance = this.enemy.x - this.player.x;
    if (Math.abs(distance) < 330) {
      this.enemyDirection = distance < 0 ? -1 : 1;
      if (Math.abs(distance) > 54) this.enemy.setVelocityX(this.enemyDirection * 92);
      else this.enemy.setVelocityX(0);
      this.enemy.setFlipX(this.enemyDirection < 0);\n      this.enemy.anims.play(Math.abs(distance) > 54 ? "hollow_walk" : "hollow_idle", true);
      if (Math.abs(distance) < 95 && time - this.lastEnemyHit > 1100) this.enemy.setTint(0xe2a0bd);
    } else {
      this.enemy.setVelocityX(0);
    }
  }

  private respawnPlayer(): void {
    this.health = 100;
    this.player.setPosition(Math.max(180, this.enemy.x - 260), 590);
    this.player.setVelocity(0, 0);
    this.cameras.main.flash(220, 100, 70, 130);
    this.updateBars();
  }

  private spawnDust(x: number, y: number): void {
    for (let i = 0; i < 7; i++) {
      const p = this.add.circle(x + Phaser.Math.Between(-15, 15), y, Phaser.Math.Between(2, 4), 0xaaa0c4, 0.65).setDepth(9);
      this.tweens.add({ targets: p, x: p.x + Phaser.Math.Between(-28, 28), y: p.y - Phaser.Math.Between(12, 35), alpha: 0, duration: 350, onComplete: () => p.destroy() });
    }
  }

  private updateBars(): void {
    const hp = this.hud.getByName("hpBar") as Phaser.GameObjects.Rectangle;
    const energy = this.hud.getByName("energyBar") as Phaser.GameObjects.Rectangle;
    hp.width = 150 * this.health / 100;
    energy.width = 150 * this.energy / 100;
  }

  private toggleStatus(): void {
    if (this.paused) return;
    this.statusPanel.setVisible(!this.statusPanel.visible);
    this.physics.world.isPaused = this.statusPanel.visible;
  }

  private togglePause(): void {
    this.paused = !this.paused;
    this.physics.world.isPaused = this.paused;
    if (this.paused) {
      const shade = this.add.rectangle(640, 360, 1280, 720, 0x050711, 0.72).setScrollFactor(0).setDepth(80).setName("pauseShade");
      const label = this.add.text(640, 330, "PAUSED", { fontFamily: "Manrope", fontSize: "34px", color: "#eee8f5", letterSpacing: 9 }).setOrigin(0.5).setScrollFactor(0).setDepth(81).setName("pauseLabel");
      const hint = this.add.text(640, 390, "PRESS ESC TO RETURN", { fontFamily: "DM Mono", fontSize: "11px", color: "#aaa0bf", letterSpacing: 2 }).setOrigin(0.5).setScrollFactor(0).setDepth(81).setName("pauseHint");
      void shade; void label; void hint;
    } else {
      this.children.list.filter(child => ["pauseShade", "pauseLabel", "pauseHint"].includes(child.name)).forEach(child => child.destroy());
    }
  }
}