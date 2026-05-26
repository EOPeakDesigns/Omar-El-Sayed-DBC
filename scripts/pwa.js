const INSTALL_BANNER_DISMISSED_KEY = "install-banner-dismissed";

const readDismissedState = () => {
  try {
    return localStorage.getItem(INSTALL_BANNER_DISMISSED_KEY) === "true";
  } catch (error) {
    return false;
  }
};

const writeDismissedState = (value) => {
  try {
    if (value) {
      localStorage.setItem(INSTALL_BANNER_DISMISSED_KEY, "true");
    } else {
      localStorage.removeItem(INSTALL_BANNER_DISMISSED_KEY);
    }
  } catch (error) {
    // Ignore storage access issues and gracefully continue.
  }
};

export const initPwa = ({ getLabels, announce }) => {
  const installBanner = document.getElementById("installBanner");
  const installButton = document.getElementById("installButton");
  const dismissButton = document.getElementById("dismissInstallButton");
  let deferredPrompt;
  let installPromptRequested = false;

  const isStandaloneMode = () =>
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator.standalone === true;

  const showInstallBanner = () => {
    installBanner.hidden = false;
    installBanner.style.display = "flex";
    installBanner.setAttribute("aria-hidden", "false");
  };

  const hideInstallBanner = ({ persist = false } = {}) => {
    if (persist) {
      writeDismissedState(true);
    }

    installBanner.hidden = true;
    installBanner.style.display = "none";
    installBanner.setAttribute("aria-hidden", "true");
  };

  if (readDismissedState() || isStandaloneMode()) {
    hideInstallBanner();
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;

    if (readDismissedState() || isStandaloneMode()) {
      hideInstallBanner();
      return;
    }

    showInstallBanner();
  });

  installButton?.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!deferredPrompt) {
      return;
    }

    installPromptRequested = true;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice?.outcome === "accepted") {
      writeDismissedState(false);
      deferredPrompt = null;
      hideInstallBanner();
    } else {
      installPromptRequested = false;
      if (!readDismissedState() && !isStandaloneMode()) {
        showInstallBanner();
      }
    }
  });

  dismissButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    hideInstallBanner({ persist: true });
  });

  window.addEventListener("appinstalled", () => {
    if (!installPromptRequested && !isStandaloneMode()) {
      return;
    }

    writeDismissedState(false);
    deferredPrompt = null;
    installPromptRequested = false;
    hideInstallBanner();
    announce(getLabels().installTitle);
  });
};
