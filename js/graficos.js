function renderAll(DATA) {
/* ---------------- helpers ---------------- */
const fmtBRL = (v) => 'R$\u00A0' + Math.round(v).toLocaleString('pt-BR');
const fmtShort = (v) => {
  if (v >= 1e9) return (v/1e9).toLocaleString('pt-BR',{maximumFractionDigits:2}) + ' bi';
  if (v >= 1e6) return (v/1e6).toLocaleString('pt-BR',{maximumFractionDigits:1}) + ' mi';
  if (v >= 1e3) return (v/1e3).toLocaleString('pt-BR',{maximumFractionDigits:0}) + ' mil';
  return v.toLocaleString('pt-BR');
};
const fmtInt = (v) => v.toLocaleString('pt-BR');
const fmtBi = (v) => 'R$\u00A0' + (v/1e9).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}) + ' bi';

const COLORS = {
  Educação: '#1C7192',
  Saúde: '#39A69F',
  Segurança: '#E8B149',
  Pavimentação: '#12305C'
};
const AREA_TAGS = {Educação:'Área 2.3', Saúde:'Área 2.2', Segurança:'Área 2.1', Pavimentação:'Área 1.1'};
const CAT_PALETTE = ['#1C7192','#39A69F','#E8B149','#5FAFC8','#12305C','#C0392B','#8592A3','#0A2445'];

const inkSoft = '#4C5F73';
const line = '#DDE4EA';

Chart.defaults.font.family = "'IBM Plex Mono', monospace";
Chart.defaults.font.size = 11;
Chart.defaults.color = inkSoft;

/* ---------------- totals including Pavimentação ---------------- */
const GRAND_TOTAL = DATA.grand_total_geral;
const AREA_TOTALS = {
  Educação: DATA['Educação'].total,
  Saúde: DATA['Saúde'].total,
  Segurança: DATA['Segurança'].total,
  Pavimentação: DATA.pavimentacao.total_empenhado
};

/* ---------------- HERO / TOP NUMBERS ---------------- */
document.getElementById('hero-total').textContent = (GRAND_TOTAL/1e9).toLocaleString('pt-BR',{maximumFractionDigits:2}) + ' bilhões';
document.getElementById('k-ug').textContent = fmtInt(DATA.total_ug_geral);
document.getElementById('k-contratos').textContent = fmtInt(DATA.total_contratos_geral);
document.getElementById('k-registros').textContent = fmtInt(DATA.total_registros_geral);
document.getElementById('ov-total').textContent = fmtBRL(GRAND_TOTAL);
document.getElementById('edu-total').textContent = fmtBRL(DATA['Educação'].total);
document.getElementById('sau-total').textContent = fmtBRL(DATA['Saúde'].total);
document.getElementById('seg-total').textContent = fmtBRL(DATA['Segurança'].total);
document.getElementById('stamp-date').textContent = 'Piauí · 2023–2026';

/* ---------------- AREA CARDS (4 áreas, maior primeiro) ---------------- */
const areaCardsEl = document.getElementById('area-cards');
Object.entries(AREA_TOTALS).sort((a,b)=>b[1]-a[1]).forEach(([area, total]) => {
  const pct = (total/GRAND_TOTAL*100).toFixed(1);
  const nUg = area === 'Pavimentação' ? DATA.pavimentacao.n_ug : DATA[area].n_ug;
  const div = document.createElement('div');
  div.className = 'area-card';
  div.innerHTML = `
    <div class="tag">${AREA_TAGS[area]}</div>
    <h3>${area}</h3>
    <div class="val">${fmtBRL(total)}</div>
    <div class="bar-bg"><div class="bar-fg" style="width:${pct}%;background:${COLORS[area]};"></div></div>
    <div class="pct">${pct}% do total consolidado · ${nUg} unidades gestoras</div>
  `;
  areaCardsEl.appendChild(div);
});

/* ---------------- OVERVIEW: ranking geral entre as 4 áreas ---------------- */
const rankingEntries = Object.entries(AREA_TOTALS).sort((a,b)=>b[1]-a[1]); // decrescente: maior área no topo
new Chart(document.getElementById('chart-ranking'), {
  type: 'bar',
  data: {
    labels: rankingEntries.map(e=>e[0]),
    datasets: [{
      data: rankingEntries.map(e=>e[1]),
      backgroundColor: rankingEntries.map(e=>COLORS[e[0]]),
      borderRadius: 2,
      maxBarThickness: 38
    }]
  },
  options: {
    indexAxis: 'y',
    responsive:true, maintainAspectRatio:false,
    plugins:{
      legend:{display:false},
      tooltip:{callbacks:{label:(ctx)=> ` ${fmtBRL(ctx.raw)} · ${(ctx.raw/GRAND_TOTAL*100).toFixed(1)}% do total`}, backgroundColor:'#0A2445', titleFont:{family:"'IBM Plex Mono', monospace"}, bodyFont:{family:"'IBM Plex Mono', monospace"}}
    },
    scales:{
      x:{grid:{color:line}, border:{display:false}, ticks:{callback:(v)=>fmtShort(v)}},
      y:{grid:{display:false}, border:{color:line}, ticks:{font:{size:12}}}
    }
  }
});

/* ---------------- OVERVIEW: comparativo por categoria entre áreas ---------------- */
const compCats = Object.entries(DATA.comparativo_categorias)
  .map(([cat, vals]) => ({cat, total:(vals['Educação']||0)+(vals['Saúde']||0)+(vals['Segurança']||0), vals}))
  .sort((a,b)=>b.total-a.total);

new Chart(document.getElementById('chart-comparativo'), {
  type:'bar',
  data:{
    labels: compCats.map(c=>c.cat.replace(" / NÃO CLASSIFICADO"," / N.CLASS.")),
    datasets:['Educação','Saúde','Segurança'].map(area=>({
      label:area,
      data: compCats.map(c=>c.vals[area]||0),
      backgroundColor:COLORS[area],
      borderRadius:1,
      maxBarThickness:16
    }))
  },
  options:{
    indexAxis:'y',
    responsive:true, maintainAspectRatio:false,
    plugins:{
      legend:{position:'top', align:'end', labels:{boxWidth:9, boxHeight:9, usePointStyle:true, pointStyle:'rect', color:inkSoft}},
      tooltip:{callbacks:{label:(ctx)=> ` ${ctx.dataset.label}: ${fmtBRL(ctx.raw)}`}, backgroundColor:'#0A2445', titleFont:{family:"'IBM Plex Mono', monospace"}, bodyFont:{family:"'IBM Plex Mono', monospace"}}
    },
    scales:{
      x:{grid:{color:line}, border:{display:false}, ticks:{callback:(v)=>fmtShort(v)}},
      y:{grid:{display:false}, border:{color:line}, ticks:{font:{size:10}}}
    }
  }
});

/* ---------------- helper: category horizontal bar ---------------- */
function catChart(canvasId, area){
  const entries = Object.entries(DATA[area].by_cat).sort((a,b)=>b[1]-a[1]);
  new Chart(document.getElementById(canvasId), {
    type:'bar',
    data:{
      labels: entries.map(e=>e[0]),
      datasets:[{
        data: entries.map(e=>e[1]),
        backgroundColor: entries.map((_,i)=>CAT_PALETTE[i % CAT_PALETTE.length]),
        borderRadius:1,
        maxBarThickness:22
      }]
    },
    options:{
      indexAxis:'y',
      responsive:true, maintainAspectRatio:false,
      plugins:{
        legend:{display:false},
        tooltip:{callbacks:{label:(ctx)=> ` ${fmtBRL(ctx.raw)}`}, backgroundColor:'#0A2445', titleFont:{family:"'IBM Plex Mono', monospace"}, bodyFont:{family:"'IBM Plex Mono', monospace"}}
      },
      scales:{
        x:{grid:{color:line}, border:{display:false}, ticks:{callback:(v)=>fmtShort(v)}},
        y:{grid:{display:false}, border:{color:line}, ticks:{font:{size:10}}}
      }
    }
  });
}
catChart('chart-edu-cat','Educação');
catChart('chart-sau-cat','Saúde');
catChart('chart-seg-cat','Segurança');

/* ---------------- ledger lists (top contracts) ---------------- */
function renderLedger(containerId, area){
  const el = document.getElementById(containerId);
  DATA[area].top_contracts.slice(0,6).forEach((c,i)=>{
    const row = document.createElement('div');
    row.className='ledger-row';
    row.innerHTML = `
      <div class="rank">${String(i+1).padStart(2,'0')}</div>
      <div class="desc">
        <div class="d">${c.desc.charAt(0)+c.desc.slice(1).toLowerCase()}</div>
        <div class="u">${c.ug}</div>
      </div>
      <div class="leader"></div>
      <div class="amt">${fmtBRL(c.valor)}</div>
    `;
    el.appendChild(row);
  });
}
renderLedger('edu-contracts','Educação');
renderLedger('sau-contracts','Saúde');
renderLedger('seg-contracts','Segurança');

/* ---------------- CONTEXTO PRÓ-PIAUÍ 10 ---------------- */
const eixoColors = {'Infraestrutura':'#5FAFC8','Transformação Social':'#39A69F','Desenvolvimento Econômico':'#E8B149'};
const eixoTable = document.getElementById('eixo-table');
Object.entries(DATA.programa_geral.eixos).forEach(([nome, e]) => {
  const metaPct = 100;
  const empPct = Math.min((e.empenhado / e.meta) * 100, 100 * (e.empenhado/e.meta));
  const maxScale = Math.max(e.meta, e.empenhado) * 1.05;
  const metaW = (e.meta/maxScale*100).toFixed(1);
  const empW = (e.empenhado/maxScale*100).toFixed(1);
  const ok = e.pct >= 100;
  const row = document.createElement('div');
  row.className = 'eixo-row';
  row.innerHTML = `
    <div class="eixo-name">${nome}</div>
    <div class="eixo-bars">
      <div class="bar-row meta"><div class="bar-track meta"><div class="fill" style="width:${metaW}%;"></div></div><span class="amt">${fmtBi(e.meta)}</span></div>
      <div class="bar-row"><div class="bar-track"><div class="fill" style="width:${empW}%;background:${eixoColors[nome]};"></div></div><span class="amt">${fmtBi(e.empenhado)}</span></div>
    </div>
    <div class="pct-chip ${ok?'ok':'alert'}">
      <div class="p">${e.pct.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%</div>
      <div class="t">${ok?'acima da meta':'abaixo da meta'}</div>
    </div>
  `;
  eixoTable.appendChild(row);
});
document.getElementById('total-band').innerHTML = `
  <div class="l">TOTAL &nbsp;·&nbsp; Meta ${fmtBi(DATA.programa_geral.meta_total)}</div>
  <div class="m">Empenhado ${fmtBi(DATA.programa_geral.total_empenhado)}</div>
  <div class="r">${DATA.programa_geral.total_pct.toLocaleString('pt-BR',{minimumFractionDigits:1})}%</div>
`;

const fonteGrid = document.getElementById('fonte-grid');
const fonteDotColors = ['#1C7192','#39A69F','#E8B149','#DCE5EC'];
Object.entries(DATA.programa_geral.fontes).forEach(([nome, f], i) => {
  const card = document.createElement('div');
  card.className = 'fonte-card';
  card.innerHTML = `
    <div class="fonte-pill" style="background:${fonteDotColors[i % fonteDotColors.length]};">${f.contratos ? f.contratos : '—'}</div>
    <div class="fonte-label">${nome}</div>
    <div class="fonte-val">${fmtBi(f.valor)}</div>
  `;
  fonteGrid.appendChild(card);
});

const terrTable = document.getElementById('terr-table');
const terrMax = Math.max(...DATA.programa_geral.territorios.map(t => t.empenhado));
DATA.programa_geral.territorios.forEach(t => {
  const w = (t.empenhado / terrMax * 100).toFixed(1);
  const row = document.createElement('div');
  row.className = 'terr-row';
  row.innerHTML = `
    <div class="terr-name">${t.nome}</div>
    <div class="terr-bar-track"><div class="fill" style="width:${w}%;"></div></div>
    <div class="terr-val">${fmtBi(t.empenhado)}</div>
  `;
  terrTable.appendChild(row);
});
const terrTotal = DATA.programa_geral.territorios.reduce((s,t) => s + t.empenhado, 0);
const terrTotalRow = document.createElement('div');
terrTotalRow.className = 'terr-row terr-row-total';
terrTotalRow.innerHTML = `
  <div class="terr-name">Total — 13 territórios</div>
  <div></div>
  <div class="terr-val">${fmtBi(terrTotal)}</div>
`;
terrTable.appendChild(terrTotalRow);

/* ---------------- ENTREGAS / DELIVERY CARDS ---------------- */
const dotCycle = ['#1C7192','#39A69F','#E8B149','#5FAFC8'];
function renderDelivery(containerId, area, items){
  const el = document.getElementById(containerId);
  const cards = [{
    label: 'Quantidade de contratos identificados',
    value: fmtInt(DATA[area].n_contracts),
    note: null
  }, ...items];
  cards.forEach((c,i) => {
    const div = document.createElement('div');
    div.className = 'delivery-card';
    div.innerHTML = `
      <div class="delivery-badge" style="background:${dotCycle[i % dotCycle.length]};">${c.value}</div>
      <div class="delivery-label">${c.label}</div>
      ${c.note ? `<div class="delivery-note">${c.note}</div>` : ''}
    `;
    el.appendChild(div);
  });
  const caveat = document.createElement('div');
  caveat.className = 'delivery-caveat';
  caveat.style.gridColumn = '1 / -1';
  caveat.textContent = '* Contagens por escola/UBS/unidade obtidas por identificação de palavras-chave nas descrições de contrato (ex.: "escola", "hospital", "batalhão", "cadeia"). Um mesmo contrato pode envolver mais de uma unidade — recomendamos validar com a área técnica antes de publicar no briefing oficial.';
  el.appendChild(caveat);
}

renderDelivery('edu-delivery', 'Educação', [
  {label:'Escolas atendidas em obras e reformas (climatização, subestações e infraestrutura)', value: fmtInt(DATA.entregas['Educação'].escolas.contratos), note: fmtBRL(DATA.entregas['Educação'].escolas.valor)+' empenhados'},
  {label:'Contratos de equipamentos adquiridos para unidades escolares', value: fmtInt(DATA.entregas['Educação'].equipamentos.contratos), note: fmtBRL(DATA.entregas['Educação'].equipamentos.valor)+' empenhados'},
  {label:'Campus universitários construídos, ampliados ou reformados', value: fmtInt(DATA.entregas['Educação'].campus.contratos), note: 'nenhum contrato de obra/reforma de campus identificado no período'},
]);

renderDelivery('sau-delivery', 'Saúde', [
  {label:'UBS construídas, reformadas ou ampliadas', value: fmtInt(DATA.entregas['Saúde'].ubs.contratos), note: fmtBRL(DATA.entregas['Saúde'].ubs.valor)+' empenhados'},
  {label:'Contratos de veículos adquiridos (ambulâncias e unidades móveis)', value: fmtInt(DATA.entregas['Saúde'].veiculos.contratos), note: fmtBRL(DATA.entregas['Saúde'].veiculos.valor)+' empenhados'},
  {label:'Hospitais e unidades de saúde construídos, reformados ou ampliados', value: fmtInt(DATA.entregas['Saúde'].hospitais.contratos), note: fmtBRL(DATA.entregas['Saúde'].hospitais.valor)+' empenhados'},
]);

renderDelivery('seg-delivery', 'Segurança', [
  {label:'Unidades policiais construídas, ampliadas ou reformadas', value: fmtInt(DATA.entregas['Segurança'].policiais.contratos), note: fmtBRL(DATA.entregas['Segurança'].policiais.valor)+' empenhados'},
  {label:'Contratos de veículos adquiridos (viaturas, motos e apoio)', value: fmtInt(DATA.entregas['Segurança'].veiculos.contratos), note: fmtBRL(DATA.entregas['Segurança'].veiculos.valor)+' empenhados'},
  {label:'Unidades prisionais construídas, ampliadas ou reformadas', value: fmtInt(DATA.entregas['Segurança'].prisionais.contratos), note: fmtBRL(DATA.entregas['Segurança'].prisionais.valor)+' empenhados'},
]);

/* ---------------- veículos table ---------------- */
const vtbody = document.getElementById('veiculos-tbody');
DATA.veiculos_detalhe.forEach(v=>{
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${v.desc.charAt(0)+v.desc.slice(1).toLowerCase()}</td>
    <td class="yr">${v.ug.length>28 ? v.ug.slice(0,28)+'…' : v.ug}</td>
    <td class="yr">${v.ano}</td>
    <td class="amt">${fmtBRL(v.valor)}</td>
  `;
  vtbody.appendChild(tr);
});

/* ---------------- PAVIMENTAÇÃO ---------------- */
const PAV = DATA.pavimentacao;
document.getElementById('pav-total').textContent = fmtBRL(PAV.total_empenhado);
document.getElementById('pav-registros').textContent = fmtInt(PAV.n_registros);
document.getElementById('pav-ug').textContent = fmtInt(PAV.n_ug);

const pavDelivery = document.getElementById('pav-delivery');
[
  {label:'Contratos identificados', value: fmtInt(PAV.n_contratos), note: null},
  {label:'Unidades gestoras envolvidas', value: fmtInt(PAV.n_ug), note: null},
  {label:'Extensão total registrada', value: PAV.total_km.toLocaleString('pt-BR',{maximumFractionDigits:0})+' km', note: 'soma das linhas com quantidade em km'},
  {label:'Linhas de empenho na base', value: fmtInt(PAV.n_registros), note: null},
].forEach((c,i) => {
  const div = document.createElement('div');
  div.className = 'delivery-card';
  div.innerHTML = `
    <div class="delivery-badge" style="background:${dotCycle[i % dotCycle.length]};">${c.value}</div>
    <div class="delivery-label">${c.label}</div>
    ${c.note ? `<div class="delivery-note">${c.note}</div>` : ''}
  `;
  pavDelivery.appendChild(div);
});

function renderPavList(containerId, entries, opts){
  const el = document.getElementById(containerId);
  const max = Math.max(...entries.map(e => e.valor));
  entries.forEach(e => {
    const w = (e.valor / max * 100).toFixed(1);
    const row = document.createElement('div');
    row.className = 'pav-row';
    row.innerHTML = `
      <div>
        <div class="pav-name">${e.nome}</div>
        ${e.sub ? `<div class="pav-sub">${e.sub}</div>` : ''}
      </div>
      <div class="pav-bar-track"><div class="fill" style="width:${w}%;"></div></div>
      <div class="pav-val">${fmtBi(e.valor)}</div>
    `;
    el.appendChild(row);
  });
}

renderPavList('pav-tipo-list', Object.entries(PAV.by_tipo)
  .filter(([nome]) => nome !== 'Estradas Vicinais')
  .sort((a,b) => b[1].valor - a[1].valor)
  .map(([nome, v]) => ({nome, valor: v.valor, sub: `${fmtInt(v.n)} contratos · ${v.km.toLocaleString('pt-BR',{maximumFractionDigits:0})} km`})));

// total dos tipos considerados (exclui Estradas Vicinais)
const pavTipoSemVicinais = Object.entries(PAV.by_tipo).filter(([nome]) => nome !== 'Estradas Vicinais');
const pavTipoTotalValor = pavTipoSemVicinais.reduce((s,[,v]) => s + v.valor, 0);
const pavTipoTotalKm = pavTipoSemVicinais.reduce((s,[,v]) => s + v.km, 0);
const pavTotalRow = document.createElement('div');
pavTotalRow.className = 'pav-row pav-row-total';
pavTotalRow.innerHTML = `
  <div>
    <div class="pav-name">Total (sem Estradas Vicinais)</div>
    <div class="pav-sub">${pavTipoTotalKm.toLocaleString('pt-BR',{maximumFractionDigits:0})} km somados</div>
  </div>
  <div></div>
  <div class="pav-val">${fmtBi(pavTipoTotalValor)}</div>
`;
document.getElementById('pav-tipo-list').appendChild(pavTotalRow);

renderPavList('pav-terr-list', Object.entries(PAV.by_territorio)
  .sort((a,b) => b[1] - a[1])
  .map(([nome, valor]) => ({nome: nome.charAt(0)+nome.slice(1).toLowerCase(), valor})));

const pavTerrTotal = Object.values(PAV.by_territorio).reduce((s,v) => s + v, 0);
const pavTerrTotalRow = document.createElement('div');
pavTerrTotalRow.className = 'pav-row pav-row-total';
pavTerrTotalRow.innerHTML = `
  <div><div class="pav-name">Total — 13 territórios</div></div>
  <div></div>
  <div class="pav-val">${fmtBi(pavTerrTotal)}</div>
`;
document.getElementById('pav-terr-list').appendChild(pavTerrTotalRow);

const pavContractsEl = document.getElementById('pav-contracts');
PAV.top_contracts.forEach((c,i) => {
  const row = document.createElement('div');
  row.className = 'ledger-row';
  row.innerHTML = `
    <div class="rank">${String(i+1).padStart(2,'0')}</div>
    <div class="desc">
      <div class="d">${c.desc.charAt(0)+c.desc.slice(1).toLowerCase()}</div>
      <div class="u">${c.ug} · ${c.tipo}</div>
    </div>
    <div class="leader"></div>
    <div class="amt">${fmtBRL(c.valor)}</div>
  `;
  pavContractsEl.appendChild(row);
});

} // fim de renderAll(DATA)
