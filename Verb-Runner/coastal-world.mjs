import * as THREE from 'three';
import { COASTAL_SCENE } from './coastal-scene-config.mjs';

const DEG=Math.PI/180; // degrees to radians
const SEA_COLOR=0x159fc5;
const SKY_COLOR=0x8fd4ef;
const ROAD_WIDTH=12;
const LEFT_PROMENADE_WIDTH=4.5;
const RIGHT_SIDEWALK_WIDTH=2.35;
const SEA_WALL_X=-10.42;
const VILLAGE_X=8.35;
const NEAR_SPAN=195;
const FAR_SPAN=235;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const COASTAL_V4_PALETTE=Object.freeze({
  terracotta:0xc86f46,
  terracottaLight:0xdf8a5c,
  mountain:0x5d8268,
  mountainLight:0x769b7d,
  foothill:0x8aaa74,
  seaDeep:0x148faf,
  seaShallow:0x64d0da
});

function mat(color,roughness=.78,metalness=.02){
  return new THREE.MeshStandardMaterial({color,roughness,metalness});
}
function toon(color){
  return new THREE.MeshToonMaterial({color});
}
function basic(color,opacity=1){
  return new THREE.MeshBasicMaterial({
    color,transparent:opacity<1,opacity,depthWrite:opacity>=1,toneMapped:false
  });
}

const MATERIALS={
  road:mat(COASTAL_SCENE.roadColor,.94,0),
  sidewalk:mat(COASTAL_SCENE.sidewalkColor,.88,0),
  curb:mat(0xe8ddcd,.9,0),
  promenade:mat(0xead9c2,.92,0),
  rail:mat(0x233c48,.52,.34),
  lampMetal:mat(0x263b45,.42,.45),
  glass:new THREE.MeshPhysicalMaterial({
    color:0xc5eff6,roughness:.16,metalness:0,transmission:.18,
    transparent:true,opacity:.88
  }),
  sea:new THREE.MeshPhysicalMaterial({
    color:SEA_COLOR,roughness:.25,metalness:.02,
    transparent:true,opacity:.97
  }),
  shallow:new THREE.MeshPhysicalMaterial({
    color:0x55cddd,roughness:.28,metalness:0,transparent:true,opacity:.78
  }),
  foam:basic(0xdff8f4,.46),
  wood:mat(0x8e5c38,.78,0),
  darkWood:mat(0x5c3b2b,.75,0),
  terracotta:mat(COASTAL_V4_PALETTE.terracotta,.83,0),
  terracottaLight:mat(COASTAL_V4_PALETTE.terracottaLight,.83,0),
  trim:mat(0xf0e3cc,.8,0),
  trimDark:mat(0x3c545a,.72,.06),
  glassWindow:new THREE.MeshPhysicalMaterial({
    color:0x6db8c9,roughness:.22,metalness:.04,transparent:true,opacity:.86
  }),
  warmGlass:new THREE.MeshBasicMaterial({color:0xffd58a,toneMapped:false}),
  blackboard:mat(0x37423d,.8,0),
  fabricRed:mat(0xd9584f,.82,0),
  fabricBlue:mat(0x3c96bd,.82,0),
  fabricCream:mat(0xf6e8c8,.86,0),
  stone:mat(0xcfc9bb,.9,0),
  mountain:mat(COASTAL_V4_PALETTE.mountain,.97,0),
  mountainLight:mat(COASTAL_V4_PALETTE.mountainLight,.97,0),
  foothill:mat(COASTAL_V4_PALETTE.foothill,.97,0),
  trunk:mat(0x86583c,.9,0),
  palmTrunk:mat(0x9b6c43,.88,0),
  leafA:toon(0x3d8e4f),
  leafB:toon(0x59a14d),
  leafC:toon(0x2f7b46),
  palmLeaf:toon(0x2f8d5a),
  flowerPink:toon(0xf36e7d),
  flowerYellow:toon(0xffc954),
  flowerPurple:toon(0xd77bd0),
  flowerRed:toon(0xee5f4e)
};

const WALLS=[
  mat(0xf0c77d,.9,0),
  mat(0xf3dda7,.9,0),
  mat(0xf4ead4,.9,0),
  mat(0xdde7d5,.9,0),
  mat(0xedc3a5,.9,0),
  mat(0xf1dfc8,.9,0),
  mat(0xe7d1b5,.9,0)
];
const SHUTTERS=[
  mat(0x3c7b68,.78,.02),
  mat(0x4f8872,.78,.02),
  mat(0x4b7987,.78,.02)
];

applySurfaceTextures();

const GEO={
  cube:new THREE.BoxGeometry(1,1,1),
  cylinder8:new THREE.CylinderGeometry(.5,.5,1,8),
  cylinder12:new THREE.CylinderGeometry(.5,.5,1,12),
  sphere12:new THREE.IcosahedronGeometry(.5,2),
  sphereLow:new THREE.IcosahedronGeometry(.5,1),
  flower:new THREE.IcosahedronGeometry(.5,1),
  pot:new THREE.CylinderGeometry(.42,.31,.65,12),
  fruit:new THREE.IcosahedronGeometry(.5,1)
};


function createOrganicFoliageGeometry(detail=2,seed=1){
  const geo=new THREE.IcosahedronGeometry(.5,detail).toNonIndexed();
  const pos=geo.attributes.position;
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
    const n=Math.sin((x*17.31+y*29.17+z*43.73+seed*7.11))*0.5+
      Math.sin((x*31.7-y*13.9+z*19.3+seed*3.17))*0.5;
    const scale=1+n*.075;
    pos.setXYZ(i,x*scale,y*scale,z*scale);
  }
  geo.computeVertexNormals();
  return geo;
}

const ORGANIC_FOLIAGE=[
  createOrganicFoliageGeometry(2,1),
  createOrganicFoliageGeometry(2,2),
  createOrganicFoliageGeometry(2,3)
];

function addArchedOpening(group,faceX,y,z,width=.95,height=1.9,material=MATERIALS.darkWood){
  addBox(group,.10,height-width*.48,width,material,faceX,y-(width*.22),z,{cast:false});
  const arch=new THREE.Mesh(
    new THREE.TorusGeometry(width*.5,.075,8,24,Math.PI),
    MATERIALS.trimDark
  );
  arch.rotation.set(0,Math.PI/2,Math.PI/2);
  arch.position.set(faceX-.07,y+height*.34,z);
  arch.castShadow=false;
  group.add(arch);
  for(const dz of [-width*.48,width*.48]){
    addBox(group,.09,height*.62,.08,MATERIALS.trim,faceX-.09,y-height*.12,z+dz,{cast:false});
  }
}

function addRoofTileRows(group,width,depth,height,material=MATERIALS.terracotta){
  const rows=5;
  for(let i=0;i<rows;i++){
    const t=(i+.45)/rows;
    const x=-width*.52+t*width;
    const rise=height*(1-Math.abs(t-.5)*2);
    const ridge=addBox(group,.10,.08,depth+.44,material,x,rise+.08,0,{cast:false});
    ridge.rotation.z=(t<.5?-1:1)*27*DEG;
  }
  for(const z of [-depth*.5,depth*.5]){
    const cap=addBox(group,width+.38,.09,.12,MATERIALS.terracottaLight,0,.05,z,{cast:false});
    cap.rotation.z=0;
  }
}

function addChimney(group,width,height,depth,index=0){
  const x=(index%2?.22:-.18)*width;
  const z=(index%3-.9)*depth*.18;
  addBox(group,.48,1.05,.48,MATERIALS.trim,x,height+.45,z);
  addBox(group,.62,.12,.62,MATERIALS.terracotta,x,height+1.02,z);
}

function createPergola(width=2.8,depth=1.8){
  const g=new THREE.Group();
  for(const z of [-depth*.46,depth*.46]){
    for(const x of [-width*.46,width*.46]){
      addBox(g,.10,2.15,.10,MATERIALS.darkWood,x,1.08,z);
    }
  }
  for(let i=0;i<7;i++){
    addBox(g,width,.09,.11,MATERIALS.wood,0,2.17,-depth*.46+i*(depth*.92/6));
  }
  for(const x of [-width*.46,width*.46])addBox(g,.12,.12,depth,MATERIALS.darkWood,x,2.12,0);
  return g;
}

function addBougainvillea(group,faceX,y,z,scale=1){
  const vine=mesh(new THREE.CylinderGeometry(.025,.04,2.2*scale,6),MATERIALS.trunk,{cast:false});
  vine.position.set(faceX-.14,y,z);
  vine.rotation.z=.16;
  group.add(vine);
  for(let i=0;i<9;i++){
    const a=i*2.399;
    const foliage=mesh(ORGANIC_FOLIAGE[i%ORGANIC_FOLIAGE.length],i%3===0?MATERIALS.flowerPink:MATERIALS.leafB,{cast:false});
    foliage.scale.set(.22*scale,.27*scale,.20*scale);
    foliage.position.set(faceX-.18,y-.82*scale+i*.19*scale,z+Math.sin(a)*.48*scale);
    group.add(foliage);
  }
}

function createCypress(scale=1){
  const g=new THREE.Group();
  const trunk=mesh(new THREE.CylinderGeometry(.08*scale,.12*scale,2.0*scale,8),MATERIALS.trunk);
  trunk.position.y=1.0*scale;
  g.add(trunk);
  for(let i=0;i<5;i++){
    const crown=mesh(new THREE.ConeGeometry((.55-i*.065)*scale,1.35*scale,10),MATERIALS.leafC);
    crown.position.y=(1.55+i*.50)*scale;
    g.add(crown);
  }
  return g;
}

function createIrregularMountain(radius,height,seed=1,segments=34,rings=9){
  const positions=[];
  const indices=[];
  for(let r=0;r<=rings;r++){
    const t=r/rings;
    const profile=Math.pow(Math.max(.025,1-t),.58);
    for(let s=0;s<segments;s++){
      const a=s/segments*Math.PI*2;
      const jag=.86+
        .11*Math.sin(a*3.1+seed*1.7)+
        .06*Math.sin(a*7.3+seed*2.9)+
        .035*Math.sin(a*13.7+seed);
      const asym=1+.12*Math.sin(a+seed*.7);
      const rr=radius*profile*jag*asym;
      positions.push(
        Math.cos(a)*rr,
        height*t + Math.sin(a*4+seed)*radius*.012*(1-t),
        Math.sin(a)*rr*.70
      );
    }
  }
  for(let r=0;r<rings;r++){
    for(let s=0;s<segments;s++){
      const n=(s+1)%segments;
      const a=r*segments+s,b=r*segments+n,c=(r+1)*segments+s,d=(r+1)*segments+n;
      indices.push(a,c,b,b,c,d);
    }
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function createMountainLayer(specs,material){
  const g=new THREE.Group();
  specs.forEach(([x,y,z,r,h,seed])=>{
    const m=mesh(createIrregularMountain(r,h,seed),material,{cast:false,receive:false});
    m.position.set(x,y,z);
    g.add(m);
  });
  return g;
}

function createWaterMaterial(animators){
  const uniforms={
    uTime:{value:0},
    uDeep:{value:new THREE.Color(0x0f86ad)},
    uShallow:{value:new THREE.Color(0x55cddd)},
    uSky:{value:new THREE.Color(0xcdeef3)}
  };
  const material=new THREE.ShaderMaterial({
    uniforms,
    transparent:true,
    opacity:.98,
    side:THREE.DoubleSide,
    vertexShader:`
      uniform float uTime;
      varying float vWave;
      varying vec2 vUv2;
      void main(){
        vec3 p=position;
        float w1=sin((p.x+uTime*2.0)*0.22)*0.11;
        float w2=sin((p.y-uTime*1.35)*0.31)*0.075;
        float w3=sin((p.x+p.y+uTime*.9)*0.14)*0.055;
        p.z+=w1+w2+w3;
        vWave=w1+w2+w3;
        vUv2=uv;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
      }`,
    fragmentShader:`
      uniform float uTime;
      uniform vec3 uDeep;
      uniform vec3 uShallow;
      uniform vec3 uSky;
      varying float vWave;
      varying vec2 vUv2;
      void main(){
        float shore=smoothstep(.03,.42,vUv2.x);
        float shimmer=.5+.5*sin((vUv2.x*86.0+vUv2.y*57.0)+uTime*2.1);
        float line=smoothstep(.94,1.0,shimmer)*.10;
        vec3 water=mix(uShallow,uDeep,shore);
        water=mix(water,uSky,clamp(.08+vWave*.35+line,0.0,.22));
        gl_FragColor=vec4(water,.97);
      }`
  });
  animators.push(time=>{uniforms.uTime.value=time;});
  return material;
}

function createBellTower(){
  const g=new THREE.Group();
  addBox(g,1.35,5.4,1.35,MATERIALS.trim,0,2.7,0,{cast:false});
  for(const z of [-.33,.33]){
    const opening=mesh(new THREE.CylinderGeometry(.17,.17,.18,14),MATERIALS.darkWood,{cast:false});
    opening.rotation.z=Math.PI/2;
    opening.position.set(-.70,4.35,z);
    g.add(opening);
  }
  const roof=new THREE.Mesh(new THREE.ConeGeometry(1.06,1.7,4),MATERIALS.terracotta);
  roof.rotation.y=45*DEG;
  roof.position.y=6.15;
  roof.castShadow=false;
  g.add(roof);
  const crossV=addBox(g,.08,.72,.08,MATERIALS.rail,0,7.15,0,{cast:false});
  const crossH=addBox(g,.08,.08,.52,MATERIALS.rail,0,7.24,0,{cast:false});
  return g;
}

function createAtmosphericHaze(scene){
  const layers=[
    {z:-155,w:150,h:18,o:.085,c:0xdceff0},
    {z:-205,w:170,h:22,o:.12,c:0xe9eadb}
  ];
  for(const layer of layers){
    const veil=new THREE.Mesh(
      new THREE.PlaneGeometry(layer.w,layer.h),
      new THREE.MeshBasicMaterial({color:layer.c,transparent:true,opacity:layer.o,depthWrite:false,fog:false,toneMapped:false})
    );
    veil.position.set(0,8,layer.z);
    scene.add(veil);
  }
}


function makeCanvasTexture(size,draw){
  const canvas=document.createElement('canvas');
  canvas.width=size;
  canvas.height=size;
  const ctx=canvas.getContext('2d');
  draw(ctx,size);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.anisotropy=4;
  return texture;
}

function createStuccoTexture(){
  const texture=makeCanvasTexture(256,(ctx,size)=>{
    ctx.fillStyle='#faf7ef';
    ctx.fillRect(0,0,size,size);
    for(let i=0;i<1800;i++){
      const x=(Math.sin(i*12.9898)*43758.5453)%1;
      const y=(Math.sin(i*78.233)*12345.6789)%1;
      const px=Math.abs(x)*size,py=Math.abs(y)*size;
      const a=.018+(i%7)*.004;
      ctx.fillStyle=i%3===0?`rgba(120,102,82,${a})`:`rgba(255,255,255,${a})`;
      ctx.fillRect(px,py,1+(i%2),1+(i%3===0));
    }
    ctx.strokeStyle='rgba(135,112,86,.06)';
    for(let y=24;y<size;y+=43){
      ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(size,y+2);ctx.stroke();
    }
  });
  texture.repeat.set(2.5,3.5);
  return texture;
}

function createPaverTexture(){
  const texture=makeCanvasTexture(256,(ctx,size)=>{
    ctx.fillStyle='#eadfce';ctx.fillRect(0,0,size,size);
    const w=64,h=42;
    ctx.strokeStyle='rgba(115,104,91,.20)';
    ctx.lineWidth=2;
    for(let row=0;row<7;row++){
      const offset=row%2?w/2:0;
      for(let col=-1;col<5;col++){
        const x=col*w+offset,y=row*h;
        ctx.strokeRect(x,y,w,h);
      }
    }
    for(let i=0;i<220;i++){
      const x=Math.abs(Math.sin(i*18.17))*size;
      const y=Math.abs(Math.sin(i*7.31+1.7))*size;
      ctx.fillStyle='rgba(130,110,90,.035)';
      ctx.fillRect(x,y,2,2);
    }
  });
  texture.repeat.set(3.2,18);
  return texture;
}

function createRoofTileTexture(){
  const texture=makeCanvasTexture(256,(ctx,size)=>{
    ctx.fillStyle='#b95f3d';ctx.fillRect(0,0,size,size);
    for(let row=0;row<9;row++){
      for(let col=0;col<12;col++){
        const x=col*24+(row%2?12:0),y=row*30;
        ctx.strokeStyle='rgba(92,45,31,.34)';
        ctx.lineWidth=2;
        ctx.beginPath();
        ctx.arc(x,y,13,0,Math.PI);
        ctx.stroke();
        ctx.fillStyle='rgba(255,192,135,.07)';
        ctx.fillRect(x-9,y+2,18,2);
      }
    }
  });
  texture.repeat.set(4,3);
  return texture;
}

function applySurfaceTextures(){
  const stucco=createStuccoTexture();
  const pavers=createPaverTexture();
  const roof=createRoofTileTexture();
  MATERIALS.sidewalk.map=pavers;
  MATERIALS.promenade.map=pavers;
  MATERIALS.terracotta.map=roof;
  MATERIALS.terracottaLight.map=roof;
  MATERIALS.sidewalk.needsUpdate=MATERIALS.promenade.needsUpdate=true;
  MATERIALS.terracotta.needsUpdate=MATERIALS.terracottaLight.needsUpdate=true;
  WALLS.forEach((wall,index)=>{
    wall.map=stucco.clone();
    wall.map.repeat.set(2.2+(index%3)*.35,3.0+(index%2)*.45);
    wall.needsUpdate=true;
  });
}

function buildingVariant(index=0){
  return {
    trimDepth:.12+(index%3)*.025,
    balcony:index%4!==1,
    upperWindows:1+(index%2),
    lantern:index%3!==2,
    bunting:index%5===0,
    warmWindow:index%4===0
  };
}

function addFacadeTrim(group,faceX,width,height,variant){
  addBox(group,.08,.14,width-.55,MATERIALS.trim,faceX-.12,.48,0,{cast:false});
  addBox(group,.07,.11,width-.72,MATERIALS.trim,faceX-.13,height-.28,0,{cast:false});
  for(const z of [-width*.39,width*.39]){
    addBox(group,.065,height-.8,.08,MATERIALS.trim,faceX-.13,(height-.2)/2,z,{cast:false});
  }
  if(variant?.trimDepth>.14){
    addBox(group,.16,.12,width*.72,MATERIALS.stone,faceX-.16,2.66,0,{cast:false});
  }
}

function addWindowCluster(group,faceX,y,depth,count=2,{balcony=false,lit=false}={}){
  const span=depth*.58;
  for(let i=0;i<count;i++){
    const z=count===1?0:-span/2+i*(span/(count-1));
    addWindow(group,faceX,y,z,{shutters:true,balcony:balcony&&i===0,lit:lit&&i===count-1});
  }
}

function addWallLantern(group,faceX,y,z){
  const arm=addBox(group,.34,.055,.055,MATERIALS.lampMetal,faceX-.20,y+.18,z,{cast:false});
  arm.rotation.z=-.18;
  addBox(group,.16,.32,.22,MATERIALS.glass,faceX-.37,y,z,{cast:false});
  addBox(group,.19,.05,.25,MATERIALS.lampMetal,faceX-.37,y+.18,z,{cast:false});
  addBox(group,.19,.05,.25,MATERIALS.lampMetal,faceX-.37,y-.18,z,{cast:false});
}

function createBunting(width=14,count=15){
  const g=new THREE.Group();
  const colors=[0xf5c14d,0xe85f5a,0x4aa0c5,0x5aaa62,0xe98ab2];
  const flagGeo=new THREE.BufferGeometry();
  flagGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,.34,-.54,0,-.34,-.54,0],3));
  for(let i=0;i<count;i++){
    const flag=mesh(flagGeo,new THREE.MeshBasicMaterial({color:colors[i%colors.length],side:THREE.DoubleSide}),{cast:false,receive:false});
    const x=-width/2+(i+.5)*(width/count);
    flag.position.set(x,Math.sin(i*.7)*.12,0);
    g.add(flag);
  }
  addBox(g,width,.025,.025,MATERIALS.rail,0,.08,0,{cast:false});
  return g;
}

function createHangingSign(text='Café'){
  const g=new THREE.Group();
  addBox(g,.62,.055,.055,MATERIALS.lampMetal,-.31,.42,0,{cast:false});
  addBox(g,.055,.55,.055,MATERIALS.lampMetal,-.58,.18,0,{cast:false});
  const sign=createSign(text,{width:.92,height:.46,bg:'#5c3b2b',font:42});
  sign.position.set(-.62,-.02,0);
  g.add(sign);
  return g;
}

function createStreetUmbrella(scale=1,variant='warm'){
  const g=new THREE.Group();
  const pole=mesh(new THREE.CylinderGeometry(.035*scale,.045*scale,2.0*scale,8),MATERIALS.rail);
  pole.position.y=1.0*scale;g.add(pole);
  const canopyMat=variant==='blue'?MATERIALS.fabricBlue:MATERIALS.fabricRed;
  const canopy=mesh(new THREE.ConeGeometry(1.08*scale,.42*scale,16,1,true),canopyMat);
  canopy.position.y=2.03*scale;
  g.add(canopy);
  const cap=mesh(new THREE.CylinderGeometry(.07*scale,.07*scale,.18*scale,8),MATERIALS.terracottaLight);
  cap.position.y=2.30*scale;g.add(cap);
  return g;
}

function createCafeService(){
  const g=new THREE.Group();
  const counter=addBox(g,.72,1.05,1.75,MATERIALS.darkWood,0,.53,0);
  addBox(g,.78,.09,1.9,MATERIALS.stone,0,1.08,0);
  for(let i=0;i<4;i++){
    const cup=mesh(new THREE.CylinderGeometry(.075,.06,.13,10),MATERIALS.fabricCream,{cast:false});
    cup.position.set(-.44,1.20,-.58+i*.38);g.add(cup);
  }
  const umbrella=createStreetUmbrella(.72,'blue');
  umbrella.position.set(-1.25,0,.35);g.add(umbrella);
  return g;
}

function createMarketDisplay(){
  const g=new THREE.Group();
  for(let row=0;row<2;row++)for(let col=0;col<3;col++){
    const crate=createFruitCrate(20+row*3+col);
    crate.scale.setScalar(.86);
    crate.position.set(-row*.72,0,-1.05+col*1.02);
    g.add(crate);
  }
  const canopy=createStreetUmbrella(.78,'warm');
  canopy.position.set(-.45,0,2.0);g.add(canopy);
  return g;
}

function createSailboat(scale=1,color=0xffffff){
  const g=new THREE.Group();
  const hullMat=mat(0xf0eee8,.72,0);
  const hull=mesh(new THREE.CylinderGeometry(.34*scale,.56*scale,1.75*scale,12),hullMat,{cast:false});
  hull.rotation.z=Math.PI/2;
  hull.scale.z=.55;
  hull.position.y=.16*scale;
  g.add(hull);
  const mast=mesh(new THREE.CylinderGeometry(.025*scale,.035*scale,2.5*scale,7),MATERIALS.wood,{cast:false});
  mast.position.y=1.25*scale;g.add(mast);
  const sailGeo=new THREE.BufferGeometry();
  sailGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,0,2.05*scale,0,1.05*scale,.20*scale,0],3));
  sailGeo.computeVertexNormals();
  const sail=mesh(sailGeo,new THREE.MeshStandardMaterial({color,roughness:.8,side:THREE.DoubleSide}),{cast:false,receive:false});
  sail.position.set(.05,.34*scale,0);
  g.add(sail);
  return g;
}

function createWaterfrontBoats(scene,mobile=false){
  const boats=[
    [-24,-22,.72,0xfaf5df],[-39,-62,.54,0xf3d45c],[-18,-103,.46,0xf6eee0],[-48,-132,.42,0xf7f2e3]
  ];
  for(let i=0;i<(mobile?2:boats.length);i++){
    const [x,z,s,color]=boats[i];
    const boat=createSailboat(s,color);
    boat.position.set(x,.03,z);
    boat.rotation.y=(i%2?.28:-.18);
    scene.add(boat);
  }
}

function createShoreFoamRibbon(scene,mobile=false){
  const matFoam=new THREE.MeshBasicMaterial({color:0xeafdf8,transparent:true,opacity:.42,depthWrite:false,toneMapped:false});
  const count=mobile?8:15;
  for(let i=0;i<count;i++){
    const width=3.2+(i%4)*1.35;
    const ribbon=mesh(new THREE.PlaneGeometry(width,.10),matFoam,{cast:false,receive:false});
    ribbon.rotation.x=-Math.PI/2;
    ribbon.rotation.z=(i%3-1)*.035;
    ribbon.position.set(-12.6-(i%2)*1.25,-.026,-5-i*13.4);
    scene.add(ribbon);
  }
}

function createSunGlitter(scene,mobile=false){
  const glitterMat=new THREE.MeshBasicMaterial({color:0xfff1ba,transparent:true,opacity:.26,depthWrite:false,toneMapped:false});
  const count=mobile?16:34;
  for(let i=0;i<count;i++){
    const glint=mesh(new THREE.PlaneGeometry(.8+(i%5)*.45,.025),glitterMat,{cast:false,receive:false});
    glint.rotation.x=-Math.PI/2;
    glint.position.set(-20-(i%6)*4.4,-.018,-18-i*4.2);
    scene.add(glint);
  }
}


function cylinderBetween(a,b,r0,r1,material){
  const dir=new THREE.Vector3().subVectors(b,a);
  const len=dir.length();
  const m=mesh(new THREE.CylinderGeometry(r0,r1,len,9),material);
  m.position.copy(a).add(b).multiplyScalar(.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());
  return m;
}

function createNaturalTreeBranches(group,scale=1){
  const starts=[
    [0,2.85,0],[.03,3.05,.02],[-.03,3.18,-.01],[.02,3.28,.02],[0,3.38,0]
  ];
  const ends=[
    [-.75,4.18,.20],[.70,4.22,-.28],[-.42,4.58,-.52],[.38,4.62,.50],[.05,4.86,.12]
  ];
  for(let i=0;i<starts.length;i++){
    const a=new THREE.Vector3(...starts[i]).multiplyScalar(scale);
    const b=new THREE.Vector3(...ends[i]).multiplyScalar(scale);
    group.add(cylinderBetween(a,b,.055*scale,.115*scale,MATERIALS.trunk));
    const twigEnd=b.clone().add(new THREE.Vector3((i%2?.28:-.24)*scale,.35*scale,(i%3-.8)*.16*scale));
    group.add(cylinderBetween(b,twigEnd,.026*scale,.052*scale,MATERIALS.trunk));
  }
}

function createCanopyCluster(group,scale=1,mobile=false,seed=0){
  const clusters=mobile?11:18;
  for(let i=0;i<clusters;i++){
    const a=(i+seed*.31)*2.399;
    const ring=.28+(i%5)*.25;
    const leaf=mesh(ORGANIC_FOLIAGE[(i+seed)%ORGANIC_FOLIAGE.length],[MATERIALS.leafA,MATERIALS.leafB,MATERIALS.leafC][(i+seed)%3]);
    leaf.scale.set(
      (.90+(i%4)*.12)*scale,
      (.68+(i%3)*.13)*scale,
      (.92+((i+1)%4)*.11)*scale
    );
    leaf.position.set(
      Math.cos(a)*ring*scale,
      (4.30+(i%5)*.26)*scale,
      Math.sin(a)*ring*.82*scale
    );
    group.add(leaf);
  }
}

function createPalmFrondGeometry(){
  const shape=new THREE.Shape();
  shape.moveTo(0,0);
  shape.bezierCurveTo(.28,.28,.34,1.18,.18,2.28);
  shape.bezierCurveTo(.08,2.86,-.03,3.16,-.08,3.32);
  shape.bezierCurveTo(-.22,2.54,-.29,1.25,0,0);
  const geo=new THREE.ShapeGeometry(shape,10);
  return geo;
}

const PALM_FROND_V4=createPalmFrondGeometry();

function createBougainvilleaCascade(group,faceX,y,z,scale=1){
  const flowerMats=[MATERIALS.flowerPink,MATERIALS.flowerRed,MATERIALS.flowerPurple];
  for(let i=0;i<16;i++){
    const a=i*2.399;
    const leaf=mesh(ORGANIC_FOLIAGE[i%ORGANIC_FOLIAGE.length],i%3===0?flowerMats[i%flowerMats.length]:MATERIALS.leafB,{cast:false,receive:false});
    leaf.scale.set(.18*scale,.22*scale,.17*scale);
    leaf.position.set(
      faceX-.18-Math.abs(Math.sin(a))*.08,
      y-i*.12*scale,
      z+Math.sin(a)*.56*scale
    );
    group.add(leaf);
  }
}

function createAwningValance(width,variant='red'){
  const g=new THREE.Group();
  const count=10;
  const mats=variant==='blue'?[MATERIALS.fabricBlue,MATERIALS.fabricCream]:[MATERIALS.fabricRed,MATERIALS.fabricCream];
  for(let i=0;i<count;i++){
    const flap=mesh(new THREE.CylinderGeometry(width/count*.40,width/count*.40,.12,10,1,false,0,Math.PI),mats[i%2]);
    flap.rotation.z=Math.PI/2;
    flap.position.set(0,-.08,-width/2+(i+.5)*width/count);
    g.add(flap);
  }
  return g;
}

function addRoofEdgeTiles(group,width,depth,height){
  const count=Math.max(8,Math.floor(depth/.36));
  for(const side of [-1,1]){
    for(let i=0;i<count;i++){
      const tile=mesh(new THREE.CylinderGeometry(.055,.055,.28,8),i%2?MATERIALS.terracotta:MATERIALS.terracottaLight,{cast:false});
      tile.rotation.z=Math.PI/2;
      tile.position.set(side*(width/2+.27),height+.08,-depth/2+(i+.5)*depth/count);
      group.add(tile);
    }
  }
}

function createPromenadePlanterCluster(){
  const g=new THREE.Group();
  const sizes=[.82,.62,.54];
  const positions=[[-.35,0,-.42],[.30,0,.12],[-.15,0,.55]];
  for(let i=0;i<positions.length;i++){
    const p=createPot(sizes[i],true);
    p.position.set(...positions[i]);
    g.add(p);
  }
  const low=mesh(ORGANIC_FOLIAGE[1],MATERIALS.leafC,{cast:false});
  low.scale.set(.62,.28,.42);
  low.position.set(.15,.42,-.34);
  g.add(low);
  return g;
}

function createCafeTerraceCluster(){
  const g=new THREE.Group();
  const umbrella=createStreetUmbrella(.72,'blue');
  umbrella.position.set(0,0,0);
  g.add(umbrella);
  for(const z of [-.66,.68]){
    const table=mesh(new THREE.CylinderGeometry(.32,.32,.07,14),MATERIALS.wood);
    table.position.set(.72,.70,z);g.add(table);
    const stem=mesh(new THREE.CylinderGeometry(.045,.055,.65,8),MATERIALS.rail);
    stem.position.set(.72,.35,z);g.add(stem);
  }
  return g;
}

function createSeasideBanner(text='GOOD FOOD\nBRIGHTER DAYS'){
  const g=new THREE.Group();
  addBox(g,.09,2.65,.09,MATERIALS.darkWood,0,1.32,0);
  addBox(g,.95,.08,.08,MATERIALS.darkWood,.42,2.38,0);
  const sign=createSign(text,{width:1.05,height:1.38,bg:'#d8b25e',fg:'#47351d',font:34});
  sign.rotation.y=0;
  sign.position.set(.42,1.56,.02);
  g.add(sign);
  return g;
}

function createCoastalHillside(scene){
  const hillMat=mat(0x87a872,.98,0);
  const hill=mesh(createIrregularMountain(38,20,21,42,7),hillMat,{cast:false,receive:false});
  hill.scale.set(1.35,.62,.66);
  hill.position.set(6,-5,-215);
  scene.add(hill);
  return hill;
}

function createTownTerrace(town,{row=0,count=10,mobile=false}={}){
  for(let i=0;i<count;i++){
    const house=createTinyHouse(row*17+i);
    const scale=.62+(i%4)*.055-(row*.035);
    house.scale.setScalar(scale);
    const x=-15+i*3.4+(row%2)*1.35;
    const y=1.6+row*1.55+Math.sin(i*.75+row)*.48;
    const z=-178-row*5.0-i*.32;
    house.position.set(x,y,z);
    house.rotation.y=(Math.sin(i*1.3+row)*7)*DEG;
    town.add(house);
    if(!mobile&&i%4===1){
      const cypress=createCypress(.27+row*.015);
      cypress.position.set(x+1.15,y-.10,z-.7);
      town.add(cypress);
    }
  }
}

function createLayeredHillsideTown(scene,mobile=false){
  const town=new THREE.Group();
  const rows=mobile?3:5;
  for(let row=0;row<rows;row++){
    createTownTerrace(town,{row,count:mobile?7:11,mobile});
  }
  const tower=createBellTower();
  tower.scale.setScalar(.60);
  tower.position.set(17.5,4.1,-194);
  town.add(tower);
  scene.add(town);
  return town;
}

function mesh(geometry,material,{cast=true,receive=true}={}){
  const m=new THREE.Mesh(geometry,material);
  m.castShadow=cast;
  m.receiveShadow=receive;
  return m;
}
function addBox(group,w,h,d,material,x=0,y=0,z=0,opts={}){
  const m=mesh(GEO.cube,material,opts);
  m.scale.set(w,h,d);
  m.position.set(x,y,z);
  group.add(m);
  return m;
}
function addCylinder(group,rTop,rBottom,h,material,x=0,y=0,z=0,segments=10){
  const g=new THREE.CylinderGeometry(rTop,rBottom,h,segments);
  const m=mesh(g,material);
  m.position.set(x,y,z);
  group.add(m);
  return m;
}

function createSkyDome(scene){
  const geometry=new THREE.SphereGeometry(245,32,18);
  const material=new THREE.ShaderMaterial({
    side:THREE.BackSide,
    depthWrite:false,
    fog:false,
    toneMapped:false,
    uniforms:{
      topColor:{value:new THREE.Color(0x43aee7)},
      horizonColor:{value:new THREE.Color(SKY_COLOR)},
      lowColor:{value:new THREE.Color(0xe8f2ec)}
    },
    vertexShader:`
      varying vec3 vWorld;
      void main(){
        vec4 worldPosition=modelMatrix*vec4(position,1.0);
        vWorld=worldPosition.xyz;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
      }`,
    fragmentShader:`
      varying vec3 vWorld;
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      uniform vec3 lowColor;
      void main(){
        float h=normalize(vWorld).y;
        float upper=smoothstep(0.02,0.72,h);
        float lower=smoothstep(-0.18,0.08,h);
        vec3 base=mix(lowColor,horizonColor,lower);
        vec3 col=mix(base,topColor,upper);
        gl_FragColor=vec4(col,1.0);
      }`
  });
  const dome=new THREE.Mesh(geometry,material);
  dome.frustumCulled=false;
  scene.add(dome);

  const cloudMat=basic(0xffffff,.64);
  const cloudData=[
    [-45,28,-115,1.25],[36,30,-130,1.1],[-2,35,-175,1.35],[62,24,-195,.95]
  ];
  for(const [x,y,z,s] of cloudData){
    const cloud=new THREE.Group();
    const blobs=[
      [-2.1,0,0,2.4,1.05,.8],[0,0.45,0,2.8,1.45,1],
      [2.5,.1,0,2.3,1.0,.75],[4.2,-.1,.1,1.45,.72,.58]
    ];
    for(const [bx,by,bz,sx,sy,sz] of blobs){
      const b=mesh(GEO.sphere12,cloudMat,{cast:false,receive:false});
      b.scale.set(sx*s,sy*s,sz*s);
      b.position.set(bx*s,by*s,bz*s);
      cloud.add(b);
    }
    cloud.position.set(x,y,z);
    scene.add(cloud);
  }
}

function createGableRoof(width,depth,height,material){
  const hw=width/2,hd=depth/2;
  const vertices=new Float32Array([
    -hw,0,-hd,  hw,0,-hd,  0,height,-hd,
    -hw,0, hd,  hw,0, hd,  0,height, hd
  ]);
  const indices=[
    0,1,2, 3,5,4,
    0,2,5, 0,5,3,
    1,4,5, 1,5,2,
    0,3,4, 0,4,1
  ];
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(vertices,3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return mesh(geo,material);
}

function createSign(text,{width=1.75,height=.55,bg='#5c3b2b',fg='#fff1d6',font=54}={}){
  const canvas=document.createElement('canvas');
  canvas.width=512;
  canvas.height=192;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle=bg;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle='rgba(255,255,255,.22)';
  ctx.lineWidth=8;
  ctx.strokeRect(7,7,canvas.width-14,canvas.height-14);
  ctx.fillStyle=fg;
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.font=`800 ${font}px system-ui, sans-serif`;
  const lines=String(text).split('\n');
  const lineH=font*1.06;
  const start=canvas.height/2-(lines.length-1)*lineH/2;
  lines.forEach((line,i)=>ctx.fillText(line,canvas.width/2,start+i*lineH));
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.minFilter=THREE.LinearFilter;
  texture.magFilter=THREE.LinearFilter;
  const plane=new THREE.Mesh(
    new THREE.PlaneGeometry(width,height),
    new THREE.MeshBasicMaterial({map:texture,transparent:true,toneMapped:false})
  );
  plane.rotation.y=-Math.PI/2;
  plane.castShadow=false;
  plane.receiveShadow=false;
  return plane;
}

function addWindow(group,faceX,y,z,{shutters=true,balcony=false,lit=false}={}){
  addBox(group,.10,1.08,.98,MATERIALS.trimDark,faceX,y,z,{cast:false});
  addBox(group,.055,.88,.79,lit?MATERIALS.warmGlass:MATERIALS.glassWindow,faceX-.075,y,z,{cast:false});
  if(shutters){
    const shutterMat=SHUTTERS[Math.abs(Math.round(z*7))%SHUTTERS.length];
    addBox(group,.08,1.02,.28,shutterMat,faceX-.12,y,z-.64,{cast:false});
    addBox(group,.08,1.02,.28,shutterMat,faceX-.12,y,z+.64,{cast:false});
    for(const dz of [-.07,.07]){
      addBox(group,.035,.76,.03,MATERIALS.trimDark,faceX-.17,y,z-.64+dz,{cast:false});
      addBox(group,.035,.76,.03,MATERIALS.trimDark,faceX-.17,y,z+.64+dz,{cast:false});
    }
  }
  if(balcony){
    addBox(group,.72,.12,2.05,MATERIALS.stone,faceX-.40,y-.72,z);
    addBox(group,.06,.70,.07,MATERIALS.rail,faceX-.72,y-.40,z-1.00);
    addBox(group,.06,.70,.07,MATERIALS.rail,faceX-.72,y-.40,z+1.00);
    addBox(group,.06,.08,2.08,MATERIALS.rail,faceX-.72,y-.10,z);
    for(const dz of [-.75,-.25,.25,.75]){
      addBox(group,.045,.64,.045,MATERIALS.rail,faceX-.72,y-.42,z+dz);
    }
    addFlowerBox(group,faceX-.78,y-.02,z,.82);
  }
}

function addDoor(group,faceX,z=0,wide=false){
  const width=wide?1.55:.92;
  addBox(group,.12,1.95,width,MATERIALS.darkWood,faceX,1.0,z);
  addBox(group,.06,1.62,width-.19,MATERIALS.glassWindow,faceX-.08,1.08,z,{cast:false});
  addBox(group,.035,.07,.07,MATERIALS.terracottaLight,faceX-.15,1.0,z+(wide?.48:.25),{cast:false});
}

function addFlowerBox(group,x,y,z,scale=1){
  addBox(group,.42*scale,.30*scale,1.42*scale,MATERIALS.terracotta,x,y,z);
  const colors=[MATERIALS.flowerPink,MATERIALS.flowerYellow,MATERIALS.flowerPurple,MATERIALS.flowerRed];
  for(let i=0;i<8;i++){
    const f=mesh(GEO.flower,colors[i%colors.length],{cast:false,receive:false});
    f.scale.setScalar(.16*scale);
    f.position.set(x-.05*scale,y+.30*scale,z-.54*scale+(i%4)*.36*scale);
    group.add(f);
  }
}

function createPot(scale=1,flowered=true){
  const g=new THREE.Group();
  const pot=mesh(GEO.pot,MATERIALS.terracotta);
  pot.scale.setScalar(scale);
  pot.position.y=.32*scale;
  g.add(pot);
  if(flowered){
    const foliage=mesh(GEO.sphereLow,MATERIALS.leafB,{cast:false});
    foliage.scale.set(.55*scale,.48*scale,.55*scale);
    foliage.position.y=.82*scale;
    g.add(foliage);
    for(let i=0;i<5;i++){
      const f=mesh(GEO.flower,[MATERIALS.flowerPink,MATERIALS.flowerYellow,MATERIALS.flowerPurple][i%3],{cast:false,receive:false});
      f.scale.setScalar(.14*scale);
      f.position.set(Math.sin(i*2.2)*.30*scale,1.05*scale,Math.cos(i*2.2)*.30*scale);
      g.add(f);
    }
  }
  return g;
}

function createStripedAwning(width,projection,variant='red'){
  const g=new THREE.Group();
  const count=8;
  const mats=variant==='blue'
    ?[MATERIALS.fabricBlue,MATERIALS.fabricCream]
    :[MATERIALS.fabricRed,MATERIALS.fabricCream];
  const stripeW=width/count;
  for(let i=0;i<count;i++){
    const stripe=addBox(g,projection,.105,stripeW,mats[i%2],-projection/2,0,-width/2+(i+.5)*stripeW);
    stripe.rotation.z=-9*DEG;
  }
  const valance=createAwningValance(width,variant);
  valance.position.set(-projection+.05,-.09,0);
  g.add(valance);
  return g;
}

function createFruitCrate(index=0){
  const g=new THREE.Group();
  addBox(g,.86,.36,1.12,MATERIALS.wood,0,.18,0);
  const colors=[0xf28b32,0xe84d45,0xe7d54a,0x69aa4d].map(c=>mat(c,.72,0));
  for(let i=0;i<12;i++){
    const fruit=mesh(GEO.fruit,colors[(index+i)%colors.length],{cast:false});
    fruit.scale.setScalar(.13);
    fruit.position.set(-.25+(i%3)*.25,.41+(i>5?.12:0),-.35+(Math.floor(i/3)%3)*.34);
    g.add(fruit);
  }
  return g;
}

function createCafe(width=4.8,depth=6.2){
  const detail=new THREE.Group();
  const face=-width/2-.07;
  const hanging=createHangingSign('Café');
  hanging.position.set(face-.28,2.72,-2.02);
  detail.add(hanging);
  addDoor(detail,face,-1.4,true);
  addWindow(detail,face,1.55,1.05,{shutters:false,lit:true});
  const awning=createStripedAwning(3.4,1.25,'blue');
  awning.position.set(face-.02,2.35,.75);
  detail.add(awning);

  const sign=createSign('Café Vida',{width:1.28,height:.48,bg:'#72503a',font:46});
  sign.position.set(face-.18,2.98,-1.15);
  detail.add(sign);

  const service=createCafeService();
  service.position.set(face-1.72,0,2.22);
  detail.add(service);

  for(const z of [-1.55,.35,1.95]){
    const table=mesh(new THREE.CylinderGeometry(.42,.42,.09,16),MATERIALS.wood);
    table.position.set(face-1.35,.75,z);
    detail.add(table);
    const stem=mesh(new THREE.CylinderGeometry(.055,.07,.7,8),MATERIALS.rail);
    stem.position.set(face-1.35,.39,z);
    detail.add(stem);
    for(const dz of [-.58,.58]){
      const chair=new THREE.Group();
      addBox(chair,.48,.08,.48,MATERIALS.wood,0,.48,0);
      addBox(chair,.48,.62,.08,MATERIALS.wood,0,.80,.18);
      chair.position.set(face-1.35,0,z+dz);
      detail.add(chair);
    }
  }
  return detail;
}

function createFruitShop(width=5.2,depth=6.6){
  const detail=new THREE.Group();
  const face=-width/2-.07;
  addDoor(detail,face,-2.15,false);
  addBox(detail,.08,1.72,3.25,MATERIALS.trimDark,face,1.22,.60);
  addBox(detail,.045,1.46,2.98,MATERIALS.glassWindow,face-.07,1.27,.60,{cast:false});
  const awning=createStripedAwning(4.45,1.45,'red');
  awning.position.set(face-.02,2.45,.60);
  detail.add(awning);

  const storeSign=createSign('La Tiendita',{width:2.1,height:.58,bg:'#f0e4c4',fg:'#3e765f',font:48});
  storeSign.position.set(face-.18,3.20,.65);
  detail.add(storeSign);

  const marketDisplay=createMarketDisplay();
  marketDisplay.position.set(face-1.35,0,.25);
  detail.add(marketDisplay);

  for(let row=0;row<2;row++){
    for(let col=0;col<3;col++){
      const crate=createFruitCrate(row*3+col);
      crate.position.set(face-1.0-row*.82,0,-1.25+col*1.35);
      detail.add(crate);
    }
  }

  const board=new THREE.Group();
  addBox(board,.12,1.65,1.05,MATERIALS.darkWood,0,.90,0);
  const label=createSign('Frutas\nVerduras\nFresco',{width:.86,height:1.32,bg:'#39443d',font:32});
  label.position.set(-.075,.95,0);
  board.add(label);
  board.position.set(face-2.05,0,2.25);
  detail.add(board);
  return detail;
}

function createShopDetail(width=4.7){
  const g=new THREE.Group();
  const face=-width/2-.07;
  addDoor(g,face,-1.3,false);
  addWindow(g,face,1.45,1.1,{shutters:false});
  const awning=createStripedAwning(2.75,1.15,'red');
  awning.position.set(face-.03,2.25,1.0);
  g.add(awning);
  const sign=createSign('Mercado',{width:1.45,height:.48,bg:'#76513b',font:44});
  sign.position.set(face-.18,2.95,.85);
  g.add(sign);
  return g;
}

function createMediterraneanBuilding({index=0,type='house',mobile=false}={}){
  const g=new THREE.Group();
  const width=type==='fruit'?5.2:type==='cafe'?4.8:4.35+(index%3)*.32;
  const depth=type==='fruit'?6.6:type==='cafe'?6.2:5.0+(index%2)*.65;
  const floors=(type==='house'&&index%4!==1)?2:1;
  const floorHeight=2.75;
  const height=floors*floorHeight+.35;
  const wall=WALLS[index%WALLS.length];
  const variant=buildingVariant(index);

  addBox(g,width,height,depth,wall,0,height/2,0);

  // Warm stone base, cornices and deep façade edges keep buildings from reading as flat boxes.
  addBox(g,width+.08,.42,depth+.08,MATERIALS.stone,0,.21,0);
  addBox(g,width+.14,.18,depth+.14,MATERIALS.trim,0,height-.10,0);
  if(floors===2)addBox(g,width+.10,.12,depth+.08,MATERIALS.trim,0,floorHeight-.03,0);

  const roof=createGableRoof(width+.68,depth+.62,1.35,index%2?MATERIALS.terracotta:MATERIALS.terracottaLight);
  roof.position.y=height;
  g.add(roof);
  addBox(g,width+.88,.15,.30,MATERIALS.terracotta,0,height+.05,-depth/2-.24);
  addBox(g,width+.88,.15,.30,MATERIALS.terracotta,0,height+.05, depth/2+.24);
  addRoofEdgeTiles(g,width+.68,depth+.62,height);

  const face=-width/2-.065;
  addFacadeTrim(g,face,depth,height,variant);
  if(variant.lantern)addWallLantern(g,face,2.0,-depth*.42);
  if(type==='cafe'){
    g.add(createCafe(width,depth));
  }else if(type==='fruit'){
    g.add(createFruitShop(width,depth));
  }else if(type==='shop'){
    g.add(createShopDetail(width));
  }else{
    addDoor(g,face,-depth*.27,false);
    addWindowCluster(g,face,1.55,depth,depth>5.35?2:1,{lit:variant.warmWindow});
    if(floors===2){
      addWindowCluster(g,face,4.28,depth,variant.upperWindows,{balcony:variant.balcony,lit:variant.warmWindow});
    }
  }

  // Planters and climbing greenery.
  for(const z of [-depth*.39,depth*.39]){
    const pot=createPot(.72,true);
    pot.position.set(face-.65,0,z);
    g.add(pot);
  }
  if(index%2===0){
    createBougainvilleaCascade(g,face,Math.min(height-.75,4.9),depth*.36,.92);
  }
  if(!mobile&&index%3===0){
    for(let i=0;i<4;i++){
      const leaf=mesh(GEO.sphereLow,MATERIALS.leafA,{cast:false});
      leaf.scale.set(.23,.34,.18);
      leaf.position.set(face-.12,1.35+i*.58,depth/2-.22-i*.14);
      g.add(leaf);
    }
  }

  if(variant.bunting){
    const flags=createBunting(Math.min(4.0,depth*.72),8);
    flags.rotation.y=Math.PI/2;
    flags.position.set(face-.22,height-.66,0);
    g.add(flags);
  }

  g.userData.bounds={width,depth,height};
  return g;
}

function createBroadleafTree(scale=1,mobile=false){
  const g=new THREE.Group();
  const trunk=mesh(new THREE.CylinderGeometry(.17*scale,.30*scale,3.75*scale,12),MATERIALS.trunk);
  trunk.position.y=1.88*scale;
  trunk.rotation.z=-.018;
  g.add(trunk);
  createNaturalTreeBranches(g,scale);
  createCanopyCluster(g,scale,mobile,Math.round(scale*7));
  return g;
}

function makePalmLeaf(){
  return PALM_FROND_V4;
}
const PALM_LEAF_GEO=PALM_FROND_V4;

function createPalm(scale=1,mobile=false){
  const g=new THREE.Group();
  const segments=mobile?5:7;
  let y=0;
  for(let i=0;i<segments;i++){
    const segH=.72*scale;
    const seg=mesh(new THREE.CylinderGeometry((.105-i*.006)*scale,(.16-i*.006)*scale,segH,10),MATERIALS.palmTrunk);
    seg.position.set(i*.032*scale,y+segH/2,-i*.018*scale);
    seg.rotation.z=-.032;
    g.add(seg);
    y+=segH*.95;
  }
  const fronds=mobile?10:14;
  for(let i=0;i<fronds;i++){
    const leaf=mesh(PALM_LEAF_GEO,MATERIALS.palmLeaf,{cast:!mobile,receive:false});
    const angle=i/fronds*Math.PI*2;
    leaf.scale.set((.58+(i%3)*.055)*scale,(.62+(i%2)*.045)*scale,.62*scale);
    leaf.rotation.set((-70+(i%4)*5)*DEG,0,angle);
    leaf.position.set(.10*scale,y+.04*scale,0);
    g.add(leaf);
  }
  for(let i=0;i<6;i++){
    const fruit=mesh(GEO.fruit,mat(0x8c5d33,.8,0),{cast:false});
    fruit.scale.setScalar(.075*scale);
    fruit.position.set(.08*scale+Math.cos(i)*.15*scale,(y-.12)*scale,Math.sin(i)*.14*scale);
    g.add(fruit);
  }
  return g;
}

function createBench(){
  const g=new THREE.Group();
  for(let i=0;i<5;i++){
    addBox(g,1.65,.09,.12,MATERIALS.wood,0,.57,-.25+i*.12);
  }
  for(let i=0;i<4;i++){
    const slat=addBox(g,1.65,.09,.12,MATERIALS.wood,0,.83+i*.15,.30);
    slat.rotation.x=-10*DEG;
  }
  for(const x of [-.64,.64]){
    addBox(g,.10,.66,.10,MATERIALS.rail,x,.33,0);
    addBox(g,.10,.78,.10,MATERIALS.rail,x,.72,.25);
  }
  return g;
}

function createLampPost(){
  const g=new THREE.Group();
  const stem=mesh(new THREE.CylinderGeometry(.055,.075,3.45,10),MATERIALS.lampMetal);
  stem.position.y=1.73;
  g.add(stem);
  const base=mesh(new THREE.CylinderGeometry(.16,.22,.28,10),MATERIALS.lampMetal);
  base.position.y=.14;
  g.add(base);
  addBox(g,.68,.07,.07,MATERIALS.lampMetal,-.22,3.22,0);
  const lantern=new THREE.Group();
  addBox(lantern,.34,.12,.38,MATERIALS.lampMetal,0,.64,0);
  addBox(lantern,.34,.12,.38,MATERIALS.lampMetal,0,0,0);
  for(const x of [-.15,.15])for(const z of [-.17,.17]){
    addBox(lantern,.045,.64,.045,MATERIALS.lampMetal,x,.32,z);
  }
  addBox(lantern,.25,.48,.29,MATERIALS.glass,0,.32,0,{cast:false});
  const cap=new THREE.Mesh(new THREE.ConeGeometry(.34,.30,4),MATERIALS.lampMetal);
  cap.rotation.y=45*DEG;
  cap.position.y=.90;
  lantern.add(cap);
  lantern.position.set(-.56,3.02,0);
  g.add(lantern);
  return g;
}

function addRailSection(group,x,z0,length){
  const railX=x;
  addBox(group,.13,.14,length,MATERIALS.rail,railX,1.12,z0,{cast:false});
  addBox(group,.10,.10,length,MATERIALS.rail,railX,.55,z0,{cast:false});
  for(let z=-length/2;z<=length/2+.01;z+=1.8){
    addBox(group,.12,1.16,.12,MATERIALS.rail,railX,.59,z0+z);
  }
}

function createPromenadeSegment({index=0,mobile=false,length=15}={}){
  const g=new THREE.Group();
  // Rail, broadleaf trees, benches and flowerpots occupy the promenade but keep the sea open.
  addRailSection(g,SEA_WALL_X,0,length+1.2);
  addBox(g,.42,.62,length+1.2,MATERIALS.stone,SEA_WALL_X,.31,0);

  const bigTree=createBroadleafTree(index%3===0?1.15:1.0,mobile);
  bigTree.position.set(-8.35,0,-2.0);
  g.add(bigTree);

  if(index%2===0){
    const bench=createBench();
    bench.rotation.y=90*DEG;
    bench.position.set(-8.45,0,3.7);
    g.add(bench);
  }
  if(index%3!==1){
    const planters=createPromenadePlanterCluster();
    planters.position.set(-7.75,0,4.55);
    g.add(planters);
  }
  if(index===0||index%5===0){
    const banner=createSeasideBanner(index===0?'GOOD FOOD\nBRIGHTER DAYS':'SEA · SUN\nCAFÉ');
    banner.position.set(-9.05,0,1.15);
    g.add(banner);
  }

  // Lamps sit closer to the road so their silhouettes read like the target.
  const lamp=createLampPost();
  lamp.position.set(-6.85,0,-5.2);
  g.add(lamp);
  return g;
}

function createRoadsidePalmCluster(index=0,mobile=false){
  const g=new THREE.Group();
  if(index%2===0){
    const p=createPalm(.92,mobile);
    p.position.set(-9.15,0,0);
    g.add(p);
  }
  return g;
}

function createMountainBackdrop(scene,mobile=false){
  const COASTAL_V4_MOUNTAINS=true;
  const back=createMountainLayer([
    [-30,-5,-270,31,27,2],
    [28,-6,-278,30,23,5]
  ],MATERIALS.foothill);
  scene.add(back);

  const main=createMountainLayer([
    [-9,-5,-286,23,41,8],
    [27,-6,-292,19,29,11]
  ],MATERIALS.mountain);
  scene.add(main);

  const lit=createMountainLayer([
    [-13,18,-284,10,15,8],
    [25,12,-290,7,10,11]
  ],MATERIALS.mountainLight);
  scene.add(lit);

  return {main,COASTAL_V4_MOUNTAINS};
}

function createTinyHouse(index=0){
  const g=new THREE.Group();
  const w=.9+(index%3)*.18;
  const h=.7+(index%4)*.16;
  const d=.75+(index%2)*.22;
  const wall=WALLS[(index+2)%WALLS.length];
  addBox(g,w,h,d,wall,0,h/2,0,{cast:false,receive:false});
  const roof=createGableRoof(w+.18,d+.16,.28,index%2?MATERIALS.terracotta:MATERIALS.terracottaLight);
  roof.position.y=h;
  roof.castShadow=false;
  roof.receiveShadow=false;
  g.add(roof);
  const win=addBox(g,.025,.19,.16,MATERIALS.warmGlass,-w/2-.018,h*.52,.18,{cast:false,receive:false});
  win.castShadow=false;
  return g;
}

function createHillsideTown(scene,mobile=false){
  createCoastalHillside(scene);
  return createLayeredHillsideTown(scene,mobile);
}

function createSea(scene,mobile=false,animators=[]){
  const waterMaterial=createWaterMaterial(animators);
  waterMaterial.uniforms.uDeep.value.set(COASTAL_V4_PALETTE.seaDeep);
  waterMaterial.uniforms.uShallow.value.set(COASTAL_V4_PALETTE.seaShallow);

  const sea=mesh(new THREE.PlaneGeometry(76,250,mobile?28:52,mobile?70:110),waterMaterial,{cast:false,receive:false});
  sea.rotation.x=-Math.PI/2;
  sea.position.set(-36,-.13,-92);
  scene.add(sea);

  const shallowMat=waterMaterial.clone();
  shallowMat.uniforms=THREE.UniformsUtils.clone(waterMaterial.uniforms);
  shallowMat.uniforms.uDeep.value.set(0x28aeca);
  shallowMat.uniforms.uShallow.value.set(0x7bdce1);
  animators.push(time=>{shallowMat.uniforms.uTime.value=time+.55;});
  const shallow=mesh(new THREE.PlaneGeometry(9.5,235,mobile?10:18,mobile?48:88),shallowMat,{cast:false,receive:false});
  shallow.rotation.x=-Math.PI/2;
  shallow.position.set(-14.4,-.085,-86);
  scene.add(shallow);
}

function createRoadAndWalkways(world,mobile=false){
  const road=mesh(new THREE.PlaneGeometry(ROAD_WIDTH,192),MATERIALS.road,{cast:false,receive:true});
  road.rotation.x=-Math.PI/2;
  road.position.set(0,0,-76);
  world.add(road);

  const rightWalk=mesh(new THREE.BoxGeometry(RIGHT_SIDEWALK_WIDTH,.18,192),MATERIALS.sidewalk);
  rightWalk.position.set(ROAD_WIDTH/2+RIGHT_SIDEWALK_WIDTH/2,.09,-76);
  rightWalk.receiveShadow=true;
  world.add(rightWalk);

  const leftWalk=mesh(new THREE.BoxGeometry(LEFT_PROMENADE_WIDTH,.18,192),MATERIALS.promenade);
  leftWalk.position.set(-ROAD_WIDTH/2-LEFT_PROMENADE_WIDTH/2,.09,-76);
  leftWalk.receiveShadow=true;
  world.add(leftWalk);

  for(const side of [-1,1]){
    addBox(world,.22,.24,192,MATERIALS.curb,side*(ROAD_WIDTH/2+.04),.12,-76);
  }

  // Road edge highlights and paver seams.
  for(const side of [-1,1]){
    addBox(world,.08,.025,192,basic(0xece6d7,.72),side*(ROAD_WIDTH/2-.18),.025,-76,{cast:false});
  }
  const paverMat=basic(0xcfbeaa,.32);
  for(let i=0;i<22;i++){
    const z=6-i*8.6;
    addBox(world,LEFT_PROMENADE_WIDTH-.25,.02,.055,paverMat,-8.25,.20,z,{cast:false});
    addBox(world,RIGHT_SIDEWALK_WIDTH-.20,.02,.055,paverMat,7.15,.20,z,{cast:false});
  }

  const laneMarkers=[];
  const markerMat=basic(0xf3efdf,.92);
  for(const x of [-1.5,1.5]){
    for(let i=0;i<24;i++){
      const m=addBox(world,.095,.025,2.55,markerMat,x,.035,6-i*8.0,{cast:false});
      laneMarkers.push(m);
    }
  }
  return laneMarkers;
}

export function buildCoastalWorld({
  scene,
  world,
  isMobile=false,
  registerMover=()=>{},
  registerFarMover=()=>{}
}={}){
  if(!scene||!world)throw new Error('buildCoastalWorld requires scene and world');

  const animators=[];
  createSkyDome(scene);
  createAtmosphericHaze(scene);
  createSea(scene,isMobile,animators);
  createShoreFoamRibbon(scene,isMobile);
  createSunGlitter(scene,isMobile);
  createWaterfrontBoats(scene,isMobile);
  createMountainBackdrop(scene,isMobile);
  createHillsideTown(scene,isMobile);

  const laneMarkers=createRoadAndWalkways(world,isMobile);

  // Left: real open promenade with repeated but varied clusters.
  const promenadeCount=isMobile?9:13;
  for(let i=0;i<promenadeCount;i++){
    const segment=createPromenadeSegment({index:i,mobile:isMobile,length:15});
    segment.position.z=-3-i*15;
    world.add(segment);
    registerMover(segment,{speedFactor:.96,span:NEAR_SPAN,startZ:segment.position.z});

    const palms=createRoadsidePalmCluster(i,isMobile);
    palms.position.z=-16-i*18;
    world.add(palms);
    registerMover(palms,{speedFactor:.91,span:NEAR_SPAN,startZ:palms.position.z});
  }

  // Right: varied 1–2 story Mediterranean frontage. No left-side buildings.
  const sequence=['fruit','house','cafe','house','shop','house','house','cafe','fruit','house','shop','house'];
  const buildingCount=isMobile?10:15;
  for(let i=0;i<buildingCount;i++){
    const type=sequence[i%sequence.length];
    const building=createMediterraneanBuilding({index:i+2,type,mobile:isMobile});
    const width=building.userData.bounds?.width||4.7;
    building.position.set(VILLAGE_X+width/2+(i%3===1?.18:0),0,-4-i*12.0);
    world.add(building);
    registerMover(building,{speedFactor:.90,span:NEAR_SPAN,startZ:building.position.z});

    // Street pots between façades add the dense foreground rhythm of the target.
    if(i%2===0){
      const pot=createPot(.85,true);
      pot.position.set(6.78,0,-9-i*12.0);
      world.add(pot);
      registerMover(pot,{speedFactor:.98,span:NEAR_SPAN,startZ:pot.position.z});
    }

    if(i%2===1){
      const lamp=createLampPost();
      lamp.position.set(6.68,0,-7-i*12.0);
      world.add(lamp);
      registerMover(lamp,{speedFactor:.98,span:NEAR_SPAN,startZ:lamp.position.z});
    }

    if(!isMobile&&i%4===2){
      const terrace=createCafeTerraceCluster();
      terrace.position.set(7.25,0,-10-i*12.0);
      terrace.scale.setScalar(.82);
      world.add(terrace);
      registerMover(terrace,{speedFactor:.96,span:NEAR_SPAN,startZ:terrace.position.z});
    }
  }

  // Festive overhead flags add a stronger Mediterranean village rhythm without changing gameplay geometry.
  for(let i=0;i<(isMobile?1:3);i++){
    const bunting=createBunting(14,16);
    bunting.position.set(1.8,5.4,-42-i*48);
    bunting.rotation.x=-.035;
    world.add(bunting);
    registerMover(bunting,{speedFactor:.90,span:NEAR_SPAN,startZ:bunting.position.z});
  }

  // Mid-distance palms and compact trees enhance parallax without closing the water view.
  for(let i=0;i<(isMobile?5:8);i++){
    const mid=new THREE.Group();
    const palm=createPalm(.68,isMobile);
    palm.position.set(-8.8,0,0);
    mid.add(palm);
    mid.position.z=-48-i*20;
    world.add(mid);
    registerFarMover(mid,{speedFactor:.32,span:FAR_SPAN,startZ:mid.position.z});
  }

  return {
    laneMarkers,
    update(time){
      for(const animate of animators)animate(time);
    }
  };
}
