export interface PresetAvatar {
    id: string;
    titleUk: string;
    titleEn: string;
    svgDataUri: string;
}

const encodeSvg = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;

export const PRESET_AVATARS: PresetAvatar[] = [
    {
        id: 'cyberpunk-dj',
        titleUk: 'Кіберпанк DJ',
        titleEn: 'Cyberpunk DJ',
        svgDataUri: encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bg_cdj" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0d0221"/>
      <stop offset="100%" stop-color="#19053b"/>
    </linearGradient>
    <linearGradient id="neon_pink" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff007f"/>
      <stop offset="100%" stop-color="#ff00ff"/>
    </linearGradient>
    <linearGradient id="neon_cyan" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f3ff"/>
      <stop offset="100%" stop-color="#0066ff"/>
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="60" fill="url(#bg_cdj)"/>
  <circle cx="60" cy="60" r="56" fill="none" stroke="url(#neon_cyan)" stroke-width="3" stroke-dasharray="8, 4"/>
  <path d="M 30 65 A 30 30 0 0 1 90 65" fill="none" stroke="url(#neon_pink)" stroke-width="6" stroke-linecap="round"/>
  <circle cx="60" cy="65" r="24" fill="#1b113a"/>
  <rect x="42" y="58" width="36" height="12" rx="4" fill="url(#neon_cyan)"/>
  <line x1="44" y1="64" x2="76" y2="64" stroke="#ffffff" stroke-width="2" stroke-dasharray="3, 3"/>
  <rect x="23" y="58" width="12" height="22" rx="5" fill="url(#neon_pink)"/>
  <rect x="85" y="58" width="12" height="22" rx="5" fill="url(#neon_pink)"/>
  <rect x="48" y="78" width="4" height="8" rx="2" fill="#00f3ff"/>
  <rect x="54" y="76" width="4" height="12" rx="2" fill="#ff007f"/>
  <rect x="62" y="75" width="4" height="14" rx="2" fill="#ffd700"/>
  <rect x="68" y="78" width="4" height="8" rx="2" fill="#00f3ff"/>
</svg>
`),
    },
    {
        id: 'retro-cassette',
        titleUk: 'Ретро Касета',
        titleEn: 'Retro Cassette',
        svgDataUri: encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bg_rc" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#120422"/>
      <stop offset="100%" stop-color="#2a0845"/>
    </linearGradient>
    <linearGradient id="gold_grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffe600"/>
      <stop offset="100%" stop-color="#ff5e00"/>
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="60" fill="url(#bg_rc)"/>
  <circle cx="60" cy="60" r="56" fill="none" stroke="url(#gold_grad)" stroke-width="3"/>
  <rect x="25" y="38" width="70" height="44" rx="6" fill="#25123d" stroke="#ff007f" stroke-width="2"/>
  <rect x="33" y="44" width="54" height="24" rx="3" fill="#3b1b61"/>
  <circle cx="45" cy="56" r="8" fill="#11051e" stroke="#00f3ff" stroke-width="2"/>
  <circle cx="75" cy="56" r="8" fill="#11051e" stroke="#00f3ff" stroke-width="2"/>
  <circle cx="45" cy="56" r="3" fill="#ffffff"/>
  <circle cx="75" cy="56" r="3" fill="#ffffff"/>
  <line x1="53" y1="56" x2="67" y2="56" stroke="#ff007f" stroke-width="2"/>
  <text x="60" y="76" fill="#ffe600" font-family="monospace" font-size="7" font-weight="bold" text-anchor="middle">SONGUESS 90</text>
</svg>
`),
    },
    {
        id: 'vinyl-master',
        titleUk: 'Вініловий Магістр',
        titleEn: 'Vinyl Master',
        svgDataUri: encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bg_vm" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050510"/>
      <stop offset="100%" stop-color="#14142b"/>
    </linearGradient>
    <linearGradient id="neon_gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffd700"/>
      <stop offset="100%" stop-color="#ff8800"/>
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="60" fill="url(#bg_vm)"/>
  <circle cx="60" cy="60" r="56" fill="none" stroke="url(#neon_gold)" stroke-width="3"/>
  <circle cx="60" cy="60" r="42" fill="#111116" stroke="#222233" stroke-width="2"/>
  <circle cx="60" cy="60" r="34" fill="none" stroke="#2c2c3e" stroke-width="1.5" stroke-dasharray="12, 6"/>
  <circle cx="60" cy="60" r="26" fill="none" stroke="#3d3d56" stroke-width="1.5" stroke-dasharray="18, 8"/>
  <circle cx="60" cy="60" r="16" fill="url(#neon_gold)"/>
  <circle cx="60" cy="60" r="5" fill="#050510"/>
  <path d="M 35 40 Q 60 55 65 30" stroke="rgba(255,255,255,0.4)" stroke-width="4" stroke-linecap="round" fill="none"/>
  <path d="M 85 80 Q 60 65 55 90" stroke="rgba(255,255,255,0.3)" stroke-width="4" stroke-linecap="round" fill="none"/>
</svg>
`),
    },
    {
        id: 'synthwave-star',
        titleUk: 'Синтвейв Зірка',
        titleEn: 'Synthwave Star',
        svgDataUri: encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bg_sw" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1b003a"/>
      <stop offset="100%" stop-color="#4a0e4e"/>
    </linearGradient>
    <linearGradient id="sun_grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffe600"/>
      <stop offset="50%" stop-color="#ff007f"/>
      <stop offset="100%" stop-color="#800080"/>
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="60" fill="url(#bg_sw)"/>
  <circle cx="60" cy="60" r="56" fill="none" stroke="#ff007f" stroke-width="3"/>
  <circle cx="60" cy="54" r="26" fill="url(#sun_grad)"/>
  <rect x="34" y="52" width="52" height="2.5" fill="#1b003a"/>
  <rect x="34" y="58" width="52" height="3" fill="#1b003a"/>
  <rect x="34" y="65" width="52" height="4" fill="#1b003a"/>
  <path d="M 20 85 L 100 85 M 24 95 L 96 95 M 32 105 L 88 105" stroke="#00f3ff" stroke-width="1.5"/>
  <line x1="60" y1="85" x2="60" y2="115" stroke="#00f3ff" stroke-width="1.5"/>
  <line x1="45" y1="85" x2="35" y2="115" stroke="#00f3ff" stroke-width="1.5"/>
  <line x1="75" y1="85" x2="85" y2="115" stroke="#00f3ff" stroke-width="1.5"/>
</svg>
`),
    },
    {
        id: 'pixel-beats',
        titleUk: 'Піксель Рокер',
        titleEn: 'Pixel Rocker',
        svgDataUri: encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <rect width="120" height="120" rx="60" fill="#0b1b2b"/>
  <circle cx="60" cy="60" r="56" fill="none" stroke="#39ff14" stroke-width="3"/>
  <rect x="42" y="32" width="8" height="24" fill="#39ff14"/>
  <rect x="70" y="24" width="8" height="32" fill="#39ff14"/>
  <rect x="42" y="24" width="36" height="10" fill="#39ff14"/>
  <rect x="32" y="52" width="18" height="16" rx="4" fill="#ff0055"/>
  <rect x="60" y="52" width="18" height="16" rx="4" fill="#ff0055"/>
  <rect x="36" y="74" width="20" height="10" fill="#00f3ff"/>
  <rect x="64" y="74" width="20" height="10" fill="#00f3ff"/>
  <rect x="56" y="76" width="8" height="4" fill="#00f3ff"/>
  <rect x="52" y="92" width="16" height="4" fill="#ffffff"/>
</svg>
`),
    },
    {
        id: 'bass-cat',
        titleUk: 'Кібер-Кіт Меломан',
        titleEn: 'Cyber Bass Cat',
        svgDataUri: encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bg_bc" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18002e"/>
      <stop offset="100%" stop-color="#2c004d"/>
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="60" fill="url(#bg_bc)"/>
  <circle cx="60" cy="60" r="56" fill="none" stroke="#bd00ff" stroke-width="3"/>
  <polygon points="36,44 48,22 54,44" fill="#ff007f"/>
  <polygon points="84,44 72,22 66,44" fill="#ff007f"/>
  <polygon points="40,42 48,28 52,42" fill="#ffffff"/>
  <polygon points="80,42 72,28 68,42" fill="#ffffff"/>
  <circle cx="60" cy="64" r="28" fill="#201035"/>
  <path d="M 28 62 A 32 32 0 0 1 92 62" fill="none" stroke="#00f3ff" stroke-width="5" stroke-linecap="round"/>
  <rect x="22" y="56" width="10" height="20" rx="4" fill="#00f3ff"/>
  <rect x="88" y="56" width="10" height="20" rx="4" fill="#00f3ff"/>
  <ellipse cx="48" cy="62" rx="5" ry="6" fill="#00ffcc"/>
  <ellipse cx="72" cy="62" rx="5" ry="6" fill="#00ffcc"/>
  <ellipse cx="49" cy="62" rx="2" ry="4" fill="#18002e"/>
  <ellipse cx="71" cy="62" rx="2" ry="4" fill="#18002e"/>
  <polygon points="58,72 62,72 60,75" fill="#ff007f"/>
  <line x1="38" y1="74" x2="26" y2="72" stroke="#bd00ff" stroke-width="1.5"/>
  <line x1="38" y1="77" x2="28" y2="80" stroke="#bd00ff" stroke-width="1.5"/>
  <line x1="82" y1="74" x2="94" y2="72" stroke="#bd00ff" stroke-width="1.5"/>
  <line x1="82" y1="77" x2="92" y2="80" stroke="#bd00ff" stroke-width="1.5"/>
</svg>
`),
    },
];