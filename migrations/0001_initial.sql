-- Criação das tabelas para o sistema de tickets

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'tecnico', 'solicitante')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de unidades
CREATE TABLE IF NOT EXISTS units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de setores
CREATE TABLE IF NOT EXISTS sectors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    unit_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
    UNIQUE(name, unit_id)
);

-- Tabela de tickets
CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_name TEXT NOT NULL,
    unit_id INTEGER NOT NULL,
    sector_id INTEGER NOT NULL,
    exact_location TEXT NOT NULL,
    points_quantity INTEGER NOT NULL DEFAULT 1,
    responsible_user TEXT NOT NULL,
    observations TEXT,
    status TEXT NOT NULL CHECK (status IN ('aberto', 'em_andamento', 'aguardando_material', 'concluido')) DEFAULT 'aberto',
    assigned_to INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_by INTEGER NOT NULL,
    FOREIGN KEY (unit_id) REFERENCES units(id),
    FOREIGN KEY (sector_id) REFERENCES sectors(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Tabela de comentários
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabela de anexos
CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    uploaded_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Tabela de histórico de status
CREATE TABLE IF NOT EXISTS status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    ticket_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('novo_ticket', 'comentario', 'mudanca_status', 'atribuicao')),
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

-- Inserir dados iniciais para testes
INSERT INTO users (name, email, password, role) VALUES 
('Admin', 'admin@exemplo.com', '$2a$12$1234567890123456789012uQgOqMHDGOQCQJV.Ow4j9M8/TlIRKkK', 'admin'),
('Técnico', 'tecnico@exemplo.com', '$2a$12$1234567890123456789012uQgOqMHDGOQCQJV.Ow4j9M8/TlIRKkK', 'tecnico'),
('Solicitante', 'solicitante@exemplo.com', '$2a$12$1234567890123456789012uQgOqMHDGOQCQJV.Ow4j9M8/TlIRKkK', 'solicitante');

-- Inserir algumas unidades de exemplo
INSERT INTO units (name) VALUES 
('Matriz'),
('Filial Norte'),
('Filial Sul');

-- Inserir alguns setores de exemplo
INSERT INTO sectors (name, unit_id) VALUES 
('TI', 1),
('RH', 1),
('Financeiro', 1),
('Vendas', 2),
('Suporte', 2),
('Administrativo', 3);
