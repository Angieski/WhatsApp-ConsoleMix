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
  {
    source: "faq_consolemix.txt",
    content: `
Perguntas e Respostas Frequentes — Console Mix

P: O que é o Console Mix?
R: É uma mesa de som virtual profissional para gerenciamento e mixagem de áudio digital. Desenvolvido para oferecer controle completo sobre múltiplos canais de áudio, com funcionalidades avançadas como equalização, expansão dinâmica, barramentos/buses dedicados e integração com Playouts externos.

P: Quais os requisitos de sistema para instalação?
R: Requisitos Mínimos: Windows 10/11 (64 bits); Intel Core i5 (6ª geração) ou AMD Ryzen 5 ou superior; 8 GB RAM; 500 MB livres em disco; placa de som compatível com DirectSound ou ASIO; resolução 1366x768 ou superior. Requisitos Recomendados: Intel Core i7 (12ª geração) ou AMD Ryzen 7 ou superior; 16 GB RAM; 1 GB livre em disco; placa de som ASIO; resolução 1920x1080 ou superior (recomenda-se touch-screen); acesso à internet.

P: Como fazer a instalação do Console Mix?
R: Faça o download no site oficial. Execute o instalador como administrador. Aceite os termos de licença. Escolha o diretório de instalação. Clique em "Instalar" e aguarde. Na primeira execução, configure sua placa de som ou interface de áudio.

P: Como é a interface principal do Console Mix?
R: A interface é dividida em seções. No topo há três painéis (A, B, C) com medidores de nível e um display digital central com hora, data e temperatura. No menu lateral direito ficam as opções: Sound, Outputs, Tracks, Plugins, CamCorder, Commands, General, Reboot/Update e About. Abaixo há o controle de Voice Over, predefinições (MEM 1-6) e a área de canais.

P: Quantos canais suporta o Console Mix?
R: O Console Mix suporta até 16 canais de entrada simultâneos (mono ou estéreo), com seleção de número de entradas conforme a interface de áudio disponibiliza. Cada canal possui fader vertical, medidores LED, botão DINAMICS para plugins, botões ON/OFF, identificação numérica e botões TALK e CUE.

P: Quais as configurações de Sound (Interface de Áudio)?
R: Audio device type: define o protocolo (Windows Audio, Windows Audio Exclusive mode, Windows Audio Low Latency mode, DirectSound, ASIO). Device: especifica o hardware de áudio. O botão "Test" verifica a comunicação com o dispositivo. Active output channels e Active input channels: selecionam canais de saída e entrada utilizados. Sample rate: define a taxa de amostragem. Audio buffer size: buffer de 64 samples = 1,3ms de latência (mais exigente para o CPU); buffers maiores reduzem carga mas aumentam delay. Control Panel: abre painel de controle do driver. Reset Device: reinicia a comunicação com o dispositivo.

P: Quais as configurações de Outputs (saídas de áudio)?
R: BUS A, BUS B, BUS C: barramentos principais de mixagem. Monitor: saída de monitoração em estúdio. Fone: saída para fones. CUE: saída de pré-escuta. MINUS 1 e MINUS 2: saídas com sinais excluídos (retornos de participantes externos). NDI/UDP: transmissão de áudio em rede. AES67: áudio sobre IP. Stream: transmissão para plataformas de streaming. Monitor Attenuation: reduz automaticamente o volume da monitoração (ducking/dimming).

P: Quais as configurações de Tracks (entradas de áudio)?
R: Input: atribui entradas às Tracks com rótulo personalizado, ganho ajustável e tipo de entrada (Main, NDI, UDP, Stream, Link INT, VOIP, Audio Call). Buses: seleciona barramentos para cada track (BUS A, BUS B, BUS C, MINUS 1, MINUS 2). Options: configurações adicionais como Cut Monitor, Voice Over, Soundtrack, Timer, personalização de cor e botão "Safe" (impede alteração da track ao usar predefinições).

P: Como configurar o input dos canais?
R: No canto superior direito, vá em Options > Tracks > Input. Selecione para cada track uma das opções: Main, NDI, UDP, Stream, Link INT, VOIP ou Audio Call.

P: Como regular o ganho do canal?
R: Em Options > Tracks > Input há um slider horizontal para regulagem de ganho de cada track.

P: Como configurar o nome do canal/track?
R: Em Options > Tracks > Input há campos para alterar nome, tipo de entrada e canais de entrada. Em Options > Tracks > Options também é possível alterar a cor de cada canal.

P: O que é Audio Call?
R: Audio Call é uma ferramenta do Console Mix que permite conectar a mesa de som a dispositivos móveis e computadores sem necessidade de IP fixo ou aplicativo dedicado, funcionando de forma totalmente wireless com apenas acesso à internet em ambos os dispositivos. Funciona como uma chamada Full Duplex (ambos comunicam simultaneamente). O dispositivo conectado recebe retorno completo da mesa, configurável pelos barramentos. Para usar: atribua "Audio Call" a uma track, clique no quadrado laranja acima do fader da track, gere e copie o link da chamada e envie ao destinatário.

P: Como colocar uma chamada no ar?
R: É possível fazer ligação por VOIP usando o Minus, ou através do Audio Call. Para Audio Call: atribua "Audio Call" a uma track, clique no quadrado laranja acima do fader, gere e copie o link e envie ao destinatário. Ambos os dispositivos precisam estar conectados à internet.

P: Até quantas ligações simultâneas é possível realizar?
R: Se for pela híbrida, até quantas ela permitir. Com o sistema Audio Call do próprio Console Mix, é possível fazer quantas ligações simultâneas houver canais disponíveis.

P: Quais plugins VST3 são aceitos e recomendados?
R: O Console Mix é compatível com plugins VST3. Use o botão "Scan Plugins" em Options > Plugins para escanear os plugins instalados no sistema. Plugins podem ser encontrados na internet, pagos ou gratuitos. Plugins recomendados: OSS (dinâmica/Over-Shoulder Suppression), TDR Kotelnikov (compressor de mastering), NA Analog Rack Delay (delay analógico), TDR Nova (equalizador paramétrico dinâmico), ATKExpander (expansor de dinâmica, reduz ruído de fundo), TAL Reverb 4 (reverberação, simula espaços acústicos).

P: O que são e como funcionam os barramentos?
R: O Console Mix possui BUS A, BUS B, BUS C e MINUS (1 e 2). Barramento A: mixagem principal (Main Mix), saída para transmissão ou gravação. Barramento B: mix alternativo ou sub mixagem, monitoramento ou gravação secundária. Barramento C: mix auxiliar ou envios de efeitos externos. Barramento Minus: cancelamento de feedback/eco, evita que o ouvinte (em entrevista) ouça o retorno de sua própria voz.

P: É possível fazer predefinições?
R: Sim. Predefinições de Tracks: salva posições de faders, configurações de plugins e personalização dos botões. Para salvar: pressione e segure 4 segundos no botão MEM desejado (MEM 1 a 6). Para carregar: clique no MEM desejado. Para personalizar: Options > General > Memories. Predefinições de Mute: salva estado dos botões ON/OFF, com até 2 grupos de Mute. Configuração: Options > Tracks > Buses/Mutes.

P: O que é a função CUE?
R: A função CUE permite monitorar o áudio processado sem enviá-lo para qualquer barramento (pré-escuta). Configuração: Options > Outputs > configurar canal de saída para CUE. Se a função for usada apenas pelo operador, não é necessário configurar canais específicos.

P: O que é a função TALK?
R: A função TALK permite comunicação direta com destinatários específicos sem interferir na transmissão principal. Possui canal dedicado, roteamento flexível para retornos específicos e Modo Dim (reduz outros sinais durante a comunicação). Uso: pressione e segure o botão TALK, fale no microfone designado. O sinal principal permanece inalterado.

P: Como ligar e configurar o Voice Over?
R: Em Options > Tracks > Options, habilite "Voice Over" no canal desejado. Para configurar a atenuação, há um slider horizontal abaixo de "Options" no canto superior direito.

P: Como minimizar a mesa?
R: Ao lado direito acima do controle de faders há a opção "Hide Mixer". Para maximizar, clique em "Show Mixer".

P: Quais as opções de personalização?
R: Em Options > General é possível personalizar toda a interface entre Standard e Black, e personalizar os rótulos das predefinições (MEM 1-6) e dos canais.

P: Quais integrações o Console Mix possui?
R: O Console Mix integra com vMix (controle de cenas, sincronização de áudio/vídeo via vMix Controller), VLC, BreakawayOne, Stereo Tool e outros sistemas.

P: É possível fazer troca de cena pelo Console Mix?
R: Sim, funciona exclusivamente com vMix, permitindo trocas de cena e com funcionalidade de tela de preview.

P: Qual a integração com vMix?
R: Sincronização automática de áudio e vídeo. Controle remoto das cenas do vMix diretamente pela interface via "vMix Controller". Mudança automática de configurações de áudio ao alternar fontes de vídeo.

P: O que é AES67?
R: AES67 é um padrão de interoperabilidade de áudio sobre IP (AoIP) que permite que diferentes sistemas de áudio em rede se comuniquem, mesmo usando protocolos diferentes. Usa PTPv2 para sincronização de relógio entre dispositivos e multicast para enviar streams para múltiplos dispositivos simultaneamente.

P: Como configurar a placa de som física?
R: Acesse Options > Sound. Selecione o tipo de protocolo (recomendado: ASIO). Escolha o dispositivo de áudio. Configure os canais de entrada e saída. Configure clock: Internal (a placa gera seu próprio clock) ou External (sincroniza com fonte externa). Vantagens: pré-amplificadores dedicados, conversores AD/DA de alta qualidade, controles físicos para ajustes rápidos.

P: Qual interface de áudio USB mais acessível para rádio?
R: Para uma rádio, o mínimo recomendado são 8 canais de saída: 1-2 no fone do operador, 3-4 no distribuidor de fones, 5-6 nas caixas e 7-8 para o transmissor ou MINUS (se tiver processador digital). O Console Mix funciona com qualquer placa de som compatível com DirectSound ou ASIO.

P: É possível enviar retorno do Console para híbrida?
R: Sim, basta ter um canal de saída disponível para isso. Outra possibilidade é usar meios digitais como VOIP ou Audio Call.

P: Como regular o pan do canal?
R: O ajuste de pan não é necessário em uma mesa de rádio, pois o valor é booleano (mono ou estéreo). Se estiver em estéreo com ganhos desiguais, podem ocorrer erros de conexão.

P: Como usar Commands (Comandos UDP / Flag Settings)?
R: Em Options > Commands é possível configurar triggers para cada track. Por exemplo: acender a luz "ON AIR" ao ligar o canal do microfone.

P: Como entrar em contato com o suporte?
R: Telefone: (42) 99985-3754 ou (42) 99848-8284. Horário: segunda a sexta das 9h às 18h (UTC-3). Site para atualizações e download: consolemix.com.br/console.
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

async function ingestDoc(doc: { source: string; content: string }): Promise<void> {
  const chunks = chunkText(doc.content);
  console.log(`[seed] ${doc.source}: ingerindo ${chunks.length} chunks...`);

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

  console.log(`[seed] ${doc.source}: concluído.`);
}

export async function seedKnowledgeIfEmpty(): Promise<void> {
  if (!process.env.VOYAGE_API_KEY) {
    console.log("[seed] VOYAGE_API_KEY não definida — pulando ingestão.");
    return;
  }

  // Remove chunks de fontes não mais presentes na lista
  const sources = KNOWLEDGE_DOCS.map((d) => d.source);
  await pool.query(
    `DELETE FROM knowledge_chunks WHERE source IS NULL OR source != ALL($1::text[])`,
    [sources]
  );

  // Ingere apenas documentos que ainda não têm chunks
  for (const doc of KNOWLEDGE_DOCS) {
    const { rows } = await pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM knowledge_chunks WHERE source = $1`,
      [doc.source]
    );
    const count = parseInt(rows[0]?.count ?? "0", 10);

    if (count > 0) {
      console.log(`[seed] ${doc.source}: já possui ${count} chunks — pulando.`);
    } else {
      await ingestDoc(doc);
    }
  }
}
