/* =========================================================
WEDDING INVITATION — ANA THASYA & FAJAR
========================================================= */

/* --- 1. NAMA TAMU DARI URL (?to=Nama) --- */
const params = new URLSearchParams(window.location.search);
const guestName = params.get("to") || window.GUEST_NAME || "";
if (guestName) {
  const nameEl = document.getElementById("guestName");
  if (nameEl) nameEl.textContent = guestName;
}

/* --- 2. REFERENSI ELEMEN --- */
const openBtn = document.getElementById("openBtn");
const invitation = document.getElementById("invitation");
const cover = document.getElementById("cover");
const music = document.getElementById("music");
const musicBtn = document.getElementById("musicBtn");
const musicPlayer = document.getElementById("musicPlayer");
const musicStatus = document.getElementById("musicStatus");

/* Pengaturan "Kurangi gerakan" di perangkat (iOS: Reduce Motion, Android: Remove animations).
   Dipakai bersama oleh hitung mundur, galeri, dan tombol ke atas. */
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* --- 3. OBSERVER REVEAL ON SCROLL --- */
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll(".reveal-on-scroll").forEach((el) => observer.observe(el));

/* --- 4. LOADER & REVEAL COVER --- */
window.addEventListener("load", () => {
  setTimeout(() => {
    const loader = document.getElementById("loader");
    if (loader) {
      loader.style.transition = "opacity 0.6s ease";
      loader.style.opacity = "0";
      setTimeout(() => loader.remove(), 600);
    }
    document.querySelectorAll(".cover-content .reveal").forEach((el) => el.classList.add("active"));
  }, 2000);
});

/* --- 5. MUSIK (ingat posisi & status saat pengunjung kembali) --- */
const MUSIC_KEY = "anaThasyaMusic";
let pendingResume = false;      // musik terakhir diputar, tapi belum bisa dimulai tanpa interaksi
let resumeAfterVisible = false; // musik sedang diputar ketika tab/aplikasi disembunyikan
let lastSave = 0;

function setMusicState(playing) {
  if (musicPlayer && musicBtn && musicStatus) {
    musicPlayer.classList.toggle("playing", playing);
    musicBtn.classList.toggle("playing", playing);
    musicStatus.textContent = playing ? "Musik Menyala" : "Musik Mati";
  }
}

function loadMusic() {
  try { return JSON.parse(localStorage.getItem(MUSIC_KEY) || "null"); }
  catch (e) { return null; }
}

function saveMusic() {
  if (!music) return;
  try {
    localStorage.setItem(MUSIC_KEY, JSON.stringify({
      playing: !music.paused,
      time: music.currentTime || 0
    }));
  } catch (e) { /* penyimpanan tidak tersedia */ }
  lastSave = Date.now();
}

// Mulai musik dari posisi terakhir. Dipanggil hanya setelah interaksi pengguna.
function startMusic() {
  if (!music) return Promise.reject(new Error("no audio"));
  const saved = loadMusic();
  const resumeAt = saved && saved.time > 0 ? saved.time : 0;
  const applyPosition = () => {
    if (resumeAt > 0 && music.duration && resumeAt < music.duration - 1) {
      music.currentTime = resumeAt;
    }
  };
  if (music.readyState >= 1) applyPosition();
  else music.addEventListener("loadedmetadata", applyPosition, { once: true });

  return music.play()
    .then(() => { pendingResume = false; setMusicState(true); })
    .catch(() => setMusicState(false));
}

// Saat pertama kali ada interaksi (sentuh/klik/tombol), lanjutkan musik yang tertunda.
function armResume() {
  const resumeOnGesture = () => {
    document.removeEventListener("pointerdown", resumeOnGesture);
    document.removeEventListener("keydown", resumeOnGesture);
    if (pendingResume && music && music.paused) startMusic();
  };
  document.addEventListener("pointerdown", resumeOnGesture);
  document.addEventListener("keydown", resumeOnGesture);
}

(function initMusicMemory() {
  if (!music) return;
  const saved = loadMusic();
  if (saved && saved.playing) {
    pendingResume = true;
    armResume();
  }
  setMusicState(false);
})();

if (openBtn) {
  openBtn.addEventListener("click", () => {
    if (cover) cover.classList.add("hide-cover");

    // Munculkan pemutar musik, lalu mulai musik (klik ini adalah interaksi yang diizinkan browser)
    if (musicPlayer) musicPlayer.classList.add("is-active");
    startMusic();
    setTimeout(() => {
      if (cover) cover.style.display = "none";
      if (invitation) invitation.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "instant" });
      document.querySelectorAll(".reveal-on-scroll").forEach((el) => observer.observe(el));
    }, 1000);
  });
}

if (musicBtn) {
  musicBtn.addEventListener("click", () => {
    if (!music) return;
    pendingResume = false;
    if (music.paused) startMusic();
    else { music.pause(); setMusicState(false); }
  });
  musicBtn.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      musicBtn.click();
    }
  });
}

if (music) {
  music.addEventListener("play", () => { setMusicState(true); saveMusic(); });
  music.addEventListener("pause", () => { setMusicState(false); saveMusic(); });
  music.addEventListener("timeupdate", () => {
    if (Date.now() - lastSave > 2000) saveMusic();
  });
  window.addEventListener("pagehide", saveMusic);
  window.addEventListener("beforeunload", saveMusic);

  // Saat tab/aplikasi disembunyikan, musik dijeda; saat kembali, musik diputar lagi jika sebelumnya berputar.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (!music.paused) {
        resumeAfterVisible = true;
        music.pause();
      }
    } else if (resumeAfterVisible) {
      resumeAfterVisible = false;
      startMusic();
    }
  });
}

/* --- 6. HITUNG MUNDUR --- */
(function initCountdown() {
  const TARGET = new Date("2026-12-04T13:30:00+07:00").getTime();   // waktu Akad Nikah
  const START = new Date("2026-01-01T00:00:00+07:00").getTime();    // acuan awal ring "Hari"
  const SPAN = Math.max(1, TARGET - START);

  const root = document.getElementById("countdown");
  if (!root) return;
  const caption = document.getElementById("countdownCaption");
  const pad = (n) => String(n).padStart(2, "0");

  const units = [
    { key: "days", size: 0 },      // size 0 = dihitung dari rentang START -> TARGET
    { key: "hours", size: 24 },
    { key: "minutes", size: 60 },
    { key: "seconds", size: 60 }
  ].map((u) => {
    const item = root.querySelector('[data-unit="' + u.key + '"]');
    if (!item) return null;
    return Object.assign(u, {
      num: item.querySelector(".cd-num"),
      bar: item.querySelector(".cd-ring-bar"),
      value: null,
      frac: null
    });
  }).filter(Boolean);

  function render(unit, value, frac) {
    if (unit.num && unit.value !== value) {
      unit.num.textContent = pad(value);
      if (unit.value !== null && !reduceMotion) {
        unit.num.classList.remove("tick");
        void unit.num.offsetWidth;
        unit.num.classList.add("tick");
      }
      unit.value = value;
    }
    if (unit.bar) {
      frac = Math.min(1, Math.max(0, frac));
      // ring kembali penuh (mis. detik 0 -> 59): lewati transisi agar tidak berputar mundur
      const wrapped = unit.frac !== null && frac > unit.frac + 0.0001;
      if (wrapped) unit.bar.style.transition = "none";
      unit.bar.style.strokeDashoffset = (100 * (1 - frac)).toFixed(2);
      unit.bar.style.opacity = frac <= 0 ? "0" : "1";
      if (wrapped) {
        void unit.bar.getBoundingClientRect();
        unit.bar.style.transition = "";
      }
      unit.frac = frac;
    }
  }

  let lastMinute = -1;
  let finished = false;

  function update() {
    const diff = Math.max(0, TARGET - Date.now());
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor(diff / 3600000) % 24;
    const minutes = Math.floor(diff / 60000) % 60;
    const seconds = Math.floor(diff / 1000) % 60;
    const values = { days: days, hours: hours, minutes: minutes, seconds: seconds };

    units.forEach((u) => {
      const frac = u.size ? values[u.key] / u.size : diff / SPAN;
      render(u, values[u.key], frac);
    });

    if (minutes !== lastMinute) {
      lastMinute = minutes;
      root.setAttribute("aria-label", days + " hari " + hours + " jam " + minutes + " menit menuju hari pernikahan");
    }

    if (diff === 0 && !finished) {
      finished = true;
      root.dataset.state = "done";
      if (caption) caption.textContent = "Hari bahagia telah tiba";
    }
  }

  function loop() {
    update();
    if (!finished) setTimeout(loop, 1000 - (Date.now() % 1000) + 15);
  }

  loop();
  document.addEventListener("visibilitychange", () => { if (!document.hidden) update(); });
})();

/* --- 7. SIMPAN KE KALENDER (.ICS + GOOGLE CALENDAR) --- */
(function initSaveToCalendar() {
  const start = new Date("2026-12-04T13:30:00+07:00");
  const end = new Date("2026-12-04T17:00:00+07:00");
  const summary = "Pernikahan Thasya & Angga";
  const location = "Tuscan Dreams, Jl. Cipete IV No. 6A, Kel. Cipete Selatan, Kec. Cilandak, Kota Jakarta Selatan, DKI Jakarta 12410";
  const mapsUrl = "https://maps.app.goo.gl/qWxzknZgcHq3u2mJ9";
  const description = "Akad Nikah: 13:30 - 14:30 WIB\nResepsi: 15:00 - 17:00 WIB\nLokasi: " + location + "\nPeta: " + mapsUrl;
  const fileName = "Pernikahan-Thasya-Angga-04-12-2026.ics";

  const toUTC = (date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const dtStart = toUTC(start);
  const dtEnd = toUTC(end);
  const escapeICS = (text) => text.replace(/\\/g, "\\\\").replace(/([;,])/g, "\\$1").replace(/\n/g, "\\n");

  // Lipat baris >75 karakter sesuai RFC 5545 agar terbaca di semua aplikasi kalender
  function fold(line) {
    const parts = [];
    while (line.length > 74) {
      parts.push(line.slice(0, 74));
      line = " " + line.slice(74);
    }
    parts.push(line);
    return parts.join("\r\n");
  }

  function alarm(trigger, text) {
    return ["BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + text, "TRIGGER:" + trigger, "END:VALARM"];
  }

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Thasya Angga//Wedding//ID",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:pernikahan-thasya-angga-20261204@thasyaanggawedding.web.id",
    "DTSTAMP:" + toUTC(new Date()),
    "DTSTART:" + dtStart,
    "DTEND:" + dtEnd,
    "SUMMARY:" + escapeICS(summary),
    "DESCRIPTION:" + escapeICS(description),
    "LOCATION:" + escapeICS(location),
    "URL:" + mapsUrl,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE"
  ].concat(
    alarm("-P7D", "Pernikahan Thasya & Angga 7 hari lagi"),
    alarm("-P1D", "Pernikahan Thasya & Angga besok"),
    alarm("-PT2H", "Pernikahan Thasya & Angga 2 jam lagi")
  ).concat(["END:VEVENT", "END:VCALENDAR"]);
  const ics = lines.map(fold).join("\r\n") + "\r\n";

  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  function deliver() {
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    if (isIOS) {
      // Safari iOS: membuka file .ics langsung memunculkan dialog "Tambah ke Kalender"
      window.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 15000);
      return;
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  const icsBtn = document.getElementById("saveIcsBtn");
  if (icsBtn) {
    const original = icsBtn.textContent;
    let resetTimer = null;
    icsBtn.addEventListener("click", () => {
      try {
        deliver();
        icsBtn.textContent = "Tersimpan ✓";
      } catch (err) {
        icsBtn.textContent = "Gunakan Google Kalender";
      }
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => { icsBtn.textContent = original; }, 2400);
    });
  }

  const googleLink = document.getElementById("googleCalendarLink");
  if (googleLink) {
    googleLink.href =
      "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + encodeURIComponent(summary) +
      "&dates=" + dtStart + "/" + dtEnd +
      "&details=" + encodeURIComponent(description) +
      "&location=" + encodeURIComponent(location) +
      "&ctz=Asia/Jakarta";
  }
})();

/* --- 8. TOMBOL SALIN --- */
document.querySelectorAll(".copy-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const value = btn.dataset.copy;
    const originalText = btn.textContent;
    try {
      await navigator.clipboard.writeText(value);
      btn.textContent = "Tersalin ✓";
    } catch {
      const helper = document.createElement("textarea");
      helper.value = value;
      document.body.appendChild(helper);
      helper.select();
      document.execCommand("copy");
      helper.remove();
      btn.textContent = "Tersalin ✓";
    }
    setTimeout(() => { btn.textContent = originalText; }, 1600);
  });
});

/* --- 9. RSVP & BUKU TAMU (Google Sheets via Apps Script) --- */
/* Ganti dengan URL Web App dari Google Apps Script (Deploy → Web app). */
const API_URL = "https://script.google.com/macros/s/AKfycbyYqJmI3H6gLbGTN-dmAlXpC2HPrjjZBJ4m0e-QcBRSUwY23pq6e2N6LoA6BovdWsFBdA/exec";
const API_READY = !!API_URL && !API_URL.startsWith("ISI_");
const MAX_MESSAGES = 50;
const REFRESH_MS = 60000;

const form = document.getElementById("rsvpForm");
const messagesContainer = document.getElementById("messages");
const messageCountEl = document.getElementById("messageCount");
const feedbackEl = document.getElementById("rsvpFeedback");
let feedbackTimer = null;

let savedMessages = [];
let loadState = "loading"; // loading | ready | error

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function attendanceText(value) {
  return value === "Hadir" ? "Hadir" : (value === "Tidak dapat hadir" ? "Tidak dapat hadir" : value);
}

function nameHue(name) {
  let h = 0;
  for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

function nameSeed(name) {
  let s = 0;
  for (const ch of String(name)) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  return s;
}

const AVATAR_SKIN = ["#f8dcc6", "#f0c6a2", "#dea47d", "#bd8458", "#8f5b3b"];
const AVATAR_HAIR = ["#2a1c14", "#4b3121", "#1f1b1b", "#6e4a2c"];

// Avatar gaya boneka (chibi): kepala besar, mata bulat berkilap, pipi merona.
// Warna dan gaya ditentukan dari nama, sehingga tampilannya tetap sama setiap kali dibuka.
function avatarSvg(name) {
  const h = nameHue(name);
  const seed = nameSeed(name);
  const skin = AVATAR_SKIN[seed % AVATAR_SKIN.length];
  const hair = AVATAR_HAIR[(seed >>> 4) % AVATAR_HAIR.length];
  const style = (seed >>> 8) % 5; // 0 hijab, 1 rambut panjang, 2 rambut pendek, 3 pendek berkacamata, 4 ikal
  const bg = "hsl(" + h + " 40% 92%)";
  const cloth = "hsl(" + h + " 40% 46%)";
  const clothDark = "hsl(" + h + " 40% 32%)";
  const scarf = "hsl(" + ((h + 150) % 360) + " 42% 52%)";
  const ink = "#2b2118";

  const body =
    '<path d="M10 100C12 84 28 76 50 76S88 84 90 100Z" fill="' + cloth + '"/>' +
    '<path d="M42 77L50 88L58 77" fill="none" stroke="' + clothDark + '" stroke-width="2" stroke-linejoin="round"/>';
  const neck = '<rect x="44" y="64" width="12" height="16" rx="5" fill="' + skin + '"/>';

  let back = "";
  if (style === 0) {
    back = '<ellipse cx="50" cy="46" rx="31" ry="34" fill="' + scarf + '"/>';
  } else if (style === 1) {
    back = '<path d="M25 46Q22 16 50 16T75 46L79 88Q50 96 21 88Z" fill="' + hair + '"/>';
  } else if (style === 4) {
    back = '<circle cx="28" cy="38" r="10" fill="' + hair + '"/>' +
           '<circle cx="50" cy="27" r="12" fill="' + hair + '"/>' +
           '<circle cx="72" cy="38" r="10" fill="' + hair + '"/>';
  }

  const face =
    '<ellipse cx="50" cy="48" rx="21" ry="23" fill="' + skin + '"/>' +
    '<ellipse cx="42" cy="50" rx="3.2" ry="4" fill="' + ink + '"/>' +
    '<ellipse cx="58" cy="50" rx="3.2" ry="4" fill="' + ink + '"/>' +
    '<circle cx="43.2" cy="48.4" r="1.1" fill="#fff"/>' +
    '<circle cx="59.2" cy="48.4" r="1.1" fill="#fff"/>' +
    '<ellipse cx="35.5" cy="58" rx="4" ry="2.4" fill="#e8948a" opacity=".5"/>' +
    '<ellipse cx="64.5" cy="58" rx="4" ry="2.4" fill="#e8948a" opacity=".5"/>' +
    '<path d="M45.5 61Q50 65 54.5 61" fill="none" stroke="#8a4a3b" stroke-width="1.8" stroke-linecap="round"/>';

  let front = "";
  if (style === 0) {
    front = '<path d="M29 45Q31 25 50 25T71 45Q66 34 50 34T29 45Z" fill="' + scarf + '"/>';
  } else if (style === 1 || style === 2 || style === 3) {
    front = '<path d="M27 45Q24 19 50 19T73 45Q66 31 50 32T27 45Z" fill="' + hair + '"/>';
  } else {
    front = '<path d="M29 44Q32 33 50 33T71 44Q62 37 50 38T29 44Z" fill="' + hair + '"/>';
  }

  const glasses = style === 3
    ? '<circle cx="42" cy="50" r="6.2" fill="none" stroke="' + ink + '" stroke-width="1.4"/>' +
      '<circle cx="58" cy="50" r="6.2" fill="none" stroke="' + ink + '" stroke-width="1.4"/>' +
      '<path d="M48.2 50H51.8" stroke="' + ink + '" stroke-width="1.4"/>'
    : "";

  return '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
    '<rect width="100" height="100" fill="' + bg + '"/>' +
    body + neck + back + face + front + glasses +
    "</svg>";
}

function renderMessages(newIndex = -1) {
  if (!messagesContainer) return;
  if (messageCountEl) messageCountEl.textContent = savedMessages.length;

  if (loadState === "loading" && !savedMessages.length) {
    messagesContainer.innerHTML = '<p class="messages-empty">Memuat ucapan…</p>';
    return;
  }
  if (loadState === "error" && !savedMessages.length) {
    messagesContainer.innerHTML = '<p class="messages-empty">Ucapan belum dapat dimuat. Silakan muat ulang halaman.</p>';
    return;
  }
  if (!savedMessages.length) {
    messagesContainer.innerHTML = '<p class="messages-empty">Belum ada ucapan. Jadilah yang pertama menuliskan doa 🤍</p>';
    return;
  }
  messagesContainer.innerHTML = savedMessages.map((item, i) => {
    const att = item.attendance === "Hadir" ? "hadir" : "tidak";
    return '<article class="message' + (i === newIndex ? " is-new" : "") + '" data-att="' + att +
      '" style="--h:' + nameHue(item.name) + '">' +
      '<header class="msg-head">' +
      '<span class="msg-avatar" aria-hidden="true">' + avatarSvg(item.name) + "</span>" +
      '<div class="msg-meta">' +
      "<strong>" + escapeHtml(item.name) + "</strong>" +
      '<span class="msg-att">' + escapeHtml(attendanceText(item.attendance)) + "</span>" +
      "</div></header>" +
      "<p>" + escapeHtml(item.message) + "</p>" +
      "</article>";
  }).join("");
}

document.querySelectorAll(".emoji-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const textarea = document.getElementById("message");
    if (!textarea) return;
    const emoji = btn.dataset.emoji || "";
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    textarea.value = textarea.value.slice(0, start) + emoji + textarea.value.slice(end);
    const pos = start + emoji.length;
    textarea.focus();
    textarea.setSelectionRange(pos, pos);
  });
});

function showFeedback(name, attendance) {
  if (!feedbackEl) return;
  const shortName = name.split(" ")[0] || name;
  feedbackEl.textContent = attendance === "Hadir"
    ? "Terima kasih, " + shortName + "! Ucapan Anda sudah terkirim 🎉 Kami tunggu kehadiran Anda 🥰"
    : "Terima kasih, " + shortName + "! Ucapan dan doa Anda sudah terkirim 🙏 Semoga kita bisa bertemu di lain waktu 🤍";
  feedbackEl.hidden = false;
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => { feedbackEl.hidden = true; }, 7000);
}

function showFeedbackError(text) {
  if (!feedbackEl) return;
  feedbackEl.textContent = text;
  feedbackEl.hidden = false;
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => { feedbackEl.hidden = true; }, 7000);
}

function emojiBurst(originEl) {
  if (reduceMotion) return;
  const card = originEl.closest(".rsvp-card");
  if (!card) return;
  const cardRect = card.getBoundingClientRect();
  const rect = originEl.getBoundingClientRect();
  const originX = rect.left - cardRect.left + rect.width / 2;
  const originY = rect.top - cardRect.top + rect.height / 2;
  const pool = ["🎉", "❤️", "🥰", "✨", "🌸", "💍", "🤍"];
  for (let i = 0; i < 12; i++) {
    const el = document.createElement("span");
    el.className = "emoji-burst";
    el.textContent = pool[Math.floor(Math.random() * pool.length)];
    el.style.left = (originX + (Math.random() * 160 - 80)) + "px";
    el.style.top = originY + "px";
    el.style.setProperty("--dx", (Math.random() * 120 - 60) + "px");
    el.style.setProperty("--dy", -(100 + Math.random() * 120) + "px");
    el.style.setProperty("--rot", (Math.random() * 60 - 30) + "deg");
    el.style.animationDelay = (Math.random() * 0.25) + "s";
    el.addEventListener("animationend", () => el.remove());
    card.appendChild(el);
  }
}

async function loadMessages() {
  if (!API_READY) {
    loadState = "ready";
    renderMessages();
    return;
  }
  try {
    const res = await fetch(API_URL, { cache: "no-store" });
    const data = await res.json();
    if (!data || !data.ok || !Array.isArray(data.messages)) throw new Error("format");
    savedMessages = data.messages.slice(0, MAX_MESSAGES);
    loadState = "ready";
  } catch (err) {
    // pertahankan daftar yang sudah tampil; hanya tandai error jika belum ada data
    if (!savedMessages.length) loadState = "error";
  }
  renderMessages();
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const nameInput = document.getElementById("nameInput");
    const attendanceInput = document.getElementById("attendance");
    const messageInput = document.getElementById("message");
    const submitBtn = form.querySelector(".submit-btn");
    if (!nameInput || !attendanceInput || !messageInput) return;

    const entry = {
      name: nameInput.value.trim(),
      attendance: attendanceInput.value,
      message: messageInput.value.trim()
    };
    if (!entry.name || !entry.attendance || !entry.message) return;

    if (!API_READY) {
      showFeedbackError("Layanan ucapan belum dikonfigurasi.");
      return;
    }

    if (submitBtn) { submitBtn.disabled = true; submitBtn.style.opacity = ".7"; }
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        // text/plain menghindari preflight CORS pada Apps Script
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(entry)
      });
      const data = await res.json();
      if (!data || !data.ok) throw new Error(data && data.error ? data.error : "gagal");

      savedMessages.unshift(entry);
      savedMessages = savedMessages.slice(0, MAX_MESSAGES);
      loadState = "ready";
      renderMessages(0);
      messagesContainer.scrollTop = 0;
      form.reset();
      showFeedback(entry.name, entry.attendance);
      if (submitBtn) emojiBurst(submitBtn);
    } catch (err) {
      showFeedbackError("Maaf, ucapan belum terkirim. Silakan coba lagi.");
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.style.opacity = ""; }
    }
  });
}

renderMessages();
loadMessages();
setInterval(() => { if (!document.hidden) loadMessages(); }, REFRESH_MS);
document.addEventListener("visibilitychange", () => { if (!document.hidden) loadMessages(); });

/* --- 10. GALLERY SLIDER — autoplay loop + drag/swipe --- */
function initGallerySliders() {
  const SPEED = 30;
  const RESUME_DELAY = 1200;

  document.querySelectorAll(".gallery-slider").forEach((gallery) => {
    const track = gallery.querySelector(".slider-track");
    if (!track || track.children.length < 2) return;
    const items = track.children;
    const half = Math.floor(items.length / 2);
    let loopWidth = 0;
    let x = 0;
    let visible = false;
    let dragging = false;
    let hovering = false;
    let resumeAt = 0;
    let startX = 0;
    let startPos = 0;
    let last = performance.now();

    function measure() {
      loopWidth = items[half].offsetLeft - items[0].offsetLeft;
    }
    function wrap() {
      if (!loopWidth) return;
      x = x % loopWidth;
      if (x > 0) x -= loopWidth;
    }
    function apply() {
      track.style.transform = "translate3d(" + x + "px, 0, 0)";
    }
    function tick(now) {
      const dt = Math.min(now - last, 50) / 1000;
      last = now;
      if (visible && !dragging && !hovering && !reduceMotion && now >= resumeAt) {
        x -= SPEED * dt;
        wrap();
        apply();
      }
      requestAnimationFrame(tick);
    }

    gallery.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (!loopWidth) measure();
      dragging = true;
      startX = e.clientX;
      startPos = x;
      try { gallery.setPointerCapture(e.pointerId); } catch (err) {}
    });
    gallery.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      x = startPos + (e.clientX - startX);
      wrap();
      apply();
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      resumeAt = performance.now() + RESUME_DELAY;
    }
    gallery.addEventListener("pointerup", endDrag);
    gallery.addEventListener("pointercancel", endDrag);
    gallery.addEventListener("lostpointercapture", endDrag);
    gallery.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "mouse") hovering = true;
    });
    gallery.addEventListener("pointerleave", (e) => {
      if (e.pointerType === "mouse") hovering = false;
    });

    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible) { measure(); wrap(); apply(); }
    }, { threshold: 0 }).observe(gallery);

    window.addEventListener("resize", () => { measure(); wrap(); apply(); });
    window.addEventListener("load", () => { measure(); wrap(); apply(); });
    requestAnimationFrame(tick);
  });
}
initGallerySliders();

/* --- 11. STIKER: animasi hanya saat panel terlihat --- */
(function initStickerVisibility() {
  const pages = document.querySelectorAll(".page");
  if (!pages.length) return;
  if (!("IntersectionObserver" in window)) {
    pages.forEach((el) => el.classList.add("in-view"));
    return;
  }
  const stickerObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => entry.target.classList.toggle("in-view", entry.isIntersecting));
  }, { threshold: 0, rootMargin: "100px 0px" });
  pages.forEach((el) => stickerObserver.observe(el));
})();

/* --- 12. TOMBOL KE ATAS (dengan efek bloom) --- */
(function initToTop() {
  const btn = document.getElementById("toTopBtn");
  if (!btn) return;
  const canAnimate = typeof Element !== "undefined" && typeof Element.prototype.animate === "function";
  let ticking = false;

  function update() {
    ticking = false;
    const invitation = document.getElementById("invitation");
    const opened = !!invitation && !invitation.classList.contains("hidden");
    const show = opened && window.scrollY > window.innerHeight * 0.8;
    btn.classList.toggle("is-visible", show);
    const maxY = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxY > 0 ? Math.min(100, Math.max(0, (window.scrollY / maxY) * 100)) : 0;
    btn.style.setProperty("--p", progress.toFixed(1));
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  // Cahaya bloom yang mekar dari tombol, lalu percikan kecil yang menyebar
  function bloomAt(x, y) {
    const size = Math.round(Math.min(Math.max(window.innerWidth * 0.6, 200), 280));

    const glow = document.createElement("div");
    glow.className = "top-bloom";
    glow.style.width = size + "px";
    glow.style.height = size + "px";
    glow.style.left = (x - size / 2) + "px";
    glow.style.top = (y - size / 2) + "px";
    document.body.appendChild(glow);
    const glowAnim = glow.animate([
      { transform: "scale(.2)", opacity: 0 },
      { transform: "scale(1)", opacity: 1, offset: 0.35 },
      { transform: "scale(1.9)", opacity: 0 }
    ], { duration: 1200, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" });
    glowAnim.onfinish = () => glow.remove();

    const SPARKS = 9;
    for (let i = 0; i < SPARKS; i++) {
      const spark = document.createElement("span");
      spark.className = "top-spark";
      spark.style.left = x + "px";
      spark.style.top = y + "px";
      document.body.appendChild(spark);
      const angle = (Math.PI * 2 * i) / SPARKS + Math.random() * 0.5;
      const dist = 70 + Math.random() * 90;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      const sparkAnim = spark.animate([
        { transform: "translate(-50%, -50%) scale(.2)", opacity: 0 },
        { transform: "translate(calc(-50% + " + dx * 0.5 + "px), calc(-50% + " + dy * 0.5 + "px)) scale(1)", opacity: 1, offset: 0.4 },
        { transform: "translate(calc(-50% + " + dx + "px), calc(-50% + " + dy + "px)) scale(.3)", opacity: 0 }
      ], { duration: 1000 + Math.random() * 300, delay: Math.random() * 120, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" });
      sparkAnim.onfinish = () => spark.remove();
    }
  }

  // Gulir ke atas dengan kurva smootherstep: kecepatan dan percepatan nol di awal dan akhir.
  // Durasi menyesuaikan jarak. Berhenti jika pengunjung menggulir, menyentuh, atau menekan tombol.
  function smoothScrollToTop() {
    const startY = window.scrollY;
    if (startY <= 0) return;

    const root = document.documentElement;
    const prevBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";

    const duration = Math.min(2200, Math.max(900, 650 + Math.sqrt(startY) * 26));
    const startTime = performance.now();
    const smootherstep = (t) => t * t * t * (t * (6 * t - 15) + 10);
    const stopEvents = ["wheel", "touchstart", "touchmove", "pointerdown", "mousedown", "keydown"];
    let active = true;
    let expectedY = startY;

    function stop() {
      if (!active) return;
      active = false;
      stopEvents.forEach((name) => window.removeEventListener(name, stop));
      root.style.scrollBehavior = prevBehavior;
    }

    stopEvents.forEach((name) => window.addEventListener(name, stop, { passive: true }));

    function step(now) {
      if (!active) return;
      // Posisi berubah di luar animasi (misalnya seret scrollbar): hentikan.
      if (Math.abs(window.scrollY - expectedY) > 3) { stop(); return; }
      const t = Math.min((now - startTime) / duration, 1);
      expectedY = startY * (1 - smootherstep(t));
      window.scrollTo(0, expectedY);
      if (t < 1) requestAnimationFrame(step);
      else { window.scrollTo(0, 0); stop(); }
    }
    requestAnimationFrame(step);
  }

  btn.addEventListener("click", () => {
    if (!reduceMotion && canAnimate) {
      const rect = btn.getBoundingClientRect();
      bloomAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
      btn.animate([
        { transform: "scale(1)" },
        { transform: "scale(.92)" },
        { transform: "scale(1)" }
      ], { duration: 320, easing: "ease-out" });
    }
    smoothScrollToTop();
  });

  update();
})();

/* --- 13. PROTEKSI KONTEN (teks, gambar, sorotan, klik kanan, salin, unduh) --- */
(function protectContent() {
  // Kolom isian tetap bisa diketik, ditempel, dan dipilih
  const EDITABLE = "input, textarea, select, [contenteditable='true']";
  const isEditable = (el) => !!(el && el.closest && el.closest(EDITABLE));

  // Menu tahan lama / klik kanan (Android, iOS, desktop) dinonaktifkan kecuali di kolom isian
  document.addEventListener("contextmenu", (e) => {
    if (!isEditable(e.target)) e.preventDefault();
  });

  // Teks tidak bisa diblok/dipilih
  document.addEventListener("selectstart", (e) => {
    if (!isEditable(e.target)) e.preventDefault();
  });

  // Gambar dan elemen lain tidak bisa diseret ke tab atau folder lain
  document.addEventListener("dragstart", (e) => e.preventDefault());

  // Salin & potong di luar kolom isian dinonaktifkan
  ["copy", "cut"].forEach((type) => {
    document.addEventListener(type, (e) => {
      if (!isEditable(e.target)) e.preventDefault();
    });
  });

  // Pintasan simpan, cetak, lihat sumber, pilih semua, salin di luar kolom isian dinonaktifkan
  document.addEventListener("keydown", (e) => {
    if (!(e.ctrlKey || e.metaKey) || isEditable(e.target)) return;
    const k = (e.key || "").toLowerCase();
    if (["s", "p", "u", "a", "c", "x"].includes(k)) e.preventDefault();
  });

  document.querySelectorAll("img").forEach((img) => {
    img.draggable = false;
  });
})();