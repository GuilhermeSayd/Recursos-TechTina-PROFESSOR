/* =========================
   script.js – TechTina v1.5 (final corrigido)
   Sistema de Pedidos da Cantina Escolar 🍊
   ========================= */

/* ====== 0) TOAST ACESSÍVEL ====== */
let $toast = null;
let __toastTimer = null;

function mostrarToast(mensagem, tipo = 'ok') {
  if (!$toast) $toast = document.getElementById('toast');
  if (!$toast) {
    alert(mensagem);
    return;
  }

  $toast.classList.remove('warn', 'err', 'ok', 'visivel');

  const t = tipo.toLowerCase();
  if (t === 'warn' || t === 'warning') $toast.classList.add('warn');
  else if (t === 'err' || t === 'error') $toast.classList.add('err');
  else $toast.classList.add('ok');

  $toast.textContent = mensagem;

  void $toast.offsetWidth;
  $toast.classList.add('visivel');

  clearTimeout(__toastTimer);
  __toastTimer = setTimeout(() => $toast.classList.remove('visivel'), 2800);
}

/* ====== 1) AVISOS E FERIADOS ====== */
const avisosCantina = [
  { data: '2025-10-12', texto: '🚫 Cantina fechada — Nossa Senhora Aparecida (feriado nacional).' },
  { data: '2025-11-15', texto: '🚫 Cantina fechada — Proclamação da República.' },
  { data: '2025-12-20', texto: '🎉 Último dia de aula! Lanche especial: Strogonoff de carne ou frango com arroz e batata palha.' },
  { data: '2025-12-25', texto: '🎄 Cantina fechada — Natal.' },
  { data: '2026-01-01', texto: '🎆 Cantina fechada — Confraternização Universal.' }
];

function atualizarAvisos() {
  const lista = document.querySelector('#listaAvisos');
  if (!lista) return;

  const hoje = new Date();
  lista.innerHTML = '';

  avisosCantina.forEach(aviso => {
    const dataAviso = new Date(aviso.data);
    const diferencaDias = Math.ceil((dataAviso - hoje) / (1000 * 60 * 60 * 24));
    let mensagemExtra = '';

    if (diferencaDias === 0) mensagemExtra = ' (📅 Hoje)';
    else if (diferencaDias === 1) mensagemExtra = ' (⏰ Amanhã)';
    else if (diferencaDias > 1 && diferencaDias <= 7) mensagemExtra = ` (em ${diferencaDias} dias)`;

    const li = document.createElement('li');
    li.textContent = `${aviso.texto}${mensagemExtra}`;
    lista.appendChild(li);
  });
}

/* ====== 2) VALIDAÇÃO RÁPIDA (LEGADO) ====== */
(function inicializarValidacao() {
  const form = document.querySelector('.formRapido');
  if (!form) return;
  const seletorRecurso = form.querySelector('select');
  const campoData = form.querySelector('input[type="date"]');
  const campoInicio = form.querySelector('input[placeholder="Início"]');
  const campoFim = form.querySelector('input[placeholder="Fim"]');

  [seletorRecurso, campoData, campoInicio, campoFim].forEach(el => {
    if (!el) return;
    el.addEventListener('input', () => el.style.borderColor = '');
    el.addEventListener('change', () => el.style.borderColor = '');
  });

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    let valido = true;

    if (seletorRecurso && seletorRecurso.selectedIndex === 0) { seletorRecurso.style.borderColor = 'red'; valido = false; }
    if (campoData && !campoData.value) { campoData.style.borderColor = 'red'; valido = false; }

    const hInicio = campoInicio?.value || '';
    const hFim = campoFim?.value || '';
    if (!hInicio) { campoInicio.style.borderColor = 'red'; valido = false; }
    if (!hFim) { campoFim.style.borderColor = 'red'; valido = false; }

    if (hInicio && hFim && hFim <= hInicio) {
      mostrarToast('O horário final precisa ser maior que o horário inicial.', 'warn');
      campoInicio.style.borderColor = 'red';
      campoFim.style.borderColor = 'red';
      return;
    }

    if (!valido) {
      mostrarToast('Por favor, preencha todos os campos obrigatórios.', 'warn');
      return;
    }

    mostrarToast('Reserva simulada com sucesso! (fluxo rápido/legado)', 'ok');
    form.reset();
  });
})();

/* ====== 3) ESTADO ====== */
function dadosDoForm(form) {
  return Object.fromEntries(new FormData(form).entries());
}

let usuarioAtual = null;
let ultimoFiltroPesquisa = null;
const reservas = [];

/* ====== 4) MENU ATIVO ====== */
const menuLinks = document.querySelectorAll('.menu a, header .acoesNav a');
function atualizarMenuAtivo() {
  const hash = location.hash || '#secLogin';
  menuLinks.forEach(a => {
    const ativo = a.getAttribute('href') === hash;
    a.setAttribute('aria-current', ativo ? 'true' : 'false');
  });
}
window.addEventListener('hashchange', atualizarMenuAtivo);

/* ====== 5) LOGIN, PESQUISA, SOLICITAÇÃO E HISTÓRICO ====== */
const formLogin     = document.getElementById('formLogin');
const formPesquisa  = document.getElementById('formPesquisa');
const formSolicitar = document.getElementById('formSolicitar');
const listaReservas = document.getElementById('listaReservas');

/* a) LOGIN */
formLogin?.addEventListener('submit', (e) => {
  e.preventDefault();
  const { usuario, senha } = dadosDoForm(formLogin);
  if (!usuario || (senha || '').length < 3) {
    mostrarToast('Usuário/senha inválidos (mín. 4 caracteres).', 'warn');
    return;
  }
  const TioTia = /Tio|Tia/i.test(usuario);
  usuarioAtual = { login: usuario, admin: TioTia };
  mostrarToast(`🍽️ Bem-vindo(a), ${usuarioAtual.login}!`, 'ok');
  location.hash = '#secPesquisa';
  atualizarMenuAtivo();
});

/* b) DISPONIBILIDADE E VALIDAÇÃO DE DATAS */
function verificarDisponibilidadeData(dataSelecionada) {
  if (!dataSelecionada) return false;

  const data = new Date(dataSelecionada + "T00:00:00");
  if (isNaN(data)) return false;

  const diaSemana = data.getDay(); // 0 = domingo, 6 = sábado
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const formato = `${dia}-${mes}`;

  const feriados = [
    '01-01','21-04','01-05','07-09',
    '12-10','02-11','15-11','25-12'
  ];

  if (diaSemana === 0 || diaSemana === 6) {
    mostrarToast('🍞 A cantina não abre aos finais de semana. Escolha um dia útil!', 'warn');
    return false;
  }

  if (feriados.includes(formato)) {
    mostrarToast('🎉 A cantina estará fechada nesse feriado. Escolha outro dia.', 'warn');
    return false;
  }

  return true;
}

/* c) PESQUISAR LANCHES */
formPesquisa?.addEventListener('submit', (e) => {
  e.preventDefault();

  if (!usuarioAtual) {
    mostrarToast('Faça login antes de pesquisar.', 'warn');
    location.hash = '#secLogin';
    atualizarMenuAtivo();
    return;
  }

  const { recurso, data, hora } = dadosDoForm(formPesquisa);
  if (!recurso || !data || !hora) {
    mostrarToast('Preencha todos os campos (lanche, data e horário).', 'warn');
    return;
  }

  if (!verificarDisponibilidadeData(data)) return;

  ultimoFiltroPesquisa = { recurso, data, hora };
  const quando = new Date(`${data}T${hora}`).toLocaleString('pt-BR');
  mostrarToast(`Disponível: ${recurso} em ${quando}.`, 'ok');
  location.hash = '#secSolicitar';
  atualizarMenuAtivo();
});

/* d) SOLICITAR PEDIDO */
formSolicitar?.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!usuarioAtual) {
    mostrarToast('Faça login antes de solicitar.', 'warn');
    location.hash = '#secLogin';
    atualizarMenuAtivo();
    return;
  }
  if (!ultimoFiltroPesquisa) {
    mostrarToast('Pesquise a disponibilidade antes de solicitar.', 'warn');
    location.hash = '#secPesquisa';
    atualizarMenuAtivo();
    return;
  }
  const { justificativa } = dadosDoForm(formSolicitar);
  if (!justificativa) {
    mostrarToast('Descreva as observações do pedido.', 'warn');
    return;
  }

  const status = usuarioAtual.admin ? 'aprovada' : 'pendente';
  const nova = { ...ultimoFiltroPesquisa, justificativa, status, autor: usuarioAtual.login };
  reservas.push(nova);
  renderItemReserva(nova);

  mostrarToast(
    status === 'aprovada'
      ? 'Pedido aprovado automaticamente! 🍩'
      : 'Pedido enviado para análise. ⏳',
    'ok'
  );

  formSolicitar.reset();
  location.hash = '#secHistorico';
  atualizarMenuAtivo();
});

/* e) HISTÓRICO */
function renderItemReserva({ recurso, data, hora, justificativa, status }) {
  if (!listaReservas) return;
  const li = document.createElement('li');
  const quando = new Date(`${data}T${hora}`).toLocaleString('pt-BR');
  li.innerHTML = `
    <span><strong>${recurso}</strong> — ${quando}</span>
    <span>${status === 'aprovada' ? '✅ Aprovada' : '⏳ Pendente'}</span>
  `;
  li.addEventListener('click', () => {
    if (li.dataset.status === 'cancelada') return;
    li.dataset.status = 'cancelada';
    li.lastElementChild.textContent = '❌ Cancelada';
    mostrarToast('Pedido cancelado.', 'warn');
  });
  listaReservas.appendChild(li);
}

/* ====== 6) BLOQUEAR DATAS E AVISOS ====== */
function bloquearDiasIndisponiveis() {
  const campoData = document.getElementById('campoData');
  if (!campoData) return;

  const hoje = new Date().toISOString().split('T')[0];
  campoData.setAttribute('min', hoje);

  campoData.addEventListener('input', () => {
    const dataSelecionada = campoData.value;
    if (!verificarDisponibilidadeData(dataSelecionada)) campoData.value = '';
  });
}

function verificarDiaAtual() {
  const hoje = new Date();
  const diaSemana = hoje.getDay();
  const feriados = ['01-01','21-04','01-05','07-09','12-10','02-11','15-11','25-12'];
  const diaMes = `${String(hoje.getDate()).padStart(2, '0')}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

  if (diaSemana === 0 || diaSemana === 6) {
    mostrarToast('⛔ A cantina está fechada hoje (fim de semana).', 'warn');
  } else if (feriados.includes(diaMes)) {
    mostrarToast('🎉 Hoje é feriado! A cantina estará fechada.', 'warn');
  }
}

/* ====== 7) ARRANQUE DO SISTEMA ====== */
document.addEventListener('DOMContentLoaded', () => {
  atualizarAvisos();
  atualizarMenuAtivo();
  bloquearDiasIndisponiveis();
  verificarDiaAtual();

  $toast = document.getElementById('toast');
  setTimeout(() => {
    mostrarToast('Sistema iniciado com sucesso! 🍊', 'ok');
  }, 1000);
});
