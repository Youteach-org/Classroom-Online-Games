#!/usr/bin/env python3
import bpy, sys, math, traceback
from mathutils import Vector

argv=sys.argv
argv=argv[argv.index("--")+1:] if "--" in argv else []
if len(argv)<2:
    raise SystemExit("usage: blender --background --python rig-alex-run-v3.py -- INPUT.glb OUTPUT.glb")
src,dst=argv[0],argv[1]

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=src)

meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
if not meshes:
    raise RuntimeError("No mesh imported")
mesh=max(meshes,key=lambda o: len(o.data.vertices))

mw=mesh.matrix_world.copy()
mesh.parent=None
mesh.matrix_world=mw
bpy.context.view_layer.objects.active=mesh
mesh.select_set(True)
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
for o in meshes:
    if o!=mesh: o.select_set(False)

V=[v.co.copy() for v in mesh.data.vertices]
mins=Vector((min(v.x for v in V),min(v.y for v in V),min(v.z for v in V)))
maxs=Vector((max(v.x for v in V),max(v.y for v in V),max(v.z for v in V)))
size=maxs-mins
cx=(mins.x+maxs.x)/2
cy=(mins.y+maxs.y)/2
ground=mins.z
H=size.z; W=size.x; D=size.y
print("ALEX_SIZE",tuple(round(x,6) for x in size))

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

def add_bone(name,head,tail,parent=None,use_connect=False,deform=True):
    b=arm_data.edit_bones.new(name)
    b.head=head; b.tail=tail; b.roll=0; b.use_deform=deform
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

add_bone("root",(cx,cy,ground),(cx,cy,z_hip),deform=False)
add_bone("pelvis",(cx,cy,z_hip-H*.055),(cx,cy,z_spine),"root")
add_bone("spine",(cx,cy,z_spine),(cx,cy,z_chest),"pelvis")
add_bone("chest",(cx,cy,z_chest),(cx,cy,z_neck),"spine")
add_bone("neck",(cx,cy,z_neck),(cx,cy,z_neck+H*.040),"chest")
add_bone("head",(cx,cy,z_neck+H*.035),(cx,cy,z_head),"neck")

for side,sgn in (("L",-1),("R",1)):
    xh=cx+sgn*leg_x
    add_bone(f"thigh.{side}",(xh,cy,z_hip),(xh,cy,z_knee),"pelvis")
    add_bone(f"shin.{side}",(xh,cy,z_knee),(xh,cy,z_ank),f"thigh.{side}",True)
    add_bone(f"foot.{side}",(xh,cy,z_ank),(xh,cy-D*.20,ground+H*.035),f"shin.{side}",True)
    xs=cx+sgn*shoulder_x
    xe=cx+sgn*elbow_x
    xw=cx+sgn*wrist_x
    add_bone(f"upper_arm.{side}",(xs,cy,z_sh),(xe,cy,z_el),"chest")
    add_bone(f"forearm.{side}",(xe,cy,z_el),(xw,cy,z_wr),f"upper_arm.{side}",True)

bpy.ops.object.mode_set(mode='OBJECT')

# ---------- continuous proxy skinning ----------
# Duplicate ALEX, voxel-remesh only the duplicate, calculate coherent weights on it,
# then transfer those weights back to the textured original.
proxy=mesh.copy()
proxy.data=mesh.data.copy()
proxy.name="ALEX_WeightProxy"
bpy.context.collection.objects.link(proxy)
proxy.parent=None
proxy.matrix_world=mesh.matrix_world.copy()

bpy.ops.object.select_all(action='DESELECT')
proxy.select_set(True)
bpy.context.view_layer.objects.active=proxy

# About 75 voxels over body height: enough anatomical detail, but bridges tiny AI gaps.
proxy.data.remesh_voxel_size=max(H/75.0,0.004)
proxy.data.remesh_voxel_adaptivity=0.0
bpy.ops.object.voxel_remesh()
print("PROXY_VERTS",len(proxy.data.vertices),"VOXEL",proxy.data.remesh_voxel_size)

# Automatic bone heat on the clean continuous proxy.
bpy.ops.object.select_all(action='DESELECT')
proxy.select_set(True)
arm.select_set(True)
bpy.context.view_layer.objects.active=arm
auto_ok=True
try:
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')
except Exception as exc:
    auto_ok=False
    print("AUTO_WEIGHT_FAILED",repr(exc))
    traceback.print_exc()

# Fallback to envelopes if heat weighting fails.
if (not auto_ok) or len(proxy.vertex_groups)<8:
    for vg in list(proxy.vertex_groups):
        proxy.vertex_groups.remove(vg)
    for m in list(proxy.modifiers):
        if m.type=='ARMATURE': proxy.modifiers.remove(m)
    proxy.parent=None
    bpy.ops.object.select_all(action='DESELECT')
    proxy.select_set(True); arm.select_set(True)
    bpy.context.view_layer.objects.active=arm
    bpy.ops.object.parent_set(type='ARMATURE_ENVELOPE')
    print("WEIGHTS_MODE","ENVELOPE")
else:
    print("WEIGHTS_MODE","AUTO")

print("PROXY_GROUPS",[g.name for g in proxy.vertex_groups])

# Make matching groups on the original mesh.
for vg in list(mesh.vertex_groups):
    mesh.vertex_groups.remove(vg)
for vg in proxy.vertex_groups:
    mesh.vertex_groups.new(name=vg.name)

# Transfer smooth proxy weights to all disconnected source pieces by nearest surface.
bpy.context.view_layer.objects.active=mesh
bpy.ops.object.select_all(action='DESELECT')
mesh.select_set(True)
dt=mesh.modifiers.new("ALEX_WeightTransfer",'DATA_TRANSFER')
dt.object=proxy
dt.use_vert_data=True
dt.data_types_verts={'VGROUP_WEIGHTS'}
dt.vert_mapping='POLYINTERP_NEAREST'
dt.layers_vgroup_select_src='ALL'
dt.layers_vgroup_select_dst='NAME'
dt.mix_mode='REPLACE'
dt.mix_factor=1.0
bpy.ops.object.modifier_apply(modifier=dt.name)

# Normalize transferred groups.
try:
    bpy.context.view_layer.objects.active=mesh
    bpy.ops.object.vertex_group_normalize_all(group_select_mode='ALL',lock_active=False)
except Exception as exc:
    print("NORMALIZE_WARNING",repr(exc))

# Parent original to rig with the transferred weights.
arm_mod=mesh.modifiers.new("ALEX_Armature",'ARMATURE')
arm_mod.object=arm
mesh.parent=arm
mesh.matrix_parent_inverse=arm.matrix_world.inverted()

# Remove proxy so it can never appear in export.
bpy.data.objects.remove(proxy,do_unlink=True)

# ---------- forward running cycle ----------
bpy.context.view_layer.objects.active=arm
bpy.ops.object.select_all(action='DESELECT')
arm.select_set(True)
action=bpy.data.actions.new("Run")
arm.animation_data_create()
arm.animation_data.action=action

bone_names=["pelvis","spine","chest","neck","head",
            "thigh.L","shin.L","foot.L","thigh.R","shin.R","foot.R",
            "upper_arm.L","forearm.L","upper_arm.R","forearm.R"]
for pb in arm.pose.bones:
    pb.rotation_mode='XYZ'

poses={
    1:  dict(tL=-25,tR=22,sL=8,sR=30,aL=28,aR=-28,eL=48,eR=48,bob=.002,twist=-2.5),
    7:  dict(tL=18,tR=-38,sL=38,sR=70,aL=-34,aR=34,eL=55,eR=55,bob=.016,twist=2.0),
    13: dict(tL=22,tR=-25,sL=30,sR=8,aL=-28,aR=28,eL=48,eR=48,bob=.002,twist=2.5),
    19: dict(tL=-38,tR=18,sL=70,sR=38,aL=34,aR=-34,eL=55,eR=55,bob=.016,twist=-2.0),
    25: dict(tL=-25,tR=22,sL=8,sR=30,aL=28,aR=-28,eL=48,eR=48,bob=.002,twist=-2.5),
}
def rad(v): return math.radians(v)

for frame,p in poses.items():
    for name in bone_names:
        pb=arm.pose.bones.get(name)
        if pb:
            pb.rotation_euler=(0,0,0); pb.location=(0,0,0)

    arm.pose.bones["thigh.L"].rotation_euler.x=rad(p["tL"])
    arm.pose.bones["thigh.R"].rotation_euler.x=rad(p["tR"])
    arm.pose.bones["shin.L"].rotation_euler.x=rad(p["sL"])
    arm.pose.bones["shin.R"].rotation_euler.x=rad(p["sR"])

    toeL=5 if p["tL"]<-30 else 0
    toeR=5 if p["tR"]<-30 else 0
    arm.pose.bones["foot.L"].rotation_euler.x=rad(-(p["tL"]+p["sL"])+toeL)
    arm.pose.bones["foot.R"].rotation_euler.x=rad(-(p["tR"]+p["sR"])+toeR)

    arm.pose.bones["upper_arm.L"].rotation_euler.x=rad(p["aL"])
    arm.pose.bones["upper_arm.R"].rotation_euler.x=rad(p["aR"])
    arm.pose.bones["forearm.L"].rotation_euler.x=rad(p["eL"])
    arm.pose.bones["forearm.R"].rotation_euler.x=rad(p["eR"])
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
mesh.select_set(True); arm.select_set(True)
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
print("RUN_V3_EXPORTED",dst)
