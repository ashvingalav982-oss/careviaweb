import React, { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';

export const LanguageSelector = ({ className = "" }: { className?: string }) => {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    // Try to get current lang from google translate cookie
    const match = document.cookie.match(/googtrans=\/en\/(en|hi)/);
    if (match && match[1]) {
      setLang(match[1]);
    }
  }, []);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLang = e.target.value;
    setLang(selectedLang);
    
    // Set google translate cookie manually just in case
    document.cookie = `googtrans=/en/${selectedLang}; path=/;`;
    document.cookie = `googtrans=/en/${selectedLang}; path=/; domain=${window.location.hostname};`;
    
    // Reload the page to apply the google translate cookie immediately to the whole site
    window.location.reload();
  };

  useEffect(() => {
    // Hide the default Google Translate element and top banner
    const style = document.createElement('style');
    style.innerHTML = `
      #google_translate_element { display: none !important; }
      .goog-te-banner-frame { display: none !important; }
      body { top: 0 !important; }
      .skiptranslate { display: none !important; }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <div className={`flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white hover:bg-white/10 transition-colors ${className}`}>
      <Globe className="w-4 h-4 text-primary" />
      <select 
        value={lang}
        onChange={handleLanguageChange}
        className="bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer appearance-none text-white [&>option]:bg-neutral-900"
      >
        <option value="en">English</option>
        <option value="hi">हिन्दी (Hindi)</option>
      </select>
    </div>
  );
};
