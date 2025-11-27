class Terminal {
    constructor() {
        this.output = document.getElementById('terminal-output');
        this.history = [];
        this.historyIndex = 0;
        this.currentDirectory = '/home/saugat';
        this.isSudo = false;
        this.setupSidebarCommands();
        this.showWelcomeScreen();
        this.setupKeyboardInput();
    }

    showWelcomeScreen() {
        this.addLine('Copyright (C) 2024 Saugat Pokharel. All rights reserved.', 'copyright');
        this.addLine('Welcome to Saugat\'s Terminal Portfolio v1.0', 'success');
        this.addLine('Type \'help\' to see all available commands', 'info');
        this.addLine('Click commands from sidebar or type directly to explore', 'warning');
        this.addLine('', 'output');
        this.scrollToBottom();
    }

    setupKeyboardInput() {
        document.addEventListener('keydown', (e) => {
            // Don't interfere with special keys or if user is typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
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
                    }, 500);
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
        this.inputDisplay.innerHTML = `<span class="prompt">saugat@portfolio:~$</span> <span class="command" style="border-right: 2px solid #00ff00; padding-right: 3px;">${this.currentInput}</span>`;
        this.scrollToBottom();
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

        this.addLine(`saugat@portfolio:~$ ${command}`, 'command');
        this.history.push(command);
        this.historyIndex = this.history.length;
        this.currentInput = '';

        const parts = command.split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1).join(' ');

        if (cmd === 'sudo') {
            this.handleSudo(parts.slice(1).join(' '));
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
        } else if (cmd === 'ping') {
            // Don't show prompt - ping will handle it when complete
            this.commands[cmd].call(this, args);
        } else if (cmd === 'hack') {
            // Don't show prompt - hack will handle it when complete
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
            // Don't call updateInputDisplay() here - let executeCommand handle it
        }, 2000);
    }

    addLine(content, type = 'output') {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        
        if (type === 'command') {
            line.innerHTML = `<span class="prompt">saugat@portfolio:~$</span> <span class="command">${content}</span>`;
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

    commands = {
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
                this.currentDirectory = args.startsWith('/') ? args : this.currentDirectory + '/' + args;
            }
            this.addLine(`Changed directory to: ${this.currentDirectory}`, 'info');
        },

        cat: (args) => {
            const files = {
                'README.md': 'Saugat\'s Portfolio Terminal\n=====================================\nA unique terminal-based portfolio showcasing my skills in web development and cybersecurity.\n\nFeatures:\n- Interactive terminal interface\n- Multiple command support\n- Real-time project information\n- Easter eggs and fun commands',
                'portfolio.json': '{\n  "name": "Saugat Pokharel",\n  "title": "Full-Stack Developer & Security Enthusiast",\n  "skills": ["Python", "JavaScript", "Django", "Cybersecurity"],\n  "projects": 4,\n  "certifications": 7\n}'
            };
            if (files[args]) {
                this.addLine(files[args], 'info');
            } else {
                this.addLine(`cat: ${args}: No such file or directory`, 'error');
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
            } else {
                const url = args.startsWith('http') ? args : 'https://' + args;
                this.addLine(`Opening ${url} in new tab...`, 'warning');
                setTimeout(() => {
                    window.open(url, '_blank');
                    this.addLine(`Successfully opened: ${url}`, 'success');
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
            } else {
                try {
                    const sanitized = args.replace(/[^0-9+\-*/().]/g, '');
                    const result = eval(sanitized);
                    this.addLine(`${args} = ${result}`, 'success');
                } catch (e) {
                    this.addLine(`Invalid expression: ${args}`, 'error');
                }
            }
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
            this.addLine('  joke            - Get a random joke', 'output');
            this.addLine('  exit            - Close terminal', 'output');
        },

        clear: () => {
            this.output.innerHTML = '';
            this.createInputDisplay();
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
                if (lastLine && lastLine.textContent.includes('%')) {
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
            const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
            this.addLine(randomJoke, 'info');
        }
    };
}

// Initialize terminal on page load
document.addEventListener('DOMContentLoaded', () => {
    new Terminal();
});
