document.addEventListener("DOMContentLoaded", async () => {
  const data = await loadSiteData("nav-research");
  if (!data) return;

  setupResearchPage(data.research);
  setupPosterLightbox();
});

function setupResearchPage(researchData) {
  const tabsContainer = document.getElementById("research-tabs");
  const overviewContainer = document.getElementById("research-overview-box");
  const pubList = document.getElementById("publications-list");

  // Sort publications in reverse chronological order (newest first)
  const sortedPublications = [...researchData.publications].sort((a, b) => {
    const yearA = parseInt(a.year, 10) || 0;
    const yearB = parseInt(b.year, 10) || 0;

    if (yearB !== yearA) {
      return yearB - yearA; // Higher years first
    }

    // Secondary tie-breaker: Alphabetical by title
    return (a.title || "").localeCompare(b.title || "");
  });

  // Dynamically generate category tabs
  researchData.categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "tab-btn";
    btn.dataset.cat = cat.id;
    btn.innerText = cat.name;
    tabsContainer.appendChild(btn);
  });

  function updateView(selectedCat) {
    if (selectedCat === "all") {
      overviewContainer.innerHTML = `
        <div class="category-overview">
          <p class="category-description">Showing all peer-reviewed publications and scholarly work across research categories.</p>
        </div>
      `;
    } else {
      const cat = researchData.categories.find(c => c.id === selectedCat);
      if (cat) {
        const hasPhotos = cat.photos && cat.photos.length > 0;
        overviewContainer.innerHTML = `
          <div class="category-overview">
            <p class="category-description">${parseMarkdown(cat.description)}</p>
            ${hasPhotos ? `
              <div class="research-gallery">
                ${cat.photos.map(p => `<img src="${p}" data-zoom-src="${p}" class="zoomable" alt="${cat.name} photo">`).join("")}
              </div>
            ` : ''}
          </div>
        `;
      }
    }

    let pubs = sortedPublications;
    if (selectedCat !== "all") {
      pubs = pubs.filter(p => p.category === selectedCat);
    }

    pubList.innerHTML = pubs.map(p => `
      <div class="item-card">
        <div class="item-title">${p.title}</div>
        <div class="meta">${p.authors} — <em>${p.venue}</em> (${p.year})</div>
        <div style="margin-top: 0.4rem;">
          ${p.link ? `<a href="${p.link}" target="_blank" style="color: var(--accent); text-decoration: none; font-size: 0.85rem; margin-right: 1rem;">[Learn More]</a>` : ''}
          ${p.pdf ? `<a href="${p.pdf}" target="_blank" style="color: var(--accent); text-decoration: none; font-size: 0.85rem;">[Paper/Poster]</a>` : ''}
        </div>
      </div>
    `).join("");
  }

  tabsContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("tab-btn")) {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      updateView(e.target.dataset.cat);
    }
  });

  updateView("all");
}


/**
 * Global Poster Lightbox Modal Handler
 */
function setupPosterLightbox() {
  // Create Modal elements dynamically if they don't exist
  if (!document.getElementById("poster-lightbox")) {
    const modal = document.createElement("div");
    modal.id = "poster-lightbox";
    modal.className = "lightbox-modal";
    modal.innerHTML = `
      <div class="lightbox-overlay"></div>
      <div class="lightbox-content">
        <button class="lightbox-close" aria-label="Close modal">&times;</button>
        <img id="lightbox-img" src="" alt="Zoomed Poster Presentation" />
      </div>
    `;
    document.body.appendChild(modal);

    // Event listeners to close
    modal.querySelector(".lightbox-overlay").addEventListener("click", closeLightbox);
    modal.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeLightbox();
    });
  }

  // Delegated click event for zoomable posters
  document.addEventListener("click", (e) => {
    if (e.target && e.target.classList.contains("zoomable")) {
      const zoomSrc = e.target.getAttribute("data-zoom-src");
      if (zoomSrc) {
        openLightbox(zoomSrc);
      }
    }
  });
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