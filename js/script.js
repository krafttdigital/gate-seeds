(function () {
  "use strict";

  var WHATSAPP_NUMBER = "919216971001";

  /* ---------- sticky header ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);

    var backTop = document.querySelector(".back-to-top");
    if (backTop) backTop.classList.toggle("is-visible", window.scrollY > 560);
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- sequential hero video playlist ---------- */
  var heroVideos = Array.prototype.slice.call(document.querySelectorAll("[data-hero-video]"));
  var heroVideoButtons = Array.prototype.slice.call(document.querySelectorAll("[data-video-index]"));
  var currentHeroVideo = 0;
  var heroVideoRequest = 0;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function updateHeroVideoButtons(index) {
    heroVideoButtons.forEach(function (button, buttonIndex) {
      var active = buttonIndex === index;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
  }

  function prepareNextHeroVideo(index) {
    if (!heroVideos.length) return;
    var next = heroVideos[(index + 1) % heroVideos.length];
    if (next.getAttribute("preload") !== "auto") {
      next.setAttribute("preload", "auto");
      next.load();
    }
  }

  function showHeroVideo(index) {
    if (!heroVideos.length || reduceMotion) return;
    index = (index + heroVideos.length) % heroVideos.length;
    var previous = heroVideos[currentHeroVideo];
    var next = heroVideos[index];
    var activated = false;
    var requestId = ++heroVideoRequest;

    function activate() {
      if (activated || requestId !== heroVideoRequest) return;
      activated = true;
      heroVideos.forEach(function (video, videoIndex) {
        video.classList.toggle("is-active", videoIndex === index);
        if (videoIndex !== index) video.pause();
      });
      currentHeroVideo = index;
      updateHeroVideoButtons(index);
      prepareNextHeroVideo(index);
    }

    if (previous === next && !next.paused) return;
    next.currentTime = 0;
    next.addEventListener("playing", activate, { once: true });
    var playRequest = next.play();
    if (playRequest && typeof playRequest.catch === "function") {
      playRequest.catch(activate);
    }
    window.setTimeout(activate, 1200);
  }

  if (heroVideos.length) {
    heroVideos.forEach(function (video, index) {
      video.addEventListener("ended", function () {
        showHeroVideo((index + 1) % heroVideos.length);
      });
    });
    heroVideoButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        showHeroVideo(parseInt(button.getAttribute("data-video-index"), 10));
      });
    });

    if (reduceMotion) {
      heroVideos.forEach(function (video) { video.pause(); });
    } else {
      var firstPlay = heroVideos[0].play();
      if (firstPlay && typeof firstPlay.catch === "function") firstPlay.catch(function () {});
      prepareNextHeroVideo(0);
    }
  }

  /* ---------- farmer testimonial videos ---------- */
  var testimonialSection = document.querySelector("[data-testimonial-section]");
  var testimonialVideos = Array.prototype.slice.call(document.querySelectorAll("[data-testimonial-video]"));
  var testimonialSectionVisible = false;

  function pauseTestimonialVideos() {
    testimonialVideos.forEach(function (video) {
      video.pause();
      var card = video.closest(".farmer-video-card");
      if (card) card.classList.remove("is-playing");
    });
  }

  function playTestimonialVideos() {
    if (reduceMotion || document.hidden || !testimonialSectionVisible) return;
    testimonialVideos.forEach(function (video) {
      video.muted = true;
      video.defaultMuted = true;
      var request = video.play();
      if (request && typeof request.catch === "function") request.catch(function () {});
    });
  }

  if (testimonialSection && testimonialVideos.length) {
    testimonialVideos.forEach(function (video) {
      video.addEventListener("playing", function () {
        var card = video.closest(".farmer-video-card");
        if (card) card.classList.add("is-playing");
      });
      video.addEventListener("pause", function () {
        var card = video.closest(".farmer-video-card");
        if (card) card.classList.remove("is-playing");
      });
    });

    if (reduceMotion) {
      pauseTestimonialVideos();
    } else if ("IntersectionObserver" in window) {
      var testimonialIO = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            testimonialSectionVisible = entry.isIntersecting;
            if (entry.isIntersecting) playTestimonialVideos();
            else pauseTestimonialVideos();
          });
        },
        { threshold: 0.12, rootMargin: "-5% 0px -5% 0px" }
      );
      testimonialIO.observe(testimonialSection);
    } else {
      testimonialSectionVisible = true;
      playTestimonialVideos();
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) pauseTestimonialVideos();
      else playTestimonialVideos();
    });
    window.addEventListener("pagehide", pauseTestimonialVideos);
  }

  /* ---------- mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (header) header.classList.toggle("menu-open", open);
      document.body.style.overflow = open ? "hidden" : "";
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        if (header) header.classList.remove("menu-open");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------- scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal, .reveal-stagger");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- animated counters ---------- */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    var countIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var target = parseFloat(el.getAttribute("data-count"));
          var suffix = el.getAttribute("data-suffix") || "";
          var duration = 1400;
          var start = null;

          function step(ts) {
            if (!start) start = ts;
            var progress = Math.min((ts - start) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            var value = target * eased;
            el.textContent = (target % 1 !== 0 ? value.toFixed(1) : Math.round(value)) + suffix;
            if (progress < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
          countIO.unobserve(el);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) { countIO.observe(el); });
  }

  /* ---------- WhatsApp helpers ---------- */
  function openWhatsApp(message) {
    var url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
    window.open(url, "_blank", "noopener");
  }
  window.gsWhatsApp = openWhatsApp;

  /* ---------- contact form -> WhatsApp ---------- */
  var contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("name").value.trim();
      var phone = document.getElementById("phone").value.trim();
      var need = document.getElementById("need") ? document.getElementById("need").value : "";
      var message = document.getElementById("message").value.trim();

      if (!name || !phone || !message) {
        var feedback = document.getElementById("formFeedback");
        if (feedback) feedback.textContent = "Please fill in your name, phone number and message.";
        return;
      }

      var text =
        "New seed requirement enquiry from gateseeds.com\n" +
        "Name: " + name + "\n" +
        "Phone: " + phone + "\n" +
        (need ? "Requirement: " + need + "\n" : "") +
        "Message: " + message;

      openWhatsApp(text);
      contactForm.reset();
    });
  }

  /* ---------- year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
