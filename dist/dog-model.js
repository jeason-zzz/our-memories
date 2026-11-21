import * as THREE from './vendor/three.module.min.js';

const models=new Map();
const ink=new THREE.MeshBasicMaterial({color:0x24231f});
const borderMaterial=new THREE.MeshBasicMaterial({color:0x24231f,side:THREE.BackSide});
const clamp=THREE.MathUtils.clamp;
const smooth=(a,b,x)=>THREE.MathUtils.smoothstep(x,a,b);

// Front contours follow the supplied drawings: broad cheeks, a small inward
// turn below the ears, a full belly, and paws that grow out of the silhouette.
// The complete shell is skinned; there are no separate ball joints or shoes.
function contour(male){
  const right=male?[
    [0,2.23],[.26,2.20],[.49,2.10],[.64,1.99],
    [.85,2.025],[1.08,2.01],[1.19,1.91],[1.16,1.79],[1.03,1.74],[.79,1.75],
    [.75,1.60],[.64,1.43],[.66,1.33],
    [.86,1.20],[1.055,1.025],[1.09,.93],[1.025,.86],[.93,.88],[.79,1.015],
    [.80,.84],[.855,.61],[.84,.41],
    [.82,.25],[.75,.075],[.60,.04],[.46,.09],[.39,.23],[.32,.31],[0,.30],
  ]:[
    [0,2.205],[.12,2.24],[.20,2.19],[.30,2.225],[.40,2.18],[.50,2.19],
    [.65,2.26],[.78,2.31],[.91,2.295],[1.00,2.22],[1.025,2.12],[.98,2.02],
    [1.065,1.96],[1.025,1.87],[.91,1.84],[.76,1.87],
    [.745,1.735],[.69,1.67],[.735,1.61],[.665,1.535],[.65,1.41],
    [.77,1.35],[.91,1.20],[1.035,1.09],[1.08,1.00],[1.04,.94],[.985,.955],
    [.955,.90],[.88,.94],[.78,1.045],
    [.75,.89],[.79,.81],[.75,.73],[.80,.65],[.755,.56],[.79,.49],[.74,.40],
    [.76,.29],[.70,.22],[.71,.14],[.62,.10],[.60,.045],[.49,.045],[.45,.10],
    [.39,.12],[.38,.23],[.30,.29],[.16,.27],[0,.295],
  ];
  const left=right.slice(1,-1).reverse().map(([x,y])=>[-x,y]);
  if(male){for(const p of left)if(p[1]>1.73&&p[0]<-.78)p[1]+=(Math.abs(p[0])-.78)*.20;}
  else{for(let i=0;i<left.length;i++){
    const p=left[i];if(p[1]>.35)p[1]+=.012*Math.sin(i*1.7);
    if(p[1]>1.8&&p[0]<-.65){const flop=smooth(.65,.83,-p[0]);p[0]-=.06*flop;p[1]-=.09*flop;}
  }}
  return new THREE.CatmullRomCurve3([...right,...left].map(([x,y])=>new THREE.Vector3(x,y,0)),true,'centripetal').getPoints((right.length+left.length)*4).map(p=>[p.x,p.y]);
}

function signedDistance(points,x,y){
  let inside=false,best=Infinity;
  for(let i=0,j=points.length-1;i<points.length;j=i++){
    const a=points[j],b=points[i],dx=b[0]-a[0],dy=b[1]-a[1];
    const t=clamp(((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1),0,1);
    best=Math.min(best,(x-a[0]-t*dx)**2+(y-a[1]-t*dy)**2);
    if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return Math.sqrt(best)*(inside?-1:1);
}
const volumes=new Map();
function volumeFor(male){
  if(volumes.has(male))return volumes.get(male);
  const points=contour(male),nx=111,ny=105,low=[-1.35,-.10],step=[2.7/(nx-1),2.53/(ny-1)];
  const distances=new Float64Array(nx*ny),pressure=new Float64Array(nx*ny),active=[];
  const wx=1/(step[0]*step[0]),wy=1/(step[1]*step[1]);
  for(let y=0;y<ny;y++)for(let x=0;x<nx;x++)distances[x+y*nx]=signedDistance(points,low[0]+x*step[0],low[1]+y*step[1]);
  for(let y=1;y<ny-1;y++)for(let x=1;x<nx-1;x++){
    const i=x+y*nx,d=distances[i];if(d>=0)continue;
    let diagonal=0;const neighbors=[];
    for(const [j,w] of [[i-1,wx],[i+1,wx],[i-nx,wy],[i+nx,wy]]){
      if(distances[j]<0){diagonal+=w;neighbors.push([j,w]);}
      else diagonal+=w/clamp(d/(d-distances[j]),.025,1);
    }
    const yy=low[1]+y*step[1],load=1+.65*smooth(1.38,1.78,yy);
    active.push({i,diagonal,neighbors,load});
  }
  // An inflated membrane solves a smooth pressure field over the entire body.
  // Fine fur tufts stay on its perimeter rather than becoming grooves in depth.
  for(let iteration=0;iteration<1600;iteration++){
    let change=0;
    for(const cell of active){let sum=cell.load;for(const [j,w] of cell.neighbors)sum+=pressure[j]*w;const delta=(sum/cell.diagonal-pressure[cell.i])*1.72;pressure[cell.i]+=delta;change=Math.max(change,Math.abs(delta));}
    if(iteration>80&&change<1e-9)break;
  }
  let peak=0;for(const u of pressure)peak=Math.max(peak,u);
  const scale=(male?.80:.77)/Math.sqrt(peak);
  for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
    const i=x+y*nx,d=distances[i];if(d<=0)continue;
    let slope=0,count=0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const xx=x+dx,yy=y+dy;if(xx<0||xx>=nx||yy<0||yy>=ny)continue;
      const j=xx+yy*nx;if(distances[j]<-.00001){slope+=pressure[j]/-distances[j];count++;}
    }
    pressure[i]=-d*(count?slope/count:.15);
  }
  const volume={male,points,nx,ny,low,step,pressure,scale};volumes.set(male,volume);return volume;
}
function pressureAt(volume,x,y){
  const gx=clamp((x-volume.low[0])/volume.step[0],0,volume.nx-1.00001),gy=clamp((y-volume.low[1])/volume.step[1],0,volume.ny-1.00001);
  const ix=Math.floor(gx),iy=Math.floor(gy),tx=gx-ix,ty=gy-iy,i=ix+iy*volume.nx,u=volume.pressure;
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(u[i],u[i+1],tx),THREE.MathUtils.lerp(u[i+volume.nx],u[i+volume.nx+1],tx),ty);
}
function frontZ(volume,x,y){return Math.sqrt(Math.max(0,pressureAt(volume,x,y)))*volume.scale;}
function roundedEllipsoid(x,y,z,rx,ry,rz){
  const k0=Math.hypot(x/rx,y/ry,z/rz),k1=Math.hypot(x/(rx*rx),y/(ry*ry),z/(rz*rz));
  return k1?k0*(k0-1)/k1:-Math.min(rx,ry,rz);
}
function blendVolumes(a,b,amount){const h=clamp(.5+.5*(b-a)/amount,0,1);return THREE.MathUtils.lerp(b,a,h)-amount*h*(1-h);}

function skinAt(x,y){
  const side=x<0?-1:1,ax=Math.abs(x),sideIndex=side<0?0:1;
  const ear=smooth(.64,.84,ax)*smooth(1.73,1.95,y);
  const arm=smooth(.59,.88,ax)*(1-smooth(1.31,1.51,y))*smooth(.65,.88,y);
  const leg=(1-smooth(.28,.54,y))*smooth(.18,.40,ax);
  const armBlend=smooth(.78,1.005,ax);
  const weights=[[0,Math.max(0,1-ear-arm-leg)],[7+sideIndex,ear],[1+sideIndex*2,arm*(1-armBlend)],[2+sideIndex*2,arm*armBlend],[5+sideIndex,leg]].sort((a,b)=>b[1]-a[1]).slice(0,4);
  const total=weights.reduce((sum,w)=>sum+w[1],0)||1;
  return {indices:weights.map(w=>w[0]),weights:weights.map(w=>w[1]/total)};
}

// Inflate the traced contour into a rounded, closed volume, then polygonize it.
// Using one surface also lets the ink outline stay continuous at moving joints.
function sculpt(male){
  if(models.has(male))return models.get(male);
  const volume=volumeFor(male),points=volume.points,nx=67,ny=64,nz=49;
  const low=[-1.35,-.10,-.98],high=[1.35,2.43,.98];
  const step=high.map((v,i)=>(v-low[i])/([nx,ny,nz][i]-1));
  const grid=new Float32Array(nx*ny*nz),xy=new Float32Array(nx*ny);
  const at=(x,y,z)=>x+nx*(y+ny*z);
  for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
    const xx=low[0]+x*step[0],yy=low[1]+y*step[1],i=x+nx*y;
    xy[i]=pressureAt(volume,xx,yy)*volume.scale**2;
  }
  for(let z=0;z<nz;z++)for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
    const xx=low[0]+x*step[0],yy=low[1]+y*step[1],zz=low[2]+z*step[2];
    const u=xy[x+nx*y];let distance=(zz*zz-u)/(2*Math.sqrt(Math.max(0,zz*zz+Math.abs(u)))+.05);
    for(const side of [-1,1]){
      const paw=roundedEllipsoid(xx-side*(male?.55:.55),yy-.205,zz-.035,male?.235:.205,.175,.37);
      distance=blendVolumes(distance,paw,.065);
    }
    grid[at(x,y,z)]=distance;
  }
  const positions=[],normals=[],indices=[],edges=new Map();
  const corners=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];
  const tetrahedra=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
  const point=id=>{const x=id%nx,y=Math.floor(id/nx)%ny,z=Math.floor(id/(nx*ny));return [low[0]+x*step[0],low[1]+y*step[1],low[2]+z*step[2]];};
  function gradient(id){
    const x=id%nx,y=Math.floor(id/nx)%ny,z=Math.floor(id/(nx*ny));
    return new THREE.Vector3(
      (grid[at(Math.min(nx-1,x+1),y,z)]-grid[at(Math.max(0,x-1),y,z)])/step[0],
      (grid[at(x,Math.min(ny-1,y+1),z)]-grid[at(x,Math.max(0,y-1),z)])/step[1],
      (grid[at(x,y,Math.min(nz-1,z+1))]-grid[at(x,y,Math.max(0,z-1))])/step[2],
    ).normalize();
  }
  function crossing(a,b){
    const key=a<b?a*grid.length+b:b*grid.length+a;if(edges.has(key))return edges.get(key);
    const t=grid[a]/(grid[a]-grid[b]),pa=point(a),pb=point(b),index=positions.length/3;
    positions.push(...pa.map((p,i)=>p+(pb[i]-p)*t));normals.push(...gradient(a).lerp(gradient(b),t).normalize().toArray());edges.set(key,index);return index;
  }
  function triangle(a,b,c,inside,outside){
    const va=new THREE.Vector3().fromArray(positions,a*3),vb=new THREE.Vector3().fromArray(positions,b*3),vc=new THREE.Vector3().fromArray(positions,c*3);
    const normal=vb.sub(va).cross(vc.sub(va)),direction=new THREE.Vector3().fromArray(point(outside)).sub(new THREE.Vector3().fromArray(point(inside)));
    if(normal.dot(direction)>0)indices.push(a,b,c);else indices.push(a,c,b);
  }
  for(let z=0;z<nz-1;z++)for(let y=0;y<ny-1;y++)for(let x=0;x<nx-1;x++){
    const ids=corners.map(([dx,dy,dz])=>at(x+dx,y+dy,z+dz));
    if(ids.every(id=>grid[id]>=0)||ids.every(id=>grid[id]<0))continue;
    for(const tetra of tetrahedra){
      const inside=tetra.map(i=>ids[i]).filter(i=>grid[i]<0),outside=tetra.map(i=>ids[i]).filter(i=>grid[i]>=0);
      if(!inside.length||!outside.length)continue;
      if(inside.length===1){const a=inside[0];triangle(...outside.map(b=>crossing(a,b)),a,outside[0]);}
      else if(outside.length===1){const b=outside[0];triangle(...inside.map(a=>crossing(a,b)),inside[0],b);}
      else{const [a,b]=inside,[c,d]=outside,ac=crossing(a,c),ad=crossing(a,d),bc=crossing(b,c),bd=crossing(b,d);triangle(ac,bc,ad,a,c);triangle(ad,bc,bd,a,c);}
    }
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setIndex(indices);
  const boneIndices=[],boneWeights=[];
  for(let i=0;i<positions.length;i+=3){const skin=skinAt(positions[i],positions[i+1]);boneIndices.push(...skin.indices);boneWeights.push(...skin.weights);}
  geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(boneIndices,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(boneWeights,4));
  const border=geometry.clone(),p=border.attributes.position,n=border.attributes.normal;
  for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)+n.getX(i)*.032,p.getY(i)+n.getY(i)*.032,p.getZ(i)+n.getZ(i)*.032);
  const model={geometry,border,points,volume};models.set(male,model);return model;
}

function addMesh(parent,geometry,material,x=0,y=0,z=0){const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;}
function moveBone(bone,pivot,rotation,translation=new THREE.Vector3()){
  bone.quaternion.copy(rotation);bone.position.copy(pivot).sub(pivot.clone().applyQuaternion(rotation)).add(translation);
}
function turnSegment(bone,start,end,newStart,newEnd){
  const oldDirection=end.clone().sub(start),newDirection=newEnd.clone().sub(newStart),axis=new THREE.Vector3(0,1,0);
  const inverseBind=new THREE.Quaternion().setFromUnitVectors(axis,oldDirection.clone().normalize()).invert();
  const rotation=new THREE.Quaternion().setFromUnitVectors(axis,newDirection.clone().normalize());
  bone.matrixAutoUpdate=false;
  bone.matrix.compose(newStart,rotation,new THREE.Vector3(1,newDirection.length()/oldDirection.length(),1))
    .multiply(new THREE.Matrix4().makeRotationFromQuaternion(inverseBind))
    .multiply(new THREE.Matrix4().makeTranslation(-start.x,-start.y,-start.z));
}
export function poseDogArm(arm,elbow,hand){
  turnSegment(arm.bones[0],arm.shoulder,arm.bindElbow,arm.shoulder,elbow);
  turnSegment(arm.bones[1],arm.bindElbow,arm.bindHand,elbow,hand);
  arm.hand.position.copy(hand);
}

export function makeDog(male=false){
  const root=new THREE.Group(),body=new THREE.Group();root.add(body);
  const model=sculpt(male),bones=Array.from({length:9},()=>new THREE.Bone());bones.forEach(b=>body.add(b));
  const skeleton=new THREE.Skeleton(bones);
  const fur=new THREE.MeshLambertMaterial({color:male?0xeed09d:0xfffef8,emissive:male?0xceb17d:0xffffff,emissiveIntensity:.20});
  const shell=new THREE.SkinnedMesh(model.geometry,fur),border=new THREE.SkinnedMesh(model.border,borderMaterial);
  shell.castShadow=true;shell.receiveShadow=false;shell.frustumCulled=false;border.frustumCulled=false;
  body.add(shell,border);shell.bind(skeleton);border.bind(skeleton);shell.renderOrder=1;
  const limbs={};
  for(const side of [-1,1]){
    const index=side<0?0:1,shoulder=new THREE.Vector3(side*.64,1.34,0),bindElbow=new THREE.Vector3(side*.84,1.14,0),bindHand=new THREE.Vector3(side*.96,.96,0);
    const hand=new THREE.Object3D();body.add(hand);
    limbs[index?'rightArm':'leftArm']={side,shoulder,upperLength:.31,lowerLength:.31,bindElbow,bindHand,hand,bones:[bones[1+index*2],bones[2+index*2]]};
    limbs[index?'rightLeg':'leftLeg']={bone:bones[5+index],pivot:new THREE.Vector3(side*.46,.43,0)};
  }
  const head=new THREE.Group();body.add(head);const eyes=[];
  const facePoint=(x,y,extra=.018)=>new THREE.Vector3(x,y,frontZ(model.volume,x,y)+extra);
  for(const side of [-1,1]){const p=facePoint(side*.17,1.82);const eye=addMesh(head,new THREE.SphereGeometry(.034,16,12),ink,p.x,p.y,p.z);eye.scale.z=.5;eyes.push(eye);}
  const nose=facePoint(0,1.735);addMesh(head,new THREE.SphereGeometry(.055,18,12),ink,nose.x,nose.y,nose.z).scale.set(1.1,.82,.55);
  const mouth=[[[0,1.71],[0,1.61],[-.085,1.575],[-.19,1.62]],[[0,1.61],[.085,1.575],[.19,1.62]]];
  for(const stroke of mouth)addMesh(head,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(stroke.map(([x,y])=>facePoint(x,y,.022))),22,.023,8,false),ink);
  if(male){
    const collar=[];
    for(let i=0;i<80;i++){
      const a=i*Math.PI*2/80,front=Math.cos(a),y=1.49-.095*Math.max(0,front);
      let lo=.3,hi=.9;for(let k=0;k<16;k++){const mid=(lo+hi)/2;if(signedDistance(model.points,mid,y)<0)lo=mid;else hi=mid;}
      const x=Math.sin(a)*(lo-.012),z=frontZ(model.volume,x,y)*Math.sign(front);
      collar.push(new THREE.Vector3(x,y,z+Math.sign(front)*.014));
    }
    addMesh(body,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(collar,true),100,.033,10,true),new THREE.MeshBasicMaterial({color:0xef8f82}));
  }
  const tail=new THREE.Group();tail.position.set(0,.65,-frontZ(model.volume,0,.65)+.018);body.add(tail);
  const tailCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(.08,.04,-.24),new THREE.Vector3(.22,.14,-.34),new THREE.Vector3(.27,.25,-.27)]);
  addMesh(tail,new THREE.TubeGeometry(tailCurve,18,.026,8,false),ink);
  root.userData={body,head,limbs,eyes,tail,bones,skeleton,kind:'dog',male,walkMix:0,phase:0};
  animateDog(root,0,false);return root;
}

export function animateDog(avatar,t,moving,jump=0,paired=false,dt=1/60){
  const data=avatar.userData,{body,limbs,bones}=data;
  data.walkMix=THREE.MathUtils.damp(data.walkMix,moving?1:0,14,dt);data.phase+=dt*(moving?10:3)*data.walkMix;
  const stride=Math.sin(data.phase),mix=data.walkMix,jumping=jump>.03;
  body.position.set(0,jump+Math.abs(stride)*.055*mix,0);body.rotation.set(0,0,stride*.035*mix);
  for(const [index,name] of ['leftLeg','rightLeg'].entries()){
    const leg=limbs[name],angle=jumping?(index?-.25:.25):stride*(index?-.45:.45)*mix;
    const lift=jumping?0:Math.max(0,.40*Math.cos(angle)+.33*Math.abs(Math.sin(angle))-.415);
    moveBone(leg.bone,leg.pivot,new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),angle),new THREE.Vector3(0,lift,0));
  }
  for(const [index,name] of ['leftArm','rightArm'].entries()){
    const arm=limbs[name],hand=arm.bindHand.clone(),elbow=arm.bindElbow.clone();
    hand.x+=arm.side*(jumping?.10:Math.sin(t*1.7)*.009);hand.y+=jumping?.28:0;hand.z+=(index?1:-1)*stride*.17*mix;
    elbow.y+=jumping?.12:0;elbow.z=hand.z*.50;poseDogArm(arm,elbow,hand);
  }
  for(const side of [-1,1]){
    const index=side<0?0:1,pivot=new THREE.Vector3(side*.70,1.91,0),angle=side*(Math.sin(data.phase+.5)*.12*mix+(jumping?.15:Math.sin(t*1.8)*.016));
    moveBone(bones[7+index],pivot,new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),angle));
  }
  data.tail.rotation.y=Math.sin(t*7)*.35;data.tail.rotation.z=Math.sin(t*7)*.12;
  const blink=(t+(data.male?.4:0))%4.6;for(const eye of data.eyes)eye.scale.y=blink>4.44?.13:1;
}
