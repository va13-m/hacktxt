/***********************************************************************************
* Pseudo-3D Racing game prototype
*
* @author		Srdjan Susnic 
* @copyright	2020 Ask For Game Task
* @website		http://www.askforgametask.com
*
/***********************************************************************************/

// ---------------------------------------------------------------------------------
// Global Constants
// ---------------------------------------------------------------------------------

// screen size
let SCREEN_W = window.innerWidth;
let SCREEN_H = window.innerHeight;
let SCREEN_CX = SCREEN_W / 2;
let SCREEN_CY = SCREEN_H / 2;

// game states
const STATE_INIT = 1;
const STATE_RESTART = 2;
const STATE_PLAY = 3;
const STATE_GAMEOVER = 4;

// ---------------------------------------------------------------------------------
// Global Variables
// ---------------------------------------------------------------------------------

// current state
var state = STATE_INIT;

// ---------------------------------------------------------------------------------
// Main Scene
// ---------------------------------------------------------------------------------

class MainScene extends Phaser.Scene
{
    constructor(){
		super({key: 'SceneMain'});
	}
	
	/**
	* Loads all assets.
	*/
	preload(){
		this.load.image('imgBack', '../assets/img_back.png');
		this.load.image('imgSky', '../assets/img_sky.png');
		this.load.image('imgHills', '../assets/img_hills.png');
		this.load.image('imgCity', '../assets/img_city.png');
		this.load.image('imgPlayer', '../assets/img_player.png');
	}

	/**
	* Creates all objects.
	*/
	create(){
		// backgrounds
		// this.sprBack = this.add.image(SCREEN_CX, SCREEN_CY, 'imgBack');
		// this.sprBack = this.add.image(SCREEN_CX, SCREEN_CY, 'imgSky');
		// this.sprBack = this.add.image(SCREEN_CX, SCREEN_CY, 'imgHills');
		// this.sprBack = this.add.image(SCREEN_CX, SCREEN_CY, 'imgCity');
		this.sprites = [this.add.image(0, 0, 'imgPlayer').setVisible(false)];
		// array of sprites that will be "manually" drawn on a rendering texture 
		// (that's why they must be invisible after creation)
		this.sprites = [];
        const carColors = [
            0x00BFFF, // Deep Sky Blue
            0x4169E1, // Royal Blue
            0xFFFACD, // Lemon Chiffon (Pale Yellow)
            0xFFD700, // Gold
            0xFFFFFF, // White
            0xF5F5F5  // White Smoke (Off-white)
        ];
        const carNames = ["Corolla", "Camry", "Prius", "Mirai", "Toyota Crown", "Supra"];
		const NUM_CARS = 6; 

        // 1. Create the invisible car sprites
        for (let i = 0; i < NUM_CARS; i++) {
            let carSprite = this.add.image(0, 0, 'imgPlayer').setVisible(false);
            carSprite.setTint(carColors[i]);
            this.sprites.push(carSprite);
        }
		
		// instances
        // 2. Create the circuit (which creates this.graphics and this.texture)
		this.circuit = new Circuit(this);
		
        // 3. Create the text objects (now drawn ON TOP of the texture)
        this.carNameTexts = []; 
        for (let i = 0; i < NUM_CARS; i++) {
            let nameText = this.add.text(0, 0, carNames[i], {
                fontFamily: 'Arial Black', // Bolder font
                fontSize: '80px', 
                color: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 10 // Thicker stroke
            }).setOrigin(0.5).setVisible(false); // Centered origin, initially invisible
            this.carNameTexts.push(nameText);
        }

        // 4. Create the players, passing them their sprites and text
		this.players = [];
        for (let i = 0; i < NUM_CARS; i++) {
            this.players.push(new Player(this, i, this.carNameTexts[i]));
        }

		this.camera = new Camera(this);
		this.settings = new Settings(this);

        // --- NEW --- Counter for off-screen cars guardrail
        this.offScreenCarCount = 0;
		
		// listener to pause game
		this.input.keyboard.on('keydown-P', function(){
			this.settings.txtPause.text = "[P] Resume";
			this.scene.pause();
			this.scene.launch('ScenePause');
		}, this);
		
		// listener on resume event
		this.events.on('resume', function(){
			this.settings.show();
		}, this);


  this.scale.on('resize', (gameSize) => {
    SCREEN_W = gameSize.width;
    SCREEN_H = gameSize.height;
    SCREEN_CX = SCREEN_W / 2;
    SCREEN_CY = SCREEN_H / 2;

    // tell subsystems to resize/recalc
    if (this.circuit?.onResize) this.circuit.onResize();
    if (this.player?.init) this.player.init();   // recalculates screen.x / screen.y
    if (this.camera?.init) this.camera.init();   // recalculates projection plane
  });


	}

	/**
	* Main Game Loop
	*/
	update(time, delta){
		switch(state){
			case STATE_INIT:
				this.camera.init();
				for(const player of this.players){
					player.init();
				}
				
				state = STATE_RESTART;
				break;
				
			case STATE_RESTART:
				this.circuit.create();
				for(const player of this.players){
					player.restart();
				}
				
				state = STATE_PLAY;
				break;
				
			case STATE_PLAY:
				// duration of the time period
				var dt = Math.min(1, delta/1000);
		
                // --- SPAM BUG FIX ---
                // 1. Update camera position first
                this.camera.update(dt);

                // --- NEW --- Reset off-screen counter each frame
                this.offScreenCarCount = 0;

                // 2. Update all players relative to the new camera position
				for(const player of this.players){
					player.update(dt);
				}
				
                // 3. Render the 3D world
				this.circuit.render3D();
				break;
				
			case STATE_GAMEOVER:
				break;
		}
	}
}

// ---------------------------------------------------------------------------------
// Pause Scene
// ---------------------------------------------------------------------------------

class PauseScene extends Phaser.Scene
{
    constructor(){
		super({key: 'ScenePause'});
	}
	
	create(){
		// listener to resume game
		this.input.keyboard.on('keydown-P', function(){
			this.scene.resume('SceneMain');
			this.scene.stop();
		}, this);		
	}
}

// ---------------------------------------------------------------------------------
// Initializing Phaser Game
// ---------------------------------------------------------------------------------

// game configuration
var config = {
    type: Phaser.AUTO,
    width: SCREEN_W,
    height: SCREEN_H,
	transparent: true, 
  backgroundColor: 'rgba(0,0,0,0)',
	scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
	
    scene: [MainScene, PauseScene]
};

// game instance
var game = new Phaser.Game(config);
