class JogoGorilas {
    constructor() {
        this.canvas = document.getElementById('jogo');
        this.ctx = this.canvas.getContext('2d');
        this.bufferCidade = document.createElement('canvas');
        this.bufferCidadeCtx = this.bufferCidade.getContext('2d');

        this.inicializarCanvas();
        this.inicializarEstado();
        this.carregarAssets();
        this.configurarEventos();
    }

    inicializarCanvas() {
        const larguraViewport = Math.max(640, window.innerWidth - 80);

        this.larguraTela = Math.max(640, Math.min(larguraViewport, 1200));
        this.alturaTela = Math.max(420, Math.min(Math.floor(window.innerHeight * 0.7), 800));

        this.canvas.width = this.larguraTela;
        this.canvas.height = this.alturaTela;
        this.bufferCidade.width = this.larguraTela;
        this.bufferCidade.height = this.alturaTela;
    }

    inicializarEstado() {
        this.assetsCarregados = false;
        this.anguloAtual = 45;
        this.velocidadeAtual = 50;
        this.loopIniciado = false;
        this.animacaoAcerto = null;
        this.rastro = [];
        this.particulas = [];
        this.estrelas = [];
        this.audioCtx = null;

        this.game = {
            iniciado: false,
            jogadorAtual: 1,
            gravidade: 9.8,
            vento: 0,
            solAtingido: false,
            ultimoTempo: 0,
            modoIA: false,
            dificuldadeIA: 'medio',
            mostrarTrajetoria: true,
            faseDia: 0,
            rodada: 0,
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
            predios: []
        };

        this.nuvens = [];
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

    carregarAssets() {
        this.sprites = {
            gorila: {
                imagem: new Image(),
                larguraQuadro: 64,
                alturaQuadro: 64,
                poses: {
                    normal: 0,
                    bracoEsquerdo: 1,
                    bracoDireito: 2
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
            }
        };

        let imagensCarregadas = 0;
        const totalImagens = 3;

        const verificarCarregamento = () => {
            imagensCarregadas += 1;
            if (imagensCarregadas === totalImagens) {
                this.assetsCarregados = true;
                this.desenhar();
            }
        };

        const tratarErroImagem = (erro) => {
            console.error('Erro ao carregar imagem:', erro);
        };

        this.sprites.gorila.imagem.onload = verificarCarregamento;
        this.sprites.banana.imagem.onload = verificarCarregamento;
        this.sprites.sol.imagem.onload = verificarCarregamento;

        this.sprites.gorila.imagem.onerror = tratarErroImagem;
        this.sprites.banana.imagem.onerror = tratarErroImagem;
        this.sprites.sol.imagem.onerror = tratarErroImagem;

        this.sprites.gorila.imagem.src = 'assets/gorila.png';
        this.sprites.banana.imagem.src = 'assets/banana.png';
        this.sprites.sol.imagem.src = 'assets/sol.png';
    }

    configurarEventos() {
        const btnLancar = document.getElementById('lancar');
        const btnIniciar = document.getElementById('iniciar');
        const btnMenu = document.getElementById('btn-menu');

        // As atualizações dos valores ocorrem na hora do lançamento (iniciarArremesso)

        const btnModoHxH = document.getElementById('modo-hxh');
        const btnModoHxM = document.getElementById('modo-hxm');
        if (btnModoHxH) btnModoHxH.addEventListener('click', () => this._selecionarModo('hxh'));
        if (btnModoHxM) btnModoHxM.addEventListener('click', () => this._selecionarModo('hxm'));

        btnIniciar.addEventListener('click', () => this.iniciarJogo());
        btnLancar.addEventListener('click', () => this.iniciarArremesso());
        btnMenu.addEventListener('click', () => {
            // Usar style.display para garantir prioridade máxima (acima de qualquer CSS)
            document.getElementById('tela-vitoria').style.display = 'none';
            document.getElementById('tela-jogo').style.display = 'none';
            document.getElementById('tela-inicial').style.display = '';
            document.getElementById('tela-inicial').classList.remove('escondido');
            
            // Reset completo do estado
            this.game.iniciado = false;
            this.game.ultimoTempo = 0;
            this.animacaoAcerto = null;
            this.projectile = this.criarEstadoProjetil();
        });

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
            const num = document.getElementById(`velocidade${n}`);
            const range = document.getElementById(`velocidade-range${n}`);
            if (num && range) {
                num.addEventListener('input', () => { range.value = num.value; });
                range.addEventListener('input', () => { num.value = range.value; });
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
            const rangeVel = document.getElementById(`velocidade-range${j}`);
            if (!inpAng || !inpVel) return;

            if (Math.abs(dy) >= Math.abs(dx)) {
                // vertical → ângulo
                const novoAng = Math.max(0, Math.min(360, (parseInt(inpAng.value, 10) || 45) - dy * 0.5));
                inpAng.value = Math.round(novoAng);
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

    iniciarJogo() {
        try {
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
            this.game.solAtingido = false;
            this.game.mostrarTrajetoria = document.getElementById('mostrarTrajetoria')?.checked ?? true;
            this.game.faseDia = 0;
            this.game.rodada = 0;
            this.game.cpuPensando = false;
            this.projectile = this.criarEstadoProjetil();
            this.animacaoAcerto = null;
            this.rastro = [];
            this.particulas = [];
            this.gerarEstrelas();

            // Limpar estilos inline residuais e mostrar telas corretas
            document.getElementById('tela-inicial').style.display = '';
            document.getElementById('tela-vitoria').style.display = 'none';
            document.getElementById('tela-jogo').style.display = '';
            
            document.getElementById('tela-inicial').classList.add('escondido');
            document.getElementById('tela-vitoria').classList.add('escondido');
            document.getElementById('tela-jogo').classList.remove('escondido');

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

        if (this.projectile.ativo) {
            this.atualizarProjetil(delta);
        }

        this.atualizarNuvens(delta);
        this.atualizarParticulas(delta);

        // Animar os "..." do status da CPU no DOM
        if (this.game.cpuPensando) {
            const statusEl = document.getElementById('status-turno');
            if (statusEl) {
                const dots = '.'.repeat(Math.floor(Date.now() / 350) % 4);
                statusEl.textContent = `CPU pensando${dots}`;
            }
        }
    }

    atualizarNuvens(delta) {
        // Reduzida velocidade base: 0.15 -> 0.05 e removido multiplicador fixo alto (*100 -> *30)
        const fatorVento = this.game.vento * 0.05; 

        this.nuvens.forEach(nuvem => {
            // Movimento sutil e suave
            nuvem.x += (fatorVento * nuvem.velocidadeMult) * delta * 30;

            // Wrapping: se a nuvem sumir de um lado, volta pelo outro
            const margem = nuvem.larguraTotal + 20;
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

            this.city.predios.push({ x, largura, altura, yTopo });
            x += largura + this.numeroAleatorio(2, 7);
        }

        this.desenharCidadeNoBuffer();
        if (this.nuvens.length === 0) {
            this.gerarNuvens();
        }
    }

    gerarNuvens() {
        this.nuvens = [];
        const quantidade = 3; // Fixado em 3 conforme solicitado

        for (let i = 0; i < quantidade; i++) {
            const larguraTotal = this.numeroAleatorio(100, 200);
            const nuvem = {
                x: this.numeroAleatorio(-100, this.larguraTela),
                y: this.numeroAleatorio(40, this.alturaTela * 0.35),
                velocidadeMult: 0.5 + Math.random() * 1.5, // Multiplicador para o paralaxe
                larguraTotal,
                circulos: []
            };

            // Cada nuvem é composta por 3 a 5 círculos sobrepostos
            const numCirculos = this.numeroAleatorio(3, 5);
            for (let j = 0; j < numCirculos; j++) {
                nuvem.circulos.push({
                    relX: (j * (larguraTotal / numCirculos)) - (larguraTotal / 4),
                    relY: this.numeroAleatorio(-15, 15),
                    raio: this.numeroAleatorio(25, 45)
                });
            }
            this.nuvens.push(nuvem);
        }
    }

    desenharCidadeNoBuffer() {
        const ctx = this.bufferCidadeCtx;
        ctx.clearRect(0, 0, this.larguraTela, this.alturaTela);

        // Desenhar Asfalto/Solo na base para os prédios não "flutuarem"
        ctx.fillStyle = '#111827'; // Cinza muito escuro/preto para o solo
        ctx.fillRect(0, this.alturaTela - 15, this.larguraTela, 15);

        this.city.predios.forEach((predio, indice) => {
            const tomBase = 60 + (indice % 4) * 15;
            // Cores mais quentes para o entardecer (mistura de cinza com tons terrosos/laranjas)
            ctx.fillStyle = `rgb(${tomBase + 10}, ${tomBase}, ${tomBase - 5})`;
            ctx.fillRect(predio.x, predio.yTopo, predio.largura, predio.altura);

            const larguraJanela = Math.max(6, Math.floor(predio.largura / 6));
            const alturaJanela = Math.max(10, Math.floor(this.alturaTela / 28));
            const espacamentoX = larguraJanela + 5;
            const espacamentoY = alturaJanela + 9;

            for (let janelaX = predio.x + 6; janelaX <= predio.x + predio.largura - larguraJanela - 4; janelaX += espacamentoX) {
                for (let janelaY = predio.yTopo + 8; janelaY <= predio.yTopo + predio.altura - alturaJanela - 6; janelaY += espacamentoY) {
                    ctx.fillStyle = Math.random() < 0.45 ? '#f1c40f' : '#23303d';
                    ctx.fillRect(janelaX, janelaY, larguraJanela, alturaJanela);
                }
            }
        });
    }

    posicionarGorilas() {
        if (this.city.predios.length < 4) {
            return;
        }

        const sprite = this.sprites?.gorila || { larguraQuadro: 64, alturaQuadro: 64 };
        const margem = Math.min(2, Math.floor(this.city.predios.length / 4));
        const indiceEsquerda = Math.min(this.city.predios.length - 1, margem + 1);
        const indiceDireita = Math.max(0, this.city.predios.length - margem - 2);
        const predio1 = this.city.predios[indiceEsquerda];
        const predio2 = this.city.predios[indiceDireita];

        this.gorilas[1] = {
            x: predio1.x + predio1.largura / 2 - sprite.larguraQuadro / 2,
            y: predio1.yTopo - sprite.alturaQuadro,
            largura: sprite.larguraQuadro,
            altura: sprite.alturaQuadro,
            vivo: true
        };

        this.gorilas[2] = {
            x: predio2.x + predio2.largura / 2 - sprite.larguraQuadro / 2,
            y: predio2.yTopo - sprite.alturaQuadro,
            largura: sprite.larguraQuadro,
            altura: sprite.alturaQuadro,
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
        document.getElementById('texto-placar1').textContent =
            `${this.jogadores[1].nome}: ${this.jogadores[1].pontos}`;
        document.getElementById('texto-placar2').textContent =
            `${this.jogadores[2].nome}: ${this.jogadores[2].pontos}`;
            
        document.getElementById('placar-jogador1').classList.toggle('ativo', this.game.jogadorAtual === 1);
        document.getElementById('placar-jogador2').classList.toggle('ativo', this.game.jogadorAtual === 2);
        
        document.getElementById('angulo1').disabled = this.game.jogadorAtual !== 1;
        document.getElementById('velocidade1').disabled = this.game.jogadorAtual !== 1;
        document.getElementById('angulo2').disabled = this.game.jogadorAtual !== 2;
        document.getElementById('velocidade2').disabled = this.game.jogadorAtual !== 2;

        if (this.game.modoIA) {
            document.getElementById('controle-p2').style.visibility = 'hidden';
            document.getElementById('lancar').disabled = this.game.jogadorAtual === 2;
        } else {
            document.getElementById('controle-p2').style.visibility = '';
            document.getElementById('lancar').disabled = false;
        }

        // Sincronizar sliders com os valores atuais dos inputs (ex: após CPU definir valores)
        ['1', '2'].forEach(n => {
            const num = document.getElementById(`velocidade${n}`);
            const range = document.getElementById(`velocidade-range${n}`);
            if (num && range) range.value = num.value;
        });

        // Status de turno no DOM (texto fixo — o "CPU pensando..." é atualizado no loop)
        const statusEl = document.getElementById('status-turno');
        if (statusEl && !this.game.cpuPensando) {
            statusEl.textContent = this.game.iniciado
                ? `Vez de ${this.jogadores[this.game.jogadorAtual].nome}`
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
            rotacao: 0
        };
    }

    obterOrigemArremesso(jogador) {
        const gorila = this.gorilas[jogador];
        const deslocamentoX = jogador === 1 ? gorila.largura * 0.72 : gorila.largura * 0.28;

        return {
            x: gorila.x + deslocamentoX,
            y: gorila.y + gorila.altura * 0.22
        };
    }

    atualizarProjetil(delta) {
        this.projectile.tempoVoo += delta;

        const posicao = this.calcularPosicaoProjetil(this.projectile.tempoVoo);
        this.projectile.x = posicao.x;
        this.projectile.y = posicao.y;
        this.projectile.rotacao = Math.floor(this.projectile.tempoVoo * 12) % this.sprites.banana.totalQuadros;

        // Registrar posição no rastro (a cada ~3 frames para não criar pontos demais)
        if (this.rastro.length === 0 || Math.hypot(
            posicao.x - this.rastro[this.rastro.length - 1].x,
            posicao.y - this.rastro[this.rastro.length - 1].y
        ) > 8) {
            this.rastro.push({ x: posicao.x, y: posicao.y });
        }

        const impacto = this.verificarImpactoProjetil(this.projectile.x, this.projectile.y);
        if (impacto.tipo !== 'nenhum') {
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

        if (this.solFoiAtingido(x, y)) {
            return { tipo: 'sol', x, y };
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

    solFoiAtingido(x, y) {
        const sol = this.obterAreaSol();
        return this.distanciaEntrePontos(x, y, sol.x, sol.y) <= sol.raio;
    }

    obterAreaSol() {
        const f = this.game ? (this.game.faseDia || 0) : 0;
        const raio = (this.sprites.sol.larguraQuadro * 1.5) / 2;
        const yTopo = 20 + raio;
        // O sol desce em direção ao horizonte (≈40% da tela) conforme anoitece
        const yHorizonte = this.alturaTela * 0.40;
        return {
            x: this.larguraTela / 2,
            y: yTopo + (yHorizonte - yTopo) * f,
            raio
        };
    }

    gorilaFoiAtingido(x, y) {
        const raioAcerto = 20;

        for (let jogador = 1; jogador <= 2; jogador += 1) {
            const gorila = this.gorilas[jogador];
            const centroX = gorila.x + gorila.largura / 2;
            const centroY = gorila.y + gorila.altura / 2;

            if (this.distanciaEntrePontos(x, y, centroX, centroY) <= raioAcerto) {
                return jogador;
            }
        }

        return null;
    }

    cidadeTemMaterialEm(x, y) {
        const sampleX = Math.round(x);
        const sampleY = Math.round(y);

        if (sampleX < 0 || sampleY < 0 || sampleX >= this.larguraTela || sampleY >= this.alturaTela) {
            return false;
        }

        const alpha = this.bufferCidadeCtx.getImageData(sampleX, sampleY, 1, 1).data[3];
        return alpha > 0;
    }

    resolverImpacto(impacto) {
        if (impacto.tipo === 'predio') {
            this.aplicarExplosao(impacto.x, impacto.y, this.escalaFisica.raioExplosao);
            this.ajustarPosicaoGorilas();
            this.spawnarParticulas(impacto.x, impacto.y, 'predio');
            this.tocarSomExplosao();
            this.game.solAtingido = false;
            this.encerrarTurno();
            return;
        }

        if (impacto.tipo === 'gorila') {
            const vencedor = impacto.jogador === 1 ? 2 : 1;
            this.jogadores[vencedor].pontos += 1;
            this.spawnarParticulas(impacto.x, impacto.y, 'gorila');
            this.tocarSomExplosao();
            this.atualizarHUD();
            this.iniciarAnimacaoAcerto(vencedor, impacto.jogador, impacto.x, impacto.y);
            return;
        }

        if (impacto.tipo === 'sol') {
            this.game.solAtingido = true;
            this.encerrarTurno();
            return;
        }

        this.game.solAtingido = false;
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
            duracao: 1.8
        };
    }

    aplicarExplosao(x, y, raio) {
        const ctx = this.bufferCidadeCtx;
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, raio, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
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
        // Tarde=0 → Noite=1 ao longo de 8 rodadas
        this.game.faseDia = Math.min(1, this.game.rodada / 8);

        this.projectile = this.criarEstadoProjetil();
        this.rastro = [];
        this.game.jogadorAtual = vencedorId;
        this.game.solAtingido = false;
        this.animacaoAcerto = null;
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

        // Usar style.display diretamente (máxima prioridade, ignora especificidade CSS)
        document.getElementById('tela-jogo').style.display = 'none';
        document.getElementById('tela-vitoria').style.display = 'flex';
        document.getElementById('tela-vitoria').classList.remove('escondido');
        
        this.tocarSomVitoria();
        document.getElementById('msg-vitoria').textContent = `${vencedor.nome.toUpperCase()} VENCEU!`;
        document.getElementById('placar-final').textContent = `Placar Final: ${p1} - ${p2}`;
    }

    desenhar() {
        if (!this.assetsCarregados) {
            return;
        }

        this.desenharFundo();
        this.desenharSol(this.game.solAtingido ? 'surpreso' : 'sorrindo');
        this.desenharNuvens();
        this.desenharCidade();
        this.desenharRastro();
        this.desenharPreviewTrajetoria();
        this.desenharParticulas();
        this.desenharGorilas();
        this.desenharIndicadorTurno();
        this.desenharProjetil();

        if (this.animacaoAcerto) {
            this.desenharBannerPlacar();
        }

        this.desenharAnimacaoAcerto();
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
        const f = this.game.faseDia || 0;

        // Céu de tarde (sempre base)
        const gradTarde = this.ctx.createLinearGradient(0, 0, 0, this.alturaTela);
        gradTarde.addColorStop(0, '#1e4b8e');
        gradTarde.addColorStop(0.4, '#3b82f6');
        gradTarde.addColorStop(0.75, '#fb923c');
        gradTarde.addColorStop(1, '#ff7e5f');
        this.ctx.fillStyle = gradTarde;
        this.ctx.fillRect(0, 0, this.larguraTela, this.alturaTela);

        // Overlay de noite: funde sobre o céu de tarde conforme faseDia
        if (f > 0) {
            const gradNoite = this.ctx.createLinearGradient(0, 0, 0, this.alturaTela);
            gradNoite.addColorStop(0, '#020617');
            gradNoite.addColorStop(0.4, '#0f172a');
            gradNoite.addColorStop(0.75, '#1e293b');
            gradNoite.addColorStop(1, '#334155');
            this.ctx.save();
            this.ctx.globalAlpha = f;
            this.ctx.fillStyle = gradNoite;
            this.ctx.fillRect(0, 0, this.larguraTela, this.alturaTela);
            this.ctx.restore();
        }

        // Estrelas aparecem a partir da metade da transição
        if (f > 0.25) {
            this.desenharEstrelas(f);
        }

        // Brilho do Sol (some com a noite)
        if (f < 1) {
            const areaSol = this.obterAreaSol();
            const brilho = this.ctx.createRadialGradient(
                areaSol.x, areaSol.y, areaSol.raio * 0.8,
                areaSol.x, areaSol.y, areaSol.raio * 4
            );
            brilho.addColorStop(0, `rgba(255,255,150,${0.4 * (1 - f)})`);
            brilho.addColorStop(0.4, `rgba(255,255,0,${0.15 * (1 - f)})`);
            brilho.addColorStop(1, 'rgba(255,255,0,0)');
            this.ctx.fillStyle = brilho;
            this.ctx.beginPath();
            this.ctx.arc(areaSol.x, areaSol.y, areaSol.raio * 4, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    desenharNuvens() {
        this.ctx.save();
        this.nuvens.forEach(nuvem => {
            const { x, y, larguraTotal } = nuvem;
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.65)'; // Um pouco mais opacas para parecerem SVG
            this.ctx.beginPath();
            
            // Desenho estilizado tipo SVG (base achatada e topos arredondados variados)
            const base = y + 20;
            const r = larguraTotal / 4;
            
            // Desenha a "fofura" da nuvem com arcos
            this.ctx.moveTo(x - r, base);
            this.ctx.arc(x - r, base - r * 0.6, r * 0.8, Math.PI * 0.5, Math.PI * 1.5);
            this.ctx.arc(x, base - r * 1.2, r * 1.1, Math.PI * 1, Math.PI * 2);
            this.ctx.arc(x + r * 1.2, base - r * 0.8, r * 0.9, Math.PI * 1.2, Math.PI * 0.3);
            this.ctx.lineTo(x - r, base);
            
            // Sombra sutil na base para volume
            this.ctx.fill();
            this.ctx.fillStyle = 'rgba(200, 220, 255, 0.2)';
            this.ctx.fill();
        });
        this.ctx.restore();
    }

    desenharCidade() {
        this.ctx.drawImage(this.bufferCidade, 0, 0);
    }

    desenharGorilas() {
        if (this.animacaoAcerto) {
            // Dança da Vitória: 30% da velocidade anterior (0.08 -> 0.27s por pose)
            const poseVencedor = Math.floor(this.animacaoAcerto.tempo / 0.27) % 2 === 0 ? 'bracoEsquerdo' : 'bracoDireito';
            const vencedor = this.animacaoAcerto.vencedor;

            this.desenharGorila(vencedor, poseVencedor);

            // O perdedor some na explosão instantaneamente (como no original)
            return;
        }

        this.desenharGorila(1, this.game.jogadorAtual === 1 && !this.projectile.ativo ? 'bracoEsquerdo' : 'normal');
        this.desenharGorila(2, this.game.jogadorAtual === 2 && !this.projectile.ativo ? 'bracoDireito' : 'normal');
    }

    desenharProjetil() {
        if (!this.projectile.ativo) {
            return;
        }

        this.desenharBanana(
            this.projectile.x - this.sprites.banana.larguraQuadro / 2,
            this.projectile.y - this.sprites.banana.alturaQuadro / 2,
            this.projectile.rotacao
        );
    }

    desenharAnimacaoAcerto() {
        if (!this.animacaoAcerto) {
            return;
        }

        const progresso = this.animacaoAcerto.tempo / this.animacaoAcerto.duracao;
        const raioBase = this.escalaFisica.raioExplosao * (0.5 + progresso * 0.9);

        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0.15, 1 - progresso * 0.7);
        this.ctx.fillStyle = '#f5c542';
        this.ctx.beginPath();
        this.ctx.arc(this.animacaoAcerto.x, this.animacaoAcerto.y, raioBase, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = '#ff7b00';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.arc(this.animacaoAcerto.x, this.animacaoAcerto.y, raioBase * 0.65, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();
    }

    desenharSol(expressao = 'sorrindo') {
        const f = this.game.faseDia || 0;
        if (f >= 1) return;

        const sol = this.sprites.sol;
        const largura = sol.larguraQuadro * 1.5;
        const altura = sol.alturaQuadro * 1.5;
        const areaSol = this.obterAreaSol();

        const x = areaSol.x - largura / 2;
        const y = areaSol.y - altura / 2;
        const quadroX = sol.expressoes[expressao] * sol.larguraQuadro;

        this.ctx.save();
        this.ctx.globalAlpha = 1 - f;
        this.ctx.drawImage(
            sol.imagem,
            quadroX, 0,
            sol.larguraQuadro, sol.alturaQuadro,
            x, y,
            largura, altura
        );
        this.ctx.restore();
    }

    desenharGorila(jogador, pose = 'normal') {
        const gorila = this.sprites.gorila;
        const posicao = this.gorilas[jogador];
        const quadroX = gorila.poses[pose] * gorila.larguraQuadro;

        this.ctx.drawImage(
            gorila.imagem,
            quadroX,
            0,
            gorila.larguraQuadro,
            gorila.alturaQuadro,
            posicao.x,
            posicao.y,
            gorila.larguraQuadro,
            gorila.alturaQuadro
        );
    }

    desenharBanana(x, y, rotacao) {
        const banana = this.sprites.banana;
        const quadroX = rotacao * banana.larguraQuadro;

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
            rotacao: 0
        };
    }

    // --- RASTRO DA BANANA ---

    desenharRastro() {
        if (this.rastro.length < 2) return;
        this.ctx.save();
        this.ctx.setLineDash([4, 7]);
        this.ctx.strokeStyle = 'rgba(251,146,60,0.45)';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(this.rastro[0].x, this.rastro[0].y);
        for (let i = 1; i < this.rastro.length; i++) {
            this.ctx.lineTo(this.rastro[i].x, this.rastro[i].y);
        }
        this.ctx.stroke();
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
        this.ctx.strokeStyle = 'rgba(245,158,11,0.3)';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(pontos[0].x, pontos[0].y);
        pontos.forEach(p => this.ctx.lineTo(p.x, p.y));
        this.ctx.stroke();
        // Ponto final
        const fim = pontos[pontos.length - 1];
        this.ctx.setLineDash([]);
        this.ctx.fillStyle = 'rgba(245,158,11,0.45)';
        this.ctx.beginPath();
        this.ctx.arc(fim.x, fim.y, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    // --- PARTÍCULAS ---

    spawnarParticulas(x, y, tipo) {
        const count = tipo === 'gorila' ? 22 : 14;
        const paletas = {
            gorila: ['#f59e0b', '#ff7b00', '#ef4444', '#fbbf24', '#fff'],
            predio: ['#6b7280', '#9ca3af', '#f59e0b', '#fb923c', '#d1d5db']
        };
        const cores = paletas[tipo] || paletas.predio;

        for (let i = 0; i < count; i++) {
            const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
            const vel = 60 + Math.random() * 110;
            this.particulas.push({
                x, y,
                vx: Math.cos(ang) * vel,
                vy: Math.sin(ang) * vel - 40,
                vida: 0,
                vidaMax: 0.4 + Math.random() * 0.5,
                cor: cores[Math.floor(Math.random() * cores.length)],
                raio: 2 + Math.random() * 4
            });
        }
    }

    atualizarParticulas(delta) {
        if (this.particulas.length === 0) return;
        const grav = 220;
        this.particulas = this.particulas.filter(p => {
            p.vida += delta;
            p.x += p.vx * delta;
            p.y += p.vy * delta;
            p.vy += grav * delta;
            return p.vida < p.vidaMax;
        });
    }

    desenharParticulas() {
        if (this.particulas.length === 0) return;
        this.ctx.save();
        this.particulas.forEach(p => {
            const alpha = 1 - p.vida / p.vidaMax;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = p.cor;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.raio * alpha + 0.5, 0, Math.PI * 2);
            this.ctx.fill();
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

    desenharEstrelas(faseDia) {
        if (this.estrelas.length === 0) return;
        const alphaBase = Math.min(1, (faseDia - 0.25) / 0.5);
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
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    tocarSomLancamento() {
        try {
            this.iniciarAudioCtx();
            const ctx = this.audioCtx;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(520, ctx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.18, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.22);
        } catch (_) { /* AudioContext pode estar bloqueado */ }
    }

    tocarSomExplosao() {
        try {
            this.iniciarAudioCtx();
            const ctx = this.audioCtx;
            const bufSize = Math.floor(ctx.sampleRate * 0.35);
            const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < bufSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 1.8);
            }
            const src = ctx.createBufferSource();
            src.buffer = buf;
            const filt = ctx.createBiquadFilter();
            filt.type = 'lowpass';
            filt.frequency.value = 380;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.9, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            src.connect(filt);
            filt.connect(gain);
            gain.connect(ctx.destination);
            src.start();
        } catch (_) { /* ignorar */ }
    }

    tocarSomVitoria() {
        try {
            this.iniciarAudioCtx();
            const ctx = this.audioCtx;
            const notas = [523, 659, 784, 1047];
            notas.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                const t = ctx.currentTime + i * 0.16;
                osc.frequency.setValueAtTime(freq, t);
                gain.gain.setValueAtTime(0.25, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
                osc.start(t);
                osc.stop(t + 0.28);
            });
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
