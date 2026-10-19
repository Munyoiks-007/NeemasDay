(function () {
  "use strict";

  var S = window.SITE;
  var $ = function (sel) { return document.querySelector(sel); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- Photo placeholders ---------- */
  function placeholder(label) {
    var svg =
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 1000'>" +
      "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>" +
      "<stop offset='0' stop-color='#5a2a63'/><stop offset='1' stop-color='#b8325f'/>" +
      "</linearGradient></defs>" +
      "<rect width='100%' height='100%' fill='url(#g)'/>" +
      "<text x='50%' y='47%' text-anchor='middle' fill='#ffe3d1' font-family='Georgia,serif' font-size='54'>Add a photo</text>" +
      "<text x='50%' y='54%' text-anchor='middle' fill='#ffe3d1' opacity='.8' font-family='monospace' font-size='32'>" +
      esc(label) + "</text></svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function withFallback(img, src, alt) {
    img.alt = alt || "";
    img.addEventListener("error", function () {
      img.onerror = null;
      img.src = placeholder(src);
    });
    img.src = src;
    if (img.complete && img.naturalWidth === 0) img.src = placeholder(src);
  }

  /* ---------- Hero ---------- */
  document.title = "Happy birthday, " + S.herName;
  $("#heroTitle").innerHTML =
    "<span>Happy birthday,</span><span class='name'>" + esc(S.herName) + "</span>";
  $("#heroIntro").textContent = S.heroIntro;
  withFallback($("#heroImg"), S.heroPhoto, "A photo of " + S.herName);

  if (S.together && S.together.since) {
    var p = S.together.since.split("-");
    var start = new Date(+p[0], +p[1] - 1, +p[2]);
    var days = Math.floor((Date.now() - start.getTime()) / 86400000);
    if (days >= 0) {
      var counter = $("#counter");
      counter.textContent = days.toLocaleString() + " days of us so far.";
      counter.hidden = false;
    }
  }

  /* ---------- Video ---------- */
  if (S.video && S.video.videos && S.video.videos.length) {
    var video = $("#birthdayVideo");
    var videoStatus = $("#videoStatus");
    var videoControls = $("#videoControls");
    var videoPosition = $("#videoPosition");
    var currentVideo = 0;
    var videos = S.video.videos;
    videoControls.hidden = videos.length < 2;

    function showVideo(index) {
      currentVideo = (index + videos.length) % videos.length;
      var item = videos[currentVideo];
      $("#videoTitle").textContent = item.title || "A little video for you";
      videoPosition.textContent = (currentVideo + 1) + " / " + videos.length;
      videoStatus.textContent = "";
      videoStatus.hidden = true;
      video.src = item.src;
      video.load();
    }

    video.addEventListener("loadeddata", function () {
      videoStatus.hidden = true;
    });
    video.addEventListener("error", function () {
      videoStatus.hidden = false;
      videoStatus.textContent =
        "The video could not be loaded. Check that " + videos[currentVideo].src + " is in this folder.";
    });
    $("#previousVideo").addEventListener("click", function () {
      showVideo(currentVideo - 1);
    });
    $("#nextVideo").addEventListener("click", function () {
      showVideo(currentVideo + 1);
    });
    showVideo(0);
  } else {
    $("#videoSection").hidden = true;
  }

  /* ---------- Timeline ---------- */
  $("#storyTitle").textContent = S.story.title;
  $("#storySub").textContent = S.story.sub;

  var timeline = $("#timeline");
  S.timeline.forEach(function (m) {
    var li = document.createElement("li");
    li.className = "entry";
    li.innerHTML =
      "<div class='card'>" +
        "<button class='photo' type='button' aria-label='Open photo: " + esc(m.title) + "'><img></button>" +
        "<time>" + esc(m.date) + "</time>" +
        "<h3>" + esc(m.title) + "</h3>" +
        "<p>" + esc(m.text) + "</p>" +
      "</div>";
    var img = li.querySelector("img");
    withFallback(img, m.photo, m.title);
    li.querySelector(".photo").addEventListener("click", function () {
      openLightbox(img.src, m.title + " (" + m.date + ")");
    });
    timeline.appendChild(li);
  });

  // The line fills and each dot lights up as you scroll past it.
  var story = $("#story");
  var entries = Array.prototype.slice.call(timeline.children);
  function updateProgress() {
    var rect = timeline.getBoundingClientRect();
    var mid = window.innerHeight * 0.55;
    var pct = Math.min(1, Math.max(0, (mid - rect.top) / rect.height));
    story.style.setProperty("--progress", pct);
    entries.forEach(function (el) {
      el.classList.toggle("reached", el.getBoundingClientRect().top < mid);
    });
  }
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  updateProgress();

  /* ---------- Notes wall ---------- */
  $("#notesTitle").textContent = S.notes.title;
  $("#notesSub").textContent = S.notes.sub;
  var wall = $("#wall");
  S.reasons.forEach(function (text) {
    var li = document.createElement("li");
    li.className = "note";
    li.textContent = text;
    wall.appendChild(li);
  });

  /* ---------- Letter ---------- */
  $("#letterTitle").textContent = S.letter.title;
  var letterBtn = $("#letterBtn");
  var letter = $("#letter");
  letterBtn.textContent = S.letter.button;
  letter.innerHTML =
    S.letter.paragraphs.map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("") +
    "<p class='signoff'>" + esc(S.letter.signoff) + "</p>";

  letterBtn.addEventListener("click", function () {
    var opening = letter.hidden;
    letter.hidden = !opening;
    letterBtn.setAttribute("aria-expanded", String(opening));
    letterBtn.textContent = opening ? "Close the letter" : S.letter.button;
    if (opening) {
      confetti();
      letter.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    }
  });

  /* ---------- Footer ---------- */
  $("#footer").textContent = "Made for you by " + S.yourName + ".";

  /* ---------- Lightbox ---------- */
  var lb = $("#lightbox");
  function openLightbox(src, caption) {
    $("#lbImg").src = src;
    $("#lbImg").alt = caption;
    $("#lbCap").textContent = caption;
    lb.showModal();
  }
  $("#lbClose").addEventListener("click", function () { lb.close(); });
  lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });

  /* ---------- Music ---------- */
  if (Array.isArray(S.music) && S.music.length) {
    var tracks = S.music;
    var currentTrack = 0;
    var audio = new Audio(tracks[currentTrack].src);
    audio.loop = true;
    var btn = $("#music");
    var nextSongBtn = $("#nextSong");
    $("#musicControls").hidden = false;
    nextSongBtn.hidden = tracks.length < 2;
    function updateMusicButton() {
      var playing = !audio.paused;
      btn.textContent = (playing ? "Pause " : "Play ") + tracks[currentTrack].title;
      btn.setAttribute("aria-pressed", String(playing));
      btn.title = (playing ? "Pause " : "Play ") + tracks[currentTrack].title;
    }
    audio.addEventListener("play", updateMusicButton);
    audio.addEventListener("pause", updateMusicButton);
    audio.addEventListener("error", function () {
      btn.title = "The song could not be loaded. Check that " + tracks[currentTrack].src + " is available.";
    });
    btn.addEventListener("click", function () {
      if (audio.paused) {
        audio.play().catch(function () {
          btn.title = "The song could not be played. Check that " + tracks[currentTrack].src + " is available.";
        });
      } else {
        audio.pause();
      }
    });
    nextSongBtn.addEventListener("click", function () {
      var wasPlaying = !audio.paused;
      currentTrack = (currentTrack + 1) % tracks.length;
      audio.src = tracks[currentTrack].src;
      audio.load();
      updateMusicButton();
      nextSongBtn.textContent = "Next: " + tracks[(currentTrack + 1) % tracks.length].title;
      if (wasPlaying) {
        audio.play().catch(function () {
          btn.title = "The song could not be played. Check that " + tracks[currentTrack].src + " is available.";
        });
      }
    });
    nextSongBtn.textContent = "Next: " + tracks[(currentTrack + 1) % tracks.length].title;
    updateMusicButton();
    audio.play().catch(function () {
      btn.title = "Autoplay was blocked by your browser. Click to play " + tracks[currentTrack].title + ".";
    });
  }

  /* ---------- Confetti (only when she opens the letter) ---------- */
  function confetti() {
    if (reduceMotion) return;
    var canvas = $("#confetti");
    var ctx = canvas.getContext("2d");
    var dpr = window.devicePixelRatio || 1;
    var W = window.innerWidth, H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    var colors = ["#ffb48a", "#b8325f", "#d9c6ee", "#f8c9d6", "#d5e6ce"];
    var bits = [];
    for (var i = 0; i < 150; i++) {
      bits.push({
        x: W / 2, y: H * 0.6,
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 17 - 4,
        s: 5 + Math.random() * 7,
        r: Math.random() * 6,
        vr: (Math.random() - 0.5) * 0.3,
        c: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    var frames = 0;
    (function tick() {
      ctx.clearRect(0, 0, W, H);
      bits.forEach(function (b) {
        b.vy += 0.35; b.vx *= 0.99;
        b.x += b.vx; b.y += b.vy; b.r += b.vr;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.r);
        ctx.fillStyle = b.c;
        ctx.fillRect(-b.s / 2, -b.s / 2, b.s, b.s * 0.6);
        ctx.restore();
      });
      if (++frames < 220) requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, W, H);
    })();
  }
})();
