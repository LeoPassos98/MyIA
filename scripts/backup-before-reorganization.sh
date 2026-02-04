#!/bin/bash
# scripts/backup-before-reorganization.sh
# Backup completo antes da reorganização de scripts

BACKUP_DIR="backups/scripts-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📦 Criando backup em $BACKUP_DIR..."

# Backup da raiz
cp -r *.sh *.exp *.py "$BACKUP_DIR/" 2>/dev/null || true

# Backup do backend
mkdir -p "$BACKUP_DIR/backend"
cp -r backend/*.sh backend/*.mjs backend/*.ts "$BACKUP_DIR/backend/" 2>/dev/null || true
cp -r backend/scripts "$BACKUP_DIR/backend/" 2>/dev/null || true

# Backup do observability
mkdir -p "$BACKUP_DIR/observability"
cp -r observability/*.sh "$BACKUP_DIR/observability/" 2>/dev/null || true

# Backup do tests
mkdir -p "$BACKUP_DIR/tests"
cp -r tests/scripts "$BACKUP_DIR/tests/" 2>/dev/null || true

echo "✅ Backup completo criado em $BACKUP_DIR"
echo "📝 Para restaurar: cp -r $BACKUP_DIR/* ."
