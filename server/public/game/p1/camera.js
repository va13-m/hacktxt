class Camera
{
    constructor(scene){
		// reference to the main scene
		this.scene = scene;
		
		// camera world coordinates
		this.x = 0;
		this.y = 2000; // Keep this height to see all lanes
		this.z = 0; // This will be the "looped" Z position
        this.worldZ = 0; // Tracks the non-looped Z position
		
		// Z-distance between camera and player sprite (for clipping)
		this.distToPlayer = 500;
		
		// Z-distance between camera and normalized projection plane
		this.distToPlane = null;

        // This is the "leash" distance. We'll find the *lead* car and
        // set the camera's Z to be (leadCar.z - followDistance).
        // 2500 keeps the car in the "middle distance" of the screen.
        this.followDistance = 2500; 
	}
	
	/**
	* Initializes camera (must be called when initializing game or changing settings).
	*/	
	init(){
		this.distToPlane = 1 / (this.y / this.distToPlayer);
	}	
	
	/**
	* Updates camera position.
	*/	
	update(dt){
		// references
		var circuit = this.scene.circuit;
        var players = this.scene.players;
        if (!players || players.length === 0) return;

		// Keep the camera centered on the road
		this.x = 0;

        // Find the Z position of the *lead* car by checking
        // their stable, non-looping worldZ values.
        
        let leadWorldZ = -Infinity;

        for (const player of players) {
            if (player.worldZ > leadWorldZ) {
                leadWorldZ = player.worldZ;
            }
        }

        // If leadWorldZ is still -Infinity, it means we "lost" all cars.
        // Do NOT update the camera, or it will cause a NaN glitch.
        if (leadWorldZ !== -Infinity) {
		    // Set the camera's "world" Z to be a fixed distance behind the lead car
            this.worldZ = leadWorldZ - this.followDistance;
            
            // The looped 'z' is only for road segment lookups
            this.z = this.worldZ % circuit.roadLength;
            if (this.z < 0) this.z += circuit.roadLength;
        }
	}
}
