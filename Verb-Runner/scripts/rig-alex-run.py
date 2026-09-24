#!/usr/bin/env python3
import bpy, sys, math
from mathutils import Vector

argv=sys.argv
argv=argv[argv.index("--")+1:] if "--" in argv else []
if len(argv)<2:
    raise SystemExit("usage: blender --background --python rig-alex-run.py -- INPUT.glb OUTPUT.glb")
src,dst=argv[0],argv[1]

# Clean scene and import the approved/refined ALEX.
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=src)

meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
if not meshes:
    raise RuntimeError("No mesh imported")
mesh=max(meshes,key=lambda o: len(o.data.vertices))

# Bake the glTF world transform into the mesh so the rig uses predictable Blender Z-up coordinates.
mw=mesh.matrix_world.copy()
mesh.parent=None
mesh.matrix_world=mw
bpy.context.view_layer.objects.active=mesh
mesh.select_set(True)
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
for o in meshes:
    if o!=mesh:
        o.select_set(False)

coords=[v.co.copy() for v in mesh.data.vertices]
mins=Vector((min(v.x for v in coords),min(v.y for v in coords),min(v.z for v in coords)))
maxs=Vector((max(v.x for v in coords),max(v.y for v in coords),max(v.z for v in coords)))
size=maxs-mins
cx=(mins.x+maxs.x)/2
cy=(mins.y+maxs.y)/2
ground=mins.z
H=size.z
W=size.x
D=size.y
print("ALEX_BOUNDS",tuple(round(x,6) for x in (*mins,*maxs)))
print("ALEX_SIZE",tuple(round(x,6) for x in size))

# Remove imported empty hierarchy after baking.
for o in list(bpy.context.scene.objects):
    if o!=mesh and o.type!='MESH':
        bpy.data.objects.remove(o,do_unlink=True)

# Armature.
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

# Proportions measured from the approved ALEX mesh.
z_ank=ground+H*.085
z_knee=ground+H*.285
z_hip=ground+H*.455
z_spine=ground+H*.575
z_chest=ground+H*.695
z_neck=ground+H*.805
z_head=ground+H*.955
leg_x=W*.18
shoulder_x=W*.37
elbow_x=W*.42
wrist_x=W*.39

add_bone("root",(cx,cy,ground),(cx,cy,z_hip))
add_bone("pelvis",(cx,cy,z_hip-H*.055),(cx,cy,z_spine),"root")
add_bone("spine",(cx,cy,z_spine),(cx,cy,z_chest),"pelvis")
add_bone("chest",(cx,cy,z_chest),(cx,cy,z_neck),"spine")
add_bone("neck",(cx,cy,z_neck),(cx,cy,z_neck+H*.045),"chest")
add_bone("head",(cx,cy,z_neck+H*.035),(cx,cy,z_head),"neck")

for side,sgn in (("L",-1),("R",1)):
    xh=cx+sgn*leg_x
    add_bone(f"thigh.{side}",(xh,cy,z_hip),(xh,cy,z_knee),"pelvis")
    add_bone(f"shin.{side}",(xh,cy,z_knee),(xh,cy,z_ank),f"thigh.{side}",True)
    add_bone(f"foot.{side}",(xh,cy,z_ank),(xh,cy-D*.22,ground+H*.035),f"shin.{side}",True)

    xs=cx+sgn*shoulder_x
    xe=cx+sgn*elbow_x
    xw=cx+sgn*wrist_x
    z_sh=ground+H*.715
    z_el=ground+H*.525
    z_wr=ground+H*.335
    add_bone(f"upper_arm.{side}",(xs,cy,z_sh),(xe,cy,z_el),"chest")
    add_bone(f"forearm.{side}",(xe,cy,z_el),(xw,cy,z_wr),f"upper_arm.{side}",True)

bpy.ops.object.mode_set(mode='OBJECT')

# Deterministic coordinate-based skinning. This is intentionally simple for the
# first running prototype; it avoids Blender bone-heat failures on AI meshes made
# of many disconnected components.
for vg in list(mesh.vertex_groups):
    mesh.vertex_groups.remove(vg)

bone_names=["pelvis","spine","chest","neck","head",
            "thigh.L","shin.L","foot.L","thigh.R","shin.R","foot.R",
            "upper_arm.L","forearm.L","upper_arm.R","forearm.R"]
groups={n:mesh.vertex_groups.new(name=n) for n in bone_names}

def addw(i,name,w):
    if w>1e-5:
        groups[name].add([i],float(w),'ADD')

half=max(W/2,1e-6)
for v in mesh.data.vertices:
    x,y,z=v.co
    nz=(z-ground)/H
    nx=(x-cx)/half
    side="L" if x<cx else "R"
    outward=abs(nx)

    # Head/neck.
    if nz>=.80:
        blend=min(1,max(0,(nz-.80)/.07))
        addw(v.index,"neck",1-blend)
        addw(v.index,"head",blend)
        continue

    # Arms/sleeves: outside torso, shoulder to hands.
    arm_score=max(0,min(1,(outward-.48)/.20))
    if nz>.30 and nz<.76 and arm_score>.10:
        if nz>=.53:
            joint=max(0,min(1,(.62-nz)/.09))
            addw(v.index,f"upper_arm.{side}",1-joint*.35)
            addw(v.index,"chest",joint*.35*(1-arm_score*.35))
        else:
            t=max(0,min(1,(nz-.43)/.10))
            addw(v.index,f"forearm.{side}",1-t*.28)
            addw(v.index,f"upper_arm.{side}",t*.28)
        continue

    # Legs and shoes.
    if nz<.46:
        if nz<.105:
            t=max(0,min(1,(nz-.07)/.035))
            addw(v.index,f"foot.{side}",1-t*.25)
            addw(v.index,f"shin.{side}",t*.25)
        elif nz<.285:
            t=max(0,min(1,(nz-.24)/.07))
            addw(v.index,f"shin.{side}",1-t*.45)
            addw(v.index,f"thigh.{side}",t*.45)
        elif nz<.415:
            t=max(0,min(1,(nz-.37)/.06))
            addw(v.index,f"thigh.{side}",1-t*.40)
            addw(v.index,"pelvis",t*.40)
        else:
            addw(v.index,"pelvis",1)
        continue

    # Torso.
    if nz<.57:
        t=max(0,min(1,(nz-.49)/.08))
        addw(v.index,"pelvis",1-t)
        addw(v.index,"spine",t)
    elif nz<.69:
        t=max(0,min(1,(nz-.61)/.08))
        addw(v.index,"spine",1-t)
        addw(v.index,"chest",t)
    else:
        addw(v.index,"chest",1)

mod=mesh.modifiers.new("ALEX_Armature","ARMATURE")
mod.object=arm
mesh.parent=arm
mesh.matrix_parent_inverse=arm.matrix_world.inverted()

# Create the in-place running cycle.
bpy.context.view_layer.objects.active=arm
arm.select_set(True)
mesh.select_set(False)

action=bpy.data.actions.new("Run")
arm.animation_data_create()
arm.animation_data.action=action

for pb in arm.pose.bones:
    pb.rotation_mode='XYZ'

# Key poses: contact -> passing/flight -> opposite contact -> passing/flight -> loop.
poses={
    1:  dict(tL=32,tR=-28,sL=8,sR=48,aL=-34,aR=34,eL=-58,eR=-58,bob=.004,twist=-3),
    7:  dict(tL=8,tR=12,sL=34,sR=72,aL=-10,aR=10,eL=-62,eR=-62,bob=.020,twist=2),
    13: dict(tL=-28,tR=32,sL=48,sR=8,aL=34,aR=-34,eL=-58,eR=-58,bob=.004,twist=3),
    19: dict(tL=12,tR=8,sL=72,sR=34,aL=10,aR=-10,eL=-62,eR=-62,bob=.020,twist=-2),
    25: dict(tL=32,tR=-28,sL=8,sR=48,aL=-34,aR=34,eL=-58,eR=-58,bob=.004,twist=-3),
}

def rad(v): return math.radians(v)

for frame,p in poses.items():
    # Reset relevant bones.
    for name in bone_names:
        pb=arm.pose.bones.get(name)
        if pb:
            pb.rotation_euler=(0,0,0)
            pb.location=(0,0,0)

    arm.pose.bones["thigh.L"].rotation_euler.x=rad(p["tL"])
    arm.pose.bones["thigh.R"].rotation_euler.x=rad(p["tR"])
    arm.pose.bones["shin.L"].rotation_euler.x=rad(p["sL"])
    arm.pose.bones["shin.R"].rotation_euler.x=rad(p["sR"])
    arm.pose.bones["foot.L"].rotation_euler.x=rad(-8 if p["tL"]>15 else 10)
    arm.pose.bones["foot.R"].rotation_euler.x=rad(-8 if p["tR"]>15 else 10)

    arm.pose.bones["upper_arm.L"].rotation_euler.x=rad(p["aL"])
    arm.pose.bones["upper_arm.R"].rotation_euler.x=rad(p["aR"])
    arm.pose.bones["forearm.L"].rotation_euler.x=rad(p["eL"])
    arm.pose.bones["forearm.R"].rotation_euler.x=rad(p["eR"])

    # Mild athletic lean and counter-rotation, tuned for rear gameplay view.
    arm.pose.bones["spine"].rotation_euler.x=rad(-7)
    arm.pose.bones["chest"].rotation_euler.x=rad(-3)
    arm.pose.bones["pelvis"].rotation_euler.z=rad(p["twist"])
    arm.pose.bones["chest"].rotation_euler.z=rad(-p["twist"]*.75)

    # Root bone is vertical, so its local Y translation is approximately world-up.
    arm.pose.bones["root"].location.y=H*p["bob"]

    for name in bone_names:
        pb=arm.pose.bones.get(name)
        if not pb: continue
        pb.keyframe_insert("rotation_euler",frame=frame,group=name)
        pb.keyframe_insert("location",frame=frame,group=name)

# Smooth but controlled interpolation.
for fc in action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation='BEZIER'
        kp.handle_left_type='AUTO_CLAMPED'
        kp.handle_right_type='AUTO_CLAMPED'

action.use_fake_user=True
bpy.context.scene.frame_start=1
bpy.context.scene.frame_end=25
bpy.context.scene.render.fps=24

# Export only the actual runner + rig.
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
print("RUN_RIG_EXPORTED",dst)
print("RUN_ACTION",action.name,"frames",bpy.context.scene.frame_start,bpy.context.scene.frame_end)
