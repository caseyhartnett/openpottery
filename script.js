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
          if (matches) {
            groupVisible += 1;
            visibleCount += 1;
          }
        });
        group.hidden = groupVisible === 0;
      });
    } else {
      root.querySelectorAll("[data-filter-item]").forEach((item) => {
        const matches = !query || normalize(item.textContent).includes(query);
        item.hidden = !matches;
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
