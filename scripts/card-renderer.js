(function (T) {
  'use strict';
  const star = (x,y,r=8) => `<path d="M${x} ${y-r} L${x+r*.28} ${y-r*.28} ${x+r} ${y} ${x+r*.28} ${y+r*.28} ${x} ${y+r} ${x-r*.28} ${y+r*.28} ${x-r} ${y} ${x-r*.28} ${y-r*.28}Z"/>`;
  const star8 = (x,y,r) => '<path d="' + Array.from({length:16},(_,i) => { const a=i*Math.PI/8-Math.PI/2, length=i%2?r*.42:r; return `${i?'L':'M'}${x+Math.cos(a)*length} ${y+Math.sin(a)*length}`; }).join(' ') + 'Z"/>';
  const circle = (x,y,r,extra='') => `<circle cx="${x}" cy="${y}" r="${r}" ${extra}/>`;
  const line = (x,y,a,b) => `<path d="M${x} ${y}L${a} ${b}"/>`;
  const rays = (x,y,r,l,n=16) => Array.from({length:n},(_,i) => { const a=i*Math.PI*2/n; return line(x+Math.cos(a)*r,y+Math.sin(a)*r,x+Math.cos(a)*(r+l),y+Math.sin(a)*(r+l)); }).join('');
  const motifs = [
    `<path d="M148 116 A63 63 0 1 0 180 160"/>${circle(174,116,10)}<path d="M64 236L176 236M120 113V217" stroke-dasharray="2 8"/>`,
    `${circle(120,172,40)}${star(120,172,22)}<path d="M120 89V255M45 172H195M112 100L120 88L128 100M104 240H136"/>${circle(64,119,10)}<path d="M166 108l12 21h-24zM55 217h19v19H55M154 226h24M166 214v24"/>`,
    `<path d="M66 118H82V236H66ZM158 118H174V236H158ZM65 109H83M157 109H175M130 110a40 40 0 1 0 0 77 33 33 0 0 1 0-77Z"/>${star(120,217,13)}`,
    `<path d="M120 250V111M120 205C69 209 68 161 68 161Q121 164 120 205ZM120 173Q167 179 174 132Q124 130 120 173ZM120 140Q91 121 120 94Q149 121 120 140Z"/>${circle(120,178,72,'stroke-dasharray="2 7"')}`,
    `<path d="M66 130H174V237H66ZM83 148H157V237M58 248H182M87 111V87M153 111V87M69 100H105M135 100H171M103 181H137V217H103Z"/>${star(120,100,11)}`,
    `<path d="M63 239V139a57 57 0 0 1 114 0V239M82 239V144a38 38 0 0 1 76 0V239M56 248H184M74 259H166"/>${circle(106,166,10)}${circle(134,166,10)}<path d="M106 176v42h10M134 176v42h-10M120 99v24M112 111h16"/>`,
    `${circle(94,179,44)}${circle(146,179,44)}<path d="M120 111V238M85 243L120 261L155 243"/>${star(120,96,14)}`,
    `<path d="M120 98L165 198H75ZM120 127V232M60 204H180M48 249H192"/>${circle(77,223,20)}${circle(163,223,20)}${star(120,167,10)}`,
    `<path d="M72 118C96 88 144 148 168 118C190 89 145 89 120 118C96 148 49 148 72 118ZM60 206Q75 135 122 168Q171 137 181 204Q142 247 120 244Q79 246 60 206ZM85 203L120 162L155 203"/>${star(120,215,8)}`,
    `<path d="M48 249L106 148L163 249M111 249L150 181L194 249M120 102V75"/>${star(120,123,22)}${circle(120,123,37,'stroke-dasharray="2 7"')}`,
    `${circle(120,178,66)}${circle(120,178,50)}${circle(120,178,14)}${line(54,178,186,178)}${line(120,112,120,244)}<path d="M77 126l-18 5 4-19M163 230l18-5-4 19"/>${star(85,143,7)}${star(155,213,7)}`,
    `<path d="M120 99V246M75 246H165M65 142H175M76 142L54 192H98ZM164 142L142 192H186ZM54 192Q76 218 98 192M142 192Q164 218 186 192"/>${star(120,123,13)}`,
    `<path d="M58 110H182M120 110V144M72 151H168L120 236ZM96 162L120 205L144 162"/>${circle(120,247,15)}${rays(120,247,22,7,10)}`,
    `<path d="M73 122a67 67 0 1 0 94 0M92 113L82 139L61 126M120 247V167Q80 171 83 137Q118 135 120 167Q124 139 158 144Q154 177 120 177"/>${star(120,109,12)}`,
    `<path d="M62 116H108L99 155H71ZM132 214H178L169 253H141ZM86 158C160 158 84 211 155 211M60 270H180"/>${circle(156,135,22)}${star(79,229,15)}`,
    `${circle(120,170,62)}<path d="M167 129L174 113M82 213L69 229M72 217l-14 14a15 15 0 0 0 22 22l15-16M163 117l14-14a15 15 0 0 1 22 22l-15 16M104 164h32v35h-32zM111 164v-9a9 9 0 0 1 18 0v9"/>`,
    `<path d="M77 251L86 134H154L163 251M64 251H176M86 134V115H103V130H137V115H154V134M99 167L142 181L99 200M130 84L109 126H132L114 163M50 164l-14-12M187 209l14-7"/>`,
    `${star8(120,137,41)}${star(62,184,10)}${star(179,184,10)}<ellipse cx="120" cy="236" rx="66" ry="15"/><ellipse cx="120" cy="236" rx="42" ry="8"/>${line(120,186,120,229)}`,
    `<path d="M137 96a48 48 0 1 0 0 92 39 39 0 0 1 0-92ZM48 217H192M64 232H176M88 247H152M120 217C158 230 84 241 120 265"/>${star(172,105,10)}${star(70,91,6)}`,
    `${circle(120,147,36)}${circle(120,147,28)}${rays(120,147,46,13,16)}<path d="M120 266V217Q88 214 88 237Q113 246 120 230Q126 209 153 219Q149 242 120 245"/>`,
    `<path d="M86 128Q120 152 154 128M72 144Q120 177 168 144M57 161Q120 203 183 161M70 259V231M120 259V216M170 259V231"/>${circle(70,219,10)}${circle(120,200,10)}${circle(170,219,10)}${star(120,104,20)}`,
    `<ellipse cx="120" cy="176" rx="54" ry="78"/><ellipse cx="120" cy="176" rx="43" ry="68"/>${star(120,176,31)}${star(54,102,12)}${star(186,102,12)}${star(54,250,12)}${star(186,250,12)}`
  ];
  T.cardSVG = function (card = null, reversed = false) {
    const back = !card;
    const main = back ? `${circle(120,180,68)}${circle(120,180,56)}<path d="M120 89L184 180L120 271L56 180ZM120 111L166 180L120 249L74 180Z"/>${star(120,180,32)}${rays(120,180,75,6,24)}${star(120,60,8)}${star(120,300,8)}` : motifs[card.number];
    return `<svg class="card-art ${back ? 'back-art' : 'front-art'}" viewBox="0 0 240 360" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="1" y="1" width="238" height="358" rx="9" fill="${back?'#10263F':'#E8F4F8'}"/>
      <g fill="none" stroke="${back?'#C9A66B':'#806027'}" stroke-width=".85"><rect x="10" y="10" width="220" height="340" rx="4"/><rect x="15" y="15" width="210" height="330" rx="2"/>
      <path d="M15 42Q42 42 42 15M198 15Q198 42 225 42M15 318Q42 318 42 345M198 345Q198 318 225 318"/></g>
      <g fill="none" stroke="${back?'#8EC4E9':'#1A3A5F'}" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" transform="${reversed?'rotate(180 120 180)':''}">${main}</g>
      ${back?'':`<text x="120" y="49" text-anchor="middle" fill="#806027" font-family="Georgia,serif" font-size="14" letter-spacing="3">${card.numeral}</text><path d="M86 67H154M65 280H175" stroke="#C9A66B" stroke-width=".8"/><text x="120" y="307" text-anchor="middle" fill="#1A3A5F" font-family="Songti SC,serif" font-size="21" letter-spacing="4">${card.nameZh}</text><text x="120" y="329" text-anchor="middle" fill="#496780" font-family="Georgia,serif" font-size="10" letter-spacing="1.2">${card.nameEn.toUpperCase()}</text>`}
    </svg>`;
  };
})(window.TikaTarot);
