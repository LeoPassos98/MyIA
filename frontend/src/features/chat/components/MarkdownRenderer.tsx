import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Typography, Link, Box, useTheme, alpha } from '@mui/material';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <Typography variant="body1" sx={{ mb: 1.5, lineHeight: 1.7 }}>
            {children}
          </Typography>
        ),
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
        ul: ({ children }) => <Box component="ul" sx={{ pl: 3, mb: 2 }}>{children}</Box>,
        ol: ({ children }) => <Box component="ol" sx={{ pl: 3, mb: 2 }}>{children}</Box>,
        li: ({ children }) => (
          <Typography component="li" variant="body1" sx={{ mb: 0.5 }}>
            {children}
          </Typography>
        ),
        code({ inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          if (inline || !match) {
            return (
              <Box
                component="code"
                sx={{
                  bgcolor: alpha(theme.palette.text.primary, 0.1),
                  color: theme.palette.text.primary,
                  px: 0.6,
                  py: 0.2,
                  borderRadius: 1,
                  fontFamily: '"Fira Code", monospace',
                  fontSize: '0.85em',
                  fontWeight: 'bold'
                }}
                {...props}
              >
                {children}
              </Box>
            );
          }
          return (
            <Box sx={{ my: 2, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ 
                px: 2, 
                py: 0.5, 
                bgcolor: isDark ? '#1e1e1e' : '#f5f5f5', 
                borderBottom: '1px solid', 
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                  {match[1]}
                </Typography>
              </Box>
              <SyntaxHighlighter
                style={isDark ? vscDarkPlus : vs}
                language={match[1]}
                PreTag="div"
                customStyle={{
                  margin: 0,
                  padding: '16px',
                  fontSize: '0.85rem',
                  lineHeight: '1.5',
                  backgroundColor: isDark ? '#0d1117' : '#ffffff'
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
