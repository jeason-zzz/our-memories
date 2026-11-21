import * as THREE from './vendor/three.module.min.js';
import { makeDog, animateDog, poseDogArm } from './dog-model.js?v=20261118-5';
export { makeDog };
import { MEMORIES, ROOMS } from './memories.js?v=20261118-5';

export const C = { grass:0xafd18c, leaf:0x78a16d, darkLeaf:0x527e61, cream:0xfff3d3, stone:0xe5dcc4, ink:0x49463f, pink:0xeeb9b8, roof:0x819fb4, gold:0xd6b679, blue:0xb7d6dc };
const materials = new Map();
const geometries = new Map();
const outlineMat = new THREE.MeshBasicMaterial({ color:0x4e4b42, side:THREE.BackSide });
const skinMaterial = new THREE.MeshLambertMaterial({color:0xffe6d7,emissive:0xffdfcf,emissiveIntensity:.18});
export const mat = (color) => { if(!materials.has(color)) materials.set(color,new THREE.MeshLambertMaterial({color})); return materials.get(color); };
function geo(key, make){if(!geometries.has(key))geometries.set(key,make());return geometries.get(key);}
export function mesh(parent,geometry,color,x=0,y=0,z=0,outline=false){
  const m=new THREE.Mesh(geometry,typeof color==='number'?mat(color):color);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=color!==skinMaterial;parent.add(m);
  if(outline){const border=new THREE.Mesh(geometry,outlineMat);border.scale.setScalar(1.035);m.add(border);}
  return m;
}
export function box(p,w,h,d,c,x=0,y=0,z=0,outline=false){return mesh(p,geo(`b${w},${h},${d}`,()=>new THREE.BoxGeometry(w,h,d)),c,x,y,z,outline);}
export function ball(p,r,c,x=0,y=0,z=0,scale=[1,1,1],outline=false){const m=mesh(p,geo(`s${r}`,()=>new THREE.SphereGeometry(r,16,12)),c,x,y,z,outline);m.scale.set(...scale);return m;}
export function cylinder(p,rt,rb,h,c,x=0,y=0,z=0,n=16,outline=false){return mesh(p,geo(`c${rt},${rb},${h},${n}`,()=>new THREE.CylinderGeometry(rt,rb,h,n)),c,x,y,z,outline);}
export function torus(p,r,tube,c,x=0,y=0,z=0){return mesh(p,geo(`t${r},${tube}`,()=>new THREE.TorusGeometry(r,tube,8,36)),c,x,y,z);}
export function group(p,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g;}
export function label(p,text,x,y,z,{width=5,height=1,color='#52674c',background='',size=50}={}){
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=Math.round(768*height/width);const ctx=canvas.getContext('2d');
  if(background){ctx.fillStyle=background;ctx.fillRect(0,0,canvas.width,canvas.height);}
  ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`500 ${size}px "PingFang SC",sans-serif`;ctx.fillText(text,canvas.width/2,canvas.height/2,canvas.width-35);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide});
  const plane=mesh(p,new THREE.PlaneGeometry(width,height),material,x,y,z);plane.castShadow=false;plane.receiveShadow=false;return plane;
}
// Subdivide intersecting paths into one surface. No two faces occupy the same plane.
function groundPatches(parent,patches,height=.08){
  const xs=[...new Set(patches.flatMap(r=>[r.x-r.w/2,r.x+r.w/2]))].sort((a,b)=>a-b);
  const zs=[...new Set(patches.flatMap(r=>[r.z-r.d/2,r.z+r.d/2]))].sort((a,b)=>a-b);
  const positions=[],colors=[];
  for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++){
    const x=(xs[i]+xs[i+1])/2,z=(zs[j]+zs[j+1])/2;
    const patch=patches.findLast(r=>Math.abs(x-r.x)<r.w/2&&Math.abs(z-r.z)<r.d/2);
    if(!patch)continue;
    positions.push(xs[i],height,zs[j],xs[i],height,zs[j+1],xs[i+1],height,zs[j+1],xs[i],height,zs[j],xs[i+1],height,zs[j+1],xs[i+1],height,zs[j]);
    const color=new THREE.Color(patch.color);for(let k=0;k<6;k++)colors.push(color.r,color.g,color.b);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
  const ground=mesh(parent,geometry,new THREE.MeshLambertMaterial({vertexColors:true}));ground.castShadow=false;
  return patches.map(r=>({x:r.x,z:r.z,w:r.w,d:r.d,height}));
}
function arch(p,w,h,depth,c,x,y,z){
  const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(-w/2,h-w/2);s.absarc(0,h-w/2,w/2,Math.PI,0,true);s.lineTo(w/2,0);s.closePath();
  return mesh(p,new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:.08,bevelThickness:.05,bevelSegments:1,steps:1,curveSegments:20}),c,x,y,z);
}
function heartShape(size=1){const s=new THREE.Shape();s.moveTo(0,.28);s.bezierCurveTo(-.7,.9,-1.1,-.15,0,-.85);s.bezierCurveTo(1.1,-.15,.7,.9,0,.28);const geo=new THREE.ExtrudeGeometry(s,{depth:.14,bevelEnabled:true,bevelSize:.04,bevelThickness:.04,bevelSegments:2,steps:1,curveSegments:12});geo.scale(size,size,size);return geo;}
export function heart(p,c,x,y,z,size=1){return mesh(p,geo(`heart${size}`,()=>heartShape(size)),c,x,y,z);}
export function star(p,c,x,y,z,size=.4){const s=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2;const r=(i%2?.43:1)*size;const px=Math.cos(a)*r,py=Math.sin(a)*r;i?s.lineTo(px,py):s.moveTo(px,py);}s.closePath();return mesh(p,new THREE.ExtrudeGeometry(s,{depth:.12,bevelEnabled:false}),c,x,y,z);}
function tree(p,x,z,s=1,pine=false){const g=group(p,x,0,z);g.scale.setScalar(s);cylinder(g,.18,.32,3.8,0x997c5a,0,1.7,0,8);if(pine){for(let j=0;j<3;j++)cylinder(g,0,2.2-j*.45,3.0,C.darkLeaf,0,3.1+j*1.2,0,9,true);}else{ball(g,2.1,C.leaf,0,4.2,0,[1,1.1,1]);ball(g,1.55,0x94b77c,-1.3,3.5,.4);ball(g,1.6,0x88ad76,1.3,3.7,.3);}return g;}
function bush(p,x,z,s=1,c=C.leaf){const g=group(p,x,.35,z);ball(g,.65,c,0,0,0,[s,s*.8,s],false);ball(g,.45,c,.5*s,.06,.1,[s,s,s]);return g;}
function flower(p,x,z,color=C.pink,s=1){const g=group(p,x,0,z);g.scale.setScalar(s);cylinder(g,.025,.025,.6,0x7b9d65,0,.3,0,5);for(let j=0;j<5;j++){const a=j*Math.PI*2/5;ball(g,.14,color,Math.cos(a)*.16,.64,Math.sin(a)*.16,[1,.4,1]);}ball(g,.1,0xf0cf77,0,.67,0,[1,.6,1]);return g;}
function pot(p,x,z,c=C.pink,s=1){const g=group(p,x,0,z);g.scale.setScalar(s);cylinder(g,.57,.39,.85,c,0,.43,0,12);cylinder(g,.61,.61,.15,c,0,.86,0,12);ball(g,.56,0x85a77b,0,1.17,0,[1,1.15,1]);for(let j=0;j<3;j++)ball(g,.17,j%2?0xffecc3:0xe9a9a7,Math.cos(j*2.1)*.36,1.65,Math.sin(j*2.1)*.26);return g;}
function bench(p,x,z,rotation=0,color=0xb68b66){const g=group(p,x,0,z);g.rotation.y=rotation;for(let k=0;k<3;k++)box(g,3.4,.14,.27,color,0,.9,k*.32-.3);for(let k=0;k<2;k++)box(g,3.4,.25,.13,color,0,1.5+k*.36,-.48);for(const xx of [-1.25,1.25]){box(g,.16,.9,.8,0x626955,xx,.45,0);box(g,.12,1.4,.12,0x626955,xx,1.2,-.48);}return g;}
function lamp(p,x,z){const g=group(p,x,0,z);cylinder(g,.13,.2,5,0x5d6a53,0,2.5,0,10);cylinder(g,.4,.6,.2,0x5d6a53,0,.1,0,10);box(g,.7,.9,.7,0xffedbe,0,5.2,0,true);cylinder(g,0,.6,.4,0x5d6a53,0,5.85,0,4);const inward=x<0?1:-1;box(g,.5,.08,.08,0x5d6a53,inward*.25,4.85,0);torus(g,.10,.025,C.gold,inward*.48,4.85,0);return new THREE.Vector3(x+inward*.48,4.85,z);}
function bunting(p,start,end){const pts=[];const sag=Math.min(.65,start.distanceTo(end)*.045);for(let i=0;i<=32;i++){const t=i/32;pts.push(new THREE.Vector3().lerpVectors(start,end,t).add(new THREE.Vector3(0,-Math.sin(t*Math.PI)*sag,0)));}const curve=new THREE.CatmullRomCurve3(pts);const cable=mesh(p,new THREE.TubeGeometry(curve,32,.035,5,false),0x63725b);cable.castShadow=false;const colors=[0xffe5ab,0xf1b7b3,0xbdd4bc,0xabc9d4];for(let i=0;i<13;i++){const point=curve.getPoint((i+.5)/13);ball(p,.2,colors[i%4],point.x,point.y-.24,point.z,[1,1.25,1]);}}
function windowArch(p,x,y,z,w=1.15,h=2.3){arch(p,w+.21,h+.19,.12,C.cream,x,y-.06,z);arch(p,w,h,.15,0xc49b63,x,y,z+.13);box(p,.07,h-.35,.03,C.cream,x,y+(h-.35)/2,z+.31);box(p,w,.07,.04,C.cream,x,y+h*.55,z+.32);}
function tower(p,x,z,r,h){cylinder(p,r,r+.18,h,C.pink,x,h/2,z,20);cylinder(p,r+.22,r+.22,.45,C.cream,x,h-.4,z,20);cylinder(p,0,r+1,h*.47,C.roof,x,h+h*.235,z,20,true);cylinder(p,.055,.055,1.4,C.gold,x,h*1.47+.55,z,8);const flag=box(p,.9,.48,.06,0xe8cf8b,x+.4,h*1.47+.95,z);flag.rotation.z=-.1;windowArch(p,x,h*.64,z+r-.1,.75,1.7);}
function fountain(p,x,z,s=1){const g=group(p,x,0,z);g.scale.setScalar(s);cylinder(g,3.1,3.25,.45,C.stone,0,.2,0,40);cylinder(g,2.8,2.8,.11,0x93cbd2,0,.48,0,40);const rim=torus(g,2.96,.19,C.cream,0,.52,0);rim.rotation.x=Math.PI/2;cylinder(g,.5,.8,1.7,C.cream,0,1.3,0,20);cylinder(g,1.75,1.45,.35,C.stone,0,2.1,0,28);cylinder(g,1.48,1.48,.09,0xa0d7dd,0,2.31,0,28);heart(g,C.gold,0,3.17,0,.65);for(let j=0;j<8;j++){const a=j*Math.PI/4;const r=1.35;const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(Math.cos(a)*r,2.25,Math.sin(a)*r),new THREE.Vector3(Math.cos(a)*2,2.3,Math.sin(a)*2),new THREE.Vector3(Math.cos(a)*2.45,.5,Math.sin(a)*2.45));mesh(g,new THREE.TubeGeometry(curve,14,.035,5,false),new THREE.MeshBasicMaterial({color:0xb9e7e7,transparent:true,opacity:.7}));}return g;}
export function buildExterior(scene){
  const root=group(scene);const colliders=[];const surfaces=[{x:0,z:7,w:150,d:160,height:-.1}];box(root,150,.8,160,C.grass,0,-.5,7);
  surfaces.push(...groundPatches(root,[{w:9,d:64,x:0,z:18,color:C.cream},{w:35,d:10,x:0,z:-1,color:C.cream},{w:13,d:12,x:0,z:45,color:C.cream},{w:36,d:9,x:-9,z:43,color:0xd9d1bc}]));
  for(let k=0;k<45;k++){const z=46-k*1.15;const x=(k%3-1)*2.45;const m=cylinder(root,.46,.52,.045,0xf0dfba,x,.1,z,7);m.scale.z=.65;}
  // The station is the departure point, with a nine-and-three-quarters sign.
  const station=group(root,-10,0,43);box(station,14,.55,8,0xd6bda1,0,.3,0);surfaces.push({x:-10,z:43,w:14,d:8,height:.575});box(station,13,3.9,.55,0xc99c88,0,2,-3.5);for(let i=0;i<8;i++)box(station,13,.025,.035,0xe2c2a4,0,.4+i*.5,-3.2);
  for(let i=0;i<2;i++){const height=.4-i*.16;box(root,6.2+i*.5,height-.08,.8,0xd6bda1,-10,(height+.08)/2,47.4+i*.8);surfaces.push({x:-10,z:47.4+i*.8,w:6.2+i*.5,d:.8,height});}
  for(const x of [-6,6]){cylinder(station,.16,.2,5.4,0x587260,x,2.7,0,8);cylinder(station,.17,.21,5.4,0x587260,x,2.7,-3.5,8);}
  const roof=box(station,14,.5,6.1,0x6c8d7d,0,5.5,-1.6,true);roof.rotation.x=-.08;
  const sign=cylinder(station,1.13,1.13,.14,0x6b3d38,5.7,4.3,1.3,40);sign.rotation.x=Math.PI/2;const rim=torus(station,1.02,.045,0xd1ac74,5.7,4.3,1.41);label(station,'9¾',5.7,4.3,1.44,{width:1.7,height:1.2,color:'#f1d8a3',size:220});
  label(station,'下一站 · 有你的地方',-1,3.15,-3.1,{width:8,height:.8,color:'#fff1d0',size:56});bench(station,-2,0,0,0xa98962);pot(station,-5,1.4,0x9ba879,.9);pot(station,5,1.6,0xc08e7e,.9);
  // Small vintage luggage and a handcart.
  box(station,1,.75,.7,0xad765a,3,.65,.8,true);box(station,.8,.55,.65,0x7c9c8c,3.1,1.3,.8,true);for(const xx of [2.65,3.35])cylinder(station,.09,.09,.08,0x786b55,xx,.29,.8,10);
  label(root,'回忆城堡  ↑',3.8,2.1,31,{width:3.7,height:.65,background:'#fcf0cd',size:65});cylinder(root,.08,.1,2.7,0xa28461,3.8,1.3,30.95,7);
  // Castle: accessible front portal, blue spires, warm pink stone.
  const castle=group(root,0,0,-19);box(castle,37,.65,28,C.stone,0,.26,0);box(castle,35,.32,27,C.cream,0,.7,0);surfaces.push({x:0,z:-19,w:37,d:28,height:.585},{x:0,z:-19,w:35,d:27,height:.86});
  box(castle,21,10,15,C.pink,0,5.7,-2);box(castle,21.6,.5,15.6,C.cream,0,10.5,-2);box(castle,19,1.5,14,C.roof,0,11.2,-2);const top=box(castle,20,.9,15,C.roof,0,12,-2);top.rotation.z=0;
  tower(castle,0,-5,3.35,16.9);tower(castle,-13,1.5,2.8,10.4);tower(castle,13,1.5,2.8,10.4);tower(castle,-8,-8,1.8,13);tower(castle,8,-8,1.8,13);
  box(castle,5,7,4,C.cream,0,4,7);arch(castle,4.1,6.1,.2,0xcfa893,0,.85,9.05);arch(castle,3.4,5.7,.1,0x766c62,0,.85,9.31);arch(castle,2.95,5.4,.1,0xf6e9bb,0,.85,9.48);box(castle,2.95,.24,.2,0xd8ba7f,0,.95,9.7);heart(castle,0xd8b788,0,8.6,9.3,.6);label(castle,'我们的回忆城堡',0,7.55,9.3,{width:6,height:.75,color:'#7a6c56',size:63});
  for(const x of [-7,-4,4,7]){windowArch(castle,x,3.2,5.56,1.1,2.4);windowArch(castle,x,7,5.56,1,1.8);}
  for(const x of [-10,10])box(castle,.35,9,.35,C.cream,x,5.3,5.7);
  for(let x=-9;x<=9;x+=2)box(castle,1,1,.7,C.cream,x,11.2,5.6);
  for(let i=0;i<3;i++){const height=.26+i*.2,z=-2.8-i*1.2,w=9.4-i*.6;box(root,w,height-.08,1.2,C.cream,0,(height+.08)/2,z);surfaces.push({x:0,z,w,d:1.2,height});}
  colliders.push({x:-7,z:-16,w:9,d:18},{x:7,z:-16,w:9,d:18},{x:-13,z:-17.5,r:3.1},{x:13,z:-17.5,r:3.1});
  fountain(root,12,9,.9);colliders.push({x:12,z:9,r:3});bench(root,18,14,-.4);bench(root,-12,16,.3);bench(root,-11,4,.3);
  for(const z of [26,11,-1]){const left=lamp(root,-6,z),right=lamp(root,6,z);bunting(root,left,right);colliders.push({x:-6,z,r:.3},{x:6,z,r:.3});}
  // Garden beds and softly layered woodland.
  for(let i=0;i<90;i++){const side=i%2?1:-1;const x=side*(7+(i*7.919%29));const z=40-(i*3.117%76);if(Math.abs(z+16)<18&&Math.abs(x)<21)continue;if(Math.hypot(x-12,z-9)<6)continue;if(i%4===0){tree(root,x,z,.65+(i%5)*.12,i%3===0);colliders.push({x,z,r:.6});}else bush(root,x,z,.7+(i%3)*.4);}
  for(let i=0;i<145;i++){const x=(i%2?1:-1)*(5.1+(i*3.71%4));const z=39-(i*1.63%47);flower(root,x,z,[0xfff1c3,0xe9b1b5,0xf6f4d6][i%3],.65+(i%3)*.15);}
  for(const x of [-7.5,7.5]){pot(root,x,-3,C.pink,1.5);pot(root,x,-7,0x8da992,1.4);}
  const clouds=[];for(let i=0;i<10;i++){const g=group(root,-60+i*13,27+(i%3)*5,-55-(i%2)*12);for(let j=0;j<4;j++)ball(g,2.6,0xfffbed,(j-1.5)*2.8,j%2*.7,0,[1.3,.6,.75]);clouds.push(g);}
  const gate=group(root,0,0,-9.1);const ring=torus(gate,1.8,.035,0xf9e1a0,0,.88,0);ring.rotation.x=-Math.PI/2;ring.material=new THREE.MeshBasicMaterial({color:0xf7e4a8,transparent:true,opacity:.65});
  return {root,colliders,clouds,gate,surfaces};
}

function roomName(root,room,x,z){const l=label(root,room.name,x,.12,z,{width:9,height:1.2,color:'#8d9b84',size:55});l.rotation.x=-Math.PI/2;}
function photoFrame(p,x,y,z,color,w=1.4){const g=group(p,x,y,z);box(g,w+.18,w+.25,.12,0xfdf7df,0,0,0,true);box(g,w-.12,w-.28,.05,color,0,.05,.09);heart(g,0xfff7e5,0,.07,.14,w*.18);return g;}
function bookshelf(p,x,z,rotation=0){const g=group(p,x,0,z);g.rotation.y=rotation;box(g,5.8,4.5,.7,0xb69d79,0,2.25,0,true);for(let r=0;r<3;r++){box(g,5.9,.14,1,0xe2caa3,0,.2+r*1.45,.2);for(let i=0;i<12;i++){const h=.65+(i*17%9)*.06;const b=box(g,.31,h,.65,[0x9caf9a,0xe2b1a0,0xa4bdc7,0xc7b3cd,0xe5cf94][(i+r)%5],-2.4+i*.43,.3+r*1.45+h/2,.34);b.rotation.z=(i%4===0?.12:0);}}return g;}
function roomProps(root,index){const room=ROOMS[index];const [x,z]=room.center;const g=group(root,x,0,z);const color=parseInt(room.color.slice(1),16);
  if(index===0){const pergola=group(g,0,0,-1);for(const xx of [-4,4])for(const zz of [-3,3])cylinder(pergola,.1,.15,4.3,0xaebd93,xx,2.15,zz,8);for(let i=0;i<7;i++)box(pergola,9,.15,.2,0xc7d1ac,0,4.35,-3+i);for(let i=0;i<14;i++)ball(pergola,.35,i%3?0x9eb58a:color,(i%7-3)*1.2,4.5,(i<7?-3:3));bench(g,0,0,0,0xd3ad94);pot(g,-3.6,2.3,color);pot(g,3.6,2.3,color);}
  if(index===1){box(g,5.8,.22,2.7,0xe6cba4,0,1.5,0,true);for(const xx of [-2.2,2.2])box(g,.25,1.45,2,0xc1a37c,xx,.72,0);const globe=group(g,-.8,1.75,0);cylinder(globe,.15,.4,.6,C.gold,0,.3,0,12);ball(globe,.8,0xaacbd1,0,1.1,0,[1,1,1],true);const orbit=torus(globe,.87,.03,C.gold,0,1.1,0);orbit.rotation.z=.4;box(g,1.2,.12,.85,0xf9f1dc,1.5,1.7,.1);box(g,1,.09,.8,color,1.4,1.85,.1);label(g,'POST',2.1,2.4,.45,{width:.8,height:.5,color:'#8d8970',size:200});pot(g,4,1,color);box(g,1.8,1.4,1.2,0xc7a682,-3,.7,0,true);box(g,1.5,.8,1.2,0xa8beb7,-3.1,1.8,0,true);}
  if(index===2){box(g,6.2,3.4,.25,0xbba78d,0,3,-2,true);box(g,5.6,2.9,.03,0xfff3d5,0,3,-1.83);heart(g,color,0,3,-1.7,.6);bench(g,0,2.3,0,0xd9bfa2);for(const xx of [-3.9,3.9]){cylinder(g,.2,.3,2.5,0x91a98b,xx,1.25,-1,8);star(g,C.gold,xx,2.9,-1,.6);}box(g,1.2,.7,.9,0x7b8c7e,0,1.35,1.2,true);cylinder(g,.32,.32,.2,0x4e665c,0,1.35,1.8,16).rotation.x=Math.PI/2;}
  if(index===3){const rug=cylinder(g,4,4,.06,0xd9cee7,0,.08,0,36);rug.scale.z=.85;cylinder(g,.7,.95,2.5,0xc3b7ce,0,1.3,-1,14);const tel=group(g,0,2.8,-1);tel.rotation.z=-.5;const tube=cylinder(tel,.38,.48,2.6,0x8e9baa,0,0,0,16,true);tube.rotation.z=Math.PI/2;cylinder(tel,.5,.5,.15,C.gold,1.2,0,0,16).rotation.z=Math.PI/2;for(let i=0;i<8;i++){const a=i*Math.PI/4;star(g,i%2?0xe6d393:0xc8b3d3,Math.cos(a)*3.6,3.9+(i%3)*.5,Math.sin(a)*2.8,.25+(i%2)*.1);}pot(g,4,1,color);}
  if(index===4){bookshelf(g,-9,-4.5);bookshelf(g,-3,-4.5);bookshelf(g,3,-4.5);bookshelf(g,9,-4.5);box(g,6,.2,2.6,0xd3b98f,0,1.5,1);for(const xx of [-2.3,2.3])box(g,.3,1.5,1.8,0xac936c,xx,.75,1);for(let i=0;i<3;i++)box(g,1.2,.13,.8,[0x98b4a0,0xceb2a3,0xf0dfb3][i],-1.4+i*1.4,1.7,1);pot(g,-12,1,0xd4c19a);pot(g,12,1,0xd4c19a);}
}
export function buildInterior(scene){
  const root=group(scene);root.visible=false;const colliders=[];const markers=[];
  box(root,68,1,81,0xd4c7aa,0,-.6,-4);const floorPatches=[{x:0,z:-4,w:66,d:79,color:0xf9f1d9}];
  // A roofless dollhouse layout keeps the free-roaming floor readable.
  for(let x=-30;x<=30;x+=3)for(let z=-40;z<=32;z+=3){if((Math.round(x/3)+Math.round(z/3))%2===0)floorPatches.push({x,z,w:2.97,d:2.97,color:0xf0e7d0});}
  for(let i=0;i<4;i++){const [x,z]=ROOMS[i].center;floorPatches.push({x,z,w:26,d:23,color:[0xf1e4d9,0xe5edf0,0xf1e9d6,0xe9e2f1][i]});for(const xx of [-12.7,12.7])box(root,.12,.008,22.6,0xe4d5b9,x+xx,.085,z);for(const zz of [-11.2,11.2])box(root,25.4,.008,.12,0xe4d5b9,x,.085,z+zz);roomName(root,ROOMS[i],x,z+9.5);roomProps(root,i);colliders.push({x,z:z-1,w:6.5,d:3});}
  floorPatches.push({x:0,z:-32,w:48,d:13,color:0xe4eadb},{x:0,z:-4,w:7,d:77,color:0xf6dfc8},{x:0,z:3,w:64,d:5,color:0xf6dfc8},{x:0,z:-23,w:64,d:4,color:0xf6dfc8});groundPatches(root,floorPatches);const surfaces=[{x:0,z:-4,w:66,d:79,height:.08}];
  roomName(root,ROOMS[4],0,-26.2);roomProps(root,4);colliders.push({x:0,z:-29,w:6.5,d:3},{x:0,z:-34.5,w:25,d:1.2});
  box(root,67,8,.5,0xf1dbce,0,4,-43.5);box(root,.5,4,79,0xf2e2cf,-33,2,-4);box(root,.5,4,79,0xf2e2cf,33,2,-4);
  const pillarXs=[-31,-4.4,4.4,31];
  for(const x of pillarXs)for(const z of [29,5,-22,-40]){cylinder(root,.32,.44,5.3,0xfdf3d9,x,2.8,z,12);cylinder(root,.62,.62,.24,0xdac39c,x,.3,z,12);cylinder(root,.54,.54,.3,0xf7e5be,x,5.4,z,12);colliders.push({x,z,r:.48});if(z===5||z===-22)torus(root,.13,.03,C.gold,x,5.68,z);}
  for(const x of [-24,-12,0,12,24])windowArch(root,x,4,-43.16,2.1,3.4);
  for(const x of [-33,33])for(let z=-32;z<25;z+=14){const f=photoFrame(root,x+(x>0?-.3:.3),2.6,z,0xd9c5a6,1.8);f.rotation.y=x>0?-Math.PI/2:Math.PI/2;}
  fountain(root,0,3,.7);colliders.push({x:0,z:3,r:2.4});for(const z of [5,-22])for(let i=0;i<pillarXs.length-1;i++)bunting(root,new THREE.Vector3(pillarXs[i],5.68,z),new THREE.Vector3(pillarXs[i+1],5.68,z));
  for(const x of [-6,6]){pot(root,x,28,0xcaa7a0,1.25);pot(root,x,-22,0xc3b4d1,1.25);}
  // Every memory gets a numbered photo pedestal and a collectible heart.
  for(const memory of MEMORIES){const [x,z]=memory.position;const color=parseInt(ROOMS[memory.room].color.slice(1),16);const g=group(root,x,0,z);cylinder(g,.91,1.1,.24,0xf7e6c3,0,.2,0,20);cylinder(g,.58,.75,1.3,color,0,.9,0,16);cylinder(g,.82,.82,.17,0xfff4d8,0,1.62,0,16);const frame=photoFrame(g,0,2.55,0,color,1.35);frame.rotation.y=.2;const h=heart(g,0xe9b2aa,0,4.1,0,.42);const ring=torus(g,1.35,.045,color,0,.16,0);ring.rotation.x=-Math.PI/2;const num=label(g,String(memory.id).padStart(2,'0'),0,.95,.61,{width:.85,height:.5,color:'#fff9eb',size:180});colliders.push({x,z,r:.88});markers.push({memory,group:g,frame,heart:h,ring,label:num,baseColor:color});}
  const exit=group(root,0,0,33);for(const x of [-3,3])cylinder(exit,.23,.3,5.5,0xd1b791,x,2.7,0,12);label(exit,'花园与站台  ↓',0,5.2,.2,{width:5,height:.8,color:'#ad9877',size:60});
  return {root,colliders,markers,surfaces};
}

const verticalAxis=new THREE.Vector3(0,1,0);
function armRig(body,side,{color,skin,shoulderX=.46,shoulderY=1.59,upperLength=.37,lowerLength=.41,radius=.115,soft=false}){
  const arm={side,shoulder:new THREE.Vector3(side*shoulderX,shoulderY,0),upperLength,lowerLength};
  arm.upper=soft?mesh(body,geo(`plush-arm-${radius}`,()=>new THREE.CapsuleGeometry(radius,1-2*radius,6,20)),color,0,0,0,true):cylinder(body,radius,radius*.91,1,color,0,0,0,12,true);
  arm.forearm=soft?mesh(body,geo(`plush-forearm-${radius}`,()=>new THREE.CapsuleGeometry(radius*.85,1-2*radius*.85,6,20)),skin,0,0,0,true):cylinder(body,radius*.85,radius*.82,1,skin,0,0,0,12,true);
  arm.elbow=ball(body,radius*.88,skin,0,0,0);
  arm.hand=ball(body,radius*1.06,skin,0,0,0,[1,1.05,1],true);
  if(soft)ball(body,radius,color,side*shoulderX,shoulderY,0);
  return arm;
}
function segmentBetween(segment,start,end){const direction=new THREE.Vector3().subVectors(end,start);const length=direction.length();segment.position.copy(start).add(end).multiplyScalar(.5);segment.scale.y=length;segment.quaternion.setFromUnitVectors(verticalAxis,direction.multiplyScalar(1/length));}
function poseArm(arm,target){
  const direction=new THREE.Vector3().subVectors(target,arm.shoulder);const distance=THREE.MathUtils.clamp(direction.length(),.03,arm.upperLength+arm.lowerLength-.002);direction.normalize();
  const along=(arm.upperLength**2-arm.lowerLength**2+distance**2)/(2*distance);
  const bend=new THREE.Vector3(0,0,1).addScaledVector(direction,-direction.z).normalize();
  const elbow=arm.shoulder.clone().addScaledVector(direction,along).addScaledVector(bend,Math.sqrt(Math.max(0,arm.upperLength**2-along**2)));
  const hand=arm.shoulder.clone().addScaledVector(direction,distance);
  if(arm.bones){poseDogArm(arm,elbow,hand);return;}
  segmentBetween(arm.upper,arm.shoulder,elbow);segmentBetween(arm.forearm,elbow,hand);arm.elbow.position.copy(elbow);arm.hand.position.copy(hand);
}
function restArm(arm,swing,jumping){const length=arm.upperLength+arm.lowerLength;const side=jumping?arm.side*.4:arm.side*.045;const forward=jumping?.05:swing;const down=-Math.sqrt(Math.max(.02,(length-.015)**2-side**2-forward**2));poseArm(arm,arm.shoulder.clone().add(new THREE.Vector3(side,down,forward)));}
export function holdHands(first,second){
  const a=first.userData,b=second.userData;if(!a.limbs||!b.limbs)return;
  first.updateWorldMatrix(true,true);second.updateWorldMatrix(true,true);
  const right=a.limbs.rightArm,left=b.limbs.leftArm;
  const shoulderA=right.shoulder.clone().applyMatrix4(a.body.matrixWorld),shoulderB=left.shoulder.clone().applyMatrix4(b.body.matrixWorld);
  const target=shoulderA.add(shoulderB).multiplyScalar(.5);target.y-=a.kind==='dog'?.13:.40;
  const forward=new THREE.Vector3(0,0,.07).applyQuaternion(first.quaternion);target.add(forward);
  poseArm(right,a.body.worldToLocal(target.clone()));poseArm(left,b.body.worldToLocal(target.clone()));
}
function faceTexture(expression='smile',male=false){
  const c=document.createElement('canvas');c.width=512;c.height=400;const ctx=c.getContext('2d');ctx.clearRect(0,0,512,400);ctx.lineCap='round';ctx.strokeStyle='#493c31';ctx.fillStyle='#493c31';
  for(const x of [157,355]){if(expression==='happy'){ctx.lineWidth=12;ctx.beginPath();ctx.arc(x,168,35,Math.PI*1.14,Math.PI*1.86);ctx.stroke();}else{ctx.beginPath();ctx.ellipse(x,162,expression==='wink'&&x===355?26:26,expression==='wink'&&x===355?5:40,0,0,Math.PI*2);ctx.fill();if(!(expression==='wink'&&x===355)){ctx.fillStyle='#fffdf0';ctx.beginPath();ctx.ellipse(x-7,149,9,12,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#493c31';}if(!male){ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(x-24,145);ctx.lineTo(x-37,131);ctx.moveTo(x+20,139);ctx.lineTo(x+28,126);ctx.stroke();}}}
  ctx.fillStyle='#ea9991';ctx.globalAlpha=.45;for(const x of [100,412]){ctx.beginPath();ctx.ellipse(x,231,36,18,0,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;ctx.strokeStyle='#965f50';ctx.lineWidth=8;ctx.beginPath();
  if(expression==='happy'){ctx.moveTo(218,247);ctx.quadraticCurveTo(256,306,295,247);ctx.closePath();ctx.fillStyle='#aa675b';ctx.fill();ctx.stroke();}else{ctx.moveTo(226,251);ctx.quadraticCurveTo(256,275,287,251);ctx.stroke();}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
export function makeHuman(settings={},male=false){
  const root=new THREE.Group();const body=group(root);const skin=skinMaterial;const hair=male?0x514039:(settings.hairColor??0x755440);const topColor=male?0x9fbd9e:(settings.color??0xf1c7b8);const skirt=settings.outfit==='dress';const limbs={};
  // Soft proportions, a big head and rounded shoes; facial features remain visible.
  const torso=cylinder(body,.4,.48,.98,topColor,0,1.27,0,16,true);torso.scale.z=.72;const collar=torus(body,.22,.065,0xfff7dd,0,1.78,0);collar.rotation.x=Math.PI/2;
  if(skirt){const dress=cylinder(body,.37,.69,.7,topColor,0,.78,0,18,true);dress.scale.z=.82;}
  for(const side of [-1,1]){const leg=group(body,side*.22,.8,0);cylinder(leg,.14,.12,.65,skirt?skin:0x8393a6,0,-.3,0,12,true);ball(leg,.19,settings.shoes==='brown'?0xad8269:settings.shoes==='pink'?0xddabab:0xf7f4df,0,-.67,.09,[.85,.63,1.5],true);if(settings.shoes==='boots')cylinder(leg,.16,.16,.3,0x9e7d64,0,-.51,.02,12,true);limbs[side===-1?'leftLeg':'rightLeg']=leg;
    limbs[side===-1?'leftArm':'rightArm']=armRig(body,side,{color:topColor,skin});}
  const head=group(body,0,2.36,0);ball(head,.72,skin,0,0,0,[1,1.06,.95],true);for(const side of [-1,1])ball(head,.14,skin,side*.69,-.04,0,[.6,1,.6],true);
  const face=mesh(head,new THREE.PlaneGeometry(1.06,.83),new THREE.MeshBasicMaterial({map:faceTexture(settings.expression,male),transparent:true,depthWrite:false}),0,-.05,.711);face.castShadow=false;
  const cap=mesh(head,new THREE.SphereGeometry(.745,24,18,0,Math.PI*2,0,Math.PI*.42),hair,0,.02,-.03,true);cap.scale.set(1.025,1.06,1);
  for(let i=0;i<5;i++){const bang=ball(head,.23,hair,-.48+i*.23,.35+Math.sin(i*.7)*.12,.48,[1.15,.6,.6],false);bang.rotation.z=.2;}
  if(!male){const style=settings.hair??'long';if(style==='long'){for(const side of [-1,1]){ball(head,.34,hair,side*.6,-.4,-.1,[.68,2,.73],true);ball(head,.33,hair,side*.45,-.7,-.34,[.9,1.4,.6]);}ball(head,.6,hair,0,-.3,-.47,[1,.95,.55]);}
    if(style==='bob'){ball(head,.66,hair,0,-.17,-.22,[1.1,1.05,.8]);for(const side of [-1,1])ball(head,.26,hair,side*.62,-.25,.02,[.75,1.5,1],true);}
    if(style==='ponytail'){const pony=group(head,0,.25,-.62);ball(pony,.43,hair,0,0,0,[.9,1.6,1],true);ball(pony,.3,hair,0,-.52,-.09,[.75,1.2,.8]);torus(head,.16,.05,0xe0b0b0,0,.4,-.65);}
    if(style==='buns'){for(const side of [-1,1])ball(head,.31,hair,side*.6,.52,-.17,[1,1,1],true);}
    const bow=group(head,.58,.35,.4);for(const s of [-1,1]){const b=ball(bow,.16,0xf0b2ae,s*.12,0,0,[1,.65,.4],true);b.rotation.z=s*.3;}ball(bow,.07,0xe5a39f,0,0,.04);
  }else{for(const side of [-1,1])ball(head,.2,hair,side*.62,.15,-.07,[.6,1.5,1]);}
  root.userData={body,head,face,limbs,kind:'human',male,walkMix:0,phase:0};animateAvatar(root,0,false);return root;
}

export function animateAvatar(avatar,t,moving,jump=0,paired=false,dt=1/60){
  if(avatar.userData.kind==='dog'){animateDog(avatar,t,moving,jump,paired,dt);return;}
  const data=avatar.userData,{body,limbs}=data;
  data.walkMix=THREE.MathUtils.damp(data.walkMix,moving?1:0,14,dt);data.phase+=dt*(moving?11:3)*data.walkMix;
  const stride=Math.sin(data.phase),swing=stride*.48*data.walkMix,jumping=jump>.03;
  body.position.set(0,jump+Math.abs(stride)*.035*data.walkMix,0);body.rotation.set(0,0,stride*.018*data.walkMix);
  limbs.leftLeg.rotation.set(jumping?-.23:swing,0,0);limbs.rightLeg.rotation.set(jumping?.27:-swing,0,0);
  restArm(limbs.leftArm,-stride*.20*data.walkMix,jumping);restArm(limbs.rightArm,stride*.20*data.walkMix,jumping);
}
export function updateMarker(marker,visited,t){marker.heart.position.y=4.0+Math.sin(t*1.8+marker.memory.id)*.16;marker.heart.rotation.y=Math.sin(t*.7+marker.memory.id)*.3;marker.heart.material=mat(visited?0x95b087:0xe9b2aa);marker.ring.material=mat(visited?0xa3bb8e:marker.baseColor);marker.ring.scale.setScalar(1+Math.sin(t*2+marker.memory.id)*.035);}
