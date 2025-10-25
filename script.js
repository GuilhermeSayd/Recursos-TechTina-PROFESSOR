/* =========================
   script.js – TechTina v2.0
   Sistema de Pedidos da Cantina Escolar 🍊
   ========================= */

// ====== TOAST ACESSÍVEL ======



// Inicializar quando o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    TechTinaAtualizada.inicializar();
});

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
    __toastTimer = setTimeout(() => $toast.classList.remove('visivel'), 4000);
}
// ====== AVISOS E FERIADOS ======
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

// ====== VALIDAÇÃO RÁPIDA (LEGADO) ======
function inicializarValidacaoRapida() {
    const form = document.querySelector('.formRapido');
    if (!form) return;

    const seletorRecurso = form.querySelector('select');
    const campoData = form.querySelector('input[type="date"]');
    const campoInicio = form.querySelector('input[placeholder="Início"]');
    const campoFim = form.querySelector('input[placeholder="Fim"]');

    [seletorRecurso, campoData, campoInicio, campoFim].forEach(el => {
        if (!el) return;
        el.addEventListener('input', () => {
            el.style.borderColor = '';
            el.setAttribute('aria-invalid', 'false');
        });
    });

    form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        let valido = true;

        if (seletorRecurso && seletorRecurso.selectedIndex === 0) {
            seletorRecurso.style.borderColor = 'red';
            seletorRecurso.setAttribute('aria-invalid', 'true');
            valido = false;
        }
        if (campoData && !campoData.value) {
            campoData.style.borderColor = 'red';
            campoData.setAttribute('aria-invalid', 'true');
            valido = false;
        }

        const hInicio = campoInicio?.value || '';
        const hFim = campoFim?.value || '';
        if (!hInicio) {
            campoInicio.style.borderColor = 'red';
            campoInicio.setAttribute('aria-invalid', 'true');
            valido = false;
        }
        if (!hFim) {
            campoFim.style.borderColor = 'red';
            campoFim.setAttribute('aria-invalid', 'true');
            valido = false;
        }

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
}

// ====== ESTADO DO SISTEMA ======
function dadosDoForm(form) {
    return Object.fromEntries(new FormData(form).entries());
}

let usuarioAtual = null;
let ultimoFiltroPesquisa = null;
const reservas = [];

// ====== MENU ATIVO ======
const menuLinks = document.querySelectorAll('.menu a, header .acoesNav a');

function atualizarMenuAtivo() {
    const hash = location.hash || '#secLogin';
    menuLinks.forEach(a => {
        const ativo = a.getAttribute('href') === hash;
        a.setAttribute('aria-current', ativo ? 'true' : 'false');
        a.classList.toggle('ativo', ativo);
    });
}

// ====== SISTEMA PRINCIPAL ======

// LOGIN
function inicializarLogin() {
    const formLogin = document.getElementById('formLogin');
    if (!formLogin) return;

    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const { usuario, senha } = dadosDoForm(formLogin);

        if (!usuario || (senha || '').length < 3) {
            mostrarToast('Usuário/senha inválidos (mín. 4 caracteres).', 'warn');
            return;
        }

        const isAdmin = /Tio|Tia/i.test(usuario);
        usuarioAtual = {
            login: usuario,
            admin: isAdmin,
            timestamp: new Date().toISOString()
        };

        mostrarToast(`🍽️ Bem-vindo(a), ${usuarioAtual.login}!`, 'ok');

        try {
            localStorage.setItem('techtina_usuario', JSON.stringify(usuarioAtual));
        } catch (e) {
            console.warn('Não foi possível salvar no localStorage');
        }

        location.hash = '#secPesquisa';
        atualizarMenuAtivo();
    });
}

// VALIDAÇÃO DE DATAS
function verificarDisponibilidadeData(dataSelecionada) {
    if (!dataSelecionada) return false;

    const data = new Date(dataSelecionada + "T00:00:00");
    if (isNaN(data)) return false;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    if (data < hoje) {
        mostrarToast('Não é possível selecionar datas passadas.', 'warn');
        return false;
    }

    const diaSemana = data.getDay();
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const formato = `${dia}-${mes}`;

    const feriados = [
        '01-01', '21-04', '01-05', '07-09',
        '12-10', '02-11', '15-11', '25-12'
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

// VALIDAÇÃO DE HORÁRIO
function validarHorarioComercial(hora) {
    if (!hora) return false;

    const [horas, minutos] = hora.split(':').map(Number);
    const totalMinutos = horas * 60 + minutos;

    const aberto = totalMinutos >= 7 * 60 && totalMinutos <= 18 * 60;

    if (!aberto) {
        mostrarToast('⏰ Cantina funciona apenas das 7h às 18h.', 'warn');
    }

    return aberto;
}

// PESQUISAR LANCHES
function inicializarPesquisa() {
    const formPesquisa = document.getElementById('formPesquisa');
    if (!formPesquisa) return;

    formPesquisa.addEventListener('submit', (e) => {
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
        if (!validarHorarioComercial(hora)) return;

        ultimoFiltroPesquisa = {
            recurso,
            data,
            hora,
            id: Date.now()
        };

        const quando = new Date(`${data}T${hora}`).toLocaleString('pt-BR');
        mostrarToast(`✅ Disponível: ${recurso} em ${quando}.`, 'ok');
        location.hash = '#secSolicitar';
        atualizarMenuAtivo();
    });
}

// SOLICITAR PEDIDO
function inicializarSolicitacao() {
    const formSolicitar = document.getElementById('formSolicitar');
    if (!formSolicitar) return;

    formSolicitar.addEventListener('submit', (e) => {
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
        if (!justificativa || justificativa.trim().length < 3) {
            mostrarToast('Descreva as observações do pedido (mín. 3 caracteres).', 'warn');
            return;
        }

        const status = usuarioAtual.admin ? 'aprovada' : 'pendente';
        const nova = {
            ...ultimoFiltroPesquisa,
            justificativa: justificativa.trim(),
            status,
            autor: usuarioAtual.login
        };

        reservas.push(nova);
        renderItemReserva(nova);

        mostrarToast(
            status === 'aprovada'
                ? '✅ Pedido aprovado automaticamente! 🍩'
                : '⏳ Pedido enviado para análise.',
            'ok'
        );

        formSolicitar.reset();
        ultimoFiltroPesquisa = null;
        location.hash = '#secHistorico';
        atualizarMenuAtivo();
    });
}

// HISTÓRICO
function renderItemReserva(reserva) {
    const listaReservas = document.getElementById('listaReservas');
    if (!listaReservas) return;

    const li = document.createElement('li');
    li.className = 'item-reserva';
    li.dataset.id = reserva.id;
    li.dataset.status = reserva.status;

    const quando = new Date(`${reserva.data}T${reserva.hora}`).toLocaleString('pt-BR');

    li.innerHTML = `
        <div class="reserva-info">
            <strong>${reserva.recurso}</strong>
            <span class="reserva-data">${quando}</span>
            <span class="reserva-observacao">${reserva.justificativa}</span>
        </div>
        <div class="reserva-status">
            <span class="status ${reserva.status}">
                ${reserva.status === 'aprovada' ? '✅ Aprovada' : '⏳ Pendente'}
            </span>
            <button class="btn-cancelar" aria-label="Cancelar pedido">❌ Cancelar</button>
        </div>
    `;

    const btnCancelar = li.querySelector('.btn-cancelar');
    btnCancelar.addEventListener('click', () => {
        cancelarReserva(reserva.id, li);
    });

    listaReservas.appendChild(li);
}

// CANCELAR RESERVA
function cancelarReserva(id, elemento) {
    const reservaIndex = reservas.findIndex(r => r.id === id);

    if (reservaIndex === -1) {
        mostrarToast('Reserva não encontrada.', 'err');
        return;
    }

    reservas[reservaIndex].status = 'cancelada';
    elemento.dataset.status = 'cancelada';

    const statusElement = elemento.querySelector('.status');
    statusElement.textContent = '❌ Cancelada';
    statusElement.className = 'status cancelada';

    elemento.querySelector('.btn-cancelar').remove();

    mostrarToast('Pedido cancelado com sucesso.', 'warn');
}



// BLOQUEAR DATAS
function bloquearDiasIndisponiveis() {
    const campoData = document.getElementById('campoData');
    if (!campoData) return;

    const hoje = new Date().toISOString().split('T')[0];
    campoData.setAttribute('min', hoje);

    campoData.addEventListener('input', () => {
        const dataSelecionada = campoData.value;
        if (!verificarDisponibilidadeData(dataSelecionada)) {
            campoData.value = '';
        }
    });
}

function verificarDiaAtual() {
    const hoje = new Date();
    const diaSemana = hoje.getDay();
    const feriados = ['01-01', '21-04', '01-05', '07-09', '12-10', '02-11', '15-11', '25-12'];
    const diaMes = `${String(hoje.getDate()).padStart(2, '0')}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

    if (diaSemana === 0 || diaSemana === 6) {
        mostrarToast('⛔ A cantina está fechada hoje (fim de semana).', 'warn');
    } else if (feriados.includes(diaMes)) {
        mostrarToast('🎉 Hoje é feriado! A cantina estará fechada.', 'warn');
    }
}

// RESTAURAR SESSÃO
function restaurarSessao() {
    try {
        const usuarioSalvo = localStorage.getItem('techtina_usuario');
        if (usuarioSalvo) {
            usuarioAtual = JSON.parse(usuarioSalvo);
            mostrarToast(`👋 Bem-vindo de volta, ${usuarioAtual.login}!`, 'ok');
        }
    } catch (e) {
        console.warn('Não foi possível restaurar sessão');
    }
}

// INICIALIZAÇÃO
function inicializarSistema() {
    inicializarValidacaoRapida();
    inicializarLogin();
    inicializarPesquisa();
    inicializarSolicitacao();

    atualizarAvisos();
    bloquearDiasIndisponiveis();
    verificarDiaAtual();
    restaurarSessao();

    atualizarMenuAtivo();
    $toast = document.getElementById('toast');

    window.addEventListener('hashchange', atualizarMenuAtivo);

    setTimeout(() => {
        mostrarToast('Sistema TechTina iniciado com sucesso! 🍊', 'ok');
    }, 1000);
}

// INICIAR SISTEMA
document.addEventListener('DOMContentLoaded', inicializarSistema);