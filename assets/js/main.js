// Global data store accessible across scripts
let siteData = null;

const GA_TRACKING_ID = "G-SQYJCSM6S8";

/**
 * Dynamically initializes Google Analytics to prevent code duplication across HTML pages.
 */
function initGoogleAnalytics(id = GA_TRACKING_ID) {
  if (!id || window.__ga_initialized) return;
  window.__ga_initialized = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", id);
}

// Automatically initialize analytics
initGoogleAnalytics();

/**
 * Loads header, footer, and site data concurrently using Promise.all
 * to minimize network latency and promote reusable site initialization.
 */
async function loadSiteData(activeNavId) {
  try {
    const [headerRes, footerRes, dataRes] = await Promise.all([
      fetch("header.html"),
      fetch("footer.html"),
      fetch("assets/data.json")
    ]);

    const [headerHtml, footerHtml, data] = await Promise.all([
      headerRes.text(),
      footerRes.text(),
      dataRes.json()
    ]);

    siteData = data;

    // Inject and configure Header
    const headerEl = document.getElementById("site-header");
    if (headerEl) {
      headerEl.innerHTML = headerHtml;
      if (activeNavId) {
        const activeLink = document.getElementById(activeNavId);
        if (activeLink) activeLink.classList.add("active");
      }
      const headerNameEl = document.getElementById("header-name");
      if (headerNameEl && data?.profile?.name) {
        headerNameEl.innerText = data.profile.name;
      }
      if (data?.profile?.contact) {
        setupAntiBotContacts(data.profile.contact);
      }
    }

    // Inject and configure Footer
    const footerEl = document.getElementById("site-footer");
    if (footerEl) {
      footerEl.innerHTML = footerHtml;
      const yearEl = document.getElementById("copyright-year");
      if (yearEl) {
        yearEl.innerText = new Date().getFullYear();
      }
    }

    // Initialize global Lightbox for zoomable images
    setupLightbox();

    return siteData;
  } catch (err) {
    console.error("Error loading site data:", err);
  }
}

/**
 * Anti-bot link protection: reconstructs emails and decodes URLs upon click.
 */
function setupAntiBotContacts(contact) {
  const emailBtn = document.getElementById("email-btn");
  const apptBtn = document.getElementById("appt-btn");

  if (emailBtn) {
    emailBtn.addEventListener("click", () => {
      const addr = `${contact.email_user}@${contact.email_domain}`;
      window.location.href = `mailto:${addr}`;
    });
  }

  if (apptBtn) {
    apptBtn.addEventListener("click", () => {
      const url = atob(contact.appointment_url_b64);
      window.open(url, "_blank", "noopener,noreferrer");
    });
  }
}

/**
 * Helper to generate consistent action link buttons across views.
 */
function createLinkButton(url, label, extraClass = "") {
  const cls = extraClass ? `btn-link ${extraClass}` : "btn-link";
  return `<a href="${url}" class="${cls}" target="_blank" rel="noopener">${label}</a>`;
}

/**
 * Light Markdown Parser
 * Supports:
 * - Bold: **text**
 * - Italics: *text* or _text_
 * - Links: [Label](https://url)
 * - Bullet lists: Lines starting with "- " or "* "
 * - Newlines: Double line breaks convert to paragraphs
 */
function parseMarkdown(text) {
  if (!text) return "";

  // 1. Basic HTML Escaping for security
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Bold: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // 3. Italics: *text* or _text_
  html = html.replace(/[\*_](.*?)([\*_])/g, "<em>$1</em>");

  // 4. Links: [Label](url)
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // 5. Convert Bullet Lists (lines starting with "- " or "* ")
  const lines = html.split("\n");
  let inList = false;
  let formattedLines = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!inList) {
        inList = true;
        formattedLines.push("<ul>");
      }
      formattedLines.push(`<li>${trimmed.substring(2)}</li>`);
    } else {
      if (inList) {
        inList = false;
        formattedLines.push("</ul>");
      }
      formattedLines.push(line);
    }
  });

  if (inList) {
    formattedLines.push("</ul>");
  }

  // 6. Paragraphs
  return formattedLines
    .join("\n")
    .replace(/\n\n+/g, "</p><p>");
}

/**
 * Global Poster / Image Lightbox Modal Handler
 */
function setupLightbox() {
  if (document.getElementById("poster-lightbox")) return;

  const modal = document.createElement("div");
  modal.id = "poster-lightbox";
  modal.className = "lightbox-modal";
  modal.innerHTML = `
    <div class="lightbox-overlay"></div>
    <div class="lightbox-content">
      <button class="lightbox-close" aria-label="Close modal">&times;</button>
      <img id="lightbox-img" src="" alt="Zoomed view" />
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector(".lightbox-overlay").addEventListener("click", closeLightbox);
  modal.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });

  // Delegated click event for zoomable media
  document.addEventListener("click", (e) => {
    const target = e.target.closest(".zoomable");
    if (target) {
      const zoomSrc = target.getAttribute("data-zoom-src") || target.getAttribute("src");
      if (zoomSrc) {
        openLightbox(zoomSrc);
      }
    }
  });
}

function openLightbox(src) {
  setupLightbox();
  const modal = document.getElementById("poster-lightbox");
  const img = document.getElementById("lightbox-img");
  if (modal && img) {
    img.src = src;
    modal.classList.add("active");
    document.body.style.overflow = "hidden"; // Lock background scroll
  }
}

function closeLightbox() {
  const modal = document.getElementById("poster-lightbox");
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = ""; // Restore background scroll
  }
}
