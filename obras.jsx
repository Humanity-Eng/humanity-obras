// React hooks from global (definidos no index.html)

// ── Supabase (cliente oficial) ────────────────────────────────────────────
const SUPA_URL="https://mbabhkvyeejbbjvcuitq.supabase.co";
const SUPA_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iYWJoa3Z5ZWVqYmJqdmN1aXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTI0NzIsImV4cCI6MjA5NzI2ODQ3Mn0.Z_n699k_YBe_NQVxTJaMvgd40VeuiQVbXm-JUcGTjyw";

function getDB(){
 return window.supabase.createClient(SUPA_URL,SUPA_KEY);
}

async function dbGet(obraId,chave){
 try{
  const {data,error}=await getDB().from("obra_data").select("valor").eq("obra_id",obraId).eq("chave",chave).limit(1).single();
  if(error&&error.code!=="PGRST116")console.warn("dbGet:",error.message);
  return data?data.valor:null;
 }catch(e){console.warn("dbGet err:",e);return null;}
}

async function dbGetMany(chaves){
 try{
  const {data,error}=await getDB().from("obra_data").select("obra_id,chave,valor").in("chave",chaves);
  if(error){console.warn("dbGetMany:",error.message);return{};}
  const out={};
  (data||[]).forEach(r=>{if(!out[r.obra_id])out[r.obra_id]={};out[r.obra_id][r.chave]=r.valor;});
  return out;
 }catch(e){console.warn("dbGetMany err:",e);return{};}
}

async function dbSet(obraId,chave,valor){
 try{
  localStorage.setItem(obraId+":"+chave,JSON.stringify(valor));
 }catch(e){}
 try{
  const {error}=await getDB().from("obra_data").upsert({obra_id:obraId,chave,valor},{onConflict:"obra_id,chave"});
  if(error)console.warn("dbSet:",error.message);
 }catch(e){console.warn("dbSet err:",e);}
}

const USERS={
  "diretor@humanityengenharia.com":{pw:"hugoadmin2026",role:"admin",nome:"Hugo Puty",obras:"*"},
  "moniquepacheco.eng@outlook.com":{pw:"monique123",role:"eng",nome:"Monique Pacheco",obras:["lote_d18","obra_madalena","madalena"]},
  "cliente@loted18":{pw:"marcelo2026",role:"cli",nome:"Marcelo Azevedo Costa",obras:["lote_d18"]},
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

// ── Semanas de obra: contadas a partir da DATA DE INÍCIO REAL da obra ────────
const D2=x=>(x<10?"0":"")+x;
function parseBRDate(s){
 if(!s)return null;
 const t=String(s).trim();
 let m=t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
 if(m)return new Date(Number(m[3]),Number(m[2])-1,Number(m[1]));
 m=t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
 if(m)return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));
 return null;
}
// Marco inicial da obra (usado só para exibição/relatório)
let SEM_BASE=null;
function setSemBase(inicio){SEM_BASE=parseBRDate(inicio);}

// Rótulo da medição: sequencial puro (S1, S2, S3...). A data em que a medição
// foi feita fica gravada em cada lançamento — assim você mede na sexta, no sábado
// ou num intervalo diferente sem gerar divergência com a numeração.
function semLabel(n){return"S"+n;}

// Etapas: cada obra tem as suas. Cor fixa para as etapas da D18, paleta rotativa para o resto.
const CORES_ETAPA={"Fundação":"#f59e0b","Térreo":"#3b82f6","1º Pavimento":"#10b981","Cobertura":"#8b5cf6","Fachada":"#ef4444","Administrativo":"#0ea5e9","Mão de Obra":"#f97316","Outros":"#64748b"};
const PALETA=["#f59e0b","#3b82f6","#10b981","#8b5cf6","#ef4444","#0ea5e9","#f97316","#06b6d4","#a855f7","#84cc16","#e11d48","#14b8a6"];
function etapasDe(lista){const r=[];(lista||[]).forEach(x=>{const p=x.pav||"Outros";if(r.indexOf(p)<0)r.push(p);});return r;}
function corEtapa(p,lista){
 if(CORES_ETAPA[p])return CORES_ETAPA[p];
 const i=etapasDe(lista).indexOf(p);
 return PALETA[(i<0?0:i)%PALETA.length];
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
["T","Piso","3.3","Revestimento Cerâmico",5,"M2",94.75,0],
["T","Piso","3.4","Rejuntamento",1.5,"M2",94.75,0],
["T","Piso","3.5","Rodapé",2,"M",74,0],
["T","Inst. Hidrossanitárias","4.1","Fossa Séptica",1.5,"UND",1,0],
["T","Inst. Hidrossanitárias","4.2","Caixa de Inspeção",1.5,"UND",3,0],
["T","Inst. Hidrossanitárias","4.3","Caixa de Gordura",0.5,"UND",1,0],
["T","Inst. Hidrossanitárias","4.4","Ponto de Água",7,"UND",12,0],
["T","Inst. Hidrossanitárias","4.5","Ponto de Esgoto",10,"UND",12,0],
["T","Inst. Hidrossanitárias","4.6","Ponto de Dreno",2,"UND",3,0],
["T","Instalação Elétrica","5.1","Ponto de Tomada",7,"UND",20,0],
["T","Instalação Elétrica","5.2","Ponto de Ar Condicionado",1,"UND",3,0],
["T","Instalação Elétrica","5.3","Ponto de Iluminação",5,"UND",15,0],
["T","Instalação Elétrica","5.4","Aterramento",1,"UND",1,0],
["T","Instalação Elétrica","5.5","QGBT Geral",2,"UND",1,0],
["T","Revestimento","6.1","Revestimento Cerâmico (Parede)",5,"M2",116.1,0],
["T","Revestimento","6.2","Rejuntamento (Parede)",2,"M2",116.1,0],
["T","Iluminação","7.1","Luminária Quadrada 24W",1.3,"UND",13,0],
["T","Iluminação","7.2","Lustre",0.3,"UND",1,0],
["T","Iluminação","7.3","Arandela",0.1,"UND",1,0],
["T","Forro","8.1","Forro de Gesso",3,"M2",87.61,0],
["T","Forro","8.2","Forro Vinílico",1,"M2",7.14,0],
["T","Esquadria","9.1","Porta 1,50x2,50m em ACM Preto Fosco c/ Puxador de 1M",1,"M2",3.75,0],
["T","Esquadria","9.2","Porta MDF 0,70x2,10m Branco",1.5,"UND",3,0],
["T","Esquadria","9.3","Porta MDF 0,90x2,10m Branco",0.5,"UND",1,0],
["T","Esquadria","9.4","Porta de Correr 2 Folhas Vidro Incolor 2,00x2,10m",0.5,"UND",1,0],
["T","Esquadria","9.5","Porta de Correr 4 Folhas Vidro Incolor 3,00x2,10m",0.5,"UND",1,0],
["T","Esquadria","9.6","Janela 1,30x1,10m 2 Folhas Vidro Incolor",1,"UND",2,0],
["T","Esquadria","9.7","Janela 1,80x2,80m Basculante Vidro Incolor",0.5,"UND",1,0],
["T","Esquadria","9.8","Balancim 0,60x0,60m Basculante Vidro Incolor",1,"UND",2,0],
["T","Pintura","10.1","Aplicação de Massa em Parede",10,"M2",500,0],
["T","Pintura","10.2","Aplicação de Tinta em Parede",10,"M2",500,0],
["T","Pintura","10.3","Aplicação de Massa em Teto",4,"M2",87.61,0],
["T","Pintura","10.4","Aplicação de Tinta em Teto",3,"M2",87.61,0],
["T","Marmoraria","11.1","Soleira em Mármore Ubatuba Verde",1,"M2",1.42,0],
["T","Marmoraria","11.2","Peitoril em Mármore Ubatuba Verde",1,"M2",1.11,0],
["T","Marmoraria","11.3","Bancada em Mármore Ubatuba Verde",2,"M2",6,0],
["T","Louças e Metais","12.1","Bacia Sanitária Completa Padrão Médio",1.5,"UND",3,0],
["T","Louças e Metais","12.2","Tanque Padrão Médio",0.6,"UND",2,0],
["T","Louças e Metais","12.3","Cuba Cozinha Padrão Médio",0.6,"UND",2,0],
["T","Louças e Metais","12.4","Cuba Banheiro Padrão Médio",0.9,"UND",3,0],
["T","Louças e Metais","12.5","Torneira Cozinha Padrão Médio",0.2,"UND",2,0],
["T","Louças e Metais","12.6","Torneira Banheiro Padrão Médio",0.3,"UND",3,0],
["T","Louças e Metais","12.7","Chuveiro Banheiro Padrão Médio",0.2,"UND",1,0],
["T","Louças e Metais","12.8","Chuveiro Externo Padrão Médio",0.2,"UND",1,0],
["T","Louças e Metais","12.9","Sifão Universal",0.3,"UND",5,0],
["T","Louças e Metais","12.10","Engate Universal",0.3,"UND",5,0],
["P","Estrutura","1.1","Pilar de Concreto",20,"M3",2.57,0],
["P","Estrutura","1.2","Viga de Concreto",20,"M3",3.75,0],
["P","Estrutura","1.3","Laje Pré-Moldada (Montagem)",10,"M2",125.25,0],
["P","Estrutura","1.4","Laje Pré-Moldada (Concretagem)",2,"M2",125.25,0],
["P","Estrutura","1.5","Escada de Concreto",5,"M3",1.75,0],
["P","Parede","2.1","Alvenaria (Casa)",15,"M2",259.14,0],
["P","Parede","2.2","Reboco",15,"M2",518.28,0],
["P","Piso","3.1","Contrapiso",3,"M2",125.25,0],
["P","Piso","3.2","Revestimento Cerâmico",5,"M2",81.22,0],
["P","Piso","3.3","Rejuntamento",1.5,"M2",81.22,0],
["P","Piso","3.4","Rodapé",2,"M",80,0],
["P","Inst. Hidrossanitárias","4.1","Caixa D\'água",1.5,"UND",1,0],
["P","Inst. Hidrossanitárias","4.4","Ponto de Água",5,"UND",9,0],
["P","Inst. Hidrossanitárias","4.5","Ponto de Esgoto",7,"UND",9,0],
["P","Inst. Hidrossanitárias","4.6","Ponto de Dreno",2,"UND",3,0],
["P","Instalação Elétrica","5.1","Ponto de Tomada",5,"UND",17,0],
["P","Instalação Elétrica","5.2","Ponto de Ar Condicionado",1,"UND",3,0],
["P","Instalação Elétrica","5.3","Ponto de Iluminação",3,"UND",13,0],
["P","Revestimento","6.1","Revestimento Cerâmico (Parede)",4,"M2",76.14,0],
["P","Revestimento","6.2","Rejuntamento (Parede)",1.5,"M2",76.14,0],
["P","Iluminação","7.1","Luminária Quadrada 24W",1.3,"UND",13,0],
["P","Forro","8.1","Forro de Gesso",3,"M2",81.22,0],
["P","Esquadria","9.1","Porta MDF 0,90x2,10m Branco",3,"UND",6,0],
["P","Esquadria","9.2","Porta de Correr 4 Folhas Vidro Incolor 3,00x2,10m",0.5,"UND",1,0],
["P","Esquadria","9.3","Janela 1,40x1,10m 2 Folhas Vidro Incolor",1,"UND",2,0],
["P","Esquadria","9.4","Janela 1,30x1,10m 2 Folhas Vidro Incolor",0.5,"UND",1,0],
["P","Esquadria","9.5","Balancim 0,60x0,60m Basculante Vidro Incolor",1.5,"UND",3,0],
["P","Esquadria","9.6","Guarda-Corpo Panorâmico de Vidro",1.5,"M",3.05,0],
["P","Pintura","10.1","Aplicação de Massa em Parede",10,"M2",183,0],
["P","Pintura","10.2","Aplicação de Tinta em Parede",10,"M2",183,0],
["P","Pintura","10.3","Aplicação de Massa em Teto",4,"M2",81.22,0],
["P","Pintura","10.4","Aplicação de Tinta em Teto",3,"M2",81.22,0],
["P","Marmoraria","11.1","Soleira em Mármore Ubatuba Verde",1,"M2",1.26,0],
["P","Marmoraria","11.2","Peitoril em Mármore Ubatuba Verde",1,"M2",1.34,0],
["P","Marmoraria","11.3","Bancada em Mármore Ubatuba Verde",2,"M2",2.16,0],
["P","Louças e Metais","12.1","Bacia Sanitária Padrão Médio",1.5,"UND",3,0],
["P","Louças e Metais","12.2","Cuba Banheiro Padrão Médio",0.6,"UND",3,0],
["P","Louças e Metais","12.3","Torneira Banheiro Padrão Médio",0.6,"UND",3,0],
["P","Louças e Metais","12.4","Chuveiro Banheiro Padrão Médio",0.9,"UND",3,0],
["P","Louças e Metais","12.5","Sifão Universal",0.2,"UND",3,0],
["P","Louças e Metais","12.6","Engate Universal",0.3,"UND",3,0],
["P","Impermeabilização","13.1","Impermeabilização de Laje com Manta Asfáltica",2,"UND",12.52,0],
["C","Estrutura","1.1","Pilar de Concreto",5,"M3",1,0],
["C","Estrutura","1.2","Viga de Concreto",5,"M3",1.5,0],
["C","Estrutura","1.3","Laje Pré-Moldada (Montagem)",2,"M2",8,0],
["C","Estrutura","1.4","Laje Pré-Moldada (Concretagem)",0.5,"M2",8,0],
["C","Estrutura","1.5","Rufo de Concreto",3,"M",46,0],
["C","Parede","2.1","Alvenaria (Casa)",7,"M2",94.05,0],
["C","Parede","2.2","Reboco",7,"M2",188.1,0],
["C","Piso","3.1","Contrapiso",1,"M2",8,0],
["C","Impermeabilização","4.1","Impermeabilização de Laje com Manta Asfáltica",0.5,"UND",8,0],
["C","Telhado","5.1","Madeiramento",10,"UND",151.2,0],
["C","Telhado","5.2","Instalação de Telha Ecológica",10,"UND",151.2,0],
["C","Telhado","5.3","Calha",2,"UND",18,0],
["Fa","Revestimento","1.1","Revestimento Cerâmico",2,"M3",13.2,0],
["Fa","Revestimento","1.2","Rejuntamento",0.5,"M3",13.2,0],
["Fa","Revestimento","1.3","Ripado de PVC",0.5,"M2",7.8,0],
["Fa","Pintura","2.2","Aplicação de Massa em Parede",7,"M2",288,0],
["Fa","Pintura","2.3","Aplicação de Cimento Queimado",7,"M2",288,0],
["Fa","Iluminação","3.1","Perfil LED 2M",2,"M2",7,0],
["Fa","Iluminação","3.2","Fita LED",1,"M2",7,0],
["Fa","Iluminação","3.3","Spot 9W Embutir Redondo",0.8,"M2",8,0]
].map(([pav,sec,cod,ativ,prazo,und,total,acum])=>({pav:IA_M[pav]||pav,sec,cod,ativ,prazo:+prazo,und,total:+total,acum:+acum,meds:[],medsPendentes:[],peso_obra:+prazo/464.5*100}));


const TOTAL_DIAS_OBRA=464.5; // referência da D18 (soma dos prazos das 122 atividades)

// Dias totais da obra = soma dos prazos das atividades cadastradas nela.
// Assim cada obra usa a própria base (a D18 continua dando exatamente 464,5).
function totalDiasObra(A){
  const t=(A||[]).reduce((s,a)=>s+(Number(a.prazo)||0),0);
  return t>0?t:TOTAL_DIAS_OBRA;
}
// Conclusão ponderada: soma(prazo_i * acum_i/total_i) / dias totais * 100
function calcConclusaoGeral(A){
  return (A||[]).reduce((s,a)=>s+(a.total>0?(a.acum/a.total)*a.prazo:0),0)/totalDiasObra(A)*100;
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

// Obras que já vêm com dados cadastrados no código (planilha do cliente).
// São inseridas na lista uma única vez, na primeira abertura após o deploy.
const VERSAO="2026.08.19 · build 26";
const OBRAS_REF=[{id:"obra_madalena",nome:"EMEIF MADALENA RAAF — Reforma",cliente:"Prefeitura Municipal de Belém",local:"Belém/PA",inicio:"01/08/2026",contrato:1200000,status:"Em andamento"}];
const OBRAS_SEED=[{id:"lote_d18",nome:"LOTE D18 — Quinta das Orquídeas",cliente:"Marcelo Azevedo Costa",local:"Ananindeua/PA",inicio:"29/04/2026",contrato:750000,status:"Em andamento"}];

// ════════════════════ DASHBOARD ENGENHEIRA (sem financeiro) ════════════════
function DashboardEng({D,obra}){
 const A=D.acomp||[];
 const conclusao=A.length>0?calcConclusaoGeral(A):0;
 const pavs=etapasDe(A);
 const COLORS={};pavs.forEach(p=>{COLORS[p]=corEtapa(p,A);});
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
 const [obras,setObras]=useState(OBRAS_SEED);
 const [obraId,setObraId]=useState(null);
 const [tab,setTab]=useState(0);
 const [D,setD]=useState({});
 const [loading,setLoading]=useState(false);
 useEffect(()=>{
 if(!obraId)return;
 (async()=>{
 setLoading(true);
 const defs={caixa:{saldo:0,hist:[]},custos:IC,acomp:IA,estoque:IES,consumo:[],msgs:[],compras:[
 {item:"Vibrador de Concreto",qtd:1,und:"Und",frente:"Estrutura",dtC:"24/mai",status:"no_prazo",dtCh:"29/mai",tipo:"Ferramenta",obs:""},
 {item:"Betoneira 400L 220V",qtd:1,und:"Und",frente:"Estrutura",dtC:"25/mai",status:"no_prazo",dtCh:"28/mai",tipo:"Material de Obra",obs:""},
 ],rec:IR,emp:IE_DEFAULT,emprestimos:[],lidos:{},crono:{},tarefas:[],equipe:[]};
 // Obras com dados de referência próprios (planilha enviada pelo cliente)
 const chaveDef=chaveObra(obraId,obras.find(o=>o.id===obraId)||{});
 // Só estas chaves vêm da planilha; todo o resto começa vazio (nada da D18)
 const CHAVES_MADALENA=["acomp","custos","rec","crono","tarefas","compras"];
 if(chaveDef==="madalena"){
  defs.acomp=IA_MADALENA;defs.custos=IC_MADALENA;defs.rec=IR_MADALENA;
  defs.crono={inicio:"01/08/2026",meses:5};defs.tarefas=IT_MADALENA;defs.compras=CP_MADALENA;
 }
 const nd={};
 for(const k of Object.keys(defs)){
     const v=await dbGet(obraId,k);
     if(k==="acomp"&&obraId==="lote_d18"&&v&&Array.isArray(v)&&v.length>0){
      // Só a D18: mescla o IA de referência preservando o progresso já medido
      const saved=v;
      const merged=IA.map(item=>{
       const old=saved.find(s=>s.cod===item.cod&&s.pav===item.pav&&s.sec===item.sec);
       if(old)return{...item,acum:old.acum||0,meds:old.meds||[],medsPendentes:old.medsPendentes||[]};
       return item;
      });
      nd[k]=merged;
      dbSet(obraId,k,merged);
     } else if(chaveDef==="madalena"){
      // EMEIF Madalena: só as chaves da planilha têm dado inicial; o resto começa vazio
      if(k==="compras"&&chaveDef==="madalena"&&Array.isArray(v)){
       // Acrescenta só as compras da Jurunense que ainda não estão na lista,
       // comparando pelo nome do item (ignora acentos, caixa e pontuação).
       const chave=t=>String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[^A-Z0-9]/g,"");
       const existentes=v.map(c=>chave(c.item));
       const novos=CP_MADALENA.filter(c=>existentes.indexOf(chave(c.item))<0);
       if(novos.length>0){const merged=v.concat(novos);nd[k]=merged;dbSet(obraId,k,merged);}
       else nd[k]=v;
      }
      else if(k==="rec"&&Array.isArray(v)&&v.length>0){
       // Contrato revisado de R$ 1.518.833,98 para R$ 1.200.000: troca as parcelas
       // antigas pelas novas, desde que nada tenha sido recebido ainda.
       const somaPrev=v.reduce((s2,r)=>s2+(Number(r.prev)||0),0);
       const somaRec=v.reduce((s2,r)=>s2+(Number(r.rec)||0),0);
       const somaRef=IR_MADALENA.reduce((s2,r)=>s2+(Number(r.prev)||0),0);
       const trocar=somaRec===0&&(Math.abs(somaPrev-1518833.98)<1||v.length!==IR_MADALENA.length||Math.abs(somaPrev-somaRef)>1);
       if(trocar){nd[k]=IR_MADALENA;dbSet(obraId,k,IR_MADALENA);}
       else nd[k]=v;
      }
      else if(v!==null&&v!==undefined)nd[k]=v;
      else if(CHAVES_MADALENA.indexOf(k)>=0){nd[k]=defs[k];dbSet(obraId,k,defs[k]);}
      else nd[k]=Array.isArray(defs[k])?[]:(k==="caixa"?{saldo:0,hist:[]}:(typeof defs[k]==="object"?{}:defs[k]));
     } else if(obraId!=="lote_d18"){
      // Obras novas começam vazias — nunca herdam os dados da D18
      nd[k]=v||(Array.isArray(defs[k])?[]:defs[k]);
     } else {
      nd[k]=v||defs[k];
     }
    }
 setD(nd);setLoading(false);
 })();
 },[obraId]);
 useEffect(()=>{
  (async()=>{
   const salva=await dbGet("_sistema","obras");
   let lista=(salva&&Array.isArray(salva)&&salva.length>0)?salva:OBRAS_SEED.slice();
   // Obras de referência (que já têm dados cadastrados no código) entram sozinhas
   // uma única vez — se você excluir depois, elas não voltam.
   const jaInseridas=(await dbGet("_sistema","obras_ref"))||[];
   const faltando=OBRAS_REF.filter(o=>{
    if(jaInseridas.indexOf(o.id)>=0)return false;
    for(let i=0;i<lista.length;i++){
     if(lista[i].id===o.id)return false;
     const k=chaveObra(lista[i].id,lista[i]);
     if(k&&k===chaveObra(o.id,o))return false;
    }
    return true;
   });
   if(faltando.length>0)lista=lista.concat(faltando);
   // Contrato da Madalena revisado para R$ 1.200.000 (orçamento 08/2026)
   let ajustou=false;
   lista=lista.map(o=>{
    if(chaveObra(o.id,o)==="madalena"&&Number(o.contrato)===1518833.98){ajustou=true;return{...o,contrato:1200000};}
    return o;
   });
   // A lista aparece na tela primeiro; a gravação vem depois e não bloqueia nada.
   setObras(lista);
   if(faltando.length>0||ajustou||!salva||!Array.isArray(salva)||salva.length===0){
    dbSet("_sistema","obras",lista);
    dbSet("_sistema","obras_ref",jaInseridas.concat(faltando.map(o=>o.id)));
   }
  })();
 },[]);
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
 if(!obraId)return <ObrasList user={user} obras={obras} onSel={id=>{setObraId(id);setTab(0);}} onOut={()=>setUser(null)}
    onNova={o=>{
     const n=[...obras,o];setObras(n);dbSet("_sistema","obras",n);
     const vazio={caixa:{saldo:0,hist:[]},custos:[],acomp:[],estoque:[],consumo:[],msgs:[],compras:[],rec:[],emp:[],emprestimos:[],lidos:{},crono:{},tarefas:[],equipe:[]};
     Object.keys(vazio).forEach(k=>dbSet(o.id,k,vazio[k]));
    }}
    onDel={id=>{
     const n=obras.filter(o=>o.id!==id);setObras(n);dbSet("_sistema","obras",n);
    }}
    onUpd={ob=>{
     const n=obras.map(o=>o.id===ob.id?ob:o);setObras(n);dbSet("_sistema","obras",n);
    }}/>;
 if(loading)return <div style={{minHeight:"100vh",background:"#f8fafc",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#f59e0b",fontSize:16,fontWeight:700}}>Carregando...</span></div>;
 const role=user.role;
 const TA=["Dashboard","Atividades","Orçamento","Custos","Recebimentos","Caixa","Empréstimo","Cronograma","Medições","Empreitada","Estoque","Compras","Colaboradores","Comunicação"];
 const TE=["Dashboard","Medições","Estoque","Compras","Colaboradores","Comunicação"];
 const TC=["Avanço da Obra","Meus Pagamentos"];
 const tabs=role==="admin"?TA:role==="eng"?TE:TC;
 const obra=obras.find(o=>o.id===obraId);
 setSemBase(obra?obra.inicio:null); // semanas contadas a partir do início real da obra
 // Notificações: controle de leitura por usuário (fica salvo junto da obra)
 const lidos=D.lidos||{};
 const meuKey=user.email||user.nome;
 const vistas=Number(lidos[meuKey]||0);
 const msgsAll=(D&&D.msgs)||[];
 const naoLidas=msgsAll.slice(vistas).filter(m=>m.role!==role).length;
 const marcarLidas=()=>{if(msgsAll.length!==vistas)sv("lidos",{...lidos,[meuKey]:msgsAll.length});};
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
      <button onClick={()=>{const ab=!showNotifs;setShowNotifs(ab);if(ab)marcarLidas();}} title="Notificações" style={{background:"#f1f5f9",border:"none",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:15,position:"relative"}}>
       🔔
       {naoLidas>0?(<span style={{position:"absolute",top:1,right:1,background:"#ef4444",color:"#fff",borderRadius:"50%",width:15,height:15,fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{naoLidas}</span>):null}
      </button>
      {showNotifs&&<div onClick={()=>setShowNotifs(false)} style={{position:"fixed",inset:0,zIndex:90}}/>}
      {showNotifs&&(
       <div style={{position:"absolute",right:0,top:44,background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,boxShadow:"0 8px 32px #0003",zIndex:100,width:310,maxHeight:380,overflowY:"auto"}}>
        <div style={{padding:"10px 14px",fontWeight:700,fontSize:13,color:"#1e2d5a",borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between"}}>
         Notificações
         <button onClick={()=>setShowNotifs(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:16}}>×</button>
        </div>
        {(D&&D.msgs||[]).length===0&&<div style={{padding:20,color:"#94a3b8",fontSize:13,textAlign:"center"}}>Nenhuma notificação ainda.</div>}
        {[...msgsAll].reverse().map((m,i)=>(
         <div key={i} style={{padding:"10px 14px",borderBottom:"1px solid #f1f5f9",background:(msgsAll.length-1-i)>=vistas&&m.role!==role?"#fffbeb":"#fff"}}>
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
 {tab===1&&<Tarefas T={D.tarefas||[]} sv={v=>sv("tarefas",v)}/>}
 {tab===2&&<Orcamento obraId={obraId} obra={obra}/>}
 {tab===3&&<Custos C={D.custos||[]} sv={v=>sv("custos",v)}/>}
 {tab===4&&<Recebimentos R={D.rec||[]} sv={v=>sv("rec",v)} obra={obra}/>}
 {tab===5&&<Caixa D={D} obra={obra} sv={v=>sv("caixa",v)}/>}
 {tab===6&&<Emprestimos EM={D.emprestimos||[]} sv={v=>sv("emprestimos",v)}/>}
 {tab===7&&<Cronograma D={D} obra={obra} sv={v=>sv("crono",v)} svRec={v=>sv("rec",v)}/>}
 {tab===8&&<Medicoes A={D.acomp||[]} sv={v=>sv("acomp",v)} obra={obra}/>}
 {tab===9&&<Empreitada E={D.emp||[]} sv={v=>sv("emp",v)} A={D.acomp||[]} svA={v=>sv("acomp",v)}/>}
 {tab===10&&<Estoque ES={D.estoque||[]} CON={D.consumo||[]} svE={v=>sv("estoque",v)} svC={v=>sv("consumo",v)}/>}
 {tab===11&&<Compras CP={D.compras||[]} sv={v=>sv("compras",v)} svE={v=>sv("estoque",v)} ES={D.estoque||[]} obra={obra}/>}
     {tab===12&&<Colaboradores E={D.equipe||[]} sv={v=>sv("equipe",v)} podeEditar={true}/>}
     {tab===13&&<Comunicacao C={D.custos||[]} sv={v=>sv("custos",v)} msgs={D.msgs||[]} svM={v=>sv("msgs",v)} user={user}/>}
 </>}
 {role==="eng"&&<>
 {tab===0&&<DashboardEng D={D} obra={obra}/>}
 {tab===1&&<Medicoes A={D.acomp||[]} sv={v=>sv("acomp",v)} obra={obra} user={user} svM={v=>sv("msgs",v)} msgs={D.msgs||[]}/>}
 {tab===2&&<Estoque ES={D.estoque||[]} CON={D.consumo||[]} svE={v=>sv("estoque",v)} svC={v=>sv("consumo",v)}/>}
 {tab===3&&<Compras CP={D.compras||[]} sv={v=>sv("compras",v)} svE={v=>sv("estoque",v)} ES={D.estoque||[]} obra={obra}/>}
 {tab===4&&<Colaboradores E={D.equipe||[]} sv={v=>sv("equipe",v)} podeEditar={true}/>}
 {tab===5&&<Comunicacao C={D.custos||[]} sv={v=>sv("custos",v)} msgs={D.msgs||[]} svM={v=>sv("msgs",v)} user={user} engOnly={true}/>}
 </>}
 {role==="cli"&&<>
 {tab===0&&<CliAvanço A={D.acomp||[]} obra={obra}/>}
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
function ObrasList({user,obras,onSel,onOut,onNova,onDel,onUpd}){
 const [modal,setModal]=useState(false);
 const [form,setForm]=useState({nome:"",cliente:"",local:"",inicio:"",contrato:0});
 const [edit,setEdit]=useState(null); // obra sendo editada
 const [eForm,setEForm]=useState({});
 const [verArq,setVerArq]=useState(false);
 const [painel,setPainel]=useState(false);
 const [dadosGerais,setDadosGerais]=useState(null);
 const [carregandoPainel,setCarregandoPainel]=useState(false);
 const abrirPainel=()=>{
  setPainel(true);
  if(dadosGerais)return;
  setCarregandoPainel(true);
  dbGetMany(["caixa","custos","rec","emprestimos","acomp","crono"]).then(mapa=>{
   setDadosGerais(mapa||{});setCarregandoPainel(false);
  });
 };
 const permitidas=user.obras||[];
 const visiveis=user.obras==="*"?obras:obras.filter(o=>{
  if(permitidas.indexOf(o.id)>=0)return true;
  const k=chaveObra(o.id,o);
  return !!k&&permitidas.indexOf(k)>=0;
 });
 const isArq=o=>(o.status||"").toLowerCase().indexOf("arquiv")>=0;
 const ativas=visiveis.filter(o=>!isArq(o));
 const arquivadas=visiveis.filter(o=>isArq(o));
 const criar=()=>{
  if(!form.nome.trim()){alert("Informe o nome da obra.");return;}
  const id="obra_"+Date.now();
  onNova({id,nome:form.nome,cliente:form.cliente||"—",local:form.local||"—",inicio:form.inicio||new Date().toLocaleDateString("pt-BR"),contrato:Number(form.contrato)||0,status:"Em andamento"});
  setModal(false);setForm({nome:"",cliente:"",local:"",inicio:"",contrato:0});
 };
 const abrirEdit=(o,reativar)=>{
  setEdit(o);
  setEForm({nome:o.nome,cliente:o.cliente||"",local:o.local||"",inicio:o.inicio||"",contrato:o.contrato||0,status:reativar?"Em andamento":(o.status||"Em andamento")});
 };
 const salvarEdit=()=>{
  if(!eForm.nome||!eForm.nome.trim()){alert("Informe o nome da obra.");return;}
  if(eForm.inicio&&!parseBRDate(eForm.inicio)){alert("Data de início inválida. Use o formato dd/mm/aaaa.");return;}
  onUpd({...edit,nome:eForm.nome,cliente:eForm.cliente||"—",local:eForm.local||"—",inicio:eForm.inicio||edit.inicio,contrato:Number(eForm.contrato)||0,status:eForm.status||"Em andamento"});
  setEdit(null);
 };
 const arquivar=o=>{
  if(!confirm('Arquivar a obra "'+o.nome+'"? Os dados continuam salvos e você pode reativar depois.'))return;
  onUpd({...o,status:"Arquivada"});
 };
 const Card=o=>{
  const arq=isArq(o);
  const ini=parseBRDate(o.inicio);
  return(
   <div key={o.id} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:24,boxShadow:"0 1px 4px #0001",position:"relative",opacity:arq?0.75:1}}>
    <div onClick={()=>onSel(o.id)} style={{cursor:"pointer"}}>
     <div style={{display:"flex",justifyContent:"space-between",marginBottom:12,gap:8}}>
      <span style={{fontSize:10,fontWeight:700,color:arq?"#64748b":"#f59e0b",background:arq?"#f1f5f9":"#fef3c7",padding:"3px 10px",borderRadius:20,whiteSpace:"nowrap"}}>{(o.status||"").toUpperCase()}</span>
      <span style={{fontSize:10,color:"#64748b",textAlign:"right"}}>Início {o.inicio||"—"}</span>
     </div>
     <div style={{fontSize:16,fontWeight:800,color:"#1e293b",marginBottom:4,paddingRight:60}}>{o.nome}</div>
     <div style={{fontSize:12,color:"#64748b",marginBottom:2}}>Cliente: {o.cliente}</div>
     <div style={{fontSize:12,color:"#64748b",marginBottom:16}}>Local: {o.local}</div>
     {user.role!=="eng"?(<>
      <div style={{fontSize:20,fontWeight:800,color:"#f59e0b"}}>{fmtBR(o.contrato)}</div>
      <div style={{fontSize:11,color:"#64748b"}}>Valor do contrato</div>
     </>):(
      <div style={{fontSize:12,color:"#94a3b8"}}>Toque para abrir o painel da obra</div>
     )}
    </div>
    {user.role==="admin"&&(
     <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:14,paddingTop:12,borderTop:"1px solid #f1f5f9"}}>
      <button onClick={()=>abrirEdit(o,false)} style={{background:"#f1f5f9",border:"none",color:"#475569",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:700}}>✏️ Editar</button>
      {arq?(
       <button onClick={()=>abrirEdit(o,true)} style={{background:"#dcfce7",border:"none",color:"#16a34a",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:700}}>♻️ Reativar</button>
      ):(
       <button onClick={()=>arquivar(o)} style={{background:"#e0e7ff",border:"none",color:"#4338ca",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:700}}>📦 Arquivar</button>
      )}
      {o.id!=="lote_d18"&&(
       <button onClick={()=>{if(confirm('Excluir a obra "'+o.nome+'" e todos os seus dados?'))onDel(o.id);}} style={{background:"#fee2e2",border:"none",color:"#ef4444",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:700}}>Excluir</button>
      )}
     </div>
    )}
   </div>
  );
 };
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
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,flexWrap:"wrap",marginBottom:24}}>
     <div>
      <h2 style={{fontSize:22,fontWeight:800,color:"#f59e0b",marginBottom:4}}>Obras</h2>
      <p style={{color:"#64748b",margin:0}}>Selecione uma obra para acessar o painel completo.</p>
     </div>
     {user.role==="admin"&&!painel&&(
      <button onClick={abrirPainel} style={{...BP,whiteSpace:"nowrap"}}>📊 Painel Geral</button>
     )}
    </div>
    {user.role==="admin"&&painel&&(
     <PainelGeral obras={visiveis} dados={dadosGerais||{}} carregando={carregandoPainel} onFechar={()=>setPainel(false)}/>
    )}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
     {ativas.map(o=>Card(o))}
     {user.role==="admin"&&(
      <div onClick={()=>setModal(true)} style={{background:"#fff",border:"2px dashed #cbd5e1",borderRadius:14,padding:24,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#94a3b8",minHeight:180,cursor:"pointer"}}>
       <div style={{fontSize:32,marginBottom:8}}>+</div>
       <div style={{fontSize:14,fontWeight:700,color:"#64748b"}}>Nova Obra</div>
       <div style={{fontSize:11,marginTop:4}}>Começa vazia</div>
      </div>
     )}
    </div>
    <div style={{fontSize:10,color:"#cbd5e1",marginTop:22}}>Versão {VERSAO}</div>
    {arquivadas.length>0&&(
     <div style={{marginTop:32}}>
      <button onClick={()=>setVerArq(v=>!v)} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:"10px 16px",cursor:"pointer",fontSize:13,fontWeight:700,color:"#475569"}}>
       {verArq?"▾":"▸"} Obras arquivadas ({arquivadas.length})
      </button>
      {verArq&&(
       <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16,marginTop:16}}>
        {arquivadas.map(o=>Card(o))}
       </div>
      )}
     </div>
    )}
   </div>
   {modal&&(
    <Modal onClose={()=>setModal(false)} title="Nova Obra">
     <p style={{fontSize:12,color:"#94a3b8",margin:"0 0 14px"}}>A obra será criada vazia. Depois você insere as atividades, custos e orçamento próprios dela.</p>
     <div style={{display:"grid",gap:10}}>
      <label style={{fontSize:12,color:"#64748b"}}>Nome da obra *
       <input value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} placeholder="Ex: LOTE D19 — Residência Silva" style={IS} autoFocus/>
      </label>
      <label style={{fontSize:12,color:"#64748b"}}>Cliente
       <input value={form.cliente} onChange={e=>setForm(f=>({...f,cliente:e.target.value}))} style={IS}/>
      </label>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
       <label style={{fontSize:12,color:"#64748b"}}>Local
        <input value={form.local} onChange={e=>setForm(f=>({...f,local:e.target.value}))} placeholder="Ananindeua/PA" style={IS}/>
       </label>
       <label style={{fontSize:12,color:"#64748b"}}>Início real
        <input value={form.inicio} onChange={e=>setForm(f=>({...f,inicio:e.target.value}))} placeholder="dd/mm/aaaa" style={IS}/>
       </label>
      </div>
      <label style={{fontSize:12,color:"#64748b"}}>Valor do contrato (R$)
       <input type="number" value={form.contrato} onChange={e=>setForm(f=>({...f,contrato:e.target.value}))} style={IS}/>
      </label>
     </div>
     <div style={{display:"flex",gap:10,marginTop:20}}>
      <button onClick={criar} style={{...BP,flex:1}}>Criar Obra</button>
      <button onClick={()=>setModal(false)} style={{...BS,flex:1}}>Cancelar</button>
     </div>
    </Modal>
   )}
   {edit&&(
    <Modal onClose={()=>setEdit(null)} title="Editar Obra">
     <div style={{display:"grid",gap:10}}>
      <label style={{fontSize:12,color:"#64748b"}}>Nome da obra *
       <input value={eForm.nome||""} onChange={e=>setEForm(f=>({...f,nome:e.target.value}))} style={IS}/>
      </label>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
       <label style={{fontSize:12,color:"#64748b"}}>Cliente
        <input value={eForm.cliente||""} onChange={e=>setEForm(f=>({...f,cliente:e.target.value}))} style={IS}/>
       </label>
       <label style={{fontSize:12,color:"#64748b"}}>Local
        <input value={eForm.local||""} onChange={e=>setEForm(f=>({...f,local:e.target.value}))} style={IS}/>
       </label>
      </div>
      <label style={{fontSize:12,color:"#64748b"}}>Data de início real (dd/mm/aaaa)
       <input value={eForm.inicio||""} onChange={e=>setEForm(f=>({...f,inicio:e.target.value}))} placeholder="dd/mm/aaaa" style={IS}/>
      </label>
      <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:8,padding:"9px 12px",fontSize:11,color:"#1e40af",lineHeight:1.45}}>
       Data usada como marco inicial da obra nos relatórios. As medições são numeradas em sequência (S1, S2, S3…), independentemente do dia em que você as faz.
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
       <label style={{fontSize:12,color:"#64748b"}}>Situação
        <select value={eForm.status||"Em andamento"} onChange={e=>setEForm(f=>({...f,status:e.target.value}))} style={IS}>
         {["Em andamento","Paralisada","Concluída","Arquivada"].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
       </label>
       <label style={{fontSize:12,color:"#64748b"}}>Valor do contrato (R$)
        <input type="number" value={eForm.contrato||0} onChange={e=>setEForm(f=>({...f,contrato:e.target.value}))} style={IS}/>
       </label>
      </div>
     </div>
     <div style={{display:"flex",gap:10,marginTop:20}}>
      <button onClick={salvarEdit} style={{...BP,flex:1}}>Salvar</button>
      <button onClick={()=>setEdit(null)} style={{...BS,flex:1}}>Cancelar</button>
     </div>
    </Modal>
   )}
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
 const vazio=A.length===0&&C.length===0;
 const tC=C.reduce((s,c)=>s+(c.total||0),0);
 const tP=C.reduce((s,c)=>s+(c.pago||0),0);
 const tR=R.reduce((s,r)=>s+(r.rec||0),0);
 const caixaObj=D.caixa||{saldo:0};
 const aReceberV=R.reduce((s,r)=>s+Math.max((r.prev||0)-(r.rec||0),0),0);
 const aPagarObra=Math.max(tC-tP,0);
 // Empréstimos: fora do custo da obra, mas somam no total a pagar
 const EMP=D.emprestimos||[];
 const empCredito=EMP.reduce((s,e)=>s+(Number(e.valorContratado)||0),0);
 const empTotalDevido=EMP.reduce((s,e)=>{
  const desc=(e.pagamentos||[]).reduce((ss,p)=>ss+(Number(p.desconto)||0),0);
  return s+Math.max((Number(e.valorTotal)||Number(e.valorContratado)||0)-desc,0);
 },0);
 const empPago=EMP.reduce((s,e)=>s+(e.pagamentos||[]).reduce((ss,p)=>ss+(Number(p.valor)||0),0),0);
 const empSaldo=Math.max(empTotalDevido-empPago,0);
 // Dinheiro do empréstimo que já entrou na conta mas ainda não foi somado ao saldo informado
 const empForaDoCaixa=EMP.reduce((s,e)=>{
  if(e.noCaixa)return s;
  const lib=(e.valorLiberado===undefined||e.valorLiberado===null||e.valorLiberado===""?Number(e.valorContratado)||0:Number(e.valorLiberado)||0);
  return s+lib;
 },0);
 const aPagarV=aPagarObra+empSaldo;
 const saldoCaixa=Number(caixaObj.saldo)||0;
 const entradasV=saldoCaixa+aReceberV+empForaDoCaixa;
 const lucroRealV=entradasV-aPagarV;
 const conclusao=calcConclusaoGeral(A);
 const [drillPav,setDrillPav]=useState(null);

 const pavs=etapasDe(A);
 const COLORS={};pavs.forEach(p=>{COLORS[p]=corEtapa(p,A);});
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

 const pavCosts=etapasDe(C).map(pav=>({
  label:pav,value:C.filter(c=>(c.pav||"Outros")===pav).reduce((s,c)=>s+(c.total||0),0)
 })).filter(d=>d.value>0).sort((a,b)=>b.value-a.value);
 const CCOLORS=PALETA;

 return(
  <div>
   <h2 style={{fontSize:20,fontWeight:800,color:"#f59e0b",marginBottom:4}}>Dashboard</h2>
   <p style={{fontSize:13,color:"#64748b",marginBottom:20}}>Início: {(obra&&obra.inicio)} · Cliente: {(obra&&obra.cliente)}</p>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:24}}>
    <KCard label="Valor do Contrato" value={fmtBR(obra?obra.contrato:0)} color="#f59e0b"/>
    <KCard label="Custo Total Previsto" value={fmtBR(tC)} color="#ef4444" sub={pct(tC/(obra&&obra.contrato?obra.contrato:1)*100)+" do contrato"}/>
    <KCard label="Total Recebido" value={fmtBR(tR)} color="#3b82f6" sub={"Devedor: "+fmtBR((obra?obra.contrato:0)-tR)}/>
    <KCard label="Total Pago Custos" value={fmtBR(tP)} color="#8b5cf6" sub={pct(tC>0?tP/tC*100:0)+" do custo"}/>
    <KCard label="Lucro Real Projetado" value={fmtBR(lucroRealV)} color={lucroRealV>=0?"#059669":"#ef4444"} sub={"Entradas "+fmtBR(entradasV)+" − saídas "+fmtBR(aPagarV)}/>
   </div>

   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:24}}>
    <KCard label="A Receber" value={fmtBR(aReceberV)} color="#3b82f6" sub={"parcelas do contrato em aberto"+(empForaDoCaixa>0?" · + "+fmtBR(empForaDoCaixa)+" de empréstimo fora do caixa":"")}/>
    <KCard label="A Pagar" value={fmtBR(aPagarV)} color="#ef4444" sub={"custo de obra "+fmtBR(aPagarObra)+(empSaldo>0?" + empréstimo "+fmtBR(empSaldo):"")}/>
    <KCard label="Em Caixa" value={fmtBR(saldoCaixa)} color="#8b5cf6" sub="saldo informado na aba Caixa"/>
   </div>

   {EMP.length>0&&(
    <div style={{background:"#fff",borderRadius:12,padding:20,marginBottom:20,boxShadow:"0 1px 4px #0001",border:"1px solid #e2e8f0",borderLeft:"4px solid #0ea5e9"}}>
     <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8,marginBottom:12}}>
      <div>
       <div style={{fontWeight:800,fontSize:15,color:"#1e293b"}}>Crédito Contratado</div>
       <div style={{fontSize:11,color:"#64748b"}}>Empréstimos não entram no custo da obra — visível apenas para o administrador</div>
      </div>
      <div style={{fontSize:24,fontWeight:800,color:"#0ea5e9"}}>{fmtBR(empCredito)}</div>
     </div>
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:12}}>
      <div style={{background:"#f8fafc",borderRadius:8,padding:"10px 12px"}}>
       <div style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase"}}>Total a quitar</div>
       <div style={{fontSize:16,fontWeight:800,color:"#1e293b"}}>{fmtBR(empTotalDevido)}</div>
      </div>
      <div style={{background:"#f8fafc",borderRadius:8,padding:"10px 12px"}}>
       <div style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase"}}>Já pago</div>
       <div style={{fontSize:16,fontWeight:800,color:"#16a34a"}}>{fmtBR(empPago)}</div>
      </div>
      <div style={{background:"#f8fafc",borderRadius:8,padding:"10px 12px"}}>
       <div style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase"}}>Saldo devedor</div>
       <div style={{fontSize:16,fontWeight:800,color:"#ef4444"}}>{fmtBR(empSaldo)}</div>
      </div>
      <div style={{background:"#f8fafc",borderRadius:8,padding:"10px 12px"}}>
       <div style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase"}}>Custo do crédito</div>
       <div style={{fontSize:16,fontWeight:800,color:"#f59e0b"}}>{fmtBR(Math.max(empTotalDevido-empCredito,0))}</div>
       <div style={{fontSize:10,color:"#94a3b8"}}>é o que reduz o lucro</div>
      </div>
     </div>
     {empForaDoCaixa>0&&(
      <div style={{fontSize:11,color:"#92400e",background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,padding:"8px 12px",marginBottom:10,lineHeight:1.45}}>
       💵 {fmtBR(empForaDoCaixa)} entraram na conta e estão contando como entrada na projeção (marcados como fora do saldo em caixa).
      </div>
     )}
     <div style={{background:"#f1f5f9",borderRadius:99,height:10,overflow:"hidden"}}>
      <div style={{width:`${empTotalDevido>0?Math.min(empPago/empTotalDevido*100,100):0}%`,height:"100%",background:"#0ea5e9",borderRadius:99}}/>
     </div>
     <div style={{fontSize:11,color:"#64748b",marginTop:6}}>{empTotalDevido>0?pct(empPago/empTotalDevido*100):"0%"} da quitação · detalhes na aba Empréstimo</div>
    </div>
   )}
   
   <div style={{background:"#fff",borderRadius:12,padding:20,marginBottom:20,boxShadow:"0 1px 4px #0001",border:"1px solid #e2e8f0"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
     <div><div style={{fontWeight:800,fontSize:16,color:"#1e293b"}}>Conclusão Total da Obra</div><div style={{fontSize:12,color:"#64748b"}}>Média ponderada por dias de atividade ({totalDiasObra(A).toLocaleString("pt-BR")} dias totais)</div></div>
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

// ── OBRA EMEIF MADALENA RAAF — dados da planilha enviada pelo cliente ──
// Orçamento (o que se recebe), custo (o que se paga) e cronograma físico
// vieram do arquivo "REFORMA EMEIF MADALENA RAAF - Orçamento Sintético.xlsx".
// Ajustes combinados: prazo de 6 meses (fevereiro incorporado a janeiro),
// os R$ 90.000 de "NÃO PREVISTO (10%)" saíram de ARTEFATOS e viraram a etapa
// CUSTOS NÃO PREVISTOS diluída nos 6 meses, e a COBERTURA da Área Comum
// (ausente no cronograma original) foi alocada em janeiro.
const ORC_MADALENA={
 "SERVIÇOS PRELIMINARES E ADMINISTRATIVO":{
  "SERVIÇOS PRELIMINARES E ADMINISTRATIVO":[{cod:"93565",desc:"ENGENHEIRO CIVIL DE OBRA JUNIOR COM ENCARGOS COMPLEMENTARES",und:"MES",qtd:5,unit:29756.05,total:148780.25},{cod:"94295",desc:"MESTRE DE OBRAS COM ENCARGOS COMPLEMENTARES",und:"MES",qtd:5,unit:9833.78,total:49168.9},{cod:"00000002",desc:"CONTAINER DE ENTULHO 5M3",und:"unidade",qtd:20,unit:869.09,total:17381.8}],
 },
 "SALAS DE AULA":{
  "REMOÇÕES E DEMOLIÇÕES":[{cod:"97622",desc:"DEMOLIÇÃO DE ALVENARIA DE BLOCO FURADO, DE FORMA MANUAL, SEM REAPROVEITAMENTO. AF_09/2023",und:"m³",qtd:74.77,unit:85.87,total:6420.49},{cod:"97640",desc:"REMOÇÃO DE FORROS DE DRYWALL, PVC E FIBROMINERAL, DE FORMA MANUAL, SEM REAPROVEITAMENTO. AF_09/2023",und:"m²",qtd:409.6,unit:2.94,total:1204.22},{cod:"97665",desc:"REMOÇÃO DE LUMINÁRIAS, DE FORMA MANUAL, SEM REAPROVEITAMENTO. AF_09/2023",und:"UN",qtd:32,unit:2.7,total:86.4},{cod:"97650",desc:"REMOÇÃO DE TRAMA DE MADEIRA PARA COBERTURA, DE FORMA MANUAL, SEM REAPROVEITAMENTO. AF_09/2023",und:"m²",qtd:88.45,unit:11.51,total:1018.05},{cod:"97644",desc:"REMOÇÃO DE PORTAS, DE FORMA MANUAL, SEM REAPROVEITAMENTO. AF_09/2023",und:"m²",qtd:30.24,unit:14.36,total:434.24},{cod:"97647",desc:"REMOÇÃO DE TELHAS DE FIBROCIMENTO METÁLICA E CERÂMICA, DE FORMA MANUAL, SEM REAPROVEITAMENTO. AF_09/2023",und:"m²",qtd:66.34,unit:5.32,total:352.92},{cod:"97660",desc:"REMOÇÃO DE INTERRUPTORES/TOMADAS ELÉTRICAS, DE FORMA MANUAL, SEM REAPROVEITAMENTO. AF_09/2023",und:"UN",qtd:64,unit:0.99,total:63.36}],
  "PAREDE":[{cod:"103335",desc:"ALVENARIA DE VEDAÇÃO DE BLOCOS CERÂMICOS FURADOS NA HORIZONTAL DE 14X9X19 CM (ESPESSURA 14 CM, BLOCO DEITADO) E ARGAMASSA DE ASSENTAMENTO COM PREPARO MANUAL. AF_12/2021",und:"m²",qtd:344.93,unit:209.06,total:72111.06},{cod:"87884",desc:"CHAPISCO APLICADO NO TETO OU EM ALVENARIA E ESTRUTURA, COM ROLO PARA TEXTURA ACRÍLICA. ARGAMASSA INDUSTRIALIZADA COM PREPARO MANUAL. AF_10/2022",und:"m²",qtd:689.86,unit:14.67,total:10120.24},{cod:"87777",desc:"EMBOÇO OU MASSA ÚNICA EM ARGAMASSA TRAÇO 1:2:8, PREPARO MANUAL, APLICADA MANUALMENTE EM PANOS DE FACHADA COM PRESENÇA DE VÃOS, ESPESSURA DE 25 MM. AF_08/2022",und:"m²",qtd:689.86,unit:91.35,total:63018.71}],
  "PISO":[{cod:"00000003",desc:"SALVA PISO - INSTALAÇÃO E FORNECIMENTO",und:"m²",qtd:409.8,unit:26.96,total:11048.2},{cod:"00000004",desc:"POLIMENTO E ENCERAMENTO - PISO EM KORODUR",und:"m²",qtd:409.6,unit:62.46,total:25583.61},{cod:"106787",desc:"PISO DE ALTA RESISTÊNCIA TIPO \"KORODUR\" EM AMBIENTES INTERNOS, COM ESPESSURA DE 12 MM, INCLUSO MISTURA EM BETONEIRA, COLOCAÇÃO DAS JUNTAS, APLICAÇÃO DO PISO, 4 POLIMENTOS COM POLITRIZ, ESTUCAMENTO, SELADOR E CERA.. AF_02/2026",und:"m²",qtd:21.6,unit:199.48,total:4308.76}],
  "INSTALAÇÃO ELÉTRICA":[{cod:"97360",desc:"QUADRO DE MEDIÇÃO GERAL DE ENERGIA COM 12 MEDIDORES - FORNECIMENTO E INSTALAÇÃO. AF_07/2025",und:"UN",qtd:2,unit:7662.95,total:15325.9},{cod:"104475",desc:"COMPOSIÇÃO PARAMÉTRICA DE PONTO ELÉTRICO DE TOMADA DE USO GERAL 2P+T (10A/250V) EM EDIFÍCIO RESIDENCIAL COM ELETRODUTO EMBUTIDO EM RASGOS NAS PAREDES, INCLUSO TOMADA, ELETRODUTO, CABO, RASGO, QUEBRA E CHUMBAMENTO. AF_11/2022",und:"UN",qtd:96,unit:219.75,total:21096},{cod:"104477",desc:"COMPOSIÇÃO PARAMÉTRICA DE PONTO ELÉTRICO DE ILUMINAÇÃO, COM INTERRUPTOR SIMPLES, EM EDIFÍCIO RESIDENCIAL COM ELETRODUTO EMBUTIDO SEM NECESSIDADE DE RASGOS, INCLUSO TOMADA, ELETRODUTO, CABO E QUEBRA (SEM LUMINÁRIA E LÂMPADA). AF_11/2022",und:"UN",qtd:32,unit:210.92,total:6749.44},{cod:"104476",desc:"COMPOSIÇÃO PARAMÉTRICA DE PONTO ELÉTRICO DE TOMADA DE USO ESPECÍFICO 2P+T (20A/250V) EM EDIFÍCIO RESIDENCIAL COM ELETRODUTO EMBUTIDO EM RASGOS NAS PAREDES, INCLUSO TOMADA, ELETRODUTO, CABO, RASGO, QUEBRA E CHUMBAMENTO (EXCETO CHUVEIRO). AF_11/2022",und:"UN",qtd:16,unit:279.53,total:4472.48}],
  "ILUMINAÇÃO":[{cod:"103784",desc:"LUMINÁRIA TIPO PLAFON QUADRADA, DE SOBREPOR, COM LED DE 18 W - FORNECIMENTO E INSTALAÇÃO. AF_09/2024",und:"UN",qtd:32,unit:28.21,total:902.72}],
  "ESQUADRIAS":[{cod:"94573",desc:"JANELA DE ALUMÍNIO DE CORRER COM 4 FOLHAS PARA VIDROS (VIDROS INCLUSOS), COM BANDEIRA, BATENTE/ REQUADRO 6 A 14 CM, ACABAMENTO COM ACETATO OU BRILHANTE, FIXAÇÃO COM PARAFUSO, SEM GUARNIÇÃO/ ALIZAR, DIMENSÕES 150X120 CM, VEDAÇÃO COM SILICONE, EXCLUSIVE CONTRAMARCO - FORNECIMENTO E INSTALAÇÃO. AF_11/2024",und:"m²",qtd:105.6,unit:400.04,total:42244.22},{cod:"94572",desc:"JANELA DE ALUMÍNIO DE CORRER COM 3 FOLHAS (2 VENEZIANAS E 1 FOLHA PARA VIDRO,VIDRO INCLUSO), BATENTE/ REQUADRO 6 A 14 CM, SEM ACABAMENTO, FIXAÇÃO COM PARAFUSO, SEM GUARNIÇÃO/ ALIZAR, DIMENSÕES 100X120 CM, VEDAÇÃO COM SILICONE, EXCLUSIVE CONTRAMARCO - FORNECIMENTO E INSTALAÇÃO. AF_11/2024",und:"m²",qtd:0.56,unit:513.71,total:287.67},{cod:"91341",desc:"PORTA EM ALUMÍNIO DE ABRIR TIPO VENEZIANA COM GUARNIÇÃO, FIXAÇÃO COM PARAFUSOS - FORNECIMENTO E INSTALAÇÃO. AF_10/2025",und:"m²",qtd:30.24,unit:747.76,total:22612.26},{cod:"102169",desc:"INSTALAÇÃO DE VIDRO LISO INCOLOR, E = 10 MM, EM ESQUADRIA DE ALUMÍNIO OU PVC, FIXADO COM BAGUETE. AF_11/2025",und:"m²",qtd:1.44,unit:707.81,total:1019.24}],
  "FORRO":[{cod:"96486",desc:"FORRO EM RÉGUAS DE PVC, LISO, PARA AMBIENTES COMERCIAIS, INCLUSIVE ESTRUTURA BIDIRECIONAL DE FIXAÇÃO. AF_08/2023_PS",und:"m²",qtd:245.76,unit:112.56,total:27662.74}],
  "PINTURA":[{cod:"88485",desc:"FUNDO SELADOR ACRÍLICO, APLICAÇÃO MANUAL EM PAREDE, UMA DEMÃO. AF_04/2023",und:"m²",qtd:689.86,unit:5.46,total:3766.63},{cod:"96131",desc:"APLICAÇÃO MANUAL DE MASSA ACRÍLICA EM PANOS DE FACHADA COM PRESENÇA DE VÃOS, DE EDIFÍCIOS DE MÚLTIPLOS PAVIMENTOS, DUAS DEMÃOS. AF_03/2024",und:"m²",qtd:171.86,unit:35.8,total:6152.58},{cod:"104648",desc:"EMASSAMENTO COM MASSA LÁTEX, APLICAÇÃO EM PAREDE, DUAS DEMÃOS, LIXAMENTO MECANIZADO. AF_04/2023",und:"m²",qtd:258.98,unit:19.46,total:5039.75},{cod:"95625",desc:"APLICAÇÃO MANUAL DE TINTA LÁTEX ACRÍLICA EM SUPERFÍCIES INTERNAS DE SACADA DE EDIFÍCIOS DE MÚLTIPLOS PAVIMENTOS, DUAS DEMÃOS. AF_03/2024",und:"m²",qtd:2154.24,unit:38.36,total:82636.64},{cod:"104645",desc:"EMASSAMENTO COM MASSA LÁTEX, APLICAÇÃO EM TETO, UMA DEMÃO, LIXAMENTO MECANIZADO. AF_04/2023",und:"m²",qtd:40.96,unit:23.1,total:946.17},{cod:"104639",desc:"PINTURA LÁTEX ACRÍLICA ECONÔMICA, APLICAÇÃO MANUAL EM TETO, DUAS DEMÃOS. AF_04/2023",und:"m²",qtd:204.8,unit:17.11,total:3504.12},{cod:"98397",desc:"PINTURA ANTICORROSIVA DE DUTO METÁLICO. AF_03/2024",und:"m²",qtd:77.04,unit:15.87,total:1222.62},{cod:"100759",desc:"PINTURA COM TINTA ALQUÍDICA DE ACABAMENTO (ESMALTE SINTÉTICO BRILHANTE) PULVERIZADA SOBRE SUPERFÍCIES METÁLICAS (EXCETO PERFIL) EXECUTADO EM OBRA (02 DEMÃOS). AF_01/2020_PE",und:"m²",qtd:77.04,unit:67.74,total:5218.68}],
  "COBERTURA":[{cod:"92539",desc:"TRAMA DE MADEIRA COMPOSTA POR RIPAS, CAIBROS E TERÇAS PARA TELHADOS DE ATÉ 2 ÁGUAS PARA TELHA CERÂMICA OU DE CONCRETO, INCLUSO TRANSPORTE VERTICAL. AF_10/2025",und:"m²",qtd:88.45,unit:122.75,total:10857.23},{cod:"100330",desc:"RETIRADA E RECOLOCAÇÃO DE TELHA CERÂMICA CAPA-CANAL, COM ATÉ DUAS ÁGUAS, INCLUSO IÇAMENTO. AF_06/2026",und:"m²",qtd:375.9,unit:33.43,total:12566.33},{cod:"94201",desc:"TELHAMENTO COM TELHA CERÂMICA CAPA-CANAL, TIPO COLONIAL, COM ATÉ 2 ÁGUAS, INCLUSO TRANSPORTE VERTICAL. AF_06/2026",und:"m²",qtd:66.34,unit:71.19,total:4722.74}],
  "MARMORARIA":[{cod:"101965",desc:"PEITORIL LINEAR EM GRANITO OU MÁRMORE, L = 15CM, ASSENTADO COM ARGAMASSA 1:6 COM ADITIVO. AF_11/2020",und:"M",qtd:128,unit:202.39,total:25905.92}],
  "CLIMATIZAÇÃO":[{cod:"97328",desc:"TUBO EM COBRE FLEXÍVEL, DN 3/8\", COM ISOLAMENTO, INSTALADO EM RAMAL DE ALIMENTAÇÃO DE AR-CONDICIONADO - FORNECIMENTO E INSTALAÇÃO. AF_07/2025",und:"M",qtd:128,unit:82.79,total:10597.12}],
 },
 "ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)":{
  "REMOÇÕES E DEMOLIÇÕES":[{cod:"97622",desc:"DEMOLIÇÃO DE ALVENARIA DE BLOCO FURADO, DE FORMA MANUAL, SEM REAPROVEITAMENTO. AF_09/2023",und:"m³",qtd:8.32,unit:85.87,total:714.43},{cod:"97640",desc:"REMOÇÃO DE FORROS DE DRYWALL, PVC E FIBROMINERAL, DE FORMA MANUAL, SEM REAPROVEITAMENTO. AF_09/2023",und:"m²",qtd:155.62,unit:2.94,total:457.52},{cod:"97665",desc:"REMOÇÃO DE LUMINÁRIAS, DE FORMA MANUAL, SEM REAPROVEITAMENTO. AF_09/2023",und:"UN",qtd:21,unit:2.7,total:56.7},{cod:"97650",desc:"REMOÇÃO DE TRAMA DE MADEIRA PARA COBERTURA, DE FORMA MANUAL, SEM REAPROVEITAMENTO. AF_09/2023",und:"m²",qtd:31.12,unit:11.51,total:358.19},{cod:"97644",desc:"REMOÇÃO DE PORTAS, DE FORMA MANUAL, SEM REAPROVEITAMENTO. AF_09/2023",und:"m²",qtd:21.84,unit:14.36,total:313.62},{cod:"97660",desc:"REMOÇÃO DE INTERRUPTORES/TOMADAS ELÉTRICAS, DE FORMA MANUAL, SEM REAPROVEITAMENTO. AF_09/2023",und:"UN",qtd:16,unit:0.99,total:15.84},{cod:"97633",desc:"DEMOLIÇÃO DE REVESTIMENTO CERÂMICO, DE FORMA MANUAL, SEM REAPROVEITAMENTO. AF_09/2023",und:"m²",qtd:141.51,unit:34.39,total:4866.52},{cod:"104790",desc:"DEMOLIÇÃO DE PISO DE CONCRETO SIMPLES, DE FORMA MECANIZADA COM MARTELETE, SEM REAPROVEITAMENTO. AF_09/2023",und:"m³",qtd:4.8,unit:141.43,total:678.86}],
  "PAREDE":[{cod:"103335",desc:"ALVENARIA DE VEDAÇÃO DE BLOCOS CERÂMICOS FURADOS NA HORIZONTAL DE 14X9X19 CM (ESPESSURA 14 CM, BLOCO DEITADO) E ARGAMASSA DE ASSENTAMENTO COM PREPARO MANUAL. AF_12/2021",und:"m²",qtd:29.34,unit:209.06,total:6133.82},{cod:"87884",desc:"CHAPISCO APLICADO NO TETO OU EM ALVENARIA E ESTRUTURA, COM ROLO PARA TEXTURA ACRÍLICA. ARGAMASSA INDUSTRIALIZADA COM PREPARO MANUAL. AF_10/2022",und:"m²",qtd:58.68,unit:14.67,total:860.83},{cod:"87777",desc:"EMBOÇO OU MASSA ÚNICA EM ARGAMASSA TRAÇO 1:2:8, PREPARO MANUAL, APLICADA MANUALMENTE EM PANOS DE FACHADA COM PRESENÇA DE VÃOS, ESPESSURA DE 25 MM. AF_08/2022",und:"m²",qtd:58.68,unit:91.35,total:5360.41}],
  "PISO":[{cod:"00000003",desc:"SALVA PISO - INSTALAÇÃO E FORNECIMENTO",und:"m²",qtd:155.62,unit:26.96,total:4195.51},{cod:"00000004",desc:"POLIMENTO E ENCERAMENTO - PISO EM KORODUR",und:"m²",qtd:172.22,unit:62.46,total:10756.86},{cod:"87767",desc:"CONTRAPISO EM ARGAMASSA TRAÇO 1:4 (CIMENTO E AREIA), PREPARO MANUAL, APLICADO EM ÁREAS MOLHADAS SOBRE IMPERMEABILIZAÇÃO, ACABAMENTO NÃO REFORÇADO, ESPESSURA 4CM. AF_07/2021",und:"m²",qtd:38.04,unit:99.02,total:3766.72},{cod:"104606",desc:"REVESTIMENTO CERÂMICO PARA PISO COM PLACAS TIPO ESMALTADA DE DIMENSÕES 45X45 CM APLICADA EM DIAGONAL EM AMBIENTES DE ÁREA ENTRE 5 M² E 10 M². AF_02/2023_PE",und:"m²",qtd:60.06,unit:102.96,total:6183.77}],
  "IMPERMEABILIZAÇÃO":[{cod:"98552",desc:"IMPERMEABILIZAÇÃO DE SUPERFÍCIE COM MEMBRANA A BASE DE POLIURÉIA, 2 DEMÃOS. AF_09/2023",und:"m²",qtd:38.04,unit:343.85,total:13080.05}],
  "REVESTIMENTO":[{cod:"87267",desc:"REVESTIMENTO CERÂMICO PARA PAREDES INTERNAS COM PLACAS TIPO ESMALTADA DE DIMENSÕES 20X20 CM APLICADAS A MEIA ALTURA DAS PAREDES. AF_02/2023_PE",und:"m²",qtd:81.45,unit:95.22,total:7755.66}],
  "INSTALAÇÃO ELÉTRICA":[{cod:"97360",desc:"QUADRO DE MEDIÇÃO GERAL DE ENERGIA COM 12 MEDIDORES - FORNECIMENTO E INSTALAÇÃO. AF_07/2025",und:"UN",qtd:2,unit:7662.95,total:15325.9},{cod:"104475",desc:"COMPOSIÇÃO PARAMÉTRICA DE PONTO ELÉTRICO DE TOMADA DE USO GERAL 2P+T (10A/250V) EM EDIFÍCIO RESIDENCIAL COM ELETRODUTO EMBUTIDO EM RASGOS NAS PAREDES, INCLUSO TOMADA, ELETRODUTO, CABO, RASGO, QUEBRA E CHUMBAMENTO. AF_11/2022",und:"UN",qtd:48,unit:219.75,total:10548},{cod:"104477",desc:"COMPOSIÇÃO PARAMÉTRICA DE PONTO ELÉTRICO DE ILUMINAÇÃO, COM INTERRUPTOR SIMPLES, EM EDIFÍCIO RESIDENCIAL COM ELETRODUTO EMBUTIDO SEM NECESSIDADE DE RASGOS, INCLUSO TOMADA, ELETRODUTO, CABO E QUEBRA (SEM LUMINÁRIA E LÂMPADA). AF_11/2022",und:"UN",qtd:21,unit:210.92,total:4429.32},{cod:"104476",desc:"COMPOSIÇÃO PARAMÉTRICA DE PONTO ELÉTRICO DE TOMADA DE USO ESPECÍFICO 2P+T (20A/250V) EM EDIFÍCIO RESIDENCIAL COM ELETRODUTO EMBUTIDO EM RASGOS NAS PAREDES, INCLUSO TOMADA, ELETRODUTO, CABO, RASGO, QUEBRA E CHUMBAMENTO (EXCETO CHUVEIRO). AF_11/2022",und:"UN",qtd:4,unit:279.53,total:1118.12}],
  "ILUMINAÇÃO":[{cod:"103784",desc:"LUMINÁRIA TIPO PLAFON QUADRADA, DE SOBREPOR, COM LED DE 18 W - FORNECIMENTO E INSTALAÇÃO. AF_09/2024",und:"UN",qtd:21,unit:28.21,total:592.41}],
  "INSTALAÇÃO HIDROSSANITÁRIA":[{cod:"89957",desc:"PONTO DE CONSUMO TERMINAL DE ÁGUA FRIA (SUBRAMAL) COM TUBULAÇÃO DE PVC, DN 25 MM, INSTALADO EM RAMAL DE ÁGUA, INCLUSOS RASGO E CHUMBAMENTO EM ALVENARIA. AF_12/2014",und:"UN",qtd:26,unit:203.55,total:5292.3},{cod:"104676",desc:"CONJUNTO DE PONTOS DE COLETA DE ESGOTO PARA BANHEIRO (RAMAL DE ESGOTO SANITÁRIO), EM PVC SÉRIE NORMAL, COM TUBOS, CONEXÕES, RALOS, CAIXAS SIFONADAS, CORTES E FIXAÇÕES EM PRÉDIO COM PRUMADA DE DESCIDA DE ESGOTO DENTRO DO BANHEIRO. AF_05/2023_PA",und:"UN",qtd:31,unit:588.61,total:18246.91}],
  "ESQUADRIAS":[{cod:"94573",desc:"JANELA DE ALUMÍNIO DE CORRER COM 4 FOLHAS PARA VIDROS (VIDROS INCLUSOS), COM BANDEIRA, BATENTE/ REQUADRO 6 A 14 CM, ACABAMENTO COM ACETATO OU BRILHANTE, FIXAÇÃO COM PARAFUSO, SEM GUARNIÇÃO/ ALIZAR, DIMENSÕES 150X120 CM, VEDAÇÃO COM SILICONE, EXCLUSIVE CONTRAMARCO - FORNECIMENTO E INSTALAÇÃO. AF_11/2024",und:"m²",qtd:24,unit:400.04,total:9600.96},{cod:"94569",desc:"JANELA DE ALUMÍNIO TIPO MAXIM-AR, BATENTE/ REQUADRO 3 A 14 CM, VIDRO INCLUSO, FIXAÇÃO COM PARAFUSO, SEM GUARNIÇÃO/ ALIZAR, DIMENSÕES 60X80 (A X L) CM, SEM ACABAMENTO, VEDAÇÃO COM SILICONE, EXCLUSIVE CONTRAMARCO - FORNECIMENTO E INSTALAÇÃO. AF_11/2024",und:"m²",qtd:2.16,unit:690.04,total:1490.48},{cod:"91341",desc:"PORTA EM ALUMÍNIO DE ABRIR TIPO VENEZIANA COM GUARNIÇÃO, FIXAÇÃO COM PARAFUSOS - FORNECIMENTO E INSTALAÇÃO. AF_10/2025",und:"m²",qtd:3,unit:747.76,total:2243.28},{cod:"91341",desc:"PORTA EM ALUMÍNIO DE ABRIR TIPO VENEZIANA COM GUARNIÇÃO, FIXAÇÃO COM PARAFUSOS - FORNECIMENTO E INSTALAÇÃO. AF_10/2025",und:"m²",qtd:35.91,unit:747.76,total:26852.06}],
  "FORRO":[{cod:"96486",desc:"FORRO EM RÉGUAS DE PVC, LISO, PARA AMBIENTES COMERCIAIS, INCLUSIVE ESTRUTURA BIDIRECIONAL DE FIXAÇÃO. AF_08/2023_PS",und:"m²",qtd:93.37,unit:112.56,total:10509.72}],
  "PINTURA":[{cod:"88485",desc:"FUNDO SELADOR ACRÍLICO, APLICAÇÃO MANUAL EM PAREDE, UMA DEMÃO. AF_04/2023",und:"m²",qtd:58.68,unit:5.46,total:320.39},{cod:"96131",desc:"APLICAÇÃO MANUAL DE MASSA ACRÍLICA EM PANOS DE FACHADA COM PRESENÇA DE VÃOS, DE EDIFÍCIOS DE MÚLTIPLOS PAVIMENTOS, DUAS DEMÃOS. AF_03/2024",und:"m²",qtd:69.72,unit:35.8,total:2495.97},{cod:"104648",desc:"EMASSAMENTO COM MASSA LÁTEX, APLICAÇÃO EM PAREDE, DUAS DEMÃOS, LIXAMENTO MECANIZADO. AF_04/2023",und:"m²",qtd:45.78,unit:19.46,total:890.87},{cod:"95625",desc:"APLICAÇÃO MANUAL DE TINTA LÁTEX ACRÍLICA EM SUPERFÍCIES INTERNAS DE SACADA DE EDIFÍCIOS DE MÚLTIPLOS PAVIMENTOS, DUAS DEMÃOS. AF_03/2024",und:"m²",qtd:577.54,unit:38.36,total:22154.43},{cod:"98397",desc:"PINTURA ANTICORROSIVA DE DUTO METÁLICO. AF_03/2024",und:"m²",qtd:30.66,unit:15.87,total:486.57},{cod:"100759",desc:"PINTURA COM TINTA ALQUÍDICA DE ACABAMENTO (ESMALTE SINTÉTICO BRILHANTE) PULVERIZADA SOBRE SUPERFÍCIES METÁLICAS (EXCETO PERFIL) EXECUTADO EM OBRA (02 DEMÃOS). AF_01/2020_PE",und:"m²",qtd:30.66,unit:67.74,total:2076.9}],
  "COBERTURA":[{cod:"92539",desc:"TRAMA DE MADEIRA COMPOSTA POR RIPAS, CAIBROS E TERÇAS PARA TELHADOS DE ATÉ 2 ÁGUAS PARA TELHA CERÂMICA OU DE CONCRETO, INCLUSO TRANSPORTE VERTICAL. AF_10/2025",und:"m²",qtd:31.12,unit:122.75,total:3819.98},{cod:"100330",desc:"RETIRADA E RECOLOCAÇÃO DE TELHA CERÂMICA CAPA-CANAL, COM ATÉ DUAS ÁGUAS, INCLUSO IÇAMENTO. AF_06/2026",und:"m²",qtd:132.28,unit:33.43,total:4422.12},{cod:"94201",desc:"TELHAMENTO COM TELHA CERÂMICA CAPA-CANAL, TIPO COLONIAL, COM ATÉ 2 ÁGUAS, INCLUSO TRANSPORTE VERTICAL. AF_06/2026",und:"m²",qtd:23.34,unit:71.19,total:1661.57}],
  "MARMORARIA":[{cod:"98695",desc:"SOLEIRA EM MÁRMORE, LARGURA 15 CM, ESPESSURA 2,0 CM. AF_02/2026",und:"M",qtd:17,unit:167.68,total:2850.56},{cod:"101965",desc:"PEITORIL LINEAR EM GRANITO OU MÁRMORE, L = 15CM, ASSENTADO COM ARGAMASSA 1:6 COM ADITIVO. AF_11/2020",und:"M",qtd:23.6,unit:202.39,total:4776.4}],
  "LOUÇAS":[{cod:"86941",desc:"LAVATÓRIO LOUÇA BRANCA COM COLUNA, 45 X 55 CM OU EQUIVALENTE, PADRÃO MÉDIO, INCLUSO SIFÃO TIPO GARRAFA, VÁLVULA E ENGATE FLEXÍVEL DE 40 CM EM METAL CROMADO, COM TORNEIRA CROMADA DE MESA, PADRÃO MÉDIO - FORNECIMENTO E INSTALAÇÃO. AF_02/2026",und:"UN",qtd:10,unit:1021.13,total:10211.3},{cod:"100868",desc:"BARRA DE APOIO RETA, EM AÇO INOX POLIDO, COMPRIMENTO 80 CM, FIXADA NA PAREDE - FORNECIMENTO E INSTALAÇÃO. AF_02/2026",und:"UN",qtd:1,unit:483.17,total:483.17},{cod:"100858",desc:"MICTÓRIO SIFONADO COM VÁLVULA DE DESCARGA EM LOUÇA BRANCA - PADRÃO MÉDIO - FORNECIMENTO E INSTALAÇÃO. AF_02/2026",und:"UN",qtd:2,unit:1125.39,total:2250.78}],
  "CLIMATIZAÇÃO":[{cod:"97328",desc:"TUBO EM COBRE FLEXÍVEL, DN 3/8\", COM ISOLAMENTO, INSTALADO EM RAMAL DE ALIMENTAÇÃO DE AR-CONDICIONADO - FORNECIMENTO E INSTALAÇÃO. AF_07/2025",und:"M",qtd:20,unit:82.79,total:1655.8}],
 },
 "PRÉDIO ADMINISTRATIVO":{
  "REMOÇÕES E DEMOLIÇÕES":[{cod:"97665",desc:"REMOÇÃO DE LUMINÁRIAS, DE FORMA MANUAL, SEM REAPROVEITAMENTO. AF_09/2023",und:"UN",qtd:18,unit:2.7,total:48.6},{cod:"97645",desc:"REMOÇÃO DE JANELAS, DE FORMA MANUAL, SEM REAPROVEITAMENTO. AF_09/2023",und:"m²",qtd:47.19,unit:37.07,total:1749.33},{cod:"104790",desc:"DEMOLIÇÃO DE PISO DE CONCRETO SIMPLES, DE FORMA MECANIZADA COM MARTELETE, SEM REAPROVEITAMENTO. AF_09/2023",und:"m³",qtd:10.3,unit:141.43,total:1456.72},{cod:"97644",desc:"REMOÇÃO DE PORTAS, DE FORMA MANUAL, SEM REAPROVEITAMENTO. AF_09/2023",und:"m²",qtd:23.52,unit:14.36,total:337.74},{cod:"97660",desc:"REMOÇÃO DE INTERRUPTORES/TOMADAS ELÉTRICAS, DE FORMA MANUAL, SEM REAPROVEITAMENTO. AF_09/2023",und:"UN",qtd:20,unit:0.99,total:19.8}],
  "PAREDE":[{cod:"103335",desc:"ALVENARIA DE VEDAÇÃO DE BLOCOS CERÂMICOS FURADOS NA HORIZONTAL DE 14X9X19 CM (ESPESSURA 14 CM, BLOCO DEITADO) E ARGAMASSA DE ASSENTAMENTO COM PREPARO MANUAL. AF_12/2021",und:"m²",qtd:15.99,unit:209.06,total:3342.86},{cod:"87884",desc:"CHAPISCO APLICADO NO TETO OU EM ALVENARIA E ESTRUTURA, COM ROLO PARA TEXTURA ACRÍLICA. ARGAMASSA INDUSTRIALIZADA COM PREPARO MANUAL. AF_10/2022",und:"m²",qtd:31.98,unit:14.67,total:469.14},{cod:"87777",desc:"EMBOÇO OU MASSA ÚNICA EM ARGAMASSA TRAÇO 1:2:8, PREPARO MANUAL, APLICADA MANUALMENTE EM PANOS DE FACHADA COM PRESENÇA DE VÃOS, ESPESSURA DE 25 MM. AF_08/2022",und:"m²",qtd:31.98,unit:91.35,total:2921.37}],
  "PISO":[{cod:"87767",desc:"CONTRAPISO EM ARGAMASSA TRAÇO 1:4 (CIMENTO E AREIA), PREPARO MANUAL, APLICADO EM ÁREAS MOLHADAS SOBRE IMPERMEABILIZAÇÃO, ACABAMENTO NÃO REFORÇADO, ESPESSURA 4CM. AF_07/2021",und:"m²",qtd:10.3,unit:99.02,total:1019.9},{cod:"104606",desc:"REVESTIMENTO CERÂMICO PARA PISO COM PLACAS TIPO ESMALTADA DE DIMENSÕES 45X45 CM APLICADA EM DIAGONAL EM AMBIENTES DE ÁREA ENTRE 5 M² E 10 M². AF_02/2023_PE",und:"m²",qtd:10.3,unit:102.96,total:1060.48}],
  "INSTALAÇÃO ELÉTRICA":[{cod:"104475",desc:"COMPOSIÇÃO PARAMÉTRICA DE PONTO ELÉTRICO DE TOMADA DE USO GERAL 2P+T (10A/250V) EM EDIFÍCIO RESIDENCIAL COM ELETRODUTO EMBUTIDO EM RASGOS NAS PAREDES, INCLUSO TOMADA, ELETRODUTO, CABO, RASGO, QUEBRA E CHUMBAMENTO. AF_11/2022",und:"UN",qtd:50,unit:219.75,total:10987.5},{cod:"104477",desc:"COMPOSIÇÃO PARAMÉTRICA DE PONTO ELÉTRICO DE ILUMINAÇÃO, COM INTERRUPTOR SIMPLES, EM EDIFÍCIO RESIDENCIAL COM ELETRODUTO EMBUTIDO SEM NECESSIDADE DE RASGOS, INCLUSO TOMADA, ELETRODUTO, CABO E QUEBRA (SEM LUMINÁRIA E LÂMPADA). AF_11/2022",und:"UN",qtd:18,unit:210.92,total:3796.56},{cod:"104476",desc:"COMPOSIÇÃO PARAMÉTRICA DE PONTO ELÉTRICO DE TOMADA DE USO ESPECÍFICO 2P+T (20A/250V) EM EDIFÍCIO RESIDENCIAL COM ELETRODUTO EMBUTIDO EM RASGOS NAS PAREDES, INCLUSO TOMADA, ELETRODUTO, CABO, RASGO, QUEBRA E CHUMBAMENTO (EXCETO CHUVEIRO). AF_11/2022",und:"UN",qtd:8,unit:279.53,total:2236.24}],
  "ILUMINAÇÃO":[{cod:"103784",desc:"LUMINÁRIA TIPO PLAFON QUADRADA, DE SOBREPOR, COM LED DE 18 W - FORNECIMENTO E INSTALAÇÃO. AF_09/2024",und:"UN",qtd:18,unit:28.21,total:507.78}],
  "INSTALAÇÃO HIDROSSANITÁRIA":[{cod:"89957",desc:"PONTO DE CONSUMO TERMINAL DE ÁGUA FRIA (SUBRAMAL) COM TUBULAÇÃO DE PVC, DN 25 MM, INSTALADO EM RAMAL DE ÁGUA, INCLUSOS RASGO E CHUMBAMENTO EM ALVENARIA. AF_12/2014",und:"UN",qtd:5,unit:203.55,total:1017.75},{cod:"104676",desc:"CONJUNTO DE PONTOS DE COLETA DE ESGOTO PARA BANHEIRO (RAMAL DE ESGOTO SANITÁRIO), EM PVC SÉRIE NORMAL, COM TUBOS, CONEXÕES, RALOS, CAIXAS SIFONADAS, CORTES E FIXAÇÕES EM PRÉDIO COM PRUMADA DE DESCIDA DE ESGOTO DENTRO DO BANHEIRO. AF_05/2023_PA",und:"UN",qtd:7,unit:588.61,total:4120.27}],
  "ESQUADRIAS":[{cod:"94573",desc:"JANELA DE ALUMÍNIO DE CORRER COM 4 FOLHAS PARA VIDROS (VIDROS INCLUSOS), COM BANDEIRA, BATENTE/ REQUADRO 6 A 14 CM, ACABAMENTO COM ACETATO OU BRILHANTE, FIXAÇÃO COM PARAFUSO, SEM GUARNIÇÃO/ ALIZAR, DIMENSÕES 150X120 CM, VEDAÇÃO COM SILICONE, EXCLUSIVE CONTRAMARCO - FORNECIMENTO E INSTALAÇÃO. AF_11/2024",und:"m²",qtd:31.2,unit:400.04,total:12481.24},{cod:"94569",desc:"JANELA DE ALUMÍNIO TIPO MAXIM-AR, BATENTE/ REQUADRO 3 A 14 CM, VIDRO INCLUSO, FIXAÇÃO COM PARAFUSO, SEM GUARNIÇÃO/ ALIZAR, DIMENSÕES 60X80 (A X L) CM, SEM ACABAMENTO, VEDAÇÃO COM SILICONE, EXCLUSIVE CONTRAMARCO - FORNECIMENTO E INSTALAÇÃO. AF_11/2024",und:"m²",qtd:1.08,unit:690.04,total:745.24}],
  "IMPERMEABILIZAÇÃO":[{cod:"98552",desc:"IMPERMEABILIZAÇÃO DE SUPERFÍCIE COM MEMBRANA A BASE DE POLIURÉIA, 2 DEMÃOS. AF_09/2023",und:"m²",qtd:10.3,unit:343.85,total:3541.65}],
  "PINTURA":[{cod:"88485",desc:"FUNDO SELADOR ACRÍLICO, APLICAÇÃO MANUAL EM PAREDE, UMA DEMÃO. AF_04/2023",und:"m²",qtd:31.98,unit:5.46,total:174.61},{cod:"96131",desc:"APLICAÇÃO MANUAL DE MASSA ACRÍLICA EM PANOS DE FACHADA COM PRESENÇA DE VÃOS, DE EDIFÍCIOS DE MÚLTIPLOS PAVIMENTOS, DUAS DEMÃOS. AF_03/2024",und:"m²",qtd:98.02,unit:35.8,total:3509.11},{cod:"104648",desc:"EMASSAMENTO COM MASSA LÁTEX, APLICAÇÃO EM PAREDE, DUAS DEMÃOS, LIXAMENTO MECANIZADO. AF_04/2023",und:"m²",qtd:113.68,unit:19.46,total:2212.21},{cod:"95625",desc:"APLICAÇÃO MANUAL DE TINTA LÁTEX ACRÍLICA EM SUPERFÍCIES INTERNAS DE SACADA DE EDIFÍCIOS DE MÚLTIPLOS PAVIMENTOS, DUAS DEMÃOS. AF_03/2024",und:"m²",qtd:1059.02,unit:38.36,total:40624},{cod:"104647",desc:"EMASSAMENTO COM MASSA LÁTEX, APLICAÇÃO EM TETO, DUAS DEMÃOS, LIXAMENTO MECANIZADO. AF_04/2023",und:"m²",qtd:59.32,unit:34.9,total:2070.26},{cod:"104639",desc:"PINTURA LÁTEX ACRÍLICA ECONÔMICA, APLICAÇÃO MANUAL EM TETO, DUAS DEMÃOS. AF_04/2023",und:"m²",qtd:296.6,unit:17.11,total:5074.82}],
  "MARMORARIA":[{cod:"98695",desc:"SOLEIRA EM MÁRMORE, LARGURA 15 CM, ESPESSURA 2,0 CM. AF_02/2026",und:"M",qtd:11.2,unit:167.68,total:1878.01},{cod:"101965",desc:"PEITORIL LINEAR EM GRANITO OU MÁRMORE, L = 15CM, ASSENTADO COM ARGAMASSA 1:6 COM ADITIVO. AF_11/2020",und:"M",qtd:22.6,unit:202.39,total:4574.01}],
  "CLIMATIZAÇÃO":[{cod:"97328",desc:"TUBO EM COBRE FLEXÍVEL, DN 3/8\", COM ISOLAMENTO, INSTALADO EM RAMAL DE ALIMENTAÇÃO DE AR-CONDICIONADO - FORNECIMENTO E INSTALAÇÃO. AF_07/2025",und:"M",qtd:53.38,unit:82.79,total:4419.33}],
 },
 "ÁREA COMUM":{
  "REMOÇÕES E DEMOLIÇÕES":[{cod:"98524",desc:"LIMPEZA MANUAL DE VEGETAÇÃO EM TERRENO COM ENXADA. AF_03/2024",und:"m²",qtd:1220,unit:6.97,total:8503.4}],
  "PISO":[{cod:"90940",desc:"CONTRAPISO ACÚSTICO EM ARGAMASSA TRAÇO 1:4 (CIMENTO E AREIA), PREPARO MECÂNICO COM BETONEIRA 400L, APLICADO EM ÁREAS SECAS, ACABAMENTO NÃO REFORÇADO, ESPESSURA 6CM. AF_07/2021",und:"m²",qtd:65.64,unit:136.41,total:8953.95}],
  "INSTALAÇÃO HIDROSSANITÁRIA":[],
  "PINTURA":[{cod:"102488",desc:"PREPARO DO PISO CIMENTADO PARA PINTURA - LIXAMENTO E LIMPEZA. AF_05/2021",und:"m²",qtd:164.6,unit:5.21,total:857.56},{cod:"102804",desc:"PINTURA DE PISO COM TINTA ACRÍLICA, APLICAÇÃO MECÂNICA, 2 DEMÃOS, INCLUSO FUNDO PREPARADOR. AF_05/2021",und:"m²",qtd:164.6,unit:24.36,total:4009.65}],
  "COBERTURA":[{cod:"100330",desc:"RETIRADA E RECOLOCAÇÃO DE TELHA CERÂMICA CAPA-CANAL, COM ATÉ DUAS ÁGUAS, INCLUSO IÇAMENTO. AF_06/2026",und:"m²",qtd:51,unit:33.43,total:1704.93},{cod:"94201",desc:"TELHAMENTO COM TELHA CERÂMICA CAPA-CANAL, TIPO COLONIAL, COM ATÉ 2 ÁGUAS, INCLUSO TRANSPORTE VERTICAL. AF_06/2026",und:"m²",qtd:9,unit:71.19,total:640.71}],
 },
 "QUADRA POLIESPORTIVA":{
  "REMOÇÕES E DEMOLIÇÕES":[{cod:"104802",desc:"REMOÇÃO DE TELA DE ARAME GALVANIZADO DE ALAMBRADOS PARA QUADRAS POLIESPORTIVAS, DE FORMA MANUAL, SEM REMOÇÃO DA ESTRUTURA DE SUSTENTAÇÃO, SEM REAPROVEITAMENTO. AF_09/2023",und:"m²",qtd:12.96,unit:14.02,total:181.69},{cod:"98524",desc:"LIMPEZA MANUAL DE VEGETAÇÃO EM TERRENO COM ENXADA. AF_03/2024",und:"m²",qtd:128,unit:6.97,total:892.16},{cod:"97622",desc:"DEMOLIÇÃO DE ALVENARIA DE BLOCO FURADO, DE FORMA MANUAL, SEM REAPROVEITAMENTO. AF_09/2023",und:"m³",qtd:6,unit:85.87,total:515.22}],
  "PISO":[{cod:"90940",desc:"CONTRAPISO ACÚSTICO EM ARGAMASSA TRAÇO 1:4 (CIMENTO E AREIA), PREPARO MECÂNICO COM BETONEIRA 400L, APLICADO EM ÁREAS SECAS, ACABAMENTO NÃO REFORÇADO, ESPESSURA 6CM. AF_07/2021",und:"m²",qtd:59.16,unit:136.41,total:8070.01}],
  "INSTALAÇÃO ELÉTRICA":[{cod:"104447",desc:"LUVA PARA ELETRODUTO, PVC, SOLDÁVEL, DN 32 MM (1''), APARENTE - FORNECIMENTO E INSTALAÇÃO. AF_01/2026",und:"UN",qtd:10,unit:68.62,total:686.2}],
  "ILUMINAÇÃO":[{cod:"105920",desc:"LUMINÁRIA REFLETOR LED PARA ILUMINAÇÃO PÚBLICA, 50 W - FORNECIMENTO E INSTALAÇÃO. AF_02/2025",und:"UN",qtd:10,unit:436.84,total:4368.4}],
  "SERRALHERIA E TELAS":[{cod:"102363",desc:"ALAMBRADO PARA QUADRA POLIESPORTIVA, ESTRUTURADO POR TUBOS DE AÇO GALVANIZADO, (MONTANTES COM DIÂMETRO 2\", TRAVESSAS E ESCORAS COM DIÂMETRO 1 ¼\"), COM TELA DE ARAME GALVANIZADO, FIO 12 BWG E MALHA QUADRADA 5X5CM (EXCETO MURETA). AF_12/2025",und:"m²",qtd:12.96,unit:223.16,total:2892.15}],
  "PINTURA":[{cod:"96131",desc:"APLICAÇÃO MANUAL DE MASSA ACRÍLICA EM PANOS DE FACHADA COM PRESENÇA DE VÃOS, DE EDIFÍCIOS DE MÚLTIPLOS PAVIMENTOS, DUAS DEMÃOS. AF_03/2024",und:"m²",qtd:28.8,unit:35.8,total:1031.04},{cod:"95625",desc:"APLICAÇÃO MANUAL DE TINTA LÁTEX ACRÍLICA EM SUPERFÍCIES INTERNAS DE SACADA DE EDIFÍCIOS DE MÚLTIPLOS PAVIMENTOS, DUAS DEMÃOS. AF_03/2024",und:"m²",qtd:144,unit:38.36,total:5523.84},{cod:"102492",desc:"PINTURA DE PISO COM TINTA ACRÍLICA, APLICAÇÃO MANUAL, 3 DEMÃOS, INCLUSO FUNDO PREPARADOR. AF_05/2021",und:"m²",qtd:591.6,unit:38.87,total:22995.49},{cod:"102494",desc:"PINTURA DE PISO COM TINTA EPÓXI, APLICAÇÃO MANUAL, 2 DEMÃOS, INCLUSO PRIMER EPÓXI. AF_05/2021",und:"m²",qtd:288,unit:82.97,total:23895.36},{cod:"102506",desc:"PINTURA DE DEMARCAÇÃO DE QUADRA POLIESPORTIVA COM TINTA EPÓXI, E = 5 CM, APLICAÇÃO MANUAL. AF_05/2021",und:"M",qtd:126,unit:15.65,total:1971.9}],
  "COBERTURA":[{cod:"100330",desc:"RETIRADA E RECOLOCAÇÃO DE TELHA CERÂMICA CAPA-CANAL, COM ATÉ DUAS ÁGUAS, INCLUSO IÇAMENTO. AF_06/2026",und:"m²",qtd:278.8,unit:33.43,total:9320.28},{cod:"94218",desc:"TELHAMENTO COM TELHA ESTRUTURAL DE FIBROCIMENTO E= 8 MM, COM ATÉ 2 ÁGUAS, INCLUSO IÇAMENTO. AF_06/2026",und:"m²",qtd:39.74,unit:277.64,total:11033.41},{cod:"107143",desc:"TELHAMENTO COM TELHA DE POLICARBONATO, E=6MM. AF_06/2026",und:"m²",qtd:9.46,unit:470.94,total:4455.09}],
  "ARTEFATOS":[{cod:"103294",desc:"INSTALAÇÃO DE BANCO PRÉ-FABRICADO DE CONCRETO COM ENCOSTO, DIMENSÕES 180 CM X 64 CM X 89 CM, SOBRE PISO DE CONCRETO EXISTENTE. AF_11/2021",und:"UN",qtd:4,unit:808.55,total:3234.2}],
 },
};
const IC_MADALENA=[
 ["SERVIÇOS PRELIMINARES E ADMINISTRATIVO","SERVIÇOS PRELIMINARES E ADMINISTRATIVO","IMPOSTOS","vb",1,303766.8,303766.8],
 ["SERVIÇOS PRELIMINARES E ADMINISTRATIVO","SERVIÇOS PRELIMINARES E ADMINISTRATIVO","FGTS","mês",6,1184,7104],
 ["SERVIÇOS PRELIMINARES E ADMINISTRATIVO","SERVIÇOS PRELIMINARES E ADMINISTRATIVO","INSS","mês",6,2960,17760],
 ["SERVIÇOS PRELIMINARES E ADMINISTRATIVO","SERVIÇOS PRELIMINARES E ADMINISTRATIVO","ENGENHEIRA","mês",6,7500,45000],
 ["SERVIÇOS PRELIMINARES E ADMINISTRATIVO","SERVIÇOS PRELIMINARES E ADMINISTRATIVO","MESTRE DE OBRAS","mês",6,3440,20640],
 ["SERVIÇOS PRELIMINARES E ADMINISTRATIVO","SERVIÇOS PRELIMINARES E ADMINISTRATIVO","PEDREIROS","mês",6,4128,24768],
 ["SERVIÇOS PRELIMINARES E ADMINISTRATIVO","SERVIÇOS PRELIMINARES E ADMINISTRATIVO","AJUDANTES DE PEDREIRO","mês",6,3096,18576],
 ["SERVIÇOS PRELIMINARES E ADMINISTRATIVO","SERVIÇOS PRELIMINARES E ADMINISTRATIVO","ELETRICISTA","mês",6,2064,12384],
 ["SERVIÇOS PRELIMINARES E ADMINISTRATIVO","SERVIÇOS PRELIMINARES E ADMINISTRATIVO","ESTAGIÁRIA","mês",6,1200,7200],
 ["SERVIÇOS PRELIMINARES E ADMINISTRATIVO","SERVIÇOS PRELIMINARES E ADMINISTRATIVO","TRANSPORTE","mês",6,1260,7560],
 ["SERVIÇOS PRELIMINARES E ADMINISTRATIVO","SERVIÇOS PRELIMINARES E ADMINISTRATIVO","ALIMENTAÇÃO","mês",6,1980,11880],
 ["SERVIÇOS PRELIMINARES E ADMINISTRATIVO","SERVIÇOS PRELIMINARES E ADMINISTRATIVO","EPIS","vb",1,2000,2000],
 ["SERVIÇOS PRELIMINARES E ADMINISTRATIVO","SERVIÇOS PRELIMINARES E ADMINISTRATIVO","FERRAMENTAS","vb",1,15000,15000],
 ["SERVIÇOS PRELIMINARES E ADMINISTRATIVO","SERVIÇOS PRELIMINARES E ADMINISTRATIVO","UNIFORMES","vb",1,1620,1620],
 ["SERVIÇOS PRELIMINARES E ADMINISTRATIVO","SERVIÇOS PRELIMINARES E ADMINISTRATIVO","ASO","vb",1,250,250],
 ["SERVIÇOS PRELIMINARES E ADMINISTRATIVO","SERVIÇOS PRELIMINARES E ADMINISTRATIVO","CONTAINER 5M3","Und",20,400,8000],
 ["SERVIÇOS PRELIMINARES E ADMINISTRATIVO","SERVIÇOS PRELIMINARES E ADMINISTRATIVO","EMPREITADA PINTOR","vb",1,30000,30000],
 ["SERVIÇOS PRELIMINARES E ADMINISTRATIVO","SERVIÇOS PRELIMINARES E ADMINISTRATIVO","EMPREITADA REFRIGERAÇÃO","vb",1,7000,7000],
 ["SERVIÇOS PRELIMINARES E ADMINISTRATIVO","SERVIÇOS PRELIMINARES E ADMINISTRATIVO","EMPREITADA GESSEIRO","vb",1,11000,11000],
 ["SERVIÇOS PRELIMINARES E ADMINISTRATIVO","SERVIÇOS PRELIMINARES E ADMINISTRATIVO","EMPREITADA KORODUM","vb",1,30000,30000],
 ["SERVIÇOS PRELIMINARES E ADMINISTRATIVO","SERVIÇOS PRELIMINARES E ADMINISTRATIVO","EMPREITADA PORTAS","vb",1,5000,5000],
 ["SALAS DE AULA","PAREDE","TIJOLO 6 FUROS","milheiro",13,800,10400],
 ["SALAS DE AULA","PAREDE","CIMENTO","saca",80,47,3760],
 ["SALAS DE AULA","PAREDE","AREIA","m3",12,120,1440],
 ["SALAS DE AULA","PISO","SALVA PISO","m2",200,7.5,1500],
 ["SALAS DE AULA","INSTALAÇÃO ELÉTRICA","QGBT 12 DIN","Und",2,125,250],
 ["SALAS DE AULA","INSTALAÇÃO ELÉTRICA","DISJUTORES","Und",16,50,800],
 ["SALAS DE AULA","INSTALAÇÃO ELÉTRICA","CABO 1,5MM","rolo",5,150,750],
 ["SALAS DE AULA","INSTALAÇÃO ELÉTRICA","CABO 2,5MM","rolo",10,250,2500],
 ["SALAS DE AULA","INSTALAÇÃO ELÉTRICA","CABO 4,0MM","rolo",4,300,1200],
 ["SALAS DE AULA","INSTALAÇÃO ELÉTRICA","FITA ISOLANTE","rolo",10,12,120],
 ["SALAS DE AULA","INSTALAÇÃO ELÉTRICA","TOMADA DUPLA 10A","und",160,12,1920],
 ["SALAS DE AULA","INSTALAÇÃO ELÉTRICA","INTERRUPTOR SIMPLES","und",16,8.5,136],
 ["SALAS DE AULA","ILUMINAÇÃO","LUMINÁRIA SOBREPOR 40X40CM","Und",32,55,1760],
 ["SALAS DE AULA","ESQUADRIAS","JANELA 4 FOLHAS","m2",153.6,350,53760],
 ["SALAS DE AULA","ESQUADRIAS","JANELA ALTA 4 FOLHA","m2",0.56,500,280],
 ["SALAS DE AULA","ESQUADRIAS","GUARDA-CORPO AÇO INOX","m",36.34,300,10902],
 ["SALAS DE AULA","ESQUADRIAS","PORTA DE ALUMÍNIO COM VIDRO","und",16,800,12800],
 ["SALAS DE AULA","ESQUADRIAS","CORRIMÃO SIMPLES","m",33,120,3960],
 ["SALAS DE AULA","ESQUADRIAS","PELICULA INSUFILME","m2",153.6,100,15360],
 ["SALAS DE AULA","FORRO","FOLHA PVC 4,00M X 20MM","Und",560,22,12320],
 ["SALAS DE AULA","FORRO","RODA FORRO PVC 1,50M","Und",300,15,4500],
 ["SALAS DE AULA","FORRO","PREGO 17X21","kg",40,20,800],
 ["SALAS DE AULA","PINTURA","SELADOR ACRÍLICO","balde",4,120,480],
 ["SALAS DE AULA","PINTURA","MASSA ACRÍLICA","balde",7,130,910],
 ["SALAS DE AULA","PINTURA","MASSA PVA","balde",10,60,600],
 ["SALAS DE AULA","PINTURA","LIXA 120","Und",40,1,40],
 ["SALAS DE AULA","PINTURA","LIXA 180","Und",40,1,40],
 ["SALAS DE AULA","PINTURA","TINTA ACRÍLICA AZUL","latão",6,300,1800],
 ["SALAS DE AULA","PINTURA","TINTA ACRÍLICA BRANCA","latão",6,200,1200],
 ["SALAS DE AULA","PINTURA","TINTA BRANCO NEVE FOSCO","latão",1,200,200],
 ["SALAS DE AULA","PINTURA","PRIMER METÁLICO","galão",2,100,200],
 ["SALAS DE AULA","PINTURA","ESMALTE SINTÉTICO","galão",2,100,200],
 ["SALAS DE AULA","PINTURA","THINNER","lata",2,20,40],
 ["SALAS DE AULA","COBERTURA","MADEIRAMENTO","vb",1,4500,4500],
 ["SALAS DE AULA","COBERTURA","TELHA CERÂMICA","milheiro",1.5,1500,2250],
 ["SALAS DE AULA","MARMORARIA","MARMORE UBATUBA VERDE","m2",19.2,550,10560],
 ["SALAS DE AULA","MARMORARIA","ARGAMASSA ACII","saca",6,18,108],
 ["SALAS DE AULA","CLIMATIZAÇÃO","TUBO DE COBRE 1/4\"","m",128,25,3200],
 ["SALAS DE AULA","CLIMATIZAÇÃO","TUBO DE COBRE 1/2\"","m",128,35,4480],
 ["SALAS DE AULA","CLIMATIZAÇÃO","ISOLAMENTO TÉRMICO","m",256,6,1536],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","PAREDE","TIJOLO 6 FUROS","milheiro",1,800,800],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","PAREDE","CIMENTO","saca",8,47,376],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","PAREDE","AREIA","m3",1,120,120],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","PISO","REVESTIMENTO CERÂMICO 45X45CM","m2",65,35,2275],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","PISO","ARGAMASSA ACII","saca",20,17,340],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","PISO","REJUNTE BRANCO","kg",8,7,56],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","PISO","CIMENTO","saca",10,47,470],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","PISO","AREIA","m3",1.5,120,180],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","PISO","SEIXO","m3",1.5,240,360],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","PISO","ESPAÇADOR","pacote",3,15,45],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","PISO","QUIMIKAL","garrafa",2,12,24],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","IMPERMEABILIZAÇÃO","MANTA LÍQUIDA","balde",6,350,2100],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","IMPERMEABILIZAÇÃO","TRINCHA","und",3,12,36],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","REVESTIMENTO","REVESTIMENTO CERÂMICO 45X45CM","m2",90,35,3150],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","REVESTIMENTO","ARGAMASSA ACII","saca",25,17,425],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","REVESTIMENTO","REJUNTE BRANCO","kg",12,7,84],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","REVESTIMENTO","ESPAÇADOR","pacote",5,12,60],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","INSTALAÇÃO ELÉTRICA","QGBT 12 DIN","Und",2,125,250],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","INSTALAÇÃO ELÉTRICA","DISJUTORES","Und",20,50,1000],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","INSTALAÇÃO ELÉTRICA","CABO 1,5MM","rolo",5,150,750],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","INSTALAÇÃO ELÉTRICA","CABO 2,5MM","rolo",8,250,2000],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","INSTALAÇÃO ELÉTRICA","CABO 4,0MM","rolo",2,300,600],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","INSTALAÇÃO ELÉTRICA","FITA ISOLANTE","rolo",2,12,24],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","INSTALAÇÃO ELÉTRICA","TOMADA DUPLA 10A","und",48,12,576],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","INSTALAÇÃO ELÉTRICA","INTERRUPTOR SIMPLES","und",21,8.5,178.5],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","ILUMINAÇÃO","LUMINÁRIA SOBREPOR 40X40CM","Und",21,55,1155],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","INSTALAÇÃO HIDROSSANITÁRIA","PONTO DE ÁGUA","vb",28,150,4200],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","INSTALAÇÃO HIDROSSANITÁRIA","PONTO DE ESGOTO","vb",31,300,9300],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","ESQUADRIAS","JANELA 4 FOLHAS","m2",24,350,8400],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","ESQUADRIAS","JANELA ALTA 4 FOLHA","m2",2.16,500,1080],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","ESQUADRIAS","PORTA ALUMÍNIO","m2",3,350,1050],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","ESQUADRIAS","PORTA ALUMÍNIO SIMPLES","und",22,800,17600],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","ESQUADRIAS","PORTA VENEZIANA DE FERRO","m2",4.5,500,2250],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","ESQUADRIAS","PELICULA INSUFILME","m2",26.16,100,2616],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","FORRO","FOLHA PVC 4,00M X 20MM","Und",220,22,4840],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","FORRO","RODA FORRO PVC 1,50M","Und",80,15,1200],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","FORRO","PREGO 17X21","kg",10,20,200],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","PINTURA","SELADOR ACRÍLICO","balde",1,120,120],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","PINTURA","MASSA ACRÍLICA","balde",3,130,390],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","PINTURA","MASSA PVA","balde",2,60,120],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","PINTURA","LIXA 120","Und",10,1,10],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","PINTURA","LIXA 180","Und",10,1,10],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","PINTURA","TINTA ACRÍLICA AZUL","latão",2,300,600],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","PINTURA","TINTA ACRÍLICA BRANCA","latão",22,200,4400],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","PINTURA","PRIMER METÁLICO","galão",1,100,100],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","PINTURA","ESMALTE SINTÉTICO","galão",1,100,100],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","PINTURA","THINNER","lata",1,20,20],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","COBERTURA","MADEIRAMENTO","vb",1,2000,2000],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","COBERTURA","TELHA CERÂMICA","milheiro",1.5,1000,1500],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","MARMORARIA","SOLEIRA UBATUBA","m2",2.72,550,1496],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","MARMORARIA","PEITORIL UBATUBA","m2",3.54,550,1947],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","LOUÇAS","LAVATÓRIO COM COLUNA","und",10,500,5000],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","LOUÇAS","TORNEIRA DE BANCADA","und",10,50,500],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","LOUÇAS","BARRA DE APOIO","Und",1,400,400],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","LOUÇAS","MICTÓRIO","Und",2,800,1600],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","CLIMATIZAÇÃO","TUBO DE COBRE 1/4\"","m",20,25,500],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","CLIMATIZAÇÃO","TUBO DE COBRE 1/2\"","m",20,35,700],
 ["ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)","CLIMATIZAÇÃO","ISOLAMENTO TÉRMICO","m",40,6,240],
 ["PRÉDIO ADMINISTRATIVO","PAREDE","TIJOLO 6 FUROS","milheiro",0.6,800,480],
 ["PRÉDIO ADMINISTRATIVO","PAREDE","CIMENTO","saca",5,47,235],
 ["PRÉDIO ADMINISTRATIVO","PAREDE","AREIA","m3",0.5,120,60],
 ["PRÉDIO ADMINISTRATIVO","PISO","REVESTIMENTO CERÂMICO 45X45CM","m2",15,35,525],
 ["PRÉDIO ADMINISTRATIVO","PISO","ARGAMASSA ACII","saca",4,17,68],
 ["PRÉDIO ADMINISTRATIVO","PISO","REJUNTE BRANCO","kg",1,7,7],
 ["PRÉDIO ADMINISTRATIVO","PISO","CIMENTO","saca",3,47,141],
 ["PRÉDIO ADMINISTRATIVO","PISO","AREIA","m3",0.5,120,60],
 ["PRÉDIO ADMINISTRATIVO","PISO","SEIXO","m3",0.5,240,120],
 ["PRÉDIO ADMINISTRATIVO","PISO","ESPAÇADOR","pacote",1,15,15],
 ["PRÉDIO ADMINISTRATIVO","PISO","QUIMIKAL","garrafa",1,12,12],
 ["PRÉDIO ADMINISTRATIVO","INSTALAÇÃO ELÉTRICA","CABO 1,5MM","rolo",5,150,750],
 ["PRÉDIO ADMINISTRATIVO","INSTALAÇÃO ELÉTRICA","CABO 2,5MM","rolo",7,250,1750],
 ["PRÉDIO ADMINISTRATIVO","INSTALAÇÃO ELÉTRICA","CABO 4,0MM","rolo",2,300,600],
 ["PRÉDIO ADMINISTRATIVO","INSTALAÇÃO ELÉTRICA","FITA ISOLANTE","rolo",2,12,24],
 ["PRÉDIO ADMINISTRATIVO","INSTALAÇÃO ELÉTRICA","TOMADA DUPLA 10A","und",50,12,600],
 ["PRÉDIO ADMINISTRATIVO","INSTALAÇÃO ELÉTRICA","INTERRUPTOR SIMPLES","und",18,8.5,153],
 ["PRÉDIO ADMINISTRATIVO","ILUMINAÇÃO","LUMINÁRIA SOBREPOR 40X40CM","Und",18,55,990],
 ["PRÉDIO ADMINISTRATIVO","INSTALAÇÃO HIDROSSANITÁRIA","PONTO DE ÁGUA","vb",5,150,750],
 ["PRÉDIO ADMINISTRATIVO","INSTALAÇÃO HIDROSSANITÁRIA","PONTO DE ESGOTO","vb",7,300,2100],
 ["PRÉDIO ADMINISTRATIVO","ESQUADRIAS","JANELA 4 FOLHAS","m2",31.2,350,10920],
 ["PRÉDIO ADMINISTRATIVO","ESQUADRIAS","JANELA ALTA 4 FOLHA","m2",1.08,500,540],
 ["PRÉDIO ADMINISTRATIVO","ESQUADRIAS","PORTA ALUMÍNIO SIMPLES","und",14,800,11200],
 ["PRÉDIO ADMINISTRATIVO","ESQUADRIAS","PELICULA INSUFILME","m2",32.28,100,3228],
 ["PRÉDIO ADMINISTRATIVO","IMPERMEABILIZAÇÃO","MANTA LÍQUIDA","balde",2,350,700],
 ["PRÉDIO ADMINISTRATIVO","IMPERMEABILIZAÇÃO","TRINCHA","und",1,12,12],
 ["PRÉDIO ADMINISTRATIVO","PINTURA","MASSA ACRÍLICA","balde",4,130,520],
 ["PRÉDIO ADMINISTRATIVO","PINTURA","MASSA PVA","balde",7,60,420],
 ["PRÉDIO ADMINISTRATIVO","PINTURA","LIXA 120","Und",20,1,20],
 ["PRÉDIO ADMINISTRATIVO","PINTURA","LIXA 180","Und",20,1,20],
 ["PRÉDIO ADMINISTRATIVO","PINTURA","TINTA ACRÍLICA AZUL","latão",4,300,1200],
 ["PRÉDIO ADMINISTRATIVO","PINTURA","TINTA ACRÍLICA BRANCA","latão",4,200,800],
 ["PRÉDIO ADMINISTRATIVO","PINTURA","TINTA BRANCO NEVE FOSCO","latão",1,200,200],
 ["PRÉDIO ADMINISTRATIVO","PINTURA","THINNER","lata",2,20,40],
 ["PRÉDIO ADMINISTRATIVO","MARMORARIA","SOLEIRA UBATUBA","m2",1.68,550,924],
 ["PRÉDIO ADMINISTRATIVO","MARMORARIA","PEITORIL UBATUBA","m2",3.39,550,1864.5],
 ["PRÉDIO ADMINISTRATIVO","CLIMATIZAÇÃO","TUBO DE COBRE 1/4\"","m",53.38,25,1334.5],
 ["PRÉDIO ADMINISTRATIVO","CLIMATIZAÇÃO","TUBO DE COBRE 1/2\"","m",53.38,35,1868.3],
 ["PRÉDIO ADMINISTRATIVO","CLIMATIZAÇÃO","ISOLAMENTO TÉRMICO","m",106.76,6,640.56],
 ["ÁREA COMUM","REMOÇÕES E DEMOLIÇÕES","LIMPEZA DE VEGETAÇÃO","vb",1,2000,2000],
 ["ÁREA COMUM","PISO","CIMENTO","saca",14,47,658],
 ["ÁREA COMUM","PISO","AREIA","m3",2,120,240],
 ["ÁREA COMUM","PISO","SEIXO","m3",2,240,480],
 ["ÁREA COMUM","INSTALAÇÃO HIDROSSANITÁRIA","LIMPEZA DE FOSSA","m3",16.5,500,8250],
 ["ÁREA COMUM","PINTURA","MASSA ACRÍLICA","balde",12,130,1560],
 ["ÁREA COMUM","PINTURA","TINTA PISO","latão",2,150,300],
 ["ÁREA COMUM","PINTURA","LIXA 120","Und",20,1,20],
 ["ÁREA COMUM","PINTURA","LIXA 180","Und",20,1,20],
 ["ÁREA COMUM","PINTURA","TINTA ACRÍLICA AZUL","latão",4,300,1200],
 ["ÁREA COMUM","PINTURA","TINTA ACRÍLICA BRANCA","latão",4,200,800],
 ["QUADRA POLIESPORTIVA","REMOÇÕES E DEMOLIÇÕES","LIMPEZA DE VEGETAÇÃO","m2",128,5,640],
 ["QUADRA POLIESPORTIVA","PISO","CIMENTO","saca",12,47,564],
 ["QUADRA POLIESPORTIVA","PISO","AREIA","m3",2.5,120,300],
 ["QUADRA POLIESPORTIVA","PISO","SEIXO","m3",2.5,240,600],
 ["QUADRA POLIESPORTIVA","INSTALAÇÃO ELÉTRICA","REFLETOR 50W","und",10,100,1000],
 ["QUADRA POLIESPORTIVA","INSTALAÇÃO ELÉTRICA","CABO 2,5MM","rolo",6,250,1500],
 ["QUADRA POLIESPORTIVA","INSTALAÇÃO ELÉTRICA","FITA ISOLANTE","rolo",2,12,24],
 ["QUADRA POLIESPORTIVA","SERRALHERIA E TELAS","ALAMBRADO","m2",12.96,300,3888],
 ["QUADRA POLIESPORTIVA","SERRALHERIA E TELAS","PAR DE TRAVES COM REDE","und",1,4000,4000],
 ["QUADRA POLIESPORTIVA","SERRALHERIA E TELAS","REDE DE PROTEÇÃO LATERAL","m2",72,25,1800],
 ["QUADRA POLIESPORTIVA","PINTURA","MASSA ACRÍLICA","balde",1,130,130],
 ["QUADRA POLIESPORTIVA","PINTURA","TINTA ACRÍLICA AZUL","latão",1,300,300],
 ["QUADRA POLIESPORTIVA","PINTURA","TINTA ACRÍLICA BRANCA","latão",1,200,200],
 ["QUADRA POLIESPORTIVA","PINTURA","TINTA EPOXI","galão",4,300,1200],
 ["QUADRA POLIESPORTIVA","PINTURA","LIXA 120","und",5,1,5],
 ["QUADRA POLIESPORTIVA","PINTURA","LIXA 180","und",5,1,5],
 ["QUADRA POLIESPORTIVA","PINTURA","PRIMER METÁLICO","galão",10,100,1000],
 ["QUADRA POLIESPORTIVA","PINTURA","ESMALTE SINTÉTICO","galão",10,100,1000],
 ["QUADRA POLIESPORTIVA","COBERTURA","TELHA DE FIBROCIMENTO","und",35,27.5,962.5],
 ["QUADRA POLIESPORTIVA","COBERTURA","PREGO TELHEIRO","pacote",4,20,80],
 ["QUADRA POLIESPORTIVA","ARTEFATOS","BANCO PRÉ-MOLDADO","und",3,300,900],
 ["QUADRA POLIESPORTIVA","ARTEFATOS","TRAVES DE BASQUETE","und",2,3500,7000],
 ["CUSTOS NÃO PREVISTOS","CONTINGÊNCIA","Reserva para custos não previstos (diluída nos meses)","vb",1,90000,90000],
].map(([pav,cat,desc,und,qtd,unit,total])=>({pav,cat,desc,und,qtd,unit,total,pago:0,status:"pendente",forn:"",dataPag:""}));
const IA_MADALENA=[
 ["SALAS DE AULA","REMOÇÕES E DEMOLIÇÕES","DEMOLIÇÃO DE ALVENARIA",2,"M2",74.77],
 ["SALAS DE AULA","REMOÇÕES E DEMOLIÇÕES","REMOÇÃO DE FORRO PVC",2,"M2",409.6],
 ["SALAS DE AULA","REMOÇÕES E DEMOLIÇÕES","REMOÇÃO DE LUMINÁRIAS",0.5,"UND",32],
 ["SALAS DE AULA","REMOÇÕES E DEMOLIÇÕES","REMOÇÃO DE MADEIRAMENTO DE COBERTURA",4,"M2",88.45],
 ["SALAS DE AULA","REMOÇÕES E DEMOLIÇÕES","REMOÇÃO DE PORTAS",0.8,"UND",16],
 ["SALAS DE AULA","REMOÇÕES E DEMOLIÇÕES","REMOÇÃO DE COBERTURA",1,"M2",66.34],
 ["SALAS DE AULA","REMOÇÕES E DEMOLIÇÕES","REMOÇÃO DE INTERRUPTORES E TOMADAS",0.5,"UND",64],
 ["SALAS DE AULA","PAREDE","ALVENARIA",10,"M2",344.93],
 ["SALAS DE AULA","PAREDE","CHAPISCO",5,"M2",689.86],
 ["SALAS DE AULA","PAREDE","REBOCO",8,"M2",689.86],
 ["SALAS DE AULA","PISO","REVITALIZAÇÃO DE KORODUR",10,"M2",409.8],
 ["SALAS DE AULA","PISO","FABRICAÇÃO DE KORODUR (RAMPA)",4,"M2",21.6],
 ["SALAS DE AULA","PISO","INSTALAÇÃO DE SALVA PISO",1,"M2",409.8],
 ["SALAS DE AULA","INSTALAÇÃO ELÉTRICA","INSTALAÇÃO DE QGBT",2,"UND",2],
 ["SALAS DE AULA","INSTALAÇÃO ELÉTRICA","PONTO DE TOMADA",8,"UND",160],
 ["SALAS DE AULA","INSTALAÇÃO ELÉTRICA","PONTO DE ILUMINAÇÃO",2,"UND",32],
 ["SALAS DE AULA","INSTALAÇÃO ELÉTRICA","PONTO DE AR",2,"UND",16],
 ["SALAS DE AULA","ILUMINAÇÃO","INSTALAÇÃO DE LUMINÁRIA QUADRADA 40X40CM",0.5,"UND",32],
 ["SALAS DE AULA","ESQUADRIA","JANELA 4 FOLHAS",8,"UND",64],
 ["SALAS DE AULA","ESQUADRIA","JANELA ALTA 4 FOLHAS",0.2,"UND",1],
 ["SALAS DE AULA","ESQUADRIA","GUARDA-CORPO DE AÇO",4,"M",36.34],
 ["SALAS DE AULA","ESQUADRIA","PORTA DE ALUMÍNIO",4,"UND",16],
 ["SALAS DE AULA","ESQUADRIA","CORRIMÃO",2,"M",33],
 ["SALAS DE AULA","ESQUADRIA","PELÍCULA",1.5,"M2",153.6],
 ["SALAS DE AULA","FORRO","FORRO EM PVC",8,"M2",409.6],
 ["SALAS DE AULA","PINTURA","EMASSAMENTO ACRÍLICO (PAREDE)",5,"M2",171.86],
 ["SALAS DE AULA","PINTURA","EMASSAMENTO LATEX (PAREDE)",5,"M2",258.98],
 ["SALAS DE AULA","PINTURA","EMASSAMENTO LATEX (TETO)",0.5,"M2",40.96],
 ["SALAS DE AULA","PINTURA","PINTURA ACRÍLICA (PAREDE)",10,"M2",2154.24],
 ["SALAS DE AULA","PINTURA","PINTURA LATEX (TETO)",3,"M2",204.8],
 ["SALAS DE AULA","PINTURA","FUNDO SELADOR",3,"M2",689.86],
 ["SALAS DE AULA","PINTURA","PRIMER METÁLICO",1,"M2",77.04],
 ["SALAS DE AULA","PINTURA","ESMALTE SINTÉTICO",2,"M2",77.04],
 ["SALAS DE AULA","COBERTURA","NOVO MADEIRAMENTO",4,"M2",88.45],
 ["SALAS DE AULA","COBERTURA","RETIRADA E RECOLOCAÇÃO DE TELHA CERÂMICA",4,"M2",375.9],
 ["SALAS DE AULA","COBERTURA","TELHA CERÂMICA",2,"M2",66.34],
 ["SALAS DE AULA","MARMORARIA","PEITORIL DE MÁRMORE",2,"UND",64],
 ["SALAS DE AULA","CLIMATIZAÇÃO","INSTALAÇÃO DE TUBO DE COBRE",4,"M",128],
 ["SALAS DE AULA","CLIMATIZAÇÃO","INSTALAÇÃO DE ESPONJOSO",2,"M",128],
 ["ÁREA TÉCNICA","REMOÇÕES E DEMOLIÇÕES","DEMOLIÇÃO DE ALVENARIA",0.1,"M2",8.32],
 ["ÁREA TÉCNICA","REMOÇÕES E DEMOLIÇÕES","REMOÇÃO DE FORRO PVC",1,"M2",155.62],
 ["ÁREA TÉCNICA","REMOÇÕES E DEMOLIÇÕES","REMOÇÃO DE LUMINÁRIAS",0.3,"UND",21],
 ["ÁREA TÉCNICA","REMOÇÕES E DEMOLIÇÕES","REMOÇÃO DE MADEIRAMENTO DE COBERTURA",1.5,"M2",31.12],
 ["ÁREA TÉCNICA","REMOÇÕES E DEMOLIÇÕES","REMOÇÃO DE PORTAS",0.5,"UND",14],
 ["ÁREA TÉCNICA","REMOÇÕES E DEMOLIÇÕES","REMOÇÃO DE COBERTURA",0.3,"M2",23.34],
 ["ÁREA TÉCNICA","REMOÇÕES E DEMOLIÇÕES","REMOÇÃO DE INTERRUPTORES E TOMADAS",0.2,"UND",16],
 ["ÁREA TÉCNICA","REMOÇÕES E DEMOLIÇÕES","REMOÇÃO DE REVESTIMENTO CERÂMICO",1.5,"M2",141.51],
 ["ÁREA TÉCNICA","REMOÇÕES E DEMOLIÇÕES","DEMOLIÇÃO DE CONTRAPISO",0.8,"M3",4.8],
 ["ÁREA TÉCNICA","PAREDE","ALVENARIA",1,"M2",29.34],
 ["ÁREA TÉCNICA","PAREDE","CHAPISCO",0.5,"M2",58.68],
 ["ÁREA TÉCNICA","PAREDE","REBOCO",0.8,"M2",58.68],
 ["ÁREA TÉCNICA","PISO","REVITALIZAÇÃO DE KORODUR",2,"M2",155.62],
 ["ÁREA TÉCNICA","PISO","CONTRAPISO",0.5,"M3",4.8],
 ["ÁREA TÉCNICA","PISO","REVESTIMENTO CERÂMICO",3,"M2",60.06],
 ["ÁREA TÉCNICA","PISO","REJUNTAMENTO",0.5,"M2",60.06],
 ["ÁREA TÉCNICA","PISO","INSTALAÇÃO DE SALVA PISO",1,"M2",155.62],
 ["ÁREA TÉCNICA","REVESTIMENTO","REVESTIMENTO CERÂMICO (PAREDE)",3.5,"M2",81.45],
 ["ÁREA TÉCNICA","REVESTIMENTO","REJUNTAMENTO",1,"M3",81.45],
 ["ÁREA TÉCNICA","IMPERMEABILIZAÇÃO","APLICAÇÃO DE MANTA LÍQUIDA",0.5,"M2",38.04],
 ["ÁREA TÉCNICA","INSTALAÇÃO ELÉTRICA","INSTALAÇÃO DE QGBT",2,"UND",2],
 ["ÁREA TÉCNICA","INSTALAÇÃO ELÉTRICA","PONTO DE TOMADA",4,"UND",48],
 ["ÁREA TÉCNICA","INSTALAÇÃO ELÉTRICA","PONTO DE ILUMINAÇÃO",2,"UND",21],
 ["ÁREA TÉCNICA","INSTALAÇÃO ELÉTRICA","PONTO DE AR",0.8,"UND",4],
 ["ÁREA TÉCNICA","ILUMINAÇÃO","INSTALAÇÃO DE LUMINÁRIA QUADRADA 40X40CM",0.8,"UND",21],
 ["ÁREA TÉCNICA","INSTALAÇÃO HIDROSSANITÁRIA","PONTO DE ÁGUA",2.5,"UND",28],
 ["ÁREA TÉCNICA","INSTALAÇÃO HIDROSSANITÁRIA","PONTO DE ESGOTO",3.5,"UND",31],
 ["ÁREA TÉCNICA","ESQUADRIA","JANELA 4 FOLHAS",1,"UND",12],
 ["ÁREA TÉCNICA","ESQUADRIA","BALANCIM",0.8,"UND",6],
 ["ÁREA TÉCNICA","ESQUADRIA","PORTA DE ARMÁRIO",0.5,"M2",3],
 ["ÁREA TÉCNICA","ESQUADRIA","PORTA DE ALUMÍNIO",2,"UND",12],
 ["ÁREA TÉCNICA","ESQUADRIA","PORTA VENEZIANA",1,"M2",4.5],
 ["ÁREA TÉCNICA","ESQUADRIA","PELÍCULA",0.5,"M2",26.16],
 ["ÁREA TÉCNICA","FORRO","FORRO EM PVC",2.5,"M2",155.62],
 ["ÁREA TÉCNICA","PINTURA","EMASSAMENTO ACRÍLICO (PAREDE)",1,"M2",69.72],
 ["ÁREA TÉCNICA","PINTURA","EMASSAMENTO LATEX (PAREDE)",0.5,"M2",45.78],
 ["ÁREA TÉCNICA","PINTURA","PINTURA ACRÍLICA (PAREDE)",3,"M2",577.54],
 ["ÁREA TÉCNICA","PINTURA","FUNDO SELADOR",0.5,"M2",58.68],
 ["ÁREA TÉCNICA","PINTURA","PRIMER METÁLICO",0.5,"M2",30.66],
 ["ÁREA TÉCNICA","PINTURA","ESMALTE SINTÉTICO",1,"M2",30.66],
 ["ÁREA TÉCNICA","COBERTURA","NOVO MADEIRAMENTO",1,"M2",31.12],
 ["ÁREA TÉCNICA","COBERTURA","RETIRADA E RECOLOCAÇÃO DE TELHA CERÂMICA",2,"M2",132.28],
 ["ÁREA TÉCNICA","COBERTURA","TELHA CERÂMICA",0.5,"M2",23.34],
 ["ÁREA TÉCNICA","MARMORARIA","PEITORIL DE MÁRMORE",0.5,"UND",12],
 ["ÁREA TÉCNICA","MARMORARIA","SOLEIRA DE MÁRMORE",0.5,"UND",12],
 ["ÁREA TÉCNICA","LOUÇAS","LAVATÓRIO",1,"M2",10],
 ["ÁREA TÉCNICA","LOUÇAS","TORNEIRA",0.5,"M2",10],
 ["ÁREA TÉCNICA","LOUÇAS","BARRA DE APOIO PCD",0.3,"M2",1],
 ["ÁREA TÉCNICA","LOUÇAS","MICTÓRIO",0.4,"M2",2],
 ["ÁREA TÉCNICA","CLIMATIZAÇÃO","INSTALAÇÃO DE TUBO DE COBRE",1,"M",20],
 ["ÁREA TÉCNICA","CLIMATIZAÇÃO","INSTALAÇÃO DE ESPONJOSO",1,"M",20],
 ["PRÉDIO ADMINISTRATIVO","REMOÇÕES E DEMOLIÇÕES","REMOÇÃO DE LUMINÁRIAS",0.3,"UND",18],
 ["PRÉDIO ADMINISTRATIVO","REMOÇÕES E DEMOLIÇÕES","REMOÇÃO DE PORTAS",1,"UND",14],
 ["PRÉDIO ADMINISTRATIVO","REMOÇÕES E DEMOLIÇÕES","REMOÇÃO DE JANELA",2,"M2",28],
 ["PRÉDIO ADMINISTRATIVO","REMOÇÕES E DEMOLIÇÕES","REMOÇÃO DE INTERRUPTORES E TOMADAS",0.6,"UND",20],
 ["PRÉDIO ADMINISTRATIVO","REMOÇÕES E DEMOLIÇÕES","REMOÇÃO DE REVESTIMENTO CERÂMICO",0.3,"M2",10.3],
 ["PRÉDIO ADMINISTRATIVO","REMOÇÕES E DEMOLIÇÕES","DEMOLIÇÃO DE CONTRAPISO",0.3,"M3",0.41],
 ["PRÉDIO ADMINISTRATIVO","PAREDE","ALVENARIA",0.5,"M2",15.99],
 ["PRÉDIO ADMINISTRATIVO","PAREDE","CHAPISCO",0.5,"M2",31.98],
 ["PRÉDIO ADMINISTRATIVO","PAREDE","REBOCO",0.5,"M2",31.98],
 ["PRÉDIO ADMINISTRATIVO","PISO","CONTRAPISO",0.5,"M2",0.41],
 ["PRÉDIO ADMINISTRATIVO","PISO","REVESTIMENTO CERÂMICO",0.6,"M2",10.3],
 ["PRÉDIO ADMINISTRATIVO","PISO","REJUNTAMENTO",0.1,"M2",10.3],
 ["PRÉDIO ADMINISTRATIVO","REVESTIMENTO","REVESTIMENTO CERÂMICO (PAREDE)",1.5,"M2",39.2],
 ["PRÉDIO ADMINISTRATIVO","REVESTIMENTO","REJUNTAMENTO",0.3,"M2",39.2],
 ["PRÉDIO ADMINISTRATIVO","IMPERMEABILIZAÇÃO","APLICAÇÃO DE MANTA LÍQUIDA",0.5,"M2",10.3],
 ["PRÉDIO ADMINISTRATIVO","INSTALAÇÃO ELÉTRICA","PONTO DE TOMADA",4,"UND",50],
 ["PRÉDIO ADMINISTRATIVO","INSTALAÇÃO ELÉTRICA","PONTO DE ILUMINAÇÃO",2,"UND",18],
 ["PRÉDIO ADMINISTRATIVO","INSTALAÇÃO ELÉTRICA","PONTO DE AR",2,"UND",8],
 ["PRÉDIO ADMINISTRATIVO","ILUMINAÇÃO","INSTALAÇÃO DE LUMINÁRIA QUADRADA 40X40CM",0.8,"UND",18],
 ["PRÉDIO ADMINISTRATIVO","INSTALAÇÃO HIDROSSANITÁRIA","PONTO DE ÁGUA",1,"UND",5],
 ["PRÉDIO ADMINISTRATIVO","INSTALAÇÃO HIDROSSANITÁRIA","PONTO DE ESGOTO",2.5,"UND",7],
 ["PRÉDIO ADMINISTRATIVO","ESQUADRIA","JANELA 4 FOLHAS",3,"UND",16],
 ["PRÉDIO ADMINISTRATIVO","ESQUADRIA","BALANCIM",0.6,"UND",3],
 ["PRÉDIO ADMINISTRATIVO","ESQUADRIA","PORTA DE ALUMÍNIO",3,"UND",14],
 ["PRÉDIO ADMINISTRATIVO","ESQUADRIA","PELÍCULA",0.5,"M2",32.28],
 ["PRÉDIO ADMINISTRATIVO","PINTURA","EMASSAMENTO ACRÍLICO (PAREDE)",1.5,"M2",98.02],
 ["PRÉDIO ADMINISTRATIVO","PINTURA","EMASSAMENTO LATEX (PAREDE)",1.5,"M2",113.68],
 ["PRÉDIO ADMINISTRATIVO","PINTURA","PINTURA ACRÍLICA (PAREDE)",4,"M2",1059.02],
 ["PRÉDIO ADMINISTRATIVO","PINTURA","FUNDO SELADOR",0.5,"M2",31.98],
 ["PRÉDIO ADMINISTRATIVO","PINTURA","EMASSAMENTO LATEX (TETO)",0.5,"M2",59.32],
 ["PRÉDIO ADMINISTRATIVO","PINTURA","PINTURA LATEX (TETO)",1.5,"M2",296.6],
 ["PRÉDIO ADMINISTRATIVO","MARMORARIA","PEITORIL DE MÁRMORE",1.5,"UND",28],
 ["PRÉDIO ADMINISTRATIVO","MARMORARIA","SOLEIRA DE MÁRMORE",1,"UND",14],
 ["PRÉDIO ADMINISTRATIVO","CLIMATIZAÇÃO","INSTALAÇÃO DE TUBO DE COBRE",1.5,"M",53.38],
 ["PRÉDIO ADMINISTRATIVO","CLIMATIZAÇÃO","INSTALAÇÃO DE ESPONJOSO",0.5,"M",53.38],
 ["ÁREA COMUM","REMOÇÕES E DEMOLIÇÕES","LIMPEZA DE VEGETAÇÃO",5,"M2",1220],
 ["ÁREA COMUM","PISO","CONTRAPISO",2,"M2",65.64],
 ["ÁREA COMUM","INSTALAÇÃO HIDROSSANITÁRIA","LIMPEZA DE FOSSA",1.5,"M3",16.5],
 ["ÁREA COMUM","PINTURA","EMASSAMENTO ACRÍLICO (PAREDE)",3,"M2",296.93],
 ["ÁREA COMUM","PINTURA","PINTURA ACRÍLICA (PAREDE)",6,"M2",1484.64],
 ["ÁREA COMUM","PINTURA","PINTURA PISO",1.5,"M2",164.6],
 ["ÁREA COMUM","COBERTURA","NOVO MADEIRAMENTO",0.5,"M2",12],
 ["ÁREA COMUM","COBERTURA","RETIRADA E RECOLOCAÇÃO DE TELHA CERÂMICA",0.8,"M2",51],
 ["ÁREA COMUM","COBERTURA","TELHA CERÂMICA",0.2,"M2",9],
 ["QUADRA POLIESPORTIVA","REMOÇÕES E DEMOLIÇÕES","REMOÇÃO DE ALAMBRADO",0.3,"M2",12.98],
 ["QUADRA POLIESPORTIVA","REMOÇÕES E DEMOLIÇÕES","LIMPEZA DE VEGETAÇÃO",1,"M2",128],
 ["QUADRA POLIESPORTIVA","REMOÇÕES E DEMOLIÇÕES","DEMOLIÇÃO DE ALVENARIA",0.2,"M2",6],
 ["QUADRA POLIESPORTIVA","REMOÇÕES E DEMOLIÇÕES","RETIRADA DE COBERTURA",0.5,"M2",49.2],
 ["QUADRA POLIESPORTIVA","PISO","CONTRAPISO",2,"M2",59.16],
 ["QUADRA POLIESPORTIVA","INSTALAÇÃO ELÉTRICA","PONTO DE ILUMINAÇÃO",1,"UND",10],
 ["QUADRA POLIESPORTIVA","ILUMINAÇÃO","INSTALAÇÃO DE REFLETOR",0.5,"UND",10],
 ["QUADRA POLIESPORTIVA","SERRALHERIA E TELAS","ALAMBRADO",1,"UND",12.96],
 ["QUADRA POLIESPORTIVA","SERRALHERIA E TELAS","TELA DE PROTEÇÃO",1,"UND",72],
 ["QUADRA POLIESPORTIVA","PINTURA","EMASSAMENTO ACRÍLICO (PAREDE)",0.5,"M2",28.8],
 ["QUADRA POLIESPORTIVA","PINTURA","PINTURA ACRÍLICA (PAREDE)",1.5,"M2",144],
 ["QUADRA POLIESPORTIVA","PINTURA","PINTURA EPÓXI",2.5,"M2",288],
 ["QUADRA POLIESPORTIVA","PINTURA","DEMARCAÇÃO DE QUADRA",1.5,"M",126],
 ["QUADRA POLIESPORTIVA","PINTURA","PINTURA DE PISO",2.5,"M2",591.6],
 ["QUADRA POLIESPORTIVA","PINTURA","PRIMER METÁLICO",2,"VB",1],
 ["QUADRA POLIESPORTIVA","PINTURA","ESMALTE SINTÉTICO",3,"VB",1],
 ["QUADRA POLIESPORTIVA","COBERTURA","TELHA DE FIBROCIMENTO",3,"M2",278.8],
 ["QUADRA POLIESPORTIVA","COBERTURA","TELHA DE FIBROCIMENTO TRANSLÚCIDA",0.2,"M2",9.46],
 ["QUADRA POLIESPORTIVA","ARTEFATOS","BANCO DE CONCRETO",0.5,"UND",3],
 ["QUADRA POLIESPORTIVA","ARTEFATOS","PAR DE TRAVES DE FUTSAL",1,"PAR",1],
 ["QUADRA POLIESPORTIVA","ARTEFATOS","PAR DE TRAVES DE BASQUETE",1,"PAR",1],
].map(([pav,sec,ativ,prazo,und,total],i)=>({pav,sec,cod:"M"+(i+1),ativ,prazo,und,total,acum:0,meds:[]}));
const CRONO_MADALENA={
 "SERVIÇOS PRELIMINARES E ADMINISTRATIVO||SERVIÇOS PRELIMINARES E ADMINISTRATIVO":[0.136,0.216,0.216,0.216,0.216],
 "SALAS DE AULA||REMOÇÕES E DEMOLIÇÕES":[1.0,0.0,0.0,0.0,0.0],
 "SALAS DE AULA||PAREDE":[0.6,0.4,0.0,0.0,0.0],
 "SALAS DE AULA||PISO":[0.2,0.8,0.0,0.0,0.0],
 "SALAS DE AULA||INSTALAÇÃO ELÉTRICA":[0.3,0.52,0.18,0.0,0.0],
 "SALAS DE AULA||ILUMINAÇÃO":[0.0,0.4,0.6,0.0,0.0],
 "SALAS DE AULA||ESQUADRIAS":[0.0,0.0,0.6,0.4,0.0],
 "SALAS DE AULA||FORRO":[0.0,0.0,0.6,0.4,0.0],
 "SALAS DE AULA||PINTURA":[0.0,0.0,0.3,0.6,0.1],
 "SALAS DE AULA||COBERTURA":[0.16,0.48,0.36,0.0,0.0],
 "SALAS DE AULA||MARMORARIA":[0.0,0.4,0.6,0.0,0.0],
 "SALAS DE AULA||CLIMATIZAÇÃO":[0.0,0.4,0.6,0.0,0.0],
 "ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)||REMOÇÕES E DEMOLIÇÕES":[0.2,0.8,0.0,0.0,0.0],
 "ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)||PAREDE":[0.1,0.6,0.3,0.0,0.0],
 "ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)||PISO":[0.0,0.2,0.6,0.2,0.0],
 "ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)||IMPERMEABILIZAÇÃO":[0.0,0.0,0.6,0.4,0.0],
 "ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)||REVESTIMENTO":[0.0,0.0,0.6,0.4,0.0],
 "ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)||INSTALAÇÃO ELÉTRICA":[0.3,0.52,0.18,0.0,0.0],
 "ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)||ILUMINAÇÃO":[0.0,0.4,0.6,0.0,0.0],
 "ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)||INSTALAÇÃO HIDROSSANITÁRIA":[0.2,0.8,0.0,0.0,0.0],
 "ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)||ESQUADRIAS":[0.0,0.0,0.0,0.8,0.2],
 "ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)||FORRO":[0.0,0.0,0.6,0.4,0.0],
 "ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)||PINTURA":[0.0,0.0,0.0,0.4,0.6],
 "ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)||COBERTURA":[0.1,0.6,0.3,0.0,0.0],
 "ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)||MARMORARIA":[0.0,0.0,0.6,0.4,0.0],
 "ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)||LOUÇAS":[0.0,0.0,0.0,0.8,0.2],
 "ÁREA TÉCNICA (COZINHA, ESTOQUE, REFEITÓRIO E AFINS)||CLIMATIZAÇÃO":[0.0,0.0,0.0,0.8,0.2],
 "PRÉDIO ADMINISTRATIVO||REMOÇÕES E DEMOLIÇÕES":[0.0,0.4,0.6,0.0,0.0],
 "PRÉDIO ADMINISTRATIVO||PAREDE":[0.0,0.4,0.6,0.0,0.0],
 "PRÉDIO ADMINISTRATIVO||PISO":[0.0,0.0,0.6,0.4,0.0],
 "PRÉDIO ADMINISTRATIVO||INSTALAÇÃO ELÉTRICA":[0.0,0.0,0.6,0.4,0.0],
 "PRÉDIO ADMINISTRATIVO||ILUMINAÇÃO":[0.0,0.0,0.6,0.4,0.0],
 "PRÉDIO ADMINISTRATIVO||INSTALAÇÃO HIDROSSANITÁRIA":[0.0,0.0,0.6,0.4,0.0],
 "PRÉDIO ADMINISTRATIVO||ESQUADRIAS":[0.0,0.0,0.0,0.8,0.2],
 "PRÉDIO ADMINISTRATIVO||IMPERMEABILIZAÇÃO":[0.0,0.0,0.0,0.8,0.2],
 "PRÉDIO ADMINISTRATIVO||PINTURA":[0.0,0.0,0.0,0.0,1.0],
 "PRÉDIO ADMINISTRATIVO||MARMORARIA":[0.0,0.0,0.0,0.8,0.2],
 "PRÉDIO ADMINISTRATIVO||CLIMATIZAÇÃO":[0.0,0.0,0.0,0.8,0.2],
 "ÁREA COMUM||REMOÇÕES E DEMOLIÇÕES":[0.0,0.0,0.0,0.0,1.0],
 "ÁREA COMUM||PISO":[0.0,0.0,0.0,0.8,0.2],
 "ÁREA COMUM||INSTALAÇÃO HIDROSSANITÁRIA":[0.0,0.0,0.0,0.0,1.0],
 "ÁREA COMUM||PINTURA":[0.0,0.0,0.0,0.0,1.0],
 "QUADRA POLIESPORTIVA||REMOÇÕES E DEMOLIÇÕES":[0.0,0.0,0.0,0.0,1.0],
 "QUADRA POLIESPORTIVA||PISO":[0.0,0.0,0.0,0.0,1.0],
 "QUADRA POLIESPORTIVA||INSTALAÇÃO ELÉTRICA":[0.0,0.0,0.0,0.0,1.0],
 "QUADRA POLIESPORTIVA||ILUMINAÇÃO":[0.0,0.0,0.0,0.0,1.0],
 "QUADRA POLIESPORTIVA||SERRALHERIA E TELAS":[0.0,0.0,0.0,0.0,1.0],
 "QUADRA POLIESPORTIVA||PINTURA":[0.0,0.0,0.0,0.0,1.0],
 "QUADRA POLIESPORTIVA||COBERTURA":[0.0,0.0,0.0,0.4,0.6],
 "QUADRA POLIESPORTIVA||ARTEFATOS":[0.0,0.0,0.0,0.0,1.0],
 "ÁREA COMUM||COBERTURA":[0.0,0.0,0.0,0.0,1.0],
 "CUSTOS NÃO PREVISTOS||CONTINGÊNCIA":[0.2,0.2,0.2,0.2,0.1999],
};
const MESES_MADALENA=["ago/26","set/26","out/26","nov/26","dez/26"];

const IR_MADALENA=[
 {data:"Medição ago/26",venc:"30/09/2026",prev:170694.61,rec:0,obs:"Recebimento no mês seguinte à medição"},
 {data:"Medição set/26",venc:"30/10/2026",prev:254227.93,rec:0,obs:"Recebimento no mês seguinte à medição"},
 {data:"Medição out/26",venc:"30/11/2026",prev:248345.89,rec:0,obs:"Recebimento no mês seguinte à medição"},
 {data:"Medição nov/26",venc:"30/12/2026",prev:273748.83,rec:0,obs:"Recebimento no mês seguinte à medição"},
 {data:"Medição dez/26",venc:"30/01/2027",prev:252982.74,rec:0,obs:"Recebimento no mês seguinte à medição"},
];
// ── Orçamento CRTR14 — Proposta 005/2026 · Reforma de prédio administrativo ──
// Conselho Regional dos Técnicos em Radiologia · SINAPI 11/2023 Pará · BDI 18% · NF 15%
const ORC_CRTR14={
 "Parede com Rachaduras":{
  "Demolição":[
   {cod:"97622",desc:"Demolição de alvenaria de bloco furado, de forma manual, sem reaproveitamento. AF_09/2023",und:"m2",qtd:18,unit:65,total:1170},
  ],
  "Parede":[
   {cod:"103357",desc:"Alvenaria de vedação de blocos cerâmicos furados na horizontal de 9x19x29 cm (espessura 9 cm) e argamassa de assentamento com preparo manual. AF_12/2021",und:"m2",qtd:18,unit:115,total:2070},
   {cod:"-",desc:"Emboço",und:"m2",qtd:36,unit:22,total:792},
   {cod:"-",desc:"Reboco",und:"m2",qtd:36,unit:38,total:1368},
  ],
  "Pintura":[
   {cod:"-",desc:"Fundo selador acrílico, aplicação manual em parede, uma demão. AF_04/2023",und:"m2",qtd:36,unit:8.8,total:316.80},
   {cod:"-",desc:"Aplicação de massa corrida em parede de ambiente interno",und:"m2",qtd:36,unit:33,total:1188},
   {cod:"-",desc:"Aplicação de tinta acrílica fosco (cor a definir)",und:"m2",qtd:36,unit:44,total:1584},
  ],
 },
 "Parede Infiltrações":{
  "Demolição":[
   {cod:"-",desc:"Remoção de pintura",und:"m2",qtd:24,unit:2.2,total:52.80},
   {cod:"-",desc:"Remoção de reboco",und:"m2",qtd:24,unit:5.5,total:132},
  ],
  "Parede":[
   {cod:"-",desc:"Emboço",und:"m2",qtd:24,unit:16.5,total:396},
   {cod:"-",desc:"Reboco",und:"m2",qtd:24,unit:26,total:624},
  ],
  "Pintura":[
   {cod:"-",desc:"Fundo selador acrílico, aplicação manual em parede, uma demão. AF_04/2023",und:"m2",qtd:24,unit:8.8,total:211.20},
   {cod:"-",desc:"Aplicação de massa corrida em parede de ambiente interno",und:"m2",qtd:24,unit:33,total:792},
   {cod:"-",desc:"Aplicação de tinta acrílica fosco (cor a definir)",und:"m2",qtd:24,unit:44,total:1056},
  ],
  "Cobertura":[
   {cod:"-",desc:"Revisão completa de telhado (com trocas onde for necessário)",und:"m2",qtd:130,unit:165,total:21450},
  ],
 },
 "Revitalização de Área Externa":{
  "Pintura":[
   {cod:"97650",desc:"Pintura externa com tinta sol e chuva",und:"m2",qtd:150,unit:38,total:5700},
   {cod:"-",desc:"Pintura de piso com tinta piso",und:"m2",qtd:40,unit:35,total:1400},
  ],
  "Cobertura":[
   {cod:"-",desc:"Cobertura com telhas cerâmicas e madeiramento",und:"m2",qtd:3,unit:495,total:1485},
  ],
 },
 "Melhorias em Geral":{
  "Troca de Piso":[
   {cod:"-",desc:"Demolição de revestimento cerâmico de forma manual, sem reaproveitamento. AF_09/2023",und:"m2",qtd:130,unit:25,total:3250},
   {cod:"-",desc:"Revestimento cerâmico para piso com placas tipo esmaltada 60x60 cm, aplicada em ambientes de área maior que 10 m2. AF_02/2023_PE",und:"m2",qtd:130,unit:115,total:14950},
   {cod:"-",desc:"Rodapé de poliestireno",und:"m",qtd:100,unit:33,total:3300},
   {cod:"-",desc:"Aplicação de rejunte",und:"m2",qtd:130,unit:22,total:2860},
  ],
  "Forro":[
   {cod:"97640",desc:"Demolição de forro PVC, de forma manual, sem reaproveitamento",und:"m2",qtd:130,unit:5.5,total:715},
   {cod:"-",desc:"Forro de gesso",und:"m2",qtd:130,unit:115,total:14950},
   {cod:"-",desc:"Aplicação de massa corrida em teto",und:"m2",qtd:28,unit:143,total:4004},
   {cod:"-",desc:"Aplicação de tinta acrílica branco neve fosco em teto",und:"m2",qtd:30,unit:143,total:4290},
  ],
  "Pintura Completa":[
   {cod:"-",desc:"Aplicação de tinta acrílica fosco (cor a definir)",und:"und",qtd:220,unit:44,total:9680},
  ],
  "Fachada em Pele de Vidro":[
   {cod:"-",desc:"Pele de vidro",und:"m2",qtd:30,unit:1650,total:49500},
  ],
  "Portas":[
   {cod:"-",desc:"Porta HDF completa",und:"und",qtd:10,unit:1200,total:12000,foraDoTotal:true},
  ],
 },
};
// Metadados por obra: cabeçalho e encargos aplicados sobre cada etapa
const ORC_META={
 lote_d18:{sub:"Proposta 060/2025 · SINAPI 11/2023 · BDI 12%"},
 madalena:{sub:"Prefeitura Municipal de Belém · SINAPI 06/2026 (Pará) · BDI 27,5% · encargos desonerados · valor final R$ 1.200.000,00",
  pagamento:"Medição mensal com recebimento no mês seguinte"},
 crtr14:{sub:"Proposta 005/2026 · SINAPI 11/2023 (Pará) · BDI 18% · NF 15% · prazo 75 dias corridos",bdi:0.18,nf:0.15,
  pagamento:"Entrada 30% (R$ 60.774,65) + 30% em 30 dias + 30% em 60 dias + 10% na conclusão (R$ 20.258,24)"},
};
// Orçamentos por obra
const ORC_POR_OBRA={lote_d18:ORC,crtr14:ORC_CRTR14,madalena:ORC_MADALENA};
// Cronograma informado pelo cliente (matriz de % por subetapa e por mês).
// Quando existe, ele substitui as janelas calculadas pelo sistema.
const CRONO_POR_OBRA={madalena:{matriz:CRONO_MADALENA,meses:5,inicio:"01/08/2026",defasagemRec:1,
 nota:"Cronograma da planilha comprimido para 5 meses (orçamento 08/2026: equipe orçada em 5 meses)."}};
function chaveObra(obraId,obra){
 if(obraId==="lote_d18")return"lote_d18";
 const nome=((obra&&obra.nome)||"").toUpperCase().replace(/[^A-Z0-9]/g,"");
 if(nome.indexOf("MADALENA")>=0)return"madalena";
 if(nome.indexOf("CRTR14")>=0)return"crtr14";
 return null;
}
function chaveOrc(obraId,obra){
 if(ORC_POR_OBRA[obraId])return obraId;
 return chaveObra(obraId,obra);
}
function Orcamento({obraId,obra}){
 const chave=chaveOrc(obraId,obra);
 const ORC=chave?ORC_POR_OBRA[chave]:null;
 const META=(chave&&ORC_META[chave])||{};
 const BDI=Number(META.bdi)||0;
 const NF=Number(META.nf)||0;
 const temOrc=!!ORC;
 const [sel,setSel]=useState("Administrativo");
 if(!temOrc)return(
  <div style={{textAlign:"center",padding:"60px 20px",color:"#94a3b8"}}>
   <div style={{fontSize:40,marginBottom:12}}>📋</div>
   <div style={{fontSize:15,fontWeight:700,color:"#64748b",marginBottom:6}}>Orçamento não cadastrado</div>
   <div style={{fontSize:13,maxWidth:340,margin:"0 auto",lineHeight:1.5}}>Envie a planilha de orçamento desta obra para que ela seja carregada aqui.</div>
  </div>
 );
 const pavs=Object.keys(ORC);
 const selOk=ORC[sel]?sel:pavs[0];
 // Soma dos itens da etapa (não inclui itens marcados como fora do total da proposta)
 const pavTot=p=>Object.values(ORC[p]).reduce((s,its)=>s+its.reduce((ss,i)=>ss+(i.foraDoTotal?0:i.total),0),0);
 const pavFinal=p=>{const t=pavTot(p);const b=t*BDI;const n=(t+b)*NF;return t+b+n;};
 const pavFora=p=>Object.values(ORC[p]).reduce((s,its)=>s+its.reduce((ss,i)=>ss+(i.foraDoTotal?i.total:0),0),0);
 const grandTotal=pavs.reduce((s,p)=>s+pavFinal(p),0);
 const totalFora=pavs.reduce((s,p)=>s+pavFora(p),0);
 const temEncargos=BDI>0||NF>0;
 const tEtapa=pavTot(selOk);const bEtapa=tEtapa*BDI;const nEtapa=(tEtapa+bEtapa)*NF;
 const Linha=({l,v,forte})=>(
  <div style={{display:"flex",justifyContent:"space-between",padding:"6px 14px",fontSize:12,fontWeight:forte?800:600,color:forte?"#1e293b":"#475569",background:forte?"#fef3c7":"#f8fafc",borderTop:"1px solid #f1f5f9"}}>
   <span>{l}</span><span>{fmtBR(v)}</span>
  </div>
 );
 return(
  <div>
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,flexWrap:"wrap",gap:8}}>
    <div>
     <h2 style={{fontSize:20,fontWeight:800,color:"#f59e0b",margin:0}}>Orçamento Detalhado</h2>
     <p style={{fontSize:12,color:"#94a3b8",margin:"4px 0 0",maxWidth:420,lineHeight:1.4}}>{META.sub||"Orçamento sintético"}</p>
    </div>
    <div style={{textAlign:"right"}}>
     <div style={{fontSize:20,fontWeight:800,color:"#f59e0b"}}>{fmtBR(temEncargos?grandTotal:(obra?obra.contrato:0))}</div>
     <div style={{fontSize:10,color:"#94a3b8"}}>{temEncargos?"total do investimento (c/ BDI e NF)":"valor do contrato"}</div>
     {temEncargos&&obra&&Math.abs((obra.contrato||0)-grandTotal)>1&&(
      <div style={{fontSize:10,color:"#ef4444",marginTop:2}}>contrato cadastrado: {fmtBR(obra.contrato)}</div>
     )}
    </div>
   </div>
   {META.pagamento&&(
    <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:10,padding:"10px 14px",fontSize:11,color:"#1e40af",lineHeight:1.5,marginBottom:16}}>
     💳 <b>Forma de pagamento:</b> {META.pagamento}
    </div>
   )}
   {totalFora>0&&(
    <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"10px 14px",fontSize:11,color:"#991b1b",lineHeight:1.5,marginBottom:16}}>
     ⚠️ Há {fmtBR(totalFora)} em itens que constam na planilha mas <b>não foram somados no total da proposta</b> (marcados abaixo). Confira antes de fechar o contrato.
    </div>
   )}
   <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>
    {pavs.map(p=><button key={p} onClick={()=>setSel(p)} style={{background:selOk===p?"#f8c400":"#fff",color:selOk===p?"#0f172a":"#64748b",border:"1px solid #e2e8f0",borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
     {p} <span style={{opacity:.7,fontWeight:400}}>({fmtBR(temEncargos?pavFinal(p):pavTot(p))})</span>
    </button>)}
   </div>
   {Object.entries(ORC[selOk]).map(([sec,items])=>{
    const tot=items.reduce((s,i)=>s+(i.foraDoTotal?0:i.total),0);
    return(
     <div key={sec} style={{marginBottom:16}}>
      <div style={{background:"#1e40af",color:"#fff",fontWeight:700,fontSize:13,padding:"8px 14px",borderRadius:"8px 8px 0 0",display:"flex",justifyContent:"space-between"}}>
       <span>{sec}</span><span>{fmtBR(tot)}</span>
      </div>
      <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:"0 0 8px 8px",overflow:"hidden"}}>
       {items.map((it,i)=>(
        <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderBottom:i<items.length-1?"1px solid #f1f5f9":"none",background:it.foraDoTotal?"#fff7ed":"#fff"}}>
         <div style={{flex:1,minWidth:0,paddingRight:12}}>
          <div style={{fontSize:12,color:"#1e293b",lineHeight:1.35}}>{it.desc}</div>
          <div style={{fontSize:10,color:"#94a3b8",marginTop:3}}>{it.cod!=="-"&&`SINAPI ${it.cod} · `}{it.qtd} {it.und} × {fmtBR(it.unit)}</div>
          {it.foraDoTotal&&<div style={{fontSize:10,color:"#c2410c",fontWeight:700,marginTop:3}}>⚠️ não somado no total da proposta</div>}
         </div>
         <div style={{fontWeight:700,color:it.foraDoTotal?"#c2410c":"#f59e0b",fontSize:13,whiteSpace:"nowrap"}}>{fmtBR(it.total)}</div>
        </div>
       ))}
      </div>
     </div>
    );
   })}
   {temEncargos&&(
    <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,overflow:"hidden",marginBottom:20}}>
     <div style={{background:"#f1f5f9",padding:"8px 14px",fontSize:12,fontWeight:800,color:"#1e2d5a"}}>Fechamento — {selOk}</div>
     <Linha l="Total dos serviços" v={tEtapa}/>
     {BDI>0&&<Linha l={"BDI "+(BDI*100).toFixed(0)+"%"} v={bEtapa}/>}
     {NF>0&&<Linha l={"NF "+(NF*100).toFixed(0)+"%"} v={nEtapa}/>}
     <Linha l="Total final da etapa" v={tEtapa+bEtapa+nEtapa} forte/>
    </div>
   )}
   {temEncargos&&(
    <div style={{background:"#1e2d5a",borderRadius:12,padding:18,textAlign:"center"}}>
     <div style={{fontSize:11,color:"#94a3b8",textTransform:"uppercase",letterSpacing:1}}>Total do Investimento</div>
     <div style={{fontSize:30,fontWeight:800,color:"#f8c400",marginTop:4}}>{fmtBR(grandTotal)}</div>
     <div style={{fontSize:11,color:"#94a3b8",marginTop:6}}>{pavs.length} frentes de serviço · valores com BDI e NF</div>
    </div>
   )}
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
function Recebimentos({R,sv,obra}){
 const [modal,setModal]=useState(false);const [idx,setIdx]=useState(null);const [form,setForm]=useState({});
 const tR=R.reduce((s,r)=>s+(r.rec||0),0);
 const oe=i=>{setIdx(i);setForm({...R[i]});setModal(true);};
 const save=()=>{const n=[...R];n[idx]=form;sv(n);setModal(false);};
 const vazia=r=>!(r.data||"").trim()&&!(r.obs||"").trim()&&!Number(r.prev)&&!Number(r.rec);
 const del=i=>{
  const r=R[i];
  const desc=((r.data||"")+" "+(r.obs||"")).trim();
  if(!vazia(r)&&!confirm("Excluir a parcela "+(desc?'"'+desc+'"':"selecionada")+" de "+fmtBR(r.prev||0)+"? Essa ação não pode ser desfeita."))return;
  const n=[...R];n.splice(i,1);sv(n);setModal(false);setIdx(null);
 };
 const delModal=()=>{if(idx!==null)del(idx);};
 const brancos=R.filter(vazia).length;
 // Obras de referência: permite repor as parcelas quando o orçamento muda
 const refParcelas=chaveObra(obra?obra.id:"",obra)==="madalena"?IR_MADALENA:null;
 const totalRef=refParcelas?refParcelas.reduce((s,r)=>s+(Number(r.prev)||0),0):0;
 const totalAtual=R.reduce((s,r)=>s+(Number(r.prev)||0),0);
 const recebidoAlgo=R.reduce((s,r)=>s+(Number(r.rec)||0),0)>0;
 const podeRecarregar=!!refParcelas&&!recebidoAlgo&&Math.abs(totalAtual-totalRef)>1;
 const recarregar=()=>{
  if(!confirm("Substituir as parcelas atuais pelas do orçamento vigente ("+fmtBR(totalRef)+")? Os valores já recebidos não seriam preservados."))return;
  sv(refParcelas.map(r=>({...r})));
 };
 const limparBrancos=()=>{
  if(!confirm("Remover "+brancos+" parcela(s) em branco (sem mês, sem valor e sem observação)?"))return;
  sv(R.filter(r=>!vazia(r)));
 };
 return(
 <div>
 <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
 <h2 style={{fontSize:20,fontWeight:800,color:"#f59e0b",margin:0}}>Recebimentos</h2>
 <button onClick={()=>sv([...R,{data:"",venc:"",prev:0,rec:0,obs:""}])} style={BP}>+ Parcela</button>
 </div>
 {podeRecarregar&&(
  <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}>
   <span style={{fontSize:12,color:"#1e40af"}}>As parcelas não batem com o orçamento atual da obra ({fmtBR(totalRef)}).</span>
   <button onClick={recarregar} style={{...BS,background:"#dbeafe",color:"#1e40af",fontSize:12}}>Recarregar parcelas do orçamento</button>
  </div>
 )}
 {brancos>0&&(
  <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}>
   <span style={{fontSize:12,color:"#92400e"}}>Há <b>{brancos}</b> parcela(s) em branco na lista.</span>
   <button onClick={limparBrancos} style={{...BS,background:"#fee2e2",color:"#b91c1c",fontSize:12}}>Remover parcelas em branco</button>
  </div>
 )}
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:12,marginBottom:20}}>
 <KCard label="Total do Contrato" value={fmtBR(obra?obra.contrato:0)} color="#f8c400"/>
 <KCard label="Total Recebido" value={fmtBR(tR)} color="#4ade80"/>
 <KCard label="Saldo Devedor" value={fmtBR((obra?obra.contrato:0)-tR)} color="#f87171"/>
 <KCard label="% Recebido" value={pct(tR/(obra&&obra.contrato?obra.contrato:1)*100)} color="#60a5fa"/>
 </div>
 <div style={{background:"#fff",borderRadius:12,overflowX:"auto"}}>
 <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
 <thead><tr style={{background:"#f8fafc"}}>
 {["Mês","Vencimento","Previsto","Recebido neste mês","Saldo","% Rec.","Obs.",""].map(h=><th key={h} style={{padding:"9px 14px",textAlign:"left",color:"#64748b",fontWeight:700,whiteSpace:"nowrap"}}>{h}</th>)}
 </tr></thead>
 <tbody>{R.map((r,i)=>{
 const sl=(r.prev||0)-(r.rec||0);const p=r.prev>0?(r.rec||0)/r.prev*100:0;
 return(
 <tr key={i} style={{borderBottom:"1px solid #0f172a30",background:p>=100?"#16a34a05":"transparent"}}>
 <td style={{padding:"10px 14px",fontWeight:600}}>{r.data||"—"}</td>
 <td style={{padding:"10px 14px",color:r.venc?"#64748b":"#cbd5e1",whiteSpace:"nowrap"}}>{r.venc||"—"}</td>
 <td style={{padding:"10px 14px",color:"#64748b"}}>{fmtBR(r.prev||0)}</td>
 <td style={{padding:"10px 14px",color:"#10b981",fontWeight:700}}>{fmtBR(r.rec||0)}</td>
 <td style={{padding:"10px 14px",color:sl>0?"#f87171":"#4ade80",fontWeight:700}}>{fmtBR(sl)}</td>
 <td style={{padding:"10px 14px",color:p>=100?"#4ade80":p>0?"#fbbf24":"#64748b",fontWeight:700}}>{pct(p)}</td>
 <td style={{padding:"10px 14px",color:"#64748b",fontSize:11}}>{r.obs}</td>
 <td style={{padding:"10px 14px",whiteSpace:"nowrap"}}>
 <button onClick={()=>oe(i)} style={{background:"#f1f5f9",border:"none",color:"#64748b",padding:"3px 10px",borderRadius:6,cursor:"pointer",fontSize:11}}>Editar</button>
 <button onClick={()=>del(i)} title="Excluir parcela" style={{background:"#fee2e2",border:"none",color:"#ef4444",padding:"3px 9px",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:700,marginLeft:6}}>✕</button>
</td>
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
 <button onClick={delModal} style={{...BS,background:"#fee2e2",color:"#ef4444"}}>Excluir</button>
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
 // Semana sugerida = semana atual da obra (contada da data de início real), nunca menor que a última medida
 const semSugerida=Math.max(lastSem+1,1);
 const [semManual,setSemManual]=useState("");
 const nextSem=semManual!==""&&Number(semManual)>0?Number(semManual):semSugerida;
 const nextSemLabel=semLabel(nextSem);
 const inicioObra=obra?obra.inicio:"";

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
  setModal(false);setSemData({});setSemObs("");setSemManual("");
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
 const temEmpreitadaNoAvanco=A.reduce((s2,a)=>s2+(a.meds||[]).filter(m=>m.obs==="(Empreitada)").length,0);
 const limparEmpreitada=()=>{
  if(!confirm("Remover os lançamentos de empreitada do avanço físico da obra? O acumulado de cada atividade será reduzido na mesma quantidade. Os dados de pagamento na aba Empreitada não são afetados."))return;
  const n=A.map(a=>{
   const emps=(a.meds||[]).filter(m=>m.obs==="(Empreitada)");
   if(emps.length===0)return a;
   const sub=emps.reduce((s2,m)=>s2+(Number(m.qtd)||0),0);
   return{...a,meds:(a.meds||[]).filter(m=>m.obs!=="(Empreitada)"),acum:Math.max((a.acum||0)-sub,0)};
  });
  sv(n);
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

 if(!A||A.length===0)return(
  <div style={{textAlign:"center",padding:"60px 20px",color:"#94a3b8"}}>
   <div style={{fontSize:40,marginBottom:12}}>📐</div>
   <div style={{fontSize:15,fontWeight:700,color:"#64748b",marginBottom:6}}>Nenhuma atividade cadastrada</div>
   <div style={{fontSize:13,maxWidth:340,margin:"0 auto",lineHeight:1.5}}>Envie a planilha de acompanhamento desta obra para carregar as atividades e começar as medições.</div>
  </div>
 );
 return(
  <div>
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
    <h2 style={{fontSize:20,fontWeight:800,color:"#f59e0b",margin:0}}>Medições Semanais</h2>
    <button onClick={()=>{setSemData({});setSemObs("");setModal(true);}} style={BP}>+ Medição {nextSemLabel}</button>
   </div>
   <div style={{fontSize:12,color:"#64748b",marginBottom:12}}>Próxima medição: <b style={{color:"#f59e0b"}}>{nextSemLabel}</b>{inicioObra?<span> · obra iniciada em <b>{inicioObra}</b></span>:null}<br/><span style={{fontSize:11,color:"#94a3b8"}}>A numeração é sequencial — a data de cada medição é gravada no lançamento.</span></div>
   {!isEng&&temEmpreitadaNoAvanco>0&&(
    <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"12px 14px",marginBottom:14}}>
     <div style={{fontSize:12,color:"#991b1b",lineHeight:1.5,marginBottom:8}}>
      ⚠️ Existem <b>{temEmpreitadaNoAvanco}</b> lançamento(s) vindos da aba Empreitada dentro do avanço da obra (versões anteriores do sistema). Eles duplicam atividades já medidas aqui.
     </div>
     <button onClick={limparEmpreitada} style={{...BS,background:"#fee2e2",color:"#b91c1c",fontSize:12}}>Remover duplicidade de empreitada</button>
    </div>
   )}
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
   <div style={{display:"grid",gap:16}}>
    {(()=>{
     const secGroups={};
     items.forEach((a,i)=>{
      const sec=a.sec||"Geral";
      if(!secGroups[sec])secGroups[sec]=[];
      secGroups[sec].push({a,i});
     });
     return Object.keys(secGroups).map(sec=>{
      const groupItems=secGroups[sec];
      return(
       <div key={sec}>
        <div style={{background:"#dbeafe",color:"#1e40af",fontWeight:800,fontSize:12,padding:"6px 14px",borderRadius:8,marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}>{sec}</div>
        <div style={{display:"grid",gap:8}}>
         {groupItems.map(({a,i})=>{
          const ativIdx=A.indexOf(a);
          const p=a.total>0?Math.min((a.acum/a.total)*100,100):0;
          return(
           <div key={i} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:14,boxShadow:"0 1px 3px #0001"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
             <div style={{flex:1,minWidth:0,paddingRight:8}}>
              <span style={{fontSize:10,color:"#64748b",marginRight:6}}>{a.cod}</span>
              <span style={{fontSize:13,fontWeight:700,color:"#1e293b"}}>{a.ativ}</span>
              <span style={{fontSize:10,color:"#94a3b8",marginLeft:6}}>peso {pct(a.peso_obra||0)}</span>
             </div>
             <span style={{fontWeight:800,fontSize:14,color:p>=100?"#16a34a":p>0?"#f59e0b":"#94a3b8",whiteSpace:"nowrap"}}>{pct(p)}</span>
            </div>
            <div style={{background:"#f1f5f9",borderRadius:6,height:8,overflow:"hidden",marginBottom:8}}>
             <div style={{background:p>=100?"#16a34a":"#f8c400",height:"100%",width:`${p}%`}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
             <span style={{fontSize:11,color:"#475569"}}>Acumulado: <b>{a.acum} / {a.total} {a.und}</b></span>
             <span onClick={()=>{setEditTotal(ativIdx);setEditTotalVal(String(a.total));setEditTotalUnd(a.und);}} style={{fontSize:11,color:"#3b82f6",cursor:"pointer"}}>Total: {a.total} {a.und} ✏️</span>
            </div>
            {a.meds&&a.meds.length>0&&(
             <div style={{marginTop:10,borderTop:"1px solid #f1f5f9",paddingTop:8}}>
              <div style={{fontSize:10,fontWeight:700,color:"#64748b",marginBottom:4}}>HISTÓRICO (toque para editar)</div>
              {a.meds.map((m,mi)=>(
               <div key={mi} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:11,color:"#64748b",padding:"2px 0"}}>
                <span>{m.label} — <b style={{color:"#1e293b"}}>+{m.qtd} {a.und}</b>{m.obs&&" · "+m.obs}</span>
                <span onClick={()=>{setEditMed({ativIdx,medIdx:mi});setEditQtd(String(m.qtd));}} style={{color:"#3b82f6",cursor:"pointer",fontSize:10}}>editar ›</span>
               </div>
              ))}
             </div>
            )}
           </div>
          );
         })}
        </div>
       </div>
      );
     });
    })()}
   </div>
   
   {modal&&(
    <Modal onClose={()=>setModal(false)} title={`Registrar Medição — ${nextSemLabel}`}>
     <div style={{background:"#fef3c7",borderRadius:8,padding:12,marginBottom:16,fontSize:12,color:"#92400e"}}>
      <b>Medição {nextSemLabel}</b> · {new Date().toLocaleDateString("pt-BR")}<br/>Informe os avanços. Atividades já 100% concluídas não aparecem.
      <div style={{marginTop:8,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
       <span style={{fontSize:11,color:"#64748b"}}>Nº da medição:</span>
       <input type="number" min="1" value={semManual===""?semSugerida:semManual} onChange={e=>setSemManual(e.target.value)} style={{...IS,width:80,marginTop:0,padding:"5px 8px"}}/>
       {semManual!==""&&<button onClick={()=>setSemManual("")} style={{...BS,fontSize:11,padding:"4px 10px"}}>usar sugerida (S{semSugerida})</button>}
      </div>
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
    const COLORS={};etapasDe(A).forEach(p=>{COLORS[p]=corEtapa(p,A);});
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
 const [editUnit,setEditUnit]=useState(null);// {empId,ii,unit,und}
 const [editUnitForm,setEditUnitForm]=useState({unit:0,und:""});
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
 // A medição da empreitada serve APENAS para organizar o pagamento do empreiteiro.
 // Ela não altera o avanço físico da obra (isso é feito só na aba Medições),
 // para não contar a mesma atividade duas vezes.
 setModal(false);setSemData({});setFormObs("");
 };
 const savePag=()=>{
 const n=[...emp];const ei=emp.findIndex(e=>e.id===selEmp);const e={...n[ei]};
 e.pagamentos=[...(e.pagamentos||[]),{...pagForm,data:new Date().toLocaleDateString("pt-BR")}];
 n[ei]=e;sv(n);setModal(false);
 };
 const saveEditUnit=()=>{
  if(!editUnit)return;
  const n=emp.map(emp2=>{
   if(emp2.id!==editUnit.empId)return emp2;
   const itens=[...(emp2.itens||[])];
   itens[editUnit.ii]={...itens[editUnit.ii],unit:Number(editUnitForm.unit||0),und:editUnitForm.und||itens[editUnit.ii].und};
   return{...emp2,itens};
  });
  sv(n);setEditUnit(null);
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
 <span style={{fontSize:10,color:"#64748b"}}>Und:</span>
 <select value={sel.und||a.und||"M2"} onChange={e=>{const its=[...novaEmpForm.itens];const idx=its.findIndex(x=>x.aIdx===a.idx);its[idx]={...its[idx],und:e.target.value};setNovaEmpForm(f=>({...f,itens:its}));}} style={{...IS,width:70,marginTop:0,padding:"3px 4px",appearance:"none"}}>
  {["M2","M3","M","UND","KG","VB","ML","Saco","Dúzia","Ponto"].map(u=><option key={u} value={u}>{u}</option>)}
 </select>
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
 <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:"10px 14px",fontSize:11,color:"#92400e",lineHeight:1.5,marginBottom:16}}>
  ℹ️ As medições desta aba servem <b>apenas para o pagamento do empreiteiro</b>. Elas não alteram o percentual de conclusão da obra — o avanço físico é contabilizado somente na aba <b>Medições</b>.
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
 <td style={{padding:"7px 10px",textAlign:"right"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:4}}>
       <span style={{color:it.unit>0?"#64748b":"#ef4444",fontWeight:it.unit>0?400:700}}>{it.unit>0?fmtBR(it.unit):"R$ 0"}</span>
       <button onClick={()=>{setEditUnit({empId:e.id,ii});setEditUnitForm({unit:it.unit||0,und:it.und||"M2"});}} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,padding:"1px 3px",color:"#94a3b8"}}>✏️</button>
      </div>
     </td>
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
 <div style={{background:"#fef3c7",borderRadius:8,padding:10,marginBottom:12,fontSize:12,color:"#92400e"}}><b>Medição {semLabel(newSem)}</b> — {new Date().toLocaleDateString("pt-BR")}</div>
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
 {editUnit&&(
  <Modal onClose={()=>setEditUnit(null)} title="Editar Item da Empreitada">
   <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
    <label style={{fontSize:12,color:"#64748b"}}>Valor Unitário (R$)
     <input type="number" value={editUnitForm.unit} onChange={e=>setEditUnitForm(f=>({...f,unit:e.target.value}))} style={IS} autoFocus/>
    </label>
    <label style={{fontSize:12,color:"#64748b"}}>Unidade
     <select value={editUnitForm.und} onChange={e=>setEditUnitForm(f=>({...f,und:e.target.value}))} style={{...IS,appearance:"none"}}>
     {["M2","M3","M","UND","KG","VB","ML","Saco","Dúzia","Ponto"].map(u=><option key={u} value={u}>{u}</option>)}
    </select>
    </label>
   </div>
   <p style={{fontSize:11,color:"#94a3b8",margin:"10px 0 0"}}>Valor de produção = concluído × valor unitário.</p>
   <div style={{display:"flex",gap:10,marginTop:20}}>
    <button onClick={saveEditUnit} style={{...BP,flex:1}}>Salvar</button>
    <button onClick={()=>setEditUnit(null)} style={{...BS,flex:1}}>Cancelar</button>
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
function Compras({CP,sv,svE,ES,obra}){
 const [modal,setModal]=useState(false);const [confirmModal,setConfirmModal]=useState(null);
 const [idx,setIdx]=useState(null);const [form,setForm]=useState({});
 const [localArm,setLocalArm]=useState("");const [tipoMat,setTipoMat]=useState("Material de Obra");
 const sm={no_prazo:["#10b981","No Prazo"],atrasado:["#ef4444","Atrasado"],aguardando:["#f59e0b","Aguardando"]};
 
 // Ordenadas pela chegada prevista; as sem data vão para o fim
 // Importação manual das compras de referência (quando a automática não rodou)
 const chaveC=t=>String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[^A-Z0-9]/g,"");
 const refCompras=chaveObra(obra?obra.id:"",obra)==="madalena"?CP_MADALENA:null;
 const jaTem=CP.map(x=>chaveC(x.item));
 const faltantes=refCompras?refCompras.filter(c=>jaTem.indexOf(chaveC(c.item))<0):[];
 const importar=()=>{
  if(!confirm("Adicionar "+faltantes.length+" item(ns) do orçamento Jurunense à lista de compras?"))return;
  sv(CP.concat(faltantes));
 };
 const pendentes=CP.filter(c=>c.status!=="entregue").slice().sort((a,b)=>{
  const da=parseDataFlex(a.dtCh),db=parseDataFlex(b.dtCh);
  if(da&&db&&da.getTime()!==db.getTime())return da.getTime()-db.getTime();
  if(da&&!db)return -1;
  if(!da&&db)return 1;
  return String(a.item||"").localeCompare(String(b.item||""));
 });
 const oe=i=>{const ri=CP.indexOf(pendentes[i]);setIdx(ri);setForm({...CP[ri]});setModal(true);};
 const save=()=>{const n=[...CP];if(idx===null)n.push(form);else n[idx]=form;sv(n);setModal(false);};
 const excluir=i=>{
  const c=pendentes[i];
  if(!confirm('Excluir a compra "'+c.item+'"? Ela não vai para o estoque.'))return;
  const ri=CP.indexOf(c);const n=[...CP];n.splice(ri,1);sv(n);setModal(false);setIdx(null);
 };
 const excluirDoModal=()=>{
  if(idx===null)return;
  const c=CP[idx];
  if(!confirm('Excluir a compra "'+c.item+'"?'))return;
  const n=[...CP];n.splice(idx,1);sv(n);setModal(false);setIdx(null);
 };
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
 {faltantes.length>0&&(
  <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}>
   <span style={{fontSize:12,color:"#1e40af"}}>{faltantes.length} item(ns) do orçamento Jurunense 436021488 ainda não estão na lista.</span>
   <button onClick={importar} style={{...BS,background:"#dbeafe",color:"#1e40af",fontSize:12,fontWeight:700}}>Importar agora</button>
  </div>
 )}
 {pendentes.length===0&&<div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:40,textAlign:"center",color:"#64748b"}}>✅ Nenhuma compra pendente. Todos os itens foram entregues.</div>}
 {pendentes.length>0&&(
  <div style={{fontSize:11,color:"#94a3b8",marginBottom:10}}>
   {pendentes.length} item(ns) aguardando · ordenados pela chegada prevista
  </div>
 )}
 <div style={{display:"grid",gap:10}}>
 {pendentes.map((c,i)=>{const[sc,sl]=sm[c.status]||sm.aguardando;return(
 <div key={i} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:16,boxShadow:"0 1px 3px #0001"}}>
 <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
 <div><div style={{fontWeight:700,fontSize:14,color:"#1e293b"}}>{c.item}</div><div style={{fontSize:12,color:"#64748b"}}>Frente: {c.frente}</div></div>
 <div style={{display:"flex",gap:6,alignItems:"flex-start",flexWrap:"wrap",justifyContent:"flex-end"}}>
 <span style={{background:sc+"22",color:sc,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20}}>{sl}</span>
 <button onClick={()=>confirmar(i)} style={{background:"#10b981",border:"none",color:"#fff",padding:"4px 10px",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:700}}>✓ Chegou</button>
 <button onClick={()=>oe(i)} style={{background:"#f1f5f9",border:"none",color:"#64748b",padding:"3px 8px",borderRadius:6,cursor:"pointer",fontSize:11}}>Editar</button>
      <button onClick={()=>excluir(i)} title="Excluir compra" style={{background:"#fee2e2",border:"none",color:"#ef4444",padding:"3px 8px",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:700}}>✕</button>
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
 {idx!==null&&<button onClick={excluirDoModal} style={{...BS,background:"#fee2e2",color:"#ef4444"}}>Excluir</button>}
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

// ════════════════════ EMPRÉSTIMOS (somente admin) ════════════════════
function Emprestimos({EM,sv}){
 const lista=EM||[];
 const [modal,setModal]=useState(false); // "novo" | "pag" | "edit"
 const [selId,setSelId]=useState(null);
 const [form,setForm]=useState({nome:"",instituicao:"",valorContratado:0,valorLiberado:0,valorTotal:0,parcelas:0,valorParcela:0,data:"",dataParcela1:"",taxaMes:"",obs:"",noCaixa:false});
 const [pagForm,setPagForm]=useState({valor:0,desconto:0,data:"",obs:""});

 const totalPagoDe=e=>(e.pagamentos||[]).reduce((s,p)=>s+(Number(p.valor)||0),0);
 const liberadoDe=e=>(e.valorLiberado===undefined||e.valorLiberado===null||e.valorLiberado===""?Number(e.valorContratado)||0:Number(e.valorLiberado)||0);
 // Descontos obtidos ao antecipar parcelas: abatem a dívida sem sair dinheiro do caixa
 const descontoDe=e=>(e.pagamentos||[]).reduce((s,p)=>s+(Number(p.desconto)||0),0);
 const contratadoDe=e=>Number(e.valorTotal)||Number(e.valorContratado)||0;
 const devidoDe=e=>Math.max(contratadoDe(e)-descontoDe(e),0); // total a desembolsar já com abatimentos
 const saldoDe=e=>Math.max(devidoDe(e)-totalPagoDe(e),0);
 const credito=lista.reduce((s,e)=>s+(Number(e.valorContratado)||0),0);
 const devido=lista.reduce((s,e)=>s+devidoDe(e),0);
 const pago=lista.reduce((s,e)=>s+totalPagoDe(e),0);
 const aPagar=Math.max(devido-pago,0);
 const descontos=lista.reduce((s,e)=>s+descontoDe(e),0);
 // Entrada do empréstimo que ainda não foi somada ao saldo em caixa informado
 const foraDoCaixa=lista.reduce((s,e)=>s+(e.noCaixa?0:liberadoDe(e)),0);
 const liberadoTot=lista.reduce((s,e)=>s+liberadoDe(e),0);
 const custoOperacao=Math.max(credito-liberadoTot,0); // IOF, tarifas e seguros retidos na liberação
 const custoCredito=Math.max(devido-liberadoTot,0);   // juros + custo da operação
 const toggleCaixa=e=>sv(lista.map(x=>x.id===e.id?{...x,noCaixa:!x.noCaixa}:x));

 const abrirNovo=()=>{setSelId(null);setForm({nome:"",instituicao:"",valorContratado:0,valorLiberado:0,valorTotal:0,parcelas:0,valorParcela:0,data:new Date().toLocaleDateString("pt-BR"),dataParcela1:"",taxaMes:"",obs:"",noCaixa:false});setModal("novo");};
 const abrirEdit=e=>{setSelId(e.id);setForm({nome:e.nome||"",instituicao:e.instituicao||"",valorContratado:e.valorContratado||0,valorLiberado:(e.valorLiberado===undefined?e.valorContratado:e.valorLiberado)||0,valorTotal:e.valorTotal||0,parcelas:e.parcelas||0,valorParcela:e.valorParcela||0,data:e.data||"",dataParcela1:e.dataParcela1||"",taxaMes:(e.taxaMes===undefined?"":e.taxaMes),obs:e.obs||"",noCaixa:!!e.noCaixa});setModal("edit");};
 const salvar=()=>{
  if(!form.nome.trim()){alert("Informe a identificação do empréstimo.");return;}
  const parcelas=Number(form.parcelas)||0;
  const valorParcela=Number(form.valorParcela)||0;
  let valorTotal=Number(form.valorTotal)||0;
  if(!valorTotal&&parcelas>0&&valorParcela>0)valorTotal=parcelas*valorParcela;
  if(!valorTotal)valorTotal=Number(form.valorContratado)||0;
  const contratado=Number(form.valorContratado)||0;
  const liberado=form.valorLiberado===""||form.valorLiberado===undefined?contratado:(Number(form.valorLiberado)||0);
  const base={nome:form.nome,instituicao:form.instituicao,valorContratado:contratado,valorLiberado:liberado,valorTotal,parcelas,valorParcela,data:form.data,dataParcela1:form.dataParcela1||"",taxaMes:form.taxaMes===""?"":Number(form.taxaMes)||0,obs:form.obs,noCaixa:!!form.noCaixa};
  if(modal==="edit"&&selId){
   sv(lista.map(e=>e.id===selId?{...e,...base}:e));
  }else{
   sv([...lista,{...base,id:"emp"+Date.now(),pagamentos:[]}]);
  }
  setModal(false);
 };
 const salvarPag=()=>{
  const v=Number(pagForm.valor)||0;
  if(v<=0){alert("Informe o valor pago.");return;}
  sv(lista.map(e=>e.id===selId?{...e,pagamentos:[...(e.pagamentos||[]),{valor:v,desconto:Number(pagForm.desconto)||0,data:pagForm.data||new Date().toLocaleDateString("pt-BR"),obs:pagForm.obs}]}:e));
  setModal(false);
 };
 const delPag=(eid,pi)=>{
  if(!confirm("Excluir este pagamento?"))return;
  sv(lista.map(e=>{if(e.id!==eid)return e;const ps=[...(e.pagamentos||[])];ps.splice(pi,1);return{...e,pagamentos:ps};}));
 };
 const delEmp=e=>{
  if(!confirm('Excluir o empréstimo "'+e.nome+'" e todo o histórico de pagamentos?'))return;
  sv(lista.filter(x=>x.id!==e.id));
 };

 return(
  <div>
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6,gap:8,flexWrap:"wrap"}}>
    <div>
     <h2 style={{fontSize:20,fontWeight:800,color:"#f59e0b",margin:0}}>Empréstimo</h2>
     <p style={{fontSize:12,color:"#94a3b8",margin:"4px 0 0"}}>Crédito contratado para a obra · não entra no custo nem no recebimento da obra</p>
    </div>
    <button onClick={abrirNovo} style={BP}>+ Novo Empréstimo</button>
   </div>
   <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:10,padding:"10px 14px",fontSize:11,color:"#1e40af",lineHeight:1.5,margin:"14px 0 18px"}}>
    🔒 Informação restrita ao administrador. A entrada do empréstimo não é lançada em Recebimentos e as parcelas não entram em Custos da obra — o saldo devedor entra apenas no <b>Total a Pagar</b> do Dashboard e no Caixa.
   </div>

   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:20}}>
    <KCard label="Valor Contratado" value={fmtBR(credito)} color="#0ea5e9" sub={lista.length+" contrato(s)"}/>
    <KCard label="A Pagar" value={fmtBR(aPagar)} color="#ef4444" sub={"total a quitar "+fmtBR(devido)}/>
    <KCard label="Pago" value={fmtBR(pago)} color="#16a34a" sub={devido>0?pct(pago/devido*100)+" quitado":"—"}/>
    <KCard label="Custo do Crédito" value={fmtBR(custoCredito)} color="#f59e0b" sub={(custoOperacao>0?"inclui "+fmtBR(custoOperacao)+" de IOF/tarifas":"juros e encargos")+(descontos>0?" · já com "+fmtBR(descontos)+" de desconto":"")}/>
   </div>
   {foraDoCaixa>0&&(
    <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:"10px 14px",fontSize:11,color:"#92400e",lineHeight:1.5,marginBottom:20}}>
     💵 <b>{fmtBR(foraDoCaixa)}</b> de empréstimo estão marcados como <b>ainda não somados ao saldo em caixa</b>. Esse valor entra como entrada no Lucro Real Projetado. Quando você atualizar o saldo da conta com esse dinheiro, marque o empréstimo como "já está no caixa" para não contar duas vezes.
    </div>
   )}

   {lista.length===0&&(
    <div style={{textAlign:"center",padding:"50px 20px",color:"#94a3b8"}}>
     <div style={{fontSize:40,marginBottom:12}}>🏦</div>
     <div style={{fontSize:15,fontWeight:700,color:"#64748b",marginBottom:6}}>Nenhum empréstimo cadastrado</div>
     <div style={{fontSize:13,maxWidth:340,margin:"0 auto",lineHeight:1.5}}>Cadastre o valor contratado e o total a pagar (com juros) para acompanhar a quitação.</div>
    </div>
   )}

   {lista.map(e=>{
    const tp=totalPagoDe(e);const dv=devidoDe(e);const sd=saldoDe(e);
    const perc=dv>0?Math.min(tp/dv*100,100):0;
    const juros=Math.max(dv-(Number(e.valorContratado)||0),0);
    return(
     <div key={e.id} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:16,marginBottom:16,boxShadow:"0 1px 4px #0001"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,flexWrap:"wrap",marginBottom:12}}>
       <div>
        <div style={{fontWeight:800,fontSize:15,color:"#1e293b"}}>{e.nome}</div>
        <div style={{fontSize:11,color:"#64748b"}}>{e.instituicao?e.instituicao+" · ":""}{e.data?"contratado em "+e.data:""}{e.parcelas?" · "+e.parcelas+"x":""}{e.valorParcela?" de "+fmtBR(e.valorParcela):""}</div>
        {e.obs&&<div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{e.obs}</div>}
       </div>
       <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        <button onClick={()=>{setSelId(e.id);setPagForm({valor:e.valorParcela||0,desconto:0,data:new Date().toLocaleDateString("pt-BR"),obs:""});setModal("pag");}} style={{...BS,fontSize:11,padding:"5px 10px",background:"#dcfce7",color:"#16a34a"}}>+ Pagamento</button>
        <button onClick={()=>abrirEdit(e)} style={{...BS,fontSize:11,padding:"5px 10px"}}>✏️ Editar</button>
        <button onClick={()=>delEmp(e)} style={{...BS,fontSize:11,padding:"5px 10px",background:"#fee2e2",color:"#ef4444"}}>Excluir</button>
       </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10,marginBottom:12}}>
       <div style={{background:"#f8fafc",borderRadius:8,padding:"9px 12px"}}>
        <div style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase"}}>Valor contratado</div>
        <div style={{fontSize:15,fontWeight:800,color:"#0ea5e9"}}>{fmtBR(e.valorContratado)}</div>
       </div>
       <div style={{background:"#f8fafc",borderRadius:8,padding:"9px 12px"}}>
        <div style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase"}}>A pagar</div>
        <div style={{fontSize:15,fontWeight:800,color:"#ef4444"}}>{fmtBR(sd)}</div>
       </div>
       <div style={{background:"#f8fafc",borderRadius:8,padding:"9px 12px"}}>
        <div style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase"}}>Pago</div>
        <div style={{fontSize:15,fontWeight:800,color:"#16a34a"}}>{fmtBR(tp)}</div>
       </div>
       <div style={{background:"#f8fafc",borderRadius:8,padding:"9px 12px"}}>
        <div style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase"}}>Total c/ juros</div>
        <div style={{fontSize:15,fontWeight:800,color:"#1e293b"}}>{fmtBR(dv)}</div>
        {juros>0&&<div style={{fontSize:10,color:"#94a3b8"}}>custo do crédito {fmtBR(Math.max(dv-liberadoDe(e),0))}</div>}
        {Number(e.valorContratado)>liberadoDe(e)&&<div style={{fontSize:10,color:"#b45309"}}>IOF/tarifas {fmtBR(Number(e.valorContratado)-liberadoDe(e))}</div>}
        {Number(e.taxaMes)>0&&<div style={{fontSize:10,color:"#94a3b8"}}>taxa {Number(e.taxaMes).toFixed(2)}% a.m.</div>}
        {descontoDe(e)>0&&<div style={{fontSize:10,color:"#0ea5e9",fontWeight:700}}>economia por antecipação {fmtBR(descontoDe(e))}</div>}
       </div>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap",background:e.noCaixa?"#f0fdf4":"#fffbeb",border:"1px solid "+(e.noCaixa?"#bbf7d0":"#fde68a"),borderRadius:8,padding:"8px 12px",marginBottom:12}}>
       <div style={{fontSize:11,color:e.noCaixa?"#166534":"#92400e",lineHeight:1.4}}>
        Entrou na conta: <b>{fmtBR(liberadoDe(e))}</b> — {e.noCaixa?"já incluído no saldo em caixa":"ainda não somado ao saldo em caixa (conta como entrada na projeção)"}
       </div>
       <button onClick={()=>toggleCaixa(e)} style={{...BS,fontSize:11,padding:"5px 10px",background:e.noCaixa?"#f1f5f9":"#f8c400",color:e.noCaixa?"#64748b":"#0f172a"}}>{e.noCaixa?"Marcar como fora do caixa":"Marcar como já no caixa"}</button>
      </div>
      <div style={{background:"#f1f5f9",borderRadius:99,height:10,overflow:"hidden"}}>
       <div style={{width:`${perc}%`,height:"100%",background:perc>=100?"#16a34a":"#0ea5e9",borderRadius:99,transition:"width .4s"}}/>
      </div>
      <div style={{fontSize:11,color:"#64748b",marginTop:6}}>{pct(perc)} quitado{sd===0&&dv>0?" · ✅ empréstimo quitado":""}</div>
      {(e.pagamentos||[]).length>0&&(
       <div style={{marginTop:14}}>
        <div style={{fontSize:12,fontWeight:700,color:"#1e2d5a",marginBottom:6}}>Pagamentos ({(e.pagamentos||[]).length})</div>
        <div style={{display:"grid",gap:5}}>
         {(e.pagamentos||[]).map((p,pi)=>(
          <div key={pi} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#f8fafc",borderRadius:8,padding:"7px 12px"}}>
           <div>
            <span style={{fontSize:13,fontWeight:700,color:"#16a34a"}}>{fmtBR(p.valor)}</span>
            {Number(p.desconto)>0&&<span style={{fontSize:11,color:"#0ea5e9",fontWeight:700,marginLeft:6}}>+ {fmtBR(p.desconto)} de desconto</span>}
            <span style={{fontSize:11,color:"#94a3b8",marginLeft:8}}>{p.data}{p.obs?" · "+p.obs:""}</span>
           </div>
           <button onClick={()=>delPag(e.id,pi)} style={{background:"none",border:"none",color:"#cbd5e1",cursor:"pointer",fontSize:14}}>✕</button>
          </div>
         ))}
        </div>
       </div>
      )}
     </div>
    );
   })}

   {(modal==="novo"||modal==="edit")&&(
    <Modal onClose={()=>setModal(false)} title={modal==="edit"?"Editar Empréstimo":"Novo Empréstimo"}>
     <div style={{display:"grid",gap:10}}>
      <label style={{fontSize:12,color:"#64748b"}}>Identificação *
       <input value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} placeholder="Ex: Capital de giro — obra D18" style={IS} autoFocus/>
      </label>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
       <label style={{fontSize:12,color:"#64748b"}}>Instituição
        <input value={form.instituicao} onChange={e=>setForm(f=>({...f,instituicao:e.target.value}))} placeholder="Banco / pessoa" style={IS}/>
       </label>
       <label style={{fontSize:12,color:"#64748b"}}>Data da contratação
        <input value={form.data} onChange={e=>setForm(f=>({...f,data:e.target.value}))} placeholder="dd/mm/aaaa" style={IS}/>
       </label>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr",gap:10}}>
       <label style={{fontSize:12,color:"#64748b"}}>Vencimento da 1ª parcela
        <input value={form.dataParcela1} onChange={e=>setForm(f=>({...f,dataParcela1:e.target.value}))} placeholder="dd/mm/aaaa — usado no cronograma" style={IS}/>
       </label>
       <label style={{fontSize:12,color:"#64748b"}}>Taxa de juros do contrato (% ao mês)
        <input type="number" step="0.01" value={form.taxaMes} onChange={e=>setForm(f=>({...f,taxaMes:e.target.value}))} placeholder="ex: 3,75 — usada na quitação antecipada" style={IS}/>
       </label>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
       <label style={{fontSize:12,color:"#64748b"}}>Valor contratado (R$)
        <input type="number" value={form.valorContratado} onChange={e=>setForm(f=>({...f,valorContratado:e.target.value}))} style={IS}/>
       </label>
       <label style={{fontSize:12,color:"#64748b"}}>Total a pagar c/ juros (R$)
        <input type="number" value={form.valorTotal} onChange={e=>setForm(f=>({...f,valorTotal:e.target.value}))} style={IS}/>
       </label>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
       <label style={{fontSize:12,color:"#64748b"}}>Valor que entrou na conta (R$)
        <input type="number" value={form.valorLiberado} onChange={e=>setForm(f=>({...f,valorLiberado:e.target.value}))} placeholder="líquido de IOF e tarifas" style={IS}/>
       </label>
       <label style={{fontSize:12,color:"#64748b",display:"flex",alignItems:"center",gap:8,marginTop:18}}>
        <input type="checkbox" checked={!!form.noCaixa} onChange={e=>setForm(f=>({...f,noCaixa:e.target.checked}))} style={{width:18,height:18}}/>
        <span>Esse dinheiro já está no saldo em caixa que informei</span>
       </label>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
       <label style={{fontSize:12,color:"#64748b"}}>Nº de parcelas
        <input type="number" value={form.parcelas} onChange={e=>setForm(f=>({...f,parcelas:e.target.value}))} style={IS}/>
       </label>
       <label style={{fontSize:12,color:"#64748b"}}>Valor da parcela (R$)
        <input type="number" value={form.valorParcela} onChange={e=>setForm(f=>({...f,valorParcela:e.target.value}))} style={IS}/>
       </label>
      </div>
      <div style={{fontSize:11,color:"#94a3b8"}}>Se o total com juros ficar em branco, ele é calculado por parcelas × valor da parcela.</div>
      <label style={{fontSize:12,color:"#64748b"}}>Observações
       <input value={form.obs} onChange={e=>setForm(f=>({...f,obs:e.target.value}))} style={IS}/>
      </label>
     </div>
     <div style={{display:"flex",gap:10,marginTop:20}}>
      <button onClick={salvar} style={{...BP,flex:1}}>Salvar</button>
      <button onClick={()=>setModal(false)} style={{...BS,flex:1}}>Cancelar</button>
     </div>
    </Modal>
   )}

   {modal==="pag"&&(
    <Modal onClose={()=>setModal(false)} title="Pagamento do Empréstimo">
     <div style={{display:"grid",gap:10}}>
      <label style={{fontSize:12,color:"#64748b"}}>Valor efetivamente pago (R$)
       <input type="number" value={pagForm.valor} onChange={e=>setPagForm(f=>({...f,valor:e.target.value}))} style={IS} autoFocus/>
      </label>
      <label style={{fontSize:12,color:"#64748b"}}>Desconto por antecipação (R$)
       <input type="number" value={pagForm.desconto} onChange={e=>setPagForm(f=>({...f,desconto:e.target.value}))} placeholder="0" style={IS}/>
      </label>
      <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:8,padding:"9px 12px",fontSize:11,color:"#1e40af",lineHeight:1.5}}>
       Antecipou parcelas e o banco abateu os juros? Coloque o que saiu da conta em "valor pago" e o abatimento em "desconto". A dívida cai <b>{fmtBR((Number(pagForm.valor)||0)+(Number(pagForm.desconto)||0))}</b> e o caixa sente só {fmtBR(Number(pagForm.valor)||0)}.
      </div>
      <label style={{fontSize:12,color:"#64748b"}}>Data
       <input value={pagForm.data} onChange={e=>setPagForm(f=>({...f,data:e.target.value}))} placeholder="dd/mm/aaaa" style={IS}/>
      </label>
      <label style={{fontSize:12,color:"#64748b"}}>Observação
       <input value={pagForm.obs} onChange={e=>setPagForm(f=>({...f,obs:e.target.value}))} placeholder="Ex: parcela 3/12" style={IS}/>
      </label>
     </div>
     <div style={{display:"flex",gap:10,marginTop:20}}>
      <button onClick={salvarPag} style={{...BP,flex:1}}>Lançar Pagamento</button>
      <button onClick={()=>setModal(false)} style={{...BS,flex:1}}>Cancelar</button>
     </div>
    </Modal>
   )}
  </div>
 );
}

function Caixa({D,obra,sv}){
 const C=D.custos||[];const R=D.rec||[];
 const caixa=D.caixa||{saldo:0,hist:[]};
 const [saldoInput,setSaldoInput]=useState(String(caixa.saldo||0));
 const [obs,setObs]=useState("");

 const contrato=obra?obra.contrato:0;
 const custoTotal=C.reduce((s,c)=>s+(c.total||0),0);
 const jaRecebido=R.reduce((s,r)=>s+(r.rec||0),0);
 const totalPrevisto=R.reduce((s,r)=>s+(r.prev||0),0);
 const jaPago=C.reduce((s,c)=>s+(c.pago||0),0);
 // A receber = soma do que ainda falta receber de cada parcela (inclui empréstimos e extras)
 const aReceber=R.reduce((s,r)=>s+Math.max((r.prev||0)-(r.rec||0),0),0);
 const aPagarObra=Math.max(custoTotal-jaPago,0);
 // Empréstimos (aba própria): fora do custo da obra, mas somam no total a pagar
 const EMP=D.emprestimos||[];
 const empCredito=EMP.reduce((s,e)=>s+(Number(e.valorContratado)||0),0);
 const empDevido=EMP.reduce((s,e)=>{
  const desc=(e.pagamentos||[]).reduce((ss,p)=>ss+(Number(p.desconto)||0),0);
  return s+Math.max((Number(e.valorTotal)||Number(e.valorContratado)||0)-desc,0);
 },0);
 const empPago=EMP.reduce((s,e)=>s+(e.pagamentos||[]).reduce((ss,p)=>ss+(Number(p.valor)||0),0),0);
 const empSaldo=Math.max(empDevido-empPago,0);
 const empForaDoCaixa=EMP.reduce((s2,e)=>{
  if(e.noCaixa)return s2;
  const lib=(e.valorLiberado===undefined||e.valorLiberado===null||e.valorLiberado===""?Number(e.valorContratado)||0:Number(e.valorLiberado)||0);
  return s2+lib;
 },0);
 const aPagar=aPagarObra+empSaldo;
 const saldo=Number(caixa.saldo)||0;
 const entradas=saldo+aReceber+empForaDoCaixa;
 const lucroReal=entradas-aPagar;
 

 const salvarSaldo=()=>{
  const novo=Number(saldoInput)||0;
  const hist=[...(caixa.hist||[]),{valor:novo,anterior:saldo,obs:obs||"Atualização de saldo",data:new Date().toLocaleString("pt-BR")}];
  sv({saldo:novo,hist});
  setObs("");
 };

 const Card=({label,value,color,sub,big})=>(
  <div style={{background:"#fff",borderRadius:12,padding:16,borderLeft:`4px solid ${color}`,boxShadow:"0 1px 4px #0001"}}>
   <div style={{fontSize:11,color:"#64748b",fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>{label}</div>
   <div style={{fontSize:big?24:19,fontWeight:800,color}}>{fmtBR(value)}</div>
   {sub&&<div style={{fontSize:11,color:"#94a3b8",marginTop:3}}>{sub}</div>}
  </div>
 );

 return(
  <div>
   <div style={{marginBottom:20}}>
    <h2 style={{fontSize:20,fontWeight:800,color:"#f59e0b",margin:"0 0 4px"}}>Dinheiro em Caixa</h2>
    <p style={{fontSize:12,color:"#94a3b8",margin:0}}>Projeção do lucro real com base no que entra e sai até o fim da obra</p>
   </div>

   <div style={{background:"#1e2d5a",borderRadius:14,padding:20,marginBottom:20,textAlign:"center"}}>
    <div style={{fontSize:11,color:"#94a3b8",textTransform:"uppercase",letterSpacing:1}}>Lucro Real Projetado (agora)</div>
    <div style={{fontSize:38,fontWeight:800,color:lucroReal>=0?"#4ade80":"#f87171",lineHeight:1.1,marginTop:4}}>{fmtBR(lucroReal)}</div>
    <div style={{fontSize:12,color:"#94a3b8",marginTop:8,lineHeight:1.6}}>
     Caixa {fmtBR(saldo)} + a receber {fmtBR(aReceber)}{empForaDoCaixa>0?" + empréstimo em conta "+fmtBR(empForaDoCaixa):""}<br/>
     − custos da obra {fmtBR(aPagarObra)}{empSaldo>0?" − empréstimo a quitar "+fmtBR(empSaldo):""}
    </div>
    <div style={{fontSize:10,color:"#64748b",marginTop:6,maxWidth:420,margin:"6px auto 0",lineHeight:1.5}}>Tudo que entra menos tudo que sai. O empréstimo entra pelo valor liberado e sai pelo valor total com juros — no fim, o que pesa no lucro é o custo do crédito.</div>
   </div>

   <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:18,marginBottom:20}}>
    <div style={{fontSize:13,fontWeight:700,color:"#1e2d5a",marginBottom:12}}>💰 Saldo atual em conta</div>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-end"}}>
     <label style={{fontSize:12,color:"#64748b",flex:1,minWidth:140}}>Quanto tem em caixa hoje (R$)
      <input type="number" value={saldoInput} onChange={e=>setSaldoInput(e.target.value)} style={IS}/>
     </label>
     <label style={{fontSize:12,color:"#64748b",flex:1,minWidth:140}}>Observação (opcional)
      <input value={obs} onChange={e=>setObs(e.target.value)} placeholder="Ex: retirada pró-labore" style={IS}/>
     </label>
     <button onClick={salvarSaldo} style={{...BP,marginBottom:0}}>Atualizar</button>
    </div>
   </div>

   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:20}}>
    <Card label="Saldo em Caixa" value={saldo} color="#8b5cf6"/>
    <Card label="A Receber (total)" value={aReceber} color="#3b82f6" sub={`previsto ${fmtBR(totalPrevisto)} · recebido ${fmtBR(jaRecebido)}`}/>
    <Card label="A Pagar (total)" value={aPagar} color="#ef4444" sub={`obra ${fmtBR(aPagarObra)}${empSaldo>0?" + empréstimo "+fmtBR(empSaldo):""}`}/>
   </div>

   {EMP.length>0&&(
    <div style={{background:"#fff",border:"1px solid #e2e8f0",borderLeft:"4px solid #0ea5e9",borderRadius:12,padding:16,marginBottom:20}}>
     <div style={{fontSize:13,fontWeight:700,color:"#1e2d5a",marginBottom:8}}>🏦 Empréstimos (fora do custo da obra)</div>
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10}}>
      <div><div style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase"}}>Crédito contratado</div><div style={{fontSize:15,fontWeight:800,color:"#0ea5e9"}}>{fmtBR(empCredito)}</div></div>
      <div><div style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase"}}>Pago</div><div style={{fontSize:15,fontWeight:800,color:"#16a34a"}}>{fmtBR(empPago)}</div></div>
      <div><div style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase"}}>Saldo devedor</div><div style={{fontSize:15,fontWeight:800,color:"#ef4444"}}>{fmtBR(empSaldo)}</div></div>
      <div><div style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase"}}>Custo do crédito</div><div style={{fontSize:15,fontWeight:800,color:"#f59e0b"}}>{fmtBR(Math.max(empDevido-empCredito,0))}</div></div>
     </div>
     {empForaDoCaixa>0&&(
      <div style={{fontSize:11,color:"#92400e",background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,padding:"8px 12px",marginTop:10,lineHeight:1.45}}>
       💵 {fmtBR(empForaDoCaixa)} de empréstimo já caíram na conta mas estão marcados como fora do saldo acima — por isso entram como entrada na projeção. Atualize o saldo em caixa e marque na aba Empréstimo para não contar duas vezes.
      </div>
     )}
    </div>
   )}

   {(caixa.hist||[]).length>0&&(
    <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:16}}>
     <div style={{fontSize:13,fontWeight:700,color:"#1e2d5a",marginBottom:10}}>Histórico de atualizações de saldo</div>
     <div style={{display:"grid",gap:6}}>
      {[...(caixa.hist||[])].reverse().map((h,i)=>(
       <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:"#f8fafc",borderRadius:8,fontSize:12}}>
        <div>
         <div style={{fontWeight:700,color:"#1e293b"}}>{fmtBR(h.valor)}</div>
         <div style={{fontSize:10,color:"#94a3b8"}}>{h.obs} · {h.data}</div>
        </div>
        <div style={{fontSize:10,color:"#94a3b8"}}>era {fmtBR(h.anterior)}</div>
       </div>
      ))}
     </div>
    </div>
   )}
  </div>
 );
}

// ═══════════════ CRONOGRAMA FÍSICO-FINANCEIRO (somente admin) ═══════════════
// Método: peso físico de cada etapa = dias de atividade / dias totais da obra.
// As etapas ocupam janelas sequenciais com sobreposição configurável, gerando a
// curva S. O custo de cada etapa é distribuído ao longo da própria janela.
// Custos indiretos (administrativo, impostos, taxas) são diluídos linearmente;
// mão de obra e demais acompanham o avanço físico.
// Quando a obra já tem realizado, os meses fechados são substituídos pelo que
// de fato aconteceu e o saldo é reprojetado nos meses restantes.
const MESES_BR=["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
const MESES_FULL=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const CUSTO_LINEAR=["administrativo","imposto","bdi","taxa","aluguel","seguro","adm"];
function ehLinear(nome){
 const n=(nome||"").toLowerCase();
 for(let i=0;i<CUSTO_LINEAR.length;i++){if(n.indexOf(CUSTO_LINEAR[i])>=0)return true;}
 return false;
}
function mesLabel(base,i){
 if(!base)return"Mês "+(i+1);
 const d=new Date(base.getFullYear(),base.getMonth()+i,1);
 return MESES_BR[d.getMonth()]+"/"+String(d.getFullYear()).slice(2);
}
function interseccao(a0,a1,b0,b1){return Math.max(0,Math.min(a1,b1)-Math.max(a0,b0));}
function diffMeses(base,d){return (d.getFullYear()-base.getFullYear())*12+(d.getMonth()-base.getMonth());}
// Aceita dd/mm/aaaa, mm/aaaa, ago/26, agosto/2026 — devolve o 1º dia do mês
function parseMesRef(txt){
 if(!txt)return null;
 const t=String(txt).trim().toLowerCase();
 const d=parseBRDate(t);
 if(d)return new Date(d.getFullYear(),d.getMonth(),1);
 let m=t.match(/^(\d{1,2})[\/\-](\d{2,4})$/);
 if(m){
  const mes=Number(m[1])-1;let ano=Number(m[2]);if(ano<100)ano+=2000;
  if(mes>=0&&mes<12)return new Date(ano,mes,1);
 }
 m=t.match(/^([a-zç]+)[\/\-\s]+(\d{2,4})$/);
 if(m){
  let ano=Number(m[2]);if(ano<100)ano+=2000;
  for(let i=0;i<12;i++){
   if(m[1].indexOf(MESES_BR[i])===0||MESES_FULL[i].indexOf(m[1])===0)return new Date(ano,i,1);
  }
 }
 return null;
}
// Data completa com dia preservado. Use este para ordenar; parseMesRef só serve
// para agrupar por mês (ela joga tudo para o dia 1).
function parseDataFlex(txt){
 const d=parseBRDate(txt);
 if(d)return d;
 return parseMesRef(txt);
}
// Taxa mensal implícita: a que faz o valor presente das parcelas igualar o valor liberado
function taxaMensal(pv,parcela,n){
 if(!(pv>0&&parcela>0&&n>0))return 0;
 if(parcela*n<=pv)return 0;
 const f=i=>{let s=0;for(let k=1;k<=n;k++)s+=parcela/Math.pow(1+i,k);return s-pv;};
 let lo=0,hi=1;
 for(let it=0;it<80;it++){const mid=(lo+hi)/2;if(f(mid)>0)lo=mid;else hi=mid;}
 return (lo+hi)/2;
}
function vpParcelas(parcela,r,i){let s=0;for(let k=1;k<=r;k++)s+=parcela/Math.pow(1+i,k);return s;}
// Projeção das parcelas de empréstimo dentro do cronograma da obra
function projetarEmprestimos(EM,baseData,meses){
 const porMes=[];for(let m=0;m<meses;m++)porMes.push(0);
 const detalhes=[];
 const naoAgendados=[];
 let amortizacao=0,economia=0,total=0;
 const saldoDe=e=>{
  const desc=(e.pagamentos||[]).reduce((s,p)=>s+(Number(p.desconto)||0),0);
  const pg=(e.pagamentos||[]).reduce((s,p)=>s+(Number(p.valor)||0),0);
  return Math.max((Number(e.valorTotal)||Number(e.valorContratado)||0)-desc-pg,0);
 };
 (EM||[]).forEach(e=>{
  const n=Number(e.parcelas)||0;
  const devidoBruto=Number(e.valorTotal)||Number(e.valorContratado)||0;
  let parcela=Number(e.valorParcela)||0;
  if(!parcela&&n>0)parcela=devidoBruto/n;
  const dc=parseBRDate(e.data);
  const d1=parseBRDate(e.dataParcela1)||(dc?new Date(dc.getFullYear(),dc.getMonth()+1,dc.getDate()):null);
  if(!baseData||!n||!parcela||!d1){
   // Sem parcelas/data não dá para posicionar no mês certo, mas o saldo devedor
   // não pode sumir do desembolso: é diluído nos meses restantes.
   const sd=saldoDe(e);
   if(sd>0)naoAgendados.push({nome:e.nome,saldo:sd,motivo:!n?"sem nº de parcelas":(!d1?"sem data da 1ª parcela":"sem valor de parcela")});
   return;
  }
  const off=diffMeses(baseData,d1);
  let dentro=0,fora=0,primeiro=null,ultimo=null;
  for(let k=0;k<n;k++){
   const idx=off+k;
   if(idx<0)continue;
   if(idx<meses){porMes[idx]+=parcela;dentro++;if(primeiro===null)primeiro=idx;ultimo=idx;}
   else fora++;
  }
  const contratado=Number(e.valorContratado)||0;
  const liberado=(e.valorLiberado===undefined||e.valorLiberado===null||e.valorLiberado===""?contratado:Number(e.valorLiberado)||0);
  const informada=Number(e.taxaMes)>0?Number(e.taxaMes)/100:0;
  const i=informada||taxaMensal(contratado||liberado,parcela,n);
  const cet=taxaMensal(liberado||contratado,parcela,n);
  const face=fora*parcela;
  const quit=fora>0?vpParcelas(parcela,fora,i):0;
  if(fora>0&&meses>0){porMes[meses-1]+=quit;amortizacao+=quit;economia+=(face-quit);}
  detalhes.push({nome:e.nome,parcela,n,dentro,fora,primeiro,ultimo,face,quit,taxa:i,cet,informada:!!informada,iof:Math.max(contratado-liberado,0),economia:face-quit});
  total+=dentro*parcela+quit;
 });
 const saldoNaoAgendado=naoAgendados.reduce((s,x)=>s+x.saldo,0);
 return{porMes,detalhes,naoAgendados,saldoNaoAgendado,amortizacao,economia,total:total+saldoNaoAgendado};
}

// ── CRONOGRAMA INFORMADO (matriz de % por subetapa e por mês) ──
// Usado quando a obra tem cronograma próprio vindo da planilha do cliente.
// Calcula o avanço físico de duas formas, lado a lado: ponderado pelo VALOR
// do orçamento (é assim que a medição é paga) e pelos DIAS de atividade.
function normSec(x){return String(x||"").toUpperCase().replace(/[^A-Z]/g,"").replace(/S$/,"");}
function calcCronogramaMatriz(obra,D,MAT,cfg){
 const A=D.acomp||[],C=D.custos||[],EM=D.emprestimos||[];
 const meses=MAT.meses||6;
 const inicioStr=cfg.inicio||MAT.inicio||(obra?obra.inicio:"")||"";
 const baseData=parseBRDate(inicioStr);
 const chaveO=chaveOrc(obra?obra.id:"",obra);
 const ORCO=chaveO?ORC_POR_OBRA[chaveO]:null;

 // valor, custo e dias por subetapa
 const valorSub={},custoSub={},diasSub={},feitoSub={},nomes=[];
 const reg=(et,sec)=>{
  const k=et+"||"+sec;
  if(nomes.indexOf(k)<0)nomes.push(k);
  return k;
 };
 if(ORCO)Object.keys(ORCO).forEach(et=>{
  Object.keys(ORCO[et]).forEach(sec=>{
   const k=reg(et,sec);
   valorSub[k]=(valorSub[k]||0)+ORCO[et][sec].reduce((s,i)=>s+(i.foraDoTotal?0:i.total),0);
  });
 });
 C.forEach(c=>{
  const k=reg(c.pav||"Outros",c.cat||"Geral");
  custoSub[k]=(custoSub[k]||0)+(Number(c.total)||0);
 });
 A.forEach(a=>{
  const k=reg(a.pav||"Outros",a.sec||"Geral");
  const p=Number(a.prazo)||0;
  diasSub[k]=(diasSub[k]||0)+p;
  feitoSub[k]=(feitoSub[k]||0)+(a.total>0?(a.acum/a.total)*p:0);
 });
 // casa a matriz com as chaves reais (tolera ESQUADRIA x ESQUADRIAS)
 const linhaMat=k=>{
  if(MAT.matriz[k])return MAT.matriz[k];
  const [et,sec]=k.split("||");
  const ks=Object.keys(MAT.matriz);
  for(let i=0;i<ks.length;i++){
   const p=ks[i].split("||");
   if(normSec(p[0]).slice(0,10)===normSec(et).slice(0,10)&&normSec(p[1])===normSec(sec))return MAT.matriz[ks[i]];
  }
  return null;
 };
 const valorTot=Object.values(valorSub).reduce((s,v)=>s+v,0);
 const diasTot=Object.values(diasSub).reduce((s,v)=>s+v,0);
 const custoTotal=Object.values(custoSub).reduce((s,v)=>s+v,0);

 const projEmp=projetarEmprestimos(EM,baseData,meses);
 const totalEmp=projEmp.total;

 const linhas=[];
 const semMatriz=[];
 for(let m=0;m<meses;m++)linhas.push({m,fisPlan:0,fisValor:0,dir:0,medicao:0,ativas:[]});
 nomes.forEach(k=>{
  const v=linhaMat(k);
  const [et,sec]=k.split("||");
  if(!v){
   if((custoSub[k]||0)>0||(valorSub[k]||0)>0)semMatriz.push(sec+" ("+et+")");
   // sem linha no cronograma: dilui igualmente para não sumir do desembolso
   for(let m=0;m<meses;m++){
    linhas[m].dir+=(custoSub[k]||0)/meses;
    linhas[m].medicao+=(valorSub[k]||0)/meses;
    linhas[m].fisPlan+=(diasTot>0?(diasSub[k]||0)/diasTot*100:0)/meses;
    linhas[m].fisValor+=(valorTot>0?(valorSub[k]||0)/valorTot*100:0)/meses;
   }
   return;
  }
  for(let m=0;m<meses;m++){
   const p=Number(v[m])||0;
   if(p<=0)continue;
   linhas[m].dir+=(custoSub[k]||0)*p;
   linhas[m].medicao+=(valorSub[k]||0)*p;
   linhas[m].fisPlan+=(diasTot>0?(diasSub[k]||0)/diasTot*100:0)*p;
   linhas[m].fisValor+=(valorTot>0?(valorSub[k]||0)/valorTot*100:0)*p;
   linhas[m].ativas.push({nome:sec+" · "+et,frac:p,pctObra:(valorTot>0?(valorSub[k]||0)/valorTot*100:0)*p,
    custo:(custoSub[k]||0)*p,etapa:{nome:et,its:A.filter(a=>(a.pav||"")===et&&normSec(a.sec)===normSec(sec)),janela:{ini:0,dur:1}}});
  }
 });
 linhas.forEach(l=>{
  l.indireto=0;l.emp=projEmp.porMes[l.m]||0;l.obraPlan=l.dir;l.finPlan=l.dir+l.emp;
  l.medicaoPrev=l.medicao;
  const ov=cfg.medicaoReal&&cfg.medicaoReal[l.m];
  if(ov!==undefined&&ov!==null&&ov!==""){l.medicao=Number(ov)||0;l.ajustada=true;}
  // o % por valor é sempre o espelho da medição do mês
  l.fisValor=valorTot>0?l.medicao/valorTot*100:0;
 });
 if(projEmp.saldoNaoAgendado>0){
  const so=linhas.reduce((s,l)=>s+l.obraPlan,0)||1;
  linhas.forEach(l=>{l.emp+=projEmp.saldoNaoAgendado*(l.obraPlan/so);l.finPlan=l.obraPlan+l.emp;});
 }

 // Realizado
 const realFis=calcConclusaoGeral(A);
 let realValor=0;
 nomes.forEach(k=>{
  const d=diasSub[k]||0;if(d<=0)return;
  realValor+=(feitoSub[k]/d)*(valorSub[k]||0);
 });
 const realFisValor=valorTot>0?realValor/valorTot*100:0;
 const pagoCustos=C.reduce((s,c)=>s+(Number(c.pago)||0),0);
 const empPago=EM.reduce((s,e)=>s+(e.pagamentos||[]).reduce((ss,p)=>ss+(Number(p.valor)||0),0),0);
 const pagoTot=pagoCustos+empPago;
 const hoje=new Date();
 const mesesDecorridos=baseData?(diffMeses(baseData,hoje)+hoje.getDate()/30):0;
 const mesAtualIdx=baseData?Math.max(0,Math.min(diffMeses(baseData,hoje),meses-1)):0;
 const podeReal=!!baseData&&mesAtualIdx>0&&(realFis>0.01||pagoTot>0);
 const baseReal=cfg.baseReal===false?false:podeReal;
 if(baseReal){
  const pass=linhas.slice(0,mesAtualIdx),fut=linhas.slice(mesAtualIdx);
  const sPF=pass.reduce((s,l)=>s+l.fisPlan,0)||1,sFF=fut.reduce((s,l)=>s+l.fisPlan,0)||1;
  const sPO=pass.reduce((s,l)=>s+l.obraPlan,0)||1,sFO=fut.reduce((s,l)=>s+l.obraPlan,0)||1;
  const saldoFis=Math.max(100-realFis,0),saldoObra=Math.max(custoTotal-pagoCustos,0);
  pass.forEach(l=>{l.fis=realFis*(l.fisPlan/sPF);l.obra=pagoCustos*(l.obraPlan/sPO);l.fin=l.obra+empPago*(l.obraPlan/sPO);l.realizado=true;});
  fut.forEach(l=>{l.fis=saldoFis*(l.fisPlan/sFF);l.obra=saldoObra*(l.obraPlan/sFO);l.fin=l.obra+l.emp;l.realizado=false;});
 }else{
  linhas.forEach(l=>{l.fis=l.fisPlan;l.obra=l.obraPlan;l.fin=l.finPlan;l.realizado=false;});
 }
 // Medição -> recebimento com defasagem
 const defas=cfg.defasagemRec!==undefined?Number(cfg.defasagemRec):(MAT.defasagemRec||0);
 let acFis=0,acFin=0,acPF=0,acPFin=0,acMed=0,acCaixa=0;
 linhas.forEach((l,i)=>{
  l.receb=(i-defas>=0)?linhas[i-defas].medicao:0;
  acFis+=l.fis;acFin+=l.fin;acPF+=l.fisPlan;acPFin+=l.finPlan;acMed+=l.medicao;
  l.acFis=acFis;l.acFin=acFin;l.acPlanFis=acPF;l.acPlanFin=acPFin;l.acMedicao=acMed;
  l.resultado=l.receb-l.fin;acCaixa+=l.resultado;l.acCaixa=acCaixa;
 });
 const sobra=linhas.reduce((s,l)=>s+l.medicao,0)-linhas.reduce((s,l)=>s+l.receb,0);
 const etapasView=nomes.filter(k=>(valorSub[k]||0)>0||(custoSub[k]||0)>0).map(k=>{
  const [et,sec]=k.split("||");
  const v=linhaMat(k)||[];
  let ini=-1,fim=-1;
  for(let m=0;m<meses;m++){if((Number(v[m])||0)>0){if(ini<0)ini=m;fim=m;}}
  return{nome:sec+" · "+et,etapa:et,sec,dias:diasSub[k]||0,feitoDias:feitoSub[k]||0,its:[],
   janela:{ini:(ini<0?0:ini)/meses,fim:((fim<0?meses-1:fim)+1)/meses,dur:1},
   peso:valorTot>0?(valorSub[k]||0)/valorTot:0,custo:custoSub[k]||0,valor:valorSub[k]||0};
 }).sort((a,b)=>b.valor-a.valor);
 return{matriz:true,notaMatriz:MAT.nota,defas,sobra,valorTot,realFisValor,semMatriz,
  etapas:etapasView,indiretos:[],linhas,meses,baseData,inicioStr,diasTot,mesesPadrao:meses,sobrep:0,
  custoTotal,totalEmp,desembolsoTotal:custoTotal+totalEmp,desembolsoEfetivo:acFin,projEmp,
  fonteCusto:"custos lançados na aba Custos",semCusto:custoTotal<=0,
  realFis,pagoCustos,empPago,pagoTot,mesAtualIdx,mesesDecorridos,
  mesesRest:Math.max(meses-(baseData?mesesDecorridos:0),0.5),
  prevFisHoje:baseData?linhas.slice(0,mesAtualIdx).reduce((s,l)=>s+l.fisPlan,0):0,
  prevFinHoje:baseData?linhas.slice(0,mesAtualIdx).reduce((s,l)=>s+l.finPlan,0):0,
  baseReal,podeReal,realPorMes:{},pagoPorMes:{},A,C,EM};
}

// ── MOTOR DO CRONOGRAMA (usado na aba da obra e no Painel Geral) ──
function calcCronograma(obra,D){
 const chaveM=chaveObra(obra?obra.id:"",obra);
 const MAT=chaveM?CRONO_POR_OBRA[chaveM]:null;
 if(MAT&&(D.acomp||[]).length>0)return calcCronogramaMatriz(obra,D,MAT,D.crono||{});
 return calcCronogramaAuto(obra,D);
}
function calcCronogramaAuto(obra,D){
 const A=D.acomp||[],C=D.custos||[],cfg=D.crono||{},EM=D.emprestimos||[];
 const nomesEtapas=etapasDe(A);
 const etapas=nomesEtapas.map(p=>{
  const its=A.filter(a=>(a.pav||"Outros")===p);
  const dias=its.reduce((s,a)=>s+(Number(a.prazo)||0),0);
  const feitoDias=its.reduce((s,a)=>s+(a.total>0?(a.acum/a.total)*(Number(a.prazo)||0):0),0);
  return{nome:p,dias,feitoDias,its};
 }).filter(e=>e.dias>0);
 const diasTot=etapas.reduce((s,e)=>s+e.dias,0);
 if(!A.length||diasTot<=0)return null;

 const inicioStr=cfg.inicio||(obra?obra.inicio:"")||"";
 const baseData=parseBRDate(inicioStr);
 const mesesPadrao=Math.max(2,Math.round(diasTot/30/2));
 const meses=Math.max(1,Math.min(Number(cfg.meses)||mesesPadrao,60));
 const sobrep=(cfg.sobrep===undefined||cfg.sobrep===null?25:Number(cfg.sobrep))/100;

 // Janelas de execução (tempo normalizado 0..1)
 const pesos=etapas.map(e=>e.dias/diasTot);
 let span=0;pesos.forEach((d,i)=>{span+=(i<pesos.length-1?d*(1-sobrep):d);});
 const k=span>0?1/span:1;
 let pos=0;
 const janelas=pesos.map(d=>{const dur=d*k;const j={ini:pos,fim:pos+dur,dur};pos+=dur*(1-sobrep);return j;});

 // Custos por etapa
 const custoLancado={};
 C.forEach(c=>{const p=c.pav||"Outros";custoLancado[p]=(custoLancado[p]||0)+(Number(c.total)||0);});
 const chaveO=chaveOrc(obra?obra.id:"",obra);
 const orcObra=chaveO?ORC_POR_OBRA[chaveO]:null;
 const custoOrc={};
 if(orcObra)Object.keys(orcObra).forEach(et=>{
  custoOrc[et]=Object.values(orcObra[et]).reduce((s,its)=>s+its.reduce((ss,i)=>ss+(i.foraDoTotal?0:i.total),0),0);
 });
 const custoDe=nome=>{
  if(cfg.custos&&cfg.custos[nome]!==undefined&&cfg.custos[nome]!=="")return Number(cfg.custos[nome])||0;
  if(custoLancado[nome])return custoLancado[nome];
  if(custoOrc[nome])return custoOrc[nome];
  return 0;
 };
 const etapasCusto=etapas.map((e,i)=>({...e,janela:janelas[i],peso:pesos[i],custo:custoDe(e.nome)}));
 const indiretos=Object.keys(custoLancado)
  .filter(p=>nomesEtapas.indexOf(p)<0)
  .map(p=>({nome:p,custo:custoDe(p),tipo:(cfg.tipos&&cfg.tipos[p])||(ehLinear(p)?"linear":"fisico")}))
  .filter(x=>x.custo>0);
 const totalDireto=etapasCusto.reduce((s,e)=>s+e.custo,0);
 const totalIndireto=indiretos.reduce((s,e)=>s+e.custo,0);
 const custoTotal=totalDireto+totalIndireto;
 const fonteCusto=Object.keys(custoLancado).length>0?"custos lançados na aba Custos":(Object.keys(custoOrc).length>0?"orçamento da obra":"—");

 const projEmp=projetarEmprestimos(EM,baseData,meses);
 const totalEmp=projEmp.total;
 const desembolsoTotal=custoTotal+totalEmp;

 // Plano original mês a mês
 const linhas=[];
 for(let m=0;m<meses;m++){
  const t0=m/meses,t1=(m+1)/meses;
  let fis=0,dir=0;
  const ativas=[];
  etapasCusto.forEach(e=>{
   const inter=interseccao(e.janela.ini,e.janela.fim,t0,t1);
   if(inter<=0)return;
   const frac=e.janela.dur>0?inter/e.janela.dur:0;
   fis+=e.peso*frac*100;
   dir+=e.custo*frac;
   ativas.push({nome:e.nome,frac,pctObra:e.peso*frac*100,custo:e.custo*frac,etapa:e});
  });
  linhas.push({m,fisPlan:fis,dir,ativas});
 }
 const somaFis=linhas.reduce((s,l)=>s+l.fisPlan,0)||1;
 const indProp=indiretos.filter(x=>x.tipo==="fisico").reduce((s,x)=>s+x.custo,0);
 const indLin=indiretos.filter(x=>x.tipo==="linear").reduce((s,x)=>s+x.custo,0);
 linhas.forEach(l=>{
  l.indireto=indProp*(l.fisPlan/somaFis)+indLin/meses;
  l.emp=projEmp.porMes[l.m]||0;
  l.obraPlan=l.dir+l.indireto;
 });
 // Empréstimo sem cronograma de parcelas: dilui o saldo devedor nos meses restantes
 if(projEmp.saldoNaoAgendado>0){
  const somaObra=linhas.reduce((s,l)=>s+l.obraPlan,0)||1;
  linhas.forEach(l=>{l.emp+=projEmp.saldoNaoAgendado*(l.obraPlan/somaObra);});
 }
 linhas.forEach(l=>{l.finPlan=l.obraPlan+l.emp;});

 // Realizado
 const realFis=calcConclusaoGeral(A);
 const pagoCustos=C.reduce((s,c)=>s+(Number(c.pago)||0),0);
 const empPago=EM.reduce((s,e)=>s+(e.pagamentos||[]).reduce((ss,p)=>ss+(Number(p.valor)||0),0),0);
 const pagoTot=pagoCustos+empPago;
 const hoje=new Date();
 const mesesDecorridos=baseData?(diffMeses(baseData,hoje)+hoje.getDate()/30):0;
 const mesAtualIdx=baseData?Math.max(0,Math.min(diffMeses(baseData,hoje),meses-1)):0;

 // Base realizada: meses fechados recebem o que aconteceu; o saldo é reprojetado
 const podeReal=!!baseData&&mesAtualIdx>0&&(realFis>0.01||pagoTot>0);
 const baseReal=cfg.baseReal===false?false:podeReal;
 if(baseReal){
  const pass=linhas.slice(0,mesAtualIdx),fut=linhas.slice(mesAtualIdx);
  const sPassFis=pass.reduce((s,l)=>s+l.fisPlan,0)||1;
  const sFutFis=fut.reduce((s,l)=>s+l.fisPlan,0)||1;
  const sPassObra=pass.reduce((s,l)=>s+l.obraPlan,0)||1;
  const sFutObra=fut.reduce((s,l)=>s+l.obraPlan,0)||1;
  const saldoFis=Math.max(100-realFis,0);
  const saldoObra=Math.max(custoTotal-pagoCustos,0);
  pass.forEach(l=>{
   l.fis=realFis*(l.fisPlan/sPassFis);
   l.obra=pagoCustos*(l.obraPlan/sPassObra);
   l.empReal=empPago*(l.obraPlan/sPassObra);
   l.fin=l.obra+l.empReal;
   l.realizado=true;
  });
  fut.forEach(l=>{
   l.fis=saldoFis*(l.fisPlan/sFutFis);
   l.obra=saldoObra*(l.obraPlan/sFutObra);
   l.fin=l.obra+l.emp;
   l.realizado=false;
  });
 }else{
  linhas.forEach(l=>{l.fis=l.fisPlan;l.obra=l.obraPlan;l.fin=l.finPlan;l.realizado=false;});
 }
 let acFis=0,acFin=0,acPlanFis=0,acPlanFin=0;
 linhas.forEach(l=>{
  acFis+=l.fis;acFin+=l.fin;acPlanFis+=l.fisPlan;acPlanFin+=l.finPlan;
  l.acFis=acFis;l.acFin=acFin;l.acPlanFis=acPlanFis;l.acPlanFin=acPlanFin;
 });
 const desembolsoEfetivo=acFin;

 // Previsto até hoje (curva do plano original) para medir desvio
 const tHoje=baseData?Math.max(0,Math.min(mesesDecorridos/meses,1)):0;
 const acumAte=(t,campo)=>{
  const mIdx=Math.floor(t*meses);let ac=0;
  for(let i=0;i<Math.min(mIdx,meses);i++)ac+=linhas[i][campo];
  const resto=t*meses-mIdx;
  if(mIdx<meses)ac+=linhas[mIdx][campo]*resto;
  return ac;
 };
 const prevFisHoje=baseData?acumAte(tHoje,"fisPlan"):0;
 const prevFinHoje=baseData?acumAte(tHoje,"finPlan"):0;
 const mesesRest=Math.max(meses-(baseData?mesesDecorridos:0),0.5);

 // Realizado físico datado (medições) — usado no gráfico
 const realPorMes={};
 A.forEach(a=>{
  (a.meds||[]).forEach(md=>{
   const d=parseBRDate(md.data);
   if(!d||!baseData||!a.total)return;
   const idx=diffMeses(baseData,d);
   if(idx<0||idx>=meses)return;
   realPorMes[idx]=(realPorMes[idx]||0)+((Number(md.qtd)||0)/a.total)*(Number(a.prazo)||0)/diasTot*100;
  });
 });
 // Custos pagos com data lançada (por mês)
 const pagoPorMes={};
 C.forEach(c=>{
  const d=parseMesRef(c.dataPag);
  if(!d||!baseData||!(Number(c.pago)>0))return;
  const idx=diffMeses(baseData,d);
  if(idx<0||idx>=meses)return;
  pagoPorMes[idx]=(pagoPorMes[idx]||0)+Number(c.pago);
 });

 return{etapas:etapasCusto,indiretos,linhas,meses,baseData,inicioStr,diasTot,mesesPadrao,sobrep,
  custoTotal,totalEmp,desembolsoTotal,desembolsoEfetivo,projEmp,fonteCusto,semCusto:custoTotal<=0,
  realFis,pagoCustos,empPago,pagoTot,mesAtualIdx,mesesDecorridos,mesesRest,prevFisHoje,prevFinHoje,
  baseReal,podeReal,realPorMes,pagoPorMes,custoLancado,custoOrc,A,C,EM};
}

function Cronograma({D,obra,sv,svRec}){
 const cfg=D.crono||{};
 const [detalhe,setDetalhe]=useState(null);
 const [editando,setEditando]=useState(false);
 const [fMeses,setFMeses]=useState("");
 const [fSobrep,setFSobrep]=useState("");
 const [fInicio,setFInicio]=useState("");
 const [editCusto,setEditCusto]=useState(null);
 const [fCusto,setFCusto]=useState("");
 const [editMed,setEditMed]=useState(null);
 const [fMed,setFMed]=useState("");
 const R=calcCronograma(obra,D);

 if(!R)return(
  <div style={{textAlign:"center",padding:"60px 20px",color:"#94a3b8"}}>
   <div style={{fontSize:40,marginBottom:12}}>📅</div>
   <div style={{fontSize:15,fontWeight:700,color:"#64748b",marginBottom:6}}>Cronograma indisponível</div>
   <div style={{fontSize:13,maxWidth:360,margin:"0 auto",lineHeight:1.5}}>O cronograma é montado a partir das atividades da obra e dos prazos (em dias) de cada uma. Cadastre as atividades na aba Medições para liberar esta tela.</div>
  </div>
 );
 const{linhas,meses,baseData,inicioStr,diasTot,mesesPadrao,sobrep,custoTotal,totalEmp,desembolsoTotal,
  desembolsoEfetivo,projEmp,fonteCusto,semCusto,realFis,pagoCustos,pagoTot,mesAtualIdx,mesesDecorridos,
  mesesRest,prevFisHoje,baseReal,podeReal,realPorMes,etapas,indiretos}=R;
 const matriz=!!R.matriz;
 const A=D.acomp||[];
 const desvioFis=realFis-prevFisHoje;
 const ritmoNec=(100-realFis)/mesesRest;
 // Falta desembolsar = saldo de obra + parcelas de empréstimo ainda por pagar no cronograma
 const faltaObra=Math.max(custoTotal-pagoCustos,0);
 const faltaEmp=Math.max(desembolsoEfetivo-pagoTot-faltaObra,0);
 const faltaTotal=faltaObra+faltaEmp;
 const desembRest=faltaTotal/mesesRest;

 const salvarCfg=()=>{
  const novo={...cfg};
  if(fMeses!=="")novo.meses=Math.max(1,Math.min(Number(fMeses)||meses,60));
  if(fSobrep!=="")novo.sobrep=Math.max(0,Math.min(Number(fSobrep)||0,60));
  if(fInicio!=="")novo.inicio=fInicio;
  sv(novo);setEditando(false);setFMeses("");setFSobrep("");setFInicio("");
 };
 const setTipo=(nome,tipo)=>sv({...cfg,tipos:{...(cfg.tipos||{}),[nome]:tipo}});
 const salvarCustoEtapa=()=>{sv({...cfg,custos:{...(cfg.custos||{}),[editCusto]:Number(fCusto)||0}});setEditCusto(null);setFCusto("");};
 // Medição realizada do mês: ajusta a previsão e sincroniza a parcela a receber
 const salvarMedicao=(limpar)=>{
  const m=editMed;
  const novo={...(cfg.medicaoReal||{})};
  const valor=Number(fMed)||0;
  if(limpar)delete novo[m];else novo[m]=valor;
  sv({...cfg,medicaoReal:novo});
  if(svRec&&R.baseData){
   const alvo=new Date(R.baseData.getFullYear(),R.baseData.getMonth()+m+(R.defas||0),1);
   const fim=new Date(alvo.getFullYear(),alvo.getMonth()+1,0);
   const vencStr=D2(fim.getDate())+"/"+D2(fim.getMonth()+1)+"/"+fim.getFullYear();
   const prev=limpar?(R.linhas[m].medicaoPrev||0):valor;
   const lista=[...(D.rec||[])];
   let idx=-1;
   for(let i=0;i<lista.length;i++){
    const v=parseMesRef(lista[i].venc)||parseMesRef(lista[i].data);
    if(v&&v.getFullYear()===alvo.getFullYear()&&v.getMonth()===alvo.getMonth()){idx=i;break;}
   }
   const rotulo="Medição "+mesLabel(R.baseData,m);
   if(idx>=0)lista[idx]={...lista[idx],data:rotulo,venc:lista[idx].venc||vencStr,prev};
   else lista.push({data:rotulo,venc:vencStr,prev,rec:0,obs:"Recebimento no mês seguinte à medição"});
   svRec(lista);
  }
  setEditMed(null);setFMed("");
 };
 const limparCustoEtapa=nome=>{const nc={...(cfg.custos||{})};delete nc[nome];sv({...cfg,custos:nc});setEditCusto(null);};

 // Gráfico
 const W=320,H=170,PL=30,PB=22,PT=10,PR=8;
 const px=i=>PL+(W-PL-PR)*(meses>1?i/(meses-1):0);
 const py=v=>PT+(H-PT-PB)*(1-Math.min(Math.max(v,0),100)/100);
 const pathFis=linhas.map((l,i)=>(i?"L":"M")+px(i).toFixed(1)+" "+py(l.acFis).toFixed(1)).join(" ");
 const pathPlan=baseReal?linhas.map((l,i)=>(i?"L":"M")+px(i).toFixed(1)+" "+py(l.acPlanFis).toFixed(1)).join(" "):"";
 const pathFin=linhas.map((l,i)=>(i?"L":"M")+px(i).toFixed(1)+" "+py(desembolsoEfetivo>0?l.acFin/desembolsoEfetivo*100:0).toFixed(1)).join(" ");
 const corte=baseReal?px(Math.max(mesAtualIdx-0.5,0)):null;

 const Bloco=({titulo,children,cor})=>(
  <div style={{background:"#fff",border:"1px solid #e2e8f0",borderLeft:"4px solid "+(cor||"#f8c400"),borderRadius:12,padding:16,marginBottom:16,boxShadow:"0 1px 4px #0001"}}>
   <div style={{fontSize:13,fontWeight:800,color:"#1e2d5a",marginBottom:10}}>{titulo}</div>
   {children}
  </div>
 );

 return(
  <div>
   <div style={{marginBottom:16}}>
    <h2 style={{fontSize:20,fontWeight:800,color:"#f59e0b",margin:0}}>Cronograma Físico-Financeiro</h2>
    <p style={{fontSize:12,color:"#94a3b8",margin:"4px 0 0",lineHeight:1.5}}>Previsão de avanço e de desembolso mês a mês, com curva S. Base: {etapas.length} etapas · {diasTot.toLocaleString("pt-BR")} dias de atividade · custos de {fonteCusto}.</p>
   </div>

   {podeReal&&(
    <div style={{background:baseReal?"#f0fdf4":"#f8fafc",border:"1px solid "+(baseReal?"#bbf7d0":"#e2e8f0"),borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}>
     <div style={{fontSize:11,color:baseReal?"#166534":"#64748b",lineHeight:1.5,flex:1,minWidth:200}}>
      {baseReal
       ?<span>✅ <b>Ancorado no realizado.</b> Os meses fechados mostram o que de fato aconteceu ({pct(realFis)} executado e {fmtBR(pagoCustos)} pagos) e o saldo foi reprojetado de {mesLabel(baseData,mesAtualIdx)} em diante.</span>
       :<span>Exibindo o <b>plano original</b>, sem considerar o que já foi executado.</span>}
     </div>
     <button onClick={()=>sv({...cfg,baseReal:!baseReal})} style={{...BS,fontSize:11,padding:"5px 10px"}}>{baseReal?"Ver plano original":"Ancorar no realizado"}</button>
    </div>
   )}

   {(D.emprestimos||[]).length>0&&projEmp.detalhes.length===0&&baseData&&(
    <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:"10px 14px",fontSize:11,color:"#92400e",lineHeight:1.5,marginBottom:16}}>
     ⚠️ Há empréstimo cadastrado, mas sem nº de parcelas ou sem a data da 1ª parcela — por isso ele não entra no desembolso. Complete esses campos na aba Empréstimo.
    </div>
   )}
   {semCusto&&(
    <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"10px 14px",fontSize:11,color:"#991b1b",lineHeight:1.5,marginBottom:16}}>
     ⚠️ Nenhum custo previsto encontrado para esta obra. O cronograma físico funciona, mas a parte financeira fica zerada até você lançar os custos na aba Custos ou informar o custo de cada etapa abaixo.
    </div>
   )}

   {desembolsoTotal>0&&(
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:16}}>
     <KCard label="Custo da Obra" value={fmtBR(custoTotal)} color="#ef4444" sub={etapas.length+" etapas + indiretos"}/>
     <KCard label="Empréstimo no Período" value={fmtBR(totalEmp)} color="#0ea5e9" sub={projEmp.amortizacao>0?"c/ quitação antecipada":"parcelas do período"}/>
     <KCard label="Desembolso Total" value={fmtBR(desembolsoEfetivo)} color="#f59e0b" sub={"em "+meses+" meses · média "+fmtBR(desembolsoEfetivo/meses)+"/mês"}/>
     <KCard label="Falta Desembolsar" value={fmtBR(faltaTotal)} color="#b91c1c" sub={"obra "+fmtBR(faltaObra)+(faltaEmp>0?" + empréstimo "+fmtBR(faltaEmp):"")}/>
    </div>
   )}
   {projEmp.saldoNaoAgendado>0&&(
    <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:"10px 14px",fontSize:11,color:"#92400e",lineHeight:1.5,marginBottom:16}}>
     ⚠️ {fmtBR(projEmp.saldoNaoAgendado)} de saldo devedor ({projEmp.naoAgendados.map(x=>x.nome+" — "+x.motivo).join("; ")}) está sendo <b>diluído nos meses</b> por falta de cronograma de parcelas. Complete nº de parcelas e vencimento da 1ª parcela na aba Empréstimo para as parcelas caírem no mês certo e a quitação antecipada ser calculada.
    </div>
   )}

   {/* Configuração */}
   <div style={{background:"#1e2d5a",borderRadius:12,padding:16,marginBottom:16}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:editando?12:0}}>
     <div style={{color:"#fff",fontSize:13,fontWeight:700}}>
      {meses} meses · início {inicioStr||"não informado"}{matriz?"":" · sobreposição "+(sobrep*100).toFixed(0)+"%"}
      <div style={{fontSize:11,color:"#94a3b8",fontWeight:400,marginTop:3}}>{matriz?"Percentuais por etapa vindos do cronograma da planilha.":"Sobreposição = quanto a etapa seguinte começa antes da anterior acabar."}</div>
     </div>
     <button onClick={()=>{setEditando(v=>!v);setFMeses(String(meses));setFSobrep(String((sobrep*100).toFixed(0)));setFInicio(inicioStr);}} style={{...BS,fontSize:12,background:"#f8c400",color:"#0f172a"}}>{editando?"Fechar":"Ajustar prazo"}</button>
    </div>
    {editando&&(
     <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
       <label style={{fontSize:11,color:"#94a3b8"}}>Prazo (meses)
        <input type="number" min="1" value={fMeses} onChange={e=>setFMeses(e.target.value)} disabled={matriz} style={{...IS,marginTop:3,opacity:matriz?0.5:1}}/>
        {matriz&&<span style={{fontSize:10,color:"#94a3b8"}}>definido pelo cronograma da planilha</span>}
       </label>
       <label style={{fontSize:11,color:"#94a3b8"}}>Sobreposição (%)
        <input type="number" min="0" max="60" value={fSobrep} onChange={e=>setFSobrep(e.target.value)} style={{...IS,marginTop:3}}/>
       </label>
       <label style={{fontSize:11,color:"#94a3b8"}}>Início
        <input value={fInicio} onChange={e=>setFInicio(e.target.value)} placeholder="dd/mm/aaaa" style={{...IS,marginTop:3}}/>
       </label>
      </div>
      <div style={{fontSize:10,color:"#94a3b8",margin:"8px 0 10px",lineHeight:1.5}}>Sugestão do sistema: {mesesPadrao} meses ({diasTot.toLocaleString("pt-BR")} dias de atividade com duas frentes em paralelo). Sobreposição 0% = etapas em fila; 25% é o mais comum em obra residencial.</div>
      <button onClick={salvarCfg} style={{...BP,width:"100%"}}>Aplicar e recalcular</button>
     </div>
    )}
   </div>

   {/* Situação hoje */}
   {baseData&&(
    <Bloco titulo={"Situação hoje — mês "+(mesAtualIdx+1)+" de "+meses} cor={desvioFis>=0?"#16a34a":"#ef4444"}>
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:12}}>
      <div><div style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase"}}>Físico previsto</div><div style={{fontSize:17,fontWeight:800,color:"#1e293b"}}>{pct(prevFisHoje)}</div></div>
      <div><div style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase"}}>Físico realizado</div><div style={{fontSize:17,fontWeight:800,color:desvioFis>=0?"#16a34a":"#ef4444"}}>{pct(realFis)}</div></div>
      <div><div style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase"}}>Desvio</div><div style={{fontSize:17,fontWeight:800,color:desvioFis>=0?"#16a34a":"#ef4444"}}>{(desvioFis>=0?"+":"")+desvioFis.toFixed(2)}%</div></div>
      <div><div style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase"}}>Já pago (custos)</div><div style={{fontSize:17,fontWeight:800,color:"#8b5cf6"}}>{fmtBR(pagoCustos)}</div></div>
     </div>
     <div style={{background:"#f8fafc",borderRadius:8,padding:"10px 12px",fontSize:12,color:"#475569",lineHeight:1.6}}>
      Para entregar no prazo faltam <b>{Math.max(meses-Math.floor(mesesDecorridos),0)} meses</b>: é preciso avançar <b style={{color:"#f59e0b"}}>{ritmoNec.toFixed(2)}% por mês</b> e desembolsar em média <b style={{color:"#ef4444"}}>{fmtBR(desembRest)}/mês</b>.
      <div style={{marginTop:6}}>Falta desembolsar <b style={{color:"#b91c1c"}}>{fmtBR(faltaTotal)}</b> — {fmtBR(faltaObra)} de custo de obra{faltaEmp>0?" + "+fmtBR(faltaEmp)+" de parcelas do empréstimo":""}.</div>
      {desvioFis<-1&&<span style={{color:"#b91c1c"}}> A obra está atrasada em relação à curva prevista.</span>}
      {desvioFis>1&&<span style={{color:"#166534"}}> A obra está adiantada em relação à curva prevista.</span>}
     </div>
    </Bloco>
   )}

   {/* Curva S */}
   <Bloco titulo="Curva S" cor="#3b82f6">
    <svg viewBox={"0 0 "+W+" "+H} style={{width:"100%",height:"auto"}}>
     {[0,25,50,75,100].map(v=>(
      <g key={v}>
       <line x1={PL} y1={py(v)} x2={W-PR} y2={py(v)} stroke="#f1f5f9" strokeWidth="1"/>
       <text x={PL-4} y={py(v)+3} textAnchor="end" fontSize="7" fill="#94a3b8">{v}%</text>
      </g>
     ))}
     {linhas.map((l,i)=>((meses<=12||i%2===0)&&(
      <text key={i} x={px(i)} y={H-8} textAnchor="middle" fontSize="6.5" fill="#94a3b8">{mesLabel(baseData,i)}</text>
     )))}
     {corte!==null&&<line x1={corte} y1={PT} x2={corte} y2={H-PB} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2"/>}
     {pathPlan&&<path d={pathPlan} fill="none" stroke="#cbd5e1" strokeWidth="1.6"/>}
     <path d={pathFis} fill="none" stroke="#f59e0b" strokeWidth="2.2"/>
     <path d={pathFin} fill="none" stroke="#ef4444" strokeWidth="1.8" strokeDasharray="4 3"/>
     {baseReal&&linhas.filter(l=>l.realizado).map((l,i)=><circle key={i} cx={px(l.m)} cy={py(l.acFis)} r="2.6" fill="#16a34a"/>)}
    </svg>
    <div style={{display:"flex",gap:14,flexWrap:"wrap",fontSize:11,color:"#64748b",marginTop:8}}>
     <span><b style={{color:"#f59e0b"}}>—</b> físico {baseReal?"(realizado + reprojetado)":"previsto"}</span>
     <span><b style={{color:"#ef4444"}}>- -</b> financeiro</span>
     {baseReal&&<span><b style={{color:"#cbd5e1"}}>—</b> plano original</span>}
    </div>
   </Bloco>

   {/* Tabela mensal */}
   <Bloco titulo="Mês a mês" cor="#f8c400">
    <div style={{fontSize:11,color:"#64748b",marginBottom:10}}>Toque em um mês para ver o que se executa e quanto custa.{baseReal&&" Os meses em verde já aconteceram."}</div>
    <div style={{overflowX:"auto"}}>
     <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
      <thead><tr style={{background:"#f8fafc"}}>
       {(matriz?["Mês","Físico (dias)","Acum.","Desembolso","Acum."]:["Mês","Físico","Acum.","Desembolso","Acum."]).map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",color:"#64748b",fontWeight:700,whiteSpace:"nowrap"}}>{h}</th>)}
      </tr></thead>
      <tbody>
       {linhas.map((l,i)=>{
        const atual=baseData&&i===mesAtualIdx;
        return(
         <tr key={i} onClick={()=>setDetalhe(detalhe===i?null:i)} style={{borderBottom:"1px solid #f1f5f9",cursor:"pointer",background:l.realizado?"#f0fdf4":atual?"#fffbeb":detalhe===i?"#f8fafc":"transparent"}}>
          <td style={{padding:"9px 10px",fontWeight:700,color:l.realizado?"#166534":atual?"#92400e":"#1e293b",whiteSpace:"nowrap"}}>{detalhe===i?"▾ ":"▸ "}{mesLabel(baseData,i)}{atual?" •":""}</td>
          <td style={{padding:"9px 10px",color:l.realizado?"#16a34a":"#f59e0b",fontWeight:700}}>{l.fis.toFixed(1)}%</td>
          <td style={{padding:"9px 10px",color:"#64748b"}}>{l.acFis.toFixed(1)}%</td>
          <td style={{padding:"9px 10px",color:l.realizado?"#16a34a":"#ef4444",fontWeight:700,whiteSpace:"nowrap"}}>{fmtBR(l.fin)}</td>
          <td style={{padding:"9px 10px",color:"#64748b",whiteSpace:"nowrap"}}>{fmtBR(l.acFin)}</td>
         </tr>
        );
       })}
       <tr style={{background:"#1e2d5a",color:"#fff"}}>
        <td style={{padding:"9px 10px",fontWeight:800}}>Total</td>
        <td style={{padding:"9px 10px",fontWeight:800,color:"#f8c400"}}>100%</td>
        <td/>
        <td style={{padding:"9px 10px",fontWeight:800,color:"#f8c400",whiteSpace:"nowrap"}}>{fmtBR(desembolsoEfetivo)}</td>
        <td/>
       </tr>
      </tbody>
     </table>
    </div>
   </Bloco>

   {/* Detalhe do mês */}
   {detalhe!==null&&linhas[detalhe]&&(
    <Bloco titulo={(linhas[detalhe].realizado?"O que aconteceu em ":"O que se executa em ")+mesLabel(baseData,detalhe)} cor="#0ea5e9">
     <div style={{fontSize:12,color:"#475569",marginBottom:12,lineHeight:1.6}}>
      {linhas[detalhe].realizado
       ?<span>Mês fechado: <b style={{color:"#16a34a"}}>{linhas[detalhe].fis.toFixed(2)}%</b> de avanço e <b>{fmtBR(linhas[detalhe].fin)}</b> desembolsados — rateio do realizado total proporcional ao ritmo previsto para o mês.</span>
       :<span>Avanço previsto de <b style={{color:"#f59e0b"}}>{linhas[detalhe].fis.toFixed(2)}%</b> e desembolso de <b style={{color:"#ef4444"}}>{fmtBR(linhas[detalhe].fin)}</b> — {fmtBR(linhas[detalhe].obra)} em obra{linhas[detalhe].emp>0?" e "+fmtBR(linhas[detalhe].emp)+" de empréstimo":""}.</span>}
      {detalhe===meses-1&&projEmp.amortizacao>0&&<div style={{marginTop:6,color:"#0369a1"}}>Inclui {fmtBR(projEmp.amortizacao)} de quitação antecipada das parcelas que venceriam depois do fim da obra.</div>}
     </div>
     {linhas[detalhe].ativas.length===0&&<div style={{fontSize:12,color:"#94a3b8"}}>Nenhuma etapa prevista para este mês.</div>}
     {linhas[detalhe].ativas.map((at,ai)=>{
      const secs=[];
      at.etapa.its.forEach(a=>{
       const sec=a.sec||"Geral";
       let o=null;for(let x=0;x<secs.length;x++)if(secs[x].sec===sec)o=secs[x];
       if(!o){o={sec,dias:0,ativs:[]};secs.push(o);}
       o.dias+=Number(a.prazo)||0;o.ativs.push(a.ativ);
      });
      const dTot=secs.reduce((s,x)=>s+x.dias,0)||1;
      let p0=at.etapa.janela.ini;
      const t0=detalhe/meses,t1=(detalhe+1)/meses;
      const noMes=[];
      secs.forEach(x=>{
       const dur=at.etapa.janela.dur*(x.dias/dTot);
       const ini=p0,fim=p0+dur;p0=fim;
       if(interseccao(ini,fim,t0,t1)>0)noMes.push(x);
      });
      return(
       <div key={ai} style={{background:"#f8fafc",borderRadius:10,padding:"10px 12px",marginBottom:8}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:6}}>
         <span style={{fontSize:13,fontWeight:800,color:corEtapa(at.nome,A)}}>{at.nome}</span>
         <span style={{fontSize:12,color:"#64748b"}}>{(at.frac*100).toFixed(0)}% da etapa · {at.pctObra.toFixed(2)}% da obra · {fmtBR(at.custo)}</span>
        </div>
        {noMes.length>0&&(
         <div style={{fontSize:11,color:"#475569",lineHeight:1.6}}>
          {noMes.map((x,xi)=>(
           <div key={xi} style={{marginBottom:3}}>• <b>{x.sec}</b> <span style={{color:"#94a3b8"}}>— {x.ativs.slice(0,4).join(", ")}{x.ativs.length>4?" e mais "+(x.ativs.length-4):""}</span></div>
          ))}
         </div>
        )}
       </div>
      );
     })}
    </Bloco>
   )}

   {matriz&&(
    <Bloco titulo="Medição, recebimento e caixa" cor="#16a34a">
     <div style={{fontSize:11,color:"#64748b",marginBottom:10,lineHeight:1.5}}>
      Cronograma informado na planilha do cliente. A medição do mês é faturada e {R.defas>0?<span>recebida <b>{R.defas} mês depois</b></span>:<span>recebida no próprio mês</span>}. O caixa acumulado mostra de quanto capital de giro você precisa.
      {R.notaMatriz&&<div style={{marginTop:4,color:"#94a3b8"}}>{R.notaMatriz}</div>}
     </div>
     <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
       <thead><tr style={{background:"#f8fafc"}}>
        {["Mês","Medição","% valor","% dias","Recebe","Gasta","Resultado","Caixa acum."].map(h=><th key={h} style={{padding:"8px 8px",textAlign:"left",color:"#64748b",fontWeight:700,whiteSpace:"nowrap"}}>{h}</th>)}
       </tr></thead>
       <tbody>
        {linhas.map((l,i)=>(
         <tr key={i} style={{borderBottom:"1px solid #f1f5f9",background:i===mesAtualIdx?"#fffbeb":"transparent"}}>
          <td style={{padding:"8px",fontWeight:700,whiteSpace:"nowrap"}}>{mesLabel(baseData,i)}</td>
          <td onClick={()=>{setEditMed(i);setFMed(String(Math.round(l.medicao*100)/100));}} style={{padding:"8px",color:l.ajustada?"#0369a1":"#16a34a",fontWeight:700,whiteSpace:"nowrap",cursor:"pointer",textDecoration:"underline dotted"}}>{fmtBR(l.medicao)}{l.ajustada?" ✎":""}</td>
          <td style={{padding:"8px",color:"#f59e0b",fontWeight:700}}>{l.fisValor.toFixed(1)}%</td>
          <td style={{padding:"8px",color:"#94a3b8"}}>{l.fisPlan.toFixed(1)}%</td>
          <td style={{padding:"8px",color:"#3b82f6",fontWeight:700,whiteSpace:"nowrap"}}>{fmtBR(l.receb)}</td>
          <td style={{padding:"8px",color:"#ef4444",fontWeight:700,whiteSpace:"nowrap"}}>{fmtBR(l.fin)}</td>
          <td style={{padding:"8px",fontWeight:700,color:l.resultado>=0?"#16a34a":"#ef4444",whiteSpace:"nowrap"}}>{fmtBR(l.resultado)}</td>
          <td style={{padding:"8px",fontWeight:800,color:l.acCaixa>=0?"#1e293b":"#ef4444",whiteSpace:"nowrap"}}>{fmtBR(l.acCaixa)}</td>
         </tr>
        ))}
        {R.sobra>0&&(
         <tr style={{borderBottom:"1px solid #f1f5f9",background:"#f0fdf4"}}>
          <td style={{padding:"8px",fontWeight:700,whiteSpace:"nowrap"}}>{mesLabel(baseData,meses)}</td>
          <td style={{padding:"8px",color:"#94a3b8"}}>—</td><td/><td/>
          <td style={{padding:"8px",color:"#3b82f6",fontWeight:700,whiteSpace:"nowrap"}}>{fmtBR(R.sobra)}</td>
          <td style={{padding:"8px",color:"#94a3b8"}}>—</td>
          <td style={{padding:"8px",fontWeight:700,color:"#16a34a",whiteSpace:"nowrap"}}>{fmtBR(R.sobra)}</td>
          <td style={{padding:"8px",fontWeight:800,whiteSpace:"nowrap"}}>{fmtBR(linhas[meses-1].acCaixa+R.sobra)}</td>
         </tr>
        )}
        <tr style={{background:"#1e2d5a",color:"#fff"}}>
         <td style={{padding:"8px",fontWeight:800}}>Total</td>
         <td style={{padding:"8px",fontWeight:800,color:"#4ade80",whiteSpace:"nowrap"}}>{fmtBR(R.valorTot)}</td>
         <td style={{padding:"8px",fontWeight:800,color:"#f8c400"}}>100%</td><td/>
         <td style={{padding:"8px",fontWeight:800,color:"#93c5fd",whiteSpace:"nowrap"}}>{fmtBR(R.valorTot)}</td>
         <td style={{padding:"8px",fontWeight:800,color:"#fca5a5",whiteSpace:"nowrap"}}>{fmtBR(R.desembolsoEfetivo)}</td>
         <td style={{padding:"8px",fontWeight:800,color:"#f8c400",whiteSpace:"nowrap"}}>{fmtBR(R.valorTot-R.desembolsoEfetivo)}</td>
         <td/>
        </tr>
       </tbody>
      </table>
     </div>
     {(()=>{
      const pior=linhas.reduce((mn,l)=>Math.min(mn,l.acCaixa),0);
      return pior<0?(
       <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"10px 12px",marginTop:10,fontSize:12,color:"#991b1b",lineHeight:1.6}}>
        ⚠️ O caixa da obra fica negativo em <b>{fmtBR(Math.abs(pior))}</b> no pior mês. É esse o capital de giro que a obra exige antes de se pagar — a primeira medição só entra {R.defas>0?"no mês seguinte":"no mesmo mês"}.
       </div>
      ):(
       <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:8,padding:"10px 12px",marginTop:10,fontSize:12,color:"#166534"}}>
        ✅ A obra se paga mês a mês, sem precisar de capital de giro.
       </div>
      );
     })()}
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginTop:12}}>
      <div style={{background:"#f8fafc",borderRadius:8,padding:"10px 12px"}}>
       <div style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase"}}>Avanço por valor</div>
       <div style={{fontSize:16,fontWeight:800,color:"#f59e0b"}}>{pct(R.realFisValor)}</div>
       <div style={{fontSize:10,color:"#94a3b8"}}>base da medição paga</div>
      </div>
      <div style={{background:"#f8fafc",borderRadius:8,padding:"10px 12px"}}>
       <div style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase"}}>Avanço por dias</div>
       <div style={{fontSize:16,fontWeight:800,color:"#3b82f6"}}>{pct(realFis)}</div>
       <div style={{fontSize:10,color:"#94a3b8"}}>esforço de execução</div>
      </div>
      <div style={{background:"#f8fafc",borderRadius:8,padding:"10px 12px"}}>
       <div style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase"}}>Lucro previsto</div>
       <div style={{fontSize:16,fontWeight:800,color:"#16a34a"}}>{fmtBR(R.valorTot-R.desembolsoEfetivo)}</div>
       <div style={{fontSize:10,color:"#94a3b8"}}>{R.valorTot>0?pct((R.valorTot-R.desembolsoEfetivo)/R.valorTot*100):"—"} do contrato</div>
      </div>
     </div>
     <div style={{fontSize:10,color:"#94a3b8",marginTop:8,lineHeight:1.5}}>Toque no valor da medição para lançar o que foi <b>de fato medido</b> no mês. O valor ajustado atualiza a parcela a receber do mês seguinte e aparece no Painel Geral.</div>
     {R.semMatriz&&R.semMatriz.length>0&&(
      <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,padding:"9px 12px",marginTop:10,fontSize:11,color:"#92400e",lineHeight:1.5}}>
       ⚠️ Sem linha no cronograma da planilha (diluído igualmente pelos meses): {R.semMatriz.join(", ")}.
      </div>
     )}
    </Bloco>
   )}

   {projEmp.detalhes.length>0&&(
    <Bloco titulo="Empréstimos dentro do cronograma" cor="#0ea5e9">
     <div style={{fontSize:11,color:"#64748b",marginBottom:10,lineHeight:1.5}}>As parcelas entram no desembolso do mês do vencimento. As que venceriam depois da entrega são projetadas como <b>quitação antecipada no último mês</b>, trazidas a valor presente pela taxa do contrato — IOF e tarifas não entram nesse desconto porque já foram pagos na liberação.</div>
     {projEmp.detalhes.map((x,i)=>(
      <div key={i} style={{background:"#f8fafc",borderRadius:10,padding:"10px 12px",marginBottom:8}}>
       <div style={{fontSize:13,fontWeight:800,color:"#1e293b",marginBottom:4}}>{x.nome}</div>
       <div style={{fontSize:11,color:"#64748b",lineHeight:1.7}}>
        {x.n}x de {fmtBR(x.parcela)}{x.taxa>0?" · "+(x.taxa*100).toFixed(2)+"% a.m. "+(x.informada?"(taxa do contrato)":"(estimada pelo contrato)"):""}<br/>
        {x.cet>x.taxa+0.0001&&<span style={{color:"#b45309"}}>Custo efetivo com IOF e tarifas: {(x.cet*100).toFixed(2)}% a.m.{x.iof>0?" · "+fmtBR(x.iof)+" retidos na liberação":""}<br/></span>}
        {x.dentro>0
         ? <span><b>{x.dentro} parcela(s)</b> caem dentro da obra ({mesLabel(baseData,x.primeiro)} a {mesLabel(baseData,x.ultimo)}) = {fmtBR(x.dentro*x.parcela)}</span>
         : <span>Nenhuma parcela vence durante a obra.</span>}
       </div>
       {x.fora>0&&(
        <div style={{background:"#e0f2fe",border:"1px solid #bae6fd",borderRadius:8,padding:"8px 10px",marginTop:8,fontSize:11,color:"#075985",lineHeight:1.6}}>
         💡 <b>{x.fora} parcela(s)</b> venceriam depois da entrega ({fmtBR(x.face)} em valor de face). Quitando de uma vez em {mesLabel(baseData,meses-1)} com o recebimento final: <b>{fmtBR(x.quit)}</b> — economia de <b>{fmtBR(x.economia)}</b>, descontados a {(x.taxa*100).toFixed(2)}% a.m.{x.informada?"":" Informe a taxa do contrato na aba Empréstimo para o valor ficar exato."}
        </div>
       )}
      </div>
     ))}
    </Bloco>
   )}

   {/* Etapas e custos */}
   <Bloco titulo="Etapas — peso físico, janela e custo" cor="#8b5cf6">
    <div style={{fontSize:11,color:"#64748b",marginBottom:10}}>O peso vem dos dias de atividade de cada etapa. Toque no valor para informar um custo previsto diferente do lançado.</div>
    <div style={{display:"grid",gap:8}}>
     {etapas.map((e,i)=>{
      const mIni=Math.floor(e.janela.ini*meses),mFim=Math.min(Math.ceil(e.janela.fim*meses)-1,meses-1);
      const concl=e.dias>0?e.feitoDias/e.dias*100:0;
      return(
       <div key={i} style={{background:"#f8fafc",borderRadius:10,padding:"10px 12px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
         <div>
          <div style={{fontSize:13,fontWeight:800,color:corEtapa(e.nome,A)}}>{e.nome}</div>
          <div style={{fontSize:11,color:"#64748b"}}>{(e.peso*100).toFixed(1)}% da obra · {e.dias.toLocaleString("pt-BR")} dias · {mesLabel(baseData,mIni)} a {mesLabel(baseData,mFim)}</div>
          {matriz&&e.valor>0&&(
           <div style={{fontSize:11,color:e.custo>e.valor?"#b91c1c":"#16a34a",fontWeight:600,marginTop:2}}>
            recebe {fmtBR(e.valor)} · paga {fmtBR(e.custo)} · margem {((1-e.custo/e.valor)*100).toFixed(0)}%
           </div>
          )}
         </div>
         <button onClick={()=>{setEditCusto(e.nome);setFCusto(String(e.custo||0));}} style={{...BS,fontSize:12,padding:"5px 10px"}}>{fmtBR(e.custo)}{cfg.custos&&cfg.custos[e.nome]!==undefined?" ✎":""}</button>
        </div>
        <div style={{background:"#e2e8f0",borderRadius:99,height:8,marginTop:8,overflow:"hidden"}}>
         <div style={{width:Math.min(concl,100)+"%",height:"100%",background:corEtapa(e.nome,A)}}/>
        </div>
        <div style={{fontSize:10,color:"#94a3b8",marginTop:4}}>executado {pct(concl)}</div>
       </div>
      );
     })}
    </div>
    {indiretos.length>0&&(
     <div style={{marginTop:14}}>
      <div style={{fontSize:12,fontWeight:700,color:"#1e2d5a",marginBottom:6}}>Custos diluídos ao longo da obra</div>
      <div style={{display:"grid",gap:6}}>
       {indiretos.map((x,i)=>(
        <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap",background:"#f8fafc",borderRadius:8,padding:"8px 12px"}}>
         <div>
          <div style={{fontSize:12,fontWeight:700,color:"#1e293b"}}>{x.nome}</div>
          <div style={{fontSize:10,color:"#94a3b8"}}>{x.tipo==="linear"?"dividido igualmente por mês":"acompanha o avanço físico"}</div>
         </div>
         <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <span style={{fontSize:12,fontWeight:700,color:"#ef4444"}}>{fmtBR(x.custo)}</span>
          <button onClick={()=>setTipo(x.nome,x.tipo==="linear"?"fisico":"linear")} style={{...BS,fontSize:10,padding:"4px 8px"}}>{x.tipo==="linear"?"→ físico":"→ linear"}</button>
         </div>
        </div>
       ))}
      </div>
     </div>
    )}
   </Bloco>

   {editMed!==null&&linhas[editMed]&&(
    <Modal onClose={()=>setEditMed(null)} title={"Medição de "+mesLabel(baseData,editMed)}>
     <div style={{background:"#f8fafc",borderRadius:8,padding:"10px 12px",fontSize:12,color:"#475569",lineHeight:1.6,marginBottom:12}}>
      Previsto pelo cronograma: <b>{fmtBR(linhas[editMed].medicaoPrev||0)}</b> ({(R.valorTot>0?(linhas[editMed].medicaoPrev||0)/R.valorTot*100:0).toFixed(1)}% do contrato).<br/>
      Informe abaixo o valor <b>efetivamente medido</b> no mês — a parcela a receber de {mesLabel(baseData,editMed+(R.defas||0))} é atualizada junto.
     </div>
     <label style={{fontSize:12,color:"#64748b"}}>Medição realizada (R$)
      <input type="number" value={fMed} onChange={e=>setFMed(e.target.value)} style={IS} autoFocus/>
     </label>
     {Number(fMed)>0&&R.valorTot>0&&(
      <div style={{fontSize:11,color:"#94a3b8",marginTop:6}}>
       Equivale a {(Number(fMed)/R.valorTot*100).toFixed(2)}% do contrato · diferença de {fmtBR(Number(fMed)-(linhas[editMed].medicaoPrev||0))} em relação ao previsto.
      </div>
     )}
     <div style={{display:"flex",gap:10,marginTop:20}}>
      <button onClick={()=>salvarMedicao(false)} style={{...BP,flex:1}}>Salvar</button>
      <button onClick={()=>salvarMedicao(true)} style={{...BS}}>Voltar ao previsto</button>
      <button onClick={()=>setEditMed(null)} style={{...BS,flex:1}}>Cancelar</button>
     </div>
    </Modal>
   )}

   {editCusto!==null&&(
    <Modal onClose={()=>setEditCusto(null)} title={"Custo previsto — "+editCusto}>
     <label style={{fontSize:12,color:"#64748b"}}>Valor previsto para a etapa (R$)
      <input type="number" value={fCusto} onChange={e=>setFCusto(e.target.value)} style={IS} autoFocus/>
     </label>
     <div style={{fontSize:11,color:"#94a3b8",marginTop:8,lineHeight:1.5}}>Sem informar nada, o sistema usa o total lançado em Custos para esta etapa e, na falta dele, o orçamento da obra.</div>
     <div style={{display:"flex",gap:10,marginTop:20}}>
      <button onClick={salvarCustoEtapa} style={{...BP,flex:1}}>Salvar</button>
      <button onClick={()=>limparCustoEtapa(editCusto)} style={{...BS}}>Usar automático</button>
      <button onClick={()=>setEditCusto(null)} style={{...BS,flex:1}}>Cancelar</button>
     </div>
    </Modal>
   )}

   <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"12px 14px",fontSize:11,color:"#64748b",lineHeight:1.6}}>
    <b style={{color:"#1e2d5a"}}>Como este cronograma é montado:</b> o peso físico de cada etapa vem dos dias de atividade cadastrados. As etapas são posicionadas em sequência com sobreposição, o que produz a curva S — início lento, pico no meio e desaceleração no acabamento. O custo de cada etapa é distribuído ao longo da própria janela; administrativo, impostos e taxas são diluídos igualmente por mês. Com a obra em andamento, os meses fechados passam a mostrar o realizado e o saldo é redistribuído nos meses restantes, mantendo o mesmo ritmo relativo do plano.
   </div>
  </div>
 );
}

// ═════════════ PAINEL GERAL — visão consolidada das obras (só admin) ═════════
// Junta caixa, recebimentos, custos e cronograma de todas as obras para
// responder: quanto tenho hoje, quanto entra e quanto sai neste mês, e se o
// dinheiro de uma obra precisa cobrir a outra.
function mesKey(d){return d.getFullYear()+"-"+D2(d.getMonth()+1);}
function mesNome(d){return MESES_BR[d.getMonth()]+"/"+String(d.getFullYear()).slice(2);}
function addMes(d,n){return new Date(d.getFullYear(),d.getMonth()+n,1);}

// Obras de referência guardam os dados no código. Se o Supabase ainda não tem
// nada gravado para elas, o Painel Geral usaria zero — por isso completamos aqui.
function dadosDaObra(obra,bruto){
 const out=Object.assign({},bruto||{});
 const ch=chaveObra(obra?obra.id:"",obra);
 const vazio=x=>!x||(Array.isArray(x)&&x.length===0);
 if(ch==="madalena"){
  if(vazio(out.acomp))out.acomp=IA_MADALENA;
  if(vazio(out.custos))out.custos=IC_MADALENA;
  if(vazio(out.rec))out.rec=IR_MADALENA;
  if(!out.crono||!out.crono.inicio)out.crono=Object.assign({inicio:"01/08/2026",meses:6},out.crono||{});
 }else if(ch==="lote_d18"){
  if(vazio(out.acomp))out.acomp=IA;
  if(vazio(out.custos))out.custos=IC;
  if(vazio(out.rec))out.rec=IR;
 }
 return out;
}
function calcObraFin(obra,D,refDate,horizonte){
 const C=D.custos||[],R=D.rec||[],EM=D.emprestimos||[];
 const caixa=Number((D.caixa||{}).saldo)||0;
 const cr=calcCronograma(obra,D);
 const aReceberTot=R.reduce((s,r)=>s+Math.max((Number(r.prev)||0)-(Number(r.rec)||0),0),0);
 const custoAPagar=Math.max(C.reduce((s,c)=>s+(Number(c.total)||0),0)-C.reduce((s,c)=>s+(Number(c.pago)||0),0),0);
 const empDevido=EM.reduce((s,e)=>{
  const desc=(e.pagamentos||[]).reduce((ss,p)=>ss+(Number(p.desconto)||0),0);
  return s+Math.max((Number(e.valorTotal)||Number(e.valorContratado)||0)-desc,0);
 },0);
 const empPago=EM.reduce((s,e)=>s+(e.pagamentos||[]).reduce((ss,p)=>ss+(Number(p.valor)||0),0),0);
 const empSaldo=Math.max(empDevido-empPago,0);
 const empForaCaixa=EM.reduce((s,e)=>{
  if(e.noCaixa)return s;
  const lib=(e.valorLiberado===undefined||e.valorLiberado===null||e.valorLiberado===""?Number(e.valorContratado)||0:Number(e.valorLiberado)||0);
  return s+lib;
 },0);
 const lucro=caixa+aReceberTot+empForaCaixa-custoAPagar-empSaldo;

 // Fluxo por mês no horizonte
 const meses=[];
 for(let i=0;i<horizonte;i++){
  const d=addMes(refDate,i);
  const key=mesKey(d);
  // Entradas: parcelas com vencimento no mês (o que ainda falta receber dela)
  let entra=0;const parcelas=[];
  R.forEach(r=>{
   const v=parseMesRef(r.venc)||parseMesRef(r.data);
   if(!v||mesKey(v)!==key)return;
   const falta=Math.max((Number(r.prev)||0)-(Number(r.rec)||0),0);
   if(falta<=0)return;
   entra+=falta;parcelas.push({desc:r.data||r.venc,valor:falta});
  });
  // Saídas previstas: cronograma daquele mês
  let sai=0,semCrono=false;
  if(cr&&cr.baseData){
   const idx=diffMeses(cr.baseData,d);
   if(idx>=0&&idx<cr.meses)sai=cr.linhas[idx].fin;
  }else semCrono=true;
  // Custos já pagos com data neste mês — abatem o previsto do mês corrente
  let jaPago=0;
  C.forEach(c=>{
   const dp=parseMesRef(c.dataPag);
   if(dp&&mesKey(dp)===key)jaPago+=Number(c.pago)||0;
  });
  meses.push({key,data:d,nome:mesNome(d),entra,parcelas,previsto:sai,jaPago,falta:Math.max(sai-jaPago,0),semCrono});
 }
 return{caixa,aReceberTot,custoAPagar,empSaldo,empForaCaixa,lucro,meses,cr,
  temCrono:!!(cr&&cr.baseData),semVenc:R.filter(r=>!parseMesRef(r.venc)&&!parseMesRef(r.data)&&((Number(r.prev)||0)-(Number(r.rec)||0))>0).length};
}

function PainelGeral({obras,dados,onFechar,carregando}){
 const [horizonte,setHorizonte]=useState(6);
 const [detalhe,setDetalhe]=useState(null);
 const hoje=new Date();
 const ref=new Date(hoje.getFullYear(),hoje.getMonth(),1);
 const ativas=obras.filter(o=>(o.status||"").toLowerCase().indexOf("arquiv")<0);
 const linhas=ativas.map(o=>({obra:o,fin:calcObraFin(o,dadosDaObra(o,dados[o.id]),ref,horizonte)}));

 const somaCaixa=linhas.reduce((s,l)=>s+l.fin.caixa,0);
 const somaLucro=linhas.reduce((s,l)=>s+l.fin.lucro,0);
 const somaReceberTot=linhas.reduce((s,l)=>s+l.fin.aReceberTot,0);
 const somaPagarTot=linhas.reduce((s,l)=>s+l.fin.custoAPagar+l.fin.empSaldo,0);
 const mesesCons=[];
 for(let i=0;i<horizonte;i++){
  const d=addMes(ref,i);
  const entra=linhas.reduce((s,l)=>s+l.fin.meses[i].entra,0);
  const sai=linhas.reduce((s,l)=>s+l.fin.meses[i].falta,0);
  mesesCons.push({data:d,nome:mesNome(d),entra,sai,resultado:entra-sai});
 }
 let saldoAc=somaCaixa;
 mesesCons.forEach(m=>{saldoAc+=m.resultado;m.saldo=saldoAc;});
 const mes0=mesesCons[0];
 const precisaMais=Math.max(mes0.sai-(somaCaixa+mes0.entra),0);
 const semVenc=linhas.reduce((s,l)=>s+l.fin.semVenc,0);
 const semCrono=linhas.filter(l=>!l.fin.temCrono).map(l=>l.obra.nome);

 const Card=({label,valor,cor,sub})=>(
  <div style={{background:"#fff",borderRadius:10,padding:14,borderLeft:"3px solid "+cor,boxShadow:"0 1px 4px #0001"}}>
   <div style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>{label}</div>
   <div style={{fontSize:18,fontWeight:800,color:cor}}>{valor}</div>
   {sub&&<div style={{fontSize:10,color:"#94a3b8",marginTop:3,lineHeight:1.4}}>{sub}</div>}
  </div>
 );

 return(
  <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:20,marginBottom:28,boxShadow:"0 2px 10px #0001"}}>
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,flexWrap:"wrap",marginBottom:16}}>
    <div>
     <h3 style={{fontSize:18,fontWeight:800,color:"#f59e0b",margin:0}}>Painel Geral</h3>
     <p style={{fontSize:11,color:"#94a3b8",margin:"3px 0 0"}}>Consolidado de {ativas.length} obra(s) em andamento · visível somente para você{obras.length-ativas.length>0?" · "+(obras.length-ativas.length)+" arquivada(s) fora da conta":""}</p>
    </div>
    <button onClick={onFechar} style={{...BS,fontSize:12}}>Fechar</button>
   </div>

   {carregando&&<div style={{padding:"30px 0",textAlign:"center",color:"#f59e0b",fontWeight:700,fontSize:13}}>Carregando dados das obras...</div>}
   {!carregando&&(
   <div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:16}}>
     <Card label="Em caixa (total)" valor={fmtBR(somaCaixa)} cor="#8b5cf6" sub={linhas.map(l=>l.obra.nome.split("—")[0].trim()+" "+fmtBR(l.fin.caixa)).join(" · ")}/>
     <Card label={"A receber em "+mes0.nome} valor={fmtBR(mes0.entra)} cor="#3b82f6" sub="parcelas com vencimento no mês"/>
     <Card label={"A gastar em "+mes0.nome} valor={fmtBR(mes0.sai)} cor="#ef4444" sub="previsto do cronograma, já abatendo o que foi pago"/>
     <Card label="Resultado do mês" valor={fmtBR(somaCaixa+mes0.entra-mes0.sai)} cor={precisaMais>0?"#ef4444":"#16a34a"} sub="caixa + entradas − saídas"/>
    </div>

    <div style={{background:precisaMais>0?"#fef2f2":"#f0fdf4",border:"1px solid "+(precisaMais>0?"#fecaca":"#bbf7d0"),borderRadius:10,padding:"12px 14px",fontSize:12,lineHeight:1.6,color:precisaMais>0?"#991b1b":"#166534",marginBottom:16}}>
     {precisaMais>0
      ?<span>⚠️ Em {mes0.nome} você tem <b>{fmtBR(somaCaixa)}</b> em caixa e deve receber <b>{fmtBR(mes0.entra)}</b>, mas o previsto para gastar é <b>{fmtBR(mes0.sai)}</b>. Faltam <b>{fmtBR(precisaMais)}</b> — ou entra dinheiro novo, ou vale esticar o prazo de alguma etapa.</span>
      :<span>✅ Em {mes0.nome} o caixa de <b>{fmtBR(somaCaixa)}</b> mais <b>{fmtBR(mes0.entra)}</b> de entradas cobrem os <b>{fmtBR(mes0.sai)}</b> previstos, com folga de <b>{fmtBR(somaCaixa+mes0.entra-mes0.sai)}</b>.</span>}
    </div>

    <div style={{background:"#1e2d5a",borderRadius:12,padding:16,marginBottom:16,textAlign:"center"}}>
     <div style={{fontSize:11,color:"#94a3b8",textTransform:"uppercase",letterSpacing:1}}>Lucro projetado das obras em andamento</div>
     <div style={{fontSize:30,fontWeight:800,color:somaLucro>=0?"#4ade80":"#f87171",marginTop:4}}>{fmtBR(somaLucro)}</div>
     <div style={{fontSize:11,color:"#94a3b8",marginTop:6}}>caixa {fmtBR(somaCaixa)} + a receber {fmtBR(somaReceberTot)} − a pagar {fmtBR(somaPagarTot)}</div>
    </div>

    {/* Fluxo consolidado */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:8}}>
     <div style={{fontSize:13,fontWeight:800,color:"#1e2d5a"}}>Fluxo de caixa consolidado</div>
     <div style={{display:"flex",gap:4}}>
      {[3,6,12].map(h=><button key={h} onClick={()=>setHorizonte(h)} style={{...BS,fontSize:11,padding:"4px 10px",background:horizonte===h?"#f8c400":"#f1f5f9",color:horizonte===h?"#0f172a":"#64748b"}}>{h}m</button>)}
     </div>
    </div>
    <div style={{overflowX:"auto",marginBottom:16}}>
     <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
      <thead><tr style={{background:"#f8fafc"}}>
       {["Mês","Entradas","Saídas","Resultado","Caixa projetado"].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",color:"#64748b",fontWeight:700,whiteSpace:"nowrap"}}>{h}</th>)}
      </tr></thead>
      <tbody>
       {mesesCons.map((m,i)=>(
        <tr key={i} style={{borderBottom:"1px solid #f1f5f9",background:i===0?"#fffbeb":"transparent"}}>
         <td style={{padding:"9px 10px",fontWeight:700,whiteSpace:"nowrap"}}>{m.nome}{i===0?" •":""}</td>
         <td style={{padding:"9px 10px",color:"#3b82f6",fontWeight:700,whiteSpace:"nowrap"}}>{fmtBR(m.entra)}</td>
         <td style={{padding:"9px 10px",color:"#ef4444",fontWeight:700,whiteSpace:"nowrap"}}>{fmtBR(m.sai)}</td>
         <td style={{padding:"9px 10px",color:m.resultado>=0?"#16a34a":"#ef4444",fontWeight:700,whiteSpace:"nowrap"}}>{fmtBR(m.resultado)}</td>
         <td style={{padding:"9px 10px",fontWeight:800,color:m.saldo>=0?"#1e293b":"#ef4444",whiteSpace:"nowrap"}}>{fmtBR(m.saldo)}</td>
        </tr>
       ))}
      </tbody>
     </table>
    </div>
    <div style={{fontSize:10,color:"#94a3b8",marginBottom:16,lineHeight:1.5}}>O caixa projetado parte do saldo informado hoje e vai somando entradas e subtraindo saídas mês a mês. Se ele fica negativo em algum mês, é ali que falta dinheiro.</div>

    {/* Por obra */}
    <div style={{fontSize:13,fontWeight:800,color:"#1e2d5a",marginBottom:8}}>Por obra — {mes0.nome}</div>
    <div style={{display:"grid",gap:8,marginBottom:12}}>
     {linhas.map((l,i)=>{
      const m=l.fin.meses[0];
      const res=l.fin.caixa+m.entra-m.falta;
      return(
       <div key={i} onClick={()=>setDetalhe(detalhe===i?null:i)} style={{background:"#f8fafc",borderRadius:10,padding:"12px 14px",cursor:"pointer"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:8}}>
         <span style={{fontSize:13,fontWeight:800,color:"#1e293b"}}>{detalhe===i?"▾ ":"▸ "}{l.obra.nome}</span>
         <span style={{fontSize:12,fontWeight:800,color:res>=0?"#16a34a":"#ef4444"}}>{fmtBR(res)}</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(105px,1fr))",gap:8,fontSize:11}}>
         <div><div style={{color:"#94a3b8"}}>Em caixa</div><div style={{fontWeight:700,color:"#8b5cf6"}}>{fmtBR(l.fin.caixa)}</div></div>
         <div><div style={{color:"#94a3b8"}}>Entra no mês</div><div style={{fontWeight:700,color:"#3b82f6"}}>{fmtBR(m.entra)}</div></div>
         <div><div style={{color:"#94a3b8"}}>Falta gastar</div><div style={{fontWeight:700,color:"#ef4444"}}>{fmtBR(m.falta)}</div></div>
         <div><div style={{color:"#94a3b8"}}>Lucro projetado</div><div style={{fontWeight:700,color:l.fin.lucro>=0?"#16a34a":"#ef4444"}}>{fmtBR(l.fin.lucro)}</div></div>
        </div>
        {detalhe===i&&(
         <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #e2e8f0",fontSize:11,color:"#475569",lineHeight:1.7}}>
          {m.previsto>0&&<div>Previsto no cronograma para {m.nome}: <b>{fmtBR(m.previsto)}</b>{m.jaPago>0?<span> · já pago no mês: <b style={{color:"#16a34a"}}>{fmtBR(m.jaPago)}</b> · resta <b style={{color:"#ef4444"}}>{fmtBR(m.falta)}</b></span>:null}</div>}
          {m.previsto<=0&&<div style={{color:"#94a3b8"}}>Sem previsão de desembolso no cronograma para este mês.</div>}
          {m.parcelas.length>0&&<div>Parcelas a receber: {m.parcelas.map(p=>p.desc+" "+fmtBR(p.valor)).join(" · ")}</div>}
          {l.fin.cr&&l.fin.cr.matriz&&<div style={{color:"#94a3b8"}}>Medições ajustáveis na aba Cronograma da obra.</div>}
          {m.parcelas.length===0&&<div style={{color:"#94a3b8"}}>Nenhuma parcela com vencimento neste mês.</div>}
          <div>A receber no total: <b>{fmtBR(l.fin.aReceberTot)}</b> · a pagar: <b>{fmtBR(l.fin.custoAPagar)}</b>{l.fin.empSaldo>0?<span> + empréstimo <b>{fmtBR(l.fin.empSaldo)}</b></span>:null}</div>
          <div style={{marginTop:6}}>Próximos meses: {l.fin.meses.slice(1,4).map(x=>x.nome+" saída "+fmtBR(x.falta)).join(" · ")}</div>
         </div>
        )}
       </div>
      );
     })}
    </div>

    {(semVenc>0||semCrono.length>0)&&(
     <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:"10px 14px",fontSize:11,color:"#92400e",lineHeight:1.6}}>
      {semVenc>0&&<div>⚠️ {semVenc} parcela(s) a receber estão sem data de vencimento e não entram no fluxo mensal — preencha o campo "Vencimento" na aba Recebimentos.</div>}
      {semCrono.length>0&&<div>⚠️ Sem cronograma configurado (falta data de início ou atividades): {semCrono.join(", ")}. As saídas dessas obras ficam zeradas aqui.</div>}
      <div style={{marginTop:4}}>Dica: preencha a "data do pagamento" nos custos para o painel abater automaticamente o que já foi pago no mês.</div>
     </div>
    )}
   </div>
   )}
  </div>
 );
}

// ═══════════ ATIVIDADES ADMINISTRATIVAS (quadro pessoal — só admin) ═══════════
// Lista de demandas fora da execução da obra: contratações, compras de estrutura,
// documentação, negociação com o cliente. Ordenadas por data, com as sem data
// ("a definir") no fim — ao informar a data, a demanda se reposiciona sozinha.
const CP_MADALENA=[
 ["Formão 3/4 (Fertak)",2,"Und","Ferramentas"],
 ["Trena fibra de vidro 30 m (Fertak)",1,"Und","Ferramentas"],
 ["Passador de fios profissional 20 m (Cortag)",1,"Und","Elétrica"],
 ["Alicate universal 8\" Hobby (Fertak)",2,"Und","Elétrica"],
 ["Alicate diagonal 6\" polido (Fertak)",1,"Und","Elétrica"],
 ["Alicate bico meia-cana 6\" polido (Fertak)",1,"Und","Elétrica"],
 ["Alicate desencapador de fios 2x1 (Fertak)",1,"Und","Elétrica"],
 ["Alicate crimpar RJ45 1034 (Fertak)",1,"Und","Elétrica"],
 ["Jogo de chaves fenda/phillips 3 peças (Fertak)",2,"Jogo","Ferramentas"],
 ["Chave teste digital 12V/250V (Fertak)",2,"Und","Elétrica"],
 ["Alicate amperímetro digital 100684 (Worker)",1,"Und","Elétrica"],
 ["Detector de tensões 127/220V 41902/101 (Tramontina)",1,"Und","Elétrica"],
 ["Escada extensível dupla 2x8 16 degraus 5204 (Mor)",1,"Und","Ferramentas"],
 ["Capacete de construção c/ carneira azul 62618 (Worker)",8,"Und","EPI"],
 ["Óculos de proteção incolor WK1-I (Worker)",8,"Und","EPI"],
 ["Protetor auditivo plug silicone 133345 (Worker)",8,"Und","EPI"],
 ["Máscara descartável PFF2 s/ válvula 744174 (Kala)",10,"Und","EPI"],
 ["Luva raspa tam. G 9\" tipo petroleira (Worker)",8,"Par","EPI"],
 ["Luva nitrílica flocada 9\" G 532118 (Worker)",6,"Par","EPI"],
 ["Luva malha branca 3 fios pigmentada S 7803 (Worker)",8,"Par","EPI"],
 ["Cinto de segurança paraquedista 4002 (Worker)",3,"Und","EPI"],
 ["Talabarte elástico 226210 (Worker)",2,"Und","EPI"],
 ["Picareta 4 lbs c/ cabo 90 cm 77303543 (Tramontina)",2,"Und","Demolição"],
 ["Enxada 2 lb c/ cabo 130 cm 77206/704 (Tramontina)",3,"Und","Alvenaria"],
 ["Pá de bico c/ cabo 71 cm 77459/434 (Tramontina)",4,"Und","Alvenaria"],
 ["Carro de mão 55 L galvanizado (Botafogo)",2,"Und","Alvenaria"],
 ["Caixa para massa 65x47x16 cm 30 L (Astra)",4,"Und","Alvenaria"],
 ["Colher de pedreiro nº 7 77358/075 (Tramontina)",4,"Und","Alvenaria"],
 ["Desempenadeira de aço lisa 143 (Atlas)",4,"Und","Alvenaria"],
 ["Desempenadeira de aço dentada 145 (Atlas)",2,"Und","Alvenaria"],
 ["Régua de pedreiro 2 m alumínio reforçado (Botafogo)",2,"Und","Alvenaria"],
 ["Régua de pedreiro 3 m alumínio reforçado (Botafogo)",1,"Und","Alvenaria"],
 ["Nível 12\" 30 cm 3 bolhas (Fertak)",3,"Und","Alvenaria"],
 ["Prumo de parede 500 g (Cortag)",2,"Und","Alvenaria"],
 ["Prumo de centro cônico 400 g (Fertak)",2,"Und","Alvenaria"],
 ["Linha para pedreiro lisa 100 m (Worker)",3,"Und","Alvenaria"],
 ["Esquadro de aço 25 cm cabo plástico 43170010 (Tramontina)",2,"Und","Alvenaria"],
 ["Torquês azulejista 7.1/2 corte e furo (Cortag)",1,"Und","Revestimento"],
 ["Serra mármore 127V 1300W 4.3/8 c/ 2 discos (Makita)",1,"Und","Revestimento"],
 ["Disco diamantado porcelanato 4.3/8 110x20 mm (Cortag)",4,"Und","Revestimento"],
 ["Parafusadeira furadeira 12V BPF 12K3 (Wap)",1,"Und","Ferramentas"],
 ["Furadeira de impacto 550W GSB 550 127V (Bosch)",1,"Und","Ferramentas"],
 ["Carro de mão metálico azul 50 L 77704432 (Tramontina)",2,"Und","Alvenaria"],
].map(([item,qtd,und,frente])=>({item,qtd,und,frente,dtC:"18/08/2026",dtCh:"21/08/2026",status:"no_prazo",tipo:"Ferramentas/EPIs",obs:"Jurunense — orçamento 436021488"}));

const IT_MADALENA=[
 ["RECEBER UNIFORMES","21/08/2026",1779,"HUGO"],
 ["FECHAR ENCARREGADO","18/08/2026",0,"HUGO"],
 ["FECHAR PEDREIROS","18/08/2026",0,"HUGO"],
 ["FECHAR AJUDANTES","18/08/2026",0,"HUGO"],
 ["FECHAR ELETRICISTA","18/08/2026",0,"HUGO"],
 ["FECHAR ESTAGIÁRIA","18/08/2026",0,"HUGO"],
 ["COMPRAR FERRAMENTAS","19/08/2026",13000,"HUGO"],
 ["ORGANIZAR BENEFÍCIOS PELO SINDICATO","20/08/2026",0,"HUGO"],
 ["MONTAR KITS DE FERRAMENTAS","21/08/2026",0,"HUGO"],
 ["FECHAR CONTRATO COM EMPRESA TERCEIRA","21/08/2026",0,"HUGO"],
 ["PEGAR DADOS PARA EMISSÃO DE NFS","21/08/2026",0,"HUGO"],
 ["VERIFICAR PREVISÕES DE MEDIÇÕES E RECEBIMENTOS","21/08/2026",0,"HUGO"],
 ["DEFINIR SEQUÊNCIA DE ATIVIDADES","21/08/2026",0,"HUGO"],
 ["DEFINIR DESOCUPAÇÃO DA ESCOLA","21/08/2026",0,"HUGO"],
 ["VERIFICAR LICENÇAS E OS DA REFORMA","21/08/2026",0,"HUGO"],
 ["VERIFICAR ATIVIDADES QUE IRÃO SAIR/AJUSTAR","21/08/2026",0,"HUGO"],
 ["ENCONTRAR LOCAL PARA ARMAZENAR FERRAMENTAS E MATERIAIS","24/08/2026",0,"HUGO/MONIQUE"],
 ["ORGANIZAR PRIMEIRA COMPRA DE MATERIAIS","25/08/2026",0,"HUGO"],
 ["REUNIÃO GERAL DE INÍCIO DA OBRA","25/08/2026",0,"HUGO"],
 ["MANDAR FUNCIONÁRIOS PARA O ASO","",240,"HUGO"],
 ["ENVIAR DOCUMENTAÇÃO PARA REGISTRO NA CONTABILIDADE","",0,"HUGO"],
 ["RECOLHER ASSINATURAS (CONTRATOS, FICHA DE EPIS, RESPONSABILIDADE DE FERRAMENTAS, OPÇÃO VR)","",0,"HUGO"],
 ["ATUALIZAR PCMSO/PGR","",800,"HUGO"],
 ["EMITIR CARTÕES DE BENEFÍCIO","",0,"HUGO"],
].map(([demanda,prazo,custo,resp],i)=>({id:"t"+(i+1),demanda,prazo,custo,resp,status:"pendente",obs:"",feitoEm:""}));

const ST_TAREFA={
 pendente:{label:"A fazer",cor:"#64748b",bg:"#f1f5f9"},
 andamento:{label:"Em andamento",cor:"#b45309",bg:"#fef3c7"},
 concluida:{label:"Concluída",cor:"#166534",bg:"#dcfce7"},
};
function diasAte(prazo){
 const d=parseBRDate(prazo);
 if(!d)return null;
 const h=new Date();const hoje=new Date(h.getFullYear(),h.getMonth(),h.getDate());
 return Math.round((d.getTime()-hoje.getTime())/86400000);
}
function textoPrazo(prazo){
 const n=diasAte(prazo);
 if(n===null)return"A definir";
 if(n<0)return"Atrasada "+Math.abs(n)+"d";
 if(n===0)return"Hoje";
 if(n===1)return"Amanhã";
 return"Em "+n+" dias";
}

function Tarefas({T,sv}){
 const lista=T||[];
 const [modal,setModal]=useState(false);
 const [edit,setEdit]=useState(null);
 const [form,setForm]=useState({demanda:"",prazo:"",custo:0,resp:"HUGO",obs:""});
 const [verFeitas,setVerFeitas]=useState(false);
 const [filtro,setFiltro]=useState("todas");

 const ordena=arr=>arr.slice().sort((a,b)=>{
  const da=parseBRDate(a.prazo),db=parseBRDate(b.prazo);
  if(da&&db)return da.getTime()-db.getTime();
  if(da)return -1;            // com data primeiro
  if(db)return 1;             // "a definir" vai para o fim
  return 0;
 });
 const abertas=ordena(lista.filter(t=>t.status!=="concluida"));
 const feitas=lista.filter(t=>t.status==="concluida").slice().reverse();
 const vis=filtro==="todas"?abertas:filtro==="atrasadas"?abertas.filter(t=>{const n=diasAte(t.prazo);return n!==null&&n<0;})
  :filtro==="semana"?abertas.filter(t=>{const n=diasAte(t.prazo);return n!==null&&n<=7;})
  :abertas.filter(t=>!parseBRDate(t.prazo));

 const atrasadas=abertas.filter(t=>{const n=diasAte(t.prazo);return n!==null&&n<0;}).length;
 const semData=abertas.filter(t=>!parseBRDate(t.prazo)).length;
 const custoAberto=abertas.reduce((s,t)=>s+(Number(t.custo)||0),0);
 const custoTotal=lista.reduce((s,t)=>s+(Number(t.custo)||0),0);

 const salvar=()=>{
  if(!form.demanda.trim()){alert("Descreva a demanda.");return;}
  if(form.prazo&&!parseBRDate(form.prazo)){alert("Data inválida. Use dd/mm/aaaa ou deixe em branco para 'a definir'.");return;}
  const base={demanda:form.demanda,prazo:form.prazo||"",custo:Number(form.custo)||0,resp:form.resp||"",obs:form.obs||""};
  if(edit)sv(lista.map(t=>t.id===edit.id?{...t,...base}:t));
  else sv([...lista,{...base,id:"t"+Date.now(),status:"pendente",feitoEm:""}]);
  setModal(false);setEdit(null);
 };
 const mudarStatus=(t,st)=>sv(lista.map(x=>x.id===t.id?{...x,status:st,feitoEm:st==="concluida"?new Date().toLocaleDateString("pt-BR"):""}:x));
 const excluir=t=>{if(confirm('Excluir a demanda "'+t.demanda+'"?'))sv(lista.filter(x=>x.id!==t.id));};
 const abrirNova=()=>{setEdit(null);setForm({demanda:"",prazo:"",custo:0,resp:"HUGO",obs:""});setModal(true);};
 const abrirEdit=t=>{setEdit(t);setForm({demanda:t.demanda,prazo:t.prazo||"",custo:t.custo||0,resp:t.resp||"",obs:t.obs||""});setModal(true);};

 const Linha=(t,feita)=>{
  const n=diasAte(t.prazo);
  const atrasada=n!==null&&n<0&&!feita;
  const hoje=n!==null&&n>=0&&n<=1&&!feita;
  const st=ST_TAREFA[t.status]||ST_TAREFA.pendente;
  return(
   <div key={t.id} style={{background:"#fff",border:"1px solid "+(atrasada?"#fecaca":"#e2e8f0"),borderLeft:"4px solid "+(feita?"#16a34a":atrasada?"#ef4444":hoje?"#f59e0b":"#cbd5e1"),borderRadius:10,padding:"12px 14px",marginBottom:8,opacity:feita?0.7:1}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,flexWrap:"wrap"}}>
     <div style={{flex:1,minWidth:180}}>
      <div style={{fontSize:13,fontWeight:700,color:"#1e293b",lineHeight:1.35,textDecoration:feita?"line-through":"none"}}>{t.demanda}</div>
      <div style={{fontSize:11,color:"#94a3b8",marginTop:4,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
       <span style={{color:atrasada?"#b91c1c":hoje?"#b45309":"#64748b",fontWeight:atrasada||hoje?700:400}}>
        📅 {t.prazo||"A definir"}{!feita&&t.prazo?" · "+textoPrazo(t.prazo):""}
       </span>
       {Number(t.custo)>0&&<span style={{color:"#ef4444",fontWeight:700}}>{fmtBR(t.custo)}</span>}
       {t.resp&&<span>👤 {t.resp}</span>}
       {feita&&t.feitoEm&&<span style={{color:"#16a34a"}}>✓ {t.feitoEm}</span>}
      </div>
      {t.obs&&<div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>{t.obs}</div>}
     </div>
     <span style={{fontSize:10,fontWeight:800,color:st.cor,background:st.bg,padding:"3px 9px",borderRadius:20,whiteSpace:"nowrap"}}>{st.label}</span>
    </div>
    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10,paddingTop:9,borderTop:"1px solid #f1f5f9"}}>
     {!feita&&t.status!=="andamento"&&<button onClick={()=>mudarStatus(t,"andamento")} style={{...BS,fontSize:11,padding:"4px 10px",background:"#fef3c7",color:"#b45309"}}>▶ Iniciar</button>}
     {!feita&&<button onClick={()=>mudarStatus(t,"concluida")} style={{...BS,fontSize:11,padding:"4px 10px",background:"#dcfce7",color:"#166534"}}>✓ Concluir</button>}
     {feita&&<button onClick={()=>mudarStatus(t,"pendente")} style={{...BS,fontSize:11,padding:"4px 10px"}}>↩ Reabrir</button>}
     <button onClick={()=>abrirEdit(t)} style={{...BS,fontSize:11,padding:"4px 10px"}}>✏️ Editar</button>
     <button onClick={()=>excluir(t)} style={{...BS,fontSize:11,padding:"4px 10px",background:"#fee2e2",color:"#ef4444"}}>Excluir</button>
    </div>
   </div>
  );
 };

 return(
  <div>
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,flexWrap:"wrap",marginBottom:14}}>
    <div>
     <h2 style={{fontSize:20,fontWeight:800,color:"#f59e0b",margin:0}}>Atividades</h2>
     <p style={{fontSize:12,color:"#94a3b8",margin:"4px 0 0"}}>Demandas administrativas da obra · visível somente para você</p>
    </div>
    <button onClick={abrirNova} style={BP}>+ Demanda</button>
   </div>

   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:16}}>
    <KCard label="Em aberto" value={String(abertas.length)} color="#f59e0b" sub={lista.length+" no total"}/>
    <KCard label="Atrasadas" value={String(atrasadas)} color={atrasadas>0?"#ef4444":"#16a34a"} sub={atrasadas>0?"precisam de ação hoje":"nada vencido"}/>
    <KCard label="Concluídas" value={String(feitas.length)} color="#16a34a" sub={lista.length>0?pct(feitas.length/lista.length*100)+" do total":"—"}/>
    <KCard label="Custo em aberto" value={fmtBR(custoAberto)} color="#8b5cf6" sub={"de "+fmtBR(custoTotal)+" previstos"}/>
   </div>

   <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
    {[["todas","Todas ("+abertas.length+")"],["atrasadas","Atrasadas ("+atrasadas+")"],["semana","Próximos 7 dias"],["semdata","A definir ("+semData+")"]].map(([k,l])=>(
     <button key={k} onClick={()=>setFiltro(k)} style={{background:filtro===k?"#f8c400":"#fff",color:filtro===k?"#0f172a":"#64748b",border:"1px solid #e2e8f0",borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>{l}</button>
    ))}
   </div>

   {vis.length===0&&(
    <div style={{textAlign:"center",padding:"40px 20px",color:"#94a3b8"}}>
     <div style={{fontSize:36,marginBottom:10}}>{lista.length===0?"📋":"✅"}</div>
     <div style={{fontSize:14,fontWeight:700,color:"#64748b",marginBottom:6}}>{lista.length===0?"Nenhuma demanda cadastrada":"Nada aqui neste filtro"}</div>
     <div style={{fontSize:12,maxWidth:320,margin:"0 auto",lineHeight:1.5}}>{lista.length===0?"Use o botão + Demanda para lançar o que precisa ser feito: contratações, compras, documentação, reuniões.":"Troque o filtro para ver as demais."}</div>
    </div>
   )}
   {vis.map(t=>Linha(t,false))}

   {feitas.length>0&&(
    <div style={{marginTop:20}}>
     <button onClick={()=>setVerFeitas(v=>!v)} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:"9px 14px",cursor:"pointer",fontSize:13,fontWeight:700,color:"#475569",marginBottom:10}}>
      {verFeitas?"▾":"▸"} Concluídas ({feitas.length})
     </button>
     {verFeitas&&feitas.map(t=>Linha(t,true))}
    </div>
   )}

   {modal&&(
    <Modal onClose={()=>{setModal(false);setEdit(null);}} title={edit?"Editar demanda":"Nova demanda"}>
     <div style={{display:"grid",gap:10}}>
      <label style={{fontSize:12,color:"#64748b"}}>Demanda *
       <input value={form.demanda} onChange={e=>setForm(f=>({...f,demanda:e.target.value}))} placeholder="Ex: Fechar contrato com empresa terceira" style={IS} autoFocus/>
      </label>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
       <label style={{fontSize:12,color:"#64748b"}}>Prazo
        <input value={form.prazo} onChange={e=>setForm(f=>({...f,prazo:e.target.value}))} placeholder="dd/mm/aaaa" style={IS}/>
       </label>
       <label style={{fontSize:12,color:"#64748b"}}>Custo (R$)
        <input type="number" value={form.custo} onChange={e=>setForm(f=>({...f,custo:e.target.value}))} style={IS}/>
       </label>
      </div>
      <div style={{fontSize:11,color:"#94a3b8",marginTop:-4}}>Deixe o prazo em branco para "a definir" — ela fica no fim da lista e sobe sozinha quando você informar a data.</div>
      <label style={{fontSize:12,color:"#64748b"}}>Responsável
       <input value={form.resp} onChange={e=>setForm(f=>({...f,resp:e.target.value}))} style={IS}/>
      </label>
      <label style={{fontSize:12,color:"#64748b"}}>Observação
       <input value={form.obs} onChange={e=>setForm(f=>({...f,obs:e.target.value}))} style={IS}/>
      </label>
     </div>
     <div style={{display:"flex",gap:10,marginTop:20}}>
      <button onClick={salvar} style={{...BP,flex:1}}>Salvar</button>
      <button onClick={()=>{setModal(false);setEdit(null);}} style={{...BS,flex:1}}>Cancelar</button>
     </div>
    </Modal>
   )}
  </div>
 );
}

// ═══════════════════ COLABORADORES DA OBRA ═══════════════════
// Lista de contatos da equipe em campo: nome, função e telefone.
// O telefone vira link de ligação e de WhatsApp direto no celular.
function soDigitos(t){return String(t||"").replace(/\D/g,"");}
function telFormatado(t){
 const d=soDigitos(t);
 if(d.length===11)return"("+d.slice(0,2)+") "+d.slice(2,7)+"-"+d.slice(7);
 if(d.length===10)return"("+d.slice(0,2)+") "+d.slice(2,6)+"-"+d.slice(6);
 return t||"";
}
function linkZap(t){
 const d=soDigitos(t);
 if(d.length<10)return null;
 return"https://wa.me/"+(d.length<=11?"55"+d:d);
}
const FUNCOES=["Engenheiro(a)","Mestre de obras","Encarregado(a)","Pedreiro","Ajudante","Eletricista","Pintor","Estagiário(a)","Empreiteiro","Administrativo","Outro"];

function Colaboradores({E,sv,podeEditar}){
 const lista=E||[];
 const [modal,setModal]=useState(false);
 const [edit,setEdit]=useState(null);
 const [form,setForm]=useState({nome:"",funcao:"",tel:"",obs:""});
 const [busca,setBusca]=useState("");

 const ordenada=lista.slice().sort((a,b)=>{
  const fa=FUNCOES.indexOf(a.funcao),fb=FUNCOES.indexOf(b.funcao);
  const ia=fa<0?99:fa,ib=fb<0?99:fb;
  if(ia!==ib)return ia-ib;
  return String(a.nome||"").localeCompare(String(b.nome||""));
 });
 const vis=busca.trim()
  ? ordenada.filter(c=>((c.nome||"")+" "+(c.funcao||"")+" "+(c.tel||"")).toLowerCase().indexOf(busca.toLowerCase())>=0)
  : ordenada;

 const salvar=()=>{
  if(!form.nome.trim()){alert("Informe o nome do colaborador.");return;}
  const base={nome:form.nome.trim(),funcao:form.funcao||"Outro",tel:form.tel||"",obs:form.obs||""};
  if(edit)sv(lista.map(c=>c.id===edit.id?{...c,...base}:c));
  else sv([...lista,{...base,id:"c"+Date.now()}]);
  setModal(false);setEdit(null);
 };
 const excluir=c=>{if(confirm('Remover "'+c.nome+'" da equipe desta obra?'))sv(lista.filter(x=>x.id!==c.id));};
 const abrirNovo=()=>{setEdit(null);setForm({nome:"",funcao:"",tel:"",obs:""});setModal(true);};
 const abrirEdit=c=>{setEdit(c);setForm({nome:c.nome||"",funcao:c.funcao||"",tel:c.tel||"",obs:c.obs||""});setModal(true);};

 // resumo por função
 const porFuncao=[];
 ordenada.forEach(c=>{
  const f=c.funcao||"Outro";
  let o=null;for(let i=0;i<porFuncao.length;i++)if(porFuncao[i].f===f)o=porFuncao[i];
  if(o)o.n++;else porFuncao.push({f,n:1});
 });

 return(
  <div>
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,flexWrap:"wrap",marginBottom:14}}>
    <div>
     <h2 style={{fontSize:20,fontWeight:800,color:"#f59e0b",margin:0}}>Colaboradores</h2>
     <p style={{fontSize:12,color:"#94a3b8",margin:"4px 0 0"}}>Equipe desta obra · {lista.length} pessoa(s){porFuncao.length>0?" · "+porFuncao.map(x=>x.n+" "+x.f.toLowerCase()).join(", "):""}</p>
    </div>
    {podeEditar&&<button onClick={abrirNovo} style={BP}>+ Colaborador</button>}
   </div>

   {lista.length>4&&(
    <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar por nome, função ou telefone" style={{...IS,marginBottom:14}}/>
   )}

   {lista.length===0&&(
    <div style={{textAlign:"center",padding:"50px 20px",color:"#94a3b8"}}>
     <div style={{fontSize:38,marginBottom:10}}>👷</div>
     <div style={{fontSize:14,fontWeight:700,color:"#64748b",marginBottom:6}}>Nenhum colaborador cadastrado</div>
     <div style={{fontSize:12,maxWidth:330,margin:"0 auto",lineHeight:1.5}}>{podeEditar?"Use + Colaborador para montar a lista de contatos da equipe em campo.":"A lista ainda não foi montada pelo administrador."}</div>
    </div>
   )}

   <div style={{display:"grid",gap:8}}>
    {vis.map(c=>{
     const zap=linkZap(c.tel);
     return(
      <div key={c.id} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:"12px 14px",boxShadow:"0 1px 3px #0001"}}>
       <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:170}}>
         <div style={{fontSize:14,fontWeight:800,color:"#1e293b"}}>{c.nome}</div>
         <div style={{fontSize:12,color:"#f59e0b",fontWeight:700,marginTop:2}}>{c.funcao||"—"}</div>
         {c.tel&&<div style={{fontSize:13,color:"#475569",marginTop:5}}>📞 {telFormatado(c.tel)}</div>}
         {c.obs&&<div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>{c.obs}</div>}
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"flex-end"}}>
         {c.tel&&<a href={"tel:"+soDigitos(c.tel)} style={{background:"#e0e7ff",color:"#4338ca",padding:"5px 10px",borderRadius:6,fontSize:11,fontWeight:700,textDecoration:"none"}}>Ligar</a>}
         {zap&&<a href={zap} target="_blank" rel="noreferrer" style={{background:"#dcfce7",color:"#166534",padding:"5px 10px",borderRadius:6,fontSize:11,fontWeight:700,textDecoration:"none"}}>WhatsApp</a>}
         {podeEditar&&<button onClick={()=>abrirEdit(c)} style={{...BS,fontSize:11,padding:"4px 10px"}}>✏️</button>}
         {podeEditar&&<button onClick={()=>excluir(c)} style={{...BS,fontSize:11,padding:"4px 9px",background:"#fee2e2",color:"#ef4444",fontWeight:700}}>✕</button>}
        </div>
       </div>
      </div>
     );
    })}
   </div>

   {modal&&(
    <Modal onClose={()=>{setModal(false);setEdit(null);}} title={edit?"Editar colaborador":"Novo colaborador"}>
     <div style={{display:"grid",gap:10}}>
      <label style={{fontSize:12,color:"#64748b"}}>Nome *
       <input value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} style={IS} autoFocus/>
      </label>
      <label style={{fontSize:12,color:"#64748b"}}>Função
       <select value={form.funcao} onChange={e=>setForm(f=>({...f,funcao:e.target.value}))} style={IS}>
        <option value="">Selecione…</option>
        {FUNCOES.map(f=><option key={f} value={f}>{f}</option>)}
       </select>
      </label>
      <label style={{fontSize:12,color:"#64748b"}}>Telefone
       <input value={form.tel} onChange={e=>setForm(f=>({...f,tel:e.target.value}))} placeholder="(91) 98101-8941" style={IS}/>
      </label>
      <label style={{fontSize:12,color:"#64748b"}}>Observação
       <input value={form.obs} onChange={e=>setForm(f=>({...f,obs:e.target.value}))} placeholder="Ex: chave do container, PIX, turno" style={IS}/>
      </label>
     </div>
     <div style={{display:"flex",gap:10,marginTop:20}}>
      <button onClick={salvar} style={{...BP,flex:1}}>Salvar</button>
      <button onClick={()=>{setModal(false);setEdit(null);}} style={{...BS,flex:1}}>Cancelar</button>
     </div>
    </Modal>
   )}
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
function CliAvanço({A,obra}){
 const pavs=etapasDe(A);
 const getPct=pav=>{const its=A.filter(a=>a.pav===pav);const tD=its.reduce((s,a)=>s+(a.prazo||0),0);const cD=its.reduce((s,a)=>s+(a.total>0?(a.acum/a.total)*a.prazo:0),0);return tD>0?cD/tD*100:0;};
 const totalPct=calcConclusaoGeral(A);
 return(
 <div>
 <h2 style={{fontSize:20,fontWeight:800,color:"#f59e0b",marginBottom:4}}>Avanço da Obra</h2>
 <p style={{fontSize:13,color:"#64748b",marginBottom:20}}>{(obra&&obra.nome)||"Obra"}{obra&&obra.local?" · "+obra.local:""}</p>
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
 <KCard label="Total do Contrato" value={fmtBR(obra?obra.contrato:0)} color="#f59e0b"/>
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
