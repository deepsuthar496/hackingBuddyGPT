import React, { useState, useEffect } from 'react';
import { Shield, Settings, MessageSquare, Activity, AlertTriangle } from 'lucide-react';
import ConfigurationPanel from './components/ConfigurationPanel';
import ChatInterface from './components/ChatInterface';
import VulnerabilityDashboard from './components/VulnerabilityDashboard';
import StatusBar from './components/StatusBar';
import { Configuration, ChatMessage, Vulnerability, SystemStatus } from './types';
import { HackingBuddyService } from './services/HackingBuddyService';

function App() {
  const [activeTab, setActiveTab] = useState<'config' | 'chat' | 'vulnerabilities'>('config');
  const [configuration, setConfiguration] = useState<Configuration>({
    llm: {
      model: 'gemma2:2b',
      api_url: '',
      api_key: 'sk-no-key-needed',
      context_size: 16385,
      api_path: '/v1/chat/completions',
      api_timeout: 240,
      api_backoff: 60,
      api_retries: 3
    },
    connection: {
      host: '',
      hostname: '',
      port: 22,
      username: '',
      password: '',
      keyfilename: ''
    }
  });
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    connected: false,
    scanning: false,
    lastScan: null,
    vulnerabilitiesFound: 0
  });
  
  const [hackingService] = useState(() => new HackingBuddyService());

  useEffect(() => {
    // Initialize service with configuration updates
    hackingService.onConfigurationUpdate(configuration);
    
    // Set up event listeners
    hackingService.onMessage((message) => {
      setMessages(prev => [...prev, message]);
    });
    
    hackingService.onVulnerabilityFound((vulnerability) => {
      setVulnerabilities(prev => [...prev, vulnerability]);
      setSystemStatus(prev => ({
        ...prev,
        vulnerabilitiesFound: prev.vulnerabilitiesFound + 1
      }));
    });
    
    hackingService.onStatusChange((status) => {
      setSystemStatus(prev => ({ ...prev, ...status }));
    });
  }, [configuration, hackingService]);

  const handleConfigurationSave = (newConfig: Configuration) => {
    setConfiguration(newConfig);
    hackingService.onConfigurationUpdate(newConfig);
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      await hackingService.sendMessage(content);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        sender: 'system',
        timestamp: new Date(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleStartScan = async () => {
    try {
      setSystemStatus(prev => ({ ...prev, scanning: true }));
      await hackingService.startAutomaticScan();
    } catch (error) {
      console.error('Failed to start scan:', error);
      setSystemStatus(prev => ({ ...prev, scanning: false }));
    }
  };

  const handleStopScan = async () => {
    try {
      await hackingService.stopScan();
      setSystemStatus(prev => ({ ...prev, scanning: false }));
    } catch (error) {
      console.error('Failed to stop scan:', error);
    }
  };

  const tabs = [
    { id: 'config' as const, label: 'Configuration', icon: Settings },
    { id: 'chat' as const, label: 'AI Chat', icon: MessageSquare },
    { id: 'vulnerabilities' as const, label: 'Vulnerabilities', icon: AlertTriangle }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-600 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">HackingBuddyGPT</h1>
                <p className="text-sm text-gray-500">AI Security Testing Framework</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Activity className={`w-4 h-4 ${systemStatus.connected ? 'text-success-500' : 'text-gray-400'}`} />
                <span className="text-sm text-gray-600">
                  {systemStatus.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              {systemStatus.scanning && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-warning-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-warning-700">Scanning...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.id === 'vulnerabilities' && vulnerabilities.length > 0 && (
                    <span className="bg-danger-100 text-danger-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      {vulnerabilities.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'config' && (
          <ConfigurationPanel
            configuration={configuration}
            onSave={handleConfigurationSave}
            onTestConnection={async () => {
              try {
                const result = await hackingService.testConnection();
                setSystemStatus(prev => ({ ...prev, connected: result }));
                return result;
              } catch (error) {
                setSystemStatus(prev => ({ ...prev, connected: false }));
                throw error;
              }
            }}
          />
        )}
        
        {activeTab === 'chat' && (
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            onStartScan={handleStartScan}
            onStopScan={handleStopScan}
            systemStatus={systemStatus}
            isConfigured={!!configuration.llm.api_url && !!configuration.connection.host}
          />
        )}
        
        {activeTab === 'vulnerabilities' && (
          <VulnerabilityDashboard
            vulnerabilities={vulnerabilities}
            onClearVulnerabilities={() => setVulnerabilities([])}
            onExportReport={() => hackingService.exportReport(vulnerabilities)}
          />
        )}
      </main>

      {/* Status Bar */}
      <StatusBar
        status={systemStatus}
        vulnerabilityCount={vulnerabilities.length}
      />
    </div>
  );
}

export default App;