#!/usr/bin/env python3
"""
Testes de Validação Final - Login e Autenticação
Valida conformidade com STANDARDS.md após SPRINT 1 e SPRINT 2
"""

from playwright.sync_api import sync_playwright
import json
import time
import sys

def test_login_valid_credentials():
    """Teste 1: Login com credenciais válidas"""
    print("\n" + "="*60)
    print("TESTE 1: Login com Credenciais Válidas")
    print("="*60)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        # Capturar logs do console
        console_logs = []
        page.on("console", lambda msg: console_logs.append({
            "type": msg.type,
            "text": msg.text
        }))
        
        try:
            # Acessar página de login
            page.goto('http://localhost:3003/login')
            page.wait_for_load_state('networkidle')
            
            # Preencher formulário
            page.fill('input[type="email"]', '123@123.com')
            page.fill('input[type="password"]', '123123')
            
            # Submeter formulário
            page.click('button[type="submit"]')
            
            # Aguardar redirecionamento
            page.wait_for_url('**/certifications', timeout=10000)
            
            # Verificar token armazenado
            token = page.evaluate('() => localStorage.getItem("auth_token")')
            
            print("✅ PASSOU - Login bem-sucedido")
            print(f"   - Token armazenado: {'Sim' if token else 'Não'}")
            print(f"   - Redirecionado para: {page.url}")
            
            # Verificar logs estruturados
            print("\n📋 Logs Capturados:")
            structured_logs = [log for log in console_logs if any(
                keyword in log['text'] for keyword in ['[INFO]', '[DEBUG]', '[ERROR]', '[WARN]']
            )]
            
            for log in structured_logs[-10:]:  # Últimos 10 logs
                print(f"   {log['text'][:100]}")
            
            # Verificar ausência de dados sensíveis
            sensitive_found = []
            for log in console_logs:
                text = log['text'].lower()
                if '123@123.com' in text:
                    sensitive_found.append('Email encontrado em log')
                if '123123' in text:
                    sensitive_found.append('Senha encontrada em log')
                if token and token[:10] in text:
                    sensitive_found.append('Token JWT encontrado em log')
            
            if sensitive_found:
                print("\n⚠️  AVISO - Dados sensíveis encontrados nos logs:")
                for item in sensitive_found:
                    print(f"   - {item}")
                return False
            else:
                print("\n✅ Nenhum dado sensível encontrado nos logs")
            
            return True
            
        except Exception as e:
            print(f"❌ FALHOU - {str(e)}")
            return False
        finally:
            browser.close()


def test_login_invalid_credentials():
    """Teste 2: Login com credenciais inválidas"""
    print("\n" + "="*60)
    print("TESTE 2: Login com Credenciais Inválidas")
    print("="*60)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        # Capturar logs do console
        console_logs = []
        page.on("console", lambda msg: console_logs.append({
            "type": msg.type,
            "text": msg.text
        }))
        
        try:
            # Acessar página de login
            page.goto('http://localhost:3003/login')
            page.wait_for_load_state('networkidle')
            
            # Preencher com credenciais inválidas
            page.fill('input[type="email"]', 'invalid@test.com')
            page.fill('input[type="password"]', 'wrong')
            
            # Submeter formulário
            page.click('button[type="submit"]')
            
            # Aguardar mensagem de erro
            page.wait_for_selector('.MuiAlert-root', timeout=5000)
            
            # Verificar que não houve redirecionamento
            current_url = page.url
            
            # Verificar que não há token
            token = page.evaluate('() => localStorage.getItem("auth_token")')
            
            print("✅ PASSOU - Erro tratado corretamente")
            print(f"   - Permaneceu em: {current_url}")
            print(f"   - Token armazenado: {'Sim' if token else 'Não'}")
            
            # Verificar logs de erro estruturados
            error_logs = [log for log in console_logs if '[ERROR]' in log['text']]
            print(f"\n📋 Logs de Erro Capturados: {len(error_logs)}")
            for log in error_logs[-3:]:
                print(f"   {log['text'][:100]}")
            
            return True
            
        except Exception as e:
            print(f"❌ FALHOU - {str(e)}")
            return False
        finally:
            browser.close()


def test_expired_token():
    """Teste 3: Validação de token expirado"""
    print("\n" + "="*60)
    print("TESTE 3: Validação de Token Expirado")
    print("="*60)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        # Capturar logs do console
        console_logs = []
        page.on("console", lambda msg: console_logs.append({
            "type": msg.type,
            "text": msg.text
        }))
        
        try:
            # Criar token expirado (exp no passado)
            expired_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0IiwiZXhwIjoxNjAwMDAwMDAwfQ.test"
            
            # Acessar página e injetar token expirado
            page.goto('http://localhost:3003/login')
            page.wait_for_load_state('networkidle')
            
            page.evaluate(f'() => localStorage.setItem("auth_token", "{expired_token}")')
            
            # Tentar acessar rota protegida
            page.goto('http://localhost:3003/certifications')
            page.wait_for_load_state('networkidle')
            
            # Verificar redirecionamento para login
            current_url = page.url
            
            # Verificar que token foi removido
            token = page.evaluate('() => localStorage.getItem("auth_token")')
            
            if '/login' in current_url and not token:
                print("✅ PASSOU - Token expirado detectado")
                print(f"   - Redirecionado para: {current_url}")
                print(f"   - Token removido: Sim")
                
                # Verificar log específico
                expired_logs = [log for log in console_logs if 'expired' in log['text'].lower()]
                print(f"\n📋 Logs de Token Expirado: {len(expired_logs)}")
                for log in expired_logs:
                    print(f"   {log['text'][:100]}")
                
                return True
            else:
                print(f"❌ FALHOU - Token expirado não foi tratado corretamente")
                print(f"   - URL atual: {current_url}")
                print(f"   - Token ainda existe: {bool(token)}")
                return False
            
        except Exception as e:
            print(f"❌ FALHOU - {str(e)}")
            return False
        finally:
            browser.close()


def test_invalid_token():
    """Teste 4: Validação de token inválido"""
    print("\n" + "="*60)
    print("TESTE 4: Validação de Token Inválido")
    print("="*60)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        # Capturar logs do console
        console_logs = []
        page.on("console", lambda msg: console_logs.append({
            "type": msg.type,
            "text": msg.text
        }))
        
        try:
            # Token inválido (malformado)
            invalid_token = "invalid.token.here"
            
            # Acessar página e injetar token inválido
            page.goto('http://localhost:3003/login')
            page.wait_for_load_state('networkidle')
            
            page.evaluate(f'() => localStorage.setItem("auth_token", "{invalid_token}")')
            
            # Tentar acessar rota protegida
            page.goto('http://localhost:3003/certifications')
            page.wait_for_load_state('networkidle')
            
            # Verificar redirecionamento para login
            current_url = page.url
            
            # Verificar que token foi removido
            token = page.evaluate('() => localStorage.getItem("auth_token")')
            
            if '/login' in current_url and not token:
                print("✅ PASSOU - Token inválido detectado")
                print(f"   - Redirecionado para: {current_url}")
                print(f"   - Token removido: Sim")
                
                # Verificar log específico
                invalid_logs = [log for log in console_logs if 'invalid' in log['text'].lower()]
                print(f"\n📋 Logs de Token Inválido: {len(invalid_logs)}")
                for log in invalid_logs:
                    print(f"   {log['text'][:100]}")
                
                return True
            else:
                print(f"❌ FALHOU - Token inválido não foi tratado corretamente")
                print(f"   - URL atual: {current_url}")
                print(f"   - Token ainda existe: {bool(token)}")
                return False
            
        except Exception as e:
            print(f"❌ FALHOU - {str(e)}")
            return False
        finally:
            browser.close()


def main():
    """Executar todos os testes"""
    print("\n" + "="*60)
    print("TESTES DE VALIDAÇÃO FINAL - CONFORMIDADE STANDARDS.md")
    print("="*60)
    
    results = {
        "Teste 1 - Login Válido": test_login_valid_credentials(),
        "Teste 2 - Login Inválido": test_login_invalid_credentials(),
        "Teste 3 - Token Expirado": test_expired_token(),
        "Teste 4 - Token Inválido": test_invalid_token(),
    }
    
    # Resumo
    print("\n" + "="*60)
    print("RESUMO DOS TESTES")
    print("="*60)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASSOU" if result else "❌ FALHOU"
        print(f"{status} - {test_name}")
    
    print(f"\nResultado: {passed}/{total} testes passaram")
    
    if passed == total:
        print("\n🎉 TODOS OS TESTES PASSARAM!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} teste(s) falharam")
        return 1


if __name__ == "__main__":
    sys.exit(main())
