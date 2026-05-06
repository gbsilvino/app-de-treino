import { supabase, isSupabaseEnabled } from './supabaseClient.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeJSONParse(value, fallback) {
  if (!value || value === "undefined" || value === "null") return fallback;
  try { return JSON.parse(value); }
  catch (e) {
    console.error("Erro ao analisar dados do LocalStorage:", e);
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Current-user context
// Must be set by auth-controller after login so all Supabase ops are scoped.
// ---------------------------------------------------------------------------

let _currentUserId = null;

export function setCurrentUserId(id) {
  _currentUserId = id || null;
}

export function getCurrentUserId() {
  return _currentUserId;
}

// ---------------------------------------------------------------------------
// Supabase key-value helpers (scoped to _currentUserId)
//
// Schema: app_state (user_id UUID, key TEXT, value JSONB, updated_at TIMESTAMPTZ)
//         PRIMARY KEY (user_id, key)
// ---------------------------------------------------------------------------

async function sbGet(key, userId = _currentUserId) {
  if (!isSupabaseEnabled || !userId) return null;
  try {
    const { data, error } = await supabase
      .from('app_state')
      .select('value')
      .eq('user_id', userId)
      .eq('key', key)
      .maybeSingle();
    if (error) { console.error('[Supabase] sbGet error:', error.message); return null; }
    return data ? data.value : null;
  } catch (e) {
    console.error('[Supabase] sbGet exception:', e);
    return null;
  }
}

async function sbSet(key, value, userId = _currentUserId) {
  if (!isSupabaseEnabled || !userId) return;
  try {
    const { error } = await supabase
      .from('app_state')
      .upsert(
        { user_id: userId, key, value, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,key' }
      );
    if (error) console.error('[Supabase] sbSet error:', error.message);
  } catch (e) {
    console.error('[Supabase] sbSet exception:', e);
  }
}

async function sbDelete(key, userId = _currentUserId) {
  if (!isSupabaseEnabled || !userId) return;
  try {
    const { error } = await supabase
      .from('app_state')
      .delete()
      .eq('user_id', userId)
      .eq('key', key);
    if (error) console.error('[Supabase] sbDelete error:', error.message);
  } catch (e) {
    console.error('[Supabase] sbDelete exception:', e);
  }
}

// ---------------------------------------------------------------------------
// On-startup sync: pull all app_state rows for a given userId into localStorage.
// Pass targetUserId when a profissional is loading a client's data.
// ---------------------------------------------------------------------------

export async function sincronizarDoSupabase(targetUserId = _currentUserId) {
  if (!isSupabaseEnabled || !targetUserId) return;

  // Clear stale workout keys from localStorage before loading new context
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && (k === 'treinos' || k === 'treinoSelecionado' || k === 'historico' ||
              k === 'exerciciosPreDefinidos' || k === 'estadoExecucao' ||
              k.startsWith('exercicios_'))) {
      keysToRemove.push(k);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));

  try {
    const { data, error } = await supabase
      .from('app_state')
      .select('key, value')
      .eq('user_id', targetUserId);
    if (error) { console.error('[Supabase] sincronizarDoSupabase error:', error.message); return; }
    if (!data || data.length === 0) return;

    data.forEach(({ key, value }) => {
      if (value === null || value === undefined) {
        localStorage.removeItem(key);
      } else if (typeof value === 'string') {
        localStorage.setItem(key, value);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    });
    console.log(`[Supabase] ${data.length} chave(s) sincronizadas (user: ${targetUserId})`);
  } catch (e) {
    console.error('[Supabase] sincronizarDoSupabase exception:', e);
  }
}

// ---------------------------------------------------------------------------
// Estado principal
// ---------------------------------------------------------------------------

export function salvarEstadoStorage(treinos, treinoSelecionado, historico, exerciciosPreDefinidos) {
  localStorage.setItem('treinos', JSON.stringify(treinos));
  localStorage.setItem('treinoSelecionado', treinoSelecionado);
  localStorage.setItem('historico', JSON.stringify(historico));
  localStorage.setItem('exerciciosPreDefinidos', JSON.stringify(exerciciosPreDefinidos));

  sbSet('treinos', treinos);
  sbSet('treinoSelecionado', treinoSelecionado);
  sbSet('historico', historico);
  sbSet('exerciciosPreDefinidos', exerciciosPreDefinidos);
}

export function carregarEstadoStorage() {
  return {
    historicoSalvo:    safeJSONParse(localStorage.getItem('historico'), []),
    exerciciosSalvos:  safeJSONParse(localStorage.getItem('exerciciosPreDefinidos'), null),
    treinosSalvos:     safeJSONParse(localStorage.getItem('treinos'), null),
    selecionadoSalvo:  localStorage.getItem('treinoSelecionado')
  };
}

// ---------------------------------------------------------------------------
// Exercícios por treino
// ---------------------------------------------------------------------------

export function salvarExerciciosTreinoStorage(treino, exercicios) {
  if (!treino) return;
  const key = `exercicios_${treino}`;
  localStorage.setItem(key, JSON.stringify(exercicios));
  sbSet(key, exercicios);
}

export function carregarExerciciosTreinoStorage(treino) {
  const raw = localStorage.getItem(`exercicios_${treino}`);
  if (!raw || raw === "undefined" || raw === "null") return [];
  try {
    let parsed = JSON.parse(raw);
    if (typeof parsed === 'string') parsed = JSON.parse(parsed);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function removerExerciciosTreinoStorage(treino) {
  const key = `exercicios_${treino}`;
  localStorage.removeItem(key);
  sbDelete(key);
}

export function transferirExerciciosTreinoStorage(nomeAntigo, novoNome) {
  const keyAntigo = `exercicios_${nomeAntigo}`;
  const keyNovo   = `exercicios_${novoNome}`;
  const raw = localStorage.getItem(keyAntigo);
  if (raw) {
    localStorage.setItem(keyNovo, raw);
    localStorage.removeItem(keyAntigo);
    const parsed = safeJSONParse(raw, null);
    if (parsed !== null) sbSet(keyNovo, parsed);
    sbDelete(keyAntigo);
  }
}

export function copiarExerciciosTreinoStorage(nomeOriginal, novoNome) {
  const raw = localStorage.getItem(`exercicios_${nomeOriginal}`);
  if (raw) {
    localStorage.setItem(`exercicios_${novoNome}`, raw);
    const parsed = safeJSONParse(raw, null);
    if (parsed !== null) sbSet(`exercicios_${novoNome}`, parsed);
  }
}

// ---------------------------------------------------------------------------
// Estado de execução
// ---------------------------------------------------------------------------

export function salvarEstadoExecucaoStorage(estado) {
  localStorage.setItem('estadoExecucao', JSON.stringify(estado));
  sbSet('estadoExecucao', estado);
}

export function carregarEstadoExecucaoStorage() {
  return safeJSONParse(localStorage.getItem('estadoExecucao'), null);
}

// ---------------------------------------------------------------------------
// Diretório de vídeos
// ---------------------------------------------------------------------------

export function carregarDiretorioVideos() {
  return localStorage.getItem('diretorioVideos') || '';
}

export function salvarDiretorioVideos(dir) {
  localStorage.setItem('diretorioVideos', dir);
  sbSet('diretorioVideos', dir);
}

// ---------------------------------------------------------------------------
// Limpeza de chaves antigas
// ---------------------------------------------------------------------------

export function limparDadosAntigosStorage() {
  if (!localStorage.getItem('limpezaFantasmas_v1')) {
    localStorage.removeItem('exerciciosPreDefinidos');
    localStorage.setItem('limpezaFantasmas_v1', 'true');
    sbDelete('exerciciosPreDefinidos');
    sbSet('limpezaFantasmas_v1', 'true');
    console.log('Banco de exercícios redefinido para os nativos.');
  }

  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (
      key === 'clienteNome' ||
      key === 'estadoExecucao' ||
      key.startsWith('clientes_') ||
      key.startsWith('treinos_') ||
      key.startsWith('treinoSelecionado_') ||
      key.startsWith('estadoExecucao_')
    ) {
      localStorage.removeItem(key);
      sbDelete(key);
    }
    if (key.startsWith('exercicios_')) {
      const parts = key.split('_');
      if (parts.length > 2) { localStorage.removeItem(key); sbDelete(key); }
    }
  }
}
