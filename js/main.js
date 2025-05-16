document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const header = document.querySelector(".header");
  const sections = document.querySelectorAll("section");
  const footer = document.querySelector(".footer");
  const backToTopButton = document.getElementById("backToTop");
  const backgroundVideo = document.querySelector(".background-video");
  const contactForm = document.getElementById("contact-form");

  // State variables
  let currentSection = 0;
  let isScrolling = false;
  let lastScrollTime = 0;
  const scrollCooldown = 1000; // Increased to 1000ms for smoother transitions
  let accumulatedDelta = 0;
  const scrollThreshold = 100; // Amount of scroll needed before triggering section change
  let scrollQueue = [];
  let isProcessingScroll = false;
  let lastKnownPosition = 0; // Track scroll position for mobile view

  // Touch handling variables
  let touchStartY = 0;
  let touchStartTime = 0;
  const minSwipeDistance = 50;
  const maxSwipeTime = 300;

  // Utility functions
  const isMobile = () => window.innerWidth <= 800;

  // Initialize video if it exists
  if (backgroundVideo) {
    backgroundVideo.playbackRate = 1;
    backgroundVideo.loop = true;
    backgroundVideo.muted = true;
    backgroundVideo.autoplay = true;

    // Ensure video keeps playing
    backgroundVideo.addEventListener("pause", () => {
      backgroundVideo.play();
    });

    // Handle initial play
    backgroundVideo.play().catch((error) => {
      console.log("Video play failed:", error);
    });

    // Re-play video when tab becomes visible
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && backgroundVideo.paused) {
        backgroundVideo.play();
      }
    });
  }

  // Handle footer placement in contact section
  const contactSection = document.getElementById("contact");
  if (contactSection && footer) {
    // Move footer inside the last section
    contactSection.appendChild(footer);
    contactSection.style.paddingBottom = "80px"; // Add space for footer
    contactSection.style.overflowY = "auto"; // Allow scrolling within the section
    footer.style.position = "relative";
    footer.style.marginTop = "50px";
    footer.style.background = "var(--background-color)";
  }

  // Apply initial mobile or desktop styles
  function applyLayoutStyles() {
    const wasMobile = isMobile();
    const isMobileNow = window.innerWidth <= 800;

    if (isMobileNow) {
      // Store current section before switching to mobile
      if (!wasMobile) {
        lastKnownPosition = currentSection;
      }

      // Mobile layout
      document
        .querySelectorAll("section:not(.hero-section)")
        .forEach((section) => {
          section.style.position = "relative";
          section.style.transform = "none";
          section.style.height = "auto";
          section.style.minHeight = "100vh";
        });
      document.body.style.overflow = "visible";
      document.body.style.position = "static";
      document.body.style.height = "auto";

      // Scroll to the right section on mobile
      if (!wasMobile) {
        const targetSection = sections[lastKnownPosition];
        if (targetSection) {
          setTimeout(() => {
            targetSection.scrollIntoView({ behavior: "instant" });
          }, 0);
        }
      }
    } else {
      // Desktop layout
      if (wasMobile) {
        // Find current section based on scroll position
        const scrollPos = window.scrollY;
        let newCurrentSection = 0;
        sections.forEach((section, index) => {
          const rect = section.getBoundingClientRect();
          if (rect.top <= window.innerHeight / 2) {
            newCurrentSection = index;
          }
        });
        currentSection = newCurrentSection;
      }

      sections.forEach((section, i) => {
        section.style.position = "fixed";
        section.style.transform = `translateY(${(i - currentSection) * 100}%)`;
        section.style.height = "100vh";
      });
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.height = "100%";
    }
  }

  function scrollToSection(index) {
    if (index < 0 || index >= sections.length || isScrolling) return;

    const currentTime = Date.now();
    if (currentTime - lastScrollTime <= scrollCooldown) return;

    isScrolling = true;
    lastScrollTime = currentTime;
    currentSection = index;

    if (isMobile() && index !== 0) {
      // On mobile, use regular scrolling for non-hero sections
      sections[index].scrollIntoView({ behavior: "smooth" });
    } else {
      // Use transform-based scrolling
      sections.forEach((section, i) => {
        section.style.transform = `translateY(${(i - index) * 100}%)`;
      });
    }

    // Update header visibility (only on desktop) and back-to-top button
    if (!isMobile()) {
      if (currentSection === 0) {
        header.classList.remove("hidden");
      } else {
        header.classList.add("hidden");
      }
    }

    // Update back-to-top button visibility
    if (currentSection === 0) {
      backToTopButton.classList.remove("visible");
    } else {
      backToTopButton.classList.add("visible");
    }

    setTimeout(() => {
      isScrolling = false;
    }, scrollCooldown);
  }

  // Process scroll events in queue to avoid rapid firing
  function processScrollQueue() {
    if (scrollQueue.length === 0) {
      isProcessingScroll = false;
      return;
    }

    isProcessingScroll = true;
    const direction = scrollQueue.shift();
    scrollToSection(currentSection + direction);

    setTimeout(() => {
      processScrollQueue();
    }, 100); // Small delay between processing scroll events
  }

  // Handle wheel events
  function handleWheel(e) {
    // Skip custom scrolling for non-hero sections on mobile
    if (isMobile()) {
      const heroSection = document.querySelector(".hero-section");
      if (!(heroSection && heroSection.contains(e.target))) {
        return;
      }
    }

    // Special handling for contact section internal scrolling
    if (currentSection === sections.length - 1) {
      const contactSection = sections[currentSection];

      // Check if the section needs internal scrolling
      if (contactSection.scrollHeight > contactSection.clientHeight) {
        const isAtBottom =
          contactSection.scrollTop + contactSection.clientHeight >=
          contactSection.scrollHeight - 10;
        const isAtTop = contactSection.scrollTop <= 10;

        // Allow natural scrolling within the section if not at boundaries
        if ((e.deltaY > 0 && !isAtBottom) || (e.deltaY < 0 && !isAtTop)) {
          return;
        }
      }
    }

    e.preventDefault();

    if (isScrolling) return;

    accumulatedDelta += Math.abs(e.deltaY);

    if (accumulatedDelta < scrollThreshold) {
      return;
    }

    accumulatedDelta = 0; // Reset accumulated delta
    const direction = e.deltaY > 0 ? 1 : -1;

    // Only add to queue if it's different from the last direction
    if (
      scrollQueue.length === 0 ||
      scrollQueue[scrollQueue.length - 1] !== direction
    ) {
      scrollQueue.push(direction);
    }

    if (!isProcessingScroll) {
      processScrollQueue();
    }
  }

  // Touch event handlers
  function handleTouchStart(e) {
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
  }

  function handleTouchEnd(e) {
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime;

    if (touchDuration <= maxSwipeTime) {
      const deltaY = touchStartY - touchEndY;
      if (Math.abs(deltaY) >= minSwipeDistance) {
        const direction = deltaY > 0 ? 1 : -1;
        scrollToSection(currentSection + direction);
      }
    }
  }

  // Header visibility and back to top handling
  function handleScroll() {
    const scrollPosition = window.scrollY || window.pageYOffset;

    // Only hide header on desktop
    if (!isMobile()) {
      if (scrollPosition > scrollThreshold) {
        header.classList.add("hidden");
      } else {
        header.classList.remove("hidden");
      }
    }

    // Back to top button visibility
    if (scrollPosition > scrollThreshold) {
      backToTopButton.classList.add("visible");
    } else {
      backToTopButton.classList.remove("visible");
    }
  }

  // Contact form submission
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Create FormData object
      const formData = new FormData(this);

      // Disable submit button and show loading state
      const submitBtn = this.querySelector(".submit-btn");
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";

      // Send form data using fetch
      fetch("process_form.php", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          // Show response message to user
          alert(data.message);

          if (data.success) {
            // Reset form on success
            this.reset();
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("An error occurred. Please try again later.");
        })
        .finally(() => {
          // Re-enable submit button
          submitBtn.disabled = false;
          submitBtn.textContent = "Submit";
        });
    });
  }

  // Scroll arrow functionality
  const scrollArrow = document.querySelector(".scroll-arrow");
  if (scrollArrow) {
    scrollArrow.addEventListener("click", () => {
      if (isMobile()) {
        const projectsSection = document.getElementById("projects");
        projectsSection.scrollIntoView({ behavior: "smooth" });
      } else {
        scrollToSection(1);
      }
    });
  }

  // Event listeners
  window.addEventListener("wheel", handleWheel, { passive: false });
  window.addEventListener("touchstart", handleTouchStart);
  window.addEventListener("touchend", handleTouchEnd);
  window.addEventListener("scroll", handleScroll);
  window.addEventListener("resize", applyLayoutStyles);

  if (backToTopButton) {
    backToTopButton.addEventListener("click", function (e) {
      e.preventDefault();

      if (isMobile()) {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } else {
        // For desktop view, scroll to section 0 (hero)
        scrollToSection(0);
      }
    });
  }

  // Navigation menu click handlers
  document.querySelectorAll(".nav-menu a").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href").substring(1);
      const targetIndex = Array.from(sections).findIndex(
        (section) => section.id === targetId
      );
      if (targetIndex !== -1) {
        scrollToSection(targetIndex);
      }
    });
  });

  // Initialize sections position
  sections.forEach((section, i) => {
    section.style.transform = `translateY(${i * 100}%)`;
  });

  // Apply initial layout
  applyLayoutStyles();
});

// Google Maps initialization
window.initMap = function () {
  const officeLocation = { lat: 33.5278692, lng: -117.769803 };
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 15,
    center: officeLocation,
    styles: [
      { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
      {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#38414e" }],
      },
      {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#212a37" }],
      },
      {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9ca5b3" }],
      },
    ],
  });

  new google.maps.Marker({
    position: officeLocation,
    map: map,
    title: "Resonance Design Studio",
  });
};
const mobileNavToggle = document.querySelector(".mobile-nav-toggle");
const navMenu = document.querySelector(".nav-menu");

// Toggle navigation when button is clicked
mobileNavToggle.addEventListener("click", function () {
  this.classList.toggle("active");
  navMenu.classList.toggle("active");
});

// Close menu when clicking on a link
document.querySelectorAll(".nav-menu a").forEach((link) => {
  link.addEventListener("click", function () {
    navMenu.classList.remove("active");
    mobileNavToggle.classList.remove("active");
  });
});

// Close menu when clicking outside
document.addEventListener("click", function (event) {
  if (
    !event.target.closest(".nav-menu") &&
    !event.target.closest(".mobile-nav-toggle")
  ) {
    navMenu.classList.remove("active");
    mobileNavToggle.classList.remove("active");
  }
});

// Event listeners with debouncing for resize
let resizeTimeout;
window.addEventListener("resize", () => {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
  }
  resizeTimeout = setTimeout(applyLayoutStyles, 100);
});
