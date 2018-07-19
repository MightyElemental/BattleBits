let x: number
let y: number
let count: number
let flash: number
let mode = -1
let list = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
let player = 0
let hits = 0
//connection data
let otherSetup = false
let otherSerial = 0
let enemyList = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
let enemyAttempt = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
let temp = 0
let repeatSend = true

function connect() {
    radio.setGroup(1)
    radio.setTransmitSerialNumber(true)
    basic.showLeds(`
. . # # #
. . # . .
. . # . .
. . # # #
. . . . .
`)
    while (otherSerial == 0 && temp < 20) {
        radio.sendValue("Verify", 1)
        led.plot(0, temp % 5)
        basic.pause(500)
        led.unplot(0, temp % 5)
        temp++
    }
    if (otherSerial == 0) {
        basic.showString("!CONNECT FAIL!")
    } else {
        basic.showString("PLAYER " + player)
        radio.sendValue("Verify", 2)
        mode = 0
    }
}
control.inBackground(() => {
    connect()
})




basic.forever(() => {
    //basic.showNumber(Math.random(5))
    flash++

    if (hits >= 5) {
        mode = 100
        radio.sendString("GAMEOVER")
        game.setScore(hits)
        game.gameOver()
    }

    if (mode == 0) {
        for (let i = 0; i < list.length; i++) {
            if (list[i] == 0) {// && (i % 5 != x || i/5 != y)
                led.unplot(i % 5, i / 5)
            } else {
                led.plot(i % 5, i / 5)
            }
        }
        if (flash % 30 > 15) {
            led.plot(x, y)
        }

        if (count >= 5) {
            game.addScore(1)
            game.addScore(1)
            mode = 1
        }
    } else if (mode == 1) {
        basic.showString("WAIT.")
        radio.sendString("CompleteSetup")
    } else if (mode == 2) {
        basic.showIcon(IconNames.Heart)
        basic.pause(1000)
        if (player == 1) {
            console.log(player + " enter 4")
            mode = 4//attack mode
        } else {
            console.log(player + " enter 3")
            mode = 3//observe mode
        }
    } else if (mode == 3) {//observe mode
        for (let i = 0; i < list.length; i++) {
            led.unplot(i % 5, i / 5)
            if (enemyAttempt[i] != 2) {
                led.plotBrightness(i % 5, i / 5, 255 * list[i])
            }
        }
        for (let i = 0; i < enemyAttempt.length; i++) {
            if (enemyAttempt[i] == 1) {
                led.plotBrightness(i % 5, i / 5, 5)
            }
            if (enemyAttempt[i] == 2 && flash % 30 > 15) {
                led.plotBrightness(i % 5, i / 5, 50)
            }
        }
    } else if (mode == 4) {//attack mode
        for (let i = 0; i < enemyList.length; i++) {
            if (enemyList[i] == 1) {
                led.plotBrightness(i % 5, i / 5, 5)
            } else if (enemyList[i] == 2 && !(i % 5 == x && i / 5 == y)) {
                led.plotBrightness(i % 5, i / 5, 255)
            } else {
                led.unplot(i % 5, i / 5)
            }
        }
        if (flash % 30 > 15) {
            led.plot(x, y)
        }
    }
})

radio.onDataPacketReceived((packet: radio.Packet) => {
    console.log(packet.receivedString + "|" + packet.receivedNumber)
    if (packet.receivedString == "Verify" && otherSerial == 0) {
        otherSerial = packet.serial
        if (player == 0) player = packet.receivedNumber
        radio.sendValue("Verify", 2)
    }
    if (packet.serial != otherSerial) return
    if (packet.receivedString == "CompleteSetup") {
        otherSetup = true
        if (mode == 1) {
            mode = 2
        }
    } else if (packet.receivedString == "Attack") {
        if (list[packet.receivedNumber] == 0) {
            radio.sendValue("Miss", packet.receivedNumber)
            enemyAttempt[packet.receivedNumber] = 1
        } else {
            radio.sendValue("Hit", packet.receivedNumber)
            enemyAttempt[packet.receivedNumber] = 2
        }
        mode = 4
    } else if (packet.receivedString == "Miss" && mode == 4) {
        enemyList[packet.receivedNumber] = 1
        mode = 3
        repeatSend = false
    } else if (packet.receivedString == "Hit" && mode == 4) {
        enemyList[packet.receivedNumber] = 2
        mode = 3
        hits++
        repeatSend = false
    } else if (packet.receivedString == "GAMEOVER") {
        mode = 100
        game.setScore(hits)
        game.gameOver()
    }
})

input.onButtonPressed(Button.A, () => {
    if (mode > -1)
        y = (y + 1) % 5
})

input.onButtonPressed(Button.B, () => {
    if (mode > -1) x = (x + 1) % 5
})

input.onButtonPressed(Button.AB, () => {
    if (mode == 0) {
        let val = list[x + y * 5]
        list[x + y * 5] = 1 - val
        if (val == 0) { count++ } else { count-- }
    }
    if (mode == 4) {
        repeatSend = true
        while (repeatSend) {
            radio.sendValue("Attack", x + y * 5)
            basic.pause(500)
        }
        basic.clearScreen()
        basic.pause(100)
        basic.showIcon(IconNames.Target)
        basic.pause(1000)
    }
})
