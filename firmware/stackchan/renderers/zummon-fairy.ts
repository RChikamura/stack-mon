import { Outline, CanvasPath } from 'commodetto/outline';
import { RendererBase, Layer, type FacePartFactory, type FaceContext } from 'renderer-base'
import { createBlinkModifier, createBreathModifier, createSaccadeModifier } from 'modifier'

// typescriptでは、booleanでxorができないので、関数として定義しておく
function xor(a: boolean, b: boolean): boolean {
  return (a || b) && !(a && b);
}

// Renderers

// 目や瞼の白い部分
export const createEyelidPart: FacePartFactory<{
  cx: number
  cy: number
  width: number
  height: number
  side: keyof FaceContext['eyes']
  radius?: number
}> =
  ({ cx, cy, width, height, side, radius = 19 }) =>
  (_tick, path, { eyes, emotion }) => {
    const eye = eyes[side]
    const offsetX = (eye.gazeX ?? 0) * 2
    const offsetY = (eye.gazeY ?? 0) * 2
    let orient // SADとANGRYで使う、傾斜の向きを変える変数

    if (emotion == 'HAPPY' || emotion == 'ANGRY' || emotion == 'SAD') { // HAPPY, ANGRY, SADの時は感情に合わせて目を一部覆う
      switch (emotion) {
        case 'HAPPY':
          path.arc(cx + offsetX, cy + offsetY, radius - 4, Math.PI, 2 * Math.PI)
          path.rect(cx - radius + 4, cy - 1, 2 * radius - 8, 3)
          break
        case 'ANGRY':
        case 'SAD':
          if (xor((emotion == 'SAD'), (side == 'left'))) {
            orient = 1
          } else {
            orient = -1
          }
          path.moveTo(cx - (17 * orient), cy - 20)
          path.lineTo(cx + (20 * orient), cy - 20)
          path.lineTo(cx + (20 * orient), cy + ((emotion == 'ANGRY') ? 4 : 0))
          path.lineTo(cx - (17 * orient), cy - 20)
          path.closePath()
          break
        default:
          break
      }
    } else {
      // SLEEPY, NORMALでは特に何もしない

      // 目が半分以上閉じたとき目を一部覆う。閾値が0.6なのは、eye.openが0.2～1で変化する仕様だから
      if (eye.open < 0.6) {
        path.ellipse(cx + offsetX, cy + offsetY, radius - 4, (radius - 4) * (1.5 - 2.5 * eye.open), 0, 0, 2 * Math.PI)
      }
    }
  }

// 頭のずんだ色の部分
export const createHeadPart: FacePartFactory<{
  cx: number
  cy: number
}> =
  ({ cx, cy }) =>
    (_tick, path, { eyes }) => {
    //曲線で頭の形を描画
    path.moveTo(0, 0);
    path.lineTo(0, 100);
    path.quadraticCurveTo(60, 78, 117, 46);
    path.quadraticCurveTo(133, 76, 146, 123);
    path.quadraticCurveTo(203, 107, 212, 49);
    path.quadraticCurveTo(273, 56, 320, 97);
    path.lineTo(320, 0);
    path.lineTo(0, 0);
    path.closePath()
  }

// 瞳の黒い部分
export const createEyePart: FacePartFactory<{
  cx: number
  cy: number
  radius?: number
  side: keyof FaceContext['eyes']
}> =
  ({ cx, cy, radius = 19, side }) =>
  (_tick, path, { eyes , emotion }) => {
    const eye = eyes[side]
    const offsetX = (eye.gazeX ?? 0) * 2
    const offsetY = (eye.gazeY ?? 0) * 2
    let radiusY // 瞳上半分のY半径。瞬きの時変化する
    if (emotion == 'HAPPY') {
      // HAPPYの時は、円の上半分だけ描画し、瞬きしない
      path.arc(cx + offsetX, cy + offsetY, radius, Math.PI, 2 * Math.PI)
    } else if (emotion == 'ANGRY' || emotion == 'SAD') {
      // ANGRY, SADの時も、なんか違和感がすごいので瞬きしない
      path.arc(cx + offsetX, cy + offsetY, radius, 0, 2 * Math.PI)
    } else {
      // SLEEPPYではなく、かつ目が半分以上開いているとき
      // SLEEPYの時は目は半開きで固定
      if (eye.open > 0.6 && emotion != 'SLEEPY') {
        radiusY = radius * (2.5 * eye.open - 1.5)
      } else {
        radiusY = 0
      }
      path.ellipse(cx + offsetX, cy + offsetY, radius, radiusY, 0, Math.PI, 2 * Math.PI)

      // 目の下半分は常に描画
      path.arc(cx + offsetX, cy + offsetY, radius, 0, Math.PI)
    }
    path.closePath()
  }

// 瞳のハイライト
export const createHLPart: FacePartFactory<{
  cx: number
  cy: number
  radius?: number
  side: keyof FaceContext['eyes']
}> =
  ({ cx, cy, radius = 4, side }) =>
    (_tick, path, { eyes, emotion }) => {
    const eye = eyes[side]
    const offsetX = (eye.gazeX ?? 0) * 2
    const offsetY = (eye.gazeY ?? 0) * 2
      if (emotion == 'ANGRY' || emotion == 'SAD') {
        // ANGRYとSADの時は、ハイライトを目の右下にやや小さく描画
        path.arc(cx + offsetX + 8, cy + offsetY + 8, 3, 0, 2 * Math.PI)

      } else if (emotion != 'HAPPY' && emotion != 'SLEEPY') { // HAPPY, SLEEPYの時はハイライトを描画しない
        // ハイライトを目の左上に描画し、瞬きに連動して動かす。
        path.ellipse(cx + offsetX - 8, cy + offsetY + 8 - (20 * eye.open - 4), radius, radius * (1.25 * eye.open - 0.25), 0, 0, 2 * Math.PI)
      }
      path.closePath()
  }

// 頬
export const createCheekPart: FacePartFactory<{
  cx: number
  cy: number
}> =
  ({ cx, cy}) =>
    (_tick, path) => {
    // 曲線で頬の形を描画
    path.moveTo(cx - 7, cy - 9);
    path.quadraticCurveTo(cx - 16, cy - 9, cx - 16, cy);
    path.quadraticCurveTo(cx - 16, cy + 9, cx - 7, cy + 9);
    path.lineTo(cx + 6, cy + 9);
    path.quadraticCurveTo(cx + 15, cy + 9, cx + 15, cy);
    path.quadraticCurveTo(cx + 15, cy - 9, cx + 6, cy - 9);
    path.lineTo(cx - 7, cy - 9);
  }

// 鼻(ただの線)
export const createNosePart: FacePartFactory<{
  cx: number
  cy: number
}> =
  ({ cx, cy}) =>
  (_tick, path) => {
    path.moveTo(cx - 3, cy);
    path.lineTo(cx + 3, cy);
  }

// 上唇
export const createUpMouthPart: FacePartFactory<{
  cx: number
  cy: number
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
}> =
  ({ cx, cy, minWidth = 46, maxWidth = 60 }) =>
    (_tick, path, { mouth }) => {
      const openRatio = mouth.open
      const w = (minWidth + (maxWidth - minWidth) * (1 - openRatio)) / 2
      const cpx = 14 - 3 * openRatio // 中間制御点の中心からの距離
      // 曲線で描画
      path.moveTo(cx - w, cy + 11);
      path.quadraticCurveTo(cx - cpx, cy + 8, cx, cy);
      path.quadraticCurveTo(cx + cpx, cy + 8, cy + w, cy + 11);
      path.closePath()
    }

// 下唇の輪郭線と口内が上唇を超えて描画されないように隠すパーツ
export const createMouthMaskPart: FacePartFactory<{
  cx: number
  cy: number
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
}> =
  ({ cx, cy, minWidth = 46, maxWidth = 60 }) =>
    (_tick, path, { mouth }) => {
      const openRatio = mouth.open
      const w = (minWidth + (maxWidth - minWidth) * (1 - openRatio)) / 2
      const cpx = 14 - 3 * openRatio // 中間制御点の中心からの距離
      // 曲線で描画。パーツ下側の造形は上唇の線と完全に一致
      path.moveTo(cx - w, cy - 6);
      path.lineTo(cx - w, cy + 11);
      path.quadraticCurveTo(cx - cpx, cy + 8, cx, cy);
      path.quadraticCurveTo(cx + cpx, cy + 8, cy + w, cy + 11);
      path.lineTo(cx + w, cy - 6);
      path.lineTo(cx - w, cy - 6);
      path.closePath()
    }

// 下唇の輪郭線と口内を兼ねたパーツ
export const createMouthPart: FacePartFactory<{
  cx: number
  cy: number
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
}> =
  ({ cx, cy, minWidth = 40, maxWidth = 50, minHeight = 0, maxHeight = 35 }) =>
    (_tick, path, { mouth }) => {
    const openRatio = mouth.open
    const h = minHeight + (maxHeight - minHeight) * openRatio
    const w = (minWidth + (maxWidth - minWidth) * (1 - openRatio)) / 2
    const cpx = w / 2 + 3 // 中間制御点の中心からのX距離
    const cpy = 28 * openRatio // 中間制御点の中心からのY距離

    // 曲線で描画
    path.moveTo(cx - w, cy);
    path.quadraticCurveTo(cx - cpx, cy + cpy, cx, cy + h);
    path.quadraticCurveTo(cx + cpx, cy + cpy, cx + w, cy);
    path.closePath()
  }

export class Renderer extends RendererBase {
  constructor(option) {
    super(option)
    this.filters = [
      createBlinkModifier({ openMin: 400, openMax: 5000, closeMin: 200, closeMax: 400 }),
      createBreathModifier({ duration: 6000 }),
      createSaccadeModifier({ updateMin: 300, updateMax: 2000, gain: 0.2 }),
    ]

    // 以下、顔パーツの描画。各レイヤーが固有の色を持つ仕様になっているため、色ごとにレイヤーが分かれている。
    // 後に書いたレイヤーが上になる
    // 頭のずんだ色のレイヤー
    const headLayer = new Layer({ colorName: 'third', type: 'fill' })
    this.layers.push(headLayer)
    headLayer.addPart('head', createHeadPart({ cx: 0, cy: 0 })) //頭パーツ

    // 頬のレイヤー
    const cheekLayer = new Layer({ colorName: 'fourth', type: 'fill' })
    this.layers.push(cheekLayer)
    cheekLayer.addPart('leftcheek', createCheekPart({ cx: 68, cy: 154 })) //左頬パーツ
    cheekLayer.addPart('rightcheek', createCheekPart({ cx: 253, cy: 154 })) // 右頬パーツ

    // 口の中の塗りつぶしレイヤー
    const mouthfillLayer = new Layer({ colorName: 'fifth', type: 'fill'})
    this.layers.push(mouthfillLayer)
    mouthfillLayer.addPart('mouthFill', createMouthPart({ cx: 160, cy: 165 })) //口パーツ

    // 下唇の線のレイヤー
    const mouthstrokeLayer = new Layer({ colorName: 'primary', type: 'stroke', lineWidth: 3 }) //口パーツ
    this.layers.push(mouthstrokeLayer)
    mouthstrokeLayer.addPart('mouth', createMouthPart({ cx: 160, cy: 165 }))

    // 下唇と口内が上唇を越えないようにマスクするレイヤー
    const mouthMaskLayer = new Layer({ colorName: 'secondary', type: 'fill' })
    this.layers.push(mouthMaskLayer)
    mouthMaskLayer.addPart('mouthMask', createMouthMaskPart({ cx: 160, cy: 165 })) //マスクパーツ

    // 上唇と鼻のレイヤー
    const upMouthstrokeLayer = new Layer({ colorName: 'primary', type: 'stroke', lineWidth: 4 })
    this.layers.push(upMouthstrokeLayer)
    upMouthstrokeLayer.addPart('upMouth', createUpMouthPart({ cx: 160, cy: 165 })) //上唇パーツ
    upMouthstrokeLayer.addPart('nose', createNosePart({ cx: 160, cy: 159 })) // 

    // 目の黒いパーツのレイヤー
    const eyeLayer1 = new Layer({ colorName: 'primary', type: 'fill' })
    this.layers.push(eyeLayer1)
    eyeLayer1.addPart('leftEye', createEyePart({ cx: 91, cy: 137, side: 'left', radius: 19 })) //左の瞳パーツ
    eyeLayer1.addPart('rightEye', createEyePart({ cx: 229, cy: 137, side: 'right', radius: 19 })) //右の瞳パーツ

    // 目の白いパーツのレイヤー
    const eyeLayer2 = new Layer({ colorName: 'secondary', type: 'fill' })
    this.layers.push(eyeLayer2)
    eyeLayer2.addPart('leftHL', createHLPart({ cx: 91, cy: 137, side: 'left', radius: 4 })) //左のハイライトパーツ
    eyeLayer2.addPart('rightHL', createHLPart({ cx: 229, cy: 137, side: 'right', radius: 4 })) //右のハイライトパーツ
    eyeLayer2.addPart('leftEyelid', createEyelidPart({ cx: 91, cy: 137, side: 'left', width: 0, height: 0 })) //左の瞼パーツ
    eyeLayer2.addPart('rightEyelid', createEyelidPart({ cx: 229, cy: 137, side: 'right', width: 0, height: 0 })) //右の瞼パーツ
  }
}
