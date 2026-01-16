const ICONS = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  ticket: (
    <path d="M4 7a1 1 0 011-1h14a1 1 0 011 1v3a2 2 0 100 4v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3a2 2 0 100-4V7z" />
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 9h18" />
    </>
  ),
  seat: (
    <>
      <path d="M7 10V8a3 3 0 013-3h4a3 3 0 013 3v2" />
      <path d="M5 12h14v5a2 2 0 01-2 2h-2v-4H9v4H7a2 2 0 01-2-2v-5z" />
    </>
  ),
  users: (
    <>
      <circle cx="12" cy="9" r="3.5" />
      <path d="M4 20c0-3.3 3.6-5.5 8-5.5s8 2.2 8 5.5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M19 12a7 7 0 00-.1-1.2l2-1.5-2-3.4-2.4.8a7 7 0 00-2-1.2l-.4-2.5h-4l-.4 2.5a7 7 0 00-2 1.2l-2.4-.8-2 3.4 2 1.5A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-.8a7 7 0 002 1.2l.4 2.5h4l.4-2.5a7 7 0 002-1.2l2.4.8 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z" />
    </>
  ),
  logout: (
    <>
      <path d="M10 5V4a2 2 0 012-2h7a2 2 0 012 2v16a2 2 0 01-2 2h-7a2 2 0 01-2-2v-1" />
      <path d="M3 12h11M9 8l4 4-4 4" />
    </>
  ),
  bell: (
    <>
      <path d="M6 8a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6z" />
      <path d="M9.5 19a2.5 2.5 0 005 0" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  theater: (
    <>
      <rect x="4" y="6" width="16" height="12" rx="2" />
      <path d="M8 6v12M16 6v12" />
    </>
  ),
  activity: (
    <>
      <path d="M4 7a1 1 0 011-1h14a1 1 0 011 1v3a2 2 0 100 4v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3a2 2 0 100-4V7z" />
      <path d="M8 10h8M8 14h8" />
    </>
  ),
  money: (
    <>
      <path d="M12 3v18" />
      <path d="M16 7c0-1.7-1.8-3-4-3s-4 1.3-4 3 1.8 3 4 3 4 1.3 4 3-1.8 3-4 3-4-1.3-4-3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v5l3 2" />
    </>
  ),
  trendingUp: <path d="M4 16l6-6 4 4 6-6M14 8h6v6" />,
  minus: <path d="M5 12h14" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </>
  ),
  pen: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 14h10l1-14" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  filter: (
    <>
      <path d="M3 5h18" />
      <path d="M6 12h12" />
      <path d="M10 19h4" />
    </>
  ),
  x: (
    <>
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </>
  ),
  upload: (
    <>
      <path d="M12 3v12" />
      <path d="M7 8l5-5 5 5" />
      <path d="M5 15v4a2 2 0 002 2h10a2 2 0 002-2v-4" />
    </>
  ),
  check: <path d="M5 13l4 4L19 7" />,
  grip: (
    <>
      <path d="M8 7h8" />
      <path d="M8 12h8" />
      <path d="M8 17h8" />
    </>
  ),
  swap: (
    <>
      <path d="M4 7h12" />
      <path d="M13 4l3 3-3 3" />
      <path d="M20 17H8" />
      <path d="M11 14l-3 3 3 3" />
    </>
  ),
};

export function Icon({ name, className }) {
  const icon = ICONS[name];

  if (!icon) {
    return null;
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icon}
    </svg>
  );
}
