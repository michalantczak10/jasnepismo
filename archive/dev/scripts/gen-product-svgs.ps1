$d = 'C:\Users\Michał Antczak\OneDrive\Projekty\szkolnegazetki\img\products'

function sv($n, $c1, $c2, $e, $l) {
  $s = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="$c1"/>
      <stop offset="100%" stop-color="$c2"/>
    </linearGradient>
  </defs>
  <rect width="400" height="260" fill="url(#g)"/>
  <circle cx="50" cy="50" r="80" fill="#fff" fill-opacity=".07"/>
  <circle cx="370" cy="220" r="100" fill="#fff" fill-opacity=".05"/>
  <text x="200" y="105" font-size="80" text-anchor="middle" dominant-baseline="middle" font-family="'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif">$e</text>
  <rect x="0" y="190" width="400" height="70" fill="#000" fill-opacity=".25"/>
  <text x="200" y="230" font-size="20" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-family="Arial,sans-serif">$l</text>
</svg>
"@
  [System.IO.File]::WriteAllText("$d\prod-$n.svg", $s, [System.Text.Encoding]::UTF8)
}

sv 'poster'                          '#1D4ED8' '#312E81' '🎨' 'Plakaty A3'
sv 'poster-a4'                       '#1D4ED8' '#1E40AF' '📄' 'Plakaty A4'
sv 'newsletter'                      '#7C3AED' '#4C1D95' '📰' 'Szablony PDF'
sv 'newsletter-classic'              '#7C3AED' '#5B21B6' '📋' 'Szablon Klasyczny'
sv 'boze-narodzenie-zestaw'          '#14532D' '#7F1D1D' '🎁' 'Zestaw Swiateczny'
sv 'boze-narodzenie-plakaty'         '#14532D' '#7F1D1D' '🎄' 'Plakaty PDF'
sv 'zima-plakaty'                    '#0EA5E9' '#1E3A5F' '❄️' 'Plakaty PDF'
sv 'zima-szablony'                   '#0EA5E9' '#0369A1' '⛄' 'Szablony PDF'
sv 'walentynki-plakaty'              '#BE123C' '#7F1D1D' '❤️' 'Plakaty PDF'
sv 'walentynki-szablony'             '#BE123C' '#881337' '💌' 'Szablony PDF'
sv 'dzien-kobiet-plakaty'            '#DB2777' '#701A75' '🌸' 'Plakaty PDF'
sv 'dzien-kobiet-szablony'           '#DB2777' '#9D174D' '💐' 'Szablony PDF'
sv 'dzien-ziemi-plakaty'             '#15803D' '#0F4C81' '🌍' 'Plakaty PDF'
sv 'dzien-ziemi-szablony'            '#15803D' '#166534' '🌱' 'Szablony PDF'
sv 'wielkanoc-plakaty'               '#A16207' '#166534' '🐣' 'Plakaty PDF'
sv 'wielkanoc-szablony'              '#A16207' '#92400E' '🥚' 'Szablony PDF'
sv 'pierwszy-dzien-wiosny-plakaty'   '#16A34A' '#3F6212' '🌷' 'Plakaty PDF'
sv 'pierwszy-dzien-wiosny-szablony'  '#16A34A' '#065F46' '🌼' 'Szablony PDF'
sv 'wiosna-plakaty'                  '#15803D' '#3F6212' '🦋' 'Plakaty PDF'
sv 'wiosna-szablony'                 '#15803D' '#065F46' '🌻' 'Szablony PDF'
sv 'dzien-matki-plakaty'             '#BE185D' '#9D174D' '💐' 'Plakaty PDF'
sv 'dzien-matki-szablony'            '#BE185D' '#831843' '💝' 'Szablony PDF'
sv 'konstytucja-plakaty'             '#DC2626' '#7F1D1D' '🏛️' 'Plakaty PDF'
sv 'konstytucja-szablony'            '#DC2626' '#991B1B' '⚖️' 'Szablony PDF'
sv 'dzien-dziecka-plakaty'           '#D97706' '#C2410C' '🎈' 'Plakaty PDF'
sv 'dzien-dziecka-szablony'          '#D97706' '#B45309' '🎉' 'Szablony PDF'
sv 'dzien-ojca-plakaty'              '#1E3A5F' '#374151' '👔' 'Plakaty PDF'
sv 'dzien-ojca-szablony'             '#1E3A5F' '#1F2937' '🎩' 'Szablony PDF'
sv 'lato-plakaty'                    '#D97706' '#B45309' '☀️' 'Plakaty PDF'
sv 'lato-szablony'                   '#D97706' '#92400E' '🏖️' 'Szablony PDF'
sv 'zakonczenie-roku-plakaty'        '#92400E' '#78350F' '🎓' 'Plakaty PDF'
sv 'zakonczenie-roku-szablony'       '#92400E' '#451A03' '🏆' 'Szablony PDF'
sv 'poczatek-roku-plakaty'           '#1D4ED8' '#065F46' '🎒' 'Plakaty PDF'
sv 'poczatek-roku-szablony'          '#1D4ED8' '#1E3A5F' '✏️' 'Szablony PDF'
sv 'jesien-plakaty'                  '#C2410C' '#78350F' '🍂' 'Plakaty PDF'
sv 'jesien-szablony'                 '#C2410C' '#92400E' '🍁' 'Szablony PDF'
sv 'dzien-nauczyciela-plakaty'       '#0369A1' '#1E3A5F' '📚' 'Plakaty PDF'
sv 'dzien-nauczyciela-szablony'      '#0369A1' '#075985' '🍎' 'Szablony PDF'
sv 'halloween-plakaty'               '#C2410C' '#1C1917' '🎃' 'Plakaty PDF'
sv 'halloween-szablony'              '#C2410C' '#292524' '👻' 'Szablony PDF'
sv 'andrzejki-plakaty'               '#6D28D9' '#2E1065' '⭐' 'Plakaty PDF'
sv 'andrzejki-szablony'              '#6D28D9' '#4C1D95' '🔮' 'Szablony PDF'
sv 'mikolajki-plakaty'               '#DC2626' '#7C2D12' '🎅' 'Plakaty PDF'
sv 'mikolajki-szablony'              '#DC2626' '#991B1B' '🎁' 'Szablony PDF'
sv 'dzien-babci-plakaty'             '#DB2777' '#BE185D' '🌹' 'Plakaty PDF'
sv 'dzien-babci-szablony'            '#DB2777' '#9D174D' '💖' 'Szablony PDF'
sv 'niepodleglosc-plakaty'           '#DC2626' '#1C1917' '🦅' 'Plakaty PDF'
sv 'niepodleglosc-szablony'          '#DC2626' '#292524' '🏛️' 'Szablony PDF'

Write-Host "Gotowe: $((Get-ChildItem $d -Filter 'prod-*.svg').Count) plikow SVG"
