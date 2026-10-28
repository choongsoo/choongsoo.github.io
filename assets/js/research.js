// Number of publications displayed per page (adjust as needed)
const ITEMS_PER_PAGE = 6;
let currentPage = 1;
let currentPubs = [];

document.addEventListener("DOMContentLoaded", async () => {
  const data = await loadSiteData("nav-research");
  if (!data || !data.research) return;

  setupResearchPage(data.research);
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
  researchData.categories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "tab-btn";
    btn.dataset.cat = cat.id;
    btn.innerText = cat.name;
    tabsContainer.appendChild(btn);
  });

  function displayCurrentPage(options = { scroll: false }) {
    const totalItems = currentPubs.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    if (currentPage > totalPages && totalPages > 0) {
      currentPage = 1;
    }

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const pagePubs = currentPubs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    pubList.innerHTML = pagePubs
      .map(
        (p) => `
      <div class="item-card">
        <div class="item-title">${p.title}</div>
        <div class="meta">${p.authors} — <em>${p.venue}</em> (${p.year})</div>
        <div style="margin-top: 0.4rem;">
          ${
            p.link
              ? `<a href="${p.link}" target="_blank" rel="noopener" style="color: var(--accent); text-decoration: none; font-size: 0.85rem; margin-right: 1rem;">[Learn More]</a>`
              : ""
          }
          ${
            p.pdf
              ? `<a href="${p.pdf}" target="_blank" rel="noopener" style="color: var(--accent); text-decoration: none; font-size: 0.85rem;">[Paper/Poster]</a>`
              : ""
          }
        </div>
      </div>
    `
      )
      .join("");

    renderPagination(["research-pagination"], {
      currentPage,
      totalItems,
      itemsPerPage: ITEMS_PER_PAGE,
      onPageChange: (newPage) => {
        currentPage = newPage;
        displayCurrentPage({ scroll: true });
      }
    });

    if (options.scroll) {
      scrollToTarget("publications-list");
    }
  }

  function updateView(selectedCat) {
    if (selectedCat === "all") {
      overviewContainer.innerHTML = `
        <div class="category-overview">
          <p class="category-description">Showing all peer-reviewed publications and scholarly work across research categories.</p>
        </div>
      `;
    } else {
      const cat = researchData.categories.find((c) => c.id === selectedCat);
      if (cat) {
        const hasPhotos = cat.photos && cat.photos.length > 0;
        overviewContainer.innerHTML = `
          <div class="category-overview">
            <p class="category-description">${parseMarkdown(cat.description)}</p>
            ${
              hasPhotos
                ? `
              <div class="research-gallery">
                ${cat.photos
                  .map(
                    (p) =>
                      `<img src="${p}" data-zoom-src="${p}" class="zoomable" alt="${cat.name} photo">`
                  )
                  .join("")}
              </div>
            `
                : ""
            }
          </div>
        `;
      }
    }

    currentPubs =
      selectedCat === "all"
        ? sortedPublications
        : sortedPublications.filter((p) => p.category === selectedCat);

    currentPage = 1; // Reset to page 1 on category tab switch
    displayCurrentPage({ scroll: false });
  }

  tabsContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("tab-btn")) {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      updateView(e.target.dataset.cat);
    }
  });

  updateView("all");
}
