const paths = {
  cap: 'M22 10 12 5 2 10l10 5 10-5Z M6 12v5c3 2 9 2 12 0v-5',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z M20 20l-3.5-3.5',
  menu: 'M4 7h16 M4 12h16 M4 17h16',
  close: 'M6 6l12 12 M18 6 6 18',
  check: 'M5 12.5 10 17 19 7',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  chevron: 'M6 9l6 6 6-6',
  copy: 'M9 9h10v10H9z M5 15V5h10',
  share: 'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M8.6 13.5l6.8 4 M15.4 6.5l-6.8 4',
  mail: 'M3 6h18v12H3z M3 7l9 6 9-6',
  chat: 'M4 5h16v11H9l-5 4z',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M2 21c0-4 3-6 7-6s7 2 7 6 M17 3.5a4 4 0 0 1 0 7.5 M22 21c0-3-1.5-5-4-5.7',
  building: 'M4 21V4h11v17 M15 9h5v12 M8 8h3 M8 12h3 M8 16h3 M2 21h20',
  briefcase: 'M3 7h18v13H3z M8 7V4h8v3 M3 13h18',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M3 12h18 M12 3c3 3 3 15 0 18 M12 3c-3 3-3 15 0 18',
  book: 'M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1z M12 6v14',
  chart: 'M4 20V10 M10 20V4 M16 20v-7 M22 20H2',
  link: 'M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1 M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1',
  download: 'M12 4v11 M7 10l5 5 5-5 M4 20h16',
  plus: 'M12 5v14 M5 12h14',
}

function Icon({ name, className = 'h-5 w-5', strokeWidth = 2 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}

export default Icon
