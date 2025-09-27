import React from 'react';

const stroke = 3; // thick lines for neo-brutal look
const common = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: stroke,
  strokeLinejoin: 'miter',
  strokeLinecap: 'square',
};

function paths(name) {
  switch (name) {
    case 'home':
      return (
        <g>
          <path d="M3 11 L12 3 L21 11" {...common} />
          <path d="M6 11 V21 H18 V11" {...common} />
        </g>
      );
    case 'camera':
      return (
        <g>
          <rect x="4" y="7" width="16" height="12" {...common} />
          <circle cx="12" cy="13" r="4" {...common} />
          <rect x="7" y="4" width="4" height="3" {...common} />
        </g>
      );
    case 'gamepad':
      return (
        <g>
          <rect x="4" y="9" width="16" height="8" rx="2" {...common} />
          <path d="M9 13 H7 M8 12 V14" {...common} />
          <circle cx="16" cy="12" r="1" {...common} />
          <circle cx="18" cy="14" r="1" {...common} />
        </g>
      );
    case 'video':
      return (
        <g>
          <rect x="4" y="6" width="12" height="12" {...common} />
          <path d="M16 10 L20 8 V16 L16 14 Z" {...common} />
        </g>
      );
    case 'play':
      return <path d="M8 6 L18 12 L8 18 Z" {...common} />;
    case 'pause':
      return (
        <g>
          <path d="M9 6 V18" {...common} />
          <path d="M15 6 V18" {...common} />
        </g>
      );
    case 'volume-up':
      return (
        <g>
          <path d="M6 10 H9 L14 6 V18 L9 14 H6 Z" {...common} />
          <path d="M17 9 C18.5 10.5 18.5 13.5 17 15" {...common} />
          <path d="M19 7 C21.5 10 21.5 14 19 17" {...common} />
        </g>
      );
    case 'volume-down':
      return (
        <g>
          <path d="M6 10 H9 L14 6 V18 L9 14 H6 Z" {...common} />
          <path d="M17 9 C18.5 10.5 18.5 13.5 17 15" {...common} />
        </g>
      );
    case 'search':
      return (
        <g>
          <circle cx="11" cy="11" r="5" {...common} />
          <path d="M16 16 L21 21" {...common} />
        </g>
      );
    case 'audio':
      return (
        <g>
          <path d="M10 8 V16" {...common} />
          <path d="M14 10 V14" {...common} />
          <path d="M6 12 V12" {...common} />
          <rect x="5" y="17" width="14" height="2" {...common} />
        </g>
      );
    case 'slides':
      return (
        <g>
          <rect x="5" y="7" width="14" height="10" {...common} />
          <path d="M3 9 H5 M19 9 H21" {...common} />
        </g>
      );
    case 'arrow-left':
      return <path d="M7 12 L13 6 V10 H21 V14 H13 V18 Z" {...common} />;
    case 'arrow-right':
      return <path d="M17 12 L11 6 V10 H3 V14 H11 V18 Z" {...common} />;
    case 'arrow-up':
      return <path d="M12 7 L6 13 H10 V21 H14 V13 H18 Z" {...common} />;
    case 'arrow-down':
      return <path d="M12 17 L6 11 H10 V3 H14 V11 H18 Z" {...common} />;
    case 'chart':
      return (
        <g>
          <rect x="5" y="11" width="3" height="7" {...common} />
          <rect x="11" y="8" width="3" height="10" {...common} />
          <rect x="17" y="5" width="3" height="13" {...common} />
        </g>
      );
    case 'bolt':
      return <path d="M12 2 L6 13 H11 L10 22 L18 10 H13 L14 2 Z" {...common} />;
    case 'target':
      return (
        <g>
          <circle cx="12" cy="12" r="8" {...common} />
          <circle cx="12" cy="12" r="4" {...common} />
          <circle cx="12" cy="12" r="1" {...common} />
        </g>
      );
    case 'help':
      return (
        <g>
          <circle cx="12" cy="12" r="9" {...common} />
          <path d="M9 9 C9 7 10.5 6 12 6 C13.5 6 15 7 15 9 C15 10.5 14 11 13 12 V14" {...common} />
          <path d="M12 17 V18" {...common} />
        </g>
      );
    case 'settings':
      return (
        <g>
          <circle cx="12" cy="12" r="3" {...common} />
          <path d="M12 3 V6 M12 18 V21 M3 12 H6 M18 12 H21 M5 5 L7 7 M17 17 L19 19 M17 5 L19 7 M5 19 L7 17" {...common} />
        </g>
      );
    case 'start':
      return <path d="M6 5 H10 L18 12 L10 19 H6 Z" {...common} />;
    case 'stop':
      return <rect x="7" y="7" width="10" height="10" {...common} />;
    case 'train':
      return (
        <g>
          <rect x="5" y="10" width="5" height="4" {...common} />
          <rect x="14" y="10" width="5" height="4" {...common} />
          <path d="M10 12 H14" {...common} />
        </g>
      );
    case 'load':
      return (
        <g>
          <path d="M12 3 V14" {...common} />
          <path d="M8 10 L12 14 L16 10" {...common} />
          <rect x="5" y="16" width="14" height="5" {...common} />
        </g>
      );
    case 'test':
      return (
        <g>
          <path d="M8 3 H16 M10 3 V12 C10 15 14 15 14 12 V3" {...common} />
          <path d="M8 20 H16" {...common} />
        </g>
      );
    case 'delete':
      return (
        <g>
          <rect x="6" y="7" width="12" height="13" {...common} />
          <path d="M9 7 V5 H15 V7" {...common} />
          <path d="M10 10 V18 M14 10 V18" {...common} />
        </g>
      );
    case 'export':
      return (
        <g>
          <path d="M12 13 V3" {...common} />
          <path d="M8 7 L12 3 L16 7" {...common} />
          <rect x="5" y="16" width="14" height="5" {...common} />
        </g>
      );
    case 'import':
      return (
        <g>
          <path d="M12 3 V13" {...common} />
          <path d="M8 9 L12 13 L16 9" {...common} />
          <rect x="5" y="16" width="14" height="5" {...common} />
        </g>
      );
    case 'save':
      return (
        <g>
          <rect x="5" y="5" width="14" height="14" {...common} />
          <rect x="9" y="5" width="6" height="5" {...common} />
          <rect x="8" y="13" width="8" height="6" {...common} />
        </g>
      );
    case 'reset':
      return (
        <g>
          <path d="M6 8 A6 6 0 0 1 18 12" {...common} />
          <path d="M6 8 H10 V4" {...common} />
          <path d="M18 16 A6 6 0 0 1 6 12" {...common} />
          <path d="M18 16 H14 V20" {...common} />
        </g>
      );
    case 'inference':
      return <circle cx="12" cy="12" r="3" {...common} />;
    case 'record':
      return <circle cx="12" cy="12" r="5" {...common} />;
    case 'check':
      return <path d="M5 12 L10 17 L19 7" {...common} />;
    case 'x':
      return (
        <g>
          <path d="M6 6 L18 18" {...common} />
          <path d="M18 6 L6 18" {...common} />
        </g>
      );
    case 'sliders':
      return (
        <g>
          <path d="M5 6 H19" {...common} />
          <path d="M9 6 V12" {...common} />
          <path d="M5 12 H19" {...common} />
          <path d="M15 12 V18" {...common} />
          <path d="M5 18 H19" {...common} />
          <path d="M12 18 V6" {...common} />
        </g>
      );
    case 'hand':
      return (
        <g>
          <path d="M7 12 V7 M10 12 V6 M13 12 V6 M16 13 V8" {...common} />
          <path d="M7 12 C7 18 17 18 17 13" {...common} />
        </g>
      );
    default:
      return <circle cx="12" cy="12" r="2" {...common} />;
  }
}

const Icon = ({ name, size = 18, style = {}, className = '', title = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    role="img"
    aria-label={title || name}
    className={className}
    style={style}
  >
    {paths(name)}
  </svg>
);

export default Icon;
