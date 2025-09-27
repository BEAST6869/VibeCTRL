import React from 'react';
import clsx from 'clsx';

const BrutalCard = ({ children, className = '', offset = '', ...rest }) => {
  return (
    <div
      className={clsx('brutal-card', className, {
        'offset-left': offset === 'left',
        'offset-right': offset === 'right',
        'offset-up': offset === 'up',
        'offset-down': offset === 'down',
      })}
      tabIndex={0}
      {...rest}
    >
      {children}
    </div>
  );
};

export default BrutalCard;
