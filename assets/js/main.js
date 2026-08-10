// Global data store accessible across scripts
let siteData = null;

async function loadHeader(activePageId) {
  try {
    const res = await fetch("header.html");
    const headerHtml = await res.text();
    const headerEl = document.getElementById("site-header");
    if (headerEl) {
      headerEl.innerHTML = headerHtml;

      // Set active link class based on current page
      if (activePageId) {
        const activeLink = document.getElementById(activePageId);
        if (activeLink) activeLink.classList.add("active");
      }
    }
  } catch (err) {
    console.error("Failed to load header component:", err);
  }
}

async function loadFooter() {
  try {
    const res = await fetch("footer.html");
    const footerHtml = await res.text();
    const footerEl = document.getElementById("site-footer");
    if (footerEl) {
      footerEl.innerHTML = footerHtml;
      
      // Dynamic current year setting
      const yearEl = document.getElementById("copyright-year");
      if (yearEl) {
        yearEl.innerText = new Date().getFullYear();
      }
    }
  } catch (err) {
    console.error("Failed to load footer component:", err);
  }
}

// Update loadSiteData to load both Header and Footer
async function loadSiteData(activeNavId) {
  await loadHeader(activeNavId);
  await loadFooter();
  
  try {
    const res = await fetch("assets/data.json");
    siteData = await res.json();
    
    // Update header name dynamically if present in data.json
    const headerNameEl = document.getElementById("header-name");
    if (headerNameEl && siteData.profile && siteData.profile.name) {
      headerNameEl.innerText = siteData.profile.name;
    }

    setupAntiBotContacts(siteData.profile.contact);
    return siteData;
  } catch (err) {
    console.error("Error loading site data:", err);
  }
}

// Anti-bot link protection
function setupAntiBotContacts(contact) {
  const emailBtn = document.getElementById("email-btn");
  const apptBtn = document.getElementById("appt-btn");

  if (emailBtn) {
    emailBtn.addEventListener("click", () => {
      // Reconstruct email dynamically on user action
      const addr = `${contact.email_user}@${contact.email_domain}`;
      window.location.href = `mailto:${addr}`;
    });
  }

  if (apptBtn) {
    apptBtn.addEventListener("click", () => {
      // Decode base64 URL on user action
      const url = atob(contact.appointment_url_b64);
      window.open(url, "_blank", "noopener,noreferrer");
    });
  }
}

/**
 * Light Markdown Parser
 * Supports:
 * - Bold: **text**
 * - Italics: *text* or _text_
 * - Links: [Label](https://url)
 * - Bullet lists: Lines starting with "- " or "* "
 * - Newlines: Double line breaks convert to paragraphs, single to <br>
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

  // 6. Paragraphs and Line Breaks
  return formattedLines
    .join("\n")
    .replace(/\n\n+/g, "</p><p>");
//    .replace(/\n/g, "<br>");
}

function openLightbox(src) {
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
