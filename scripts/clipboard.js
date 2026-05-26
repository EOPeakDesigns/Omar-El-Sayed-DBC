const legacyCopy = (value) => {
  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.className = "copy-helper";
  document.body.append(input);
  input.select();
  document.execCommand("copy");
  input.remove();
};

export const attachClipboardHandlers = ({ getLabels, announce }) => {
  const buttons = document.querySelectorAll("[data-copy-value]");

  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      const labels = getLabels();
      const value = button.dataset.copyValue ?? "";
      const messageKey = button.dataset.copyMessageKey ?? "";
      const message = labels[messageKey] ?? value;

      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(value);
        } else {
          legacyCopy(value);
        }

        button.dataset.copied = "true";
        announce(message);
        window.setTimeout(() => {
          delete button.dataset.copied;
        }, 1500);
      } catch (error) {
        announce(message);
      }
    });
  });
};
