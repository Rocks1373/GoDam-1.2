// Utility function for getting the printable content element
export const getPrintableContent = (): HTMLElement | null => {
  const printSheet = document.querySelector(".print-preview-sheet");
  if (printSheet) {
    const card = printSheet.querySelector(".dn-preview-card, .dn-preview-panel");
    if (card) return card as HTMLElement;
  }
  return document.querySelector(".dn-preview-card") as HTMLElement;
};

