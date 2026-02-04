#!/usr/bin/env bash
# scripts/common/colors.sh
# LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md

# Cores ANSI
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export CYAN='\033[0;36m'
export WHITE='\033[1;37m'
export GRAY='\033[0;90m'
export NC='\033[0m' # No Color

# Ícones Unicode
export CHECK_MARK="${GREEN}✓${NC}"
export CROSS_MARK="${RED}✗${NC}"
export WARNING_ICON="${YELLOW}⚠${NC}"
export INFO_ICON="${CYAN}ℹ${NC}"
export ROCKET="${BLUE}🚀${NC}"
