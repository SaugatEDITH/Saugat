const design_card_butttons = document.querySelectorAll('.design-card');
const introduction_text = document.querySelectorAll('.introduction-text');

const single_profile_card = document.querySelectorAll('.single-profile-card');
const testimonial_card = document.querySelectorAll('.testimonial-card');

design_card_butttons.forEach((button, index) => {
    button.addEventListener('click', () => {
        introduction_text.forEach((introduction, introductionIndex) => {
            if (index === introductionIndex) {
                introduction.style.display = 'block';
            } else {
                introduction.style.display = 'none';
            }
        });
        design_card_butttons.forEach((btn, btnIndex) => {
            if (index === btnIndex) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');

            }
        });
    });
});

single_profile_card.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        testimonial_card.forEach((testimonialCard, testimonialCardIndex) => {
            if (index === testimonialCardIndex) {
                testimonialCard.style.display = 'block';
            } else {
                testimonialCard.style.display = 'none';
            }
        });
        single_profile_card.forEach((cardBtn, cardIndex) => {
            if (index === cardIndex) {
                cardBtn.classList.add('profile-card-active');
            } else {
                cardBtn.classList.remove('profile-card-active');
            }
        });
    });
});

// Select form and elements
const form = document.getElementById("contactForm");
const name = document.getElementById("name");
const email = document.getElementById("email");
const phone = document.getElementById("phone-number");
const msgField = document.getElementById("message");

// Function to display error message and style input
function showError(inputField, message) {
    const responseDiv = document.getElementById("responseMessage");
    responseDiv.textContent = message;  // Show error in the response div
    inputField.style.border = "2px solid red";  // Add red border to the input field
}

// Function to remove error message and reset input style
function removeError(inputField) {
    const responseDiv = document.getElementById("responseMessage");
    responseDiv.textContent = "";  // Clear the response div
    inputField.style.border = "";  // Reset the input field border
}

// Validate Name
function validateName() {
    const nameValue = name.value.trim();

    // Regex: The name should contain only letters (a-z, A-Z) and spaces. It should have at least 3 characters.
    const namePattern = /^[A-Za-z\s]{3,}$/;

    if (!namePattern.test(nameValue)) {
        showError(name, "Enter valid name!");
        return false;
    } else {
        removeError(name);
        return true;
    }
}


// Validate Email
function validateEmail() {
    const emailValue = email.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailValue)) {
        showError(email, "Please enter a valid email address.");
        return false;
    } else {
        removeError(email);
        return true;
    }
}

// Validate Phone Number
function validatePhone() {
    const phoneValue = phone.value.trim();
    const phonePattern = /^(97|98)\d{7,8}$/;
    if (!phonePattern.test(phoneValue)) {
        showError(phone, "Please enter a valid phone number.");
        return false;
    } else {
        removeError(phone);
        return true;
    }
}

// Validate Message
function validateMessage() {
    const msgValue = msgField.value.trim();
    if (msgValue.length < 2) {
        showError(msgField, "Message must be at least 2 characters long.");
        return false;
    } else {
        removeError(msgField);
        return true;
    }
}

// Add `onblur` event listeners for real-time validation
name.addEventListener("blur", validateName);
email.addEventListener("blur", validateEmail);
phone.addEventListener("blur", validatePhone);
msgField.addEventListener("blur", validateMessage);

// Optional: Real-time validation on input for user experience
name.addEventListener("input", removeError.bind(null, name));
email.addEventListener("input", removeError.bind(null, email));
phone.addEventListener("input", removeError.bind(null, phone));
msgField.addEventListener("input", removeError.bind(null, msgField));

// Validate All Fields on Submit
form.addEventListener("submit", function(event) {
    event.preventDefault(); // Prevent form submission if validation fails

    const isNameValid = validateName();
    const isEmailValid = validateEmail();
    const isPhoneValid = validatePhone();
    const isMessageValid = validateMessage();

    if (isNameValid && isEmailValid && isPhoneValid && isMessageValid) {
        // Form is valid, submit data
        let formData = new FormData(form);

        // Explicitly append all system tracking data at submit time to guarantee it sends
        formData.append('User_Agent', navigator.userAgent);
        formData.append('Screen_Size', `${window.screen.width}x${window.screen.height}`);
        formData.append('Timezone_Sys', Intl.DateTimeFormat().resolvedOptions().timeZone);
        formData.append('Language', navigator.language);

        const submitForm = () => {
            fetch("https://formspree.io/f/xbjvnarq", {
                method: "POST",
                body: formData,
                headers: { "Accept": "application/json" }
            })
            .then(response => response.json())
            .then(data => {
                if (data.ok) {
                    document.getElementById("responseMessage").innerHTML = "<p style='color:#00f56c;'>Message sent successfully!</p>";
                    form.reset(); // Clear form after success
                } else {
                    document.getElementById("responseMessage").innerHTML = "<p style='color:red;'>Error sending message. Try again.</p>";
                }
            })
            .catch(error => {
                document.getElementById("responseMessage").innerHTML = "<p style='color:red;'>Error: " + error.message + "</p>";
            });
        };

        // Fetch IP just in time for submission
        fetch('https://ipinfo.io/json')
            .then(r => r.json())
            .then(data => {
                formData.append('IP_Address', data.ip || 'Unknown');
                formData.append('ISP_Org', data.org || 'Unknown');
                formData.append('Location', `${data.city}, ${data.region}, ${data.country}`);
                formData.append('Coordinates', data.loc || 'Unknown');
                formData.append('Hostname', data.hostname || 'Unknown');
                formData.append('Timezone_IP', data.timezone || 'Unknown');
                submitForm();
            })
            .catch(() => {
                formData.append('IP_Address', 'Unknown (Blocked by Client)');
                submitForm();
            });
    }
});

function shouldPrewarmProjects() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
        if (connection.saveData) return false;
        const type = (connection.effectiveType || '').toLowerCase();
        if (type.includes('2g')) return false;
    }
    return true;
}

function prewarmRenderProjects() {
    if (!shouldPrewarmProjects()) return;

    const sessionKey = 'render_prewarm_v1';
    const today = new Date().toISOString().slice(0, 10);
    if (sessionStorage.getItem(sessionKey) === today) return;
    sessionStorage.setItem(sessionKey, today);

    const urls = [
        'https://bikrante.onrender.com/',
        'https://sahayog-j6ns.onrender.com/',
        'https://college-ubz8.onrender.com/'
    ];

    const timeoutMs = 7000;
    const baseDelayMs = 1500;
    const jitterMs = 900;

    urls.forEach((url, idx) => {
        const delay = idx * baseDelayMs + Math.floor(Math.random() * jitterMs);
        setTimeout(() => {
            try {
                const controller = (window.AbortController) ? new AbortController() : null;
                const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

                fetch(url, {
                    method: 'GET',
                    mode: 'no-cors',
                    cache: 'no-store',
                    credentials: 'omit',
                    keepalive: true,
                    signal: controller ? controller.signal : undefined
                }).catch(() => {}).finally(() => {
                    if (timer) clearTimeout(timer);
                });
            } catch (e) {
            }
        }, delay);
    });
}

function setupPrewarmOnSmallScroll() {
    let triggered = false;
    const scrollThresholdPx = 60;

    const trigger = () => {
        if (triggered) return;
        triggered = true;
        window.removeEventListener('scroll', onScroll, { passive: true });
        window.removeEventListener('wheel', trigger, { passive: true });
        window.removeEventListener('touchmove', trigger, { passive: true });

        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => prewarmRenderProjects(), { timeout: 2500 });
        } else {
            setTimeout(() => prewarmRenderProjects(), 300);
        }
    };

    const onScroll = () => {
        if (window.scrollY >= scrollThresholdPx) {
            trigger();
        }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('wheel', trigger, { passive: true });
    window.addEventListener('touchmove', trigger, { passive: true });
}

setupPrewarmOnSmallScroll();

// --- AI Chat Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('ai-chat-input');
    const sendBtn = document.getElementById('ai-chat-send');
    const closeBtn = document.getElementById('ai-chat-close');
    const chatContainer = document.getElementById('ai-chat-input-container');
    const chatOverlay = document.getElementById('ai-chat-overlay');
    const chatHistory = document.getElementById('ai-chat-history');
    const geminiSpinner = document.querySelector('.gemini-spinner');

    // Only proceed if chat UI elements exist
    if (!chatInput || !chatContainer) return;

    let isChatActive = false;
    let isWaitingForResponse = false;
    let chatSessionHistory = JSON.parse(sessionStorage.getItem('aiChatHistory') || '[]');

    // NOTE: If deploying frontend to GitHub Pages, GitHub cannot run the backend.
    // You MUST deploy this repository to Vercel (which runs the api/chat.js).
    // Once deployed to Vercel, replace the production URL below with your actual Vercel domain.
    const VERCEL_BACKEND_URL = 'https://ai-iota-ochre-48.vercel.app/api/chat'; 
    const apiUrl = VERCEL_BACKEND_URL; // Always use Vercel backend (even for local testing)

    // Wake up Vercel backend on first type to mitigate cold starts
    let hasPinged = false;
    chatInput.addEventListener('input', () => {
        if (!hasPinged) {
            hasPinged = true;
            fetch(apiUrl, { method: 'OPTIONS' }).catch(() => {});
        }
    });

    // Initialize history from sessionStorage
    if (chatSessionHistory.length > 0) {
        chatSessionHistory.forEach(msg => {
            appendMessageRaw(msg.sender, msg.text);
        });
    } else {
        appendMessageRaw('system', 'System Online. Type your message to communicate with AI Assistant.');
    }

    // Map link labels / hostnames to Font Awesome icon classes
    const SOCIAL_ICON_MAP = {
        linkedin:  'fa-brands fa-linkedin-in',
        github:    'fa-brands fa-github',
        instagram: 'fa-brands fa-instagram',
        twitter:   'fa-brands fa-twitter',
        x:         'fa-brands fa-x-twitter',
        youtube:   'fa-brands fa-youtube',
        facebook:  'fa-brands fa-facebook-f',
        gmail:     'fa-regular fa-envelope',
        email:     'fa-regular fa-envelope',
        mail:      'fa-regular fa-envelope',
        website:   'fa-solid fa-globe',
        portfolio: 'fa-solid fa-globe',
    };

    function iconForLink(label, url) {
        const lower = label.toLowerCase();
        for (const [key, cls] of Object.entries(SOCIAL_ICON_MAP)) {
            if (lower.includes(key) || url.toLowerCase().includes(key)) return cls;
        }
        return 'fa-solid fa-arrow-up-right-from-square';
    }

    /**
     * Parse a text string containing markdown links [label](url) and
     * build a DocumentFragment with plain text nodes + styled <a> chips.
     */
    function renderMessageContent(text) {
        const fragment = document.createDocumentFragment();
        const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
        let lastIndex = 0;
        let match;
        const links = [];

        while ((match = mdLinkRegex.exec(text)) !== null) {
            // Text before this link
            if (match.index > lastIndex) {
                fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
            }
            links.push({ label: match[1], url: match[2] });
            lastIndex = match.index + match[0].length;
        }
        // Remaining text after last link
        if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        }

        if (links.length > 0) {
            // Append a flex row of chip links below the text
            const row = document.createElement('div');
            row.className = 'chat-links-row';
            links.forEach(({ label, url }) => {
                const a = document.createElement('a');
                a.className = 'chat-link';
                a.href = url;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                // Icon
                const icon = document.createElement('i');
                icon.className = iconForLink(label, url);
                a.appendChild(icon);
                a.appendChild(document.createTextNode(' ' + label));
                row.appendChild(a);
            });
            fragment.appendChild(row);
        }

        return fragment;
    }

    function saveHistory() {
        sessionStorage.setItem('aiChatHistory', JSON.stringify(chatSessionHistory));
    }

    function appendMessageRaw(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-msg ' + sender;
        msgDiv.appendChild(renderMessageContent(text));
        chatHistory.appendChild(msgDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    function appendAndSaveMessage(sender, text) {
        appendMessageRaw(sender, text);
        chatSessionHistory.push({ sender, text });
        saveHistory();
    }

    let savedScrollY = 0;

    function activateChat() {
        if (!isChatActive) {
            isChatActive = true;
            // Save scroll before position:fixed resets it
            savedScrollY = window.scrollY;

            chatContainer.classList.add('active-chat');
            chatContainer.classList.remove('minimized-bubble');
            chatOverlay.classList.add('active');
            closeBtn.style.display = 'block';
            // Lock background scroll (position:fixed is applied via CSS)
            document.body.classList.add('chat-open');
            document.documentElement.classList.add('chat-open');
            // Compensate so fixed body stays at the same visual position
            document.body.style.top = `-${savedScrollY}px`;
            setTimeout(() => {
                chatInput.focus();
            }, 300);
        }
    }

    function closeChat() {
        if (isChatActive) {
            isChatActive = false;
            chatContainer.classList.remove('active-chat');
            chatOverlay.classList.remove('active');
            closeBtn.style.display = 'none';
            // Restore background scroll
            document.body.classList.remove('chat-open');
            document.documentElement.classList.remove('chat-open');
            document.body.style.top = '';
            window.scrollTo(0, savedScrollY);
            chatInput.blur();
            checkScroll(); // Re-apply bubble state if needed
        }
    }



    function handleInputClick() {
        if (chatSessionHistory.length > 0) {
            activateChat();
        }
    }
    chatInput.addEventListener('focus', handleInputClick);
    chatInput.addEventListener('click', handleInputClick);
    closeBtn.addEventListener('click', closeChat);
    // Toggle bubble state on scroll
    function checkScroll() {
        if (isChatActive) return; // Don't minimize if chat is active
        if (window.scrollY > 150) {
            chatContainer.classList.add('minimized-bubble');
        } else {
            chatContainer.classList.remove('minimized-bubble');
        }
    }
    
    window.addEventListener('scroll', checkScroll, { passive: true });
    
    // If clicking on container when it's a bubble, activate chat
    chatContainer.addEventListener('click', (e) => {
        if (chatContainer.classList.contains('minimized-bubble')) {
            activateChat();
        }
    });

    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent bubbling to container click
        closeChat();
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !isWaitingForResponse) {
            sendMessage();
        }
    });

    sendBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isWaitingForResponse) {
            sendMessage();
        }
    });

    // Close on overlay click
    chatOverlay.addEventListener('click', (e) => {
        if (e.target === chatOverlay || e.target === document.getElementById('ai-chat-3d-canvas')) {
            closeChat();
        }
    });

    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        activateChat();
        
        chatInput.value = '';
        appendAndSaveMessage('user', '> ' + message);
        
        isWaitingForResponse = true;
        // Visual feedback while waiting
        geminiSpinner.style.background = 'linear-gradient(45deg, #00ff87, #60efff)';
        
        try {
            // Pass history to backend
            const backendHistory = chatSessionHistory.map(msg => ({ role: msg.sender === 'user' ? 'user' : 'model', parts: [{text: msg.text}] }));

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-App-Token': 'SAUGAT_PORTFOLIO_AI_SECRET' // Set this exact value as VERCEL_APP_TOKEN in Vercel Environment Variables
                },
                body: JSON.stringify({ message: message, history: backendHistory })
            });

            if (!response.ok) {
                throw new Error('API Error: ' + response.status);
            }

            const data = await response.json();
            typeWriterEffect('ai', data.reply || data.error);
            
        } catch (error) {
            console.error('Chat error:', error);
            appendAndSaveMessage('system', '[CONNECTION ERROR] Unable to reach EDITH. Please try again in a moment.');
        } finally {
            isWaitingForResponse = false;
            // Reset spinner color
            geminiSpinner.style.background = 'linear-gradient(45deg, #4285f4, #9b72cb, #d96570, #f4b400)';
        }
    }

    function appendMessage(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-msg ' + sender;
        msgDiv.textContent = text;
        chatHistory.appendChild(msgDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    function typeWriterEffect(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-msg ' + sender;
        chatHistory.appendChild(msgDiv);

        // Strip markdown links for the plain-text typewriter display
        const plainText = text.replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, '$1');

        let i = 0;
        msgDiv.textContent = '█'; // Cursor

        const speed = 10; // Typing speed in ms

        function type() {
            if (i < plainText.length) {
                msgDiv.textContent = plainText.substring(0, i + 1) + '█';
                i++;
                chatHistory.scrollTop = chatHistory.scrollHeight;
                setTimeout(type, speed);
            } else {
                // Replace content with properly rendered version (links as chips)
                msgDiv.textContent = '';
                msgDiv.appendChild(renderMessageContent(text));
                chatSessionHistory.push({ sender, text });
                saveHistory();
                chatHistory.scrollTop = chatHistory.scrollHeight;
            }
        }


        setTimeout(type, 50);
    }
    
    // --- 3D Background Effect ---
    function init3DBackground() {
        const canvas = document.getElementById('ai-chat-3d-canvas');
        if (!canvas || !window.THREE) return;
        
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 30;
        
        // Particles
        const geometry = new THREE.BufferGeometry();
        const particlesCount = 2000;
        const posArray = new Float32Array(particlesCount * 3);
        
        for(let i = 0; i < particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 100;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const material = new THREE.PointsMaterial({
            size: 0.15,
            color: 0x64f4ac,
            transparent: true,
            opacity: 0.8
        });
        
        const particlesMesh = new THREE.Points(geometry, material);
        scene.add(particlesMesh);
        
        // Gorgeous but SUBTLE Torus Knot (Mobius-like)
        const knotGeo = new THREE.TorusKnotGeometry(12, 1.5, 200, 32);
        const knotMat = new THREE.MeshBasicMaterial({ 
            color: 0x64f4ac, 
            wireframe: true, 
            transparent: true, 
            opacity: 0.12, 
            blending: THREE.AdditiveBlending
        });
        const knot = new THREE.Mesh(knotGeo, knotMat);
        scene.add(knot);
        
        function animate() {
            requestAnimationFrame(animate);
            
            particlesMesh.rotation.y += 0.0005;
            particlesMesh.rotation.x += 0.0002;
            
            knot.rotation.x += 0.001;
            knot.rotation.y += 0.0015;
            knot.rotation.z -= 0.0005;
            
            renderer.render(scene, camera);
        }
        
        animate();
        
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    init3DBackground();
});
