#!/usr/bin/env python3
import bpy, sys, math
from mathutils import Vector

argv=sys.argv
argv=argv[argv.index("--")+1:] if "--" in argv else []
if len(argv)<2:
    raise SystemExit("usage: blender --background --python rig-alex-run-v2.py -- INPUT.glb OUTPUT.glb")
src,dst=argv[0],argv[1]

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=src)

meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
if not meshes:
    raise RuntimeError("No mesh imported")
mesh=max(meshes,key=lambda o: len(o.data.vertices))

# Bake imported transform.
mw=mesh.matrix_world.copy()
mesh.parent=None
mesh.matrix_world=mw
bpy.context.view_layer.objects.active=mesh
mesh.select_set(True)
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
for o in meshes:
    if o!=mesh:
        o.select_set(False)

V=[v.co.copy() for v in mesh.data.vertices]
mins=Vector((min(v.x for v in V),min(v.y for v in V),min(v.z for v in V)))
maxs=Vector((max(v.x for v in V),max(v.y for v in V),max(v.z for v in V)))
size=maxs-mins
cx=(mins.x+maxs.x)/2
cy=(mins.y+maxs.y)/2
ground=mins.z
H=size.z
W=size.x
D=size.y

print("ALEX_SIZE",tuple(round(x,6) for x in size))

# Remove non-mesh import hierarchy.
for o in list(bpy.context.scene.objects):
    if o!=mesh and o.type!='MESH':
        bpy.data.objects.remove(o,do_unlink=True)

# ---------- armature ----------
arm_data=bpy.data.armatures.new("ALEX_Rig")
arm=bpy.data.objects.new("ALEX_Rig",arm_data)
bpy.context.collection.objects.link(arm)
arm.show_in_front=True
bpy.context.view_layer.objects.active=arm
arm.select_set(True)
mesh.select_set(False)
bpy.ops.object.mode_set(mode='EDIT')

def add_bone(name,head,tail,parent=None,use_connect=False):
    b=arm_data.edit_bones.new(name)
    b.head=head
    b.tail=tail
    b.roll=0
    if parent:
        b.parent=arm_data.edit_bones.get(parent)
        b.use_connect=use_connect
    return b

z_ank=ground+H*.085
z_knee=ground+H*.295
z_hip=ground+H*.455
z_spine=ground+H*.565
z_chest=ground+H*.690
z_neck=ground+H*.805
z_head=ground+H*.955

leg_x=W*.175
shoulder_x=W*.325
elbow_x=W*.385
wrist_x=W*.355
z_sh=ground+H*.715
z_el=ground+H*.545
z_wr=ground+H*.375

add_bone("root",(cx,cy,ground),(cx,cy,z_hip))
add_bone("pelvis",(cx,cy,z_hip-H*.055),(cx,cy,z_spine),"root")
add_bone("spine",(cx,cy,z_spine),(cx,cy,z_chest),"pelvis")
add_bone("chest",(cx,cy,z_chest),(cx,cy,z_neck),"spine")
add_bone("neck",(cx,cy,z_neck),(cx,cy,z_neck+H*.040),"chest")
add_bone("head",(cx,cy,z_neck+H*.035),(cx,cy,z_head),"neck")

for side,sgn in (("L",-1),("R",1)):
    xh=cx+sgn*leg_x
    add_bone(f"thigh.{side}",(xh,cy,z_hip),(xh,cy,z_knee),"pelvis")
    add_bone(f"shin.{side}",(xh,cy,z_knee),(xh,cy,z_ank),f"thigh.{side}",True)
    # Keep foot centered in rest pose; animation handles pitch.
    add_bone(f"foot.{side}",(xh,cy,z_ank),(xh,cy-D*.20,ground+H*.035),f"shin.{side}",True)

    xs=cx+sgn*shoulder_x
    xe=cx+sgn*elbow_x
    xw=cx+sgn*wrist_x
    add_bone(f"upper_arm.{side}",(xs,cy,z_sh),(xe,cy,z_el),"chest")
    add_bone(f"forearm.{side}",(xe,cy,z_el),(xw,cy,z_wr),f"upper_arm.{side}",True)

bpy.ops.object.mode_set(mode='OBJECT')

# ---------- connected-island anatomical weighting ----------
for vg in list(mesh.vertex_groups):
    mesh.vertex_groups.remove(vg)

bone_names=["pelvis","spine","chest","neck","head",
            "thigh.L","shin.L","foot.L","thigh.R","shin.R","foot.R",
            "upper_arm.L","forearm.L","upper_arm.R","forearm.R"]
groups={n:mesh.vertex_groups.new(name=n) for n in bone_names}

# Union-find over mesh edges -> connected geometric islands.
parent=list(range(len(mesh.data.vertices)))
def find(a):
    while parent[a]!=a:
        parent[a]=parent[parent[a]]
        a=parent[a]
    return a
def union(a,b):
    ra,rb=find(a),find(b)
    if ra!=rb: parent[rb]=ra
for e in mesh.data.edges:
    union(e.vertices[0],e.vertices[1])

islands={}
for i in range(len(parent)):
    islands.setdefault(find(i),[]).append(i)

def put(indices,name,weights=None):
    if weights is None:
        groups[name].add(indices,1.0,'REPLACE')
    else:
        for i,w in zip(indices,weights):
            if w>1e-6: groups[name].add([i],float(w),'REPLACE')

def normalized_z(v):
    return (v.co.z-ground)/H

def classify(indices):
    pts=[mesh.data.vertices[i].co for i in indices]
    x0=min(p.x for p in pts); x1=max(p.x for p in pts)
    z0=min(p.z for p in pts); z1=max(p.z for p in pts)
    xm=sum(p.x for p in pts)/len(pts); zm=sum(p.z for p in pts)/len(pts)
    nz0=(z0-ground)/H; nz1=(z1-ground)/H; nz=(zm-ground)/H
    dx=(xm-cx)/W
    spanx=(x1-x0)/W

    if nz0>.77:
        return "head"
    if nz1<.49:
        # Central/cross-body cloth at hip remains pelvis instead of being torn between legs.
        if abs(dx)<.10 and spanx>.18 and nz>.34:
            return "torso"
        return "leg.L" if xm<cx else "leg.R"
    # Arms must be genuinely lateral. This is the key fix that keeps jacket body on torso.
    if .30<nz<.76 and abs(dx)>.285 and spanx<.32:
        return "arm.L" if xm<cx else "arm.R"
    return "torso"

def add_blend(i,pairs):
    total=sum(max(0,w) for _,w in pairs)
    if total<=1e-8:
        groups[pairs[0][0]].add([i],1.0,'REPLACE'); return
    for name,w in pairs:
        w=max(0,w)/total
        if w>1e-5: groups[name].add([i],float(w),'ADD')

stats={}
for root,indices in islands.items():
    cls=classify(indices)
    stats[cls]=stats.get(cls,0)+1
    for i in indices:
        nz=normalized_z(mesh.data.vertices[i])

        if cls=="head":
            t=max(0,min(1,(nz-.79)/.08))
            add_blend(i,[("neck",1-t),("head",t)])
        elif cls=="torso":
            if nz<.52:
                t=max(0,min(1,(nz-.44)/.08))
                add_blend(i,[("pelvis",1-t),("spine",t)])
            elif nz<.66:
                t=max(0,min(1,(nz-.56)/.10))
                add_blend(i,[("spine",1-t),("chest",t)])
            elif nz<.79:
                t=max(0,min(1,(nz-.72)/.07))
                add_blend(i,[("chest",1-t),("neck",t)])
            else:
                add_blend(i,[("head",1)])
        elif cls.startswith("leg."):
            side=cls[-1]
            if nz<.11:
                t=max(0,min(1,(nz-.075)/.035))
                add_blend(i,[(f"foot.{side}",1-t*.20),(f"shin.{side}",t*.20)])
            elif nz<.29:
                t=max(0,min(1,(nz-.245)/.055))
                add_blend(i,[(f"shin.{side}",1-t*.35),(f"thigh.{side}",t*.35)])
            elif nz<.42:
                t=max(0,min(1,(nz-.37)/.05))
                add_blend(i,[(f"thigh.{side}",1-t*.30),("pelvis",t*.30)])
            else:
                add_blend(i,[(f"thigh.{side}",.78),("pelvis",.22)])
        elif cls.startswith("arm."):
            side=cls[-1]
            if nz>.585:
                t=max(0,min(1,(.64-nz)/.085))
                add_blend(i,[(f"upper_arm.{side}",1-t*.18),("chest",t*.18)])
            else:
                t=max(0,min(1,(nz-.46)/.09))
                add_blend(i,[(f"forearm.{side}",1-t*.28),(f"upper_arm.{side}",t*.28)])

print("ISLAND_CLASSES",stats)

mod=mesh.modifiers.new("ALEX_Armature","ARMATURE")
mod.object=arm
mesh.parent=arm
mesh.matrix_parent_inverse=arm.matrix_world.inverted()

# ---------- forward run cycle ----------
bpy.context.view_layer.objects.active=arm
arm.select_set(True)
mesh.select_set(False)
action=bpy.data.actions.new("Run")
arm.animation_data_create()
arm.animation_data.action=action
for pb in arm.pose.bones:
    pb.rotation_mode='XYZ'

# v2 reverses the sagittal rotations from the defective pass:
# knees now fold behind the runner and torso leans into the run.
poses={
    # Left foot reaches forward; right leg is extending behind.
    1:  dict(tL=-25,tR=22,sL=8,sR=30,aL=28,aR=-28,eL=48,eR=48,bob=.002,twist=-2.5),
    # Right knee drives forward/up while left leg pushes behind.
    7:  dict(tL=18,tR=-38,sL=38,sR=70,aL=-34,aR=34,eL=55,eR=55,bob=.016,twist=2.0),
    # Mirror contact.
    13: dict(tL=22,tR=-25,sL=30,sR=8,aL=-28,aR=28,eL=48,eR=48,bob=.002,twist=2.5),
    # Left knee drives forward/up while right leg pushes behind.
    19: dict(tL=-38,tR=18,sL=70,sR=38,aL=34,aR=-34,eL=55,eR=55,bob=.016,twist=-2.0),
    25: dict(tL=-25,tR=22,sL=8,sR=30,aL=28,aR=-28,eL=48,eR=48,bob=.002,twist=-2.5),
}
def rad(v): return math.radians(v)

for frame,p in poses.items():
    for name in bone_names:
        pb=arm.pose.bones.get(name)
        if pb:
            pb.rotation_euler=(0,0,0)
            pb.location=(0,0,0)

    arm.pose.bones["thigh.L"].rotation_euler.x=rad(p["tL"])
    arm.pose.bones["thigh.R"].rotation_euler.x=rad(p["tR"])
    arm.pose.bones["shin.L"].rotation_euler.x=rad(p["sL"])
    arm.pose.bones["shin.R"].rotation_euler.x=rad(p["sR"])
    # Counter-rotate ankles so shoes do not behave as rigid extensions of the shin.
    toeL=6 if p["tL"]<-30 else 0
    toeR=6 if p["tR"]<-30 else 0
    arm.pose.bones["foot.L"].rotation_euler.x=rad(-(p["tL"]+p["sL"])+toeL)
    arm.pose.bones["foot.R"].rotation_euler.x=rad(-(p["tR"]+p["sR"])+toeR)

    arm.pose.bones["upper_arm.L"].rotation_euler.x=rad(p["aL"])
    arm.pose.bones["upper_arm.R"].rotation_euler.x=rad(p["aR"])
    arm.pose.bones["forearm.L"].rotation_euler.x=rad(p["eL"])
    arm.pose.bones["forearm.R"].rotation_euler.x=rad(p["eR"])

    # Forward athletic lean (opposite sign to defective pass).
    arm.pose.bones["spine"].rotation_euler.x=rad(7)
    arm.pose.bones["chest"].rotation_euler.x=rad(3)
    arm.pose.bones["pelvis"].rotation_euler.z=rad(p["twist"])
    arm.pose.bones["chest"].rotation_euler.z=rad(-p["twist"]*.70)
    arm.pose.bones["root"].location.y=H*p["bob"]

    for name in bone_names:
        pb=arm.pose.bones.get(name)
        if not pb: continue
        pb.keyframe_insert("rotation_euler",frame=frame,group=name)
        pb.keyframe_insert("location",frame=frame,group=name)

for fc in action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation='BEZIER'
        kp.handle_left_type='AUTO_CLAMPED'
        kp.handle_right_type='AUTO_CLAMPED'

action.use_fake_user=True
bpy.context.scene.frame_start=1
bpy.context.scene.frame_end=25
bpy.context.scene.render.fps=24

bpy.ops.object.select_all(action='DESELECT')
mesh.select_set(True)
arm.select_set(True)
bpy.context.view_layer.objects.active=arm
bpy.ops.export_scene.gltf(
    filepath=dst,
    export_format='GLB',
    use_selection=True,
    export_animations=True,
    export_frame_range=True,
    export_force_sampling=True,
    export_skins=True,
    export_morph=False,
    export_yup=True
)
print("RUN_V2_EXPORTED",dst)
