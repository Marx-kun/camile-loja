// ---------- CONFIG ----------
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzqi1Rvhjb3xPOL45P7Aw9SZZyvLRl6RNb3tIW1kB9CtbCEOkxEJB1kG6s1eoYp-YtM/exec'; // 
const IMGUR_ID   = '546c25a59c58ad7';

let senhaOk = '';

// ---------- AUTO-LOGIN ----------
const senhaGuardada = localStorage.getItem('adminSenha');
if (senhaGuardada) {
  senhaOk = senhaGuardada;
  document.getElementById('login').classList.add('hidden');
  document.getElementById('painel').classList.remove('hidden');
  lista();
}

// ---------- TOAST ----------
function toast(msg, ok = true) {
  const div = document.createElement('div');
  div.textContent = msg;
  div.style.cssText = `
    position:fixed; bottom:20px; left:50%; transform:translateX(-50%);
    background:${ok ? '#28a745' : '#dc3545'}; color:#fff; padding:.8rem 1.4rem;
    border-radius:6px; z-index:9999; font-size:.9rem; transition:opacity .4s;
  `;
  document.body.appendChild(div);
  setTimeout(() => div.style.opacity = '0', 3000);
  setTimeout(() => div.remove(), 3400);
}

// ---------- LOADING ----------
function loading(on = true) {
  const btn = document.getElementById('btnSalvar');
  btn.textContent = on ? 'Enviando...' : 'Salvar';
  btn.disabled = on;
}

// ---------- VALIDA IMAGEM ----------
function validaImagem() {
  const temImg = document.getElementById('img').value.trim() !== '';
  document.getElementById('btnSalvar').disabled = !temImg;
}

// ---------- LOGIN ----------
async function entrar() {
  senhaOk = document.getElementById('senha').value;
  if (!senhaOk) return alert('Digite a senha');

  toast('Verificando...', true);

  try {
    const res = await fetch(`${SCRIPT_URL}?action=lista&senha=${senhaOk}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    await res.json();
  } catch (e) {
    toast('Senha inválida ou erro de conexão: ' + e.message, false);
    senhaOk = '';
    return;
  }
  
  localStorage.setItem('adminSenha', senhaOk);

  document.getElementById('login').classList.add('hidden');
  document.getElementById('painel').classList.remove('hidden');
  lista();
}

// ---------- LISTA ----------
async function lista() {
  try {
    toast('Carregando produtos...', true);
    const res = await fetch(`${SCRIPT_URL}?action=lista&senha=${senhaOk}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const prod = await res.json();
    let html = '';
    prod.forEach((p, i) => {
      html += `
        <div class="card-adm">
          <img src="${p.img}" style="width:80px;height:80px;object-fit:cover;float:left;margin-right:10px;">
          <strong>${p.nome}</strong> (${p.categoria}) – ${p.preco} – ${p.disponivel?'Disp':'Indisp'}<br>
          <button onclick="edita(${i}, '${p.categoria}', '${p.nome}', '${p.preco}', '${p.disponivel}', '${p.img}')">Editar</button>
          <button onclick="apaga(${i})">Apagar</button>
          <div style="clear:both;"></div>
        </div>`;
    });
    document.getElementById('lista').innerHTML = html;
    toast('Produtos carregados!', true);
  } catch (e) {
    toast('Erro ao buscar produtos: ' + e.message, false);
    console.error(e);
  }
}

// ---------- EDITA ----------
function edita(id, cat, nome, preco, disp, img) {
  document.getElementById('idEdit').value = id;
  document.getElementById('categoria').value = cat;
  document.getElementById('nome').value = nome;
  document.getElementById('preco').value = preco.replace('R$ ', '').replace(',', '.');
  document.getElementById('disponivel').value = disp;
  document.getElementById('img').value = img;
  validaImagem();
  // sobe suave até o formulário
  document.querySelector('#painel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---------- LIMPA ----------
function limpaForm() {
  document.getElementById('idEdit').value = '';
  document.querySelector('#painel form')?.reset();
  validaImagem();
}

// ---------- SALVA ----------
async function salva() {
  loading(true);
  try {
    const id = document.getElementById('idEdit').value;
    const par = new URLSearchParams({
      action: id ? 'edita' : 'insere',
      senha: senhaOk,
      id: id,
      categoria: document.getElementById('categoria').value,
      nome: document.getElementById('nome').value,
      preco: document.getElementById('preco').value,
      disponivel: document.getElementById('disponivel').value,
      img: document.getElementById('img').value
    });
    const res = await fetch(`${SCRIPT_URL}?${par}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    toast(id ? 'Produto alterado!' : 'Produto adicionado!', true);
    limpaForm();
    lista();
  } catch (e) {
    toast('Erro ao salvar: ' + e.message, false);
    console.error(e);
  } finally {
    loading(false);
  }
}

// ---------- APAGA ----------
async function apaga(id) {
  if (!confirm('Excluir produto?')) return;
  try {
    const par = new URLSearchParams({ action: 'apaga', senha: senhaOk, id: id });
    const res = await fetch(`${SCRIPT_URL}?${par}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    toast('Produto excluído!', true);
    lista();
  } catch (e) {
    toast('Erro ao excluir: ' + e.message, false);
    console.error(e);
  }
}

// ---------- UPLOAD IMGUR ----------
async function uploadImg() {
  const file = document.getElementById('foto').files[0];
  if (!file) return alert('Escolha uma imagem');

  const body = new FormData();
  body.append('image', file);

  try {
    toast('Enviando imagem...', true);
    const res = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: { Authorization: `Client-ID ${IMGUR_ID}` },
      body
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    if (json.success) {
      document.getElementById('img').value = json.data.link;
      toast('Imagem enviada!', true);
      validaImagem(); // atualiza botão
    } else {
      throw new Error(json.data.error || 'Falha no upload');
    }
  } catch (e) {
    toast('Erro ao enviar imagem: ' + e.message, false);
    console.error(e);
  }
}