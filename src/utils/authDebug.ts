/**
 * Debug and logging utilities for authentication issues
 */

export interface DebugInfo {
  timestamp: string;
  userAgent: string;
  origin: string;
  fbConfig?: {
    projectId: string;
    appId: string;
    authDomain: string;
    hasApiKey: boolean;
  };
  auth?: {
    currentUser: any;
    isAnonymous: boolean;
    lastError: string;
  };
}

/**
 * Collect comprehensive debug information
 */
export function collectDebugInfo(auth?: any, firebaseConfig?: any): DebugInfo {
  return {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    origin: window.location.origin,
    fbConfig: firebaseConfig ? {
      projectId: firebaseConfig.projectId,
      appId: firebaseConfig.appId,
      authDomain: firebaseConfig.authDomain,
      hasApiKey: !!firebaseConfig.apiKey
    } : undefined,
    auth: auth ? {
      currentUser: auth.currentUser ? {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        emailVerified: auth.currentUser.emailVerified,
        isAnonymous: auth.currentUser.isAnonymous,
        metadata: auth.currentUser.metadata
      } : null,
      isAnonymous: auth.currentUser?.isAnonymous || false,
      lastError: auth.lastNotifiedError || 'None'
    } : undefined
  };
}

/**
 * Log auth issues to console with formatting
 */
export function logAuthIssue(issue: string, details?: any): void {
  const styled = `%c[CAREVIA-AUTH-DEBUG]%c ${issue}`;
  console.log(
    styled,
    'color: #ff6b6b; font-weight: bold; background: #ffe0e0; padding: 2px 8px; border-radius: 3px;',
    'color: #ff6b6b; font-weight: normal;',
    details || ''
  );
}

/**
 * Validate Firebase configuration
 */
export function validateFirebaseConfig(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.projectId) errors.push('Missing projectId');
  if (!config.appId) errors.push('Missing appId');
  if (!config.apiKey) errors.push('Missing apiKey');
  if (!config.authDomain) errors.push('Missing authDomain');
  if (!config.storageBucket) errors.push('Missing storageBucket');
  
  // Check if authDomain is accessible
  if (config.authDomain && !config.authDomain.includes('firebaseapp.com')) {
    errors.push('Invalid authDomain format');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Create a debug session ID for tracking
 */
export function createDebugSessionId(): string {
  return `debug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Store debug logs locally
 */
export class DebugLogStore {
  private static readonly STORAGE_KEY = 'carevia_debug_logs';
  private static readonly MAX_LOGS = 50;
  
  static addLog(category: string, message: string, data?: any): void {
    try {
      const logs = this.getLogs();
      logs.push({
        timestamp: new Date().toISOString(),
        category,
        message,
        data,
        sessionId: this.getSessionId()
      });
      
      // Keep only recent logs
      if (logs.length > this.MAX_LOGS) {
        logs.shift();
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
    } catch (e) {
      console.warn('Could not store debug log:', e);
    }
  }
  
  static getLogs(): any[] {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }
  
  static clearLogs(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
  
  static exportLogs(): string {
    return JSON.stringify(this.getLogs(), null, 2);
  }
  
  private static getSessionId(): string {
    let sessionId = sessionStorage.getItem('debug_session_id');
    if (!sessionId) {
      sessionId = createDebugSessionId();
      sessionStorage.setItem('debug_session_id', sessionId);
    }
    return sessionId;
  }
}

/**
 * Network diagnostics for auth issues
 */
export async function runNetworkDiagnostics(): Promise<{
  online: boolean;
  latency: number;
  firebaseReachable: boolean;
  corsIssue: boolean;
}> {
  const start = performance.now();
  const result = {
    online: navigator.onLine,
    latency: 0,
    firebaseReachable: false,
    corsIssue: false
  };
  
  try {
    // Test Firebase connectivity
    const firebaseUrl = 'https://www.gstatic.com/firebasejs/ui/6.0.1/firebase-ui-auth.min.js';
    const response = await fetch(firebaseUrl, { mode: 'no-cors' });
    result.latency = Math.round(performance.now() - start);
    result.firebaseReachable = response.status !== 0;
  } catch (e) {
    result.corsIssue = true;
    result.latency = Math.round(performance.now() - start);
  }
  
  return result;
}

/**
 * Generate debug report for sharing
 */
export async function generateDebugReport(auth?: any, firebaseConfig?: any): Promise<string> {
  const debugInfo = collectDebugInfo(auth, firebaseConfig);
  const networkDiag = await runNetworkDiagnostics();
  const logs = DebugLogStore.getLogs();
  
  return `
# CAREVIA Debug Report
Generated: ${new Date().toISOString()}

## System Info
- Timestamp: ${debugInfo.timestamp}
- User Agent: ${debugInfo.userAgent}
- Origin: ${debugInfo.origin}

## Network Status
- Online: ${networkDiag.online}
- Latency: ${networkDiag.latency}ms
- Firebase Reachable: ${networkDiag.firebaseReachable}
- CORS Issue: ${networkDiag.corsIssue}

## Firebase Configuration
- Project ID: ${debugInfo.fbConfig?.projectId || 'N/A'}
- App ID: ${debugInfo.fbConfig?.appId || 'N/A'}
- Auth Domain: ${debugInfo.fbConfig?.authDomain || 'N/A'}
- API Key Present: ${debugInfo.fbConfig?.hasApiKey || false}

## Recent Logs (Last 10)
${logs.slice(-10).map(log => `
[${log.timestamp}] ${log.category}: ${log.message}
${log.data ? JSON.stringify(log.data, null, 2) : ''}
`).join('\n')}

## Current Auth State
${debugInfo.auth ? JSON.stringify(debugInfo.auth, null, 2) : 'No auth info'}
  `.trim();
}
