// ---------- CARRINHO ----------
let carrinho = []; // [{nome, preço, categoria, img}]

function toggleCarrinho(produto, btn) {
  const idx = carrinho.findIndex(p => p.nome === produto.nome);
  if (idx === -1) {
    carrinho.push(produto);
    btn.textContent = 'Selecionado ✓';
    btn.classList.add('selecionado');
  } else {
    carrinho.splice(idx, 1);
    btn.textContent = 'Quero comprar';
    btn.classList.remove('selecionado');
  }
  atualizaContador();
}

function atualizaContador() {
  const cont = document.getElementById('contador-carrinho');
  cont.textContent = carrinho.length;
  cont.style.display = carrinho.length ? 'flex' : 'none';
}

function enviaCarrinhoWhatsApp() {
  if (carrinho.length === 0) {
    const textoPadrao = 'Oi, Camile! Visitei seu mostruário e quero comprar.';
    window.open(`https://wa.me/5512982126783?text=${encodeURIComponent(textoPadrao)}`, '_blank');
    return;
  }

  // soma dos valores (remove "R$ " e converte para número)
  const total = carrinho.reduce((soma, p) => {
    const valor = parseFloat(p.preço.replace('R$ ', '').replace(',', '.'));
    return soma + valor;
  }, 0);

  const itens = carrinho.map((p, i) => `${i + 1}. ${p.nome} (${p.categoria}) – ${p.preço}`).join('\n');
  const texto = `Oi, Camile! Quero os seguintes itens:\n\n${itens}\n\nTotal: R$ ${total.toFixed(2).replace('.', ',')}`;
  window.open(`https://wa.me/5512982126783?text=${encodeURIComponent(texto)}`, '_blank');
}

function geraCards(lista, idGrade) {
  const grade = document.getElementById(idGrade);
  grade.innerHTML = '';

  lista.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card';
    const selecionado = carrinho.some(item => item.nome === p.nome);

    // monta HTML sem botão (vamos adicionar depois)
    card.innerHTML = `
      <img src="${p.img}" alt="${p.nome}" loading="lazy">
      <div class="card-body">
        <h3>${p.nome}</h3>
        <div class="preco">${p.preço}</div>
        <div class="status ${p.disponível ? 'disponivel' : 'indisponivel'}">
          ${p.disponível ? 'Disponível' : 'Indisponível'}
        </div>
      </div>
    `;

    // ---------- BOTÃO SÓ SE DISPONÍVEL ----------
    if (p.disponível) {
      const btn = document.createElement('button');
      btn.className = 'btn-seleciona ' + (selecionado ? 'selecionado' : '');
      btn.textContent = selecionado ? 'Selecionado ✓' : 'Quero comprar';
      btn.onclick = function () {
        const prod = {
          nome: p.nome,
          preço: p.preço,
          categoria: p.categoria,
          img: p.img
        };
        toggleCarrinho(prod, this);
      };
      card.querySelector('.card-body').appendChild(btn);
    } else {
      const txt = document.createElement('span');
      txt.className = 'indisponivel-text';
      txt.textContent = 'Indisponível';
      card.querySelector('.card-body').appendChild(txt);
    }

    grade.appendChild(card);
  });
}

// ---------- LEITURA DA PLANILHA ----------
async function carregaPlanilha() {
  const url = `https://docs.google.com/spreadsheets/d/e/2PACX-1vR9QkPrknak-xlF7YjRtm8j7cacYr5C_dS9AicsNxGWJ0IGrx3sE3C6ljwEZHlgFY8PBWskZDIlV0Ma/pub?output=csv&t=${Date.now()}`;
  const res   = await fetch(url);
  const texto = await res.text();
  const linhas = texto.trim().split('\n').slice(1);
  const json   = linhas.map(l => {
    const cols = l.match(/(?<=^|,)(?:\"([^\"]*?)\"|([^,]*))(?=,|$)/g).map(v => v.replace(/^\"|\"$/g, ''));
    return {
      categoria: cols[0],
      nome:      cols[1],
      preço:     `R$ ${cols[2].replace('.', ',')}`,
      disponível: cols[3] === 'TRUE',
      img:       cols[4]
    };
  });
  const produtos = {
    bijuterias: json.filter(p => p.categoria === 'bijuterias'),
    cacau:      json.filter(p => p.categoria === 'cacau'),
    oboticario: json.filter(p => p.categoria === 'oboticario'),
    loccitane:  json.filter(p => p.categoria === 'loccitane'),
    eudora:     json.filter(p => p.categoria === 'eudora')
  };
  Object.keys(produtos).forEach(cat => geraCards(produtos[cat], `grade-${cat}`));
  document.getElementById('ano').textContent = new Date().getFullYear();
}

// ---------- INICIA ----------
carregaPlanilha();