import React, { useState } from 'react';

export default function IngredientCard({ name, image, qty, note }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="ingredient-item" role="button" tabIndex={0} onClick={() => setOpen(!open)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen(!open); }}>
      <img src={image} alt={name} />
      {open && (
        <div className="ingredient-card" role="dialog" aria-label={`${name} details`}>
          <strong>{name}</strong>
          <div>{qty}</div>
          {note && <div className="muted">{note}</div>}
        </div>
      )}
    </div>
  );
}
