const book = document.getElementById("book");
const hint = document.getElementById("hintText");
const shell = document.getElementById("bookShell");
const spreads = Array.from(book.querySelectorAll(".spread"));
const frontCover = book.querySelector(".front-cover");
const INTERACTIVE_ELEMENTS_SELECTOR = "a, audio, iframe, button, input, textarea, select";

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

book.classList.add("closed");
updateHint();
