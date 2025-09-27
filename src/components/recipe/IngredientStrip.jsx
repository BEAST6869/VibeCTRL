import React from 'react';
import IngredientCard from './IngredientCard';

export default function IngredientStrip({ items = [] }) {
  return (
    <div className="ingredient-strip" aria-label="Ingredients">
      {items.map((it, idx) => (
        <IngredientCard key={idx} {...it} />
      ))}
    </div>
  );
}
