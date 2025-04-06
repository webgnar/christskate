import * as THREE from 'three';
import { Skateboard } from './Skateboard';
import { Physics } from './Physics';

export class Character {
    constructor() {
        // Main group that will contain all character parts
        this.group = new THREE.Group();
        
        // Create physics system
        this.physics = new Physics();
        
        // Create joints hierarchy
        this.joints = {
            // Spine represents the main body column
            spine: new THREE.Group(),
            
            // Arms
            leftShoulder: new THREE.Group(),
            rightShoulder: new THREE.Group(),
            leftElbow: new THREE.Group(),
            rightElbow: new THREE.Group(),
            
            // Legs
            leftHip: new THREE.Group(),
            rightHip: new THREE.Group(),
            leftKnee: new THREE.Group(),
            rightKnee: new THREE.Group()
        };
        
        // Store references to body parts for animations
        this.parts = {
            body: {
                head: null,
                torso: null,
                cross: null,  // Add reference for the cross
                pyramidHat: null,
                pyramidLight: null,
                pyramidGreenLight: null,
                pyramidCornerLights: null,
                torsoLight: null,
                headCornerLights: null
            },
            arms: {
                leftUpper: null,
                leftLower: null,
                rightUpper: null,
                rightLower: null
            },
            legs: {
                leftUpper: null,
                leftLower: null,
                rightUpper: null,
                rightLower: null,
                leftFoot: null,
                rightFoot: null
            }
        };

        // Create skateboard instance
        this.skateboard = new Skateboard();
        
        // Position skateboard
        this.skateboard.getObject().position.y = -0.15;  // Changed from -0.3 to -0.15

        // Materials object to store textures when loaded
        this.materials = {
            head: new THREE.MeshStandardMaterial({ color: 0xffffff }),
            torso: new THREE.MeshStandardMaterial({ 
                color: 0xffffff,  // Changed from orange to white
                emissive: 0xff69b4,  // Pink glow
                emissiveIntensity: 0.1  // Reduced glow intensity
            }),
            arms: new THREE.MeshStandardMaterial({ color: 0xffffff }),
            legs: new THREE.MeshStandardMaterial({ color: 0xffffff }),
            feet: new THREE.MeshStandardMaterial({ color: 0xffffff }),
            cross: new THREE.MeshStandardMaterial({ 
                color: 0xffff00,  // Yellow color
                emissive: 0xffff00,  // Same yellow for glow
                emissiveIntensity: 0.5  // Moderate glow
            })
        };

        // Character state
        this.state = {
            isJumping: false,
            isTurning: false,
            speed: 0,
            // Animation states
            currentAnimation: 'idle',
            animationTime: 0
        };

        // Set up joint hierarchy
        this.setupJointHierarchy();
        
        // Create the character
        this.createCharacter();
        
        // Add skateboard to character group
        this.group.add(this.skateboard.getObject());
        
        // Add character light
        this.createCharacterLight();
    }

    setupJointHierarchy() {
        // Add spine to main group
        this.group.add(this.joints.spine);
        
        // Position the spine up
        this.joints.spine.position.y = 0.6;
        
        // Add shoulder joints to spine
        this.joints.spine.add(this.joints.leftShoulder);
        this.joints.spine.add(this.joints.rightShoulder);
        
        // Add elbow joints to shoulders
        this.joints.leftShoulder.add(this.joints.leftElbow);
        this.joints.rightShoulder.add(this.joints.rightElbow);
        
        // Add hip joints to spine
        this.joints.spine.add(this.joints.leftHip);
        this.joints.spine.add(this.joints.rightHip);
        
        // Add knee joints to hips
        this.joints.leftHip.add(this.joints.leftKnee);
        this.joints.rightHip.add(this.joints.rightKnee);
        
        // Position joints
        // Shoulders
        this.joints.leftShoulder.position.set(0.65, 1.95, 0);
        this.joints.rightShoulder.position.set(-0.65, 1.95, 0);
        
        // Set initial shoulder rotations (arms slightly in)
        this.joints.leftShoulder.rotation.z = 0.2;  // Rotate left arm in
        this.joints.rightShoulder.rotation.z = -0.2;  // Rotate right arm in
        
        // Elbows (position relative to shoulders)
        this.joints.leftElbow.position.set(0, -0.6, 0);
        this.joints.rightElbow.position.set(0, -0.6, 0);
        
        // Hips - spread wider apart
        this.joints.leftHip.position.set(0.35, 0.95, 0);  // Changed from 0.2 to 0.35
        this.joints.rightHip.position.set(-0.35, 0.95, 0);  // Changed from -0.2 to -0.35
        
        // Knees (position relative to hips)
        this.joints.leftKnee.position.set(0, -0.7, 0);
        this.joints.rightKnee.position.set(0, -0.7, 0);

        // Set initial knee bend for skateboarding stance
        this.joints.leftKnee.rotation.x = 0.3;  // Initial knee bend
        this.joints.rightKnee.rotation.x = 0.3;  // Initial knee bend
    }

    createCharacter() {
        // Create body parts
        this.createHead();
        this.createTorso();
        this.createArms();
        this.createLegs();
        this.createCross();

        // Position the entire character
        this.group.position.y = 3.2; // Changed from 2.2 to 3.2 (1 unit higher)
        
        // Rotate the entire character group 270 degrees on Y axis (90 + 180 degrees)
        this.group.rotation.y = (Math.PI * 3) / 2;  // Original 90 degrees (PI/2) + 180 degrees (PI)
    }

    createHead() {
        const headGeometry = new THREE.BoxGeometry(1, 1, 1);
        this.parts.body.head = new THREE.Mesh(headGeometry, this.materials.head);
        this.parts.body.head.position.y = 2.5;
        this.parts.body.head.castShadow = true;

        // Create four corner cyan lights at bottom of head
        const headCornerLights = [];
        const cornerPositions = [
            { x: 0.5, z: 0.5 },   // Front Right
            { x: -0.5, z: 0.5 },  // Front Left
            { x: -0.5, z: -0.5 }, // Back Left
            { x: 0.5, z: -0.5 }   // Back Right
        ];
        
        for (let pos of cornerPositions) {
            // Create downward-facing corner light (cyan)
            const cornerLight = new THREE.PointLight(0x00ffff, 0.5, 4.0);  // Cyan color, same parameters as hat lights
            cornerLight.position.set(pos.x, -0.5, pos.z);  // Position at bottom of head
            
            // Enable shadow casting
            cornerLight.castShadow = true;
            cornerLight.shadow.mapSize.width = 512;
            cornerLight.shadow.mapSize.height = 512;
            cornerLight.shadow.camera.near = 0.1;
            cornerLight.shadow.camera.far = 5;
            
            headCornerLights.push(cornerLight);
            this.parts.body.head.add(cornerLight);
        }
        
        // Store reference to head lights
        this.parts.body.headCornerLights = headCornerLights;

        this.joints.spine.add(this.parts.body.head);

        // Add pyramid hat
        this.createPyramidHat();
    }

    createPyramidHat() {
        // Create pyramid geometry (wider than head)
        const pyramidGeometry = new THREE.ConeGeometry(1.0, 0.2, 4);  // Changed radius from 0.7 to 1.0
        
        // Gold material for the hat
        const goldMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0xFFD700,
            emissiveIntensity: 0.2
        });

        // Create pyramid mesh
        this.parts.body.pyramidHat = new THREE.Mesh(pyramidGeometry, goldMaterial);
        
        // Position the hat on top of the head
        this.parts.body.pyramidHat.position.y = 0.55;  // Half head height (0.5) + small gap (0.05)
        
        // Rotate the pyramid 45 degrees to align corners with head edges
        this.parts.body.pyramidHat.rotation.y = Math.PI / 4;
        
        // Add yellow underglow light
        const hatLight = new THREE.PointLight(0xffff00, 1, 5);
        hatLight.position.y = -0.05;
        
        // Create four corner green lights
        const cornerLights = [];
        const cornerPositions = [
            { x: 0.7, z: 0.7 },   // Front Right
            { x: -0.7, z: 0.7 },  // Front Left
            { x: -0.7, z: -0.7 }, // Back Left
            { x: 0.7, z: -0.7 }   // Back Right
        ];
        
        for (let pos of cornerPositions) {
            // Create downward-facing corner light
            const cornerLight = new THREE.PointLight(0x00ff00, 0.5, 4.0);  // Reduced intensity since we have 4 lights
            cornerLight.position.set(pos.x, -0.1, pos.z);
            
            // Enable shadow casting
            cornerLight.castShadow = true;
            cornerLight.shadow.mapSize.width = 512;
            cornerLight.shadow.mapSize.height = 512;
            cornerLight.shadow.camera.near = 0.1;
            cornerLight.shadow.camera.far = 5;
            
            cornerLights.push(cornerLight);
            this.parts.body.pyramidHat.add(cornerLight);
        }
        
        // Add upward-facing green light with wider angle and range
        const upwardGreenLight = new THREE.SpotLight(0x00ff00, 1);
        upwardGreenLight.position.y = -0.2;
        upwardGreenLight.angle = Math.PI / 3;
        upwardGreenLight.distance = 4;
        upwardGreenLight.penumbra = 0.5;
        upwardGreenLight.target = this.parts.body.pyramidHat;
        
        // Enable shadow casting for remaining lights
        hatLight.castShadow = true;
        hatLight.shadow.mapSize.width = 512;
        hatLight.shadow.mapSize.height = 512;
        hatLight.shadow.camera.near = 0.1;
        hatLight.shadow.camera.far = 6;
        
        upwardGreenLight.castShadow = true;
        upwardGreenLight.shadow.mapSize.width = 512;
        upwardGreenLight.shadow.mapSize.height = 512;
        upwardGreenLight.shadow.camera.near = 0.1;
        upwardGreenLight.shadow.camera.far = 5;

        // Store light references
        this.parts.body.pyramidLight = hatLight;
        this.parts.body.pyramidCornerLights = cornerLights;
        this.parts.body.pyramidUpwardGreenLight = upwardGreenLight;
        
        // Add lights to pyramid
        this.parts.body.pyramidHat.add(hatLight);
        this.parts.body.pyramidHat.add(upwardGreenLight);
        
        // Add pyramid to head
        this.parts.body.head.add(this.parts.body.pyramidHat);
    }

    createTorso() {
        const torsoGeometry = new THREE.BoxGeometry(1, 1.5, 0.5);
        this.parts.body.torso = new THREE.Mesh(torsoGeometry, this.materials.torso);
        this.parts.body.torso.position.y = 1.5;
        this.parts.body.torso.castShadow = true;
        
        // Create red spotlight for skateboard illumination
        const torsoLight = new THREE.SpotLight(0xff0000, 2);  // Bright red light
        torsoLight.position.set(0, -0.75, 0);  // Position at bottom of torso
        torsoLight.target = this.skateboard.getObject();  // Point at skateboard
        torsoLight.angle = Math.PI / 4;  // 45-degree cone
        torsoLight.penumbra = 0.5;  // Soft edges
        torsoLight.distance = 4;  // Light reaches 4 units
        
        // Enable shadows for the spotlight
        torsoLight.castShadow = true;
        torsoLight.shadow.mapSize.width = 512;
        torsoLight.shadow.mapSize.height = 512;
        torsoLight.shadow.camera.near = 0.1;
        torsoLight.shadow.camera.far = 5;
        
        // Store light reference
        this.parts.body.torsoLight = torsoLight;
        
        // Add light to torso
        this.parts.body.torso.add(torsoLight);
        
        this.joints.spine.add(this.parts.body.torso);
    }

    createArms() {
        // Upper Arms
        const upperArmGeometry = new THREE.BoxGeometry(0.3, 0.6, 0.3);
        
        // Left Upper Arm
        this.parts.arms.leftUpper = new THREE.Mesh(upperArmGeometry, this.materials.arms);
        this.parts.arms.leftUpper.position.set(0, -0.3, 0); // Position relative to shoulder
        this.parts.arms.leftUpper.castShadow = true;
        this.joints.leftShoulder.add(this.parts.arms.leftUpper);
        
        // Right Upper Arm
        this.parts.arms.rightUpper = new THREE.Mesh(upperArmGeometry, this.materials.arms);
        this.parts.arms.rightUpper.position.set(0, -0.3, 0); // Position relative to shoulder
        this.parts.arms.rightUpper.castShadow = true;
        this.joints.rightShoulder.add(this.parts.arms.rightUpper);

        // Lower Arms
        const lowerArmGeometry = new THREE.BoxGeometry(0.25, 0.6, 0.25);
        
        // Left Lower Arm
        this.parts.arms.leftLower = new THREE.Mesh(lowerArmGeometry, this.materials.arms);
        this.parts.arms.leftLower.position.set(0, -0.3, 0); // Position relative to elbow
        this.parts.arms.leftLower.castShadow = true;
        this.joints.leftElbow.add(this.parts.arms.leftLower);
        
        // Right Lower Arm
        this.parts.arms.rightLower = new THREE.Mesh(lowerArmGeometry, this.materials.arms);
        this.parts.arms.rightLower.position.set(0, -0.3, 0); // Position relative to elbow
        this.parts.arms.rightLower.castShadow = true;
        this.joints.rightElbow.add(this.parts.arms.rightLower);
    }

    createLegs() {
        // Upper Legs
        const upperLegGeometry = new THREE.BoxGeometry(0.35, 0.7, 0.35);
        
        // Left Upper Leg
        this.parts.legs.leftUpper = new THREE.Mesh(upperLegGeometry, this.materials.legs);
        this.parts.legs.leftUpper.position.set(0, -0.35, 0); // Position relative to hip
        this.parts.legs.leftUpper.castShadow = true;
        this.joints.leftHip.add(this.parts.legs.leftUpper);
        
        // Right Upper Leg
        this.parts.legs.rightUpper = new THREE.Mesh(upperLegGeometry, this.materials.legs);
        this.parts.legs.rightUpper.position.set(0, -0.35, 0); // Position relative to hip
        this.parts.legs.rightUpper.castShadow = true;
        this.joints.rightHip.add(this.parts.legs.rightUpper);

        // Lower Legs
        const lowerLegGeometry = new THREE.BoxGeometry(0.3, 0.7, 0.3);
        
        // Left Lower Leg
        this.parts.legs.leftLower = new THREE.Mesh(lowerLegGeometry, this.materials.legs);
        this.parts.legs.leftLower.position.set(0, -0.35, 0); // Position relative to knee
        this.parts.legs.leftLower.castShadow = true;
        this.joints.leftKnee.add(this.parts.legs.leftLower);
        
        // Right Lower Leg
        this.parts.legs.rightLower = new THREE.Mesh(lowerLegGeometry, this.materials.legs);
        this.parts.legs.rightLower.position.set(0, -0.35, 0); // Position relative to knee
        this.parts.legs.rightLower.castShadow = true;
        this.joints.rightKnee.add(this.parts.legs.rightLower);

        // Create feet
        const footGeometry = new THREE.BoxGeometry(0.35, 0.25, 0.45); // Increased height from 0.15 to 0.25
        
        // Left Foot
        this.parts.legs.leftFoot = new THREE.Mesh(footGeometry, this.materials.feet);
        this.parts.legs.leftFoot.castShadow = true;
        // Add feet to main group instead of lower legs
        this.group.add(this.parts.legs.leftFoot);
        
        // Right Foot
        this.parts.legs.rightFoot = new THREE.Mesh(footGeometry, this.materials.feet);
        this.parts.legs.rightFoot.castShadow = true;
        // Add feet to main group instead of lower legs
        this.group.add(this.parts.legs.rightFoot);

        // Initial foot positions will be set in idle animation
    }

    createCross() {
        // Create cross group
        const crossGroup = new THREE.Group();
        
        // Vertical part of cross
        const verticalGeometry = new THREE.BoxGeometry(0.1, 0.4, 0.1);
        const verticalPart = new THREE.Mesh(verticalGeometry, this.materials.cross);
        verticalPart.position.y = 0.15;  // Position up from the base
        
        // Horizontal part of cross
        const horizontalGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.1);
        const horizontalPart = new THREE.Mesh(horizontalGeometry, this.materials.cross);
        horizontalPart.position.y = 0.25;  // Position at 2/3 height of vertical
        
        // Add parts to cross group
        crossGroup.add(verticalPart);
        crossGroup.add(horizontalPart);
        
        // Position the cross on top of the head
        crossGroup.position.y = 0.65;  // Changed from 0.55 to 0.65 (moved up 0.1 units)
        
        // Store reference to cross
        this.parts.body.cross = crossGroup;
        
        // Add to head instead of spine
        this.parts.body.head.add(crossGroup);
    }

    createCharacterLight() {
        const light = new THREE.PointLight(0xffffaa, 0, 5);
        light.position.set(0, 1.5, 0);
        light.castShadow = true;
        this.characterLight = light;
        this.group.add(light);
    }

    // Animation methods
    idle(deltaTime) {
        const frequency = 2;
        const amplitude = 0.05;
        
        // Gentle swaying motion
        const sway = Math.sin(this.state.animationTime * frequency) * amplitude;
        
        // Subtle arm swing
        this.joints.leftShoulder.rotation.x = sway;
        this.joints.rightShoulder.rotation.x = -sway;

        // Skateboarding stance animation
        const squatFrequency = 1.2;  // Slower than body sway
        const squatAmplitude = 0.15;  // More pronounced knee bend
        const squat = Math.sin(this.state.animationTime * squatFrequency) * squatAmplitude;
        
        // Calculate knee spread based on squat amount
        const kneeSpreadAmount = 0.15; // Maximum spread distance
        const leftKneeSpread = kneeSpreadAmount * Math.abs(squat);
        const rightKneeSpread = -kneeSpreadAmount * Math.abs(squat);
        
        // Move knees outward based on squat
        this.joints.leftKnee.position.set(leftKneeSpread, -0.7, 0);
        this.joints.rightKnee.position.set(rightKneeSpread, -0.7, 0);
        
        // Knee bending
        this.joints.leftKnee.rotation.x = 0.3 + squat;  // Base bend + animation
        this.joints.rightKnee.rotation.x = 0.3 + squat;  // Base bend + animation
        
        // Hip rotation to keep feet planted
        const hipRotation = 0.2 * Math.abs(squat); // Rotate hips outward during squat
        this.joints.leftHip.rotation.z = -hipRotation;  // Rotate left hip outward
        this.joints.rightHip.rotation.z = hipRotation;  // Rotate right hip outward
        
        // Forward hip tilt to maintain balance
        this.joints.leftHip.rotation.x = -0.1 + squat * 0.3;
        this.joints.rightHip.rotation.x = -0.1 + squat * 0.3;
        
        // Compensate with spine movement to keep feet planted
        this.joints.spine.position.y = 0.6 - (Math.sin(this.state.animationTime * squatFrequency) * 0.1);

        // Update feet positions - they stay planted while legs move
        // Base foot positions
        const footHeight = 0.25;
        const footY = footHeight / 2;
        const footZ = 0.08;
        const footSpread = 0.35;

        // Add subtle foot swivel
        const footSwiveFrequency = 1.0; // Slower than body sway
        const footSwiveAmplitude = 0.1; // Subtle rotation (about 5.7 degrees)
        const leftFootSwivel = Math.sin(this.state.animationTime * footSwiveFrequency) * footSwiveAmplitude;
        const rightFootSwivel = -leftFootSwivel; // Opposite rotation for right foot

        // Position feet relative to main group
        this.parts.legs.leftFoot.position.set(footSpread, footY, footZ);
        this.parts.legs.rightFoot.position.set(-footSpread, footY, footZ);
        
        // Apply foot rotations - only Y axis swivel, keep X and Z at 0
        this.parts.legs.leftFoot.rotation.set(0, leftFootSwivel, 0);
        this.parts.legs.rightFoot.rotation.set(0, rightFootSwivel, 0);

        // Head nodding
        const headFrequency = 1.5;
        const headAmplitude = 0.03;
        const headNod = Math.sin(this.state.animationTime * headFrequency) * headAmplitude;
        this.parts.body.head.rotation.x = headNod;
        
        // Update animation time
        this.state.animationTime += deltaTime;
    }

    update(deltaTime) {
        // Update physics
        this.physics.update(deltaTime, this.group);

        // Update animation time
        this.state.animationTime += deltaTime;

        // Handle different animation states
        switch(this.state.currentAnimation) {
            case 'idle':
                if (this.physics.isObjectGrounded()) {
                    this.idle(deltaTime);
                }
                break;
            // Add more animation cases here
        }

        // Update skateboard
        this.skateboard.update(deltaTime, this.state.speed);
    }

    turn(direction) {
        this.state.isTurning = true;
        this.skateboard.turn(direction * Math.PI / 8);
    }

    getObject() {
        return this.group;
    }

    getLight() {
        return this.characterLight;
    }

    setLightIntensity(intensity) {
        this.characterLight.intensity = intensity;
    }

    getSkateboard() {
        return this.skateboard;
    }

    setTexture(partName, texture) {
        if (this.materials[partName]) {
            this.materials[partName].map = texture;
            this.materials[partName].needsUpdate = true;
        }
    }

    // Add physics control methods
    jump() {
        this.physics.jump();
        this.state.isJumping = true;
    }

    move(direction) {
        const moveForce = 10; // Adjust this value for movement speed
        const moveDirection = new THREE.Vector3(direction.x, 0, direction.z);
        this.physics.move(moveDirection, moveForce);
    }
} 