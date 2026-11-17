// Keep the dashboard lively without affecting keyboard or reduced-motion users.
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const heading = document.querySelector('#view-dashboard .page-heading');
  heading?.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    const r = heading.getBoundingClientRect();
    const x = (event.clientX - r.left) / r.width - .5;
    const y = (event.clientY - r.top) / r.height - .5;
    heading.style.backgroundPosition = `${50 + x * 12}% ${50 + y * 12}%`;
  });
  heading?.addEventListener('pointerleave', () => heading.style.backgroundPosition = '50% 50%');
}
