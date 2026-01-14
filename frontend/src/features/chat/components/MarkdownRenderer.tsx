// frontend/src/features/chat/components/MarkdownRenderer.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Typography, Link, Box, useTheme, alpha, Divider } from '@mui/material';

interface MarkdownRendererProps {
  content: string;
}

function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // 1. TEXTO E QUEBRAS DE LINHA (Corrige o Tabuleiro)
        p: ({ children }) => (
          <Typography 
            variant="body1" 
            sx={{ 
              mb: 1.5, 
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap', // <--- O SEGREDO: Respeita espaços e Enters
              wordBreak: 'break-word' // Evita que palavras gigantes quebrem o layout
            }}
          >
            {children}
          </Typography>
        ),

        // 2. LINKS
        a: ({ href, children }) => (
          <Link 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer" 
            sx={{ color: theme.palette.primary.main, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            {children}
          </Link>
        ),

        // 3. TABELAS (Estilo GFM)
        table: ({ children }) => (
          <Box 
            component="div" 
            sx={{ 
              overflowX: 'auto', 
              mb: 2, 
              mt: 1, 
              borderRadius: 1,
              border: `1px solid ${theme.palette.divider}` 
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              {children}
            </table>
          </Box>
        ),
        thead: ({ children }) => <thead style={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>{children}</thead>,
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => <tr style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>{children}</tr>,
        th: ({ children }) => (
          <th style={{ padding: theme.spacing(1.5), textAlign: 'left', fontWeight: 600, color: theme.palette.text.primary }}>
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td style={{ padding: theme.spacing(1.5), color: theme.palette.text.secondary }}>
            {children}
          </td>
        ),

        // 4. LISTAS
        ul: ({ children }) => <Box component="ul" sx={{ pl: 3, mb: 2 }}>{children}</Box>,
        ol: ({ children, start }) => <Box component="ol" start={start} sx={{ pl: 3, mb: 2 }}>{children}</Box>,
        li: ({ children }) => (
          <Typography component="li" variant="body1" sx={{ mb: 0.5 }}>
            {children}
          </Typography>
        ),

        // 5. CITAÇÕES (Blockquotes)
        blockquote: ({ children }) => (
          <Box 
            component="blockquote" 
            sx={{ 
              borderLeft: `4px solid ${theme.palette.divider}`, 
              m: 0, 
              pl: 2, 
              py: 1, 
              my: 2, 
              bgcolor: alpha(theme.palette.action.hover, 0.05),
              color: 'text.secondary',
              fontStyle: 'italic'
            }}
          >
            {children}
          </Box>
        ),

        // 6. DIVISORES
        hr: () => <Divider sx={{ my: 2 }} />,

        // 7. TÍTULOS
        h1: ({ children }) => <Typography variant="h3" gutterBottom sx={{ mt: 3, fontSize: '1.8rem', fontWeight: 700 }}>{children}</Typography>,
        h2: ({ children }) => <Typography variant="h4" gutterBottom sx={{ mt: 3, fontSize: '1.5rem', fontWeight: 600 }}>{children}</Typography>,
        h3: ({ children }) => <Typography variant="h5" gutterBottom sx={{ mt: 2, fontSize: '1.25rem', fontWeight: 600 }}>{children}</Typography>,

        // 8. CÓDIGO (Syntax Highlighting - Mantido e Melhorado)
        code({ inline, className, children, _node, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : null;
          
          // Detecção mais robusta de código inline:
          // - Usa a prop inline se disponível
          // - Se não, verifica se não tem className (bloco tem language-xxx)
          // - E verifica se não tem quebras de linha no conteúdo
          const codeContent = String(children);
          const hasNewline = codeContent.includes('\n');
          const isInline = inline ?? (!className && !hasNewline);
          
          // Código inline (sem quebra de linha, marcado com ` )
          // IMPORTANTE: Retorna apenas elemento <code> nativo para evitar <div> dentro de <p>
          if (isInline) {
            return (
              <code
                style={{
                  backgroundColor: alpha(theme.palette.text.primary, 0.1),
                  color: theme.palette.text.primary,
                  padding: `${theme.spacing(0.25)} ${theme.spacing(0.625)}`,
                  borderRadius: theme.shape.borderRadius,
                  fontFamily: theme.typography.monospace,
                  fontSize: '0.85em',
                  fontWeight: 'bold'
                }}
                {...props}
              >
                {children}
              </code>
            );
          }
          
          // Bloco de código (``` com ou sem linguagem)
          return (
            <Box sx={{ my: 2, borderRadius: theme.shape.borderRadius, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ 
                px: 2, 
                py: 0.5, 
                bgcolor: isDark ? alpha(theme.palette.background.default, 0.2) : theme.palette.background.paper,
                borderBottom: '1px solid', 
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Typography variant="caption" sx={{ fontFamily: theme.typography.monospace, color: 'text.secondary', fontWeight: 'bold' }}>
                  {language ? language.toUpperCase() : 'CODE'}
                </Typography>
              </Box>
              <SyntaxHighlighter
                style={isDark ? vscDarkPlus : vs}
                language={language || 'text'}
                PreTag="div"
                customStyle={{
                  margin: 0,
                  padding: theme.spacing(2),
                  fontSize: '0.85rem',
                  lineHeight: '1.5',
                  backgroundColor: isDark ? theme.palette.custom.hackerBg : theme.palette.background.paper
                }}
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            </Box>
          );
        }
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// Memoização para evitar re-parsing de Markdown desnecessário
export default memo(MarkdownRenderer);