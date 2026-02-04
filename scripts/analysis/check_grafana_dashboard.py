#!/usr/bin/env python3
"""
Script para verificar o dashboard Grafana e capturar screenshots dos erros
"""
from playwright.sync_api import sync_playwright
import time
import json
import os

def check_grafana_dashboard():
    # Criar diretório para outputs se não existir
    output_dir = '/home/leonardo/Documents/VSCODE/MyIA/grafana_check_output'
    os.makedirs(output_dir, exist_ok=True)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()
        
        # Configurar captura de logs do console
        console_logs = []
        page.on("console", lambda msg: console_logs.append({
            "type": msg.type,
            "text": msg.text
        }))
        
        try:
            print("🔍 Acessando Grafana...")
            page.goto('http://localhost:3002/login', wait_until='domcontentloaded', timeout=30000)
            
            # Aguardar formulário de login
            print("⏳ Aguardando formulário de login...")
            time.sleep(2)
            
            # Capturar screenshot da página de login
            page.screenshot(path=f'{output_dir}/01_login_page.png')
            print("📸 Screenshot da página de login capturada")
            
            # Fazer login com seletores mais robustos
            print("🔐 Fazendo login no Grafana...")
            
            # Tentar diferentes seletores para o campo de email
            email_selectors = [
                'input[name="user"]',
                'input[type="text"]',
                'input[placeholder*="email"]',
                'input[placeholder*="username"]'
            ]
            
            email_filled = False
            for selector in email_selectors:
                try:
                    if page.locator(selector).count() > 0:
                        page.fill(selector, '123@123.com')
                        print(f"✅ Email preenchido usando seletor: {selector}")
                        email_filled = True
                        break
                except:
                    continue
            
            if not email_filled:
                print("❌ Não foi possível preencher o campo de email")
                page.screenshot(path=f'{output_dir}/error_email_field.png')
            
            # Tentar diferentes seletores para o campo de senha
            password_selectors = [
                'input[name="password"]',
                'input[type="password"]',
                'input[placeholder*="password"]'
            ]
            
            password_filled = False
            for selector in password_selectors:
                try:
                    if page.locator(selector).count() > 0:
                        page.fill(selector, '123123')
                        print(f"✅ Senha preenchida usando seletor: {selector}")
                        password_filled = True
                        break
                except:
                    continue
            
            if not password_filled:
                print("❌ Não foi possível preencher o campo de senha")
                page.screenshot(path=f'{output_dir}/error_password_field.png')
            
            # Capturar screenshot antes de clicar
            page.screenshot(path=f'{output_dir}/02_before_login.png')
            
            # Clicar no botão de login
            login_button_selectors = [
                'button[type="submit"]',
                'button:has-text("Log in")',
                'button:has-text("Login")',
                'button.submit-button'
            ]
            
            login_clicked = False
            for selector in login_button_selectors:
                try:
                    if page.locator(selector).count() > 0:
                        page.click(selector)
                        print(f"✅ Botão de login clicado usando seletor: {selector}")
                        login_clicked = True
                        break
                except:
                    continue
            
            if not login_clicked:
                print("❌ Não foi possível clicar no botão de login")
                page.screenshot(path=f'{output_dir}/error_login_button.png')
            
            # Aguardar navegação após login
            print("⏳ Aguardando navegação após login...")
            time.sleep(5)
            
            # Capturar screenshot após login
            page.screenshot(path=f'{output_dir}/03_after_login.png')
            print("📸 Screenshot após login capturada")
            
            # Verificar se ainda está na página de login
            current_url = page.url
            print(f"📍 URL atual: {current_url}")
            
            if 'login' in current_url:
                print("⚠️ Ainda na página de login, tentando acesso direto ao dashboard...")
            
            # Tentar acessar o dashboard diretamente
            print("🔍 Acessando dashboard de erros...")
            page.goto('http://localhost:3002/d/myia-errors/myia-errors?orgId=1&refresh=10s&viewPanel=8', 
                     wait_until='domcontentloaded', timeout=30000)
            
            # Aguardar carregamento completo do dashboard
            print("⏳ Aguardando carregamento do dashboard...")
            time.sleep(10)
            
            # Capturar screenshot da página completa
            print("📸 Capturando screenshot da página completa...")
            page.screenshot(path=f'{output_dir}/04_dashboard_full.png', full_page=True)
            
            # Tentar capturar o painel específico de erros
            print("📸 Capturando screenshot do painel de erros...")
            page.screenshot(path=f'{output_dir}/05_errors_panel.png')
            
            # Tentar extrair informações do DOM
            print("🔍 Extraindo informações do DOM...")
            
            # Verificar se há elementos de erro visíveis
            error_elements = page.locator('[class*="error"]').all()
            print(f"✅ Encontrados {len(error_elements)} elementos com 'error' no DOM")
            
            # Verificar se há tabelas ou gráficos
            tables = page.locator('table').all()
            print(f"✅ Encontradas {len(tables)} tabelas no dashboard")
            
            # Verificar painéis Grafana
            panels = page.locator('[class*="panel"]').all()
            print(f"✅ Encontrados {len(panels)} painéis Grafana")
            
            # Tentar extrair texto visível da página
            page_text = page.inner_text('body')
            
            # Salvar texto da página para análise
            with open(f'{output_dir}/grafana_page_text.txt', 'w', encoding='utf-8') as f:
                f.write(page_text)
            print(f"✅ Texto da página salvo em {output_dir}/grafana_page_text.txt")
            
            # Salvar logs do console
            with open(f'{output_dir}/grafana_console_logs.json', 'w', encoding='utf-8') as f:
                json.dump(console_logs, f, indent=2)
            print(f"✅ {len(console_logs)} logs do console salvos em {output_dir}/grafana_console_logs.json")
            
            # Aguardar mais um pouco para garantir que dados foram carregados
            time.sleep(5)
            
            # Capturar screenshot final
            print("📸 Capturando screenshot final...")
            page.screenshot(path=f'{output_dir}/06_final.png', full_page=True)
            
            print("\n✅ Verificação concluída com sucesso!")
            print(f"\n📁 Arquivos gerados em {output_dir}:")
            print("   - 01_login_page.png")
            print("   - 02_before_login.png")
            print("   - 03_after_login.png")
            print("   - 04_dashboard_full.png")
            print("   - 05_errors_panel.png")
            print("   - 06_final.png")
            print("   - grafana_page_text.txt")
            print("   - grafana_console_logs.json")
            
        except Exception as e:
            print(f"❌ Erro ao acessar dashboard: {e}")
            # Tentar capturar screenshot mesmo com erro
            try:
                page.screenshot(path=f'{output_dir}/error_screenshot.png', full_page=True)
                print(f"📸 Screenshot de erro salvo em {output_dir}/error_screenshot.png")
            except:
                pass
            raise
        finally:
            browser.close()

if __name__ == "__main__":
    check_grafana_dashboard()
