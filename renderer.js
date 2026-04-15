const senhaScreen = document.getElementById('senhaScreen');
const senhaInput = document.getElementById('senhaInput');
const entrarSenhaBtn = document.getElementById('entrarSenhaBtn');
const erroSenha = document.getElementById('erroSenha');
const cadastroScreen = document.getElementById('cadastroScreen');
const treinoScreen = document.getElementById('treinoScreen');
const sessaoScreen = document.getElementById('sessaoScreen');
const nomeClienteInput = document.getElementById('nomeCliente');
const entrarBtn = document.getElementById('entrarBtn');
const limparDadosBtn = document.getElementById('limparDadosBtn');
const editarCadastroBtn = document.getElementById('editarCadastroBtn');
const nomeUsuarioSpan = document.getElementById('nomeUsuario');
const treinoSelect = document.getElementById('treinoSelect');
const novoTreinoInput = document.getElementById('novoTreino');
const adicionarTreinoBtn = document.getElementById('adicionarTreinoBtn');
const treinoList = document.getElementById('treinoList');
const erroCadastro = document.getElementById('erroCadastro');
const confirmarTreinoBtn = document.getElementById('confirmarTreinoBtn');
const voltarTreinoBtn = document.getElementById('voltarTreinoBtn');
const treinoAtualSpan = document.getElementById('treinoAtual');
const exercicioSelect = document.getElementById('exercicioSelect');
const adicionarExercicioBtn = document.getElementById('adicionarExercicioBtn');
const limparExerciciosBtn = document.getElementById('limparExerciciosBtn');
const exercicioList = document.getElementById('exercicioList');
const historicoScreen = document.getElementById('historicoScreen');
const exerciciosScreen = document.getElementById('exerciciosScreen');
const novoExercicioPreDefinido = document.getElementById('novoExercicioPreDefinido');
const addExercicioPreDefinidoBtn = document.getElementById('addExercicioPreDefinidoBtn');
const exerciciosPreDefinidosList = document.getElementById('exerciciosPreDefinidosList');
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
const tabSessaoBtn = document.getElementById('tabSessaoBtn');
const tabSemanalBtn = document.getElementById('tabSemanalBtn');

let treinos = [];
let treinoSelecionado = '';
let exercicios = [];
let historico = [];
let seriesParaExecutar = [];
let serieAtualIndex = 0;
let cronometroInterval = null;
let abaHistoricoAtiva = 'sessao';
let exerciciosPreDefinidos = [];

const SENHA_DE_ACESSO = 'gabrielgostoso123'; // Altere aqui para a senha desejada

const DEFAULT_TREINOS = ['Treino A', 'Treino B', 'Treino C'];
const GRUPOS_MUSCULARES = [
  'Abdômen', 'Adutores', 'Antebraço', 'Bíceps', 'Costas', 'Deltoide Anterior',
  'Deltoide Lateral', 'Deltoide Posterior', 'Glúteos', 'Lombar',
  'Panturrilha', 'Peitoral', 'Posterior de Coxa', 'Quadríceps',
  'Trapézio Inferior', 'Trapézio Médio', 'Trapézio Superior', 'Tríceps'
];

function salvarEstado() {
  const clienteAtivo = nomeUsuarioSpan.textContent;
  localStorage.setItem('clienteNome', clienteAtivo);
  if (clienteAtivo) {
    localStorage.setItem(`treinos_${clienteAtivo}`, JSON.stringify(treinos));
    localStorage.setItem(`treinoSelecionado_${clienteAtivo}`, treinoSelecionado);
  }
  localStorage.setItem('historico', JSON.stringify(historico));
  localStorage.setItem('exerciciosPreDefinidos', JSON.stringify(exerciciosPreDefinidos));
}

function salvarExerciciosDoTreino() {
  const clienteAtivo = nomeUsuarioSpan.textContent;
  if (clienteAtivo && treinoSelecionado) {
    localStorage.setItem(`exercicios_${clienteAtivo}_${treinoSelecionado}`, JSON.stringify(exercicios));
  }
}

function carregarEstadoCliente(nome) {
  let treinosSalvos = JSON.parse(localStorage.getItem(`treinos_${nome}`) || 'null');
  let selecionadoSalvo = localStorage.getItem(`treinoSelecionado_${nome}`);

  // Migra os treinos antigos globais para o primeiro cliente a logar
  if (!treinosSalvos && localStorage.getItem('treinos')) {
    treinosSalvos = JSON.parse(localStorage.getItem('treinos'));
    selecionadoSalvo = localStorage.getItem('treinoSelecionado');
    localStorage.removeItem('treinos');
    localStorage.removeItem('treinoSelecionado');
  }

  treinos = Array.isArray(treinosSalvos) && treinosSalvos.length > 0 ? treinosSalvos : [...DEFAULT_TREINOS];
  treinoSelecionado = selecionadoSalvo || treinos[0] || '';
}

function carregarEstado() {
  const nomeSalvo = localStorage.getItem('clienteNome');
  const historicoSalvo = JSON.parse(localStorage.getItem('historico') || '[]');
  const exerciciosSalvos = JSON.parse(localStorage.getItem('exerciciosPreDefinidos') || 'null');

  historico = Array.isArray(historicoSalvo) ? historicoSalvo : [];
  
  if (Array.isArray(exerciciosSalvos) && exerciciosSalvos.length > 0) {
    exerciciosPreDefinidos = exerciciosSalvos.map(ex => {
      if (typeof ex === 'string') return { nome: ex, musculos: {} };
      if (!ex.musculos) ex.musculos = {};
      return ex;
    });
  } else {
    exerciciosPreDefinidos = [
      { nome: 'Supino Reto', musculos: { 'Peitoral': 1, 'Tríceps': 0.5, 'Deltoide Anterior': 0.5 } },
      { nome: 'Agachamento Livre', musculos: { 'Quadríceps': 1, 'Glúteos': 0.5 } },
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
      { nome: 'Tríceps', musculos: { 'Tríceps': 1 } },
      { nome: 'Tríceps Testa', musculos: { 'Tríceps': 1 } },
      { nome: 'Tríceps Francês', musculos: { 'Tríceps': 1 } },
      { nome: 'Bíceps', musculos: { 'Bíceps': 1 } },
      { nome: 'Bíceps Scott', musculos: { 'Bíceps': 1 } }
    ];
  }
  
  renderOpcoesExercicios();

  // Garante que históricos antigos tenham um ID para que possam ser removidos sem erros
  historico.forEach(h => {
    if (!h.id) h.id = Math.random().toString(36).substring(2, 9);
  });

  const appAutenticado = localStorage.getItem('appAutenticado') === 'true';

  if (appAutenticado) {
    if (nomeSalvo) {
      carregarEstadoCliente(nomeSalvo);
      mostrarTelaPrincipal(nomeSalvo);
    } else {
      treinos = [...DEFAULT_TREINOS];
      treinoSelecionado = treinos[0] || '';
      mostrarTelaCadastro();
    }
  } else {
    mostrarTelaSenha();
  }
}

function mostrarTelaSenha() {
  senhaScreen.classList.add('active');
  cadastroScreen.classList.remove('active');
  treinoScreen.classList.remove('active');
  sessaoScreen.classList.remove('active');
  historicoScreen.classList.remove('active');
  execucaoScreen.classList.remove('active');
  exerciciosScreen.classList.remove('active');
  bottomNav.classList.remove('active');
  senhaInput.value = '';
  erroSenha.textContent = '';
  senhaInput.focus();
}

function mostrarTelaCadastro() {
  senhaScreen.classList.remove('active');
  cadastroScreen.classList.add('active');
  treinoScreen.classList.remove('active');
  sessaoScreen.classList.remove('active');
  historicoScreen.classList.remove('active');
  execucaoScreen.classList.remove('active');
  exerciciosScreen.classList.remove('active');
  bottomNav.classList.remove('active');
  erroCadastro.textContent = '';
  nomeClienteInput.value = '';
  nomeClienteInput.focus();
}

function mostrarTelaPrincipal(nome) {
  nomeUsuarioSpan.textContent = nome;
  senhaScreen.classList.remove('active');
  cadastroScreen.classList.remove('active');
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

    const remover = document.createElement('button');
    remover.type = 'button';
    remover.textContent = 'Remover';
    remover.addEventListener('click', () => {
      removerTreino(treino);
    });

    itemActions.appendChild(reorderDiv);
    itemActions.appendChild(remover);

    item.appendChild(label);
    item.appendChild(itemActions);
    treinoList.appendChild(item);
  });
}

function adicionarTreino(novoTreino) {
  const label = novoTreino.trim();
  if (!label) {
    erroCadastro.textContent = 'Digite o nome do treino antes de adicionar.';
    return;
  }

  if (treinos.includes(label)) {
    erroCadastro.textContent = 'Este treino já existe.';
    return;
  }

  treinos.push(label);
  treinoSelecionado = label;
  renderOpcoesTreinos();
  atualizarListaTreinos();
  salvarEstado();
  novoTreinoInput.value = '';
  erroCadastro.textContent = '';
}

function removerTreino(treino) {
  treinos = treinos.filter((item) => item !== treino);
  const clienteAtivo = nomeUsuarioSpan.textContent;
  localStorage.removeItem(`exercicios_${clienteAtivo}_${treino}`);
  if (treinoSelecionado === treino) {
    treinoSelecionado = treinos[0] || '';
  }
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
  const clienteAtivo = nomeUsuarioSpan.textContent;
  const exerciciosSalvos = localStorage.getItem(`exercicios_${clienteAtivo}_${treinoSelecionado}`);
  if (exerciciosSalvos) {
    exercicios = JSON.parse(exerciciosSalvos);
  } else {
    exercicios = [];
  }
  erroSessao.textContent = '';
  atualizarListaExercicios();
}

function voltarTelaTreino() {
  sessaoScreen.classList.remove('active');
  treinoScreen.classList.add('active');
  bottomNav.classList.add('active');
}

function adicionarExercicio(novoExercicio) {
  const label = novoExercicio.trim();
  if (!label) {
    return;
  }

  if (exercicios.some(ex => ex.nome === label)) {
    return;
  }

  exercicios.push({ nome: label, series: [], observacao: '' });
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
  exercicios[exercicioIndex].series.push({ repeticoes: '', carga: '', descanso: '60' });
  atualizarListaExercicios();
}

function removerSerie(exercicioIndex, serieIndex) {
  exercicios[exercicioIndex].series.splice(serieIndex, 1);
  atualizarListaExercicios();
}

function atualizarListaExercicios() {
  salvarExerciciosDoTreino();
  exercicioList.innerHTML = '';

  if (exercicios.length === 0) {
    const aviso = document.createElement('p');
    aviso.className = 'small-text';
    aviso.textContent = 'Nenhum exercício adicionado. Adicione um novo exercício acima.';
    exercicioList.appendChild(aviso);
    return;
  }

  exercicios.forEach((exercicio, exIndex) => {
    const item = document.createElement('div');
    item.className = 'exercicio-item';

    const header = document.createElement('div');
    header.className = 'exercicio-header';

    const title = document.createElement('h3');
    title.textContent = exercicio.nome;

      const headerActions = document.createElement('div');
      headerActions.className = 'item-actions';

      const reorderDiv = document.createElement('div');
      reorderDiv.className = 'reorder-btns';

      const upBtn = document.createElement('button');
      upBtn.type = 'button';
      upBtn.textContent = '↑';
      upBtn.disabled = exIndex === 0;
      upBtn.addEventListener('click', () => moverExercicio(exIndex, -1));

      const downBtn = document.createElement('button');
      downBtn.type = 'button';
      downBtn.textContent = '↓';
      downBtn.disabled = exIndex === exercicios.length - 1;
      downBtn.addEventListener('click', () => moverExercicio(exIndex, 1));

      reorderDiv.appendChild(upBtn);
      reorderDiv.appendChild(downBtn);

    const removeExercicioBtn = document.createElement('button');
    removeExercicioBtn.type = 'button';
    removeExercicioBtn.className = 'remove-serie-btn';
    removeExercicioBtn.textContent = 'Remover';
    removeExercicioBtn.addEventListener('click', () => removerExercicio(exIndex));

      headerActions.appendChild(reorderDiv);
      headerActions.appendChild(removeExercicioBtn);

      header.appendChild(title);
      header.appendChild(headerActions);

    item.appendChild(header);

    const obsInput = document.createElement('input');
    obsInput.type = 'text';
    obsInput.placeholder = 'Observações do exercício...';
    obsInput.value = exercicio.observacao || '';
    obsInput.style.width = '100%';
    obsInput.style.boxSizing = 'border-box';
    obsInput.style.padding = '10px 14px';
    obsInput.style.marginTop = '12px';
    obsInput.style.borderRadius = '12px';
    obsInput.addEventListener('input', (e) => {
      exercicios[exIndex].observacao = e.target.value;
      salvarExerciciosDoTreino();
    });
    item.appendChild(obsInput);

    const contadorContainer = document.createElement('div');
    contadorContainer.style.display = 'flex';
    contadorContainer.style.alignItems = 'center';
    contadorContainer.style.justifyContent = 'space-between';
    contadorContainer.style.marginTop = '16px';

    const contadorLabel = document.createElement('span');
    contadorLabel.textContent = `Séries: ${exercicio.series.length}`;
    contadorLabel.style.fontWeight = '700';

    const controlesDiv = document.createElement('div');
    controlesDiv.style.display = 'flex';
    controlesDiv.style.gap = '8px';

    const removeSerieBtn = document.createElement('button');
    removeSerieBtn.type = 'button';
    removeSerieBtn.className = 'remove-serie-btn';
    removeSerieBtn.textContent = '-';
    removeSerieBtn.style.padding = '8px 16px';
    removeSerieBtn.disabled = exercicio.series.length === 0;
    removeSerieBtn.addEventListener('click', () => {
      if (exercicio.series.length > 0) {
        removerSerie(exIndex, exercicio.series.length - 1);
      }
    });

    const addSerieBtn = document.createElement('button');
    addSerieBtn.type = 'button';
    addSerieBtn.className = 'add-serie-btn';
    addSerieBtn.textContent = '+';
    addSerieBtn.style.padding = '8px 16px';
    addSerieBtn.addEventListener('click', () => adicionarSerie(exIndex));

    controlesDiv.appendChild(removeSerieBtn);
    controlesDiv.appendChild(addSerieBtn);
    
    contadorContainer.appendChild(contadorLabel);
    contadorContainer.appendChild(controlesDiv);

    item.appendChild(contadorContainer);

    exercicioList.appendChild(item);
  });
}

function renderHistorico() {
  historicoList.innerHTML = '';

  const historicoDoUsuario = historico.filter(h => h.cliente === nomeUsuarioSpan.textContent);

  if (historicoDoUsuario.length === 0) {
    const aviso = document.createElement('p');
    aviso.className = 'small-text';
    aviso.textContent = 'Nenhum treino concluído ainda.';
    historicoList.appendChild(aviso);
    return;
  }

  if (abaHistoricoAtiva === 'sessao') {
    historicoDoUsuario.forEach((sessao) => {
      const card = document.createElement('div');
      card.className = 'exercicio-item';

      const header = document.createElement('div');
      header.className = 'exercicio-header';

      const titleInfo = document.createElement('div');

      const title = document.createElement('h3');
      title.textContent = sessao.treino;

      const dataFormatada = new Date(sessao.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const dateText = document.createElement('p');
      dateText.className = 'small-text';
      dateText.style.textAlign = 'left';
      dateText.style.marginTop = '4px';
      dateText.textContent = dataFormatada;

      titleInfo.appendChild(title);
      titleInfo.appendChild(dateText);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'remove-serie-btn';
      removeBtn.textContent = 'Remover';
      removeBtn.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja remover este histórico?')) {
          historico = historico.filter(h => h.id !== sessao.id);
          salvarEstado();
          renderHistorico();
        }
      });

      header.appendChild(titleInfo);
      header.appendChild(removeBtn);
      card.appendChild(header);

      if (sessao.exercicios && sessao.exercicios.length > 0) {
        const detalhesEx = document.createElement('div');
        detalhesEx.style.marginBottom = '12px';
        const totaisMusculos = {};

        sessao.exercicios.forEach(ex => {
          const exInfo = document.createElement('p');
          exInfo.style.margin = '4px 0';
          exInfo.style.fontSize = '14px';
          exInfo.style.color = '#475569';
          exInfo.textContent = `• ${ex.nome}: ${ex.series.length} série(s)`;
          detalhesEx.appendChild(exInfo);

          const def = exerciciosPreDefinidos.find(e => e.nome === ex.nome);
          if (def && def.musculos) {
            Object.entries(def.musculos).forEach(([musculo, valor]) => {
              totaisMusculos[musculo] = (totaisMusculos[musculo] || 0) + (valor * ex.series.length);
            });
          }
        });
        card.appendChild(detalhesEx);

        if (Object.keys(totaisMusculos).length > 0) {
          const volTitle = document.createElement('p');
          volTitle.style.margin = '0 0 6px 0';
          volTitle.style.fontSize = '14px';
          volTitle.style.fontWeight = '700';
          volTitle.textContent = 'Volume Muscular (Séries):';
          card.appendChild(volTitle);

          const tagsDiv = document.createElement('div');
          tagsDiv.style.display = 'flex';
          tagsDiv.style.flexWrap = 'wrap';
          tagsDiv.style.gap = '6px';

          Object.entries(totaisMusculos).forEach(([musculo, total]) => {
            const tag = document.createElement('span');
            tag.style.background = '#e0f2fe';
            tag.style.color = '#1e3a8a';
            tag.style.padding = '4px 10px';
            tag.style.borderRadius = '12px';
            tag.style.fontSize = '12px';
            tag.style.fontWeight = '700';
            tag.textContent = `${musculo}: ${total}`;
            tagsDiv.appendChild(tag);
          });
          card.appendChild(tagsDiv);
        }
      }

      historicoList.appendChild(card);
    });
  } else {
    const gruposSemanais = [];
    historicoDoUsuario.forEach(sessao => {
      const data = new Date(sessao.data);
      // Lógica para pegar o início (segunda-feira) e fim (domingo) da semana da sessão
      const diaSemana = data.getDay();
      const diff = data.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
      const segunda = new Date(data);
      segunda.setDate(diff);
      segunda.setHours(0,0,0,0);
      
      const domingo = new Date(segunda);
      domingo.setDate(domingo.getDate() + 6);
      
      const formatarData = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const chaveSemana = `Semana ${formatarData(segunda)} - ${formatarData(domingo)}`;
      
      let grupo = gruposSemanais.find(g => g.chave === chaveSemana);
      if (!grupo) {
        grupo = { chave: chaveSemana, sessoes: [], timestamp: segunda.getTime() };
        gruposSemanais.push(grupo);
      }
      grupo.sessoes.push(sessao);
    });

    gruposSemanais.forEach(grupo => {
      const card = document.createElement('div');
      card.className = 'exercicio-item';

      const header = document.createElement('div');
      header.className = 'exercicio-header';
      header.style.marginBottom = '8px';

      const title = document.createElement('h3');
      title.textContent = grupo.chave;
      
      const totalText = document.createElement('span');
      totalText.style.fontWeight = '700';
      totalText.style.color = '#3b82f6';
      totalText.style.fontSize = '14px';
      totalText.textContent = `${grupo.sessoes.length} treino(s)`;

      header.appendChild(title);
      header.appendChild(totalText);
      card.appendChild(header);

      const detalhes = document.createElement('div');
      detalhes.style.marginBottom = '12px';
      const totaisSemana = {};

      grupo.sessoes.forEach(sessao => {
        const info = document.createElement('p');
        const dataFormatada = new Date(sessao.data).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
        info.style.margin = '4px 0';
        info.style.fontSize = '14px';
        info.style.color = '#475569';
        info.textContent = `• ${dataFormatada}: ${sessao.treino}`;
        detalhes.appendChild(info);

        if (sessao.exercicios) {
          sessao.exercicios.forEach(ex => {
            const def = exerciciosPreDefinidos.find(e => e.nome === ex.nome);
            if (def && def.musculos) {
              Object.entries(def.musculos).forEach(([musculo, valor]) => {
                totaisSemana[musculo] = (totaisSemana[musculo] || 0) + (valor * ex.series.length);
              });
            }
          });
        }
      });
      card.appendChild(detalhes);

      if (Object.keys(totaisSemana).length > 0) {
        const volTitle = document.createElement('p');
        volTitle.style.margin = '0 0 6px 0';
        volTitle.style.fontSize = '14px';
        volTitle.style.fontWeight = '700';
        volTitle.textContent = 'Volume Semanal (Séries):';
        card.appendChild(volTitle);

        const tagsDiv = document.createElement('div');
        tagsDiv.style.display = 'flex';
        tagsDiv.style.flexWrap = 'wrap';
        tagsDiv.style.gap = '6px';

        Object.entries(totaisSemana).forEach(([musculo, total]) => {
          const tag = document.createElement('span');
          tag.style.background = '#e0f2fe';
          tag.style.color = '#1e3a8a';
          tag.style.padding = '4px 10px';
          tag.style.borderRadius = '12px';
          tag.style.fontSize = '12px';
          tag.style.fontWeight = '700';
          tag.textContent = `${musculo}: ${total}`;
          tagsDiv.appendChild(tag);
        });
        card.appendChild(tagsDiv);
      }
      historicoList.appendChild(card);
    });
  }
}

function renderOpcoesExercicios() {
  exercicioSelect.innerHTML = '';
  exerciciosPreDefinidosList.innerHTML = '';
  
  // Ordena os exercícios predefinidos em ordem alfabética pelo nome
  exerciciosPreDefinidos.sort((a, b) => a.nome.localeCompare(b.nome));

  if (exerciciosPreDefinidos.length === 0) {
    const aviso = document.createElement('p');
    aviso.className = 'small-text';
    aviso.textContent = 'Nenhum exercício cadastrado. Adicione acima.';
    exerciciosPreDefinidosList.appendChild(aviso);
    
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Nenhum exercício disponível';
    exercicioSelect.appendChild(option);
    return;
  }

  exerciciosPreDefinidos.forEach((ex, index) => {
    const option = document.createElement('option');
    option.value = ex.nome;
    option.textContent = ex.nome;
    exercicioSelect.appendChild(option);

    const item = document.createElement('div');
    item.className = 'exercicio-item';
    item.style.marginBottom = '16px';

    const header = document.createElement('div');
    header.className = 'exercicio-header';
    header.style.marginBottom = '12px';

    const title = document.createElement('h3');
    title.textContent = ex.nome;

    const removeExBtn = document.createElement('button');
    removeExBtn.type = 'button';
    removeExBtn.className = 'remove-serie-btn';
    removeExBtn.textContent = 'Remover';
    removeExBtn.addEventListener('click', () => removerExercicioPreDefinido(index));

    header.appendChild(title);
    header.appendChild(removeExBtn);
    item.appendChild(header);

    const musculosDiv = document.createElement('div');
    musculosDiv.style.display = 'flex';
    musculosDiv.style.flexWrap = 'wrap';
    musculosDiv.style.gap = '8px';
    musculosDiv.style.marginBottom = '12px';

    Object.entries(ex.musculos || {}).forEach(([musculo, valor]) => {
      const tag = document.createElement('span');
      tag.style.background = '#e2e8f0';
      tag.style.color = '#0f172a';
      tag.style.padding = '4px 10px';
      tag.style.borderRadius = '12px';
      tag.style.fontSize = '12px';
      tag.style.fontWeight = '700';
      tag.style.display = 'inline-flex';
      tag.style.alignItems = 'center';
      tag.style.gap = '6px';
      tag.textContent = `${musculo}: ${valor}`;

      const rmMusculo = document.createElement('span');
      rmMusculo.textContent = '×';
      rmMusculo.style.cursor = 'pointer';
      rmMusculo.style.color = '#ef4444';
      rmMusculo.style.fontSize = '14px';
      rmMusculo.addEventListener('click', () => {
        delete ex.musculos[musculo];
        salvarEstado();
        renderOpcoesExercicios();
      });

      tag.appendChild(rmMusculo);
      musculosDiv.appendChild(tag);
    });

    item.appendChild(musculosDiv);

    const addMusculoForm = document.createElement('div');
    addMusculoForm.style.display = 'grid';
    addMusculoForm.style.gridTemplateColumns = '1fr auto auto';
    addMusculoForm.style.gap = '8px';

    const musculoSelect = document.createElement('select');
    musculoSelect.style.width = '100%';
    musculoSelect.style.boxSizing = 'border-box';
    musculoSelect.style.margin = '0';
    musculoSelect.style.padding = '10px';
    musculoSelect.style.borderRadius = '12px';
    musculoSelect.style.border = '1px solid #e2e8f0';
    musculoSelect.style.background = '#ffffff';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Músculo...';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    musculoSelect.appendChild(defaultOption);

    GRUPOS_MUSCULARES.forEach(musculo => {
      const opt = document.createElement('option');
      opt.value = musculo;
      opt.textContent = musculo;
      musculoSelect.appendChild(opt);
    });

    const valorSelect = document.createElement('select');
    valorSelect.style.padding = '10px';
    valorSelect.style.borderRadius = '12px';
    valorSelect.style.border = '1px solid #e2e8f0';
    valorSelect.style.background = '#f8fafc';
    valorSelect.style.outline = 'none';
    valorSelect.style.fontWeight = '700';
    
    const opt1 = document.createElement('option');
    opt1.value = '1';
    opt1.textContent = '1';
    
    const opt05 = document.createElement('option');
    opt05.value = '0.5';
    opt05.textContent = '0.5';
    
    valorSelect.appendChild(opt1);
    valorSelect.appendChild(opt05);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.textContent = '+';
    addBtn.className = 'add-serie-btn';
    addBtn.style.padding = '10px 16px';
    addBtn.addEventListener('click', () => {
      const m = musculoSelect.value;
      if (m) {
        ex.musculos[m] = parseFloat(valorSelect.value);
        salvarEstado();
        renderOpcoesExercicios();
      }
    });

    addMusculoForm.appendChild(musculoSelect);
    addMusculoForm.appendChild(valorSelect);
    addMusculoForm.appendChild(addBtn);

    item.appendChild(addMusculoForm);
    
    exerciciosPreDefinidosList.appendChild(item);
  });
}

function adicionarExercicioPreDefinido(nome) {
  const label = nome.trim();
  if (!label || exerciciosPreDefinidos.some(ex => ex.nome === label)) return;
  
  exerciciosPreDefinidos.push({ nome: label, musculos: {} });
  novoExercicioPreDefinido.value = '';
  renderOpcoesExercicios();
  salvarEstado();
}

function removerExercicioPreDefinido(index) {
  exerciciosPreDefinidos.splice(index, 1);
  renderOpcoesExercicios();
  salvarEstado();
}

entrarSenhaBtn.addEventListener('click', () => {
  const senhaDigitada = senhaInput.value.trim();
  if (senhaDigitada === SENHA_DE_ACESSO) {
    localStorage.setItem('appAutenticado', 'true');
    erroSenha.textContent = '';
    carregarEstado(); // Redireciona corretamente baseando no usuário
  } else {
    erroSenha.textContent = 'Senha incorreta. Tente novamente.';
  }
});

senhaInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    entrarSenhaBtn.click();
  }
});

entrarBtn.addEventListener('click', () => {
  const nome = nomeClienteInput.value.trim();
  if (!nome) {
    erroCadastro.textContent = 'Por favor, informe o nome do cliente.';
    return;
  }
  erroCadastro.textContent = '';
  carregarEstadoCliente(nome);
  mostrarTelaPrincipal(nome);
});

if (limparDadosBtn) {
  limparDadosBtn.addEventListener('click', () => {
    if (confirm('Tem certeza que deseja apagar TODOS os dados do aplicativo? Esta ação não pode ser desfeita.')) {
      localStorage.clear();
      if ('caches' in window) {
        caches.keys().then(names => names.forEach(name => caches.delete(name)));
      }
      window.location.reload();
    }
  });
}

editarCadastroBtn.addEventListener('click', () => {
  mostrarTelaCadastro();
});

adicionarTreinoBtn.addEventListener('click', () => {
  adicionarTreino(novoTreinoInput.value);
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

function iniciarCronometro(segundos) {
  clearInterval(cronometroInterval);
  cronometroContainer.style.display = 'block';
  
  // Calcula exatamente a que horas (no relógio do sistema) o cronômetro deve apitar
  const tempoFim = Date.now() + segundos * 1000;

  function atualizarDisplay() {
    // Calcula a diferença entre o tempo alvo e a hora real de agora
    let restante = Math.round((tempoFim - Date.now()) / 1000);
    
    if (restante <= 0) {
      restante = 0;
      clearInterval(cronometroInterval);
      cronometroDisplay.style.color = '#ef4444'; // Fica vermelho quando acaba
    } else {
      cronometroDisplay.style.color = '#10b981'; // Verde enquanto roda
    }

    const m = Math.floor(restante / 60).toString().padStart(2, '0');
    const s = (restante % 60).toString().padStart(2, '0');
    cronometroDisplay.textContent = `${m}:${s}`;
  }

  atualizarDisplay();
  cronometroInterval = setInterval(atualizarDisplay, 1000);
}

function pararCronometro() {
  clearInterval(cronometroInterval);
  cronometroContainer.style.display = 'none';
}

iniciarTreinoBtn.addEventListener('click', () => {
  seriesParaExecutar = [];
  pararCronometro(); // Garante que o cronômetro seja zerado e ocultado ao começar um novo treino
  
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
        descanso: ex.series[sIndex].descanso || '60',
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
  flashcardExercicio.textContent = serieAtual.nomeExercicio;
  flashcardSerie.textContent = `Série ${serieAtual.serieNumero} de ${serieAtual.totalSeries}`;
  flashcardObservacao.value = exercicios[serieAtual.exercicioIndex].observacao || '';

  let placeholderReps = serieAtual.repeticoes || '';
  let placeholderCarga = serieAtual.carga || '';
  let placeholderDescanso = serieAtual.descanso || '60';

  // Obtém a sugestão baseada na última vez que este treino foi executado
  const historicoDoUsuario = historico.filter(h => h.cliente === nomeUsuarioSpan.textContent && h.treino === treinoSelecionado);
  if (historicoDoUsuario.length > 0) {
    const ultimaSessao = historicoDoUsuario[0];
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
    iniciarCronometro(tempoDescanso);
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

let touchStartX = 0;
let touchStartY = 0;
let currentTranslateX = 0;
let isDragging = false;
let isScrolling = false;

flashcardContainer.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
  isDragging = false;
  isScrolling = false;
  currentTranslateX = 0;
  flashcardContainer.style.transition = 'none'; // Remove a transição para rastrear o dedo 1:1
}, { passive: true });

flashcardContainer.addEventListener('touchmove', (e) => {
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
    pararCronometro();
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
  pararCronometro();

  const sessao = {
    id: Date.now().toString(),
    cliente: nomeUsuarioSpan.textContent,
    data: new Date().toISOString(),
    treino: treinoSelecionado,
    exercicios: exerciciosFinalizados || JSON.parse(JSON.stringify(exercicios))
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

window.addEventListener('load', () => {
  carregarEstado();
});
