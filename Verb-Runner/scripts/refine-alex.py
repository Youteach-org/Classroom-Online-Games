#!/usr/bin/env python3
import sys
import cv2
import numpy as np
import trimesh
from PIL import Image

src = sys.argv[1]
dst = sys.argv[2] if len(sys.argv) > 2 else src

scene = trimesh.load(src, force="scene")
name, mesh = next(iter(scene.geometry.items()))
V = np.asarray(mesh.vertices, dtype=np.float64)
F = np.asarray(mesh.faces, dtype=np.int32)
UV = np.asarray(mesh.visual.uv, dtype=np.float64)
tex = np.asarray(mesh.visual.material.baseColorTexture.convert("RGB")).copy()
th, tw = tex.shape[:2]

H, W = 1500, 900
xmin, xmax = V[:,0].min(), V[:,0].max()
ymin, ymax = V[:,1].min(), V[:,1].max()
pad = 0.08
scale = min((W*(1-2*pad))/(xmax-xmin), (H*(1-2*pad))/(ymax-ymin))
cx, cy = (xmin+xmax)/2, (ymin+ymax)/2
screen = np.empty((len(V),2), dtype=np.float64)
screen[:,0] = (V[:,0]-cx)*scale + W/2
screen[:,1] = H/2 - (V[:,1]-cy)*scale

def raster(sign):
    img = np.full((H,W,3), 235, dtype=np.uint8)
    zbuf = np.full((H,W), -1e9, dtype=np.float32)
    uvbuf = np.full((H,W,2), np.nan, dtype=np.float32)
    depth = (sign*V[:,2]).astype(np.float32)
    order = np.argsort(depth[F].mean(axis=1))
    for fi in order:
        ids = F[fi]
        pts = screen[ids]
        x0,y0 = np.floor(pts.min(axis=0)).astype(int)
        x1,y1 = np.ceil(pts.max(axis=0)).astype(int)
        if x1 < 0 or y1 < 0 or x0 >= W or y0 >= H:
            continue
        x0=max(0,x0); y0=max(0,y0); x1=min(W-1,x1); y1=min(H-1,y1)
        a,b,c = pts
        den = ((b[1]-c[1])*(a[0]-c[0]) + (c[0]-b[0])*(a[1]-c[1]))
        if abs(den) < 1e-10:
            continue
        xs=np.arange(x0,x1+1,dtype=np.float32)
        ys=np.arange(y0,y1+1,dtype=np.float32)
        X,Y=np.meshgrid(xs,ys)
        w0=((b[1]-c[1])*(X-c[0])+(c[0]-b[0])*(Y-c[1]))/den
        w1=((c[1]-a[1])*(X-c[0])+(a[0]-c[0])*(Y-c[1]))/den
        w2=1-w0-w1
        inside=(w0>=-1e-5)&(w1>=-1e-5)&(w2>=-1e-5)
        if not inside.any():
            continue
        z=w0*depth[ids[0]]+w1*depth[ids[1]]+w2*depth[ids[2]]
        zb=zbuf[y0:y1+1,x0:x1+1]
        upd=inside&(z>zb)
        if not upd.any():
            continue
        uv0,uv1,uv2=UV[ids]
        u=w0*uv0[0]+w1*uv1[0]+w2*uv2[0]
        v=w0*uv0[1]+w1*uv1[1]+w2*uv2[1]
        patch=uvbuf[y0:y1+1,x0:x1+1]
        patch[...,0][upd]=u[upd]
        patch[...,1][upd]=v[upd]
        tx=np.clip((u*(tw-1)).astype(int),0,tw-1)
        ty=np.clip(((1-v)*(th-1)).astype(int),0,th-1)
        col=tex[ty,tx]
        ip=img[y0:y1+1,x0:x1+1]
        ip[upd]=col[upd]
        zb[upd]=z[upd]
    return img, uvbuf

def clean_rear(bgr):
    h,w=bgr.shape[:2]
    sm=cv2.bilateralFilter(bgr,7,28,28)
    out=cv2.addWeighted(sm,1.10,cv2.GaussianBlur(sm,(0,0),0.8),-0.10,0)
    hsv=cv2.cvtColor(out,cv2.COLOR_BGR2HSV)
    Hc,Sc,Vc=cv2.split(hsv)
    Y,X=np.ogrid[:h,:w]
    subj=np.any(bgr<225,axis=2)

    hair=subj&(Y<int(h*.225))&(Vc<135)
    Hc[hair]=8
    Sc[hair]=np.clip(Sc[hair].astype(np.float32)*1.05,60,150).astype(np.uint8)
    Vc[hair]=np.clip(Vc[hair].astype(np.float32)*0.90,18,105).astype(np.uint8)

    red=subj&(Sc>75)&((Hc<16)|(Hc>165))
    Hc[red]=np.where(Hc[red]>165,179,2).astype(np.uint8)
    Sc[red]=np.clip(Sc[red].astype(np.float32)*1.04,90,240).astype(np.uint8)

    white=subj&(Sc<60)&(Vc>145)
    Sc[white]=np.minimum(Sc[white],15)
    Vc[white]=np.clip(Vc[white].astype(np.float32)*1.03,160,245).astype(np.uint8)
    out=cv2.cvtColor(cv2.merge([Hc,Sc,Vc]),cv2.COLOR_HSV2BGR)

    # remove the small pale artifact on the middle of the hoodie
    mx,my=int(w*.50),int(h*.445)
    YY,XX=np.ogrid[:h,:w]
    blem=((XX-mx)/(w*.040))**2+((YY-my)/(h*.016))**2<1
    ring=(((XX-mx)/(w*.083))**2+((YY-my)/(h*.034))**2<1)&(~blem)
    hsv0=cv2.cvtColor(out,cv2.COLOR_BGR2HSV)
    hh,ss,vv=cv2.split(hsv0)
    redring=ring&(ss>85)&((hh<16)|(hh>165))
    if redring.any():
        med=np.median(out[redring],axis=0)
        smooth=cv2.GaussianBlur(out,(0,0),10)
        fill=(smooth.astype(np.float32)*0.45+med[None,None,:]*0.55).astype(np.uint8)
        a=np.zeros((h,w),np.uint8); a[blem]=255
        a=cv2.GaussianBlur(a,(0,0),4).astype(np.float32)/255.0
        out=(fill*a[...,None]+out*(1-a[...,None])).astype(np.uint8)

    bottom=(Y>int(h*.79))&subj
    shoes=cv2.bilateralFilter(out,9,35,35)
    out[bottom]=shoes[bottom]
    return out

def clean_front(bgr):
    # Keep the approved front geometry/identity, only reduce AI texture noise.
    sm=cv2.bilateralFilter(bgr,5,18,18)
    out=cv2.addWeighted(sm,1.07,cv2.GaussianBlur(sm,(0,0),0.65),-0.07,0)
    return out

def bake(target_bgr, uvbuf, weight):
    global tex
    target=cv2.cvtColor(target_bgr,cv2.COLOR_BGR2RGB)
    valid=np.isfinite(uvbuf[...,0])
    yy,xx=np.where(valid)
    u=uvbuf[yy,xx,0]
    v=uvbuf[yy,xx,1]
    tx=np.clip(np.rint(u*(tw-1)).astype(int),0,tw-1)
    ty=np.clip(np.rint((1-v)*(th-1)).astype(int),0,th-1)
    cols=target[yy,xx].astype(np.float32)
    keep=np.min(cols,axis=1)<225
    tx,ty,cols=tx[keep],ty[keep],cols[keep]
    flat=ty*tw+tx
    sums=np.zeros((th*tw,3),dtype=np.float64)
    counts=np.zeros(th*tw,dtype=np.float64)
    for ch in range(3):
        np.add.at(sums[:,ch],flat,cols[:,ch])
    np.add.at(counts,flat,1)
    hit=counts>0
    baked=sums[hit]/counts[hit,None]
    old=tex.reshape(-1,3)[hit].astype(np.float32)
    tex.reshape(-1,3)[hit]=np.clip(old*(1-weight)+baked*weight,0,255).astype(np.uint8)

front_rgb, front_uv = raster(+1)
rear_rgb, rear_uv = raster(-1)
front_bgr=cv2.cvtColor(front_rgb,cv2.COLOR_RGB2BGR)
rear_bgr=cv2.cvtColor(rear_rgb,cv2.COLOR_RGB2BGR)

# Front gets a light cleanup; rear gets the stronger pass because that is the gameplay view.
bake(clean_front(front_bgr), front_uv, 0.22)
bake(clean_rear(rear_bgr), rear_uv, 0.72)

mesh.visual.material.baseColorTexture=Image.fromarray(tex)
out_scene=trimesh.Scene()
out_scene.add_geometry(mesh,geom_name="geometry_0",node_name="geometry_0")
with open(dst,"wb") as f:
    f.write(out_scene.export(file_type="glb"))

print("refined", dst, "bytes", len(open(dst,"rb").read()))
