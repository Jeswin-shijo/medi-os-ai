import React from 'react';

interface ScreenHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  /** Shown beside the title, such as a LIVE marker. */
  badge?: React.ReactNode;
}

/** Page title + subtitle row with right-aligned actions, as at the top of every design. */
export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, subtitle, actions, badge }) => (
  <div className="screen-header-row">
    <div className="screen-title-area">
      {badge ? (
        <div className="screen-title-line">
          <h1>{title}</h1>
          {badge}
        </div>
      ) : (
        <h1>{title}</h1>
      )}
      {subtitle && <p>{subtitle}</p>}
    </div>
    {actions && <div className="screen-header-actions">{actions}</div>}
  </div>
);
