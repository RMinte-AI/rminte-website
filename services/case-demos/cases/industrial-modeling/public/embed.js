// Private demos share the website's origin. Register Escape before reporting ready.
if(new URLSearchParams(location.search).get('embed')==='1'){
  const home=document.getElementById('brand-home');home.href='./?embed=1';
  home.addEventListener('click',event=>{event.preventDefault();location.replace(home.href);});
}
const embedded=parent!==window;
if(embedded)document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!document.querySelector('dialog[open]')){
    event.preventDefault();parent.postMessage({type:'case-demo-close'},location.origin);
  }
},true);
export function demoReady(){if(embedded)parent.postMessage({type:'case-demo-ready'},location.origin);}
