function validarCNPJ(cnpj) {
    cnpj = cnpj.replace(/\D/g, '');
    
    if (cnpj.length !== 14) {
        return false;
    }
    
    if (/^(\d)\1{13}$/.test(cnpj)) {
        return false;
    }
    
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    const digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }
    
    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado != digitos.charAt(0)) {
        return false;
    }
    
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }
    
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado != digitos.charAt(1)) {
        return false;
    }
    
    return true;
}

function formatarCNPJ(cnpj) {
    cnpj = cnpj.replace(/\D/g, '');
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

async function consultarCNPJ(cnpj, tentativas = 3, intervalo = 2000) {
    const url = `https://api.allorigins.win/get?url=https://receitaws.com.br/v1/cnpj/${cnpj}`;
    
    for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                switch (response.status) {
                    case 400:
                        throw new Error('CNPJ com formato inválido. Verifique e tente novamente.');
                    case 404:
                        throw new Error('CNPJ não encontrado na base de dados da Receita Federal.');
                    case 429:
                        if (tentativa < tentativas) {
                            console.log(`Limite de requisições excedido. Tentando novamente em ${intervalo/1000} segundos...`);
                            await new Promise(resolve => setTimeout(resolve, intervalo));
                            continue;
                        } else {
                            throw new Error('Limite de requisições excedido. Por favor, tente novamente mais tarde.');
                        }
                    case 500:
                    case 504:
                        if (tentativa < tentativas) {
                            console.log(`Erro no servidor (${response.status}). Tentando novamente...`);
                            await new Promise(resolve => setTimeout(resolve, intervalo));
                            continue;
                        } else {
                            throw new Error(`Problema no servidor da Receita Federal (${response.status}). Tente novamente mais tarde.`);
                        }
                    default:
                        throw new Error(`Erro na consulta: ${response.status} - ${response.statusText}`);
                }
            }
            
            const data = await response.json();
            const body = JSON.parse(data.contents);
            
            if (body.status === "ERROR") {
                throw new Error(body.message || 'Erro na consulta do CNPJ.');
            }
            
            return body;
        } catch (error) {
            if (tentativa >= tentativas || 
                (error.message && (
                    error.message.includes('formato inválido') || 
                    error.message.includes('não encontrado')
                ))
            ) {
                throw error;
            }
            console.log(`Tentativa ${tentativa} falhou. Tentando novamente...`);
            await new Promise(resolve => setTimeout(resolve, intervalo));
        }
    }
    
    throw new Error('Não foi possível consultar o CNPJ após várias tentativas.');
}

document.getElementById('buscar').addEventListener('click', async function() {
    const cnpjInput = document.getElementById('cnpj').value;
    const cnpjNumerico = cnpjInput.replace(/\D/g, '');
    const resultadoDiv = document.getElementById('resultado');
    
    resultadoDiv.innerHTML = '<p>Consultando, por favor aguarde...</p>';
    
    try {
        if (!validarCNPJ(cnpjNumerico)) {
            throw new Error('CNPJ inválido. Verifique se os dígitos estão corretos.');
        }
        
        const body = await consultarCNPJ(cnpjNumerico);
        
        resultadoDiv.innerHTML = `
            <h2>Resultado da Consulta</h2>
            <p><strong>CNPJ:</strong> ${formatarCNPJ(cnpjNumerico)}</p>
            <p><strong>Nome:</strong> ${body.nome || 'N/A'}</p>
            <p><strong>Nome Fantasia:</strong> ${body.fantasia || 'N/A'}</p>
            <p><strong>Situação:</strong> ${body.situacao || 'N/A'}</p>
            <p><strong>Data de Abertura:</strong> ${body.abertura || 'N/A'}</p>
            <p><strong>Tipo:</strong> ${body.tipo || 'N/A'}</p>
            <p><strong>Porte:</strong> ${body.porte || 'N/A'}</p>
            <p><strong>Atividade Principal:</strong> ${body.atividade_principal && body.atividade_principal.length > 0 ? body.atividade_principal[0].text : 'N/A'}</p>
            <p><strong>Endereço:</strong> ${body.logradouro || ''} ${body.numero || ''}, ${body.complemento || ''}, ${body.bairro || ''}, ${body.municipio || ''}-${body.uf || ''}, CEP: ${body.cep || 'N/A'}</p>
            <p><strong>Email:</strong> ${body.email || 'N/A'}</p>
            <p><strong>Telefone:</strong> ${body.telefone || 'N/A'}</p>
            <p><strong>Última Atualização:</strong> ${body.ultima_atualizacao || 'N/A'}</p>
        `;
    } catch (error) {
        console.error('Erro:', error);
        resultadoDiv.innerHTML = `
            <p class="erro"><strong>Erro na consulta:</strong> ${error.message}</p>
            <p>Verifique o CNPJ informado e tente novamente.</p>
        `;
    }
});

document.getElementById('cnpj').addEventListener('input', function() {
    let cnpj = this.value.replace(/\D/g, '');
    if (cnpj.length > 14) {
        cnpj = cnpj.substring(0, 14);
    }
    
    if (cnpj.length > 12) {
        this.value = cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    } else if (cnpj.length > 8) {
        this.value = cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})?/, '$1.$2.$3/$4');
    } else if (cnpj.length > 5) {
        this.value = cnpj.replace(/^(\d{2})(\d{3})(\d{3})?/, '$1.$2.$3');
    } else if (cnpj.length > 2) {
        this.value = cnpj.replace(/^(\d{2})(\d{3})?/, '$1.$2');
    } else {
        this.value = cnpj;
    }
});