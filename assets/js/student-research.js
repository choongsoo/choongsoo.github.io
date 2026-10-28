document.addEventListener("DOMContentLoaded", async () => {
  const data = await loadSiteData("nav-student-research");

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
      const matchesTag =
        selectedTag === "all" ||
        (Array.isArray(p.tags) && p.tags.includes(selectedTag));
      const matchesSearch =
        !activeSearch ||
        p.title.toLowerCase().includes(activeSearch) ||
        p.abstract.toLowerCase().includes(activeSearch) ||
        (Array.isArray(p.students) &&
          p.students.some((s) => s.toLowerCase().includes(activeSearch))) ||
        (Array.isArray(p.tags) &&
          p.tags.some((t) => t.toLowerCase().includes(activeSearch)));

      return matchesType && matchesTag && matchesSearch;
    });

    // Sort Logic
    filtered.sort((a, b) => {
      if (selectedSort === "year-desc") {
        if (b.year !== a.year) return b.year - a.year;
        return getTermWeight(a.type) - getTermWeight(b.type);
      }

      if (selectedSort === "year-asc") {
        if (a.year !== b.year) return a.year - b.year;
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
      const studentList = Array.isArray(p.students)
        ? p.students.join(", ")
        : p.students;
      const tags = Array.isArray(p.tags)
        ? p.tags.map((t) => `<span class="tag">${t}</span>`).join(" ")
        : "";

      // Parse Media Items
      const imgs = p.images || {};
      const mediaItems = [];

      // Support either imgs.profiles (array) or imgs.profile (single or array)
      const rawProfiles = imgs.profiles || imgs.profile;
      if (rawProfiles) {
        const profileArray = Array.isArray(rawProfiles)
          ? rawProfiles
          : [rawProfiles];

        profileArray.forEach((prof) => {
          if (prof && prof.url) {
            mediaItems.push(`
              <div class="media-thumb-wrapper profile-wrapper">
                <img src="${prof.url}" alt="${prof.alt}" class="media-thumb profile-thumb" loading="lazy" />
                <span class="media-label">${prof.alt}</span>
              </div>
            `);
          }
        });
      }

      if (imgs.poster && imgs.poster.url) {
        const isPdf = imgs.poster.url.toLowerCase().endsWith(".pdf");
        if (isPdf) {
          mediaItems.push(
            createLinkButton(imgs.poster.url, "Poster (PDF)", "btn-poster-pdf")
          );
        } else {
          mediaItems.push(`
            <div class="media-thumb-wrapper">
              <img src="${imgs.poster.url}" alt="${
            imgs.poster.alt || "Poster Presentation"
          }" class="media-thumb poster-thumb zoomable" data-zoom-src="${
            imgs.poster.url
          }" loading="lazy" />
              <span class="media-label">Poster 🔍</span>
            </div>
          `);
        }
      }

      if (imgs.presentation && imgs.presentation.url) {
        mediaItems.push(`
          <div class="media-thumb-wrapper">
            <img src="${imgs.presentation.url}" alt="${
          imgs.presentation.alt || "Presentation Photo"
        }" class="media-thumb presentation-thumb zoomable" data-zoom-src="${
          imgs.presentation.url
        }" loading="lazy" />
            <span class="media-label">Presentation 🔍</span>
          </div>
        `);
      }

      if (p.paper_url) {
        mediaItems.push(createLinkButton(p.paper_url, "Learn More"));
      }

      if (p.code_url) {
        mediaItems.push(createLinkButton(p.code_url, "View Code"));
      }

      const hasMedia = mediaItems.length > 0;

      return `
        <article class="project-card ${hasMedia ? "has-media" : ""}">
          <div class="project-content">
            <div class="project-header">
              <span class="type-badge ${p.type.toLowerCase()}">${p.type} (${
        p.year
      })</span>
              <h3 class="item-title">${p.title}</h3>
            </div>
            <div class="project-students"><strong>Student(s):</strong> ${studentList}</div>
            <div class="project-abstract">${parseMarkdown(p.abstract)}</div>
            ${tags ? `<div class="project-tags">${tags}</div>` : ""}
          </div>
          ${
            hasMedia
              ? `<div class="project-media-gallery">${mediaItems.join("")}</div>`
              : ""
          }
        </article>
      `;
    })
    .join("");
}
