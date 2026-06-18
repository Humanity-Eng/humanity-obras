// React hooks from global (definidos no index.html)

// ── Supabase ──────────────────────────────────────────────────────────────
const SUPA_URL="https://mbabhkvyeejbbjvcuitq.supabase.co";
const SUPA_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iYWJoa3Z5ZWVqYmJqdmN1aXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTI0NzIsImV4cCI6MjA5NzI2ODQ3Mn0.Z_n699k_YBe_NQVxTJaMvgd40VeuiQVbXm-JUcGTjyw";

async function sbReq(method,path,body){
 const h={"apikey":SUPA_KEY,"Authorization":"Bearer "+SUPA_KEY,"Content-Type":"application/json","Prefer":"return=representation"};
 const r=await fetch(SUPA_URL+path,{method,headers:h,body:body?JSON.stringify(body):undefined});
 if(!r.ok){const t=await r.text();throw new Error(r.status+": "+t.slice(0,100));}
 return r.status===204?null:r.json();
}

async function dbGet(obraId,chave){
 try{
  const rows=await sbReq("GET","/rest/v1/obra_data?obra_id=eq."+encodeURIComponent(obraId)+"&chave=eq."+encodeURIComponent(chave)+"&select=valor&limit=1");
  return rows&&rows.length>0?rows[0].valor:null;
 }catch(e){console.warn("dbGet:",e.message);return null;}
}

async function dbSet(obraId,chave,valor){
 try{
  const h={"apikey":SUPA_KEY,"Authorization":"Bearer "+SUPA_KEY,"Content-Type":"application/json","Prefer":"resolution=merge-duplicates,return=minimal"};
  const r=await fetch(SUPA_URL+"/rest/v1/obra_data",{
   method:"POST",
   headers:h,
   body:JSON.stringify({obra_id:obraId,chave,valor})
  });
  if(!r.ok){const t=await r.text();console.warn("dbSet falhou:",r.status,t.slice(0,100));}
 }catch(e){console.warn("dbSet erro:",e.message);}
}

const USERS={
  "diretor@humanityengenharia.com":{pw:"hugoadmin2026",role:"admin",nome:"Hugo Puty"},
  "moniquepacheco.eng@outlook.com":{pw:"monique123",role:"eng",nome:"Monique Pacheco"},
  "cliente@loted18":{pw:"marcelo2026",role:"cli",nome:"Marcelo Azevedo Costa"},
};

// Logo — fundo branco, ícone azul escuro
const Logo=({h=40})=>{
 const D=[
  [82,10,7],[152,11,7],
  [47,29,7],[116,30,7],[188,30,7],
  [82,50,7],[152,50,7],
  [45,71,7],[117,71,13],[188,71,7],
  [10,91,7],[82,91,13],[153,92,13],[222,91,7],
  [46,112,7],[117,112,13],[188,112,7],
  [11,132,7],[81,132,13],[152,132,13],[222,132,7],
  [45,153,7],[117,152,13],[188,152,7],
  [82,173,7],[152,173,7],
  [47,194,7],[116,193,7],[188,194,7],
  [82,213,7],[152,213,7],
 ];
 return(
  <div style={{background:"#fff",display:"inline-flex",alignItems:"center",gap:12}}>
   <svg height={h} viewBox="0 0 235 226" fill="none" style={{flexShrink:0}}>
    {D.map(([cx,cy,r],i)=><circle key={i} cx={cx} cy={cy} r={r} fill="#1e2d5a"/>)}
   </svg>
   <div>
    <div style={{fontFamily:"'Inter','Segoe UI',sans-serif",fontWeight:800,fontSize:h*0.78,color:"#1e2d5a",lineHeight:1,letterSpacing:-1}}>Humanity</div>
    <div style={{fontFamily:"'Inter','Segoe UI',sans-serif",fontWeight:400,fontSize:h*0.26,color:"#475569",letterSpacing:6,lineHeight:1.5,textAlign:"center"}}>engenharia</div>
   </div>
  </div>
 );
};

const fmtBR=v=>(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const pct=v=>`${Number(v||0).toFixed(2)}%`;

// Semana automática: S1=semana de 02/Jun/2026, calcular offset from base
function getSemanaAtual(){
  const base=new Date(2026,5,1); // 1 Jun 2026
  const now=new Date();
  const diff=Math.floor((now-base)/(7*24*60*60*1000));
  return Math.max(1,diff+1);
}
function semLabel(n){
  const meses=["Jun","Jun","Jun","Jun","Jul","Jul","Jul","Jul","Ago","Ago","Ago","Ago","Set","Set","Set","Set","Out","Out","Out","Out","Nov","Nov","Nov","Nov","Dez","Dez","Dez","Dez","Jan","Jan","Jan","Jan"];
  const semM=["S1","S2","S3","S4","S1","S2","S3","S4","S1","S2","S3","S4","S1","S2","S3","S4","S1","S2","S3","S4","S1","S2","S3","S4","S1","S2","S3","S4","S1","S2","S3","S4"];
  if(n<1||n>32)return`S${n}`;
  return`${semM[n-1]} (${meses[n-1]})`;
}

const IS={display:"block",width:"100%",marginTop:4,padding:"9px 12px",background:"#f1f5f9",border:"1px solid #cbd5e1",borderRadius:8,color:"#1e293b",fontSize:13,boxSizing:"border-box"};
const BP={border:"none",borderRadius:8,padding:"10px 16px",fontWeight:700,fontSize:13,cursor:"pointer",background:"#f8c400",color:"#0f172a"};
const BS={border:"none",borderRadius:8,padding:"10px 16px",fontWeight:700,fontSize:13,cursor:"pointer",background:"#f1f5f9",color:"#1e293b"};
function Badge({s}){const m={pago:["#16a34a","#dcfce7","Pago"],pago_parcial:["#b45309","#fef3c7","Parcial"],pendente:["#475569","#f1f5f9","Pendente"]};const[c,bg,l]=m[s]||m.pendente;return<span style={{background:bg,color:c,fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20}}>{l}</span>;}
function KCard({label,value,color,sub}){
 return(
  <div style={{background:"#fff",borderRadius:10,padding:16,borderLeft:`3px solid ${color}`,boxShadow:"0 1px 4px #0001"}}>
   <div style={{fontSize:11,color:"#64748b",fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>{label}</div>
   <div style={{fontSize:20,fontWeight:800,color}}>{value}</div>
   {sub&&<div style={{fontSize:11,color:"#64748b",marginTop:3}}>{sub}</div>}
  </div>
 );
}
function Modal({children,onClose,title}){
 return(
  <div onClick={onClose} style={{position:"fixed",inset:0,background:"#0007",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
   <div onClick={e=>e.stopPropagation()} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:24,width:"100%",maxWidth:540,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 8px 32px #0002"}}>
    {title&&<h3 style={{color:"#f59e0b",marginTop:0,marginBottom:20}}>{title}</h3>}
    {children}
   </div>
  </div>
 );
}

// ── Empreitada Nivaldo completa do PDF ────────────────────────────────────────
const NIVALDO_ITENS=[
 // ATIVIDADES PRELIMINARES E FUNDAÇÃO
 {cod:"3.1",ativ:"Bloco de Coroamento",und:"UND",total:19,unit:300},
 {cod:"3.2",ativ:"Viga Baldrame",und:"M",total:70,unit:150},
 {cod:"4.1",ativ:"Impermeabilização de Viga Baldrame",und:"M2",total:20.25,unit:40},
 // TÉRREO
 {cod:"T1.1",ativ:"Pilar de Concreto",und:"UND",total:18,unit:300},
 {cod:"T1.2",ativ:"Viga de Concreto",und:"UND",total:30,unit:300},
 {cod:"T2.1",ativ:"Alvenaria (Muro)",und:"M2",total:96,unit:0},
 {cod:"T2.2",ativ:"Alvenaria (Casa)",und:"M2",total:220.35,unit:0},
 {cod:"T2.3",ativ:"Reboco",und:"M2",total:632.7,unit:0},
 {cod:"T3.2",ativ:"Contrapiso Telado",und:"M2",total:138.12,unit:0},
 // 1º PAVIMENTO
 {cod:"P1.1",ativ:"Pilar de Concreto (1º Pav)",und:"UND",total:19,unit:300},
 {cod:"P1.2",ativ:"Viga de Concreto (1º Pav)",und:"UND",total:30,unit:300},
 {cod:"P1.3",ativ:"Laje Pré-Moldada (Montagem)",und:"M2",total:125.25,unit:0},
 {cod:"P1.4",ativ:"Laje Pré-Moldada (Concretagem)",und:"M2",total:125.25,unit:0},
 {cod:"P1.5",ativ:"Escada de Concreto",und:"UND",total:1,unit:0},
 {cod:"P2.1",ativ:"Alvenaria (Casa) 1º Pav",und:"M2",total:259.14,unit:0},
 {cod:"P2.2",ativ:"Reboco 1º Pav",und:"M2",total:518.28,unit:0},
 {cod:"P3.1",ativ:"Contrapiso 1º Pav",und:"M2",total:125.25,unit:0},
 // COBERTURA
 {cod:"C1.1",ativ:"Pilar de Concreto (Cob)",und:"UND",total:4,unit:300},
 {cod:"C1.2",ativ:"Viga de Concreto (Cob)",und:"UND",total:4,unit:300},
 {cod:"C1.3",ativ:"Laje Pré-Moldada Montagem (Cob)",und:"M2",total:8,unit:0},
 {cod:"C1.4",ativ:"Laje Pré-Moldada Concretagem (Cob)",und:"M2",total:8,unit:0},
 {cod:"C1.5",ativ:"Rufo de Concreto",und:"M",total:46,unit:0},
 {cod:"C2.1",ativ:"Alvenaria (Casa) Cob",und:"M2",total:94.05,unit:0},
 {cod:"C2.2",ativ:"Reboco Cob",und:"M2",total:188.1,unit:0},
 {cod:"C3.1",ativ:"Contrapiso Cob",und:"M2",total:8,unit:0},
];

// ── Acompanhamento completo do PDF ────────────────────────────────────────────
const IA_M={F:"Fundação",T:"Térreo",P:"1º Pavimento",C:"Cobertura",Fa:"Fachada"};
const IA=[
["F","Limpeza","1.1","Limpeza do Terreno",1,"M2",160,160],
["F","Tapume","2.1","Tapume com Estrutura Metálica",2,"M",56,56],
["F","Escavação","3.1","Escavação Manual",2,"M2",7.95,6],
["F","Estrutura","4.1","Estaca de Concreto",5,"M",76,76],
["F","Estrutura","4.2","Bloco de Coroamento",5,"M3",3.75,1.5],
["F","Estrutura","4.3","Viga Baldrame",5,"M3",4.2,2],
["F","Impermeabilização","5.1","Impermeabilização de Viga Baldrame",1.5,"M2",20.25,0],
["T","Estrutura","1.1","Pilar de Concreto",20,"M3",2.57,0],
["T","Estrutura","1.2","Viga de Concreto",20,"M3",3.75,0],
["T","Parede","2.1","Alvenaria (Muro)",7,"M2",96,0],
["T","Parede","2.2","Alvenaria (Casa)",15,"M2",220.35,0],
["T","Parede","2.3","Reboco",15,"M2",632.7,0],
["T","Piso","3.1","Aterramento e Novelamento",5,"M2",160,0],
["T","Piso","3.2","Contrapiso Telado",7,"M2",138.12,0],
["T","Piso","3.3","Revestimento Cerâmico (Piso)",5,"M2",94.75,0],
["T","Piso","3.4","Rejuntamento (Piso)",1.5,"M2",94.75,0],
["T","Piso","3.5","Rodapé",2,"M",74,0],
["T","Inst. Hidrossanitárias","4.1","Fossa Séptica",1.5,"UND",1,0],
["T","Inst. Hidrossanitárias","4.2","Caixa de Inspeção",1.5,"UND",3,0],
["T","Inst. Hidrossanitárias","4.3","Caixa de Gordura",0.5,"UND",1,0],
["T","Inst. Hidrossanitárias","4.4","Ponto de Água",7,"UND",12,0],
["T","Inst. Hidrossanitárias","4.5","Ponto de Esgoto",10,"UND",12,0],
["T","Inst. Hidrossanitárias","4.6","Ponto de Dreno",2,"UND",3,0],
["T","Inst. Elétrica","5.1","Ponto de Tomada",7,"UND",20,0],
["T","Inst. Elétrica","5.2","Ponto de Ar Condicionado",1,"UND",3,0],
["T","Inst. Elétrica","5.3","Ponto de Iluminação",5,"UND",15,0],
["T","Inst. Elétrica","5.4","Aterramento",1,"UND",1,0],
["T","Inst. Elétrica","5.5","QGBT Geral",2,"UND",1,0],
["T","Revestimento","6.1","Revestimento Cerâmico (Parede)",5,"M2",116.1,0],
["T","Revestimento","6.2","Rejuntamento (Parede)",2,"M2",116.1,0],
["T","Iluminação","7.1","Luminária Quadrada 24W",1.3,"UND",13,0],
["T","Iluminação","7.2","Lustre",0.3,"UND",1,0],
["T","Iluminação","7.3","Arandela",0.1,"UND",1,0],
["T","Forro","8.1","Forro de Gesso",3,"M2",87.61,0],
["T","Forro","8.2","Forro Vinílico",1,"M2",7.14,0],
["T","Esquadria","9.1","Porta 1,50x2,50m ACM",1,"M2",3.75,0],
["T","Esquadria","9.2","Porta MDF 0,70x2,10m",1.5,"UND",3,0],
["T","Esquadria","9.3","Porta MDF 0,90x2,10m",0.5,"UND",1,0],
["T","Esquadria","9.4","Porta Correr 2 Folhas 2,00x2,10m",0.5,"UND",1,0],
["T","Esquadria","9.5","Porta Correr 4 Folhas 3,00x2,10m",0.5,"UND",1,0],
["T","Esquadria","9.6","Janela 1,30x1,10m 2 Folhas",1,"UND",2,0],
["T","Esquadria","9.7","Janela 1,80x2,80m Basculante",0.5,"UND",1,0],
["T","Esquadria","9.8","Balancim 0,60x0,60m",1,"UND",2,0],
["T","Louças e Metais","12.1","Bacia Sanitária Completa",1.5,"UND",3,0],
["T","Louças e Metais","12.2","Tanque Padrão Médio",0.6,"UND",2,0],
["T","Louças e Metais","12.3","Cuba Cozinha",0.6,"UND",2,0],
["T","Louças e Metais","12.4","Cuba Banheiro",0.9,"UND",3,0],
["T","Louças e Metais","12.5","Torneira Cozinha",0.2,"UND",2,0],
["T","Louças e Metais","12.6","Torneira Banheiro",0.3,"UND",3,0],
["T","Louças e Metais","12.7","Chuveiro Banheiro",0.2,"UND",1,0],
["P","Estrutura","1.1","Pilar de Concreto",20,"UND",19,0],
["P","Estrutura","1.2","Viga de Concreto",20,"UND",30,0],
["P","Estrutura","1.3","Laje Pré-Moldada (Montagem)",10,"M2",125.25,0],
["P","Estrutura","1.4","Laje Pré-Moldada (Concretagem)",2,"M2",125.25,0],
["P","Estrutura","1.5","Escada de Concreto",5,"UND",1,0],
["P","Parede","2.1","Alvenaria (Casa)",15,"M2",259.14,0],
["P","Parede","2.2","Reboco",15,"M2",518.28,0],
["P","Piso","3.1","Contrapiso",3,"M2",125.25,0],
["C","Estrutura","1.1","Pilar de Concreto",5,"UND",4,0],
["C","Estrutura","1.2","Viga de Concreto",5,"UND",4,0],
["C","Estrutura","1.3","Laje Pré-Moldada (Montagem)",2,"M2",8,0],
["C","Estrutura","1.4","Laje Pré-Moldada (Concretagem)",0.5,"M2",8,0],
["C","Estrutura","1.5","Rufo de Concreto",3,"M",46,0],
["C","Parede","2.1","Alvenaria (Casa)",7,"M2",94.05,0],
["C","Parede","2.2","Reboco",7,"M2",188.1,0],
["C","Piso","3.1","Contrapiso",1,"M2",8,0],
["Fa","Revestimento","1.1","Revestimento Cerâmico",2,"M2",13.2,0],
["Fa","Pintura","2.1","Aplicação de Massa em Parede",7,"M2",288,0],
["Fa","Pintura","2.2","Aplicação de Cimento Queimado",7,"M2",288,0],
["Fa","Iluminação","3.1","Perfil LED 2m",2,"UND",7,0]
].map(([pav,sec,cod,ativ,prazo,und,total,acum])=>({pav:IA_M[pav]||pav,sec,cod,ativ,prazo:+prazo,und,total:+total,acum:+acum,meds:[],peso_obra:+prazo/464.5*100}));


const TOTAL_DIAS_OBRA=464.5;

// Weighted completion: sum(prazo_i * acum_i/total_i) / TOTAL_DIAS * 100
function calcConclusaoGeral(A){
  return A.reduce((s,a)=>s+(a.total>0?(a.acum/a.total)*a.prazo:0),0)/TOTAL_DIAS_OBRA*100;
}

const ORC_TOTALS={
 "Administrativo":23113,
 "Térreo":296184,
 "1º Pavimento":233860,
 "Cobertura":122082,
 "Fachada":29018,
 "Impostos/BDI":54000,
};





const IC_M={A:"Administrativo",T:"Térreo",P:"1º Pavimento",C:"Cobertura",F:"Fachada",M:"Mão de Obra",O:"Outros"};
const IC=[
["A","Serviços Preliminares","ART da Obra","Und",1,280,280,"pago",""],
["A","Serviços Preliminares","Placa de Obra","Und",1,850,850,"pago",""],
["A","Serviços Preliminares","Telha Metálica do Vizinho","vb",1,2000,2000,"pago",""],
["A","Serviços Preliminares","Aluguel de Containers","vb",1,14600,6200,"pago_parcial","Lok Center"],
["A","Serviços Preliminares","Material Jurunense","vb",1,2593,2593,"pago",""],
["A","Serviços Preliminares","Alvará de Obra","vb",1,0,0,"pendente",""],
["T","Estrutura","Aço Belém (Baldrame e Bloco)","vb",1,6238.40,6238.40,"pago","Aço Belém"],
["T","Estrutura","Tabalmix Concreto Estaca","m3",6,1110,6660,"pago","Tabalmix"],
["T","Estrutura","Concreto Bloco","m3",5.1,730,0,"pendente",""],
["T","Estrutura","Forma Bloco","m2",7,180,700,"pago_parcial",""],
["T","Estrutura","Concreto Baldrame","m3",5.22,720,0,"pendente",""],
["T","Estrutura","Forma Baldrame","vb",1,2027,2027,"pago",""],
["T","Estrutura","Muro de Divisa (GPT)","vb",1,16000,0,"pendente",""],
["T","Parede","Tijolo Baiano","milheiro",6,680,0,"pendente",""],
["T","Parede","Saco de Cimento","saca",92,49,0,"pendente",""],
["T","Parede","Areia","m3",12,120,0,"pendente",""],
["T","Parede","Quimikal","galão",2,30,0,"pendente",""],
["T","Parede","Insumos","vb",1,1000,0,"pendente",""],
["T","Piso","Aterro","carrada",1,1000,0,"pendente",""],
["T","Piso","Malha Pop","Und",26,268.33,0,"pendente",""],
["T","Piso","Cimento (Piso)","saca",97,49,0,"pendente",""],
["T","Piso","Areia (Piso)","carrada",1,1200,0,"pendente",""],
["T","Piso","Quimikal (Piso)","L",30,12,0,"pendente",""],
["T","Piso","Lona 4M","m",25,5.90,0,"pendente",""],
["T","Piso","Arame Recozido","kg",2,10,0,"pendente",""],
["T","Piso","Porcelanato 70x70 (à definir)","m2",110,70,0,"pendente",""],
["T","Piso","Argamassa ACII (Piso)","saca",37,25,0,"pendente",""],
["T","Piso","Rejunte (Piso)","kg",7,15,0,"pendente",""],
["T","Piso","Espaçador 2mm (Piso)","pacote",28,12.90,0,"pendente",""],
["T","Piso","Cunha (Piso)","pacote",10,15.90,0,"pendente",""],
["T","Impermeabilização","Primer Asfáltico + Brocha","vb",1,1144.94,1144.94,"pago","Mercado Livre"],
["T","Inst. Hidrossanitárias","Conexões Água","vb",1,1500,0,"pendente",""],
["T","Inst. Hidrossanitárias","Conexões Esgoto","vb",1,2000,0,"pendente",""],
["T","Inst. Hidrossanitárias","Caixa D'Água 1000L","Und",1,600,0,"pendente",""],
["T","Inst. Hidrossanitárias","Fossa Séptica","Und",1,500,0,"pendente",""],
["T","Inst. Hidrossanitárias","Caixa de Inspeção","Und",3,200,0,"pendente",""],
["T","Inst. Hidrossanitárias","Caixa de Gordura","Und",1,300,0,"pendente",""],
["T","Inst. Elétricas","Quadro de Distribuição 24DIN 100A","Und",1,1500,0,"pendente",""],
["T","Inst. Elétricas","Haste de Aterramento","Und",1,200,0,"pendente",""],
["T","Inst. Elétricas","Cabo 1,5mm","rolo",4,100,0,"pendente",""],
["T","Inst. Elétricas","Cabo 2,5mm","rolo",6,140,0,"pendente",""],
["T","Inst. Elétricas","Cabo 4mm","rolo",1,270,0,"pendente",""],
["T","Inst. Elétricas","Cabo 16mm","rolo",1,580,0,"pendente",""],
["T","Inst. Elétricas","Conduíte Rígido","m",100,8,0,"pendente",""],
["T","Inst. Elétricas","Conduíte Corrugado Amarelo","rolo",5,90,0,"pendente",""],
["T","Inst. Elétricas","Tomada Dupla 10A","Und",20,20,0,"pendente",""],
["T","Inst. Elétricas","Tomada Dupla 20A","Und",3,20,0,"pendente",""],
["T","Inst. Elétricas","Interruptor Simples","Und",3,20,0,"pendente",""],
["T","Inst. Elétricas","Interruptor Duplo","Und",3,20,0,"pendente",""],
["T","Revestimento","Porcelanato BHO","m2",60,61.92,3715.20,"pago",""],
["T","Revestimento","Porcelanato Cozinha","m2",52,70,0,"pendente",""],
["T","Revestimento","Argamassa ACII (Revestimento)","saca",44,25,0,"pendente",""],
["T","Revestimento","Rejunte (Revestimento)","kg",10,15,0,"pendente",""],
["T","Revestimento","Espaçador 2mm (Revestimento)","pacote",30,12.90,0,"pendente",""],
["T","Revestimento","Cunha (Revestimento)","pacote",10,15.90,0,"pendente",""],
["T","Iluminação","Luminária Quadrada 30cm","Und",13,30,0,"pendente",""],
["T","Iluminação","Arandela","Und",1,150,0,"pendente",""],
["T","Iluminação","Lustre","Und",1,400,0,"pendente",""],
["T","Forro","Placa de Gesso 1,80x1,20","unidade",45,40,0,"pendente",""],
["T","Forro","Fita Telada","rolo",2,18,0,"pendente",""],
["T","Forro","Massa para Gesso","balde",2,90,0,"pendente",""],
["T","Forro","Demais Itens (Forro)","vb",1,700,0,"pendente",""],
["T","Forro","Forro Vinílico","m2",7.14,250,0,"pendente",""],
["T","Esquadrias","Porta MDF 70cm Completa","unidade",3,700,0,"pendente",""],
["T","Esquadrias","Porta MDF 90cm Completa","unidade",1,800,0,"pendente",""],
["T","Esquadrias","Porta ACM 1,5x2,5m","m2",3.75,700,0,"pendente",""],
["T","Esquadrias","Porta de Correr 2 Folhas Vidro 2,00x2,10m","m2",4.2,660,0,"pendente",""],
["T","Esquadrias","Porta de Correr 4 Folhas Vidro 3,00x2,10m","m2",6.2,660,0,"pendente",""],
["T","Esquadrias","Janela 1,30x1,10m 2 Folhas Vidro Incolor","m2",2.86,650,0,"pendente",""],
["T","Esquadrias","Janela 1,80x2,80m Basculante Vidro Incolor","m2",5.04,800,0,"pendente",""],
["T","Esquadrias","Balancim 0,60x0,60m Basculante Vidro Incolor","m2",0.72,1020,0,"pendente",""],
["T","Pintura","Selador","latão",2,150,0,"pendente",""],
["T","Pintura","Massa PVA","balde",12,70,0,"pendente",""],
["T","Pintura","Tinta Parede","latão",4,400,0,"pendente",""],
["T","Pintura","Tinta Branco Neve Fosco","latão",1,300,0,"pendente",""],
["T","Pintura","Lixa N100","Und",40,1,0,"pendente",""],
["T","Pintura","Fita Crepe","rolo",6,8,0,"pendente",""],
["T","Pintura","Rolo de Lã","Und",3,10,0,"pendente",""],
["T","Marmoraria","Soleira m. Ubatuba Verde","m2",1.42,380,0,"pendente",""],
["T","Marmoraria","Peitoril m. Ubatuba Verde","m2",1.11,380,0,"pendente",""],
["T","Marmoraria","Bancada m. Ubatuba Verde","m2",6,380,0,"pendente",""],
["T","Marmoraria","Argamassa e Conduíte (Marmoraria)","vb",1,600,0,"pendente",""],
["T","Louças","Bacia Sanitária Completa Padrão Médio","Und",3,899,0,"pendente",""],
["T","Louças","Tanque Padrão Médio","Und",2,300,0,"pendente",""],
["T","Louças","Kit Cozinha","Und",2,600,0,"pendente",""],
["T","Louças","Cuba Banheiro Padrão Médio","Und",3,199,0,"pendente",""],
["T","Louças","Torneira Banheiro Padrão Médio","Und",3,80,0,"pendente",""],
["T","Louças","Chuveiro Banheiro Padrão Médio","Und",1,120,0,"pendente",""],
["T","Louças","Chuveiro Externo Padrão Médio","Und",1,120,0,"pendente",""],
["T","Louças","Sifão Universal","Und",5,25,0,"pendente",""],
["T","Louças","Engate Universal","Und",5,12,0,"pendente",""],
["P","Estrutura","Aço CA50 Pilar","kg",534.7,8.99,0,"pendente",""],
["P","Estrutura","Aço CA60 Pilar","kg",213.8,11,0,"pendente",""],
["P","Estrutura","Concreto Pilar","m3",5,720,0,"pendente",""],
["P","Estrutura","Forma Pilar","dúzia",20,180,0,"pendente",""],
["P","Estrutura","Laje EPS","m2",125.25,80,0,"pendente",""],
["P","Estrutura","Concretagem Laje","m3",11,900,0,"pendente",""],
["P","Estrutura","Aço CA50 Viga","kg",432.4,8.99,0,"pendente",""],
["P","Estrutura","Aço CA60 Viga","kg",92.4,11,0,"pendente",""],
["P","Estrutura","Concreto Viga","m3",5.22,720,0,"pendente",""],
["P","Estrutura","Forma Viga","m2",17,180,0,"pendente",""],
["P","Estrutura","Escada","m3",1.75,3500,0,"pendente",""],
["P","Parede","Tijolo Baiano","milheiro",7,680,0,"pendente",""],
["P","Parede","Saco de Cimento","saca",110,49,0,"pendente",""],
["P","Parede","Areia","carrada",1,1200,0,"pendente",""],
["P","Parede","Quimikal","galão",3,30,0,"pendente",""],
["P","Parede","Insumos","vb",1,1000,0,"pendente",""],
["P","Piso","Cimento (Piso)","saca",25,49,0,"pendente",""],
["P","Piso","Areia (Piso)","m3",4,120,0,"pendente",""],
["P","Piso","Porcelanato 70x70 (à definir)","m2",100,70,0,"pendente",""],
["P","Piso","Argamassa ACII","saca",33,25,0,"pendente",""],
["P","Impermeabilização","Manta Asfáltica","rolo",2,380,0,"pendente",""],
["P","Inst. Hidrossanitárias","Conexões Água","vb",1,1000,0,"pendente",""],
["P","Inst. Hidrossanitárias","Conexões Esgoto","vb",1,1200,0,"pendente",""],
["P","Inst. Elétricas","Cabo 1,5mm","rolo",4,100,0,"pendente",""],
["P","Inst. Elétricas","Cabo 2,5mm","rolo",6,140,0,"pendente",""],
["P","Inst. Elétricas","Conduíte Rígido","m",100,8,0,"pendente",""],
["P","Inst. Elétricas","Conduíte Corrugado Amarelo","rolo",5,90,0,"pendente",""],
["P","Revestimento","Porcelanato 70x70 (à definir)","m2",80,61.92,4953.60,"pago",""],
["P","Revestimento","Argamassa ACII","saca",44,25,0,"pendente",""],
["P","Iluminação","Luminária Quadrada 30cm","Und",13,30,0,"pendente",""],
["P","Forro","Placa de Gesso 1,80x1,20","unidade",42,40,0,"pendente",""],
["P","Forro","Demais Itens (Forro)","vb",1,700,0,"pendente",""],
["P","Esquadrias","Porta MDF 90cm Completa","unidade",6,800,0,"pendente",""],
["P","Esquadrias","Porta de Correr 4 Folhas Vidro 3,00x2,10m","m2",6.2,660,0,"pendente",""],
["P","Esquadrias","Janela 1,40x1,10m 2 Folhas Vidro Incolor","m2",3.08,660,0,"pendente",""],
["P","Esquadrias","Janela 1,30x1,10m 2 Folhas Vidro Incolor","m2",1.43,650,0,"pendente",""],
["P","Esquadrias","Balancim 0,60x0,60m Basculante Vidro Incolor","m2",1.08,1020,0,"pendente",""],
["P","Esquadrias","Guarda-Corpo Panorâmico de Vidro","m2",3.6,952,0,"pendente",""],
["P","Pintura","Selador","latão",1,150,0,"pendente",""],
["P","Pintura","Massa PVA","balde",8,70,0,"pendente",""],
["P","Pintura","Tinta Parede","latão",2,400,0,"pendente",""],
["P","Marmoraria","Soleira m. Ubatuba Verde","m2",1.26,380,0,"pendente",""],
["P","Marmoraria","Peitoril m. Ubatuba Verde","m2",1.34,380,0,"pendente",""],
["P","Marmoraria","Bancada m. Ubatuba Verde","m2",2.16,380,0,"pendente",""],
["P","Louças","Bacia Sanitária Completa Padrão Médio","Und",3,899,0,"pendente",""],
["P","Louças","Cuba Banheiro Padrão Médio","Und",3,199,0,"pendente",""],
["P","Louças","Torneira Banheiro Padrão Médio","Und",3,80,0,"pendente",""],
["P","Louças","Chuveiro Banheiro Padrão Médio","Und",3,120,0,"pendente",""],
["P","Louças","Sifão Universal","Und",3,25,0,"pendente",""],
["C","Estrutura","Aço CA50 Pilar","kg",534.7,8.99,0,"pendente",""],
["C","Estrutura","Aço CA60 Pilar","kg",213.8,11,0,"pendente",""],
["C","Estrutura","Concreto Pilar","m3",5,720,0,"pendente",""],
["C","Estrutura","Forma Pilar","dúzia",20,180,0,"pendente",""],
["C","Estrutura","Laje EPS (Cobertura)","m2",8,80,0,"pendente",""],
["C","Estrutura","Concretagem Laje (Cobertura)","m3",1,900,0,"pendente",""],
["C","Estrutura","Aço CA50 Viga","kg",432.4,8.99,0,"pendente",""],
["C","Estrutura","Aço CA60 Viga","kg",92.4,11,0,"pendente",""],
["C","Estrutura","Concreto Viga","m3",5.22,720,0,"pendente",""],
["C","Estrutura","Forma Viga","m2",17,180,0,"pendente",""],
["C","Parede","Tijolo Baiano","milheiro",2,680,0,"pendente",""],
["C","Parede","Saco de Cimento","saca",39.6,49,0,"pendente",""],
["C","Parede","Areia","carrada",0.5,1200,0,"pendente",""],
["C","Telhado","Chapa de Zinco 70cm","m",18,35,0,"pendente",""],
["C","Telhado","Telha Ondina","Und",60,140,0,"pendente",""],
["C","Telhado","Ripa","dúzia",72,10,0,"pendente",""],
["C","Telhado","Caibro","dúzia",36,50,0,"pendente",""],
["C","Telhado","Esteio","Und",4,220,0,"pendente",""],
["C","Telhado","Manta","rolo",8,50,0,"pendente",""],
["F","Revestimento","Porcelanato 70x70 (Fachada)","m2",10,70,0,"pendente",""],
["F","Revestimento","Ripado de PVC","m2",7.8,200,0,"pendente",""],
["F","Pintura","Massa PVA","balde",10,70,0,"pendente",""],
["F","Pintura","Tinta Parede","latão",3,400,0,"pendente",""],
["F","Cimento Queimado","Massa Acrílica","balde",40,150,0,"pendente",""],
["F","Cimento Queimado","Tinta Fachada","latão",4,600,0,"pendente",""],
["M","Equipes","Sérgio Diarista (Limpeza Terreno)","diária",1,3500,3500,"pago",""],
["M","Equipes","Aluguel de Andaime","mês",6,350,0,"pendente",""],
["M","Equipes","Aluguel Compactador","mês",1,600,0,"pendente",""],
["M","Equipes","David — Gesseiro (Terceirizado)","m2",170,35,0,"pendente",""],
["M","Equipes","Allan — Eletricista (Terceirizado)","vb",1,17000,0,"pendente",""],
["M","Equipes","Edmauro — Pintor (Terceirizado)","vb",1,10000,0,"pendente",""],
["M","Equipes","Monique Engenheira","mês",7,3200,5800,"pago_parcial",""],
["M","Equipes","Container","Und",10,300,0,"pendente",""],
["M","Equipes","Ednilson — Mão de Obra Manta","m2",30,30,0,"pendente",""],
["M","Equipes","Agilson — Projeto Hidrossanitário e Elétrico","vb",1,5000,5000,"pago",""],
["M","Equipes","Solo Núcleo — Equipe de Fundação","vb",1,6180,6180,"pago",""],
["M","Equipes","Rondineli — Equipe de Estrutura + Alvenaria","vb",1,8205,8205,"pago",""],
["M","Equipes","Santos — Equipe Montagem de Laje","vb",1,4600,0,"pendente",""],
["M","Equipes","Márcio — Equipe de Acabamento","vb",1,25000,0,"pendente",""],
["M","Equipes","David — Instalador de Portas","vb",1,2000,0,"pendente",""],
["M","Equipes","Helana — Aluguel da Casa","mês",1,1000,1000,"pago",""],
["M","Equipes","Nivaldo — Empreitada Fase Cinza","vb",1,135000,4000,"pago_parcial",""],
["M","Equipes","Encanador (À Definir)","vb",1,7000,0,"pendente",""],
["O","Impostos","Imposto/Nota Fiscal","vb",1,54000,0,"pendente",""],
["O","Equipamentos","Equipamentos","vb",1,5500,5500,"pago",""],
["O","Equipamentos","Retirada de Entulho","vb",1,10000,10000,"pago",""],
["O","Equipamentos","Ferramentas e Aluguel","vb",1,1439.90,1439.90,"pago",""],
["O","Equipamentos","Ajuste de Obras","vb",1,6143.60,553.82,"pago_parcial",""]
].map(([pav,cat,desc,und,qtd,unit,pago,status,forn])=>({pav:IC_M[pav]||pav,cat,desc,und,qtd:+qtd,unit:+unit,total:+qtd*+unit,pago:+pago,status,forn}));


const IES=[
 {tipo:"Material de Obra",item:"Ferro 5.0mm",qtd:64,und:"Vergalhão",local:"Container",dt:""},
 {tipo:"Material de Obra",item:"Ferro 12,50mm",qtd:52,und:"Vergalhão",local:"Container",dt:""},
 {tipo:"Material de Obra",item:"Arame Recozido",qtd:20,und:"kg",local:"Container",dt:""},
 {tipo:"Material de Obra",item:"Telha para Tapume",qtd:44,und:"m",local:"Em Uso",dt:""},
 {tipo:"Material de Obra",item:"Pernamanca",qtd:5,und:"Dúzias",local:"Em Uso",dt:""},
 {tipo:"Material de Obra",item:"Tábua Branca",qtd:5,und:"Dúzias",local:"Em Uso",dt:""},
 {tipo:"Material de Obra",item:"Impermeabilizante",qtd:3,und:"Latões",local:"Em Casa",dt:""},
 {tipo:"Material de Obra",item:"Broxa",qtd:4,und:"Und",local:"Em Casa",dt:""},
 {tipo:"Ferramentas/EPIs",item:"Capacete Azul",qtd:6,und:"Und",local:"Em Uso",dt:""},
 {tipo:"Ferramentas/EPIs",item:"Capacete Branco",qtd:1,und:"Und",local:"Em Uso",dt:""},
 {tipo:"Ferramentas/EPIs",item:"Uniforme Humanity",qtd:4,und:"Und",local:"Em Uso",dt:""},
 {tipo:"Ferramentas/EPIs",item:"Draga Mecânica",qtd:1,und:"Und",local:"Container",dt:""},
 {tipo:"Mobiliário",item:"Bebedouro de Mesa",qtd:1,und:"Und",local:"Canteiro",dt:""},
 {tipo:"Mobiliário",item:"Tenda 3m x 3m",qtd:1,und:"Und",local:"Canteiro",dt:""},
 {tipo:"Mobiliário",item:"Mesa de Plástico",qtd:1,und:"Und",local:"Container",dt:""},
 {tipo:"Mobiliário",item:"Cadeira de Plástico",qtd:4,und:"Und",local:"Container",dt:""},
 {tipo:"Mobiliário",item:"Corrente",qtd:2,und:"m",local:"Canteiro/Container",dt:""},
 {tipo:"Mobiliário",item:"Cadeado",qtd:2,und:"Und",local:"Canteiro/Container",dt:""},
];

const IR=[
 {data:"Out/2025",prev:45000,rec:45000,obs:""},
 {data:"Nov/2025",prev:30000,rec:30000,obs:""},
 {data:"Dez/2025",prev:30000,rec:30000,obs:""},
 {data:"Jan/2026",prev:30000,rec:30000,obs:""},
 {data:"Abr/2026",prev:21688.84,rec:21688.84,obs:"Parcelas + Reembolso"},
 {data:"Jun/2026",prev:30000,rec:30000,obs:"Parcelas"},
 {data:"Jul/2026",prev:60000,rec:0,obs:""},
 {data:"Ago/2026",prev:60000,rec:0,obs:""},
 {data:"Set/2026",prev:60000,rec:0,obs:""},
 {data:"Out/2026",prev:60000,rec:0,obs:""},
 {data:"Nov/2026",prev:60000,rec:0,obs:""},
 {data:"Dez/2026",prev:60000,rec:0,obs:""},
 {data:"Jan/2027",prev:60000,rec:0,obs:""},
 {data:"Fev/2027",prev:60000,rec:0,obs:""},
 {data:"Mar/2027",prev:60000,rec:0,obs:""},
 {data:"Abr/2027",prev:43218.47,rec:0,obs:""},
];


const IE_DEFAULT=[
 {id:"e1",nome:"Nivaldo",tel:"",cpf:"",status:"Empreitada Fase Cinza",
  itens:NIVALDO_ITENS,medicoes:[],
  pagamentos:[{semana:"Inicial",valor:4000,obs:"Adiantamento",data:"29/04/2026"}]},
];

const OBRAS=[{id:"lote_d18",nome:"LOTE D18 — Quinta das Orquídeas",cliente:"Marcelo Azevedo Costa",local:"Ananindeua/PA",inicio:"29/04/2026",contrato:750000,status:"Em andamento"}];

// ════════════════════ DASHBOARD ENGENHEIRA (sem financeiro) ════════════════
function DashboardEng({D,obra}){
 const A=D.acomp||[];
 const conclusao=calcConclusaoGeral(A);
 const pavs=["Fundação","Térreo","1º Pavimento","Cobertura","Fachada"];
 const COLORS={"Fundação":"#f59e0b","Térreo":"#3b82f6","1º Pavimento":"#10b981","Cobertura":"#8b5cf6","Fachada":"#ef4444"};
 const [drill,setDrill]=useState(null);
 const pavPct=pav=>{
  const its=A.filter(a=>a.pav===pav);
  const td=its.reduce((s,a)=>s+(a.prazo||0),0);
  const cd=its.reduce((s,a)=>s+(a.total>0?(a.acum/a.total)*a.prazo:0),0);
  return td>0?cd/td*100:0;
 };
 const drillSecs=drill?[...new Set(A.filter(a=>a.pav===drill).map(a=>a.sec))].map(sec=>{
  const its=A.filter(a=>a.pav===drill&&a.sec===sec);
  const td=its.reduce((s,a)=>s+(a.prazo||0),0);
  const cd=its.reduce((s,a)=>s+(a.total>0?(a.acum/a.total)*a.prazo:0),0);
  return{sec,pct:td>0?cd/td*100:0};
 }):[];
 return(
  <div>
   <div style={{marginBottom:20}}>
    <h2 style={{fontSize:20,fontWeight:800,color:"#f59e0b",margin:"0 0 4px"}}>Dashboard</h2>
    <p style={{fontSize:12,color:"#94a3b8",margin:0}}>{obra?obra.nome:"—"} · Ananindeua/PA</p>
   </div>
   <div style={{background:"#1e2d5a",borderRadius:14,padding:20,marginBottom:20,textAlign:"center"}}>
    <div style={{fontSize:11,color:"#94a3b8",textTransform:"uppercase",letterSpacing:1}}>Conclusão Geral da Obra</div>
    <div style={{fontSize:42,fontWeight:800,color:"#f8c400",lineHeight:1.1,marginTop:4}}>{pct(conclusao)}</div>
    <div style={{background:"#334155",borderRadius:8,height:12,marginTop:12,overflow:"hidden"}}>
     <div style={{background:"#f8c400",height:"100%",width:`${Math.min(conclusao,100)}%`,transition:"width .5s"}}/>
    </div>
   </div>
   <div style={{fontSize:13,fontWeight:700,color:"#1e2d5a",marginBottom:12}}>Avanço por Etapa {drill&&<span style={{fontSize:11,color:"#64748b",fontWeight:400}}>— toque para voltar</span>}</div>
   {!drill&&(
    <div style={{display:"grid",gap:10}}>
     {pavs.map(p=>{
      const pc=pavPct(p);
      return(
       <div key={p} onClick={()=>setDrill(p)} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:"12px 14px",cursor:"pointer"}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}>
         <span style={{fontWeight:700,color:COLORS[p]||"#1e2d5a"}}>{p}</span>
         <span style={{fontWeight:800,color:pc>=100?"#16a34a":pc>0?"#f59e0b":"#94a3b8"}}>{pct(pc)}</span>
        </div>
        <div style={{background:"#e2e8f0",borderRadius:6,height:12,overflow:"hidden"}}>
         <div style={{background:pc>=100?"#16a34a":(COLORS[p]||"#f8c400"),height:"100%",width:`${Math.min(pc,100)}%`}}/>
        </div>
        <div style={{fontSize:10,color:"#94a3b8",marginTop:5}}>Toque para ver subetapas →</div>
       </div>
      );
     })}
    </div>
   )}
   {drill&&(
    <div>
     <button onClick={()=>setDrill(null)} style={{...BS,marginBottom:12,fontSize:12}}>← Voltar às etapas</button>
     <div style={{fontSize:14,fontWeight:800,color:COLORS[drill]||"#1e2d5a",marginBottom:10}}>{drill}</div>
     <div style={{display:"grid",gap:8}}>
      {drillSecs.map(sc=>(
       <div key={sc.sec} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:"10px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5}}>
         <span style={{fontWeight:600,color:"#475569"}}>{sc.sec}</span>
         <span style={{fontWeight:800,color:sc.pct>=100?"#16a34a":sc.pct>0?"#f59e0b":"#94a3b8"}}>{pct(sc.pct)}</span>
        </div>
        <div style={{background:"#e2e8f0",borderRadius:5,height:9,overflow:"hidden"}}>
         <div style={{background:sc.pct>=100?"#16a34a":"#fbbf24",height:"100%",width:`${Math.min(sc.pct,100)}%`}}/>
        </div>
       </div>
      ))}
     </div>
    </div>
   )}
  </div>
 );
}


// ════════════════════════ APP ROOT ═══════════════════════════════
export default function App(){
 const [showNotifs,setShowNotifs]=useState(false);
 const [toast,setToast]=useState(null);
 const prevMsgLen=useRef(0);
 const [user,setUser]=useState(null);
 const [obraId,setObraId]=useState(null);
 const [tab,setTab]=useState(0);
 const [D,setD]=useState({});
 const [loading,setLoading]=useState(false);
 useEffect(()=>{
 if(!obraId)return;
 (async()=>{
 setLoading(true);
 const defs={custos:IC,acomp:IA,estoque:IES,consumo:[],msgs:[],compras:[
 {item:"Vibrador de Concreto",qtd:1,und:"Und",frente:"Estrutura",dtC:"24/mai",status:"no_prazo",dtCh:"29/mai",tipo:"Ferramenta",obs:""},
 {item:"Betoneira 400L 220V",qtd:1,und:"Und",frente:"Estrutura",dtC:"25/mai",status:"no_prazo",dtCh:"28/mai",tipo:"Material de Obra",obs:""},
 ],rec:IR,emp:IE_DEFAULT};
 const nd={};
 for(const k of Object.keys(defs)){const v=await dbGet(obraId,k);nd[k]=v||defs[k];}
 setD(nd);setLoading(false);
 })();
 },[obraId]);
 useEffect(()=>{
  if(!D||!D.msgs)return;
  const ml=D.msgs.length;
  const myRole=user?user.role:"";
  if(ml>prevMsgLen.current){
   const newest=D.msgs[ml-1];
   if(newest&&newest.role!==myRole){setToast(newest);setTimeout(()=>setToast(null),5000);}
  }
  prevMsgLen.current=ml;
 },[D]);
 const sv=(k,v)=>{setD(d=>({...d,[k]:v}));dbSet(obraId,k,v);};
 if(!user)return <Login onLogin={u=>{setUser(u);setTab(0);}}/>;
 if(!obraId)return <ObrasList user={user} onSel={id=>{setObraId(id);setTab(0);}} onOut={()=>setUser(null)}/>;
 if(loading)return <div style={{minHeight:"100vh",background:"#f8fafc",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#f59e0b",fontSize:16,fontWeight:700}}>Carregando...</span></div>;
 const role=user.role;
 const TA=["Dashboard","Orçamento","Custos","Recebimentos","Medições","Empreitada","Estoque","Compras","Comunicação"];
 const TE=["Dashboard","Medições","Estoque","Compras","Comunicação"];
 const TC=["Avanço da Obra","Meus Pagamentos"];
 const tabs=role==="admin"?TA:role==="eng"?TE:TC;
 const obra=OBRAS.find(o=>o.id===obraId);
 return(
 <div style={{minHeight:"100vh",background:"#f8fafc",fontFamily:"'Inter',system-ui,sans-serif",color:"#1e293b"}}>
 <div style={{background:"#fff",borderBottom:"2px solid #f8c400",boxShadow:"0 1px 4px #0001"}}>
 <div style={{maxWidth:1280,margin:"0 auto",padding:"0 16px"}}>
 <div style={{display:"flex",flexDirection:"column",gap:0}}>
 <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:52,gap:8}}>
  <button onClick={()=>setObraId(null)} style={{background:"none",border:"none",cursor:"pointer",padding:0,flexShrink:0}}>
   <Logo h={28}/>
  </button>
  <div style={{flex:1,minWidth:0,padding:"0 8px"}}>
   <div style={{fontSize:12,fontWeight:700,color:"#f59e0b",lineHeight:1.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{(obra&&obra.nome)}</div>
   <div style={{fontSize:10,color:"#64748b",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{(obra&&obra.local)||"Ananindeua/PA"}</div>
  </div>
 <div style={{position:"relative",display:"inline-flex",alignItems:"center",gap:6}}>
      <button onClick={()=>setShowNotifs(v=>!v)} title="Notificações" style={{background:"#f1f5f9",border:"none",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:15,position:"relative"}}>
       🔔
       {(()=>{const unread=(D&&D.msgs||[]).filter(m=>m.role!==(user?user.role:"")).length;return unread>0?(<span style={{position:"absolute",top:1,right:1,background:"#ef4444",color:"#fff",borderRadius:"50%",width:15,height:15,fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{unread}</span>):null;})()}
      </button>
      {showNotifs&&<div onClick={()=>setShowNotifs(false)} style={{position:"fixed",inset:0,zIndex:90}}/>}
      {showNotifs&&(
       <div style={{position:"absolute",right:0,top:44,background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,boxShadow:"0 8px 32px #0003",zIndex:100,width:310,maxHeight:380,overflowY:"auto"}}>
        <div style={{padding:"10px 14px",fontWeight:700,fontSize:13,color:"#1e2d5a",borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between"}}>
         Notificações
         <button onClick={()=>setShowNotifs(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:16}}>×</button>
        </div>
        {(D&&D.msgs||[]).length===0&&<div style={{padding:20,color:"#94a3b8",fontSize:13,textAlign:"center"}}>Nenhuma notificação ainda.</div>}
        {[...(D&&D.msgs||[])].reverse().map((m,i)=>(
         <div key={i} style={{padding:"10px 14px",borderBottom:"1px solid #f1f5f9"}}>
          <div style={{fontSize:10,color:"#94a3b8",marginBottom:3}}>{m.de} · {m.data}</div>
          <div style={{fontSize:12,color:"#1e293b",whiteSpace:"pre-wrap",lineHeight:1.4}}>{m.texto}</div>
         </div>
        ))}
       </div>
      )}
      <button onClick={()=>{setUser(null);setObraId(null);}} style={{background:"#f1f5f9",border:"none",color:"#64748b",padding:"6px 14px",borderRadius:6,cursor:"pointer",fontSize:12}}>Sair</button>
     </div>
  </div>
  <div style={{display:"flex",alignItems:"center",gap:6,padding:"0 0 6px 4px",borderTop:"1px solid #f1f5f9"}}>
   <div style={{width:6,height:6,borderRadius:"50%",background:role==="admin"?"#f8c400":role==="eng"?"#3b82f6":"#10b981",flexShrink:0}}/>
   <div style={{fontSize:11,color:"#64748b"}}>{user.nome} <span style={{color:"#94a3b8"}}>·</span> <span style={{color:"#94a3b8"}}>{role==="admin"?"Administrador":role==="eng"?"Engenheira Civil":"Cliente"}</span></div>
  </div>
 </div>
 <div style={{display:"flex",gap:2,overflowX:"auto"}}>
 {tabs.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{background:"none",border:"none",cursor:"pointer",padding:"10px 14px",fontSize:12,fontWeight:600,color:tab===i?"#f59e0b":"#94a3b8",borderBottom:tab===i?"2px solid #f8c400":"2px solid transparent",whiteSpace:"nowrap"}}>{t}</button>)}
 </div>
 </div>
 </div>
 <div style={{maxWidth:1280,margin:"0 auto",padding:"20px 16px"}}>
 {role==="admin"&&<>
 {tab===0&&<Dashboard D={D} obra={obra}/>}
 {tab===1&&<Orcamento/>}
 {tab===2&&<Custos C={D.custos||[]} sv={v=>sv("custos",v)}/>}
 {tab===3&&<Recebimentos R={D.rec||[]} sv={v=>sv("rec",v)}/>}
 {tab===4&&<Medicoes A={D.acomp||[]} sv={v=>sv("acomp",v)} obra={obra}/>}
 {tab===5&&<Empreitada E={D.emp||[]} sv={v=>sv("emp",v)} A={D.acomp||[]} svA={v=>sv("acomp",v)}/>}
 {tab===6&&<Estoque ES={D.estoque||[]} CON={D.consumo||[]} svE={v=>sv("estoque",v)} svC={v=>sv("consumo",v)}/>}
 {tab===7&&<Compras CP={D.compras||[]} sv={v=>sv("compras",v)} svE={v=>sv("estoque",v)} ES={D.estoque||[]}/>}
     {tab===8&&<Comunicacao C={D.custos||[]} sv={v=>sv("custos",v)} msgs={D.msgs||[]} svM={v=>sv("msgs",v)} user={user}/>}
 </>}
 {role==="eng"&&<>
 {tab===0&&<DashboardEng D={D} obra={obra}/>}
 {tab===1&&<Medicoes A={D.acomp||[]} sv={v=>sv("acomp",v)} obra={obra} user={user} svM={v=>sv("msgs",v)} msgs={D.msgs||[]}/>}
 {tab===2&&<Estoque ES={D.estoque||[]} CON={D.consumo||[]} svE={v=>sv("estoque",v)} svC={v=>sv("consumo",v)}/>}
 {tab===3&&<Compras CP={D.compras||[]} sv={v=>sv("compras",v)} svE={v=>sv("estoque",v)} ES={D.estoque||[]}/>}
 {tab===4&&<Comunicacao C={D.custos||[]} sv={v=>sv("custos",v)} msgs={D.msgs||[]} svM={v=>sv("msgs",v)} user={user} engOnly={true}/>}
 </>}
 {role==="cli"&&<>
 {tab===0&&<CliAvanço A={D.acomp||[]}/>}
 {tab===1&&<CliPag R={D.rec||[]}/>}
 </>}
 </div>
 </div>
 );
}
function Login({onLogin}){
 const [em,setEm]=useState("");const [pw,setPw]=useState("");const [err,setErr]=useState("");
 const go=()=>{const u=USERS[em.toLowerCase().trim()];if(u&&u.pw===pw)onLogin({...u,email:em});else setErr("E-mail ou senha incorretos.");};
 return(
 <div style={{minHeight:"100vh",background:"#f8fafc",display:"flex",alignItems:"center",justifyContent:"center"}}>
 <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:40,width:340,textAlign:"center",boxShadow:"0 4px 20px #0001"}}>
 <div style={{marginBottom:28,display:"flex",justifyContent:"center"}}><Logo h={42}/></div>
 <div style={{fontSize:13,color:"#64748b",marginBottom:6,textAlign:"left"}}>E-mail</div>
 <input value={em} onChange={e=>{setEm(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="seu@email.com" style={{...IS,marginBottom:12}}/>
 <div style={{fontSize:13,color:"#64748b",marginBottom:6,textAlign:"left"}}>Senha</div>
 <input type="password" value={pw} onChange={e=>{setPw(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="••••••••" style={{...IS,marginBottom:8}}/>
 {err&&<div style={{color:"#ef4444",fontSize:12,margin:"6px 0"}}>{err}</div>}
 <button onClick={go} style={{...BP,width:"100%",marginTop:8,padding:"12px"}}>Entrar</button>
 </div>
 </div>
 );
}
function ObrasList({user,onSel,onOut}){
 return(
 <div style={{minHeight:"100vh",background:"#f8fafc",fontFamily:"'Inter',system-ui,sans-serif"}}>
 <div style={{background:"#fff",borderBottom:"2px solid #f8c400",padding:"0 16px",boxShadow:"0 1px 4px #0001"}}>
 <div style={{maxWidth:1280,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:62}}>
 <Logo h={34}/>
 <div style={{display:"flex",alignItems:"center",gap:12}}>
 <span style={{fontSize:13,color:"#64748b"}}>{user.nome}</span>
 <button onClick={onOut} style={{background:"#f1f5f9",border:"none",color:"#64748b",padding:"6px 14px",borderRadius:6,cursor:"pointer",fontSize:12}}>Sair</button>
 </div>
 </div>
 </div>
 <div style={{maxWidth:1280,margin:"0 auto",padding:"32px 16px"}}>
 <h2 style={{fontSize:22,fontWeight:800,color:"#f59e0b",marginBottom:4}}>Obras</h2>
 <p style={{color:"#64748b",marginBottom:28}}>Selecione uma obra para acessar o painel completo.</p>
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
 {OBRAS.map(o=>(
 <div key={o.id} onClick={()=>onSel(o.id)} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:24,cursor:"pointer",boxShadow:"0 1px 4px #0001"}}
 onMouseEnter={e=>e.currentTarget.style.borderColor="#f8c400"}
 onMouseLeave={e=>e.currentTarget.style.borderColor="#e2e8f0"}>
 <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
 <span style={{fontSize:10,fontWeight:700,color:"#f59e0b",background:"#fef3c7",padding:"3px 10px",borderRadius:20}}>{o.status.toUpperCase()}</span>
 <span style={{fontSize:10,color:"#64748b"}}>{o.inicio}</span>
 </div>
 <div style={{fontSize:16,fontWeight:800,color:"#1e293b",marginBottom:4}}>{o.nome}</div>
 <div style={{fontSize:12,color:"#64748b",marginBottom:2}}>Cliente: {o.cliente}</div>
 <div style={{fontSize:12,color:"#64748b",marginBottom:16}}>Local: {o.local}</div>
 <div style={{fontSize:20,fontWeight:800,color:"#f59e0b"}}>{fmtBR(o.contrato)}</div>
 <div style={{fontSize:11,color:"#64748b"}}>Valor do contrato</div>
 </div>
 ))}
 {user.role==="admin"&&<div style={{background:"#fff",border:"2px dashed #e2e8f0",borderRadius:14,padding:24,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#cbd5e1",minHeight:180}}>
 <div style={{fontSize:32,marginBottom:8}}>+</div><div style={{fontSize:13}}>Nova Obra</div><div style={{fontSize:11,marginTop:4}}>Em breve</div>
 </div>}
 </div>
 </div>
 </div>
 );
}
// Donut individual: 2 dados (concluído / restante)
function Donut({pct:p,size=110,color="#f59e0b",label,sub}){
 const r=size/2-10;const cx=size/2;const cy=size/2;const circ=2*Math.PI*r;
 const done=Math.min(Math.max(p,0),100);
 const dash=circ*done/100;
 return(
  <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
   <svg width={size} height={size}>
    <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={12}/>
    <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={12}
     strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={circ/4} strokeLinecap="round"
     transform={`rotate(-90 ${cx} ${cy})`} style={{transition:"stroke-dasharray .5s"}}/>
    <text x={cx} y={cy-2} textAnchor="middle" fontSize={size*0.17} fontWeight="800" fill={color}>{done.toFixed(0)}%</text>
    <text x={cx} y={cy+size*0.14} textAnchor="middle" fontSize={size*0.08} fill="#94a3b8">concluído</text>
   </svg>
   {label&&<div style={{fontSize:12,fontWeight:700,color:"#1e293b",marginTop:6,textAlign:"center"}}>{label}</div>}
   {sub&&<div style={{fontSize:10,color:"#64748b",textAlign:"center"}}>{sub}</div>}
  </div>
 );
}

function Dashboard({D,obra}){
 const C=D.custos||[];const A=D.acomp||[];const R=D.rec||[];
 const tC=C.reduce((s,c)=>s+(c.total||0),0);
 const tP=C.reduce((s,c)=>s+(c.pago||0),0);
 const tR=R.reduce((s,r)=>s+(r.rec||0),0);
 const conclusao=calcConclusaoGeral(A);
 const [drillPav,setDrillPav]=useState(null);

 const pavs=["Fundação","Térreo","1º Pavimento","Cobertura","Fachada"];
 const COLORS={"Fundação":"#f59e0b","Térreo":"#3b82f6","1º Pavimento":"#10b981","Cobertura":"#8b5cf6","Fachada":"#ef4444"};
 const pavPct=pav=>{
  const its=A.filter(a=>a.pav===pav);
  const totalDias=its.reduce((s,a)=>s+(a.prazo||0),0);
  const concDias=its.reduce((s,a)=>s+(a.total>0?(a.acum/a.total)*a.prazo:0),0);
  return totalDias>0?concDias/totalDias*100:0;
 };
 // Drill: seções do pavimento selecionado
 const drillSecs=drillPav?[...new Set(A.filter(a=>a.pav===drillPav).map(a=>a.sec))].map(sec=>{
  const its=A.filter(a=>a.pav===drillPav&&a.sec===sec);
  const totalDias=its.reduce((s,a)=>s+(a.prazo||0),0);
  const concDias=its.reduce((s,a)=>s+(a.total>0?(a.acum/a.total)*a.prazo:0),0);
  return{sec,pct:totalDias>0?concDias/totalDias*100:0};
 }):[];

 const pavCosts=["Administrativo","Térreo","1º Pavimento","Cobertura","Fachada","Mão de Obra","Outros"].map(pav=>({
  label:pav,value:C.filter(c=>c.pav===pav).reduce((s,c)=>s+(c.total||0),0)
 })).filter(d=>d.value>0);
 const CCOLORS=["#f59e0b","#3b82f6","#10b981","#8b5cf6","#ef4444","#f97316","#06b6d4"];

 return(
  <div>
   <h2 style={{fontSize:20,fontWeight:800,color:"#f59e0b",marginBottom:4}}>Dashboard</h2>
   <p style={{fontSize:13,color:"#64748b",marginBottom:20}}>Início: {(obra&&obra.inicio)} · Cliente: {(obra&&obra.cliente)}</p>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:24}}>
    <KCard label="Valor do Contrato" value={fmtBR(750000)} color="#f59e0b"/>
    <KCard label="Custo Total Previsto" value={fmtBR(tC)} color="#ef4444" sub={pct(tC/750000*100)+" do contrato"}/>
    <KCard label="Lucro Previsto" value={fmtBR(750000-tC)} color="#10b981" sub={pct((750000-tC)/750000*100)+" de margem"}/>
    <KCard label="Total Recebido" value={fmtBR(tR)} color="#3b82f6" sub={"Devedor: "+fmtBR(750000-tR)}/>
    <KCard label="Total Pago Custos" value={fmtBR(tP)} color="#8b5cf6" sub={pct(tC>0?tP/tC*100:0)+" do custo"}/>
   </div>
   
   <div style={{background:"#fff",borderRadius:12,padding:20,marginBottom:20,boxShadow:"0 1px 4px #0001",border:"1px solid #e2e8f0"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
     <div><div style={{fontWeight:800,fontSize:16,color:"#1e293b"}}>Conclusão Total da Obra</div><div style={{fontSize:12,color:"#64748b"}}>Média ponderada por dias de atividade ({TOTAL_DIAS_OBRA} dias totais)</div></div>
     <div style={{fontSize:36,fontWeight:800,color:"#f59e0b"}}>{pct(conclusao)}</div>
    </div>
    <div style={{background:"#f1f5f9",borderRadius:99,height:14,overflow:"hidden"}}>
     <div style={{width:`${Math.min(conclusao,100)}%`,height:"100%",background:"linear-gradient(90deg,#f8c400,#f59e0b)",borderRadius:99,transition:"width .4s"}}/>
    </div>
   </div>
   
   <div style={{background:"#fff",borderRadius:12,padding:20,marginBottom:20,boxShadow:"0 1px 4px #0001",border:"1px solid #e2e8f0"}}>
    <div style={{fontWeight:800,fontSize:14,marginBottom:2}}>Avanço por Etapa</div>
    <div style={{fontSize:11,color:"#64748b",marginBottom:16}}>Toque em uma etapa para ver as subdivisões</div>
    {!drillPav?(
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:16}}>
      {pavs.map(pav=>(
       <div key={pav} onClick={()=>setDrillPav(pav)} style={{cursor:"pointer"}}>
        <Donut pct={pavPct(pav)} color={COLORS[pav]} label={pav}/>
       </div>
      ))}
     </div>
    ):(
     <div>
      <button onClick={()=>setDrillPav(null)} style={{background:"#f1f5f9",border:"none",fontSize:12,padding:"5px 12px",borderRadius:8,cursor:"pointer",color:"#64748b",marginBottom:16}}>← Voltar para etapas</button>
      <div style={{fontWeight:700,fontSize:14,color:COLORS[drillPav],marginBottom:12}}>{drillPav} — Subdivisões</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:16}}>
       {drillSecs.map(({sec,pct:sp})=>(
        <Donut key={sec} pct={sp} size={100} color={COLORS[drillPav]} label={sec}/>
       ))}
      </div>
     </div>
    )}
   </div>
   
   <div style={{background:"#fff",borderRadius:12,padding:20,boxShadow:"0 1px 4px #0001",border:"1px solid #e2e8f0"}}>
    <div style={{fontWeight:800,fontSize:14,marginBottom:16}}>Distribuição de Custos por Etapa</div>
    {pavCosts.map((d,i)=>{
     const maxV=Math.max(...pavCosts.map(x=>x.value));
     return(
      <div key={d.label} style={{marginBottom:12}}>
       <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
        <span style={{color:"#475569"}}>{d.label}</span>
        <span style={{fontWeight:700,color:"#1e293b"}}>{fmtBR(d.value)}</span>
       </div>
       <div style={{background:"#f1f5f9",borderRadius:99,height:10}}>
        <div style={{width:`${maxV>0?d.value/maxV*100:0}%`,height:"100%",background:CCOLORS[i%CCOLORS.length],borderRadius:99}}/>
       </div>
      </div>
     );
    })}
   </div>
  </div>
 );
}
// ── Orçamento detalhado (fiel ao PDF enviado ao cliente) ──
const ORC={
 "Administrativo":{"Serviços Preliminares":[
  {cod:"98524",desc:"Limpeza manual de vegetação em terreno com enxada. AF_03/2024",und:"m2",qtd:169.08,unit:7,total:1183.56},
  {cod:"-",desc:"ART de Obra",und:"Und",qtd:1,unit:290,total:290},
  {cod:"103689",desc:"Fornecimento e instalação de placa de obra com chapa galvanizada e estrutura de madeira. AF_03/2022_PS",und:"m2",qtd:1,unit:800,total:800},
  {cod:"98459",desc:"Tapume com telha metálica (com barracão de obra). AF_03/2024",und:"m2",qtd:168,unit:99.64,total:16739.52},
  {cod:"-",desc:"Aluguel de Andaime",und:"mês",qtd:6,unit:350,total:2100},
  {cod:"-",desc:"Alvará de Obra (com impressões e documentações)",und:"Und",qtd:1,unit:2000,total:2000},
 ]},
 "Térreo":{
  "Serviços Preliminares":[
   {cod:"96526",desc:"Escavação manual para viga baldrame ou sapata corrida. AF_01/2024",und:"m3",qtd:7.95,unit:300,total:2385},
  ],
  "Estrutura":[
   {cod:"101176",desc:"Estaca broca de concreto, Ø30cm, escavação manual com trado concha, inteiramente armada. AF_01/2024",und:"m",qtd:76,unit:300,total:22800},
   {cod:"96616",desc:"Lastro de concreto magro em blocos de coroamento ou sapatas. AF_01/2024",und:"m3",qtd:0.28,unit:4000,total:1120},
   {cod:"96557",desc:"Concretagem de bloco de coroamento, FCK 30 MPa, com bomba, armadura e forma. AF_01/2024",und:"m3",qtd:4.2,unit:2500,total:10500},
   {cod:"96557",desc:"Concretagem de viga baldrame, FCK 30 MPa, com bomba, armadura e forma. AF_01/2024",und:"m3",qtd:3.75,unit:2500,total:9375},
   {cod:"-",desc:"Muro de Alvenaria com Pilares",und:"m2",qtd:96,unit:150,total:14400},
  ],
  "Parede":[
   {cod:"103331",desc:"Alvenaria de vedação de blocos cerâmicos furados 11,5x19x19cm, argamassa manual. AF_12/2021",und:"m2",qtd:220.35,unit:95,total:20933.25},
   {cod:"87777",desc:"Emboço ou massa única em argamassa traço 1:2:8, preparo manual, espessura 25mm. AF_08/2022",und:"m2",qtd:440.7,unit:60,total:26442},
  ],
  "Piso":[
   {cod:"94342",desc:"Aterro manual de valas com areia. AF_08/2023",und:"m3",qtd:13.82,unit:115,total:1589.30},
   {cod:"97083",desc:"Compactação mecânica de solo para execução de radier/piso. AF_09/2021",und:"m2",qtd:138.2,unit:5,total:691},
   {cod:"87373",desc:"Argamassa traço 1:4 para contrapiso, 8cm, preparo manual (com malha pop 15x15 4.2mm). AF_08/2023",und:"m3",qtd:11.05,unit:900,total:9945},
   {cod:"104597",desc:"Revestimento cerâmico porcelanato 90x90cm, ambientes 5-10m². AF_02/2023_PE",und:"m2",qtd:94.75,unit:240,total:22740},
   {cod:"-",desc:"Rodapé do mesmo porcelanato",und:"m",qtd:74,unit:50,total:3700},
  ],
  "Impermeabilização":[
   {cod:"98557",desc:"Impermeabilização com emulsão asfáltica, 2 demãos (blocos de coroamento e vigas baldrame). AF_09/2023",und:"m2",qtd:20.25,unit:50,total:1012.50},
  ],
  "Inst. Hidrossanitárias":[
   {cod:"-",desc:"Caixa D'Água 1000L com ligação externa",und:"Und",qtd:1,unit:1000,total:1000},
   {cod:"-",desc:"Fossa Séptica",und:"Und",qtd:1,unit:500,total:500},
   {cod:"98111",desc:"Caixa de inspeção circular em polietileno, Ø30cm",und:"Und",qtd:3,unit:110,total:330},
   {cod:"98102",desc:"Caixa de gordura simples, circular, em concreto pré-moldado, Ø40cm",und:"Und",qtd:1,unit:450,total:450},
   {cod:"104665",desc:"Conjunto de pontos hidráulicos de água fria para banheiro em PVC. AF_05/2023",und:"Ponto",qtd:12,unit:500,total:6000},
   {cod:"104677",desc:"Conjunto de pontos de coleta de esgoto para banheiro em PVC série normal. AF_05/2023",und:"Ponto",qtd:12,unit:600,total:7200},
   {cod:"-",desc:"Ponto de dreno",und:"Ponto",qtd:3,unit:180,total:540},
  ],
  "Inst. Elétricas":[
   {cod:"104475",desc:"Ponto elétrico de tomada de uso geral 2P+T 10A/250V, eletroduto embutido. AF_11/2022",und:"Ponto",qtd:20,unit:200,total:4000},
   {cod:"104476",desc:"Ponto elétrico de tomada específico — Ar Condicionado. AF_11/2022",und:"Ponto",qtd:3,unit:210,total:630},
   {cod:"104473",desc:"Ponto elétrico de iluminação com interruptor simples. AF_11/2022",und:"Ponto",qtd:13,unit:190,total:2470},
   {cod:"96985",desc:'Haste de aterramento, Ø5/8", com 3m',und:"Und",qtd:1,unit:104.33,total:104.33},
   {cod:"-",desc:"QGBT Geral com ligação externa",und:"Und",qtd:1,unit:4000,total:4000},
  ],
  "Revestimento":[
   {cod:"104597",desc:"Revestimento cerâmico porcelanato 90x90cm — Banheiros. AF_02/2023_PE",und:"m2",qtd:116.1,unit:240,total:27864},
  ],
  "Iluminação":[
   {cod:"-",desc:"Luminária Quadrada Branca 24W",und:"Und",qtd:13,unit:85,total:1105},
   {cod:"-",desc:"Lustre",und:"Und",qtd:1,unit:500,total:500},
   {cod:"-",desc:"Arandela",und:"Und",qtd:1,unit:300,total:300},
  ],
  "Forro":[
   {cod:"96113",desc:"Forro em placas de gesso, ambientes comerciais. AF_08/2023_PS",und:"m2",qtd:87.61,unit:120,total:10513.20},
   {cod:"-",desc:"Forro vinílico tipo amadeirado",und:"m2",qtd:7.14,unit:320,total:2284.80},
  ],
  "Esquadrias":[
   {cod:"-",desc:"Porta 1,50x2,50m em ACM preto fosco com puxador de 1m",und:"m2",qtd:3.75,unit:1500,total:5625},
   {cod:"-",desc:"Porta MDF 0,70x2,10m Branco",und:"Und",qtd:3,unit:1000,total:3000},
   {cod:"-",desc:"Porta MDF 0,90x2,10m Branco",und:"Und",qtd:1,unit:1200,total:1200},
   {cod:"-",desc:"Porta de correr, 2 folhas, vidro incolor, 2,00x2,10m",und:"Und",qtd:1,unit:3570,total:3570},
   {cod:"-",desc:"Porta de correr, 4 folhas, vidro incolor, 3,00x2,10m",und:"Und",qtd:1,unit:5355,total:5355},
   {cod:"-",desc:"Janela 1,30x1,10m, 2 folhas, vidro incolor",und:"Und",qtd:2,unit:1215.50,total:2431},
   {cod:"-",desc:"Janela 1,80x2,80m, basculante, vidro incolor",und:"Und",qtd:2,unit:7560,total:15120},
   {cod:"-",desc:"Balancim 0,60x0,60m, basculante, vidro incolor",und:"Und",qtd:2,unit:324,total:648},
  ],
  "Pintura":[
   {cod:"88497",desc:"Emassamento com massa látex em parede, duas demãos, lixamento manual. AF_04/2023",und:"m2",qtd:308,unit:25,total:7700},
   {cod:"88489",desc:"Pintura látex acrílica premium em paredes, duas demãos. AF_04/2023",und:"m2",qtd:308,unit:35,total:10780},
   {cod:"88496",desc:"Emassamento com massa látex em teto, duas demãos, lixamento manual. AF_04/2023",und:"m2",qtd:87.61,unit:25,total:2190.25},
   {cod:"88488",desc:"Pintura látex acrílica premium em teto, duas demãos. AF_04/2023",und:"m2",qtd:87.61,unit:35,total:3066.35},
  ],
  "Marmoraria":[
   {cod:"-",desc:"Soleira em mármore Ubatuba Verde",und:"m2",qtd:1.42,unit:800,total:1136},
   {cod:"-",desc:"Peitoril em mármore Ubatuba Verde",und:"m2",qtd:1.11,unit:800,total:888},
   {cod:"-",desc:"Bancada em mármore Ubatuba Verde",und:"m2",qtd:6,unit:800,total:4800},
  ],
  "Louças":[
   {cod:"-",desc:"Bacia sanitária completa padrão médio",und:"Und",qtd:3,unit:1800,total:5400},
   {cod:"-",desc:"Tanque padrão médio",und:"Und",qtd:2,unit:400,total:800},
   {cod:"-",desc:"Cuba cozinha padrão médio",und:"Und",qtd:2,unit:500,total:1000},
   {cod:"-",desc:"Cuba banheiro padrão médio",und:"Und",qtd:3,unit:500,total:1500},
   {cod:"-",desc:"Torneira cozinha padrão médio",und:"Und",qtd:2,unit:300,total:600},
   {cod:"-",desc:"Torneira banheiro padrão médio",und:"Und",qtd:3,unit:300,total:900},
   {cod:"-",desc:"Chuveiro banheiro padrão médio",und:"Und",qtd:1,unit:300,total:300},
   {cod:"-",desc:"Chuveiro externo padrão médio",und:"Und",qtd:1,unit:300,total:300},
   {cod:"-",desc:"Sifão universal",und:"Und",qtd:5,unit:70,total:350},
   {cod:"-",desc:"Engate universal",und:"Und",qtd:5,unit:20,total:100},
  ],
 },
 "1º Pavimento":{
  "Estrutura":[
   {cod:"103672",desc:"Concretagem de pilares, FCK=25MPa, com bomba, forma e armadura. AF_02/2022_PS",und:"m3",qtd:2.57,unit:2800,total:7196},
   {cod:"103683",desc:"Concretagem de vigas, FCK=25MPa, com forma e armadura. AF_02/2022",und:"m3",qtd:3.75,unit:2800,total:10500},
   {cod:"103683",desc:"Concretagem de lajes, FCK=25MPa, com forma e armadura. AF_02/2022",und:"m3",qtd:11,unit:1200,total:13200},
   {cod:"101949",desc:"Laje pré-moldada unidirecional, enchimento em cerâmica/EPS, vigota treliçada. AF_11/2020",und:"m2",qtd:125.25,unit:150,total:18787.50},
   {cod:"102078",desc:"Escada em concreto armado moldado in loco, FCK 25MPa, 2 lances em U e laje cascata. AF_11/2020",und:"m3",qtd:1.75,unit:5805.63,total:10159.85},
  ],
  "Parede":[
   {cod:"103331",desc:"Alvenaria de vedação de blocos cerâmicos furados 11,5x19x19cm. AF_12/2021",und:"m2",qtd:259.14,unit:95,total:24618.30},
   {cod:"87777",desc:"Emboço ou massa única em argamassa traço 1:2:8, preparo manual, espessura 25mm. AF_08/2022",und:"m2",qtd:518.28,unit:45,total:23322.60},
  ],
  "Piso":[
   {cod:"87373",desc:"Argamassa traço 1:4 para contrapiso, preparo manual 3cm. AF_08/2023",und:"m3",qtd:3.75,unit:845.55,total:3170.81},
   {cod:"104597",desc:"Revestimento cerâmico porcelanato 90x90cm. AF_02/2023_PE",und:"m2",qtd:81.22,unit:240,total:19492.80},
  ],
  "Inst. Hidrossanitárias":[
   {cod:"104665",desc:"Pontos hidráulicos de água fria em PVC. AF_05/2023",und:"Ponto",qtd:9,unit:500,total:4500},
   {cod:"104677",desc:"Pontos de coleta de esgoto em PVC série normal. AF_05/2023",und:"Ponto",qtd:9,unit:600,total:5400},
   {cod:"-",desc:"Ponto de dreno",und:"Ponto",qtd:3,unit:180,total:540},
  ],
  "Inst. Elétricas":[
   {cod:"104475",desc:"Ponto elétrico de tomada de uso geral 2P+T 10A/250V. AF_11/2022",und:"Ponto",qtd:17,unit:180,total:3060},
   {cod:"104476",desc:"Ponto elétrico tomada específico — Ar Condicionado. AF_11/2022",und:"Ponto",qtd:3,unit:190,total:570},
   {cod:"104473",desc:"Ponto elétrico de iluminação com interruptor simples. AF_11/2022",und:"Ponto",qtd:13,unit:170,total:2210},
  ],
  "Revestimento":[
   {cod:"104597",desc:"Revestimento cerâmico porcelanato 90x90cm — Banheiros. AF_02/2023_PE",und:"m2",qtd:76.14,unit:240,total:18273.60},
  ],
  "Iluminação":[{cod:"-",desc:"Luminária Quadrada Branca 24W",und:"Und",qtd:13,unit:85,total:1105}],
  "Forro":[{cod:"96113",desc:"Forro em placas de gesso, ambientes comerciais. AF_08/2023_PS",und:"m2",qtd:81.22,unit:120,total:9746.40}],
  "Esquadrias":[
   {cod:"-",desc:"Porta MDF 0,90x2,10m Branco",und:"Und",qtd:6,unit:1200,total:7200},
   {cod:"-",desc:"Porta de correr, 4 folhas, vidro incolor, 3,00x2,10m",und:"Und",qtd:1,unit:5355,total:5355},
   {cod:"-",desc:"Janela 1,40x1,10m, 2 folhas, vidro incolor",und:"Und",qtd:2,unit:1309,total:2618},
   {cod:"-",desc:"Janela 1,30x1,10m, 2 folhas, vidro incolor",und:"Und",qtd:1,unit:1215.50,total:1215.50},
   {cod:"-",desc:"Janela 1,80x2,80m, basculante, vidro incolor",und:"Und",qtd:1,unit:7560,total:7560},
   {cod:"-",desc:"Balancim 0,60x0,60m, basculante, vidro incolor",und:"Und",qtd:3,unit:324,total:972},
   {cod:"-",desc:"Guarda-corpo panorâmico de vidro",und:"m",qtd:3.05,unit:935,total:2851.75},
  ],
  "Pintura":[
   {cod:"88497",desc:"Emassamento com massa látex em parede, duas demãos. AF_04/2023",und:"m2",qtd:183,unit:25,total:4575},
   {cod:"88489",desc:"Pintura látex acrílica premium em paredes, duas demãos. AF_04/2023",und:"m2",qtd:183,unit:35,total:6405},
   {cod:"88496",desc:"Emassamento com massa látex em teto, duas demãos. AF_04/2023",und:"m2",qtd:81.22,unit:25,total:2030.50},
   {cod:"88488",desc:"Pintura látex acrílica premium em teto, duas demãos. AF_04/2023",und:"m2",qtd:81.22,unit:35,total:2842.70},
  ],
  "Marmoraria":[
   {cod:"-",desc:"Soleira em mármore Ubatuba Verde",und:"m2",qtd:1.26,unit:800,total:1008},
   {cod:"-",desc:"Peitoril em mármore Ubatuba Verde",und:"m2",qtd:1.34,unit:800,total:1072},
   {cod:"-",desc:"Bancada em mármore Ubatuba Verde",und:"m2",qtd:2.16,unit:800,total:1728},
  ],
  "Louças":[
   {cod:"-",desc:"Bacia sanitária padrão médio",und:"Und",qtd:3,unit:1500,total:4500},
   {cod:"-",desc:"Cuba banheiro padrão médio",und:"Und",qtd:3,unit:500,total:1500},
   {cod:"-",desc:"Torneira banheiro padrão médio",und:"Und",qtd:3,unit:300,total:900},
   {cod:"-",desc:"Chuveiro banheiro padrão médio",und:"Und",qtd:3,unit:300,total:900},
   {cod:"-",desc:"Sifão universal",und:"Und",qtd:3,unit:70,total:210},
   {cod:"-",desc:"Engate universal",und:"Und",qtd:3,unit:20,total:60},
  ],
  "Impermeabilização":[
   {cod:"-",desc:"Impermeabilização com manta asfáltica de poliéster",und:"m2",qtd:12.52,unit:200,total:2504},
  ],
 },
 "Cobertura":{
  "Estrutura":[
   {cod:"103672",desc:"Concretagem de pilares, FCK=25MPa, com forma e armadura. AF_02/2022_PS",und:"m3",qtd:2.57,unit:2800,total:7196},
   {cod:"103683",desc:"Concretagem de vigas, FCK=25MPa, com forma e armadura. AF_02/2022",und:"m3",qtd:3.75,unit:2800,total:10500},
   {cod:"103683",desc:"Concretagem de laje, FCK=25MPa, com forma e armadura. AF_02/2022",und:"m3",qtd:10.5,unit:1200,total:12600},
   {cod:"101949",desc:"Laje pré-moldada unidirecional, enchimento em EPS, vigota treliçada. AF_11/2020",und:"m2",qtd:116.52,unit:185,total:21556.20},
   {cod:"-",desc:"Rufo de concreto",und:"m",qtd:46,unit:65,total:2990},
  ],
  "Parede":[
   {cod:"103331",desc:"Alvenaria de vedação de blocos cerâmicos furados 11,5x19x19cm. AF_12/2021",und:"m2",qtd:94.05,unit:95,total:8934.75},
   {cod:"87777",desc:"Emboço ou massa única em argamassa traço 1:2:8, preparo manual. AF_08/2022",und:"m2",qtd:188.1,unit:45,total:8464.50},
  ],
  "Piso":[{cod:"87373",desc:"Argamassa traço 1:4 para contrapiso, preparo manual. AF_08/2023",und:"m3",qtd:3.49,unit:845.55,total:2950.97}],
  "Telhado":[
   {cod:"-",desc:"Telhado completo com madeiramento e telha ecológica",und:"m2",qtd:151.2,unit:300,total:45360},
   {cod:"-",desc:"Calha de zinco",und:"m2",qtd:18,unit:85,total:1530},
  ],
 },
 "Fachada":{
  "Revestimento":[
   {cod:"104597",desc:"Revestimento cerâmico porcelanato 90x90cm. AF_02/2023_PE",und:"m2",qtd:13.2,unit:240,total:3168},
   {cod:"-",desc:"Ripado de PVC",und:"m2",qtd:7.8,unit:250,total:1950},
  ],
  "Pintura":[
   {cod:"88497",desc:"Emassamento com massa látex em parede, duas demãos. AF_04/2023",und:"m2",qtd:288,unit:25,total:7200},
   {cod:"-",desc:"Aplicação de cimento queimado",und:"m2",qtd:288,unit:55,total:15840},
  ],
  "Iluminação":[
   {cod:"-",desc:"Perfil LED 2m",und:"Und",qtd:7,unit:50,total:350},
   {cod:"-",desc:"Fita LED",und:"Und",qtd:7,unit:50,total:350},
   {cod:"-",desc:"Spot 9W embutir redondo",und:"Und",qtd:8,unit:20,total:160},
  ],
 },
};

function Orcamento(){
 const [sel,setSel]=useState("Administrativo");
 const pavs=Object.keys(ORC);
 const pavTot=p=>Object.values(ORC[p]).reduce((s,its)=>s+its.reduce((ss,i)=>ss+i.total,0),0);
 const grandTotal=pavs.reduce((s,p)=>s+pavTot(p),0);
 return(
  <div>
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,flexWrap:"wrap",gap:8}}>
    <div>
     <h2 style={{fontSize:20,fontWeight:800,color:"#f59e0b",margin:0}}>Orçamento Detalhado</h2>
     <p style={{fontSize:12,color:"#94a3b8",margin:"4px 0 0"}}>Proposta 060/2025 · SINAPI 11/2023 · BDI 12%</p>
    </div>
    <div style={{fontSize:20,fontWeight:800,color:"#f59e0b"}}>{fmtBR(750000)}</div>
   </div>
   <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>
    {pavs.map(p=><button key={p} onClick={()=>setSel(p)} style={{background:sel===p?"#f8c400":"#fff",color:sel===p?"#0f172a":"#64748b",border:"1px solid #e2e8f0",borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
     {p} <span style={{opacity:.7,fontWeight:400}}>({fmtBR(pavTot(p))})</span>
    </button>)}
   </div>
   {Object.entries(ORC[sel]).map(([sec,items])=>{
    const tot=items.reduce((s,i)=>s+i.total,0);
    return(
     <div key={sec} style={{marginBottom:16}}>
      <div style={{background:"#1e40af",color:"#fff",fontWeight:700,fontSize:13,padding:"8px 14px",borderRadius:"8px 8px 0 0",display:"flex",justifyContent:"space-between"}}>
       <span>{sec}</span><span>{fmtBR(tot)}</span>
      </div>
      <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:"0 0 8px 8px",overflow:"hidden"}}>
       {items.map((it,i)=>(
        <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderBottom:i<items.length-1?"1px solid #f1f5f9":"none"}}>
         <div style={{flex:1,minWidth:0,paddingRight:12}}>
          <div style={{fontSize:12,color:"#1e293b",lineHeight:1.35}}>{it.desc}</div>
          <div style={{fontSize:10,color:"#94a3b8",marginTop:3}}>{it.cod!=="-"&&`SINAPI ${it.cod} · `}{it.qtd} {it.und} × {fmtBR(it.unit)}</div>
         </div>
         <div style={{fontWeight:700,color:"#f59e0b",fontSize:13,whiteSpace:"nowrap"}}>{fmtBR(it.total)}</div>
        </div>
       ))}
      </div>
     </div>
    );
   })}
  </div>
 );
}
function Custos({C,sv}){
 const [flt,setFlt]=useState("Todos");
 const [modal,setModal]=useState(false);
 const [idx,setIdx]=useState(null);
 const [form,setForm]=useState({});
 const pavList=["Todos"];
 C.forEach(c=>{if(pavList.indexOf(c.pav)<0)pavList.push(c.pav);});
 const shown=flt==="Todos"?C:C.filter(c=>c.pav===flt);
 const tT=C.reduce((sum,c)=>sum+(c.total||0),0);
 const tP=C.reduce((sum,c)=>sum+(c.pago||0),0);
 const grouped={};
 shown.forEach(c=>{
  const k1=c.pav||"Outros";
  const k2=c.cat||"Geral";
  if(!grouped[k1])grouped[k1]={};
  if(!grouped[k1][k2])grouped[k1][k2]=[];
  grouped[k1][k2].push(c);
 });
 const oe=(c)=>{setIdx(C.indexOf(c));setForm({...c});setModal(true);};
 const oNew=()=>{setIdx(null);setForm({pav:flt==="Todos"?"Térreo":flt,cat:"",desc:"",und:"vb",qtd:1,unit:0,pago:0,status:"pendente",forn:""});setModal(true);};
 const save=()=>{
  const t=Number(form.qtd)*Number(form.unit);
  const item={...form,qtd:Number(form.qtd),unit:Number(form.unit),total:t,pago:Number(form.pago||0)};
  const n=[...C];
  if(idx===null)n.push(item);else n[idx]=item;
  sv(n);setModal(false);
 };
 const delItem=()=>{
  if(idx===null){setModal(false);return;}
  const n=[...C];n.splice(idx,1);sv(n);setModal(false);
 };
 return(
  <div>
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12,flexWrap:"wrap",gap:8}}>
    <div>
     <h2 style={{fontSize:20,fontWeight:800,color:"#f59e0b",margin:0}}>Custos da Obra</h2>
     <p style={{fontSize:12,color:"#94a3b8",margin:"4px 0 0"}}>Pago {fmtBR(tP)} de {fmtBR(tT)} previsto ({pct(tT>0?tP/tT*100:0)})</p>
    </div>
    <button onClick={oNew} style={{...BP,padding:"6px 12px"}}>+ Custo Extra</button>
   </div>
   <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
    {pavList.map(p=><button key={p} onClick={()=>setFlt(p)} style={{background:flt===p?"#f8c400":"#fff",color:flt===p?"#0f172a":"#64748b",border:"1px solid #e2e8f0",borderRadius:20,padding:"5px 12px",fontSize:11,fontWeight:600,cursor:"pointer"}}>{p}</button>)}
   </div>
   {Object.keys(grouped).map(pav=>{
    const cats=grouped[pav];
    const flatItems=Object.keys(cats).reduce((arr,k)=>arr.concat(cats[k]),[]);
    const pavTot=flatItems.reduce((sum,c)=>sum+(c.total||0),0);
    const pavPago=flatItems.reduce((sum,c)=>sum+(c.pago||0),0);
    return(
     <div key={pav} style={{marginBottom:18}}>
      <div style={{background:"#f8c400",color:"#0f172a",fontWeight:800,fontSize:13,padding:"8px 14px",borderRadius:"10px 10px 0 0",display:"flex",justifyContent:"space-between"}}>
       <span>{pav}</span>
       <span>{fmtBR(pavPago)} / {fmtBR(pavTot)}</span>
      </div>
      <div style={{background:"#fff",border:"1px solid #e2e8f0",borderTop:"none",borderRadius:"0 0 10px 10px"}}>
       {Object.keys(cats).map(cat=>{
        const items=cats[cat];
        const catTot=items.reduce((sum,c)=>sum+(c.total||0),0);
        return(
         <div key={cat}>
          <div style={{background:"#dbeafe",color:"#1e40af",fontSize:11,fontWeight:700,padding:"5px 14px",display:"flex",justifyContent:"space-between"}}>
           <span>{cat}</span><span>{fmtBR(catTot)}</span>
          </div>
          {items.map(c=>{
           const p2=c.total>0?(c.pago||0)/c.total*100:0;
           return(
            <div key={C.indexOf(c)} onClick={()=>oe(c)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 14px",borderBottom:"1px solid #f1f5f9",cursor:"pointer"}}>
             <div style={{flex:1,minWidth:0,paddingRight:10}}>
              <div style={{fontSize:12,color:"#1e293b"}}>{c.desc}</div>
              <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{c.qtd} {c.und} × {fmtBR(c.unit)}{c.forn?" · "+c.forn:""}</div>
             </div>
             <div style={{textAlign:"right",whiteSpace:"nowrap"}}>
              <div style={{fontWeight:700,color:"#f59e0b",fontSize:13}}>{fmtBR(c.total)}</div>
              <div style={{fontSize:10,color:p2>=100?"#16a34a":p2>0?"#f59e0b":"#94a3b8"}}>{p2>0?"pago "+pct(p2):"pendente"}</div>
             </div>
            </div>
           );
          })}
         </div>
        );
       })}
      </div>
     </div>
    );
   })}
   {modal&&(
    <Modal onClose={()=>setModal(false)} title={idx===null?"Novo Custo Extra":"Editar Custo"}>
     <div style={{display:"grid",gap:10}}>
      <label style={{fontSize:12,color:"#64748b"}}>Pavimento
       <input value={form.pav||""} onChange={e=>setForm({...form,pav:e.target.value})} style={IS}/>
      </label>
      <label style={{fontSize:12,color:"#64748b"}}>Categoria
       <input value={form.cat||""} onChange={e=>setForm({...form,cat:e.target.value})} style={IS}/>
      </label>
      <label style={{fontSize:12,color:"#64748b"}}>Descrição
       <input value={form.desc||""} onChange={e=>setForm({...form,desc:e.target.value})} style={IS}/>
      </label>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
       <label style={{fontSize:12,color:"#64748b"}}>Qtd<input type="number" value={form.qtd||0} onChange={e=>setForm({...form,qtd:e.target.value})} style={IS}/></label>
       <label style={{fontSize:12,color:"#64748b"}}>Unid.<input value={form.und||""} onChange={e=>setForm({...form,und:e.target.value})} style={IS}/></label>
       <label style={{fontSize:12,color:"#64748b"}}>Unit (R$)<input type="number" value={form.unit||0} onChange={e=>setForm({...form,unit:e.target.value})} style={IS}/></label>
      </div>
      <label style={{fontSize:12,color:"#64748b"}}>Total Pago (R$)
       <input type="number" value={form.pago||0} onChange={e=>{const pg=Number(e.target.value);const t=Number(form.qtd)*Number(form.unit);setForm({...form,pago:pg,status:pg<=0?"pendente":pg>=t?"pago":"pago_parcial"});}} style={IS}/>
      </label>
      <label style={{fontSize:12,color:"#64748b"}}>Fornecedor<input value={form.forn||""} onChange={e=>setForm({...form,forn:e.target.value})} style={IS}/></label>
      <div style={{fontSize:13,color:"#f59e0b",fontWeight:700}}>Previsto: {fmtBR(Number(form.qtd)*Number(form.unit))} · Pago: {fmtBR(form.pago||0)}</div>
     </div>
     <div style={{display:"flex",gap:10,marginTop:20}}>
      <button onClick={save} style={{...BP,flex:1}}>Salvar</button>
      {idx!==null&&<button onClick={delItem} style={{...BS,background:"#fee2e2",color:"#ef4444"}}>Excluir</button>}
      <button onClick={()=>setModal(false)} style={{...BS,flex:1}}>Cancelar</button>
     </div>
    </Modal>
   )}
  </div>
 );
}
function Recebimentos({R,sv}){
 const [modal,setModal]=useState(false);const [idx,setIdx]=useState(null);const [form,setForm]=useState({});
 const tR=R.reduce((s,r)=>s+(r.rec||0),0);
 const oe=i=>{setIdx(i);setForm({...R[i]});setModal(true);};
 const save=()=>{const n=[...R];n[idx]=form;sv(n);setModal(false);};
 return(
 <div>
 <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
 <h2 style={{fontSize:20,fontWeight:800,color:"#f59e0b",margin:0}}>Recebimentos</h2>
 <button onClick={()=>sv([...R,{data:"",prev:0,rec:0,obs:""}])} style={BP}>+ Parcela</button>
 </div>
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:12,marginBottom:20}}>
 <KCard label="Total do Contrato" value={fmtBR(750000)} color="#f8c400"/>
 <KCard label="Total Recebido" value={fmtBR(tR)} color="#4ade80"/>
 <KCard label="Saldo Devedor" value={fmtBR(750000-tR)} color="#f87171"/>
 <KCard label="% Recebido" value={pct(tR/750000*100)} color="#60a5fa"/>
 </div>
 <div style={{background:"#fff",borderRadius:12,overflowX:"auto"}}>
 <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
 <thead><tr style={{background:"#f8fafc"}}>
 {["Mês","Previsto","Recebido neste mês","Saldo","% Rec.","Obs.",""].map(h=><th key={h} style={{padding:"9px 14px",textAlign:"left",color:"#64748b",fontWeight:700,whiteSpace:"nowrap"}}>{h}</th>)}
 </tr></thead>
 <tbody>{R.map((r,i)=>{
 const sl=(r.prev||0)-(r.rec||0);const p=r.prev>0?(r.rec||0)/r.prev*100:0;
 return(
 <tr key={i} style={{borderBottom:"1px solid #0f172a30",background:p>=100?"#16a34a05":"transparent"}}>
 <td style={{padding:"10px 14px",fontWeight:600}}>{r.data||"—"}</td>
 <td style={{padding:"10px 14px",color:"#64748b"}}>{fmtBR(r.prev||0)}</td>
 <td style={{padding:"10px 14px",color:"#10b981",fontWeight:700}}>{fmtBR(r.rec||0)}</td>
 <td style={{padding:"10px 14px",color:sl>0?"#f87171":"#4ade80",fontWeight:700}}>{fmtBR(sl)}</td>
 <td style={{padding:"10px 14px",color:p>=100?"#4ade80":p>0?"#fbbf24":"#64748b",fontWeight:700}}>{pct(p)}</td>
 <td style={{padding:"10px 14px",color:"#64748b",fontSize:11}}>{r.obs}</td>
 <td style={{padding:"10px 14px"}}><button onClick={()=>oe(i)} style={{background:"#f1f5f9",border:"none",color:"#64748b",padding:"3px 10px",borderRadius:6,cursor:"pointer",fontSize:11}}>Editar</button></td>
 </tr>
 );
 })}</tbody>
 </table>
 </div>
 {modal&&(
 <Modal onClose={()=>setModal(false)} title={`Editar — ${form.data||"Nova Parcela"}`}>
 <div style={{display:"grid",gap:12}}>
 <label style={{fontSize:12,color:"#64748b"}}>Mês/Período<input value={form.data||""} onChange={e=>setForm({...form,data:e.target.value})} style={IS}/></label>
 <label style={{fontSize:12,color:"#64748b"}}>Valor Previsto (R$)<input type="number" value={form.prev||0} onChange={e=>setForm({...form,prev:Number(e.target.value)})} style={IS}/></label>
 <label style={{fontSize:12,color:"#64748b"}}>Valor Recebido neste mês (R$)
 <input type="number" value={form.rec||0} onChange={e=>setForm({...form,rec:Number(e.target.value)})} style={IS}/>
 <span style={{fontSize:11,color:"#64748b",display:"block",marginTop:3}}>Pode ser valor quebrado — ex: R$ 15.000 de uma parcela de R$ 30.000</span>
 </label>
 <label style={{fontSize:12,color:"#64748b"}}>Observação<input value={form.obs||""} onChange={e=>setForm({...form,obs:e.target.value})} style={IS}/></label>
 <div style={{fontSize:13,color:"#f59e0b",fontWeight:700}}>Saldo: {fmtBR((form.prev||0)-(form.rec||0))}</div>
 </div>
 <div style={{display:"flex",gap:10,marginTop:20}}>
 <button onClick={save} style={{...BP,flex:1}}>Salvar</button>
 <button onClick={()=>setModal(false)} style={{...BS,flex:1}}>Cancelar</button>
 </div>
 </Modal>
 )}
 </div>
 );
}
function Medicoes({A,sv,obra,user,svM,msgs}){
 const [sel,setSel]=useState("Fundação");
 const [modal,setModal]=useState(false);
 const [editMed,setEditMed]=useState(null); // {ativIdx, medIdx}
 const [repSem,setRepSem]=useState(null);
 const [editTotal,setEditTotal]=useState(null); // ativIdx to edit total
 const [editTotalUnd,setEditTotalUnd]=useState("");
 const [editTotalVal,setEditTotalVal]=useState("");
 const [semData,setSemData]=useState({});
 const [semObs,setSemObs]=useState("");
 const [editQtd,setEditQtd]=useState("");
 const pavs=[...new Set(A.map(a=>a.pav))];

 // Começa na semana 3 (2 semanas já feitas no histórico). Próxima = max registrada + 1, mínimo 3
 const lastSem=A.reduce((mx,a)=>Math.max(mx,(a.meds||[]).reduce((m,med)=>Math.max(m,med.sem||0),0)),0);
 const nextSem=Math.max(lastSem+1,3);
 const nextSemLabel=semLabel(nextSem);

 const getPvtPct=pav=>{
  const its=A.filter(a=>a.pav===pav);
  const totalD=its.reduce((s,a)=>s+(a.prazo||0),0);
  const concD=its.reduce((s,a)=>s+(a.total>0?(a.acum/a.total)*a.prazo:0),0);
  return totalD>0?concD/totalD*100:0;
 };
 const items=A.filter(a=>a.pav===sel);
 // Atividades disponíveis para medir (não 100%) do pavimento selecionado, agrupadas por categoria
 const pendingByCat={};
 A.forEach((a,gi)=>{
  const p=a.total>0?(a.acum/a.total)*100:0;
  if(p>=100)return; // elimina concluídas
  const k=`${a.pav} › ${a.sec}`;
  if(!pendingByCat[k])pendingByCat[k]=[];
  pendingByCat[k].push({...a,gi});
 });

 // Semanas que já têm medições registradas (para relatório)
 const semanasMedidas=[...new Set(A.flatMap(a=>(a.meds||[]).map(m=>m.sem)))].sort((x,y)=>x-y);
 const secPct=(pav,sec)=>{
  const its=A.filter(a=>a.pav===pav&&a.sec===sec);
  const totalD=its.reduce((s,a)=>s+(a.prazo||0),0);
  const concD=its.reduce((s,a)=>s+(a.total>0?(a.acum/a.total)*a.prazo:0),0);
  return totalD>0?concD/totalD*100:0;
 };
 const getRepData=(sem)=>{
  const itensSemana=[];
  A.forEach(a=>{(a.meds||[]).forEach(m=>{if(m.sem===sem)itensSemana.push({ativ:a.ativ,pav:a.pav,sec:a.sec,und:a.und,qtd:m.qtd,acum:a.acum,total:a.total,obs:m.obs,data:m.data,autor:m.autor||""});});});
  const concGeral=calcConclusaoGeral?calcConclusaoGeral(A):0;
  const porPav=pavs.map(p=>{
   const secs=[...new Set(A.filter(a=>a.pav===p).map(a=>a.sec))].map(sec=>({sec,pct:secPct(p,sec)}));
   return{pav:p,pct:getPvtPct(p),secs};
  });
  const label=semLabel(sem);
  const datas=itensSemana.map(i=>i.data).filter(Boolean).sort();
  const autores=[...new Set(itensSemana.map(i=>i.autor).filter(Boolean))];
  return{itensSemana,concGeral,porPav,label,sem,datas,autores};
 };

 const gerarPDF=(Rd,compet)=>{
  const el=document.getElementById("relatorio-cliente");
  if(!el){alert("Relatório não encontrado.");return;}
  const fileName=`Relatorio_${(Rd.label||"medicao").replace(/[^a-zA-Z0-9]/g,"_")}_${obra?obra.nome.replace(/[^a-zA-Z0-9]/g,"_"):"obra"}.pdf`;
  const run=()=>{
   if(!window.html2pdf){alert("Não foi possível carregar o gerador de PDF. Verifique sua conexão.");return;}
   const opt={margin:[8,8,8,8],filename:fileName,image:{type:"jpeg",quality:0.98},html2canvas:{scale:2,useCORS:true,backgroundColor:"#ffffff"},jsPDF:{unit:"mm",format:"a4",orientation:"portrait"},pagebreak:{mode:["css","legacy"]}};
   window.html2pdf().set(opt).from(el).save();
  };
  if(window.html2pdf){run();return;}
  const sc=document.createElement("script");
  sc.src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
  sc.onload=run;
  sc.onerror=()=>alert("Não foi possível carregar o gerador de PDF. Verifique sua conexão com a internet.");
  document.body.appendChild(sc);
 };

 const saveEditTotal=()=>{
  if(editTotal===null)return;
  const n=[...A];n[editTotal]={...n[editTotal],total:Number(editTotalVal)||n[editTotal].total,und:editTotalUnd||n[editTotal].und};
  sv(n);setEditTotal(null);
 };
 const isEng=user&&user.role==="eng";
 const saveSem=()=>{
  const n=[...A];
  const itensMed=[];
  Object.entries(semData).forEach(([gi,qtd])=>{
   if(!qtd||Number(qtd)===0)return;
   const it={...n[Number(gi)]};const q=Number(qtd);
   const medEntry={sem:nextSem,label:nextSemLabel,qtd:q,obs:semObs,data:new Date().toLocaleDateString("pt-BR"),autor:user?user.nome:"",pendente:isEng};
   if(!isEng){
    it.acum=Math.min(it.acum+q,it.total);
    it.meds=[...(it.meds||[]),medEntry];
   } else {
    it.medsPendentes=[...(it.medsPendentes||[]),medEntry];
   }
   itensMed.push({ativ:it.ativ,qtd:q,und:it.und});
   n[Number(gi)]=it;
  });
  sv(n);
  if(isEng&&itensMed.length>0&&svM){
   const resumo=itensMed.map(i=>"• "+i.ativ+": +"+i.qtd+" "+i.und).join("\n");
   const notif={id:Date.now(),de:user.nome,role:"eng",tipo:"medicao_pendente",texto:"📋 Medição "+nextSemLabel+" aguardando sua aprovação:\n"+resumo,data:new Date().toLocaleString("pt-BR"),lida:false};
   svM([...(msgs||[]),notif]);
  }
  setModal(false);setSemData({});setSemObs("");
 };
 const aprovarMed=(ai,mi)=>{
  const n=[...A];const it={...n[ai]};
  const pend=[...(it.medsPendentes||[])];
  const m=pend.splice(mi,1)[0];
  it.acum=Math.min(it.acum+m.qtd,it.total);
  it.meds=[...(it.meds||[]),{...m,pendente:false}];
  it.medsPendentes=pend;
  n[ai]=it;sv(n);
  if(svM){
   const notif={id:Date.now(),de:"Hugo Puty",role:"admin",tipo:"aprovacao",texto:"✅ Medição "+m.label+" aprovada: "+it.ativ+" +"+m.qtd+" "+it.und,data:new Date().toLocaleString("pt-BR"),lida:false};
   svM([...(msgs||[]),notif]);
  }
 };
 const rejeitarMed=(ai,mi)=>{
  const n=[...A];const it={...n[ai]};
  const pend=[...(it.medsPendentes||[])];
  const m=pend.splice(mi,1)[0];
  it.medsPendentes=pend;
  n[ai]=it;sv(n);
  if(svM){
   const notif={id:Date.now(),de:"Hugo Puty",role:"admin",tipo:"rejeicao",texto:"❌ Medição "+m.label+" rejeitada: "+it.ativ+" +"+m.qtd+" "+it.und+". Por favor, revise.",data:new Date().toLocaleString("pt-BR"),lida:false};
   svM([...(msgs||[]),notif]);
  }
 };
 const totalPendentes=A.reduce((s,a)=>(s+(a.medsPendentes||[]).length),0);
 const saveEditMed=()=>{
  const{ativIdx,medIdx}=editMed;
  const n=[...A];const it={...n[ativIdx]};
  const meds=[...it.meds];
  const oldQtd=meds[medIdx].qtd;
  const newQtd=Number(editQtd)||0;
  meds[medIdx]={...meds[medIdx],qtd:newQtd};
  it.meds=meds;
  it.acum=Math.min(Math.max(it.acum-oldQtd+newQtd,0),it.total);
  n[ativIdx]=it;sv(n);setEditMed(null);
 };
 const delMed=()=>{
  const{ativIdx,medIdx}=editMed;
  const n=[...A];const it={...n[ativIdx]};
  const meds=[...it.meds];
  const oldQtd=meds[medIdx].qtd;
  meds.splice(medIdx,1);
  it.meds=meds;
  it.acum=Math.max(it.acum-oldQtd,0);
  n[ativIdx]=it;sv(n);setEditMed(null);
 };

 return(
  <div>
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
    <h2 style={{fontSize:20,fontWeight:800,color:"#f59e0b",margin:0}}>Medições Semanais</h2>
    <button onClick={()=>{setSemData({});setSemObs("");setModal(true);}} style={BP}>+ Medição {nextSemLabel}</button>
   </div>
   <div style={{fontSize:12,color:"#64748b",marginBottom:12}}>Próxima semana: <b style={{color:"#f59e0b"}}>{nextSemLabel}</b> (semana {nextSem})</div>
   {!isEng&&totalPendentes>0&&(
    <div style={{background:"#fef3c7",border:"2px solid #f8c400",borderRadius:12,padding:14,marginBottom:16}}>
     <div style={{fontSize:14,fontWeight:800,color:"#92400e",marginBottom:10}}>⏳ {totalPendentes} medição(ões) aguardando sua aprovação:</div>
     {A.map((a,ai)=>(a.medsPendentes||[]).map((m,mi)=>(
      <div key={ai+"-"+mi} style={{background:"#fff",border:"1px solid #fde68a",borderRadius:8,padding:"10px 12px",marginBottom:8}}>
       <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
        <div style={{flex:1}}>
         <div style={{fontSize:12,fontWeight:700,color:"#1e293b"}}>{a.ativ}</div>
         <div style={{fontSize:11,color:"#64748b"}}>{m.label} · +{m.qtd} {a.und} · por {m.autor||"Engenheira"} em {m.data}</div>
         {m.obs&&<div style={{fontSize:11,color:"#94a3b8",fontStyle:"italic"}}>Obs: {m.obs}</div>}
        </div>
        <div style={{display:"flex",gap:6,flexShrink:0}}>
         <button onClick={()=>aprovarMed(ai,mi)} style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:7,padding:"6px 12px",fontSize:12,fontWeight:700,cursor:"pointer"}}>✓ Aprovar</button>
         <button onClick={()=>rejeitarMed(ai,mi)} style={{background:"#fee2e2",color:"#ef4444",border:"none",borderRadius:7,padding:"6px 10px",fontSize:12,fontWeight:700,cursor:"pointer"}}>✕</button>
        </div>
       </div>
      </div>
     )))}
    </div>
   )}
   {isEng&&totalPendentes>0&&(
    <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:10,padding:"10px 14px",marginBottom:12}}>
     <div style={{fontSize:12,color:"#1e40af",fontWeight:700}}>⏳ Você tem {totalPendentes} medição(ões) aguardando aprovação do diretor.</div>
    </div>
   )}
      {semanasMedidas.length>0&&(
    <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:10,padding:"10px 14px",marginBottom:16}}>
     <div style={{fontSize:12,fontWeight:700,color:"#1e40af",marginBottom:8}}>📄 Relatório para o cliente — selecione a medição:</div>
     <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
      {semanasMedidas.map(sm=><button key={sm} onClick={()=>setRepSem(sm)} style={{background:"#1e40af",color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:700,cursor:"pointer"}}>{semLabel(sm)}</button>)}
     </div>
    </div>
   )}
   <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>
    {pavs.map(p=><button key={p} onClick={()=>setSel(p)} style={{background:sel===p?"#f8c400":"#fff",color:sel===p?"#0f172a":"#64748b",border:"1px solid #e2e8f0",borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
     {p} <span style={{opacity:.75}}>({pct(getPvtPct(p))})</span>
    </button>)}
   </div>
   <div style={{display:"grid",gap:10}}>
    {items.map((a,i)=>{
     const ativIdx=A.indexOf(a);
     const p=a.total>0?Math.min((a.acum/a.total)*100,100):0;
     return(
      <div key={i} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:14,boxShadow:"0 1px 3px #0001"}}>
       <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
        <div>
         <span style={{fontSize:10,color:"#64748b",marginRight:8}}>{a.cod}</span>
         <span style={{fontSize:13,fontWeight:700,color:"#1e293b"}}>{a.ativ}</span>
         <span style={{fontSize:10,color:"#64748b",marginLeft:8}}>{a.sec} · peso {pct(a.peso_obra||0)}</span>
        </div>
        <span style={{fontWeight:800,color:p>=100?"#10b981":"#f59e0b",fontSize:13}}>{pct(p)}</span>
       </div>
       <div style={{background:"#f1f5f9",borderRadius:99,height:8,marginBottom:8}}>
        <div style={{width:`${p}%`,height:"100%",background:p>=100?"#10b981":"linear-gradient(90deg,#f8c400,#f59e0b)",borderRadius:99,transition:"width .3s"}}/>
       </div>
       <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#64748b"}}>
        <span>Acumulado: <b style={{color:"#475569"}}>{a.acum} / {a.total} {a.und}</b></span>
        <span style={{cursor:"pointer",color:"#3b82f6"}} onClick={()=>{setEditTotal(ativIdx);setEditTotalVal(String(a.total));setEditTotalUnd(a.und);}}>Total: {a.total} {a.und} ✏️</span>
       </div>
       {a.meds&&a.meds.length>0&&(
        <div style={{marginTop:10,borderTop:"1px solid #f1f5f9",paddingTop:8}}>
         <div style={{fontSize:10,color:"#64748b",fontWeight:700,marginBottom:4}}>HISTÓRICO (toque para editar)</div>
         {[...a.meds].map((m,mi)=>(
          <div key={mi} onClick={()=>{setEditMed({ativIdx,medIdx:mi});setEditQtd(String(m.qtd));}} style={{fontSize:11,color:"#64748b",marginBottom:3,cursor:"pointer",display:"flex",justifyContent:"space-between",padding:"3px 6px",borderRadius:4,background:"#f8fafc"}}>
           <span>{m.label||m.data} — <b style={{color:"#475569"}}>+{m.qtd} {a.und}</b>{m.obs?" · "+m.obs:""}</span>
           <span style={{color:"#3b82f6",fontSize:10}}>editar ›</span>
          </div>
         ))}
        </div>
       )}
      </div>
     );
    })}
   </div>
   
   {modal&&(
    <Modal onClose={()=>setModal(false)} title={`Registrar Medição — ${nextSemLabel}`}>
     <div style={{background:"#fef3c7",borderRadius:8,padding:12,marginBottom:16,fontSize:12,color:"#92400e"}}>
      <b>Semana {nextSem} — {nextSemLabel}</b><br/>Informe os avanços. Atividades já 100% concluídas não aparecem.
     </div>
     <div style={{position:"sticky",top:0,background:"#fff",paddingBottom:10,zIndex:5,display:"flex",gap:10,marginBottom:10}}>
      <button onClick={saveSem} style={{...BP,flex:1}}>✓ Salvar Medição {nextSemLabel}</button>
      <button onClick={()=>setModal(false)} style={{...BS}}>Cancelar</button>
     </div>
     <label style={{fontSize:12,color:"#64748b",display:"block",marginBottom:12}}>Observação geral (opcional)<input value={semObs} onChange={e=>setSemObs(e.target.value)} placeholder="Ex: Semana com chuvas" style={IS}/></label>
     <div style={{maxHeight:420,overflowY:"auto"}}>
      {Object.entries(pendingByCat).map(([cat,its])=>(
       <div key={cat} style={{marginBottom:14}}>
        <div style={{fontSize:11,fontWeight:800,color:"#1e40af",background:"#dbeafe",padding:"5px 10px",borderRadius:6,marginBottom:6}}>{cat}</div>
        <div style={{display:"grid",gap:6}}>
         {its.map(a=>(
          <div key={a.gi} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,padding:"8px 12px",display:"flex",alignItems:"center",gap:10}}>
           <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:11,fontWeight:700,color:"#475569"}}>{a.cod} {a.ativ}</div>
            <div style={{fontSize:10,color:"#64748b"}}>{a.acum}/{a.total} {a.und}</div>
           </div>
           <input type="number" min="0" placeholder="0" value={semData[a.gi]||""} onChange={e=>setSemData(d=>({...d,[a.gi]:e.target.value}))} style={{...IS,width:80,marginTop:0,textAlign:"center"}}/>
           <span style={{fontSize:10,color:"#64748b",minWidth:28}}>{a.und}</span>
          </div>
         ))}
        </div>
       </div>
      ))}
     </div>
     <div style={{display:"flex",gap:10,marginTop:20}}>
      <button onClick={saveSem} style={{...BP,flex:1}}>Registrar {nextSemLabel}</button>
      <button onClick={()=>setModal(false)} style={{...BS,flex:1}}>Cancelar</button>
     </div>
    </Modal>
   )}
   
   {repSem!==null ? (()=>{
    const Rd=getRepData(repSem);
    const COLORS={"Fundação":"#f59e0b","Térreo":"#3b82f6","1º Pavimento":"#10b981","Cobertura":"#8b5cf6","Fachada":"#ef4444"};
    const compet=Rd.datas.length?(Rd.datas[0]+(Rd.datas.length>1&&Rd.datas[Rd.datas.length-1]!==Rd.datas[0]?" a "+Rd.datas[Rd.datas.length-1]:"")):"—";
    return(
    <Modal onClose={()=>setRepSem(null)} title={`Relatório de Medição — ${Rd.label}`}>
     <div id="relatorio-cliente" style={{background:"#fff"}}>
      <div style={{borderBottom:"3px solid #f8c400",paddingBottom:14,marginBottom:16}}>
       <Logo h={32}/>
       <div style={{fontSize:17,fontWeight:800,color:"#1e2d5a",marginTop:12}}>Relatório de Avanço de Obra</div>
       <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 16px",marginTop:10,fontSize:12}}>
        <div><span style={{color:"#94a3b8"}}>Obra: </span><b style={{color:"#1e293b"}}>{obra?obra.nome:"—"}</b></div>
        <div><span style={{color:"#94a3b8"}}>Cliente: </span><b style={{color:"#1e293b"}}>{obra?obra.cliente:"—"}</b></div>
        <div><span style={{color:"#94a3b8"}}>Local: </span><b style={{color:"#1e293b"}}>{obra?obra.local:"—"}</b></div>
        <div><span style={{color:"#94a3b8"}}>Início: </span><b style={{color:"#1e293b"}}>{obra?obra.inicio:"—"}</b></div>
        <div><span style={{color:"#94a3b8"}}>Medição: </span><b style={{color:"#f59e0b"}}>{Rd.label}</b></div>
        <div><span style={{color:"#94a3b8"}}>Competência: </span><b style={{color:"#1e293b"}}>{compet}</b></div>
        {Rd.autores.length>0&&<div style={{gridColumn:"1/-1"}}><span style={{color:"#94a3b8"}}>Lançado por: </span><b style={{color:"#1e293b"}}>{Rd.autores.join(", ")}</b></div>}
       </div>
      </div>

      <div style={{background:"#1e2d5a",borderRadius:12,padding:18,marginBottom:18,textAlign:"center"}}>
       <div style={{fontSize:12,color:"#94a3b8",textTransform:"uppercase",letterSpacing:1}}>Conclusão Geral da Obra</div>
       <div style={{fontSize:36,fontWeight:800,color:"#f8c400",lineHeight:1.1,marginTop:4}}>{pct(Rd.concGeral)}</div>
       <div style={{background:"#334155",borderRadius:8,height:10,marginTop:10,overflow:"hidden"}}>
        <div style={{background:"#f8c400",height:"100%",width:`${Math.min(Rd.concGeral,100)}%`}}/>
       </div>
      </div>

      <div style={{fontSize:14,fontWeight:800,color:"#1e2d5a",marginBottom:12}}>Avanço Detalhado por Etapa</div>
      <div style={{display:"grid",gap:14,marginBottom:20}}>
       {Rd.porPav.map(pp=>(
        <div key={pp.pav} style={{border:"1px solid #e2e8f0",borderRadius:10,padding:"12px 14px"}}>
         <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}>
          <span style={{fontWeight:800,color:COLORS[pp.pav]||"#1e2d5a"}}>{pp.pav}</span>
          <span style={{fontWeight:800,color:pp.pct>=100?"#16a34a":pp.pct>0?"#f59e0b":"#94a3b8"}}>{pct(pp.pct)}</span>
         </div>
         <div style={{background:"#e2e8f0",borderRadius:6,height:12,overflow:"hidden",marginBottom:10}}>
          <div style={{background:pp.pct>=100?"#16a34a":(COLORS[pp.pav]||"#f8c400"),height:"100%",width:`${Math.min(pp.pct,100)}%`}}/>
         </div>
         <div style={{display:"grid",gap:5,paddingLeft:6}}>
          {pp.secs.map(sc=>(
           <div key={sc.sec}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:2}}>
             <span style={{color:"#64748b"}}>└ {sc.sec}</span>
             <span style={{fontWeight:700,color:sc.pct>=100?"#16a34a":sc.pct>0?"#f59e0b":"#94a3b8"}}>{pct(sc.pct)}</span>
            </div>
            <div style={{background:"#f1f5f9",borderRadius:4,height:7,overflow:"hidden"}}>
             <div style={{background:sc.pct>=100?"#16a34a":"#fbbf24",height:"100%",width:`${Math.min(sc.pct,100)}%`}}/>
            </div>
           </div>
          ))}
         </div>
        </div>
       ))}
      </div>

      <div style={{fontSize:14,fontWeight:800,color:"#1e2d5a",marginBottom:10}}>Itens Executados em {Rd.label}</div>
      {Rd.itensSemana.length===0?(
       <div style={{fontSize:13,color:"#94a3b8",padding:16,textAlign:"center",background:"#f8fafc",borderRadius:8}}>Nenhum item registrado nesta semana.</div>
      ):(
       <div style={{border:"1px solid #e2e8f0",borderRadius:10,overflow:"hidden"}}>
        {Rd.itensSemana.map((it,i)=>{
         const p=it.total>0?Math.min((it.acum/it.total)*100,100):0;
         return(
          <div key={i} style={{padding:"10px 14px",borderBottom:i<Rd.itensSemana.length-1?"1px solid #f1f5f9":"none"}}>
           <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1,minWidth:0,paddingRight:10}}>
             <div style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>{it.ativ}</div>
             <div style={{fontSize:10,color:"#94a3b8"}}>{it.pav} › {it.sec}</div>
            </div>
            <div style={{textAlign:"right",whiteSpace:"nowrap"}}>
             <div style={{fontSize:13,fontWeight:700,color:"#16a34a"}}>+{it.qtd} {it.und}</div>
             <div style={{fontSize:10,color:"#64748b"}}>acum. {it.acum}/{it.total} ({pct(p)})</div>
            </div>
           </div>
           {it.obs&&<div style={{fontSize:11,color:"#64748b",marginTop:4,fontStyle:"italic"}}>Obs: {it.obs}</div>}
          </div>
         );
        })}
       </div>
      )}

      <div style={{marginTop:20,paddingTop:14,borderTop:"1px solid #e2e8f0",fontSize:11,color:"#94a3b8",textAlign:"center"}}>
       Humanity Engenharia · Eng. Resp. Hugo Otávio Noronha Puty · Relatório gerado em {new Date().toLocaleDateString("pt-BR")}
      </div>
     </div>

     <div style={{display:"flex",gap:10,marginTop:20}}>
      <button onClick={()=>gerarPDF(Rd,compet)} style={{...BP,flex:1}}>📄 Gerar PDF</button>
      <button onClick={()=>setRepSem(null)} style={{...BS,flex:1}}>Fechar</button>
     </div>
    </Modal>
    );
   })() : null}
   {editTotal!==null&&(
    <Modal onClose={()=>setEditTotal(null)} title={`Editar — ${(A[editTotal]&&A[editTotal].ativ)||""}`}>
     <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:10}}>
      <label style={{fontSize:12,color:"#64748b"}}>Quantidade total a executar
       <input type="number" value={editTotalVal} onChange={e=>setEditTotalVal(e.target.value)} style={IS} autoFocus/>
      </label>
      <label style={{fontSize:12,color:"#64748b"}}>Unidade
       <select value={editTotalUnd} onChange={e=>setEditTotalUnd(e.target.value)} style={{...IS,appearance:"none"}}>
        {["M2","M3","M","UND","KG","VB","CM","Ton","L","Saco","Dúzia","Ponto","Milheiro"].map(u=><option key={u} value={u}>{u}</option>)}
       </select>
      </label>
     </div>
     <p style={{fontSize:11,color:"#94a3b8",margin:"10px 0 0"}}>Acumulado atual: {(A[editTotal]&&A[editTotal].acum)} {(A[editTotal]&&A[editTotal].und)}. Você pode mudar a unidade de medição (ex: de M3 para UND) e a quantidade total conforme a obra avança.</p>
     <div style={{display:"flex",gap:10,marginTop:20}}>
      <button onClick={saveEditTotal} style={{...BP,flex:1}}>Salvar</button>
      <button onClick={()=>setEditTotal(null)} style={{...BS,flex:1}}>Cancelar</button>
     </div>
    </Modal>
   )}
   {editMed ? (()=>{
    const a=A[editMed.ativIdx];const m=a.meds[editMed.medIdx];
    return(
     <Modal onClose={()=>setEditMed(null)} title={`Editar Medição — ${a.ativ}`}>
      <div style={{fontSize:12,color:"#64748b",marginBottom:12}}>{m.label||m.data} · acumulado atual: {a.acum}/{a.total} {a.und}</div>
      <label style={{fontSize:12,color:"#64748b"}}>Quantidade medida nesta semana ({a.und})
       <input type="number" value={editQtd} onChange={e=>setEditQtd(e.target.value)} style={IS} autoFocus/>
      </label>
      <div style={{display:"flex",gap:10,marginTop:20}}>
       <button onClick={saveEditMed} style={{...BP,flex:1}}>Salvar correção</button>
       <button onClick={delMed} style={{...BS,background:"#fee2e2",color:"#ef4444"}}>Excluir</button>
       <button onClick={()=>setEditMed(null)} style={{...BS,flex:1}}>Cancelar</button>
      </div>
     </Modal>
    );
   })() : null}
  </div>
 );
}
function Empreitada({E,sv,A,svA}){
 const [editEmpId,setEditEmpId]=useState(null);
 const [modal,setModal]=useState(false);
 const [selEmp,setSelEmp]=useState(null);
 const [semData,setSemData]=useState({});
 const [pagForm,setPagForm]=useState({semana:"",valor:0,obs:""});
 const [novaEmpForm,setNovaEmpForm]=useState({nome:"",tel:"",cpf:"",status:"Ativo",itens:[],medicoes:[],pagamentos:[]});
 const [formObs,setFormObs]=useState("");
 const emp=E||[];
 const tPago=emp.reduce((s,e)=>s+(e.pagamentos||[]).reduce((ss,p)=>ss+(p.valor||0),0),0);
 
 const getItemConc=(e,ii)=>(e.medicoes||[]).flatMap(m=>m.itens||[]).filter(mi=>mi.ativIdx===ii).reduce((t,mi)=>t+(mi.qtd||0),0);
 const getTotalProd=e=>(e.itens||[]).reduce((s,it,ii)=>s+(getItemConc(e,ii)*it.unit),0);
 const getTotalPago=e=>(e.pagamentos||[]).reduce((s,p)=>s+(p.valor||0),0);
 const saveMedic=()=>{
 const n=[...emp];const ei=emp.findIndex(e=>e.id===selEmp);const e={...n[ei]};
 const lastSem=Math.max(0,...(e.medicoes||[]).map(m=>m.semana||0));
 const newSem=lastSem+1;
 const medItems=Object.entries(semData).filter(([_,v])=>Number(v)>0).map(([idx,qtd])=>({ativIdx:Number(idx),qtd:Number(qtd)}));
 e.medicoes=[...(e.medicoes||[]),{semana:newSem,label:semLabel(newSem),itens:medItems,obs:formObs}];
 n[ei]=e;sv(n);
 
 const nA=[...A];
 medItems.forEach(mi=>{
 const ativName=((e.itens||[])[mi.ativIdx]&&(e.itens||[])[mi.ativIdx].ativ);if(!ativName)return;
 const ai=nA.findIndex(a=>a.ativ.toLowerCase().includes(ativName.toLowerCase().split(" ")[0])||ativName.toLowerCase().includes(a.ativ.toLowerCase().split(" ")[0]));
 if(ai===-1)return;
 nA[ai]={...nA[ai],acum:Math.min(nA[ai].acum+mi.qtd,nA[ai].total),
 meds:[...(nA[ai].meds||[]),{sem:newSem,label:semLabel(newSem),qtd:mi.qtd,obs:"(Empreitada)",data:new Date().toLocaleDateString("pt-BR")}]};
 });
 svA(nA);setModal(false);setSemData({});setFormObs("");
 };
 const savePag=()=>{
 const n=[...emp];const ei=emp.findIndex(e=>e.id===selEmp);const e={...n[ei]};
 e.pagamentos=[...(e.pagamentos||[]),{...pagForm,data:new Date().toLocaleDateString("pt-BR")}];
 n[ei]=e;sv(n);setModal(false);
 };
 const addAtivToEmp=(empId,a)=>{
  const n=[...emp];const ei=n.findIndex(e=>e.id===empId);const e2={...n[ei]};
  if((e2.itens||[]).find(it=>it.ativ===a.ativ))return;
  e2.itens=[...(e2.itens||[]),{cod:a.cod||"",ativ:a.ativ,und:a.und,total:a.total,unit:0}];
  n[ei]=e2;sv(n);
 };
 const removeAtivFromEmp=(empId,ii)=>{
  const n=[...emp];const ei=n.findIndex(e=>e.id===empId);const e2={...n[ei]};
  const its=[...e2.itens];its.splice(ii,1);e2.itens=its;n[ei]=e2;sv(n);
 };
 const saveNewEmp=()=>{
 sv([...emp,{...novaEmpForm,id:`e${Date.now()}`,medicoes:[],pagamentos:[]}]);
 setModal(false);setNovaEmpForm({nome:"",tel:"",cpf:"",status:"Ativo",itens:[],medicoes:[],pagamentos:[]});
 };
 
 // Activities: exclude 100% done AND those already in other empreiteiros
 const atribSet=new Set((emp||[]).flatMap(e=>(e.itens||[]).map(it=>it.ativ)));
 const OBRA_ATIVIDADES=A
  .map((a,i)=>({idx:i,label:`${a.cod} ${a.ativ} (${a.pav})`,ativ:a.ativ,und:a.und,total:a.total,pav:a.pav,sec:a.sec,cod:a.cod}))
  .filter(a=>{
   const ap=A[a.idx]?(A[a.idx].total>0?(A[a.idx].acum/A[a.idx].total)*100:0):0;
   return ap<100 && !atribSet.has(a.ativ);
  });
 // Group by pav > sec for better UX
 const oaByGroup={};
 OBRA_ATIVIDADES.forEach(a=>{
  const k=`${a.pav} › ${a.sec}`;
  if(!oaByGroup[k])oaByGroup[k]=[];
  oaByGroup[k].push(a);
 });
 if(modal==="novaEmp") return(
 <Modal onClose={()=>setModal(false)} title="Nova Empreitada">
 <div style={{display:"grid",gap:10}}>
 <label style={{fontSize:12,color:"#64748b"}}>Nome do Empreiteiro<input value={novaEmpForm.nome} onChange={e=>setNovaEmpForm(f=>({...f,nome:e.target.value}))} style={IS}/></label>
 <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
 <label style={{fontSize:12,color:"#64748b"}}>Telefone<input value={novaEmpForm.tel} onChange={e=>setNovaEmpForm(f=>({...f,tel:e.target.value}))} style={IS}/></label>
 <label style={{fontSize:12,color:"#64748b"}}>CPF<input value={novaEmpForm.cpf} onChange={e=>setNovaEmpForm(f=>({...f,cpf:e.target.value}))} style={IS}/></label>
 </div>
 <label style={{fontSize:12,color:"#64748b"}}>Tipo de Serviço / Observações<input value={novaEmpForm.status} onChange={e=>setNovaEmpForm(f=>({...f,status:e.target.value}))} style={IS}/></label>
 <div style={{fontSize:12,color:"#64748b",fontWeight:700,marginBottom:4}}>Serviços da empreitada (selecione da lista da obra):</div>
 <div style={{maxHeight:220,overflowY:"auto",display:"grid",gap:4}}>
 {OBRA_ATIVIDADES.map((a,i)=>{
 const sel=(novaEmpForm.itens||[]).find(it=>it.aIdx===a.idx);
 return(
 <div key={i} style={{background:sel?"#fef3c7":"#f8fafc",border:`1px solid ${sel?"#f8c400":"#e2e8f0"}`,borderRadius:8,padding:"8px 12px"}}>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
 <div style={{fontSize:11,color:"#475569"}}>{a.label}</div>
 {sel?(
 <div style={{display:"flex",alignItems:"center",gap:6}}>
 <span style={{fontSize:10,color:"#64748b"}}>R$/Un:</span>
 <input type="number" value={sel.unit||0} onChange={e=>{const its=[...novaEmpForm.itens];const idx=its.findIndex(x=>x.aIdx===a.idx);its[idx]={...its[idx],unit:Number(e.target.value)};setNovaEmpForm(f=>({...f,itens:its}));}} style={{...IS,width:80,marginTop:0,padding:"3px 6px"}}/>
 <button onClick={()=>setNovaEmpForm(f=>({...f,itens:f.itens.filter(x=>x.aIdx!==a.idx)}))} style={{background:"#fee2e2",border:"none",color:"#ef4444",borderRadius:4,padding:"2px 6px",cursor:"pointer",fontSize:11}}>✕</button>
 </div>
 ):(
 <button onClick={()=>setNovaEmpForm(f=>({...f,itens:[...(f.itens||[]),{aIdx:a.idx,ativ:a.ativ,und:a.und,total:a.total,unit:0,cod:a.label.split(" ")[0]}]}))} style={{background:"#f8c400",border:"none",color:"#0f172a",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:11,fontWeight:700}}>+ Add</button>
 )}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 <div style={{display:"flex",gap:10,marginTop:20}}>
 <button onClick={saveNewEmp} style={{...BP,flex:1}}>Criar Empreitada</button>
 <button onClick={()=>setModal(false)} style={{...BS,flex:1}}>Cancelar</button>
 </div>
 </Modal>
 );
 return(
 <div>
 <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
 <h2 style={{fontSize:20,fontWeight:800,color:"#f59e0b",margin:0}}>Empreitada</h2>
 <button onClick={()=>setModal("novaEmp")} style={BP}>+ Nova Empreitada</button>
 </div>
 <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
 <KCard label="Total Produção (acumulado)" value={fmtBR(emp.reduce((s,e)=>s+getTotalProd(e),0))} color="#f59e0b"/>
 <KCard label="Total Pago" value={fmtBR(tPago)} color="#10b981"/>
 </div>
 {emp.map((e)=>{
 const itemConcs=(e.itens||[]).map((_,ii)=>getItemConc(e,ii));
 const totalProd=getTotalProd(e);const totalPago=getTotalPago(e);const aPagar=Math.max(totalProd-totalPago,0);
 return(
 <div key={e.id} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:16,marginBottom:16,boxShadow:"0 1px 4px #0001"}}>
 <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
 <div>
 <div style={{fontWeight:800,fontSize:15,color:"#1e293b"}}>{e.nome}</div>
 <div style={{fontSize:11,color:"#64748b"}}>{e.tel&&`📱 ${e.tel}`}{e.cpf&&` · CPF: ${e.cpf}`}</div>
 <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{e.status}</div>
 </div>
 <div style={{display:"flex",gap:6}}>
 <button onClick={()=>setEditEmpId(editEmpId===e.id?null:e.id)} style={{...BS,fontSize:11,padding:"5px 10px",background:editEmpId===e.id?"#fef3c7":"#f1f5f9",color:editEmpId===e.id?"#92400e":"#64748b"}}>✏️ Itens</button>
        <button onClick={()=>{setSelEmp(e.id);setSemData({});setFormObs("");setModal("medic");}} style={{...BS,fontSize:11,padding:"5px 10px"}}>+ Medição</button>
 <button onClick={()=>{setSelEmp(e.id);setPagForm({semana:"",valor:0,obs:""});setModal("pag");}} style={{...BS,fontSize:11,padding:"5px 10px"}}>+ Pagamento</button>
 </div>
 </div>
 {editEmpId===e.id&&(
       <div style={{background:"#fffbeb",border:"1px solid #f8c400",borderRadius:10,padding:14,marginBottom:12}}>
        <div style={{fontWeight:800,fontSize:13,color:"#92400e",marginBottom:10}}>✏️ Editar atividades de {e.nome}</div>
        <div style={{fontSize:11,color:"#92400e",fontWeight:700,marginBottom:6}}>Atividades atuais (toque em ✕ para remover e liberar):</div>
        <div style={{display:"grid",gap:5,marginBottom:14}}>
         {(e.itens||[]).map((it,ii)=>(
          <div key={ii} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#fff",border:"1px solid #fde68a",borderRadius:7,padding:"7px 10px"}}>
           <span style={{fontSize:12,color:"#1e293b"}}>{it.ativ} <span style={{color:"#94a3b8",fontSize:10}}>({it.total} {it.und})</span></span>
           <button onClick={()=>removeAtivFromEmp(e.id,ii)} style={{background:"#fee2e2",border:"none",color:"#ef4444",borderRadius:6,padding:"3px 9px",cursor:"pointer",fontSize:12,fontWeight:700}}>✕ Retirar</button>
          </div>
         ))}
         {(e.itens||[]).length===0&&<div style={{fontSize:12,color:"#94a3b8"}}>Nenhuma atividade atribuída.</div>}
        </div>
        <div style={{fontSize:11,color:"#1e40af",fontWeight:700,marginBottom:6}}>Adicionar atividade livre da obra:</div>
        <div style={{display:"grid",gap:5,maxHeight:240,overflowY:"auto"}}>
         {Object.keys(oaByGroup).map(grp=>(
          <div key={grp}>
           <div style={{fontSize:10,fontWeight:700,color:"#64748b",margin:"6px 0 3px"}}>{grp}</div>
           {oaByGroup[grp].map(a=>(
            <div key={a.idx} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#fff",border:"1px solid #e2e8f0",borderRadius:7,padding:"7px 10px",marginBottom:4}}>
             <span style={{fontSize:12,color:"#1e293b"}}>{a.ativ} <span style={{color:"#94a3b8",fontSize:10}}>({a.total} {a.und})</span></span>
             <button onClick={()=>addAtivToEmp(e.id,a)} style={{background:"#dbeafe",border:"none",color:"#1e40af",borderRadius:6,padding:"3px 9px",cursor:"pointer",fontSize:12,fontWeight:700}}>+ Add</button>
            </div>
           ))}
          </div>
         ))}
         {Object.keys(oaByGroup).length===0&&<div style={{fontSize:12,color:"#94a3b8"}}>Todas as atividades livres já estão atribuídas.</div>}
        </div>
        <button onClick={()=>setEditEmpId(null)} style={{...BS,width:"100%",marginTop:12}}>Fechar edição</button>
       </div>
      )}
       <div style={{overflowX:"auto",marginBottom:12}}>
 <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
 <thead><tr style={{background:"#f8fafc"}}>
 {["Atividade","Und","Total","Concluído","R$/Un","Valor Prod."].map(h=><th key={h} style={{padding:"6px 10px",textAlign:"left",color:"#64748b",fontWeight:700}}>{h}</th>)}
 </tr></thead>
 <tbody>{(e.itens||[]).map((it,ii)=>{
 const conc=itemConcs[ii];const vProd=conc*it.unit;const p=it.total>0?Math.min(conc/it.total*100,100):0;
 return(
 <tr key={ii} style={{borderBottom:"1px solid #f1f5f9"}}>
 <td style={{padding:"7px 10px",color:"#1e293b"}}>{it.ativ}</td>
 <td style={{padding:"7px 10px",color:"#64748b"}}>{it.und}</td>
 <td style={{padding:"7px 10px",textAlign:"right",color:"#64748b"}}>{it.total}</td>
 <td style={{padding:"7px 10px",textAlign:"right",color:"#f59e0b",fontWeight:700}}>{conc} ({pct(p)})</td>
 <td style={{padding:"7px 10px",textAlign:"right",color:"#64748b"}}>{fmtBR(it.unit)}</td>
 <td style={{padding:"7px 10px",textAlign:"right",fontWeight:700,color:"#10b981"}}>{fmtBR(vProd)}</td>
 </tr>
 );
 })}</tbody>
 </table>
 </div>
 <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,fontSize:12}}>
 <div style={{background:"#f8fafc",borderRadius:8,padding:10,border:"1px solid #e2e8f0"}}><div style={{color:"#64748b"}}>Total Produção</div><div style={{fontWeight:800,color:"#f59e0b"}}>{fmtBR(totalProd)}</div></div>
 <div style={{background:"#f8fafc",borderRadius:8,padding:10,border:"1px solid #e2e8f0"}}><div style={{color:"#64748b"}}>Total Pago</div><div style={{fontWeight:800,color:"#10b981"}}>{fmtBR(totalPago)}</div></div>
 <div style={{background:"#f8fafc",borderRadius:8,padding:10,border:"1px solid #e2e8f0"}}><div style={{color:"#64748b"}}>A Pagar</div><div style={{fontWeight:800,color:aPagar>0?"#ef4444":"#10b981"}}>{fmtBR(aPagar)}</div></div>
 </div>
 {(e.medicoes||[]).length>0&&(
 <div style={{marginTop:12,borderTop:"1px solid #f1f5f9",paddingTop:10}}>
 <div style={{fontSize:11,color:"#64748b",fontWeight:700,marginBottom:6}}>MEDIÇÕES SEMANAIS</div>
 {[...(e.medicoes||[])].reverse().slice(0,5).map((m,mi)=>(
 <div key={mi} style={{fontSize:11,color:"#64748b",marginBottom:3}}>
 <span style={{color:"#f59e0b",fontWeight:700}}>{m.label||`Sem ${m.semana}`}</span>:&nbsp;
 {(m.itens||[]).map(mi2=>{const it=(e.itens||[])[mi2.ativIdx];return it?`${it.ativ}: +${mi2.qtd} ${it.und}`:""}).filter(Boolean).join(" · ")}
 {m.obs&&` (${m.obs})`}
 </div>
 ))}
 </div>
 )}
 {(e.pagamentos||[]).length>0&&(
 <div style={{marginTop:8,borderTop:"1px solid #f1f5f9",paddingTop:8}}>
 <div style={{fontSize:11,color:"#64748b",fontWeight:700,marginBottom:4}}>PAGAMENTOS</div>
 {[...(e.pagamentos||[])].reverse().map((p,pi)=>(
 <div key={pi} style={{fontSize:11,color:"#64748b",marginBottom:2}}>{p.data} — <span style={{color:"#10b981",fontWeight:700}}>{fmtBR(p.valor)}</span>{p.obs&&` · ${p.obs}`}</div>
 ))}
 </div>
 )}
 </div>
 );
 })}
 {modal==="medic"? (()=>{
 const e=emp.find(x=>x.id===selEmp);if(!e)return null;
 const lastSem=Math.max(0,...(e.medicoes||[]).map(m=>m.semana||0));const newSem=lastSem+1;
 return(
 <Modal onClose={()=>setModal(false)} title={`Medição ${semLabel(newSem)} — ${e.nome}`}>
 <div style={{background:"#fef3c7",borderRadius:8,padding:10,marginBottom:12,fontSize:12,color:"#92400e"}}><b>{semLabel(newSem)}</b> — Semana {newSem}</div>
 <div style={{display:"grid",gap:8,maxHeight:360,overflowY:"auto"}}>
 {(e.itens||[]).map((it,ii)=>(
 <div key={ii} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",display:"flex",alignItems:"center",gap:10}}>
 <div style={{flex:1}}><div style={{fontSize:11,fontWeight:700,color:"#475569"}}>{it.ativ}</div><div style={{fontSize:10,color:"#64748b"}}>Total: {it.total} {it.und}</div></div>
 <input type="number" min="0" placeholder="0" value={semData[ii]||""} onChange={e=>setSemData(d=>({...d,[ii]:e.target.value}))} style={{...IS,width:80,marginTop:0,textAlign:"center"}}/>
 <span style={{fontSize:10,color:"#64748b",minWidth:28}}>{it.und}</span>
 </div>
 ))}
 </div>
 <label style={{fontSize:12,color:"#64748b",display:"block",marginTop:12}}>Observação<input value={formObs} onChange={e=>setFormObs(e.target.value)} style={IS}/></label>
 <div style={{display:"flex",gap:10,marginTop:20}}>
 <button onClick={saveMedic} style={{...BP,flex:1}}>Registrar</button>
 <button onClick={()=>setModal(false)} style={{...BS,flex:1}}>Cancelar</button>
 </div>
 </Modal>
 );
 })() : null}
 {modal==="pag"&&(
 <Modal onClose={()=>setModal(false)} title={`Pagamento — ${(emp.find(e=>e.id===selEmp)&&emp.find(e=>e.id===selEmp).nome)}`}>
 <div style={{display:"grid",gap:12}}>
 <label style={{fontSize:12,color:"#64748b"}}>Referência (semana/data)<input value={pagForm.semana} onChange={e=>setPagForm(f=>({...f,semana:e.target.value}))} style={IS}/></label>
 <label style={{fontSize:12,color:"#64748b"}}>Valor Pago (R$)<input type="number" value={pagForm.valor} onChange={e=>setPagForm(f=>({...f,valor:Number(e.target.value)}))} style={IS}/></label>
 <label style={{fontSize:12,color:"#64748b"}}>Observação<input value={pagForm.obs} onChange={e=>setPagForm(f=>({...f,obs:e.target.value}))} style={IS}/></label>
 </div>
 <div style={{display:"flex",gap:10,marginTop:20}}>
 <button onClick={savePag} style={{...BP,flex:1}}>Registrar</button>
 <button onClick={()=>setModal(false)} style={{...BS,flex:1}}>Cancelar</button>
 </div>
 </Modal>
 )}
 </div>
 );
}
function Estoque({ES,CON,svE,svC}){
 const [view,setView]=useState("est");
 const [modal,setModal]=useState(false);const [mSaida,setMSaida]=useState(false);
 const [idx,setIdx]=useState(null);const [form,setForm]=useState({});
 const [fS,setFS]=useState({item:"",qtd:1,quem:"",etapa:"",ativ:"",data:""});
 const tipos=[...new Set(ES.map(e=>e.tipo))];
 const oe=i=>{setIdx(i);setForm({...ES[i]});setModal(true);};
 const oNew=()=>{setIdx(null);setForm({tipo:"Material de Obra",item:"",qtd:1,und:"Und",local:"",dt:""});setModal(true);};
 const save=()=>{const n=[...ES];if(idx===null)n.push(form);else n[idx]=form;svE(n);setModal(false);};
 const regS=()=>{
 const i=ES.findIndex(e=>e.item===fS.item);if(i===-1)return;
 const n=[...ES];n[i]={...n[i],qtd:Math.max(0,n[i].qtd-Number(fS.qtd))};
 svE(n);
 svC([...CON,{...fS,data:fS.data||new Date().toLocaleDateString("pt-BR"),tipo:ES[i].tipo,und:ES[i].und}]);
 setMSaida(false);setFS({item:"",qtd:1,quem:"",etapa:"",ativ:"",data:""});
 };
 return(
 <div>
 <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
 <h2 style={{fontSize:20,fontWeight:800,color:"#f59e0b",margin:0}}>Estoque / Patrimônio</h2>
 <div style={{display:"flex",gap:8}}>
 <button onClick={()=>setMSaida(true)} style={BS}>↑ Saída</button>
 <button onClick={oNew} style={BP}>+ Item</button>
 </div>
 </div>
 <div style={{display:"flex",gap:6,marginBottom:16}}>
 {["est","con"].map((v,i)=><button key={v} onClick={()=>setView(v)} style={{...BS,background:view===v?"#f8c400":"#fff",color:view===v?"#0f172a":"#64748b",border:"1px solid #e2e8f0"}}>{i===0?"Estoque":`Consumo da obra (${CON.length})`}</button>)}
 </div>
 {view==="est"&&tipos.map(tipo=>{
 const its=ES.filter(e=>e.tipo===tipo);
 return(<div key={tipo} style={{marginBottom:20}}>
 <div style={{fontSize:11,fontWeight:800,color:"#64748b",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>{tipo}</div>
 <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,overflow:"hidden",boxShadow:"0 1px 3px #0001"}}>
 {its.map((e,i)=>(
 <div key={i} style={{display:"flex",alignItems:"center",padding:"10px 16px",borderBottom:"1px solid #f1f5f9",gap:12}}>
 <div style={{flex:1,fontWeight:600,fontSize:13,color:"#1e293b"}}>{e.item}</div>
 <div style={{fontSize:12,color:"#f59e0b",fontWeight:700,minWidth:80,textAlign:"right"}}>{e.qtd} {e.und}</div>
 <div style={{fontSize:11,color:"#64748b",minWidth:90,flexShrink:0}}>{e.local||"—"}{e.dt&&<span style={{display:"block",fontSize:9,color:"#cbd5e1"}}>{e.dt}</span>}</div>
 <button onClick={()=>oe(ES.indexOf(e))} style={{background:"#f1f5f9",border:"none",color:"#64748b",padding:"3px 8px",borderRadius:6,cursor:"pointer",fontSize:11,flexShrink:0}}>Editar</button>
 </div>
 ))}
 </div>
 </div>);
 })}
 {view==="con"&&<div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 3px #0001"}}>
 {CON.length===0?<div style={{padding:32,textAlign:"center",color:"#64748b"}}>Nenhum consumo registrado ainda.</div>:
 <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
 <thead><tr style={{background:"#f8fafc"}}>{["Item","Tipo","Qtd","Quem","Etapa","Atividade","Data"].map(h=><th key={h} style={{padding:"9px 12px",textAlign:"left",color:"#64748b",fontWeight:700}}>{h}</th>)}</tr></thead>
 <tbody>{[...CON].reverse().map((s,i)=>(
 <tr key={i} style={{borderBottom:"1px solid #f1f5f9"}}>
 <td style={{padding:"8px 12px",fontWeight:600,color:"#1e293b"}}>{s.item}</td>
 <td style={{padding:"8px 12px",color:"#64748b",fontSize:10}}>{s.tipo}</td>
 <td style={{padding:"8px 12px",color:"#ef4444",fontWeight:700}}>-{s.qtd} {s.und}</td>
 <td style={{padding:"8px 12px",color:"#475569"}}>{s.quem}</td>
 <td style={{padding:"8px 12px",color:"#475569"}}>{s.etapa}</td>
 <td style={{padding:"8px 12px",color:"#475569"}}>{s.ativ}</td>
 <td style={{padding:"8px 12px",color:"#64748b"}}>{s.data}</td>
 </tr>
 ))}</tbody>
 </table>}
 </div>}
 {modal&&<Modal onClose={()=>setModal(false)} title={idx===null?"Novo Item":"Editar Item"}>
 <div style={{display:"grid",gap:10}}>
 <label style={{fontSize:12,color:"#64748b"}}>Tipo<select value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})} style={{...IS,appearance:"none"}}><option>Material de Obra</option><option>Ferramentas/EPIs</option><option>Mobiliário</option></select></label>
 <label style={{fontSize:12,color:"#64748b"}}>Item<input value={form.item||""} onChange={e=>setForm({...form,item:e.target.value})} style={IS}/></label>
 <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
 <label style={{fontSize:12,color:"#64748b"}}>Quantidade<input type="number" value={form.qtd||0} onChange={e=>setForm({...form,qtd:Number(e.target.value)})} style={IS}/></label>
 <label style={{fontSize:12,color:"#64748b"}}>Unidade<input value={form.und||""} onChange={e=>setForm({...form,und:e.target.value})} style={IS}/></label>
 </div>
 <label style={{fontSize:12,color:"#64748b"}}>Local de Armazenamento<input value={form.local||""} onChange={e=>setForm({...form,local:e.target.value})} placeholder="Ex: Container, Em Uso, Canteiro..." style={IS}/></label>
 <label style={{fontSize:12,color:"#64748b"}}>Data de Entrada<input value={form.dt||""} onChange={e=>setForm({...form,dt:e.target.value})} style={IS}/></label>
 </div>
 <div style={{display:"flex",gap:10,marginTop:20}}>
 <button onClick={save} style={{...BP,flex:1}}>Salvar</button>
 <button onClick={()=>setModal(false)} style={{...BS,flex:1}}>Cancelar</button>
 </div>
 </Modal>}
 {mSaida&&<Modal onClose={()=>setMSaida(false)} title="Registrar Saída de Material">
 <div style={{display:"grid",gap:10}}>
 <label style={{fontSize:12,color:"#64748b"}}>Item<select value={fS.item} onChange={e=>setFS({...fS,item:e.target.value})} style={{...IS,appearance:"none"}}>
 <option value="">Selecione...</option>
 {ES.map((e,i)=><option key={i} value={e.item}>{e.item} (estoque: {e.qtd} {e.und})</option>)}
 </select></label>
 <label style={{fontSize:12,color:"#64748b"}}>Quantidade retirada<input type="number" value={fS.qtd} onChange={e=>setFS({...fS,qtd:e.target.value})} style={IS}/></label>
 <label style={{fontSize:12,color:"#64748b"}}>Quem retirou<input value={fS.quem} onChange={e=>setFS({...fS,quem:e.target.value})} style={IS}/></label>
 <label style={{fontSize:12,color:"#64748b"}}>Etapa da Obra<input value={fS.etapa} onChange={e=>setFS({...fS,etapa:e.target.value})} placeholder="Ex: Fundação, Térreo..." style={IS}/></label>
 <label style={{fontSize:12,color:"#64748b"}}>Atividade<input value={fS.ativ} onChange={e=>setFS({...fS,ativ:e.target.value})} style={IS}/></label>
 <label style={{fontSize:12,color:"#64748b"}}>Data<input value={fS.data} onChange={e=>setFS({...fS,data:e.target.value})} placeholder={new Date().toLocaleDateString("pt-BR")} style={IS}/></label>
 </div>
 <div style={{display:"flex",gap:10,marginTop:20}}>
 <button onClick={regS} disabled={!fS.item} style={{...BP,flex:1}}>Confirmar Saída → Consumo da Obra</button>
 <button onClick={()=>setMSaida(false)} style={{...BS,flex:1}}>Cancelar</button>
 </div>
 </Modal>}
 </div>
 );
}
function Compras({CP,sv,svE,ES}){
 const [modal,setModal]=useState(false);const [confirmModal,setConfirmModal]=useState(null);
 const [idx,setIdx]=useState(null);const [form,setForm]=useState({});
 const [localArm,setLocalArm]=useState("");const [tipoMat,setTipoMat]=useState("Material de Obra");
 const sm={no_prazo:["#10b981","No Prazo"],atrasado:["#ef4444","Atrasado"],aguardando:["#f59e0b","Aguardando"]};
 
 const pendentes=CP.filter(c=>c.status!=="entregue");
 const oe=i=>{const ri=CP.indexOf(pendentes[i]);setIdx(ri);setForm({...CP[ri]});setModal(true);};
 const save=()=>{const n=[...CP];if(idx===null)n.push(form);else n[idx]=form;sv(n);setModal(false);};
 const confirmar=(pi)=>{const ri=CP.indexOf(pendentes[pi]);setConfirmModal(ri);setLocalArm("");setTipoMat("Material de Obra");};
 const finalizar=()=>{
 const c=CP[confirmModal];
 const n=[...CP];n.splice(confirmModal,1); 
 sv(n);
 const nE=[...ES];const ex=nE.findIndex(e=>e.item===c.item);
 if(ex>=0){nE[ex]={...nE[ex],qtd:nE[ex].qtd+(c.qtd||1)};}
 else{nE.push({tipo:tipoMat,item:c.item,qtd:c.qtd||1,und:c.und||"Und",local:localArm||"A definir",dt:new Date().toLocaleDateString("pt-BR")});}
 svE(nE);setConfirmModal(null);
 };
 return(
 <div>
 <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
 <h2 style={{fontSize:20,fontWeight:800,color:"#f59e0b",margin:0}}>Compras em Andamento</h2>
 <button onClick={()=>{setIdx(null);setForm({item:"",qtd:1,und:"Und",frente:"",dtC:"",status:"aguardando",dtCh:"",obs:""});setModal(true);}} style={BP}>+ Compra</button>
 </div>
 {pendentes.length===0&&<div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:40,textAlign:"center",color:"#64748b"}}>✅ Nenhuma compra pendente. Todos os itens foram entregues.</div>}
 <div style={{display:"grid",gap:10}}>
 {pendentes.map((c,i)=>{const[sc,sl]=sm[c.status]||sm.aguardando;return(
 <div key={i} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:16,boxShadow:"0 1px 3px #0001"}}>
 <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
 <div><div style={{fontWeight:700,fontSize:14,color:"#1e293b"}}>{c.item}</div><div style={{fontSize:12,color:"#64748b"}}>Frente: {c.frente}</div></div>
 <div style={{display:"flex",gap:6,alignItems:"flex-start",flexWrap:"wrap",justifyContent:"flex-end"}}>
 <span style={{background:sc+"22",color:sc,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20}}>{sl}</span>
 <button onClick={()=>confirmar(i)} style={{background:"#10b981",border:"none",color:"#fff",padding:"4px 10px",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:700}}>✓ Chegou</button>
 <button onClick={()=>oe(i)} style={{background:"#f1f5f9",border:"none",color:"#64748b",padding:"3px 8px",borderRadius:6,cursor:"pointer",fontSize:11}}>Editar</button>
 </div>
 </div>
 <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,fontSize:12}}>
 <div><div style={{color:"#64748b"}}>Qtd</div><div style={{color:"#1e293b"}}>{c.qtd} {c.und}</div></div>
 <div><div style={{color:"#64748b"}}>Comprado em</div><div style={{color:"#1e293b"}}>{c.dtC||"—"}</div></div>
 <div><div style={{color:"#64748b"}}>Chegada prevista</div><div style={{color:"#f59e0b",fontWeight:600}}>{c.dtCh||"—"}</div></div>
 </div>
 {c.obs&&<div style={{marginTop:6,fontSize:11,color:"#64748b",fontStyle:"italic"}}>{c.obs}</div>}
 </div>
 );})}
 </div>
 {modal&&<Modal onClose={()=>setModal(false)} title={idx===null?"Nova Compra":"Editar Compra"}>
 <div style={{display:"grid",gap:10}}>
 <label style={{fontSize:12,color:"#64748b"}}>Item<input value={form.item||""} onChange={e=>setForm({...form,item:e.target.value})} style={IS}/></label>
 <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
 <label style={{fontSize:12,color:"#64748b"}}>Qtd<input type="number" value={form.qtd||1} onChange={e=>setForm({...form,qtd:Number(e.target.value)})} style={IS}/></label>
 <label style={{fontSize:12,color:"#64748b"}}>Unidade<input value={form.und||""} onChange={e=>setForm({...form,und:e.target.value})} style={IS}/></label>
 </div>
 <label style={{fontSize:12,color:"#64748b"}}>Frente<input value={form.frente||""} onChange={e=>setForm({...form,frente:e.target.value})} style={IS}/></label>
 <label style={{fontSize:12,color:"#64748b"}}>Status<select value={form.status||"aguardando"} onChange={e=>setForm({...form,status:e.target.value})} style={{...IS,appearance:"none"}}><option value="aguardando">Aguardando</option><option value="no_prazo">No Prazo</option><option value="atrasado">Atrasado</option></select></label>
 <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
 <label style={{fontSize:12,color:"#64748b"}}>Data da Compra<input value={form.dtC||""} onChange={e=>setForm({...form,dtC:e.target.value})} style={IS}/></label>
 <label style={{fontSize:12,color:"#64748b"}}>Chegada Prevista<input value={form.dtCh||""} onChange={e=>setForm({...form,dtCh:e.target.value})} style={IS}/></label>
 </div>
 <label style={{fontSize:12,color:"#64748b"}}>Observação<input value={form.obs||""} onChange={e=>setForm({...form,obs:e.target.value})} style={IS}/></label>
 </div>
 <div style={{display:"flex",gap:10,marginTop:20}}>
 <button onClick={save} style={{...BP,flex:1}}>Salvar</button>
 <button onClick={()=>setModal(false)} style={{...BS,flex:1}}>Cancelar</button>
 </div>
 </Modal>}
 {confirmModal!==null&&<Modal onClose={()=>setConfirmModal(null)} title={`Confirmar Chegada — ${(CP[confirmModal]&&CP[confirmModal].item)}`}>
 <p style={{color:"#64748b",fontSize:13,marginTop:0}}>O item será <b>removido</b> da lista de compras e adicionado ao <b>Estoque</b>.</p>
 <label style={{fontSize:12,color:"#64748b"}}>Tipo de material
 <select value={tipoMat} onChange={e=>setTipoMat(e.target.value)} style={{...IS,appearance:"none"}}>
 <option>Material de Obra</option><option>Ferramentas/EPIs</option><option>Mobiliário</option>
 </select>
 </label>
 <label style={{fontSize:12,color:"#64748b",marginTop:10,display:"block"}}>Local de armazenamento
 <input value={localArm} onChange={e=>setLocalArm(e.target.value)} placeholder="Ex: Container, Canteiro, Em Casa..." style={IS}/>
 </label>
 <div style={{display:"flex",gap:10,marginTop:20}}>
 <button onClick={finalizar} style={{...BP,flex:1}}>✓ Confirmar → Mover para Estoque</button>
 <button onClick={()=>setConfirmModal(null)} style={{...BS,flex:1}}>Cancelar</button>
 </div>
 </Modal>}
 </div>
 );
}

function Comunicacao({C,sv,msgs,svM,user,engOnly}){
 const [tab2,setTab2]=useState("chat");
 const [msg,setMsg]=useState("");
 const [cotModal,setCotModal]=useState(false);
 const [selMats,setSelMats]=useState([]);
 const [editCusto,setEditCusto]=useState(null);
 const [formCusto,setFormCusto]=useState({});

 const isAdmin=user.role==="admin";
 const myName=user.nome;
 const otherName=isAdmin?"Monique Pacheco":"Hugo Puty (Diretor)";

 const sendMsg=(texto,tipo)=>{
  if(!texto||!texto.trim())return;
  const nova={id:Date.now(),de:myName,role:user.role,texto,tipo:tipo||"texto",data:new Date().toLocaleString("pt-BR")};
  svM([...(msgs||[]),nova]);
  setMsg("");
 };

 const pendentes=C.filter(c=>(c.pago||0)<=0);
 const toggleMat=(c)=>{
  const i=selMats.indexOf(c);
  if(i<0)setSelMats([...selMats,c]);
  else setSelMats(selMats.filter(x=>x!==c));
 };
 const sendCotacao=()=>{
  if(!selMats.length)return;
  const linhas=selMats.map(m=>"• "+m.desc+" — "+m.qtd+" "+m.und).join("\n");
  sendMsg("📋 Solicitação de Cotação:\n"+linhas,"cotacao");
  setSelMats([]);
  setCotModal(false);
 };

 const oeCusto=(c)=>{setEditCusto(C.indexOf(c));setFormCusto({...c});};
 const oeNovoCusto=()=>{setEditCusto(-1);setFormCusto({pav:"Térreo",cat:"",desc:"",und:"vb",qtd:1,unit:0,pago:0,status:"pendente",forn:""});};
 const saveCusto=()=>{
  const t=Number(formCusto.qtd)*Number(formCusto.unit);
  const item={...formCusto,qtd:Number(formCusto.qtd),unit:Number(formCusto.unit),total:t,pago:Number(formCusto.pago||0)};
  const n=[...C];
  if(editCusto===-1)n.push(item);else n[editCusto]=item;
  sv(n);setEditCusto(null);
 };
 const delCusto=()=>{
  if(editCusto===-1||editCusto===null){setEditCusto(null);return;}
  const n=[...C];n.splice(editCusto,1);sv(n);setEditCusto(null);
 };

 return(
  <div>
   <h2 style={{fontSize:20,fontWeight:800,color:"#f59e0b",margin:"0 0 4px"}}>Comunicação</h2>
   <p style={{fontSize:12,color:"#94a3b8",margin:"0 0 16px"}}>Canal direto entre direção e engenheira da obra</p>
   <div style={{display:"flex",gap:8,marginBottom:16}}>
    <button onClick={()=>setTab2("chat")} style={{background:tab2==="chat"?"#f8c400":"#fff",color:tab2==="chat"?"#0f172a":"#64748b",border:"1px solid #e2e8f0",borderRadius:20,padding:"7px 18px",fontSize:13,fontWeight:700,cursor:"pointer"}}>💬 Chat</button>
    {!engOnly&&<button onClick={()=>setTab2("custos")} style={{background:tab2==="custos"?"#f8c400":"#fff",color:tab2==="custos"?"#0f172a":"#64748b",border:"1px solid #e2e8f0",borderRadius:20,padding:"7px 18px",fontSize:13,fontWeight:700,cursor:"pointer"}}>💰 Lista de Custos</button>}
   </div>

   {tab2==="chat"&&(
    <div>
     <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:14,minHeight:300,maxHeight:420,overflowY:"auto",display:"flex",flexDirection:"column",gap:12}}>
      {(msgs||[]).length===0&&<div style={{textAlign:"center",color:"#94a3b8",fontSize:13,marginTop:40}}>Nenhuma mensagem ainda. Comece a conversa abaixo.</div>}
      {(msgs||[]).map(m=>{
       const mine=m.de===myName;
       return(
        <div key={m.id} style={{display:"flex",flexDirection:mine?"row-reverse":"row",gap:8,alignItems:"flex-start"}}>
         <div style={{width:34,height:34,borderRadius:"50%",background:m.role==="admin"?"#f8c400":"#3b82f6",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,flexShrink:0}}>{m.de.charAt(0)}</div>
         <div style={{maxWidth:"75%"}}>
          <div style={{fontSize:10,color:"#94a3b8",marginBottom:3,textAlign:mine?"right":"left"}}>{m.de} · {m.data}</div>
          <div style={{background:m.tipo==="cotacao"?"#fef9c3":mine?"#fef3c7":"#f1f5f9",border:m.tipo==="cotacao"?"1px solid #f8c400":"none",color:"#1e293b",padding:"10px 12px",borderRadius:12,fontSize:13,whiteSpace:"pre-wrap",lineHeight:1.4}}>{m.texto}</div>
         </div>
        </div>
       );
      })}
     </div>
     <div style={{display:"flex",gap:8,marginTop:12}}>
      <input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendMsg(msg);}} placeholder={"Mensagem para "+otherName+"..."} style={{...IS,marginTop:0,flex:1}}/>
      <button onClick={()=>sendMsg(msg)} style={{...BP,whiteSpace:"nowrap"}}>Enviar</button>
     </div>
     {isAdmin&&!engOnly&&<button onClick={()=>setCotModal(true)} style={{...BS,width:"100%",marginTop:10,color:"#1e40af",fontWeight:700}}>📋 Solicitar Cotação de Materiais</button>}
    </div>
   )}

   {tab2==="custos"&&(
    <div>
     <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <p style={{fontSize:12,color:"#94a3b8",margin:0}}>Edite quantidades e preços conforme as cotações chegam</p>
      <button onClick={oeNovoCusto} style={{...BP,padding:"6px 12px"}}>+ Item</button>
     </div>
     <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,overflow:"hidden"}}>
      {C.map(c=>(
       <div key={C.indexOf(c)} onClick={()=>oeCusto(c)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderBottom:"1px solid #f1f5f9",cursor:"pointer"}}>
        <div style={{flex:1,minWidth:0,paddingRight:10}}>
         <div style={{fontSize:12,color:"#1e293b"}}>{c.desc}</div>
         <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{c.pav} · {c.cat} · {c.qtd} {c.und}</div>
        </div>
        <div style={{fontWeight:700,color:"#f59e0b",fontSize:13,whiteSpace:"nowrap"}}>{fmtBR(c.unit)}/un</div>
       </div>
      ))}
     </div>
    </div>
   )}

   {cotModal&&(
    <Modal onClose={()=>setCotModal(false)} title="Solicitar Cotação">
     <p style={{fontSize:12,color:"#94a3b8",margin:"0 0 12px"}}>Selecione os materiais pendentes. Será enviado item e quantidade para a engenheira.</p>
     <div style={{display:"grid",gap:6,maxHeight:340,overflowY:"auto"}}>
      {pendentes.length===0&&<div style={{color:"#94a3b8",fontSize:13,textAlign:"center",padding:20}}>Nenhum material pendente.</div>}
      {pendentes.map(c=>{
       const sel=selMats.indexOf(c)>=0;
       return(
        <div key={C.indexOf(c)} onClick={()=>toggleMat(c)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:sel?"#fef3c7":"#f8fafc",border:"1px solid "+(sel?"#f8c400":"#e2e8f0"),borderRadius:8,cursor:"pointer"}}>
         <div style={{width:20,height:20,borderRadius:5,background:sel?"#f8c400":"#fff",border:"1px solid "+(sel?"#f8c400":"#cbd5e1"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>{sel?"✓":""}</div>
         <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:12,fontWeight:600,color:"#1e293b"}}>{c.desc}</div>
          <div style={{fontSize:10,color:"#94a3b8"}}>{c.qtd} {c.und}</div>
         </div>
        </div>
       );
      })}
     </div>
     <div style={{display:"flex",gap:10,marginTop:20}}>
      <button onClick={sendCotacao} style={{...BP,flex:1}}>Enviar Cotação ({selMats.length})</button>
      <button onClick={()=>setCotModal(false)} style={{...BS,flex:1}}>Cancelar</button>
     </div>
    </Modal>
   )}

   {editCusto!==null&&(
    <Modal onClose={()=>setEditCusto(null)} title={editCusto===-1?"Novo Item":"Editar Item"}>
     <div style={{display:"grid",gap:10}}>
      <label style={{fontSize:12,color:"#64748b"}}>Descrição<input value={formCusto.desc||""} onChange={e=>setFormCusto({...formCusto,desc:e.target.value})} style={IS}/></label>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
       <label style={{fontSize:12,color:"#64748b"}}>Pavimento<input value={formCusto.pav||""} onChange={e=>setFormCusto({...formCusto,pav:e.target.value})} style={IS}/></label>
       <label style={{fontSize:12,color:"#64748b"}}>Categoria<input value={formCusto.cat||""} onChange={e=>setFormCusto({...formCusto,cat:e.target.value})} style={IS}/></label>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
       <label style={{fontSize:12,color:"#64748b"}}>Qtd<input type="number" value={formCusto.qtd||0} onChange={e=>setFormCusto({...formCusto,qtd:e.target.value})} style={IS}/></label>
       <label style={{fontSize:12,color:"#64748b"}}>Unid.<input value={formCusto.und||""} onChange={e=>setFormCusto({...formCusto,und:e.target.value})} style={IS}/></label>
       <label style={{fontSize:12,color:"#64748b"}}>Preço (R$)<input type="number" value={formCusto.unit||0} onChange={e=>setFormCusto({...formCusto,unit:e.target.value})} style={IS}/></label>
      </div>
      <div style={{fontSize:13,color:"#f59e0b",fontWeight:700}}>Total: {fmtBR(Number(formCusto.qtd)*Number(formCusto.unit))}</div>
     </div>
     <div style={{display:"flex",gap:10,marginTop:20}}>
      <button onClick={saveCusto} style={{...BP,flex:1}}>Salvar</button>
      {editCusto!==-1&&<button onClick={delCusto} style={{...BS,background:"#fee2e2",color:"#ef4444"}}>Excluir</button>}
      <button onClick={()=>setEditCusto(null)} style={{...BS,flex:1}}>Cancelar</button>
     </div>
    </Modal>
   )}
  </div>
 );
}
function CliAvanço({A}){
 const pavs=["Fundação","Térreo","1º Pavimento","Cobertura","Fachada"];
 const getPct=pav=>{const its=A.filter(a=>a.pav===pav);const tD=its.reduce((s,a)=>s+(a.prazo||0),0);const cD=its.reduce((s,a)=>s+(a.total>0?(a.acum/a.total)*a.prazo:0),0);return tD>0?cD/tD*100:0;};
 const totalPct=calcConclusaoGeral(A);
 return(
 <div>
 <h2 style={{fontSize:20,fontWeight:800,color:"#f59e0b",marginBottom:4}}>Avanço da Obra</h2>
 <p style={{fontSize:13,color:"#64748b",marginBottom:20}}>Residência Lote D18 — Quinta das Orquídeas · Ananindeua/PA</p>
 <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:24,marginBottom:20,textAlign:"center",boxShadow:"0 1px 4px #0001"}}>
 <div style={{fontSize:13,color:"#64748b",marginBottom:8}}>Conclusão Geral (média ponderada por dias)</div>
 <div style={{fontSize:52,fontWeight:800,color:"#f59e0b"}}>{pct(totalPct)}</div>
 <div style={{background:"#f1f5f9",borderRadius:99,height:16,marginTop:16,overflow:"hidden"}}>
 <div style={{width:`${Math.min(totalPct,100)}%`,height:"100%",background:"linear-gradient(90deg,#f8c400,#f59e0b)",borderRadius:99}}/>
 </div>
 </div>
 {pavs.map(pav=>{const p=getPct(pav);return(
 <div key={pav} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:16,marginBottom:10,boxShadow:"0 1px 3px #0001"}}>
 <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
 <span style={{fontWeight:700,color:"#1e293b"}}>{pav}</span><span style={{color:p>=100?"#10b981":"#f59e0b",fontWeight:800}}>{pct(p)}</span>
 </div>
 <div style={{background:"#f1f5f9",borderRadius:99,height:10}}>
 <div style={{width:`${Math.min(p,100)}%`,height:"100%",background:p>=100?"#10b981":"#f8c400",borderRadius:99}}/>
 </div>
 </div>
 );})}
 </div>
 );
}
function CliPag({R}){
 const tR=R.reduce((s,r)=>s+(r.rec||0),0);
 return(
 <div>
 <h2 style={{fontSize:20,fontWeight:800,color:"#f59e0b",marginBottom:16}}>Meus Pagamentos</h2>
 <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
 <KCard label="Total do Contrato" value={fmtBR(750000)} color="#f59e0b"/>
 <KCard label="Total Pago" value={fmtBR(tR)} color="#10b981"/>
 </div>
 <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 4px #0001"}}>
 <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
 <thead><tr style={{background:"#f8fafc"}}>{["Mês","Valor","Pago","Status"].map(h=><th key={h} style={{padding:"10px 14px",textAlign:"left",color:"#64748b"}}>{h}</th>)}</tr></thead>
 <tbody>{R.map((r,i)=>{
 const ok=r.rec>0&&r.rec>=(r.prev||0);const par=r.rec>0&&r.rec<(r.prev||0);
 return(
 <tr key={i} style={{borderBottom:"1px solid #f1f5f9"}}>
 <td style={{padding:"10px 14px",fontWeight:600,color:"#1e293b"}}>{r.data||"—"}</td>
 <td style={{padding:"10px 14px",color:"#64748b"}}>{fmtBR(r.prev||0)}</td>
 <td style={{padding:"10px 14px",color:"#10b981",fontWeight:700}}>{fmtBR(r.rec||0)}</td>
 <td style={{padding:"10px 14px"}}>
 <span style={{background:ok?"#d1fae5":par?"#fef3c7":"#f1f5f9",color:ok?"#059669":par?"#d97706":"#94a3b8",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20}}>
 {ok?"Pago":par?"Parcial":"Pendente"}
 </span>
 </td>
 </tr>
 );
 })}</tbody>
 </table>
 </div>
 </div>
 );
}
