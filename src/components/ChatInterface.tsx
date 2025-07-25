import React, { useState, useRef, useEffect } from 'react';
import { Send, Play, Square, Bot, User, Terminal, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';
import { ChatMessage, SystemStatus } from '../types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onStartScan: () => void;
  onStopScan: () => void;
  systemStatus: SystemStatus;
  isConfigured: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  onStartScan,
  onStopScan,
  systemStatus,
  isConfigured
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!systemStatus.scanning) {
      inputRef.current?.focus();
    }
  }, [systemStatus.scanning]);

  const handleSendMessage = () => {
    if (inputMessage.trim() && !systemStatus.scanning) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
      setIsTyping(true);
      
      // Simulate AI typing
      setTimeout(() => setIsTyping(false), 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageIcon = (message: ChatMessage) => {
    switch (message.sender) {
      case 'user':
        return <User className="w-5 h-5 text-primary-600" />;
      case 'assistant':
        return <Bot className="w-5 h-5 text-success-600" />;
      case 'system':
        return <Terminal className="w-5 h-5 text-gray-600" />;
      default:
        return <Bot className="w-5 h-5 text-gray-600" />;
    }
  };

  const getMessageStyle = (message: ChatMessage) => {
    switch (message.type) {
      case 'error':
        return 'bg-danger-50 border-danger-200 text-danger-800';
      case 'vulnerability':
        return 'bg-warning-50 border-warning-200 text-warning-800';
      case 'command':
        return 'bg-gray-50 border-gray-200 text-gray-800 font-mono';
      case 'result':
        return 'bg-blue-50 border-blue-200 text-blue-800 font-mono';
      default:
        return message.sender === 'user' 
          ? 'bg-primary-50 border-primary-200 text-primary-800'
          : 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isConfigured) {
    return (
      <div className="card text-center py-12">
        <AlertTriangle className="w-12 h-12 text-warning-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Configuration Required</h3>
        <p className="text-gray-600 mb-6">
          Please configure your Ollama endpoint and target connection in the Configuration tab before using the chat interface.
        </p>
        <button
          onClick={() => window.location.hash = '#config'}
          className="btn btn-primary"
        >
          Go to Configuration
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* Chat Header */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Bot className="w-6 h-6 text-primary-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">AI Security Assistant</h3>
                <p className="text-sm text-gray-600">
                  Chat with the AI to discover vulnerabilities automatically
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {systemStatus.lastScan && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Last scan: {formatTimestamp(systemStatus.lastScan)}</span>
              </div>
            )}
            
            {systemStatus.vulnerabilitiesFound > 0 && (
              <div className="flex items-center space-x-2 text-sm text-warning-700">
                <AlertTriangle className="w-4 h-4" />
                <span>{systemStatus.vulnerabilitiesFound} vulnerabilities found</span>
              </div>
            )}
            
            {systemStatus.scanning ? (
              <button
                onClick={onStopScan}
                className="btn btn-danger flex items-center space-x-2"
              >
                <Square className="w-4 h-4" />
                <span>Stop Scan</span>
              </button>
            ) : (
              <button
                onClick={onStartScan}
                disabled={!systemStatus.connected}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Zap className="w-4 h-4" />
                <span>Auto Scan</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="card flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 p-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
              <p className="text-gray-600 mb-6">
                Ask the AI to scan for vulnerabilities or start an automatic scan
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => onSendMessage("Scan the target system for vulnerabilities")}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  "Scan for vulnerabilities"
                </button>
                <button
                  onClick={() => onSendMessage("Check for privilege escalation opportunities")}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  "Check privilege escalation"
                </button>
                <button
                  onClick={() => onSendMessage("Enumerate system information")}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  "Enumerate system"
                </button>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                    {getMessageIcon(message)}
                  </div>
                  
                  <div className={`flex-1 max-w-3xl ${message.sender === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block p-4 rounded-lg border ${getMessageStyle(message)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium opacity-75">
                          {message.sender === 'user' ? 'You' : 
                           message.sender === 'assistant' ? 'AI Assistant' : 'System'}
                        </span>
                        <span className="text-xs opacity-60">
                          {formatTimestamp(message.timestamp)}
                        </span>
                      </div>
                      
                      <div className="whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                      
                      {message.metadata?.vulnerability && (
                        <div className="mt-3 p-3 bg-white rounded border border-warning-300">
                          <div className="flex items-center space-x-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-warning-600" />
                            <span className="font-medium text-warning-800">
                              Vulnerability Detected
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            {message.metadata.vulnerability.title}
                          </p>
                        </div>
                      )}
                      
                      {message.metadata?.command && (
                        <div className="mt-3 p-3 bg-gray-800 text-green-400 rounded font-mono text-sm">
                          <div className="flex items-center space-x-2 mb-1">
                            <Terminal className="w-3 h-3" />
                            <span className="text-xs text-gray-400">Command executed</span>
                          </div>
                          <div>$ {message.metadata.command}</div>
                          {message.metadata.exitCode !== undefined && (
                            <div className="text-xs text-gray-400 mt-1">
                              Exit code: {message.metadata.exitCode}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-success-600" />
                  </div>
                  <div className="flex-1">
                    <div className="inline-block p-4 rounded-lg border bg-gray-50 border-gray-200">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  systemStatus.scanning 
                    ? "AI is scanning automatically..." 
                    : "Ask the AI to scan for vulnerabilities or enter a command..."
                }
                disabled={systemStatus.scanning}
                className="input pr-12"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || systemStatus.scanning}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-primary-600 hover:text-primary-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {systemStatus.scanning && (
            <div className="mt-3 flex items-center space-x-2 text-sm text-warning-700">
              <div className="w-2 h-2 bg-warning-500 rounded-full animate-pulse"></div>
              <span>AI is automatically scanning for vulnerabilities...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;