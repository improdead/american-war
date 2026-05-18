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
let jumpFlashTimer = null;

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
  if (!hint || !pageIndicator) return;
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
  hint.textContent =
    "Click the right page to turn forward · left to go back · drag notes to rearrange";
  pageIndicator.textContent = `Spread ${pos + 1} of ${spreads.length} (pages ${pos * 2 + 1}–${pos * 2 + 2})`;
}

function applyZoom() {
  zoom = Math.min(1.85, Math.max(0.65, Math.round(zoom * 100) / 100));
  scaler.style.transform = `scale(${zoom})`;
  zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
}

function openBook(initialSpread = 0) {
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
  const max = spreads.length;
  pos = Math.min(Math.max(0, initialSpread), max);
  setCurrent();
  updateHint();
}

function closeBook() {
  isOpen = false;
  pos = 0;
  flipLock = false;
  pageArea.classList.remove("is-flipping");
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

/** Snap to a spread (0..spreads.length-1) or spreads.length for back cover — no leaf animation. */
function jumpToSpread(targetPos) {
  const max = spreads.length;
  const t = Math.min(Math.max(0, targetPos), max);
  if (flipLock) {
    const retry = () => {
      if (flipLock) {
        requestAnimationFrame(retry);
        return;
      }
      jumpToSpread(targetPos);
    };
    requestAnimationFrame(retry);
    return;
  }
  if (!isOpen) {
    openBook(t);
    flashJump();
    return;
  }
  pos = t;
  setCurrent();
  updateHint();
  flashJump();
}

function flashJump() {
  if (!book) return;
  book.classList.remove("book--jump-flash");
  if (jumpFlashTimer) clearTimeout(jumpFlashTimer);
  void book.offsetWidth;
  book.classList.add("book--jump-flash");
  jumpFlashTimer = setTimeout(() => {
    book.classList.remove("book--jump-flash");
    jumpFlashTimer = null;
  }, 420);
}

function getFlipDurationMs() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--flip-ms");
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 980;
}

function startFlipAnimation(leaf, shadeFirst, shadeSecond) {
  pageArea.classList.add("is-flipping");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      leaf.classList.add("is-running");
      shadeFirst.classList.add("is-running");
      setTimeout(() => {
        shadeFirst.classList.remove("is-running");
        shadeSecond.classList.add("is-running");
      }, Math.round(getFlipDurationMs() * 0.36));
    });
  });
}

function bindFlipFinish(leaf, shades, onDone) {
  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    leaf.removeEventListener("animationend", onEnd);
    pageArea.classList.remove("is-flipping");
    leaf.remove();
    shades.forEach((el) => el.remove());
    onDone();
    flipLock = false;
    updateHint();
  };
  const onEnd = (event) => {
    if (event.target !== leaf) return;
    if (event.animationName !== "leafFlipForward" && event.animationName !== "leafFlipBackward") {
      return;
    }
    finish();
  };
  leaf.addEventListener("animationend", onEnd);
  setTimeout(finish, getFlipDurationMs() + 64);
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

  void curSpread.offsetWidth;

  const { leaf, front, back } = buildLeaf("forward");
  clonePage(curSpread.querySelector(".page-right"), front);
  if (nextSpread) {
    clonePage(nextSpread.querySelector(".page-left"), back);
  } else {
    cloneBackCover(back);
  }

  const shadeR = buildShade("right");
  const shadeL = buildShade("left");

  startFlipAnimation(leaf, shadeR, shadeL);

  bindFlipFinish(leaf, [shadeR, shadeL], () => {
    curSpread.classList.remove("is-leaving-forward");
    if (nextSpread) {
      nextSpread.classList.remove("is-incoming-forward");
      nextSpread.classList.add("is-current");
    } else if (backCover) {
      backCover.classList.remove("is-underlying");
      backCover.classList.add("is-current");
    }
    pos += 1;
  });
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

  void (curSpread || prevSpread).offsetWidth;

  const { leaf, front, back } = buildLeaf("backward");
  clonePage(prevSpread.querySelector(".page-right"), front);
  if (curIsBackCover) {
    cloneBackCover(back);
  } else {
    clonePage(curSpread.querySelector(".page-left"), back);
  }

  const shadeL = buildShade("left");
  const shadeR = buildShade("right");

  startFlipAnimation(leaf, shadeL, shadeR);

  bindFlipFinish(leaf, [shadeL, shadeR], () => {
    if (curSpread) curSpread.classList.remove("is-leaving-backward");
    if (backCover) backCover.classList.remove("is-underlying");
    prevSpread.classList.remove("is-incoming-backward");
    prevSpread.classList.add("is-current");
    pos -= 1;
  });
}

if (frontCover) {
  frontCover.addEventListener("click", () => {
    if (!isOpen) openBook();
  });
}

book.addEventListener("click", (event) => {
  if (!isOpen || event.target.closest(".front-cover")) return;
  if (event.target.closest(INTERACTIVE_ELEMENTS_SELECTOR)) return;
  if (event.target.closest(".flip-leaf, .flip-shade, .sticker, .fore-edge, .media-block")) return;

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

const NARRATION_FULL = `American War desk folio — narration script

Welcome. You are holding a paper-style scrapbook about Omar El Akkad's novel American War. Open the cover, then move through spreads with a click on the right page to go forward, or the left page to go back. Arrow keys do the same. The table of contents jumps instantly to any section.

Front matter. This edition pairs summaries, character studies, media, and MLA citations with a full feminist reading you can open as a separate sheet from the round button on the title page.

Summary. In a splintered United States gutted by climate failure and a second civil war, the story tracks Sarat Chestnut from a half-drowned Louisiana childhood into the disciplined cruelty of Camp Patience, and beyond into the mythology of retribution. El Akkad treats speculative fiction as a forensic lens.

Stakes. Each relocation tightens the Chestnut family's choices. Mentors speak softly because they know volume is unnecessary when a child is already listening for orders. The novel asks whether revenge can ever be hygienic once it becomes a civic style.

Climate and remote war. Climate grief is plot, not backdrop. Drones, checkpoints, and rumor networks translate occupation grammar into a domestic key readers still recognize.

Camps and revenge. Camps compress time: boredom becomes radicalization fuel; kindness becomes a ledger. The ethical spine is brutal: violence mortgages the next generation's peace.

Thesis spread. A strong feminist argument links climate crisis, civil war, and imperial gamesmanship through gendered pathways—mothers who cannot shield daughters, mentors who translate grief into doctrine, narrators who decide which pages survive.

Author. Omar El Akkad is an Egyptian-Canadian novelist and journalist. His reporting from conflict zones informs the tactile credibility of the novel—the way checkpoints smell, how official language softens murder.

Characters one — Sarat and Benjamin. Sarat is the protagonist: fierce curiosity weaponized by mentors. Benjamin is brother and foil, carrying the family's hope for repair.

Characters two — Martina and Albert Gaines. Martina is the novel's clearest case of maternal labor as politics: she rations calories, manages fear, and refuses to let her family be conscripted into someone else's war. Her loss removes the buffer between Sarat and recruitment.

Albert Gaines is the calm male teacher archetype who tells a grieving girl that the world makes sense if she will only follow him into the next room. His pedagogy looks like attention; it is recruitment. The novel does not flatten him into villainy—he believes what he is saying, which is what makes it dangerous. Gaines is Martina's ideological opposite: she gives care without doctrine; he gives doctrine dressed up as care.

Motifs and discussion. Trace water, documents, borders, and names. Ask where the novel refuses reader comfort on purpose, and who is allowed moral complexity.

Media and links. Use the publisher video for class context, cite interviews and reviews in MLA 9, and cite the narration file alongside your other media sources.

Works cited. Everything here is meant to sit beside the images it explains—hanging indents, containers, stable URLs.

Closing. When you close the folio, you step away from the argument—but not from the questions it plants about whose bodies count as civilian, whose anger is legible, and who gets to tell the story. Thank you for listening.`;

const narrationPre = document.getElementById("narrationScriptPre");
const copyNarrationBtn = document.getElementById("copyNarration");
if (narrationPre) narrationPre.textContent = NARRATION_FULL;

if (copyNarrationBtn) {
  copyNarrationBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(NARRATION_FULL);
      const prev = copyNarrationBtn.textContent;
      copyNarrationBtn.textContent = "Copied";
      setTimeout(() => {
        copyNarrationBtn.textContent = prev;
      }, 1600);
    } catch (_) {
      copyNarrationBtn.textContent = "Select & copy from box";
      setTimeout(() => {
        copyNarrationBtn.textContent = "Copy script";
      }, 2000);
    }
  });
}

const narrationAudio = document.getElementById("narrationAudio");

function syncNarrationPlayButton() {
  if (!playNarrationButton || !narrationAudio) return;
  const playing = !narrationAudio.paused;
  playNarrationButton.textContent = playing ? "Pause" : "Play narration";
  playNarrationButton.setAttribute("aria-label", playing ? "Pause narration" : "Play narration");
}

if (narrationAudio && playNarrationButton && stopNarrationButton) {
  playNarrationButton.addEventListener("click", () => {
    if (narrationAudio.paused) {
      narrationAudio.play().catch(() => {});
    } else {
      narrationAudio.pause();
    }
    syncNarrationPlayButton();
  });

  stopNarrationButton.addEventListener("click", () => {
    narrationAudio.pause();
    narrationAudio.currentTime = 0;
    syncNarrationPlayButton();
  });

  narrationAudio.addEventListener("play", syncNarrationPlayButton);
  narrationAudio.addEventListener("pause", syncNarrationPlayButton);
  narrationAudio.addEventListener("ended", syncNarrationPlayButton);
  syncNarrationPlayButton();
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

const EDGE_HINT_PAIRS = [
  { L: "Secret handshake: the essay opens without losing your place.", R: "Try a TOC jump before you flip—two different kinds of magic." },
  { L: "Louisiana’s scale in the novel is borrowed from real floods, not named as prophecy.", R: "If you cite the aerial photo, name it as parallel, not as storyboard." },
  { L: "Watch who gets full sentences of motive versus who becomes a headline.", R: "That pull quote is a creed spoken to a child—note the power imbalance." },
  { L: "Climate is not wallpaper here; it decides who eats and who moves.", R: "Remote war is cheap for the launcher, total for the person under the sensor." },
  { L: "Queues are politics: time is the state’s rudest argument.", R: "Pair revenge cycles with Enloe on invisible camp labor—your paragraph will glow." },
  { L: "A thesis someone can disagree with beats a summary dressed as a claim.", R: "Those subtopics are a menu: pick three scenes, not twelve." },
  { L: "El Akkad drove the South and sketched coastlines at minus sea level.", R: "The portrait is a real photograph—credit it like any other witness." },
  { L: "Sarat’s name is shortened before the world can finish naming her.", R: "Benjamin throws her choices into relief—watch who gets repair arcs." },
  { L: "Martina is the buffer between grief and doctrine; notice when she exits.", R: "Gaines believes his own lines—that’s why they work on Sarat." },
  { L: "Mark every flood and crossing; water is the novel’s emotional metronome.", R: "Discussion prompts are blades: answer the one that scares you most." },
  { L: "YouTube embeds still need MLA: channel, date, stable URL.", R: "Record your own voice over this script for full credit—listeners forgive robots less than teachers do." },
  { L: "Hanging indent half an inch—your professor will notice if you fake it.", R: "LOC portraits are cited prompts, not casting calls—say that once in your paper." },
];

function attachForeEdgeHints() {
  EDGE_HINT_PAIRS.forEach((pair, idx) => {
    const sp = spreads[idx];
    if (!sp) return;

    const makeEdge = (side, glyph, label, text) => {
      const wrap = document.createElement("div");
      wrap.className = `fore-edge fore-edge--${side}`;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "fore-edge__tab";
      btn.textContent = glyph;
      btn.setAttribute("aria-label", label);
      const pop = document.createElement("div");
      pop.className = "fore-edge__pop";
      pop.textContent = text;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const wasOpen = wrap.classList.contains("is-open");
        sp.querySelectorAll(".fore-edge.is-open").forEach((el) => el.classList.remove("is-open"));
        if (!wasOpen) wrap.classList.add("is-open");
      });
      wrap.appendChild(btn);
      wrap.appendChild(pop);
      sp.appendChild(wrap);
    };

    makeEdge("left", "✧", "Fore-edge hint, left page", pair.L);
    makeEdge("right", "✦", "Fore-edge hint, right page", pair.R);
  });
}

document.addEventListener(
  "pointerdown",
  (e) => {
    if (e.target.closest(".fore-edge")) return;
    document.querySelectorAll(".fore-edge.is-open").forEach((el) => el.classList.remove("is-open"));
  },
  true
);

function initStickerDrag() {
  const stickers = book.querySelectorAll(".page .sticker");
  stickers.forEach((sticker, i) => {
    const page = sticker.closest(".page");
    if (!page) return;
    const key = `aw-sticker-${i}`;

    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const { l, t } = JSON.parse(raw);
        if (typeof l === "number" && typeof t === "number") {
          sticker.style.left = `${l}px`;
          sticker.style.top = `${t}px`;
          sticker.style.right = "auto";
          sticker.style.bottom = "auto";
        }
      }
    } catch (_) {
      /* ignore */
    }

    let startX = 0;
    let startY = 0;
    let origLeft = 0;
    let origTop = 0;
    let dragging = false;

    sticker.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      if (flipLock) return;
      const rect = page.getBoundingClientRect();
      const sr = sticker.getBoundingClientRect();
      origLeft = sr.left - rect.left + page.scrollLeft;
      origTop = sr.top - rect.top + page.scrollTop;
      startX = e.clientX;
      startY = e.clientY;
      dragging = false;
      sticker.setPointerCapture(e.pointerId);
      sticker.classList.add("sticker--grabbing");
    });

    sticker.addEventListener("pointermove", (e) => {
      if (!sticker.hasPointerCapture(e.pointerId)) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!dragging && dx * dx + dy * dy > 36) dragging = true;
      if (!dragging) return;
      e.preventDefault();
      let nl = origLeft + dx;
      let nt = origTop + dy;
      const pad = 8;
      const maxL = page.clientWidth - sticker.offsetWidth - pad;
      const maxT = page.clientHeight - sticker.offsetHeight - pad;
      nl = Math.max(pad, Math.min(nl, maxL));
      nt = Math.max(pad, Math.min(nt, maxT));
      sticker.style.left = `${nl}px`;
      sticker.style.top = `${nt}px`;
      sticker.style.right = "auto";
      sticker.style.bottom = "auto";
    });

    const endDrag = (e) => {
      if (!sticker.hasPointerCapture(e.pointerId)) return;
      sticker.releasePointerCapture(e.pointerId);
      sticker.classList.remove("sticker--grabbing");
      if (dragging) {
        try {
          localStorage.setItem(
            key,
            JSON.stringify({
              l: parseFloat(sticker.style.left) || origLeft,
              t: parseFloat(sticker.style.top) || origTop,
            })
          );
        } catch (_) {
          /* ignore */
        }
      }
      dragging = false;
    };

    sticker.addEventListener("pointerup", endDrag);
    sticker.addEventListener("pointercancel", endDrag);
  });
}

document.querySelectorAll(".toc-link").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const raw = btn.getAttribute("data-spread");
    if (raw == null) return;
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) return;
    jumpToSpread(n);
  });
});

attachForeEdgeHints();
initStickerDrag();

book.classList.add("closed");
applyZoom();
updateHint();
