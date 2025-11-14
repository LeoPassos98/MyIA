import { Box, List, ListItem, ListItemButton, ListItemText, IconButton, Typography, Button } from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { Chat as ChatType } from '../../services/chatHistoryService';

interface ChatSidebarProps {
  chats: ChatType[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onNewChat: () => void;
}

export default function ChatSidebar({ chats, currentChatId, onSelectChat, onDeleteChat, onNewChat }: ChatSidebarProps) {
  return (
    <Box
      sx={{
        width: 280,
        borderRight: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<AddIcon />}
          onClick={onNewChat}
        >
          Nova Conversa
        </Button>
      </Box>

      <List sx={{ flex: 1, overflow: 'auto' }}>
        {chats.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Nenhuma conversa ainda
            </Typography>
          </Box>
        ) : (
          chats.map((chat) => (
            <ListItem
              key={chat.id}
              disablePadding
              secondaryAction={
                <IconButton
                  edge="end"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemButton
                selected={chat.id === currentChatId}
                onClick={() => onSelectChat(chat.id)}
              >
                <ListItemText
                  primary={chat.title}
                  secondary={new Date(chat.updatedAt).toLocaleDateString()}
                  primaryTypographyProps={{
                    noWrap: true,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))
        )}
      </List>
    </Box>
  );
}
