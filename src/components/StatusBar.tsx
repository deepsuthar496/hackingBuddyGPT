import React from 'react';
import { Activity, AlertTriangle, Clock, Wifi, WifiOff } from 'lucide-react';
import { SystemStatus } from '../types';

interface StatusBarProps {
  status: SystemStatus;
  vulnerabilityCount: number;
}

const StatusBar: React.FC<StatusBarProps> = ({ status, vulnerabilityCount }) => {
  const formatLastScan = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <footer className="bg-white border-t border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {status.connected ? (
              <Wifi className="w-4 h-4 text-success-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-sm text-gray-600">
              {status.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Scanning Status */}
          <div className="flex items-center space-x-2">
            <Activity className={`w-4 h-4 ${status.scanning ? 'text-warning-500 animate-pulse' : 'text-gray-400'}`} />
            <span className="text-sm text-gray-600">
              {status.scanning ? 'Scanning...' : 'Idle'}
            </span>
          </div>

          {/* Last Scan */}
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              Last scan: {formatLastScan(status.lastScan)}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          {/* Vulnerability Count */}
          <div className="flex items-center space-x-2">
            <AlertTriangle className={`w-4 h-4 ${vulnerabilityCount > 0 ? 'text-warning-500' : 'text-gray-400'}`} />
            <span className="text-sm text-gray-600">
              {vulnerabilityCount} vulnerabilities
            </span>
          </div>

          {/* System Info */}
          <div className="text-xs text-gray-500">
            HackingBuddyGPT v1.0.0
          </div>
        </div>
      </div>
    </footer>
  );
};

export default StatusBar;