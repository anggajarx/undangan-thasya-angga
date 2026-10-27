/* =========================================================
WEDDING INVITATION — ANA THASYA & FAJAR
========================================================= */

/* --- 1. NAMA TAMU DARI URL (?to=Nama) --- */
const params = new URLSearchParams(window.location.search);
const guestName = params.get("to");
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

/* --- 5. MUSIK --- */
function setMusicState(playing) {
  if (musicPlayer && musicBtn && musicStatus) {
    musicPlayer.classList.toggle("playing", playing);
    musicBtn.classList.toggle("playing", playing);
    musicStatus.textContent = playing ? "Musik Menyala" : "Musik Mati";
  }
}

if (openBtn) {
  openBtn.addEventListener("click", () => {
    if (cover) cover.classList.add("hide-cover");
    if (music) {
      music.play()
        .then(() => setMusicState(true))
        .catch(() => setMusicState(false));
    }
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
    if (music.paused) {
      music.play().then(() => setMusicState(true)).catch(() => setMusicState(false));
    } else {
      music.pause();
      setMusicState(false);
    }
  });
  musicBtn.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      musicBtn.click();
    }
  });
}

if (music) {
  music.addEventListener("play", () => setMusicState(true));
  music.addEventListener("pause", () => setMusicState(false));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && !music.paused) music.pause();
  });
}

/* --- 6. HITUNG MUNDUR --- */
(function initCountdown() {
  const TARGET = new Date("2026-12-04T13:30:00+07:00").getTime();   // waktu Akad Nikah
  const START = new Date("2026-01-01T00:00:00+07:00").getTime();    // acuan awal ring "Hari"
  const SPAN = Math.max(1, TARGET - START);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  const location = "Wedding Celebration, Jakarta, Indonesia";
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
const API_URL = "https://script.google.com/macros/s/AKfycbxYMrAXB2rk9aIDWIXvWJ74y34oUO7w7QDHHD055lCI/exec";
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
    const initial = escapeHtml(String(item.name).trim().charAt(0).toUpperCase() || "?");
    return '<article class="message' + (i === newIndex ? " is-new" : "") + '" data-att="' + att +
      '" style="--h:' + nameHue(item.name) + '">' +
      '<header class="msg-head">' +
      '<span class="msg-avatar" aria-hidden="true">' + initial + "</span>" +
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
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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