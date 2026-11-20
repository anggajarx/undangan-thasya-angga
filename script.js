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

function starPoints(cx, cy, R, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? R : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push((cx + rad * Math.cos(a)).toFixed(1) + "," + (cy + rad * Math.sin(a)).toFixed(1));
  }
  return pts.join(" ");
}

// Sinar latar bergaya komik (dihitung sekali)
const AVATAR_BURST = (function () {
  let d = "";
  for (let i = 0; i < 12; i += 2) {
    const a1 = (i * 30 * Math.PI) / 180;
    const a2 = ((i + 1) * 30 * Math.PI) / 180;
    d += "M50 50L" + (50 + 90 * Math.cos(a1)).toFixed(1) + " " + (50 + 90 * Math.sin(a1)).toFixed(1) +
         "L" + (50 + 90 * Math.cos(a2)).toFixed(1) + " " + (50 + 90 * Math.sin(a2)).toFixed(1) + "Z";
  }
  return d;
})();

const avatarCache = {};

// Avatar superhero orisinal (6 gaya, 4 lambang dada). Warna kostum, jubah, dan gaya ditentukan dari nama,
// sehingga tampilannya selalu sama untuk nama yang sama. Murni SVG inline: tampil sama di Android, iOS, dan Mac.
function avatarSvg(name) {
  const key = String(name);
  if (avatarCache[key]) return avatarCache[key];

  const h = nameHue(key);
  const seed = nameSeed(key);
  const skin = AVATAR_SKIN[seed % AVATAR_SKIN.length];
  const hair = AVATAR_HAIR[(seed >>> 4) % AVATAR_HAIR.length];
  const style = (seed >>> 7) % 6;
  const emblem = (seed >>> 11) % 4;

  const ink = "#2b2118", gold = "#ffc93c", smile = "#8a4a3b";
  const suit = "hsl(" + h + " 62% 46%)";
  const suitDark = "hsl(" + h + " 62% 31%)";
  const suitLight = "hsl(" + h + " 72% 64%)";
  const h2 = (h + 150) % 360;
  const cape = "hsl(" + h2 + " 70% 46%)";
  const capeDark = "hsl(" + h2 + " 70% 30%)";
  const bg = "hsl(" + h + " 72% 91%)";
  const burst = "hsl(" + h + " 78% 83%)";
  const o = ' stroke="' + ink + '" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"';
  const o2 = ' stroke="' + ink + '" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"';

  // Jubah (di belakang tubuh)
  const capeSvg =
    '<path d="M25 77C11 83 4 93 2 100L98 100C96 93 89 83 75 77Z" fill="' + cape + '"' + o + '/>' +
    '<path d="M25 77C16 84 12 92 10 100L24 100C26 92 27 84 31 79Z" fill="' + capeDark + '"/>' +
    '<path d="M75 77C84 84 88 92 90 100L76 100C74 92 73 84 69 79Z" fill="' + capeDark + '"/>';

  // Tubuh + lambang dada
  const bodySvg = '<path d="M14 100C16 85 30 77 50 77S84 85 86 100Z" fill="' + suit + '"' + o + '/>';
  let emblemSvg;
  if (emblem === 0) emblemSvg = '<polygon points="' + starPoints(50, 91, 7.5, 3.2) + '" fill="' + gold + '"' + o2 + '/>';
  else if (emblem === 1) emblemSvg = '<circle cx="50" cy="91" r="6.5" fill="' + gold + '"' + o2 + '/><circle cx="50" cy="91" r="2.4" fill="' + suit + '"/>';
  else if (emblem === 2) emblemSvg = '<polygon points="50,83 58,91 50,99 42,91" fill="' + gold + '"' + o2 + '/>';
  else emblemSvg = '<polygon points="50,83 58.5,98 41.5,98" fill="' + gold + '"' + o2 + '/>';

  const neck = (color) => '<rect x="43.5" y="62" width="13" height="17" rx="4.5" fill="' + color + '"' + o2 + '/>';
  const eyes = (y) =>
    '<ellipse cx="42" cy="' + y + '" rx="4.4" ry="2.8" fill="#fff"/><ellipse cx="58" cy="' + y + '" rx="4.4" ry="2.8" fill="#fff"/>' +
    '<circle cx="42.8" cy="' + y + '" r="1.7" fill="' + ink + '"/><circle cx="58.8" cy="' + y + '" r="1.7" fill="' + ink + '"/>';
  const grin = (y) => '<path d="M44 ' + y + 'Q50 ' + (y + 5) + ' 56 ' + y + '" fill="none" stroke="' + smile + '" stroke-width="2.2" stroke-linecap="round"/>';
  const face = '<ellipse cx="50" cy="46" rx="19" ry="21" fill="' + skin + '"' + o + '/>';

  let head;
  if (style === 0) {
    // Topeng domino + rambut
    head = neck(skin) + face +
      '<path d="M31 44C30 26 41 22 50 22S70 26 69 44C64 36 58 33 50 33S36 36 31 44Z" fill="' + hair + '"' + o + '/>' +
      '<path d="M31 47C36 41 44 41 50 44C56 41 64 41 69 47C67 54 60 55 56 52C53 50 47 50 44 52C40 55 33 54 31 47Z" fill="' + suit + '"' + o + '/>' +
      eyes(47.5) + grin(59);
  } else if (style === 1) {
    // Helm berkaca pelindung
    head = neck(suit) + face +
      '<path d="M29 48C28 25 40 18 50 18S72 25 71 48L71 53C66 53 63 50 62 50L38 50C37 50 34 53 29 53Z" fill="' + suit + '"' + o + '/>' +
      '<path d="M50 19L50 36" stroke="' + suitLight + '" stroke-width="4.5" stroke-linecap="round"/>' +
      '<rect x="32" y="37" width="36" height="13" rx="6.5" fill="#22313f"' + o2 + '/>' +
      '<rect x="34.5" y="39.5" width="31" height="8" rx="4" fill="#5fe3ff"/>' +
      '<rect x="37" y="41" width="9" height="2.2" rx="1.1" fill="#fff" opacity=".85"/>' +
      '<circle cx="29" cy="47" r="4.2" fill="' + suitDark + '"' + o2 + '/><circle cx="71" cy="47" r="4.2" fill="' + suitDark + '"' + o2 + '/>' +
      grin(60);
  } else if (style === 2) {
    // Tudung penuh (cowl) bermata putih bersudut
    head = neck(suit) +
      '<ellipse cx="50" cy="46" rx="20" ry="22" fill="' + suit + '"' + o + '/>' +
      '<path d="M36 51C40 47 60 47 64 51C64 61 58 67 50 67C42 67 36 61 36 51Z" fill="' + skin + '"' + o2 + '/>' +
      '<path d="M35 43L47 46L45 51L36 49Z" fill="#fff"' + o2 + '/><path d="M65 43L53 46L55 51L64 49Z" fill="#fff"' + o2 + '/>' +
      '<circle cx="42" cy="47.5" r="1.6" fill="' + ink + '"/><circle cx="58" cy="47.5" r="1.6" fill="' + ink + '"/>' +
      '<polygon points="' + starPoints(50, 31, 5.5, 2.4) + '" fill="' + gold + '"' + o2 + '/>' + grin(60);
  } else if (style === 3) {
    // Hijab pahlawan + topeng
    head = neck(suit) +
      '<path d="M25 52C21 24 38 13 50 13S79 24 75 52C75 67 64 73 50 73S25 67 25 52Z" fill="' + suit + '"' + o + '/>' +
      '<ellipse cx="50" cy="47" rx="15.5" ry="17.5" fill="' + skin + '"' + o2 + '/>' +
      '<path d="M34.5 46C39 41 45 41 50 44C55 41 61 41 65.5 46C63 52 57 53 54 51C52 49 48 49 46 51C43 53 37 52 34.5 46Z" fill="' + cape + '"' + o2 + '/>' +
      eyes(47) + '<polygon points="' + starPoints(50, 28.5, 5.2, 2.2) + '" fill="' + gold + '"' + o2 + '/>' + grin(58.5);
  } else if (style === 4) {
    // Ninja pahlawan: ikat kepala + penutup mulut
    head = neck(suit) + face +
      '<path d="M31 52C40 54 60 54 69 52C69 63 60 69 50 69C40 69 31 63 31 52Z" fill="' + suitDark + '"' + o2 + '/>' +
      '<path d="M30 46C28 24 40 18 50 18S72 24 70 46C66 40 58 38 50 38S34 40 30 46Z" fill="' + suit + '"' + o + '/>' +
      '<path d="M29.5 34H70.5V42H29.5Z" fill="' + gold + '"' + o2 + '/>' +
      '<path d="M70 36L83 30L80 42Z" fill="' + gold + '"' + o2 + '/>' +
      eyes(47.8);
  } else {
    // Pilot pahlawan: topi kulit + kacamata pelindung + syal
    head = neck(skin) + face +
      '<path d="M30 46C28 24 40 17 50 17S72 24 70 46C66 39 58 36 50 36S34 39 30 46Z" fill="' + suitDark + '"' + o + '/>' +
      '<circle cx="29.5" cy="49" r="4.4" fill="' + suit + '"' + o2 + '/><circle cx="70.5" cy="49" r="4.4" fill="' + suit + '"' + o2 + '/>' +
      '<path d="M30 46H70" stroke="' + ink + '" stroke-width="4.4" stroke-linecap="round"/>' +
      '<circle cx="42" cy="46" r="8.6" fill="' + ink + '"/><circle cx="42" cy="46" r="7" fill="' + gold + '"/><circle cx="42" cy="46" r="5.2" fill="#7fe8ff"/>' +
      '<circle cx="58" cy="46" r="8.6" fill="' + ink + '"/><circle cx="58" cy="46" r="7" fill="' + gold + '"/><circle cx="58" cy="46" r="5.2" fill="#7fe8ff"/>' +
      '<circle cx="40" cy="44" r="1.7" fill="#fff" opacity=".9"/><circle cx="56" cy="44" r="1.7" fill="#fff" opacity=".9"/>' +
      '<path d="M60 70L69 88L57 83Z" fill="' + cape + '"' + o2 + '/>' +
      '<path d="M33 66C43 73 57 73 67 66L70 75C57 81 43 81 30 75Z" fill="' + cape + '"' + o + '/>' +
      grin(59.5);
  }

  const svg =
    '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
    '<rect width="100" height="100" fill="' + bg + '"/>' +
    '<path d="' + AVATAR_BURST + '" fill="' + burst + '"/>' +
    capeSvg + bodySvg + emblemSvg + head +
    "</svg>";
  avatarCache[key] = svg;
  return svg;
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
      if (visible && !dragging && !hovering && !window.__lbOpen && !reduceMotion && now >= resumeAt) {
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

/* --- 14. EFEK GERAK TAMBAHAN (aesthetic & modern; Web, Android, iOS, Mac) --- */
(function initExtraMotion() {
  "use strict";

  const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const COARSE = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const FINE = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const conn = navigator.connection || {};
  const LITE = !!conn.saveData ||
    (navigator.deviceMemory && navigator.deviceMemory <= 2) ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const safe = (fn) => { try { fn(); } catch (e) { /* efek tambahan tidak boleh mengganggu fungsi utama */ } };

  /* 14a. Judul: pecah menjadi kata agar muncul bergantian */
  function splitHeadings() {
    document.querySelectorAll(".display-title").forEach((title) => {
      if (title.dataset.split) return;
      title.dataset.split = "1";
      let index = 0;
      const walk = (node) => {
        Array.from(node.childNodes).forEach((child) => {
          if (child.nodeType === 3) {
            const parts = child.textContent.split(/(\s+)/);
            const frag = document.createDocumentFragment();
            parts.forEach((part) => {
              if (!part) return;
              if (/^\s+$/.test(part)) {
                frag.appendChild(document.createTextNode(" "));
              } else {
                const w = document.createElement("span");
                w.className = "w";
                w.style.setProperty("--wi", index++);
                w.textContent = part;
                frag.appendChild(w);
              }
            });
            child.replaceWith(frag);
          } else if (child.nodeType === 1 && child.tagName !== "BR") {
            walk(child);
          }
        });
      };
      walk(title);
    });
  }

  /* 14a-2. Hashtag: pecah per huruf agar muncul bergantian lalu berkilau bergelombang */
  function splitHashtags() {
    document.querySelectorAll(".hashtag").forEach((tag) => {
      if (tag.dataset.split) return;
      tag.dataset.split = "1";
      let i = 0;
      tag.querySelectorAll(".ht-seg").forEach((seg) => {
        const text = seg.textContent;
        seg.textContent = "";
        Array.from(text).forEach((ch) => {
          const span = document.createElement("span");
          span.className = "ht-ch";
          span.style.setProperty("--i", i++);
          span.textContent = ch;
          seg.appendChild(span);
        });
      });
      tag.classList.add("is-split");
    });
  }

  /* 14b. Debu emas melayang di cover dan bagian penutup */
  function addDust() {
    if (REDUCE) return;
    const count = LITE ? 6 : COARSE ? 12 : 24;
    ["#cover", ".thank-you"].forEach((selector) => {
      const host = document.querySelector(selector);
      if (!host) return;
      const wrap = document.createElement("div");
      wrap.className = "dust";
      wrap.setAttribute("aria-hidden", "true");
      for (let i = 0; i < count; i++) {
        const dot = document.createElement("i");
        const dur = 11 + Math.random() * 12;
        dot.style.setProperty("--x", (Math.random() * 100).toFixed(1) + "%");
        dot.style.setProperty("--s", (3 + Math.random() * 5).toFixed(1) + "px");
        dot.style.setProperty("--t", dur.toFixed(1) + "s");
        dot.style.setProperty("--dl", (-Math.random() * dur).toFixed(1) + "s");
        dot.style.setProperty("--dx", (Math.random() * 80 - 40).toFixed(0) + "px");
        dot.style.setProperty("--o", (0.45 + Math.random() * 0.45).toFixed(2));
        wrap.appendChild(dot);
      }
      host.insertBefore(wrap, host.firstChild);
    });
  }

  /* 14c. Gerak yang mengikuti gulir: parallax stiker + garis waktu */
  function initScrollMotion() {
    if (REDUCE) return;
    const pages = Array.from(document.querySelectorAll(".page"));
    const timeline = document.querySelector(".love-timeline");
    const items = timeline ? Array.from(timeline.querySelectorAll(".timeline-item")) : [];
    let ticking = false;

    function update() {
      ticking = false;
      const vh = window.innerHeight || document.documentElement.clientHeight;

      pages.forEach((page) => {
        if (!page.classList.contains("in-view")) return;
        const r = page.getBoundingClientRect();
        const p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
        page.style.setProperty("--py", clamp(p, -1, 1).toFixed(3));
      });

      if (timeline) {
        const r = timeline.getBoundingClientRect();
        const line = vh * 0.62;
        timeline.style.setProperty("--tl", clamp((line - r.top) / Math.max(r.height, 1), 0, 1).toFixed(3));
        items.forEach((item) => {
          const dot = item.querySelector(".timeline-dot");
          if (dot) item.classList.toggle("is-lit", dot.getBoundingClientRect().top < line);
        });
      }
    }
    const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    // Hitung ulang saat undangan dibuka (bagian ini awalnya tersembunyi)
    const invitation = document.getElementById("invitation");
    if (invitation && "MutationObserver" in window) {
      new MutationObserver(() => { setTimeout(request, 150); setTimeout(request, 700); })
        .observe(invitation, { attributes: true, attributeFilter: ["class"] });
    }
    request();
  }

  /* 14d. Efek riak pada tombol */
  function initRipple() {
    if (REDUCE) return;
    document.addEventListener("pointerdown", (e) => {
      const btn = e.target.closest && e.target.closest(".outline-btn, .submit-btn, .copy-btn, .emoji-btn");
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.6;
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      ripple.style.width = ripple.style.height = size + "px";
      ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
      ripple.style.top = (e.clientY - rect.top - size / 2) + "px";
      btn.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
    }, { passive: true });
  }

  /* 14e. Cahaya lembut mengikuti kursor (laptop/desktop saja) */
  function initCursorGlow() {
    if (REDUCE || LITE || !FINE) return;
    const glow = document.createElement("div");
    glow.className = "cursor-glow";
    glow.setAttribute("aria-hidden", "true");
    document.body.appendChild(glow);

    let tx = 0, ty = 0, x = 0, y = 0, running = false;
    function frame() {
      x += (tx - x) * 0.14;
      y += (ty - y) * 0.14;
      glow.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)";
      if (Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5) requestAnimationFrame(frame);
      else running = false;
    }
    document.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      if (!glow.classList.contains("is-on")) { x = tx = e.clientX; y = ty = e.clientY; glow.classList.add("is-on"); }
      tx = e.clientX; ty = e.clientY;
      if (!running) { running = true; requestAnimationFrame(frame); }
    }, { passive: true });
    document.documentElement.addEventListener("mouseleave", () => glow.classList.remove("is-on"));
  }

  safe(splitHeadings);
  safe(splitHashtags);
  safe(addDust);
  safe(initScrollMotion);
  safe(initRipple);
  safe(initCursorGlow);
})();


/* --- 15. GALERI: ZOOM FOTO DENGAN LATAR BLUR (klik mouse / ketuk layar sentuh) --- */
/* Animasi digerakkan langsung oleh JavaScript (bukan CSS/WAAPI) dan selalu berakhir di posisi tengah,
   sehingga tidak bisa "macet" di pojok walau GPU ponsel sedang berat. */
(function initGalleryLightbox() {
  "use strict";
  try {
    const sliders = Array.from(document.querySelectorAll(".gallery-slider"));
    if (!sliders.length) return;

    const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const REST = { x: 0, y: 0, r: 0, s: 1, o: 1 };
    const easeOut = (t) => 1 - Math.pow(1 - t, 4);
    const easeIn = (t) => t * t * t;

    const numOf = (el) => {
      const m = el && el.className && String(el.className).match(/\bgallery-(\d+)\b/);
      return m ? Number(m[1]) : null;
    };

    // Daftar foto unik (slider menggandakan item agar bisa berputar)
    const photos = [];
    sliders.forEach((s) => s.querySelectorAll(".slider-item").forEach((it) => {
      const n = numOf(it);
      if (n && photos.indexOf(n) === -1) photos.push(n);
    }));
    photos.sort((a, b) => a - b);
    if (!photos.length) return;

    /* ---------- Bangun elemen lightbox ---------- */
    const icon = (d) => '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>";
    const lb = document.createElement("div");
    lb.className = "lb";
    lb.hidden = true;
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Galeri foto");
    lb.innerHTML =
      '<div class="lb-backdrop"></div>' +
      '<div class="lb-stage"><figure class="lb-card" role="img"><div class="frame-overlay"></div></figure></div>' +
      '<button type="button" class="lb-btn lb-close" aria-label="Tutup">' + icon('<path d="M6 6l12 12M18 6L6 18"/>') + "</button>" +
      '<div class="lb-bar">' +
        '<button type="button" class="lb-btn lb-prev" aria-label="Foto sebelumnya">' + icon('<path d="M15 5l-7 7 7 7"/>') + "</button>" +
        '<p class="lb-count" aria-live="polite"></p>' +
        '<button type="button" class="lb-btn lb-next" aria-label="Foto berikutnya">' + icon('<path d="M9 5l7 7-7 7"/>') + "</button>" +
      "</div>";
    document.body.appendChild(lb);

    const stage = lb.querySelector(".lb-stage");
    const card = lb.querySelector(".lb-card");
    const counter = lb.querySelector(".lb-count");
    const btnClose = lb.querySelector(".lb-close");
    const btnPrev = lb.querySelector(".lb-prev");
    const btnNext = lb.querySelector(".lb-next");

    let index = 0;
    let source = null;
    let isOpen = false;
    let closing = false;
    let busy = false;
    let lastFocus = null;
    let cur = Object.assign({}, REST);   // posisi kartu saat ini
    let tweenId = 0;                      // penanda animasi yang sedang berjalan

    /* ---------- Penggerak kartu ---------- */
    function setState(st) {
      cur = { x: st.x, y: st.y, r: st.r, s: st.s, o: st.o };
      if (st.x === 0 && st.y === 0 && st.r === 0 && st.s === 1) card.style.transform = "";
      else card.style.transform = "translate3d(" + st.x.toFixed(1) + "px," + st.y.toFixed(1) + "px,0) rotate(" + st.r.toFixed(2) + "deg) scale(" + st.s.toFixed(4) + ")";
      card.style.opacity = st.o >= 1 ? "" : String(Math.max(0, st.o).toFixed(3));
    }
    function stopTween() { tweenId++; }
    // Animasi dari kondisi "from" ke "to". Selalu berakhir tepat di "to" (dijaga timer cadangan).
    function tween(from, to, ms, ease, onDone) {
      const id = ++tweenId;
      if (REDUCE) { setState(to); if (onDone) onDone(); return; }
      let finished = false;
      const finish = () => {
        if (finished || id !== tweenId) return;
        finished = true;
        setState(to);
        card.style.willChange = "";
        if (onDone) onDone();
      };
      card.style.willChange = "transform, opacity";
      const t0 = performance.now();
      const frame = (now) => {
        if (id !== tweenId || finished) return;
        const k = Math.min(1, (now - t0) / ms);
        const e = ease(k);
        setState({
          x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e,
          r: from.r + (to.r - from.r) * e, s: from.s + (to.s - from.s) * e,
          o: from.o + (to.o - from.o) * e
        });
        if (k < 1) requestAnimationFrame(frame); else finish();
      };
      requestAnimationFrame(frame);
      setTimeout(finish, ms + 250);
    }

    function setPhoto(i) {
      index = (i + photos.length) % photos.length;
      card.className = "lb-card gallery-" + photos[index];
      card.setAttribute("aria-label", "Foto " + (index + 1) + " dari " + photos.length);
      counter.textContent = (index + 1) + " / " + photos.length;
    }

    // Posisi tengah kartu saat diam (tanpa pengaruh geser/skala saat ini)
    function restCenter() {
      const r = card.getBoundingClientRect();
      return { cx: r.left + r.width / 2 - cur.x, cy: r.top + r.height / 2 - cur.y };
    }
    // Kondisi kartu agar persis menimpa elemen foto di slider (termasuk kemiringan dan skalanya)
    function stateOver(el, opacity) {
      const r = el.getBoundingClientRect();
      const c = restCenter();
      let angle = 0, scale = 1;
      const m = getComputedStyle(el).transform.match(/matrix\(([^)]+)\)/);
      if (m) {
        const v = m[1].split(",").map(Number);
        angle = Math.atan2(v[1], v[0]) * 180 / Math.PI;
        scale = Math.hypot(v[0], v[1]);
      }
      return {
        x: (r.left + r.width / 2) - c.cx, y: (r.top + r.height / 2) - c.cy,
        r: angle, s: (el.offsetWidth * scale) / (card.offsetWidth || 1), o: opacity
      };
    }

    // Cari foto di slider (yang sedang terlihat di layar) untuk tujuan animasi tutup
    function pickSource() {
      const n = photos[index];
      const vw = window.innerWidth, vh = window.innerHeight;
      let best = null, bestArea = 0, bestFull = 1;
      sliders.forEach((s) => s.querySelectorAll(".slider-item.gallery-" + n).forEach((el) => {
        const r = el.getBoundingClientRect();
        const w = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0));
        const h = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
        if (w * h > bestArea) { bestArea = w * h; best = el; bestFull = r.width * r.height; }
      }));
      return best && bestArea > bestFull * 0.35 ? best : null;
    }

    /* ---------- Buka ---------- */
    function open(item) {
      if (isOpen) return;
      const i = photos.indexOf(numOf(item));
      if (i < 0) return;
      lastFocus = document.activeElement;
      source = item;
      isOpen = true;
      closing = false;
      busy = false;
      window.__lbOpen = true;
      stopTween();
      setState(REST);
      setPhoto(i);
      lb.hidden = false;
      document.documentElement.classList.add("lb-open");
      void lb.offsetWidth; // paksa layout sebelum mengukur
      const from = stateOver(item, 0.92);
      setState(from);      // langsung di atas foto asal, sebelum frame pertama digambar
      lb.classList.add("is-open");
      tween(from, REST, 560, easeOut);
      try { btnClose.focus({ preventScroll: true }); } catch (e) {}
    }

    /* ---------- Tutup ---------- */
    function finishClose() {
      stopTween();
      lb.hidden = true;
      lb.classList.remove("is-open");
      document.documentElement.classList.remove("lb-open");
      setState(REST);
      card.style.willChange = "";
      lb.style.removeProperty("--lb-dim");
      isOpen = false;
      closing = false;
      busy = false;
      window.__lbOpen = false;
      if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
    }
    function close() {
      if (!isOpen || closing) return;
      closing = true;
      busy = false;
      lb.classList.remove("is-open");
      const target = pickSource() || (source && source.isConnected && photos[index] === numOf(source) ? source : null);
      const from = Object.assign({}, cur);
      const to = target ? stateOver(target, 1) : { x: cur.x, y: cur.y, r: cur.r, s: cur.s * 0.9, o: 0 };
      tween(from, to, 440, easeOut, finishClose);
    }

    /* ---------- Ganti foto ---------- */
    function go(dir) {
      if (!isOpen || closing || busy) return;
      busy = true;
      if (REDUCE) { setPhoto(index + dir); busy = false; return; }
      const out = { x: -dir * 90, y: cur.y, r: -dir * 5, s: cur.s, o: 0 };
      tween(Object.assign({}, cur), out, 200, easeIn, () => {
        setPhoto(index + dir);
        tween({ x: dir * 90, y: 0, r: dir * 5, s: 1, o: 0 }, REST, 400, easeOut, () => { busy = false; });
      });
      setTimeout(() => { busy = false; }, 900);
    }

    /* ---------- Gestur: geser kiri/kanan = ganti foto, tarik ke bawah = tutup ---------- */
    let drag = null;
    stage.addEventListener("pointerdown", (e) => {
      if (!isOpen || closing || busy) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      stopTween();
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0, moved: false, onCard: !!e.target.closest(".lb-card") };
      try { stage.setPointerCapture(e.pointerId); } catch (err) {}
    });
    stage.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag.dx = e.clientX - drag.x;
      drag.dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(drag.dx, drag.dy) > 8) drag.moved = true;
      if (drag.moved) {
        setState({ x: drag.dx, y: drag.dy * 0.7, r: drag.dx * 0.025, s: 1, o: 1 });
        lb.style.setProperty("--lb-dim", String(1 - Math.min(Math.abs(drag.dy) / 520, 0.55)));
      }
    });
    function endDrag(e, cancelled) {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      const d = drag;
      drag = null;
      lb.style.removeProperty("--lb-dim");
      if (!d.moved) { if (!cancelled && !d.onCard) close(); return; }
      const ax = Math.abs(d.dx), ay = Math.abs(d.dy);
      if (!cancelled && ax > 70 && ax > ay) { go(d.dx < 0 ? 1 : -1); return; }
      if (!cancelled && (d.dy > 110 || ay > 160)) { close(); return; }
      tween(Object.assign({}, cur), REST, 380, easeOut);   // kembali ke tengah
    }
    stage.addEventListener("pointerup", (e) => endDrag(e, false));
    stage.addEventListener("pointercancel", (e) => endDrag(e, true));

    btnClose.addEventListener("click", close);
    btnPrev.addEventListener("click", () => go(-1));
    btnNext.addEventListener("click", () => go(1));
    lb.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });

    document.addEventListener("keydown", (e) => {
      if (!isOpen) return;
      if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
      else if (e.key === "Tab") {
        const list = [btnClose, btnPrev, btnNext];
        const at = list.indexOf(document.activeElement);
        e.preventDefault();
        list[(at + (e.shiftKey ? list.length - 1 : 1)) % list.length].focus({ preventScroll: true });
      }
    });

    /* ---------- Pemicu: ketuk / klik foto di slider (tidak aktif saat digeser) ---------- */
    let press = null;
    let lastOpenAt = 0;
    sliders.forEach((s) => {
      s.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        press = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() };
      }, true);
      s.addEventListener("pointerup", (e) => {
        if (!press || e.pointerId !== press.id) return;
        const moved = Math.hypot(e.clientX - press.x, e.clientY - press.y);
        const dt = performance.now() - press.t;
        press = null;
        if (moved > 10 || dt > 650) return;
        const hit = document.elementFromPoint(e.clientX, e.clientY);
        const item = hit && hit.closest ? hit.closest(".slider-item") : null;
        if (item) { lastOpenAt = performance.now(); open(item); }
      }, true);
      s.addEventListener("pointercancel", () => { press = null; }, true);
    });

    // Klik "susulan" dari ketukan yang sama (browser ponsel) tidak boleh menekan tombol di lightbox
    lb.addEventListener("click", (e) => {
      if (performance.now() - lastOpenAt < 450) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  } catch (err) {
    /* galeri tetap berfungsi sebagai slider biasa jika lightbox gagal */
  }
})();