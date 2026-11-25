require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  RoleSelectMenuBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

// ==========================================
// MEMÓRIA DO BOT
// ==========================================

const config = new Map();
const cargos = new Map();
const filas = new Map();

// ==========================================
// CONFIGURAÇÃO PADRÃO
// ==========================================

function getConfig(guildId) {
  if (!config.has(guildId)) {
    config.set(guildId, {
      valores: [],
      banner: '',
      thumbnail: '',
      modo: '1v1',
      plataforma: 'Mobile'
    });
  }

  return config.get(guildId);
}

function getCargos(guildId) {
  if (!cargos.has(guildId)) {
    cargos.set(guildId, {
      dono: null,
      subdono: null,
      administrador: null,
      soltarChave: null
    });
  }

  return cargos.get(guildId);
}

// ==========================================
// COMANDOS
// ==========================================

const commands = [
  new SlashCommandBuilder()
    .setName('config_filas')
    .setDescription('Configura o sistema de filas'),

  new SlashCommandBuilder()
    .setName('adicionar_filas')
    .setDescription('Adiciona as filas configuradas')
].map(command => command.toJSON());

const rest = new REST({ version: '10' })
  .setToken(process.env.DISCORD_TOKEN);

// ==========================================
// BOT ONLINE
// ==========================================

client.once('ready', async () => {
  console.log(`Bot online como ${client.user.tag}`);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );

    console.log('Comandos registrados com sucesso!');
  } catch (error) {
    console.error('Erro ao registrar comandos:', error);
  }
});

// ==========================================
// PAINEL DE CONFIGURAÇÃO
// ==========================================

function painelConfiguracao() {
  return new ActionRowBuilder().addComponents(

    new ButtonBuilder()
      .setCustomId('config_cargos')
      .setLabel('Cargos')
      .setEmoji('👑')
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId('config_filas')
      .setLabel('Config Filas')
      .setEmoji('⚙️')
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId('config_valores')
      .setLabel('Valores das Filas')
      .setEmoji('💰')
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId('config_taxa')
      .setLabel('Taxa da Org')
      .setEmoji('🏦')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId('config_imagem')
      .setLabel('Imagem')
      .setEmoji('🖼️')
      .setStyle(ButtonStyle.Secondary)

  );
}

// ==========================================
// PAINEL DE MODO
// ==========================================

function painelModo() {
  return new ActionRowBuilder().addComponents(

    new StringSelectMenuBuilder()
      .setCustomId('selecionar_modo')
      .setPlaceholder('🎮 Escolha o modo')

      .addOptions(
        {
          label: '1v1',
          value: '1v1',
          emoji: '⚔️'
        },
        {
          label: '2v2',
          value: '2v2',
          emoji: '👥'
        },
        {
          label: '3v3',
          value: '3v3',
          emoji: '👥'
        },
        {
          label: '4v4',
          value: '4v4',
          emoji: '👥'
        }
      )

  );
}

// ==========================================
// PAINEL DE PLATAFORMA
// ==========================================

function painelPlataforma() {
  return new ActionRowBuilder().addComponents(

    new StringSelectMenuBuilder()
      .setCustomId('selecionar_plataforma')
      .setPlaceholder('📱 Escolha a plataforma')

      .addOptions(
        {
          label: 'Mobile',
          value: 'Mobile',
          emoji: '📱'
        },
        {
          label: 'Emulador',
          value: 'Emulador',
          emoji: '💻'
        },
        {
          label: 'Misto',
          value: 'Misto',
          emoji: '🔄'
        }
      )

  );
}

// ==========================================
// PAINEL DE CARGOS
// ==========================================

function painelCargos() {
  return [

    new ActionRowBuilder().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId('cargo_dono')
        .setPlaceholder('👑 Selecionar Cargo Dono')
    ),

    new ActionRowBuilder().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId('cargo_subdono')
        .setPlaceholder('🛡️ Selecionar Cargo Sub Dono')
    ),

    new ActionRowBuilder().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId('cargo_administrador')
        .setPlaceholder('🔨 Selecionar Cargo Administrador')
    ),

    new ActionRowBuilder().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId('cargo_soltar_chave')
        .setPlaceholder('🔑 Selecionar Cargo Soltar Chave')
    )

  ];
}

// ==========================================
// APAGAR PAINÉIS ANTIGOS
// ==========================================

async function apagarPainelsAntigos(channel) {

  let ultimaMensagemId = null;
  let totalApagadas = 0;

  try {

    while (true) {

      const opcoes = {
        limit: 100
      };

      if (ultimaMensagemId) {
        opcoes.before = ultimaMensagemId;
      }

      const mensagens = await channel.messages.fetch(opcoes);

      if (mensagens.size === 0) {
        break;
      }

      for (const mensagem of mensagens.values()) {

        if (
          mensagem.author.id === client.user.id &&
          mensagem.embeds.length > 0 &&
          mensagem.embeds[0].title === '🎮 FILAS MOBILE'
        ) {

          try {
            await mensagem.delete();
            totalApagadas++;
          } catch (erro) {
            console.log('Não consegui apagar um painel antigo.');
          }

        }

      }

      ultimaMensagemId = mensagens.last().id;

      if (mensagens.size < 100) {
        break;
      }

    }

  } catch (erro) {
    console.log('Erro ao apagar painéis antigos:', erro);
  }

  console.log(`Painéis antigos apagados: ${totalApagadas}`);
}

// ==========================================
// ATUALIZAR PAINEL DA FILA
// ==========================================

async function atualizarPainelFila(mensagem, valor, lista, cfg) {

  let jogadoresTexto = '👤 **Ninguém entrou ainda.**';

  if (lista.length > 0) {
    jogadoresTexto = lista
      .map(id => `<@${id}>`)
      .join('\n');
  }

  const embed = new EmbedBuilder()
    .setTitle('🎮 FILAS MOBILE')
    .setDescription(
      `🎮 **Modo:** ${cfg.modo}\n` +
      `📱 **Plataforma:** ${cfg.plataforma}\n` +
      `💰 **Valor:** R$ ${valor.toFixed(2).replace('.', ',')}\n\n` +
      `👥 **Jogadores: ${lista.length}/2**\n\n` +
      jogadoresTexto
    );

  if (cfg.thumbnail) {
    embed.setThumbnail(cfg.thumbnail);
  }

  if (cfg.banner) {
    embed.setImage(cfg.banner);
  }

  const botoes = new ActionRowBuilder().addComponents(

    new ButtonBuilder()
      .setCustomId(`entrar_normal_${valor}`)
      .setLabel('Gelo Normal')
      .setEmoji('🧊')
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId(`entrar_infinito_${valor}`)
      .setLabel('Gelo Infinito')
      .setEmoji('♾️')
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId(`sair_fila_${valor}`)
      .setLabel('Sair da Fila')
      .setEmoji('🚪')
      .setStyle(ButtonStyle.Danger)

  );

  await mensagem.edit({
    embeds: [embed],
    components: [botoes]
  });
}

// ==========================================
// EVENTO PRINCIPAL
// ==========================================

client.on('interactionCreate', async interaction => {

  try {

    // ========================================
    // SLASH COMMANDS
    // ========================================

    if (interaction.isChatInputCommand()) {

      // --------------------------------------
      // /config_filas
      // --------------------------------------

      if (interaction.commandName === 'config_filas') {

        await interaction.reply({
          content:
            '⚙️ **CONFIGURAÇÃO DAS FILAS**\n\n' +
            'Escolha uma opção abaixo para configurar seu sistema.',
          components: [painelConfiguracao()],
          ephemeral: true
        });

        return;
      }

      // --------------------------------------
      // /adicionar_filas
      // --------------------------------------

      if (interaction.commandName === 'adicionar_filas') {

        const cfg = getConfig(interaction.guild.id);

        if (!cfg.valores.length) {

          await interaction.reply({
            content:
              '❌ **Nenhum valor de fila foi configurado ainda.**',
            ephemeral: true
          });

          return;
        }

        await interaction.deferReply({
          ephemeral: true
        });

        // Apaga os painéis antigos
        await apagarPainelsAntigos(interaction.channel);

        // ====================================
        // MAIOR → MENOR
        // SEM DUPLICADOS
        // ====================================

        const valores = [
          ...new Set(
            cfg.valores
              .map(Number)
              .filter(valor =>
                !isNaN(valor) &&
                valor > 0
              )
          )
        ].sort((a, b) => b - a);

        // ====================================
        // CRIAR FILAS
        // ====================================

        for (const valor of valores) {

          const filaId = `${interaction.guild.id}_${valor}`;

          filas.set(filaId, []);

          const embed = new EmbedBuilder()
            .setTitle('🎮 FILAS MOBILE')
            .setDescription(
              `🎮 **Modo:** ${cfg.modo}\n` +
              `📱 **Plataforma:** ${cfg.plataforma}\n` +
              `💰 **Valor:** R$ ${valor.toFixed(2).replace('.', ',')}\n\n` +
              `👥 **Jogadores: 0/2**\n\n` +
              `👤 **Ninguém entrou ainda.**\n\n` +
              `🧊 Escolha uma opção abaixo para entrar na fila!`
            );

          if (cfg.thumbnail) {
            embed.setThumbnail(cfg.thumbnail);
          }

          if (cfg.banner) {
            embed.setImage(cfg.banner);
          }

          const botoes = new ActionRowBuilder().addComponents(

            new ButtonBuilder()
              .setCustomId(`entrar_normal_${valor}`)
              .setLabel('Gelo Normal')
              .setEmoji('🧊')
              .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
              .setCustomId(`entrar_infinito_${valor}`)
              .setLabel('Gelo Infinito')
              .setEmoji('♾️')
              .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
              .setCustomId(`sair_fila_${valor}`)
              .setLabel('Sair da Fila')
              .setEmoji('🚪')
              .setStyle(ButtonStyle.Danger)

          );

          await interaction.channel.send({
            embeds: [embed],
            components: [botoes]
          });

        }

        await interaction.editReply({
          content:
            '✅ **Filas criadas com sucesso!**\n\n' +
            '💰 Ordem: **maior valor → menor valor**.'
        });

        return;
      }
    }

    // ========================================
    // BOTÕES
    // ========================================

    if (interaction.isButton()) {

      const guildId = interaction.guild.id;
      const cfg = getConfig(guildId);

      // --------------------------------------
      // CONFIG CARGOS
      // --------------------------------------

      if (interaction.customId === 'config_cargos') {

        await interaction.reply({
          content:
            '👑 **CONFIGURAÇÃO DE CARGOS**\n\n' +
            'Configure cada cargo abaixo.\n\n' +
            '🔑 **Cargo Soltar Chave:**\n' +
            'Somente esse cargo poderá usar o botão **🔑 Soltar Chave** após a partida ser confirmada.',
          components: painelCargos(),
          ephemeral: true
        });

        return;
      }

      // --------------------------------------
      // CONFIG FILAS
      // --------------------------------------

      if (interaction.customId === 'config_filas') {

        await interaction.reply({
          content:
            '⚙️ **CONFIGURAÇÃO DAS FILAS**\n\n' +
            '🎮 Escolha o modo:',
          components: [
            painelModo(),
            painelPlataforma()
          ],
          ephemeral: true
        });

        return;
      }

      // --------------------------------------
      // VALORES
      // --------------------------------------

      if (interaction.customId === 'config_valores') {

        const modal = new ModalBuilder()
          .setCustomId('modal_valores')
          .setTitle('💰 Valores das Filas');

        const campo = new TextInputBuilder()
          .setCustomId('valores')
          .setLabel('Valores separados por vírgula')
          .setPlaceholder('20, 18, 15, 13, 10, 8, 5, 2.50, 1, 0.50')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder().addComponents(campo)
        );

        await interaction.showModal(modal);

        return;
      }

      // --------------------------------------
      // IMAGEM
      // --------------------------------------

      if (interaction.customId === 'config_imagem') {

        const modal = new ModalBuilder()
          .setCustomId('modal_imagem')
          .setTitle('🖼️ Imagens das Filas');

        const banner = new TextInputBuilder()
          .setCustomId('banner')
          .setLabel('Link do Banner')
          .setPlaceholder('https://...')
          .setStyle(TextInputStyle.Short)
          .setRequired(false);

        const thumbnail = new TextInputBuilder()
          .setCustomId('thumbnail')
          .setLabel('Link da Thumbnail')
          .setPlaceholder('https://...')
          .setStyle(TextInputStyle.Short)
          .setRequired(false);

        modal.addComponents(

          new ActionRowBuilder()
            .addComponents(banner),

          new ActionRowBuilder()
            .addComponents(thumbnail)

        );

        await interaction.showModal(modal);

        return;
      }

      // --------------------------------------
      // TAXA
      // --------------------------------------

      if (interaction.customId === 'config_taxa') {

        await interaction.reply({
          content:
            '🏦 **TAXA DA ORG**\n\n' +
            'Essa configuração fica apenas como informação/manual.\n\n' +
            '💰 Nenhuma transferência ou pagamento automático é realizado pelo bot.',
          ephemeral: true
        });

        return;
      }

      // ======================================
      // ENTRAR NA FILA
      // ======================================

      if (
        interaction.customId.startsWith('entrar_normal_') ||
        interaction.customId.startsWith('entrar_infinito_')
      ) {

        const valorTexto = interaction.customId
          .replace('entrar_normal_', '')
          .replace('entrar_infinito_', '');

        const valor = Number(valorTexto);

        const filaId = `${guildId}_${valor}`;

        if (!filas.has(filaId)) {
          filas.set(filaId, []);
        }

        const lista = filas.get(filaId);

        // Já está na fila
        if (lista.includes(interaction.user.id)) {

          await interaction.reply({
            content:
              '⚠️ **Você já está nessa fila!**',
            ephemeral: true
          });

          return;
        }

        // Fila cheia
        if (lista.length >= 2) {

          await interaction.reply({
            content:
              '❌ **Essa fila já está cheia!**',
            ephemeral: true
          });

          return;
        }

        // Adiciona jogador
        lista.push(interaction.user.id);

        await atualizarPainelFila(
          interaction.message,
          valor,
          lista,
          cfg
        );

        // ------------------------------------
        // PRIMEIRO JOGADOR
        // ------------------------------------

        if (lista.length === 1) {

          await interaction.reply({
            content:
              `🧊 **Você entrou na fila!**\n\n` +
              `💰 Valor: **R$ ${valor.toFixed(2).replace('.', ',')}**\n` +
              `👥 Jogadores: **1/2**`,
            ephemeral: true
          });

          return;
        }

        // ====================================
        // SEGUNDO JOGADOR
        // ====================================

        const jogadoresDaPartida = [...lista];

        // Limpa a fila imediatamente
        filas.set(filaId, []);

        await atualizarPainelFila(
          interaction.message,
          valor,
          [],
          cfg
        );

        await interaction.reply({
          content:
            '🎉 **Partida encontrada!**\n\n' +
            '🔒 Criando seu tópico privado...',
          ephemeral: true
        });

        // ====================================
        // CRIAR TÓPICO PRIVADO
        // ====================================

        let thread;

        try {

          thread = await interaction.channel.threads.create({
            name: 'aguardando',
            type: ChannelType.PrivateThread,
            invitable: false,
            reason: 'Partida encontrada na fila'
          });

        } catch (erro) {

          console.error(
            'Erro ao criar tópico privado:',
            erro
          );

          return;
        }

        // Adiciona os dois jogadores
        for (const jogadorId of jogadoresDaPartida) {

          try {
            await thread.members.add(jogadorId);
          } catch (erro) {
            console.log(
              `Não consegui adicionar ${jogadorId} ao tópico.`
            );
          }

        }

        // ====================================
        // BOTÕES DA PARTIDA
        // ====================================

        const botoesPartida =
          new ActionRowBuilder().addComponents(

            new ButtonBuilder()
              .setCustomId(`confirmar_partida_${thread.id}`)
              .setLabel('Confirmar')
              .setEmoji('✅')
              .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
              .setCustomId(`cancelar_partida_${thread.id}`)
              .setLabel('Cancelar')
              .setEmoji('❌')
              .setStyle(ButtonStyle.Danger)

          );

        await thread.send({
          content:
            `🎮 **SUA FILA FOI CRIADA!**\n\n` +
            `👥 Jogadores:\n` +
            `• <@${jogadoresDaPartida[0]}>\n` +
            `• <@${jogadoresDaPartida[1]}>\n\n` +
            `💰 **Valor:** R$ ${valor.toFixed(2).replace('.', ',')}\n` +
            `🎮 **Modo:** ${cfg.modo}\n` +
            `📱 **Plataforma:** ${cfg.plataforma}\n\n` +
            `⚠️ Os dois jogadores precisam confirmar a partida.`,
          components: [botoesPartida]
        });

        return;
      }

      // ======================================
      // SAIR DA FILA
      // ======================================

      if (interaction.customId.startsWith('sair_fila_')) {

        const valorTexto =
          interaction.customId.replace('sair_fila_', '');

        const valor = Number(valorTexto);

        const filaId = `${guildId}_${valor}`;

        const lista = filas.get(filaId) || [];

        const index = lista.indexOf(
          interaction.user.id
        );

        if (index === -1) {

          await interaction.reply({
            content:
              '❌ **Você não está nessa fila.**',
            ephemeral: true
          });

          return;
        }

        lista.splice(index, 1);

        filas.set(filaId, lista);

        await atualizarPainelFila(
          interaction.message,
          valor,
          lista,
          cfg
        );

        await interaction.reply({
          content:
            '🚪 **Você saiu da fila.**',
          ephemeral: true
        });

        return;
      }

      // ======================================
      // CONFIRMAR PARTIDA
      // ======================================

      if (
        interaction.customId.startsWith(
          'confirmar_partida_'
        )
      ) {

        if (
          !interaction.channel.isThread()
        ) {
          return;
        }

        if (
          !interaction.channel.name.includes(
            'aguardando'
          )
        ) {

          await interaction.reply({
            content:
              '❌ Essa partida não está mais aguardando confirmação.',
            ephemeral: true
          });

          return;
        }

        // Cria/recupera confirmações
        if (!interaction.channel.confirmacoes) {
          interaction.channel.confirmacoes = new Set();
        }

        const confirmacoes =
          interaction.channel.confirmacoes;

        // Já confirmou
        if (
          confirmacoes.has(
            interaction.user.id
          )
        ) {

          await interaction.reply({
            content:
              '⚠️ **Você já confirmou a partida!**',
            ephemeral: true
          });

          return;
        }

        // Confirma
        confirmacoes.add(
          interaction.user.id
        );

        await interaction.reply({
          content:
            '✅ **Você confirmou a partida!**',
            ephemeral: true
        });

        await interaction.channel.send({
          content:
            `✅ <@${interaction.user.id}> **confirmou a partida!**`
        });

        // ====================================
        // OS DOIS CONFIRMARAM
        // ====================================

        if (confirmacoes.size >= 2) {

          try {

            await interaction.channel.setName(
              '💰-pagar'
            );

          } catch (erro) {
            console.log(
              'Não consegui mudar o nome do tópico.'
            );
          }

          const cargoConfig =
            getCargos(guildId);

          const botaoChave =
            new ActionRowBuilder().addComponents(

              new ButtonBuilder()
                .setCustomId(
                  `soltar_chave_${interaction.channel.id}`
                )
                .setLabel('Soltar Chave')
                .setEmoji('🔑')
                .setStyle(ButtonStyle.Primary)

            );

          await interaction.channel.send({
            content:
              '💰 **Os dois jogadores confirmaram!**\n\n' +
              '🔑 O responsável pelo cargo **Soltar Chave** pode liberar a chave da partida.',
            components: [botaoChave]
          });

        }

        return;
      }

      // ======================================
      // CANCELAR PARTIDA
      // ======================================

      if (
        interaction.customId.startsWith(
          'cancelar_partida_'
        )
      ) {

        if (
          !interaction.channel.isThread()
        ) {
          return;
        }

        if (!interaction.channel.confirmacoes) {
          interaction.channel.confirmacoes =
            new Set();
        }

        const confirmacoes =
          interaction.channel.confirmacoes;

        // ====================================
        // SE JÁ CONFIRMOU, NÃO PODE CANCELAR
        // ====================================

        if (
          confirmacoes.has(
            interaction.user.id
          )
        ) {

          await interaction.reply({
            content:
              '❌ **Você já confirmou a partida e não pode mais cancelar.**',
            ephemeral: true
          });

          return;
        }

        await interaction.reply({
          content:
            '❌ **Partida cancelada.**\n\n' +
            '🗑️ Este tópico será fechado.',
          ephemeral: true
        });

        setTimeout(async () => {

          try {

            await interaction.channel.delete(
              'Partida cancelada por um jogador'
            );

          } catch (erro) {

            console.log(
              'Não consegui apagar o tópico.'
            );

          }

        }, 1000);

        return;
      }

      // ======================================
      // SOLTAR CHAVE
      // ======================================

      if (
        interaction.customId.startsWith(
          'soltar_chave_'
        )
      ) {

        const cargoConfig =
          getCargos(guildId);

        const cargoId =
          cargoConfig.soltarChave;

        // Cargo não configurado
        if (!cargoId) {

          await interaction.reply({
            content:
              '❌ **O Cargo Soltar Chave ainda não foi configurado.**',
            ephemeral: true
          });

          return;
        }

        // Verifica cargo do usuário
        if (
          !interaction.member.roles.cache.has(
            cargoId
          )
        ) {

          await interaction.reply({
            content:
              '❌ **Você não possui o cargo autorizado para soltar a chave.**',
            ephemeral: true
          });

          return;
        }

        await interaction.reply({
          content:
            '🔑 **Chave liberada!**\n\n' +
            '⚠️ O campo para cadastrar a chave será configurado posteriormente.',
          ephemeral: false
        });

        return;
      }
    }

    // ========================================
    // SELECT DE CARGOS
    // ========================================

    if (interaction.isRoleSelectMenu()) {

      const guildId = interaction.guild.id;
      const cargosConfig =
        getCargos(guildId);

      const cargoSelecionado =
        interaction.values[0];

      if (
        interaction.customId === 'cargo_dono'
      ) {

        cargosConfig.dono =
          cargoSelecionado;

        await interaction.reply({
          content:
            `👑 **Cargo Dono configurado:** <@&${cargoSelecionado}>`,
          ephemeral: true
        });

        return;
      }

      if (
        interaction.customId === 'cargo_subdono'
      ) {

        cargosConfig.subdono =
          cargoSelecionado;

        await interaction.reply({
          content:
            `🛡️ **Cargo Sub Dono configurado:** <@&${cargoSelecionado}>`,
          ephemeral: true
        });

        return;
      }

      if (
        interaction.customId === 'cargo_administrador'
      ) {

        cargosConfig.administrador =
          cargoSelecionado;

        await interaction.reply({
          content:
            `🔨 **Cargo Administrador configurado:** <@&${cargoSelecionado}>`,
          ephemeral: true
        });

        return;
      }

      if (
        interaction.customId === 'cargo_soltar_chave'
      ) {

        cargosConfig.soltarChave =
          cargoSelecionado;

        await interaction.reply({
          content:
            `🔑 **Cargo Soltar Chave configurado:** <@&${cargoSelecionado}>\n\n` +
            `Somente membros com esse cargo poderão usar o botão **🔑 Soltar Chave**.`,
          ephemeral: true
        });

        return;
      }
    }

    // ========================================
    // SELECT DE MODO
    // ========================================

    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === 'selecionar_modo'
    ) {

      const cfg =
        getConfig(interaction.guild.id);

      cfg.modo =
        interaction.values[0];

      await interaction.reply({
        content:
          `🎮 **Modo configurado para:** ${cfg.modo}\n\n` +
          `⚠️ Independente do modo escolhido, cada fila continua precisando de **2 jogadores** para criar o tópico privado.`,
        ephemeral: true
      });

      return;
    }

    // ========================================
    // SELECT DE PLATAFORMA
    // ========================================

    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === 'selecionar_plataforma'
    ) {

      const cfg =
        getConfig(interaction.guild.id);

      cfg.plataforma =
        interaction.values[0];

      await interaction.reply({
        content:
          `📱 **Plataforma configurada para:** ${cfg.plataforma}`,
        ephemeral: true
      });

      return;
    }

    // ========================================
    // MODAIS
    // ========================================

    if (interaction.isModalSubmit()) {

      const guildId =
        interaction.guild.id;

      const cfg =
        getConfig(guildId);

      // --------------------------------------
      // MODAL VALORES
      // --------------------------------------

      if (
        interaction.customId === 'modal_valores'
      ) {

        const texto =
          interaction.fields.getTextInputValue(
            'valores'
          );

        const valores = texto
          .split(',')
          .map(valor =>
            valor
              .trim()
              .replace('R$', '')
              .replace(/\s/g, '')
              .replace(',', '.')
          )
          .map(Number)
          .filter(valor =>
            !isNaN(valor) &&
            valor > 0
          );

        // Remove duplicados
        cfg.valores = [
          ...new Set(valores)
        ];

        // Ordena maior → menor
        cfg.valores.sort(
          (a, b) => b - a
        );

        await interaction.reply({
          content:
            '💰 **Valores salvos com sucesso!**\n\n' +
            cfg.valores
              .map(valor =>
                `R$ ${valor.toFixed(2).replace('.', ',')}`
              )
              .join('\n'),
          ephemeral: true
        });

        return;
      }

      // --------------------------------------
      // MODAL IMAGEM
      // --------------------------------------

      if (
        interaction.customId === 'modal_imagem'
      ) {

        const banner =
          interaction.fields.getTextInputValue(
            'banner'
          );

        const thumbnail =
          interaction.fields.getTextInputValue(
            'thumbnail'
          );

        cfg.banner =
          banner.trim();

        cfg.thumbnail =
          thumbnail.trim();

        await interaction.reply({
          content:
            '🖼️ **Imagens salvas com sucesso!**',
          ephemeral: true
        });

        return;
      }
    }

  } catch (erro) {

    console.error(
      'Erro na interação:',
      erro
    );

    try {

      if (interaction.replied || interaction.deferred) {

        await interaction.followUp({
          content:
            '❌ Ocorreu um erro ao executar essa ação.',
          ephemeral: true
        });

      } else {

        await interaction.reply({
          content:
            '❌ Ocorreu um erro ao executar essa ação.',
          ephemeral: true
        });

      }

    } catch (erroResposta) {
      console.log(
        'Não consegui enviar mensagem de erro.'
      );
    }
  }

});

// ==========================================
// LOGIN
// ==========================================

client.login(process.env.DISCORD_TOKEN);