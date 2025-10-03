// 1. Seleção de Elementos e Variáveis Globais
const form = document.getElementById('form-gasto');
const descricaoInput = document.getElementById('descricao');
const categoriaInput = document.getElementById('categoria');
const valorInput = document.getElementById('valor');
const resumoGastos = document.getElementById('resumo-gastos');
const historicoTransacoes = document.getElementById('historico-transacoes');
const totalGastosElement = document.getElementById('total-gastos');
const btnLimpar = document.getElementById('btn-limpar');

let gastos = [];
let indiceEmEdicao = null; // Variável para armazenar o índice do gasto que está sendo editado

// ----------------------------------------------------------------------
// PERSISTÊNCIA E UTILS
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

// ----------------------------------------------------------------------
// FUNÇÕES DE EXIBIÇÃO
// ----------------------------------------------------------------------

// Função que exibe o histórico detalhado (com botões de ação)
const exibirHistorico = () => {
    historicoTransacoes.innerHTML = '';
    
    gastos.forEach((gasto, index) => { 
        const listItem = document.createElement('li');
        listItem.setAttribute('data-index', index); 
        
        // Estrutura do item do histórico com botões de Ação
        listItem.innerHTML = `
            <span style="width:35%;">${gasto.descricao}</span>
            <span style="width:25%;">${gasto.categoria}</span>
            <strong style="width:20%; text-align:right;">${formatarMoeda(gasto.valor)}</strong>
            <div style="width:15%; text-align:right;">
                <button class="btn-historico btn-editar" data-index="${index}" title="Editar Gasto">✎</button>
                <button class="btn-historico btn-excluir" data-index="${index}" title="Excluir Gasto">X</button>
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

// Função que exibe o resumo na tela
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
};

// ----------------------------------------------------------------------
// FUNÇÃO CENTRAL DE ATUALIZAÇÃO
// ----------------------------------------------------------------------

// Função que chama a atualização de ambos os painéis
const atualizarTudo = () => {
    calcularResumo();
    exibirHistorico();
};

// ----------------------------------------------------------------------
// FUNÇÕES DE AÇÃO (EXCLUSÃO, EDIÇÃO, ADIÇÃO, LIMPEZA)
// ----------------------------------------------------------------------

// Função que carrega o gasto selecionado para o formulário
const iniciarEdicao = (index) => {
    const gasto = gastos[index];
    
    // 1. Pré-preenche o formulário com os dados atuais do gasto
    descricaoInput.value = gasto.descricao;
    categoriaInput.value = gasto.categoria;
    valorInput.value = gasto.valor;
    
    // 2. Armazena o índice para saber qual item atualizar na hora de salvar
    indiceEmEdicao = index;
    
    // 3. Muda o texto do botão para indicar que é uma edição
    form.querySelector('button[type="submit"]').textContent = "Salvar Edição";
    
    descricaoInput.focus();
    alert(`Editando o gasto: ${gasto.descricao}. Altere os campos e clique em 'Salvar Edição'.`);
};

// Função para gerenciar os cliques nos botões de Excluir e Editar
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

// Função para adicionar um novo gasto ou salvar uma edição
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
        // SE ESTAMOS EM MODO EDIÇÃO
        // 1. Substitui o item antigo pelo novo
        gastos[indiceEmEdicao] = novoGastoOuEdicao;
        
        // 2. Reseta o modo edição e o texto do botão
        indiceEmEdicao = null;
        form.querySelector('button[type="submit"]').textContent = "Adicionar Gasto";
        alert("Gasto editado com sucesso!");
    } else {
        // SE ESTAMOS EM MODO ADIÇÃO NORMAL
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
// Event Listener centralizado para lidar com Edição (✎) e Exclusão (X)
historicoTransacoes.addEventListener('click', gerenciarAcoesHistorico); 

// INICIALIZAÇÃO
carregarGastos();