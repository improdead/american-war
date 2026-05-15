const book = document.getElementById("book");
const hint = document.getElementById("hintText");
const shell = document.getElementById("bookShell");
const spreads = Array.from(book.querySelectorAll(".spread"));
const frontCover = book.querySelector(".front-cover");
const INTERACTIVE_ELEMENTS_SELECTOR = "a, audio, iframe, button, input, textarea, select, video";
const playNarrationButton = document.getElementById("playNarration");
const stopNarrationButton = document.getElementById("stopNarration");

let isOpen = false;
let index = 0;

function updateHint() {
  if (!isOpen) {
    hint.textContent = "CLICK TO OPEN";
    return;
  }
  if (index >= spreads.length) {
    hint.textContent = "CLICK LEFT SIDE TO CLOSE";
    return;
  }
  hint.textContent = "CLICK PAGES TO TURN";
}

function openBook() {
  isOpen = true;
  book.classList.remove("closed");
  book.classList.add("open");
  updateHint();
}

function closeBook() {
  isOpen = false;
  index = 0;
  spreads.forEach((spread) => spread.classList.remove("flipped"));
  book.classList.remove("open");
  book.classList.add("closed");
  updateHint();
}

function goForward() {
  if (index >= spreads.length) {
    return;
  }
  spreads[index].classList.add("flipped");
  index += 1;
  updateHint();
}

function goBackward() {
  if (index <= 0) {
    closeBook();
    return;
  }
  index -= 1;
  spreads[index].classList.remove("flipped");
  updateHint();
}

frontCover.addEventListener("click", () => {
  if (!isOpen) {
    openBook();
  }
});

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

window.addEventListener("mousemove", (event) => {
  if (isOpen) {
    shell.style.transform = "rotateX(0deg) rotateY(0deg)";
    return;
  }

  const rotationY = (event.clientX / window.innerWidth - 0.5) * 6;
  const rotationX = (event.clientY / window.innerHeight - 0.5) * -4;
  shell.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
});

if (playNarrationButton && stopNarrationButton && "speechSynthesis" in window) {
  const narration = new SpeechSynthesisUtterance(
    "American War by Omar El Akkad traces climate collapse, displacement, and generational trauma through Sarat Chestnut during a second American civil war. This reader pairs archival imagery with thesis-level analysis and full MLA ninth edition citations."
  );

  playNarrationButton.addEventListener("click", () => {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(narration);
  });

  stopNarrationButton.addEventListener("click", () => {
    window.speechSynthesis.cancel();
  });
}

book.classList.add("closed");
updateHint();

const coverImg = document.querySelector(".front-cover .cover-image");
if (coverImg) {
  const fallback = coverImg.getAttribute("data-fallback");
  coverImg.addEventListener("error", () => {
    if (fallback && coverImg.getAttribute("src") !== fallback) {
      coverImg.src = fallback;
    }
  });
}
