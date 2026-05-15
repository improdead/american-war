/* === Essay panel (unchanged behaviour) === */
const essayPanel = document.getElementById("essayPanel");
const openEssayPanel = document.getElementById("openEssayPanel");
const closeEssayPanel = document.getElementById("closeEssayPanel");
const essayScrim = document.getElementById("essayScrim");

let essayOpen = false;
let essayReturnFocus = null;

function showEssay() {
  if (!essayPanel) return;
  essayReturnFocus = document.activeElement;
  essayPanel.classList.add("essay-panel--open");
  essayPanel.setAttribute("aria-hidden", "false");
  essayOpen = true;
  document.body.style.overflow = "hidden";
  if (closeEssayPanel) closeEssayPanel.focus();
}

function hideEssay() {
  if (!essayPanel || !essayOpen) return;
  essayPanel.classList.remove("essay-panel--open");
  essayPanel.setAttribute("aria-hidden", "true");
  essayOpen = false;
  document.body.style.overflow = "";
  if (essayReturnFocus && typeof essayReturnFocus.focus === "function") {
    essayReturnFocus.focus();
  }
}

if (openEssayPanel) {
  openEssayPanel.addEventListener("click", (event) => {
    event.stopPropagation();
    showEssay();
  });
}
if (closeEssayPanel) closeEssayPanel.addEventListener("click", hideEssay);
if (essayScrim) essayScrim.addEventListener("click", hideEssay);

/* === Book + realistic page flip === */
const book = document.getElementById("book");
const hint = document.getElementById("hintText");
const shell = document.getElementById("bookShell");
const scaler = document.getElementById("bookScaler");
const pageIndicator = document.getElementById("pageIndicator");
const spreads = Array.from(book.querySelectorAll(".spread"));
const frontCover = book.querySelector(".front-cover");
const backCover = book.querySelector(".back-cover");
const INTERACTIVE_ELEMENTS_SELECTOR =
  "a, audio, iframe, button, input, textarea, select, video";

/* Wrap spreads into a dedicated .page-area for a clean 3D context, and inject
   the gutter / page-edge decorations. */
const pageArea = document.createElement("div");
pageArea.className = "page-area";
if (spreads.length > 0) {
  book.insertBefore(pageArea, spreads[0]);
} else {
  book.appendChild(pageArea);
}
spreads.forEach((sp) => pageArea.appendChild(sp));

const gutter = document.createElement("div");
gutter.className = "book-gutter";
pageArea.appendChild(gutter);

const edgeTop = document.createElement("div");
edgeTop.className = "book-edge-top";
book.appendChild(edgeTop);
const edgeBottom = document.createElement("div");
edgeBottom.className = "book-edge-bottom";
book.appendChild(edgeBottom);

const playNarrationButton = document.getElementById("playNarration");
const stopNarrationButton = document.getElementById("stopNarration");
const zoomInBtn = document.getElementById("zoomIn");
const zoomOutBtn = document.getElementById("zoomOut");
const zoomResetBtn = document.getElementById("zoomReset");
const zoomLabel = document.getElementById("zoomLabel");

let isOpen = false;
// pos: 0..spreads.length where pos === spreads.length means showing the back cover
let pos = 0;
let zoom = 1;
let flipLock = false;

function setCurrent() {
  spreads.forEach((sp, i) => {
    sp.classList.toggle("is-current", i === pos);
    sp.classList.remove(
      "is-leaving-forward",
      "is-leaving-backward",
      "is-incoming-forward",
      "is-incoming-backward"
    );
  });
  if (backCover) {
    backCover.classList.remove("is-underlying");
    backCover.classList.toggle("is-current", pos === spreads.length);
  }
}

function updateHint() {
  if (!isOpen) {
    hint.textContent = "Click the cover to open";
    pageIndicator.textContent = "Cover · desk edition";
    return;
  }
  if (pos >= spreads.length) {
    hint.textContent = "Click the left side to close the book";
    pageIndicator.textContent = `Back cover · ${spreads.length} spreads read`;
    return;
  }
  hint.textContent = "Click the right page to turn forward · left to go back";
  pageIndicator.textContent = `Spread ${pos + 1} of ${spreads.length} (pages ${pos * 2 + 1}–${pos * 2 + 2})`;
}

function applyZoom() {
  zoom = Math.min(1.85, Math.max(0.65, Math.round(zoom * 100) / 100));
  scaler.style.transform = `scale(${zoom})`;
  zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
}

function openBook() {
  isOpen = true;
  book.classList.remove("closed");
  book.classList.add("open");
  if (frontCover) {
    frontCover.style.zIndex = "300";
    const lowerOnce = (event) => {
      if (event.propertyName !== "transform") return;
      if (!book.classList.contains("open")) return;
      frontCover.style.zIndex = "40";
      frontCover.removeEventListener("transitionend", lowerOnce);
    };
    frontCover.addEventListener("transitionend", lowerOnce);
  }
  pos = 0;
  setCurrent();
  updateHint();
}

function closeBook() {
  isOpen = false;
  pos = 0;
  flipLock = false;
  pageArea.querySelectorAll(".flip-leaf, .flip-shade").forEach((el) => el.remove());
  spreads.forEach((sp) => {
    sp.classList.remove(
      "is-current",
      "is-leaving-forward",
      "is-leaving-backward",
      "is-incoming-forward",
      "is-incoming-backward"
    );
  });
  if (backCover) {
    backCover.classList.remove("is-current", "is-underlying");
  }
  book.classList.remove("open");
  book.classList.add("closed");
  if (frontCover) frontCover.style.zIndex = "";
  updateHint();
}

/* Builds a single flip leaf. direction: "forward" or "backward". */
function buildLeaf(direction) {
  const leaf = document.createElement("div");
  leaf.className = `flip-leaf flip-leaf--${direction}`;

  const front = document.createElement("div");
  front.className = "leaf-face leaf-face--front";
  const frontShadow = document.createElement("div");
  frontShadow.className = "leaf-shadow";
  front.appendChild(frontShadow);

  const back = document.createElement("div");
  back.className = "leaf-face leaf-face--back";
  const backShadow = document.createElement("div");
  backShadow.className = "leaf-shadow";
  back.appendChild(backShadow);

  leaf.appendChild(front);
  leaf.appendChild(back);
  pageArea.appendChild(leaf);
  return { leaf, front, back };
}

function buildShade(side) {
  const shade = document.createElement("div");
  shade.className = `flip-shade flip-shade--${side}`;
  pageArea.appendChild(shade);
  return shade;
}

/* Clone a page node into a leaf face. iframes are replaced with a static
   placeholder so they don't reload during the brief animation, and links
   /buttons are made inert. */
function clonePage(srcPage, target) {
  if (!srcPage) {
    const blank = document.createElement("div");
    blank.style.position = "absolute";
    blank.style.inset = "0";
    blank.style.background = "var(--paper)";
    target.appendChild(blank);
    return;
  }
  const clone = srcPage.cloneNode(true);
  clone.querySelectorAll("iframe").forEach((iframe) => {
    const placeholder = document.createElement("div");
    placeholder.style.position = "absolute";
    placeholder.style.inset = "0";
    placeholder.style.background =
      "linear-gradient(135deg,#0d1014,#1a1f26)";
    placeholder.style.aspectRatio = "16/9";
    placeholder.style.borderRadius = "6px";
    placeholder.style.opacity = "0.9";
    iframe.replaceWith(placeholder);
  });
  clone.querySelectorAll("button, a, input, select, textarea").forEach((el) => {
    el.tabIndex = -1;
    el.setAttribute("aria-hidden", "true");
    el.style.pointerEvents = "none";
  });
  clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
  clone.removeAttribute("id");
  target.appendChild(clone);
}

function cloneBackCover(target) {
  if (!backCover) {
    clonePage(null, target);
    return;
  }
  const clone = backCover.cloneNode(true);
  clone.classList.remove("is-current", "is-underlying");
  clone.removeAttribute("aria-label");
  clone.removeAttribute("id");
  clone.style.position = "absolute";
  clone.style.inset = "0";
  clone.style.visibility = "visible";
  clone.style.zIndex = "auto";
  clone.style.borderRadius = "0";
  target.appendChild(clone);
}

function goForward() {
  if (flipLock || !isOpen) return;
  if (pos >= spreads.length) return;
  flipLock = true;

  const curSpread = spreads[pos];
  const nextSpread = spreads[pos + 1] || null;

  curSpread.classList.add("is-leaving-forward");
  curSpread.classList.remove("is-current");
  if (nextSpread) {
    nextSpread.classList.add("is-incoming-forward");
  } else if (backCover) {
    backCover.classList.add("is-underlying");
  }

  const { leaf, front, back } = buildLeaf("forward");
  clonePage(curSpread.querySelector(".page-right"), front);
  if (nextSpread) {
    clonePage(nextSpread.querySelector(".page-left"), back);
  } else {
    cloneBackCover(back);
  }

  const shadeR = buildShade("right");
  const shadeL = buildShade("left");

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      leaf.classList.add("is-running");
      shadeR.classList.add("is-running");
      setTimeout(() => {
        shadeR.classList.remove("is-running");
        shadeL.classList.add("is-running");
      }, 350);
    });
  });

  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    leaf.removeEventListener("transitionend", onEnd);
    leaf.remove();
    shadeR.remove();
    shadeL.remove();
    curSpread.classList.remove("is-leaving-forward");
    if (nextSpread) {
      nextSpread.classList.remove("is-incoming-forward");
      nextSpread.classList.add("is-current");
    } else if (backCover) {
      backCover.classList.remove("is-underlying");
      backCover.classList.add("is-current");
    }
    pos += 1;
    flipLock = false;
    updateHint();
  };
  const onEnd = (event) => {
    if (event.propertyName !== "transform") return;
    finish();
  };
  leaf.addEventListener("transitionend", onEnd);
  setTimeout(finish, 1700);
}

function goBackward() {
  if (flipLock || !isOpen) return;
  if (pos <= 0) {
    closeBook();
    return;
  }
  flipLock = true;

  const curIsBackCover = pos === spreads.length;
  const curSpread = curIsBackCover ? null : spreads[pos];
  const prevSpread = spreads[pos - 1];

  if (curSpread) {
    curSpread.classList.add("is-leaving-backward");
    curSpread.classList.remove("is-current");
  }
  if (backCover && curIsBackCover) {
    backCover.classList.remove("is-current");
    backCover.classList.add("is-underlying");
  }
  prevSpread.classList.add("is-incoming-backward");

  const { leaf, front, back } = buildLeaf("backward");
  clonePage(prevSpread.querySelector(".page-right"), front);
  if (curIsBackCover) {
    cloneBackCover(back);
  } else {
    clonePage(curSpread.querySelector(".page-left"), back);
  }

  const shadeL = buildShade("left");
  const shadeR = buildShade("right");

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      leaf.classList.add("is-running");
      shadeL.classList.add("is-running");
      setTimeout(() => {
        shadeL.classList.remove("is-running");
        shadeR.classList.add("is-running");
      }, 350);
    });
  });

  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    leaf.removeEventListener("transitionend", onEnd);
    leaf.remove();
    shadeL.remove();
    shadeR.remove();
    if (curSpread) curSpread.classList.remove("is-leaving-backward");
    if (backCover) backCover.classList.remove("is-underlying");
    prevSpread.classList.remove("is-incoming-backward");
    prevSpread.classList.add("is-current");
    pos -= 1;
    flipLock = false;
    updateHint();
  };
  const onEnd = (event) => {
    if (event.propertyName !== "transform") return;
    finish();
  };
  leaf.addEventListener("transitionend", onEnd);
  setTimeout(finish, 1700);
}

if (frontCover) {
  frontCover.addEventListener("click", () => {
    if (!isOpen) openBook();
  });
}

book.addEventListener("click", (event) => {
  if (!isOpen || event.target.closest(".front-cover")) return;
  if (event.target.closest(INTERACTIVE_ELEMENTS_SELECTOR)) return;
  if (event.target.closest(".flip-leaf, .flip-shade")) return;

  const bounds = book.getBoundingClientRect();
  const clickX = event.clientX - bounds.left;
  const clickedRight = clickX > bounds.width / 2;

  if (!clickedRight && pos === spreads.length) {
    closeBook();
    return;
  }
  if (clickedRight) {
    goForward();
  } else {
    goBackward();
  }
});

window.addEventListener("keydown", (event) => {
  if (essayOpen) {
    if (event.key === "Escape") {
      event.preventDefault();
      hideEssay();
    }
    return;
  }
  if (event.key === "ArrowRight" && isOpen) {
    event.preventDefault();
    goForward();
  } else if (event.key === "ArrowLeft" && isOpen) {
    event.preventDefault();
    goBackward();
  }
});

window.addEventListener("mousemove", (event) => {
  if (isOpen) {
    const rx = (event.clientY / window.innerHeight - 0.5) * -2;
    const ry = (event.clientX / window.innerWidth - 0.5) * 2.5;
    shell.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    return;
  }
  const rotationY = (event.clientX / window.innerWidth - 0.5) * 6;
  const rotationX = (event.clientY / window.innerHeight - 0.5) * -4;
  shell.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
});

if (playNarrationButton && stopNarrationButton && "speechSynthesis" in window) {
  const narration = new SpeechSynthesisUtterance(
    "American War by Omar El Akkad follows Sarat Chestnut through climate disaster, camps, and radicalization. This desk edition includes a feminist MLA essay you can open from the front matter."
  );

  playNarrationButton.addEventListener("click", () => {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(narration);
  });

  stopNarrationButton.addEventListener("click", () => {
    window.speechSynthesis.cancel();
  });
}

if (zoomInBtn && zoomOutBtn && zoomResetBtn) {
  zoomInBtn.addEventListener("click", () => {
    zoom += 0.1;
    applyZoom();
  });
  zoomOutBtn.addEventListener("click", () => {
    zoom -= 0.1;
    applyZoom();
  });
  zoomResetBtn.addEventListener("click", () => {
    zoom = 1;
    applyZoom();
  });
}

book.classList.add("closed");
applyZoom();
updateHint();
