const el = (id) => document.getElementById(id);
const interactivePage = 9;
const conclusionsPage = 20;
const alpha = el("alpha");
const stage = el("stage");
const image = el("slide-image");
const menu = el("slide-menu");
const pageLinks = [el("previous"), el("next")];
const transcript = el("transcript");
const transcriptText = el("transcript-text");

let slides = [];
let current = 1;

function updateExample() {
  // Work in thousandths so the slider hits the CHSH boundary exactly.
  const a = Math.round(Number(alpha.value) * 1000);
  const b = 500 - a;
  const score = 8 * (a - b);
  const exceeds = score > 2000;
  const aText = (a / 1000).toFixed(3);
  const bText = (b / 1000).toFixed(3);
  el("alpha-value").value = aText;
  el("beta-value").value = bText;
  el("score-value").value = (score / 1000).toFixed(2);
  for (const cell of document.querySelectorAll("[data-weight]")) {
    cell.textContent = (cell.dataset.weight === "alpha" ? aText : bText).slice(1);
  }
  const fill = el("score-fill");
  fill.style.width = `${score / 40}%`;
  fill.dataset.violates = exceeds;
  const verdict = el("verdict");
  verdict.dataset.violates = exceeds;
  const description = exceeds ? "Exceeds the separable bound" :
    score === 2000 ? "At the separable bound" : "Within the separable bound";
  if (verdict.textContent !== description) verdict.textContent = description;
}
alpha.addEventListener("input", updateExample);
updateExample();

function setTranscript(slide) {
  transcriptText.replaceChildren();
  if (slide.htmlTranscript) {
    // These fragments are produced from the public TeX deck at build time.
    const template = document.createElement("template");
    template.innerHTML = slide.htmlTranscript;
    for (const link of template.content.querySelectorAll('a[href="#thought-experiment-diamond"]')) {
      link.href = "#slide-24";
    }
    transcriptText.append(template.content);
  } else {
    const text = document.createElement("pre");
    text.textContent = slide.transcript;
    transcriptText.append(text);
  }
}

function setPageLink(link, page) {
  const inRange = page >= 1 && page <= slides.length;
  link.href = `#slide-${inRange ? page : current}`;
  link.setAttribute("aria-disabled", String(!inRange));
  link.tabIndex = inRange ? 0 : -1;
}

function render() {
  if (!slides.length) return;
  const requested = Number(location.hash.match(/^#slide-(\d+)$/)?.[1] || 1);
  current = Math.max(1, Math.min(slides.length, requested));
  const slide = slides[current - 1];
  const interactive = current === interactivePage;
  stage.setAttribute("aria-label", `Slide ${current}: ${slide.title}`);
  el("load-message").hidden = true;
  el("chsh-slide").hidden = !interactive;
  image.hidden = interactive;
  if (!interactive) {
    image.src = slide.file;
    image.alt = slide.title;
    setTranscript(slide);
  }
  transcript.hidden = interactive;
  transcript.open = false;
  el("appendix-link").hidden = current !== conclusionsPage;
  el("progress").max = slides.length;
  el("progress").value = current;
  el("slide-count").value = `${current} / ${slides.length}`;
  setPageLink(pageLinks[0], current - 1);
  setPageLink(pageLinks[1], current + 1);
  for (const link of el("slide-list").querySelectorAll("a")) {
    if (link.hash === `#slide-${current}`) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
}

function go(page) {
  if (page >= 1 && page <= slides.length && page !== current) {
    location.hash = `slide-${page}`;
  }
}

function showOverview() {
  if (!slides.length || menu.open) return;
  menu.showModal();
  menu.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest" });
}

async function toggleFullScreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    // Keep the presentation usable if the browser restricts fullscreen.
  }
}

el("overview").addEventListener("click", showOverview);
el("slide-list").addEventListener("click", (event) => {
  if (event.target.closest("a")) menu.close();
});
const fullscreen = el("fullscreen");
fullscreen.hidden = !document.fullscreenEnabled;
fullscreen.addEventListener("click", toggleFullScreen);
document.addEventListener("fullscreenchange", () => {
  fullscreen.setAttribute("aria-pressed", String(Boolean(document.fullscreenElement)));
});
window.addEventListener("hashchange", render);
document.addEventListener("keydown", (event) => {
  if (menu.open || event.defaultPrevented || event.altKey || event.ctrlKey ||
      event.metaKey || event.target.closest("input, textarea, select, button, summary, [contenteditable]")) return;
  const shortcuts = {
    ArrowLeft: () => go(current - 1),
    ArrowRight: () => go(current + 1),
    PageUp: () => go(current - 1),
    PageDown: () => go(current + 1),
    Home: () => go(1),
    End: () => go(slides.length),
    o: showOverview,
    f: () => { if (!fullscreen.hidden) void toggleFullScreen(); },
  };
  const action = shortcuts[event.key] || shortcuts[event.key.toLowerCase()];
  if (typeof action === "function") {
    event.preventDefault();
    action();
  }
});

let touchStart;
stage.addEventListener("touchstart", (event) => {
  touchStart = event.target.closest("input, a, button") ? null : event.changedTouches[0];
}, { passive: true });
stage.addEventListener("touchend", (event) => {
  if (!touchStart) return;
  const end = event.changedTouches[0];
  const dx = end.clientX - touchStart.clientX;
  const dy = end.clientY - touchStart.clientY;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(current + (dx < 0 ? 1 : -1));
  touchStart = null;
}, { passive: true });

try {
  const response = await fetch("./manifest.json");
  if (!response.ok) throw new Error("Slide manifest unavailable");
  slides = await response.json();
  for (const slide of slides) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = `#slide-${slide.number}`;
    link.textContent = slide.number === interactivePage ? `${slide.title} (interactive)` : slide.title;
    item.append(link);
    el("slide-list").append(item);
  }
  render();
} catch {
  const link = document.createElement("a");
  link.href = "./caltech-seminar.pdf";
  link.textContent = "Open the PDF";
  el("load-message").replaceChildren("The HTML slides could not load. ", link);
}
