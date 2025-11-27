class BinarySystem {
    constructor() {
        this.canvas = document.getElementById('binary-canvas');
        if (!this.canvas) return;

        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });
        
        const width = window.innerWidth - 250;
        const height = window.innerHeight;
        
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 0);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75, 
            width / height, 
            0.1, 
            1000
        );
        this.camera.position.z = 25;

        this.mouse = { x: 0, y: 0 };
        this.raycaster = new THREE.Raycaster();

        this.setupCybersecurityNetwork();
        this.setupStars();
        this.createScanningLaser();
        this.createIntrusionDetection();
        this.setupMouseTracking();
        this.animate();

        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupMouseTracking() {
        document.addEventListener('mousemove', (event) => {
            if (!this.canvas) return;
            const rect = this.canvas.getBoundingClientRect();
            
            if (event.clientX >= rect.left && event.clientX <= rect.right &&
                event.clientY >= rect.top && event.clientY <= rect.bottom) {
                this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            }
        });
    }

    setupCybersecurityNetwork() {
        this.networkGroup = new THREE.Group();
        this.scene.add(this.networkGroup);

        // Central node - Secure server
        const centralGeometry = new THREE.SphereGeometry(2, 32, 32);
        const centralMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 1
        });
        this.centralServer = new THREE.Mesh(centralGeometry, centralMaterial);
        this.centralServer.position.set(0, 0, 0);
        this.networkGroup.add(this.centralServer);

        // Central glow
        const centralGlowGeometry = new THREE.SphereGeometry(2.8, 32, 32);
        const centralGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.15
        });
        const centralGlow = new THREE.Mesh(centralGlowGeometry, centralGlowMaterial);
        this.centralServer.add(centralGlow);

        // Threat nodes
        const threatPositions = [
            [-6, 3, 0],
            [6, 3, 0],
            [-5, -4, 2],
            [5, -4, 2]
        ];

        this.threatNodes = [];
        threatPositions.forEach((pos, idx) => {
            const threatGeometry = new THREE.SphereGeometry(0.8, 32, 32);
            const threatMaterial = new THREE.MeshBasicMaterial({
                color: 0xff0055,
                emissive: 0xff0055,
                emissiveIntensity: 0.7
            });
            const threatNode = new THREE.Mesh(threatGeometry, threatMaterial);
            threatNode.position.set(pos[0], pos[1], pos[2]);
            threatNode.userData.threatId = idx;
            this.networkGroup.add(threatNode);
            this.threatNodes.push(threatNode);
        });

        this.createNetworkConnections();
        this.createDataFlowParticles();
    }

    createNetworkConnections() {
        const threatPositions = [
            [-6, 3, 0],
            [6, 3, 0],
            [-5, -4, 2],
            [5, -4, 2]
        ];

        threatPositions.forEach(pos => {
            const lineGeometry = new THREE.BufferGeometry();
            const points = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(pos[0], pos[1], pos[2])
            ];
            lineGeometry.setFromPoints(points);

            const lineMaterial = new THREE.LineBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.4,
                linewidth: 2
            });
            const line = new THREE.Line(lineGeometry, lineMaterial);
            this.networkGroup.add(line);
        });
    }

    createDataFlowParticles() {
        this.dataPackets = [];
        const packetsPerLine = 2;
        const threatPositions = [
            [-6, 3, 0],
            [6, 3, 0],
            [-5, -4, 2],
            [5, -4, 2]
        ];

        threatPositions.forEach((threatPos) => {
            for (let i = 0; i < packetsPerLine; i++) {
                const packet = this.createDataPacket();
                packet.userData.startPos = new THREE.Vector3(0, 0, 0);
                packet.userData.endPos = new THREE.Vector3(threatPos[0], threatPos[1], threatPos[2]);
                packet.userData.progress = (i / packetsPerLine) * 0.5;
                packet.userData.speed = 0.008 + Math.random() * 0.004;
                this.networkGroup.add(packet);
                this.dataPackets.push(packet);
            }
        });
    }

    createDataPacket() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        
        context.fillStyle = '#00ffff';
        context.font = 'Bold 20px Courier';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        const bits = Math.random() > 0.5 ? '01010101' : '10101010';
        context.fillText(bits, 32, 32);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.6
        });
        const geometry = new THREE.PlaneGeometry(0.6, 0.6);
        const mesh = new THREE.Mesh(geometry, material);
        return mesh;
    }

    createScanningLaser() {
        const laserGeometry = new THREE.BufferGeometry();
        const laserPositions = new Float32Array([
            -30, -20, 0,
            -30, 20, 0
        ]);
        laserGeometry.setAttribute('position', new THREE.BufferAttribute(laserPositions, 3));
        const laserMaterial = new THREE.LineBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.3,
            linewidth: 3
        });
        this.scanningLaser = new THREE.Line(laserGeometry, laserMaterial);
        this.scene.add(this.scanningLaser);
    }

    createIntrusionDetection() {
        this.warningCircles = [];
        for (let i = 0; i < 4; i++) {
            const circleGeometry = new THREE.BufferGeometry();
            const circlePoints = [];
            for (let j = 0; j <= 64; j++) {
                const angle = (j / 64) * Math.PI * 2;
                circlePoints.push(
                    Math.cos(angle) * 1.3,
                    Math.sin(angle) * 1.3,
                    0
                );
            }
            circleGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(circlePoints), 3));
            const circleMaterial = new THREE.LineBasicMaterial({
                color: 0xff0055,
                transparent: true,
                opacity: 0
            });
            const circle = new THREE.Line(circleGeometry, circleMaterial);
            this.warningCircles.push(circle);
        }
    }

    setupStars() {
        const starsGeometry = new THREE.BufferGeometry();
        const starCount = 200;
        const starPositions = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount * 3; i += 3) {
            starPositions[i] = (Math.random() - 0.5) * 150;
            starPositions[i + 1] = (Math.random() - 0.5) * 150;
            starPositions[i + 2] = (Math.random() - 0.5) * 150;
        }

        starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        const starsMaterial = new THREE.PointsMaterial({
            size: 0.3,
            color: 0x00ff00,
            transparent: true,
            opacity: 0.4,
            sizeAttenuation: true
        });

        this.stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(this.stars);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Rotate network
        this.networkGroup.rotation.y += 0.001;
        this.networkGroup.rotation.x += 0.0003;

        // Pulsing effect
        const pulse = Math.sin(Date.now() * 0.003) * 0.15 + 0.95;
        this.centralServer.scale.set(pulse, pulse, pulse);

        // Scanning laser
        this.scanningLaser.position.x = this.mouse.x * 25;
        this.scanningLaser.material.opacity = 0.2 + Math.sin(Date.now() * 0.005) * 0.1;

        // Update raycaster
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Update warning circles
        this.threatNodes.forEach((threatNode, idx) => {
            const distance = this.camera.position.distanceTo(threatNode.position);
            const screenDistance = Math.abs(this.mouse.x * 25 - threatNode.position.x) + 
                                  Math.abs(this.mouse.y * 20 - threatNode.position.y);
            
            if (screenDistance < 4) {
                if (!this.warningCircles[idx].parent) {
                    this.networkGroup.add(this.warningCircles[idx]);
                }
                this.warningCircles[idx].position.copy(threatNode.position);
                this.warningCircles[idx].material.opacity = 0.7;
                this.warningCircles[idx].scale.set(2, 2, 1);
            } else {
                if (this.warningCircles[idx].parent) {
                    this.networkGroup.remove(this.warningCircles[idx]);
                }
            }
        });

        // Animate data packets
        this.dataPackets.forEach(packet => {
            packet.userData.progress += packet.userData.speed;
            
            if (packet.userData.progress > 1) {
                packet.userData.progress = 0;
            }

            const start = packet.userData.startPos;
            const end = packet.userData.endPos;
            packet.position.lerpVectors(start, end, packet.userData.progress);
            packet.rotation.z += 0.1;

            if (packet.userData.progress > 0.8) {
                packet.material.color.setHex(0xff0055);
                packet.material.emissive.setHex(0xff0055);
            } else if (packet.userData.progress < 0.2) {
                packet.material.color.setHex(0x00ffff);
                packet.material.emissive.setHex(0x00ffff);
            }
        });

        // Threat nodes pulsing
        this.threatNodes.forEach((threatNode) => {
            const threatPulse = Math.sin(Date.now() * 0.005 + threatNode.userData.threatId) * 0.1 + 0.9;
            threatNode.scale.set(threatPulse, threatPulse, threatPulse);
        });

        this.stars.rotation.x += 0.00005;
        this.stars.rotation.y += 0.0001;

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        const width = window.innerWidth - 250;
        const height = window.innerHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}

// Initialize binary system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BinarySystem();
});
