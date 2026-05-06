import { supabase, isSupabaseEnabled } from './supabaseClient.js';

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
// _currentUserId  — authenticated user (Gabriel or student)
// _activeTargetId — whose data is being edited (may differ when Gabriel opens a student)
// ---------------------------------------------------------------------------

let _currentUserId  = null;
let _activeTargetId = null;

export function setCurrentUserId(id)  { _currentUserId  = id || null; }
export function getCurrentUserId()    { return _currentUserId; }
export function setActiveTargetId(id) { _activeTargetId = id || null; }
export function getActiveTargetId()   { return _activeTargetId || _currentUserId; }

// ---------------------------------------------------------------------------
// Supabase blob helpers
// Schema: app_state (user_id UUID, key TEXT, value JSONB, updated_at TIMESTAMPTZ)
//         PRIMARY KEY (user_id, key)
// One row per user: key = 'workout_{user_id}'
// ---------------------------------------------------------------------------

const WORKOUT_LS_KEYS = [
  'treinos', 'treinoSelecionado', 'historico', 'exerciciosPreDefinidos',
  'estadoExecucao', 'limpezaFantasmas_v1', 'diretorioVideos'
];

function workoutKey(userId) { return `workout_${userId}`; }

function buildWorkoutBlob() {
  const blob = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (WORKOUT_LS_KEYS.includes(k) || k.startsWith('exercicios_')) {
      const raw = localStorage.getItem(k);
      try { blob[k] = JSON.parse(raw); } catch { blob[k] = raw; }
    }
  }
  return blob;
}

async function sbSaveWorkout() {
  const targetId = _activeTargetId || _currentUserId;
  if (!isSupabaseEnabled || !targetId) return;
  try {
    const { error } = await supabase
      .from('app_state')
      .upsert(
        { user_id: targetId, key: workoutKey(targetId), value: buildWorkoutBlob(), updated_at: new Date().toISOString() },
        { onConflict: 'user_id,key' }
      );
    if (error) console.error('[Supabase] sbSaveWorkout error:', error.message);
  } catch (e) {
    console.error('[Supabase] sbSaveWorkout exception:', e);
  }
}

// ---------------------------------------------------------------------------
// On-startup sync: pull workout blob for targetUserId into localStorage.
// Sets _activeTargetId so all subsequent saves target the same user.
// ---------------------------------------------------------------------------

export async function sincronizarDoSupabase(targetUserId = _currentUserId) {
  if (!isSupabaseEnabled || !targetUserId) return;

  _activeTargetId = targetUserId;

  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && (WORKOUT_LS_KEYS.includes(k) || k.startsWith('exercicios_'))) {
      keysToRemove.push(k);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));

  try {
    const { data, error } = await supabase
      .from('app_state')
      .select('value')
      .eq('user_id', targetUserId)
      .eq('key', workoutKey(targetUserId))
      .maybeSingle();
    if (error) { console.error('[Supabase] sincronizarDoSupabase error:', error.message); return; }
    if (!data?.value) return;

    const blob = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    Object.entries(blob).forEach(([k, v]) => {
      if (v === null || v === undefined) localStorage.removeItem(k);
      else localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
    });
    console.log(`[Supabase] workout blob loaded (user: ${targetUserId})`);
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
  sbSaveWorkout();
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
  localStorage.setItem(`exercicios_${treino}`, JSON.stringify(exercicios));
  sbSaveWorkout();
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
  localStorage.removeItem(`exercicios_${treino}`);
  sbSaveWorkout();
}

export function transferirExerciciosTreinoStorage(nomeAntigo, novoNome) {
  const raw = localStorage.getItem(`exercicios_${nomeAntigo}`);
  if (raw) {
    localStorage.setItem(`exercicios_${novoNome}`, raw);
    localStorage.removeItem(`exercicios_${nomeAntigo}`);
    sbSaveWorkout();
  }
}

export function copiarExerciciosTreinoStorage(nomeOriginal, novoNome) {
  const raw = localStorage.getItem(`exercicios_${nomeOriginal}`);
  if (raw) {
    localStorage.setItem(`exercicios_${novoNome}`, raw);
    sbSaveWorkout();
  }
}

// ---------------------------------------------------------------------------
// Estado de execução
// ---------------------------------------------------------------------------

export function salvarEstadoExecucaoStorage(estado) {
  localStorage.setItem('estadoExecucao', JSON.stringify(estado));
  sbSaveWorkout();
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
  sbSaveWorkout();
}

// ---------------------------------------------------------------------------
// Limpeza de chaves antigas
// ---------------------------------------------------------------------------

export function limparDadosAntigosStorage() {
  if (!localStorage.getItem('limpezaFantasmas_v1')) {
    localStorage.removeItem('exerciciosPreDefinidos');
    localStorage.setItem('limpezaFantasmas_v1', 'true');
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
    }
    if (key.startsWith('exercicios_')) {
      const parts = key.split('_');
      if (parts.length > 2) localStorage.removeItem(key);
    }
  }
}
