const canvas = document.getElementById('binary-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0.1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 30;

// Create binary text particles
const binaryTexts = [];
const particlesGroup = new THREE.Group();
scene.add(particlesGroup);

function createBinaryParticles() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('01010101', 10, 50);
    ctx.fillText('11110000', 10, 100);
    ctx.fillText('10101010', 10, 150);
    ctx.fillText('11001100', 10, 200);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

// Add binary falling code effect
function addBinaryCode() {
    const texture = createBinaryParticles();
    const geometry = new THREE.PlaneGeometry(3, 4);
    const material = new THREE.MeshBasicMaterial({ 
        map: texture, 
        transparent: true,
        color: 0x00ff00
    });
    
    for (let i = 0; i < 50; i++) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
            (Math.random() - 0.5) * 60,
            Math.random() * 60,
            Math.random() * 20
        );
        mesh.scale.set(Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5, 1);
        mesh.userData.speed = Math.random() * 0.1 + 0.05;
        mesh.userData.rotation = Math.random() * 0.01;
        particlesGroup.add(mesh);
        binaryTexts.push(mesh);
    }
}

// Create geometric shapes
const geometry = new THREE.IcosahedronGeometry(1, 4);
const material = new THREE.MeshPhongMaterial({
    color: 0x00ff00,
    wireframe: true,
    emissive: 0x00aa00
});

const shapes = [];
for (let i = 0; i < 5; i++) {
    const shape = new THREE.Mesh(geometry, material.clone());
    shape.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40
    );
    shape.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );
    shape.userData.vx = (Math.random() - 0.5) * 0.02;
    shape.userData.vy = (Math.random() - 0.5) * 0.02;
    shape.userData.vz = (Math.random() - 0.5) * 0.02;
    scene.add(shape);
    shapes.push(shape);
}

// Add lighting
const ambientLight = new THREE.AmbientLight(0x00ff00, 0.3);
scene.add(ambientLight);

const pointLight1 = new THREE.PointLight(0x00ff00, 1);
pointLight1.position.set(20, 20, 20);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0x00aa00, 0.5);
pointLight2.position.set(-20, -20, -20);
scene.add(pointLight2);

// Add glow effect with post-processing
const glowGeometry = new THREE.IcosahedronGeometry(1.2, 4);
const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    transparent: true,
    opacity: 0.1
});

shapes.forEach(shape => {
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial.clone());
    glowMesh.position.copy(shape.position);
    glowMesh.scale.multiplyScalar(2);
    scene.add(glowMesh);
});

// Initialize binary particles
addBinaryCode();

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Rotate shapes
    shapes.forEach((shape, index) => {
        shape.rotation.x += shape.userData.vx;
        shape.rotation.y += shape.userData.vy;
        shape.rotation.z += shape.userData.vz;
        
        shape.position.x += shape.userData.vx * 5;
        shape.position.y += shape.userData.vy * 5;
        shape.position.z += shape.userData.vz * 5;
        
        // Bounce off boundaries
        if (Math.abs(shape.position.x) > 30) shape.userData.vx *= -1;
        if (Math.abs(shape.position.y) > 30) shape.userData.vy *= -1;
        if (Math.abs(shape.position.z) > 30) shape.userData.vz *= -1;
        
        // Glow pulse effect
        const material = shape.material;
        material.emissive.setHSL(0.33, 1, 0.3 + Math.sin(Date.now() * 0.001 + index) * 0.2);
    });
    
    // Animate binary falling effect
    binaryTexts.forEach((text, index) => {
        text.position.y -= text.userData.speed;
        text.rotation.z += text.userData.rotation;
        text.material.opacity = Math.sin(Date.now() * 0.001 + index * 0.1) * 0.5 + 0.5;
        
        if (text.position.y < -30) {
            text.position.y = 30;
            text.position.x = (Math.random() - 0.5) * 60;
        }
    });
    
    // Camera effect
    camera.position.x = Math.sin(Date.now() * 0.0002) * 5;
    camera.position.y = Math.cos(Date.now() * 0.0003) * 5;
    camera.lookAt(scene.position);
    
    renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Mouse interaction
document.addEventListener('mousemove', (event) => {
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    
    shapes.forEach(shape => {
        const distance = Math.hypot(
            shape.position.x - mouseX * 20,
            shape.position.y - mouseY * 20
        );
        
        if (distance < 10) {
            shape.material.color.setHex(0x00ffff);
            shape.scale.set(1.3, 1.3, 1.3);
        } else {
            shape.material.color.setHex(0x00ff00);
            shape.scale.set(1, 1, 1);
        }
    });
});
