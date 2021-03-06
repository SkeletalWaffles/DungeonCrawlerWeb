boardSize = 100

function makeNewBoard() {
  var board = []
  for (var x = 0; x < boardSize; x++) {
  	var row = []
    for (var y = 0; y < boardSize; y++) {
    	row.push(null)
    }
    board.push(row)
  }
  return board
}

function makePassageway(board) {
  for (var x = 0; x < boardSize; x++) {
    for (var y = 0; y < boardSize; y++) {
      board[x][y] = {type: "barrier"}
    }
  }
  
  var x = boardSize/2 | 0
  var y = boardSize/2 | 0
  
  var directions = [[0, 1], [0, -1], [1, 0], [-1, 0]]
  for (var i = 0; i < (boardSize * (boardSize / 4) * 3); i++) {
    var choice = Math.floor(Math.random() * 4)
    var dr = directions[choice]
    x += dr[0]
    y += dr[1]
    x = Math.min(Math.max(x, 1), board.length - 1)
    y = Math.min(Math.max(y, 1), board.length - 1)
    board[x][y] = null
  }
}

function findEmptySpace(board) {
	var x = Math.floor(Math.random() * boardSize)
  var y = Math.floor(Math.random() * boardSize)
  
  if (board[x][y] === null) {
    return [x, y]
  } else {
    return findEmptySpace(board)
  }
}

function spawnEnemies(board) {
  var enemies = []
  for (var i = 0; i < 10; i++) {
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
  makePassageway(board)
  
  var [lx, ly] = findEmptySpace(board)
  board[lx][ly] = {type: "ladder"}
  
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

function drawMiniMap(board, ctx, playerMini, chestMini, enemyMini, ladderMini, barrier, player, fogOfWarBoard, shopMini) {
  var minimapSize = 150
  var sightRange = 25
  var scale = minimapSize / (sightRange * 2) 
  var mx = 500-minimapSize
  var my = 500-minimapSize
  ctx.clearRect(mx, my, minimapSize, minimapSize)
  ctx.strokeRect(mx, my, minimapSize, minimapSize)
  
  
  for (var x = player.x - sightRange; x < player.x + sightRange + 1; x++) {
    for (var y = player.y - sightRange; y < player.y + sightRange + 1; y++) {
      var drawX = x - (player.x - sightRange)
      var drawY = y - (player.y - sightRange)
      
  	  if (x > 99 || y > 99 || x < 0 || y < 0) {
  	    ctx.fillStyle = 'black'
  	    ctx.fillRect(drawX*scale+mx, drawY*scale+mx, scale, scale)
  	    //ctx.drawImage(barrier, )
  	    continue
  	  }
      
      var tile = board[x][y]
      
      if (tile === null) {}
    	else if (tile.type === 'barrier') {
				ctx.drawImage(barrier, drawX*scale+mx, drawY*scale+my, scale, scale)
      } else if (tile.type === 'character') {
        ctx.drawImage(playerMini, drawX*scale+mx, drawY*scale+my, scale, scale)
      } else if (tile.type === 'enemy') {
        ctx.drawImage(enemyMini, drawX*scale+mx, drawY*scale+my, scale, scale)
      } else if (tile.type === 'weapon' || tile.type === "gold" || tile.type === "health potion") {
        ctx.drawImage(chestMini, drawX*scale+mx, drawY*scale+my, scale, scale)
      } else if (tile.type === "ladder") {
        ctx.drawImage(ladderMini, drawX*scale+mx, drawY*scale+my, scale, scale)
      } else if (tile.type === "shop") {
        ctx.drawImage(shopMini, drawX*scale+mx, drawY*scale+my, scale, scale)
      }
      
      var percentThatICanSeeIt = fogOfWarBoard[x][y]
      if (percentThatICanSeeIt == null) percentThatICanSeeIt = 0
      if (percentThatICanSeeIt !== 1) {
  	    ctx.fillStyle = 'rgba(0, 0, 0, ' + (1 - percentThatICanSeeIt) + ')'
  	    ctx.fillRect(drawX*scale+mx, drawY*scale+mx, scale, scale)
      }
    }
  }
}


function clearFog(fogOfWarBoard, player) {
  //var sightRange = 5
  var maxSight = 10
  var minSight = 5
  
	for (var x = player.x - maxSight; x < player.x + maxSight + 1; x++) {
  	for (var y = player.y - maxSight; y < player.y + maxSight + 1; y++) {
  	  
  	  if (x > 99 || y > 99 || x < 0 || y < 0) {
  	    continue
  	  }
  	  var dx = player.x - x;
  	  var dy = player.y - y;
  	  var distance = Math.sqrt(dx * dx + dy * dy)
  	  var howWellCanISeeIt;
  	  if (distance < minSight) {
  	    howWellCanISeeIt = 1
  	  } else if (distance > maxSight) {
  	    howWellCanISeeIt = 0
  	  } else {
  	    var percentage = (distance - minSight) / (maxSight - minSight)
  	    howWellCanISeeIt = 1 - percentage
  	  }
  	  // var howWellCanISeeIt = 1 - Math.min(1, Math.max(0, distance - minSight) / (maxSight - minSight))
  	  if (fogOfWarBoard[x][y] == null || fogOfWarBoard[x][y] < howWellCanISeeIt) {
  	    fogOfWarBoard[x][y] = howWellCanISeeIt
  	  }
  	}
	}
}

function drawBoard(board, ctx, char, fireballImage, barrier,  recentlyDiedFireballs, chest, ladder, player, shopSign) {
  ctx.clearRect(0, 0, 10 * 50, 10 * 50)
  var sightRange = 5
  
	for (var x = player.x - sightRange; x < player.x + sightRange + 1; x++) {
  	for (var y = player.y - sightRange; y < player.y + sightRange + 1; y++) {
  	  var drawX = x - (player.x - sightRange)
  	  var drawY = y - (player.y - sightRange)
  	  
  	  if (x > 99 || y > 99 || x < 0 || y < 0) {
  	    ctx.drawImage(barrier, drawX*50, drawY*50, 50, 50)
  	    continue
  	  }
  	  var tile = board[x][y]
  	  
  	  if (tile === null) continue
  	  
    	if (tile.type === 'barrier') {
				ctx.drawImage(barrier, drawX*50, drawY*50, 50, 50)
      } else if (tile.type === 'fireball') {
        var size = 7 * tile.power + 6
        var margin = (50 - size) / 2
        ctx.drawImage(fireballImage, drawX*50 + margin, drawY*50 + margin, size, size)
      } else if (tile.type === 'character') {
        ctx.drawImage(char, drawX*50, drawY*50, 50, 50)
        
        healthBar(tile, ctx, drawX, drawY)
      } else if (tile.type === 'enemy') {
        ctx.drawImage(enemy, drawX*50, drawY*50, 50, 50)
        
        healthBar(tile, ctx, drawX, drawY)
      } else if (tile.type === 'weapon' || tile.type === "gold" || tile.type === "health potion") {
        ctx.drawImage(chest, drawX*50, drawY*50, 50, 50)
      } else if (tile.type === "ladder") {
        ctx.drawImage(ladder, drawX*50, drawY*50, 50, 50)
      } else if (tile.type === "shop") {
        ctx.drawImage(shopSign, drawX*50, drawY*50, 50, 50)
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
    return
  } else if (board[nextx][nexty].type === 'enemy') {
    board[nextx][nexty].health -= player.firePower
    
    recentlyDiedFireballs.push(fireball)
  }
}

function gotTreasure(board, player, dx, dy) {
  board[player.x][player.y] = null
  player.x += dx
  player.y += dy
  board[player.x][player.y] = player
  
  /*
  var choice = Math.floor(Math.random() * treasures.length)
  var c = treasures[choice]
  var [tx, ty] = findEmptySpace(board)
  
  if (c === weapons) {
    var cw = Math.floor(Math.random() * weapons.length)
    board[tx][ty] = c[cw]
  } else if (c.type === "gold") {
    board[tx][ty] = c
  } else if (c.type === "health potion") {
      board[tx][ty] = c
  }
  */
}

function buy(item, player) {
  if (item.type === "weapon") {
    player.wearing.weapon = item
  } else if (item.type === "health potion") {
    player.health += item.healing
  } else if (item.type === "whyisthisevena potion") {
    player.health = -5000
    console.log("You shouldn't have eaten that silly")
  }
}

function shop(items, ctx, player) {
  var shopWindow = document.getElementById("shop-window")
  var shopItemsList = document.getElementById("shop-items-list")
  
  shopWindow.style.display = "block"
  shopItemsList.innerHTML = ""
  
  var oldKeyDown = document.onkeydown
  document.onkeydown = function(event){
    shopWindow.style.display = "none"
    document.onkeydown = oldKeyDown
  }

  items.forEach(item => {
    var shopItem = document.createElement("li")
    
    var buyButton = document.createElement("button")
    buyButton.type = "text"
    buyButton.innerHTML = ("$" + item.price)
    buyButton.onclick = function() {
      buy(item, player)
    }
    
    buyButton.style.fontSize = "15px"
    buyButton.style.fontFamily = "sans-serif"
    buyButton.style.backgroundColor = "#663300"
    buyButton.style.borderColor = "black"
    
    shopItem.appendChild(document.createTextNode(item.name + " - " + item.description + " "))
    shopItem.appendChild(buyButton)
    shopItem.style.fontFamily = "sans-serif"
    shopItem.style.fontSize = "22px"
    shopItem.style.paddingBottom = "10px"
    
    shopItemsList.appendChild(shopItem)
    
  })
}

function movePlayer(code, player, board, treasures, weapons, ctx) {
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
  if (nextx > boardSize || nexty > boardSize || nextx < 0 || nexty < 0) {
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
  } else if (board[nextx][nexty].type === "weapon") {
    player.wearing.weapon = board[nextx][nexty]
    gotTreasure(board, player, dx, dy)
  } else if (board[nextx][nexty].type === "ladder") {
    // Go downstairs a level
    player.depth += 1
    
    return true
  } else if (board[nextx][nexty].type === "gold") {
    player.gold += board[nextx][nexty].amount
    gotTreasure(board, player, dx, dy)
  } else if (board[nextx][nexty].type === "health potion") {
    player.health += board[nextx][nexty].healing
    gotTreasure(board, player, dx, dy)
  } else if (board[nextx][nexty].type === "shop") {
    shop(board[nextx][nexty].items, ctx, player)
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

function showStatus(player) {
  var status = document.getElementById("status")
  status.innerHTML = 'Health: ' + player.health +  ', FirePower: ' + player.firePower + ', Weapon: ' + player.wearing.weapon.name + ", Depth: " + player.depth + ", Location: " + player.x + ", " + player.y  + ", Gold: " + player.gold
}

function setupLevel(player) {
  var board = makeNewBoard()
  var fogOfWarBoard = makeNewBoard();
  var enemies = setupBoard(board)
  var [px, py] = findEmptySpace(board)
  board[px][py] = player
  player.x = px
  player.y = py
  
  var weapons = [
    {
      name: "Cheap Sword",
      damage: 7,
      type: "weapon"
    }  
  ]
  
  var treasures = [weapons, {
    type: "gold",
    amount: 50
  }, {
    type: "health potion",
    healing: 20
  }]
  
  var choice = Math.floor(Math.random() * treasures.length)
  for (i = 0; i < 5; i++) {
    var c = treasures[choice]
    var [tx, ty] = findEmptySpace(board)
    
    if (c === weapons) {
      var cw = Math.floor(Math.random() * weapons.length)
      board[tx][ty] = c[cw]
    } else if (c.type === "gold") {
      board[tx][ty] = c
    } else if (c.type === "health potion") {
      board[tx][ty] = c
    }
  }
  
  var [shopX, shopY] = [player.x+1, player.y]//findEmptySpace(board)
  board[shopX][shopY] = {
    type: "shop",
    items: [
      {
        name: "Jelly Diamond",
        description: "A diamond made of jelly",
        type: "whyisthisevena potion",
        price: 100
      },
      {
        name: "Diamond Jelly",
        description: "Jelly made of diamond",
        damage: 50,
        type: "weapon",
        price: 1000
      }  
    ]
  }

  return {board, enemies, treasures, weapons, fogOfWarBoard}
}

function main() {
  var canvas = document.getElementById("canvas")
  var status = document.getElementById("status")
  var ctx = canvas.getContext("2d")
  
  var char = document.getElementById("character")
  var barrier = document.getElementById("barrier")
  var fireballImage = document.getElementById("fireball")
  var enemy = document.getElementById("enemy")
  var chest = document.getElementById("chest")
  var ladder = document.getElementById("ladder")
  var shopSign = document.getElementById("shop-sign")
  
  var playerMini = document.getElementById("player-mini")
  var chestMini = document.getElementById("chest-mini")
  var enemyMini = document.getElementById("enemy-mini")
  var ladderMini = document.getElementById("ladder-mini")
  var shopMini = document.getElementById("shop-mini")
  
  
  
  var fireballs = [] // {x: 5, y: 5, power: 5, dx: 0, dy: 1}
  var player = {
    type: 'character',
    x: 0,
    y: 0,
    health: 100,
    startingHealth: 100,
    firePower: 5,
    depth: 0,
    gold: 0,
    items: [],
    wearing: {
      weapon: {
        name: "Toy Sword",
        damage: 3
      }
    }
  }
  
  showStatus(player)
  
  var {board, enemies, treasures, weapons, fogOfWarBoard} = setupLevel(player)

  clearFog(fogOfWarBoard, player)
  
  drawBoard(board, ctx, char, fireballImage, barrier, [], chest, ladder, player, shopSign)
  drawMiniMap(board, ctx, playerMini, chestMini, enemyMini, ladderMini, barrier, player, fogOfWarBoard, shopMini)
  
  var turn = 0
  
  document.onkeydown = function(event) {
    var shouldRegenHealth = true
    
    var recentlyDiedFireballs = []
    fireballs = moveFireballs(fireballs, board, recentlyDiedFireballs)
    if (event.shiftKey) {
      createFireball(event.code, player, board, fireballs, recentlyDiedFireballs)
      shouldRegenHealth = false
      return
    } else if (event.key === "a") {
      enemies.forEach(enemy => {
        var xVal = Math.abs(player.x - enemy.x)
        var yVal = Math.abs(player.y - enemy.y)
        
        if (xVal <= 1 && yVal <= 1) {
          enemy.health -= player.wearing.weapon.damage
        } else {
          return
        }
      })
      
      shouldRegenHealth = false
    } else {
      
      var justMovedDownALevel = movePlayer(event.code, player, board, treasures, weapons, ctx)
      shouldRegenHealth = true
      if (justMovedDownALevel) {
        var newStuff = setupLevel(player)
        board = newStuff.board 
        enemies = newStuff.enemies
        treasures = newStuff.treasures
        fogOfWarBoard = newStuff.fogOfWarBoard
      }
    }
    
    if (shouldRegenHealth) {
      var healthBoost = Math.floor(Math.random() * 3)
      player.health += healthBoost
    }
    
    if (player.health >= player.startingHealth) {
      player.health = player.startingHealth
    }
    
    moveEnemies(enemies, board, player)
    
    clearFog(fogOfWarBoard, player)
    
    enemies = removeDeadEnemies(enemies, player, board)
    
    drawBoard(board, ctx, char, fireballImage, barrier, recentlyDiedFireballs, chest, ladder, player, shopSign)
    showStatus(player)
    drawMiniMap(board, ctx, playerMini, chestMini, enemyMini, ladderMini, barrier, player, fogOfWarBoard, shopMini)
    
    if (player.health <= 0) {
      ctx.fillStyle = 'black'
      ctx.fillRect(0, 0, 500, 500)
      status.innerHTML = "GAME OVER"
      return
    }
    
    turn ++
    if (turn % 200 === 0) {
      spawnEnemy(enemies, board)
    }
  }
}

function spawnEnemy(enemies, board) {
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

function removeDeadEnemies(enemies, player, board) {
  var liveEnemies = []
  enemies.forEach(enemy => {
    if (enemy.health > 0) {
      liveEnemies.push(enemy)
    } else {
      player.experience += 10
      player.gold += parseInt(Math.random() * 20)
      board[enemy.x][enemy.y] = null
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
    } else {
    }
  })
  return fireballs.filter(fireball => !fireball.dead)
}

main()
