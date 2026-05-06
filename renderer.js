// build: 2026-05-05T00:00:00Z
import { iniciarCronometro, pararCronometro, getTempoFimGlobal } from './cronometro.js';
import {
  salvarEstadoStorage, carregarEstadoStorage, salvarExerciciosTreinoStorage, carregarExerciciosTreinoStorage,
  removerExerciciosTreinoStorage, transferirExerciciosTreinoStorage, copiarExerciciosTreinoStorage,
  salvarEstadoExecucaoStorage, carregarEstadoExecucaoStorage, carregarDiretorioVideos, salvarDiretorioVideos,
  limparDadosAntigosStorage, sincronizarDoSupabase, getCurrentUserId
} from './storage.js';
import { initAuth, showAuthOverlay, fetchUserProfile, fetchClientes, isProfissional } from './auth-controller.js';
import {
  GRUPOS_MUSCULARES,
  renderOpcoesTreinosUI,
  atualizarListaTreinosUI,
  atualizarListaExerciciosUI,
  renderHistoricoUI,
  renderOpcoesExerciciosUI,
  renderVisaoGeralExecucaoUI
} from './ui.js';
import { renderGraficoVolume } from './chart.js';

// Monitor de Erros Global (Interface)
window.addEventListener('error', function(event) {
  console.error("Crash detectado na interface:", event.error);
  alert(`⚠️ CRASH DETECTADO!\n\nUma falha impediu o funcionamento correto do aplicativo.\n\nMensagem: ${event.message}\nArquivo: ${event.filename}\nLinha: ${event.lineno}\n\nVerifique o console (Ctrl+Shift+I) para mais detalhes antes de liberar a versão.`);
});

const treinoScreen = document.getElementById('treinoScreen');
const sessaoScreen = document.getElementById('sessaoScreen');
const treinoSelect = document.getElementById('treinoSelect');
const novoTreinoInput = document.getElementById('novoTreino');
const adicionarTreinoBtn = document.getElementById('adicionarTreinoBtn');
const treinoList = document.getElementById('treinoList');
const confirmarTreinoBtn = document.getElementById('confirmarTreinoBtn');
const voltarTreinoBtn = document.getElementById('voltarTreinoBtn');
const treinoAtualSpan = document.getElementById('treinoAtual');
const editarNomeTreinoBtn = document.getElementById('editarNomeTreinoBtn');
const exercicioSelect = document.getElementById('exercicioSelect');
const adicionarExercicioBtn = document.getElementById('adicionarExercicioBtn');
const limparExerciciosBtn = document.getElementById('limparExerciciosBtn');
const exercicioList = document.getElementById('exercicioList');
const historicoScreen = document.getElementById('historicoScreen');
const exerciciosScreen = document.getElementById('exerciciosScreen');
const novoExercicioPreDefinido = document.getElementById('novoExercicioPreDefinido');
const addExercicioPreDefinidoBtn = document.getElementById('addExercicioPreDefinidoBtn');
const exerciciosPreDefinidosList = document.getElementById('exerciciosPreDefinidosList');
const caminhoPastaVideos = document.getElementById('caminhoPastaVideos');
const selecionarPastaBtn = document.getElementById('selecionarPastaBtn');
const buscaExercicioInput = document.getElementById('buscaExercicioInput');
const bottomNav = document.getElementById('bottomNav');
const navTreinos = document.getElementById('navTreinos');
const navHistorico = document.getElementById('navHistorico');
const navExercicios = document.getElementById('navExercicios');
const historicoList = document.getElementById('historicoList');
const erroSessao = document.getElementById('erroSessao');
const iniciarTreinoBtn = document.getElementById('iniciarTreinoBtn');
const execucaoScreen = document.getElementById('execucaoScreen');
const cancelarExecucaoBtn = document.getElementById('cancelarExecucaoBtn');
const finalizarAntecipadoBtn = document.getElementById('finalizarAntecipadoBtn');
const execucaoTitle = document.getElementById('execucaoTitle');
const flashcardContainer = document.getElementById('flashcardContainer');
const flashcardExercicio = document.getElementById('flashcardExercicio');
const flashcardVideo = document.getElementById('flashcardVideo');
const flashcardVideoSelect = document.getElementById('flashcardVideoSelect');
const flashcardSerie = document.getElementById('flashcardSerie');
const flashcardReps = document.getElementById('flashcardReps');
const flashcardCarga = document.getElementById('flashcardCarga');
const flashcardDescanso = document.getElementById('flashcardDescanso');
const flashcardObservacao = document.getElementById('flashcardObservacao');
const cronometroContainer = document.getElementById('cronometroContainer');
const cronometroDisplay = document.getElementById('cronometroDisplay');
const iniciarCronometroBtn = document.getElementById('iniciarCronometroBtn');
const voltarSerieBtn = document.getElementById('voltarSerieBtn');
const proximaSerieBtn = document.getElementById('proximaSerieBtn');
const execucaoExercicioSelect = document.getElementById('execucaoExercicioSelect');
const execucaoAdicionarExercicioBtn = document.getElementById('execucaoAdicionarExercicioBtn');
const execucaoAdicionarSerieBtn = document.getElementById('execucaoAdicionarSerieBtn');
const tabFlashcardBtn = document.getElementById('tabFlashcardBtn');
const tabVisaoGeralBtn = document.getElementById('tabVisaoGeralBtn');
const viewFlashcards = document.getElementById('viewFlashcards');
const viewVisaoGeral = document.getElementById('viewVisaoGeral');
const execucaoVisaoGeralList = document.getElementById('execucaoVisaoGeralList');
const tabSessaoBtn = document.getElementById('tabSessaoBtn');
const tabSemanalBtn = document.getElementById('tabSemanalBtn');
const filtroMusculoSelect = document.getElementById('filtroMusculoSelect');
const historicoGraficoCanvas = document.getElementById('historicoGraficoCanvas');

let treinos = [];
let treinoSelecionado = '';
let exercicios = [];
let historico = [];
let seriesParaExecutar = [];
let serieAtualIndex = 0;
let abaHistoricoAtiva = 'sessao';
let exerciciosPreDefinidos = [];
let diretorioVideos = carregarDiretorioVideos();
let todosVideosDaPasta = [];

const DEFAULT_TREINOS = ['Treino A', 'Treino B', 'Treino C'];

if (filtroMusculoSelect) {
  GRUPOS_MUSCULARES.forEach(m => {
    const option = document.createElement('option');
    option.value = m;
    option.textContent = m;
    filtroMusculoSelect.appendChild(option);
  });
  filtroMusculoSelect.addEventListener('change', () => renderGraficoVolume(historico, exerciciosPreDefinidos, historicoGraficoCanvas, filtroMusculoSelect));
}

function sincronizarVideosDaPasta() {
  if (!diretorioVideos) return null;
  if (window.electron && typeof window.electron.lerPastaDeVideos === 'function') {
    try {
      let contadorAtualizados = 0;
      const nomesVideos = window.electron.lerPastaDeVideos(diretorioVideos);
      
      todosVideosDaPasta = nomesVideos.map(nomeArquivo => {
        const filePath = `${diretorioVideos}/${nomeArquivo}`.replace(/\\/g, '/');
        const urlSegura = filePath.split('/').map(part => part.includes(':') ? part : encodeURIComponent(part)).join('/');
        return `file:///${urlSegura}`;
      });

      // Varre apenas os exercícios que já existem no app e associa vídeos a eles
      exerciciosPreDefinidos.forEach(ex => {
        const nomeEx = ex.nome.trim().toLowerCase();
        if (nomeEx) {
          // Procura todos os vídeos cujo nome de arquivo contém o nome do exercício
          const autoVideos = todosVideosDaPasta.filter(url => decodeURIComponent(url.split('/').pop()).toLowerCase().includes(nomeEx));
          const manualVideos = (ex.videosManuais || []).filter(url => todosVideosDaPasta.includes(url));
          ex.videosManuais = manualVideos;
          
          ex.videosDisponiveis = [...new Set([...autoVideos, ...manualVideos])];

          // Se o vídeo atual não estiver na lista de disponíveis ou for nulo, pega o primeiro da lista
          if ((!ex.video || !ex.videosDisponiveis.includes(ex.video)) && ex.videosDisponiveis.length > 0) {
            ex.video = ex.videosDisponiveis[0];
            contadorAtualizados++;
          } else if (ex.videosDisponiveis.length === 0) {
            ex.video = null;
          }
        }
      });
      return { encontrados: nomesVideos.length, novos: 0, atualizados: contadorAtualizados };
    } catch (error) {
      console.error("Erro ao sincronizar vídeos da pasta:", error);
    }
  }
  return null;
}

function salvarEstado() {
  salvarEstadoStorage(treinos, treinoSelecionado, historico, exerciciosPreDefinidos);
}

function salvarExerciciosDoTreino() {
  salvarExerciciosTreinoStorage(treinoSelecionado, exercicios);
}

function salvarEstadoExecucao() {
  const estado = {
    emExecucao: execucaoScreen.classList.contains('active'),
    treinoSelecionado,
    seriesParaExecutar,
    serieAtualIndex,
    tempoFimCronometro: getTempoFimGlobal()
  };
  salvarEstadoExecucaoStorage(estado);
}

function recuperarEstadoExecucao() {
  const estadoSalvo = carregarEstadoExecucaoStorage();
  if (estadoSalvo && estadoSalvo.emExecucao) {
    treinoSelecionado = estadoSalvo.treinoSelecionado;
    seriesParaExecutar = estadoSalvo.seriesParaExecutar || [];
    serieAtualIndex = Math.min(estadoSalvo.serieAtualIndex || 0, Math.max(0, seriesParaExecutar.length - 1));
    
    exercicios = carregarExerciciosTreinoStorage(treinoSelecionado) || [];

    execucaoTitle.textContent = treinoSelecionado;
    treinoAtualSpan.textContent = treinoSelecionado;
    
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    execucaoScreen.classList.add('active');
    bottomNav.classList.remove('active');
    
    if (tabFlashcardBtn) tabFlashcardBtn.className = 'tab-btn';
    if (tabVisaoGeralBtn) tabVisaoGeralBtn.className = 'tab-btn secondary-button';
    if (viewFlashcards) viewFlashcards.style.display = 'block';
    if (viewVisaoGeral) viewVisaoGeral.style.display = 'none';

    if (estadoSalvo.tempoFimCronometro && estadoSalvo.tempoFimCronometro > Date.now()) {
       const segundosRestantes = Math.round((estadoSalvo.tempoFimCronometro - Date.now()) / 1000);
       iniciarCronometro(segundosRestantes, cronometroDisplay, cronometroContainer);
    }

    renderizarFlashcard();
  }
}

function carregarEstado() {
  const estadoSalvo = carregarEstadoStorage() || {};
  const { historicoSalvo, exerciciosSalvos, treinosSalvos, selecionadoSalvo } = estadoSalvo;

  historico = Array.isArray(historicoSalvo) ? historicoSalvo : [];
  treinos = Array.isArray(treinosSalvos) && treinosSalvos.length > 0 ? treinosSalvos : [...DEFAULT_TREINOS];
  treinoSelecionado = selecionadoSalvo || treinos[0] || '';
  if (treinoSelecionado === "undefined" || treinoSelecionado === "null") treinoSelecionado = treinos[0] || '';
  
  if (caminhoPastaVideos) caminhoPastaVideos.value = diretorioVideos;
  
  if (Array.isArray(exerciciosSalvos) && exerciciosSalvos.length > 0) {
    exerciciosPreDefinidos = exerciciosSalvos.map(ex => ({
      ...ex,
      video: ex.video || (diretorioVideos ? `file:///${diretorioVideos}/${ex.nome}.mp4`.replace(/\\/g, '/') : null)
    }));
  } else {
    exerciciosPreDefinidos = [
      { nome: 'Supino Reto', musculos: { 'Peitoral': 1, 'Tríceps': 0.5, 'Deltoide Anterior': 0.5 } },
      { nome: 'Agachamento', musculos: { 'Quadríceps': 1, 'Glúteos': 1 } },
      { nome: 'Desenvolvimento Aberto', musculos: { 'Deltoide Anterior': 1, 'Deltoide Lateral': 0.5, 'Tríceps': 0.5 } },
      { nome: 'Levantamento Terra', musculos: { 'Lombar': 1, 'Posterior de Coxa': 1, 'Glúteos': 1 } },
      { nome: 'Supino Inclinado', musculos: { 'Peitoral': 1, 'Deltoide Anterior': 0.5, 'Tríceps': 0.5 } },
      { nome: 'Supino Declinado', musculos: { 'Peitoral': 1, 'Tríceps': 0.5 } },
      { nome: 'Puxada Aberta', musculos: { 'Costas': 1, 'Bíceps': 0.5 } },
      { nome: 'Puxada Fechada', musculos: { 'Costas': 1, 'Bíceps': 0.5 } },
      { nome: 'Remada Aberta', musculos: { 'Costas': 1, 'Deltoide Posterior': 0.5, 'Bíceps': 0.5 } },
      { nome: 'Remada Fechada', musculos: { 'Costas': 1, 'Bíceps': 0.5 } },
      { nome: 'Cadeira Extensora', musculos: { 'Quadríceps': 1 } },
      { nome: 'Cadeira Flexora', musculos: { 'Posterior de Coxa': 1 } },
      { nome: 'Mesa Flexora', musculos: { 'Posterior de Coxa': 1 } },
      { nome: 'Cadeira Adutora', musculos: { 'Adutores': 1 } },
      { nome: 'Cadeira Abdutora', musculos: { 'Glúteos': 1 } },
      { nome: 'Crucifixo Reto', musculos: { 'Peitoral': 1 } },
      { nome: 'Crucifixo Inverso', musculos: { 'Deltoide Posterior': 1 } },
      { nome: 'Abdução de Ombros', musculos: { 'Deltoide Lateral': 1 } },
      { nome: 'Stiff', musculos: { 'Posterior de Coxa': 1, 'Glúteos': 0.5, 'Lombar': 0.5 } },
      { nome: 'Agachamento Búlgaro', musculos: { 'Quadríceps': 1, 'Glúteos': 1 } },
      { nome: 'Leg Press', musculos: { 'Quadríceps': 1, 'Glúteos': 1, 'Adutores': 0.5 } },
      { nome: 'Tríceps', musculos: { 'Tríceps': 1 } },
      { nome: 'Tríceps Testa', musculos: { 'Tríceps': 1 } },
      { nome: 'Tríceps Francês', musculos: { 'Tríceps': 1 } },
      { nome: 'Tríceps Supinado', musculos: { 'Tríceps': 1 , 'Antebraço': 0.5} },
      { nome: 'Bíceps', musculos: { 'Bíceps': 1 } },
      { nome: 'Bíceps Scott', musculos: { 'Bíceps': 1 } },
      { nome: 'Bíceps Neutro', musculos: { 'Bíceps': 1, 'Antebraço': 0.5 } },
      { nome: 'Bíceps Pronado', musculos: { 'Antebraço': 1, 'Bíceps': 0.5 } },
      { nome: 'Flexão de Punho', musculos: { 'Antebraço': 1 } },
      { nome: 'Extensão de Punho', musculos: { 'Antebraço': 1 } },
      { nome: 'Encolhimento de Ombros', musculos: { 'Trapézio Superior': 1 } },
      { nome: 'Remada Alta', musculos: { 'Trapézio Superior': 1, 'Deltoide Lateral': 1, 'Bíceps': 0.5 } },
      { nome: 'Flexão de Ombros', musculos: { 'Deltoide Anterior': 1, 'Deltoide Lateral': 0.5 } },
      { nome: 'Pulldown', musculos: { 'Costas': 1, 'Peitoral': 0.5 } },
      { nome: 'Prancha Frontal', musculos: { 'Abdômen': 1 } },
      { nome: 'Prancha Lateral', musculos: { 'Abdômen': 0.5, 'Lombar': 0.5 } },
      { nome: 'Abdominal Supra', musculos: { 'Abdômen': 1 } },
      { nome: 'Abdominal Infra', musculos: { 'Abdômen': 1 } },
      { nome: 'Flexão Plantar', musculos: { 'Panturrilha': 1 } },
      { nome: 'Elevação Pélvica', musculos: { 'Glúteos': 1 } },
      { nome: 'Extensão de Quadril', musculos: { 'Glúteos': 1 } },
    ].map(ex => ({ ...ex, video: diretorioVideos ? `file:///${diretorioVideos}/${ex.nome}.mp4`.replace(/\\/g, '/') : null }));
  }
  
  sincronizarVideosDaPasta();
  
  renderOpcoesExercicios();

  // Garante que históricos antigos tenham um ID para que possam ser removidos sem erros
  historico.forEach(h => {
    if (!h.id) h.id = Math.random().toString(36).substring(2, 9);
  });

  mostrarTelaPrincipal();
  recuperarEstadoExecucao();
}

function mostrarTelaPrincipal() {
  sessaoScreen.classList.remove('active');
  historicoScreen.classList.remove('active');
  execucaoScreen.classList.remove('active');
  exerciciosScreen.classList.remove('active');
  treinoScreen.classList.add('active');
  bottomNav.classList.add('active');
  navTreinos.classList.add('active');
  navHistorico.classList.remove('active');
  navExercicios.classList.remove('active');

  if (!treinos.includes(treinoSelecionado)) {
    treinoSelecionado = treinos[0] || '';
  }

  renderOpcoesTreinos();
  atualizarListaTreinos();
  renderHistorico();
  salvarEstado();
}

function renderOpcoesTreinos() {
  treinoSelect.innerHTML = '';
  treinos.forEach((treino) => {
    const option = document.createElement('option');
    option.value = treino;
    option.textContent = treino;
    treinoSelect.appendChild(option);
  });
  treinoSelect.value = treinoSelecionado;
}

function atualizarListaTreinos() {
  treinoList.innerHTML = '';

  if (treinos.length === 0) {
    const aviso = document.createElement('p');
    aviso.className = 'small-text';
    aviso.textContent = 'Não há treinos cadastrados. Adicione um novo treino abaixo.';
    treinoList.appendChild(aviso);
    return;
  }

  treinos.forEach((treino, index) => {
    const item = document.createElement('div');
    item.className = 'list-item';

    const label = document.createElement('span');
    label.textContent = treino;
    label.style.cursor = 'pointer';
    label.style.flex = '1';
    label.style.fontWeight = '700';
    label.style.color = '#3b82f6';
    label.addEventListener('click', () => {
      treinoSelecionado = treino;
      renderOpcoesTreinos();
      salvarEstado();
      mostrarTelaSessao();
    });

    const itemActions = document.createElement('div');
    itemActions.className = 'item-actions';

    const reorderDiv = document.createElement('div');
    reorderDiv.className = 'reorder-btns';

    const upBtn = document.createElement('button');
    upBtn.type = 'button';
    upBtn.textContent = '↑';
    upBtn.disabled = index === 0;
    upBtn.addEventListener('click', () => moverTreino(index, -1));

    const downBtn = document.createElement('button');
    downBtn.type = 'button';
    downBtn.textContent = '↓';
    downBtn.disabled = index === treinos.length - 1;
    downBtn.addEventListener('click', () => moverTreino(index, 1));

    reorderDiv.appendChild(upBtn);
    reorderDiv.appendChild(downBtn);

    const duplicarBtn = document.createElement('button');
    duplicarBtn.type = 'button';
    duplicarBtn.className = 'duplicate-btn';
    duplicarBtn.textContent = 'Duplicar';
    duplicarBtn.addEventListener('click', () => duplicarTreino(treino, index));

    const remover = document.createElement('button');
    remover.type = 'button';
    remover.textContent = 'Remover';
    remover.addEventListener('click', () => {
      removerTreino(treino);
    });

    itemActions.appendChild(reorderDiv);
    itemActions.appendChild(duplicarBtn);
    itemActions.appendChild(remover);

    item.appendChild(label);
    item.appendChild(itemActions);
    treinoList.appendChild(item);
  });
}

function adicionarTreino(novoTreino) {
  const label = novoTreino.trim();
  if (!label) {
    alert('Digite o nome do treino antes de adicionar.');
    return;
  }

  if (treinos.includes(label)) {
    alert('Este treino já existe.');
    return;
  }

  treinos.push(label);
  treinoSelecionado = label;
  renderOpcoesTreinos();
  atualizarListaTreinos();
  salvarEstado();
  novoTreinoInput.value = '';
}

function removerTreino(treino) {
  treinos = treinos.filter((item) => item !== treino);
  removerExerciciosTreinoStorage(treino);
  if (treinoSelecionado === treino) {
    treinoSelecionado = treinos[0] || '';
  }
  renderOpcoesTreinos();
  atualizarListaTreinos();
  salvarEstado();
}

function duplicarTreino(nomeOriginal, index) {
  let novoNome = nomeOriginal + ' (Cópia)';
  let counter = 1;
  
  while (treinos.includes(novoNome)) {
    novoNome = nomeOriginal + ` (Cópia ${counter})`;
    counter++;
  }
  
  treinos.splice(index + 1, 0, novoNome);
  treinoSelecionado = novoNome;
  
  copiarExerciciosTreinoStorage(nomeOriginal, novoNome);
  
  renderOpcoesTreinos();
  atualizarListaTreinos();
  salvarEstado();
}

function moverTreino(index, direcao) {
  const novoIndex = index + direcao;
  if (novoIndex < 0 || novoIndex >= treinos.length) return;
  const temp = treinos[index];
  treinos[index] = treinos[novoIndex];
  treinos[novoIndex] = temp;
  renderOpcoesTreinos();
  atualizarListaTreinos();
  salvarEstado();
}

function mostrarTelaSessao() {
  treinoAtualSpan.textContent = treinoSelecionado;
  treinoScreen.classList.remove('active');
  sessaoScreen.classList.add('active');
  bottomNav.classList.add('active');
  exercicios = carregarExerciciosTreinoStorage(treinoSelecionado) || [];
  erroSessao.textContent = '';
  atualizarListaExercicios();
}

function voltarTelaTreino() {
  sessaoScreen.classList.remove('active');
  treinoScreen.classList.add('active');
  bottomNav.classList.add('active');
}

function adicionarExercicio(indexStr) {
  if (!indexStr) return;
  const index = parseInt(indexStr, 10);
  if (isNaN(index) || !exerciciosPreDefinidos[index]) return;
  const def = exerciciosPreDefinidos[index];

  exercicios.push({ nome: def.nome, series: [], observacao: '' });
  atualizarListaExercicios();
}

function removerExercicio(index) {
  exercicios.splice(index, 1);
  atualizarListaExercicios();
}

function moverExercicio(index, direcao) {
  const novoIndex = index + direcao;
  if (novoIndex < 0 || novoIndex >= exercicios.length) return;
  const temp = exercicios[index];
  exercicios[index] = exercicios[novoIndex];
  exercicios[novoIndex] = temp;
  atualizarListaExercicios();
}

function adicionarSerie(exercicioIndex) {
  exercicios[exercicioIndex].series.push({ repeticoes: '', carga: '', descanso: '120' });
  atualizarListaExercicios();
}

function removerSerie(exercicioIndex, serieIndex) {
  exercicios[exercicioIndex].series.splice(serieIndex, 1);
  atualizarListaExercicios();
}

function atualizarListaExercicios() {
  salvarExerciciosDoTreino();
  atualizarListaExerciciosUI(exercicios, exercicioList, {
    onMove: (index, dir) => moverExercicio(index, dir),
    onRemove: (index) => removerExercicio(index),
    onChangeObs: (index, obs) => {
      exercicios[index].observacao = obs;
      salvarExerciciosDoTreino();
    },
    onRemoveSerie: (index) => {
      if (exercicios[index].series.length > 0) {
        removerSerie(index, exercicios[index].series.length - 1);
      }
    },
    onAddSerie: (index) => adicionarSerie(index)
  });
}

function renderHistorico() {
  renderHistoricoUI(historico, abaHistoricoAtiva, exerciciosPreDefinidos, historicoList, {
    onRemove: (id) => {
      if (confirm('Tem certeza que deseja remover este histórico?')) {
        historico = historico.filter(h => h.id !== id);
        salvarEstado();
        renderHistorico();
      }
    }
  });
  renderGraficoVolume(historico, exerciciosPreDefinidos, historicoGraficoCanvas, filtroMusculoSelect);
}

function renderOpcoesExercicios() {
  // Ordena os exercícios predefinidos em ordem alfabética pelo nome
  exerciciosPreDefinidos.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

  renderOpcoesExerciciosUI(exerciciosPreDefinidos, todosVideosDaPasta, exercicioSelect, execucaoExercicioSelect, exerciciosPreDefinidosList, {
    onRemove: (index) => removerExercicioPreDefinido(index),
    onChangeVideo: (index, url) => {
      exerciciosPreDefinidos[index].video = url;
      salvarEstado();
    },
    onRemoveMusculo: (index, musculo) => {
      delete exerciciosPreDefinidos[index].musculos[musculo];
      salvarEstado();
      renderOpcoesExercicios();
    },
    onAddMusculo: (index, musculo, valor) => {
      exerciciosPreDefinidos[index].musculos[musculo] = valor;
      salvarEstado();
      renderOpcoesExercicios();
    },
    onAddVideoManual: (index, url) => {
      if (!exerciciosPreDefinidos[index].videosManuais) exerciciosPreDefinidos[index].videosManuais = [];
      if (!exerciciosPreDefinidos[index].videosManuais.includes(url)) {
        exerciciosPreDefinidos[index].videosManuais.push(url);
        sincronizarVideosDaPasta();
        salvarEstado();
        renderOpcoesExercicios();
      }
    },
    onRemoveVideoManual: (index, url) => {
      const ex = exerciciosPreDefinidos[index];
      if (ex && ex.videosManuais) {
        ex.videosManuais = ex.videosManuais.filter(v => v !== url);
        sincronizarVideosDaPasta();
        salvarEstado();
        renderOpcoesExercicios();
      }
    }
  });

  if (buscaExercicioInput && buscaExercicioInput.value) {
    buscaExercicioInput.dispatchEvent(new Event('input'));
  }
}

function adicionarExercicioPreDefinido(nome) {
  const label = nome.trim();
  if (!label || exerciciosPreDefinidos.some(ex => ex.nome === label)) return;
  
  exerciciosPreDefinidos.push({ nome: label, musculos: {} });
  novoExercicioPreDefinido.value = '';
  sincronizarVideosDaPasta();
  renderOpcoesExercicios();
  salvarEstado();
}

function removerExercicioPreDefinido(index) {
  exerciciosPreDefinidos.splice(index, 1);
  renderOpcoesExercicios();
  salvarEstado();
}

adicionarTreinoBtn.addEventListener('click', () => {
  adicionarTreino(novoTreinoInput.value);
});

novoTreinoInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    adicionarTreinoBtn.click();
  }
});

treinoSelect.addEventListener('change', (event) => {
  treinoSelecionado = event.target.value;
  salvarEstado();
});

confirmarTreinoBtn.addEventListener('click', () => {
  mostrarTelaSessao();
});

voltarTreinoBtn.addEventListener('click', () => {
  voltarTelaTreino();
});

editarNomeTreinoBtn.addEventListener('click', () => {
  const nomeAntigo = treinoSelecionado;
  const index = treinos.indexOf(nomeAntigo);
  if (index === -1) return;

  const input = document.createElement('input');
  input.type = 'text';
  input.value = nomeAntigo;
  input.style.width = '200px';
  input.style.padding = '8px 12px';
  input.style.fontSize = '16px';
  input.style.margin = '0';
  input.style.borderRadius = '8px';
  input.style.border = '1px solid #3b82f6';
  
  const salvarBtn = document.createElement('button');
  salvarBtn.type = 'button';
  salvarBtn.textContent = 'Salvar';
  salvarBtn.className = 'edit-btn';
  salvarBtn.style.width = 'auto';
  salvarBtn.style.padding = '8px 12px';
  salvarBtn.style.marginLeft = '8px';
  salvarBtn.style.border = 'none';
  salvarBtn.style.borderRadius = '8px';
  salvarBtn.style.fontWeight = '700';

  const cancelarBtn = document.createElement('button');
  cancelarBtn.type = 'button';
  cancelarBtn.textContent = 'Cancelar';
  cancelarBtn.className = 'remove-serie-btn';
  cancelarBtn.style.width = 'auto';
  cancelarBtn.style.padding = '8px 12px';
  cancelarBtn.style.marginLeft = '4px';

  treinoAtualSpan.innerHTML = '';
  treinoAtualSpan.appendChild(input);
  treinoAtualSpan.appendChild(salvarBtn);
  treinoAtualSpan.appendChild(cancelarBtn);
  editarNomeTreinoBtn.style.display = 'none';

  input.focus();

  const finalizarEdicao = (novoNome) => {
    if (novoNome === null) {
      treinoAtualSpan.textContent = nomeAntigo;
      return;
    }

    const labelTrimmed = novoNome.trim();
    if (!labelTrimmed || labelTrimmed === nomeAntigo) {
      treinoAtualSpan.textContent = nomeAntigo;
      return;
    }

    if (treinos.includes(labelTrimmed)) {
      alert('Já existe um treino com este nome.');
      treinoAtualSpan.textContent = nomeAntigo;
      return;
    }

    treinos[index] = labelTrimmed;
    treinoSelecionado = labelTrimmed;
    treinoAtualSpan.textContent = treinoSelecionado;
    if (execucaoTitle) execucaoTitle.textContent = treinoSelecionado;
    
    transferirExerciciosTreinoStorage(nomeAntigo, labelTrimmed);

    historico.forEach(h => {
      if (h.treino === nomeAntigo) h.treino = labelTrimmed;
    });

    renderOpcoesTreinos();
    atualizarListaTreinos();
    treinoAtualSpan.innerHTML = '';
    treinoAtualSpan.textContent = treinoSelecionado;
    editarNomeTreinoBtn.style.display = 'inline-block';
    salvarEstado();
    renderHistorico();
  };

  salvarBtn.addEventListener('click', () => finalizarEdicao(input.value));
  cancelarBtn.addEventListener('click', () => finalizarEdicao(null));
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') finalizarEdicao(input.value);
  });
});

adicionarExercicioBtn.addEventListener('click', () => {
  adicionarExercicio(exercicioSelect.value);
});

if (limparExerciciosBtn) {
  limparExerciciosBtn.addEventListener('click', () => {
    if (exercicios.length > 0 && confirm('Tem certeza que deseja limpar todos os exercícios deste treino?')) {
      exercicios = [];
      atualizarListaExercicios();
    }
  });
}

addExercicioPreDefinidoBtn.addEventListener('click', () => {
  adicionarExercicioPreDefinido(novoExercicioPreDefinido.value);
});

if (selecionarPastaBtn) {
  selecionarPastaBtn.addEventListener('click', async () => {
    if (window.electron && typeof window.electron.selecionarPasta === 'function') {
      const pastaSelecionada = await window.electron.selecionarPasta();
      if (pastaSelecionada) {
        diretorioVideos = pastaSelecionada;
        salvarDiretorioVideos(diretorioVideos);
        if (caminhoPastaVideos) caminhoPastaVideos.value = diretorioVideos;
        const resultado = sincronizarVideosDaPasta();
        salvarEstado();
        renderOpcoesExercicios();
        
        if (resultado) {
          alert(`Sincronização concluída!\n\nVídeos encontrados: ${resultado.encontrados}\nExercícios atualizados: ${resultado.atualizados}\nNovos exercícios criados: ${resultado.novos}`);
        } else {
          alert('Nenhum vídeo de formato compatível encontrado na pasta ou ocorreu um erro.');
        }
      }
    } else {
      alert('A funcionalidade de selecionar pasta não está disponível neste ambiente.');
    }
  });
}

novoExercicioPreDefinido.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addExercicioPreDefinidoBtn.click();
  }
});

if (buscaExercicioInput) {
  buscaExercicioInput.addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase().trim();
    const itens = exerciciosPreDefinidosList.querySelectorAll('.exercicio-item');
    itens.forEach(item => {
      const titulo = item.querySelector('h3').textContent.toLowerCase();
      if (titulo.includes(termo)) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
  });
}

iniciarTreinoBtn.addEventListener('click', () => {
  seriesParaExecutar = [];
  pararCronometro(cronometroContainer); // Garante que o cronômetro seja zerado e ocultado ao começar um novo treino
  
  for (let eIndex = 0; eIndex < exercicios.length; eIndex++) {
    const ex = exercicios[eIndex];
    if (ex.series.length === 0) continue;
    
    for (let sIndex = 0; sIndex < ex.series.length; sIndex++) {
      seriesParaExecutar.push({
        exercicioIndex: eIndex,
        serieIndex: sIndex,
        nomeExercicio: ex.nome,
        totalSeries: ex.series.length,
        serieNumero: sIndex + 1,
        repeticoes: ex.series[sIndex].repeticoes,
        carga: ex.series[sIndex].carga,
        descanso: ex.series[sIndex].descanso || '120',
        preenchida: false
      });
    }
  }

  if (seriesParaExecutar.length === 0) {
    erroSessao.textContent = 'Adicione pelo menos um exercício com uma série para iniciar.';
    return;
  }
  erroSessao.textContent = '';

  serieAtualIndex = 0;
  execucaoTitle.textContent = treinoSelecionado;
  
  if (tabFlashcardBtn) tabFlashcardBtn.className = 'tab-btn';
  if (tabVisaoGeralBtn) tabVisaoGeralBtn.className = 'tab-btn secondary-button';
  if (viewFlashcards) viewFlashcards.style.display = 'block';
  if (viewVisaoGeral) viewVisaoGeral.style.display = 'none';

  sessaoScreen.classList.remove('active');
  bottomNav.classList.remove('active');
  execucaoScreen.classList.add('active');
  
  renderizarFlashcard();
});

function renderizarFlashcard(direcao = 'padrao') {
  flashcardContainer.style.transform = '';
  flashcardContainer.style.transition = '';

  flashcardContainer.classList.remove('flashcard-anim', 'flashcard-anim-left', 'flashcard-anim-right');
  void flashcardContainer.offsetWidth; // Força o navegador a reiniciar a animação

  if (direcao === 'direita') {
    flashcardContainer.classList.add('flashcard-anim-right');
  } else if (direcao === 'esquerda') {
    flashcardContainer.classList.add('flashcard-anim-left');
  } else {
    flashcardContainer.classList.add('flashcard-anim');
  }

  if (serieAtualIndex >= seriesParaExecutar.length) {
    finalizarTreino();
    return;
  }
  
  voltarSerieBtn.disabled = serieAtualIndex === 0;
  if (serieAtualIndex === seriesParaExecutar.length - 1) {
    proximaSerieBtn.textContent = 'Finalizar';
    proximaSerieBtn.style.fontSize = '16px';
  } else {
    proximaSerieBtn.textContent = '→';
    proximaSerieBtn.style.fontSize = '24px';
  }

  const serieAtual = seriesParaExecutar[serieAtualIndex];
  const exInstancia = exercicios[serieAtual.exercicioIndex];
  flashcardExercicio.textContent = exInstancia.nome || serieAtual.nomeExercicio;
  flashcardSerie.textContent = `Série ${serieAtual.serieNumero} de ${serieAtual.totalSeries}`;
  
  if (flashcardVideo) {
    // Encontra a definição do exercício para obter a URL do vídeo correto
    const exPreDefinido = exerciciosPreDefinidos.find(e => e.nome === exInstancia.nome);
    const videoUrl = exPreDefinido ? exPreDefinido.video : null;
    
    if (videoUrl) {
      flashcardVideo.style.display = 'block';
      
      if (flashcardVideo.dataset.currentVideo !== videoUrl) {
        flashcardVideo.dataset.currentVideo = videoUrl;
        flashcardVideo.src = videoUrl;
        flashcardVideo.onerror = () => {
          console.error('Erro ao carregar o arquivo de vídeo:', flashcardVideo.error);
          alert('⚠️ O formato ou codec deste vídeo não é suportado pelo aplicativo.\n\nPara garantir compatibilidade, certifique-se de que os vídeos estejam no formato .MP4 usando o codec H.264.');
        };
        flashcardVideo.load();
        
        // Evento para abrir em tela cheia ao clicar no vídeo durante o treino
        flashcardVideo.onclick = () => {
          if (flashcardVideo.requestFullscreen) {
            flashcardVideo.requestFullscreen();
          } else if (flashcardVideo.webkitRequestFullscreen) { /* Safari */
            flashcardVideo.webkitRequestFullscreen();
          }
        };
      }
      
      // Pequeno atraso para garantir que o navegador processou a tag src antes do play
      setTimeout(() => {
        const playPromise = flashcardVideo.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => console.log('Erro no Autoplay do vídeo:', err));
        }
      }, 50);

      // Lógica para a caixa de seleção de vídeos no Flashcard
      if (flashcardVideoSelect && exPreDefinido.videosDisponiveis && exPreDefinido.videosDisponiveis.length > 1) {
        flashcardVideoSelect.style.display = 'block';
        if (flashcardVideoSelect.dataset.currentEx !== exInstancia.nome) {
          flashcardVideoSelect.innerHTML = '';
          exPreDefinido.videosDisponiveis.forEach(url => {
            const opt = document.createElement('option');
            opt.value = url;
            try { opt.textContent = decodeURIComponent(url.split('/').pop()).replace(/\.[^/.]+$/, ""); } catch(e) { opt.textContent = url; }
            if (url === videoUrl) opt.selected = true;
            flashcardVideoSelect.appendChild(opt);
          });
          flashcardVideoSelect.dataset.currentEx = exInstancia.nome;
          
          flashcardVideoSelect.onchange = (e) => {
            const newUrl = e.target.value;
            exPreDefinido.video = newUrl;
            if (exInstancia) exInstancia.video = newUrl;
            salvarEstado();
            salvarExerciciosDoTreino();
            
            flashcardVideo.dataset.currentVideo = newUrl;
            flashcardVideo.src = newUrl;
            flashcardVideo.load();
            flashcardVideo.play().catch(err => console.log('Erro no Autoplay do vídeo:', err));
          };
        } else {
          flashcardVideoSelect.value = videoUrl;
        }
      } else if (flashcardVideoSelect) {
        flashcardVideoSelect.style.display = 'none';
        flashcardVideoSelect.dataset.currentEx = '';
      }
    } else {
      flashcardVideo.pause();
      flashcardVideo.removeAttribute('src');
      flashcardVideo.dataset.currentVideo = '';
      flashcardVideo.style.display = 'none';
      if (flashcardVideoSelect) {
        flashcardVideoSelect.style.display = 'none';
        flashcardVideoSelect.dataset.currentEx = '';
      }
    }
  }
  
  flashcardObservacao.value = exercicios[serieAtual.exercicioIndex].observacao || '';

  let placeholderReps = serieAtual.repeticoes || '';
  let placeholderCarga = serieAtual.carga || '';
  let placeholderDescanso = serieAtual.descanso || '120';

  const historicoDoTreino = historico.filter(h => h.treino === treinoSelecionado);
  if (historicoDoTreino.length > 0) {
    const ultimaSessao = historicoDoTreino[0];
    const exHistorico = ultimaSessao.exercicios.find(e => e.nome === serieAtual.nomeExercicio);
    if (exHistorico && exHistorico.series.length > serieAtual.serieIndex) {
      placeholderReps = exHistorico.series[serieAtual.serieIndex].repeticoes || placeholderReps;
      placeholderCarga = exHistorico.series[serieAtual.serieIndex].carga || placeholderCarga;
      placeholderDescanso = exHistorico.series[serieAtual.serieIndex].descanso || placeholderDescanso;
    }
  }

  flashcardReps.placeholder = placeholderReps;
  flashcardCarga.placeholder = placeholderCarga;
  flashcardDescanso.placeholder = placeholderDescanso;

  // Se a série atual já foi preenchida (quando o usuário volta no card), mantém os dados digitados
  if (serieAtual.preenchida) {
    flashcardReps.value = serieAtual.repeticoes;
    flashcardCarga.value = serieAtual.carga;
    flashcardDescanso.value = serieAtual.descanso;
  } else {
    flashcardReps.value = '';
    flashcardCarga.value = '';
    flashcardDescanso.value = '';
  }
}

flashcardObservacao.addEventListener('input', (e) => {
  const serieAtual = seriesParaExecutar[serieAtualIndex];
  if (serieAtual) {
    exercicios[serieAtual.exercicioIndex].observacao = e.target.value;
    salvarExerciciosDoTreino();
  }
});

iniciarCronometroBtn.addEventListener('click', () => {
  const serieAtual = seriesParaExecutar[serieAtualIndex];
  const descansoSalvar = flashcardDescanso.value || flashcardDescanso.placeholder;
  
  exercicios[serieAtual.exercicioIndex].series[serieAtual.serieIndex].descanso = descansoSalvar;
  serieAtual.descanso = descansoSalvar;

  const tempoDescanso = parseInt(descansoSalvar) || 0;
  if (tempoDescanso > 0) {
    iniciarCronometro(tempoDescanso, cronometroDisplay, cronometroContainer);
  }
});

voltarSerieBtn.addEventListener('click', () => {
  if (serieAtualIndex > 0) {
    serieAtualIndex--;
    renderizarFlashcard('esquerda');
  }
});
proximaSerieBtn.addEventListener('click', () => {
  const serieAtual = seriesParaExecutar[serieAtualIndex];
  
  const repsSalvar = flashcardReps.value || flashcardReps.placeholder;
  const cargaSalvar = flashcardCarga.value || flashcardCarga.placeholder;
  const descansoSalvar = flashcardDescanso.value || flashcardDescanso.placeholder;

  exercicios[serieAtual.exercicioIndex].series[serieAtual.serieIndex].repeticoes = repsSalvar;
  exercicios[serieAtual.exercicioIndex].series[serieAtual.serieIndex].carga = cargaSalvar;
  exercicios[serieAtual.exercicioIndex].series[serieAtual.serieIndex].descanso = descansoSalvar;

  serieAtual.repeticoes = repsSalvar;
  serieAtual.carga = cargaSalvar;
  serieAtual.descanso = descansoSalvar;
  serieAtual.preenchida = true; // Marca a série como preenchida para que os dados sejam exibidos se o usuário voltar

  serieAtualIndex++;
  
  renderizarFlashcard('direita');
});

if (execucaoAdicionarSerieBtn) {
  execucaoAdicionarSerieBtn.addEventListener('click', () => {
    if (seriesParaExecutar.length === 0 || serieAtualIndex >= seriesParaExecutar.length) return;

    const serieAtual = seriesParaExecutar[serieAtualIndex];
    const exIndex = serieAtual.exercicioIndex;
    const ex = exercicios[exIndex];
    
    ex.series.push({ repeticoes: '', carga: '', descanso: '120' });
    salvarExerciciosDoTreino();

    let insertIndex = serieAtualIndex + 1;
    while (insertIndex < seriesParaExecutar.length && seriesParaExecutar[insertIndex].exercicioIndex === exIndex) {
      insertIndex++;
    }

    const newTotal = ex.series.length;
    seriesParaExecutar.forEach(s => {
      if (s.exercicioIndex === exIndex) {
        s.totalSeries = newTotal;
      }
    });

    const novaSerie = {
      exercicioIndex: exIndex,
      serieIndex: newTotal - 1,
      nomeExercicio: ex.nome,
      totalSeries: newTotal,
      serieNumero: newTotal,
      repeticoes: '',
      carga: '',
      descanso: '120',
      preenchida: false
    };

    seriesParaExecutar.splice(insertIndex, 0, novaSerie);
    renderizarFlashcard();
  });
}

if (execucaoAdicionarExercicioBtn) {
  execucaoAdicionarExercicioBtn.addEventListener('click', () => {
    const indexStr = execucaoExercicioSelect.value;
    if (!indexStr) return;
    const index = parseInt(indexStr, 10);
    if (isNaN(index) || !exerciciosPreDefinidos[index]) return;
    const def = exerciciosPreDefinidos[index];

    exercicios.push({ nome: def.nome, series: [{ repeticoes: '', carga: '', descanso: '120' }], observacao: '', video: def.video });
    const exIndex = exercicios.length - 1;
    salvarExerciciosDoTreino();
    
    seriesParaExecutar.push({
      exercicioIndex: exIndex,
      serieIndex: 0,
      nomeExercicio: def.nome,
      totalSeries: 1,
      serieNumero: 1,
      repeticoes: '',
      carga: '',
      descanso: '120',
      preenchida: false
    });
    renderizarFlashcard();
    alert(`O exercício ${def.nome} foi adicionado ao final do treino.`);
    if (viewVisaoGeral && viewVisaoGeral.style.display === 'block') {
      renderVisaoGeralExecucao();
    }
  });
}

let touchStartX = 0;
let touchStartY = 0;
let currentTranslateX = 0;
let isDragging = false;
let isScrolling = false;

flashcardContainer.addEventListener('touchstart', (e) => {
  if (e.target.closest('input, button, label')) return;

  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
  isDragging = false;
  isScrolling = false;
  currentTranslateX = 0;
  flashcardContainer.style.transition = 'none'; // Remove a transição para rastrear o dedo 1:1
}, { passive: true });

flashcardContainer.addEventListener('touchmove', (e) => {
  if (e.target.closest('input, button, label')) return;

  if (isScrolling) return; // Se o usuário está rolando a tela para baixo/cima, não arrasta o card

  const touchCurrentX = e.changedTouches[0].screenX;
  const touchCurrentY = e.changedTouches[0].screenY;
  const diffX = touchCurrentX - touchStartX;
  const diffY = touchCurrentY - touchStartY;

  // Determina se é scroll vertical ou arraste horizontal no primeiro movimento
  if (!isDragging && !isScrolling) {
    if (Math.abs(diffY) > Math.abs(diffX)) {
      isScrolling = true;
      return;
    }
    isDragging = true;
  }

  if (isDragging) {
    currentTranslateX = diffX;
    flashcardContainer.style.transform = `translateX(${currentTranslateX}px)`;
  }
}, { passive: true });

flashcardContainer.addEventListener('touchend', (e) => {
  if (e.target.closest('input, button, label')) return;

  if (!isDragging) return;
  isDragging = false;
  
  const diffX = currentTranslateX;
  currentTranslateX = 0;
  
  // Se arrastou mais de 75px para os lados, efetua a transição
  if (diffX > 75) {
    if (!voltarSerieBtn.disabled) {
      voltarSerieBtn.click();
      return;
    }
  } else if (diffX < -75) {
    proximaSerieBtn.click();
    return;
  }
  
  // Retorna ao centro caso o movimento não tenha sido suficiente ou se o botão Voltar estiver desabilitado
  flashcardContainer.style.transition = 'transform 0.3s ease';
  flashcardContainer.style.transform = 'translateX(0)';
}, { passive: true });

cancelarExecucaoBtn.addEventListener('click', () => {
  if (confirm('Deseja realmente cancelar este treino? O progresso não será salvo.')) {
    pararCronometro(cronometroContainer);
    execucaoScreen.classList.remove('active');
    sessaoScreen.classList.add('active');
    bottomNav.classList.add('active');
  }
});

finalizarAntecipadoBtn.addEventListener('click', () => {
  if (confirm('Deseja finalizar o treino antecipadamente? O progresso até aqui será salvo no histórico.')) {
    const serieAtual = seriesParaExecutar[serieAtualIndex];
    if (serieAtual) {
      exercicios[serieAtual.exercicioIndex].series[serieAtual.serieIndex].repeticoes = flashcardReps.value || flashcardReps.placeholder;
      exercicios[serieAtual.exercicioIndex].series[serieAtual.serieIndex].carga = flashcardCarga.value || flashcardCarga.placeholder;
      exercicios[serieAtual.exercicioIndex].series[serieAtual.serieIndex].descanso = flashcardDescanso.value || flashcardDescanso.placeholder;
    }

    // Monta um array apenas com os exercícios e séries efetivamente realizados (até o index atual)
    const exerciciosRealizados = JSON.parse(JSON.stringify(exercicios));
    exerciciosRealizados.forEach((ex, eIndex) => {
      ex.series = ex.series.filter((_, sIndex) => {
        const posGlobal = seriesParaExecutar.findIndex(s => s.exercicioIndex === eIndex && s.serieIndex === sIndex);
        return posGlobal !== -1 && posGlobal <= serieAtualIndex;
      });
    });
    const exerciciosFiltrados = exerciciosRealizados.filter(ex => ex.series.length > 0);

    finalizarTreino(exerciciosFiltrados);
  }
});

function finalizarTreino(exerciciosFinalizados = null) {
  pararCronometro(cronometroContainer);

  let exerciciosParaHistorico = exerciciosFinalizados || JSON.parse(JSON.stringify(exercicios));

  // Filtra as séries mantendo apenas aquelas com repetições preenchidas e > 0
  exerciciosParaHistorico.forEach(ex => {
    ex.series = ex.series.filter(serie => {
      const reps = parseInt(serie.repeticoes, 10);
      return !isNaN(reps) && reps > 0;
    });
  });

  // Remove os exercícios que ficaram sem nenhuma série válida
  exerciciosParaHistorico = exerciciosParaHistorico.filter(ex => ex.series.length > 0);

  const sessao = {
    id: Date.now().toString(),
    data: new Date().toISOString(),
    treino: treinoSelecionado,
    exercicios: exerciciosParaHistorico
  };

  salvarExerciciosDoTreino();
  historico.unshift(sessao);
  salvarEstado();
  renderHistorico();
  
  execucaoScreen.classList.remove('active');
  historicoScreen.classList.add('active');
  bottomNav.classList.add('active');
  navHistorico.classList.add('active');
  navTreinos.classList.remove('active');
  navExercicios.classList.remove('active');
}

navTreinos.addEventListener('click', () => {
  navTreinos.classList.add('active');
  navHistorico.classList.remove('active');
  navExercicios.classList.remove('active');
  historicoScreen.classList.remove('active');
  sessaoScreen.classList.remove('active');
  execucaoScreen.classList.remove('active');
  exerciciosScreen.classList.remove('active');
  treinoScreen.classList.add('active');
});

navHistorico.addEventListener('click', () => {
  navHistorico.classList.add('active');
  navTreinos.classList.remove('active');
  navExercicios.classList.remove('active');
  treinoScreen.classList.remove('active');
  sessaoScreen.classList.remove('active');
  execucaoScreen.classList.remove('active');
  exerciciosScreen.classList.remove('active');
  historicoScreen.classList.add('active');
});

navExercicios.addEventListener('click', () => {
  navExercicios.classList.add('active');
  navTreinos.classList.remove('active');
  navHistorico.classList.remove('active');
  treinoScreen.classList.remove('active');
  historicoScreen.classList.remove('active');
  sessaoScreen.classList.remove('active');
  execucaoScreen.classList.remove('active');
  exerciciosScreen.classList.add('active');
});

tabSessaoBtn.addEventListener('click', () => {
  abaHistoricoAtiva = 'sessao';
  tabSessaoBtn.className = 'tab-btn';
  tabSemanalBtn.className = 'tab-btn secondary-button';
  renderHistorico();
});

tabSemanalBtn.addEventListener('click', () => {
  abaHistoricoAtiva = 'semanal';
  tabSemanalBtn.className = 'tab-btn';
  tabSessaoBtn.className = 'tab-btn secondary-button';
  renderHistorico();
});

if (tabFlashcardBtn && tabVisaoGeralBtn) {
  tabFlashcardBtn.addEventListener('click', () => {
    tabFlashcardBtn.className = 'tab-btn';
    tabVisaoGeralBtn.className = 'tab-btn secondary-button';
    viewFlashcards.style.display = 'block';
    viewVisaoGeral.style.display = 'none';
  });
  tabVisaoGeralBtn.addEventListener('click', () => {
    tabVisaoGeralBtn.className = 'tab-btn';
    tabFlashcardBtn.className = 'tab-btn secondary-button';
    viewVisaoGeral.style.display = 'block';
    viewFlashcards.style.display = 'none';
    renderVisaoGeralExecucao();
  });
}

function removerExercicioExecucao(exIndex) {
  if (!confirm('Deseja realmente remover este exercício do treino atual?')) return;

  exercicios.splice(exIndex, 1);
  salvarExerciciosDoTreino();

  seriesParaExecutar = seriesParaExecutar.filter(s => s.exercicioIndex !== exIndex);

  seriesParaExecutar.forEach(s => {
    if (s.exercicioIndex > exIndex) {
      s.exercicioIndex--;
    }
  });

  if (serieAtualIndex >= seriesParaExecutar.length) {
    serieAtualIndex = Math.max(0, seriesParaExecutar.length - 1);
  }

  if (seriesParaExecutar.length === 0) {
    alert('Todos os exercícios foram removidos. Finalizando treino.');
    finalizarTreino();
    return;
  }

  renderizarFlashcard();
  renderVisaoGeralExecucao();
  salvarEstadoExecucao();
}

function renderVisaoGeralExecucao() {
  renderVisaoGeralExecucaoUI(exercicios, seriesParaExecutar, execucaoVisaoGeralList, {
    onRemoveExercicio: (exIndex) => removerExercicioExecucao(exIndex),
    onRemoveSerie: (exIndex) => {
      alert('Ação não suportada. Use a tela de Flashcards para gerenciar séries em execução.');
    },
    onAddSerie: (exIndex) => {
      alert('Ação não suportada. Use a tela de Flashcards para gerenciar séries em execução.');
    }
  });
}

// ---------------------------------------------------------------------------
// Role-based screen helpers
// ---------------------------------------------------------------------------

function mostrarTela(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const tela = document.getElementById(screenId);
  if (tela) tela.classList.add('active');
}

async function carregarAppComoCliente(targetUserId) {
  await sincronizarDoSupabase(targetUserId);
  limparDadosAntigosStorage();
  carregarEstado();
  mostrarTela('treinoScreen');
  if (bottomNav) bottomNav.classList.add('active');
}

async function renderProfissionalScreen(profile) {
  await sincronizarDoSupabase();
  // Activation code display
  const codeEl = document.getElementById('activationCodeDisplay');
  if (codeEl) codeEl.textContent = profile.activation_code ?? '------';

  const greeting = document.getElementById('profissionalGreeting');
  if (greeting) greeting.textContent = `Bem-vindo! Gerencie seus clientes abaixo.`;

  // Copy code button
  const copyBtn = document.getElementById('copyCodeBtn');
  if (copyBtn) {
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(profile.activation_code ?? '').then(() => {
        copyBtn.textContent = 'Copiado!';
        setTimeout(() => { copyBtn.textContent = 'Copiar Código'; }, 2000);
      });
    };
  }

  // "Meus Próprios Treinos" — load the profissional's own data, hide client banner
  const meusTreinosBtn = document.getElementById('meusTreinosBtn');
  if (meusTreinosBtn) {
    meusTreinosBtn.onclick = async () => {
      const banner = document.getElementById('clientContextBanner');
      if (banner) banner.style.display = 'none';
      await carregarAppComoCliente(getCurrentUserId());
      if (bottomNav) bottomNav.classList.add('active');
    };
  }

  // "← Clientes" button inside treinoScreen — return to profissional hub
  const voltarClientesBtn = document.getElementById('voltarClientesBtn');
  if (voltarClientesBtn) {
    voltarClientesBtn.onclick = async () => {
      const banner = document.getElementById('clientContextBanner');
      if (banner) banner.style.display = 'none';
      await renderProfissionalScreen(profile);
    };
  }

  // Load and render client list
  fetchClientes(getCurrentUserId()).then(clientes => {
    const listEl = document.getElementById('clientesList');
    const countEl = document.getElementById('clientesCount');
    if (!listEl) return;

    if (countEl) countEl.textContent = `${clientes.length} cliente(s)`;

    if (clientes.length === 0) {
      listEl.innerHTML = '<p class="small-text">Nenhum cliente vinculado ainda.</p>';
      return;
    }

    listEl.innerHTML = clientes.map(c => {
      const displayName = (c.first_name && c.last_name)
        ? `${c.first_name} ${c.last_name}`
        : (c.full_name || c.email);
      return `
      <div class="list-item">
        <span style="font-weight:700;font-size:15px;">${displayName}</span>
        <div class="item-actions">
          <button type="button" class="edit-btn"
            style="width:auto;padding:10px 16px;font-size:14px;"
            data-client-id="${c.id}"
            data-client-name="${displayName}">
            Abrir
          </button>
        </div>
      </div>`;
    }).join('');

    listEl.querySelectorAll('[data-client-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const clientId   = btn.dataset.clientId;
        const clientName = btn.dataset.clientName;
        btn.textContent = 'Carregando...';
        btn.disabled = true;
        await carregarAppComoCliente(clientId);
        // Show context banner inside treinoScreen
        const banner     = document.getElementById('clientContextBanner');
        const bannerText = document.getElementById('clientContextBannerText');
        if (banner && bannerText) {
          bannerText.textContent = `Visualizando: ${clientName}`;
          banner.style.display = 'flex';
        }
        if (bottomNav) bottomNav.classList.add('active');
      });
    });
  });

  mostrarTela('profissionalScreen');
  if (bottomNav) bottomNav.classList.remove('active'); // hide nav on profissional hub
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

window.addEventListener('load', () => {
  initAuth({
    onLoginSuccess: async (profile) => {
      limparDadosAntigosStorage();

      if (isProfissional(profile?.role)) {
        await renderProfissionalScreen(profile);
      } else {
        // cliente or Supabase disabled — load own data directly
        await sincronizarDoSupabase();
        carregarEstado();
        mostrarTela('treinoScreen');
        if (bottomNav) bottomNav.classList.add('active');
      }
    },
    onLogout: () => {
      treinos = [];
      treinoSelecionado = '';
      exercicios = [];
      historico = [];
      exerciciosPreDefinidos = [];
      // Restore treinoScreen as the default active screen for next login
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      const t = document.getElementById('treinoScreen');
      if (t) t.classList.add('active');
      if (bottomNav) bottomNav.classList.add('active');
    }
  });
});