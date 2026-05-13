class JogoGorilas {
    constructor() {
        document.body.classList.add('menu-ativa');
        this.canvas = document.getElementById('jogo');
        this.ctx = this.canvas.getContext('2d');
        this.menuSkylineCanvas = document.getElementById('menu-skyline');
        this.menuSkylineCtx = this.menuSkylineCanvas?.getContext('2d');
        this.bufferCidade = document.createElement('canvas');
        this.bufferCidadeCtx = this.bufferCidade.getContext('2d');
        this.bufferColisao = document.createElement('canvas');
        this.bufferColisaoCtx = this.bufferColisao.getContext('2d');

        this.inicializarCanvas();
        this.inicializarEstado();
        this.carregarAssets();
        this.configurarEventos();
        this.configurarSkylineMenu();
        this.iniciarLoopSkylineMenu();
    }

    inicializarCanvas() {
        const larguraViewport = Math.max(820, window.innerWidth - 80);

        this.larguraTela = Math.max(820, Math.min(larguraViewport, 1280));
        this.alturaTela = Math.max(520, Math.min(Math.floor(window.innerHeight * 0.72), 820));

        this.canvas.width = this.larguraTela;
        this.canvas.height = this.alturaTela;
        this.bufferCidade.width = this.larguraTela;
        this.bufferCidade.height = this.alturaTela;
        this.bufferColisao.width = this.larguraTela;
        this.bufferColisao.height = this.alturaTela;
    }

    inicializarEstado() {
        this.cenasDoDia = this.criarCenasDoDia();
        this.assetsCarregados = false;
        this.anguloAtual = 45;
        this.velocidadeAtual = 50;
        this.loopIniciado = false;
        this.animacaoAcerto = null;
        this.rastro = [];
        this.particulas = [];
        this.impactosVisuais = [];
        this.crateras = [];
        this.efeitoLancamento = null;
        this.feedbackDuelo = null;
        this.screenShake = { tempo: 0, duracao: 0, forca: 0, x: 0, y: 0 };
        this.estrelas = [];
        this.audioCtx = null;
        this.audioMasterGain = null;
        this.audioSfxGain = null;
        this.audioAmbienceGain = null;
        this.menuAmbience = null;
        this.viewportCompativel = true;

        this.game = {
            iniciado: false,
            jogadorAtual: 1,
            gravidade: 9.8,
            vento: 0,
            astroAtingido: false,
            ultimoTempo: 0,
            modoIA: false,
            dificuldadeIA: 'medio',
            mostrarTrajetoria: true,
            rodada: 0,
            indiceCenaDoDia: 0,
            cpuPensando: false
        };

        this.jogadores = {
            1: { nome: 'Jogador 1', pontos: 0, angulo: 45, velocidade: 50 },
            2: { nome: 'Jogador 2', pontos: 0, angulo: 45, velocidade: 50 }
        };

        this.gorilas = {
            1: { x: 0, y: 0, largura: 64, altura: 64, vivo: true },
            2: { x: 0, y: 0, largura: 64, altura: 64, vivo: true }
        };

        this.city = {
            predios: [],
            fundoDistante: [],
            fundoMedio: [],
            primeiroPlano: []
        };

        this.nuvens = [];
        this.menuSkyline = [];
        this.menuNuvens = [];
        this.menuRuas = [];
        this.menuCarros = [];
        this.projectile = this.criarEstadoProjetil();
        this.atualizarEscalasFisicas();
    }

    criarEstadoProjetil() {
        return {
            ativo: false,
            jogador: null,
            origemX: 0,
            origemY: 0,
            anguloGraus: 0,
            anguloRadianos: 0,
            velocidade: 0,
            velocidadeX: 0,
            velocidadeY: 0,
            tempoVoo: 0,
            x: 0,
            y: 0,
            rotacao: 0
        };
    }

    atualizarEscalasFisicas() {
        this.escalaFisica = {
            velocidade: this.larguraTela / 185,
            gravidade: this.alturaTela / 52,
            vento: this.larguraTela / 180,
            raioExplosao: Math.max(24, Math.round(this.larguraTela / 28))
        };
    }

    criarCenasDoDia() {
        return [
            {
                id: '16:00',
                titulo: 'Tarde',
                astro: 'sol',
                astroPos: { x: 0.72, y: 0.19 },
                sky: ['#2457a6', '#4f8ef7', '#f7ae64', '#f28a63'],
                nightFactor: 0.1,
                stars: 0,
                astroGlow: 0.34,
                horizonGlow: 0.18
            },
            {
                id: '18:00',
                titulo: 'Por do Sol',
                astro: 'sol',
                astroPos: { x: 0.83, y: 0.38 },
                sky: ['#1f3f82', '#4e6cc9', '#ffaf65', '#ff7f5f'],
                nightFactor: 0.22,
                stars: 0.02,
                astroGlow: 0.44,
                horizonGlow: 0.34
            },
            {
                id: '19:00',
                titulo: 'Crepusculo',
                astro: 'nenhum',
                astroPos: { x: 0.86, y: 0.42 },
                sky: ['#173469', '#375caa', '#9b6687', '#4f4363'],
                nightFactor: 0.48,
                stars: 0.18,
                astroGlow: 0,
                horizonGlow: 0.24
            },
            {
                id: '21:00',
                titulo: 'Noite',
                astro: 'lua',
                astroPos: { x: 0.74, y: 0.2 },
                sky: ['#07142a', '#16376d', '#294b93', '#4f4d72'],
                nightFactor: 0.78,
                stars: 0.62,
                astroGlow: 0.18,
                horizonGlow: 0.08
            },
            {
                id: '00:00',
                titulo: 'Madrugada',
                astro: 'lua',
                astroPos: { x: 0.48, y: 0.13 },
                sky: ['#040a17', '#0b1d40', '#183565', '#2f3f69'],
                nightFactor: 1,
                stars: 0.92,
                astroGlow: 0.12,
                horizonGlow: 0.02
            },
            {
                id: '04:30',
                titulo: 'Pre Amanhecer',
                astro: 'lua',
                astroPos: { x: 0.18, y: 0.24 },
                sky: ['#06101e', '#12284f', '#294063', '#4d5676'],
                nightFactor: 0.88,
                stars: 0.58,
                astroGlow: 0.1,
                horizonGlow: 0.1
            },
            {
                id: '06:00',
                titulo: 'Amanhecer',
                astro: 'nenhum',
                astroPos: { x: 0.14, y: 0.44 },
                sky: ['#183163', '#4d77b8', '#f4b68c', '#e8a28a'],
                nightFactor: 0.3,
                stars: 0.08,
                astroGlow: 0,
                horizonGlow: 0.32
            },
            {
                id: '09:00',
                titulo: 'Manha',
                astro: 'sol',
                astroPos: { x: 0.28, y: 0.21 },
                sky: ['#2b5bab', '#73b3ff', '#c9defd', '#edf2ff'],
                nightFactor: 0.02,
                stars: 0,
                astroGlow: 0.28,
                horizonGlow: 0.06
            },
            {
                id: '12:00',
                titulo: 'Meio Dia',
                astro: 'sol',
                astroPos: { x: 0.5, y: 0.11 },
                sky: ['#3d74d0', '#8ec6ff', '#d8ebff', '#f4f8ff'],
                nightFactor: 0,
                stars: 0,
                astroGlow: 0.26,
                horizonGlow: 0
            }
        ];
    }

    obterCenaAtual() {
        const indice = this.game?.indiceCenaDoDia ?? 0;
        return this.cenasDoDia[indice] || this.cenasDoDia[0];
    }

    avancarCenaDoDia() {
        this.game.indiceCenaDoDia = (this.game.indiceCenaDoDia + 1) % this.cenasDoDia.length;
    }

    carregarAssets() {
        this.sprites = {
            gorila: {
                imagem: new Image(),
                larguraQuadro: 256,
                alturaQuadro: 256,
                escalaDesenho: 0.42,
                ancoraPe: 0.5,
                ancoraMao: {
                    esquerda: { x: 0.8, y: 0.08 },
                    direita: { x: 0.2, y: 0.08 }
                },
                hitbox: {
                    zonas: [
                        { x: 0.5, y: 0.3, raio: 22 },
                        { x: 0.5, y: 0.55, raio: 28 },
                        { x: 0.38, y: 0.82, raio: 18 },
                        { x: 0.62, y: 0.82, raio: 18 }
                    ]
                },
                poses: {
                    idle: 0,
                    antecipacaoEsquerda: 1,
                    lancamentoEsquerdo: 2,
                    retornoEsquerdo: 3,
                    antecipacaoDireita: 4,
                    lancamentoDireita: 5,
                    retornoDireita: 6,
                    comemoracaoA: 7,
                    comemoracaoB: 8,
                    susto: 9
                }
            },
            banana: {
                imagem: new Image(),
                larguraQuadro: 16,
                alturaQuadro: 16,
                totalQuadros: 4
            },
            sol: {
                imagem: new Image(),
                larguraQuadro: 32,
                alturaQuadro: 32,
                expressoes: {
                    sorrindo: 0,
                    surpreso: 1
                }
            },
            lua: {
                imagem: new Image(),
                larguraQuadro: 32,
                alturaQuadro: 32,
                expressoes: {
                    sorrindo: 0,
                    surpreso: 1
                },
                disponivel: false
            }
        };

        let imagensCarregadas = 0;
        const totalImagens = 4;

        const verificarCarregamento = () => {
            imagensCarregadas += 1;
            if (imagensCarregadas === totalImagens) {
                this.assetsCarregados = true;
                this.desenhar();
            }
        };

        const tratarErroImagem = (erro) => {
            console.error('Erro ao carregar imagem:', erro);
            verificarCarregamento();
        };

        this.sprites.gorila.imagem.onload = verificarCarregamento;
        this.sprites.banana.imagem.onload = verificarCarregamento;
        this.sprites.sol.imagem.onload = () => {
            this.sprites.sol.disponivel = true;
            verificarCarregamento();
        };
        this.sprites.lua.imagem.onload = () => {
            this.sprites.lua.disponivel = true;
            verificarCarregamento();
        };

        this.sprites.gorila.imagem.onerror = tratarErroImagem;
        this.sprites.banana.imagem.onerror = tratarErroImagem;
        this.sprites.sol.imagem.onerror = tratarErroImagem;
        this.sprites.lua.imagem.onerror = tratarErroImagem;

        this.sprites.gorila.imagem.src = 'assets/gorila.png';
        this.sprites.banana.imagem.src = 'assets/banana.png';
        this.sprites.sol.imagem.src = 'assets/sol.png';
        this.sprites.lua.imagem.src = 'assets/lua.png';
    }

    obterConfigGorila() {
        return this.sprites?.gorila || {
            larguraQuadro: 64,
            alturaQuadro: 64,
            escalaDesenho: 1,
            ancoraPe: 0.5,
            ancoraMao: {
                esquerda: { x: 0.72, y: 0.22 },
                direita: { x: 0.28, y: 0.22 }
            },
            hitbox: {
                raio: 20,
                offsetY: 0.5
            }
        };
    }

    obterDimensoesRenderGorila() {
        const gorila = this.obterConfigGorila();
        const escala = gorila.escalaDesenho || 1;
        return {
            largura: gorila.larguraQuadro * escala,
            altura: gorila.alturaQuadro * escala
        };
    }

    viewportSuportado() {
        const menorLado = Math.min(window.innerWidth, window.innerHeight);
        const maiorLado = Math.max(window.innerWidth, window.innerHeight);
        const paisagem = window.innerWidth >= window.innerHeight;
        return paisagem && maiorLado >= 900 && menorLado >= 620;
    }

    atualizarAvisosViewport() {
        this.viewportCompativel = this.viewportSuportado();
        const avisoMenu = document.getElementById('aviso-viewport');
        const avisoJogo = document.getElementById('aviso-jogo-viewport');
        if (avisoMenu) {
            avisoMenu.classList.toggle('escondido', this.viewportCompativel);
        }
        if (avisoJogo) {
            avisoJogo.classList.toggle('escondido', this.viewportCompativel);
        }
    }

    configurarEventos() {
        const btnLancar = document.getElementById('lancar');
        const btnIniciar = document.getElementById('iniciar');
        const btnMenu = document.getElementById('btn-menu');
        const btnVoltarMenuJogo = document.getElementById('btn-voltar-menu-jogo');
        this.atualizarAvisosViewport();

        // As atualizações dos valores ocorrem na hora do lançamento (iniciarArremesso)

        const btnModoHxH = document.getElementById('modo-hxh');
        const btnModoHxM = document.getElementById('modo-hxm');
        if (btnModoHxH) btnModoHxH.addEventListener('click', () => {
            this.atualizarAmbiencia('menu');
            this._selecionarModo('hxh');
        });
        if (btnModoHxM) btnModoHxM.addEventListener('click', () => {
            this.atualizarAmbiencia('menu');
            this._selecionarModo('hxm');
        });

        btnIniciar.addEventListener('click', () => {
            this.atualizarAmbiencia('menu');
            this.iniciarJogo();
        });
        btnLancar.addEventListener('click', () => this.iniciarArremesso());
        btnMenu.addEventListener('click', () => this.voltarAoMenu());
        if (btnVoltarMenuJogo) {
            btnVoltarMenuJogo.addEventListener('click', () => this.voltarAoMenu());
        }

        document.addEventListener('keydown', (evento) => {
            if (evento.code === 'Space' && this.game.iniciado && !this.projectile.ativo && !this.animacaoAcerto) {
                evento.preventDefault();
                this.iniciarArremesso();
            }
        });

        // Setas ↑↓ nos campos de ângulo/velocidade incrementam/decrementam os valores
        // Shift+Seta avança de 5 em 5; sem Shift avança de 1 em 1
        document.querySelectorAll('#angulo1, #velocidade1, #angulo2, #velocidade2').forEach(input => {
            input.addEventListener('keydown', (e) => {
                if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
                e.preventDefault();
                e.stopPropagation();
                const passo = e.shiftKey ? 5 : 1;
                const valor = parseInt(input.value, 10) || 0;
                const min = parseInt(input.min, 10);
                const max = parseInt(input.max, 10);
                input.value = e.key === 'ArrowUp'
                    ? Math.min(max, valor + passo)
                    : Math.max(min, valor - passo);
            });
        });

        // Sincronizar range slider ↔ input number para velocidade
        ['1', '2'].forEach(n => {
            const numAng = document.getElementById(`angulo${n}`);
            const rangeAng = document.getElementById(`angulo-range${n}`);
            const numVel = document.getElementById(`velocidade${n}`);
            const rangeVel = document.getElementById(`velocidade-range${n}`);
            if (numAng && rangeAng) {
                numAng.addEventListener('input', () => { rangeAng.value = numAng.value; });
                rangeAng.addEventListener('input', () => { numAng.value = rangeAng.value; });
            }
            if (numVel && rangeVel) {
                numVel.addEventListener('input', () => { rangeVel.value = numVel.value; });
                rangeVel.addEventListener('input', () => { numVel.value = rangeVel.value; });
            }
        });

        // Swipe no canvas: ↕ muda ângulo, ↔ muda velocidade
        let _touchUltimoX = 0, _touchUltimoY = 0;
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            _touchUltimoX = e.touches[0].clientX;
            _touchUltimoY = e.touches[0].clientY;
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.game.iniciado || this.projectile.ativo || this.animacaoAcerto) return;
            if (this.game.modoIA && this.game.jogadorAtual === 2) return;

            const dx = e.touches[0].clientX - _touchUltimoX;
            const dy = e.touches[0].clientY - _touchUltimoY;
            _touchUltimoX = e.touches[0].clientX;
            _touchUltimoY = e.touches[0].clientY;

            const j = this.game.jogadorAtual;
            const inpAng = document.getElementById(`angulo${j}`);
            const inpVel = document.getElementById(`velocidade${j}`);
            const rangeAng = document.getElementById(`angulo-range${j}`);
            const rangeVel = document.getElementById(`velocidade-range${j}`);
            if (!inpAng || !inpVel) return;

            if (Math.abs(dy) >= Math.abs(dx)) {
                // vertical → ângulo
                const novoAng = Math.max(0, Math.min(360, (parseInt(inpAng.value, 10) || 45) - dy * 0.5));
                inpAng.value = Math.round(novoAng);
                if (rangeAng) rangeAng.value = inpAng.value;
            } else {
                // horizontal → velocidade
                const novaVel = Math.max(1, Math.min(100, (parseInt(inpVel.value, 10) || 50) + dx * 0.3));
                inpVel.value = Math.round(novaVel);
                if (rangeVel) rangeVel.value = inpVel.value;
            }
        }, { passive: false });

        const _redimensionar = () => {
            this.inicializarCanvas();
            this.atualizarEscalasFisicas();
            this.atualizarAvisosViewport();
            this.configurarSkylineMenu();

            if (this.game.iniciado) {
                this.gerarCidade();
                this.gerarNuvens();
                this.posicionarGorilas();
            }

            this.desenhar();
        };

        window.addEventListener('resize', _redimensionar);
        // orientationchange no iOS dispara antes do viewport atualizar; o timeout aguarda a mudança
        window.addEventListener('orientationchange', () => setTimeout(_redimensionar, 200));
    }

    voltarAoMenu() {
        this.transicionarTela(document.getElementById('tela-jogo'), document.getElementById('tela-inicial'));
        this.ocultarTelaImediata(document.getElementById('tela-vitoria'));
        document.body.classList.add('menu-ativa');

        this.game.iniciado = false;
        this.game.ultimoTempo = 0;
        this.game.cpuPensando = false;
        this.animacaoAcerto = null;
        this.projectile = this.criarEstadoProjetil();
        this.rastro = [];
        this.particulas = [];
        this.impactosVisuais = [];
        this.feedbackDuelo = null;
        this.efeitoLancamento = null;
        this.screenShake = { tempo: 0, duracao: 0, forca: 0, x: 0, y: 0 };
        this.game.astroAtingido = false;
        this.game.indiceCenaDoDia = 0;
        this.atualizarAmbiencia('menu');
    }

    ocultarTelaImediata(tela) {
        if (!tela) return;
        tela.style.display = 'none';
        tela.style.opacity = '0';
        tela.classList.add('escondido');
        tela.classList.remove('tela-ativa');
    }

    revelarTelaImediata(tela) {
        if (!tela) return;
        tela.style.display = '';
        tela.classList.remove('escondido');
        tela.classList.add('tela-ativa');
        tela.style.opacity = '1';
    }

    transicionarTela(telaSaindo, telaEntrando) {
        if (!telaEntrando) return;

        this.revelarTelaImediata(telaEntrando);
        telaEntrando.classList.add('tela-transicao');
        telaEntrando.style.opacity = '0';

        requestAnimationFrame(() => {
            telaEntrando.style.opacity = '1';
        });

        if (telaSaindo) {
            telaSaindo.classList.add('tela-transicao');
            telaSaindo.style.opacity = '0';
            setTimeout(() => this.ocultarTelaImediata(telaSaindo), 220);
        }

        setTimeout(() => {
            telaEntrando.classList.remove('tela-transicao');
            telaEntrando.style.opacity = '';
            if (telaSaindo) {
                telaSaindo.classList.remove('tela-transicao');
                telaSaindo.style.opacity = '';
            }
        }, 240);
    }

    iniciarJogo() {
        try {
            this.atualizarAvisosViewport();
            if (!this.viewportCompativel) {
                alert('Esta versão foi feita para desktop ou tablet em modo paisagem.');
                return;
            }

            const jogador1 = document.getElementById('jogador1').value || 'Jogador 1';
            const jogador2 = document.getElementById('jogador2').value || 'Jogador 2';
            const gravidadeInformada = Number(document.getElementById('gravidade').value);
            // Captura rigorosa do limite de pontos como inteiro positivo
            const limitePontos = parseInt(document.getElementById('pontosVencer').value, 10) || 3;
            const modoIA = document.getElementById('modo-hxm').classList.contains('ativo');
            const dificuldadeIA = document.getElementById('dificuldade').value || 'medio';

            this.jogadores = {
                1: { nome: jogador1, pontos: 0, angulo: 45, velocidade: 50 },
                2: { nome: jogador2, pontos: 0, angulo: 45, velocidade: 50 }
            };

            this.game.iniciado = true;
            this.game.jogadorAtual = 1;
            this.game.gravidade = gravidadeInformada > 0 ? gravidadeInformada : 9.8;
            this.game.limitePontos = limitePontos;
            this.game.modoIA = modoIA;
            this.game.dificuldadeIA = dificuldadeIA;
            this.game.astroAtingido = false;
            this.game.mostrarTrajetoria = document.getElementById('mostrarTrajetoria')?.checked ?? true;
            this.game.rodada = 0;
            this.game.indiceCenaDoDia = 0;
            this.game.cpuPensando = false;
            this.projectile = this.criarEstadoProjetil();
            this.animacaoAcerto = null;
            this.rastro = [];
            this.particulas = [];
            this.impactosVisuais = [];
            this.crateras = [];
            this.efeitoLancamento = null;
            this.feedbackDuelo = null;
            this.screenShake = { tempo: 0, duracao: 0, forca: 0, x: 0, y: 0 };
            this.gerarEstrelas();

            const telaInicial = document.getElementById('tela-inicial');
            const telaVitoria = document.getElementById('tela-vitoria');
            const telaJogo = document.getElementById('tela-jogo');

            this.ocultarTelaImediata(telaVitoria);
            this.transicionarTela(telaInicial, telaJogo);
            document.body.classList.remove('menu-ativa');
            this.atualizarAmbiencia('jogo');

            this.inicializarCanvas();
            this.atualizarEscalasFisicas();
            this.gerarCidade();
            this.posicionarGorilas();
            this.sortearVento();
            this.atualizarHUD();
            this.desenhar();

            if (!this.loopIniciado) {
                this.iniciarLoop();
            }
            
            console.log("Jogo inicializado com sucesso!");
        } catch (erro) {
            console.error(erro);
            alert("Erro ao iniciar jogo: " + erro.message);
        }
    }

    iniciarLoop() {
        this.loopIniciado = true;
        this.game.ultimoTempo = 0;

        const loop = (tempoAtual) => {
            if (!this.game.iniciado) {
                requestAnimationFrame(loop);
                return;
            }

            if (!this.game.ultimoTempo) {
                this.game.ultimoTempo = tempoAtual;
            }

            const delta = Math.min((tempoAtual - this.game.ultimoTempo) / 1000, 0.05);
            this.game.ultimoTempo = tempoAtual;

            this.atualizar(delta);
            
            // Só desenha se o jogo ainda estiver ativo após o atualizar
            // (atualizar pode chamar exibirVitoria que seta game.iniciado = false)
            if (this.game.iniciado) {
                this.desenhar();
            }
            requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
    }

    atualizar(delta) {
        if (this.animacaoAcerto) {
            this.atualizarAnimacaoAcerto(delta);
        }

        this.atualizarEfeitoLancamento(delta);

        if (this.projectile.ativo) {
            this.atualizarProjetil(delta);
        }

        this.atualizarNuvens(delta);
        this.atualizarParticulas(delta);
        this.atualizarScreenShake(delta);
        this.atualizarImpactosVisuais(delta);
        this.atualizarFeedbackDuelo(delta);

        // Animar os "..." do status da CPU no DOM
        if (this.game.cpuPensando) {
            const statusEl = document.getElementById('status-turno');
            if (statusEl) {
                const dots = '.'.repeat(Math.floor(Date.now() / 350) % 4);
                statusEl.textContent = `CPU pensando${dots}`;
            }
        }
    }

    atualizarEfeitoLancamento(delta) {
        if (!this.efeitoLancamento) {
            return;
        }

        this.efeitoLancamento.tempo += delta;
        if (this.efeitoLancamento.tempo >= this.efeitoLancamento.duracao) {
            this.efeitoLancamento = null;
        }
    }

    atualizarScreenShake(delta) {
        if (this.screenShake.tempo <= 0) {
            this.screenShake.x = 0;
            this.screenShake.y = 0;
            return;
        }

        this.screenShake.tempo = Math.max(0, this.screenShake.tempo - delta);
        const intensidade = this.screenShake.tempo / Math.max(0.001, this.screenShake.duracao);
        const amplitude = this.screenShake.forca * intensidade;
        this.screenShake.x = (Math.random() * 2 - 1) * amplitude;
        this.screenShake.y = (Math.random() * 2 - 1) * amplitude * 0.7;
    }

    aplicarScreenShake(forca = 0, duracao = 0) {
        this.screenShake = {
            tempo: duracao,
            duracao,
            forca,
            x: 0,
            y: 0
        };
    }

    atualizarFeedbackDuelo(delta) {
        if (!this.feedbackDuelo) {
            return;
        }

        this.feedbackDuelo.tempo -= delta;
        if (this.feedbackDuelo.tempo <= 0) {
            this.feedbackDuelo = null;
            this.atualizarHUD();
            return;
        }

        const statusEl = document.getElementById('status-turno');
        if (statusEl && !this.game.cpuPensando) {
            statusEl.textContent = this.feedbackDuelo.texto;
        }
    }

    atualizarNuvens(delta) {
        // Reduzida velocidade base: 0.15 -> 0.05 e removido multiplicador fixo alto (*100 -> *30)
        const fatorVento = this.game.vento * 0.05;
        const agora = performance.now() / 1000;

        this.nuvens.forEach(nuvem => {
            // Movimento sutil e suave
            nuvem.x += (fatorVento * nuvem.velocidadeMult) * delta * 30;
            nuvem.y = nuvem.yBase + Math.sin(agora * nuvem.flutuacaoVelocidade + nuvem.flutuacaoFase) * nuvem.flutuacaoAmplitude;

            // Wrapping: se a nuvem sumir de um lado, volta pelo outro
            const margem = nuvem.larguraTotal * (nuvem.escalaBaseX || 1) + 40;
            if (nuvem.x > this.larguraTela + margem) {
                nuvem.x = -margem;
            } else if (nuvem.x < -margem) {
                nuvem.x = this.larguraTela + margem;
            }
        });
    }

    atualizarAnimacaoAcerto(delta) {
        this.animacaoAcerto.tempo += delta;

        if (this.animacaoAcerto.tempo >= this.animacaoAcerto.duracao) {
            const vencedor = this.animacaoAcerto.vencedor;
            this.animacaoAcerto = null;
            this.reiniciarRodada(vencedor);
        }
    }

    gerarCidade() {
        const larguraMin = Math.max(44, Math.floor(this.larguraTela / 18));
        const larguraMax = Math.max(larguraMin + 8, Math.floor(this.larguraTela / 10));
        const alturaMin = Math.max(90, Math.floor(this.alturaTela * 0.22));
        const alturaMax = Math.max(alturaMin + 80, Math.floor(this.alturaTela * 0.78));
        const baseChao = this.alturaTela - 12;

        this.city.predios = [];

        let x = 0;
        while (x < this.larguraTela) {
            const largura = Math.min(
                this.larguraTela - x,
                this.numeroAleatorio(larguraMin, larguraMax)
            );
            const altura = this.numeroAleatorio(alturaMin, alturaMax);
            const yTopo = baseChao - altura;
            const predio = { x, largura, altura, yTopo };
            this.gerarDetalhesPredio(predio);
            this.city.predios.push(predio);
            x += largura + this.numeroAleatorio(2, 7);
        }

        this.gerarCamadasCenicas();
        this.desenharCidadeNoBuffer();
        if (this.nuvens.length === 0) {
            this.gerarNuvens();
        }
    }

    gerarDetalhesPredio(predio) {
        const larguraJanela = Math.max(6, Math.floor(predio.largura / 6));
        const alturaJanela = Math.max(10, Math.floor(this.alturaTela / 28));
        const espacamentoX = larguraJanela + 5;
        const espacamentoY = alturaJanela + 9;
        const janelasFrontais = [];

        for (let janelaX = predio.x + 6; janelaX <= predio.x + predio.largura - larguraJanela - 4; janelaX += espacamentoX) {
            for (let janelaY = predio.yTopo + 8; janelaY <= predio.yTopo + predio.altura - alturaJanela - 6; janelaY += espacamentoY) {
                janelasFrontais.push({
                    x: janelaX,
                    y: janelaY,
                    largura: larguraJanela,
                    altura: alturaJanela,
                    acesa: Math.random() < 0.52
                });
            }
        }

        const profundidade = Math.max(10, Math.floor(predio.largura * 0.16));
        const larguraJanelaLateral = Math.max(3, Math.floor(larguraJanela * 0.55));
        const espacamentoLateralY = alturaJanela + 12;
        const espacamentoLateralX = larguraJanelaLateral + 3;
        const janelasLaterais = [];

        for (let janelaX = predio.x + predio.largura + 2; janelaX <= predio.x + predio.largura + profundidade - larguraJanelaLateral; janelaX += espacamentoLateralX) {
            for (let janelaY = predio.yTopo + 10; janelaY <= predio.yTopo + predio.altura - alturaJanela - 8; janelaY += espacamentoLateralY) {
                janelasLaterais.push({
                    x: janelaX,
                    y: janelaY,
                    largura: larguraJanelaLateral,
                    altura: alturaJanela - 2,
                    acesa: Math.random() < 0.35
                });
            }
        }

        predio.janelasFrontais = janelasFrontais;
        predio.janelasLaterais = janelasLaterais;
    }

    gerarCamadasCenicas() {
        const criarFaixa = (quantidade, baseAltura, variacao, larguraMinFaixa, larguraMaxFaixa) => {
            const faixa = [];
            let x = -40;
            for (let i = 0; i < quantidade; i += 1) {
                const largura = this.numeroAleatorio(larguraMinFaixa, larguraMaxFaixa);
                const altura = Math.max(40, baseAltura + this.numeroAleatorio(-variacao, variacao));
                const item = {
                    x,
                    largura,
                    altura,
                    yTopo: this.alturaTela - altura - this.numeroAleatorio(20, 60)
                };
                item.luzes = this.gerarLuzesFaixa(item);
                faixa.push(item);
                x += largura * (0.65 + Math.random() * 0.45);
                if (x > this.larguraTela + 60) break;
            }
            return faixa;
        };

        this.city.fundoDistante = criarFaixa(
            18,
            Math.floor(this.alturaTela * 0.24),
            Math.floor(this.alturaTela * 0.08),
            Math.max(60, Math.floor(this.larguraTela / 18)),
            Math.max(110, Math.floor(this.larguraTela / 10))
        );

        this.city.fundoMedio = criarFaixa(
            16,
            Math.floor(this.alturaTela * 0.34),
            Math.floor(this.alturaTela * 0.1),
            Math.max(70, Math.floor(this.larguraTela / 16)),
            Math.max(140, Math.floor(this.larguraTela / 8))
        );

        this.city.primeiroPlano = criarFaixa(
            14,
            Math.floor(this.alturaTela * 0.18),
            Math.floor(this.alturaTela * 0.08),
            Math.max(55, Math.floor(this.larguraTela / 20)),
            Math.max(130, Math.floor(this.larguraTela / 9))
        );
    }

    gerarLuzesFaixa(item) {
        const luzes = [];
        const colunas = Math.max(2, Math.floor(item.largura / 18));
        const linhas = Math.max(2, Math.floor(item.altura / 26));
        const larguraJanela = Math.max(2, Math.floor(item.largura / (colunas * 2.2)));
        const alturaJanela = Math.max(3, Math.floor(item.altura / (linhas * 3.2)));
        const passoX = item.largura / (colunas + 1);
        const passoY = item.altura / (linhas + 1);

        for (let cx = 1; cx <= colunas; cx += 1) {
            for (let cy = 1; cy <= linhas; cy += 1) {
                if (Math.random() < 0.42) {
                    luzes.push({
                        x: item.x + cx * passoX - larguraJanela / 2,
                        y: item.yTopo + cy * passoY - alturaJanela / 2,
                        largura: larguraJanela,
                        altura: alturaJanela,
                        intensidade: 0.22 + Math.random() * 0.42
                    });
                }
            }
        }

        return luzes;
    }

    configurarSkylineMenu() {
        if (!this.menuSkylineCanvas || !this.menuSkylineCtx) {
            return;
        }

        const largura = Math.max(1280, Math.floor(window.innerWidth));
        const altura = Math.max(720, Math.floor(window.innerHeight));
        this.menuSkylineCanvas.width = largura;
        this.menuSkylineCanvas.height = altura;
        this.gerarSkylineMenu();
        this.desenharSkylineMenu();
    }

    gerarSkylineMenu() {
        const largura = this.menuSkylineCanvas?.width || 1160;
        const altura = this.menuSkylineCanvas?.height || 760;
        const baseMuitoDistante = Math.floor(altura * 0.76);
        const baseDistante = Math.floor(altura * 0.82);
        const baseMedia = Math.floor(altura * 0.89);
        const baseFrente = Math.floor(altura * 0.95);
        const gerarFaixa = (yBase, alturaMin, alturaMax, larguraMin, larguraMax, deslocamentoX = 0) => {
            const faixa = [];
            let x = -20 + deslocamentoX;
            while (x < largura + 30) {
                const predio = {
                    x,
                    largura: this.numeroAleatorio(larguraMin, larguraMax),
                    altura: this.numeroAleatorio(alturaMin, alturaMax)
                };
                predio.yTopo = yBase - predio.altura;
                predio.luzes = this.gerarLuzesFaixa(predio).map((luz) => ({
                    ...luz,
                    cintila: Math.random() < 0.035,
                    fase: Math.random() * Math.PI * 2
                }));
                faixa.push(predio);
                x += predio.largura + this.numeroAleatorio(6, 18);
            }
            return faixa;
        };

        this.menuSkyline = [
            {
                nome: 'distante',
                deslocamentoY: 0,
                alpha: 0.18,
                predios: gerarFaixa(baseMuitoDistante, 18, 58, 16, 42)
            },
            {
                nome: 'distante',
                deslocamentoY: 0,
                alpha: 0.32,
                predios: gerarFaixa(baseDistante, 26, 86, 22, 58)
            },
            {
                nome: 'medio',
                deslocamentoY: 0,
                alpha: 0.48,
                predios: gerarFaixa(baseMedia, 34, 124, 28, 72, 18)
            },
            {
                nome: 'frente',
                deslocamentoY: 0,
                alpha: 1.0,
                predios: gerarFaixa(baseFrente, 42, 146, 34, 84, 8)
            }
        ];

        this.menuRuas = [
            { y: altura * 0.878, h: Math.max(20, altura * 0.030), alpha: 0.92, velocidadeBase: 16 },
            { y: altura * 0.950, h: Math.max(28, altura * 0.044), alpha: 0.98, velocidadeBase: 28 }
        ];
        this.gerarNuvensMenu(largura, altura);
        this.gerarCarrosSkylineMenu(largura);
    }

    gerarNuvensMenu(largura, altura) {
        const camadas = [
            {
                nome: 'fundo',
                quantidade: 2,
                largura: [180, 300],
                altura: [52, 86],
                yMin: altura * 0.12,
                yMax: altura * 0.2,
                velocidade: [8, 14],
                opacidade: [0.16, 0.24],
                escala: [0.88, 1.02]
            },
            {
                nome: 'medio',
                quantidade: 3,
                largura: [220, 360],
                altura: [68, 112],
                yMin: altura * 0.16,
                yMax: altura * 0.28,
                velocidade: [12, 20],
                opacidade: [0.22, 0.34],
                escala: [0.98, 1.16]
            },
            {
                nome: 'frente',
                quantidade: 1,
                largura: [280, 420],
                altura: [84, 132],
                yMin: altura * 0.22,
                yMax: altura * 0.32,
                velocidade: [18, 28],
                opacidade: [0.28, 0.42],
                escala: [1.08, 1.28]
            }
        ];

        this.menuNuvens = [];
        camadas.forEach((camada, camadaIndex) => {
            for (let i = 0; i < camada.quantidade; i += 1) {
                const larguraTotal = this.numeroAleatorio(camada.largura[0], camada.largura[1]);
                const alturaTotal = this.numeroAleatorio(camada.altura[0], camada.altura[1]);
                const escalaBase = camada.escala[0] + Math.random() * (camada.escala[1] - camada.escala[0]);
                const tipoSilhueta = this.sortearTipoNuvem(camada.nome);
                const nuvem = {
                    camada: camada.nome,
                    profundidade: camadaIndex,
                    tipoSilhueta,
                    x: this.numeroAleatorio(-200, largura + 160),
                    y: this.numeroAleatorio(Math.floor(camada.yMin), Math.floor(camada.yMax)),
                    yBase: 0,
                    velocidadeBase: camada.velocidade[0] + Math.random() * (camada.velocidade[1] - camada.velocidade[0]),
                    direcao: Math.random() < 0.78 ? 1 : -1,
                    opacidadeBase: camada.opacidade[0] + Math.random() * (camada.opacidade[1] - camada.opacidade[0]),
                    larguraTotal,
                    alturaTotal,
                    escalaBaseX: escalaBase,
                    escalaBaseY: escalaBase * (0.94 + Math.random() * 0.08),
                    flutuacaoAmplitude: 2.5 + camadaIndex * 1.6 + Math.random() * 1.8,
                    flutuacaoVelocidade: 0.14 + Math.random() * 0.22,
                    flutuacaoFase: Math.random() * Math.PI * 2,
                    deformacaoAmplitudeX: 0.008 + camadaIndex * 0.003 + Math.random() * 0.006,
                    deformacaoAmplitudeY: 0.006 + camadaIndex * 0.003 + Math.random() * 0.006,
                    deformacaoFase: Math.random() * Math.PI * 2,
                    brilhoQuente: 0.42 + Math.random() * 0.48,
                    perfil: this.criarPerfilNuvem(tipoSilhueta),
                    volumeFundo: {
                        offsetX: -larguraTotal * (0.08 + Math.random() * 0.04),
                        offsetY: alturaTotal * (0.08 + Math.random() * 0.06),
                        escalaX: 0.76 + Math.random() * 0.08,
                        escalaY: 0.78 + Math.random() * 0.08
                    },
                    volumeFrente: {
                        offsetX: larguraTotal * (0.03 + Math.random() * 0.03),
                        offsetY: -alturaTotal * (0.03 + Math.random() * 0.025),
                        escalaX: 0.6 + Math.random() * 0.1,
                        escalaY: 0.54 + Math.random() * 0.08,
                        alpha: 0.1 + Math.random() * 0.08
                    }
                };

                nuvem.yBase = nuvem.y;
                this.menuNuvens.push(nuvem);
            }
        });
    }

    atualizarNuvensMenu(largura) {
        if (!this.menuNuvens?.length) {
            return;
        }

        const agora = performance.now() / 1000;
        const ultimo = this._ultimoTempoNuvensMenu || agora;
        const delta = Math.min(0.05, agora - ultimo);
        this._ultimoTempoNuvensMenu = agora;

        this.menuNuvens.forEach((nuvem) => {
            nuvem.x += nuvem.velocidadeBase * nuvem.direcao * delta;
            nuvem.y = nuvem.yBase + Math.sin(agora * nuvem.flutuacaoVelocidade + nuvem.flutuacaoFase) * nuvem.flutuacaoAmplitude;

            const margem = nuvem.larguraTotal * (nuvem.escalaBaseX || 1) + 80;
            if (nuvem.direcao > 0 && nuvem.x > largura + margem) {
                nuvem.x = -margem;
            } else if (nuvem.direcao < 0 && nuvem.x < -margem) {
                nuvem.x = largura + margem;
            }
        });
    }

    desenharNuvensMenu(ctx, largura, altura) {
        if (!this.menuNuvens?.length) {
            return;
        }

        this.atualizarNuvensMenu(largura);
        const tempo = performance.now() / 1000;
        const solVirtual = { x: largura * 0.64, y: altura * 0.18 };

        ctx.save();
        this.menuNuvens
            .slice()
            .sort((a, b) => (a.profundidade || 0) - (b.profundidade || 0))
            .forEach((nuvem) => {
                const volumeFundo = nuvem.volumeFundo || {};
                const volumeFrente = nuvem.volumeFrente || {};
                const distanciaSol = Math.abs(nuvem.x - solVirtual.x);
                const influenciaSol = Math.max(0, 1 - distanciaSol / (largura * 0.46)) * (0.4 + nuvem.brilhoQuente * 0.6);
                const deformacao = Math.sin(tempo * (0.28 + (nuvem.profundidade || 0) * 0.06) + nuvem.deformacaoFase);
                const escalaX = (nuvem.escalaBaseX || 1) * (1 + deformacao * (nuvem.deformacaoAmplitudeX || 0));
                const escalaY = (nuvem.escalaBaseY || 1) * (1 - deformacao * (nuvem.deformacaoAmplitudeY || 0));
                const opacidade = nuvem.opacidadeBase;
                const sombraAlpha = 0.08 + (nuvem.profundidade || 0) * 0.035;
                const fundoAlpha = 0.16 + (nuvem.profundidade || 0) * 0.07;

                ctx.save();
                ctx.globalAlpha = fundoAlpha * opacidade;
                this.desenharFormaNuvem(ctx, nuvem, {
                    offsetX: volumeFundo.offsetX || -10,
                    offsetY: volumeFundo.offsetY || 8,
                    escalaX: (volumeFundo.escalaX || 0.8) * escalaX,
                    escalaY: (volumeFundo.escalaY || 0.82) * escalaY
                });
                ctx.fillStyle = 'rgba(184, 204, 230, 0.92)';
                ctx.fill();
                ctx.restore();

                const grad = ctx.createLinearGradient(0, nuvem.y - nuvem.alturaTotal * 0.55, 0, nuvem.y + nuvem.alturaTotal * 0.5);
                grad.addColorStop(0, `rgba(255, 243, 226, ${0.58 + influenciaSol * 0.18})`);
                grad.addColorStop(0.52, 'rgba(236, 244, 255, 0.54)');
                grad.addColorStop(1, 'rgba(188, 208, 236, 0.42)');

                this.desenharFormaNuvem(ctx, nuvem, {
                    escalaX,
                    escalaY
                });
                ctx.fillStyle = grad;
                ctx.shadowColor = `rgba(255, 212, 156, ${0.04 + influenciaSol * 0.08})`;
                ctx.shadowBlur = 8 + (nuvem.profundidade || 0) * 2;
                ctx.fill();

                this.desenharFormaNuvem(ctx, nuvem, {
                    offsetX: volumeFrente.offsetX || nuvem.larguraTotal * 0.04,
                    offsetY: volumeFrente.offsetY || -nuvem.alturaTotal * 0.04,
                    escalaX: escalaX * (volumeFrente.escalaX || 0.64),
                    escalaY: escalaY * (volumeFrente.escalaY || 0.58)
                });
                const brilhoFrontal = ctx.createLinearGradient(
                    nuvem.x,
                    nuvem.y - nuvem.alturaTotal * 0.36,
                    nuvem.x + nuvem.larguraTotal * 0.16,
                    nuvem.y + nuvem.alturaTotal * 0.12
                );
                brilhoFrontal.addColorStop(0, `rgba(255, 248, 236, ${volumeFrente.alpha + influenciaSol * 0.08})`);
                brilhoFrontal.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.fillStyle = brilhoFrontal;
                ctx.shadowBlur = 0;
                ctx.fill();

                this.desenharFormaNuvem(ctx, nuvem, {
                    offsetX: -nuvem.larguraTotal * (0.04 + (nuvem.profundidade || 0) * 0.01),
                    offsetY: nuvem.alturaTotal * (0.02 + (nuvem.profundidade || 0) * 0.008),
                    escalaX: escalaX * 0.9,
                    escalaY: escalaY * 0.86
                });
                const sombra = ctx.createLinearGradient(0, nuvem.y, 0, nuvem.y + nuvem.alturaTotal * 0.48);
                sombra.addColorStop(0, 'rgba(255,255,255,0)');
                sombra.addColorStop(1, `rgba(150, 176, 216, ${sombraAlpha})`);
                ctx.fillStyle = sombra;
                ctx.fill();
            });
        ctx.restore();
    }

    gerarCarrosSkylineMenu(largura) {
        const cores = ['#e2e8f0', '#1e293b', '#94a3b8', '#c0392b', '#2471a3', '#1e8449', '#7d3c98'];
        this.menuCarros = this.menuRuas.flatMap((rua, indiceRua) => {
            const quantidade = indiceRua === 0 ? 4 : 6;
            return Array.from({ length: quantidade }, (_, indiceCarro) => ({
                rua: indiceRua,
                x: (largura / quantidade) * indiceCarro + this.numeroAleatorio(-80, 80),
                largura: indiceRua === 0 ? this.numeroAleatorio(20, 28) : this.numeroAleatorio(26, 36),
                altura: indiceRua === 0 ? Math.max(6, rua.h * 0.42) : Math.max(8, rua.h * 0.46),
                cor: cores[Math.floor(Math.random() * cores.length)],
                velocidade: (rua.velocidadeBase + this.numeroAleatorio(-3, 6)) * (indiceRua % 2 === 0 ? 1 : -1)
            }));
        });
    }

    desenharSkylineMenu() {
        if (!this.menuSkylineCtx || !this.menuSkylineCanvas) {
            return;
        }

        const ctx = this.menuSkylineCtx;
        const largura = this.menuSkylineCanvas.width;
        const altura = this.menuSkylineCanvas.height;
        const tempo = Date.now() / 1000;
        this.atualizarCarrosSkylineMenu(largura);
        ctx.clearRect(0, 0, largura, altura);
        const topoFaixa = altura * 0.66;
        const baseFaixa = altura;

        const fadeSuperior = ctx.createLinearGradient(0, 0, 0, altura);
        fadeSuperior.addColorStop(0, 'rgba(15, 23, 42, 0)');
        fadeSuperior.addColorStop(0.74, 'rgba(15, 23, 42, 0)');
        fadeSuperior.addColorStop(1, 'rgba(15, 23, 42, 0.14)');

        const desenharCamada = (camada) => {
            if (!camada) return;
            ctx.save();
            ctx.globalAlpha = camada.alpha;
            camada.predios.forEach((predio, indice) => {
                const estilo = this.obterEstiloPredioFundo(predio, indice, camada.nome);
                const y = predio.yTopo + camada.deslocamentoY;
                const frenteGrad = ctx.createLinearGradient(predio.x, y, predio.x, y + predio.altura);
                frenteGrad.addColorStop(0, estilo.frenteTopo);
                frenteGrad.addColorStop(1, estilo.frenteBase);
                ctx.fillStyle = frenteGrad;
                ctx.fillRect(predio.x, y, predio.largura, predio.altura);

                ctx.fillStyle = estilo.lateral;
                ctx.beginPath();
                ctx.moveTo(predio.x + predio.largura, y);
                ctx.lineTo(predio.x + predio.largura + estilo.profundidade, y - estilo.profundidade * 0.32);
                ctx.lineTo(predio.x + predio.largura + estilo.profundidade, y + predio.altura - estilo.profundidade * 0.1);
                ctx.lineTo(predio.x + predio.largura, y + predio.altura);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = estilo.topo;
                ctx.beginPath();
                ctx.moveTo(predio.x, y);
                ctx.lineTo(predio.x + predio.largura, y);
                ctx.lineTo(predio.x + predio.largura + estilo.profundidade, y - estilo.profundidade * 0.32);
                ctx.lineTo(predio.x + estilo.profundidade * 0.45, y - estilo.profundidade * 0.32);
                ctx.closePath();
                ctx.fill();

                predio.luzes?.forEach((luz) => {
                    const mod = luz.cintila
                        ? 0.88 + Math.sin(tempo * 1.05 + luz.fase) * 0.12
                        : 1;
                    const alpha = Math.max(0.08, luz.intensidade * mod);
                    ctx.fillStyle = `rgba(255, 214, 122, ${alpha})`;
                    ctx.fillRect(luz.x, luz.y, luz.largura, luz.altura);
                });
            });
            ctx.restore();
        };

        const camadaMuitoDistante = this.menuSkyline[0];
        const camadaDistante = this.menuSkyline[1];
        const camadaMedia = this.menuSkyline[2];
        const camadaFrente = this.menuSkyline[3];

        this.desenharNuvensMenu(ctx, largura, altura);
        desenharCamada(camadaMuitoDistante);
        desenharCamada(camadaDistante);
        desenharCamada(camadaMedia);

        const grad = ctx.createLinearGradient(0, altura * 0.62, 0, altura);
        grad.addColorStop(0, 'rgba(255, 170, 92, 0)');
        grad.addColorStop(1, 'rgba(255, 170, 92, 0.08)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, altura * 0.62, largura, altura * 0.38);

        this.desenharRuasSkylineMenu(ctx, largura, altura, [0]);
        this.desenharCarrosSkylineMenu(ctx, [0]);
        this.desenharRuasSkylineMenu(ctx, largura, altura, [1]);
        this.desenharCarrosSkylineMenu(ctx, [1]);
        desenharCamada(camadaFrente);

        ctx.fillStyle = fadeSuperior;
        ctx.fillRect(0, 0, largura, altura);
    }

    desenharRuasSkylineMenu(ctx, largura, altura, indices = [0, 1]) {
        indices.forEach((indice) => {
            const rua = this.menuRuas[indice];
            if (!rua) return;
            ctx.save();
            const isFrente = indice === 1;
            const ruaY = rua.y;
            const ruaH = rua.h;

            // Calçada/passeio acima da rua
            const calcadaH = Math.max(3, ruaH * 0.24);
            const calcadaGrad = ctx.createLinearGradient(0, ruaY - calcadaH, 0, ruaY);
            calcadaGrad.addColorStop(0, 'rgba(54, 58, 76, 0)');
            calcadaGrad.addColorStop(0.5, `rgba(60, 64, 86, ${isFrente ? 0.46 : 0.32})`);
            calcadaGrad.addColorStop(1, `rgba(78, 84, 108, ${isFrente ? 0.78 : 0.54})`);
            ctx.fillStyle = calcadaGrad;
            ctx.fillRect(0, ruaY - calcadaH, largura, calcadaH);

            // Asfalto principal com gradiente para dar profundidade
            const gradAsfalto = ctx.createLinearGradient(0, ruaY, 0, ruaY + ruaH);
            if (isFrente) {
                gradAsfalto.addColorStop(0,   'rgba(46, 48, 62, 0.97)');
                gradAsfalto.addColorStop(0.4, 'rgba(34, 36, 50, 0.99)');
                gradAsfalto.addColorStop(1,   'rgba(18, 20, 32, 1.0)');
            } else {
                gradAsfalto.addColorStop(0, 'rgba(38, 40, 54, 0.88)');
                gradAsfalto.addColorStop(1, 'rgba(24, 26, 40, 0.93)');
            }
            ctx.fillStyle = gradAsfalto;
            ctx.fillRect(0, ruaY, largura, ruaH);

            // Meio-fio: linha de destaque no topo do asfalto
            ctx.fillStyle = `rgba(108, 116, 146, ${isFrente ? 0.86 : 0.60})`;
            ctx.fillRect(0, ruaY, largura, Math.max(1.5, ruaH * 0.08));

            // Reflexo ambiental quente (glow laranja das luzes da cidade)
            const refGrad = ctx.createLinearGradient(0, ruaY, 0, ruaY + ruaH * 0.65);
            refGrad.addColorStop(0, `rgba(255, 140, 40, ${isFrente ? 0.08 : 0.05})`);
            refGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = refGrad;
            ctx.fillRect(0, ruaY, largura, ruaH * 0.65);

            // Faixas tracejadas centrais (amarelas)
            const tracoDash = isFrente ? 36 : 26;
            const tracoGap  = isFrente ? 22 : 17;
            const tracoH    = Math.max(1.5, ruaH * 0.11);
            const tracoY    = ruaY + ruaH * 0.44;
            ctx.fillStyle = `rgba(255, 220, 120, ${isFrente ? 0.72 : 0.50})`;
            for (let x = 0; x < largura; x += tracoDash + tracoGap) {
                ctx.fillRect(x, tracoY, tracoDash, tracoH);
            }

            // Linhas de borda brancas (edge lines)
            const bordaAlpha = isFrente ? 0.34 : 0.22;
            const bordaH     = Math.max(1, ruaH * 0.07);
            ctx.fillStyle = `rgba(210, 216, 240, ${bordaAlpha})`;
            ctx.fillRect(0, ruaY + ruaH * 0.14, largura, bordaH);
            ctx.fillRect(0, ruaY + ruaH * 0.76, largura, bordaH);

            ctx.restore();
        });
    }

    atualizarCarrosSkylineMenu(largura) {
        if (!this.menuCarros?.length || !this.menuRuas?.length) {
            return;
        }

        const agora = performance.now();
        const ultimo = this._ultimoTempoCarrosMenu || agora;
        const delta = Math.min(0.05, (agora - ultimo) / 1000);
        this._ultimoTempoCarrosMenu = agora;

        this.menuCarros.forEach((carro) => {
            carro.x += carro.velocidade * delta;
            if (carro.velocidade > 0 && carro.x > largura + 40) {
                carro.x = -50;
            } else if (carro.velocidade < 0 && carro.x < -60) {
                carro.x = largura + 50;
            }
        });
    }

    desenharCarrosSkylineMenu(ctx, ruasVisiveis = [0, 1]) {
        if (!this.menuCarros?.length || !this.menuRuas?.length) {
            return;
        }

        this.menuCarros.forEach((carro) => {
            if (!ruasVisiveis.includes(carro.rua)) return;
            const rua = this.menuRuas[carro.rua];
            if (!rua) return;
            const direcao = carro.velocidade >= 0 ? 1 : -1;
            const corpoAltura = Math.max(4, carro.altura * 0.56);
            const cabineLargura = Math.max(5, carro.largura * 0.36);
            const cabineAltura = Math.max(3, carro.altura * 0.46);
            const rodaRaio = Math.max(1.5, carro.altura * 0.24);
            const y = rua.y + rua.h * 0.16;
            const corpoY = y + cabineAltura * 0.42;
            const cabineX = direcao > 0
                ? carro.x + carro.largura * 0.46
                : carro.x + carro.largura * 0.18;
            const farolX = direcao > 0 ? carro.x + carro.largura - 2 : carro.x + 2;
            const lanternaX = direcao > 0 ? carro.x + 1 : carro.x + carro.largura - 3;

            ctx.save();
            ctx.globalAlpha = 0.94;

            // Sombra/reflexo no asfalto
            ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
            ctx.fillRect(carro.x + 2, corpoY + corpoAltura + rodaRaio * 0.6, carro.largura - 4, Math.max(1, rodaRaio * 0.5));

            // Corpo do carro
            ctx.fillStyle = carro.cor;
            ctx.fillRect(carro.x, corpoY, carro.largura, corpoAltura);
            ctx.fillRect(cabineX, y, cabineLargura, cabineAltura);

            // Reflexo no teto da cabine
            ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
            ctx.fillRect(cabineX + 1, y + 1, Math.max(2, cabineLargura - 2), Math.max(1.5, cabineAltura * 0.32));

            // Janelas (vidro escuro)
            ctx.fillStyle = 'rgba(140, 190, 255, 0.28)';
            ctx.fillRect(cabineX + 1, y + 1, Math.max(2, cabineLargura - 2), Math.max(2, cabineAltura * 0.7));

            // Rodas
            ctx.fillStyle = 'rgba(12, 14, 22, 0.96)';
            ctx.beginPath();
            ctx.arc(carro.x + carro.largura * 0.22, corpoY + corpoAltura, rodaRaio, 0, Math.PI * 2);
            ctx.arc(carro.x + carro.largura * 0.78, corpoY + corpoAltura, rodaRaio, 0, Math.PI * 2);
            ctx.fill();

            // Faróis (frente do carro) — glow branco-amarelado
            ctx.globalAlpha = 0.82;
            const farolGrad = ctx.createRadialGradient(farolX, corpoY + corpoAltura * 0.35, 0, farolX, corpoY + corpoAltura * 0.35, carro.largura * 0.55);
            farolGrad.addColorStop(0, 'rgba(255, 248, 200, 0.72)');
            farolGrad.addColorStop(1, 'rgba(255, 240, 160, 0)');
            ctx.fillStyle = farolGrad;
            ctx.fillRect(
                direcao > 0 ? farolX - carro.largura * 0.5 : farolX,
                corpoY - 1,
                carro.largura * 0.55,
                corpoAltura + 2
            );

            // Lanternas traseiras — glow vermelho
            const lanternaGrad = ctx.createRadialGradient(lanternaX, corpoY + corpoAltura * 0.4, 0, lanternaX, corpoY + corpoAltura * 0.4, carro.largura * 0.32);
            lanternaGrad.addColorStop(0, 'rgba(220, 40, 20, 0.62)');
            lanternaGrad.addColorStop(1, 'rgba(180, 20, 10, 0)');
            ctx.fillStyle = lanternaGrad;
            ctx.fillRect(
                direcao > 0 ? lanternaX : lanternaX - carro.largura * 0.28,
                corpoY,
                carro.largura * 0.32,
                corpoAltura
            );

            ctx.restore();
        });
    }

    iniciarLoopSkylineMenu() {
        const loop = () => {
            const telaInicial = document.getElementById('tela-inicial');
            if (telaInicial && !telaInicial.classList.contains('escondido')) {
                this.desenharSkylineMenu();
            }
            requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
    }

    obterEstiloPredioFundo(predio, indice, camada) {
        const tomBase = camada === 'distante'
            ? 38 + (indice % 4) * 8
            : camada === 'frente'
                ? 62 + (indice % 4) * 9
                : 48 + (indice % 5) * 10;
        const profundidade = Math.max(6, Math.floor(predio.largura * (
            camada === 'distante' ? 0.1 : camada === 'frente' ? 0.15 : 0.13
        )));

        return {
            tomBase,
            profundidade,
            frenteTopo: `rgba(${tomBase + 18}, ${tomBase + 20}, ${tomBase + 36}, ${
                camada === 'distante' ? 0.7 : camada === 'frente' ? 1.0 : 0.88
            })`,
            frenteBase: `rgba(${tomBase - 2}, ${tomBase}, ${tomBase + 12}, ${
                camada === 'distante' ? 0.8 : camada === 'frente' ? 1.0 : 0.94
            })`,
            lateral: `rgba(${Math.max(8, tomBase - 14)}, ${Math.max(10, tomBase - 10)}, ${tomBase + 2}, ${
                camada === 'distante' ? 0.55 : camada === 'frente' ? 1.0 : 0.88
            })`,
            topo: `rgba(${tomBase + 24}, ${tomBase + 18}, ${tomBase + 26}, ${
                camada === 'distante' ? 0.24 : camada === 'frente' ? 0.96 : 0.72
            })`,
            janelaAcesa: camada === 'distante'
                ? 'rgba(255, 214, 122, 0.16)'
                : camada === 'frente'
                    ? 'rgba(255, 214, 122, 0.34)'
                    : 'rgba(255, 214, 122, 0.24)',
            janelaApagada: camada === 'distante'
                ? 'rgba(18, 26, 44, 0.26)'
                : camada === 'frente'
                    ? 'rgba(18, 26, 44, 0.82)'
                    : 'rgba(18, 26, 44, 0.34)'
        };
    }

    gerarNuvens() {
        this.nuvens = [];
        const camadas = [
            {
                nome: 'fundo',
                quantidade: 2,
                largura: [120, 210],
                altura: [42, 74],
                yMin: this.alturaTela * 0.08,
                yMax: this.alturaTela * 0.18,
                velocidade: [0.3, 0.75],
                opacidade: [0.2, 0.34],
                escala: [0.72, 0.9]
            },
            {
                nome: 'medio',
                quantidade: 3,
                largura: [150, 260],
                altura: [54, 92],
                yMin: this.alturaTela * 0.12,
                yMax: this.alturaTela * 0.26,
                velocidade: [0.55, 1.15],
                opacidade: [0.38, 0.58],
                escala: [0.92, 1.08]
            },
            {
                nome: 'frente',
                quantidade: 2,
                largura: [210, 320],
                altura: [74, 116],
                yMin: this.alturaTela * 0.16,
                yMax: this.alturaTela * 0.32,
                velocidade: [0.9, 1.5],
                opacidade: [0.52, 0.72],
                escala: [1.08, 1.28]
            }
        ];

        camadas.forEach((camada, camadaIndex) => {
            for (let i = 0; i < camada.quantidade; i += 1) {
                const larguraTotal = this.numeroAleatorio(camada.largura[0], camada.largura[1]);
                const alturaTotal = this.numeroAleatorio(camada.altura[0], camada.altura[1]);
                const escalaBase = camada.escala[0] + Math.random() * (camada.escala[1] - camada.escala[0]);
                const tipoSilhueta = this.sortearTipoNuvem(camada.nome);
                const nuvem = {
                    camada: camada.nome,
                    profundidade: camadaIndex,
                    tipoSilhueta,
                    x: this.numeroAleatorio(-160, this.larguraTela + 80),
                    y: this.numeroAleatorio(Math.floor(camada.yMin), Math.floor(camada.yMax)),
                    yBase: 0,
                    velocidadeMult: camada.velocidade[0] + Math.random() * (camada.velocidade[1] - camada.velocidade[0]),
                    opacidadeBase: camada.opacidade[0] + Math.random() * (camada.opacidade[1] - camada.opacidade[0]),
                    larguraTotal,
                    alturaTotal,
                    escalaBaseX: escalaBase,
                    escalaBaseY: escalaBase * (0.94 + Math.random() * 0.1),
                    flutuacaoAmplitude: 2 + camadaIndex * 1.8 + Math.random() * 2.4,
                    flutuacaoVelocidade: 0.18 + Math.random() * 0.35,
                    flutuacaoFase: Math.random() * Math.PI * 2,
                    deformacaoAmplitudeX: 0.01 + camadaIndex * 0.004 + Math.random() * 0.008,
                    deformacaoAmplitudeY: 0.008 + camadaIndex * 0.004 + Math.random() * 0.008,
                    deformacaoFase: Math.random() * Math.PI * 2,
                    brilhoQuente: Math.random() * (camada.nome === 'frente' ? 1 : 0.72),
                    perfil: this.criarPerfilNuvem(tipoSilhueta),
                    volumeFundo: {
                        offsetX: -larguraTotal * (0.08 + Math.random() * 0.05),
                        offsetY: alturaTotal * (0.08 + Math.random() * 0.08),
                        escalaX: 0.74 + Math.random() * 0.1,
                        escalaY: 0.76 + Math.random() * 0.1
                    },
                    volumeFrente: {
                        offsetX: larguraTotal * (0.03 + Math.random() * 0.04),
                        offsetY: -alturaTotal * (0.03 + Math.random() * 0.03),
                        escalaX: 0.58 + Math.random() * 0.12,
                        escalaY: 0.52 + Math.random() * 0.12,
                        alpha: 0.14 + Math.random() * 0.12
                    }
                };

                nuvem.yBase = nuvem.y;
                this.nuvens.push(nuvem);
            }
        });
    }

    sortearTipoNuvem(camadaNome = 'medio') {
        const rolagem = Math.random();

        if (camadaNome === 'fundo') {
            if (rolagem < 0.45) return 'longa';
            if (rolagem < 0.78) return 'rasgada';
            return 'compacta';
        }

        if (camadaNome === 'frente') {
            if (rolagem < 0.34) return 'bloco';
            if (rolagem < 0.68) return 'compacta';
            return 'longa';
        }

        if (rolagem < 0.3) return 'compacta';
        if (rolagem < 0.6) return 'longa';
        if (rolagem < 0.82) return 'rasgada';
        return 'bloco';
    }

    criarPerfilNuvem(tipo = 'medio') {
        const base = {
            topoA: 0.52 + Math.random() * 0.16,
            topoB: 0.74 + Math.random() * 0.2,
            topoC: 0.58 + Math.random() * 0.18,
            valeA: 0.14 + Math.random() * 0.07,
            valeB: 0.1 + Math.random() * 0.08,
            baseCurva: 0.06 + Math.random() * 0.03,
            recuoEsquerda: 0.16 + Math.random() * 0.07,
            recuoDireita: 0.18 + Math.random() * 0.08
        };

        if (tipo === 'longa') {
            return {
                ...base,
                topoA: 0.48 + Math.random() * 0.08,
                topoB: 0.66 + Math.random() * 0.1,
                topoC: 0.5 + Math.random() * 0.08,
                valeA: 0.08 + Math.random() * 0.05,
                valeB: 0.08 + Math.random() * 0.05,
                baseCurva: 0.04 + Math.random() * 0.02,
                recuoEsquerda: 0.1 + Math.random() * 0.04,
                recuoDireita: 0.11 + Math.random() * 0.04
            };
        }

        if (tipo === 'compacta') {
            return {
                ...base,
                topoA: 0.64 + Math.random() * 0.14,
                topoB: 0.88 + Math.random() * 0.08,
                topoC: 0.7 + Math.random() * 0.12,
                valeA: 0.18 + Math.random() * 0.08,
                valeB: 0.16 + Math.random() * 0.08,
                baseCurva: 0.08 + Math.random() * 0.03,
                recuoEsquerda: 0.2 + Math.random() * 0.06,
                recuoDireita: 0.22 + Math.random() * 0.06
            };
        }

        if (tipo === 'rasgada') {
            return {
                ...base,
                topoA: 0.44 + Math.random() * 0.12,
                topoB: 0.58 + Math.random() * 0.12,
                topoC: 0.42 + Math.random() * 0.12,
                valeA: 0.04 + Math.random() * 0.04,
                valeB: 0.03 + Math.random() * 0.04,
                baseCurva: 0.03 + Math.random() * 0.02,
                recuoEsquerda: 0.08 + Math.random() * 0.05,
                recuoDireita: 0.1 + Math.random() * 0.05
            };
        }

        if (tipo === 'bloco') {
            return {
                ...base,
                topoA: 0.6 + Math.random() * 0.12,
                topoB: 0.8 + Math.random() * 0.12,
                topoC: 0.64 + Math.random() * 0.12,
                valeA: 0.12 + Math.random() * 0.05,
                valeB: 0.1 + Math.random() * 0.05,
                baseCurva: 0.05 + Math.random() * 0.02,
                recuoEsquerda: 0.14 + Math.random() * 0.05,
                recuoDireita: 0.15 + Math.random() * 0.05
            };
        }

        return base;
    }

    desenharFormaNuvem(ctx, nuvem, opcoes = {}) {
        const largura = (nuvem.larguraTotal || 180) * (opcoes.escalaX || 1);
        const altura = (nuvem.alturaTotal || 72) * (opcoes.escalaY || 1);
        const x = nuvem.x + (opcoes.offsetX || 0);
        const y = nuvem.y + (opcoes.offsetY || 0);
        const perfil = nuvem.perfil || {
            topoA: 0.58,
            topoB: 0.86,
            topoC: 0.64,
            valeA: 0.18,
            valeB: 0.16,
            baseCurva: 0.08,
            recuoEsquerda: 0.18,
            recuoDireita: 0.2
        };

        const esquerda = x - largura / 2;
        const direita = x + largura / 2;
        const baseY = y + altura * 0.28;
        const topoY = y - altura * 0.42;

        const p0 = { x: esquerda + largura * perfil.recuoEsquerda, y: baseY };
        const p1 = { x: esquerda + largura * 0.22, y: topoY + altura * (1 - perfil.topoA) };
        const p2 = { x: esquerda + largura * 0.46, y: topoY + altura * (1 - perfil.topoB) };
        const p3 = { x: esquerda + largura * 0.74, y: topoY + altura * (1 - perfil.topoC) };
        const p4 = { x: direita - largura * perfil.recuoDireita, y: baseY };

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.quadraticCurveTo(esquerda + largura * 0.1, baseY - altura * 0.24, p1.x, p1.y);
        ctx.quadraticCurveTo(esquerda + largura * 0.34, topoY - altura * perfil.valeA, p2.x, p2.y);
        ctx.quadraticCurveTo(esquerda + largura * 0.6, topoY - altura * perfil.valeB, p3.x, p3.y);
        ctx.quadraticCurveTo(direita - largura * 0.12, baseY - altura * 0.18, p4.x, p4.y);
        ctx.quadraticCurveTo(x + largura * 0.2, baseY + altura * perfil.baseCurva, x, baseY + altura * 0.04);
        ctx.quadraticCurveTo(x - largura * 0.22, baseY + altura * perfil.baseCurva, p0.x, p0.y);
        ctx.closePath();
    }

    desenharCidadeNoBuffer() {
        const ctx = this.bufferCidadeCtx;
        const ctxColisao = this.bufferColisaoCtx;
        ctx.clearRect(0, 0, this.larguraTela, this.alturaTela);
        ctxColisao.clearRect(0, 0, this.larguraTela, this.alturaTela);

        const gradSolo = ctx.createLinearGradient(0, this.alturaTela - 40, 0, this.alturaTela);
        gradSolo.addColorStop(0, '#312e81');
        gradSolo.addColorStop(0.5, '#1f2937');
        gradSolo.addColorStop(1, '#020617');
        ctx.fillStyle = gradSolo;
        ctx.fillRect(0, this.alturaTela - 22, this.larguraTela, 22);
        ctxColisao.fillStyle = '#000';
        ctxColisao.fillRect(0, this.alturaTela - 22, this.larguraTela, 22);

        this.city.predios.forEach((predio, indice) => {
            const tomBase = 58 + (indice % 5) * 12;
            const profundidade = Math.max(10, Math.floor(predio.largura * 0.16));
            const alturaBeiral = Math.max(6, Math.floor(this.alturaTela / 70));
            const sombraComprimento = Math.max(18, Math.floor(predio.largura * 0.32));

            ctx.fillStyle = 'rgba(8, 12, 24, 0.18)';
            ctx.beginPath();
            ctx.moveTo(predio.x + predio.largura, predio.yTopo + predio.altura * 0.08);
            ctx.lineTo(predio.x + predio.largura + sombraComprimento, predio.yTopo + predio.altura * 0.12);
            ctx.lineTo(predio.x + predio.largura + sombraComprimento, predio.yTopo + predio.altura);
            ctx.lineTo(predio.x + predio.largura, predio.yTopo + predio.altura);
            ctx.closePath();
            ctx.fill();

            const frenteGrad = ctx.createLinearGradient(predio.x, predio.yTopo, predio.x, predio.yTopo + predio.altura);
            frenteGrad.addColorStop(0, `rgb(${tomBase + 24}, ${tomBase + 10}, ${tomBase + 8})`);
            frenteGrad.addColorStop(0.55, `rgb(${tomBase + 6}, ${tomBase - 2}, ${tomBase + 2})`);
            frenteGrad.addColorStop(1, `rgb(${tomBase - 10}, ${tomBase - 12}, ${tomBase - 6})`);
            ctx.fillStyle = frenteGrad;
            ctx.fillRect(predio.x, predio.yTopo, predio.largura, predio.altura);

            ctx.fillStyle = 'rgba(255, 196, 120, 0.12)';
            ctx.fillRect(predio.x + 2, predio.yTopo + 2, Math.max(2, Math.floor(predio.largura * 0.1)), predio.altura - 4);

            ctx.fillStyle = `rgba(${Math.max(20, tomBase - 30)}, ${Math.max(18, tomBase - 32)}, ${Math.max(24, tomBase - 18)}, 0.95)`;
            ctx.beginPath();
            ctx.moveTo(predio.x + predio.largura, predio.yTopo);
            ctx.lineTo(predio.x + predio.largura + profundidade, predio.yTopo - profundidade * 0.38);
            ctx.lineTo(predio.x + predio.largura + profundidade, predio.yTopo + predio.altura - profundidade * 0.15);
            ctx.lineTo(predio.x + predio.largura, predio.yTopo + predio.altura);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 184, 108, 0.18)';
            ctx.beginPath();
            ctx.moveTo(predio.x, predio.yTopo);
            ctx.lineTo(predio.x + predio.largura, predio.yTopo);
            ctx.lineTo(predio.x + predio.largura + profundidade, predio.yTopo - profundidade * 0.38);
            ctx.lineTo(predio.x + profundidade * 0.5, predio.yTopo - profundidade * 0.38);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'rgba(23, 32, 52, 0.85)';
            ctx.fillRect(predio.x, predio.yTopo, predio.largura, alturaBeiral);

            ctxColisao.fillStyle = '#000';
            ctxColisao.fillRect(predio.x, predio.yTopo, predio.largura, predio.altura);
            ctxColisao.beginPath();
            ctxColisao.moveTo(predio.x + predio.largura, predio.yTopo);
            ctxColisao.lineTo(predio.x + predio.largura + profundidade, predio.yTopo - profundidade * 0.38);
            ctxColisao.lineTo(predio.x + predio.largura + profundidade, predio.yTopo + predio.altura - profundidade * 0.15);
            ctxColisao.lineTo(predio.x + predio.largura, predio.yTopo + predio.altura);
            ctxColisao.closePath();
            ctxColisao.fill();
            ctxColisao.beginPath();
            ctxColisao.moveTo(predio.x, predio.yTopo);
            ctxColisao.lineTo(predio.x + predio.largura, predio.yTopo);
            ctxColisao.lineTo(predio.x + predio.largura + profundidade, predio.yTopo - profundidade * 0.38);
            ctxColisao.lineTo(predio.x + profundidade * 0.5, predio.yTopo - profundidade * 0.38);
            ctxColisao.closePath();
            ctxColisao.fill();

            predio.janelasFrontais.forEach((janela) => {
                ctx.fillStyle = janela.acesa ? '#ffd36b' : '#23303d';
                ctx.fillRect(janela.x, janela.y, janela.largura, janela.altura);
            });

            predio.janelasLaterais.forEach((janela) => {
                ctx.fillStyle = janela.acesa ? 'rgba(255, 214, 122, 0.5)' : 'rgba(24, 33, 51, 0.9)';
                ctx.fillRect(janela.x, janela.y, janela.largura, janela.altura);
            });

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(predio.x, predio.yTopo);
            ctx.lineTo(predio.x + predio.largura, predio.yTopo);
            ctx.stroke();
        });

        this.aplicarCraterasNosBuffers();
    }

    aplicarCraterasNosBuffers() {
        if (!this.crateras || this.crateras.length === 0) {
            return;
        }

        const cortes = [
            { ctx: this.bufferColisaoCtx, ajuste: 0 },
            { ctx: this.bufferCidadeCtx, ajuste: 2 }
        ];

        cortes.forEach(({ ctx, ajuste }) => {
            ctx.save();
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = '#000';

            this.crateras.forEach((cratera) => {
                this.desenharFormaCratera(ctx, cratera, ajuste);
            });

            ctx.restore();
        });
    }

    posicionarGorilas() {
        if (this.city.predios.length < 4) {
            return;
        }

        const sprite = this.obterConfigGorila();
        const render = this.obterDimensoesRenderGorila();
        const ancoraPe = sprite.ancoraPe ?? 0.5;
        const margem = Math.min(2, Math.floor(this.city.predios.length / 4));
        const indiceEsquerda = Math.min(this.city.predios.length - 1, margem + 1);
        const indiceDireita = Math.max(0, this.city.predios.length - margem - 2);
        const predio1 = this.city.predios[indiceEsquerda];
        const predio2 = this.city.predios[indiceDireita];

        this.gorilas[1] = {
            x: predio1.x + predio1.largura / 2 - render.largura * ancoraPe,
            y: predio1.yTopo - render.altura,
            largura: render.largura,
            altura: render.altura,
            vivo: true
        };

        this.gorilas[2] = {
            x: predio2.x + predio2.largura / 2 - render.largura * ancoraPe,
            y: predio2.yTopo - render.altura,
            largura: render.largura,
            altura: render.altura,
            vivo: true
        };
    }

    sortearVento() {
        let vento = this.numeroAleatorio(-5, 5);
        if (Math.random() < 0.35) {
            vento += vento >= 0 ? this.numeroAleatorio(2, 8) : -this.numeroAleatorio(2, 8);
        }

        this.game.vento = vento;
        this.atualizarHUD();
    }

    atualizarHUD() {
        document.getElementById('texto-placar1').innerHTML =
            `<span class="placar-nome">${this.jogadores[1].nome}</span><span class="placar-valor">${this.jogadores[1].pontos}</span>`;
        document.getElementById('texto-placar2').innerHTML =
            `<span class="placar-nome">${this.jogadores[2].nome}</span><span class="placar-valor">${this.jogadores[2].pontos}</span>`;
            
        document.getElementById('placar-jogador1').classList.toggle('ativo', this.game.jogadorAtual === 1);
        document.getElementById('placar-jogador2').classList.toggle('ativo', this.game.jogadorAtual === 2);
        
        document.getElementById('angulo1').disabled = this.game.jogadorAtual !== 1;
        document.getElementById('angulo-range1').disabled = this.game.jogadorAtual !== 1;
        document.getElementById('velocidade1').disabled = this.game.jogadorAtual !== 1;
        document.getElementById('velocidade-range1').disabled = this.game.jogadorAtual !== 1;
        document.getElementById('angulo2').disabled = this.game.jogadorAtual !== 2;
        document.getElementById('angulo-range2').disabled = this.game.jogadorAtual !== 2;
        document.getElementById('velocidade2').disabled = this.game.jogadorAtual !== 2;
        document.getElementById('velocidade-range2').disabled = this.game.jogadorAtual !== 2;

        if (this.game.modoIA) {
            document.getElementById('controle-p2').style.visibility = 'hidden';
            document.getElementById('lancar').disabled = this.game.jogadorAtual === 2;
        } else {
            document.getElementById('controle-p2').style.visibility = '';
            document.getElementById('lancar').disabled = false;
        }

        document.getElementById('lancar')?.classList.toggle('pronto', this.game.iniciado && !this.projectile.ativo && !this.animacaoAcerto);

        // Sincronizar sliders com os valores atuais dos inputs (ex: após CPU definir valores)
        ['1', '2'].forEach(n => {
            const numAng = document.getElementById(`angulo${n}`);
            const rangeAng = document.getElementById(`angulo-range${n}`);
            const numVel = document.getElementById(`velocidade${n}`);
            const rangeVel = document.getElementById(`velocidade-range${n}`);
            if (numAng && rangeAng) rangeAng.value = numAng.value;
            if (numVel && rangeVel) rangeVel.value = numVel.value;
        });

        // Status de turno no DOM (texto fixo — o "CPU pensando..." é atualizado no loop)
        const statusEl = document.getElementById('status-turno');
        if (statusEl && !this.game.cpuPensando) {
            statusEl.textContent = this.game.iniciado
                ? `Turno de ${this.jogadores[this.game.jogadorAtual].nome}`
                : '';
        }

        const resumoEl = document.getElementById('hud-resumo');
        if (resumoEl) {
            const atual = this.jogadores[this.game.jogadorAtual];
            resumoEl.textContent = this.game.iniciado
                ? `Ajuste: ang ${Math.round(atual.angulo)} | vel ${Math.round(atual.velocidade)}`
                : '';
        }

        const direcao = this.game.vento > 0 ? '->' : this.game.vento < 0 ? '<-' : '--';
        document.getElementById('info-vento').textContent =
            `Vento: ${direcao} ${Math.abs(this.game.vento)}`;

        // Atualizar Seta de Vento Visual (HUD)
        const seta = document.getElementById('seta-vento');
        const forcaAbsoluta = Math.min(Math.abs(this.game.vento) * 10, 50); // Máximo 50% para cada lado
        
        if (this.game.vento > 0) {
            seta.style.width = `${forcaAbsoluta}%`;
            seta.style.left = '50%';
            seta.style.transform = 'translateX(0)';
        } else if (this.game.vento < 0) {
            seta.style.width = `${forcaAbsoluta}%`;
            seta.style.left = `calc(50% - ${forcaAbsoluta}%)`;
            seta.style.transform = 'translateX(0)';
        } else {
            seta.style.width = '0%';
        }

        document.querySelector('.wind-container')?.style.setProperty('--wind-pulse', `${0.16 + Math.abs(this.game.vento) * 0.03}`);
    }

    iniciarArremesso() {
        if (!this.game.iniciado || this.projectile.ativo || this.animacaoAcerto) {
            return;
        }

        this.rastro = [];
        this.tocarSomLancamento();

        const inputAngulo = document.getElementById(`angulo${this.game.jogadorAtual}`);
        const inputVelocidade = document.getElementById(`velocidade${this.game.jogadorAtual}`);
        
        const velocidade = Math.max(1, Number(inputVelocidade.value) || 0);
        const anguloBase = Math.max(0, Math.min(360, Number(inputAngulo.value) || 0));
        
        this.jogadores[this.game.jogadorAtual].velocidade = velocidade;
        this.jogadores[this.game.jogadorAtual].angulo = anguloBase;
        
        const angulo = this.game.jogadorAtual === 1 ? anguloBase : 180 - anguloBase;
        const origem = this.obterOrigemArremesso(this.game.jogadorAtual);
        const anguloRadianos = (angulo * Math.PI) / 180;
        const velocidadeEscalada = velocidade * this.escalaFisica.velocidade;
        this.efeitoLancamento = {
            jogador: this.game.jogadorAtual,
            tempo: 0,
            duracao: 0.36
        };

        this.projectile = {
            ativo: true,
            jogador: this.game.jogadorAtual,
            origemX: origem.x,
            origemY: origem.y,
            anguloGraus: angulo,
            anguloRadianos,
            velocidade,
            velocidadeX: Math.cos(anguloRadianos) * velocidadeEscalada,
            velocidadeY: Math.sin(anguloRadianos) * velocidadeEscalada,
            tempoVoo: 0,
            x: origem.x,
            y: origem.y,
            rotacao: 0,
            quaseAcertoDisparado: false
        };
    }

    obterOrigemArremesso(jogador) {
        const gorila = this.gorilas[jogador];
        const config = this.obterConfigGorila();
        const ancora = jogador === 1 ? config.ancoraMao.direita : config.ancoraMao.esquerda;

        return {
            x: gorila.x + gorila.largura * ancora.x,
            y: gorila.y + gorila.altura * ancora.y
        };
    }

    atualizarProjetil(delta) {
        this.projectile.tempoVoo += delta;
        const duracaoRastro = 0.52;
        this.rastro = this.rastro
            .map((ponto) => ({ ...ponto, vida: (ponto.vida ?? 0) + delta }))
            .filter((ponto) => ponto.vida < duracaoRastro);

        const posicao = this.calcularPosicaoProjetil(this.projectile.tempoVoo);
        this.projectile.x = posicao.x;
        this.projectile.y = posicao.y;
        this.projectile.rotacao = Math.floor(this.projectile.tempoVoo * 12) % this.sprites.banana.totalQuadros;

        // Registrar posição no rastro (a cada ~3 frames para não criar pontos demais)
        if (this.rastro.length === 0 || Math.hypot(
            posicao.x - this.rastro[this.rastro.length - 1].x,
            posicao.y - this.rastro[this.rastro.length - 1].y
        ) > 8) {
            this.rastro.push({ x: posicao.x, y: posicao.y, vida: 0 });
        }

        this.verificarQuaseAcerto(posicao.x, posicao.y);

        const impacto = this.verificarImpactoProjetil(this.projectile.x, this.projectile.y);
        if (impacto.tipo !== 'nenhum') {
            this.rastro = [];
            this.resolverImpacto(impacto);
        }
    }

    calcularPosicaoProjetil(tempo) {
        const aceleracaoVento = this.game.vento * this.escalaFisica.vento;
        const aceleracaoGravidade = this.game.gravidade * this.escalaFisica.gravidade;

        return {
            x: this.projectile.origemX + (this.projectile.velocidadeX * tempo) + (0.5 * aceleracaoVento * tempo * tempo),
            y: this.projectile.origemY - (this.projectile.velocidadeY * tempo) + (0.5 * aceleracaoGravidade * tempo * tempo)
        };
    }

    verificarImpactoProjetil(x, y) {
        if (this.projetilSaiuDaTela(x, y)) {
            return { tipo: 'fora' };
        }

        if (this.astroFoiAtingido(x, y)) {
            return { tipo: 'astro', x, y };
        }

        const gorilaAtingido = this.gorilaFoiAtingido(x, y);
        if (gorilaAtingido) {
            return { tipo: 'gorila', jogador: gorilaAtingido, x, y };
        }

        if (this.cidadeTemMaterialEm(x, y)) {
            return { tipo: 'predio', x, y };
        }

        return { tipo: 'nenhum' };
    }

    projetilSaiuDaTela(x, y) {
        return x < -20 || x > this.larguraTela + 20 || y < -60 || y > this.alturaTela + 20;
    }

    astroFoiAtingido(x, y) {
        const astro = this.obterAreaAstro();
        if (!astro) return false;
        return this.distanciaEntrePontos(x, y, astro.x, astro.y) <= astro.raio;
    }

    obterAreaAstro() {
        const cena = this.obterCenaAtual();
        if (!cena || cena.astro === 'nenhum') {
            return null;
        }

        const sprite = cena.astro === 'lua' ? this.sprites.lua : this.sprites.sol;
        const raio = (sprite.larguraQuadro * 1.5) / 2;
        return {
            tipo: cena.astro,
            x: this.larguraTela * cena.astroPos.x,
            y: this.alturaTela * cena.astroPos.y,
            raio
        };
    }

    gorilaFoiAtingido(x, y) {
        for (let jogador = 1; jogador <= 2; jogador += 1) {
            const distancia = this.obterDistanciaProjetilGorila(jogador, x, y);
            if (distancia <= 0) {
                return jogador;
            }
        }

        return null;
    }

    verificarQuaseAcerto(x, y) {
        if (!this.projectile.ativo || this.projectile.quaseAcertoDisparado) {
            return;
        }

        const margemQuase = 28;

        for (let jogador = 1; jogador <= 2; jogador += 1) {
            if (jogador === this.projectile.jogador) {
                continue;
            }

            const distancia = this.obterDistanciaProjetilGorila(jogador, x, y);

            if (distancia > 0 && distancia <= margemQuase) {
                this.projectile.quaseAcertoDisparado = true;
                this.feedbackDuelo = {
                    texto: `Quase em ${this.jogadores[jogador].nome}!`,
                    tempo: 0.68,
                    duracao: 0.68,
                    jogador
                };
                this.aplicarScreenShake(3, 0.12);
                this.tocarSomQuaseAcerto();
                return;
            }
        }
    }

    obterZonasHitboxGorila(jogador) {
        const config = this.obterConfigGorila();
        const gorila = this.gorilas[jogador];
        if (!gorila) {
            return [];
        }

        const zonas = config.hitbox?.zonas;
        if (Array.isArray(zonas) && zonas.length > 0) {
            return zonas.map((zona) => ({
                x: gorila.x + gorila.largura * zona.x,
                y: gorila.y + gorila.altura * zona.y,
                raio: zona.raio
            }));
        }

        const raioPadrao = config.hitbox?.raio || 20;
        const offsetY = config.hitbox?.offsetY || 0.5;
        return [{
            x: gorila.x + gorila.largura / 2,
            y: gorila.y + gorila.altura * offsetY,
            raio: raioPadrao
        }];
    }

    obterDistanciaProjetilGorila(jogador, x, y) {
        const zonas = this.obterZonasHitboxGorila(jogador);
        if (zonas.length === 0) {
            return Infinity;
        }

        let menorDistancia = Infinity;
        zonas.forEach((zona) => {
            const distancia = this.distanciaEntrePontos(x, y, zona.x, zona.y) - zona.raio;
            if (distancia < menorDistancia) {
                menorDistancia = distancia;
            }
        });

        return menorDistancia;
    }

    cidadeTemMaterialEm(x, y) {
        const sampleX = Math.round(x);
        const sampleY = Math.round(y);

        if (sampleX < 0 || sampleY < 0 || sampleX >= this.larguraTela || sampleY >= this.alturaTela) {
            return false;
        }

        const alpha = this.bufferColisaoCtx.getImageData(sampleX, sampleY, 1, 1).data[3];
        return alpha > 0;
    }

    resolverImpacto(impacto) {
        if (impacto.tipo === 'predio') {
            this.aplicarExplosao(impacto.x, impacto.y, this.escalaFisica.raioExplosao);
            this.ajustarPosicaoGorilas();
            this.spawnarParticulas(impacto.x, impacto.y, 'predio');
            this.spawnarImpactoVisual(impacto.x, impacto.y, 'predio');
            this.aplicarScreenShake(8, 0.22);
            this.tocarSomExplosao('predio');
            this.game.astroAtingido = false;
            this.encerrarTurno();
            return;
        }

        if (impacto.tipo === 'gorila') {
            const vencedor = impacto.jogador === 1 ? 2 : 1;
            this.jogadores[vencedor].pontos += 1;
            this.spawnarParticulas(impacto.x, impacto.y, 'gorila');
            this.spawnarImpactoVisual(impacto.x, impacto.y, 'gorila');
            this.aplicarScreenShake(14, 0.32);
            this.tocarSomExplosao('gorila');
            this.atualizarHUD();
            this.iniciarAnimacaoAcerto(vencedor, impacto.jogador, impacto.x, impacto.y);
            return;
        }

        if (impacto.tipo === 'astro') {
            this.game.astroAtingido = true;
            this.spawnarImpactoVisual(impacto.x, impacto.y, 'sol');
            this.aplicarScreenShake(5, 0.18);
            this.encerrarTurno();
            return;
        }

        this.game.astroAtingido = false;
        this.encerrarTurno();
    }

    iniciarAnimacaoAcerto(vencedor, perdedor, x, y) {
        const gorilaPerdedor = this.gorilas[perdedor];
        this.projectile = this.criarEstadoProjetil();
        this.animacaoAcerto = {
            vencedor,
            perdedor,
            x: x || gorilaPerdedor.x + gorilaPerdedor.largura / 2,
            y: y || gorilaPerdedor.y + gorilaPerdedor.altura / 2,
            tempo: 0,
            duracao: 2.1
        };
    }

    aplicarExplosao(x, y, raio) {
        const pontos = [];
        const segmentos = 10 + this.numeroAleatorio(0, 4);

        for (let i = 0; i < segmentos; i += 1) {
            const angulo = (Math.PI * 2 * i) / segmentos;
            const ruido = 0.74 + Math.random() * 0.36;
            pontos.push({
                angulo,
                raio: raio * ruido
            });
        }

        this.crateras.push({ x, y, raio, pontos });
        this.desenharCidadeNoBuffer();
    }

    desenharFormaCratera(ctx, cratera, ajuste = 0) {
        const pontos = cratera.pontos || [];

        if (pontos.length === 0) {
            ctx.beginPath();
            ctx.arc(cratera.x, cratera.y, cratera.raio + ajuste, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        ctx.beginPath();
        pontos.forEach((ponto, indice) => {
            const raio = Math.max(3, ponto.raio + ajuste);
            const px = cratera.x + Math.cos(ponto.angulo) * raio;
            const py = cratera.y + Math.sin(ponto.angulo) * raio;
            if (indice === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        });
        ctx.closePath();
        ctx.fill();
    }

    ajustarPosicaoGorilas() {
        [1, 2].forEach(j => {
            const g = this.gorilas[j];
            if (!g || !g.vivo) return;

            const footY = Math.floor(g.y + g.altura);
            const cx = Math.floor(g.x + g.largura / 2);

            // Verifica se ainda existe chão nos primeiros 3px abaixo dos pés
            const temChao = this.cidadeTemMaterialEm(cx, footY) ||
                            this.cidadeTemMaterialEm(cx, footY + 1) ||
                            this.cidadeTemMaterialEm(cx, footY + 2);

            if (!temChao) {
                // Procura o próximo pixel sólido abaixo
                for (let ny = footY + 3; ny < this.alturaTela; ny++) {
                    if (this.cidadeTemMaterialEm(cx, ny)) {
                        g.y = ny - g.altura;
                        return;
                    }
                }
            }
        });
    }

    encerrarTurno() {
        this.projectile = this.criarEstadoProjetil();
        this.efeitoLancamento = null;
        this.game.jogadorAtual = this.game.jogadorAtual === 1 ? 2 : 1;
        this.sortearVento();
        this._verificarTurnoIA();
    }

    reiniciarRodada(vencedorId) {
        if (this.jogadores[vencedorId].pontos >= this.game.limitePontos) {
            this.exibirVitoria(vencedorId);
            return;
        }

        this.game.rodada += 1;
        this.avancarCenaDoDia();

        this.projectile = this.criarEstadoProjetil();
        this.rastro = [];
        this.game.jogadorAtual = vencedorId;
        this.game.astroAtingido = false;
        this.animacaoAcerto = null;
        this.efeitoLancamento = null;
        this.impactosVisuais = [];
        this.crateras = [];
        this.gerarCidade();
        this.posicionarGorilas();
        this.sortearVento();
        this.desenhar();
        this._verificarTurnoIA();
    }

    exibirVitoria(vendedorId) {
        const vencedor = this.jogadores[vendedorId];
        const p1 = this.jogadores[1].pontos;
        const p2 = this.jogadores[2].pontos;

        // Parar o loop PRIMEIRO para evitar qualquer frame adicional
        this.game.iniciado = false;
        this.animacaoAcerto = null;
        this.projectile = this.criarEstadoProjetil();

        this.transicionarTela(document.getElementById('tela-jogo'), document.getElementById('tela-vitoria'));
        document.getElementById('tela-vitoria').style.display = 'flex';
        document.body.classList.remove('menu-ativa');
        
        this.tocarSomVitoria();
        this.atualizarAmbiencia('vitoria');
        document.getElementById('msg-vitoria').textContent = `${vencedor.nome.toUpperCase()} VENCEU!`;
        document.getElementById('placar-final').textContent = `Placar Final: ${p1} - ${p2}`;
    }

    desenhar() {
        if (!this.assetsCarregados) {
            return;
        }

        this.ctx.save();
        this.ctx.translate(this.screenShake.x, this.screenShake.y);
        this.desenharFundo();
        this.desenharAstro(this.game.astroAtingido ? 'surpreso' : 'sorrindo');
        this.desenharNuvens();
        this.desenharCidade();
        this.desenharRastro();
        this.desenharPreviewTrajetoria();
        this.desenharParticulas();
        this.desenharImpactosVisuais();
        this.desenharGorilas();
        this.desenharIndicadorTurno();
        this.desenharProjetil();

        if (this.animacaoAcerto) {
            this.desenharBannerPlacar();
        }

        this.desenharAnimacaoAcerto();
        this.ctx.restore();
    }

    desenharBannerPlacar() {
        const p1 = this.jogadores[1];
        const p2 = this.jogadores[2];
        const textoPlacar = `${p1.nome} ${p1.pontos}  > Score <  ${p2.pontos} ${p2.nome}`;
        
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        this.ctx.fillRect(0, this.alturaTela - 60, this.larguraTela, 45); // Banner estilo rodapé/central
        
        this.ctx.font = '700 18px "Outfit"';
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(textoPlacar.toUpperCase(), this.larguraTela / 2, this.alturaTela - 30);
        this.ctx.restore();
    }

    desenharFundo() {
        const cena = this.obterCenaAtual();
        const astro = this.obterAreaAstro();

        const gradCeu = this.ctx.createLinearGradient(0, 0, 0, this.alturaTela);
        gradCeu.addColorStop(0, cena.sky[0]);
        gradCeu.addColorStop(0.4, cena.sky[1]);
        gradCeu.addColorStop(0.76, cena.sky[2]);
        gradCeu.addColorStop(1, cena.sky[3]);
        this.ctx.fillStyle = gradCeu;
        this.ctx.fillRect(0, 0, this.larguraTela, this.alturaTela);

        if (cena.horizonGlow > 0) {
            const brilhoHorizonte = this.ctx.createLinearGradient(0, this.alturaTela * 0.52, 0, this.alturaTela);
            brilhoHorizonte.addColorStop(0, 'rgba(255, 200, 120, 0)');
            brilhoHorizonte.addColorStop(0.55, `rgba(255, 184, 112, ${cena.horizonGlow * 0.46})`);
            brilhoHorizonte.addColorStop(1, `rgba(255, 128, 92, ${cena.horizonGlow * 0.72})`);
            this.ctx.fillStyle = brilhoHorizonte;
            this.ctx.fillRect(0, this.alturaTela * 0.48, this.larguraTela, this.alturaTela * 0.52);
        }

        if (cena.stars > 0) {
            this.desenharEstrelas(cena.stars);
        }

        if (astro && cena.astroGlow > 0) {
            const corAstro = astro.tipo === 'lua'
                ? `rgba(206, 223, 255, ${0.28 * cena.astroGlow})`
                : `rgba(255, 231, 132, ${0.42 * cena.astroGlow})`;
            const brilho = this.ctx.createRadialGradient(
                astro.x, astro.y, astro.raio * 0.7,
                astro.x, astro.y, astro.raio * 4.6
            );
            brilho.addColorStop(0, corAstro);
            brilho.addColorStop(0.36, astro.tipo === 'lua'
                ? `rgba(180, 208, 255, ${0.14 * cena.astroGlow})`
                : `rgba(255, 221, 110, ${0.16 * cena.astroGlow})`);
            brilho.addColorStop(1, 'rgba(255,255,255,0)');
            this.ctx.fillStyle = brilho;
            this.ctx.beginPath();
            this.ctx.arc(astro.x, astro.y, astro.raio * 4.6, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.desenharSkylineDistante();
        this.desenharBrumaAtmosferica();
    }

    desenharSkylineDistante() {
        const camadas = [
            { faixa: this.city.fundoDistante, deslocamento: this.alturaTela * 0.05, nome: 'distante' },
            { faixa: this.city.fundoMedio, deslocamento: this.alturaTela * 0.025, nome: 'medio' }
        ];

        camadas.forEach(({ faixa, deslocamento, nome }) => {
            if (!faixa || faixa.length === 0) return;
            this.ctx.save();
            faixa.forEach((predio, indice) => {
                const y = predio.yTopo + deslocamento + (indice % 2) * 8;
                const estilo = this.obterEstiloPredioFundo(predio, indice, nome);
                const frenteGrad = this.ctx.createLinearGradient(predio.x, y, predio.x, y + predio.altura);
                frenteGrad.addColorStop(0, estilo.frenteTopo);
                frenteGrad.addColorStop(1, estilo.frenteBase);
                this.ctx.fillStyle = frenteGrad;
                this.ctx.fillRect(predio.x, y, predio.largura, predio.altura);

                this.ctx.fillStyle = estilo.lateral;
                this.ctx.beginPath();
                this.ctx.moveTo(predio.x + predio.largura, y);
                this.ctx.lineTo(predio.x + predio.largura + estilo.profundidade, y - estilo.profundidade * 0.32);
                this.ctx.lineTo(predio.x + predio.largura + estilo.profundidade, y + predio.altura - estilo.profundidade * 0.1);
                this.ctx.lineTo(predio.x + predio.largura, y + predio.altura);
                this.ctx.closePath();
                this.ctx.fill();

                this.ctx.fillStyle = estilo.topo;
                this.ctx.beginPath();
                this.ctx.moveTo(predio.x, y);
                this.ctx.lineTo(predio.x + predio.largura, y);
                this.ctx.lineTo(predio.x + predio.largura + estilo.profundidade, y - estilo.profundidade * 0.32);
                this.ctx.lineTo(predio.x + estilo.profundidade * 0.45, y - estilo.profundidade * 0.32);
                this.ctx.closePath();
                this.ctx.fill();

                if (predio.luzes?.length) {
                    predio.luzes.forEach((luz) => {
                        this.ctx.fillStyle = luz.intensidade > 0.4 ? estilo.janelaAcesa : estilo.janelaApagada;
                        this.ctx.fillRect(luz.x, luz.y + deslocamento + (indice % 2) * 8, luz.largura, luz.altura);
                    });
                }
            });
            this.ctx.restore();
        });
    }

    desenharBrumaAtmosferica() {
        const grad = this.ctx.createLinearGradient(0, this.alturaTela * 0.48, 0, this.alturaTela);
        grad.addColorStop(0, 'rgba(255, 195, 113, 0)');
        grad.addColorStop(0.55, 'rgba(255, 158, 87, 0.08)');
        grad.addColorStop(1, 'rgba(17, 24, 39, 0.2)');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, this.alturaTela * 0.4, this.larguraTela, this.alturaTela * 0.6);

        const vinheta = this.ctx.createRadialGradient(
            this.larguraTela * 0.5,
            this.alturaTela * 0.45,
            this.larguraTela * 0.2,
            this.larguraTela * 0.5,
            this.alturaTela * 0.5,
            this.larguraTela * 0.75
        );
        vinheta.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vinheta.addColorStop(1, 'rgba(7, 10, 20, 0.22)');
        this.ctx.fillStyle = vinheta;
        this.ctx.fillRect(0, 0, this.larguraTela, this.alturaTela);

        const tempo = Date.now() / 1000;
        this.ctx.save();
        this.ctx.globalAlpha = 0.06;
        for (let i = 0; i < 3; i += 1) {
            const y = this.alturaTela * (0.58 + i * 0.08) + Math.sin(tempo * (0.35 + i * 0.08) + i) * 8;
            const gradFaixa = this.ctx.createLinearGradient(0, y - 18, 0, y + 18);
            gradFaixa.addColorStop(0, 'rgba(255, 196, 120, 0)');
            gradFaixa.addColorStop(0.5, 'rgba(255, 196, 120, 0.9)');
            gradFaixa.addColorStop(1, 'rgba(255, 196, 120, 0)');
            this.ctx.fillStyle = gradFaixa;
            this.ctx.fillRect(0, y - 18, this.larguraTela, 36);
        }
        this.ctx.restore();
    }

    desenharNuvens() {
        this.ctx.save();
        const cena = this.obterCenaAtual();
        const f = cena.nightFactor || 0;
        const areaSol = this.obterAreaAstro() || {
            x: this.larguraTela * 0.78,
            y: this.alturaTela * 0.2
        };
        const tempo = performance.now() / 1000;

        this.nuvens
            .slice()
            .sort((a, b) => (a.profundidade || 0) - (b.profundidade || 0))
            .forEach(nuvem => {
            const volumeFundo = nuvem.volumeFundo || {};
            const volumeFrente = nuvem.volumeFrente || {};
            const distanciaSol = Math.abs(nuvem.x - areaSol.x);
            const influenciaSol = Math.max(0, 1 - distanciaSol / (this.larguraTela * 0.42))
                * (cena.astro === 'sol' ? 1 - f * 0.65 : 0.16)
                * (0.35 + nuvem.brilhoQuente * 0.65);
            const deformacao = Math.sin(tempo * (0.32 + (nuvem.profundidade || 0) * 0.08) + nuvem.deformacaoFase);
            const escalaX = (nuvem.escalaBaseX || 1) * (1 + deformacao * (nuvem.deformacaoAmplitudeX || 0));
            const escalaY = (nuvem.escalaBaseY || 1) * (1 - deformacao * (nuvem.deformacaoAmplitudeY || 0));
            const opacidade = nuvem.opacidadeBase * (1 - f * 0.38);
            const sombraAlpha = 0.1 + (nuvem.profundidade || 0) * 0.04 + f * 0.06;
            const fundoAlpha = 0.18 + (nuvem.profundidade || 0) * 0.08;
            const brilhoSuperior = 0.72 + influenciaSol * 0.18 - f * 0.18;
            const meioBranco = 0.68 - f * 0.18;
            const baseFria = 0.56 - f * 0.12;

            this.ctx.save();
            this.ctx.globalAlpha = fundoAlpha * opacidade;
            this.desenharFormaNuvem(this.ctx, nuvem, {
                offsetX: volumeFundo.offsetX || -10,
                offsetY: volumeFundo.offsetY || 8,
                escalaX: (volumeFundo.escalaX || 0.8) * escalaX,
                escalaY: (volumeFundo.escalaY || 0.82) * escalaY
            });
            this.ctx.fillStyle = `rgba(${180 - f * 34}, ${204 - f * 30}, ${236 - f * 18}, 0.92)`;
            this.ctx.fill();
            this.ctx.restore();

            const grad = this.ctx.createLinearGradient(0, nuvem.y - nuvem.alturaTotal * 0.55, 0, nuvem.y + nuvem.alturaTotal * 0.5);
            grad.addColorStop(0, `rgba(${255 - f * 28}, ${248 - f * 10}, ${236 + influenciaSol * 16}, ${brilhoSuperior})`);
            grad.addColorStop(0.52, `rgba(${236 - f * 22}, ${242 - f * 16}, ${252 - f * 10}, ${meioBranco})`);
            grad.addColorStop(1, `rgba(${188 - f * 20}, ${208 - f * 18}, ${238 - f * 10}, ${baseFria})`);

            this.desenharFormaNuvem(this.ctx, nuvem, {
                escalaX,
                escalaY
            });
            this.ctx.fillStyle = grad;
            this.ctx.shadowColor = `rgba(255, 220, 170, ${0.06 + influenciaSol * 0.12})`;
            this.ctx.shadowBlur = 8 + (nuvem.profundidade || 0) * 2;
            this.ctx.fill();

            this.desenharFormaNuvem(this.ctx, nuvem, {
                offsetX: volumeFrente.offsetX || nuvem.larguraTotal * 0.04,
                offsetY: volumeFrente.offsetY || -nuvem.alturaTotal * 0.04,
                escalaX: escalaX * (volumeFrente.escalaX || 0.64),
                escalaY: escalaY * (volumeFrente.escalaY || 0.58)
            });
            const brilhoFrontal = this.ctx.createLinearGradient(
                nuvem.x,
                nuvem.y - nuvem.alturaTotal * 0.36,
                nuvem.x + nuvem.larguraTotal * 0.16,
                nuvem.y + nuvem.alturaTotal * 0.12
            );
            brilhoFrontal.addColorStop(0, `rgba(255, 246, 232, ${volumeFrente.alpha + influenciaSol * 0.12})`);
            brilhoFrontal.addColorStop(1, 'rgba(255,255,255,0)');
            this.ctx.fillStyle = brilhoFrontal;
            this.ctx.shadowBlur = 0;
            this.ctx.fill();

            this.desenharFormaNuvem(this.ctx, nuvem, {
                offsetX: -nuvem.larguraTotal * (0.04 + (nuvem.profundidade || 0) * 0.01),
                offsetY: nuvem.alturaTotal * (0.02 + (nuvem.profundidade || 0) * 0.008),
                escalaX: escalaX * 0.9,
                escalaY: escalaY * 0.86
            });
            const sombra = this.ctx.createLinearGradient(0, nuvem.y, 0, nuvem.y + nuvem.alturaTotal * 0.48);
            sombra.addColorStop(0, 'rgba(255,255,255,0)');
            sombra.addColorStop(1, `rgba(${150 - f * 18}, ${176 - f * 20}, ${216 - f * 12}, ${sombraAlpha})`);
            this.ctx.fillStyle = sombra;
            this.ctx.shadowBlur = 0;
            this.ctx.fill();
        });
        this.ctx.restore();
    }

    desenharCidade() {
        this.ctx.drawImage(this.bufferCidade, 0, 0);
        this.desenharPrimeiroPlano();
    }

    desenharPrimeiroPlano() {
        if (!this.city.primeiroPlano || this.city.primeiroPlano.length === 0) return;

        this.ctx.save();
        this.ctx.fillStyle = 'rgba(9, 14, 26, 0.72)';
        this.city.primeiroPlano.forEach((item, indice) => {
            const y = this.alturaTela - item.altura * 0.7;
            const largura = item.largura * 0.72;
            this.ctx.fillRect(item.x + (indice % 3) * 5, y, largura, item.altura);
        });
        this.ctx.fillStyle = 'rgba(255, 190, 120, 0.05)';
        this.city.primeiroPlano.forEach((item, indice) => {
            const y = this.alturaTela - item.altura * 0.7;
            const largura = item.largura * 0.72;
            this.ctx.fillRect(item.x + (indice % 3) * 5, y, Math.max(2, largura * 0.08), item.altura);
        });
        this.ctx.restore();
    }

    desenharGorilas() {
        if (this.animacaoAcerto) {
            const poseVencedor = Math.floor(this.animacaoAcerto.tempo / 0.32) % 2 === 0 ? 'comemoracaoA' : 'comemoracaoB';
            const vencedor = this.animacaoAcerto.vencedor;
            const impulso = Math.abs(Math.sin(this.animacaoAcerto.tempo * 6.8));

            this.desenharGorila(vencedor, poseVencedor, {
                deslocamentoYExtra: -impulso * 8,
                escalaExtra: 1 + impulso * 0.04
            });

            // O perdedor some na explosão instantaneamente (como no original)
            return;
        }

        this.desenharGorila(1, 'idle');
        this.desenharGorila(2, 'idle');
    }

    desenharProjetil() {
        if (!this.projectile.ativo) {
            return;
        }

        const anguloMovimento = Math.atan2(
            -(this.projectile.velocidadeY - (this.game.gravidade * this.escalaFisica.gravidade * this.projectile.tempoVoo)),
            this.projectile.velocidadeX + (this.game.vento * this.escalaFisica.vento * this.projectile.tempoVoo)
        );
        const rastroBrilho = this.rastro[this.rastro.length - 1];
        if (rastroBrilho) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.22;
            this.ctx.fillStyle = 'rgba(255, 214, 122, 0.9)';
            this.ctx.beginPath();
            this.ctx.ellipse(rastroBrilho.x, rastroBrilho.y, 7, 4, anguloMovimento, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        this.desenharBanana(
            this.projectile.x - this.sprites.banana.larguraQuadro / 2,
            this.projectile.y - this.sprites.banana.alturaQuadro / 2,
            this.projectile.rotacao,
            anguloMovimento
        );
    }

    desenharAnimacaoAcerto() {
        if (!this.animacaoAcerto) {
            return;
        }
    }

    desenharAstro(expressao = 'sorrindo') {
        const astro = this.obterAreaAstro();
        if (!astro) return;

        const sprite = astro.tipo === 'lua' ? this.sprites.lua : this.sprites.sol;
        const largura = sprite.larguraQuadro * 1.5;
        const altura = sprite.alturaQuadro * 1.5;
        const x = astro.x - largura / 2;
        const y = astro.y - altura / 2;
        const quadroX = (sprite.expressoes?.[expressao] || 0) * sprite.larguraQuadro;

        this.ctx.save();
        if (sprite.disponivel) {
            this.ctx.drawImage(
                sprite.imagem,
                quadroX, 0,
                sprite.larguraQuadro, sprite.alturaQuadro,
                x, y,
                largura, altura
            );
        } else if (astro.tipo === 'lua') {
            this.desenharLuaFallback(astro);
        } else {
            this.ctx.fillStyle = '#ffd966';
            this.ctx.beginPath();
            this.ctx.arc(astro.x, astro.y, astro.raio, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }

    desenharLuaFallback(astro) {
        this.ctx.save();
        this.ctx.fillStyle = '#dce7ff';
        this.ctx.beginPath();
        this.ctx.arc(astro.x, astro.y, astro.raio, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.beginPath();
        this.ctx.arc(astro.x + astro.raio * 0.34, astro.y - astro.raio * 0.08, astro.raio * 0.82, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    desenharGorila(jogador, pose = 'idle', opcoes = {}) {
        const gorila = this.sprites.gorila;
        const posicao = this.gorilas[jogador];
        const largura = posicao.largura || gorila.larguraQuadro;
        const altura = posicao.altura || gorila.alturaQuadro;
        const efeitoLancamento = this.efeitoLancamento && this.efeitoLancamento.jogador === jogador
            ? this.efeitoLancamento
            : null;
        const progressoLancamento = efeitoLancamento
            ? Math.min(1, efeitoLancamento.tempo / efeitoLancamento.duracao)
            : 0;
        const recuo = efeitoLancamento
            ? Math.sin(progressoLancamento * Math.PI) * 9
            : 0;
        const deslocamentoX = jogador === 1 ? -recuo : recuo;
        const deslocamentoY = efeitoLancamento ? -Math.sin(progressoLancamento * Math.PI) * 4 : 0;
        let poseRender = pose;

        if (efeitoLancamento) {
            const lancandoParaDireita = jogador === 1;
            if (progressoLancamento < 0.38) {
                poseRender = lancandoParaDireita ? 'antecipacaoDireita' : 'antecipacaoEsquerda';
            } else if (progressoLancamento < 0.66) {
                poseRender = lancandoParaDireita ? 'lancamentoDireita' : 'lancamentoEsquerdo';
            } else {
                poseRender = lancandoParaDireita ? 'retornoDireita' : 'retornoEsquerdo';
            }
        }

        const idleAtivo = !this.projectile.ativo && !this.animacaoAcerto;
        const idlePulso = idleAtivo ? Math.sin(Date.now() / 520 + jogador * 0.9) : 0;
        const idleY = idleAtivo ? Math.max(0, idlePulso) * 0.65 : 0;
        const idleScale = idleAtivo ? 1 + Math.max(0, idlePulso) * 0.005 : 1;
        const esquivaAtiva = this.feedbackDuelo && this.feedbackDuelo.jogador === jogador;
        const esquivaProgresso = esquivaAtiva
            ? 1 - (this.feedbackDuelo.tempo / (this.feedbackDuelo.duracao || 0.68))
            : 0;
        const esquivaPulso = esquivaAtiva ? Math.sin(esquivaProgresso * Math.PI * 1.1) : 0;
        if (esquivaAtiva && !efeitoLancamento) {
            poseRender = 'susto';
        }
        const escalaFinal = idleScale * (opcoes.escalaExtra || 1);
        const larguraFinal = largura * escalaFinal;
        const alturaFinal = altura * escalaFinal;
        const esquivaX = esquivaAtiva ? (jogador === 1 ? -1 : 1) * esquivaPulso * 3.5 : 0;
        const esquivaY = esquivaAtiva ? Math.abs(esquivaPulso) * 2.4 : 0;
        const xFinal = posicao.x + deslocamentoX + esquivaX - (larguraFinal - largura) / 2;
        const yFinal = posicao.y + deslocamentoY + idleY + esquivaY + (opcoes.deslocamentoYExtra || 0) - (alturaFinal - altura);
        const elevacaoVisual = Math.max(0, (posicao.y + posicao.altura) - (yFinal + alturaFinal));

        this.desenharSombraGorila({
            ...posicao,
            x: posicao.x + deslocamentoX * 0.18,
            y: posicao.y,
            largura: largura,
            altura: altura,
            elevacaoVisual
        });

        this.ctx.drawImage(
            gorila.imagem,
            gorila.poses[poseRender] * gorila.larguraQuadro,
            0,
            gorila.larguraQuadro,
            gorila.alturaQuadro,
            xFinal,
            yFinal,
            larguraFinal,
            alturaFinal
        );
    }

    desenharSombraGorila(posicao) {
        const centroX = posicao.x + posicao.largura / 2;
        const baseY = posicao.y + posicao.altura - 2;
        const elevacao = posicao.elevacaoVisual || 0;
        const escalaX = Math.max(0.72, 1 - elevacao * 0.035);
        const escalaY = Math.max(0.6, 1 - elevacao * 0.05);
        this.ctx.save();
        this.ctx.fillStyle = `rgba(7, 10, 20, ${Math.max(0.16, 0.28 - elevacao * 0.02)})`;
        this.ctx.beginPath();
        this.ctx.ellipse(
            centroX,
            baseY,
            posicao.largura * 0.24 * escalaX,
            posicao.altura * 0.08 * escalaY,
            0,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        this.ctx.restore();
    }

    desenharBanana(x, y, rotacao, anguloMovimento = 0) {
        const banana = this.sprites.banana;
        const quadroX = rotacao * banana.larguraQuadro;
        const centroX = x + banana.larguraQuadro / 2;
        const centroY = y + banana.alturaQuadro / 2;

        this.ctx.save();
        this.ctx.translate(centroX, centroY);
        this.ctx.rotate(anguloMovimento * 0.18);
        this.ctx.fillStyle = 'rgba(98, 63, 18, 0.22)';
        this.ctx.fillRect(-8, 7, 16, 4);
        this.ctx.restore();

        this.ctx.drawImage(
            banana.imagem,
            quadroX,
            0,
            banana.larguraQuadro,
            banana.alturaQuadro,
            x,
            y,
            banana.larguraQuadro,
            banana.alturaQuadro
        );
    }

    _selecionarModo(modo) {
        const ia = modo === 'hxm';
        document.getElementById('modo-hxh').classList.toggle('ativo', !ia);
        document.getElementById('modo-hxm').classList.toggle('ativo', ia);
        document.getElementById('campo-dificuldade').classList.toggle('escondido', !ia);
        const p2card = document.querySelector('.cartao-jogador.p2');
        if (p2card) p2card.classList.toggle('is-cpu', ia);
        const input2 = document.getElementById('jogador2');
        if (ia) { input2.value = 'CPU'; input2.disabled = true; }
        else { input2.value = ''; input2.disabled = false; }
    }

    _verificarTurnoIA() {
        if (this.game.modoIA && this.game.jogadorAtual === 2 &&
            this.game.iniciado && !this.projectile.ativo && !this.animacaoAcerto) {
            this.agendarTurnoIA();
        }
    }

    simularTiro(anguloBase, velocidade) {
        const angulo = 180 - anguloBase;
        const origem = this.obterOrigemArremesso(2);
        const anguloRad = (angulo * Math.PI) / 180;
        const velEscalada = velocidade * this.escalaFisica.velocidade;
        const vX = Math.cos(anguloRad) * velEscalada;
        const vY = Math.sin(anguloRad) * velEscalada;
        const acVento = this.game.vento * this.escalaFisica.vento;
        const acGrav = this.game.gravidade * this.escalaFisica.gravidade;

        const alvo = this.gorilas[1];
        const alvoX = alvo.x + alvo.largura / 2;
        const alvoY = alvo.y + alvo.altura / 2;

        let minDist = Infinity;
        const dt = 0.04;
        for (let t = dt; t <= 6; t += dt) {
            const x = origem.x + vX * t + 0.5 * acVento * t * t;
            const y = origem.y - vY * t + 0.5 * acGrav * t * t;
            if (x < -20 || x > this.larguraTela + 20 || y > this.alturaTela + 20) break;
            const dist = Math.hypot(x - alvoX, y - alvoY);
            if (dist < minDist) minDist = dist;
        }
        return minDist;
    }

    calcularTiroIA() {
        if (this.game.dificuldadeIA === 'facil' && Math.random() < 0.30) {
            return {
                angulo: this.numeroAleatorio(10, 80),
                velocidade: this.numeroAleatorio(20, 80)
            };
        }

        let melhorAngulo = 45, melhorVelocidade = 50, melhorDist = Infinity;
        for (let ang = 5; ang <= 85; ang += 3) {
            for (let vel = 10; vel <= 100; vel += 5) {
                const dist = this.simularTiro(ang, vel);
                if (dist < melhorDist) {
                    melhorDist = dist;
                    melhorAngulo = ang;
                    melhorVelocidade = vel;
                }
            }
        }

        const ruido = { facil: [12, 12], medio: [4, 5], dificil: [1, 1] };
        const [rA, rV] = ruido[this.game.dificuldadeIA] || ruido.medio;
        return {
            angulo: Math.max(5, Math.min(85, melhorAngulo + (Math.random() * 2 - 1) * rA)),
            velocidade: Math.max(10, Math.min(100, melhorVelocidade + (Math.random() * 2 - 1) * rV))
        };
    }

    agendarTurnoIA() {
        // Fase 1: mostrar "CPU pensando..." por 1000-1500ms
        this.game.cpuPensando = true;
        const delayPensar = 1000 + Math.random() * 500;

        setTimeout(() => {
            if (!this.game.iniciado || this.game.jogadorAtual !== 2) {
                this.game.cpuPensando = false;
                this.atualizarHUD();
                return;
            }

            const tiro = this.calcularTiroIA();

            // Fase 2: revelar ângulo/velocidade escolhidos por 600ms
            const inpAng = document.getElementById('angulo2');
            const inpVel = document.getElementById('velocidade2');
            const rangeVel = document.getElementById('velocidade-range2');
            if (inpAng) inpAng.value = Math.round(tiro.angulo);
            if (inpVel) inpVel.value = Math.round(tiro.velocidade);
            if (rangeVel) rangeVel.value = Math.round(tiro.velocidade);

            this.game.cpuPensando = false;
            this.atualizarHUD();

            // Fase 3: lançar após breve pausa para o humano ver os valores
            setTimeout(() => {
                if (!this.game.iniciado || this.projectile.ativo || this.animacaoAcerto) return;
                if (this.game.jogadorAtual !== 2) return;
                this.rastro = [];
                this.tocarSomLancamento();
                this.iniciarArremessoIA(tiro.angulo, tiro.velocidade);
            }, 600);
        }, delayPensar);
    }

    iniciarArremessoIA(anguloBase, velocidade) {
        const angulo = 180 - anguloBase;
        const origem = this.obterOrigemArremesso(2);
        const anguloRad = (angulo * Math.PI) / 180;
        const velEscalada = velocidade * this.escalaFisica.velocidade;
        this.efeitoLancamento = {
            jogador: 2,
            tempo: 0,
            duracao: 0.36
        };

        this.projectile = {
            ativo: true,
            jogador: 2,
            origemX: origem.x,
            origemY: origem.y,
            anguloGraus: angulo,
            anguloRadianos: anguloRad,
            velocidade,
            velocidadeX: Math.cos(anguloRad) * velEscalada,
            velocidadeY: Math.sin(anguloRad) * velEscalada,
            tempoVoo: 0,
            x: origem.x,
            y: origem.y,
            rotacao: 0,
            quaseAcertoDisparado: false
        };
    }

    // --- RASTRO DA BANANA ---

    desenharRastro() {
        if (this.rastro.length < 2) return;
        this.ctx.save();
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        for (let i = 1; i < this.rastro.length; i++) {
            const anterior = this.rastro[i - 1];
            const atual = this.rastro[i];
            const progressoIdade = 1 - ((anterior.vida + atual.vida) * 0.5) / 0.52;
            const alphaBase = Math.max(0, Math.min(1, progressoIdade));
            if (alphaBase <= 0) continue;

            this.ctx.strokeStyle = `rgba(251, 146, 60, ${0.34 * alphaBase})`;
            this.ctx.lineWidth = 5 * alphaBase;
            this.ctx.beginPath();
            this.ctx.moveTo(anterior.x, anterior.y);
            this.ctx.lineTo(atual.x, atual.y);
            this.ctx.stroke();

            this.ctx.strokeStyle = `rgba(255, 236, 179, ${0.52 * alphaBase})`;
            this.ctx.lineWidth = Math.max(0.6, 1.25 * alphaBase);
            this.ctx.beginPath();
            this.ctx.moveTo(anterior.x, anterior.y);
            this.ctx.lineTo(atual.x, atual.y);
            this.ctx.stroke();
        }

        for (let i = 1; i < this.rastro.length; i += 2) {
            const ponto = this.rastro[i];
            const progressoIdade = 1 - (ponto.vida / 0.52);
            const alpha = Math.max(0, Math.min(0.28, progressoIdade * 0.28));
            if (alpha <= 0) continue;
            this.ctx.fillStyle = `rgba(255, 214, 122, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.ellipse(ponto.x, ponto.y, 2.8, 1.8, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }

    // --- PREVIEW DE TRAJETÓRIA ---

    desenharPreviewTrajetoria() {
        if (!this.game.mostrarTrajetoria) return;
        if (this.projectile.ativo || this.animacaoAcerto) return;
        if (this.game.modoIA && this.game.jogadorAtual === 2) return;

        const j = this.game.jogadorAtual;
        const inpAng = document.getElementById(`angulo${j}`);
        const inpVel = document.getElementById(`velocidade${j}`);
        if (!inpAng || !inpVel) return;

        const velocidade = Math.max(1, Number(inpVel.value) || 0);
        const anguloBase = Math.max(0, Math.min(360, Number(inpAng.value) || 0));
        const angulo = j === 1 ? anguloBase : 180 - anguloBase;
        const origem = this.obterOrigemArremesso(j);
        const anguloRad = (angulo * Math.PI) / 180;
        const velEsc = velocidade * this.escalaFisica.velocidade;
        const acVento = this.game.vento * this.escalaFisica.vento;
        const acGrav = this.game.gravidade * this.escalaFisica.gravidade;

        const pontos = [];
        for (let t = 0.05; t <= 8; t += 0.05) {
            const x = origem.x + Math.cos(anguloRad) * velEsc * t + 0.5 * acVento * t * t;
            const y = origem.y - Math.sin(anguloRad) * velEsc * t + 0.5 * acGrav * t * t;
            if (x < -20 || x > this.larguraTela + 20 || y > this.alturaTela + 20) break;
            if (this.cidadeTemMaterialEm(Math.round(x), Math.round(y))) break;
            pontos.push({ x, y });
        }

        if (pontos.length < 2) return;

        this.ctx.save();
        this.ctx.setLineDash([3, 9]);
        this.ctx.strokeStyle = 'rgba(245,158,11,0.38)';
        this.ctx.lineWidth = 1.8;
        this.ctx.beginPath();
        this.ctx.moveTo(pontos[0].x, pontos[0].y);
        pontos.forEach(p => this.ctx.lineTo(p.x, p.y));
        this.ctx.stroke();
        this.ctx.restore();
    }

    // --- PARTÍCULAS ---

    spawnarParticulas(x, y, tipo) {
        const configuracoes = {
            gorila: {
                count: 34,
                detritos: ['#f59e0b', '#ff7b00', '#ef4444', '#fbbf24', '#fff4d6'],
                fumaca: ['rgba(255,196,120,0.55)', 'rgba(255,122,0,0.3)', 'rgba(82,24,12,0.26)'],
                velocidadeBase: 90,
                velocidadeExtra: 135,
                gravidade: 180
            },
            predio: {
                count: 22,
                detritos: ['#5b6474', '#7c8798', '#9ca3af', '#d1d5db', '#fb923c'],
                fumaca: ['rgba(148,163,184,0.24)', 'rgba(51,65,85,0.22)', 'rgba(249,115,22,0.18)'],
                velocidadeBase: 65,
                velocidadeExtra: 95,
                gravidade: 240
            }
        };
        const cfg = configuracoes[tipo] || configuracoes.predio;

        for (let i = 0; i < cfg.count; i++) {
            const ang = (Math.PI * 2 * i) / cfg.count + (Math.random() - 0.5) * 0.9;
            const vel = cfg.velocidadeBase + Math.random() * cfg.velocidadeExtra;
            this.particulas.push({
                tipo: 'detrito',
                x, y,
                vx: Math.cos(ang) * vel,
                vy: Math.sin(ang) * vel - 40,
                vida: 0,
                vidaMax: 0.38 + Math.random() * 0.46,
                cor: cfg.detritos[Math.floor(Math.random() * cfg.detritos.length)],
                raio: 2 + Math.random() * 4,
                gravidade: cfg.gravidade,
                rotacao: Math.random() * Math.PI * 2,
                spin: (Math.random() * 2 - 1) * 10
            });
        }

        const fumacaCount = tipo === 'gorila' ? 10 : 8;
        for (let i = 0; i < fumacaCount; i++) {
            this.particulas.push({
                tipo: 'fumaca',
                x: x + (Math.random() * 2 - 1) * 8,
                y: y + (Math.random() * 2 - 1) * 8,
                vx: (Math.random() * 2 - 1) * 24,
                vy: -25 - Math.random() * 30,
                vida: 0,
                vidaMax: 0.45 + Math.random() * 0.35,
                cor: cfg.fumaca[Math.floor(Math.random() * cfg.fumaca.length)],
                raio: 10 + Math.random() * 16,
                gravidade: -18,
                crescimento: 18 + Math.random() * 18
            });
        }

        this.particulas.push({
            tipo: 'flash',
            x,
            y,
            vx: 0,
            vy: 0,
            vida: 0,
            vidaMax: tipo === 'gorila' ? 0.18 : 0.12,
            cor: tipo === 'gorila' ? 'rgba(255,244,214,0.9)' : 'rgba(255,214,122,0.55)',
            raio: tipo === 'gorila' ? 30 : 22,
            gravidade: 0
        });
    }

    atualizarParticulas(delta) {
        if (this.particulas.length === 0) return;
        this.particulas = this.particulas.filter(p => {
            p.vida += delta;
            p.x += p.vx * delta;
            p.y += p.vy * delta;
            p.vy += (p.gravidade ?? 220) * delta;
            if (p.tipo === 'detrito') {
                p.rotacao += (p.spin || 0) * delta;
            }
            return p.vida < p.vidaMax;
        });
    }

    desenharParticulas() {
        if (this.particulas.length === 0) return;
        this.ctx.save();
        this.particulas.forEach(p => {
            const alpha = 1 - p.vida / p.vidaMax;
            if (p.tipo === 'fumaca') {
                const raio = p.raio + (p.crescimento || 0) * (p.vida / p.vidaMax);
                this.ctx.globalAlpha = alpha * 0.65;
                this.ctx.fillStyle = p.cor;
                this.ctx.beginPath();
                this.ctx.ellipse(p.x, p.y, raio, raio * 0.72, 0, 0, Math.PI * 2);
                this.ctx.fill();
                return;
            }

            if (p.tipo === 'flash') {
                this.ctx.globalAlpha = alpha * 0.9;
                this.ctx.fillStyle = p.cor;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.raio * (0.35 + (p.vida / p.vidaMax) * 0.85), 0, Math.PI * 2);
                this.ctx.fill();
                return;
            }

            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rotacao || 0);
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = p.cor;
            const largura = Math.max(1.5, p.raio * (0.8 + alpha * 0.45));
            const altura = Math.max(1.5, p.raio * (0.55 + alpha * 0.25));
            this.ctx.fillRect(-largura / 2, -altura / 2, largura, altura);
            this.ctx.restore();
        });
        this.ctx.restore();
    }

    spawnarImpactoVisual(x, y, tipo) {
        const configuracoes = {
            predio: {
                ring: { cor: 'rgba(255, 179, 92, 0.6)', raio: 16, crescimento: 142, vida: 0.34, espessura: 5.5 },
                glow: { cor: 'rgba(255, 162, 82, 0.34)', raio: 22, crescimento: 96, vida: 0.28 },
                poeira: { count: 7, cor: 'rgba(179, 154, 132, 0.16)', raio: [15, 26], crescimento: [16, 30], vx: 36, vy: 28, vida: [0.34, 0.58] },
                streaks: 6
            },
            gorila: {
                ring: { cor: 'rgba(255, 238, 185, 0.85)', raio: 18, crescimento: 190, vida: 0.42, espessura: 6.5 },
                glow: { cor: 'rgba(255, 196, 112, 0.42)', raio: 28, crescimento: 132, vida: 0.36 },
                poeira: { count: 10, cor: 'rgba(255, 158, 102, 0.18)', raio: [18, 34], crescimento: [22, 38], vx: 52, vy: 36, vida: [0.42, 0.7] },
                streaks: 9
            },
            sol: {
                ring: { cor: 'rgba(255, 247, 170, 0.8)', raio: 15, crescimento: 158, vida: 0.32, espessura: 4.5 },
                glow: { cor: 'rgba(255, 210, 84, 0.36)', raio: 24, crescimento: 116, vida: 0.3 },
                poeira: { count: 5, cor: 'rgba(255, 222, 128, 0.12)', raio: [12, 20], crescimento: [12, 22], vx: 28, vy: 18, vida: [0.22, 0.4] },
                streaks: 4
            }
        };
        const cfg = configuracoes[tipo] || configuracoes.predio;

        this.impactosVisuais.push({
            tipo: 'ring',
            x,
            y,
            vida: 0,
            vidaMax: cfg.ring.vida,
            raio: cfg.ring.raio,
            crescimento: cfg.ring.crescimento,
            cor: cfg.ring.cor,
            espessura: cfg.ring.espessura
        });

        this.impactosVisuais.push({
            tipo: 'glow',
            x,
            y,
            vida: 0,
            vidaMax: cfg.glow.vida,
            raio: cfg.glow.raio,
            crescimento: cfg.glow.crescimento,
            cor: cfg.glow.cor
        });

        for (let i = 0; i < cfg.streaks; i += 1) {
            const angulo = (Math.PI * 2 * i) / cfg.streaks + (Math.random() - 0.5) * 0.5;
            this.impactosVisuais.push({
                tipo: 'streak',
                x,
                y,
                vida: 0,
                vidaMax: 0.14 + Math.random() * 0.12,
                comprimento: 12 + Math.random() * (tipo === 'gorila' ? 24 : 18),
                espessura: 2 + Math.random() * 2.4,
                angulo,
                cor: tipo === 'predio'
                    ? 'rgba(255, 210, 154, 0.72)'
                    : tipo === 'sol'
                        ? 'rgba(255, 248, 176, 0.86)'
                        : 'rgba(255, 244, 214, 0.88)'
            });
        }

        for (let i = 0; i < cfg.poeira.count; i += 1) {
            this.impactosVisuais.push({
                tipo: 'poeira',
                x: x + (Math.random() * 2 - 1) * 6,
                y: y + (Math.random() * 2 - 1) * 5,
                vida: 0,
                vidaMax: cfg.poeira.vida[0] + Math.random() * (cfg.poeira.vida[1] - cfg.poeira.vida[0]),
                raio: cfg.poeira.raio[0] + Math.random() * (cfg.poeira.raio[1] - cfg.poeira.raio[0]),
                crescimento: cfg.poeira.crescimento[0] + Math.random() * (cfg.poeira.crescimento[1] - cfg.poeira.crescimento[0]),
                vx: (Math.random() * 2 - 1) * cfg.poeira.vx,
                vy: -Math.random() * cfg.poeira.vy,
                cor: cfg.poeira.cor
            });
        }
    }

    atualizarImpactosVisuais(delta) {
        if (this.impactosVisuais.length === 0) return;

        this.impactosVisuais = this.impactosVisuais.filter((impacto) => {
            impacto.vida += delta;
            if (impacto.vx) impacto.x += impacto.vx * delta;
            if (impacto.vy) {
                impacto.y += impacto.vy * delta;
                impacto.vy += 26 * delta;
            }

            return impacto.vida < impacto.vidaMax;
        });
    }

    desenharImpactosVisuais() {
        if (this.impactosVisuais.length === 0) return;

        this.ctx.save();
        this.impactosVisuais.forEach((impacto) => {
            const progresso = impacto.vida / impacto.vidaMax;
            const alpha = Math.max(0, 1 - progresso);

            if (impacto.tipo === 'ring') {
                const raio = impacto.raio + impacto.crescimento * progresso;
                this.ctx.save();
                this.ctx.globalAlpha = alpha * 0.95;
                this.ctx.strokeStyle = impacto.cor;
                this.ctx.lineWidth = Math.max(1.1, impacto.espessura * (1 - progresso * 0.72));
                this.ctx.beginPath();
                this.ctx.arc(impacto.x, impacto.y, raio, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.restore();
                return;
            }

            if (impacto.tipo === 'glow') {
                const raio = impacto.raio + impacto.crescimento * progresso;
                const glow = this.ctx.createRadialGradient(impacto.x, impacto.y, 0, impacto.x, impacto.y, raio);
                glow.addColorStop(0, impacto.cor);
                glow.addColorStop(0.45, impacto.cor.replace(/[\d\.]+\)$/, `${(0.22 + alpha * 0.18).toFixed(3)})`));
                glow.addColorStop(1, 'rgba(255,255,255,0)');
                this.ctx.save();
                this.ctx.globalAlpha = alpha * 0.75;
                this.ctx.fillStyle = glow;
                this.ctx.beginPath();
                this.ctx.arc(impacto.x, impacto.y, raio, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
                return;
            }

            if (impacto.tipo === 'poeira') {
                const raio = impacto.raio + impacto.crescimento * progresso;
                this.ctx.save();
                this.ctx.globalAlpha = alpha * 0.5;
                this.ctx.fillStyle = impacto.cor;
                this.ctx.beginPath();
                this.ctx.ellipse(impacto.x, impacto.y, raio, raio * 0.58, 0, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
                return;
            }

            if (impacto.tipo === 'streak') {
                const comprimento = impacto.comprimento * (1 + progresso * 0.45);
                const dx = Math.cos(impacto.angulo) * comprimento;
                const dy = Math.sin(impacto.angulo) * comprimento;
                this.ctx.save();
                this.ctx.globalAlpha = alpha * 0.82;
                this.ctx.strokeStyle = impacto.cor;
                this.ctx.lineWidth = Math.max(0.8, impacto.espessura * (1 - progresso * 0.55));
                this.ctx.beginPath();
                this.ctx.moveTo(impacto.x, impacto.y);
                this.ctx.lineTo(impacto.x + dx, impacto.y + dy);
                this.ctx.stroke();
                this.ctx.restore();
            }
        });
        this.ctx.restore();
    }

    // --- INDICADOR DE TURNO ---

    desenharIndicadorTurno() {
        if (!this.game.iniciado || this.projectile.ativo || this.animacaoAcerto) return;

        const j = this.game.jogadorAtual;
        const gorila = this.gorilas[j];
        if (!gorila) return;

        const cx = gorila.x + gorila.largura / 2;
        const cy = gorila.y;
        const pulso = (Math.sin(Date.now() / 280) + 1) / 2;
        const yTri = cy - 14 - pulso * 7;

        this.ctx.save();
        this.ctx.globalAlpha = 0.7 + pulso * 0.3;
        this.ctx.fillStyle = j === 1 ? '#f59e0b' : '#3b82f6';
        this.ctx.beginPath();
        this.ctx.moveTo(cx - 8, yTri - 14);
        this.ctx.lineTo(cx + 8, yTri - 14);
        this.ctx.lineTo(cx, yTri);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
    }

    // --- DIA / NOITE: ESTRELAS ---

    gerarEstrelas() {
        this.estrelas = [];
        for (let i = 0; i < 90; i++) {
            this.estrelas.push({
                x: Math.random() * this.larguraTela,
                y: Math.random() * this.alturaTela * 0.65,
                raio: 0.5 + Math.random() * 1.5,
                fase: Math.random() * Math.PI * 2
            });
        }
    }

    desenharEstrelas(intensidade = 1) {
        if (this.estrelas.length === 0) return;
        const alphaBase = Math.max(0, Math.min(1, intensidade));
        const t = Date.now() / 1000;

        this.ctx.save();
        this.estrelas.forEach(s => {
            const brilho = 0.5 + 0.5 * Math.sin(t * 1.2 + s.fase);
            this.ctx.globalAlpha = alphaBase * (0.5 + 0.5 * brilho);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, s.raio, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.restore();
    }

    // --- ÁUDIO (Web Audio API) ---

    iniciarAudioCtx() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || /** @type {any} */ (window).webkitAudioContext)();
            this.audioMasterGain = this.audioCtx.createGain();
            this.audioSfxGain = this.audioCtx.createGain();
            this.audioAmbienceGain = this.audioCtx.createGain();

            this.audioMasterGain.gain.value = 0.92;
            this.audioSfxGain.gain.value = 0.94;
            this.audioAmbienceGain.gain.value = 0.0001;

            this.audioSfxGain.connect(this.audioMasterGain);
            this.audioAmbienceGain.connect(this.audioMasterGain);
            this.audioMasterGain.connect(this.audioCtx.destination);
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    obterSaidaSfx() {
        return this.audioSfxGain || this.audioCtx?.destination;
    }

    criarBufferRuido(duracao = 0.2, color = 'white') {
        const ctx = this.audioCtx;
        const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * duracao)), ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let ultimaAmostra = 0;

        for (let i = 0; i < data.length; i += 1) {
            const branco = Math.random() * 2 - 1;
            if (color === 'pink') {
                ultimaAmostra = 0.985 * ultimaAmostra + 0.015 * branco;
                data[i] = (ultimaAmostra + branco * 0.35) * 0.8;
            } else if (color === 'brown') {
                ultimaAmostra = Math.max(-1, Math.min(1, ultimaAmostra + branco * 0.09));
                data[i] = ultimaAmostra * 0.7;
            } else {
                data[i] = branco;
            }
        }

        return buffer;
    }

    garantirAmbienciaMenu() {
        try {
            this.iniciarAudioCtx();
            if (this.menuAmbience) {
                return;
            }

            const ctx = this.audioCtx;
            const ruido = ctx.createBufferSource();
            ruido.buffer = this.criarBufferRuido(2.8, 'brown');
            ruido.loop = true;

            const filtroRuido = ctx.createBiquadFilter();
            filtroRuido.type = 'lowpass';
            filtroRuido.frequency.value = 520;

            const ganhoRuido = ctx.createGain();
            ganhoRuido.gain.value = 0.12;

            const hum = ctx.createOscillator();
            hum.type = 'triangle';
            hum.frequency.value = 78;

            const filtroHum = ctx.createBiquadFilter();
            filtroHum.type = 'lowpass';
            filtroHum.frequency.value = 180;

            const ganhoHum = ctx.createGain();
            ganhoHum.gain.value = 0.035;

            const brilho = ctx.createOscillator();
            brilho.type = 'sine';
            brilho.frequency.value = 312;

            const ganhoBrilho = ctx.createGain();
            ganhoBrilho.gain.value = 0.012;

            const lfo = ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.08;

            const lfoGain = ctx.createGain();
            lfoGain.gain.value = 0.018;

            lfo.connect(lfoGain);
            lfoGain.connect(ganhoRuido.gain);

            ruido.connect(filtroRuido);
            filtroRuido.connect(ganhoRuido);
            ganhoRuido.connect(this.audioAmbienceGain);

            hum.connect(filtroHum);
            filtroHum.connect(ganhoHum);
            ganhoHum.connect(this.audioAmbienceGain);

            brilho.connect(ganhoBrilho);
            ganhoBrilho.connect(this.audioAmbienceGain);

            ruido.start();
            hum.start();
            brilho.start();
            lfo.start();

            this.menuAmbience = {
                ruido,
                hum,
                brilho,
                lfo
            };
        } catch (_) { /* Ambiente pode falhar silenciosamente */ }
    }

    atualizarAmbiencia(contexto = 'menu') {
        try {
            this.iniciarAudioCtx();
            this.garantirAmbienciaMenu();
            if (!this.audioCtx || !this.audioAmbienceGain) {
                return;
            }

            const alvo = contexto === 'menu'
                ? 0.055
                : contexto === 'vitoria'
                    ? 0.03
                    : 0.0001;
            const agora = this.audioCtx.currentTime;
            this.audioAmbienceGain.gain.cancelScheduledValues(agora);
            this.audioAmbienceGain.gain.setValueAtTime(Math.max(0.0001, this.audioAmbienceGain.gain.value), agora);
            this.audioAmbienceGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, alvo), agora + 0.55);
        } catch (_) { /* ignorar */ }
    }

    tocarSomLancamento() {
        try {
            this.iniciarAudioCtx();
            const ctx = this.audioCtx;
            const t = ctx.currentTime;
            const saida = this.obterSaidaSfx();

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(saida);
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(170, t);
            osc.frequency.exponentialRampToValueAtTime(520, t + 0.14);
            gain.gain.setValueAtTime(0.11, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
            osc.start(t);
            osc.stop(t + 0.22);

            const snap = ctx.createOscillator();
            const snapGain = ctx.createGain();
            snap.type = 'square';
            snap.frequency.setValueAtTime(118, t);
            snap.frequency.exponentialRampToValueAtTime(76, t + 0.045);
            snapGain.gain.setValueAtTime(0.03, t);
            snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
            snap.connect(snapGain);
            snapGain.connect(saida);
            snap.start(t);
            snap.stop(t + 0.06);

            const whoosh = ctx.createBufferSource();
            whoosh.buffer = this.criarBufferRuido(0.16, 'pink');
            const filt = ctx.createBiquadFilter();
            filt.type = 'bandpass';
            filt.frequency.setValueAtTime(840, t);
            filt.frequency.exponentialRampToValueAtTime(1160, t + 0.12);
            filt.Q.value = 1.2;
            const whooshGain = ctx.createGain();
            whooshGain.gain.setValueAtTime(0.028, t);
            whooshGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
            whoosh.connect(filt);
            filt.connect(whooshGain);
            whooshGain.connect(saida);
            whoosh.start(t);

            const assobio = ctx.createOscillator();
            const assobioGain = ctx.createGain();
            assobio.type = 'sine';
            assobio.frequency.setValueAtTime(820, t + 0.02);
            assobio.frequency.exponentialRampToValueAtTime(620, t + 0.16);
            assobioGain.gain.setValueAtTime(0.0001, t);
            assobioGain.gain.exponentialRampToValueAtTime(0.014, t + 0.03);
            assobioGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
            assobio.connect(assobioGain);
            assobioGain.connect(saida);
            assobio.start(t + 0.01);
            assobio.stop(t + 0.18);
        } catch (_) { /* AudioContext pode estar bloqueado */ }
    }

    tocarSomExplosao(tipo = 'predio') {
        try {
            this.iniciarAudioCtx();
            const ctx = this.audioCtx;
            const explosaoGorila = tipo === 'gorila';
            const saida = this.obterSaidaSfx();
            const src = ctx.createBufferSource();
            src.buffer = this.criarBufferRuido(explosaoGorila ? 0.44 : 0.32, explosaoGorila ? 'pink' : 'brown');
            const filt = ctx.createBiquadFilter();
            filt.type = 'lowpass';
            filt.frequency.value = explosaoGorila ? 680 : 300;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(explosaoGorila ? 1.05 : 0.82, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (explosaoGorila ? 0.55 : 0.4));
            src.connect(filt);
            filt.connect(gain);
            gain.connect(saida);
            src.start();

            if (explosaoGorila) {
                const ring = ctx.createOscillator();
                const ringGain = ctx.createGain();
                ring.type = 'triangle';
                ring.frequency.setValueAtTime(170, ctx.currentTime);
                ring.frequency.exponentialRampToValueAtTime(78, ctx.currentTime + 0.18);
                ringGain.gain.setValueAtTime(0.085, ctx.currentTime);
                ringGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
                ring.connect(ringGain);
                ringGain.connect(saida);
                ring.start(ctx.currentTime);
                ring.stop(ctx.currentTime + 0.22);

                const brilho = ctx.createOscillator();
                const brilhoGain = ctx.createGain();
                brilho.type = 'sine';
                brilho.frequency.setValueAtTime(980, ctx.currentTime);
                brilho.frequency.exponentialRampToValueAtTime(360, ctx.currentTime + 0.16);
                brilhoGain.gain.setValueAtTime(0.028, ctx.currentTime);
                brilhoGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
                brilho.connect(brilhoGain);
                brilhoGain.connect(saida);
                brilho.start(ctx.currentTime);
                brilho.stop(ctx.currentTime + 0.16);
            } else {
                const debris = ctx.createOscillator();
                const debrisGain = ctx.createGain();
                debris.type = 'square';
                debris.frequency.setValueAtTime(88, ctx.currentTime);
                debris.frequency.exponentialRampToValueAtTime(44, ctx.currentTime + 0.14);
                debrisGain.gain.setValueAtTime(0.028, ctx.currentTime);
                debrisGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
                debris.connect(debrisGain);
                debrisGain.connect(saida);
                debris.start(ctx.currentTime);
                debris.stop(ctx.currentTime + 0.14);

                const estalo = ctx.createBufferSource();
                estalo.buffer = this.criarBufferRuido(0.06, 'white');
                const estaloFilter = ctx.createBiquadFilter();
                estaloFilter.type = 'highpass';
                estaloFilter.frequency.value = 1180;
                const estaloGain = ctx.createGain();
                estaloGain.gain.setValueAtTime(0.018, ctx.currentTime);
                estaloGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
                estalo.connect(estaloFilter);
                estaloFilter.connect(estaloGain);
                estaloGain.connect(saida);
                estalo.start(ctx.currentTime + 0.01);
            }
        } catch (_) { /* ignorar */ }
    }

    tocarSomVitoria() {
        try {
            this.iniciarAudioCtx();
            const ctx = this.audioCtx;
            const saida = this.obterSaidaSfx();
            const notas = [523, 659, 784, 1047, 1318];
            notas.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(saida);
                const t = ctx.currentTime + i * 0.13;
                osc.frequency.setValueAtTime(freq, t);
                osc.type = i % 2 === 0 ? 'triangle' : 'sine';
                gain.gain.setValueAtTime(0.2, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
                osc.start(t);
                osc.stop(t + 0.3);
            });

            const baixo = ctx.createOscillator();
            const baixoGain = ctx.createGain();
            baixo.type = 'triangle';
            baixo.frequency.setValueAtTime(130, ctx.currentTime);
            baixo.frequency.exponentialRampToValueAtTime(196, ctx.currentTime + 0.42);
            baixoGain.gain.setValueAtTime(0.045, ctx.currentTime);
            baixoGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            baixo.connect(baixoGain);
            baixoGain.connect(saida);
            baixo.start(ctx.currentTime);
            baixo.stop(ctx.currentTime + 0.5);
        } catch (_) { /* ignorar */ }
    }

    tocarSomQuaseAcerto() {
        try {
            this.iniciarAudioCtx();
            const ctx = this.audioCtx;
            const t = ctx.currentTime;
            const saida = this.obterSaidaSfx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(920, t);
            osc.frequency.exponentialRampToValueAtTime(510, t + 0.095);
            gain.gain.setValueAtTime(0.042, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
            osc.connect(gain);
            gain.connect(saida);
            osc.start(t);
            osc.stop(t + 0.11);

            const ar = ctx.createBufferSource();
            ar.buffer = this.criarBufferRuido(0.09, 'pink');
            const arFiltro = ctx.createBiquadFilter();
            arFiltro.type = 'bandpass';
            arFiltro.frequency.value = 1650;
            arFiltro.Q.value = 1.4;
            const arGain = ctx.createGain();
            arGain.gain.setValueAtTime(0.012, t);
            arGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
            ar.connect(arFiltro);
            arFiltro.connect(arGain);
            arGain.connect(saida);
            ar.start(t);
        } catch (_) { /* ignorar */ }
    }

    // --- UTILITÁRIOS ---

    numeroAleatorio(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    distanciaEntrePontos(x1, y1, x2, y2) {
        return Math.hypot(x2 - x1, y2 - y1);
    }
}

window.addEventListener('load', () => {
    new JogoGorilas();
});
