// Dashboard JavaScript - AI Cyberpunk Edition
// Handles form submissions, API interactions, and Real-time Logging

document.addEventListener('DOMContentLoaded', function() {
  initializeDashboard();
});

function initializeDashboard() {
  log('Initializing AI Dashboard protocols...', 'info');
  setupForms();
  loadProjectStats();
  // Poll for structure updates every 30 seconds
  setInterval(loadProjectStats, 30000);
}

function log(message, type = 'info') {
  const terminal = document.getElementById('terminal-logs');
  if (!terminal) return;
  
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  
  const timestamp = new Date().toLocaleTimeString();
  entry.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${message}`;
  
  terminal.appendChild(entry);
  terminal.scrollTop = terminal.scrollHeight;
}

function setupForms() {
  // Component generation form
  const componentForm = document.getElementById('component-form');
  if (componentForm) {
    componentForm.addEventListener('submit', handleComponentGeneration);
  }
  
  const agentChatForm = document.getElementById('agent-chat-form');
  if (agentChatForm) {
    agentChatForm.addEventListener('submit', handleAgentChat);
  }
}

async function loadProjectStats() {
  try {
    const response = await fetch('/api/structure');
    const data = await response.json();
    
    // Update stats
    if (data.components) {
      document.getElementById('stat-components').textContent = data.components.length;
    }
    if (data.pages) {
      document.getElementById('stat-pages').textContent = data.pages.length;
    }
    
    // Log if it's not the initial load (we can check if terminal has few logs)
    // For now, just silent update unless error
  } catch (error) {
    log('Failed to fetch project stats: ' + error.message, 'error');
  }
}

async function handleComponentGeneration(event) {
  event.preventDefault();
  
  const nameInput = document.getElementById('component-name');
  const typeInput = document.getElementById('component-type');
  const contentInput = document.getElementById('component-content');
  
  const data = {
    name: nameInput.value,
    type: typeInput.value,
    content: contentInput.value,
    aiMetadata: {
        prompt: `Create a ${typeInput.value} component named ${nameInput.value}`,
        generatedBy: 'User via Dashboard'
    }
  };
  
  if (!data.name) {
    log('Validation Error: Component name is required', 'error');
    return;
  }
  
  try {
    log(`Initiating generation protocol for ${data.name}...`, 'info');
    
    const response = await fetch('/api/generate/component', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      log(`SUCCESS: Component generated at ${result.path}`, 'success');
      // Reset form
      nameInput.value = '';
      contentInput.value = '';
      // Refresh stats
      loadProjectStats();
    } else {
      log(`GENERATION FAILED: ${result.error || 'Unknown error'}`, 'error');
      if (result.details) {
        log(JSON.stringify(result.details), 'error');
      }
    }
  } catch (error) {
    log(`CRITICAL ERROR: ${error.message}`, 'error');
  }
}

async function handleAgentChat(event) {
  event.preventDefault();
  
  const messageInput = document.getElementById('agent-message');
  const targetSelect = document.getElementById('agent-target');
  const chatBox = document.getElementById('chat-box');
  
  const message = messageInput.value.trim();
  const agentTarget = targetSelect.value;
  
  if (!message) return;
  
  // Add user message to UI
  const time = new Date().toLocaleTimeString();
  chatBox.innerHTML += `<div style="color: #fff; margin-bottom: 0.5rem;">[${time}] <span style="color: var(--primary-color)">[YOU -> ${agentTarget}]</span> ${message}</div>`;
  
  // Semua pilihan kini bersifat OTONOM (Langsung eksekusi)
  chatBox.innerHTML += `<div style="color: var(--secondary-color); margin-bottom: 0.5rem;" id="loading-${Date.now()}">[${time}] <span style="color: var(--warning-color)">[${agentTarget}]</span> Sedang memikirkan maksud Anda dan mengeksekusi instruksi secara otomatis...</div>`;
  
  chatBox.scrollTop = chatBox.scrollHeight;
  
  messageInput.value = '';
  messageInput.disabled = true;
  targetSelect.disabled = true;
  
  try {
      const endpoint = agentTarget === 'autonomous' ? '/api/autonomous/chat-evolve' : '/api/ide-bridge/chat';
      const payload = agentTarget === 'autonomous' 
          ? { prompt: message } 
          : { message: message, ide: agentTarget };
  
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      // Remove loading indicator
      const loadingEl = document.querySelector(`[id^="loading-"]`);
      if (loadingEl) loadingEl.remove();
      
      if (result.success) {
         if (agentTarget === 'autonomous') {
             chatBox.innerHTML += `<div style="color: var(--text-primary); margin-bottom: 0.5rem; background: rgba(255,255,255,0.05); padding: 0.8rem; border-radius: 6px; border-left: 3px solid var(--primary-color);">
                 <strong style="color: var(--primary-color)">[${agentTarget}]</strong> ${result.chat_response}
             </div>`;
             chatBox.innerHTML += `<div style="color: var(--success-color); margin-bottom: 0.5rem; font-size: 0.8em; opacity: 0.8;">[SYSTEM] File <b>${result.modified_file}</b> termodifikasi. (Hash: ${result.newHash.substring(0, 8)}...)</div>`;
         } else {
             chatBox.innerHTML += `<div style="color: var(--secondary-color); margin-bottom: 0.5rem;">[${new Date().toLocaleTimeString()}] <span style="color: var(--success-color)">[BRIDGE]</span> Instruksi Anda telah ditulis ke <b>.agent-trigger.md</b>. Silakan kembali ke IDE ${agentTarget} Anda dan suruh AI: "Tolong kerjakan perintah di file trigger".</div>`;
         }
      } else {
      chatBox.innerHTML += `<div style="color: var(--error-color); margin-bottom: 0.5rem;">[${new Date().toLocaleTimeString()}] [ERROR] ${agentTarget} bingung: ${result.error || result.message || 'Unknown error'}</div>`;
    }
  } catch (error) {
    // Remove loading indicator
    const loadingEl = document.querySelector(`[id^="loading-"]`);
    if (loadingEl) loadingEl.remove();
    
    chatBox.innerHTML += `<div style="color: var(--error-color); margin-bottom: 0.5rem;">[${new Date().toLocaleTimeString()}] [ERROR] Koneksi ke Agent terputus: ${error.message}</div>`;
  } finally {
    messageInput.disabled = false;
    targetSelect.disabled = false;
    messageInput.focus();
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}
