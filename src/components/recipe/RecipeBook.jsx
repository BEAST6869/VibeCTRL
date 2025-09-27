import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import HTMLFlipBook from 'react-pageflip';

const BookPage = React.forwardRef(({ children }, ref) => (
  <div ref={ref} className="recipe-book-page" data-density="hard" style={{ background: '#fff', padding: 16 }}>
    {children}
  </div>
));

const RecipeBook = ({ pages = [], onFlip = () => {} }, ref) => {
  const bookRef = useRef(null);
  const containerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    flipNext: () => {
      try {
        const api = bookRef.current?.pageFlip?.();
        api?.flipNext?.();
      } catch (e) { console.warn('flipNext failed', e); }
    },
    flipPrev: () => {
      try {
        const api = bookRef.current?.pageFlip?.();
        api?.flipPrev?.();
      } catch (e) { console.warn('flipPrev failed', e); }
    },
    getCurrentPage: () => {
      try {
        return bookRef.current?.pageFlip?.()?.getCurrentPageIndex?.() ?? 0;
      } catch { return 0; }
    },
  }), []);

  useEffect(() => {
    // Keyboard navigation for accessibility
    const handler = (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        try { bookRef.current?.pageFlip?.()?.flipNext?.(); } catch {}
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        try { bookRef.current?.pageFlip?.()?.flipPrev?.(); } catch {}
      }
    };
    const el = containerRef.current || window;
    el.addEventListener('keydown', handler);
    return () => el.removeEventListener('keydown', handler);
  }, []);

  return (
    <div ref={containerRef} className="recipe-book" aria-label="Recipe book">
      <HTMLFlipBook
        ref={bookRef}
        width={480}
        height={600}
        size="stretch"
        minWidth={300}
        maxWidth={1000}
        minHeight={400}
        maxHeight={1200}
        maxShadowOpacity={0.5}
        showCover={false}
        mobileScrollSupport={true}
        className="recipe-book-flip"
        usePortrait={true}
        onFlip={(e) => onFlip(e)}
      >
        {pages.map((content, idx) => (
          <BookPage key={idx}>
            {content}
          </BookPage>
        ))}
      </HTMLFlipBook>
    </div>
  );
};

export default forwardRef(RecipeBook);
