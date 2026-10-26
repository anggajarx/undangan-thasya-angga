/* =========================================================
   WEDDING INVITATION — ANA THASYA & FAJAR
   ========================================================= */

const params = new URLSearchParams(window.location.search);
const guestName = params.get("to");
if (guestName) {
  const nameEl = document.getElementById("guestName");
  if (nameEl) {
    nameEl.textContent = decodeURIComponent(guestName.replace(/\+/g, " "));
  }
}

window.addEventListener("load", () => {
  setTimeout(() => {
    const loader = document.getElementById("loader");
    if (loader) {
      loader.style.transition = "opacity 0.6s ease";
      loader.style.opacity = "0";
      setTimeout(() => loader.remove(), 600);
    }
  }, 2000); 
});

const openBtn = document.getElementById("openBtn");
const invitation = document.getElementById("invitation");
const cover = document.getElementById("cover");
const music = document.getElementById("music");
const musicBtn = document.getElementById("musicBtn");
const musicPlayer = document.getElementById("musicPlayer");
const musicStatus = document.getElementById("musicStatus");

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
      
      document.querySelectorAll('.reveal-on-scroll').forEach(el => {
        observer.observe(el);
      });
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
}

const targetDate = new Date("2026-12-04T00:00:00+07:00").getTime();
function updateCountdown() {
  const diff = Math.max(0, targetDate - Date.now());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000) % 24;
  const minutes = Math.floor(diff / 60000) % 60;
  const seconds = Math.floor(diff / 1000) % 60;

  const dEl = document.getElementById("days");
  const hEl = document.getElementById("hours");
  const mEl = document.getElementById("minutes");
  const sEl = document.getElementById("seconds");

  if (dEl) dEl.textContent = String(days).padStart(2, "0");
  if (hEl) hEl.textContent = String(hours).padStart(2, "0");
  if (mEl) mEl.textContent = String(minutes).padStart(2, "0");
  if (sEl) sEl.textContent = String(seconds).padStart(2, "0");
}
updateCountdown();
setInterval(updateCountdown, 1000);

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll(".reveal-on-scroll").forEach(el => observer.observe(el));

document.querySelectorAll(".copy-btn").forEach(btn => {
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
    setTimeout(() => btn.textContent = originalText, 1600);
  });
});

const form = document.getElementById("rsvpForm");
const messagesContainer = document.getElementById("messages");
const storageKey = "anaThasyaFajarMessages";
let savedMessages = JSON.parse(localStorage.getItem(storageKey) || "[]");

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function renderMessages() {
  if (!messagesContainer) return;
  messagesContainer.innerHTML = savedMessages.map(item => `
    <article class="message">
      <strong>${escapeHtml(item.name)}</strong>
      <small>${escapeHtml(item.attendance)}</small>
      <p>${escapeHtml(item.message)}</p>
    </article>
  `).join("");
}

document.querySelectorAll(".sticker").forEach(sticker => {
  sticker.addEventListener("click", () => {
    document.querySelectorAll(".sticker").forEach(x => x.classList.remove("active"));
    sticker.classList.add("active");
    const textarea = document.getElementById("message");
    if (textarea) {
      textarea.value = `${sticker.dataset.sticker} ${textarea.value}`.trim();
      textarea.focus();
    }
  });
});

if (form) {
  form.addEventListener("submit", event => {
    event.preventDefault();
    const nameInput = document.getElementById("nameInput");
    const attendanceInput = document.getElementById("attendance");
    const messageInput = document.getElementById("message");

    if (nameInput && attendanceInput && messageInput) {
      savedMessages.unshift({
        name: nameInput.value.trim(),
        attendance: attendanceInput.value,
        message: messageInput.value.trim()
      });
      savedMessages = savedMessages.slice(0, 30);
      localStorage.setItem(storageKey, JSON.stringify(savedMessages));
      renderMessages();
      form.reset();
      document.querySelectorAll(".sticker").forEach(x => x.classList.remove("active"));
    }
  });
}
renderMessages();

if (music) {
  music.addEventListener("play", () => setMusicState(true));
  music.addEventListener("pause", () => setMusicState(false));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && !music.paused) music.pause();
  });
}
if (musicBtn) {
  musicBtn.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      musicBtn.click();
    }
  });
}

const galleries = document.querySelectorAll('.gallery-slider');
galleries.forEach(gallery => {
  const track = gallery.querySelector('.slider-track');
  
  gallery.addEventListener('touchstart', () => {
    track.style.animationPlayState = 'paused';
  }, { passive: true });
  
  gallery.addEventListener('touchend', () => {
    setTimeout(() => {
      track.style.animationPlayState = 'running';
    }, 1500);
  });
});

window.addEventListener("load", () => {
  setTimeout(() => {
    const revealElements = document.querySelectorAll('.cover-content .reveal');
    revealElements.forEach(el => {
      el.classList.add('active'); 
    });
  }, 2000); 
});