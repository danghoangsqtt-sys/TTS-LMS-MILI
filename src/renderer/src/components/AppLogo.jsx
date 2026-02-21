export default function AppLogo({ className = 'w-12 h-12 text-[#14452F]' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      className={className}
    >
      {/* Shield outline */}
      <path
        d="M32 4L8 16v16c0 14.4 10.24 27.84 24 32 13.76-4.16 24-17.6 24-32V16L32 4z"
        fill="currentColor"
        opacity="0.12"
      />
      <path
        d="M32 4L8 16v16c0 14.4 10.24 27.84 24 32 13.76-4.16 24-17.6 24-32V16L32 4z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Inner shield accent line */}
      <path
        d="M32 9L13 18.5v13c0 11.8 8.16 22.6 19 26 10.84-3.4 19-14.2 19-26v-13L32 9z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
        strokeDasharray="3 3"
        opacity="0.3"
        fill="none"
      />

      {/* Radio tower — vertical mast */}
      <line
        x1="32" y1="22" x2="32" y2="44"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Tower base — angled legs */}
      <line
        x1="32" y1="44" x2="26" y2="50"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="32" y1="44" x2="38" y2="50"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Tower cross strut */}
      <line
        x1="28.5" y1="38" x2="35.5" y2="38"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Antenna tip */}
      <circle cx="32" cy="20" r="2" fill="currentColor" />

      {/* Sound wave arcs — left side */}
      <path
        d="M25 24c-2.5 2.5-2.5 8 0 10.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      <path
        d="M21 21c-4 4-4 14 0 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />

      {/* Sound wave arcs — right side */}
      <path
        d="M39 24c2.5 2.5 2.5 8 0 10.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      <path
        d="M43 21c4 4 4 14 0 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
    </svg>
  )
}
