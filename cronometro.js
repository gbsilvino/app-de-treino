let cronometroInterval = null;
let tempoFimGlobal = null;

// Exportamos uma função para pegar o estado atual do tempoFim (Usado no salvamento de estado)
export function getTempoFimGlobal() {
  return tempoFimGlobal;
}

export function iniciarCronometro(segundos, displayElement, containerElement) {
  clearInterval(cronometroInterval);
  if (containerElement) containerElement.style.display = 'block';
  
  // Calcula exatamente a que horas (no relógio do sistema) o cronômetro deve apitar
  const tempoFim = Date.now() + segundos * 1000;
  tempoFimGlobal = tempoFim;

  function atualizarDisplay() {
    // Calcula a diferença entre o tempo alvo e a hora real de agora
    let restante = Math.round((tempoFim - Date.now()) / 1000);
    
    if (restante <= 0) {
      restante = 0;
      clearInterval(cronometroInterval);
      if (displayElement) displayElement.style.color = '#ef4444'; // Fica vermelho quando acaba
    } else {
      if (displayElement) displayElement.style.color = '#10b981'; // Verde enquanto roda
    }

    const m = Math.floor(restante / 60).toString().padStart(2, '0');
    const s = (restante % 60).toString().padStart(2, '0');
    if (displayElement) displayElement.textContent = `${m}:${s}`;
  }

  atualizarDisplay();
  cronometroInterval = setInterval(atualizarDisplay, 1000);
}

export function pararCronometro(containerElement) {
  clearInterval(cronometroInterval);
  if (containerElement) containerElement.style.display = 'none';
  tempoFimGlobal = null;
}
