'use strict';

function makeNewBoard() {
  var board = []
  for (var x = 0; x < 10; x++) {
  	var row = []
    for (var y = 0; y < 10; y++) {
    	row.push(null)
    }
    board.push(row)
  }
  return board
}

function findEmptySpace(board) {
	var x = Math.floor(Math.random() * 10)
  var y = Math.floor(Math.random() * 10)
  
  if (board[x][y] === null) {
    return [x, y]
  } else {
    return findEmptySpace(board)
  }
}

function spawnEnemies(board) {
  var enemies = []
  for (var i = 0; i < 3; i++) {
    var [ex, ey] = findEmptySpace(board)
    var enemy = {
      type: 'enemy',
      x: ex,
      y: ey,
      health: 10,
      startingHealth: 10,
      damage: 5,
    }
    board[ex][ey] = enemy
    enemies.push(enemy)
  }
  
  return enemies
}

function setupBoard(board) {
  for (var i = 0; i < 10; i++) {
    var [bx, by] = findEmptySpace(board)
    board[bx][by] = {type: 'barrier'}
  }
  
  return spawnEnemies(board)
}

function healthBar(tile, ctx, x, y) {
  if (tile.health >= tile.startingHealth/2) {
    ctx.fillStyle = "green"
  } else if (tile.health <= tile.startingHealth/2 && tile.health >= tile.startingHealth/3) {
    ctx.fillStyle = "yellow"
  } else {
    ctx.fillStyle = "red"
  }
  ctx.fillRect(x * 50, y * 50-5, (50/tile.startingHealth)*tile.health, 5)
}

function drawBoard(board, ctx, char, fireballImage, barrier,  recentlyDiedFireballs, sack) {
  ctx.clearRect(0, 0, 10 * 50, 10 * 50)
	for (var x in board) {
  	for (var y in board) {
  	  var tile = board[x][y]
  	  if (!tile) continue
    	if (tile.type === 'barrier') {
				ctx.drawImage(barrier, x*50, y*50, 50, 50)
      } else if (tile.type === 'fireball') {
        var size = 7 * tile.power + 6
        var margin = (50 - size) / 2
        ctx.drawImage(fireballImage, x*50 + margin, y*50 + margin, size, size)
      } else if (tile.type === 'character') {
        ctx.drawImage(char, x*50, y*50, 50, 50)
        
        healthBar(tile, ctx, x, y)
      } else if (tile.type === 'enemy') {
        ctx.drawImage(enemy, x*50, y*50, 50, 50)
        
        healthBar(tile, ctx, x, y)
      } else if (tile.type === 'weapon') {
        ctx.drawImage(sack, x*50+15, y*50+15, 20, 20)
      }
    }
  }
  recentlyDiedFireballs.forEach(fireball => {
    var fx = fireball.x*50 + 25
    var fy = fireball.y*50 + 25
    for (var a=0; a < 20; a++) {
      var angle = a / 10 * Math.PI * 2
      var x = Math.cos(angle) * (25 *  a / 20)
      var y = Math.sin(angle) * (25 * a / 20)
      ctx.drawImage(fireballImage, fx + x - 2, fy+ y - 2, 4, 4)

    }

  })
}

function createFireball(code, player, board, fireballs, recentlyDiedFireballs) {
  var dx = 0
  var dy = 0
  
  if (code === "ArrowUp") {
    dy = -1
  } else if (code === "ArrowDown") {
    dy = 1
  } else if (code === "ArrowLeft") {
    dx = -1
  } else if (code === "ArrowRight") {
    dx = 1
  } else {
    return
  }
  
  var nextx = player.x + dx
  var nexty = player.y + dy

  var fireball = {
    type: 'fireball',
    x: player.x + dx,
    y: player.y + dy,
    power: player.firePower,
    dx: dx,
    dy: dy,
  }  
  if (board[nextx][nexty] === null) {
    fireballs.push(fireball)
  
    board[nextx][nexty] = fireball
  } else if (board[nextx][nexty].type === 'barrier') {
    console.log("You're firing at a barrier")
    return
  } else if (board[nextx][nexty].type === 'enemy') {
    board[nextx][nexty].health -= player.firePower
    
    recentlyDiedFireballs.push(fireball)
  }
}

function movePlayer(code, player, board) {
    // if we press left, then go left, etc.\
  var dx = 0
  var dy = 0
  
  if (code === "ArrowUp") {
    dy = -1
  } else if (code === "ArrowDown") {
    dy = 1
  } else if (code === "ArrowLeft") {
    dx = -1
  } else if (code === "ArrowRight") {
    dx = 1
  }
  
  var nextx = player.x + dx
  var nexty = player.y + dy
  if (nextx > 9 || nexty > 9 || nextx < 0 || nexty < 0) {
    return
  } else if (board[nextx][nexty] === null) {
    board[player.x][player.y] = null
    player.x += dx
    player.y += dy
    board[player.x][player.y] = player
  } else if (board[nextx][nexty].type === 'barrier') {
    return
  } else if (board[nextx][nexty].type === "enemy") {
    player.health -= 5
    console.log(player.health)
  } else if (board[nextx][nexty].type === "weapon") {
    player.weapon = board[nextx][nexty]
    board[player.x][player.y] = null
    player.x += dx
    player.y += dy
    board[player.x][player.y] = player
  }
}

function moveEnemies(enemies, board, player) {
  enemies.forEach(enemy => {
   var dx = 0
   var dy = 0
   var xVal = Math.abs(enemy.x - player.x)
   var yVal = Math.abs(enemy.y - player.y)
   
   if (xVal != 0 && (xVal < yVal || yVal === 0)) {
     if (player.x > enemy.x) {
       dx = 1
     } else {
       dx = -1
     }
   } else if (player.y !== enemy.y) {
     if (player.y > enemy.y) {
       dy = 1
     } else {
       dy = -1
     }
   }
   
   var nextx = enemy.x + dx
   var nexty = enemy.y + dy
   
   if (nextx < 0 || nexty < 0) {
     return
    } else if (board[nextx][nexty] === null) {
     board[enemy.x][enemy.y] = null
     enemy.x += dx
     enemy.y += dy
     board[enemy.x][enemy.y] = enemy
   } else if (board[nextx][nexty].type === 'character') {
     player.health -= enemy.damage
   } else if (board[nextx][nexty].type === 'barrier') {
     return
   }
  })
}

function main() {
  var canvas = document.getElementById("canvas")
  var status = document.getElementById("status")
  var ctx = canvas.getContext("2d")
  
  var char = document.getElementById("character")
  var barrier = document.getElementById("barrier")
  var fireballImage = document.getElementById("fireball")
  var enemy = document.getElementById("enemy")
  var sack = document.getElementById("sack")
  
  var board = makeNewBoard()
  
  
  var fireballs = [] // {x: 5, y: 5, power: 5, dx: 0, dy: 1}
  var player = {
    type: 'character',
    x: 0,
    y: 0,
    health: 100,
    startingHealth: 100,
    firePower: 5,
    weapon: {
      name: "Toy Sword",
      damage: 3
    }
  }
  
  var [px, py] = findEmptySpace(board)
  board[px][py] = player
  player.x = px
  player.y = py
  var enemies = setupBoard(board)
  
  var weapons = []
  var avWeapons = [
    {
      name: "Cheap Sword",
      damage: 7,
      type: "weapon"
    }
  ]

  weapons.push(avWeapons[0])
  weapons.forEach(weapon => {
    var [wx, wy] = findEmptySpace(board)
    board[wx][wy] = weapon
  })
  
  drawBoard(board, ctx, char, fireballImage, barrier, [], sack)
  
  document.onkeydown = function(event) {
    var shouldRegenHealth = true
    
    var recentlyDiedFireballs = []
    fireballs = moveFireballs(fireballs, board, recentlyDiedFireballs)
    if (event.shiftKey) {
      createFireball(event.code, player, board, fireballs, recentlyDiedFireballs)
      shouldRegenHealth = false
    } else if (event.key === "a") {
      enemies.forEach(enemy => {
        var xVal = Math.abs(player.x - enemy.x)
        var yVal = Math.abs(player.y - enemy.y)
        
        if (xVal <= 1 && yVal <= 1) {
          enemy.health -= player.weapon.damage
        } else {
          return
        }
      })
      
      shouldRegenHealth = false
    } else {
      movePlayer(event.code, player, board)
      shouldRegenHealth = true
    }
    
    if (shouldRegenHealth) {
      var healthBoost = Math.floor(Math.random() * 5)
      player.health += healthBoost
    }
    
    if (player.health >= player.startingHealth) {
      player.health = player.startingHealth
    }
    
    moveEnemies(enemies, board, player)
    
    enemies = removeDeadEnemies(enemies, player, board)
    
    drawBoard(board, ctx, char, fireballImage, barrier, recentlyDiedFireballs, sack)
    status.innerHTML = 'Health: ' + player.health +  ', FirePower: ' + player.firePower + ', Weapon: ' + player.weapon.name
    
    if (player.health <= 0) {
      ctx.fillStyle = 'black'
      ctx.fillRect(0, 0, 500, 500)
      status.innerHTML = "GAME OVER"
      return
    }
  }
}

function removeDeadEnemies(enemies, player, board) {
  var liveEnemies = []
  enemies.forEach(enemy => {
    if (enemy.health > 0) {
      liveEnemies.push(enemy)
    } else {
      player.experience += 10
      player.gold += parseInt(Math.random() * 20)
      board[enemy.x][enemy.y] = null
      console.log('removing enemy', enemy)
    }
  })
  return liveEnemies
}



function moveFireballs(fireballs, board, recentlyDiedFireballs) {
  fireballs.forEach(fireball => {
    board[fireball.x][fireball.y] = null
    fireball.power -= 1
    var nextx = fireball.x + fireball.dx
    var nexty = fireball.y + fireball.dy
    if (nextx >= board.length ||
          nexty >= board.length ||
          nextx < 0 ||
          nexty < 0) {
      fireball.dead = true
      recentlyDiedFireballs.push(fireball)
      return
    }
    var nextTile = board[nextx][nexty]
    
    if (fireball.power < 0) {
      fireball.x += fireball.dx
      fireball.y += fireball.dy
      fireball.dead = true
      recentlyDiedFireballs.push(fireball)
    } else if (!nextTile) {
      fireball.x += fireball.dx
      fireball.y += fireball.dy
      board[fireball.x][fireball.y] = fireball
    } else if (nextTile.type === 'barrier') {
      if (fireball.power > 5) {
        fireball.x += fireball.dx
        fireball.y += fireball.dy
        board[fireball.x][fireball.y] = fireball
      } else {
        fireball.dead = true
        fireball.x += fireball.dx
        fireball.y += fireball.dy
        recentlyDiedFireballs.push(fireball)
      }
    } else if (nextTile.type === 'enemy') {
      nextTile.health -= fireball.power
      fireball.dead = true
      recentlyDiedFireballs.push(fireball)
      console.log("I hit the enemy. and he is us", nextTile)
    } else {
    }
  })
  return fireballs.filter(fireball => !fireball.dead)
}

main()
