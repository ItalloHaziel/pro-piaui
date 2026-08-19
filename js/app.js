async function bootstrapData() {
  const overlay = document.getElementById('load-overlay');
  const msgEl = document.getElementById('load-msg');
  const retryBtn = document.getElementById('retry-btn');
  overlay.classList.remove('hidden', 'error');
  retryBtn.classList.add('hidden');
  msgEl.textContent = 'Carregando dados direto do Google Sheets…';

  try {
    const DATA = await loadAllData();
    renderAll(DATA);
    overlay.classList.add('hidden');
    const now = new Date();
    document.getElementById('data-status-text').textContent =
      'Dados de ' + now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
  } catch (err) {
    console.error(err);
    overlay.classList.add('error');
    msgEl.textContent = 'Não foi possível carregar os dados do Google Sheets. Verifique se as abas estão publicadas na web e se as URLs em CSV_URLS estão corretas. Detalhe: ' + err.message;
    retryBtn.classList.remove('hidden');
  }
}

document.getElementById('data-status-text').textContent = 'Carregando…';
bootstrapData();
