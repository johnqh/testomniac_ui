import { type ReactNode } from 'react';

/** Human-readable labels for scaffold types. Shared across scaffold cells/pages. */
export const SCAFFOLD_LABELS: Record<string, string> = {
  topMenu: 'Top navigation',
  footer: 'Footer',
  breadcrumb: 'Breadcrumb',
  leftMenu: 'Left navigation',
  hamburgerMenu: 'Hamburger menu',
  rightSidebar: 'Right sidebar',
  searchBar: 'Search bar',
  userMenu: 'User menu',
  cookieBanner: 'Cookie banner',
  chatWidget: 'Chat widget',
  socialLinks: 'Social links',
  skipNav: 'Skip navigation',
  languageSwitcher: 'Language switcher',
  announcementBar: 'Announcement bar',
  backToTop: 'Back to top',
};

const iconProps = {
  width: 14,
  height: 14,
  viewBox: '0 0 14 14',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
};

/** Inline icons for scaffold types. Shared across scaffold cells/pages. */
export const SCAFFOLD_ICONS: Record<string, ReactNode> = {
  topMenu: (
    <svg {...iconProps}>
      <rect x="1" y="1" width="12" height="3" rx="0.5" />
      <line x1="3" y1="2.5" x2="5" y2="2.5" />
      <line x1="6.5" y1="2.5" x2="8.5" y2="2.5" />
      <line x1="10" y1="2.5" x2="11" y2="2.5" />
    </svg>
  ),
  footer: (
    <svg {...iconProps}>
      <rect x="1" y="10" width="12" height="3" rx="0.5" />
      <line x1="3" y1="11.5" x2="7" y2="11.5" />
    </svg>
  ),
  breadcrumb: (
    <svg {...iconProps} strokeLinejoin="round">
      <polyline points="2,5 4.5,7 2,9" />
      <polyline points="5.5,5 8,7 5.5,9" />
      <polyline points="9,5 11.5,7 9,9" />
    </svg>
  ),
  leftMenu: (
    <svg {...iconProps}>
      <rect x="1" y="1" width="12" height="12" rx="1" />
      <line x1="5" y1="1" x2="5" y2="13" />
      <line x1="2.5" y1="4" x2="4" y2="4" />
      <line x1="2.5" y1="6.5" x2="4" y2="6.5" />
      <line x1="2.5" y1="9" x2="4" y2="9" />
    </svg>
  ),
  hamburgerMenu: (
    <svg {...iconProps}>
      <line x1="2" y1="3.5" x2="12" y2="3.5" />
      <line x1="2" y1="7" x2="12" y2="7" />
      <line x1="2" y1="10.5" x2="12" y2="10.5" />
    </svg>
  ),
  rightSidebar: (
    <svg {...iconProps}>
      <rect x="1" y="1" width="12" height="12" rx="1" />
      <line x1="9" y1="1" x2="9" y2="13" />
      <line x1="10" y1="4" x2="11.5" y2="4" />
      <line x1="10" y1="6.5" x2="11.5" y2="6.5" />
    </svg>
  ),
  searchBar: (
    <svg {...iconProps}>
      <circle cx="6" cy="6" r="4" />
      <line x1="9" y1="9" x2="12.5" y2="12.5" />
    </svg>
  ),
  userMenu: (
    <svg {...iconProps}>
      <circle cx="7" cy="5" r="2.5" />
      <path d="M2.5 13c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" />
    </svg>
  ),
  cookieBanner: (
    <svg {...iconProps}>
      <path d="M2 3.5C2 2.67 2.67 2 3.5 2h7c.83 0 1.5.67 1.5 1.5v7c0 .83-.67 1.5-1.5 1.5h-7C2.67 12 2 11.33 2 10.5v-7z" />
      <path d="M5 5.5v0" strokeWidth="2" />
      <path d="M7 8v0" strokeWidth="2" />
      <path d="M9.5 5v0" strokeWidth="2" />
    </svg>
  ),
  chatWidget: (
    <svg {...iconProps} strokeLinejoin="round">
      <path d="M2 2.5C2 1.67 2.67 1 3.5 1h7c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5H6l-2.5 2.5V9H3.5C2.67 9 2 8.33 2 7.5v-5z" />
    </svg>
  ),
  socialLinks: (
    <svg {...iconProps}>
      <circle cx="3" cy="7" r="1.5" />
      <circle cx="11" cy="3.5" r="1.5" />
      <circle cx="11" cy="10.5" r="1.5" />
      <line x1="4.3" y1="6.3" x2="9.7" y2="4.2" />
      <line x1="4.3" y1="7.7" x2="9.7" y2="9.8" />
    </svg>
  ),
  skipNav: (
    <svg {...iconProps} strokeLinejoin="round">
      <polyline points="2,3 7,7 2,11" />
      <line x1="7" y1="3" x2="7" y2="11" />
      <line x1="10" y1="3" x2="10" y2="11" />
      <polyline points="10,5 12.5,7 10,9" />
    </svg>
  ),
  languageSwitcher: (
    <svg {...iconProps}>
      <circle cx="7" cy="7" r="5.5" />
      <ellipse cx="7" cy="7" rx="2.5" ry="5.5" />
      <line x1="1.5" y1="7" x2="12.5" y2="7" />
    </svg>
  ),
  announcementBar: (
    <svg {...iconProps} strokeLinejoin="round">
      <path d="M11 2L4 5H2.5C1.67 5 1 5.67 1 6.5v0c0 .83.67 1.5 1.5 1.5H4l7 3V2z" />
      <line x1="13" y1="5" x2="13" y2="8" />
      <line x1="4" y1="8" x2="4.5" y2="12" />
    </svg>
  ),
  backToTop: (
    <svg {...iconProps} strokeLinejoin="round">
      <line x1="7" y1="12" x2="7" y2="3" />
      <polyline points="3.5,6 7,2.5 10.5,6" />
    </svg>
  ),
};
