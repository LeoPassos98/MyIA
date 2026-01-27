#!/bin/bash

# Script de instalação rápida do Docker
# Para Ubuntu/Debian

set -e

echo "🐳 Instalação do Docker para MyIA Observability Stack"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar se já está instalado
if command -v docker &> /dev/null; then
    echo "✅ Docker já está instalado!"
    docker --version
    echo ""
    echo "Verificando Docker Compose..."
    if docker compose version &> /dev/null; then
        echo "✅ Docker Compose já está instalado!"
        docker compose version
        echo ""
        echo "🎉 Tudo pronto! Execute ./start.sh para iniciar o stack."
        exit 0
    fi
fi

# Detectar distribuição
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "❌ Não foi possível detectar a distribuição Linux."
    exit 1
fi

echo "📋 Sistema detectado: $OS"
echo ""

case $OS in
    ubuntu|debian|pop)
        echo "🔧 Instalando Docker para Ubuntu/Debian..."
        echo ""
        
        # Atualizar pacotes
        echo "1️⃣ Atualizando pacotes..."
        sudo apt update
        
        # Instalar dependências
        echo ""
        echo "2️⃣ Instalando dependências..."
        sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
        
        # Adicionar chave GPG
        echo ""
        echo "3️⃣ Adicionando chave GPG do Docker..."
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        
        # Adicionar repositório
        echo ""
        echo "4️⃣ Adicionando repositório do Docker..."
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        # Instalar Docker
        echo ""
        echo "5️⃣ Instalando Docker..."
        sudo apt update
        sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
        ;;
        
    fedora|rhel|centos)
        echo "🔧 Instalando Docker para Fedora/RHEL/CentOS..."
        echo ""
        
        sudo dnf -y install dnf-plugins-core
        sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
        sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
        
        # Iniciar Docker
        sudo systemctl start docker
        sudo systemctl enable docker
        ;;
        
    arch|manjaro)
        echo "🔧 Instalando Docker para Arch Linux..."
        echo ""
        
        sudo pacman -S --noconfirm docker docker-compose
        
        # Iniciar Docker
        sudo systemctl start docker
        sudo systemctl enable docker
        ;;
        
    *)
        echo "❌ Distribuição não suportada: $OS"
        echo ""
        echo "Por favor, instale o Docker manualmente:"
        echo "https://docs.docker.com/engine/install/"
        exit 1
        ;;
esac

# Adicionar usuário ao grupo docker
echo ""
echo "6️⃣ Adicionando usuário ao grupo docker..."
sudo usermod -aG docker $USER

# Verificar instalação
echo ""
echo "7️⃣ Verificando instalação..."
docker --version
docker compose version

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Docker instalado com sucesso!"
echo ""
echo "⚠️  IMPORTANTE: Você precisa fazer logout/login ou executar:"
echo "   newgrp docker"
echo ""
echo "Depois, execute:"
echo "   ./start.sh"
echo ""
echo "🎉 Pronto para usar o MyIA Observability Stack!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
