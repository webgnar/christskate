import * as THREE from 'three';

export class Physics {
    constructor() {
        // Basic physics constants
        this.gravity = -9.81;  // Standard gravity in m/s²
        this.groundLevel = 0;  // Y position of the ground
        
        // Skateboard dimensions
        this.skateboardHeight = 0.15;  // Height from wheel bottom to top of deck
        this.wheelOffset = 0.2;   // Total height needed for wheel clearance
        
        // Current state
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.isGrounded = false;
    }

    update(deltaTime, characterGroup) {
        if (!this.isGrounded) {
            // Apply gravity to velocity
            this.velocity.y += this.gravity * deltaTime;
            
            // Update position based on velocity
            characterGroup.position.y += this.velocity.y * deltaTime;
        }

        // Ground collision check - now using wheel position with proper offset
        const wheelBottomY = characterGroup.position.y - (this.skateboardHeight + this.wheelOffset);
        
        if (wheelBottomY <= this.groundLevel) {
            // Position the character so the wheels are exactly at ground level
            characterGroup.position.y = this.groundLevel + this.skateboardHeight + this.wheelOffset;
            this.velocity.y = 0;
            this.isGrounded = true;
        } else {
            this.isGrounded = false;
        }
    }

    // Reset physics state
    reset() {
        this.velocity.set(0, 0, 0);
        this.isGrounded = false;
    }

    // Check if object is on the ground
    isObjectGrounded() {
        return this.isGrounded;
    }
} 