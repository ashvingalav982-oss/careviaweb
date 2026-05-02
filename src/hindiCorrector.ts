export function applyHindiCorrections() {
  const isHindi = document.cookie.includes('googtrans=/en/hi');
  if (!isHindi) return;

  const corrections: Record<string, string> = {
    'Domestic Help': 'घरेलू सहायक',
    'Child Care': 'बच्चों की देखभाल',
    'Elderly Care': 'बुजुर्गों की देखभाल',
    'Pet Care': 'पालतू जानवरों की देखभाल',
    'Helpers': 'सहायक',
    'Elite': 'उत्कृष्ट',
    'Compassion': 'करुणा',
    'Get Started': 'शुरू करें',
    'Our Packages': 'हमारे पैकेज',
    'Priority Medical Dispatch': 'प्राथमिकता चिकित्सा प्रेषण',
    'Active Partners': 'सक्रिय भागीदार'
  };

  const walkAndReplace = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      let text = node.nodeValue;
      if (text && text.trim() !== '') {
        let updated = text;
        for (const [en, hi] of Object.entries(corrections)) {
           // We use simple string replacement to avoid regex issues
           if (updated.includes(en)) {
             updated = updated.split(en).join(hi);
           }
        }
        if (updated !== text) {
          node.nodeValue = updated;
        }
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE') {
        node.childNodes.forEach(walkAndReplace);
      }
    }
  };

  // Run the corrector periodically to catch dynamically loaded content or Google Translate updates
  setInterval(() => {
    walkAndReplace(document.body);
  }, 1000);
}
