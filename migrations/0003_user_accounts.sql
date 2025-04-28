-- Atualizar senhas para contas iniciais com valores mais seguros
-- Usando bcrypt para hash de senhas

-- Senha para admin: Admin@2025
UPDATE users SET password = '$2a$12$h8KIbYXC9HmrjGfR5XhkAOcNvCxV.ZJvZQzwQJnIbQNcGUgvO7yPe' WHERE email = 'admin@exemplo.com';

-- Senha para técnico: Tecnico@2025
UPDATE users SET password = '$2a$12$9Krz.Qeh1K5hPUfBYnwO6.ZQgFMPQSVQ5XKbPCYfPzUlD5xNMWIlO' WHERE email = 'tecnico@exemplo.com';

-- Senha para solicitante: Solicitante@2025
UPDATE users SET password = '$2a$12$mJ.5QyV6RHN0YhCKsR5vxuJL.MZpPNxw0XMgRH4KRuGDJCG2VcTHC' WHERE email = 'solicitante@exemplo.com';

-- Adicionar mais usuários para demonstração
INSERT INTO users (name, email, password, role) VALUES 
('Administrador', 'administrador@primeip.com.br', '$2a$12$h8KIbYXC9HmrjGfR5XhkAOcNvCxV.ZJvZQzwQJnIbQNcGUgvO7yPe', 'admin'),
('Técnico 1', 'tecnico1@primeip.com.br', '$2a$12$9Krz.Qeh1K5hPUfBYnwO6.ZQgFMPQSVQ5XKbPCYfPzUlD5xNMWIlO', 'tecnico'),
('Técnico 2', 'tecnico2@primeip.com.br', '$2a$12$9Krz.Qeh1K5hPUfBYnwO6.ZQgFMPQSVQ5XKbPCYfPzUlD5xNMWIlO', 'tecnico'),
('Solicitante 1', 'solicitante1@primeip.com.br', '$2a$12$mJ.5QyV6RHN0YhCKsR5vxuJL.MZpPNxw0XMgRH4KRuGDJCG2VcTHC', 'solicitante'),
('Solicitante 2', 'solicitante2@primeip.com.br', '$2a$12$mJ.5QyV6RHN0YhCKsR5vxuJL.MZpPNxw0XMgRH4KRuGDJCG2VcTHC', 'solicitante');
