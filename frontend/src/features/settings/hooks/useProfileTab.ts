// frontend/src/features/settings/components/useProfileTab.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { userService } from '../../../services/userService';
import { authService } from '../../../services/authService';

type Msg = { type: 'success' | 'error', text: string } | null;

export function useProfileTab() {
  const { user, setUser } = useAuth();

  // States para Nome
  const [name, setName] = useState(user?.name || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState<Msg>(null);

  // States para Senha
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passMsg, setPassMsg] = useState<Msg>(null);

  useEffect(() => { if (user?.name) setName(user.name); }, [user]);

  const handleSaveName = async () => {
    try {
      setIsSavingName(true);
      await userService.updateProfile({ name });
      if (setUser && user) setUser({ ...user, name });
      setNameMsg({ type: 'success', text: 'Nome atualizado!' });
    } catch (error) {
      setNameMsg({ type: 'error', text: 'Erro ao atualizar nome.' });
    } finally {
      setIsSavingName(false);
      setTimeout(() => setNameMsg(null), 3000);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      setPassMsg({ type: 'error', text: 'Senhas não conferem.' });
      return;
    }
    try {
      setIsChangingPass(true);
      await authService.changePassword({ oldPassword: passwords.current, newPassword: passwords.new });
      setPasswords({ current: '', new: '', confirm: '' });
      setPassMsg({ type: 'success', text: 'Senha alterada!' });
    } catch (error) {
      setPassMsg({ type: 'error', text: 'Erro ao alterar senha.' });
    } finally {
      setIsChangingPass(false);
      setTimeout(() => setPassMsg(null), 3000);
    }
  };

  return {
    user,
    name,
    setName,
    isSavingName,
    nameMsg,
    handleSaveName,
    passwords,
    setPasswords,
    isChangingPass,
    passMsg,
    handleChangePassword,
  };
}
