const essayPanel = document.getElementById("essayPanel");
const openEssayPanel = document.getElementById("openEssayPanel");
const closeEssayPanel = document.getElementById("closeEssayPanel");
const essayScrim = document.getElementById("essayScrim");

let essayOpen = false;
let essayReturnFocus = null;

function showEssay() {
  if (!essayPanel) {
    return;
  }
  essayReturnFocus = document.activeElement;
  essayPanel.classList.add("essay-panel--open");
  essayPanel.setAttribute("aria-hidden", "false");
  essayOpen = true;
  document.body.style.overflow = "hidden";
  if (closeEssayPanel) {
    closeEssayPanel.focus();
  }
}

function hideEssay() {
  if (!essayPanel || !essayOpen) {
    return;
  }
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
if (closeEssayPanel) {
  closeEssayPanel.addEventListener("click", () => {
    hideEssay();
  });
}
if (essayScrim) {
  essayScrim.addEventListener("click", () => {
    hideEssay();
  });
}

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

const playNarrationButton = document.getElementById("playNarration");
const stopNarrationButton = document.getElementById("stopNarration");
const zoomInBtn = document.getElementById("zoomIn");
const zoomOutBtn = document.getElementById("zoomOut");
const zoomResetBtn = document.getElementById("zoomReset");
const zoomLabel = document.getElementById("zoomLabel");

let isOpen = false;
let index = 0;
let zoom = 1;
let flipLock = false;

function refreshStacking() {
  if (!isOpen) {
    spreads.forEach((el) => {
      el.style.zIndex = "1";
    });
    if (backCover) {
      backCover.style.zIndex = "0";
    }
    return;
  }

  if (index >= spreads.length) {
    spreads.forEach((el, i) => {
      el.style.zIndex = String(20 + i);
    });
    if (backCover) {
      backCover.style.zIndex = "160";
    }
    return;
  }

  /* Current spread stays on top while it rotates; already-turned spreads sit at the bottom. */
  spreads.forEach((el, i) => {
    if (i < index) {
      el.style.zIndex = String(20 + i);
    } else if (i === index) {
      el.style.zIndex = "300";
    } else {
      el.style.zIndex = String(100 + (spreads.length - i));
    }
  });

  if (backCover) {
    backCover.style.zIndex = "2";
  }
}

function updateHint() {
  if (!isOpen) {
    hint.textContent = "Click the cover to open";
    pageIndicator.textContent = "Cover · desk edition";
    return;
  }
  if (index >= spreads.length) {
    hint.textContent = "Click the left side to close the book";
    pageIndicator.textContent = `Back cover · ${spreads.length} spreads read`;
    return;
  }
  hint.textContent = "Click the right page to turn forward · left to go back";
  pageIndicator.textContent = `Spread ${index + 1} of ${spreads.length} (pages ${index * 2 + 1}–${index * 2 + 2})`;
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
      if (event.propertyName !== "transform") {
        return;
      }
      if (!book.classList.contains("open")) {
        return;
      }
      frontCover.style.zIndex = "40";
      frontCover.removeEventListener("transitionend", lowerOnce);
    };
    frontCover.addEventListener("transitionend", lowerOnce);
  }
  refreshStacking();
  updateHint();
}

function closeBook() {
  isOpen = false;
  index = 0;
  flipLock = false;
  spreads.forEach((spread) => {
    spread.classList.remove("flipped", "is-flipping");
  });
  book.classList.remove("open");
  book.classList.add("closed");
  if (frontCover) {
    frontCover.style.zIndex = "";
  }
  refreshStacking();
  updateHint();
}

function goForward() {
  if (flipLock || index >= spreads.length) {
    return;
  }
  const sp = spreads[index];
  flipLock = true;
  sp.classList.add("is-flipping");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      sp.classList.add("flipped");
    });
  });

  let settled = false;
  const onEnd = (event) => {
    if (event.propertyName !== "transform" || settled) {
      return;
    }
    settled = true;
    sp.classList.remove("is-flipping");
    sp.removeEventListener("transitionend", onEnd);
    index += 1;
    flipLock = false;
    refreshStacking();
    updateHint();
  };
  sp.addEventListener("transitionend", onEnd);
}

function goBackward() {
  if (flipLock) {
    return;
  }
  if (index <= 0) {
    closeBook();
    return;
  }
  flipLock = true;
  index -= 1;
  const sp = spreads[index];
  sp.classList.add("is-flipping");
  sp.classList.remove("flipped");
  refreshStacking();

  let settled = false;
  const onEnd = (event) => {
    if (event.propertyName !== "transform" || settled) {
      return;
    }
    settled = true;
    sp.classList.remove("is-flipping");
    sp.removeEventListener("transitionend", onEnd);
    flipLock = false;
    updateHint();
  };
  sp.addEventListener("transitionend", onEnd);
}

if (frontCover) {
  frontCover.addEventListener("click", () => {
    if (!isOpen) {
      openBook();
    }
  });
}

book.addEventListener("click", (event) => {
  if (!isOpen || event.target.closest(".front-cover")) {
    return;
  }
  if (event.target.closest(INTERACTIVE_ELEMENTS_SELECTOR)) {
    return;
  }

  const bounds = book.getBoundingClientRect();
  const clickX = event.clientX - bounds.left;
  const clickedRight = clickX > bounds.width / 2;

  if (!clickedRight && index === spreads.length) {
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
  const rotationY = (event.clientX / window.innerWidth - 0.5) * (isOpen ? 5.5 : 5);
  const rotationX = (event.clientY / window.innerHeight - 0.5) * (isOpen ? -2.2 : -3.5);
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
refreshStacking();
applyZoom();
updateHint();
