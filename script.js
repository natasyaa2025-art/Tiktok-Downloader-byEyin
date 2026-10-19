
const urlInput = document.getElementById("tiktokUrl");
const pasteBtn = document.getElementById("pasteBtn");
const downloadBtn = document.getElementById("downloadBtn");
const statusBox = document.getElementById("status");
const resultBox = document.getElementById("result");
const resultText = document.getElementById("resultText");
const resultLink = document.getElementById("resultLink");
const historyList = document.getElementById("historyList");
const emptyHistory = document.getElementById("emptyHistory");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

let selectedType = "video";

// Ganti dengan URL backend milikmu setelah backend tersedia.
// Contoh: "https://api.domainkamu.com/api/download"
const API_ENDPOINT = "/api/download";

const mediaNames = {
  video: "Video",
  photo: "Foto",
  audio: "Audio"
};

function showStatus(message, type = "") {
  statusBox.textContent = message;
  statusBox.className = "status " + type;
  statusBox.hidden = false;
}

function hideResult() {
  resultBox.hidden = true;
  resultLink.hidden = true;
  resultLink.removeAttribute("href");
}

function isTikTokUrl(value) {
  try {
    const parsed = new URL(value);

    const allowedHosts = [
      "tiktok.com",
      "www.tiktok.com",
      "m.tiktok.com",
      "vm.tiktok.com",
      "vt.tiktok.com"
    ];

    return (
      parsed.protocol === "https:" &&
      allowedHosts.includes(parsed.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
}

// Pilihan video, foto, atau audio
document.querySelectorAll(".media-option").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".media-option").forEach(item => {
      item.classList.remove("active");
    });

    button.classList.add("active");
    selectedType = button.dataset.type;
  });
});

// Tempel link dari clipboard
pasteBtn.addEventListener("click", async () => {
  try {
    if (!navigator.clipboard) {
      throw new Error("Clipboard tidak didukung.");
    }

    const copiedText = await navigator.clipboard.readText();

    if (!copiedText) {
      showStatus("Clipboard kamu masih kosong.", "error");
      return;
    }

    urlInput.value = copiedText.trim();
    showStatus("Link berhasil ditempel. Silakan proses link.");
  } catch {
    showStatus(
      "Clipboard tidak dapat diakses. Salin link TikTok, lalu tempel manual.",
      "error"
    );
  }
});

// Riwayat disimpan lokal di browser
function getHistory() {
  try {
    const history = JSON.parse(
      localStorage.getItem("tiktokDownloaderHistory") || "[]"
    );

    return Array.isArray(history) ? history : [];
  } catch {
    return [];
  }
}

function saveHistory(url, type) {
  const history = getHistory();

  history.unshift({
    url,
    type,
    date: new Date().toLocaleString("id-ID")
  });

  // Maksimal 10 riwayat
  try {
    localStorage.setItem(
      "tiktokDownloaderHistory",
      JSON.stringify(history.slice(0, 10))
    );
  } catch {
    // Website tetap bisa digunakan jika penyimpanan diblokir.
  }

  renderHistory();
}

function renderHistory() {
  const history = getHistory();

  historyList.replaceChildren();
  emptyHistory.hidden = history.length > 0;

  history.forEach(item => {
    const li = document.createElement("li");
    li.className = "history-item";

    const info = document.createElement("div");
    info.className = "history-info";

    const title = document.createElement("strong");
    title.textContent = mediaNames[item.type] || "Media";

    const details = document.createElement("span");
    details.textContent = item.url + " • " + item.date;

    const reuse = document.createElement("button");
    reuse.type = "button";
    reuse.className = "reuse-btn";
    reuse.textContent = "Gunakan";

    reuse.addEventListener("click", () => {
      urlInput.value = item.url;

      document.querySelectorAll(".media-option").forEach(button => {
        button.classList.toggle(
          "active",
          button.dataset.type === item.type
        );
      });

      selectedType = item.type;
      urlInput.focus();
    });

    info.append(title, details);
    li.append(info, reuse);
    historyList.appendChild(li);
  });
}

clearHistoryBtn.addEventListener("click", () => {
  if (getHistory().length === 0) {
    showStatus("Belum ada riwayat untuk dihapus.");
    return;
  }

  if (confirm("Yakin ingin menghapus semua riwayat link?")) {
    localStorage.removeItem("tiktokDownloaderHistory");
    renderHistory();
    showStatus("Riwayat berhasil dihapus.");
  }
});

// Proses link menggunakan backend/API
downloadBtn.addEventListener("click", async () => {
  const url = urlInput.value.trim();

  hideResult();

  if (!url) {
    showStatus("Masukkan link TikTok terlebih dahulu.", "error");
    urlInput.focus();
    return;
  }

  if (!isTikTokUrl(url)) {
    showStatus(
      "Link tidak valid. Gunakan URL HTTPS dari domain TikTok yang didukung.",
      "error"
    );
    return;
  }

  if (!navigator.onLine) {
    showStatus("Koneksi internet tidak tersedia.", "error");
    return;
  }

  downloadBtn.disabled = true;
  downloadBtn.textContent = "⏳ Memproses...";
  showStatus("Sedang menghubungi layanan downloader...");

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: url,
        type: selectedType
      })
    });

    if (!response.ok) {
      throw new Error(
        response.status === 404
          ? "Backend belum tersedia atau endpoint salah."
          : "Layanan gagal memproses link (HTTP " + response.status + ")."
      );
    }

    const data = await response.json();

    if (!data.downloadUrl) {
      throw new Error(
        data.message || "Layanan tidak memberikan URL file unduhan."
      );
    }

    // Hanya izinkan URL file HTTPS yang valid.
    let fileUrl;

    try {
      fileUrl = new URL(data.downloadUrl);
    } catch {
      throw new Error("URL unduhan yang diberikan tidak valid.");
    }

    if (fileUrl.protocol !== "https:") {
      throw new Error("URL file harus menggunakan HTTPS.");
    }

    resultBox.hidden = false;
    resultText.textContent =
      "File tersedia" +
      (data.filename ? ": " + data.filename : "") +
      ". Tekan tombol di bawah untuk membuka unduhan.";

    resultLink.href = fileUrl.href;
    resultLink.target = "_blank";
    resultLink.rel = "noopener noreferrer";
    resultLink.hidden = false;

    showStatus("Link berhasil diproses!", "success");
    saveHistory(url, selectedType);
  } catch (error) {
    console.error("Downloader error:", error);

    
if (error instanceof TypeError) {
  showStatus(
    "Tidak dapat terhubung ke backend. Periksa koneksi internet dan konfigurasi server.",
    "error"
  );
} else {
  showStatus(
    error.message || "Terjadi kesalahan saat memproses link.",
    "error"
  );
}

  } finally {
    downloadBtn.disabled = false;
    downloadBtn.innerHTML = "<span>↓</span> Proses & Download";
  }
});

// Tampilkan riwayat saat website dibuka
renderHistory();
