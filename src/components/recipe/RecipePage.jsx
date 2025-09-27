import React from 'react';

export default function RecipePage({ title, image, children }) {
  return (
    <div className="recipe-page-content">
      <div className="book-media">
        {image && <img src={image} alt="Recipe" />}
      </div>
      <div className="book-content" tabIndex={0}>
        {title && <h2>{title}</h2>}
        <div>{children}</div>
      </div>
    </div>
  );
}
