// ── DOM ──
const dropzone       = document.getElementById('dropzone');
const fileInput      = document.getElementById('file-input');
const filePreview    = document.getElementById('file-preview');
const fileName       = document.getElementById('file-name');
const fileExt        = document.getElementById('file-ext');
const fileSize       = document.getElementById('file-size');
const fileRemove     = document.getElementById('file-remove');
const emailInput     = document.getElementById('email-input');
const uploadBtn      = document.getElementById('upload-btn');
const progressWrap   = document.getElementById('progress-wrap');
const progressFill   = document.getElementById('progress-fill');
const progressPct    = document.getElementById('progress-pct');
const progressLbl    = document.getElementById('progress-label');
const formBody       = document.getElementById('form-body');
const successPanel   = document.getElementById('success-panel');
const uploadCard     = document.getElementById('upload-card');
const resetBtn       = document.getElementById('reset-btn');
const logBody        = document.getElementById('log-body');
const logCountEl     = document.getElementById('log-count');
const passwordWrap   = document.getElementById('password-wrap');
const passwordInput  = document.getElementById('password-input');
const togglePw       = document.getElementById('toggle-pw');
const strengthFill   = document.getElementById('strength-fill');
const strengthLabel  = document.getElementById('strength-label');
const shareLinkBox   = document.getElementById('share-link-box');
const shareLinkLabel = document.getElementById('share-link-label');
const shareNote      = document.getElementById('share-note');
const btnCopy        = document.getElementById('btn-copy');

// ── Validate ──
function validate() {
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value);
  const pwOk = encMode === 'auto' || passwordInput.value.length >= 8;
  uploadBtn.disabled = !(selectedFile && emailOk && pwOk);
}

// ── Format bytes ──
function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  return (b / (1024 * 1024)).toFixed(1) + ' MB';
}

// ── Encryption mode ──
document.querySelectorAll('input[name="enc-mode"]').forEach(radio => {
  radio.addEventListener('change', () => {
    encMode = radio.value;
    passwordWrap.classList.toggle('show', encMode === 'password');
    validate();
  });
});

// ── Password visibility ──
togglePw.addEventListener('click', () => {
  const isText = passwordInput.type === 'text';
  passwordInput.type = isText ? 'password' : 'text';
  togglePw.textContent = isText ? 'show' : 'hide';
});

// ── Password strength ──
const strengthLevels = [
  { label: 'weak',   color: '#e84040', pct: 25 },
  { label: 'fair',   color: '#e8a020', pct: 50 },
  { label: 'good',   color: '#a0c820', pct: 75 },
  { label: 'strong', color: '#28c76f', pct: 100 },
];

function scorePassword(pw) {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 14) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(Math.floor(score / 5 * 4), 3);
}

passwordInput.addEventListener('input', () => {
  const pw = passwordInput.value;
  if (!pw) {
    strengthFill.style.width = '0%';
    strengthLabel.textContent = '—';
    strengthLabel.style.color = '';
    return;
  }
  const lvl = strengthLevels[scorePassword(pw)];
  strengthFill.style.width = lvl.pct + '%';
  strengthFill.style.background = lvl.color;
  strengthLabel.textContent = lvl.label;
  strengthLabel.style.color = lvl.color;
  validate();
});

// ── File selection ──
function selectFile(file) {
  if (!file) return;
  selectedFile = file;
  const parts = file.name.split('.');
  const ext = parts.length > 1 ? parts.pop().toUpperCase() : 'BIN';
  fileExt.textContent = ext;
  fileName.textContent = file.name;
  fileSize.textContent = formatBytes(file.size);
  filePreview.classList.add('show');
  addLog(`File selected: ${file.name} (${formatBytes(file.size)})`, 'ok');
  validate();
}

fileInput.addEventListener('change', () => selectFile(fileInput.files[0]));
dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
dropzone.addEventListener('drop', e => {
  e.preventDefault();
  dropzone.classList.remove('drag-over');
  if (e.dataTransfer.files[0]) selectFile(e.dataTransfer.files[0]);
});

fileRemove.addEventListener('click', e => {
  e.stopPropagation();
  selectedFile = null;
  fileInput.value = '';
  filePreview.classList.remove('show');
  progressWrap.classList.remove('show');
  addLog('File removed.', 'warn');
  validate();
});

// ── Copy link ──
btnCopy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(shareLinkBox.textContent);
    btnCopy.textContent = 'copied!';
    btnCopy.classList.add('copied');
    setTimeout(() => { btnCopy.textContent = 'copy'; btnCopy.classList.remove('copied'); }, 2000);
  } catch {
    btnCopy.textContent = 'failed';
  }
});

// ── Countdown ──
function startCountdown() {
  let remaining = 24 * 60 * 60;
  const el = successPanel.querySelector('.expiry-badge span');
  const tick = () => {
    const h = String(Math.floor(remaining / 3600)).padStart(2, '0');
    const m = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
    const s = String(remaining % 60).padStart(2, '0');
    el.textContent = `${h}:${m}:${s}`;
    if (remaining-- > 0) setTimeout(tick, 1000);
  };
  tick();
}

// ── Reset ──
resetBtn.addEventListener('click', () => {
  selectedFile = null;
  fileInput.value = '';
  emailInput.value = '';
  passwordInput.value = '';
  strengthFill.style.width = '0%';
  strengthLabel.textContent = '—';
  filePreview.classList.remove('show');
  progressWrap.classList.remove('show');
  passwordWrap.classList.remove('show');
  formBody.style.display = '';
  successPanel.classList.remove('show');
  uploadCard.classList.remove('success');
  uploadBtn.disabled = true;
  encMode = 'auto';
  document.querySelector('input[value="auto"]').checked = true;
  addLog('Session cleared. Ready to burn.', '');
});