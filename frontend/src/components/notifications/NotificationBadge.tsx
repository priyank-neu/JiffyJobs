import React from 'react';
import { Badge, BadgeProps } from '@mui/material';

interface NotificationBadgeProps extends Omit<BadgeProps, 'badgeContent'> {
  count: number;
  children: React.ReactElement;
  showZero?: boolean;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  children,
  showZero = false,
  ...badgeProps
}) => {
  return (
    <Badge
      badgeContent={count > 0 || showZero ? count : 0}
      color="error"
      max={99}
      {...badgeProps}
    >
      {children}
    </Badge>
  );
};

export default NotificationBadge;


