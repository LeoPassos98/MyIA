// frontend/src/utils/objectPool.ts
// Fase 3: Memory Optimization - Object Pooling System
// Sistema de reutilização de objetos para reduzir Garbage Collection

/**
 * Classe genérica de Object Pool para reutilização de objetos
 * Reduz alocações de memória e eventos de GC ao reusar objetos
 * 
 * @template T Tipo do objeto a ser poolado
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private maxSize: number;
  private factory: () => T;
  private reset: (obj: T) => void;
  private activeCount = 0;

  /**
   * @param factory Função que cria novos objetos
   * @param reset Função que limpa/reseta objetos para reutilização
   * @param maxSize Tamanho máximo do pool (padrão: 100)
   */
  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    maxSize: number = 100
  ) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;
  }

  /**
   * Adquire um objeto do pool (ou cria novo se pool vazio)
   * @returns Objeto pronto para uso
   */
  acquire(): T {
    this.activeCount++;
    const obj = this.pool.pop();
    
    if (obj) {
      // Reutiliza objeto do pool
      return obj;
    }
    
    // Cria novo objeto se pool vazio
    return this.factory();
  }

  /**
   * Devolve objeto ao pool após uso
   * @param obj Objeto a ser devolvido
   */
  release(obj: T): void {
    this.activeCount = Math.max(0, this.activeCount - 1);
    
    // Só adiciona ao pool se não exceder tamanho máximo
    if (this.pool.length < this.maxSize) {
      this.reset(obj);
      this.pool.push(obj);
    }
    // Caso contrário, deixa GC coletar (pool cheio)
  }

  /**
   * Limpa todo o pool
   */
  clear(): void {
    this.pool = [];
    this.activeCount = 0;
  }

  /**
   * Retorna estatísticas do pool
   */
  getStats() {
    return {
      poolSize: this.pool.length,
      activeCount: this.activeCount,
      maxSize: this.maxSize,
      utilizationRate: this.activeCount / (this.pool.length + this.activeCount),
    };
  }
}

/**
 * Interface para mensagens de chat (compatível com Message type)
 */
interface PooledMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  isPinned?: boolean;
  costInUSD?: number;
  [key: string]: any;
}

/**
 * Pool específico para mensagens de chat
 * Reduz alocações durante streaming de mensagens
 */
class MessagePool extends ObjectPool<PooledMessage> {
  constructor(maxSize: number = 50) {
    super(
      // Factory: cria nova mensagem
      () => ({
        id: '',
        role: 'user',
        content: '',
        createdAt: new Date().toISOString(),
        isPinned: false,
        costInUSD: 0,
      }),
      // Reset: limpa mensagem para reutilização
      (msg) => {
        msg.id = '';
        msg.role = 'user';
        msg.content = '';
        msg.createdAt = new Date().toISOString();
        msg.isPinned = false;
        msg.costInUSD = 0;
        // Remove propriedades extras
        Object.keys(msg).forEach(key => {
          if (!['id', 'role', 'content', 'createdAt', 'isPinned', 'costInUSD'].includes(key)) {
            delete msg[key];
          }
        });
      },
      maxSize
    );
  }

  /**
   * Cria mensagem com dados iniciais
   */
  createMessage(data: Partial<PooledMessage>): PooledMessage {
    const msg = this.acquire();
    Object.assign(msg, data);
    return msg;
  }
}

/**
 * Interface para eventos de UI frequentes
 */
interface PooledEvent {
  type: string;
  timestamp: number;
  data: any;
}

/**
 * Pool para eventos de UI frequentes (scroll, resize, etc)
 * Reduz alocações em event handlers de alta frequência
 */
class EventPool extends ObjectPool<PooledEvent> {
  constructor(maxSize: number = 30) {
    super(
      // Factory: cria novo evento
      () => ({
        type: '',
        timestamp: 0,
        data: null,
      }),
      // Reset: limpa evento
      (evt) => {
        evt.type = '';
        evt.timestamp = 0;
        evt.data = null;
      },
      maxSize
    );
  }

  /**
   * Cria evento com dados
   */
  createEvent(type: string, data?: any): PooledEvent {
    const evt = this.acquire();
    evt.type = type;
    evt.timestamp = Date.now();
    evt.data = data;
    return evt;
  }
}

/**
 * Pool para buffers de string (usado em streaming)
 * Reduz alocações durante concatenação de chunks
 */
class StringBufferPool extends ObjectPool<string[]> {
  constructor(maxSize: number = 20) {
    super(
      // Factory: cria novo array
      () => [],
      // Reset: limpa array
      (arr) => {
        arr.length = 0;
      },
      maxSize
    );
  }

  /**
   * Adquire buffer e retorna com helper methods
   */
  acquireBuffer() {
    const buffer = this.acquire();
    return {
      buffer,
      append: (str: string) => buffer.push(str),
      toString: () => buffer.join(''),
      release: () => this.release(buffer),
    };
  }
}

// Instâncias singleton dos pools
export const messagePool = new MessagePool(50);
export const eventPool = new EventPool(30);
export const stringBufferPool = new StringBufferPool(20);

/**
 * Hook para monitorar uso de memória dos pools (dev mode)
 */
export function getPoolStats() {
  return {
    messages: messagePool.getStats(),
    events: eventPool.getStats(),
    stringBuffers: stringBufferPool.getStats(),
  };
}

/**
 * Limpa todos os pools (útil em testes ou reset)
 */
export function clearAllPools() {
  messagePool.clear();
  eventPool.clear();
  stringBufferPool.clear();
}

/**
 * Tipo exportado para uso em componentes
 */
export type { PooledMessage, PooledEvent };
