(() => {
 const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const stock=value=>value==null||value===''?null:Math.max(0,Number(value));
 function filterProducts(products,options){
  const query=normalize(options.query).trim();
  const hasMin=options.min!==''&&options.min!=null,hasMax=options.max!==''&&options.max!=null;
  const result=products.filter(p=>
   (Array.isArray(options.categoryIds)?options.categoryIds.includes(String(p.categoryId)):options.categoryId!==undefined?(options.categoryId==='all'||String(p.categoryId)===String(options.categoryId)):(options.category==='Tous'||p.category===options.category))&&
   (!query||normalize([p.name,p.category,p.description,p.unit].join(' ')).includes(query))&&
   (!options.inStock||stock(p.stock)>0)&&
   (!options.favouritesOnly||options.favourites.includes(String(p.id)))&&
   (!(hasMin||hasMax)||(p.price!=null&&Number.isFinite(Number(p.price))))&&
   (!hasMin||Number(p.price)>=Number(options.min))&&(!hasMax||Number(p.price)<=Number(options.max)));
  if(options.sort==='name-asc')result.sort((a,b)=>a.name.localeCompare(b.name,'fr'));
  if(options.sort==='price-asc'||options.sort==='price-desc')result.sort((a,b)=>{
   if(a.price==null)return b.price==null?0:1;if(b.price==null)return -1;
   return options.sort==='price-asc'?Number(a.price)-Number(b.price):Number(b.price)-Number(a.price);
  });return result;
 }
 function cleanCart(cart,products){return cart.flatMap(item=>{
  const product=products.find(p=>String(p.id)===String(item.id));if(!product)return [];
  const limit=stock(product.stock);if(limit===0)return [];
  const qty=Math.min(Math.max(1,Math.floor(Number(item.qty)||1)),limit??9999);
  return [{id:String(product.id),qty}];
 });}
 window.ShopTools={normalize,stock,filterProducts,cleanCart};
})();
