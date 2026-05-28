import { trapFocus } from "./accessibility.js";

const YOUTUBE_EMBED =
  "https://www.youtube.com/embed/2Ri8f-wqonE?playsinline=1&rel=0&modestbranding=1";

export const setupVideoModal = ({ getCard, getLanguage, getLabels }) => {
  const modal = document.getElementById("videoModal");
  const modalSheet = modal?.querySelector(".modal__sheet");
  const openButton = document.getElementById("openVideoButton");
  const iframe = document.getElementById("profileVideoFrame");
  const legacyPlayer = document.getElementById("featureVideoPlayer");
  const eyebrow = document.getElementById("videoEyebrow");
  const title = document.getElementById("videoTitle");
  const caption = document.getElementById("videoCaption");
  const closeButtons = modal?.querySelectorAll(
    "[data-close-video], #closeVideoButton, #closeVideoTextButton"
  );
  let lastActiveElement;
  let cleanupFocusTrap = () => {};

  const getVideo = () => getCard()?.person?.featureVideo;

  const getEmbedSrc = () => {
    const fromData = iframe?.dataset.src?.trim();
    const fromCard = getVideo()?.src?.trim();
    return fromData || fromCard || YOUTUBE_EMBED;
  };

  const loadEmbed = () => {
    if (!iframe) {
      return;
    }

    const embedSrc = getEmbedSrc();
    iframe.dataset.src = embedSrc;
    iframe.src = embedSrc;
    iframe.removeAttribute("hidden");
  };

  const unloadEmbed = () => {
    if (!iframe) {
      return;
    }

    iframe.src = "";
    iframe.setAttribute("hidden", "");
  };

  const resetLegacyVideo = () => {
    if (!legacyPlayer) {
      return;
    }

    legacyPlayer.pause();
    legacyPlayer.removeAttribute("src");
    legacyPlayer.load();
    legacyPlayer.hidden = true;
    legacyPlayer.removeAttribute("poster");
  };

  const resetMedia = () => {
    unloadEmbed();
    resetLegacyVideo();
  };

  const closeModal = ({ blurReturnFocus = false } = {}) => {
    modal.hidden = true;
    document.documentElement.classList.remove("modal-open");
    cleanupFocusTrap();
    resetMedia();
    lastActiveElement?.focus?.({ preventScroll: true });

    if (blurReturnFocus && typeof lastActiveElement?.blur === "function") {
      window.requestAnimationFrame(() => {
        lastActiveElement.blur();
      });
    }
  };

  const openModal = async () => {
    const video = getVideo();
    const language = getLanguage();
    const labels = getLabels();

    if (!video?.src && !iframe?.dataset.src) {
      return;
    }

    lastActiveElement = document.activeElement;
    modal.hidden = false;
    document.documentElement.classList.add("modal-open");
    cleanupFocusTrap = trapFocus(modalSheet, () => closeModal({ blurReturnFocus: true }));

    eyebrow.textContent = labels.videoEyebrow;
    title.textContent = video?.title?.[language] || video?.title?.en || labels.watchVideo;
    caption.textContent = video?.caption?.[language] || video?.caption?.en || "";
    iframe.title = title.textContent;

    if (video?.type === "file" && legacyPlayer) {
      legacyPlayer.hidden = false;
      legacyPlayer.poster = video.poster || getCard()?.person?.avatar || "";
      legacyPlayer.src = video.src;
      legacyPlayer.setAttribute("aria-label", title.textContent);

      try {
        await legacyPlayer.play();
      } catch {
        legacyPlayer.controls = true;
      }

      return;
    }

    loadEmbed();
  };

  openButton?.addEventListener("click", openModal);

  closeButtons?.forEach((button) => {
    button.addEventListener("click", () => closeModal());
  });

  modal?.addEventListener("click", (event) => {
    if (event.target === modal || event.target.matches("[data-close-video]")) {
      closeModal();
    }
  });
};
