let volumeChart = null; // Variável mantida isolada neste módulo

export function renderGraficoVolume(historico, exerciciosPreDefinidos, historicoGraficoCanvas, filtroMusculoSelect) {
  if (!historicoGraficoCanvas || typeof Chart === 'undefined') return;
  const ctx = historicoGraficoCanvas.getContext('2d');

  const dadosOrdenados = [...historico].sort((a, b) => new Date(a.data) - new Date(b.data));
  const semanasMap = {};

  dadosOrdenados.forEach(sessao => {
    const data = new Date(sessao.data);
    const diaSemana = data.getDay();
    const diff = data.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
    const segunda = new Date(data);
    segunda.setDate(diff);
    segunda.setHours(0,0,0,0);

    const domingo = new Date(segunda);
    domingo.setDate(domingo.getDate() + 6);

    const formatarData = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const chaveSemana = `${formatarData(segunda)} - ${formatarData(domingo)}`;

    if (!semanasMap[chaveSemana]) semanasMap[chaveSemana] = { totais: {} };

    if (sessao.exercicios) {
      sessao.exercicios.forEach(ex => {
        const def = exerciciosPreDefinidos.find(e => e.nome === ex.nome);
        if (def && def.musculos) {
          Object.entries(def.musculos).forEach(([musculo, valor]) => {
            semanasMap[chaveSemana].totais[musculo] = (semanasMap[chaveSemana].totais[musculo] || 0) + (valor * ex.series.length);
          });
        }
      });
    }
  });

  const labels = Object.keys(semanasMap);
  const musculoSelecionado = filtroMusculoSelect ? filtroMusculoSelect.value : '';
  
  const dataPoints = labels.map(semana => {
    if (musculoSelecionado) return semanasMap[semana].totais[musculoSelecionado] || 0;
    return Object.values(semanasMap[semana].totais).reduce((a, b) => a + b, 0);
  });

  if (volumeChart) volumeChart.destroy();

  volumeChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: musculoSelecionado ? `Séries de ${musculoSelecionado}` : 'Total de Séries (Geral)',
        data: dataPoints,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#2563eb',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
      plugins: { legend: { display: false } }
    }
  });
}