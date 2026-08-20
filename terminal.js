class Terminal {
    constructor() {
        this.output = document.getElementById('terminal-output');
        this.history = [];
        this.historyIndex = 0;
        this.currentDirectory = '/home/saugat';
        this.isSudo = false;
        this.jokeCache = [];
        this.jokeFetchInFlight = false;
        this.lastJokeFetchAt = 0;
        this.jokeBag = [];
        this.jokePoolKey = '';
        this.setupMobileInput();
        this.setupSidebarCommands();
        this.showWelcomeScreen();
        this.setupKeyboardInput();

        this.prefetchJokes();
        
        // Auto-execute command from URL if present
        const urlParams = new URLSearchParams(window.location.search);
        const cmdParam = urlParams.get('cmd');
        if (cmdParam) {
            setTimeout(() => {
                this.executeCommand(cmdParam);
            }, 500);
        }
    }

    getPrompt() {
        const dir = this.currentDirectory === '/home/saugat' ? '~' : this.currentDirectory;
        return `saugat@portfolio:${dir}$`;
    }

    showWelcomeScreen() {
        this.addLine(`Copyright (C) ${new Date().getFullYear()} Saugat Pokharel. All rights reserved.`, 'copyright');
        this.addLine('Welcome to Saugat\'s Terminal Portfolio v1.0', 'success');
        this.addLine('Type \'help\' to see all available commands', 'info');
        this.addLine('Click commands from sidebar or type directly to explore', 'warning');
        this.addLine('', 'output');
        this.scrollToBottom();
    }

    setupMobileInput() {
        this.mobileInput = document.createElement('input');
        this.mobileInput.type = 'text';
        this.mobileInput.id = 'mobile-keyboard-input';
        this.mobileInput.style.position = 'fixed';
        this.mobileInput.style.opacity = '0';
        this.mobileInput.style.top = '0';
        this.mobileInput.style.left = '0';
        this.mobileInput.style.width = '1px';
        this.mobileInput.style.height = '1px';
        this.mobileInput.style.pointerEvents = 'none';
        this.mobileInput.style.zIndex = '-1';
        this.mobileInput.setAttribute('autocapitalize', 'none');
        this.mobileInput.setAttribute('autocomplete', 'off');
        this.mobileInput.setAttribute('spellcheck', 'false');
        this.mobileInput.setAttribute('autocorrect', 'off');
        document.body.appendChild(this.mobileInput);

        const terminalContainer = document.querySelector('.terminal-container');
        if (terminalContainer) {
            terminalContainer.addEventListener('click', () => {
                const selection = window.getSelection().toString();
                if (!selection) {
                    this.mobileInput.focus();
                }
            });
        }

        this.mobileInput.addEventListener('input', (e) => {
            if (this.cvClearanceMode && this.cvClearanceMode.active && (this.cvClearanceMode.step === 'wait' || this.cvClearanceMode.step === 'captcha')) {
                this.mobileInput.value = '';
                return;
            }
            if (this.vimMode && this.vimMode.active) {
                this.mobileInput.value = '';
                return;
            }

            if (this.cvClearanceMode && this.cvClearanceMode.active) {
                this.currentInput = this.mobileInput.value;
                this.updateCvClearanceDisplay();
            } else if (!this.nanoMode || !this.nanoMode.active) {
                this.currentInput = this.mobileInput.value;
                this.updateInputDisplay();
            }
        });
    }

    setupKeyboardInput() {
        document.addEventListener('keydown', (e) => {
            // Don't interfere with special keys or if user is typing in an input
            if ((e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') && e.target.id !== 'mobile-keyboard-input') {
                return;
            }

            // On mobile, let the 'input' event handle character typing & backspace for soft keyboards
            if (e.target.id === 'mobile-keyboard-input') {
                if ((e.key.length === 1 && !e.ctrlKey) || e.key === 'Backspace') {
                    return; 
                }
            }

            // Handle VIM mode
            if (this.vimMode && this.vimMode.active) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    this.vimMode.insertMode = false;
                    this.addLine('-- NORMAL MODE --', 'warning');
                    this.scrollToBottom();
                } else if (e.key === 'i' && !this.vimMode.insertMode) {
                    e.preventDefault();
                    this.vimMode.insertMode = true;
                    this.addLine('-- INSERT MODE --', 'success');
                    this.scrollToBottom();
                } else if (e.key === ':' && !this.vimMode.insertMode) {
                    e.preventDefault();
                    this.vimCommandInput = ':';
                    this.vimCommandDisplay = document.createElement('div');
                    this.vimCommandDisplay.className = 'terminal-line';
                    this.vimCommandDisplay.innerHTML = `<span class="output">:</span>`;
                    this.output.appendChild(this.vimCommandDisplay);
                    this.scrollToBottom();
                } else if (this.vimCommandInput) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        if (this.vimCommandDisplay) {
                            this.vimCommandDisplay.remove();
                            this.vimCommandDisplay = null;
                        }
                        this.executeVimCommand(this.vimCommandInput);
                        this.vimCommandInput = null;
                    } else if (e.key === 'Backspace') {
                        e.preventDefault();
                        this.vimCommandInput = this.vimCommandInput.slice(0, -1);
                        this.vimCommandDisplay.innerHTML = `<span class="output">${this.vimCommandInput}</span>`;
                    } else if (e.key.length === 1) {
                        e.preventDefault();
                        this.vimCommandInput += e.key;
                        this.vimCommandDisplay.innerHTML = `<span class="output">${this.vimCommandInput}</span>`;
                    }
                } else if (this.vimMode.insertMode && e.key.length === 1) {
                    e.preventDefault();
                    this.vimMode.content += e.key;
                }
                return;
            }

            // Handle NANO mode
            if (this.nanoMode && this.nanoMode.active) {
                if (e.key === 'x' && e.ctrlKey) {
                    e.preventDefault();
                    this.nanoMode.active = false;
                    this.addLine('', 'output');
                    this.addLine('Save modified buffer?', 'warning');
                    this.addLine('Y)es  N)o  C)ancel', 'info');
                    setTimeout(() => {
                        this.addLine('[Y]', 'output');
                        this.addLine('', 'output');
                        this.nanoMode.active = false;
                        this.scrollToBottom();
                        this.createInputDisplay();
                        this.currentInput = '';
                        this.updateInputDisplay();
                    }, 500);
                }
                return;
            }

            // Handle CV Clearance mode
            if (this.cvClearanceMode && this.cvClearanceMode.active) {
                if (e.key === 'c' && e.ctrlKey) {
                    e.preventDefault();
                    this.cvClearanceMode.active = false;
                    this.addLine('^C', 'output');
                    this.addLine('Clearance protocol aborted.', 'error');
                    this.addLine('', 'output');
                    this.scrollToBottom();
                    this.createInputDisplay();
                    this.currentInput = '';
                    this.updateInputDisplay();
                    return;
                }
                
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleCvClearanceInput(this.currentInput || '');
                    this.currentInput = '';
                } else if (e.key === 'Backspace') {
                    e.preventDefault();
                    this.currentInput = (this.currentInput || '').slice(0, -1);
                    this.updateCvClearanceDisplay();
                } else if (e.key.length === 1) {
                    e.preventDefault();
                    this.currentInput = (this.currentInput || '') + e.key;
                    this.updateCvClearanceDisplay();
                }
                return;
            }

            // Handle regular input
            if (e.key === 'Enter') {
                e.preventDefault();
                const input = this.currentInput || '';
                if (input.trim()) {
                    this.executeCommand(input.trim());
                    this.currentInput = '';
                }
            } else if (e.key === 'Backspace') {
                e.preventDefault();
                this.currentInput = (this.currentInput || '').slice(0, -1);
                this.updateInputDisplay();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.historyIndex = Math.max(0, this.historyIndex - 1);
                this.currentInput = this.history[this.historyIndex] || '';
                this.updateInputDisplay();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.historyIndex = Math.min(this.history.length, this.historyIndex + 1);
                this.currentInput = this.history[this.historyIndex] || '';
                this.updateInputDisplay();
            } else if (e.key === 'c' && e.ctrlKey) {
                e.preventDefault();
                this.currentInput = '';
                this.updateInputDisplay();
            } else if (e.key.length === 1) {
                e.preventDefault();
                this.currentInput = (this.currentInput || '') + e.key;
                this.updateInputDisplay();
            }
        });

        // Initialize input display
        this.currentInput = '';
        this.createInputDisplay();
    }

    createInputDisplay() {
        this.inputDisplay = document.createElement('div');
        this.inputDisplay.className = 'terminal-line';
        this.inputDisplay.id = 'terminal-input-display';
        this.output.appendChild(this.inputDisplay);
    }

    updateInputDisplay() {
        if (!this.inputDisplay) {
            this.createInputDisplay();
        }
        const prompt = this.getPrompt();
        this.inputDisplay.innerHTML = `<span class="prompt">${prompt}</span> <span class="command" style="border-right: 2px solid #00ff00; padding-right: 3px;">${this.currentInput}</span>`;
        this.scrollToBottom();
        
        // Sync mobile input helper
        if (this.mobileInput) {
            this.mobileInput.value = this.currentInput;
        }
    }

    updateCvClearanceDisplay() {
        if (!this.inputDisplay) {
            this.createInputDisplay();
        }
        let promptText = '';
        if (this.cvClearanceMode.step === 'name') promptText = 'FULL NAME: ';
        else if (this.cvClearanceMode.step === 'org') promptText = 'ORGANIZATION: ';
        else if (this.cvClearanceMode.step === 'purpose') promptText = 'PURPOSE OF ACCESS: ';
        else if (this.cvClearanceMode.step === 'challenge') promptText = 'DECRYPTION KEY: ';
        
        let displayInput = this.currentInput;
        if (this.cvClearanceMode.step === 'challenge') {
            displayInput = '*'.repeat(this.currentInput.length);
        }
        
        this.inputDisplay.innerHTML = `<span class="info" style="flex: none; white-space: nowrap;">${promptText}</span> <span class="command" style="border-right: 2px solid #00ff00; padding-right: 3px;">${displayInput}</span>`;
        this.scrollToBottom();
        
        // Sync mobile input helper
        if (this.mobileInput) {
            this.mobileInput.value = this.currentInput;
        }
    }

    async sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async handleCvClearanceInput(input) {
        input = input.trim();
        
        // Remove active input display
        if (this.inputDisplay) {
            this.inputDisplay.remove();
            this.inputDisplay = null;
        }

        let promptText = '';
        if (this.cvClearanceMode.step === 'name') promptText = 'FULL NAME: ';
        else if (this.cvClearanceMode.step === 'org') promptText = 'ORGANIZATION: ';
        else if (this.cvClearanceMode.step === 'purpose') promptText = 'PURPOSE OF ACCESS: ';
        else if (this.cvClearanceMode.step === 'challenge') promptText = 'DECRYPTION KEY: ';

        const displayInput = this.cvClearanceMode.step === 'challenge' ? '*'.repeat(input.length) : input;
        
        // Append finalized line
        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.innerHTML = `<span class="info" style="flex: none; white-space: nowrap;">${promptText}</span> <span class="command">${displayInput}</span>`;
        this.output.appendChild(line);
        if (this.cvClearanceMode.step === 'name') {
            const parts = input.split(' ').filter(p => p.length > 0);
            if (parts.length >= 2 && parts.every(p => p.length >= 2)) {
                this.cvClearanceMode.name = input;
                this.cvClearanceMode.step = 'org';
            }
        } else if (this.cvClearanceMode.step === 'org') {
            if (input.length < 2) {
                this.addLine('Error: Organization must be at least 2 characters.', 'error');
            } else {
                this.cvClearanceMode.org = input;
                this.cvClearanceMode.step = 'purpose';
            }
        } else if (this.cvClearanceMode.step === 'purpose') {
            const words = input.trim().split(/\s+/);
            const isDescriptive = (words.length >= 4 || input.length >= 20);
            const isNotGibberish = !/(.)\1{3,}/.test(input) && /[aeiouy]/i.test(input);
            
            if (!isDescriptive || !isNotGibberish) {
                this.addLine('Error: Purpose must be descriptive.', 'error');
            } else {
                this.cvClearanceMode.purpose = input;
                this.cvClearanceMode.step = 'wait';
                
                this.addLine('', 'output');
                this.addLine('IDENTIFICATION ACCEPTED.', 'success');
                this.addLine('INITIATING BACKGROUND CHECK...', 'warning');
                
                // Silently alert owner that someone reached the clearance protocol
                setTimeout(() => {
                    const sendAlert = (networkData = null) => {
                        const formData = new FormData();
                        formData.append('subject', '🚨 Terminal Alert: CV Clearance Protocol Initiated');
                        formData.append('Name', this.cvClearanceMode.name);
                        formData.append('Organization', this.cvClearanceMode.org);
                        formData.append('Purpose', this.cvClearanceMode.purpose);
                        
                        if (networkData) {
                            formData.append('IP_Address', networkData.ip || 'Unknown');
                            formData.append('ISP_Org', networkData.org || 'Unknown');
                            formData.append('Location', `${networkData.city}, ${networkData.region}, ${networkData.country}`);
                            formData.append('Coordinates', networkData.loc || 'Unknown');
                            formData.append('Hostname', networkData.hostname || 'Unknown');
                            formData.append('Timezone_IP', networkData.timezone || 'Unknown');
                        } else {
                            formData.append('IP_Address', 'Unknown (Blocked by Client)');
                        }
                        
                        formData.append('User_Agent', navigator.userAgent);
                        formData.append('Screen_Size', `${window.screen.width}x${window.screen.height}`);
                        formData.append('Timezone_Sys', Intl.DateTimeFormat().resolvedOptions().timeZone);
                        formData.append('Language', navigator.language);
                        
                        fetch('https://formspree.io/f/meajpwql', {
                            method: 'POST',
                            body: formData,
                            headers: { 'Accept': 'application/json' }
                        }).catch(() => {});
                    };

                    fetch('https://ipinfo.io/json')
                        .then(r => r.json())
                        .then(data => sendAlert(data))
                        .catch(() => sendAlert(null));
                }, 100);
                
                let progress = 0;
                const progressLine = document.createElement('div');
                progressLine.className = 'terminal-line';
                this.output.appendChild(progressLine);
                
                // We simulate a wait to deter scrapers/creeps (15 seconds total)
                const interval = setInterval(() => {
                    progress += 5;
                    const hashes = '#'.repeat(Math.floor(progress / 5));
                    const dots = '.'.repeat(20 - Math.floor(progress / 5));
                    progressLine.innerHTML = `<span class="info">[${hashes}${dots}] ${progress}%</span>`;
                    
                    if (progress >= 100) {
                        clearInterval(interval);
                        setTimeout(() => this.startCvChallenge(), 1000);
                    }
                }, 750); // 15 seconds
                return;
            }
        } else if (this.cvClearanceMode.step === 'challenge') {
            // Hash the user's input and compare against stored hash
            const userAnswer = input.toLowerCase();
            const inputHash = await this.sha256(userAnswer);
            
            if (inputHash === this.cvClearanceMode.currentChallenge.h) {
                this.cvClearanceMode.active = false;
                this.addLine('', 'output');
                this.addLine('CLEARANCE GRANTED. DECRYPTING PAYLOAD...', 'success');
                
                // Unwrap the master key using the raw user input (not the hash)
                const wrapped = atob(this.cvClearanceMode.currentChallenge.k);
                let masterKey = '';
                for(let i=0; i<wrapped.length; i++) {
                    masterKey += String.fromCharCode(wrapped.charCodeAt(i) ^ userAnswer.charCodeAt(i % userAnswer.length));
                }
                
                this.showCaptcha(masterKey);
            } else {
                this.cvClearanceMode.active = false;
                this.addLine('', 'output');
                this.addLine('ACCESS DENIED. INCORRECT KEY.', 'error');
                this.addLine('SECURITY BREACH DETECTED. PROTOCOL RESET.', 'warning');
                setTimeout(() => {
                    this.addLine('', 'output');
                    this.executeCommand('get-cv');
                }, 1500);
            }
        }

        if (this.cvClearanceMode.active && this.cvClearanceMode.step !== 'wait') {
            this.currentInput = '';
            this.updateCvClearanceDisplay();
        }
    }

    startCvChallenge() {
        this.addLine('', 'output');
        this.addLine('BACKGROUND CHECK: PASSED', 'success');
        this.addLine('FINAL CLEARANCE REQUIRED', 'warning');
        this.addLine('', 'output');
        this.addLine(`CHALLENGE: ${this.cvClearanceMode.currentChallenge.q}`, 'info');
        this.cvClearanceMode.step = 'challenge';
        this.createInputDisplay();
        this.currentInput = '';
        this.updateCvClearanceDisplay();
    }

    showCaptcha(masterKey) {
        this.cvClearanceMode.step = 'captcha';
        if (this.inputDisplay) {
            this.inputDisplay.remove();
            this.inputDisplay = null;
        }

        this.addLine('', 'output');
        this.addLine('HUMAN VERIFICATION REQUIRED: ALIGN THE DATA BLOCK', 'warning');
        
        const captchaContainer = document.createElement('div');
        captchaContainer.style.margin = '15px 0';
        captchaContainer.style.padding = '20px';
        captchaContainer.style.border = '1px solid #00ff55';
        captchaContainer.style.background = 'rgba(0, 255, 0, 0.05)';
        captchaContainer.style.width = '100%';
        captchaContainer.style.maxWidth = '500px';
        captchaContainer.style.display = 'flex';
        captchaContainer.style.flexDirection = 'column';
        captchaContainer.style.gap = '15px';
        captchaContainer.style.fontFamily = "'Courier New', monospace";
        
        // Create 40 character string
        const targetPos = Math.floor(Math.random() * 25) + 5; // 5 to 30
        let topString = '';
        for(let i=0; i<40; i++) {
            if (i >= targetPos && i < targetPos + 5) topString += '_';
            else topString += Math.random() > 0.5 ? '1' : '0';
        }
        
        captchaContainer.innerHTML = `
            <div style="color: #0ff; font-size: 12px; margin-bottom: 10px;">> SLIDE TO ALIGN THE PAYLOAD BLOCK WITH THE TARGET SLOT</div>
            <div style="color: #ffaa00; font-size: 11px; margin-bottom: 10px;">> HOLD ALIGNMENT FOR 1 SECOND</div>
            
            <div style="background: #000; padding: 15px; border-radius: 4px; overflow: hidden; border: 1px solid rgba(0,255,0,0.2);">
                <div style="color: #00ff00; letter-spacing: 2px; white-space: pre; font-size: 14px;">${topString}</div>
                <div id="captcha-payload" style="color: #ff0055; letter-spacing: 2px; white-space: pre; font-size: 14px;">█████</div>
            </div>
            
            <input type="range" min="0" max="35" value="0" id="captcha-slider" style="width: 100%; cursor: pointer; margin-top: 10px;">
        `;
        
        this.output.appendChild(captchaContainer);
        this.scrollToBottom();
        
        const slider = captchaContainer.querySelector('#captcha-slider');
        const payload = captchaContainer.querySelector('#captcha-payload');
        
        let successTimer = null;
        
        const checkCaptcha = () => {
            const val = parseInt(slider.value);
            let payloadStr = '';
            for(let i=0; i<val; i++) payloadStr += ' ';
            payloadStr += '█████';
            payload.innerText = payloadStr;
            
            if (val === targetPos) {
                if (!successTimer) {
                    payload.style.color = '#00ff55';
                    successTimer = setTimeout(() => {
                        slider.disabled = true;
                        captchaContainer.style.borderColor = '#00ff55';
                        captchaContainer.innerHTML = '<div style="color: #00ff55; text-align: center; font-weight: bold; padding: 20px 0;">VERIFICATION SUCCESSFUL</div>';
                        setTimeout(() => {
                            this.addLine('DECRYPTING PAYLOAD...', 'success');
                            this.decryptAndDownloadCV(masterKey);
                        }, 500);
                    }, 1000); // Must hold it for 1 second
                }
            } else {
                payload.style.color = '#ff0055';
                if (successTimer) {
                    clearTimeout(successTimer);
                    successTimer = null;
                }
            }
        };
        
        slider.addEventListener('input', checkCaptcha);
    }

    async decryptAndDownloadCV(masterKey) {
        try {
            // First we need to fetch the encrypted payload
            const response = await fetch('assets/sys_config.enc');
            if (!response.ok) throw new Error('Payload not found');
            const cipherText = await response.text();
            
            // Decrypt using CryptoJS and the correct challenge answer as password
            const decrypted = CryptoJS.AES.decrypt(cipherText, masterKey);
            const base64Data = decrypted.toString(CryptoJS.enc.Utf8);
            
            if (!base64Data) throw new Error('Decryption failed');
            
            // Reconstruct the PDF blob from base64
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], {type: 'application/pdf'});
            
            // Trigger download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'Saugat_Pokharel_CV.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            
            this.addLine('PAYLOAD DELIVERED.', 'success');
            
            setTimeout(() => {
                this.addLine('', 'output');
                this.createInputDisplay();
                this.currentInput = '';
                this.updateInputDisplay();
            }, 1000);
            
        } catch (e) {
            this.addLine('DECRYPTION PROTOCOL FAILED: ' + e.message, 'error');
            setTimeout(() => {
                this.addLine('', 'output');
                this.createInputDisplay();
                this.currentInput = '';
                this.updateInputDisplay();
            }, 1000);
        }
    }

    setupSidebarCommands() {
        document.querySelectorAll('.cmd-category a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const cmd = link.getAttribute('data-cmd');
                this.executeCommand(cmd);
            });
        });

        // Close button - Fixed selector
        const closeBtn = document.querySelector('.sidebar-footer .btn.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                window.history.back();
            });
        }
    }

    executeCommand(command) {
        command = command.trim();
        
        if (!command) return;

        // Remove old input display FIRST
        if (this.inputDisplay) {
            this.inputDisplay.remove();
            this.inputDisplay = null;
        }

        this.addLine(command, 'command');
        this.history.push(command);
        this.historyIndex = this.history.length;
        this.currentInput = '';

        const parts = command.split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1).join(' ');

        if (cmd === 'sudo') {
            const sudoArgs = parts.slice(1).join(' ');
            const sudoParts = sudoArgs.split(' ');
            const sudoCmd = (sudoParts[0] || '').toLowerCase();
            const sudoCmdArgs = sudoParts.slice(1).join(' ');

            this.handleSudo(sudoArgs);

            const sudoIsAsync = (sudoCmd === 'rm' && sudoCmdArgs === '-rf /') || sudoCmd === 'reboot';
            if (sudoIsAsync) {
                return;
            }

            // Add blank line and prompt after sudo
            this.addLine('', 'output');
            this.scrollToBottom();
            this.createInputDisplay();
            this.currentInput = '';
            this.updateInputDisplay();
        } else if (cmd === 'vim') {
            this.handleVim(args);
            // Don't show prompt - VIM will handle it
        } else if (cmd === 'nano') {
            this.handleNano(args);
            // Don't show prompt - NANO will handle it
        } else if (cmd === 'ping' || cmd === 'hack' || cmd === 'curl' || cmd === 'matrix' || cmd === 'get-cv') {
            // Don't show prompt - async commands handle it when complete
            this.commands[cmd].call(this, args);
        } else {
            const handler = this.commands[cmd];
            if (handler) {
                handler.call(this, args);
            } else {
                this.addLine(``, 'output');
                this.addLine(`command not found: ${cmd}`, 'error');
                this.addLine(`Type 'help' to see available commands`, 'info');
            }
            // Add blank line and prompt for regular commands
            this.addLine('', 'output');
            this.scrollToBottom();
            this.createInputDisplay();
            this.currentInput = '';
            this.updateInputDisplay();
        }
    }

    handleSudo(command) {
        const parts = command.split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1).join(' ');

        this.addLine('[sudo] password for saugat:', 'warning');
        this.addLine('••••••••', 'output');
        this.addLine('', 'output');

        if (cmd === 'rm' && args === '-rf /') {
            this.systemCrash();
        } else if (cmd === 'shutdown') {
            this.addLine('Initiating system shutdown...', 'warning');
            this.addLine('[████████░░] 75%', 'output');
            this.addLine('System halted.', 'error');
        } else if (cmd === 'reboot') {
            this.addLine('System rebooting...', 'warning');
            this.addLine('[██████████] 100%', 'success');
            setTimeout(() => {
                this.addLine('Reboot complete!', 'success');
                this.addLine('Welcome back!', 'info');
                this.addLine('', 'output');
                this.scrollToBottom();
                this.createInputDisplay();
                this.currentInput = '';
                this.updateInputDisplay();
            }, 1000);
        } else if (cmd === 'passwd') {
            this.addLine('Changing password for saugat', 'warning');
            this.addLine('(current) UNIX password:', 'output');
            this.addLine('••••••••', 'output');
            this.addLine('New password:', 'output');
            this.addLine('••••••••', 'output');
            this.addLine('Retype new password:', 'output');
            this.addLine('••••••••', 'output');
            this.addLine('passwd: password updated successfully', 'success');
        } else if (cmd === 'useradd') {
            this.addLine(`Adding new user: ${args}`, 'info');
            this.addLine(`User ${args} created successfully`, 'success');
        } else if (cmd === 'userdel') {
            this.addLine(`Removing user: ${args}`, 'warning');
            this.addLine(`User ${args} removed`, 'success');
        } else if (cmd === 'chmod') {
            this.addLine(`Changed file permissions: ${args}`, 'success');
        } else if (cmd === 'chown') {
            this.addLine(`Changed ownership: ${args}`, 'success');
        } else if (cmd === 'apt-get' || cmd === 'apt') {
            this.handleAptGet(args);
        } else if (cmd === 'systemctl') {
            this.addLine(`systemctl ${args}`, 'info');
            this.addLine(`Service operation completed: ${args}`, 'success');
        } else if (cmd === 'visudo') {
            this.addLine('Opening sudoers file...', 'warning');
            this.addLine('/etc/sudoers (read-only) loaded', 'output');
            this.addLine('No changes made', 'info');
        } else {
            const handler = this.commands[cmd];
            if (handler) {
                this.addLine('Executing with root privileges...', 'warning');
                handler.call(this, args);
            } else {
                this.addLine(`sudo: ${cmd}: command not found`, 'error');
            }
        }
    }

    handleVim(args) {
        if (!args) {
            this.addLine('Usage: vim <filename>', 'warning');
            return;
        }
        this.addLine(`~`, 'output');
        this.addLine(`~`, 'output');
        this.addLine(`~`, 'output');
        this.addLine(`"${args}" [New File]`, 'info');
        this.addLine('', 'output');
        this.vimMode = {
            active: true,
            filename: args,
            insertMode: false,
            content: ''
        };
        this.addLine('-- VIM MODE ACTIVATED --', 'warning');
        this.addLine('Difficulty: EXTREME 🔥', 'error');
        this.addLine('', 'output');
        this.addLine('KEYBINDINGS:', 'warning');
        this.addLine('  i        - Enter INSERT mode', 'info');
        this.addLine('  Esc      - Exit INSERT mode to NORMAL mode', 'info');
        this.addLine('  :        - Enter COMMAND mode (in NORMAL mode)', 'info');
        this.addLine('', 'output');
        this.addLine('VIM COMMANDS (type in NORMAL mode, then :)', 'warning');
        this.addLine('  :q!      - QUIT WITHOUT SAVING (ONLY WAY OUT)', 'error');
        this.addLine('  :q       - Quit (fails if file changed)', 'output');
        this.addLine('  :wq      - Write and quit', 'success');
        this.addLine('  :x       - Write and quit (alias for :wq)', 'success');
        this.addLine('  :w       - Write file', 'info');
        this.addLine('', 'output');
        this.addLine('(Good luck! Many have tried, few have escaped...)', 'error');
    }

    handleNano(args) {
        if (!args) {
            this.addLine('Usage: nano <filename>', 'warning');
            // Show prompt for usage error
            this.addLine('', 'output');
            this.scrollToBottom();
            this.createInputDisplay();
            this.currentInput = '';
            this.updateInputDisplay();
            return;
        }
        this.addLine('GNU nano 5.9.3 | New Buffer | -w disabled', 'info');
        this.addLine('', 'output');
        this.addLine('Welcome! Nano is actually DESIGNED for humans! 😄', 'success');
        this.addLine('', 'output');
        this.addLine('Unlike VIM with its cruel learning curve and ancient keyboard shortcuts,', 'warning');
        this.addLine('nano actually shows you what to do. Revolutionary, I know.', 'warning');
        this.addLine('', 'output');
        this.addLine('Pro tips:', 'info');
        this.addLine('  Ctrl+X  - Exit (it tells you right there at the bottom!)', 'success');
        this.addLine('  Ctrl+O  - Save', 'success');
        this.addLine('  Ctrl+W  - Search', 'success');
        this.addLine('', 'output');
        this.addLine('Honestly, just use VSCode instead. Seriously. 🚀', 'info');
        this.addLine('It has autocomplete, themes, and doesn\'t make you suffer.', 'info');
        this.addLine('', 'output');
        this.addLine('Fun fact: Trying to learn VIM is like voluntarily playing a roguelike', 'warning');
        this.addLine('where one mistake sends you back to the spawn point forever.', 'warning');
        this.addLine('', 'output');
        this.nanoMode = { active: true, filename: args };
        // Don't show prompt - NANO is active
    }

    executeVimCommand(command) {
        if (command === ':q!' || command === ':q') {
            if (command === ':q' && this.vimMode.content) {
                this.addLine('No write since last change. Add ! to override.', 'error');
            } else {
                this.vimMode.active = false;
                this.addLine('You escaped VIM! Congratulations! 🎉', 'success');
                this.addLine('(Most people get stuck here forever...)', 'warning');
                // Show prompt only when exiting VIM
                this.addLine('', 'output');
                this.scrollToBottom();
                this.createInputDisplay();
                this.currentInput = '';
                this.updateInputDisplay();
            }
        } else if (command === ':wq' || command === ':x') {
            this.addLine(`"${this.vimMode.filename}" written`, 'success');
            this.vimMode.active = false;
            this.addLine('File saved and VIM closed! You\'re a wizard! 🧙', 'success');
            // Show prompt only when exiting VIM
            this.addLine('', 'output');
            this.scrollToBottom();
            this.createInputDisplay();
            this.currentInput = '';
            this.updateInputDisplay();
        } else if (command === ':w') {
            this.addLine(`"${this.vimMode.filename}" written`, 'success');
        } else if (command === ':set number') {
            this.addLine('Line numbers enabled', 'info');
        } else if (command === ':help') {
            this.addLine('', 'output');
            this.addLine('VIM Help:', 'warning');
            this.addLine('  i     - Enter insert mode', 'output');
            this.addLine('  Esc   - Exit insert mode', 'output');
            this.addLine('  :q!   - Quit without saving (ONLY WAY OUT)', 'error');
            this.addLine('  :wq   - Save and quit', 'output');
            this.addLine('  :w    - Save', 'output');
        } else {
            this.addLine(`Unknown command: ${command}`, 'error');
            this.addLine('Type :help for help', 'info');
        }
    }

    handleAptGet(args) {
        if (args.includes('update')) {
            this.addLine('Reading package lists... Done', 'output');
            this.addLine('Building dependency tree', 'output');
            this.addLine('[████████████████] 100%', 'success');
            this.addLine('All packages are up to date', 'info');
        } else if (args.includes('install')) {
            const pkg = args.replace('install', '').trim();
            this.addLine(`Processing triggers for ${pkg}...`, 'output');
            this.addLine(`Setting up ${pkg}...`, 'output');
            this.addLine(`${pkg} (1.0) is now installed`, 'success');
        } else if (args.includes('remove')) {
            const pkg = args.replace('remove', '').trim();
            this.addLine(`Removing ${pkg}...`, 'warning');
            this.addLine(`${pkg} has been uninstalled`, 'success');
        }
    }

    systemCrash() {
        if (this.inputDisplay) {
            this.inputDisplay.remove();
            this.inputDisplay = null;
        }

        this.addLine('', 'output');
        this.addLine('WARNING: Attempting to delete root filesystem!', 'error');
        this.addLine('', 'output');
        this.addLine('[CRITICAL] Initializing system shutdown sequence...', 'error');
        this.addLine('', 'output');

        // Create falling characters effect
        let fallingInterval = setInterval(() => {
            const chars = ['█', '▓', '▒', '░', '/', '\\', '|', '-'];
            let line = '';
            for (let i = 0; i < 80; i++) {
                line += chars[Math.floor(Math.random() * chars.length)];
            }
            const lineElem = document.createElement('div');
            lineElem.className = 'terminal-line';
            lineElem.innerHTML = `<span class="error" style="animation: fall 1s linear; display: block;">${line}</span>`;
            this.output.appendChild(lineElem);
        }, 100);

        setTimeout(() => {
            clearInterval(fallingInterval);
            this.addLine('', 'output');
            this.addLine('█████████████████████████████████████████', 'error');
            this.addLine('█  SYSTEM FAILURE - CRITICAL ERROR  █', 'error');
            this.addLine('█████████████████████████████████████████', 'error');
            this.addLine('', 'output');
            this.addLine('ERROR: Cannot delete root filesystem', 'error');
            this.addLine('System protected by portfolio defense mechanisms!', 'warning');
            this.addLine('', 'output');
            this.addLine('Just kidding! 😄 Your system is safe!', 'success');
            this.addLine('Nice try though! This portfolio is indestructible.', 'info');
            this.addLine('', 'output');
            this.scrollToBottom();
            this.createInputDisplay();
            this.currentInput = '';
            this.updateInputDisplay();
        }, 2000);
    }

    addLine(content, type = 'output') {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        
        if (type === 'command') {
            const prompt = this.getPrompt();
            line.innerHTML = `<span class="prompt">${prompt}</span> <span class="command">${content}</span>`;
        } else if (type === 'copyright') {
            line.innerHTML = `<span class="${type}">${content}</span>`;
        } else {
            line.innerHTML = `<span class="${type}">${content}</span>`;
        }
        
        this.output.appendChild(line);
    }

    scrollToBottom() {
        setTimeout(() => {
            this.output.scrollTop = this.output.scrollHeight;
        }, 10);
    }

    prefetchJokes() {
        const now = Date.now();
        if (this.jokeFetchInFlight) return;
        if (this.jokeCache.length >= 10) return;
        if (now - this.lastJokeFetchAt < 60_000) return;

        this.jokeFetchInFlight = true;
        this.lastJokeFetchAt = now;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        fetch('https://v2.jokeapi.dev/joke/Programming?type=single&amount=6', {
            signal: controller.signal,
            cache: 'no-store'
        })
            .then((r) => r.json())
            .then((data) => {
                const jokes = [];
                if (data && Array.isArray(data.jokes)) {
                    for (const j of data.jokes) {
                        if (j && typeof j.joke === 'string' && j.joke.trim()) jokes.push(j.joke.trim());
                    }
                } else if (data && typeof data.joke === 'string' && data.joke.trim()) {
                    jokes.push(data.joke.trim());
                }

                if (jokes.length) {
                    const seen = new Set(this.jokeCache);
                    for (const j of jokes) {
                        if (!seen.has(j)) {
                            this.jokeCache.push(j);
                            seen.add(j);
                        }
                    }
                    if (this.jokeCache.length > 30) {
                        this.jokeCache = this.jokeCache.slice(-30);
                    }
                }
            })
            .catch(() => {
                // ignore network/CORS errors
            })
            .finally(() => {
                clearTimeout(timeoutId);
                this.jokeFetchInFlight = false;
            });
    }

    buildJokePool(localJokes) {
        const unique = new Set([...(localJokes || []), ...(this.jokeCache || [])].map(j => (j || '').trim()).filter(Boolean));
        return [...unique];
    }

    refillJokeBag(pool, poolKey) {
        // Fisher–Yates shuffle
        const arr = [...pool];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        this.jokeBag = arr;
        this.jokePoolKey = poolKey;
    }

    commands = {
        'get-cv': () => {
            const lockoutTime = localStorage.getItem('cv_lockout');
            if (lockoutTime && Date.now() - parseInt(lockoutTime) < 5 * 60 * 1000) {
                const remaining = Math.ceil((5 * 60 * 1000 - (Date.now() - parseInt(lockoutTime))) / 60000);
                this.addLine(`ACCESS DENIED. You are locked out. Try again in ${remaining} minutes.`, 'error');
                this.addLine('', 'output');
                this.createInputDisplay();
                this.currentInput = '';
                this.updateInputDisplay();
                return;
            }
            
            this.addLine('INITIATING CLEARANCE PROTOCOL...', 'warning');
            this.addLine('To access this file, you must identify yourself.', 'info');
            this.addLine('', 'output');
            
            const challenges = [
                { q: 'What is the name of my programmable IR remote project?', h: '7badc52a25794499da05ab66ac43b7f0f0b6d341bc6f643565f35d366f3bd65b', k: 'EQQUCgMYPhACOkBSV1UyCV8Y' },
                { q: 'What is the name of my full-stack e-commerce project?', h: '32e02d937c0e20a578f66d04254d7f67ec95020784fe538b5365fab9aa4c09df', k: 'EQgeFQQaKwYUNllCV1orDlEQ' },
                { q: 'What is the name of my online fundraising system?', h: '4b83e71f0c2bd47e4d49c3383059d86738771b960a81e01cfe94638c3e254518', k: 'AAAdBhgbOBAXN1NJXVMsClsY' },
                { q: 'What is the name of my steganography password manager?', h: '31ca5ab00722b375b00edf9b7eb556145dc7eb6af7dc72a846f293a4f63ffb15', k: 'AwAGFAwVMRMXLEFdU1ovCkAK' },
                { q: 'What is the name of my Productivity Browser Extension?', h: '09fb870816e52cb6f978db7de76b6b1a1f44db2e29c88aadf4ced89be27f1df3', k: 'EQgFCxQCPQoGM0dGUF0vB0YP' },
            ];
            
            let availableChallenges = challenges;
            if (this.lastCvChallenge) {
                availableChallenges = challenges.filter(c => c.h !== this.lastCvChallenge);
            }
            const selectedChallenge = availableChallenges[Math.floor(Math.random() * availableChallenges.length)];
            this.lastCvChallenge = selectedChallenge.h;
            
            this.cvClearanceMode = {
                active: true,
                step: 'name',
                attempts: 0,
                name: '',
                org: '',
                purpose: '',
                currentChallenge: selectedChallenge
            };
            
            this.createInputDisplay();
            this.currentInput = '';
            this.updateCvClearanceDisplay();
        },
        
        whoami: () => {
            this.addLine('Saugat Pokharel', 'success');
            this.addLine('Security Enthusiast | Full-Stack Developer | BCA Student', 'info');
        },

        sudo: () => {
            this.addLine('Usage: sudo <command>', 'warning');
            this.addLine('Example: sudo apt-get update', 'info');
            this.addLine('', 'output');
            this.addLine('Available sudo commands:', 'info');
            this.addLine('  sudo rm -rf /          - DANGER! System wipe simulation', 'error');
            this.addLine('  sudo shutdown          - Simulate system shutdown', 'output');
            this.addLine('  sudo reboot            - Simulate system reboot', 'output');
            this.addLine('  sudo passwd            - Change password', 'output');
            this.addLine('  sudo useradd <user>    - Add new user', 'output');
            this.addLine('  sudo userdel <user>    - Delete user', 'output');
            this.addLine('  sudo chmod <perms>     - Change file permissions', 'output');
            this.addLine('  sudo chown <owner>     - Change file owner', 'output');
            this.addLine('  sudo apt-get update    - Update package list', 'output');
            this.addLine('  sudo apt-get install   - Install package', 'output');
            this.addLine('  sudo systemctl <cmd>   - Manage system services', 'output');
        },

        ls: (args) => {
            if (this.currentDirectory !== '/home/saugat') {
                if (args.includes('-la')) {
                    this.addLine('total 8', 'output');
                    this.addLine('drwxr-xr-x  2 saugat saugat 4096 Jan 15 10:30 .', 'output');
                    this.addLine('drwxr-xr-x  8 saugat saugat 4096 Jan 15 10:30 ..', 'output');
                }
                return;
            }

            if (args.includes('-la')) {
                this.addLine('total 48', 'output');
                this.addLine('drwxr-xr-x  8 saugat saugat 4096 Jan 15 10:30 .', 'output');
                this.addLine('drwxr-xr-x  3 root   root   4096 Jan 15 09:00 ..', 'output');
                this.addLine('-rw-r--r--  1 saugat saugat  234 Jan 15 10:15 README.md', 'output');
                this.addLine('drwxr-xr-x  2 saugat saugat 4096 Jan 15 09:45 projects', 'output');
                this.addLine('drwxr-xr-x  2 saugat saugat 4096 Jan 15 09:45 skills', 'output');
                this.addLine('drwxr-xr-x  2 saugat saugat 4096 Jan 15 09:45 certifications', 'output');
                this.addLine('-rw-r--r--  1 saugat saugat 1024 Jan 15 10:20 resume.pdf', 'output');
                this.addLine('-rw-r--r--  1 saugat saugat  512 Jan 15 10:10 portfolio.json', 'output');
            } else {
                this.addLine('projects/          skills/            certifications/    README.md', 'success');
                this.addLine('resume.pdf         portfolio.json     assets/            scripts/', 'success');
            }
        },

        cd: (args) => {
            if (!args) {
                this.currentDirectory = '/home/saugat';
            } else if (args === '..') {
                const parts = this.currentDirectory.split('/');
                parts.pop();
                this.currentDirectory = parts.join('/') || '/';
            } else {
                const newDir = args.startsWith('/') ? args : this.currentDirectory + '/' + args;
                const allowedDirs = ['/home/saugat', '/home/saugat/projects', '/home/saugat/skills', '/home/saugat/certifications', '/home/saugat/assets', '/home/saugat/scripts'];
                
                if (allowedDirs.includes(newDir)) {
                    this.currentDirectory = newDir;
                    this.addLine(`Changed directory to: ${this.currentDirectory}`, 'info');
                } else {
                    this.addLine(`cd: ${args}: No such file or directory`, 'error');
                }
            }
        },

        cat: (args) => {
            const files = {
                'README.md': 'Saugat\'s Portfolio Terminal\n=====================================\nA unique terminal-based portfolio showcasing my skills in web development and cybersecurity.\n\nFeatures:\n- Interactive terminal interface\n- Multiple command support\n- Real-time project information\n- Easter eggs and fun commands',
                'portfolio.json': '{\n  "name": "Saugat Pokharel",\n  "title": "Full-Stack Developer & Security Enthusiast",\n  "skills": ["Python", "JavaScript", "Django", "Cybersecurity"],\n  "projects": 4,\n  "certifications": 7\n}'
            };
            if (args === 'resume.pdf') {
                this.addLine('PDF-1.4\n%\n1 0 obj\n<<\n/Title ()\n/Creator ()\n/Producer ()\n/CreationDate ()\n>>\nendobj\n...', 'error');
                this.addLine('', 'output');
                this.addLine('[ENCRYPTED PAYLOAD DETECTED]', 'warning');
                this.addLine('Direct access to this file is restricted.', 'error');
                this.addLine("Use the 'get-cv' command to initiate the security clearance protocol.", 'success');
            } else if (files[args]) {
                this.addLine(files[args], 'info');
            } else {
                this.addLine(`cat: ${args}: No such file or directory`, 'error');
            }
        },

        'resume.pdf': () => {
            this.commands['cat'].call(this, 'resume.pdf');
        },
        
        './resume.pdf': () => {
            this.addLine('bash: ./resume.pdf: Permission denied', 'error');
            this.addLine('Maybe try reading it first?', 'info');
        },
        
        open: (args) => {
            if (args === 'resume.pdf') {
                this.commands['cat'].call(this, 'resume.pdf');
            } else {
                this.addLine(`open: ${args}: application not found`, 'error');
            }
        },

        tree: () => {
            this.addLine('.', 'output');
            this.addLine('├── projects/', 'success');
            this.addLine('│   ├── Bikrente/', 'output');
            this.addLine('│   ├── BeamBlaster/', 'output');
            this.addLine('│   ├── Sahayog/', 'output');
            this.addLine('│   └── College-WebApp/', 'output');
            this.addLine('├── skills/', 'success');
            this.addLine('│   ├── cybersecurity.txt', 'output');
            this.addLine('│   ├── webdev.txt', 'output');
            this.addLine('│   └── tools.txt', 'output');
            this.addLine('├── certifications/', 'success');
            this.addLine('│   ├── ethical-hacking.pdf', 'output');
            this.addLine('│   ├── network-security.pdf', 'output');
            this.addLine('│   └── 5-others.pdf', 'output');
            this.addLine('├── README.md', 'output');
            this.addLine('├── resume.pdf', 'output');
            this.addLine('└── portfolio.json', 'output');
        },

        find: (args) => {
            if (!args) {
                this.addLine('Usage: find <name>', 'warning');
            } else {
                this.addLine(`Searching for files matching: ${args}`, 'info');
                this.addLine('./projects/Bikrente/index.html', 'output');
                this.addLine('./projects/BeamBlaster/app.java', 'output');
                this.addLine('./projects/Sahayog/main.py', 'output');
            }
        },

        curl: (args) => {
            if (!args) {
                this.addLine('Usage: curl <website>', 'warning');
                this.addLine('Example: curl apple.com', 'info');
                this.addLine('', 'output');
                this.scrollToBottom();
                this.createInputDisplay();
                this.currentInput = '';
                this.updateInputDisplay();
            } else {
                const url = args.startsWith('http') ? args : 'https://' + args;
                this.addLine(`Opening ${url} in new tab...`, 'warning');
                setTimeout(() => {
                    window.open(url, '_blank');
                    this.addLine(`Successfully opened: ${url}`, 'success');
                    this.addLine('', 'output');
                    this.scrollToBottom();
                    this.createInputDisplay();
                    this.currentInput = '';
                    this.updateInputDisplay();
                }, 500);
            }
        },

        ping: (args) => {
            if (!args) {
                this.addLine('Usage: ping <host>', 'warning');
                // Show prompt for usage error
                this.addLine('', 'output');
                this.scrollToBottom();
                this.createInputDisplay();
                this.currentInput = '';
                this.updateInputDisplay();
                return;
            }
            
            this.addLine(`PING ${args}`, 'info');
            let count = 0;
            let successCount = 0;
            let totalTime = 0;
            
            const pingInterval = setInterval(() => {
                const startTime = Date.now();
                
                fetch(`https://${args}`, { 
                    method: 'HEAD',
                    mode: 'no-cors',
                    cache: 'no-store'
                })
                .then(response => {
                    const endTime = Date.now();
                    const responseTime = endTime - startTime;
                    totalTime += responseTime;
                    successCount++;
                    this.addLine(`bytes=32 from ${args}: time=${responseTime}ms TTL=64`, 'success');
                })
                .catch(error => {
                    const endTime = Date.now();
                    const responseTime = endTime - startTime;
                    this.addLine(`Request timeout from ${args}: time=${responseTime}ms`, 'warning');
                });
                
                count++;
                if (count >= 4) {
                    clearInterval(pingInterval);
                    setTimeout(() => {
                        this.addLine('', 'output');
                        this.addLine(`--- ${args} statistics ---`, 'info');
                        const packetLoss = ((4 - successCount) / 4) * 100;
                        this.addLine(`4 packets transmitted, ${successCount} received, ${packetLoss.toFixed(0)}% packet loss`, 'success');
                        if (successCount > 0) {
                            const avgTime = (totalTime / successCount).toFixed(2);
                            this.addLine(`min/avg/max = ${avgTime}/${avgTime}/${avgTime} ms`, 'info');
                        }
                        // Show prompt only when ping completes
                        this.addLine('', 'output');
                        this.scrollToBottom();
                        this.createInputDisplay();
                        this.currentInput = '';
                        this.updateInputDisplay();
                    }, 100);
                }
            }, 800);
        },

        calc: (args) => {
            if (!args) {
                this.addLine('Usage: calc <expression>', 'warning');
                this.addLine('Example: calc 25 + 50 * 2', 'info');
                return;
            }
    try {
                    const sanitized = args.replace(/[^0-9+\-*/().]/g, '');
                    const result = eval(sanitized);
                    this.addLine(`${args} = ${result}`, 'success');
                } catch (e) {
                    this.addLine('Invalid expression. Only basic math operations allowed.', 'error');
            }
        },

        crunch: (args) => {
            const raw = (args || '').trim();
            if (!raw) {
                this.addLine('Usage: crunch -w|-n|-s|-wns [>|<|<>|><] <len>', 'warning');
                this.addLine('Example: crunch -wns <> 12', 'info');
                this.addLine('Example: crunch -w > 10', 'info');
                return;
            }

            const tokens = raw.split(/\s+/).filter(Boolean);
            const specToken = tokens.find(t => t.startsWith('-'));
            const caseToken = tokens.find(t => t === '>' || t === '<' || t === '<>' || t === '><');
            const lenToken = [...tokens].reverse().find(t => /^\d+$/.test(t));

            if (!specToken || !lenToken) {
                this.addLine('Invalid args. Try: crunch -wns <> 12', 'error');
                return;
            }

            const spec = specToken.replace(/^-+/, '').toLowerCase();
            const pattern = spec.split('').filter(ch => ch === 'w' || ch === 'n' || ch === 's');
            const len = parseInt(lenToken, 10);

            if (!pattern.length) {
                this.addLine('Invalid set. Use -w (word), -n (number), -s (special), or combos like -wns', 'error');
                return;
            }
            if (!Number.isFinite(len) || len <= 0) {
                this.addLine('Length must be a positive number.', 'error');
                return;
            }
            if (len > 128) {
                this.addLine('Max length is 128 (safety limit).', 'warning');
                return;
            }

            const caseMode = caseToken || '<>';

            const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const lower = 'abcdefghijklmnopqrstuvwxyz';
            const digits = '0123456789';
            const specials = '!@#$%^&*()-_=+[]{};:,.?/~';

            const pick = (str) => str[Math.floor(Math.random() * str.length)];

            const letterForIndex = (i) => {
                if (caseMode === '>') return pick(upper);
                if (caseMode === '<') return pick(lower);
                if (caseMode === '><') return (i % 2 === 0) ? pick(upper) : pick(lower);
                // '<>' mixed
                return (Math.random() < 0.5) ? pick(upper) : pick(lower);
            };

            let out = '';
            for (let i = 0; i < len; i++) {
                const type = pattern[i % pattern.length];
                if (type === 'w') out += letterForIndex(i);
                else if (type === 'n') out += pick(digits);
                else out += pick(specials);
            }

            this.addLine(out, 'success');
        },

        date: () => {
            const now = new Date();
            this.addLine(now.toString(), 'info');
        },

        ip: () => {
            this.addLine('1: lo: <LOOPBACK,UP,LOWER_UP>', 'output');
            this.addLine('    inet 127.0.0.1/8 scope host lo', 'output');
            this.addLine('2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP>', 'output');
            this.addLine('    inet 192.168.1.100/24 brd 192.168.1.255 scope global dynamic eth0', 'output');
            this.addLine('    inet6 fe80::a00:27ff:fe4e:66a1/64 scope link', 'output');
        },

        uname: () => {
            this.addLine('Linux saugat-portfolio 5.15.0-security #1 SMP Fri Jan 1 00:00:00 UTC 2024 x86_64 GNU/Linux', 'output');
        },

        pwd: () => {
            this.addLine(this.currentDirectory, 'output');
        },

        echo: (args) => {
            this.addLine(args || '', 'output');
        },

        about: () => {
            this.addLine('╔════════════════════════════════════════════╗', 'info');
            this.addLine('║          ABOUT SAUGAT POKHAREL            ║', 'info');
            this.addLine('╚════════════════════════════════════════════╝', 'info');
            this.addLine('', 'output');
            this.addLine('I am a BCA student at Tribhuvan University with a passion for', 'output');
            this.addLine('understanding how technology works beneath the surface.', 'output');
            this.addLine('', 'output');
            this.addLine('My journey started with streaming tech content and hands-on exploration.', 'output');
            this.addLine('I have developed expertise in:', 'output');
            this.addLine('  • Web Development (Python, Django, JavaScript, HTML, CSS)', 'success');
            this.addLine('  • Cybersecurity & Network Security', 'success');
            this.addLine('  • Full-Stack Development', 'success');
            this.addLine('  • Ethical Hacking & Penetration Testing', 'success');
            this.addLine('', 'output');
            this.addLine('Outside tech: Trekking, Gaming, Tech Trends', 'warning');
        },

        skills: () => {
            this.addLine('┌─ CYBERSECURITY', 'success');
            this.addLine('│  ├─ Threat Detection', 'output');
            this.addLine('│  ├─ Network Security', 'output');
            this.addLine('│  ├─ Ethical Hacking', 'output');
            this.addLine('│  └─ Penetration Testing', 'output');
            this.addLine('', 'output');
            this.addLine('┌─ WEB DEVELOPMENT', 'success');
            this.addLine('│  ├─ Python & Django', 'output');
            this.addLine('│  ├─ JavaScript & React', 'output');
            this.addLine('│  ├─ HTML & CSS', 'output');
            this.addLine('│  └─ Full-Stack Development', 'output');
            this.addLine('', 'output');
            this.addLine('┌─ TOOLS & TECHNOLOGIES', 'success');
            this.addLine('│  ├─ Git & GitHub', 'output');
            this.addLine('│  ├─ SQLite & MySQL', 'output');
            this.addLine('│  ├─ Docker', 'output');
            this.addLine('│  └─ Linux Command Line', 'output');
        },

        projects: () => {
            this.addLine('', 'output');
            this.addLine('1. BIKRENTE - Smart E-commerce Platform', 'success');
            this.addLine('   • Full-stack Django web application', 'output');
            this.addLine('   • AI chatbot integration', 'output');
            this.addLine('   • Multi-payment system (Esewa, PayPal)', 'output');
            this.addLine('   URL: https://bikrante.onrender.com/', 'info');
            this.addLine('', 'output');
            this.addLine('2. BEAMBLASTER - Programmable IR Remote App', 'success');
            this.addLine('   • Android application', 'output');
            this.addLine('   • Universal remote control', 'output');
            this.addLine('   • SQLite database', 'output');
            this.addLine('   URL: https://github.com/SaugatEDITH/BeamBlaster/', 'info');
            this.addLine('', 'output');
            this.addLine('3. SAHAYOG - Online Fundraising System', 'success');
            this.addLine('   • Django-based web app', 'output');
            this.addLine('   • Real-time payments', 'output');
            this.addLine('   • Campaign management', 'output');
            this.addLine('   URL: https://sahayog-j6ns.onrender.com/', 'info');
            this.addLine('', 'output');
            this.addLine('4. COLLEGE WEB APP', 'success');
            this.addLine('   • Multi-role platform', 'output');
            this.addLine('   • Admin & Teacher dashboards', 'output');
            this.addLine('   • Resource sharing system', 'output');
            this.addLine('   URL: https://college-ubz8.onrender.com/', 'info');
        },

        experience: () => {
            this.addLine('CERTIFICATIONS & EXPERIENCE', 'success');
            this.addLine('───────────────────────────────────────', 'output');
            this.addLine('• Ethical Hacking Essentials', 'output');
            this.addLine('• Network Security Fundamentals', 'output');
            this.addLine('• Web Development Bootcamp', 'output');
            this.addLine('• 7+ Professional Certifications', 'output');
            this.addLine('• 4 Projects Completed', 'output');
            this.addLine('', 'output');
            this.addLine('EDUCATION', 'success');
            this.addLine('───────────────────────────────────────', 'output');
            this.addLine('BCA (Bachelor of Computer Application)', 'output');
            this.addLine('Tribhuvan University', 'output');
        },

        contact: () => {
            this.addLine('CONTACT INFORMATION', 'success');
            this.addLine('───────────────────────────────────────', 'output');
            this.addLine('Email: phoenix@saikripa.com.np', 'info');
            this.addLine('LinkedIn: https://www.linkedin.com/in/saugat-pokharel-63390323a/', 'info');
            this.addLine('GitHub: https://github.com/SaugatEDITH/', 'info');
            this.addLine('Instagram: https://www.instagram.com/saugatedith/', 'info');
        },

        help: () => {
            this.addLine('AVAILABLE COMMANDS', 'success');
            this.addLine('', 'output');
            this.addLine('FILE SYSTEM:', 'warning');
            this.addLine('  ls              - List files', 'output');
            this.addLine('  ls -la          - List files with details', 'output');
            this.addLine('  cd <dir>        - Change directory', 'output');
            this.addLine('  pwd             - Print working directory', 'output');
            this.addLine('  cat <file>      - Display file contents', 'output');
            this.addLine('  tree            - Show directory tree', 'output');
            this.addLine('  find <name>     - Search for files', 'output');
            this.addLine('', 'output');
            this.addLine('TEXT EDITORS:', 'warning');
            this.addLine('  vim <file>      - Open VIM (EXTREME difficulty 🔥)', 'output');
            this.addLine('  nano <file>     - Open NANO (friendly & easy)', 'output');
            this.addLine('', 'output');
            this.addLine('NETWORK:', 'warning');
            this.addLine('  curl <url>      - Open website in new tab', 'output');
            this.addLine('  ping <host>     - Ping a host', 'output');
            this.addLine('  ip a            - Show IP information', 'output');
            this.addLine('', 'output');
            this.addLine('SYSTEM:', 'warning');
            this.addLine('  whoami          - Display current user', 'output');
            this.addLine('  uname -a        - System information', 'output');
            this.addLine('  date            - Show current date & time', 'output');
            this.addLine('  echo <text>     - Print text', 'output');
            this.addLine('', 'output');
            this.addLine('ADMIN (SUDO):', 'warning');
            this.addLine('  sudo <command> - Execute with admin privileges', 'output');
            this.addLine('  sudo rm -rf /   - DANGER! See what happens 😄', 'error');
            this.addLine('  sudo shutdown   - Simulate shutdown', 'output');
            this.addLine('  sudo reboot     - Simulate reboot', 'output');
            this.addLine('', 'output');
            this.addLine('MATH & UTILITIES:', 'warning');
            this.addLine('  calc <expr>     - Calculate expression (calc 5+3*2)', 'output');
            this.addLine('  clear           - Clear terminal screen', 'output');
            this.addLine('', 'output');
            this.addLine('PORTFOLIO:', 'warning');
            this.addLine('  about           - Learn about Saugat', 'output');
            this.addLine('  skills          - View technical skills', 'output');
            this.addLine('  projects        - See completed projects', 'output');
            this.addLine('  experience      - Certifications & experience', 'output');
            this.addLine('  contact         - Contact information', 'output');
            this.addLine('', 'output');
            this.addLine('EASTER EGGS:', 'warning');
            this.addLine('  hack            - Activate hack mode', 'output');
            this.addLine('  matrix          - Matrix rain animation', 'output');
            this.addLine('  crunch ...      - Generate random password text', 'output');
            this.addLine('  joke            - Get a random joke', 'output');
            this.addLine('  exit            - Close terminal', 'output');
        },

        clear: () => {
            this.output.innerHTML = '';
            this.createInputDisplay();
            this.currentInput = '';
            this.updateInputDisplay();
        },

        exit: () => {
            this.addLine('', 'output');
            this.addLine('Thanks for visiting my terminal portfolio!', 'success');
            this.addLine('Exiting...', 'warning');
            setTimeout(() => {
                window.history.back();
            }, 1500);
        },

        hack: () => {
            this.addLine('Initiating security protocol...', 'warning');
            let progress = 0;
            
            // Cryptic messages that change each time
            const crypticMessages = [
                '█░███░█░░░█░░░░░░██░░██░░░█░░░░░░██░██░',
                '⚡🔐🔑🛡️💻🌐⚠️🔓🎯🔥',
                'E2 48 C2 1F 3A 9D 7F 8E 4C B1 A3 2E 9B F6 C8',
                '01100101 01111000 01100101 01100011 01110101 01110100 01100101',
                '████▓▓░░▓███░░░█████▓▒░░██▓▒░░░██████',
                '🔓🎯💰🚀🔥⚡🛡️🌐💻🔐',
                'DECODED: [●●●●●●] KERNEL.SYS [●●●●●●]',
                '████████░░ ACCESS GRANTED ░░████████',
                '▓▓▓░░░▓▓▓ FIREWALL BYPASS ▓▓▓░░░▓▓▓',
                'F4E8D9C3 B2A1 7F6E5D4C 3B2A1908'
            ];
            
            const decryptMessages = [
                '🔓 DECRYPTED!',
                '✓ HACKED!',
                '⚡ CRACKED!',
                '💥 BREACHED!',
                '🎯 COMPROMISED!',
                '🔑 UNLOCKED!',
                '🚀 INFILTRATED!',
                '⚔️ PWNED!'
            ];
            
            const randomCryptic = crypticMessages[Math.floor(Math.random() * crypticMessages.length)];
            const randomDecrypt = decryptMessages[Math.floor(Math.random() * decryptMessages.length)];
            
            this.addLine(randomCryptic, 'info');
            this.addLine('', 'output');
            
            const hackInterval = setInterval(() => {
                progress += Math.random() * 25;
                if (progress > 100) progress = 100;
                
                const barLength = Math.round(progress / 10);
                const bar = '█'.repeat(barLength) + '░'.repeat(10 - barLength);
                
                // Update or create progress line
                const lastLine = this.output.lastChild;
                if (lastLine && lastLine.textContent && lastLine.textContent.includes('%')) {
                    lastLine.innerHTML = `<span class="output">[${bar}] ${Math.round(progress)}%</span>`;
                } else {
                    this.addLine(`[${bar}] ${Math.round(progress)}%`, 'output');
                }
                
                this.scrollToBottom();
                
                if (progress >= 100) {
                    clearInterval(hackInterval);
                    this.addLine('', 'output');
                    this.addLine(randomDecrypt, 'success');
                    this.addLine('User: Saugat Pokharel', 'info');
                    this.addLine('Role: Ethical Hacker & Pentester', 'info');
                    this.addLine('Clearance Level: ELITE 🎯', 'success');
                    // Show prompt only when hack completes
                    this.addLine('', 'output');
                    this.scrollToBottom();
                    this.createInputDisplay();
                    this.currentInput = '';
                    this.updateInputDisplay();
                }
            }, 300);
        },

        matrix: () => {
            if (this.inputDisplay) {
                this.inputDisplay.remove();
                this.inputDisplay = null;
            }

            this.addLine('Starting matrix rain...', 'warning');
            this.scrollToBottom();

            const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
            let frame = 0;

            const matrixInterval = setInterval(() => {
                if (frame > 50) {
                    clearInterval(matrixInterval);
                    this.addLine('', 'output');
                    this.addLine('Matrix animation complete.', 'success');
                    this.addLine('', 'output');
                    this.scrollToBottom();
                    this.createInputDisplay();
                    this.currentInput = '';
                    this.updateInputDisplay();
                    return;
                }

                let line = '';
                for (let i = 0; i < 50; i++) {
                    line += chars[Math.floor(Math.random() * chars.length)];
                }

                const line_elem = document.createElement('div');
                line_elem.className = 'terminal-line';
                line_elem.innerHTML = `<span class="success" style="letter-spacing: 2px; font-size: 12px; opacity: ${1 - frame / 100};">${line}</span>`;
                this.output.appendChild(line_elem);

                this.scrollToBottom();
                frame++;
            }, 50);
        },

        joke: () => {
            const jokes = [
                'Why do programmers prefer dark mode? Because light attracts bugs!',
                'How many programmers does it take to change a light bulb? None, that\'s a hardware problem!',
                'Why did the developer go broke? Because he used up all his cache!',
                'Why do Java developers wear glasses? Because they don\'t C#!',
                'How many security experts does it take to change a password? None, they just use the same one everywhere!',
                'What\'s a programmer\'s favorite hangout place? Foo Bar!',
                'Why did the cybersecurity expert go to jail? For hacking their way into people\'s hearts!',
                'There are 10 types of people in the world: those who understand binary and those who don\'t.'
            ];

            const pool = this.buildJokePool(jokes);
            const poolKey = String(pool.length);
            if (!this.jokeBag.length || this.jokePoolKey !== poolKey) {
                this.refillJokeBag(pool, poolKey);
            }

            const next = this.jokeBag.pop();
            this.addLine(next || jokes[0], 'info');

            this.prefetchJokes();
        }
    };
}

// Initialize terminal on page load
document.addEventListener('DOMContentLoaded', () => {
    new Terminal();
});
