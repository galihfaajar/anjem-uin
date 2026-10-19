// Ilustrasi SVG original — pengemudi skuter dengan tas pengantaran
// Dibuat khusus untuk Anjem UIN, bukan disalin dari manapun.

export default function ScooterIllustration() {
  return (
    <svg
      viewBox="0 0 480 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Ilustrasi driver Anjem UIN mengendarai skuter"
      className="w-full h-auto drop-shadow-2xl"
    >
      {/* Background circle */}
      <circle cx="240" cy="260" r="180" fill="#dbeafe" opacity="0.5" />
      <circle cx="240" cy="260" r="140" fill="#eff6ff" opacity="0.7" />

      {/* Ground shadow */}
      <ellipse cx="245" cy="390" rx="140" ry="16" fill="#bfdbfe" opacity="0.4" />

      {/* === SCOOTER === */}
      {/* Rear wheel */}
      <circle cx="155" cy="355" r="52" fill="#1e293b" />
      <circle cx="155" cy="355" r="38" fill="#334155" />
      <circle cx="155" cy="355" r="22" fill="#475569" />
      <circle cx="155" cy="355" r="9" fill="#94a3b8" />
      {/* Rear wheel spokes */}
      <line x1="155" y1="333" x2="155" y2="377" stroke="#64748b" strokeWidth="3" />
      <line x1="133" y1="355" x2="177" y2="355" stroke="#64748b" strokeWidth="3" />
      <line x1="140" y1="340" x2="170" y2="370" stroke="#64748b" strokeWidth="2" />
      <line x1="170" y1="340" x2="140" y2="370" stroke="#64748b" strokeWidth="2" />

      {/* Front wheel */}
      <circle cx="330" cy="355" r="50" fill="#1e293b" />
      <circle cx="330" cy="355" r="36" fill="#334155" />
      <circle cx="330" cy="355" r="20" fill="#475569" />
      <circle cx="330" cy="355" r="8" fill="#94a3b8" />
      {/* Front wheel spokes */}
      <line x1="330" y1="335" x2="330" y2="375" stroke="#64748b" strokeWidth="3" />
      <line x1="310" y1="355" x2="350" y2="355" stroke="#64748b" strokeWidth="3" />
      <line x1="316" y1="341" x2="344" y2="369" stroke="#64748b" strokeWidth="2" />
      <line x1="344" y1="341" x2="316" y2="369" stroke="#64748b" strokeWidth="2" />

      {/* Main body */}
      <path
        d="M170 290 Q195 250 250 240 Q290 235 320 240 L340 280 Q320 310 280 315 L190 315 Z"
        fill="#2563eb"
      />
      <path
        d="M250 240 Q290 235 320 240 L340 280 Q320 260 290 258 Q265 256 250 240Z"
        fill="#1d4ed8"
      />

      {/* Footboard */}
      <rect x="175" y="310" width="145" height="22" rx="8" fill="#1e40af" />

      {/* Front fairing */}
      <path
        d="M310 240 Q340 238 355 255 Q365 268 350 285 Q335 300 320 295 L310 265 Z"
        fill="#2563eb"
      />
      <path
        d="M335 250 Q350 252 355 262 Q358 270 350 278 L338 268 Z"
        fill="#60a5fa"
        opacity="0.6"
      />

      {/* Headlight */}
      <ellipse cx="355" cy="272" rx="10" ry="8" fill="#fef9c3" />
      <ellipse cx="355" cy="272" rx="6" ry="5" fill="#fef08a" />

      {/* Handlebar */}
      <rect x="340" y="232" width="6" height="32" rx="3" fill="#334155" />
      <rect x="328" y="230" width="30" height="8" rx="4" fill="#475569" />

      {/* Seat */}
      <path d="M205 248 Q230 238 270 238 Q265 252 240 255 Q215 257 205 248Z" fill="#1e293b" />

      {/* Rear rack with delivery bag */}
      <rect x="155" y="248" width="58" height="12" rx="4" fill="#334155" />

      {/* Delivery bag */}
      <rect x="148" y="210" width="72" height="62" rx="12" fill="#1d4ed8" />
      <rect x="156" y="218" width="56" height="46" rx="8" fill="#2563eb" />
      {/* Bag strap */}
      <rect x="176" y="205" width="28" height="8" rx="4" fill="#1e40af" />
      {/* Logo on bag */}
      <rect x="168" y="228" width="34" height="26" rx="6" fill="white" opacity="0.15" />
      <text x="185" y="246" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="sans-serif">AnjemUIN</text>

      {/* Bag buckles */}
      <rect x="154" y="245" width="12" height="6" rx="3" fill="#60a5fa" />
      <rect x="214" y="245" width="12" height="6" rx="3" fill="#60a5fa" />

      {/* Muffler */}
      <rect x="152" y="305" width="36" height="8" rx="4" fill="#475569" />
      <circle cx="190" cy="309" r="5" fill="#64748b" />
      {/* Exhaust smoke puffs */}
      <circle cx="200" cy="308" r="4" fill="#e2e8f0" opacity="0.6" />
      <circle cx="210" cy="304" r="3" fill="#e2e8f0" opacity="0.4" />
      <circle cx="219" cy="300" r="2.5" fill="#e2e8f0" opacity="0.25" />

      {/* === RIDER === */}
      {/* Legs */}
      <path d="M220 290 Q225 320 230 330 L250 330 Q248 315 240 290Z" fill="#1d4ed8" />
      <path d="M240 290 Q245 315 248 330 L268 330 Q262 315 260 290Z" fill="#1d4ed8" />
      {/* Shoes */}
      <ellipse cx="237" cy="332" rx="14" ry="7" fill="#0f172a" />
      <ellipse cx="258" cy="332" rx="14" ry="7" fill="#0f172a" />

      {/* Body / jacket */}
      <path
        d="M210 210 Q215 185 240 180 Q265 175 278 195 Q290 215 285 250 Q280 270 260 278 Q240 282 220 275 Q205 265 205 245 Z"
        fill="#2563eb"
      />
      {/* Jacket detail */}
      <path d="M240 178 L240 282" stroke="#1d4ed8" strokeWidth="2" opacity="0.5" />
      <path d="M220 210 Q215 230 218 255" stroke="#1d4ed8" strokeWidth="3" strokeLinecap="round" />
      <path d="M260 205 Q268 225 265 250" stroke="#1d4ed8" strokeWidth="3" strokeLinecap="round" />

      {/* Arm (right — reaching handlebar) */}
      <path d="M278 215 Q300 218 330 240" stroke="#2563eb" strokeWidth="14" strokeLinecap="round" />
      <path d="M278 215 Q300 218 330 240" stroke="#1d4ed8" strokeWidth="10" strokeLinecap="round" opacity="0.5" />

      {/* Arm (left) */}
      <path d="M215 215 Q205 225 200 240" stroke="#2563eb" strokeWidth="14" strokeLinecap="round" />

      {/* Gloves */}
      <circle cx="332" cy="241" r="9" fill="#0f172a" />
      <circle cx="200" cy="241" r="9" fill="#0f172a" />

      {/* Neck */}
      <rect x="233" y="170" width="16" height="14" rx="5" fill="#fca5a5" />

      {/* Head */}
      <circle cx="241" cy="155" r="30" fill="#fca5a5" />

      {/* Face details */}
      <ellipse cx="233" cy="153" rx="4" ry="5" fill="#f87171" />
      <ellipse cx="249" cy="153" rx="4" ry="5" fill="#f87171" />
      {/* Eyes */}
      <ellipse cx="233" cy="152" rx="2.5" ry="3" fill="#1e293b" />
      <ellipse cx="249" cy="152" rx="2.5" ry="3" fill="#1e293b" />
      {/* Smile */}
      <path d="M233 163 Q241 169 249 163" stroke="#ef4444" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Helmet */}
      <path
        d="M210 148 Q210 115 241 112 Q272 109 272 142 Q272 160 260 168 Q248 174 241 174 Q225 174 215 167 Q208 161 210 148Z"
        fill="#1d4ed8"
      />
      <path
        d="M215 140 Q218 120 241 118 Q264 116 268 138"
        fill="#2563eb"
      />
      {/* Helmet visor */}
      <path
        d="M214 150 Q220 162 241 164 Q262 162 268 150 Q265 142 241 140 Q217 142 214 150Z"
        fill="#93c5fd"
        opacity="0.6"
      />
      {/* Helmet strap */}
      <path d="M218 170 Q223 178 232 176" stroke="#1e40af" strokeWidth="2" fill="none" />
      <path d="M264 170 Q259 178 250 176" stroke="#1e40af" strokeWidth="2" fill="none" />

      {/* Helmet logo */}
      <circle cx="241" cy="128" r="8" fill="white" opacity="0.25" />
      <text x="241" y="132" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">A</text>

      {/* Speed lines (motion) */}
      <line x1="90" y1="290" x2="130" y2="290" stroke="#bfdbfe" strokeWidth="3" strokeLinecap="round" />
      <line x1="75" y1="310" x2="120" y2="310" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" />
      <line x1="95" y1="330" x2="130" y2="330" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" />

      {/* Stars / sparkles */}
      <circle cx="390" cy="160" r="4" fill="#fbbf24" />
      <circle cx="410" cy="140" r="2.5" fill="#fbbf24" opacity="0.7" />
      <circle cx="400" cy="175" r="2" fill="#fbbf24" opacity="0.5" />
      <circle cx="80" cy="220" r="3" fill="#60a5fa" opacity="0.6" />
      <circle cx="65" cy="200" r="2" fill="#60a5fa" opacity="0.4" />
    </svg>
  );
}
