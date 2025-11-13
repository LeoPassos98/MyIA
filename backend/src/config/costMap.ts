export const COST_PER_1M_TOKENS = {
  // Groq (gratuito)
  'llama-3.1-8b-instant': { input: 0.00, output: 0.00 },
  'llama-3.1-70b-versatile': { input: 0.00, output: 0.00 },
  'mixtral-8x7b-32768': { input: 0.00, output: 0.00 },
  
  // OpenAI
  'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
  'gpt-4': { input: 30.00, output: 60.00 },
  'gpt-4o': { input: 5.00, output: 15.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  
  // Anthropic
  'claude-3-opus': { input: 15.00, output: 75.00 },
  'claude-3-sonnet': { input: 3.00, output: 15.00 },
  'claude-3-haiku': { input: 0.25, output: 1.25 },
  
  // Google
  'gemini-pro': { input: 0.50, output: 1.50 },
  'gemini-1.5-pro': { input: 3.50, output: 10.50 },
  
  // Cohere
  'command-r': { input: 0.50, output: 1.50 },
  'command-r-plus': { input: 3.00, output: 15.00 },
  
  // Mistral
  'mistral-small': { input: 1.00, output: 3.00 },
  'mistral-medium': { input: 2.70, output: 8.10 },
  'mistral-large': { input: 8.00, output: 24.00 },
};
