const e = React.createElement;
const { useMemo, useState, useEffect } = React;

const TAB_ITEMS = [
  { id: "summary", label: "Summary" },
  { id: "themes", label: "Themes" },
  { id: "author", label: "Author" },
  { id: "media", label: "Media" },
];

const THEME_CARDS = [
  {
    title: "Cyclical violence",
    description: "The novel shows how trauma repeats when societies refuse to heal their wounds.",
  },
  {
    title: "Climate inequality",
    description: "Resource collapse reshapes borders, power, and who is left behind.",
  },
  {
    title: "Radicalization",
    description: "Refugee camps become incubators for propaganda and inherited fury.",
  },
  {
    title: "Memory vs. myth",
    description: "Personal stories either preserve truth or fuel revenge depending on who tells them.",
  },
];

const NARRATION_RATE = 0.95;
const NARRATION_TEXT =
  "American War follows Sarat Chestnut as climate collapse and civil conflict remake the United States. The novel asks how grief, propaganda, and displacement shape a generation's idea of justice.";

function TabButton({ id, label, activeId, onSelect }) {
  const isActive = id === activeId;
  return e(
    "button",
    {
      type: "button",
      className: `tab${isActive ? " active" : ""}`,
      onClick: () => onSelect(id),
      role: "tab",
      "aria-selected": isActive,
    },
    label
  );
}

function SummaryPanel() {
  return e(
    "div",
    { className: "panel-grid" },
    e(
      "div",
      null,
      e("h2", null, "Summary: \u201CThe Drowning\u201D"),
      e(
        "p",
        null,
        "Set in a future United States fractured by climate disaster and civil war, ",
        e("em", null, "American War"),
        " follows Sarat Chestnut from childhood in a refugee camp to her transformation into a symbol of vengeance."
      ),
      e(
        "p",
        null,
        "The narrative traces how violence, grief, displacement, and propaganda reshape identity across generations and push communities toward inherited conflict."
      ),
      e(
        "p",
        { className: "quote" },
        "\u201CHe had taught her long ago that when your country asks you to kill for it, your only question should be how high.\u201D"
      )
    ),
    e(
      "div",
      null,
      e("img", {
        src: "https://images.unsplash.com/photo-1502303756762-a0f4a3d7ab9f?auto=format&fit=crop&w=900&q=80",
        alt: "Moody flooded landscape symbolizing climate collapse",
      }),
      e(
        "div",
        { className: "info-stack" },
        e(
          "div",
          { className: "info-card" },
          e("p", { className: "info-label" }, "Setting"),
          e("p", { className: "info-value" }, "Second American Civil War")
        ),
        e(
          "div",
          { className: "info-card" },
          e("p", { className: "info-label" }, "Focus"),
          e("p", { className: "info-value" }, "Trauma, memory, and revenge")
        ),
        e(
          "div",
          { className: "info-card" },
          e("p", { className: "info-label" }, "Tone"),
          e("p", { className: "info-value" }, "Somber, reflective, urgent")
        )
      )
    )
  );
}

function ThemesPanel() {
  return e(
    "div",
    null,
    e("h2", null, "Key Themes"),
    e(
      "p",
      null,
      "The novel mirrors histories of occupation, surveillance, and revenge to challenge how readers imagine \u201Chome\u201D and \u201Cenemy.\u201D"
    ),
    e(
      "div",
      { className: "theme-grid" },
      THEME_CARDS.map((theme) =>
        e(
          "div",
          { className: "theme-card", key: theme.title },
          e("h3", null, theme.title),
          e("p", null, theme.description)
        )
      )
    )
  );
}

function AuthorPanel() {
  return e(
    "div",
    { className: "panel-grid" },
    e(
      "div",
      null,
      e("h2", null, "About the Author"),
      e(
        "p",
        null,
        "Omar El Akkad is an Egyptian-Canadian novelist and journalist known for reporting from conflict zones and writing about displacement, power, and moral responsibility."
      ),
      e(
        "p",
        null,
        "His reporting background gives ",
        e("em", null, "American War"),
        " its documentary realism and ethical sharpness."
      ),
      e(
        "p",
        { className: "quote" },
        "The novel asks what happens when a generation is forced to inherit a war it never chose."
      )
    ),
    e(
      "div",
      null,
      e("img", {
        src: "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=900&q=80",
        alt: "Typewriter and manuscript representing authorship",
      }),
      e(
        "div",
        { className: "info-stack" },
        e(
          "div",
          { className: "info-card" },
          e("p", { className: "info-label" }, "Perspective"),
          e("p", { className: "info-value" }, "Conflict reporting + literary lens")
        ),
        e(
          "div",
          { className: "info-card" },
          e("p", { className: "info-label" }, "Themes"),
          e("p", { className: "info-value" }, "Displacement, empire, memory")
        )
      )
    )
  );
}

function MediaPanel() {
  const supportsNarration = typeof window !== "undefined" && "speechSynthesis" in window;
  const narration = useMemo(() => {
    if (!supportsNarration) {
      return null;
    }
    const utterance = new SpeechSynthesisUtterance(NARRATION_TEXT);
    utterance.rate = NARRATION_RATE;
    return utterance;
  }, [supportsNarration]);

  useEffect(() => () => {
    if (supportsNarration) {
      window.speechSynthesis.cancel();
    }
  }, [supportsNarration]);

  const handlePlay = () => {
    if (!supportsNarration || !narration) {
      return;
    }
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(narration);
  };

  const handleStop = () => {
    if (!supportsNarration) {
      return;
    }
    window.speechSynthesis.cancel();
  };

  return e(
    "div",
    null,
    e("h2", null, "Media, Links, and Sources"),
    e(
      "p",
      null,
      "Listen to a short narration of the novel's themes or jump to related reading." 
    ),
    e(
      "div",
      { className: "media-actions" },
      e(
        "button",
        { type: "button", className: "btn", onClick: handlePlay, disabled: !supportsNarration },
        supportsNarration ? "Play narration" : "Narration unavailable"
      ),
      e(
        "button",
        {
          type: "button",
          className: "btn secondary",
          onClick: handleStop,
          disabled: !supportsNarration,
        },
        "Stop narration"
      )
    ),
    e(
      "div",
      { className: "links" },
      e(
        "a",
        {
          href: "https://www.penguinrandomhouse.com/books/241836/american-war-by-omar-el-akkad/",
          target: "_blank",
          rel: "noreferrer",
        },
        "Publisher page"
      ),
      e("span", null, "\u2022"),
      e(
        "a",
        {
          href: "https://www.nytimes.com/2017/03/08/books/review/american-war-omar-el-akkad.html",
          target: "_blank",
          rel: "noreferrer",
        },
        "NYT review"
      ),
      e("span", null, "\u2022"),
      e(
        "a",
        {
          href: "https://www.omarelakkad.com/",
          target: "_blank",
          rel: "noreferrer",
        },
        "Author site"
      )
    ),
    e(
      "ul",
      { className: "citations" },
      e(
        "li",
        null,
        "El Akkad, Omar. ",
        e("em", null, "American War"),
        ". Vintage, 2018 (paperback edition; originally published 2017)."
      ),
      e("li", null, "Cover art rendered from the local illustrated asset in the project."),
      e("li", null, "Penguin Random House author and book pages."),
      e("li", null, "Unsplash images by licensed contributors."),
      e("li", null, "New York Times review for critical context.")
    )
  );
}

function App() {
  const [activeId, setActiveId] = useState("summary");

  const scrollToPanel = () => {
    const panel = document.getElementById("reader-panel");
    if (panel) {
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleExplore = () => {
    setActiveId("summary");
    scrollToPanel();
  };

  const handleListen = () => {
    setActiveId("media");
    scrollToPanel();
  };

  let panelContent = null;
  if (activeId === "summary") {
    panelContent = e(SummaryPanel);
  } else if (activeId === "themes") {
    panelContent = e(ThemesPanel);
  } else if (activeId === "author") {
    panelContent = e(AuthorPanel);
  } else {
    panelContent = e(MediaPanel);
  }

  return e(
    "main",
    { className: "app" },
    e(
      "header",
      { className: "hero" },
      e(
        "div",
        { className: "cover-card" },
        e("img", {
          src: "assets/american-war-cover.svg",
          alt: "Cover of American War by Omar El Akkad",
        }),
        e(
          "div",
          { className: "cover-meta" },
          e("span", { className: "cover-tag" }, "Interactive Reader"),
          e("h2", { className: "cover-title" }, "American War"),
          e("span", { className: "author" }, "Omar El Akkad")
        )
      ),
      e(
        "div",
        { className: "hero-copy" },
        e("h1", null, "American War"),
        e("div", { className: "author" }, "OMAR EL AKKAD"),
        e(
          "p",
          null,
          "A speculative literary novel that blends climate catastrophe, civil war, and intimate character study. Explore the core themes, story arc, and critical context in a modern reading experience."
        ),
        e(
          "div",
          { className: "hero-actions" },
          e(
            "button",
            { type: "button", className: "btn", onClick: handleExplore },
            "Explore chapters"
          ),
          e(
            "button",
            { type: "button", className: "btn secondary", onClick: handleListen },
            "Listen to narration"
          )
        ),
        e(
          "div",
          { className: "pill-row" },
          e("span", { className: "pill" }, "Climate collapse"),
          e("span", { className: "pill" }, "Civil conflict"),
          e("span", { className: "pill" }, "Memory & identity")
        )
      )
    ),
    e(
      "section",
      { className: "section panel", id: "reader-panel" },
      e(
        "div",
        { className: "tabs", role: "tablist", "aria-label": "Reader sections" },
        TAB_ITEMS.map((tab) =>
          e(TabButton, {
            key: tab.id,
            id: tab.id,
            label: tab.label,
            activeId,
            onSelect: setActiveId,
          })
        )
      ),
      e("div", { className: "panel" }, panelContent)
    ),
    e(
      "footer",
      { className: "footer" },
      "Interactive summary crafted for a deeper read of American War."
    )
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(e(App));
