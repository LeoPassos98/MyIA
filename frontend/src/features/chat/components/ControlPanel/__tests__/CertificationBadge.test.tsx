/**
 * Testes unitários para CertificationBadge
 * 
 * Testa o comportamento do componente de badge de certificação:
 * - Renderização correta para cada status
 * - Cores e ícones apropriados
 * - Tooltips informativos
 * - Interação com onClick
 * - CertificationBadgeGroup
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CertificationBadge, CertificationBadgeGroup } from '../CertificationBadge';

describe('CertificationBadge', () => {
  describe('Status: certified', () => {
    it('renderiza badge verde para modelo certificado', () => {
      render(<CertificationBadge status="certified" />);
      
      const badge = screen.getByText('Certificado');
      expect(badge).toBeInTheDocument();
    });

    it('mostra taxa de sucesso quando fornecida', () => {
      render(<CertificationBadge status="certified" successRate={98} />);
      
      const badge = screen.getByText('Certificado (98%)');
      expect(badge).toBeInTheDocument();
    });

    it('mostra tooltip com informações corretas', async () => {
      const user = userEvent.setup();
      const lastChecked = '2026-01-20T10:00:00Z';
      
      render(
        <CertificationBadge 
          status="certified" 
          lastChecked={lastChecked}
          successRate={98}
        />
      );
      
      const badge = screen.getByText('Certificado (98%)');
      await user.hover(badge);
      
      // Tooltip deve aparecer (verificar texto)
      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent('Taxa de sucesso: 98%');
    });

    it('mostra tooltip padrão quando não há lastChecked', async () => {
      const user = userEvent.setup();
      
      render(<CertificationBadge status="certified" />);
      
      const badge = screen.getByText('Certificado');
      await user.hover(badge);
      
      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent('Modelo certificado e funcionando corretamente');
    });
  });

  describe('Status: quality_warning', () => {
    it('renderiza badge amarelo para warning de qualidade', () => {
      render(<CertificationBadge status="quality_warning" successRate={75} />);
      
      const badge = screen.getByText('Aviso de Qualidade');
      expect(badge).toBeInTheDocument();
    });

    it('mostra categoria de erro no tooltip', async () => {
      const user = userEvent.setup();
      
      render(
        <CertificationBadge 
          status="quality_warning" 
          errorCategory="QUALITY_ISSUE"
          successRate={75}
        />
      );
      
      const badge = screen.getByText('Aviso de Qualidade');
      await user.hover(badge);
      
      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent('Problema de Qualidade');
      expect(tooltip).toHaveTextContent('Taxa de sucesso: 75%');
    });

    it('mostra tooltip padrão quando não há errorCategory', async () => {
      const user = userEvent.setup();
      
      render(
        <CertificationBadge 
          status="quality_warning" 
          successRate={60}
        />
      );
      
      const badge = screen.getByText('Aviso de Qualidade');
      await user.hover(badge);
      
      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent('Taxa de sucesso abaixo do esperado: 60%');
    });
  });

  describe('Status: failed', () => {
    it('renderiza badge vermelho para modelo falhado', () => {
      render(<CertificationBadge status="failed" />);
      
      const badge = screen.getByText('Indisponível');
      expect(badge).toBeInTheDocument();
    });

    it('mostra categoria de erro no tooltip', async () => {
      const user = userEvent.setup();
      
      render(
        <CertificationBadge 
          status="failed" 
          errorCategory="UNAVAILABLE"
        />
      );
      
      const badge = screen.getByText('Indisponível');
      await user.hover(badge);
      
      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent('Modelo Indisponível');
    });
  });

  describe('Status: configuration_required', () => {
    it('renderiza badge vermelho com label correto', () => {
      render(<CertificationBadge status="configuration_required" />);
      
      const badge = screen.getByText('Configuração Necessária');
      expect(badge).toBeInTheDocument();
    });

    it('mostra tooltip apropriado', async () => {
      const user = userEvent.setup();
      
      render(
        <CertificationBadge 
          status="configuration_required" 
          errorCategory="CONFIGURATION_ERROR"
        />
      );
      
      const badge = screen.getByText('Configuração Necessária');
      await user.hover(badge);
      
      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent('Erro de Configuração');
    });
  });

  describe('Status: permission_required', () => {
    it('renderiza badge vermelho com label correto', () => {
      render(<CertificationBadge status="permission_required" />);
      
      const badge = screen.getByText('Permissão Necessária');
      expect(badge).toBeInTheDocument();
    });

    it('mostra tooltip apropriado', async () => {
      const user = userEvent.setup();
      
      render(
        <CertificationBadge 
          status="permission_required" 
          errorCategory="PERMISSION_ERROR"
        />
      );
      
      const badge = screen.getByText('Permissão Necessária');
      await user.hover(badge);
      
      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent('Erro de Permissão');
    });
  });

  describe('Status: not_tested', () => {
    it('renderiza badge cinza para modelo não testado', () => {
      render(<CertificationBadge status="not_tested" />);
      
      const badge = screen.getByText('Não Testado');
      expect(badge).toBeInTheDocument();
    });

    it('mostra tooltip incentivando certificação', async () => {
      const user = userEvent.setup();
      
      render(<CertificationBadge status="not_tested" />);
      
      const badge = screen.getByText('Não Testado');
      await user.hover(badge);
      
      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent('Este modelo ainda não foi certificado');
      expect(tooltip).toHaveTextContent('Clique para certificar');
    });
  });

  describe('Interação com onClick', () => {
    it('chama onClick quando badge é clicado', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(
        <CertificationBadge 
          status="certified" 
          onClick={handleClick}
        />
      );
      
      const badge = screen.getByText('Certificado');
      await user.click(badge);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('não chama onClick quando não fornecido', async () => {
      const user = userEvent.setup();
      
      render(<CertificationBadge status="certified" />);
      
      const badge = screen.getByText('Certificado');
      
      // Não deve lançar erro ao clicar
      await user.click(badge);
    });

    it('aplica cursor pointer quando onClick está presente', () => {
      const handleClick = vi.fn();
      
      const { container } = render(
        <CertificationBadge 
          status="certified" 
          onClick={handleClick}
        />
      );
      
      const chip = container.querySelector('.MuiChip-root');
      expect(chip).toHaveStyle({ cursor: 'pointer' });
    });

    it('aplica cursor default quando onClick não está presente', () => {
      const { container } = render(
        <CertificationBadge status="certified" />
      );
      
      const chip = container.querySelector('.MuiChip-root');
      expect(chip).toHaveStyle({ cursor: 'default' });
    });
  });

  describe('Tamanhos', () => {
    it('renderiza com tamanho small por padrão', () => {
      const { container } = render(<CertificationBadge status="certified" />);
      
      const chip = container.querySelector('.MuiChip-sizeSmall');
      expect(chip).toBeInTheDocument();
    });

    it('renderiza com tamanho medium quando especificado', () => {
      const { container } = render(
        <CertificationBadge status="certified" size="medium" />
      );
      
      const chip = container.querySelector('.MuiChip-sizeMedium');
      expect(chip).toBeInTheDocument();
    });
  });

  describe('Formatação de categorias de erro', () => {
    const errorCategories: Array<{
      category: 'UNAVAILABLE' | 'PERMISSION_ERROR' | 'AUTHENTICATION_ERROR' | 'RATE_LIMIT' | 'TIMEOUT' | 'CONFIGURATION_ERROR' | 'QUALITY_ISSUE' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';
      expected: string;
    }> = [
      { category: 'UNAVAILABLE', expected: 'Modelo Indisponível' },
      { category: 'PERMISSION_ERROR', expected: 'Erro de Permissão' },
      { category: 'AUTHENTICATION_ERROR', expected: 'Erro de Autenticação' },
      { category: 'RATE_LIMIT', expected: 'Limite de Taxa Excedido' },
      { category: 'TIMEOUT', expected: 'Tempo Esgotado' },
      { category: 'CONFIGURATION_ERROR', expected: 'Erro de Configuração' },
      { category: 'QUALITY_ISSUE', expected: 'Problema de Qualidade' },
      { category: 'NETWORK_ERROR', expected: 'Erro de Rede' },
      { category: 'UNKNOWN_ERROR', expected: 'Erro Desconhecido' },
    ];

    errorCategories.forEach(({ category, expected }) => {
      it(`formata ${category} corretamente`, async () => {
        const user = userEvent.setup();
        
        render(
          <CertificationBadge 
            status="failed" 
            errorCategory={category}
          />
        );
        
        const badge = screen.getByText('Indisponível');
        await user.hover(badge);
        
        const tooltip = await screen.findByRole('tooltip');
        expect(tooltip).toHaveTextContent(expected);
      });
    });
  });
});

describe('CertificationBadgeGroup', () => {
  it('renderiza múltiplos badges', () => {
    const badges = [
      { status: 'certified' as const, successRate: 98 },
      { status: 'quality_warning' as const, successRate: 75 },
      { status: 'not_tested' as const },
    ];
    
    render(<CertificationBadgeGroup badges={badges} />);
    
    expect(screen.getByText('Certificado (98%)')).toBeInTheDocument();
    expect(screen.getByText('Aviso de Qualidade')).toBeInTheDocument();
    expect(screen.getByText('Não Testado')).toBeInTheDocument();
  });

  it('retorna null quando array está vazio', () => {
    const { container } = render(<CertificationBadgeGroup badges={[]} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('aplica gap entre badges', () => {
    const badges = [
      { status: 'certified' as const },
      { status: 'quality_warning' as const },
    ];
    
    const { container } = render(<CertificationBadgeGroup badges={badges} />);
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ display: 'flex', gap: '8px' });
  });

  it('permite flexWrap para múltiplos badges', () => {
    const badges = Array.from({ length: 5 }, (_, i) => ({
      status: 'certified' as const,
      successRate: 90 + i,
    }));
    
    const { container } = render(<CertificationBadgeGroup badges={badges} />);
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ flexWrap: 'wrap' });
  });

  it('passa props corretamente para cada badge', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    const badges = [
      { 
        status: 'certified' as const, 
        successRate: 98,
        onClick: handleClick
      },
    ];
    
    render(<CertificationBadgeGroup badges={badges} />);
    
    const badge = screen.getByText('Certificado (98%)');
    await user.click(badge);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
