const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');

contextBridge.exposeInMainWorld('electron', {
  name: 'App de Treino',
  lerPastaDeVideos: (caminho) => {
    try {
      if (fs.existsSync(caminho)) {
        const extensoes = ['.mp4', '.mov', '.mkv', '.webm', '.avi'];
        return fs.readdirSync(caminho).filter(file => extensoes.some(ext => file.toLowerCase().endsWith(ext)));
      }
      return [];
    } catch (error) {
      console.error('Erro ao ler a pasta de vídeos:', error);
      return [];
    }
  },
  selecionarPasta: () => ipcRenderer.invoke('selecionar-pasta'),
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || ''
  }
});
