// CSV → JSON (funciona com 1 ou várias linhas)
async function carregaPlanilha() {
  const url = `https://docs.google.com/spreadsheets/d/e/2PACX-1vR9QkPrknak-xlF7YjRtm8j7cacYr5C_dS9AicsNxGWJ0IGrx3sE3C6ljwEZHlgFY8PBWskZDIlV0Ma/pub?output=csv&t=${Date.now()}`;
  const res   = await fetch(url);
  const texto = await res.text();

  // separador que aceita vírgulas DENTRO de aspas
  const linhas = texto.trim().split('\n').slice(1); // remove cabeçalho
  const json   = linhas.map(l => {
    const cols = l.match(/(?<=^|,)(?:\"([^\"]*?)\"|([^,]*))(?=,|$)/g)
                  .map(v => v.replace(/^\"|\"$/g, '')); // remove aspas
    return {
      categoria: cols[0],
      nome:      cols[1],
      preço:     `R$ ${cols[2].replace('.', ',')}`,
      disponível: cols[3] === 'TRUE',
      img:       cols[4]
    };
  });

  // separa por categoria
  const produtos = {
    bijuterias: json.filter(p => p.categoria === 'bijuterias'),
    cacau:      json.filter(p => p.categoria === 'cacau'),
    oboticario: json.filter(p => p.categoria === 'oboticario'),
    loccitane:  json.filter(p => p.categoria === 'loccitane'),
    eudora: json.filter(p => p.categoria === 'eudora')
  };

  // renderiza
  geraCards(produtos.bijuterias, 'grade-bijuterias');
  geraCards(produtos.cacau,      'grade-cacau');
  geraCards(produtos.oboticario, 'grade-oboticario');
  geraCards(produtos.loccitane,  'grade-loccitane');
  geraCards(produtos.eudora, 'grade-eudora');
  document.getElementById('ano').textContent = new Date().getFullYear();
}

// gera cards
function geraCards(lista, idGrade) {
  const grade = document.getElementById(idGrade);
  grade.innerHTML = '';
  lista.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${p.img}" alt="${p.nome}" loading="lazy">
      <div class="card-body">
        <h3>${p.nome}</h3>
        <div class="preco">${p.preço}</div>
        <div class="status ${p.disponível ? 'disponivel' : 'indisponivel'}">
          ${p.disponível ? 'Disponível' : 'Indisponível'}
        </div>
        ${
          p.disponível
            ? `<a href="https://wa.me/5512982126783?text=Oi, Camile! Vi o produto ${encodeURIComponent(
                p.nome
              )} e quero saber mais." target="_blank" class="btn">Quero comprar</a>`
            : '<span style="font-size:.8rem;color:#666">Em reposição</span>'
        }
      </div>
    `;
    grade.appendChild(card);
  });
}

// inicializa
carregaPlanilha();