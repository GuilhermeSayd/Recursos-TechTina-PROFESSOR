/* ===============================
   Sistema de Reserva - Sprint 2
   =============================== */

/* ====== 0) Toast (substitui alert) ====== */
const $toast = document.getElementById('toast');
let __toastTimer = null;

function mostrarToast(mensagem, tipo = 'ok') {
  if (!$toast) { alert(mensagem); return; }

  $toast.classList.remove('warn', 'err', 'visivel');
  if (tipo === 'warn') $toast.classList.add('warn');
  if (tipo === 'err')  $toast.classList.add('err');
  $toast.textContent = mensagem;

  void $toast.offsetWidth; // reflow
  $toast.classList.add('visivel');

  clearTimeout(__toastTimer);
  __toastTimer = setTimeout(() => $toast.classList.remove('visivel'), 2800);
}

/* ====== 1) Estado simulado ====== */
let usuarioAtual = null;      // { login, professor: boolean }
let ultimoFiltroPesquisa = null;
const reservas = [];

/* ====== 2) Helpers ====== */
function dadosDoForm(form) {
  return Object.fromEntries(new FormData(form).entries());
}

/* ====== 3) Fluxo principal ====== */
const formLogin     = document.getElementById('formLogin');
const formPesquisa  = document.getElementById('formPesquisa');
const formSolicitar = document.getElementById('formSolicitar');
const listaReservas = document.getElementById('listaReservas');

/* --- LOGIN --- */
formLogin?.addEventListener('submit', (e) => {
  e.preventDefault();
  const { usuario, senha } = dadosDoForm(formLogin);

  if (!usuario || senha.length < 3) {
    mostrarToast('Usuário/senha inválidos (mín. 3 caracteres).', 'warn');
    return;
  }

  const professor = /prof/i.test(usuario);
  usuarioAtual = { login: usuario, professor };

  mostrarToast(`Bem-vindo, ${usuarioAtual.login}!`);
  location.hash = '#secPesquisa';
});

/* --- PESQUISA --- */
formPesquisa?.addEventListener('submit', (e) => {
  e.preventDefault();

  if (!usuarioAtual) {
    mostrarToast('Faça login antes de pesquisar.', 'warn');
    location.hash = '#secLogin';
    return;
  }

  const { recurso, data, hora } = dadosDoForm(formPesquisa);
  if (!recurso || !data || !hora) {
    mostrarToast('Preencha recurso, data e horário.', 'warn');
    return;
  }

  ultimoFiltroPesquisa = { recurso, data, hora };
  const quando = new Date(`${data}T${hora}`).toLocaleString('pt-BR');
  mostrarToast(`Disponível: ${recurso} em ${quando}.`);
  location.hash = '#secSolicitar';
});

/* --- SOLICITAR --- */
formSolicitar?.addEventListener('submit', (e) => {
  e.preventDefault();

  if (!usuarioAtual) {
    mostrarToast('Faça login antes de solicitar.', 'warn');
    location.hash = '#secLogin';
    return;
  }

  if (!ultimoFiltroPesquisa) {
    mostrarToast('Pesquise a disponibilidade antes de solicitar.', 'warn');
    location.hash = '#secPesquisa';
    return;
  }

  const { justificativa } = dadosDoForm(formSolicitar);
  if (!justificativa) {
    mostrarToast('Descreva a justificativa.', 'warn');
    return;
  }

  const status = usuarioAtual.professor ? 'aprovada' : 'pendente';
  const nova = { ...ultimoFiltroPesquisa, justificativa, status, autor: usuarioAtual.login };
  reservas.push(nova);
  renderItemReserva(nova);

  mostrarToast(
    status === 'aprovada' ? 'Reserva aprovada automaticamente.' : 'Reserva enviada para análise.'
  );

  formSolicitar.reset();
  location.hash = '#secHistorico';
});

/* --- HISTÓRICO --- */
function renderItemReserva({ recurso, data, hora, justificativa, status }) {
  if (!listaReservas) return;

  const li = document.createElement('li');
  const quando = new Date(`${data}T${hora}`).toLocaleString('pt-BR');
  li.innerHTML = `
    <span><strong>${recurso}</strong> — ${quando}</span>
    <span>${status === 'aprovada' ? '✅ Aprovada' :
             status === 'cancelada' ? '❌ Cancelada' : '⏳ Pendente'}</span>
  `;

  li.addEventListener('click', () => {
    if (li.dataset.status === 'cancelada') return;
    li.dataset.status = 'cancelada';
    li.lastElementChild.textContent = '❌ Cancelada';
    mostrarToast('Reserva cancelada.', 'warn');
  });

  listaReservas.appendChild(li);
}

/* --- MENU ativo por hash --- */
function atualizarMenuAtivo() {
  const hash = location.hash || '#secLogin';
  document.querySelectorAll('.acoesNav a').forEach(a => {
    const ativo = a.getAttribute('href') === hash;
    a.setAttribute('aria-current', ativo ? 'true' : 'false');
  });
}
window.addEventListener('hashchange', atualizarMenuAtivo);
document.addEventListener('DOMContentLoaded', atualizarMenuAtivo);
