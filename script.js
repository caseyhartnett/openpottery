const currentPath = window.location.pathname.split("/").pop() || "index.html";

document.querySelectorAll(".nav a").forEach((link) => {
  const href = link.getAttribute("href");
  if (href === currentPath) {
    link.setAttribute("aria-current", "page");
  }
});

document.querySelectorAll("#year").forEach((node) => {
  node.textContent = new Date().getFullYear().toString();
});

document.querySelectorAll("[data-filter-root]").forEach((root) => {
  const input = root.querySelector("[data-filter-input]");
  const emptyState = root.querySelector("[data-filter-empty]");
  if (!input) return;

  const normalize = (value) => value.toLowerCase().trim();
  const groups = Array.from(root.querySelectorAll("[data-filter-group]"));
  const hasGroups = groups.length > 0;

  const updateFilter = () => {
    const query = normalize(input.value);
    let visibleCount = 0;

    if (hasGroups) {
      groups.forEach((group) => {
        let groupVisible = 0;
        group.querySelectorAll("[data-filter-item]").forEach((item) => {
          const matches = !query || normalize(item.textContent).includes(query);
          item.hidden = !matches;
          item.style.display = matches ? "" : "none";
          if (matches) {
            groupVisible += 1;
            visibleCount += 1;
          }
        });
        group.hidden = groupVisible === 0;
        group.style.display = groupVisible === 0 ? "none" : "";
      });
    } else {
      root.querySelectorAll("[data-filter-item]").forEach((item) => {
        const matches = !query || normalize(item.textContent).includes(query);
        item.hidden = !matches;
        item.style.display = matches ? "" : "none";
        if (matches) visibleCount += 1;
      });
    }

    if (emptyState) {
      emptyState.hidden = visibleCount !== 0;
    }
  };

  input.addEventListener("input", updateFilter);
  updateFilter();
});

(function () {
  const repoGrid = document.querySelector("#video-repo-grid");
  if (!repoGrid) return;

  const repoMeta = document.querySelector("#video-repo-meta");

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const toCard = (row) => {
    const creator = escapeHtml(row.creator);
    const title = escapeHtml(row.video_title);
    const channel = escapeHtml(row.channel_title);
    const views = escapeHtml(row.views || "");
    const published = escapeHtml(row.published || "");
    const length = escapeHtml(row.length || "");
    const videoUrl = escapeHtml(row.video_url);
    const channelUrl = escapeHtml(row.channel_url);
    const thumb = escapeHtml(row.thumbnail);
    const metaParts = [channel, views, published, length].filter(Boolean);

    return `
      <article class="video-card" data-filter-item>
        <a class="video-thumb-link" href="${videoUrl}" target="_blank" rel="noopener noreferrer">
          <img class="video-thumb" src="${thumb}" alt="${title} thumbnail" loading="lazy">
        </a>
        <div class="video-content">
          <span class="video-tag">${creator}</span>
          <h3>${title}</h3>
          <span class="video-meta">${metaParts.join(" • ")}</span>
          <p>Channel: <a href="${channelUrl}" target="_blank" rel="noopener noreferrer">${channel}</a></p>
          <a href="${videoUrl}" target="_blank" rel="noopener noreferrer" class="card-link">Watch on YouTube</a>
        </div>
      </article>
    `;
  };

  const refreshFilter = () => {
    const root = repoGrid.closest("[data-filter-root]");
    if (!root) return;
    const input = root.querySelector("[data-filter-input]");
    if (!input) return;
    input.dispatchEvent(new Event("input"));
  };

  fetch("/data/video-repository.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to load video repository (${response.status})`);
      return response.json();
    })
    .then((payload) => {
      const videos = Array.isArray(payload.videos) ? payload.videos : [];
      repoGrid.innerHTML = videos.map(toCard).join("");

      if (repoMeta) {
        const generatedAt = payload.generated_at ? `Generated ${payload.generated_at}. ` : "";
        repoMeta.textContent = `${generatedAt}${videos.length} videos loaded from creator channels.`;
      }

      refreshFilter();
    })
    .catch((error) => {
      console.error("Video repository load error:", error);
      if (repoMeta) {
        repoMeta.textContent = `Repository video data could not be loaded right now: ${error.message}`;
      }
    });
})();
