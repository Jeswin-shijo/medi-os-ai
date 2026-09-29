import React from 'react';
import { getAvatar } from '../../mock/avatars';

const INITIAL_COLORS = ['#3b82f6', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];

const colorFor = (name: string) => {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return INITIAL_COLORS[hash % INITIAL_COLORS.length];
};

interface AvatarProps {
  name: string;
  size?: number;
  /** Explicit image URL; defaults to the demo portrait for `name`. */
  src?: string;
  /** Force the coloured-initial style even when a photo exists. */
  initialsOnly?: boolean;
  color?: string;
  radius?: string;
  style?: React.CSSProperties;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 40, src, initialsOnly, color, radius = '50%', style }) => {
  const url = initialsOnly ? undefined : src ?? getAvatar(name, size * 2);
  const base: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: radius,
    flexShrink: 0,
    ...style,
  };

  if (url) {
    return <img src={url} alt={name} style={{ ...base, objectFit: 'cover', backgroundColor: 'var(--bg-hover)' }} />;
  }

  const initial = name.replace(/^Dr\.?\s+/, '').charAt(0).toUpperCase();
  return (
    <span
      aria-label={name}
      style={{
        ...base,
        backgroundColor: color ?? colorFor(name),
        color: '#ffffff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(size * 0.42),
        fontWeight: 500,
      }}
    >
      {initial}
    </span>
  );
};
