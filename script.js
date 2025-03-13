document.getElementById('buscar').addEventListener('click', function() {
    const cnpj = document.getElementById('cnpj').value.replace(/\D/g, '');
    const url = `https://api.allorigins.win/get?url=https://receitaws.com.br/v1/cnpj/${cnpj}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const resultadoDiv = document.getElementById('resultado');
            const body = JSON.parse(data.contents);
            if (body.status === "ERROR") {
                resultadoDiv.innerHTML = `<p>${body.message}</p>`;
            } else {
                resultadoDiv.innerHTML = `
                    <h2>Resultado:</h2>
                    <p><strong>Nome:</strong> ${body.nome}</p>
                    <p><strong>Situacao:</strong> ${body.situacao}</p>
                    <p><strong>Atividade Principal:</strong> ${body.atividade_principal[0].text}</p>
                `;
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            document.getElementById('resultado').innerHTML = `<p>${error.message}</p>`;
        });
});