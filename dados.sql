-- Arquivo: database_techtina.sql
CREATE DATABASE techtina;
USE techtina;

-- Tabela de usuários
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    tipo ENUM('cliente', 'funcionario', 'admin') DEFAULT 'cliente',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de cardápio
CREATE TABLE cardapio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    preco DECIMAL(8,2) NOT NULL,
    categoria VARCHAR(50),
    estoque INT DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    imagem VARCHAR(255)
);

-- Tabela de pedidos
CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    item_id INT,
    quantidade INT DEFAULT 1,
    observacoes TEXT,
    data_pedido DATE NOT NULL,
    hora_pedido TIME NOT NULL,
    status ENUM('pendente', 'aprovado', 'preparando', 'pronto', 'entregue', 'cancelado') DEFAULT 'pendente',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (item_id) REFERENCES cardapio(id)
);

-- Dados iniciais
INSERT INTO cardapio (nome, descricao, preco, categoria, estoque) VALUES
('Pão de Queijo', 'Pão de queijo fresquinho', 3.50, 'salgado', 50),
('Coxinha', 'Coxinha de frango', 4.00, 'salgado', 30),
('Sanduíche Natural', 'Presunto, queijo e verdura', 8.50, 'sanduiche', 20),
('Suco de Laranja', 'Suco natural 300ml', 5.00, 'bebida', 40),
('Guaraná', 'Lata 350ml', 4.50, 'bebida', 25);