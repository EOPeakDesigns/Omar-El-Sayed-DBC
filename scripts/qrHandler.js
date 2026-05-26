import { trapFocus } from "./accessibility.js";

const LOCAL_QR_SRC = "assets/MYQR.png";

export const setupQrModal = ({ getCard, getLabels, announce }) => {
  const modal = document.getElementById("qrModal");
  const qrImage = document.getElementById("qrImage");
  const qrTitle = document.getElementById("qrTitle");
  const qrCaption = document.getElementById("qrCaption");
  const downloadButton = document.getElementById("downloadQrButton");
  const openButton = document.getElementById("showQrButton");
  const closeButton = document.getElementById("closeQrButton");
  const closeButtons = modal.querySelectorAll("[data-close-modal], #closeQrButton, #closeQrTextButton");
  const modalSheet = modal.querySelector(".modal__sheet");
  const placeholderSrc = "assets/qr/qr-placeholder.svg";
  let lastActiveElement;
  let cleanupFocusTrap = () => {};

  const closeModal = ({ blurReturnFocus = false } = {}) => {
    modal.hidden = true;
    document.documentElement.classList.remove("modal-open");
    cleanupFocusTrap();
    lastActiveElement?.focus?.({ preventScroll: true });

    if (blurReturnFocus && typeof lastActiveElement?.blur === "function") {
      window.requestAnimationFrame(() => {
        lastActiveElement.blur();
      });
    }
  };

  const openModal = () => {
    const card = getCard();
    const labels = getLabels();

    lastActiveElement = document.activeElement;
    modal.hidden = false;
    document.documentElement.classList.add("modal-open");
    cleanupFocusTrap = trapFocus(modalSheet, () => closeModal({ blurReturnFocus: true }));
    qrTitle.textContent = labels.showQr;
    qrCaption.textContent = labels.scanLabel;
    downloadButton.textContent = labels.downloadQr;
    closeButton?.setAttribute("aria-label", labels.close);
    qrImage.src = LOCAL_QR_SRC;
    qrImage.alt = `${card.person.name.en} QR code`;
    downloadButton.href = LOCAL_QR_SRC;
    downloadButton.download = `${card.person.name.en.toLowerCase().replace(/\s+/g, "-")}-qr.png`;
    downloadButton.removeAttribute("target");
    downloadButton.removeAttribute("rel");
    announce(labels.downloadQrReady);
  };

  openButton?.addEventListener("click", openModal);

  closeButtons.forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  modal?.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  qrImage.addEventListener("error", () => {
    qrImage.src = placeholderSrc;
    downloadButton.href = placeholderSrc;
  });
};
