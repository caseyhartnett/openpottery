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
