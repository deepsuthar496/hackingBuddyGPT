export interface LLMConfiguration {
  model: string;
  api_url: string;
  api_key: string;
  context_size: number;
  api_path: string;
  api_timeout: number;
  api_backoff: number;
  api_retries: number;
}

export interface ConnectionConfiguration {
  host: string;
  hostname: string;
  port: number;
  username: string;
  password: string;
  keyfilename: string;
}

export interface Configuration {
  llm: LLMConfiguration;
  connection: ConnectionConfiguration;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant' | 'system';
  timestamp: Date;
  type: 'text' | 'command' | 'result' | 'error' | 'vulnerability';
  metadata?: {
    command?: string;
    exitCode?: number;
    vulnerability?: Vulnerability;
  };
}

export interface Vulnerability {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  discoveredAt: Date;
  affectedComponent: string;
  recommendation: string;
  evidence: string[];
  cvss?: number;
  cve?: string;
}

export interface SystemStatus {
  connected: boolean;
  scanning: boolean;
  lastScan: Date | null;
  vulnerabilitiesFound: number;
}

export interface ScanProgress {
  currentStep: string;
  progress: number;
  totalSteps: number;
  estimatedTimeRemaining?: number;
}