class Player
{
    constructor(scene, index, nameText){
		// reference to the main scene
		this.scene = scene;
		this.index = index;
		
		// reference to the player sprite
		this.sprite = scene.sprites[this.index];
        this.nameText = nameText; // Store the text object

		// player world coordinates
		this.x = 0;
		this.y = 0;
		this.z = 0; // This will be the "looped" Z position
        this.worldZ = 0; // Tracks the non-looped Z position
		this.w = (this.sprite.width/1000)*2;
		
		// player screen coordinates
		this.screen = {x:0, y:0, w:0, h:0};
		
		// store base sprite width (will be set in init)
		this.base_sprite_width = 0;
		
		// base max speed
		this.baseMaxSpeed = ((scene.circuit.segmentLength) / (1/60)) / 4.0;
		
        // Give a wider random speed range
        this.maxPersonalSpeed = this.baseMaxSpeed * (0.9 + Math.random() * 0.3); // 90% to 120% of base
        this.minPersonalSpeed = this.maxPersonalSpeed * 0.7; // 70% of their max speed

        // For catch-up rule
        this.offScreenTimer = 0;
        this.isCatchingUp = false;

		// driving control parameters
		this.speed = 0;							// current speed
	}
	
	/**
	* Initializes player (must be called when initializing game or changing settings).
	*/	
	init(){		
		// store the base sprite width for scaling calculations
		this.base_sprite_width = this.sprite.width;
	
		// set the player screen size (base)
		this.screen.w = this.sprite.width;
		this.screen.h = this.sprite.height;
				
		// set the player screen position (will be overwritten by projection)
		this.screen.x = 0;
		this.screen.y = 0;
	}
	
	/**
	* Restarts player.
	*/	
	restart(){
		// position car in the center of its lane
		const numLanes = this.scene.circuit.roadLanes;
        const laneWidth = 2 / numLanes;
        this.x = -1 + (laneWidth / 2) + (this.index * laneWidth);

		this.y = 0;
		this.z = 0;
        this.worldZ = 0; // Reset worldZ on restart
		
        // Reset catch-up state
        this.offScreenTimer = 0;
        this.isCatchingUp = false;
		this.speed = this.maxPersonalSpeed; // Start at their max speed
	}
	
	/**
	* Updates player position.
	*/	
	update(dt){		
		// references to the scene objects
		var circuit = this.scene.circuit;
		var camera = this.scene.camera;

        // Force text to be invisible at the start of every frame.
        this.nameText.setVisible(false);
		
		// ---------------------------------------------------------------------------------
        // Randomly change speed (only if not catching up)
        // ---------------------------------------------------------------------------------
        if (!this.isCatchingUp && Math.random() < 0.005) { 
            if (this.speed === this.maxPersonalSpeed) {
                this.speed = this.minPersonalSpeed;
            } else {
                this.speed = this.maxPersonalSpeed;
            }
        }

		// ---------------------------------------------------------------------------------
		// Moving in Z-direction
		// ---------------------------------------------------------------------------------
		
        // Increment the stable, non-looping worldZ
        this.worldZ += this.speed * dt;
        
        // The looped 'z' is only for road segment lookups
		this.z = this.worldZ % circuit.roadLength;

		// ---------------------------------------------------------------------------------
		// Project 3D coordinates to screen coordinates
		// ---------------------------------------------------------------------------------
		
        var transZ = this.worldZ - camera.worldZ;

		// Check if car is on screen or off screen
		if (transZ <= camera.distToPlayer) {
			// CAR IS OFF-SCREEN (BEHIND CAMERA)
            this.sprite.visible = false;
            
            // Check if this car is allowed to be off-screen
            if (this.scene.offScreenCarCount < 2 || this.isCatchingUp) {
                if (!this.isCatchingUp) {
                    this.scene.offScreenCarCount++; // Increment count
                }
                
                // Handle 1-2 second rule
                this.offScreenTimer += dt;
                if (this.offScreenTimer > 1.0 && !this.isCatchingUp) { 
                    this.isCatchingUp = true;
                    this.speed = this.maxPersonalSpeed * 2.0; 
                }
                return; // Don't render
            } else {
                // No, 2 cars are already off-screen. Force this one to boost.
                this.isCatchingUp = true;
                this.speed = this.maxPersonalSpeed * 2.0;
                // DO NOT RETURN. Fall through to the render logic.
            }
		}
        
        // CAR IS ON-SCREEN
        this.sprite.visible = true;

        // Reset timer and catch-up speed if we are back on screen
        if (this.isCatchingUp) {
            if (transZ > camera.distToPlayer + 500) { // 500 = buffer
                this.isCatchingUp = false;
                this.speed = this.maxPersonalSpeed; // Return to normal
            }
        }
        this.offScreenTimer = 0;
        
        // Scaling factor
        var scale = camera.distToPlane / transZ;
        
        // Projection calculations
        var transX = (this.x * circuit.roadWidth) - camera.x;
        var transY = this.y - camera.y;
        var projectedX = scale * transX;
        var projectedY = scale * transY;
        
        // --- SPAM BUG FIX ---
        // Final check. Only proceed if ALL projection values are finite.
        if (isFinite(scale) && isFinite(projectedX) && isFinite(projectedY)) {
        
            // Set screen coordinates
            this.screen.x = Math.round((1 + projectedX) * SCREEN_CX);
            this.screen.y = Math.round((1 - projectedY) * SCREEN_CY);
            
            // Scale the sprite
            var carWorldWidth = 450;
            var K = (carWorldWidth * SCREEN_CX) / this.base_sprite_width;
            var spriteScale = scale * K;
            
            spriteScale = Math.min(spriteScale, 5); // Clamp sprite scale
            this.sprite.setScale(spriteScale);

            // Calculate a separate, clamped scale for the text
            let textScale = scale * 150; 
            textScale = Math.max(0.5, Math.min(textScale, 2.5)); 

            // Position and scale the name text
            this.nameText.x = this.screen.x;
            this.nameText.y = this.screen.y - (this.sprite.displayHeight / 2) - (60 * textScale); 
            this.nameText.setScale(textScale);
            
            // NOW make it visible
            this.nameText.setVisible(true);
        } else {
            // Failsafe: if coordinates are bad, keep everything invisible.
            this.sprite.visible = false;
            // nameText is already invisible from the top of the update()
        }
	}
}
