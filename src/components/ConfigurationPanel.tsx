import React, { useState } from 'react';
import { Save, TestTube, Eye, EyeOff, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { Configuration } from '../types';

interface ConfigurationPanelProps {
  configuration: Configuration;
  onSave: (config: Configuration) => void;
  onTestConnection: () => Promise<boolean>;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  configuration,
  onSave,
  onTestConnection
}) => {
  const [config, setConfig] = useState<Configuration>(configuration);
  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateConfiguration = (): boolean => {
    const newErrors: Record<string, string> = {};

    // LLM Configuration validation
    if (!config.llm.model.trim()) {
      newErrors['llm.model'] = 'Model is required';
    }
    if (!config.llm.api_url.trim()) {
      newErrors['llm.api_url'] = 'API URL is required';
    } else if (!isValidUrl(config.llm.api_url)) {
      newErrors['llm.api_url'] = 'Please enter a valid URL';
    }
    if (config.llm.context_size < 1000) {
      newErrors['llm.context_size'] = 'Context size must be at least 1000';
    }
    if (config.llm.api_timeout < 10) {
      newErrors['llm.api_timeout'] = 'Timeout must be at least 10 seconds';
    }

    // Connection Configuration validation
    if (!config.connection.host.trim()) {
      newErrors['connection.host'] = 'Host is required';
    }
    if (!config.connection.hostname.trim()) {
      newErrors['connection.hostname'] = 'Hostname is required';
    }
    if (!config.connection.username.trim()) {
      newErrors['connection.username'] = 'Username is required';
    }
    if (config.connection.port < 1 || config.connection.port > 65535) {
      newErrors['connection.port'] = 'Port must be between 1 and 65535';
    }
    if (!config.connection.password.trim() && !config.connection.keyfilename.trim()) {
      newErrors['connection.auth'] = 'Either password or key file is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = () => {
    if (validateConfiguration()) {
      onSave(config);
      setTestResult(null);
    }
  };

  const handleTestConnection = async () => {
    if (!validateConfiguration()) {
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const success = await onTestConnection();
      setTestResult(success ? 'success' : 'error');
    } catch (error) {
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  const updateConfig = (path: string, value: any) => {
    const keys = path.split('.');
    const newConfig = { ...config };
    let current: any = newConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setConfig(newConfig);
    
    // Clear error for this field
    if (errors[path]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[path];
        return newErrors;
      });
    }
  };

  const InputField: React.FC<{
    label: string;
    path: string;
    type?: string;
    placeholder?: string;
    description?: string;
    showToggle?: boolean;
    show?: boolean;
    onToggleShow?: () => void;
  }> = ({ label, path, type = 'text', placeholder, description, showToggle, show, onToggleShow }) => {
    const keys = path.split('.');
    let value = config;
    for (const key of keys) {
      value = value[key as keyof typeof value];
    }

    const error = errors[path];

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {description && (
            <span className="text-gray-500 font-normal ml-1">({description})</span>
          )}
        </label>
        <div className="relative">
          <input
            type={showToggle ? (show ? 'text' : 'password') : type}
            value={value as string}
            onChange={(e) => updateConfig(path, type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)}
            placeholder={placeholder}
            className={`input ${error ? 'border-danger-500 focus:ring-danger-500' : ''}`}
          />
          {showToggle && (
            <button
              type="button"
              onClick={onToggleShow}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {show ? (
                <EyeOff className="w-4 h-4 text-gray-400" />
              ) : (
                <Eye className="w-4 h-4 text-gray-400" />
              )}
            </button>
          )}
        </div>
        {error && (
          <p className="text-sm text-danger-600 flex items-center space-x-1">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuration</h2>
          <p className="text-gray-600 mt-1">Configure your Ollama endpoint and target connection settings</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {testResult && (
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${
              testResult === 'success' ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'
            }`}>
              {testResult === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {testResult === 'success' ? 'Connection successful' : 'Connection failed'}
              </span>
            </div>
          )}
          
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="btn btn-secondary flex items-center space-x-2"
          >
            {testing ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <TestTube className="w-4 h-4" />
            )}
            <span>{testing ? 'Testing...' : 'Test Connection'}</span>
          </button>
          
          <button
            onClick={handleSave}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LLM Configuration */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
            <span>LLM Configuration</span>
          </h3>
          
          <div className="space-y-6">
            <InputField
              label="Model"
              path="llm.model"
              placeholder="gemma2:2b"
              description="Ollama model name"
            />
            
            <InputField
              label="API URL"
              path="llm.api_url"
              placeholder="https://your-ollama-endpoint.com"
              description="Ollama API endpoint"
            />
            
            <InputField
              label="API Key"
              path="llm.api_key"
              placeholder="sk-no-key-needed"
              description="Usually not needed for Ollama"
              showToggle
              show={showApiKey}
              onToggleShow={() => setShowApiKey(!showApiKey)}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Context Size"
                path="llm.context_size"
                type="number"
                placeholder="16385"
              />
              
              <InputField
                label="API Timeout"
                path="llm.api_timeout"
                type="number"
                placeholder="240"
                description="seconds"
              />
            </div>
            
            <InputField
              label="API Path"
              path="llm.api_path"
              placeholder="/v1/chat/completions"
              description="OpenAI compatible endpoint"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="API Backoff"
                path="llm.api_backoff"
                type="number"
                placeholder="60"
                description="seconds"
              />
              
              <InputField
                label="API Retries"
                path="llm.api_retries"
                type="number"
                placeholder="3"
              />
            </div>
          </div>
        </div>

        {/* Connection Configuration */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <div className="w-2 h-2 bg-success-500 rounded-full"></div>
            <span>Target Connection</span>
          </h3>
          
          <div className="space-y-6">
            <InputField
              label="Host"
              path="connection.host"
              placeholder="192.168.1.100"
              description="Target IP address"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Hostname"
                path="connection.hostname"
                placeholder="target-server"
              />
              
              <InputField
                label="Port"
                path="connection.port"
                type="number"
                placeholder="22"
              />
            </div>
            
            <InputField
              label="Username"
              path="connection.username"
              placeholder="user"
            />
            
            <InputField
              label="Password"
              path="connection.password"
              placeholder="Leave empty if using key file"
              description="SSH password"
              showToggle
              show={showPassword}
              onToggleShow={() => setShowPassword(!showPassword)}
            />
            
            <InputField
              label="Key Filename"
              path="connection.keyfilename"
              placeholder="/path/to/private/key"
              description="SSH private key file path"
            />
            
            {errors['connection.auth'] && (
              <p className="text-sm text-danger-600 flex items-center space-x-1">
                <AlertCircle className="w-4 h-4" />
                <span>{errors['connection.auth']}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Configuration Preview */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration Preview</h3>
        <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto custom-scrollbar">
{`# LLM Configuration
llm.model='${config.llm.model}'
llm.api_url='${config.llm.api_url}'
llm.api_key='${showApiKey ? config.llm.api_key : '***hidden***'}'
llm.context_size=${config.llm.context_size}
llm.api_path='${config.llm.api_path}'
llm.api_timeout=${config.llm.api_timeout}
llm.api_backoff=${config.llm.api_backoff}
llm.api_retries=${config.llm.api_retries}

# Connection Configuration
conn.host='${config.connection.host}'
conn.hostname='${config.connection.hostname}'
conn.port=${config.connection.port}
conn.username='${config.connection.username}'
conn.password='${showPassword ? config.connection.password : '***hidden***'}'
conn.keyfilename='${config.connection.keyfilename}'`}
        </pre>
      </div>
    </div>
  );
};

export default ConfigurationPanel;