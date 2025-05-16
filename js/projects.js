document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const header = document.querySelector(".header");
  const backToTopButton = document.getElementById("backToTop");
  const mobileNavToggle = document.querySelector(".mobile-nav-toggle");
  const navMenu = document.querySelector(".nav-menu");

  // Function to determine if we're on mobile
  const isMobile = () => window.innerWidth <= 800;

  // Fix body styles for projects page
  function fixProjectPageStyles() {
    // Reset all fixed positioning from the main page
    document.body.style.position = "static";
    document.body.style.overflow = "auto";
    document.body.style.height = "auto";
    document.body.style.width = "100%";
    document.body.style.minHeight = "100vh";
    document.body.style.overflowX = "hidden"; // Prevent horizontal scrolling

    // Remove any fixed positioning from sections
    document.querySelectorAll("section").forEach((section) => {
      section.style.position = "relative";
      section.style.transform = "none";
    });

    // Fix padding for content
    const projectsContent = document.querySelector(".projects-page-content");
    if (projectsContent) {
      projectsContent.style.paddingTop = "6rem";
      projectsContent.style.paddingBottom = "6rem";
      projectsContent.style.overflowX = "hidden"; // Prevent horizontal overflow
    }

    // Make sure the footer is properly positioned
    const footer = document.querySelector(".footer");
    if (footer) {
      footer.style.position = "relative";
      footer.style.bottom = "0";
    }

    // Fix any project cards that might be misaligned
    document.querySelectorAll(".project-card").forEach((card) => {
      card.style.transform = "none";
      card.style.position = "relative";
    });
  }

  // Run immediately to ensure scrolling works
  fixProjectPageStyles();

  // Handle scroll events for header transparency and back-to-top visibility
  function handleScroll() {
    const scrollPosition = window.scrollY || window.pageYOffset;
    const threshold = 100;

    // Header transparency
    if (scrollPosition > threshold) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }

    // Back to top button visibility
    if (scrollPosition > threshold) {
      backToTopButton.classList.add("visible");
    } else {
      backToTopButton.classList.remove("visible");
    }
  }

  // Toggle navigation when button is clicked
  if (mobileNavToggle) {
    mobileNavToggle.addEventListener("click", function () {
      this.classList.toggle("active");
      navMenu.classList.toggle("active");
    });
  }

  // Close menu when clicking on a link
  document.querySelectorAll(".nav-menu a").forEach((link) => {
    link.addEventListener("click", function () {
      navMenu.classList.remove("active");
      if (mobileNavToggle) mobileNavToggle.classList.remove("active");
    });
  });

  // Close menu when clicking outside
  document.addEventListener("click", function (event) {
    if (
      !event.target.closest(".nav-menu") &&
      !event.target.closest(".mobile-nav-toggle")
    ) {
      navMenu.classList.remove("active");
      if (mobileNavToggle) mobileNavToggle.classList.remove("active");
    }
  });

  // Back to top functionality
  if (backToTopButton) {
    backToTopButton.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  // Fix alignment issues that might arise
  function handleResize() {
    fixProjectPageStyles();

    // Adjust project container padding based on screen size
    const projectsContainer = document.querySelector(".projects-container");
    if (projectsContainer) {
      if (window.innerWidth <= 800) {
        // Mobile adjustments
        projectsContainer.style.padding = "0.5rem";
        projectsContainer.style.width = "calc(100% - 1rem)";
        projectsContainer.style.alignItems = "center"; // Center alignment for mobile
      } else {
        // Desktop adjustments
        projectsContainer.style.padding = "1rem";
        projectsContainer.style.width = "calc(100% - 2rem)";
        projectsContainer.style.alignItems = "flex-start"; // Top alignment for desktop
      }
    }

    // Make sure project cards don't overflow viewport and maintain alignment
    document.querySelectorAll(".project-card").forEach((card) => {
      card.style.maxWidth = "100%";
      card.style.boxSizing = "border-box";
      card.style.transform = "none"; // Reset any transforms that could be causing misalignment

      // Reset image containers for consistent aspect ratio
      const imageContainer = card.querySelector(".project-image-container");
      if (imageContainer) {
        imageContainer.style.height = isMobile() ? "auto" : "300px";
      }
    });

    // Apply alignment fix after a short delay to ensure DOM has updated
    setTimeout(fixCardAlignment, 100);
  }

  // Fix card alignment after scroll
  function fixCardAlignment() {
    // Get all project cards
    document.querySelectorAll(".project-card").forEach((card) => {
      // Reset any transforms applied by animation
      card.style.transform = "none";

      // Set explicit height to auto to ensure natural height
      card.style.height = "auto";
    });

    if (!isMobile()) {
      // Only for desktop - fix vertical alignment

      // First, normalize all first row cards
      const firstRowCards = [
        document.querySelector(
          ".project-column:nth-child(1) .project-card:nth-child(1)"
        ),
        document.querySelector(
          ".project-column:nth-child(2) .project-card:nth-child(1)"
        ),
        document.querySelector(
          ".project-column:nth-child(3) .project-card:nth-child(1)"
        ),
      ].filter(Boolean);

      // Get the maximum height of first row cards
      let maxFirstRowHeight = 0;
      firstRowCards.forEach((card) => {
        card.style.height = "auto";
        const height = card.offsetHeight;
        if (height > maxFirstRowHeight) {
          maxFirstRowHeight = height;
        }
      });

      // Apply uniform height to first row
      if (maxFirstRowHeight > 0) {
        firstRowCards.forEach((card) => {
          card.style.height = `${maxFirstRowHeight}px`;
        });
      }

      // Now handle second row cards
      const secondRowCards = [
        document.querySelector(
          ".project-column:nth-child(1) .project-card:nth-child(2)"
        ),
        document.querySelector(
          ".project-column:nth-child(2) .project-card:nth-child(2)"
        ),
        document.querySelector(
          ".project-column:nth-child(3) .project-card:nth-child(2)"
        ),
      ].filter(Boolean);

      // Reset height and position of second row cards
      secondRowCards.forEach((card) => {
        if (card) {
          card.style.height = "auto";
          card.style.marginTop = "2rem"; // Consistent spacing
        }
      });

      // Get the maximum height of second row cards
      let maxSecondRowHeight = 0;
      secondRowCards.forEach((card) => {
        if (card) {
          const height = card.offsetHeight;
          if (height > maxSecondRowHeight) {
            maxSecondRowHeight = height;
          }
        }
      });

      // Apply uniform height to second row
      if (maxSecondRowHeight > 0) {
        secondRowCards.forEach((card) => {
          if (card) {
            card.style.height = `${maxSecondRowHeight}px`;
          }
        });
      }
    } else {
      // For mobile - let cards have their natural height
      document.querySelectorAll(".project-card").forEach((card) => {
        card.style.height = "auto";
        card.style.marginTop = "1rem";
      });
    }
  }

  // Event listeners
  window.addEventListener("scroll", function () {
    handleScroll();
    fixCardAlignment(); // Fix card alignment on every scroll event
  });
  window.addEventListener("resize", handleResize);

  // Initialize
  handleScroll();
  handleResize();
  fixCardAlignment();

  // Ensure proper alignment once all images are loaded
  window.addEventListener("load", function () {
    // After all assets (including images) are loaded
    setTimeout(() => {
      fixCardAlignment();
    }, 200);
  });
});
