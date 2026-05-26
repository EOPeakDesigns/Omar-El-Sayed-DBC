const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export const initAccessibility = () => {
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  document.documentElement.toggleAttribute("data-reduced-motion", reducedMotionQuery.matches);

  reducedMotionQuery.addEventListener?.("change", (event) => {
    document.documentElement.toggleAttribute("data-reduced-motion", event.matches);
  });
};

export const createAnnouncer = () => {
  const liveRegion = document.getElementById("liveRegion");

  return (message) => {
    if (!liveRegion || !message) {
      return;
    }

    liveRegion.textContent = "";
    window.setTimeout(() => {
      liveRegion.textContent = message;
    }, 20);
  };
};

export const trapFocus = (container, onClose) => {
  const focusableElements = [...container.querySelectorAll(FOCUSABLE_SELECTOR)];
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab" || focusableElements.length === 0) {
      return;
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  container.addEventListener("keydown", handleKeyDown);
  firstElement?.focus();

  return () => container.removeEventListener("keydown", handleKeyDown);
};
