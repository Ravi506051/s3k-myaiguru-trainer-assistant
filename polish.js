// Small progressive effects: the prototype remains usable without animation.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduceMotion) {
  const revealTargets = document.querySelectorAll('.active-view .page-heading, .active-view .cohort-bar, .active-view .metric-card, .active-view .panel');
  revealTargets.forEach((el, index) => {
    el.classList.add('motion-reveal');
    el.style.setProperty('--delay', `${Math.min(index * 55, 330)}ms`);
  });
  requestAnimationFrame(() => revealTargets.forEach(el => el.classList.add('in-view')));

  // app.js changes views; observe the class change and reveal newly visible cards.
  const observer = new MutationObserver(records => {
    records.forEach(record => {
      const view = record.target;
      if (!view.classList.contains('active-view')) return;
      const children = view.querySelectorAll('.page-heading, .metric-card, .panel');
      children.forEach((el, index) => {
        if (el.classList.contains('in-view')) return;
        el.classList.add('motion-reveal');
        el.style.setProperty('--delay', `${Math.min(index * 55, 260)}ms`);
        requestAnimationFrame(() => el.classList.add('in-view'));
      });
    });
  });
  document.querySelectorAll('.view').forEach(view => observer.observe(view, { attributes: true, attributeFilter: ['class'] }));

  document.querySelectorAll('.metric-card, .panel').forEach(card => {
    const glow = document.createElement('span');
    glow.className = 'pointer-glow';
    card.appendChild(glow);
    card.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      const bounds = card.getBoundingClientRect();
      card.style.setProperty('--glow-x', `${e.clientX - bounds.left}px`);
      card.style.setProperty('--glow-y', `${e.clientY - bounds.top}px`);
    });
  });

  document.querySelectorAll('.button').forEach(button => button.addEventListener('click', e => {
    const bounds = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'click-ripple';
    ripple.style.left = `${e.clientX - bounds.left}px`;
    ripple.style.top = `${e.clientY - bounds.top}px`;
    button.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  }));
}
