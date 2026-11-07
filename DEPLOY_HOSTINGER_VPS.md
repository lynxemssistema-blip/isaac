# Guia de Deploy do Backend "Hermes" na VPS Ubuntu (Hostinger)

Este guia cobre todo o processo para colocar o Backend Orquestrador **Hermes** online 24 horas por dia em uma VPS Ubuntu da Hostinger utilizando **PM2**, configurando **Nginx** como Proxy Reverso com **SSL gratuito (Certbot)** e conectando o Frontend React (Vite).

---

## 1. Acesso à VPS e Preparação do Ambiente

Acesse a VPS via terminal SSH:

```bash
ssh root@SEU_IP_VPS
```

Atualize os pacotes do sistema operacional:

```bash
apt update && apt upgrade -y
```

### Instalar Node.js 20 LTS e Git

```bash
# Instala utilitários essenciais
apt install -y curl git ufw

# Adiciona o repositório do Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verifique as versões instaladas
node -v
npm -v
```

### Instalar o Gerenciador de Processos PM2 globalmente

```bash
npm install -g pm2
```

---

## 2. Transferência e Configuração do Backend Hermes

Crie o diretório da aplicação e clone ou envie os arquivos do backend:

```bash
mkdir -p /var/www/isaac-backend
cd /var/www/isaac-backend
```

Você pode clonar via Git ou enviar via SCP/SFTP. Exemplo com Git:
```bash
git clone https://github.com/seu-usuario/seu-repositorio.git .
cd backend
```

Instale as dependências de produção:

```bash
npm install --omit=dev
```

Crie e preencha o arquivo de variáveis de ambiente `.env`:

```bash
nano .env
```

Cole suas credenciais reais:

```env
PORT=3001
NODE_ENV=production
CORS_ORIGIN=*

# Gemini API
GEMINI_API_KEY=sua_chave_real_do_gemini
GEMINI_CHAT_MODEL=gemini-1.5-flash
GEMINI_EMBEDDING_MODEL=text-embedding-004

# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_secreta
```

Pressione `Ctrl + O`, depois `Enter` para salvar e `Ctrl + X` para sair.

---

## 3. Inicialização e Persistência 24/7 com PM2

Inicie a aplicação utilizando o PM2:

```bash
pm2 start src/server.js --name "isaac-api"
```

Configure o PM2 para reiniciar o serviço automaticamente caso a VPS reinicie:

```bash
pm2 save
pm2 startup
```

> Copie e execute o comando gerado pelo `pm2 startup` (se solicitado no terminal).

### Comandos Úteis do PM2:
- Ver logs em tempo real: `pm2 logs isaac-api`
- Status dos processos: `pm2 status`
- Reiniciar o servidor: `pm2 restart isaac-api`
- Parar o servidor: `pm2 stop isaac-api`

---

## 4. Configuração do Nginx (Proxy Reverso) e Domínio

Instale o servidor web Nginx:

```bash
apt install -y nginx
```

Crie um arquivo de configuração para o Hermes:

```bash
nano /etc/nginx/sites-available/hermes
```

Adicione a seguinte configuração (substitua `api.seudominio.com` pelo seu subdomínio ou deixe o IP se não tiver domínio ainda):

```nginx
server {
    listen 80;
    server_name api.seudominio.com; # ou SEU_IP_VPS

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ative o site e teste o Nginx:

```bash
ln -s /etc/nginx/sites-available/hermes /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Configurar Certificado SSL Gratuito (HTTPS com Certbot)
Caso você tenha apontado um domínio/subdomínio DNS do tipo A para o IP da sua VPS:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d api.seudominio.com
```

---

## 5. Configurar o Firewall (UFW)

Garanta que apenas as portas essenciais estejam abertas:

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
# Se não usar Nginx e quiser acessar direto a porta 3001:
# ufw allow 3001
ufw enable
```

---

## 6. Apontando o Frontend (Vite) para o Backend

No seu projeto Frontend em React (Vite):

1. Abra o arquivo `.env.production` (ou `.env`):
```env
# Se configurou com domínio e SSL:
VITE_BACKEND_URL=https://api.seudominio.com

# Se estiver usando diretamente o IP e a porta:
# VITE_BACKEND_URL=http://SEU_IP_VPS:3001
```

2. Gere o build de produção do React:
```bash
npm run build
```

3. O frontend agora enviará todas as conversas para o Backend Hermes na VPS. O Hermes:
   - Gerará o vetor da mensagem com Gemini `text-embedding-004`;
   - Buscará no Supabase `pgvector` as memórias do usuário;
   - Injetará no Prompt e responderá ao frontend;
   - Salvará novos bloqueios e padrões em background.
