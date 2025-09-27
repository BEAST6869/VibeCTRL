import React from 'react';
import clsx from 'clsx';
import { attachPressBehavior } from '../../utils/pressBehavior';

const BrutalButton = ({
  children,
  variant = 'filled', // 'filled' | 'outline' | 'invert'
  className = '',
  onClick,
  type = 'button',
  ...rest
}) => {
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (ref.current) attachPressBehavior(ref.current);
  }, []);

  return (
    <button
      ref={ref}
      type={type}
      className={clsx('button-brutal', {
        outline: variant === 'outline',
        invert: variant === 'invert'
      }, className)}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
};

export default BrutalButton;
