import { pool, isPostgres } from "../db/pool";
import { embedTexts, toVectorSql } from "./embeddings";

const CHUNK_SIZE    = 1800;
const CHUNK_OVERLAP = 150;
const EMBED_BATCH   = 50;

const KNOWLEDGE_DOCS: { source: string; content: string }[] = [
  {
    source: "manual_consolemix.txt",
    content: `
Manual de Instruções — Console Mix
Versão 1.0.37

=== 1. INTRODUÇÃO ===

O Console Mix é uma mesa de som virtual profissional para gerenciamento e mixagem de áudio digital. O software oferece controle completo sobre múltiplos canais de áudio, com funcionalidades avançadas como equalização, expansão dinâmica, barramentos dedicados e integração com Playouts externos.

=== 2. REQUISITOS DO SISTEMA ===

Requisitos Mínimos:
- Sistema Operacional: Windows 10/11 (64 bits)
- Processador: Intel Core i5 (6ª geração) ou AMD Ryzen 5 ou superior
- Memória RAM: 8 GB
- Espaço em Disco: 500 MB livres
- Placa de Som: Compatível com DirectSound ou ASIO
- Resolução de Tela: 1366 x 768 ou superior

Requisitos Recomendados:
- Processador: Intel Core i7 (12ª geração) ou AMD Ryzen 7 ou superior
- Memória RAM: 16 GB
- Espaço em Disco: 1 GB livre
- Placa de Som: Compatível com ASIO
- Resolução de Tela: 1920 x 1080 ou superior (recomenda-se touch-screen)
- Acesso à Internet

=== 3. INSTALAÇÃO ===

1. Download
   - Faça o download do arquivo de instalação no site oficial: www.radioalerta.com.br/console
   - Verifique se o arquivo baixado é a versão mais recente

2. Processo de Instalação
   - Execute o arquivo de instalação como administrador
   - Leia e aceite os termos de licença
   - Escolha o diretório de instalação
   - Selecione os componentes: Software principal e Plugins adicionais
   - Clique em "Instalar" e aguarde a conclusão

3. Primeira Execução
   - Execute o software pela primeira vez
   - Configure sua placa de som ou interface de áudio

=== 4. INTERFACE PRINCIPAL ===

A interface principal do Console Mix é dividida em várias seções:

Cabeçalho:
- Seções A, B, C: Três painéis no topo com medidores de nível para monitoramento visual dos sinais de áudio.
- Display Digital Central: Exibe hora atual, data e temperatura.

Painel de Opções (Options) — menu lateral direito:
- Sound (Som)
- Outputs (Saídas)
- Tracks (Faixas)
- Plugins
- CamCorder
- Commands (Comandos)
- General (Geral)
- Reboot/Update (Reiniciar/Atualizar)
- About (Sobre)
- Controle de Voice Over: atenuação prática do Voice Over
- Predefinições: Botões de memória (MEM 1-6) personalizáveis
- Área de Canais: todos os canais de entrada disponíveis

Canais de Entrada (Audio Track):
- 16 Canais de Entrada, cada um com:
  - Fader vertical para controle de volume
  - Medidores de nível LED
  - Botão "DINAMICS" para plugins na Track
  - Botões "ON/OFF" para ativar/desativar o canal
  - Identificação numérica (1, 2, 3, etc.)
  - Botões "TALK" e "CUE" para comunicação e pré-escuta

=== 5. PAINEL DE CONFIGURAÇÕES ===

Sound (Configurações da Interface de Áudio):
- Audio device type: Define o protocolo de áudio (Windows Audio, Windows Audio Exclusive mode, Windows Audio Low Latency mode, DirectSound, ASIO)
- Device: Especifica o hardware de áudio conectado. O botão "Test" verifica a comunicação com o dispositivo.
- Active output channels: Seleciona quais canais de saída serão utilizados.
- Active input channels: Determina quais canais de entrada serão monitorados.
- Sample rate: Define a taxa de amostragem do áudio.
- Audio buffer size: Buffer menor (64 samples = 1,3ms) reduz latência mas exige mais do processador. Buffers maiores reduzem carga no CPU mas aumentam o delay.
- Control Panel: Abre painel de controle específico do driver.
- Reset Device: Reinicia a comunicação com o dispositivo de áudio.

Outputs (Configurações de saída de áudio):
- BUS A, BUS B, BUS C: Barramentos principais de mixagem
- Monitor: Saída dedicada para monitoração em estúdio
- Fone: Saída para fones de ouvido
- CUE: Saída para pré-escuta de canais específicos
- MINUS 1, MINUS 2: Saídas onde determinados sinais são excluídos da mixagem (para retornos de participantes externos)
- NDI / UDP: Transmissões de áudio em rede
- AES67: Saídas usando protocolo AES67 (áudio sobre IP)
- Stream: Configurações para transmissão de áudio para plataformas de streaming
- Monitor Attenuation: Reduz automaticamente o volume da monitoração (ducking/dimming)

Tracks (Configurações de entrada de áudio):
- Input: Atribui entradas de áudio às Tracks, com rótulo personalizado, ganho e tipo de entrada:
  - Main: Conexões de áudio padrão via interfaces físicas
  - NDI (Network Device Interface): Áudio entre dispositivos na mesma rede sem cabos
  - UDP (User Datagram Protocol): Transmissão rápida de áudio em tempo real
  - Stream: Transmissão direta para plataformas de streaming online
  - Link INT (Link Internal): Roteamento interno entre instâncias de software
  - VOIP (Voice Over Internet Protocol): Comunicação de voz pela internet para produções remotas
  - Audio Call: Conecta a mesa a dispositivos móveis e computadores sem IP fixo, totalmente wireless. Oferece retorno direto do Console Mix, ID de sessão dinâmico e conexão Full Duplex.
- Buses: Seleciona barramentos para cada faixa (BUS A, BUS B, BUS C, MINUS 1, MINUS 2)
- Options: Configurações adicionais: Cut Monitor, Voice Over, Soundtrack, Timer, personalização e botão "Safe"

Plugins (Gerenciamento de plugins VST3):
- Botão Scan Plugins: Escaneia plugins existentes no sistema.

Commands (Comandos UDP / Flag Settings):
- Configura triggers para cada track. Exemplo: acender a luz "ON AIR" ao ligar o canal do microfone.

General (Geral):
- Personalização da interface entre Standard e Black
- Personalização de rótulos para as predefinições (MEM1-MEM6)

=== 6. BARRAMENTOS DE ÁUDIO ===

Barramento A:
- Função Principal: Mixagem principal (Main Mix)
- Uso Típico: Saída principal para transmissão ou gravação

Barramento B:
- Função Principal: Mix alternativo ou sub mixagem
- Uso Típico: Monitoramento ou gravação secundária

Barramento C:
- Função Principal: Mix auxiliar ou envios de efeitos
- Uso Típico: Envios para efeitos externos ou retornos

Barramento Minus:
- Função Principal: Cancelamento de feedback ou eco
- Uso Típico: Evitar que o ouvinte (em entrevista) ouça o retorno de sua própria voz

=== 7. PREDEFINIÇÕES ===

Predefinições de Tracks:
- Salvamento de posições de faders, configurações de plugins e personalização dos botões
- Como salvar: Pressione e segure por 4 segundos no botão MEM desejado
- Como carregar: Clique na opção desejada
- Para personalizar: Options > General > Memories

Predefinições de Mute:
- Salvamento de botões on/off, até 2 grupos de Mute
- Como configurar: Options > Tracks > Buses/Mutes

=== 8. FUNÇÃO CUE ===

A função CUE permite monitorar o áudio processado sem enviá-lo para os barramentos.
- Configuração: Options > Outputs > configurar canal de saída para CUE

=== 9. FUNÇÃO TALK ===

A função TALK permite comunicação direta sem interferir na transmissão principal.
- Comunicação Dedicada: Canal separado para instruções
- Roteamento Flexível: Envio para retornos específicos
- Modo Dim: Reduz outros sinais durante a comunicação
- Uso: Pressione e segure o botão TALK, fale normalmente no microfone designado

=== 10. CONFIGURAÇÃO DE ÁUDIO ===

Placa de Som Física:
- Acesse "Configurações" > "Sistema de Áudio" > "Hardware"
- Selecione sua interface de áudio na lista
- Configure entradas e saídas físicas
- Clock: Internal (a placa gera seu próprio clock) ou External (sincroniza com fonte externa)

Vantagens de Placas Físicas:
- Pré-amplificadores dedicados para microfones
- Conversores AD/DA de alta qualidade
- Processamento DSP em hardware (em alguns modelos)
- Controles físicos para ajustes rápidos

=== 11. INTEGRAÇÃO COM vMix ===

- Sincronização de Áudio: Alinhamento automático entre áudio e vídeo
- Controle Remoto das cenas do vMix via "vMix Controller"
- Seguimento de Fontes: Mudança automática ao alternar fontes de vídeo

=== 12. SOLUÇÃO DE PROBLEMAS ===

Sem Áudio ou Áudio Baixo:
- Verifique se os faders de canal e master estão elevados
- Verifique os botões on/off e o roteamento para os barramentos
- Confirme se o dispositivo de saída está configurado corretamente
- Verifique os níveis de ganho de entrada

Áudio com Ruídos ou Distorções:
- Reduza o ganho de entrada se os medidores estiverem no vermelho
- Verifique a qualidade das conexões físicas
- Aumente o tamanho do buffer se houver estalos ou cortes

Latência Excessiva:
- Reduza o tamanho do buffer de áudio
- Utilize drivers ASIO em vez de WDM ou DirectSound
- Desative plugins que consomem muitos recursos
- Considere uma interface de áudio com menor latência

Software Lento ou Instável:
- Verifique os requisitos mínimos do sistema
- Atualize drivers de áudio para versões mais recentes
- Feche aplicativos desnecessários em segundo plano
- Reinstale o software se o problema persistir

Erros de Inicialização:
- Execute o software como administrador
- Desative temporariamente o antivírus durante a instalação
- Verifique se há conflitos com outros softwares de áudio

Problemas de Integração:
- Verifique as configurações de rede e firewall
- Reinicie ambos os softwares após configurar a integração

=== 13. PERGUNTAS FREQUENTES ===

P: Quantos canais de áudio posso usar simultaneamente?
R: Console Mix entrega até 16 canais de controle simultâneo.

P: O software funciona com streaming ao vivo?
R: Sim, com integração direta ou via vMix. Necessita de acesso à internet.

P: Qual é a latência típica do sistema?
R: Com interface ASIO e buffer de 64 amostras, é possível alcançar latências inferiores a 1,4ms.

P: É possível gravar o áudio processado?
R: Sim, o Console Mix possui gravação integrada para canais individuais, barramentos ou a mixagem completa.

P: O software é compatível com macOS ou Linux?
R: Atualmente disponível apenas para Windows. Versões para macOS e Linux estão em desenvolvimento.

P: Quais placas de som são recomendadas?
R: Recomendamos interfaces ASIO como Focusrite Scarlett, PreSonus AudioBox ou Behringer UMC.

=== 14. SUPORTE TÉCNICO ===

Contato para Suporte:
- Telefone: (42) 99985-3754 / (42) 99848-8284
- Horário de Atendimento: Segunda a Sexta, das 9h às 18h (UTC-3)
- Atualizações e Patches: www.radioalerta.com.br/console

Política de Suporte:
- Suporte gratuito para todos os usuários registrados
- Treinamento personalizado disponível mediante agendamento
- Suporte remoto disponível para resolução de problemas complexos
`.trim(),
  },
];

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end   = Math.min(start + CHUNK_SIZE, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 50) chunks.push(chunk);
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

export async function seedKnowledgeIfEmpty(): Promise<void> {
  if (!process.env.VOYAGE_API_KEY) {
    console.log("[seed] VOYAGE_API_KEY não definida — pulando ingestão.");
    return;
  }

  const { rows } = await pool.query<{ count: string }>(
    "SELECT COUNT(*) as count FROM knowledge_chunks"
  );
  const count = parseInt(rows[0]?.count ?? "0", 10);

  if (count > 0) {
    console.log(`[seed] Base de conhecimento já possui ${count} chunks — pulando.`);
    return;
  }

  console.log("[seed] Base de conhecimento vazia — iniciando ingestão automática...");

  for (const doc of KNOWLEDGE_DOCS) {
    const chunks = chunkText(doc.content);
    console.log(`[seed] ${doc.source}: ${chunks.length} chunks`);

    for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
      const batch      = chunks.slice(i, i + EMBED_BATCH);
      const embeddings = await embedTexts(batch);

      for (let j = 0; j < batch.length; j++) {
        if (isPostgres) {
          await pool.query(
            `INSERT INTO knowledge_chunks (content, source, embedding)
             VALUES ($1, $2, $3::vector)`,
            [batch[j], doc.source, toVectorSql(embeddings[j])]
          );
        } else {
          await pool.query(
            `INSERT INTO knowledge_chunks (content, source, embedding)
             VALUES ($1, $2, $3)`,
            [batch[j], doc.source, JSON.stringify(embeddings[j])]
          );
        }
      }
    }
  }

  console.log("[seed] Ingestão automática concluída.");
}
