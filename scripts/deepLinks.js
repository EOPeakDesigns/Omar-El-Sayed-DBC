const stripPhone = (value = "") => value.replace(/[^\d+]/g, "");

export const sanitizePhoneForTel = (phone = "") => stripPhone(phone);

export const sanitizePhoneForWhatsapp = (phone = "") =>
  stripPhone(phone).replace(/[^\d]/g, "");

export const formatPhoneNumber = (phone = "") => {
  const cleaned = sanitizePhoneForWhatsapp(phone);

  if (cleaned.length < 10) {
    return phone;
  }

  if (cleaned.length === 12) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }

  return `+${cleaned}`;
};

export const buildQuickActions = (card, labels, language) => {
  const whatsappPhone = sanitizePhoneForWhatsapp(card.contact.whatsapp);
  const telPhone = sanitizePhoneForTel(card.contact.phone);
  const displayName = card.person.name[language] ?? card.person.name.en;
  const mailSubject =
    language === "ar"
      ? `مرحباً ${displayName}، أرغب بالتواصل معك`
      : `Hello ${displayName}, I would love to connect`;
  const mailBody =
    language === "ar"
      ? "اطلعت على بطاقتك الرقمية وأرغب بمناقشة تعاون أو جلسة محتملة."
      : "I came across your digital business card and would love to discuss a possible collaboration.";
  const siteHost = new URL(card.contact.website).hostname.replace(/^www\./, "");

  return [
    {
      id: "whatsapp",
      label: labels.whatsapp,
      hint: formatPhoneNumber(card.contact.whatsapp),
      href: `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(mailBody)}`,
      icon: "whatsapp"
    },
    {
      id: "email",
      label: labels.email,
      hint: card.contact.email,
      href: `mailto:${card.contact.email}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`,
      icon: "email"
    },
    {
      id: "phone",
      label: labels.phone,
      hint: formatPhoneNumber(card.contact.phone),
      href: `tel:${telPhone}`,
      icon: "phone"
    },
    {
      id: "maps",
      label: labels.maps,
      hint: card.person.location[language],
      href: card.contact.maps,
      icon: "maps"
    },
    {
      id: "website",
      label: labels.website,
      hint: siteHost,
      href: card.contact.website,
      icon: "globe"
    }
  ];
};
