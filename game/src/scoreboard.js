// The HUD, the toast line and the scene-clear card. This module only reads game state and writes
// DOM text/classes; it never changes the rules or the pictures.

/** Seconds to mm:ss, always two digits on the minutes. */
export function formatTime(seconds) {
  const whole = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`;
}

export function createScoreboard() {
  const byId = (id) => document.getElementById(id);
  const refs = {
    sceneStep: byId('scene-step'), sceneName: byId('scene-name'),
    remaining: byId('remaining'), dots: byId('remaining-dots'),
    timer: byId('timer'), timerFlag: byId('timer-flag'), timerCard: document.querySelector('.timer-card'),
    timeFill: byId('time-fill'), misses: byId('misses'),
    hintButton: byId('hint-button'), hintsLeft: byId('hints-left'),
    toast: byId('toast'), status: byId('status'),
    results: byId('results'), resultsKicker: byId('results-kicker'),
    resultsTitle: byId('results-title'), resultsLine: byId('results-line'),
    resultTime: byId('result-time'), resultMisses: byId('result-misses'),
    resultStars: byId('result-stars'), resultsNext: byId('results-next'),
  };
  let toastTimer = 0;

  function setScene(scene, index, total) {
    refs.sceneStep.textContent = `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
    refs.sceneName.textContent = scene.title;
    refs.dots.replaceChildren();
    for (let i = 0; i < scene.differences.length; i += 1) {
      const dot = document.createElement('i');
      refs.dots.appendChild(dot);
    }
  }

  function update(state) {
    const total = state.targets.length;
    const left = total - state.found.size;
    refs.remaining.textContent = String(left);
    [...refs.dots.children].forEach((dot, index) => {
      dot.classList.toggle('found', index < state.found.size);
    });
    refs.timer.textContent = formatTime(state.timeLeft);
    refs.timeFill.style.width = `${Math.max(0, Math.min(100, (state.timeLeft / state.scene.timeLimit) * 100)).toFixed(1)}%`;
    const urgent = state.timeLeft <= 20;
    refs.timerCard.classList.toggle('urgent', urgent);
    refs.timerFlag.textContent = urgent ? 'hurry!' : state.timeLeft <= 45 ? 'keep moving' : 'take your time';
    refs.misses.textContent = String(state.misses);
    refs.hintsLeft.textContent = String(state.hintsLeft);
    refs.hintButton.disabled = state.hintsLeft <= 0 || state.completed;
  }

  function toast(message, kind = '') {
    refs.toast.textContent = message;
    refs.toast.className = `toast ${kind}`.trim();
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      refs.toast.textContent = 'Look closely — then click the right-hand picture.';
      refs.toast.className = 'toast';
    }, 3200);
  }

  function announce(message) {
    refs.status.textContent = message;
  }

  function showResults(state) {
    const cleared = state.outcome === 'clear';
    const left = state.targets.length - state.found.size;
    const good = state.misses <= 1 && state.timeLeft > state.scene.timeLimit * 0.3;
    const stars = !cleared ? 1 : good ? 3 : state.misses <= 3 ? 2 : 1;
    refs.resultsKicker.textContent = cleared ? 'SCENE CLEARED' : 'TIME UP';
    refs.resultsTitle.textContent = state.scene.title;
    refs.resultsLine.textContent = cleared
      ? `All seven differences found · ${state.scene.subtitle}`
      : `${left} still hidden — give this scene another look.`;
    refs.resultTime.textContent = formatTime(state.timeLeft);
    refs.resultMisses.textContent = String(state.misses);
    refs.resultStars.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    refs.resultsNext.textContent = state.isLast ? 'Play again ' : 'Next scene ';
    refs.resultsNext.appendChild(Object.assign(document.createElement('kbd'), { textContent: state.isLast ? 'R' : 'N' }));
    refs.results.hidden = false;
  }

  function hideResults() {
    refs.results.hidden = true;
  }

  return { setScene, update, toast, announce, showResults, hideResults, refs };
}
