// Debug logging utility that logs to both console and sends to server
export const debug = {
  log: (...args: any[]) => {
    console.log(...args);
    // Send to server for logging
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'log',
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' '),
        timestamp: new Date().toISOString()
      })
    }).catch(() => {
      // Ignore fetch errors in logging
    });
  },
  
  error: (...args: any[]) => {
    console.error(...args);
    // Send to server for logging
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'error',
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' '),
        timestamp: new Date().toISOString()
      })
    }).catch(() => {
      // Ignore fetch errors in logging
    });
  }
};
