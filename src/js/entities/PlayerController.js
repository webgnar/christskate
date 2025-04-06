import * as THREE from 'three';

export class PlayerController {
    constructor(character) {
        this.character = character;
        
        // Movement state
        this.moveDirection = new THREE.Vector3();
        this.isMoving = false;
        
        // Control states
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false,
            ollie: false
        };
        
        // Movement parameters
        this.moveSpeed = 10;
        this.turnSpeed = Math.PI / 4;  // 45 degrees per second
        
        // Bind keyboard events
        this.setupInputHandlers();
    }

    setupInputHandlers() {
        // Keyboard down handler
        document.addEventListener('keydown', (event) => {
            switch(event.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.keys.forward = true;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.keys.backward = true;
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.keys.left = true;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.keys.right = true;
                    break;
                case 'Space':
                    this.keys.jump = true;
                    break;
                case 'KeyE':
                    this.keys.ollie = true;
                    break;
            }
        });

        // Keyboard up handler
        document.addEventListener('keyup', (event) => {
            switch(event.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.keys.forward = false;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.keys.backward = false;
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.keys.left = false;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.keys.right = false;
                    break;
                case 'Space':
                    this.keys.jump = false;
                    break;
                case 'KeyE':
                    this.keys.ollie = false;
                    break;
            }
        });
    }

    update(deltaTime) {
        // Reset movement direction
        this.moveDirection.set(0, 0, 0);
        this.isMoving = false;

        // Calculate movement direction based on keys
        if (this.keys.forward) {
            this.moveDirection.z -= 1;
            this.isMoving = true;
        }
        if (this.keys.backward) {
            this.moveDirection.z += 1;
            this.isMoving = true;
        }
        if (this.keys.left) {
            // Turn left
            this.character.turn(-this.turnSpeed * deltaTime);
        }
        if (this.keys.right) {
            // Turn right
            this.character.turn(this.turnSpeed * deltaTime);
        }

        // Normalize movement direction if moving
        if (this.isMoving) {
            this.moveDirection.normalize();
            
            // Apply movement in character's forward direction
            const characterRotation = this.character.getObject().rotation.y;
            const rotatedDirection = new THREE.Vector3(
                this.moveDirection.x * Math.cos(characterRotation) - this.moveDirection.z * Math.sin(characterRotation),
                0,
                this.moveDirection.x * Math.sin(characterRotation) + this.moveDirection.z * Math.cos(characterRotation)
            );
            
            // Apply movement
            this.character.move(rotatedDirection);
        }

        // Handle jump
        if (this.keys.jump) {
            this.character.jump();
        }

        // Handle ollie (can add more trick logic here)
        if (this.keys.ollie) {
            // TODO: Implement ollie trick
        }
    }

    // Method to check if player is moving
    isPlayerMoving() {
        return this.isMoving;
    }

    // Method to get current movement direction
    getMovementDirection() {
        return this.moveDirection.clone();
    }
} 