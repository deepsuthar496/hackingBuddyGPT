import axios, { AxiosInstance } from 'axios';
import { Configuration, ChatMessage, Vulnerability, SystemStatus } from '../types';

export class HackingBuddyService {
  private config: Configuration | null = null;
  private apiClient: AxiosInstance;
  private eventListeners: {
    onMessage: ((message: ChatMessage) => void)[];
    onVulnerabilityFound: ((vulnerability: Vulnerability) => void)[];
    onStatusChange: ((status: Partial<SystemStatus>) => void)[];
  } = {
    onMessage: [],
    onVulnerabilityFound: [],
    onStatusChange: []
  };
  
  private scanInterval: NodeJS.Timeout | null = null;
  private messageId = 0;

  constructor() {
    this.apiClient = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  onConfigurationUpdate(config: Configuration) {
    this.config = config;
    
    // Update API client base URL
    if (config.llm.api_url) {
      this.apiClient.defaults.baseURL = config.llm.api_url;
      this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${config.llm.api_key}`;
      this.apiClient.defaults.timeout = config.llm.api_timeout * 1000;
    }
  }

  onMessage(callback: (message: ChatMessage) => void) {
    this.eventListeners.onMessage.push(callback);
  }

  onVulnerabilityFound(callback: (vulnerability: Vulnerability) => void) {
    this.eventListeners.onVulnerabilityFound.push(callback);
  }

  onStatusChange(callback: (status: Partial<SystemStatus>) => void) {
    this.eventListeners.onStatusChange.push(callback);
  }

  private emitMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>) {
    const fullMessage: ChatMessage = {
      ...message,
      id: (++this.messageId).toString(),
      timestamp: new Date()
    };
    
    this.eventListeners.onMessage.forEach(callback => callback(fullMessage));
  }

  private emitVulnerability(vulnerability: Omit<Vulnerability, 'id' | 'discoveredAt'>) {
    const fullVulnerability: Vulnerability = {
      ...vulnerability,
      id: Date.now().toString(),
      discoveredAt: new Date()
    };
    
    this.eventListeners.onVulnerabilityFound.forEach(callback => callback(fullVulnerability));
  }

  private emitStatusChange(status: Partial<SystemStatus>) {
    this.eventListeners.onStatusChange.forEach(callback => callback(status));
  }

  async testConnection(): Promise<boolean> {
    if (!this.config) {
      throw new Error('Configuration not set');
    }

    try {
      // Test LLM connection
      const llmResponse = await this.apiClient.post(this.config.llm.api_path, {
        model: this.config.llm.model,
        messages: [{ role: 'user', content: 'Hello, are you working?' }],
        max_tokens: 10
      });

      if (llmResponse.status !== 200) {
        throw new Error('LLM connection failed');
      }

      // Test SSH connection (simulated)
      const sshTest = await this.simulateSSHConnection();
      
      this.emitStatusChange({ connected: sshTest });
      return sshTest;
    } catch (error) {
      console.error('Connection test failed:', error);
      this.emitStatusChange({ connected: false });
      return false;
    }
  }

  private async simulateSSHConnection(): Promise<boolean> {
    if (!this.config) return false;
    
    // Simulate SSH connection test
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate connection success/failure based on configuration
        const hasCredentials = this.config!.connection.password || this.config!.connection.keyfilename;
        resolve(!!this.config!.connection.host && !!this.config!.connection.username && hasCredentials);
      }, 1000);
    });
  }

  async sendMessage(content: string): Promise<void> {
    if (!this.config) {
      throw new Error('Configuration not set');
    }

    try {
      // Send message to LLM
      const response = await this.apiClient.post(this.config.llm.api_path, {
        model: this.config.llm.model,
        messages: [
          {
            role: 'system',
            content: `You are a security testing AI assistant. You have access to a target system at ${this.config.connection.host} with username ${this.config.connection.username}. Your goal is to find security vulnerabilities and provide detailed analysis. Always respond with actionable security insights and specific commands to execute.`
          },
          {
            role: 'user',
            content: content
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const aiResponse = response.data.choices[0].message.content;
      
      // Emit AI response
      this.emitMessage({
        content: aiResponse,
        sender: 'assistant',
        type: 'text'
      });

      // Analyze response for commands and vulnerabilities
      await this.analyzeAIResponse(aiResponse);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      throw new Error('Failed to communicate with AI model');
    }
  }

  private async analyzeAIResponse(response: string): Promise<void> {
    // Extract commands from AI response
    const commandRegex = /```(?:bash|shell)?\s*(.*?)\s*```/gs;
    const commands = [];
    let match;
    
    while ((match = commandRegex.exec(response)) !== null) {
      commands.push(match[1].trim());
    }

    // Execute commands and analyze results
    for (const command of commands) {
      await this.executeCommand(command);
    }

    // Check for vulnerability indicators in the response
    await this.detectVulnerabilitiesFromResponse(response);
  }

  private async executeCommand(command: string): Promise<void> {
    if (!this.config) return;

    // Simulate command execution
    this.emitMessage({
      content: `Executing command: ${command}`,
      sender: 'system',
      type: 'command',
      metadata: { command }
    });

    // Simulate command results based on common security commands
    const result = await this.simulateCommandExecution(command);
    
    this.emitMessage({
      content: result.output,
      sender: 'system',
      type: 'result',
      metadata: { 
        command,
        exitCode: result.exitCode
      }
    });

    // Analyze command results for vulnerabilities
    await this.analyzeCommandResult(command, result.output);
  }

  private async simulateCommandExecution(command: string): Promise<{ output: string; exitCode: number }> {
    // Simulate realistic command outputs for security testing
    const simulations: Record<string, { output: string; exitCode: number }> = {
      'id': {
        output: 'uid=1001(user) gid=1001(user) groups=1001(user)',
        exitCode: 0
      },
      'whoami': {
        output: 'user',
        exitCode: 0
      },
      'sudo -l': {
        output: 'User user may run the following commands on target:\n    (ALL) NOPASSWD: /usr/bin/find',
        exitCode: 0
      },
      'find / -perm -4000 2>/dev/null': {
        output: '/usr/bin/passwd\n/usr/bin/sudo\n/usr/bin/find\n/usr/bin/python3',
        exitCode: 0
      },
      'ls -la /etc/passwd': {
        output: '-rw-r--r-- 1 root root 2847 Oct 15 10:30 /etc/passwd',
        exitCode: 0
      },
      'cat /etc/os-release': {
        output: 'NAME="Ubuntu"\nVERSION="20.04.3 LTS (Focal Fossa)"\nID=ubuntu\nID_LIKE=debian',
        exitCode: 0
      },
      'ps aux': {
        output: 'USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\nroot         1  0.0  0.1 169404 11084 ?        Ss   Oct15   0:02 /sbin/init\nroot         2  0.0  0.0      0     0 ?        S    Oct15   0:00 [kthreadd]',
        exitCode: 0
      }
    };

    return new Promise((resolve) => {
      setTimeout(() => {
        const result = simulations[command] || {
          output: `Command '${command}' executed successfully`,
          exitCode: 0
        };
        resolve(result);
      }, Math.random() * 2000 + 500); // Random delay between 500ms and 2.5s
    });
  }

  private async analyzeCommandResult(command: string, output: string): Promise<void> {
    // Analyze command outputs for potential vulnerabilities
    const vulnerabilityPatterns = [
      {
        pattern: /NOPASSWD.*find/i,
        title: 'Sudo Privilege Escalation via find',
        description: 'The user can run find with sudo without password, which can be exploited for privilege escalation',
        severity: 'high' as const,
        category: 'Privilege Escalation',
        recommendation: 'Remove NOPASSWD permission for find or restrict its usage',
        evidence: [command, output]
      },
      {
        pattern: /\/usr\/bin\/python3.*4000/,
        title: 'SUID Python Binary',
        description: 'Python binary has SUID bit set, allowing privilege escalation',
        severity: 'critical' as const,
        category: 'Privilege Escalation',
        recommendation: 'Remove SUID bit from Python binary: chmod u-s /usr/bin/python3',
        evidence: [command, output]
      },
      {
        pattern: /uid=0\(root\)/,
        title: 'Root Access Achieved',
        description: 'Successfully escalated privileges to root user',
        severity: 'critical' as const,
        category: 'Privilege Escalation',
        recommendation: 'Investigate how root access was obtained and patch the vulnerability',
        evidence: [command, output]
      }
    ];

    for (const pattern of vulnerabilityPatterns) {
      if (pattern.pattern.test(output)) {
        this.emitVulnerability({
          title: pattern.title,
          description: pattern.description,
          severity: pattern.severity,
          category: pattern.category,
          affectedComponent: this.config?.connection.host || 'Target System',
          recommendation: pattern.recommendation,
          evidence: pattern.evidence
        });

        // Emit vulnerability message
        this.emitMessage({
          content: `🚨 VULNERABILITY DETECTED: ${pattern.title}\n\n${pattern.description}`,
          sender: 'system',
          type: 'vulnerability'
        });
      }
    }
  }

  private async detectVulnerabilitiesFromResponse(response: string): Promise<void> {
    // Detect vulnerability mentions in AI response
    const vulnKeywords = [
      'vulnerability', 'exploit', 'privilege escalation', 'buffer overflow',
      'sql injection', 'xss', 'csrf', 'directory traversal', 'weak password',
      'misconfiguration', 'exposed service', 'unpatched system'
    ];

    const foundKeywords = vulnKeywords.filter(keyword => 
      response.toLowerCase().includes(keyword)
    );

    if (foundKeywords.length > 0) {
      this.emitVulnerability({
        title: 'Potential Security Issue Identified',
        description: `AI analysis suggests potential security concerns: ${foundKeywords.join(', ')}`,
        severity: 'medium',
        category: 'Analysis',
        affectedComponent: this.config?.connection.host || 'Target System',
        recommendation: 'Further investigation required based on AI analysis',
        evidence: [response]
      });
    }
  }

  async startAutomaticScan(): Promise<void> {
    if (!this.config) {
      throw new Error('Configuration not set');
    }

    this.emitStatusChange({ scanning: true, lastScan: new Date() });
    
    this.emitMessage({
      content: 'Starting automatic security scan...',
      sender: 'system',
      type: 'text'
    });

    // Define scan sequence
    const scanCommands = [
      'whoami',
      'id',
      'sudo -l',
      'find / -perm -4000 2>/dev/null | head -20',
      'cat /etc/os-release',
      'ps aux | head -10',
      'netstat -tulpn 2>/dev/null | head -10',
      'ls -la /etc/cron* 2>/dev/null',
      'find /var/www -type f -name "*.php" 2>/dev/null | head -5',
      'cat /etc/passwd | head -10'
    ];

    // Execute scan commands with AI analysis
    let commandIndex = 0;
    this.scanInterval = setInterval(async () => {
      if (commandIndex >= scanCommands.length) {
        await this.stopScan();
        return;
      }

      const command = scanCommands[commandIndex];
      
      // Get AI recommendation for the command
      try {
        const aiPrompt = `As a security expert, analyze this command and explain what we're looking for: ${command}`;
        const aiResponse = await this.apiClient.post(this.config!.llm.api_path, {
          model: this.config!.llm.model,
          messages: [{ role: 'user', content: aiPrompt }],
          max_tokens: 200
        });

        this.emitMessage({
          content: `🔍 ${aiResponse.data.choices[0].message.content}`,
          sender: 'assistant',
          type: 'text'
        });
      } catch (error) {
        console.error('Failed to get AI analysis:', error);
      }

      // Execute the command
      await this.executeCommand(command);
      commandIndex++;
    }, 3000); // Execute command every 3 seconds
  }

  async stopScan(): Promise<void> {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }

    this.emitStatusChange({ scanning: false });
    
    this.emitMessage({
      content: 'Automatic scan completed.',
      sender: 'system',
      type: 'text'
    });
  }

  async exportReport(vulnerabilities: Vulnerability[]): Promise<void> {
    const report = {
      generatedAt: new Date().toISOString(),
      target: this.config?.connection.host,
      vulnerabilities: vulnerabilities,
      summary: {
        total: vulnerabilities.length,
        critical: vulnerabilities.filter(v => v.severity === 'critical').length,
        high: vulnerabilities.filter(v => v.severity === 'high').length,
        medium: vulnerabilities.filter(v => v.severity === 'medium').length,
        low: vulnerabilities.filter(v => v.severity === 'low').length
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}