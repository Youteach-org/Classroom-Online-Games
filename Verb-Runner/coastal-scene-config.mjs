export const COASTAL_SCENE = Object.freeze({
  assetPath: './assets/verb-runner-coastal-target.webp',
  hideProceduralScenery: true,
  roadColor: 0x6a798b,
  sidewalkColor: 0xeadfce,
  backdrop: Object.freeze({
    width: 168,
    height: 63,
    y: 20.8,
    z: -166
  })
});

export function buildCoastalSceneSvg(){
  return \`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 720">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#55b8ef"/>
      <stop offset=".58" stop-color="#8ed6f0"/>
      <stop offset="1" stop-color="#dff4f5"/>
    </linearGradient>
    <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#25b7d8"/>
      <stop offset=".55" stop-color="#159fc7"/>
      <stop offset="1" stop-color="#087fae"/>
    </linearGradient>
    <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#72879a"/>
      <stop offset="1" stop-color="#536a7e"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4"/>
    </filter>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="7" stdDeviation="6" flood-color="#24455f" flood-opacity=".23"/>
    </filter>
  </defs>

  <rect width="1920" height="720" fill="url(#sky)"/>
  <g fill="#ffffff" opacity=".55">
    <ellipse cx="355" cy="110" rx="110" ry="29"/>
    <ellipse cx="470" cy="88" rx="92" ry="24"/>
    <ellipse cx="1210" cy="106" rx="120" ry="31"/>
    <ellipse cx="1350" cy="84" rx="85" ry="22"/>
  </g>

  <g id="mountain">
    <path d="M630 330 L760 260 L885 120 L1010 240 L1110 190 L1270 330 Z" fill="#6d8d85"/>
    <path d="M690 330 L805 270 L885 120 L925 205 L980 250 L1045 220 L1120 190 L1205 330 Z" fill="#769e83"/>
    <path d="M845 164 L885 120 L923 191 L894 181 Z" fill="#b2c5ac" opacity=".72"/>
    <path d="M1088 220 L1120 190 L1160 247 L1129 237 Z" fill="#c7c7aa" opacity=".48"/>
  </g>

  <path d="M0 310 H875 C780 358 690 405 610 720 H0 Z" fill="url(#sea)"/>
  <path d="M0 360 C150 345 360 365 605 470" fill="none" stroke="#8fe8ef" stroke-width="8" opacity=".35"/>
  <path d="M90 430 C260 410 430 430 620 510" fill="none" stroke="#b6f0ef" stroke-width="5" opacity=".35"/>
  <g fill="#f8f4de" opacity=".95">
    <path d="M305 340 l30 -72 l30 72 z"/>
    <rect x="332" y="340" width="5" height="37" fill="#796957"/>
    <path d="M195 392 l22 -53 l22 53 z"/>
    <rect x="216" y="392" width="4" height="28" fill="#796957"/>
  </g>

  <g opacity=".96" filter="url(#soft)">
    <path d="M860 316 C1010 250 1180 255 1360 322 L1360 350 L840 350 Z" fill="#bfd1b3"/>
    <g fill="#f2e3cf">
      <rect x="905" y="282" width="48" height="33"/><rect x="968" y="263" width="54" height="42"/>
      <rect x="1030" y="283" width="44" height="32"/><rect x="1084" y="245" width="58" height="47"/>
      <rect x="1150" y="271" width="47" height="40"/><rect x="1205" y="251" width="52" height="44"/>
      <rect x="1266" y="286" width="45" height="33"/>
    </g>
    <g fill="#b76d49">
      <path d="M900 282 l29 -18 l29 18z"/><path d="M963 263 l32 -19 l32 19z"/>
      <path d="M1026 283 l26 -17 l26 17z"/><path d="M1080 245 l33 -19 l34 19z"/>
      <path d="M1146 271 l27 -18 l28 18z"/><path d="M1200 251 l30 -18 l31 18z"/>
      <path d="M1262 286 l27 -17 l27 17z"/>
    </g>
  </g>

  <path d="M875 336 L1045 336 L1535 720 L385 720 Z" fill="url(#road)"/>
  <path d="M875 336 L385 720 L255 720 L815 336 Z" fill="#eadfce"/>
  <path d="M1045 336 L1535 720 L1665 720 L1105 336 Z" fill="#eadfce"/>
  <path d="M875 336 L385 720" stroke="#f6f2e9" stroke-width="8" opacity=".82"/>
  <path d="M1045 336 L1535 720" stroke="#f6f2e9" stroke-width="8" opacity=".82"/>
  <g stroke="#f7f2df" stroke-width="8" stroke-linecap="round" opacity=".92">
    <path d="M938 358 L915 395"/><path d="M975 358 L995 395"/>
    <path d="M900 430 L850 505"/><path d="M1015 430 L1065 505"/>
    <path d="M805 585 L740 690"/><path d="M1110 585 L1175 690"/>
  </g>

  <g id="promenade" filter="url(#shadow)">
    <path d="M0 538 L602 425" stroke="#355c6b" stroke-width="10"/>
    <path d="M0 562 L610 443" stroke="#355c6b" stroke-width="6"/>
    <g stroke="#355c6b" stroke-width="7">
      <path d="M105 525 v92"/><path d="M250 497 v86"/><path d="M385 470 v78"/><path d="M505 447 v70"/>
    </g>

    <path d="M128 530 C128 430 140 295 165 190" stroke="#9b613c" stroke-width="35" fill="none"/>
    <path d="M162 300 C110 255 80 214 52 167" stroke="#9b613c" stroke-width="22" fill="none"/>
    <path d="M165 278 C230 230 270 188 312 142" stroke="#9b613c" stroke-width="19" fill="none"/>
    <g fill="#65a84f">
      <circle cx="95" cy="145" r="92"/><circle cx="192" cy="118" r="105"/><circle cx="290" cy="132" r="96"/>
      <circle cx="52" cy="205" r="78"/><circle cx="245" cy="205" r="83"/>
    </g>
    <g fill="#7cbc55" opacity=".9">
      <circle cx="128" cy="97" r="56"/><circle cx="255" cy="92" r="60"/><circle cx="58" cy="150" r="47"/>
    </g>

    <g fill="#233d4d">
      <rect x="112" y="260" width="13" height="310" rx="6"/>
      <path d="M82 265 h73 l-15 -55 h-43z"/>
      <rect x="94" y="220" width="48" height="52" rx="6" fill="#fff0c5"/>
      <rect x="475" y="362" width="9" height="155" rx="4"/>
      <path d="M458 364 h42 l-8 -32 h-26z"/>
      <rect x="466" y="335" width="26" height="30" rx="4" fill="#fff0c5"/>
    </g>

    <rect x="132" y="275" width="92" height="166" rx="5" fill="#2f8bb1"/>
    <path d="M168 368 l17 -34 l18 34 z" fill="#f7f0d9"/>
    <path d="M162 379 q23 18 48 0" fill="none" stroke="#f7f0d9" stroke-width="5"/>
    <rect x="226" y="274" width="112" height="184" rx="5" fill="#e8b84e"/>
    <text x="282" y="323" text-anchor="middle" font-family="Trebuchet MS" font-size="25" font-weight="700" fill="#45535c">Good</text>
    <text x="282" y="354" text-anchor="middle" font-family="Trebuchet MS" font-size="25" font-weight="700" fill="#45535c">Food</text>
    <text x="282" y="385" text-anchor="middle" font-family="Trebuchet MS" font-size="25" font-weight="700" fill="#45535c">Brighter</text>
    <text x="282" y="416" text-anchor="middle" font-family="Trebuchet MS" font-size="25" font-weight="700" fill="#45535c">Days</text>

    <g transform="translate(200 530)">
      <rect x="0" y="0" width="188" height="20" rx="8" fill="#9a653f"/>
      <rect x="6" y="-55" width="176" height="18" rx="7" fill="#9a653f"/>
      <rect x="16" y="20" width="12" height="55" fill="#314b58"/>
      <rect x="160" y="20" width="12" height="55" fill="#314b58"/>
    </g>

    <path d="M320 606 h110 l-18 80 h-74z" fill="#b66e4d"/>
    <g fill="#4e9d54"><circle cx="346" cy="616" r="28"/><circle cx="383" cy="613" r="27"/></g>
    <g fill="#f36b78"><circle cx="338" cy="594" r="18"/><circle cx="368" cy="579" r="17"/><circle cx="399" cy="596" r="19"/></g>
    <g fill="#f2c95b"><circle cx="355" cy="603" r="15"/><circle cx="386" cy="579" r="14"/></g>

    <g fill="#4c9850" stroke="#a96f42" stroke-width="8">
      <path d="M560 480 C565 450 570 420 575 387"/><circle cx="575" cy="382" r="37" fill="#5fae57" stroke="none"/>
      <path d="M640 430 C644 407 648 387 652 365"/><circle cx="652" cy="361" r="29" fill="#61ad59" stroke="none"/>
      <path d="M702 398 C705 382 708 368 711 351"/><circle cx="711" cy="347" r="23" fill="#62ad59" stroke="none"/>
    </g>
  </g>

  <g filter="url(#shadow)">
    <rect x="1290" y="260" width="215" height="260" fill="#f3efe6"/>
    <path d="M1270 270 l128 -68 l128 68z" fill="#b96c45"/>
    <rect x="1325" y="308" width="46" height="70" rx="3" fill="#3c8b83"/>
    <rect x="1430" y="304" width="44" height="74" rx="3" fill="#3c8b83"/>
    <rect x="1332" y="415" width="52" height="88" fill="#3b6e78"/>
    <rect x="1417" y="416" width="58" height="87" fill="#3b6e78"/>
    <g fill="#e76d7b"><circle cx="1348" cy="397" r="12"/><circle cx="1366" cy="392" r="13"/><circle cx="1440" cy="395" r="12"/><circle cx="1459" cy="391" r="13"/></g>

    <rect x="1480" y="215" width="270" height="360" fill="#efc45d"/>
    <path d="M1455 230 l164 -82 l162 82z" fill="#b76240"/>
    <rect x="1515" y="280" width="52" height="80" fill="#3f8879"/>
    <rect x="1645" y="278" width="50" height="83" fill="#3f8879"/>
    <rect x="1537" y="405" width="82" height="151" rx="30" fill="#7b4f34"/>
    <rect x="1551" y="423" width="54" height="116" rx="23" fill="#538699"/>
    <g fill="#ef6f8c"><circle cx="1560" cy="245" r="16"/><circle cx="1586" cy="238" r="18"/><circle cx="1693" cy="232" r="18"/></g>

    <rect x="1450" y="340" width="110" height="84" rx="6" fill="#6f4935"/>
    <text x="1505" y="373" text-anchor="middle" font-family="Trebuchet MS" font-size="23" fill="#fff4e1">☕</text>
    <text x="1505" y="405" text-anchor="middle" font-family="Trebuchet MS" font-size="20" fill="#fff4e1">Café Vida</text>

    <g transform="translate(1295 455)">
      <rect width="180" height="26" fill="#2f9ccc"/>
      <path d="M0 26 h180 l-14 34 h-152z" fill="#67bfe1"/>
      <path d="M0 26 l30 34 h30 l-30 -34zm60 0 l30 34h30l-30-34zm60 0l30 34h30l-30-34z" fill="#f5efe3" opacity=".78"/>
    </g>

    <rect x="1710" y="185" width="210" height="430" fill="#edbe52"/>
    <path d="M1695 198 l120 -67 l125 67z" fill="#b85e40"/>
    <rect x="1742" y="248" width="50" height="74" fill="#3e8b73"/>
    <rect x="1840" y="242" width="48" height="82" fill="#3e8b73"/>

    <rect x="1688" y="345" width="232" height="78" rx="8" fill="#f7f1db" stroke="#6f8b67" stroke-width="6"/>
    <text x="1804" y="395" text-anchor="middle" font-family="Georgia" font-size="38" font-weight="700" fill="#3e7a4c">La Tiendita</text>

    <g transform="translate(1668 425)">
      <rect width="252" height="30" fill="#f5e5cf"/>
      <path d="M0 0 h42 v82 h-42z M84 0 h42v82h-42z M168 0h42v82h-42z" fill="#e85d5a"/>
      <path d="M0 82 q21 26 42 0 q21 26 42 0 q21 26 42 0 q21 26 42 0 q21 26 42 0 q21 26 42 0" fill="none" stroke="#f5e5cf" stroke-width="10"/>
    </g>

    <g id="Frutas">
      <rect x="1662" y="535" width="258" height="160" fill="#8e5937"/>
      <rect x="1682" y="550" width="218" height="34" fill="#6e4932"/>
      <rect x="1682" y="604" width="218" height="34" fill="#6e4932"/>
      <g>
        <circle cx="1705" cy="566" r="13" fill="#f08a2f"/><circle cx="1732" cy="566" r="13" fill="#e84a45"/>
        <circle cx="1760" cy="566" r="13" fill="#6ea34b"/><circle cx="1788" cy="566" r="13" fill="#efc94e"/>
        <circle cx="1818" cy="566" r="13" fill="#ee7236"/><circle cx="1847" cy="566" r="13" fill="#d94743"/>
        <circle cx="1875" cy="566" r="13" fill="#5fa44b"/>
      </g>
      <g>
        <circle cx="1705" cy="621" r="13" fill="#65a64e"/><circle cx="1732" cy="621" r="13" fill="#f1c848"/>
        <circle cx="1760" cy="621" r="13" fill="#eb5b45"/><circle cx="1788" cy="621" r="13" fill="#ed8b32"/>
        <circle cx="1818" cy="621" r="13" fill="#62a44c"/><circle cx="1847" cy="621" r="13" fill="#f1c94b"/>
        <circle cx="1875" cy="621" r="13" fill="#e64a42"/>
      </g>
    </g>

    <rect x="1530" y="535" width="110" height="150" rx="5" fill="#3e4544" stroke="#9b683e" stroke-width="10"/>
    <text x="1585" y="575" text-anchor="middle" font-family="Trebuchet MS" font-size="24" fill="#f6efe2">Frutas</text>
    <text x="1585" y="607" text-anchor="middle" font-family="Trebuchet MS" font-size="21" fill="#f6efe2">Verduras</text>
    <text x="1585" y="639" text-anchor="middle" font-family="Trebuchet MS" font-size="20" fill="#f6efe2">Siempre</text>
    <text x="1585" y="670" text-anchor="middle" font-family="Trebuchet MS" font-size="20" fill="#f6efe2">Fresco</text>

    <g fill="#4c9451"><circle cx="1860" cy="334" r="55"/><circle cx="1780" cy="352" r="42"/></g>
    <g fill="#f06c91"><circle cx="1850" cy="305" r="14"/><circle cx="1881" cy="323" r="13"/><circle cx="1810" cy="328" r="12"/></g>
  </g>

  <rect width="1920" height="720" fill="#ffd889" opacity=".08"/>
</svg>\`;
}
