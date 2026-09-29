import React from 'react';

interface ScreenHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}

/** Page title + subtitle row with right-aligned actions, as at the top of every design. */
export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, subtitle, actions }) => (
  <div className="screen-header-row">
    <div className="screen-title-area">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
    {actions && <div className="screen-header-actions">{actions}</div>}
  </div>
);
