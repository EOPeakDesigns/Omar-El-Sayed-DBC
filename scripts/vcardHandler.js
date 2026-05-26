const createSlug = (value = "contact") =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

const buildVCard = (card, language) => {
  const name = card.person.name.en;
  const org = card.person.company[language];
  const title = card.person.title[language];
  const address = card.contact.address[language];

  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${name}`,
    `N:${name};;;;`,
    `ORG:${org}`,
    `TITLE:${title}`,
    `TEL;TYPE=CELL:${card.contact.phone}`,
    `EMAIL;TYPE=INTERNET:${card.contact.email}`,
    `URL:${card.contact.website}`,
    `ADR;TYPE=WORK:;;${address};;;;`,
    `NOTE:${card.person.bio[language]}`,
    "END:VCARD"
  ].join("\n");
};

const downloadFile = (fileName, content, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();

  window.setTimeout(() => URL.revokeObjectURL(url), 1500);

  return new File([blob], fileName, { type: mimeType });
};

export const setupVCardDownload = ({ getCard, getLanguage, getLabels, announce }) => {
  const button = document.getElementById("saveContactButton");

  button?.addEventListener("click", async () => {
    const card = getCard();
    const language = getLanguage();
    const labels = getLabels();
    const fileName = `${createSlug(card.person.name.en)}.vcf`;
    const vcard = buildVCard(card, language);
    const file = downloadFile(fileName, vcard, "text/vcard;charset=utf-8");

    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: card.person.name.en,
          text: labels.shareText
        });
      } catch (error) {
        // User dismissal should silently fall back to the downloaded file.
      }
    }

    announce(labels.downloadContact);
  });
};
