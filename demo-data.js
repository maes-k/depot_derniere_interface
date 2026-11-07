(() => {
 const key='ddb-preview-catalog';
 let state; try{state=JSON.parse(localStorage.getItem(key));}catch{}
 if(!state) state={categories:defaultCategories.map((name,i)=>({id:String(i+1),name,description:'',isActive:true})),products:initialProducts.map((p,i)=>({...p,id:String(i+1),categoryId:String(defaultCategories.indexOf(p.category)+1),imageUrl:p.image||'',description:'',price:null,stock:null,isActive:true}))};
 const save=()=>localStorage.setItem(key,JSON.stringify(state)); save();
 window.demoCatalogApi=async(url,options={})=>{
  if(url.endsWith('/me')||url.endsWith('/login'))return {full_name:'Mode démonstration'};
  if(url.endsWith('/logout'))return {ok:true};
  const parts=url.split('/');const kind=parts[3];const id=parts[4];const method=options.method||'GET';
  if(!['products','categories'].includes(kind))throw new Error('Action inconnue.');
  if(method==='GET')return structuredClone(state[kind]).map(row=>kind==='products'?{...row,category:state.categories.find(c=>String(c.id)===String(row.categoryId))?.name||'',categoryActive:state.categories.find(c=>String(c.id)===String(row.categoryId))?.isActive}:row);
  const previous=structuredClone(state);
  const body=options.body?JSON.parse(options.body):{};
  if(method==='POST'||method==='PUT'){
   if(!String(body.name||'').trim())throw new Error('Le nom est requis.');
   if(state[kind].some(row=>row.id!==id&&row.name===body.name&&(kind==='categories'||String(row.categoryId)===String(body.categoryId))))throw new Error('Ce nom existe déjà.');
   if(method==='POST'){body.id=String(Date.now());body.isActive=true;state[kind].push(body);}
   else {const index=state[kind].findIndex(row=>String(row.id)===id);if(index<0)throw new Error('Élément introuvable.');state[kind][index]={...state[kind][index],...body};}
  }else if(method==='DELETE'){const row=state[kind].find(row=>String(row.id)===id);if(row)row.isActive=false;}
  try{save();}catch{state=previous;throw new Error('Le stockage de cet aperçu est plein. Choisis une image plus légère ou retire une photo de démonstration.');}return {ok:true};
 };
 window.dispatchEvent(new Event('catalog:refresh'));
})();
