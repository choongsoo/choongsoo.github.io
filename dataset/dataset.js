const GA_DATASET_ID = "G-HG7TY74ZK9";

/**
 * Initializes Google Analytics for dataset tools.
 */
function initDatasetAnalytics(id = GA_DATASET_ID) {
  if (!id || window.__ga_dataset_initialized) return;
  window.__ga_dataset_initialized = true;

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

// Automatically initialize dataset analytics
initDatasetAnalytics();

/**
 * Reusable CSV file download helper.
 */
function downloadCsv(csvData, filename) {
  const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

