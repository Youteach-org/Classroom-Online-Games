import * as THREE from 'three';

const SEGMENT_LENGTH=18;
const SEGMENT_COUNT=14;
const SEGMENT_SPAN=SEGMENT_LENGTH*SEGMENT_COUNT;

function toon(color){
  return new THREE.MeshToonMaterial({color});
}
function basic(color,opacity=1){
  return new THREE.MeshBasicMaterial({
    color,
    transparent:opacity<1,
    opacity,
    depthWrite:opacity>=1
  });
}
function box(group,w,h,d,material,x=0,y=0,z=0){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  mesh.position.set(x,y,z);
  mesh.castShadow=false;
  mesh.receiveShadow=true;
  group.add(mesh);
  return mesh;
}
function cylinder(group,rTop,rBottom,h,material,x=0,y=0,z=0,segments=10){
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(rTop,rBottom,h,segments),material);
  mesh.position.set(x,y,z);
  mesh.castShadow=false;
  group.add(mesh);
  return mesh;
}

const MAT={
  marketFloor:toon(0xd8c6aa),
  marketTrim:toon(0x7c6249),
  marketWall:toon(0xe9c985),
  awningRed:toon(0xc94a46),
  awningBlue:toon(0x3b87aa),
  awningYellow:toon(0xe1b54b),
  crate:toon(0x9a6742),
  fruitA:toon(0xe65f4e),
  fruitB:toon(0xe3b943),
  fruitC:toon(0x67a95e),
  rooftopFloor:toon(0xc26d4b),
  rooftopEdge:toon(0xf0dfc5),
  rooftopBuilding:toon(0xe7d6bd),
  rooftopAccent:toon(0x70a7b0),
  tank:toon(0x82969e),
  promenadeFloor:toon(0xe8dfcf),
  promenadeEdge:toon(0xc9bda8),
  rail:toon(0x496779),
  palmTrunk:toon(0x8d6547),
  palmLeaf:toon(0x4f8b63),
  bench:toon(0x9a714c),
  light:basic(0xffe59d),
  lane:basic(0xffffff,.42)
};

function addLaneGuides(group,width=8){
  for(const x of [-width/6,width/6]){
    for(let z=-SEGMENT_LENGTH/2+1;z<SEGMENT_LENGTH/2;z+=3.4){
      box(group,.08,.018,1.65,MAT.lane,x,.025,z);
    }
  }
}

function createMarketStall(side,index){
  const g=new THREE.Group();
  const sx=side;
  box(g,2.2,2.25,3.0,MAT.marketWall,0,1.12,0);
  const awning=[MAT.awningRed,MAT.awningBlue,MAT.awningYellow][index%3];
  const canopy=box(g,1.65,.12,2.7,awning,-sx*1.17,2.15,0);
  canopy.rotation.z=sx*.16;
  box(g,1.1,.72,1.65,MAT.crate,-sx*1.32,.36,.1);
  for(let i=0;i<7;i++){
    const fruit=new THREE.Mesh(
      new THREE.SphereGeometry(.12+(i%2)*.025,8,6),
      [MAT.fruitA,MAT.fruitB,MAT.fruitC][i%3]
    );
    fruit.position.set(-sx*1.34,.82+(i%2)*.16,-.55+(i%4)*.36);
    g.add(fruit);
  }
  return g;
}

function createMarketSegment(index=0){
  const g=new THREE.Group();
  box(g,8.4,.16,SEGMENT_LENGTH,MAT.marketFloor,0,-.08,0);
  box(g,.34,.28,SEGMENT_LENGTH,MAT.marketTrim,-4.35,.10,0);
  box(g,.34,.28,SEGMENT_LENGTH,MAT.marketTrim,4.35,.10,0);
  addLaneGuides(g,7.7);

  for(const side of [-1,1]){
    const stall=createMarketStall(side,index+(side>0?2:0));
    stall.position.set(side*5.7,0,(index%2?3.7:-3.7));
    g.add(stall);
  }

  if(index%2===0){
    const wire=box(g,10.6,.035,.035,MAT.rail,0,4.1,0);
    wire.rotation.z=.015;
    for(let i=0;i<7;i++){
      const flag=box(g,.42,.38,.035,[MAT.awningRed,MAT.awningBlue,MAT.awningYellow][i%3],-3.6+i*1.2,3.82,0);
      flag.rotation.z=(i%2?-.08:.08);
    }
  }
  return g;
}

function createRooftopSegment(index=0){
  const g=new THREE.Group();
  box(g,7.2,.28,SEGMENT_LENGTH,MAT.rooftopFloor,0,-.14,0);
  box(g,.34,.78,SEGMENT_LENGTH,MAT.rooftopEdge,-3.78,.34,0);
  box(g,.34,.78,SEGMENT_LENGTH,MAT.rooftopEdge,3.78,.34,0);
  addLaneGuides(g,6.45);

  for(const side of [-1,1]){
    box(g,4.6,4.4,7.4,MAT.rooftopBuilding,side*6.0,-2.25,(index%2?3.9:-3.9));
    box(g,4.7,.22,7.5,MAT.rooftopFloor,side*6.0,.04,(index%2?3.9:-3.9));
  }

  if(index%2===0){
    cylinder(g,.72,.72,1.25,MAT.tank,-5.45,.72,-3.0,16);
    cylinder(g,.10,.10,.82,MAT.rooftopAccent,-5.45,.25,-3.0,10);
  }else{
    const shade=box(g,2.1,.12,2.7,MAT.rooftopAccent,5.25,1.9,2.8);
    shade.rotation.z=.03;
    for(const x of [4.35,6.15]){
      box(g,.09,1.9,.09,MAT.rooftopEdge,x,.95,2.8);
    }
  }
  return g;
}

function createPalm(){
  const g=new THREE.Group();
  const trunk=cylinder(g,.16,.24,3.7,MAT.palmTrunk,0,1.85,0,10);
  trunk.rotation.z=.035;
  for(let i=0;i<7;i++){
    const leaf=box(g,.16,.08,2.2,MAT.palmLeaf,0,3.82,0);
    leaf.rotation.y=i*Math.PI*2/7;
    leaf.rotation.x=-.18;
    leaf.position.x=Math.cos(leaf.rotation.y)*.72;
    leaf.position.z=Math.sin(leaf.rotation.y)*.72;
  }
  return g;
}

function createPromenadeSegment(index=0){
  const g=new THREE.Group();
  box(g,11.6,.16,SEGMENT_LENGTH,MAT.promenadeFloor,0,-.08,0);
  box(g,.28,.24,SEGMENT_LENGTH,MAT.promenadeEdge,-5.95,.08,0);
  box(g,.28,.24,SEGMENT_LENGTH,MAT.promenadeEdge,5.95,.08,0);
  addLaneGuides(g,9.8);

  for(let z=-7;z<=7;z+=3.5){
    box(g,.06,.72,.08,MAT.rail,6.18,.42,z);
  }
  box(g,.08,.08,SEGMENT_LENGTH,MAT.rail,6.18,.78,0);

  if(index%2===0){
    const palm=createPalm();
    palm.position.set(-6.15,0,-3.4);
    g.add(palm);
    box(g,1.8,.14,.55,MAT.bench,-5.1,.58,3.5);
    box(g,.12,.62,.12,MAT.bench,-5.75,.31,3.5);
    box(g,.12,.62,.12,MAT.bench,-4.45,.31,3.5);
  }else{
    const lamp=cylinder(g,.055,.075,3.2,MAT.rail,-6.0,1.6,2.5,8);
    const bulb=new THREE.Mesh(new THREE.SphereGeometry(.18,10,8),MAT.light);
    bulb.position.set(-6.0,3.18,2.5);
    g.add(bulb);
  }
  return g;
}

function buildZoneRoot(createSegment,registerMover){
  const root=new THREE.Group();
  for(let i=0;i<SEGMENT_COUNT;i++){
    const segment=createSegment(i);
    const z=8-i*SEGMENT_LENGTH;
    segment.position.z=z;
    root.add(segment);
    registerMover(segment,{speedFactor:1,span:SEGMENT_SPAN,startZ:z});
  }
  return root;
}

export function buildSentenceRunnerWorld({scene,registerMover,isMobile=false}={}){
  if(!scene||typeof registerMover!=='function')throw new Error('Sentence Runner world requires scene and registerMover');

  const roots={
    market:buildZoneRoot(createMarketSegment,registerMover),
    rooftops:buildZoneRoot(createRooftopSegment,registerMover),
    promenade:buildZoneRoot(createPromenadeSegment,registerMover)
  };

  Object.values(roots).forEach(root=>{
    root.visible=false;
    scene.add(root);
  });

  let visible=false;
  let active='market';
  let elevation=0;

  function sync(){
    for(const [id,root] of Object.entries(roots)){
      root.visible=visible&&id===active;
      root.position.y=elevation;
    }
  }

  return {
    setVisible(next){
      visible=Boolean(next);
      sync();
    },
    setZone(id){
      if(roots[id])active=id;
      sync();
    },
    setElevation(value){
      elevation=Number(value)||0;
      sync();
    },
    getZone(){return active;},
    update(){},
    roots
  };
}

export {createMarketSegment,createRooftopSegment,createPromenadeSegment};
