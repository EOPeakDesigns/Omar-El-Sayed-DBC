import { trapFocus } from "./accessibility.js";

const DEFAULT_ASPECT_RATIO = "16 / 9";

const buildEmbedUrl = (src) => {
  try {
    const url = new URL(src);

    if (!url.searchParams.has("autoplay")) {
      url.searchParams.set("autoplay", "1");
    }

    if (!url.searchParams.has("playsinline")) {
      url.searchParams.set("playsinline", "1");
    }

    return url.toString();
  } catch {
    return src;
  }
};

export const setupVideoModal = ({ getCard, getLanguage, getLabels }) => {
  const modal = document.getElementById("videoModal");
  const modalSheet = modal?.querySelector(".modal__sheet");
  const openButton = document.getElementById("openVideoButton");
  const frame = document.getElementById("featureVideoFrame");
  const player = document.getElementById("featureVideoPlayer");
  const frameWrapper = document.getElementById("videoFrame");
  const eyebrow = document.getElementById("videoEyebrow");
  const title = document.getElementById("videoTitle");
  const caption = document.getElementById("videoCaption");
  const closeButtons = modal?.querySelectorAll(
    "[data-close-video], #closeVideoButton, #closeVideoTextButton"
  );
  let lastActiveElement;
  let cleanupFocusTrap = () => {};

  const getVideo = () => getCard()?.person?.featureVideo;

  const resetMedia = () => {
    frame.hidden = true;
    frame.src = "about:blank";
    player.pause();
    player.removeAttribute("src");
    player.load();
    player.hidden = true;
    player.removeAttribute("poster");
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

    if (!video?.src) {
      return;
    }

    lastActiveElement = document.activeElement;
    modal.hidden = false;
    document.documentElement.classList.add("modal-open");
    cleanupFocusTrap = trapFocus(modalSheet, () => closeModal({ blurReturnFocus: true }));

    eyebrow.textContent = labels.videoEyebrow;
    title.textContent = video.title?.[language] || video.title?.en || labels.watchVideo;
    caption.textContent = video.caption?.[language] || video.caption?.en || "";
    frameWrapper.style.setProperty("--video-aspect", video.aspectRatio || DEFAULT_ASPECT_RATIO);

    if (video.type === "file") {
      player.hidden = false;
      player.poster = video.poster || getCard()?.person?.avatar || "";
      player.src = video.src;
      player.setAttribute("aria-label", title.textContent);

      try {
        await player.play();
      } catch {
        player.controls = true;
      }

      return;
    }

    frame.hidden = false;
    frame.title = title.textContent;
    frame.src = buildEmbedUrl(video.src);
  };

  openButton?.addEventListener("click", openModal);

  closeButtons?.forEach((button) => {
    button.addEventListener("click", () => closeModal());
  });
};
