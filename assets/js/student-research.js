document.addEventListener("DOMContentLoaded", async () => {
  const data = await loadSiteData();

  if (!data || !data.student_research) {
    console.error("Student research data missing from data.json");
    return;
  }

  const { intro, projects } = data.student_research;

  const introEl = document.getElementById("research-intro");
  if (introEl && intro) {
    introEl.innerHTML = parseMarkdown(intro);
  }

  const searchInput = document.getElementById("research-search");
  const typeSelect = document.getElementById("research-type-filter");
  const tagSelect = document.getElementById("research-tag-filter");
  const sortSelect = document.getElementById("research-sort");

  populateTagFilter(projects || [], tagSelect);
  setupPosterLightbox();

  // Term chronological order: SYE finishes in May (Spring), Summer runs June–August
  function getTermWeight(type) {
    if (!type) return 0;
    const t = type.toLowerCase();
    if (t === "sye") return 2;
    if (t === "summer") return 1;
    return 3;
  }

  function filterSortAndRender() {
    const rawSearch = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const activeSearch = rawSearch.length >= 3 ? rawSearch : "";

    const selectedType = typeSelect ? typeSelect.value : "all";
    const selectedTag = tagSelect ? tagSelect.value : "all";
    const selectedSort = sortSelect ? sortSelect.value : "year-desc";

    let filtered = (projects || []).filter((p) => {
      const matchesType = selectedType === "all" || p.type === selectedType;
      const matchesTag = selectedTag === "all" || (Array.isArray(p.tags) && p.tags.includes(selectedTag));
      const matchesSearch =
        !activeSearch ||
        p.title.toLowerCase().includes(activeSearch) ||
        p.abstract.toLowerCase().includes(activeSearch) ||
        (Array.isArray(p.students) && p.students.some((s) => s.toLowerCase().includes(activeSearch))) ||
        (Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(activeSearch)));

      return matchesType && matchesTag && matchesSearch;
    });

    // Sort Logic
    filtered.sort((a, b) => {
      if (selectedSort === "year-desc") {
        // Primary: Year descending (2026 -> 2025)
        if (b.year !== a.year) return b.year - a.year;
        // Secondary: Term chronological ascending within same year (SYE -> Summer)
        return getTermWeight(a.type) - getTermWeight(b.type);
      }

      if (selectedSort === "year-asc") {
        // Primary: Year ascending (2025 -> 2026)
        if (a.year !== b.year) return a.year - b.year;
        // Secondary: Term chronological ascending within same year (SYE -> Summer)
        return getTermWeight(a.type) - getTermWeight(b.type);
      }

      if (selectedSort === "student-asc") {
        const lastA = getLastName(a.students);
        const lastB = getLastName(b.students);
        return lastA.localeCompare(lastB);
      }

      return 0;
    });

    renderProjects(filtered);
  }


  if (searchInput) searchInput.addEventListener("input", filterSortAndRender);
  if (typeSelect) typeSelect.addEventListener("change", filterSortAndRender);
  if (tagSelect) tagSelect.addEventListener("change", filterSortAndRender);
  if (sortSelect) sortSelect.addEventListener("change", filterSortAndRender);

  filterSortAndRender();
});

function getLastName(students) {
  if (!students) return "";
  const primary = Array.isArray(students) ? students[0] : students;
  const parts = primary.trim().split(" ");
  return parts[parts.length - 1].toLowerCase();
}

function populateTagFilter(projects, tagSelectEl) {
  if (!tagSelectEl) return;

  const tagSet = new Set();
  projects.forEach((p) => {
    if (Array.isArray(p.tags)) p.tags.forEach((t) => tagSet.add(t));
  });

  const sortedTags = Array.from(tagSet).sort((a, b) => a.localeCompare(b));

  tagSelectEl.innerHTML = `
    <option value="all">All Tags</option>
    ${sortedTags.map((tag) => `<option value="${tag}">${tag}</option>`).join("")}
  `;
}

function renderProjects(projects) {
  const container = document.getElementById("student-research-list");
  if (!container) return;

  if (projects.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <p>No student research projects match your criteria.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = projects
    .map((p) => {
      const studentList = Array.isArray(p.students) ? p.students.join(", ") : p.students;
      const tags = Array.isArray(p.tags)
        ? p.tags.map((t) => `<span class="tag">${t}</span>`).join(" ")
        : "";

      const paperBtn = p.paper_url
        ? `<a href="${p.paper_url}" class="btn-link" target="_blank" rel="noopener">Learn More</a>`
        : "";
      const codeBtn = p.code_url
        ? `<a href="${p.code_url}" class="btn-link" target="_blank" rel="noopener">View Code</a>`
        : "";

      // Parse Media Items
      const imgs = p.images || {};
      let mediaItems = [];
      let pdfPosterBtn = "";

      // Support either imgs.profiles (array) or imgs.profile (single or array)
      const rawProfiles = imgs.profiles || imgs.profile;
      if (rawProfiles) {
        const profileArray = Array.isArray(rawProfiles) ? rawProfiles : [rawProfiles];
        
        profileArray.forEach((prof) => {
          if (prof && prof.url) {
            let profileItem = `
              <div class="media-thumb-wrapper profile-wrapper">
                <img src="${prof.url}" alt="${prof.alt}" class="media-thumb profile-thumb" loading="lazy" />
                <span class="media-label">${prof.alt}</span>
              </div>
            `;
            mediaItems.push(profileItem);
          }
        });
      }

      if (imgs.poster && imgs.poster.url) {
        const isPdf = imgs.poster.url.toLowerCase().endsWith(".pdf");

        if (isPdf) {
          // Render as a button alongside Paper/Code
          pdfPosterBtn = `<a href="${imgs.poster.url}" class="btn-link" target="_blank" rel="noopener">Poster (PDF)</a>`;
          mediaItems.push(pdfPosterBtn);
        } else {
          // Render as a zoomable image thumbnail
          mediaItems.push(`
            <div class="media-thumb-wrapper">
              <img src="${imgs.poster.url}" alt="${imgs.poster.alt || 'Poster Presentation'}" class="media-thumb poster-thumb zoomable" data-zoom-src="${imgs.poster.url}" loading="lazy" />
              <span class="media-label">Poster 🔍</span>
            </div>
          `);
        }
      }

      if (imgs.presentation && imgs.presentation.url) {
        mediaItems.push(`
          <div class="media-thumb-wrapper">
            <img src="${imgs.presentation.url}" alt="${imgs.presentation.alt || 'Presentation Photo'}" class="media-thumb presentation-thumb zoomable" data-zoom-src="${imgs.presentation.url}" loading="lazy" />
            <span class="media-label">Presentation 🔍</span>
          </div>
        `);
      }

      if (p.paper_url) {
        mediaItems.push(`<a href="${p.paper_url}" class="btn-link" target="_blank" rel="noopener">Learn More</a>`);
      }

      if (p.code_url) {
        mediaItems.push(`<a href="${p.code_url}" class="btn-link" target="_blank" rel="noopener">View Code</a>`);
      }

      const hasMedia = mediaItems.length > 0;

      return `
        <article class="project-card ${hasMedia ? 'has-media' : ''}">
          <div class="project-content">
            <div class="project-header">
              <span class="type-badge ${p.type.toLowerCase()}">${p.type} (${p.year})</span>
              <h3 class="item-title">${p.title}</h3>
            </div>
            <div class="project-students"><strong>Student(s):</strong> ${studentList}</div>
            <p class="project-abstract">${parseMarkdown(p.abstract)}</p>
            ${tags ? `<div class="project-tags">${tags}</div>` : ""}
          </div>
          ${hasMedia ? `<div class="project-media-gallery">${mediaItems.join('')}</div>` : ""}
        </article>
      `;
    })
    .join("");
    //            ${allActionButtons ? `<div class="project-links">${allActionButtons}</div>` : ""}

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
