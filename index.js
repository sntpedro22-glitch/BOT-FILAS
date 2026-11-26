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
      plataforma: 'Mobile',
      cor: '#E53935'
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
  return [
    new ActionRowBuilder().addComponents(

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
    ),

    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('config_cor_org')
        .setLabel('Cor da Org')
        .setEmoji('🎨')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId('config_perfil_bot')
        .setLabel('Config Perfil Bot')
        .setEmoji('🤖')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
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
      .map(jogador => `<@${jogador.id}>\n> ${jogador.tipo}`)
      .join('\n');
  }

  const normal = lista.filter(j => j.tipo === 'Normal').length;
  const ump = lista.filter(j => j.tipo === 'UMP e XM8').length;

  const embed = new EmbedBuilder()
    .setColor(cfg.cor || '#E53935')
    .setTitle('🎮 FILAS MOBILE')
    .setDescription(
      `🎮 **Modo:** ${cfg.modo}\n` +
      `📱 **Plataforma:** ${cfg.plataforma}\n` +
      `💰 **Valor:** R$ ${valor.toFixed(2).replace('.', ',')}\n\n` +
      `👥 **Jogadores: ${lista.length}/4**\n` +
      `🧊 **Normal:** ${normal}/2  |  🔫 **UMP e XM8:** ${ump}/2\n\n` +
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
      .setLabel('Normal')
      .setEmoji('🧊')
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId(`entrar_ump_${valor}`)
      .setLabel('Full Ump Xm8')
      .setEmoji('🔫')
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
          components: painelConfiguracao(),
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

        await apagarPainelsAntigos(interaction.channel);

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

        for (const valor of valores) {

          const filaId = `${interaction.guild.id}_${valor}`;

          filas.set(filaId, []);

          const embed = new EmbedBuilder()
            .setColor(cfg.cor || '#E53935')
            .setTitle('🎮 FILAS MOBILE')
            .setDescription(
              `🎮 **Modo:** ${cfg.modo}\n` +
              `📱 **Plataforma:** ${cfg.plataforma}\n` +
              `💰 **Valor:** R$ ${valor.toFixed(2).replace('.', ',')}\n\n` +
              `👥 **Jogadores: 0/4**\n` +
              `🧊 **Normal:** 0/2  |  🔫 **UMP e XM8:** 0/2\n\n` +
              `👤 **Ninguém entrou ainda.**\n\n` +
              `🎮 Escolha uma opção abaixo para entrar na fila!`
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
              .setLabel('Normal')
              .setEmoji('🧊')
              .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
              .setCustomId(`entrar_ump_${valor}`)
              .setLabel('Full Ump Xm8')
              .setEmoji('🔫')
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
      // COR DA ORG
      // --------------------------------------

      if (interaction.customId === 'config_cor_org') {

        const modal = new ModalBuilder()
          .setCustomId('modal_cor_org')
          .setTitle('🎨 Cor da Org');

        const cor = new TextInputBuilder()
          .setCustomId('cor')
          .setLabel('Digite a cor em HEX')
          .setPlaceholder('#FF0000')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder().addComponents(cor)
        );

        await interaction.showModal(modal);
        return;
      }

      // --------------------------------------
      // CONFIG PERFIL BOT
      // --------------------------------------

      if (interaction.customId === 'config_perfil_bot') {

        const modal = new ModalBuilder()
          .setCustomId('modal_perfil_bot')
          .setTitle('🤖 Config Perfil Bot');

        const foto = new TextInputBuilder()
          .setCustomId('foto')
          .setLabel('Adicionar link da foto')
          .setPlaceholder('https://...')
          .setStyle(TextInputStyle.Short)
          .setRequired(false);

        const bannerBot = new TextInputBuilder()
          .setCustomId('banner_bot')
          .setLabel('Adicionar link do banner')
          .setPlaceholder('https://...')
          .setStyle(TextInputStyle.Short)
          .setRequired(false);

        modal.addComponents(
          new ActionRowBuilder().addComponents(foto),
          new ActionRowBuilder().addComponents(bannerBot)
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
        interaction.customId.startsWith('entrar_ump_')
      ) {

        const isNormal = interaction.customId.startsWith('entrar_normal_');
        const prefix = isNormal ? 'entrar_normal_' : 'entrar_ump_';
        const valorTexto = interaction.customId.replace(prefix, '');
        const valor = Number(valorTexto);
        const tipo = isNormal ? 'Normal' : 'UMP e XM8';

        const filaId = `${guildId}_${valor}`;

        if (!filas.has(filaId)) {
          filas.set(filaId, []);
        }

        const lista = filas.get(filaId);

        if (lista.some(j => j.id === interaction.user.id)) {
          await interaction.reply({
            content: '⚠️ **Você já está nessa fila!**',
            ephemeral: true
          });
          return;
        }

        const mesmaModalidade = lista.filter(j => j.tipo === tipo);

        if (mesmaModalidade.length >= 2) {
          await interaction.reply({
            content: `❌ **A fila ${tipo} já está cheia!**`,
            ephemeral: true
          });
          return;
        }

        lista.push({ id: interaction.user.id, tipo });

        await atualizarPainelFila(interaction.message, valor, lista, cfg);

        if (mesmaModalidade.length === 0) {
          await interaction.reply({
            content:
              `🧊 **Você entrou na fila ${tipo}!**\n\n` +
              `💰 Valor: **R$ ${valor.toFixed(2).replace('.', ',')}**\n` +
              `🎮 Tipo: **${tipo}**\n` +
              `👥 Jogadores nessa modalidade: **1/2**`,
            ephemeral: true
          });
          return;
        }

        const jogadoresDaPartida = lista
          .filter(j => j.tipo === tipo)
          .slice(0, 2);

        filas.set(
          filaId,
          lista.filter(j => !jogadoresDaPartida.some(p => p.id === j.id))
        );

        await atualizarPainelFila(
          interaction.message,
          valor,
          filas.get(filaId),
          cfg
        );

        await interaction.reply({
          content:
            '🎉 **Partida encontrada!**\n\n' +
            `🎮 Tipo: **${tipo}**\n` +
            '🔒 Criando seu tópico privado...',
          ephemeral: true
        });

        let thread;

        try {
          thread = await interaction.channel.threads.create({
            name: 'aguardando',
            type: ChannelType.PrivateThread,
            invitable: false,
            reason: 'Partida encontrada na fila'
          });
        } catch (erro) {
          console.error('Erro ao criar tópico privado:', erro);
          return;
        }

        for (const jogador of jogadoresDaPartida) {
          try {
            await thread.members.add(jogador.id);
          } catch (erro) {
            console.log(`Não consegui adicionar ${jogador.id} ao tópico.`);
          }
        }

        const botoesPartida = new ActionRowBuilder().addComponents(
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
            `• <@${jogadoresDaPartida[0].id}>\n> ${jogadoresDaPartida[0].tipo}\n` +
            `• <@${jogadoresDaPartida[1].id}>\n> ${jogadoresDaPartida[1].tipo}\n\n` +
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

        const index = lista.findIndex(
          jogador => jogador.id === interaction.user.id
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

        if (!interaction.channel.confirmacoes) {
          interaction.channel.confirmacoes = new Set();
        }

        const confirmacoes =
          interaction.channel.confirmacoes;

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

        if (!cargoId) {

          await interaction.reply({
            content:
              '❌ **O Cargo Soltar Chave ainda não foi configurado.**',
            ephemeral: true
          });

          return;
        }

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

        cfg.valores = [
          ...new Set(valores)
        ];

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

      // --------------------------------------
      // MODAL COR DA ORG
      // --------------------------------------

      if (interaction.customId === 'modal_cor_org') {

        let cor =
          interaction.fields
            .getTextInputValue('cor')
            .trim();

        if (!/^#?[0-9A-Fa-f]{6}$/.test(cor)) {

          await interaction.reply({
            content:
              '❌ **Cor inválida!** Use o formato HEX, por exemplo `#FF0000`.',
            ephemeral: true
          });

          return;
        }

        if (!cor.startsWith('#')) {
          cor = `#${cor}`;
        }

        cfg.cor = cor;

        await interaction.reply({
          content:
            `🎨 **Cor da Org atualizada para:** ${cor}`,
          ephemeral: true
        });

        return;
      }

      // --------------------------------------
      // MODAL PERFIL BOT
      // --------------------------------------

      if (interaction.customId === 'modal_perfil_bot') {

        const foto =
          interaction.fields
            .getTextInputValue('foto')
            .trim();

        const bannerBot =
          interaction.fields
            .getTextInputValue('banner_bot')
            .trim();

        try {

          if (foto) {
            await client.user.setAvatar(foto);
          }

          if (bannerBot) {
            await client.user.setBanner(bannerBot);
          }

          await interaction.reply({
            content:
              '🤖 **Perfil do bot atualizado com sucesso!**\n\n' +
              (foto ? '🖼️ Foto atualizada.\n' : '') +
              (bannerBot ? '🎨 Banner atualizado.' : ''),
            ephemeral: true
          });

        } catch (erro) {

          console.error(
            'Erro ao atualizar perfil do bot:',
            erro
          );

          await interaction.reply({
            content:
              '❌ **Não consegui atualizar o perfil.** Verifique se os links da foto e do banner são válidos.',
            ephemeral: true
          });

        }

        return;
      }
    }

  } catch (erro) {

    console.error(
      'Erro na interação:',
      erro
    );

    try {

      if (
        interaction.replied ||
        interaction.deferred
      ) {

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