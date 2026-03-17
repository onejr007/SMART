// Hot Reload Client
// Connects to WebSocket server for live reloading

(function() {
  'use strict';
  
  let ws;
  let reconnectInterval = 1000;
  let maxReconnectInterval = 30000;
  let reconnectDecay = 1.5;
  let timeoutInterval = 2000;
  
  function connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = function() {
      console.log('🔄 Hot reload connected');
      reconnectInterval = 1000;
    };
    
    ws.onmessage = function(event) {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'reload') {
          console.log(`🔄 File changed: ${data.path}`);
          
          // Reload CSS files without page refresh
          if (data.path.endsWith('.css')) {
            reloadCSS();
          } else {
            // Reload page for other file types
            setTimeout(() => {
              window.location.reload();
            }, 100);
          }
        } else if (data.type === 'log') {
          // Send server logs to the dashboard terminal if it exists
          if (typeof window.log === 'function') {
            window.log(`[SERVER] ${data.message}`, data.logType || 'info');
          } else {
            console.log(`[SERVER] ${data.message}`);
          }
        }
      } catch (e) {
        console.error('Hot reload message error:', e);
      }
    };
    
    ws.onclose = function() {
      console.log('🔄 Hot reload disconnected, attempting to reconnect...');
      setTimeout(connect, reconnectInterval);
      reconnectInterval = Math.min(reconnectInterval * reconnectDecay, maxReconnectInterval);
    };
    
    ws.onerror = function(error) {
      console.error('Hot reload error:', error);
    };
  }
  
  function reloadCSS() {
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach(link => {
      const href = link.href;
      const newHref = href.includes('?') 
        ? href.split('?')[0] + '?t=' + Date.now()
        : href + '?t=' + Date.now();
      link.href = newHref;
    });
  }
  
  // Start connection when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', connect);
  } else {
    connect();
  }
  
  // Expose reload function globally for AI use
  window.hotReload = {
    reload: () => window.location.reload(),
    reloadCSS: reloadCSS,
    reconnect: connect
  };
})();