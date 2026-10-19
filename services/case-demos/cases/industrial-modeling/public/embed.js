// Private demos share the website's origin. Register Escape before reporting ready.
if(new URLSearchParams(location.search).get('embed')==='1')document.getElementById('brand-home').href='./?embed=1';
const embedded=parent!==window;
if(embedded)document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!document.querySelector('dialog[open]')){
    event.preventDefault();parent.postMessage({type:'case-demo-close'},location.origin);
  }
},true);
export function demoReady(){if(embedded)parent.postMessage({type:'case-demo-ready'},location.origin);}
