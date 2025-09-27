import React, { useEffect, useRef, useState } from 'react';
import BrutalCard from '../ui/brutal/BrutalCard';
import BrutalHeader from '../ui/brutal/BrutalHeader';
import RecipeBook from '../components/recipe/RecipeBook';
import RecipePage from '../components/recipe/RecipePage';
import IngredientStrip from '../components/recipe/IngredientStrip';
import CookbookCameraPanel from '../components/CookbookCameraPanel';

const PAGES = [
  {
    title: 'Welcome to the Cookbook',
    image: 'https://picsum.photos/seed/vibectrl1/800/400',
    content:
      'Learn gesture-powered UI patterns. Swipe to flip pages. Make an open hand to scroll down and a fist to scroll up in the page content.',
  },
  {
    title: 'Gesture Mapping Tips',
    image: 'https://picsum.photos/seed/vibectrl2/800/400',
    content:
      'Use distinct gestures with clear shapes. Train 50–100 samples per gesture at varied angles and distances for best accuracy.',
  },
  {
    title: 'Performance Notes',
    image: 'https://picsum.photos/seed/vibectrl3/800/400',
    content:
      'Keep UI lightweight while inference runs. Prefer CSS transforms and avoid expensive layouts during continuous gesture updates.',
  },
  {
    title: 'Accessibility',
    image: 'https://picsum.photos/seed/vibectrl4/800/400',
    content:
      'Provide keyboard fallbacks and visible feedback. Gestures trigger ArrowLeft/ArrowRight by default for page navigation.',
  },
  {
    title: 'Finish',
    image: 'https://picsum.photos/seed/vibectrl5/800/400',
    content:
      'You have reached the end. Swipe right to go back or use the buttons below to navigate.',
  },
];

const Cookbook = () => {
  const bookRef = useRef(null);

  const nextPage = () => {
    try { bookRef.current?.flipNext?.(); } catch {}
  };

  const prevPage = () => {
    try { bookRef.current?.flipPrev?.(); } catch {}
  };

  const getScrollableContentEl = () => {
    // Try to find the visible page content
    const scope = document.querySelector('.recipe-book');
    if (!scope) return null;
    // Prefer the currently visible book-content
    const candidates = scope.querySelectorAll('.book-content');
    for (const el of candidates) {
      const rect = el.getBoundingClientRect();
      if (rect.height > 0 && rect.width > 0) return el;
    }
    return null;
  };

  const scrollDown = () => {
    const el = getScrollableContentEl() || document.scrollingElement;
    if (!el) return;
    el.scrollBy({ top: 240, behavior: 'smooth' });
  };

  const scrollUp = () => {
    const el = getScrollableContentEl() || document.scrollingElement;
    if (!el) return;
    el.scrollBy({ top: -240, behavior: 'smooth' });
  };

  useEffect(() => {
    window.cookbookActions = { nextPage, prevPage, scrollUp, scrollDown };
    return () => { delete window.cookbookActions; };
  }, []);

  return (
    <div className="cookbook">
      <BrutalHeader title="Cookbook" subtitle="Gesture-enabled recipe/photo book" />

      <BrutalCard offset="down" style={{ marginTop: 12 }}>
        <div className="cookbook-split">
          <div className="cookbook-main" aria-label="Recipe book area">
            <RecipeBook
              ref={bookRef}
              pages={PAGES.map((p, idx) => (
                <RecipePage title={p.title} image={p.image}>
                  <p>{p.content}</p>
                  {idx === 0 && (
                    <div style={{ marginTop: 12 }}>
                      <video
                        className="demo-video-large"
                        muted
                        playsInline
                        controls
                        loop
                        poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYwIiBoZWlnaHQ9IjU0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjMDAwIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtZmFtaWx5PSJBcmlhbCI+RGVtbyBWaWRlbzwvdGV4dD48L3N2Zz4="
                        style={{ width: '100%', maxHeight: '40vh' }}
                      >
                        <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
                      </video>
                    </div>
                  )}
                  <IngredientStrip
                    items={[
                      { name: 'Flour', image: 'https://picsum.photos/seed/flour/80/80', qty: '200g' },
                      { name: 'Sugar', image: 'https://picsum.photos/seed/sugar/80/80', qty: '80g' },
                      { name: 'Butter', image: 'https://picsum.photos/seed/butter/80/80', qty: '120g' },
                    ]}
                  />
                </RecipePage>
              ))}
              onFlip={() => {}}
            />
          </div>
          <div className="cookbook-side" aria-label="Camera panel">
            <CookbookCameraPanel initiallyActive={false} />
          </div>
        </div>
      </BrutalCard>
    </div>
  );
};

export default Cookbook;
