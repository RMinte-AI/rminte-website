/* Abstract system architecture; coordinates express relationships, not PCB routing. */
window.RMArchitecture = (() => {
  const layouts = {
    desktop: {
      width:700,height:500,
      nodes:[
        ['cuda',130,155,144,140,'CUDA','compute'],
        ['mcu',535,80,96,80,'ESP32','management'],
        ['ethernet',385,70,68,58,'W5500','interface'],
        ['switch',305,280,116,100,'RTL8367RB','switch'],
        ['nic-cuda',90,350,58,54,'MAC/PHY','interface'],
        ['nic-x86',510,185,58,54,'MAC/PHY','interface'],
        ['x86',520,345,144,140,'x86','compute'],
        ['storage-cuda',260,142,72,34,'','storage'],
        ['storage-x86',300,420,72,34,'','storage'],
        ['config',645,135,70,32,'','config']
      ],
      // Every first/last segment is perpendicular to its package edge.
      routes:[
        ['bus','management-spi',[[487,80],[456,80],[446,70],[419,70]]],
        ['bus','management-config',[[583,80],[611,80],[645,114],[645,119]]],
        ['network','management-network',[[385,99],[385,137],[315,207],[315,230]]],
        ['bus','cuda-pcie',[[130,225],[130,263],[90,303],[90,323]]],
        ['network','cuda-network',[[119,350],[176,350],[232,294],[247,294]]],
        ['bus','x86-pcie',[[510,212],[510,239],[496,253],[496,275]]],
        ['network','x86-network',[[481,185],[430,185],[397,218],[397,246],[373,270],[363,270]]],
        ['bus','cuda-storage',[[202,155],[209,155],[222,142],[224,142]]],
        ['bus','x86-storage',[[448,380],[412,380],[372,420],[336,420]]]
      ],
      captions:[[130,69,'inference','title'],[535,24,'TianshanOS','brand'],[305,355,'network','small'],[520,441,'application','title'],[260,182,'storage','small'],[300,462,'storage','small'],[645,176,'config','small'],[159,257,'PCIe','bus'],[544,247,'PCIe','bus'],[455,54,'SPI','bus']]
    },
    mobile: {
      width:430,height:590,
      nodes:[
        ['mcu',275,90,90,80,'ESP32','management'],
        ['ethernet',120,100,58,48,'W5500','interface'],
        ['cuda',95,220,118,110,'CUDA','compute'],
        ['switch',250,340,100,88,'RTL8367RB','switch'],
        ['nic-cuda',80,375,54,48,'MAC/PHY','interface'],
        ['nic-x86',325,210,54,48,'MAC/PHY','interface'],
        ['x86',270,475,118,112,'x86','compute'],
        ['storage-cuda',220,225,72,32,'','storage'],
        ['storage-x86',125,490,70,30,'','storage'],
        ['config',365,135,60,28,'','config']
      ],
      routes:[
        ['bus','management-spi',[[230,90],[184,90],[174,100],[149,100]]],
        ['bus','management-config',[[320,90],[341,90],[365,114],[365,121]]],
        ['network','management-network',[[120,124],[120,133],[171,133],[230,192],[277,192],[277,267],[250,294],[250,296]]],
        ['bus','cuda-pcie',[[95,275],[95,320],[80,335],[80,351]]],
        ['network','cuda-network',[[107,375],[145,375],[185,335],[200,335]]],
        ['bus','x86-pcie',[[352,210],[366,210],[378,222],[378,399],[348,429],[329,429]]],
        ['network','x86-network',[[298,210],[289,210],[289,283],[280,292],[280,296]]],
        ['bus','cuda-storage',[[154,220],[172,220],[177,225],[184,225]]],
        ['bus','x86-storage',[[211,461],[191,461],[162,490],[160,490]]]
      ],
      captions:[[275,37,'TianshanOS','brand'],[95,153,'inference','title'],[250,402,'network','small'],[270,553,'application','title'],[220,265,'storage','small'],[125,529,'storage','small'],[365,176,'config','small'],[118,312,'PCIe','bus'],[399,306,'PCIe','bus'],[191,72,'SPI','bus']]
    }
  };

  // Offset each segment along its normal. The two endpoint normals run along
  // package edges, so a parallel bundle cannot translate into a chip body.
  function offsetPath(points, offset) {
    const normals = points.slice(1).map((point,i) => {
      const dx=point[0]-points[i][0],dy=point[1]-points[i][1],length=Math.hypot(dx,dy);
      return [-dy/length,dx/length];
    });
    return points.map((point,i) => {
      let nx,ny;
      if(i===0) [nx,ny]=normals[0];
      else if(i===points.length-1) [nx,ny]=normals[i-1];
      else {
        const a=normals[i-1],b=normals[i],scale=1+a[0]*b[0]+a[1]*b[1];
        nx=(a[0]+b[0])/scale;ny=(a[1]+b[1])/scale;
      }
      return `${i?'L':'M'}${(point[0]+offset*nx).toFixed(2)} ${(point[1]+offset*ny).toFixed(2)}`;
    }).join(' ');
  }

  function render(lang) {
    const t = (zh,en) => RM_I18N.text({zh,en},lang);
    const escape = value => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    const words={inference:t('推理计算机','Inference computer'),application:t('应用计算机','Application computer'),storage:t('独立存储','Dedicated storage'),network:t('板载以太网交换机','Onboard Ethernet switch'),config:t('配置存储','Config storage')};
    function scene(size) {
      const layout=layouts[size];
      const nodes=layout.nodes.map(([key,x,y,w,h,name,type]) => {
        const owner=key.endsWith('-cuda')?words.inference:key.endsWith('-x86')?words.application:'';
        const partLabel=name||words[type==='config'?'config':'storage'];
        const details=escape(t('查看部件：{part}', 'Inspect component: {part}').replace('{part}', `${partLabel}${owner ? ` · ${owner}` : ''}`));
        const pattern=({mcu:'controller',ethernet:'ethernet',switch:'switch','nic-cuda':'phy','nic-x86':'phy'}[key]||'');
        const blocks=pattern ? {controller:3,ethernet:4,switch:5,phy:3}[pattern] : key==='cuda'?3:2;
        const interior=`<div class="part-interior${pattern?` interior-${pattern}`:''}" aria-hidden="true">${'<i></i>'.repeat(blocks)}</div>`;
        return `<div class="part-frame" data-node="${key}" style="left:${(x-w/2)/layout.width*100}%;top:${(y-h/2)/layout.height*100}%;width:${w/layout.width*100}%;height:${h/layout.height*100}%"><button type="button" class="system-part part-${type}" data-part="${key}" aria-label="${details}" aria-pressed="false">${interior}<span class="part-frost" aria-hidden="true"></span>${name?`<span class="part-name">${name}</span>`:''}</button></div>`;
      }).join('');
      const wires=layout.routes.map(([type,route,points])=>[-2,0,2].map(offset=>`<path class="system-${type}-wire" data-route="${route}" pathLength="1" d="${offsetPath(points,offset)}"/>`).join('')).join('');
      const captions=layout.captions.map(([x,y,key,type])=>`<text x="${x}" y="${y}" class="system-label label-${type}" aria-hidden="true">${escape(words[key]||key)}</text>`).join('');
      // Motion layer: the lines layer also carries a light that runs along every route, a pad at each end and the data packets. The lines,
      // the modules and the text move separately.
      const flows=layout.routes.map(([type,route,points])=>`<path class="system-flow" data-flow="${route}" style="animation-delay:${-(route.length*.37%4).toFixed(2)}s" d="${points.map((point,i)=>`${i?'L':'M'}${point[0]} ${point[1]}`).join('')}"/>${[points[0],points[points.length-1]].map(point=>`<circle class="system-pad" data-pad="${route}" cx="${point[0]}" cy="${point[1]}" r="2.4"/>`).join('')}`).join('');
      const packets='<circle class="system-packet" r="3"/>'.repeat(7);
      return `<div class="network-${size} network-scene" data-scene-width="${layout.width}" style="--scene-width:${layout.width};aspect-ratio:${layout.width}/${layout.height}" role="group" aria-label="${t('设备架构','Device architecture')}"><svg viewBox="0 0 ${layout.width} ${layout.height}" aria-hidden="true"><g class="system-layer system-layer-lines">${wires}${packets}${flows}</g><g class="system-layer system-layer-text">${captions}</g></svg>${nodes}</div>`;
    }
    const graph=document.getElementById('networkGraph');
    // SVG and sibling HTML modules share the same untransformed container.
    // Percent positions derive from the SVG viewBox; CSS scales module details.
    graph.innerHTML=scene('desktop')+scene('mobile');
    graph.querySelectorAll('[data-part]').forEach(button=>button.addEventListener('click',()=>{
      const pressed=button.getAttribute('aria-pressed')!=='true';
      clearInspection();
      graph.querySelectorAll(`[data-part="${button.dataset.part}"]`).forEach(item=>item.setAttribute('aria-pressed',String(pressed)));
    }));
    track(graph);
  }
  function clearInspection() {
    document.querySelectorAll('#networkGraph [aria-pressed=true]').forEach(button=>button.setAttribute('aria-pressed','false'));
  }
  const topics = [
    {parts:['mcu','cuda','x86'],routes:[]},
    {parts:['ethernet','switch','nic-cuda','nic-x86'],routes:['management-network','cuda-network','x86-network']},
    {parts:['mcu','config'],routes:['management-config']},
    {parts:['mcu','ethernet','switch'],routes:['management-spi','management-network']}
  ];

  // Motion layer (D9). A light runs along every route (sapphire and faster once the route is lit), data packets travel the north-south
  // routes in "device control", a config pack is sent from the config storage to ESP32 in a 3.6 s loop, the update sequence runs ESP32,
  // W5500, RTL8367RB in a 5.4 s loop, and the lines, the modules and the text follow the pointer by different amounts. It all runs only
  // while the figure is on screen; with reduced motion the figure stands still and the two loops are shown as one lit frame.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sequence = [[0,'mcu'],[1.15,'ethernet'],[2.3,'switch']];
  let scenes = [], graphEl = null, focus = 0, focusAt = 0, frameId = 0, tx = 0, ty = 0, px = 0, py = 0, written = '';
  const smooth = (a,b,x) => { const k=Math.max(0,Math.min(1,(x-a)/(b-a))); return k*k*(3-2*k); };
  const setLit = (element,on) => { const value=String(on); if(element.dataset.lit!==value) element.dataset.lit=value; };
  function track(graph) {
    const all = (root,selector) => Array.from(root.querySelectorAll(selector));
    scenes = all(graph,'.network-scene').map(el => {
      const group = (selector,key) => { const map={}; all(el,selector).forEach(item=>{ (map[item.dataset[key]] ||= []).push(item); }); return map; };
      return {
        el,
        flows:Object.fromEntries(all(el,'[data-flow]').map(path=>[path.dataset.flow,{path,length:0}])),
        pads:group('[data-pad]','pad'),
        wires:group('[data-route]','route'),
        parts:Object.fromEntries(all(el,'[data-part]').map(part=>[part.dataset.part,part])),
        packets:all(el,'.system-packet')
      };
    });
    if(graphEl) return;
    graphEl = graph;
    graph.addEventListener('pointermove',event => {
      if(reduceMotion.matches) return;
      const box=graph.getBoundingClientRect();
      tx=(event.clientX-box.left)/box.width-.5; ty=(event.clientY-box.top)/box.height-.5;
    });
    graph.addEventListener('pointerleave',() => { tx=ty=0; });
    new IntersectionObserver(entries => {
      const live=entries[0].isIntersecting;
      graph.toggleAttribute('data-live',live);
      window.cancelAnimationFrame(frameId);
      if(live && !reduceMotion.matches) frameId=window.requestAnimationFrame(frame);
    }).observe(graph);
  }
  // A point on a route, taken from the route's own path (the same geometry the wires are offset from)
  function pointAt(flow,u,reverse) {
    if(!flow.length) flow.length=flow.path.getTotalLength();
    return flow.path.getPointAtLength((reverse?1-u:u)*flow.length);
  }
  function place(scene,index,route,u,reverse,fade) {
    const packet=scene.packets[index],point=pointAt(scene.flows[route],u,reverse);
    packet.setAttribute('cx',point.x); packet.setAttribute('cy',point.y);
    packet.style.opacity=Math.min(1,u*fade,(1-u)*fade);
  }
  function frame(now) {
    frameId=window.requestAnimationFrame(frame);
    px+=(tx-px)*.08; py+=(ty-py)*.08;
    const shift=`${px.toFixed(3)} ${py.toFixed(3)}`;
    if(shift!==written) { written=shift; graphEl.style.setProperty('--px',px.toFixed(3)); graphEl.style.setProperty('--py',py.toFixed(3)); }
    const t=Math.max(0,(now-focusAt)/1000);
    scenes.forEach(scene => {
      if(!scene.el.offsetParent) return;
      if(focus>0) scene.packets.forEach(packet=>{ packet.style.opacity=0; });
      if(focus===1) {
        [['management-network',false],['cuda-network',true],['x86-network',true]].forEach(([route,reverse],r) => {
          for(let j=0;j<2;j++) place(scene,r*2+j,route,(t*.3+j*.5+r*.2)%1,reverse,6);
        });
      }
      if(focus===2) {
        // Config pack: the config storage lights, one packet runs from it to ESP32, and ESP32 lights as the packet arrives.
        const c=t%3.6,fade=1-smooth(2.9,3.4,c),on=smooth(.3,.5,c)*fade>.5;
        setLit(scene.parts.config,smooth(.2,.6,c)*fade>.5);
        setLit(scene.parts.mcu,smooth(1.05,1.35,c)*fade>.5);
        scene.wires['management-config'].forEach(wire=>setLit(wire,on));
        scene.flows['management-config'].path.classList.toggle('on',on);
        scene.pads['management-config'].forEach(pad=>pad.classList.toggle('on',on));
        const u=(c-.35)/.75;
        if(u>0&&u<1) place(scene,0,'management-config',u,true,8);
      }
      if(focus===3) {
        const c=t%5.4,fade=1-smooth(4.5,5.1,c);
        sequence.forEach(([start,key]) => setLit(scene.parts[key],smooth(start+.2,start+.6,c)*fade>.5));
        [['management-spi',smooth(.3,.5,c)*fade],['management-network',smooth(1.4,1.6,c)*fade]].forEach(([route,amount]) => {
          const on=amount>.5;
          scene.wires[route].forEach(wire=>setLit(wire,on));
          scene.flows[route].path.classList.toggle('on',on);
          scene.pads[route].forEach(pad=>pad.classList.toggle('on',on));
        });
        let u=(c-.35)/.75;
        if(u>0&&u<1) place(scene,0,'management-spi',u,true,8);
        u=(c-1.5)/.9;
        if(u>0&&u<1) place(scene,1,'management-network',u,false,8);
      }
    });
  }
  function setFocus(index) {
    const topic=topics[index];
    focus=index; focusAt=performance.now();
    // In the config pack and the update sequence (and with motion allowed) the loop lights the parts and routes one after the other.
    const sequenced=(index===2||index===3)&&!reduceMotion.matches;
    document.querySelectorAll('#networkGraph [data-part]').forEach(part=>{
      part.dataset.lit=String(!sequenced&&topic.parts.includes(part.dataset.part));
    });
    document.querySelectorAll('#networkGraph [data-route]').forEach(wire=>{
      wire.dataset.lit=String(!sequenced&&topic.routes.includes(wire.dataset.route));
    });
    document.querySelectorAll('#networkGraph [data-flow],#networkGraph [data-pad]').forEach(item=>{
      item.classList.toggle('on',!sequenced&&topic.routes.includes(item.dataset.flow||item.dataset.pad));
    });
    document.querySelectorAll('#networkGraph .system-packet').forEach(packet=>{ packet.style.opacity=0; });
  }
  return {render,clearInspection,setFocus};
})();
