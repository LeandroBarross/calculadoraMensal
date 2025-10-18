// Seleção de Elementos e Variáveis Globais
const form = document.getElementById('form-gasto');
const descricaoInput = document.getElementById('descricao');
const categoriaInput = document.getElementById('categoria');
const valorInput = document.getElementById('valor');
const resumoGastos = document.getElementById('resumo-gastos');
const historicoTransacoes = document.getElementById('historico-transacoes');
const totalGastosElement = document.getElementById('total-gastos');
const btnLimpar = document.getElementById('btn-limpar');

const novaCategoriaInput = document.getElementById('nova-categoria-input');
const btnAdicionarCategoria = document.getElementById('btn-adicionar-categoria');

const filtroCategoria = document.getElementById('filtro-categoria'); 

const graficoContainer = document.getElementById('grafico-container'); 
const btnVisualizarGrafico = document.getElementById('btn-visualizar-grafico');

const btnExportar = document.getElementById('btn-exportar'); 

let gastos = [];
let categorias = ["Casa", "Lazer", "Comida", "Outros"];
let indiceEmEdicao = null; 
let chartInstance = null; // Instância do Chart.js

// Novos seletores para gerenciamento de categorias
const btnGerenciarCategorias = document.getElementById('btn-gerenciar-categorias');
const gerenciadorCategorias = document.getElementById('gerenciador-categorias');
const listaGerenciamentoCategorias = document.getElementById('lista-gerenciamento-categorias');
const btnFecharGerenciador = document.getElementById('btn-fechar-gerenciador');

// ----------------------------------------------------------------------
// PERSISTÊNCIA E UTILITÁRIOS
// ----------------------------------------------------------------------

const formatarMoeda = (valor) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

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
    
    // Adiciona a opção "Mostrar Todos" ao filtro
    const optTodos = document.createElement('option');
    optTodos.value = 'todos';
    optTodos.textContent = 'Mostrar Todos os Gastos';
    filtroCategoria.appendChild(optTodos);

    // Adiciona as categorias a ambos os selects
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

const desenharGrafico = (gastosPorCategoria) => {
    const canvas = document.getElementById('grafico-categorias');
    if (!canvas) return; 

    if (chartInstance) {
        chartInstance.destroy();
    }
    
    const labels = Object.keys(gastosPorCategoria);
    const dataValues = Object.values(gastosPorCategoria);
    const totalGeral = dataValues.reduce((sum, value) => sum + value, 0);
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
                legend: { position: 'top' },
                title: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const valor = context.parsed;
                            const porcentagem = totalGeral === 0 ? 0 : ((valor / totalGeral) * 100).toFixed(1);
                            const valorFormatado = formatarMoeda(valor);
                            return `${label}: ${valorFormatado} (${porcentagem}%)`;
                        }
                    }
                }
            }
        }
    });
};

const exibirHistorico = (listaDeGastos) => { 
    historicoTransacoes.innerHTML = '';
    
    listaDeGastos.forEach((gasto) => { 
        const indexOriginal = gastos.indexOf(gasto); 
        
        const listItem = document.createElement('li');
        listItem.setAttribute('data-index', indexOriginal); 
        
        listItem.innerHTML = `
            <span style="width:35%;">${gasto.descricao}</span>
            <span style="width:25%;">${gasto.categoria}</span>
            <strong style="width:20%; text-align:right;">${formatarMoeda(gasto.valor)}</strong>
            <div style="width:15%; text-align:right;">
                <button class="btn-historico btn-editar" data-index="${indexOriginal}" title="Editar Gasto">✎</button>
                <button class="btn-historico btn-excluir" data-index="${indexOriginal}" title="Excluir Gasto">X</button>
            </div>
        `;
        
        listItem.style.display = 'flex';
        listItem.style.justifyContent = 'space-between';
        listItem.style.alignItems = 'center';
        
        historicoTransacoes.appendChild(listItem);
    });
};

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
    desenharGrafico(resumo); 
};

// ----------------------------------------------------------------------
// FUNÇÃO CENTRAL DE ATUALIZAÇÃO E FILTRO
// ----------------------------------------------------------------------

const aplicarFiltro = () => {
    const categoriaSelecionada = filtroCategoria.value;
    let gastosFiltrados = gastos;

    if (categoriaSelecionada !== 'todos') {
        gastosFiltrados = gastos.filter(gasto => gasto.categoria === categoriaSelecionada);
    }
    
    exibirHistorico(gastosFiltrados);
    calcularResumo();
};

const atualizarTudo = () => {
    aplicarFiltro(); 
};

// ----------------------------------------------------------------------
// FUNÇÕES DE GERENCIAMENTO DE CATEGORIAS (NOVAS)
// ----------------------------------------------------------------------

const popularGerenciadorCategorias = () => {
    listaGerenciamentoCategorias.innerHTML = '';
    categorias.forEach((cat, index) => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span>${cat}</span>
            <button class="btn-excluir-cat" data-index="${index}" title="Excluir Categoria">X</button>
        `;
        listaGerenciamentoCategorias.appendChild(listItem);
    });
};

const alternarGerenciadorCategorias = () => {
    const estaOculto = gerenciadorCategorias.hasAttribute('hidden');
    if (estaOculto) {
        popularGerenciadorCategorias();
        gerenciadorCategorias.removeAttribute('hidden');
    } else {
        gerenciadorCategorias.setAttribute('hidden', '');
    }
};

const fecharGerenciador = () => {
    gerenciadorCategorias.setAttribute('hidden', '');
};

const excluirCategoria = (index) => {
    const categoriaParaExcluir = categorias[index];
    
    // Verifica se há gastos nessa categoria
    const gastosNaCategoria = gastos.filter(gasto => gasto.categoria === categoriaParaExcluir);
    
    if (gastosNaCategoria.length > 0) {
        // Move gastos para "Outros" e confirma exclusão
        const confirmacao = confirm(`A categoria "${categoriaParaExcluir}" tem ${gastosNaCategoria.length} gasto(s). Eles serão movidos para "Outros". Deseja excluir a categoria?`);
        if (!confirmacao) return;
        
        // Move os gastos
        gastos.forEach(gasto => {
            if (gasto.categoria === categoriaParaExcluir) {
                gasto.categoria = 'Outros';
            }
        });
        salvarGastos();
    } else {
        const confirmacao = confirm(`Tem certeza que deseja excluir a categoria "${categoriaParaExcluir}"?`);
        if (!confirmacao) return;
    }
    
    // Remove a categoria (exceto se for "Outros")
    if (categoriaParaExcluir !== 'Outros') {
        categorias.splice(index, 1);
        salvarCategorias();
        popularSelectCategoria();
        atualizarTudo();
        popularGerenciadorCategorias();  // Atualiza o gerenciador
        // Atualiza o gerenciador também
popularGerenciadorCategorias();
        alert(`Categoria "${categoriaParaExcluir}" excluída com sucesso!`);
    } else {
        alert('A categoria "Outros" não pode ser excluída.');
    }
};
// ----------------------------------------------------------------------
// FUNÇÕES DE AÇÃO (GRÁFICO, EDIÇÃO, EXPORTAÇÃO, ETC.)
// ----------------------------------------------------------------------

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

const exportarParaCSV = () => {
    if (gastos.length === 0) {
        alert("Não há gastos para exportar.");
        return;
    }

    const cabecalho = ["Descricao", "Categoria", "Valor"].join(";") + "\n";
    
    const linhas = gastos.map(gasto => {
        const valorFormatado = gasto.valor.toFixed(2).replace('.', ',');
        return `${gasto.descricao};${gasto.categoria};R$ ${valorFormatado}`;
    }).join("\n");
    
    const csvContent = cabecalho + linhas;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", "gastos_mensais.csv");
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert("Dados exportados para gastos_mensais.csv!");
};

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
        gastos[indiceEmEdicao] = novoGastoOuEdicao;
        indiceEmEdicao = null;
        form.querySelector('button[type="submit"]').textContent = "Adicionar Gasto";
        alert("Gasto editado com sucesso!");
    } else {
        gastos.push(novoGastoOuEdicao);
        alert("Gasto adicionado com sucesso!");
    }
    
    salvarGastos(); 
    atualizarTudo();

    descricaoInput.value = '';
    valorInput.value = '';
    descricaoInput.focus();
};

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
btnExportar.addEventListener('click', exportarParaCSV);
// Novos event listeners para gerenciamento de categorias
btnGerenciarCategorias.addEventListener('click', alternarGerenciadorCategorias);
btnFecharGerenciador.addEventListener('click', fecharGerenciador);
listaGerenciamentoCategorias.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-excluir-cat')) {
        excluirCategoria(parseInt(e.target.getAttribute('data-index')));
    }
});

carregarCategorias();
carregarGastos();
