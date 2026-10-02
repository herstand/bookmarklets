export const enhancePage = () => {
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || "");
  document.documentElement.dataset.os = isMac ? "mac" : "win";
  document.querySelectorAll("a.bookmarklet").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const card = link.closest(".tool");
      if (!card) return;
      card.classList.remove("nudge");
      void card.offsetWidth;
      card.classList.add("nudge");
      setTimeout(() => card.classList.remove("nudge"), 1800);
    });
  });
};
