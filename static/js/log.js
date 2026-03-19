function addLog(msg, type = '') {
  const t = new Date().toTimeString().slice(0, 8);
  const line = document.createElement('div');
  line.className = 'log-line';
  line.innerHTML = `<span class="log-time">${t}</span><span class="log-msg ${type}">${msg}</span>`;
  logBody.appendChild(line);
  logBody.scrollTop = logBody.scrollHeight;
  logCount++;
  logCountEl.textContent = `${logCount} event${logCount !== 1 ? 's' : ''}`;
}