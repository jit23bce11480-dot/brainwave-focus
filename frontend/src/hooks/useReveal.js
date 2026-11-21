import { useEffect } from 'react';

// Fades elements with the class "reveal" into view as they scroll onto the screen.
// IntersectionObserver tells us when an element enters the viewport,
// which is far cheaper than checking positions on every scroll event.
export default function useReveal(dependency) {
  useEffect(() => {
    const elements = document.querySelectorAll('.reveal:not(.is-visible)');
    if (!('IntersectionObserver' in window)) {
      elements.forEach((el) => el.classList.add('is-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target); // animate once, then stop watching
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [dependency]);
}
