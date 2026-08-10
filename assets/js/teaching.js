document.addEventListener("DOMContentLoaded", async () => {
  const data = await loadSiteData("nav-teaching");
  if (!data || !data.teaching) return;

  renderTeachingIntro(data.teaching.intro);
  renderCourses(data.teaching);
});

function renderTeachingIntro(introText) {
  const introEl = document.getElementById("teaching-intro");
  if (introEl && introText) {
    introEl.innerHTML = parseMarkdown(introText);
  }
}

/**
 * Computes current term state based on date:
 * - Fall: Mid-August (Aug 15) to End of December (Dec 31)
 * - Spring: Beginning of January (Jan 1) to Late May (May 31)
 * - Summer: June 1 to August 14 -> Displays preceding Spring semester
 */
function getSemesterState() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0 = Jan, 7 = Aug, 11 = Dec
  const day = now.getDate();

  // Fall Semester: Aug 15 – Dec 31
  if ((month === 7 && day >= 15) || month >= 8) {
    return {
      termLabel: `Fall ${year}`,
      targetTermKey: `Fall ${year}`
    };
  }

  // Spring Semester: Jan 1 – May 31
  if (month >= 0 && month <= 4) {
    return {
      termLabel: `Spring ${year}`,
      targetTermKey: `Spring ${year}`
    };
  }

  // Summer Intersession (June 1 – August 14): Show preceding Spring semester
  return {
    termLabel: `Spring ${year} (Most Recent)`,
    targetTermKey: `Spring ${year}`
  };
}

function renderCourses(teachingData) {
  const { courses } = teachingData;
  const termState = getSemesterState();

  const currentHeading = document.getElementById("current-term-heading");
  const currentContainer = document.getElementById("current-courses-list");
  const allContainer = document.getElementById("all-courses-list");

  if (currentHeading) {
    currentHeading.innerText = `Current Term: ${termState.termLabel}`;
  }

  // Pure array check against terms_taught
  const currentCourses = courses.filter(c => 
    Array.isArray(c.terms_taught) && c.terms_taught.includes(termState.targetTermKey)
  );

  // Render Current/Recent Semester Block or Sabbatical Banner
  if (currentCourses.length > 0) {
    currentContainer.innerHTML = currentCourses.map(c => `
      <div class="current-course-card">
        <div class="item-title">${c.code}: ${c.title}</div>
        <p style="margin-top: 0.4rem; font-size: 0.95rem;">${c.description}</p>
      </div>
    `).join("");
  } else {
    // Show Sabbatical Notice
    currentContainer.innerHTML = `
      <div class="sabbatical-card">
        <div class="sabbatical-title">On Sabbatical / Leave</div>
        <p>There are no scheduled courses for ${termState.termLabel}. I am currently on sabbatical focusing on research activities.</p>
      </div>
    `;
  }

  // Render All Courses List (Clean title and description only)
  if (allContainer) {
    allContainer.innerHTML = courses.map(c => `
      <div class="item-card">
        <div class="item-title">${c.code}: ${c.title}</div>
        <p style="margin-top: 0.4rem;">${c.description}</p>
      </div>
    `).join("");
  }
}