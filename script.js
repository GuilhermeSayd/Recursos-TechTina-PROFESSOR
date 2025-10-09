// script.js - Sistema TechTina 🍊

// --- UTILITÁRIOS --- //
function obterDataHoraAtual() {
  const agora = new Date();
  const data = agora.toLocaleDateString("pt-BR");
  const hora = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return { data, hora };
}

function salvarNoStorage(chave, dados) {
  localStorage.setItem(chave, JSON.stringify(dados));
}

function carregarDoStorage(chave) {
  const dados = localStorage.getItem(chave);
  return dados ? JSON.parse(dados) : [];
}

// --- CADASTRO DE USUÁRIO --- //
const formCadastro = document.getElementById("formCadastro");

if (formCadastro) {
  formCadastro.addEventListener("submit", (e) => {
    e.preventDefault();

    const nome = document.getElementById("nomeUsuario").value.trim();
    const email = document.getElementById("emailUsuario").value.trim();

    if (!nome || !email) {
      alert("Por favor, preencha todos os campos do cadastro.");
      return;
    }

    const usuarios = carregarDoStorage("usuarios");
    const novoUsuario = { id: Date.now(), nome, email };
    usuarios.push(novoUsuario);
    salvarNoStorage("usuarios", usuarios);

    alert(`Cadastro realizado com sucesso, ${nome}!`);
    formCadastro.reset();
  });
}

// --- PEDIDOS --- //
const formPedido = document.getElementById("formPedido");

if (formPedido) {
  formPedido.addEventListener("submit", (e) => {
    e.preventDefault();

    const nomeCliente = document.getElementById("nomeCliente").value.trim();
    const produto = document.getElementById("produto").value;
    const quantidade = document.getElementById("quantidade").value;

    if (!nomeCliente || !produto || !quantidade) {
      alert("Por favor, preencha todos os campos do pedido.");
      return;
    }

    const { data, hora } = obterDataHoraAtual();

    const pedidos = carregarDoStorage("pedidos");
    const novoPedido = {
      id: Date.now(),
      cliente: nomeCliente,
      produto,
      quantidade,
      data,
      hora,
    };

    pedidos.push(novoPedido);
    salvarNoStorage("pedidos", pedidos);

    alert(`🍔 Pedido de ${quantidade} ${produto}(s) registrado com sucesso às ${hora} (${data}).`);
    formPedido.reset();
    exibirPedidos();
  });
}

// --- EXIBIÇÃO DOS PEDIDOS --- //
const listaPedidos = document.getElementById("listaPedidos");

function exibirPedidos() {
  if (!listaPedidos) return;

  const pedidos = carregarDoStorage("pedidos");
  listaPedidos.innerHTML = "";

  if (pedidos.length === 0) {
    listaPedidos.innerHTML = "<p>Nenhum pedido registrado ainda.</p>";
    return;
  }

  pedidos.forEach((pedido) => {
    const item = document.createElement("div");
    item.classList.add("pedido-item");
    item.innerHTML = `
      <strong>${pedido.cliente}</strong> pediu 
      <em>${pedido.quantidade} ${pedido.produto}(s)</em> 
      em ${pedido.data}, às ${pedido.hora}.
    `;
    listaPedidos.appendChild(item);
  });
}

// --- LIMPAR REGISTROS --- //
const btnLimpar = document.getElementById("limparPedidos");

if (btnLimpar) {
  btnLimpar.addEventListener("click", () => {
    if (confirm("Tem certeza que deseja apagar todos os pedidos?")) {
      localStorage.removeItem("pedidos");
      exibirPedidos();
    }
  });
}

// --- INICIALIZAÇÃO --- //
document.addEventListener("DOMContentLoaded", exibirPedidos);
