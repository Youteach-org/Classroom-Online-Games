#!/usr/bin/env python3
import bpy, sys, math, os
from mathutils import Vector

argv=sys.argv
argv=argv[argv.index("--")+1:] if "--" in argv else []
src,outdir=argv[0],argv[1]
os.makedirs(outdir,exist_ok=True)

bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=src)
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
box=None
for o in meshes:
    b=o.matrix_world
    corners=[b @ Vector(c) for c in o.bound_box]
    if box is None:
        mn=Vector((min(p.x for p in corners),min(p.y for p in corners),min(p.z for p in corners)))
        mx=Vector((max(p.x for p in corners),max(p.y for p in corners),max(p.z for p in corners)))
    else: pass
cx=(mn.x+mx.x)/2; cy=(mn.y+mx.y)/2; cz=(mn.z+mx.z)/2
H=mx.z-mn.z

# Ground plane.
bpy.ops.mesh.primitive_plane_add(size=6,location=(cx,cy,mn.z-.01))
plane=bpy.context.object
mat=bpy.data.materials.new("ground"); mat.diffuse_color=(.17,.19,.22,1); plane.data.materials.append(mat)

world=bpy.context.scene.world
world.color=(.055,.065,.08)
bpy.ops.object.light_add(type='AREA',location=(cx+1.7,cy-1.8,mx.z+1.8))
bpy.context.object.data.energy=850; bpy.context.object.data.shape='DISK'; bpy.context.object.data.size=4
bpy.ops.object.light_add(type='AREA',location=(cx-1.8,cy+1.5,mx.z+1.1))
bpy.context.object.data.energy=500; bpy.context.object.data.size=3

bpy.ops.object.camera_add()
cam=bpy.context.object
bpy.context.scene.camera=cam
cam.data.lens=65

def look_at(obj,target):
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()

scene=bpy.context.scene
scene.render.engine='BLENDER_EEVEE'
scene.render.resolution_x=520
scene.render.resolution_y=720
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.film_transparent=False

views={
  "rear": (cx,cy+H*2.1,cz+H*.05),
  "front":(cx,cy-H*2.1,cz+H*.05),
  "side": (cx+H*2.1,cy,cz+H*.05),
}
frames=[1,7,13,19]
for frame in frames:
    scene.frame_set(frame)
    for name,pos in views.items():
        cam.location=pos
        look_at(cam,(cx,cy,cz))
        scene.render.filepath=os.path.join(outdir,f"{name}-{frame:02d}.png")
        bpy.ops.render.render(write_still=True)
        print("RENDERED",scene.render.filepath)
