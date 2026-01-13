// src/config/passport.ts
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { prisma } from '../lib/prisma';

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: process.env.GITHUB_OAUTH_CALLBACK_URL || 'http://localhost:3001/auth/github/callback',
      scope: ['user:email'],
    },
    async (accessToken: string, _refreshToken: string, profile: any, done: any) => {
      try {
        // 1. Tenta pegar o e-mail do array de e-mails (que vem do scope user:email)
        let email = profile.emails && profile.emails.length > 0 
                    ? profile.emails[0].value 
                    : null;

        // 2. Se o e-mail ainda for nulo (comum em perfis privados)
        if (!email) {
          return done(new Error('Seu e-mail está privado no GitHub. Por favor, torne-o público ou use outro método de login.'));
        }

        // 3. Busca ou cria o usuário (Upsert)
        let user = await prisma.user.upsert({
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
          include: { providerCredentials: true }
        });

        // 4. Linka a credencial do GitHub se necessário
        const githubProvider = await prisma.aIProvider.findUnique({ where: { slug: 'github' } });
        if (githubProvider) {
          await prisma.userProviderCredential.upsert({
            where: {
              userId_providerId: { userId: user.id, providerId: githubProvider.id }
            },
            update: { apiKey: accessToken },
            create: {
              userId: user.id,
              providerId: githubProvider.id,
              apiKey: accessToken,
            }
          });
        }

        return done(null, user);
      } catch (error) {
        console.error('Erro na estratégia GitHub:', error);
        return done(error);
      }
    }
  )
);

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser((id: string, done) => done(null, { id }));

export default passport;