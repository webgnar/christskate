import * as THREE from 'three';

export class Skateboard {
    constructor() {
        // Main group for the entire skateboard
        this.group = new THREE.Group();
        
        // Store references to skateboard parts
        this.parts = {
            deck: null,
            trucks: {
                front: {
                    baseplate: null,
                    hanger: null,
                    axle: null
                },
                back: {
                    baseplate: null,
                    hanger: null,
                    axle: null
                }
            },
            wheels: {
                frontLeft: null,
                frontRight: null,
                backLeft: null,
                backRight: null
            },
            lights: {
                underGlow: null
            }
        };

        // Materials
        this.materials = {
            deck: new THREE.MeshStandardMaterial({ 
                color: 0xd4b885,  // Light wood color
                roughness: 0.7,
                metalness: 0.0
            }),
            metal: new THREE.MeshStandardMaterial({ 
                color: 0x888888,
                roughness: 0.3,
                metalness: 0.8
            }),
            wheels: new THREE.MeshStandardMaterial({ 
                color: 0xf0f0f0,  // Light cream color
                roughness: 0.5,
                metalness: 0.1
            })
        };

        // Skateboard state
        this.state = {
            wheelRotation: 0,
            truckAngle: 0
        };

        // Create detailed skateboard
        this.createDetailedDeck();
        
        // Add underglow light
        this.createUnderGlow();
    }

    createDetailedDeck() {
        // Remove old deck if it exists
        if (this.parts.deck) {
            this.group.remove(this.parts.deck);
        }

        // Deck dimensions (in our unit scale)
        const length = 2.0;  // About 32 inches
        const width = 0.6;   // About 8 inches
        const thickness = 0.05;  // About 0.5 inches
        const segments = {
            length: 32,  // More segments for smoother curves
            width: 12,
            height: 1
        };

        // Create geometry
        const geometry = new THREE.BoxGeometry(
            width,
            thickness,
            length,
            segments.width,
            segments.height,
            segments.length
        );

        // Get vertices for modification
        const positionAttribute = geometry.getAttribute('position');
        const positions = positionAttribute.array;

        // Modify vertices for deck shape
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];     // Width
            const y = positions[i + 1]; // Height
            const z = positions[i + 2]; // Length

            // Add concave (across width)
            const concaveAmount = 0.1;
            positions[i + 1] += Math.pow(x / (width / 2), 2) * concaveAmount;

            // Add nose and tail curves
            const kickAmount = 0.15;
            const kickStart = 0.7; // Where the kick starts (percentage from center)
            const relativeZ = z / (length / 2);
            if (Math.abs(relativeZ) > kickStart) {
                const kickCurve = Math.pow((Math.abs(relativeZ) - kickStart) / (1 - kickStart), 2);
                positions[i + 1] += kickCurve * kickAmount * Math.sign(z);
            }
        }

        // Update geometry
        positionAttribute.needsUpdate = true;
        geometry.computeVertexNormals();

        // Create mesh with wood material
        this.parts.deck = new THREE.Mesh(geometry, this.materials.deck);
        this.parts.deck.castShadow = true;
        this.parts.deck.receiveShadow = true;

        // Position deck
        this.parts.deck.position.y = 0.1;  // Slight lift for trucks
        this.parts.deck.rotation.y = Math.PI / 2;  // Rotate to match skateboard direction

        // Add to group
        this.group.add(this.parts.deck);

        // Create and add trucks and wheels
        this.createTrucks();
        this.createWheels();
    }

    createTrucks() {
        const truckPositions = {
            front: 0.7,   // Distance from center
            back: -0.7
        };

        // Create both trucks (identical geometry, different positions)
        ['front', 'back'].forEach(position => {
            // Baseplate
            const baseplate = new THREE.Mesh(
                new THREE.BoxGeometry(0.25, 0.05, 0.15),  // Swapped width and depth
                this.materials.metal
            );
            baseplate.position.set(truckPositions[position], 0.08, 0);  // Moved up 0.1 from -0.02
            this.parts.trucks[position].baseplate = baseplate;
            this.group.add(baseplate);

            // Hanger (T-shaped)
            const hanger = new THREE.Mesh(
                new THREE.BoxGeometry(0.15, 0.12, 0.4),  // Swapped width and depth
                this.materials.metal
            );
            hanger.position.set(truckPositions[position], 0, 0);  // Moved up 0.1 from -0.1
            this.parts.trucks[position].hanger = hanger;
            this.group.add(hanger);

            // Axle
            const axle = new THREE.Mesh(
                new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8),
                this.materials.metal
            );
            axle.rotation.z = Math.PI / 2;  // Rotate to align with truck
            axle.position.set(truckPositions[position], 0, 0);  // Moved up 0.1 from -0.1
            this.parts.trucks[position].axle = axle;
            this.group.add(axle);
        });
    }

    createWheels() {
        const wheelPositions = {
            x: 0.7,      // Same as truck positions
            y: -0.05,    // Height from deck (moved up 0.1 from -0.15)
            z: 0.22      // Distance from center
        };

        // Create all four wheels (identical geometry, different positions)
        [
            { name: 'frontLeft', x: wheelPositions.x, z: wheelPositions.z },
            { name: 'frontRight', x: wheelPositions.x, z: -wheelPositions.z },
            { name: 'backLeft', x: -wheelPositions.x, z: wheelPositions.z },
            { name: 'backRight', x: -wheelPositions.x, z: -wheelPositions.z }
        ].forEach(pos => {
            const wheel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16),
                this.materials.wheels
            );
            wheel.rotation.z = Math.PI / 2;  // Align with axle
            wheel.position.set(pos.x, wheelPositions.y, pos.z);
            this.parts.wheels[pos.name] = wheel;
            this.group.add(wheel);
        });
    }

    createUnderGlow() {
        // Create a blue point light
        const light = new THREE.PointLight(0x0066ff, 2, 3);
        light.position.set(0, -0.2, 0); // Position under the board
        
        // Enable shadow casting
        light.castShadow = true;
        
        // Optimize shadow settings
        light.shadow.mapSize.width = 512;
        light.shadow.mapSize.height = 512;
        light.shadow.camera.near = 0.1;
        light.shadow.camera.far = 4;
        
        this.parts.lights.underGlow = light;
        this.group.add(light);
    }

    // Animation methods
    update(deltaTime, speed) {
        // Update wheel rotation based on speed
        this.state.wheelRotation += speed * deltaTime;
        this.updateWheelRotations();
    }

    turn(angle) {
        // Will handle truck rotation for turning
        this.state.truckAngle = angle;
        this.updateTruckRotations();
    }

    updateWheelRotations() {
        // Update all wheels with the same rotation
        Object.values(this.parts.wheels).forEach(wheel => {
            if (wheel) {
                wheel.rotation.z = Math.PI / 2 + this.state.wheelRotation;
            }
        });
    }

    updateTruckRotations() {
        // Update both trucks symmetrically
        ['front', 'back'].forEach(position => {
            if (this.parts.trucks[position].hanger) {
                // Rotate the hanger and its attached axle and wheels
                const rotation = position === 'front' ? this.state.truckAngle : -this.state.truckAngle;
                this.parts.trucks[position].hanger.rotation.y = rotation;
                this.parts.trucks[position].axle.rotation.y = rotation;
            }
        });
    }

    getObject() {
        return this.group;
    }

    setTexture(partName, texture) {
        if (this.materials[partName]) {
            this.materials[partName].map = texture;
            this.materials[partName].needsUpdate = true;
        }
    }
} 