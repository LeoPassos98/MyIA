// src/config/passport.ts
import passport from 'passport';
import { Strategy as GitHubStrategy, Profile } from 'passport-github2';
import { User } from '@prisma/client';
import { prisma } from '../lib/prisma';
import logger from '../utils/logger';

// Tipo para callback do passport
type DoneCallback = (error: Error | null, user?: User | false) => void;

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: process.env.GITHUB_OAUTH_CALLBACK_URL || 'http://localhost:3001/api/auth/github/callback',
      scope: ['user:email'],
    },
    async (accessToken: string, _refreshToken: string, profile: Profile, done: DoneCallback) => {
      try {
        logger.info('[GitHub OAuth] Callback recebido');
        logger.info('[GitHub OAuth] Profile:', JSON.stringify(profile, null, 2));
        logger.info('[GitHub OAuth] Access Token:', accessToken.substring(0, 10) + '...');
        
        // 1. Tenta pegar o e-mail do array de e-mails (que vem do scope user:email)
        const email = profile.emails && profile.emails.length > 0 
                    ? profile.emails[0].value 
                    : null;

        logger.info('[GitHub OAuth] Email extraído:', email);

        // 2. Se o e-mail ainda for nulo (comum em perfis privados)
        if (!email) {
          logger.error('[GitHub OAuth] Email privado ou não disponível');
          return done(new Error('Seu e-mail está privado no GitHub. Por favor, torne-o público ou use outro método de login.'));
        }

        logger.info('[GitHub OAuth] Buscando/criando usuário...');
        
        // 3. Busca ou cria o usuário (Upsert)
        // Schema v2: providerCredentials foi removido do User
        const user = await prisma.user.upsert({
          where: { email },
          update: {
            name: profile.displayName || profile.username,
          },
          create: {
            email,
            name: profile.displayName || profile.username,
            password: '', // Senha vazia para login social
            settings: {
              create: { theme: 'dark' }
            }
          },
          include: { settings: true }
        });

        logger.info('[GitHub OAuth] Usuário criado/atualizado', { userId: user.id, email: user.email });

        // Schema v2: AIProvider → Provider
        // Schema v2: UserProviderCredential foi removido
        // GitHub OAuth não precisa mais salvar credencial em tabela separada
        // O accessToken do GitHub é usado apenas para autenticação, não para API calls
        const githubProvider = await prisma.provider.findUnique({ where: { slug: 'github' } });
        if (githubProvider) {
          logger.info('[GitHub OAuth] Provider GitHub encontrado, mas credenciais não são mais salvas em tabela separada (schema v2)');
          // NOTA: Se precisar armazenar o token do GitHub para uso futuro,
          // considere adicionar um campo em UserSettings ou criar uma nova tabela
        }

        logger.info('[GitHub OAuth] Autenticação bem-sucedida!');
        return done(null, user);
      } catch (error) {
        logger.error('[GitHub OAuth] Erro na estratégia:', error);
        const err = error instanceof Error ? error : new Error(String(error));
        return done(err);
      }
    }
  )
);

passport.serializeUser((user: Express.User, done) => {
  const typedUser = user as User;
  done(null, typedUser.id);
});
passport.deserializeUser((id: string, done) => done(null, { id } as Express.User));

export default passport;