export const COASTAL_SCENE = Object.freeze({
  roadColor: 0x657486,
  sidewalkColor: 0xeadfce,
  seaColor: 0x159fc5,
  skyColor: 0x8fd4ef,
  camera: Object.freeze({
    desktop: Object.freeze({
      fov: 50,
      far: 320,
      position: Object.freeze([0, 4.9, 10.6]),
      lookAt: Object.freeze([0, 1.62, -22])
    }),
    mobile: Object.freeze({
      fov: 59,
      far: 300,
      position: Object.freeze([0, 4.55, 9.7]),
      lookAt: Object.freeze([0, 1.66, -18])
    })
  }),
  layout: Object.freeze({
    roadWidth: 12,
    leftPromenadeWidth: 4.5,
    rightSidewalkWidth: 2.35,
    seaWallX: -10.42,
    villageX: 8.35
  }),
  loop: Object.freeze({
    nearSpan: 195,
    farSpan: 235
  })
});
