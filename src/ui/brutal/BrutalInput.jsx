import React from 'react';
import clsx from 'clsx';

const BaseInput = React.forwardRef(({ as = 'input', className = '', ...rest }, ref) => {
  const Element = as;
  return <Element ref={ref} className={clsx('input-brutal', className)} {...rest} />;
});

const BrutalInput = Object.assign(BaseInput, {
  Input: React.forwardRef((props, ref) => <BaseInput ref={ref} as="input" {...props} />),
  Select: React.forwardRef((props, ref) => <BaseInput ref={ref} as="select" {...props} />),
  Textarea: React.forwardRef((props, ref) => <BaseInput ref={ref} as="textarea" {...props} />),
});

export default BrutalInput;
