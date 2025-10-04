// 1. Seleção de Elementos e Variáveis Globais
const form = document.getElementById('form-gasto');
const descricaoInput = document.getElementById('descricao');
const categoriaInput = document.getElementById('categoria');
const valorInput = document.getElementById('valor');
const resumoGastos = document.getElementById('resumo-gastos');
const historicoTransacoes = document.getElementById('historico-transacoes');
const totalGastosElement = document.getElementById('total-gastos');
const btnLimpar = document.getElementById('btn-limpar');

// Elementos para Novas Categorias
const novaCategoriaInput = document.getElementById('nova-categoria-input');
const btnAdicionarCategoria = document.getElementById('btn-adicionar-categoria');

// Elementos para Filtro
const filtroCategoria = document.getElementById('filtro-categoria'); 

// Elementos para Gráfico
const graficoContainer = document.getElementById('grafico-container'); 
const btnVisualizarGrafico = document.getElementById('btn-visualizar-grafico');

// Elemento para Exportação
const btnExportar = document.getElementById('btn-exportar'); 

let gastos = [];
let categorias = ["Casa", "Lazer", "Comida", "Outros"];
let indiceEmEdicao = null; 
let chartInstance = null; // Instância do Chart.js

// ----------------------------------------------------------------------
// PERSISTÊNCIA E UTILS
// ----------------------------------------------------------------------

const formatarMoeda = (valor) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Funções para Gastos
const salvarGastos = () => {
    localStorage.setItem('gastosSalvos', JSON.stringify(gastos));
};

const carregarGastos = () => {
    const gastosSalvos = localStorage.getItem('gastosSalvos');
    if (gastosSalvos) {
        gastos = JSON.parse(gastosSalvos);
    } 
    atualizarTudo(); 
};

// Funções para Categorias
const salvarCategorias = () => {
    localStorage.setItem('categoriasSalvas', JSON.stringify(categorias));
};

const carregarCategorias = () => {
    const categoriasSalvas = localStorage.getItem('categoriasSalvas');
    if (categoriasSalvas) {
        categorias = JSON.parse(categoriasSalvas);
    }
    popularSelectCategoria();
};

// ----------------------------------------------------------------------
// FUNÇÕES DE EXIBIÇÃO E GRÁFICOS
// ----------------------------------------------------------------------

const popularSelectCategoria = () => {
    categoriaInput.innerHTML = ''; 
    filtroCategoria.innerHTML = ''; 
    
    // 1. Adiciona a opção "Mostrar Todos" ao filtro
    const optTodos = document.createElement('option');
    optTodos.value = 'todos';
    optTodos.textContent = 'Mostrar Todos os Gastos';
    filtroCategoria.appendChild(optTodos);

    // 2. Adiciona as categorias a ambos os selects
    categorias.forEach(cat => {
        const optionForm = document.createElement('option');
        optionForm.value = cat;
        optionForm.textContent = cat;
        categoriaInput.appendChild(optionForm);
        
        const optionFiltro = document.createElement('option');
        optionFiltro.value = cat;
        optionFiltro.textContent = cat;
        filtroCategoria.appendChild(optionFiltro);
    });
};
// NOVO: Função para desenhar o gráfico de pizza, agora com porcentagens no tooltip
const desenharGrafico = (gastosPorCategoria) => {
    const canvas = document.getElementById('grafico-categorias');
    
    if (!canvas) return; 

    // Destroi instância anterior antes de criar nova
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    const labels = Object.keys(gastosPorCategoria);
    const dataValues = Object.values(gastosPorCategoria);
    
    // Calcula o total geral para a porcentagem
    const totalGeral = dataValues.reduce((sum, value) => sum + value, 0);

    // Gera cores aleatórias para melhor visualização
    const cores = labels.map(() => `hsl(${Math.random() * 360}, 70%, 50%)`);

    chartInstance = new Chart(canvas, {
        type: 'doughnut', 
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: cores,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: false,
                },
                // NOVO: CONFIGURAÇÃO DE TOOLTIPS
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const valor = context.parsed;
                            
                            // Calcula a porcentagem
                            const porcentagem = totalGeral === 0 ? 
                                0 : 
                                ((valor / totalGeral) * 100).toFixed(1);
                            
                            // Formata o valor para moeda (reutilizando a função)
                            const valorFormatado = formatarMoeda(valor);

                            return `${label}: ${valorFormatado} (${porcentagem}%)`;
                        }
                    }
                }
                // FIM DA NOVA CONFIGURAÇÃO
            }
        }
    });
};
// Função que exibe o histórico detalhado, baseada em uma lista de gastos (filtrada)
const exibirHistorico = (listaDeGastos) => { 
    historicoTransacoes.innerHTML = '';
    
    listaDeGastos.forEach((gasto, index) => { 
        // Encontra o índice no array ORIGINAL (gastos) para exclusão/edição
        const indexOriginal = gastos.indexOf(gasto); 
        
        const listItem = document.createElement('li');
        listItem.setAttribute('data-index', indexOriginal); 
        
        // Estrutura do item do histórico com botões de Ação
        listItem.innerHTML = `
            <span style="width:35%;">${gasto.descricao}</span>
            <span style="width:25%;">${gasto.categoria}</span>
            <strong style="width:20%; text-align:right;">${formatarMoeda(gasto.valor)}</strong>
            <div style="width:15%; text-align:right;">
                <button class="btn-historico btn-editar" data-index="${indexOriginal}" title="Editar Gasto">✎</button>
                <button class="btn-historico btn-excluir" data-index="${indexOriginal}" title="Excluir Gasto">X</button>
            </div>
        `;
        
        // Aplica o estilo flex para as colunas
        listItem.style.display = 'flex';
        listItem.style.justifyContent = 'space-between';
        listItem.style.alignItems = 'center';
        
        historicoTransacoes.appendChild(listItem);
    });
};

// Função principal para calcular o resumo por categoria
const calcularResumo = () => {
    const gastosPorCategoria = {};
    let totalGeral = 0;

    gastos.forEach(gasto => {
        const cat = gasto.categoria;
        totalGeral += gasto.valor;

        if (gastosPorCategoria[cat]) {
            gastosPorCategoria[cat] += gasto.valor;
        } else {
            gastosPorCategoria[cat] = gasto.valor;
        }
    });

    exibirResumo(gastosPorCategoria, totalGeral);
};

// Exibe o resumo na tela e chama o gráfico
const exibirResumo = (resumo, totalGeral) => {
    resumoGastos.innerHTML = ''; 

    for (const categoria in resumo) {
        const valorTotal = resumo[categoria];
        
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span>${categoria}</span>
            <strong>${formatarMoeda(valorTotal)}</strong>
        `;
        
        resumoGastos.appendChild(listItem);
    }
    
    totalGastosElement.textContent = formatarMoeda(totalGeral);
    
    // Sempre desenha/atualiza o gráfico (mesmo que esteja oculto)
    desenharGrafico(resumo); 
};

// ----------------------------------------------------------------------
// FUNÇÃO CENTRAL DE ATUALIZAÇÃO E FILTRO
// ----------------------------------------------------------------------

// Aplica o filtro e chama a atualização de histórico
const aplicarFiltro = () => {
    const categoriaSelecionada = filtroCategoria.value;
    let gastosFiltrados = gastos;

    if (categoriaSelecionada !== 'todos') {
        gastosFiltrados = gastos.filter(gasto => gasto.categoria === categoriaSelecionada);
    }
    
    exibirHistorico(gastosFiltrados);
    calcularResumo();
};


// Função que chama a atualização geral (inicia pelo filtro)
const atualizarTudo = () => {
    aplicarFiltro(); 
};

// ----------------------------------------------------------------------
// FUNÇÕES DE AÇÃO (GRÁFICO, EDIÇÃO, EXPORTAÇÃO, ETC.)
// ----------------------------------------------------------------------

// Função para mostrar/ocultar o gráfico
const alternarVisualizacaoGrafico = () => {
    const estaOculto = graficoContainer.hasAttribute('hidden');
    
    if (estaOculto) {
        graficoContainer.removeAttribute('hidden');
        btnVisualizarGrafico.textContent = "Ocultar Gráfico";
    } else {
        graficoContainer.setAttribute('hidden', '');
        btnVisualizarGrafico.textContent = "Visualizar Gráfico";
    }
};

// Adiciona nova categoria ao array e salva no localStorage
const adicionarNovaCategoria = () => {
    const novaCat = novaCategoriaInput.value.trim();
    
    if (novaCat && !categorias.includes(novaCat)) {
        categorias.push(novaCat);
        salvarCategorias();
        popularSelectCategoria();
        categoriaInput.value = novaCat; 
        novaCategoriaInput.value = '';
    } else if (categorias.includes(novaCat)) {
        alert("Esta categoria já existe.");
    }
};

// Função para converter dados para CSV e forçar o download
const exportarParaCSV = () => {
    if (gastos.length === 0) {
        alert("Não há gastos para exportar.");
        return;
    }

    // 1. Define o cabeçalho do arquivo CSV
    const cabecalho = ["Descricao", "Categoria", "Valor"].join(";") + "\n";
    
    // 2. Converte os dados: cada gasto vira uma linha separada por ponto e vírgula (;)
    const linhas = gastos.map(gasto => {
        // Usa replace('.', ',') para garantir que a formatação numérica seja compatível com CSV brasileiro
        const valorFormatado = gasto.valor.toFixed(2).replace('.', ',');
        return `${gasto.descricao};${gasto.categoria};R$ ${valorFormatado}`;
    }).join("\n");
    
    const csvContent = cabecalho + linhas;

    // 3. Cria um objeto Blob para o arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // 4. Cria um link temporário para forçar o download
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", "gastos_mensais.csv");
    
    // Simula o clique no link
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert("Dados exportados para gastos_mensais.csv!");
};


// Carrega o gasto selecionado para o formulário
const iniciarEdicao = (index) => {
    const gasto = gastos[index];
    
    descricaoInput.value = gasto.descricao;
    categoriaInput.value = gasto.categoria;
    valorInput.value = gasto.valor;
    
    indiceEmEdicao = index;
    
    form.querySelector('button[type="submit"]').textContent = "Salvar Edição";
    
    descricaoInput.focus();
    alert(`Editando o gasto: ${gasto.descricao}. Altere os campos e clique em 'Salvar Edição'.`);
};

// Gerencia os cliques nos botões de Excluir e Editar
const gerenciarAcoesHistorico = (e) => {
    const target = e.target;
    
    if (target.classList.contains('btn-excluir')) {
        const indexParaExcluir = parseInt(target.getAttribute('data-index'));
        const confirmacao = confirm("Tem certeza que deseja excluir este gasto?");
        if (confirmacao) {
            gastos.splice(indexParaExcluir, 1); 
            salvarGastos(); 
            atualizarTudo(); 
        }
    } else if (target.classList.contains('btn-editar')) {
        iniciarEdicao(parseInt(target.getAttribute('data-index')));
    }
};

// Adiciona um novo gasto ou salva a edição
const adicionarGasto = (e) => {
    e.preventDefault(); 

    const descricao = descricaoInput.value.trim(); 
    const valor = parseFloat(valorInput.value);
    const categoria = categoriaInput.value;

    if (descricao === '' || isNaN(valor) || valor <= 0 || categoria === '') {
        alert('Por favor, preencha a descrição, valor e categoria corretamente.');
        return;
    }

    const novoGastoOuEdicao = {
        descricao: descricao,
        valor: valor,
        categoria: categoria 
    };

    if (indiceEmEdicao !== null) {
        // MODO EDIÇÃO
        gastos[indiceEmEdicao] = novoGastoOuEdicao;
        
        // Reseta o modo edição e o botão
        indiceEmEdicao = null;
        form.querySelector('button[type="submit"]').textContent = "Adicionar Gasto";
        alert("Gasto editado com sucesso!");
    } else {
        // MODO ADIÇÃO NORMAL
        gastos.push(novoGastoOuEdicao);
        alert("Gasto adicionado com sucesso!");
    }
    
    salvarGastos(); 
    atualizarTudo();

    // Limpa o formulário
    descricaoInput.value = '';
    valorInput.value = '';
    descricaoInput.focus();
};

// Função para limpar todos os gastos
const limparTodosGastos = () => {
    const confirmacao = confirm("Tem certeza que deseja zerar TODOS os seus gastos? Esta ação não pode ser desfeita.");
    
    if (confirmacao) {
        gastos = []; 
        localStorage.removeItem('gastosSalvos');
        atualizarTudo();
        alert("Todos os gastos foram zerados com sucesso!");
    }
};

// ----------------------------------------------------------------------
// EVENT LISTENERS E INICIALIZAÇÃO
// ----------------------------------------------------------------------

form.addEventListener('submit', adicionarGasto);
btnLimpar.addEventListener('click', limparTodosGastos);
btnAdicionarCategoria.addEventListener('click', adicionarNovaCategoria);
historicoTransacoes.addEventListener('click', gerenciarAcoesHistorico); 
filtroCategoria.addEventListener('change', aplicarFiltro); 
btnVisualizarGrafico.addEventListener('click', alternarVisualizacaoGrafico);
btnExportar.addEventListener('click', exportarParaCSV); // NOVO OUVINTE DE EXPORTAÇÃO

// A ordem é importante: carrega categorias antes de carregar os gastos
carregarCategorias();
carregarGastos();