import { initAnimations } from "./animations.js";
import { attachClipboardHandlers } from "./clipboard.js";
import { formatPhoneNumber, sanitizePhoneForTel } from "./deepLinks.js";
import { createAnnouncer, initAccessibility } from "./accessibility.js";
import { initPwa } from "./pwa.js";
import { setupQrModal } from "./qrHandler.js";
import { setupVideoModal } from "./videoHandler.js";
import { setupVCardDownload } from "./vcardHandler.js";

const THEME_ORDER = ["system", "dark", "light"];
const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");

const uiCopy = {
  en: {
    themeNames: {
      system: "Auto",
      dark: "Dark",
      light: "Light"
    },
    shareCopied: "Card link copied to clipboard."
  },
  ar: {
    themeNames: {
      system: "تلقائي",
      dark: "داكن",
      light: "فاتح"
    },
    shareCopied: "تم نسخ رابط البطاقة."
  }
};

const iconMap = {
  facebook:
    '<path d="M13.25 21v-7.03h2.36l.35-2.74h-2.71V9.48c0-.8.22-1.34 1.36-1.34H16V5.66a16.88 16.88 0 0 0-1.97-.1c-1.95 0-3.28 1.19-3.28 3.37v2.3H8.5v2.74h2.24V21h2.5Z"/>',
  instagram:
    '<path d="M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3Zm0 1.8a2.7 2.7 0 0 0-2.7 2.7v9a2.7 2.7 0 0 0 2.7 2.7h9a2.7 2.7 0 0 0 2.7-2.7v-9a2.7 2.7 0 0 0-2.7-2.7h-9Zm4.5 2.5A4.7 4.7 0 1 1 7.3 12 4.7 4.7 0 0 1 12 7.3Zm0 1.8A2.9 2.9 0 1 0 14.9 12 2.9 2.9 0 0 0 12 9.1Zm5.2-2.14a1.08 1.08 0 1 1-1.08-1.08 1.08 1.08 0 0 1 1.08 1.08Z"/>',
  x: '<path d="M18.9 4H21l-4.6 5.26L21.8 20h-4.23l-3.31-4.73L10.1 20H8l4.93-5.64L7.1 4h4.33l2.99 4.28L18.9 4Z"/>',
  linkedin:
    '<path d="M5.26 8.5H8.4V19H5.26V8.5Zm1.58-4.5a1.83 1.83 0 1 1-1.82 1.82A1.83 1.83 0 0 1 6.84 4Zm3.54 4.5h3V10a3.35 3.35 0 0 1 3-1.65c3.19 0 3.78 2.1 3.78 4.83V19H17v-4.98c0-1.19-.02-2.72-1.66-2.72s-1.92 1.3-1.92 2.64V19h-3.04V8.5Z"/>',
  globe:
    '<path d="M5 5.5A2.5 2.5 0 0 1 7.5 3h9A2.5 2.5 0 0 1 19 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 18.5v-13Zm2 .5v2h10V6H7Zm0 4v8h10v-8H7Zm2 1.5h2v2H9v-2Zm3.5 0H15a1 1 0 1 1 0 2h-2.5a1 1 0 1 1 0-2Z"/>'
};

const state = {
  card: null,
  language: localStorage.getItem("card-language") || "en",
  themePreference: localStorage.getItem("card-theme") || "system"
};

const announce = createAnnouncer();
const getLabels = () => state.card.labels[state.language];
const getUiCopy = () => uiCopy[state.language];
const getActiveTheme = () =>
  state.themePreference === "system"
    ? systemThemeQuery.matches
      ? "dark"
      : "light"
    : state.themePreference;

const getIconSvg = (name) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true">${iconMap[name] || iconMap.globe}</svg>`;

const getDeployedUrl = () => {
  const { protocol, href } = window.location;
  if (protocol === "http:" || protocol === "https:") {
    return href.split("#")[0];
  }

  return state.card?.site.url ?? href;
};

const updateMetaTag = (selector, value) => {
  const element = document.querySelector(selector);
  if (element && value) {
    element.setAttribute("content", value);
  }
};

const updateLinkHref = (selector, value) => {
  const element = document.querySelector(selector);
  if (element && value) {
    element.setAttribute("href", value);
  }
};

const setThemeMeta = () => {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    return;
  }

  meta.content = getActiveTheme() === "dark" ? "#013e37" : "#ffefb3";
};

const applyTheme = () => {
  const button = document.getElementById("themeToggle");
  const currentTheme = getActiveTheme();
  const labels = state.card ? getLabels() : { theme: "Theme" };
  const themeLabel = getUiCopy().themeNames[state.themePreference];

  document.documentElement.dataset.theme = currentTheme;
  document.getElementById("themeToggleText").textContent = themeLabel;
  button?.setAttribute("aria-label", `${labels.theme}: ${themeLabel}`);
  button?.setAttribute("title", `${labels.theme}: ${themeLabel}`);
  setThemeMeta();
};

const renderTokenCopy = () => {
  const labels = getLabels();
  const languageToggleLabel =
    state.language === "en" ? "Switch language to Arabic" : "تبديل اللغة إلى الإنجليزية";

  document.querySelectorAll("[data-copy]").forEach((element) => {
    const key = element.dataset.copy;
    if (labels[key]) {
      element.textContent = labels[key];
    }
  });

  document.getElementById("installTitle").textContent = labels.installTitle;
  document.getElementById("installBody").textContent = labels.installBody;
  document.getElementById("installButton").textContent = labels.installButton;
  document.getElementById("dismissInstallButton").textContent = labels.dismiss;
  document.getElementById("languageToggleText").textContent = labels.language;
  document.getElementById("showQrButton").setAttribute("aria-label", labels.showQr);
  document.getElementById("showQrButton").setAttribute("title", labels.showQr);
  document.getElementById("copyEmailButton").setAttribute("aria-label", labels.copyEmail);
  document.getElementById("copyPhoneButton").setAttribute("aria-label", labels.copyPhone);
  document.getElementById("copyEmailButton").setAttribute("title", labels.copyEmail);
  document.getElementById("copyPhoneButton").setAttribute("title", labels.copyPhone);
  document.getElementById("saveContactButton").setAttribute("title", labels.saveContact);
  document.getElementById("shareButton").setAttribute("title", labels.shareCard);
  document.getElementById("languageToggle").setAttribute("aria-label", languageToggleLabel);
  document.getElementById("languageToggle").setAttribute("title", languageToggleLabel);
};

const renderProfile = () => {
  const { card, language } = state;
  const labels = getLabels();
  const profileImage = document.getElementById("profileImage");
  const coverImage = document.getElementById("coverImage");
  const avatarShell = document.getElementById("avatarShell");
  const openVideoButton = document.getElementById("openVideoButton");
  const videoTriggerHint = document.getElementById("videoTriggerHint");
  const hasFeatureVideo = Boolean(card.person.featureVideo?.src);
  const avatarCandidates = [
    "assets/onwer.png",
    "assets/owner.png",
    card.person.avatar,
    "assets/images/profile-portrait.svg"
  ];
  let avatarIndex = 0;

  const applyAvatarSource = (index) => {
    const source = avatarCandidates[index];
    const isOwnerImage = /assets\/(onwer|owner)\.png$/i.test(source);

    profileImage.dataset.sourceType = isOwnerImage ? "owner" : "default";
    profileImage.src = source;
  };

  profileImage.onerror = () => {
    avatarIndex += 1;

    if (avatarIndex < avatarCandidates.length) {
      applyAvatarSource(avatarIndex);
    } else {
      profileImage.onerror = null;
    }
  };

  applyAvatarSource(avatarIndex);
  profileImage.alt =
    language === "ar" ? `صورة ${card.person.name.ar}` : `Portrait of ${card.person.name.en}`;

  if (card.person.cover) {
    coverImage.src = card.person.cover;
  }

  document.getElementById("personName").textContent = card.person.name[language];
  document.getElementById("personTitle").textContent = card.person.title[language];
  document.getElementById("personBio").textContent = card.person.bio[language];
  avatarShell.dataset.hasVideo = String(hasFeatureVideo);
  openVideoButton.disabled = !hasFeatureVideo;
  openVideoButton.setAttribute("aria-label", labels.watchVideo);
  openVideoButton.setAttribute("title", labels.watchVideo);
  videoTriggerHint.textContent = labels.watchVideo;
};

const renderContactDetails = () => {
  const { card, language } = state;
  const labels = getLabels();
  const telPhone = sanitizePhoneForTel(card.contact.phone);
  const websiteHost = new URL(card.contact.website).hostname.replace(/^www\./, "");

  document.getElementById("phoneLink").href = `tel:${telPhone}`;
  document.getElementById("phoneValue").textContent = formatPhoneNumber(card.contact.phone);
  document.getElementById("emailLink").href = `mailto:${card.contact.email}`;
  document.getElementById("emailValue").textContent = card.contact.email;
  document.getElementById("websiteLink").href = card.contact.website;
  document.getElementById("websiteValue").textContent = websiteHost;
  document.getElementById("addressLink").href = card.contact.maps;
  document.getElementById("addressValue").textContent = card.contact.address[language];
  document.getElementById("copyPhoneButton").dataset.copyValue = card.contact.phone;
  document.getElementById("copyEmailButton").dataset.copyValue = card.contact.email;
  document.getElementById("phoneLink").setAttribute("aria-label", `${labels.phone}: ${card.contact.phone}`);
  document.getElementById("emailLink").setAttribute("aria-label", `${labels.email}: ${card.contact.email}`);
  document.getElementById("websiteLink").setAttribute("aria-label", `${labels.website}: ${websiteHost}`);
  document.getElementById("addressLink").setAttribute("aria-label", `${labels.maps}: ${card.contact.address[language]}`);
};

const renderSocials = () => {
  const socialGrid = document.getElementById("socialGrid");

  socialGrid.innerHTML = state.card.socials
    .map(
      (social) => `
        <a class="social-link" href="${social.url}" target="_blank" rel="noopener" aria-label="${social.label}" title="${social.label}">
          <span class="social-link__glyph">
            ${getIconSvg(social.id)}
          </span>
        </a>
      `
    )
    .join("");
};

const renderSeoAndDocument = () => {
  const cardName = state.card.person.name[state.language];
  const title =
    state.language === "ar"
      ? `${cardName} | بطاقة تصوير رقمية`
      : `${cardName} | Photographer Digital Card`;
  const pageDescription =
    state.language === "ar" ? state.card.site.tagline.ar : state.card.site.tagline.en;
  const deployedUrl = getDeployedUrl();

  document.title = title;
  document.documentElement.lang = state.language;
  document.documentElement.dir = state.language === "ar" ? "rtl" : "ltr";

  updateMetaTag('meta[name="description"]', pageDescription);
  updateMetaTag('meta[property="og:title"]', title);
  updateMetaTag('meta[property="og:description"]', pageDescription);
  updateMetaTag('meta[property="og:url"]', deployedUrl);
  updateMetaTag('meta[name="twitter:title"]', title);
  updateMetaTag('meta[name="twitter:description"]', pageDescription);
  updateLinkHref('link[rel="canonical"]', deployedUrl);
};

const renderApp = () => {
  renderSeoAndDocument();
  renderTokenCopy();
  renderProfile();
  renderContactDetails();
  renderSocials();
  applyTheme();
};

const setupThemeToggle = () => {
  const button = document.getElementById("themeToggle");

  button?.addEventListener("click", () => {
    const currentIndex = THEME_ORDER.indexOf(state.themePreference);
    state.themePreference = THEME_ORDER[(currentIndex + 1) % THEME_ORDER.length];
    localStorage.setItem("card-theme", state.themePreference);
    applyTheme();
  });

  systemThemeQuery.addEventListener?.("change", () => {
    if (state.themePreference === "system") {
      applyTheme();
    }
  });
};

const setupLanguageToggle = () => {
  const button = document.getElementById("languageToggle");

  button?.addEventListener("click", () => {
    state.language = state.language === "en" ? "ar" : "en";
    localStorage.setItem("card-language", state.language);
    renderApp();
  });
};

const setupShare = () => {
  const button = document.getElementById("shareButton");

  button?.addEventListener("click", async () => {
    const labels = getLabels();
    const shareUrl = getDeployedUrl();

    try {
      if (navigator.share) {
        await navigator.share({
          title: labels.shareTitle,
          text: labels.shareText,
          url: shareUrl
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }

      announce(getUiCopy().shareCopied);
    } catch (error) {
      announce(getUiCopy().shareCopied);
    }
  });
};

const loadCardData = async () => {
  const response = await fetch("./data/card.json", { cache: "no-cache" });
  if (!response.ok) {
    throw new Error("Card data could not be loaded.");
  }

  return response.json();
};

const init = async () => {
  initAccessibility();
  state.card = await loadCardData();
  renderApp();
  initAnimations();
  setupThemeToggle();
  setupLanguageToggle();
  setupShare();
  attachClipboardHandlers({ getLabels, announce });
  setupVCardDownload({
    getCard: () => state.card,
    getLanguage: () => state.language,
    getLabels,
    announce
  });
  setupQrModal({
    getCard: () => state.card,
    getLabels,
    announce
  });
  setupVideoModal({
    getCard: () => state.card,
    getLanguage: () => state.language,
    getLabels
  });
  initPwa({
    getLabels,
    announce
  });
};

init().catch((error) => {
  document.getElementById("liveRegion").textContent = error.message;
});
