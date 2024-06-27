import { speeches } from 'speeches_monologue'
import { randomBetween, asyncWait } from 'stackchan-util'
import config from 'mc/config'

const keys = Object.keys(speeches)


// 音声の合成と感情の反映 monologue modから移植し、機能追加
let speakFlag = false
async function sayMonologue(robot) {
  const idx = Math.floor(randomBetween(0, keys.length))
  const key = keys[idx]
  robot.setEmotion(speeches[key].emotion)
  await robot.say(config.tts.type == 'local' ? key : speeches[key].text)
  robot.setEmotion('NORMAL')
  robot.setMouth(0) // robot.tsに作った独自定義関数。口閉じの時間が足りない状態で表情を変えたとき、口が半開きのまま表情が固定される仕様に対処
}

// 視線や顔の向き look around modから移植
let isFollowing = false
async function looking(robot) {
  if (!isFollowing) {
    robot.lookAway()
    return
  }
  const x = randomBetween(0.4, 1.0)
  const y = randomBetween(-0.4, 0.4)
  const z = randomBetween(-0.02, 0.2)
  trace(`looking at: [${x}, ${y}, ${z}]\n`)
  robot.lookAt([x, y, z])
}

// 音声合成と視線制御の関数を、一定のインターバルを空けて連続的にに呼び出し
async function repeatFunction(robot, interval) {
  while (true) {
    looking(robot) // 視線制御関数。状態別の分岐は関数のほうにある
    if (speakFlag) {
      await sayMonologue(robot) // 音声・表情関数。Flagをもとに、実行するのかを決定。実行が終わるまで待つ
    }
    await asyncWait(interval) // 引数で設定した時間待ってからまた実行
  }
}

function onRobotCreated(robot) {
  robot.setColor('primary', 0x00, 0x00, 0x00)
  robot.setColor('secondary', 0xff, 0xff, 0xff)
  robot.setColor('third', 0xb9, 0xff, 0x44) // head
  robot.setColor('fourth', 0xff, 0xbb, 0xbf) // cheek
  robot.setColor('fifth', 0xff, 0xa4, 0xa4) // mouth

  /* buttonA: speak */
  robot.button.a.onChanged = async function () {
    if (this.read()) {
      robot.showBalloon("Btn A")
      trace('pressed A\n')
      speakFlag = !speakFlag // しゃべらせるかどうかのフラグを反転
      await asyncWait(1000)
      robot.hideBalloon()
    }
  }


  /* buttonB: move */
  robot.button.b.onChanged = async function () {
    if (this.read()) {
      robot.showBalloon("Btn B")
      trace('pressed B\n')
      isFollowing = !isFollowing // 視線のフラグを反転
      await asyncWait(1000)
      robot.hideBalloon()
    }
  }

  /* butttonC: colorChange */
  let flag = false
  robot.button.c.onChanged = async function () {
    if (this.read()) {
      robot.showBalloon("Btn C")
      trace('pressed C\n')
      if (flag) {
        // ずんだもん 
        robot.setColor('primary', 0x00, 0x00, 0x00)
        robot.setColor('secondary', 0xff, 0xff, 0xff)
        robot.setColor('third', 0xb9, 0xff, 0x44)
        robot.setColor('fourth', 0xff, 0xbb, 0xbf)
        robot.setColor('fifth', 0xff, 0xa4, 0xa4)
      } else {
        // あんこもん 
        robot.setColor('primary', 0x00, 0x00, 0x00)
        robot.setColor('secondary', 0x73, 0x39, 0x48)
        robot.setColor('third', 0xb2, 0x40, 0x56)
        robot.setColor('fourth', 0x97, 0x4d, 0x2c)
        robot.setColor('fifth', 0xff, 0xa4, 0xa4)
      }
      flag = !flag
      await asyncWait(1000)
      robot.hideBalloon()
    }
  }

  /* インターバルを５秒にして開始 */
  repeatFunction(robot, 5000)
}

export default {
  onRobotCreated,
}
