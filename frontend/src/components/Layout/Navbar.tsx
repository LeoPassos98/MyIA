import { AppBar, Toolbar, Typography, Box, Tooltip, IconButton, Avatar, Fade, alpha } from '@mui/material';
import { 
  Logout, 
  SmartToy, 
  Settings as SettingsIcon,
  AutoAwesome as SparkleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Pega iniciais do nome para o avatar
  const getInitials = (name?: string | null, email?: string | null) => { // Ajustado para aceitar null
    const displayName = name || email || 'U';
    return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <AppBar 
      position="static"
      elevation={0}
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderBottom: '1px solid',
        borderColor: alpha('#fff', 0.1),
        backdropFilter: 'blur(10px)',
      }}
    >
      <Toolbar sx={{ py: 1 }}>
        {/* Logo Section */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            flex: 1
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: alpha('#fff', 0.15),
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid',
              borderColor: alpha('#fff', 0.2),
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                animation: 'shimmer 3s infinite',
              },
              '@keyframes shimmer': {
                '0%': { left: '-100%' },
                '100%': { left: '200%' },
              }
            }}
          >
            <SmartToy sx={{ color: 'white', fontSize: 24 }} />
          </Box>

          <Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                color: 'white',
                letterSpacing: '-0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              MyIA
              <SparkleIcon sx={{ fontSize: 18, color: '#FFD700' }} />
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: alpha('#fff', 0.8),
                fontSize: '0.7rem',
                letterSpacing: '0.5px'
              }}
            >
              Assistente Conversacional Inteligente
            </Typography>
          </Box>
        </Box>

        {/* User Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {user && (
            <Fade in timeout={600}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.5,
                  px: 2,
                  py: 0.75,
                  borderRadius: 10,
                  background: alpha('#fff', 0.1),
                  backdropFilter: 'blur(10px)',
                  border: '1px solid',
                  borderColor: alpha('#fff', 0.2),
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    bgcolor: alpha('#fff', 0.2),
                    color: 'white',
                    border: '2px solid',
                    borderColor: alpha('#fff', 0.3),
                  }}
                >
                  {getInitials(user.name, user.email)}
                </Avatar>
                <Box>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      lineHeight: 1.2
                    }}
                  >
                    {user.name || user.email?.split('@')[0]}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: alpha('#fff', 0.7),
                      fontSize: '0.7rem'
                    }}
                  >
                    Online
                  </Typography>
                </Box>
              </Box>
            </Fade>
          )}
          
          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Configurações" arrow>
              <IconButton 
                onClick={() => navigate('/settings')}
                sx={{
                  color: 'white',
                  background: alpha('#fff', 0.1),
                  backdropFilter: 'blur(10px)',
                  border: '1px solid',
                  borderColor: alpha('#fff', 0.2),
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: alpha('#fff', 0.2),
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  }
                }}
              >
                <SettingsIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Sair" arrow>
              <IconButton 
                onClick={handleLogout}
                sx={{
                  color: 'white',
                  background: alpha('#fff', 0.1),
                  backdropFilter: 'blur(10px)',
                  border: '1px solid',
                  borderColor: alpha('#fff', 0.2),
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: alpha('#F44336', 0.3),
                    borderColor: alpha('#F44336', 0.5),
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(244,67,54,0.3)',
                  }
                }}
              >
                <Logout sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}