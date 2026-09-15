import * as THREE from 'three';
import { COASTAL_SCENE } from './coastal-scene-config.mjs';

const DEG=Math.PI/180; // degrees to radians
const SEA_COLOR=0x159fc5;
const SKY_COLOR=0x8fd4ef;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

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
    color:COASTAL_SCENE.seaColor,roughness:.25,metalness:.02,
    transparent:true,opacity:.97
  }),
  shallow:new THREE.MeshPhysicalMaterial({
    color:0x55cddd,roughness:.28,metalness:0,transparent:true,opacity:.78
  }),
  foam:basic(0xdff8f4,.46),
  wood:mat(0x8e5c38,.78,0),
  darkWood:mat(0x5c3b2b,.75,0),
  terracotta:mat(0xb95f3d,.84,0),
  terracottaLight:mat(0xcb7650,.84,0),
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
  mountain:mat(0x648b78,.98,0),
  mountainLight:mat(0x789c80,.98,0),
  foothill:mat(0x83a16f,.98,0),
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
  mat(0xf1d28d,.9,0),
  mat(0xf6e4c4,.9,0),
  mat(0xf5eddc,.9,0),
  mat(0xe8ddc8,.9,0),
  mat(0xf0c993,.9,0),
  mat(0xe8e8d8,.9,0),
  mat(0xf2d7b7,.9,0)
];
const SHUTTERS=[
  mat(0x3c7b68,.78,.02),
  mat(0x4f8872,.78,.02),
  mat(0x4b7987,.78,.02)
];

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
      horizonColor:{value:new THREE.Color(COASTAL_SCENE.skyColor)},
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
  addDoor(detail,face,-1.4,true);
  addWindow(detail,face,1.55,1.05,{shutters:false,lit:true});
  const awning=createStripedAwning(3.4,1.25,'blue');
  awning.position.set(face-.02,2.35,.75);
  detail.add(awning);

  const sign=createSign('Café Vida',{width:1.28,height:.48,bg:'#72503a',font:46});
  sign.position.set(face-.18,2.98,-1.15);
  detail.add(sign);

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

  const face=-width/2-.065;
  if(type==='cafe'){
    g.add(createCafe(width,depth));
  }else if(type==='fruit'){
    g.add(createFruitShop(width,depth));
  }else if(type==='shop'){
    g.add(createShopDetail(width));
  }else{
    addDoor(g,face,-depth*.27,false);
    addWindow(g,face,1.55,depth*.23,{shutters:true,lit:index%5===0});
    if(depth>5.35)addWindow(g,face,1.55,0,{shutters:true});
    if(floors===2){
      addWindow(g,face,4.28,-depth*.25,{shutters:true,balcony:index%3!==0});
      addWindow(g,face,4.28, depth*.25,{shutters:true,balcony:index%3===0});
    }
  }

  // Planters and climbing greenery.
  for(const z of [-depth*.39,depth*.39]){
    const pot=createPot(.72,true);
    pot.position.set(face-.65,0,z);
    g.add(pot);
  }
  if(!mobile&&index%3===0){
    for(let i=0;i<4;i++){
      const leaf=mesh(GEO.sphereLow,MATERIALS.leafA,{cast:false});
      leaf.scale.set(.23,.34,.18);
      leaf.position.set(face-.12,1.35+i*.58,depth/2-.22-i*.14);
      g.add(leaf);
    }
  }

  g.userData.bounds={width,depth,height};
  return g;
}

function createBroadleafTree(scale=1,mobile=false){
  const g=new THREE.Group();
  const trunk=mesh(new THREE.CylinderGeometry(.20*scale,.30*scale,3.8*scale,10),MATERIALS.trunk);
  trunk.position.y=1.9*scale;
  trunk.rotation.z=-.025;
  g.add(trunk);

  const branchGeom=new THREE.CylinderGeometry(.055*scale,.12*scale,2.0*scale,7);
  for(const [rx,rz,px,pz] of [
    [-.55,.10,-.46,.12],[.48,-.14,.42,-.18],[.25,.46,.15,.38]
  ]){
    const branch=mesh(branchGeom,MATERIALS.trunk);
    branch.position.set(px*scale,3.5*scale,pz*scale);
    branch.rotation.z=rx;
    branch.rotation.x=rz;
    g.add(branch);
  }

  const clusters=mobile?8:13;
  for(let i=0;i<clusters;i++){
    const a=i*2.399;
    const ring=.38+(i%4)*.33;
    const leaf=mesh(GEO.sphere12,[MATERIALS.leafA,MATERIALS.leafB,MATERIALS.leafC][i%3]);
    leaf.scale.set(
      (1.05+(i%3)*.18)*scale,
      (.82+(i%4)*.10)*scale,
      (1.00+((i+1)%3)*.16)*scale
    );
    leaf.position.set(
      Math.cos(a)*ring*scale,
      (4.1+(i%5)*.34)*scale,
      Math.sin(a)*ring*.78*scale
    );
    g.add(leaf);
  }
  return g;
}

function makePalmLeaf(){
  const shape=new THREE.Shape();
  shape.moveTo(0,0);
  shape.quadraticCurveTo(.18,.72,.08,1.45);
  shape.quadraticCurveTo(0,2.15,-.10,2.55);
  shape.quadraticCurveTo(-.22,1.25,0,0);
  const geo=new THREE.ShapeGeometry(shape,6);
  geo.translate(0,0,0);
  return geo;
}
const PALM_LEAF_GEO=makePalmLeaf();

function createPalm(scale=1,mobile=false){
  const g=new THREE.Group();
  const segments=mobile?4:6;
  let y=0;
  for(let i=0;i<segments;i++){
    const segH=.78*scale;
    const seg=mesh(new THREE.CylinderGeometry((.12-i*.008)*scale,(.16-i*.006)*scale,segH,9),MATERIALS.palmTrunk);
    seg.position.set(i*.035*scale,y+segH/2,-i*.014*scale);
    seg.rotation.z=-.035;
    g.add(seg);
    y+=segH*.96;
  }
  for(let i=0;i<9;i++){
    const leaf=mesh(PALM_LEAF_GEO,MATERIALS.palmLeaf,{cast:!mobile,receive:false});
    leaf.scale.set(.72*scale,.75*scale,.75*scale);
    leaf.rotation.x=-66*DEG;
    leaf.rotation.z=(i*40)*DEG;
    leaf.position.set(.12*scale,y+.08*scale,0);
    g.add(leaf);
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
  addRailSection(g,COASTAL_SCENE.layout.seaWallX,0,length+1.2);
  addBox(g,.42,.62,length+1.2,MATERIALS.stone,COASTAL_SCENE.layout.seaWallX,.31,0);

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
    const pot=createPot(.9,true);
    pot.position.set(-7.55,0,4.8);
    g.add(pot);
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
  const g=new THREE.Group();
  const makeHill=(x,y,z,r,h,material)=>{
    const hill=mesh(new THREE.ConeGeometry(r,h,mobile?18:28,1),material,{cast:false,receive:false});
    hill.scale.z=.72;
    hill.position.set(x,y,z);
    g.add(hill);
    return hill;
  };

  makeHill(-28,10,-228,33,42,MATERIALS.foothill);
  makeHill( 24,8,-235,36,34,MATERIALS.mountainLight);
  makeHill(-10,15,-244,29,58,MATERIALS.mountain);

  // Pale summit facets catch the warm daylight instead of reading as a flat triangle.
  const summit=mesh(new THREE.ConeGeometry(10,18,mobile?14:22,1),mat(0xaec4a7,.98,0),{cast:false,receive:false});
  summit.scale.z=.72;
  summit.position.set(-10,35,-244);
  g.add(summit);

  scene.add(g);
  return g;
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
  const town=new THREE.Group();
  const count=mobile?22:42;
  for(let i=0;i<count;i++){
    const row=i%7;
    const col=Math.floor(i/7);
    const house=createTinyHouse(i);
    const x=3+row*3.1+(col%2)*1.1;
    const y=1.7+col*1.45+Math.sin(row*.8)*.8;
    const z=-187-col*5.8-row*.9;
    house.position.set(x,y,z);
    house.rotation.y=(Math.sin(i*1.7)*5)*DEG;
    town.add(house);
  }
  // A second, smaller cluster left of the road gives the coastline depth without blocking the sea.
  const leftCount=mobile?7:12;
  for(let i=0;i<leftCount;i++){
    const house=createTinyHouse(i+50);
    house.scale.setScalar(.72);
    house.position.set(-16-i%4*2.5,2.0+Math.floor(i/4)*1.5,-190-Math.floor(i/4)*5);
    town.add(house);
  }
  scene.add(town);
  return town;
}

function createSea(scene,mobile=false){
  const sea=mesh(new THREE.PlaneGeometry(76,250,mobile?1:2,mobile?1:8),MATERIALS.sea,{cast:false,receive:true});
  sea.rotation.x=-Math.PI/2;
  sea.position.set(-36,-.12,-92);
  scene.add(sea);

  const shallow=mesh(new THREE.PlaneGeometry(9.5,235),MATERIALS.shallow,{cast:false,receive:false});
  shallow.rotation.x=-Math.PI/2;
  shallow.position.set(-14.4,-.085,-86);
  scene.add(shallow);

  for(let i=0;i<(mobile?9:17);i++){
    const glint=mesh(new THREE.PlaneGeometry(3.6+(i%4),.08),MATERIALS.foam,{cast:false,receive:false});
    glint.rotation.x=-Math.PI/2;
    glint.position.set(-15.5-(i%4)*7,-.045,-12-i*12.5);
    scene.add(glint);
  }
}

function createRoadAndWalkways(world,mobile=false){
  const road=mesh(new THREE.PlaneGeometry(COASTAL_SCENE.layout.roadWidth,192),MATERIALS.road,{cast:false,receive:true});
  road.rotation.x=-Math.PI/2;
  road.position.set(0,0,-76);
  world.add(road);

  const rightWalk=mesh(new THREE.BoxGeometry(COASTAL_SCENE.layout.rightSidewalkWidth,.18,192),MATERIALS.sidewalk);
  rightWalk.position.set(COASTAL_SCENE.layout.roadWidth/2+COASTAL_SCENE.layout.rightSidewalkWidth/2,.09,-76);
  rightWalk.receiveShadow=true;
  world.add(rightWalk);

  const leftWalk=mesh(new THREE.BoxGeometry(COASTAL_SCENE.layout.leftPromenadeWidth,.18,192),MATERIALS.promenade);
  leftWalk.position.set(-COASTAL_SCENE.layout.roadWidth/2-COASTAL_SCENE.layout.leftPromenadeWidth/2,.09,-76);
  leftWalk.receiveShadow=true;
  world.add(leftWalk);

  for(const side of [-1,1]){
    addBox(world,.22,.24,192,MATERIALS.curb,side*(COASTAL_SCENE.layout.roadWidth/2+.04),.12,-76);
  }

  // Road edge highlights and paver seams.
  for(const side of [-1,1]){
    addBox(world,.08,.025,192,basic(0xece6d7,.72),side*(COASTAL_SCENE.layout.roadWidth/2-.18),.025,-76,{cast:false});
  }
  const paverMat=basic(0xcfbeaa,.32);
  for(let i=0;i<22;i++){
    const z=6-i*8.6;
    addBox(world,COASTAL_SCENE.layout.leftPromenadeWidth-.25,.02,.055,paverMat,-8.25,.20,z,{cast:false});
    addBox(world,COASTAL_SCENE.layout.rightSidewalkWidth-.20,.02,.055,paverMat,7.15,.20,z,{cast:false});
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

  createSkyDome(scene);
  createSea(scene,isMobile);
  createMountainBackdrop(scene,isMobile);
  createHillsideTown(scene,isMobile);

  const laneMarkers=createRoadAndWalkways(world,isMobile);

  // Left: real open promenade with repeated but varied clusters.
  const promenadeCount=isMobile?9:13;
  for(let i=0;i<promenadeCount;i++){
    const segment=createPromenadeSegment({index:i,mobile:isMobile,length:15});
    segment.position.z=-3-i*15;
    world.add(segment);
    registerMover(segment,{speedFactor:.96,span:COASTAL_SCENE.loop.nearSpan,startZ:segment.position.z});

    const palms=createRoadsidePalmCluster(i,isMobile);
    palms.position.z=-16-i*18;
    world.add(palms);
    registerMover(palms,{speedFactor:.91,span:COASTAL_SCENE.loop.nearSpan,startZ:palms.position.z});
  }

  // Right: varied 1–2 story Mediterranean frontage. No left-side buildings.
  const sequence=['fruit','house','cafe','house','shop','house','house','cafe','fruit','house','shop','house'];
  const buildingCount=isMobile?10:15;
  for(let i=0;i<buildingCount;i++){
    const type=sequence[i%sequence.length];
    const building=createMediterraneanBuilding({index:i+2,type,mobile:isMobile});
    const width=building.userData.bounds?.width||4.7;
    building.position.set(COASTAL_SCENE.layout.villageX+width/2+(i%3===1?.18:0),0,-4-i*12.0);
    world.add(building);
    registerMover(building,{speedFactor:.90,span:COASTAL_SCENE.loop.nearSpan,startZ:building.position.z});

    // Street pots between façades add the dense foreground rhythm of the target.
    if(i%2===0){
      const pot=createPot(.85,true);
      pot.position.set(6.78,0,-9-i*12.0);
      world.add(pot);
      registerMover(pot,{speedFactor:.98,span:COASTAL_SCENE.loop.nearSpan,startZ:pot.position.z});
    }

    if(i%2===1){
      const lamp=createLampPost();
      lamp.position.set(6.68,0,-7-i*12.0);
      world.add(lamp);
      registerMover(lamp,{speedFactor:.98,span:COASTAL_SCENE.loop.nearSpan,startZ:lamp.position.z});
    }
  }

  // Mid-distance palms and compact trees enhance parallax without closing the water view.
  for(let i=0;i<(isMobile?5:8);i++){
    const mid=new THREE.Group();
    const palm=createPalm(.68,isMobile);
    palm.position.set(-8.8,0,0);
    mid.add(palm);
    mid.position.z=-48-i*20;
    world.add(mid);
    registerFarMover(mid,{speedFactor:.32,span:COASTAL_SCENE.loop.farSpan,startZ:mid.position.z});
  }

  return {laneMarkers};
}
