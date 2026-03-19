uploadBtn.addEventListener("click", async () => {
  if (!selectedFile || uploadBtn.disabled) return;

  uploadBtn.disabled = true;
  progressWrap.classList.add("show");
  progressFill.style.width = "0%";
  progressPct.textContent = "0%";
  progressLbl.textContent = "Generating encryption key…";
  addLog(`Encryption mode: ${encMode}`, "");

  try {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const salt = crypto.getRandomValues(new Uint8Array(16));
    let key, keyFragment;

    if (encMode === "auto") {
      key = await generateAutoKey();
      const rawKey = await crypto.subtle.exportKey("raw", key);
      keyFragment = toBase64(rawKey);
      addLog("Auto-key generated (AES-256-GCM).", "ok");
    } else {
      key = await derivePasswordKey(passwordInput.value, salt);
      keyFragment = null;
      addLog("Key derived from password (PBKDF2 / 250k rounds).", "ok");
    }

    progressLbl.textContent = "Requesting pre-signed URL…";
    addLog("Requesting pre-signed URL from server…", "");

    const params = new URLSearchParams({
      filename: selectedFile.name,
      type: selectedFile.type || "application/octet-stream",
      email: emailInput.value,
      iv: toBase64(iv),
      salt: encMode === "password" ? toBase64(salt) : "",
      mode: encMode,
    });

    const res = await fetch(`/presigned-url?${params}`);
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    const { url, file_id } = await res.json();

    progressLbl.textContent = "Encrypting file…";
    addLog("Encrypting file in browser…", "");
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      await selectedFile.arrayBuffer(),
    );

    addLog("Uploading ciphertext to S3…", "ok");
    progressLbl.textContent = "Uploading to S3…";

    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", "application/octet-stream");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          progressFill.style.width = pct + "%";
          progressPct.textContent = pct + "%";
          if (pct === 100) progressLbl.textContent = "Finalising…";
        }
      };
      xhr.onload = () =>
        xhr.status === 200
          ? resolve()
          : reject(new Error(`S3 error: ${xhr.status}`));
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(encrypted);
    });

    addLog(`Upload complete: ${selectedFile.name}`, "ok");
    addLog(`Confirmation dispatched to ${emailInput.value}`, "ok");
    addLog("Burnbag TTL: 24 h. File will be incinerated.", "warn");

    const baseUrl = `${window.location.origin}/download/${file_id}`;
    const shareUrl = encMode === "auto" ? `${baseUrl}#${keyFragment}` : baseUrl;

    shareLinkBox.textContent = shareUrl;
    shareLinkBox.title = shareUrl;

    if (encMode === "auto") {
      shareLinkLabel.textContent = "// Share this link — it contains the key";
      shareNote.textContent =
        "This URL contains the decryption key. Share it over a secure channel.";
      shareNote.className = "share-note warn";
    } else {
      shareLinkLabel.textContent =
        "// Share this link, then share the password separately";
      shareNote.textContent =
        "The link alone cannot decrypt the file. Password must be shared through a separate channel.";
      shareNote.className = "share-note";
    }

    formBody.style.display = "none";
    successPanel.classList.add("show");
    uploadCard.classList.add("success");
    startCountdown();
  } catch (err) {
    addLog(`Error: ${err.message}`, "err");
    progressLbl.textContent = "Upload failed.";
    uploadBtn.disabled = false;
  }
});
