export const GRUPOS_MUSCULARES = [
  'Abdômen', 'Adutores', 'Antebraço', 'Bíceps', 'Costas', 'Deltoide Anterior',
  'Deltoide Lateral', 'Deltoide Posterior', 'Glúteos', 'Lombar',
  'Panturrilha', 'Peitoral', 'Posterior de Coxa', 'Quadríceps',
  'Trapézio Inferior', 'Trapézio Médio', 'Trapézio Superior', 'Tríceps'
];

export function renderOpcoesTreinosUI(treinos, treinoSelecionado, selectElement) {
  selectElement.innerHTML = '';
  treinos.forEach((treino) => {
    const option = document.createElement('option');
    option.value = treino;
    option.textContent = treino;
    selectElement.appendChild(option);
  });
  selectElement.value = treinoSelecionado;
}

export function atualizarListaTreinosUI(treinos, containerElement, callbacks) {
  containerElement.innerHTML = '';

  if (treinos.length === 0) {
    const aviso = document.createElement('p');
    aviso.className = 'small-text';
    aviso.textContent = 'Não há treinos cadastrados. Adicione um novo treino abaixo.';
    containerElement.appendChild(aviso);
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
    label.addEventListener('click', () => callbacks.onSelect(treino));

    const itemActions = document.createElement('div');
    itemActions.className = 'item-actions';

    const reorderDiv = document.createElement('div');
    reorderDiv.className = 'reorder-btns';

    const upBtn = document.createElement('button');
    upBtn.type = 'button';
    upBtn.textContent = '↑';
    upBtn.disabled = index === 0;
    upBtn.addEventListener('click', () => callbacks.onMove(index, -1));

    const downBtn = document.createElement('button');
    downBtn.type = 'button';
    downBtn.textContent = '↓';
    downBtn.disabled = index === treinos.length - 1;
    downBtn.addEventListener('click', () => callbacks.onMove(index, 1));

    reorderDiv.appendChild(upBtn);
    reorderDiv.appendChild(downBtn);

    const duplicarBtn = document.createElement('button');
    duplicarBtn.type = 'button';
    duplicarBtn.className = 'duplicate-btn';
    duplicarBtn.textContent = 'Duplicar';
    duplicarBtn.addEventListener('click', () => callbacks.onDuplicate(treino, index));

    const remover = document.createElement('button');
    remover.type = 'button';
    remover.textContent = 'Remover';
    remover.addEventListener('click', () => callbacks.onRemove(treino));

    itemActions.appendChild(reorderDiv);
    itemActions.appendChild(duplicarBtn);
    itemActions.appendChild(remover);

    item.appendChild(label);
    item.appendChild(itemActions);
    containerElement.appendChild(item);
  });
}

export function atualizarListaExerciciosUI(exercicios, containerElement, callbacks) {
  containerElement.innerHTML = '';

  if (exercicios.length === 0) {
    const aviso = document.createElement('p');
    aviso.className = 'small-text';
    aviso.textContent = 'Nenhum exercício adicionado. Adicione um novo exercício acima.';
    containerElement.appendChild(aviso);
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
    upBtn.addEventListener('click', () => callbacks.onMove(exIndex, -1));

    const downBtn = document.createElement('button');
    downBtn.type = 'button';
    downBtn.textContent = '↓';
    downBtn.disabled = exIndex === exercicios.length - 1;
    downBtn.addEventListener('click', () => callbacks.onMove(exIndex, 1));

    reorderDiv.appendChild(upBtn);
    reorderDiv.appendChild(downBtn);

    const removeExercicioBtn = document.createElement('button');
    removeExercicioBtn.type = 'button';
    removeExercicioBtn.className = 'remove-serie-btn';
    removeExercicioBtn.textContent = 'Remover';
    removeExercicioBtn.addEventListener('click', () => callbacks.onRemove(exIndex));

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
    obsInput.addEventListener('input', (e) => callbacks.onChangeObs(exIndex, e.target.value));
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
    removeSerieBtn.addEventListener('click', () => callbacks.onRemoveSerie(exIndex));

    const addSerieBtn = document.createElement('button');
    addSerieBtn.type = 'button';
    addSerieBtn.className = 'add-serie-btn';
    addSerieBtn.textContent = '+';
    addSerieBtn.style.padding = '8px 16px';
    addSerieBtn.addEventListener('click', () => callbacks.onAddSerie(exIndex));

    controlesDiv.appendChild(removeSerieBtn);
    controlesDiv.appendChild(addSerieBtn);
    
    contadorContainer.appendChild(contadorLabel);
    contadorContainer.appendChild(controlesDiv);

    item.appendChild(contadorContainer);
    containerElement.appendChild(item);
  });
}

export function renderHistoricoUI(historico, abaHistoricoAtiva, exerciciosPreDefinidos, containerElement, callbacks) {
  containerElement.innerHTML = '';

  let dadosHistorico = [...historico].sort((a, b) => new Date(b.data) - new Date(a.data));

  if (dadosHistorico.length === 0) {
    const aviso = document.createElement('p');
    aviso.className = 'small-text';
    aviso.textContent = 'Nenhum treino concluído ainda.';
    containerElement.appendChild(aviso);
    return;
  }

  if (abaHistoricoAtiva === 'sessao') {
    dadosHistorico.forEach((sessao) => {
      const timelineItem = document.createElement('div');
      timelineItem.className = 'timeline-item';

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
      removeBtn.addEventListener('click', () => callbacks.onRemove(sessao.id));

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
      timelineItem.appendChild(card);
      containerElement.appendChild(timelineItem);
    });
  } else {
    const gruposSemanais = [];
    dadosHistorico.forEach(sessao => {
      const data = new Date(sessao.data);
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
      const timelineItem = document.createElement('div');
      timelineItem.className = 'timeline-item';

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
      timelineItem.appendChild(card);
      containerElement.appendChild(timelineItem);
    });
  }
}

export function renderOpcoesExerciciosUI(exerciciosPreDefinidos, todosVideosDaPasta, select1, select2, listElem, callbacks) {
  select1.innerHTML = '';
  if (select2) select2.innerHTML = '';
  listElem.innerHTML = '';

  if (exerciciosPreDefinidos.length === 0) {
    const aviso = document.createElement('p');
    aviso.className = 'small-text';
    aviso.textContent = 'Nenhum exercício cadastrado. Adicione acima.';
    listElem.appendChild(aviso);
    
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Nenhum exercício disponível';
    select1.appendChild(option);
    if (select2) select2.appendChild(option.cloneNode(true));
    return;
  }

  exerciciosPreDefinidos.forEach((ex, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = ex.nome;
    select1.appendChild(option);
    if (select2) select2.appendChild(option.cloneNode(true));

    const item = document.createElement('div');
    item.className = 'exercicio-item';
    item.style.marginBottom = '16px';

    const header = document.createElement('div');
    header.className = 'exercicio-header';
    header.style.marginBottom = '12px';

    const title = document.createElement('h3');
    title.textContent = ex.nome + (ex.video ? ' \uD83D\uDCF9' : '');
    if (ex.video) {
      try {
        title.title = 'Vídeo vinculado: ' + decodeURIComponent(ex.video.split('/').pop());
      } catch(e) {}
    }

    const removeExBtn = document.createElement('button');
    removeExBtn.type = 'button';
    removeExBtn.className = 'remove-serie-btn';
    removeExBtn.textContent = 'Remover';
    removeExBtn.addEventListener('click', () => callbacks.onRemove(index));

    header.appendChild(title);
    header.appendChild(removeExBtn);
    item.appendChild(header);

    if (ex.video) {
      const videoContainer = document.createElement('div');
      videoContainer.style.marginBottom = '12px';

      const vid = document.createElement('video');
      vid.src = ex.video;
      vid.controls = true;
      vid.style.width = '100%';
      vid.style.height = 'auto';
      vid.style.aspectRatio = '9 / 16';
      vid.style.maxHeight = '400px';
      vid.style.objectFit = 'cover';
      vid.style.borderRadius = '8px';
      vid.style.marginBottom = '8px';
      vid.style.backgroundColor = '#000';
      
      vid.onerror = () => {
        if (!videoContainer.querySelector('.video-error')) {
          const erroMsg = document.createElement('p');
          erroMsg.className = 'video-error';
          erroMsg.style.color = '#ef4444';
          erroMsg.style.fontSize = '12px';
          erroMsg.style.margin = '0 0 8px 0';
          erroMsg.textContent = '⚠️ Erro ao reproduzir: formato ou codec incompatível. Converta para MP4 (H.264).';
          videoContainer.appendChild(erroMsg);
        }
      };

      videoContainer.appendChild(vid);

      if (ex.videosDisponiveis && ex.videosDisponiveis.length > 1) {
        const selectVar = document.createElement('select');
        selectVar.style.width = '100%';
        selectVar.style.padding = '8px';
        selectVar.style.borderRadius = '8px';
        selectVar.style.border = '1px solid #e2e8f0';

        ex.videosDisponiveis.forEach(url => {
          const opt = document.createElement('option');
          opt.value = url;
          try { opt.textContent = decodeURIComponent(url.split('/').pop()).replace(/\.[^/.]+$/, ""); } catch(e) { opt.textContent = url; }
          if (url === ex.video) opt.selected = true;
          selectVar.appendChild(opt);
        });

        selectVar.addEventListener('change', (e) => {
          vid.src = e.target.value;
          const err = videoContainer.querySelector('.video-error');
          if (err) err.remove(); // Limpa o erro ao trocar de vídeo
          callbacks.onChangeVideo(index, e.target.value);
        });

        videoContainer.appendChild(selectVar);
      }
      item.appendChild(videoContainer);
    }

    const manualVideosDiv = document.createElement('div');
    manualVideosDiv.style.marginBottom = '12px';

    if (ex.videosManuais && ex.videosManuais.length > 0) {
      const manualVideoLabel = document.createElement('label');
      manualVideoLabel.textContent = 'VÍDEOS VINCULADOS MANUALMENTE';
      manualVideosDiv.appendChild(manualVideoLabel);

      const tagsDiv = document.createElement('div');
      tagsDiv.style.display = 'flex';
      tagsDiv.style.flexWrap = 'wrap';
      tagsDiv.style.gap = '8px';
      tagsDiv.style.marginTop = '8px';

      ex.videosManuais.forEach(url => {
        const tag = document.createElement('span');
        tag.style.background = '#e0f2fe';
        tag.style.color = '#1e3a8a';
        tag.style.padding = '4px 10px';
        tag.style.borderRadius = '12px';
        tag.style.fontSize = '12px';
        tag.style.fontWeight = '700';
        tag.style.display = 'inline-flex';
        tag.style.alignItems = 'center';
        tag.style.gap = '6px';
        try { tag.textContent = decodeURIComponent(url.split('/').pop()).replace(/\.[^/.]+$/, ""); } catch(e) { tag.textContent = 'Vídeo'; }

        const rmVideo = document.createElement('span');
        rmVideo.textContent = '×';
        rmVideo.style.cursor = 'pointer';
        rmVideo.style.color = '#ef4444';
        rmVideo.style.fontSize = '14px';
        rmVideo.addEventListener('click', () => callbacks.onRemoveVideoManual(index, url));

        tag.appendChild(rmVideo);
        tagsDiv.appendChild(tag);
      });
      manualVideosDiv.appendChild(tagsDiv);
    }
    item.appendChild(manualVideosDiv);

    if (todosVideosDaPasta && todosVideosDaPasta.length > 0) {
      const addVideoContainer = document.createElement('div');
      addVideoContainer.style.display = 'flex';
      addVideoContainer.style.flexDirection = 'column';
      addVideoContainer.style.gap = '8px';
      addVideoContainer.style.marginBottom = '12px';

      const searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.placeholder = '🔍 Filtrar vídeos da pasta...';
      searchInput.style.width = '100%';
      searchInput.style.padding = '10px';
      searchInput.style.borderRadius = '12px';
      searchInput.style.border = '1px solid #e2e8f0';
      searchInput.style.boxSizing = 'border-box';
      searchInput.style.background = '#ffffff';

      const addVideoForm = document.createElement('div');
      addVideoForm.style.display = 'grid';
      addVideoForm.style.gridTemplateColumns = '1fr auto';
      addVideoForm.style.gap = '8px';
      
      const videoSelect = document.createElement('select');
      videoSelect.style.width = '100%';
      videoSelect.style.padding = '10px';
      videoSelect.style.borderRadius = '12px';
      videoSelect.style.border = '1px solid #e2e8f0';
      videoSelect.style.background = '#ffffff';

      const defaultVidOpt = document.createElement('option');
      defaultVidOpt.value = '';
      defaultVidOpt.textContent = 'Vincular outro vídeo...';
      defaultVidOpt.disabled = true;
      defaultVidOpt.selected = true;
      videoSelect.appendChild(defaultVidOpt);

      let hasAvailableOptions = false;
      todosVideosDaPasta.forEach(url => {
        if (!ex.videosDisponiveis || !ex.videosDisponiveis.includes(url)) {
          const opt = document.createElement('option');
          opt.value = url;
          try { opt.textContent = decodeURIComponent(url.split('/').pop()).replace(/\.[^/.]+$/, ""); } catch(e) { opt.textContent = url; }
          videoSelect.appendChild(opt);
          hasAvailableOptions = true;
        }
      });

      const linkBtn = document.createElement('button');
      linkBtn.type = 'button';
      linkBtn.textContent = 'Vincular';
      linkBtn.className = 'add-serie-btn';
      linkBtn.style.padding = '10px 16px';
      linkBtn.addEventListener('click', () => {
        if (videoSelect.value) callbacks.onAddVideoManual(index, videoSelect.value);
      });

      searchInput.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase().trim();
        const options = videoSelect.querySelectorAll('option:not(:disabled)');
        options.forEach(opt => {
          if (opt.textContent.toLowerCase().includes(termo)) {
            opt.style.display = '';
          } else {
            opt.style.display = 'none';
          }
        });
      });

      if (hasAvailableOptions) {
        addVideoContainer.appendChild(searchInput);
        addVideoForm.appendChild(videoSelect);
        addVideoForm.appendChild(linkBtn);
        addVideoContainer.appendChild(addVideoForm);
        item.appendChild(addVideoContainer);
      }
    }

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
      rmMusculo.addEventListener('click', () => callbacks.onRemoveMusculo(index, musculo));

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
        callbacks.onAddMusculo(index, m, parseFloat(valorSelect.value));
      }
    });

    addMusculoForm.appendChild(musculoSelect);
    addMusculoForm.appendChild(valorSelect);
    addMusculoForm.appendChild(addBtn);

    item.appendChild(addMusculoForm);
    listElem.appendChild(item);
  });
}

export function renderVisaoGeralExecucaoUI(exercicios, seriesParaExecutar, containerElement, callbacks) {
  if (!containerElement) return;
  containerElement.innerHTML = '';

  if (exercicios.length === 0) {
    const aviso = document.createElement('p');
    aviso.className = 'small-text';
    aviso.textContent = 'Nenhum exercício no treino.';
    containerElement.appendChild(aviso);
    return;
  }

  exercicios.forEach((exercicio, exIndex) => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.style.flexDirection = 'column';
    item.style.alignItems = 'flex-start';

    const topRow = document.createElement('div');
    topRow.style.display = 'flex';
    topRow.style.width = '100%';
    topRow.style.justifyContent = 'space-between';
    topRow.style.alignItems = 'center';

    const title = document.createElement('span');
    title.textContent = exercicio.nome;
    title.style.fontWeight = '700';
    title.style.fontSize = '16px';
    title.style.color = '#0f172a';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remover';
    removeBtn.addEventListener('click', () => callbacks.onRemoveExercicio(exIndex));

    topRow.appendChild(title);
    topRow.appendChild(removeBtn);
    item.appendChild(topRow);

    const setsOfThisEx = seriesParaExecutar.filter(s => s.exercicioIndex === exIndex);
    const completedSets = setsOfThisEx.filter(s => s.preenchida).length;
    
    const progress = document.createElement('span');
    progress.className = 'small-text';
    progress.style.marginTop = '6px';
    progress.style.fontWeight = '600';
    progress.style.color = completedSets === setsOfThisEx.length ? '#10b981' : '#64748b';
    progress.textContent = `${completedSets} de ${setsOfThisEx.length} séries concluídas`;
    item.appendChild(progress);

    const contadorContainer = document.createElement('div');
    contadorContainer.style.display = 'flex';
    contadorContainer.style.alignItems = 'center';
    contadorContainer.style.justifyContent = 'space-between';
    contadorContainer.style.marginTop = '16px';
    contadorContainer.style.width = '100%';

    const contadorLabel = document.createElement('span');
    contadorLabel.textContent = `Séries: ${setsOfThisEx.length}`;
    contadorLabel.style.fontWeight = '700';

    const controlesDiv = document.createElement('div');
    controlesDiv.style.display = 'flex';
    controlesDiv.style.gap = '8px';

    const removeSerieBtn = document.createElement('button');
    removeSerieBtn.type = 'button';
    removeSerieBtn.className = 'remove-serie-btn';
    removeSerieBtn.textContent = '-';
    removeSerieBtn.style.padding = '8px 16px';
    removeSerieBtn.disabled = setsOfThisEx.length === 0 || (setsOfThisEx.length > 0 && setsOfThisEx[setsOfThisEx.length - 1].preenchida);
    removeSerieBtn.addEventListener('click', () => callbacks.onRemoveSerie(exIndex));

    const addSerieBtn = document.createElement('button');
    addSerieBtn.type = 'button';
    addSerieBtn.className = 'add-serie-btn';
    addSerieBtn.textContent = '+';
    addSerieBtn.style.padding = '8px 16px';
    addSerieBtn.addEventListener('click', () => callbacks.onAddSerie(exIndex));

    controlesDiv.appendChild(removeSerieBtn);
    controlesDiv.appendChild(addSerieBtn);
    
    contadorContainer.appendChild(contadorLabel);
    contadorContainer.appendChild(controlesDiv);

    item.appendChild(contadorContainer);
    containerElement.appendChild(item);
  });
}