var Map = function (app) {
    this.app = app
    this.frameCounter = 0

    this.types = [
        'fire',
        'forest',
        'mountain',
        'ash',
        'gras'
    ]
}

Map.prototype.preload = function () {
    for (var key in this.types) {
        type = this.types[key]

        this[type] = this.app.game.add.group()
        this[type].enableBody = false

        if (type == 'fire') {
            this.app.game.load.spritesheet(type, 'assets/images/objects/' + type + '.png', 16, 16)
        } else {
            this.app.game.load.image(type, 'assets/images/objects/' + type + '.png')
        }
    }
}

Map.prototype.create = function () {
    // Width: 50 tiles, Height: 38 tiles, Tilesize: 16px
    this.generateTiles(50, 38, 16)

    for (var i = 0; i < this.tiles.length; i++) {
        for (var j = 0; j < this.tiles[i].length; j++) {
            var tile = this.tiles[i][j],
                sprite = this[tile.type].create(tile.x, tile.y, tile.type)

            // Set the sprite, so we later have access
            tile.sprite = sprite

            if (tile.type == 'fire') {
                sprite.animations.add('s');
                sprite.animations.play('s', 3, true);
            }
        }
    }

    // - Teleport on boundaries
    // - Dangerous tiles should have a certain padding away from the boundaries
    // - Map? which shows on which tile the player is on?
}

Map.prototype.update = function () {
    // The map doesn't need to update every frame
    if (this.frameCounter++ % 15 == 0) {
        // Spread fire
        this.fire.forEach(function (item) {
            this.applyOnMooreNeighborhood(item.position.x / 16, item.position.y / 16, 'forest', 1, function (found) {
                if (Math.random() < 0.006) {
                    found.sprite.loadTexture('fire', 0)
                    this.forest.remove(found.sprite)
                    this.fire.add(found.sprite)
                    found.sprite.animations.add('s');
                    found.sprite.animations.play('s', 3, true);
                    found.type = 'fire'
                }
            }.bind(this));
        }, this)

        // Regenerate forest from ash
        this.ash.forEach(function (item) {
            // A Moore neighborhood with radius 0 kinda makes sense, because we don't have a map from
            // sprites to their "parent" tile
            this.applyOnMooreNeighborhood(item.position.x / 16, item.position.y / 16, 'ash', 0, function (found) {
                if (Math.random() < 0.006) {
                    found.sprite.loadTexture('forest', 0)
                    this.ash.remove(found.sprite)
                    this.forest.add(found.sprite)
                    found.type = 'forest'
                }
            }.bind(this));
        }, this)
    }
}

Map.prototype.generateTiles = function (sizeX, sizeY, tilesize) {
    this.tiles = []

    // Init everything as forest
    for (var i = 0; i < sizeX; i++) {
        this.tiles[i] = []
        for (var j = 0; j < sizeY; j++) {
            this.tiles[i][j] = {
                x: i * tilesize,
                y: j * tilesize,
                type: 'forest'
            }
        }
    }

    // Set two mountain ranges
    for (var k = 0; k < 2; k++) {
        var rX = Math.floor(Math.max(0.1, Math.min(0.9, Math.random())) * sizeX),
            rY = Math.floor(Math.max(0.1, Math.min(0.9, Math.random())) * sizeY)

        // Do a random walk over twenty tiles from the starting points
        var dX = 0,
            dY = 0

        for (var i = 0; i < 20; i++) {
            if (
                this.tiles[rX + dX] != undefined
                && this.tiles[rX + dX][rY + dY] != undefined
            ) {
                this.tiles[rX + dX][rY + dY].type = 'mountain'
            }
            dX += Math.floor(Math.random() * 3) - 1
            dY += Math.floor(Math.random() * 3) - 1
        }
    }

    // Clear all forest around mountains and change them to gras
    for (var i = 0; i < sizeX; i++) {
        for (var j = 0; j < sizeY; j++) {
            if (
                this.tiles[i][j].type == 'forest'
                && this.getMooreNeighborhood(i, j, 'mountain', 1).length > 0
            ) {
                this.tiles[i][j].type = 'gras'
            }
        }
    }

    // Add some random clearings
    for (var i = 0; i < sizeX; i++) {
        for (var j = 0; j < sizeY; j++) {
            if (this.tiles[i][j].type == 'forest' && Math.random() < 0.07) {
                this.tiles[i][j].type = 'gras'
            }
        }
    }

    // Add some random starting fires
    for (var i = 0; i < sizeX; i++) {
        for (var j = 0; j < sizeY; j++) {
            if (this.tiles[i][j].type == 'forest' && Math.random() < 0.015) {
                this.tiles[i][j].type = 'fire'
            }
        }
    }
}

Map.prototype.getMooreNeighborhood = function (x, y, type, radius) {
    type = type || 'all'
    radius = radius || 1

    var found = []

    for (var dX = -radius; dX <= radius; dX++) {
        for (var dY = -radius; dY <= radius; dY++) {
            if (
                this.tiles[x + dX] != undefined
                && this.tiles[x + dX][y + dY] != undefined
                && (
                    type == 'all'
                    || this.tiles[x + dX][y + dY].type == type
                )
            ) {
                found.push(this.tiles[x + dX][y + dY])
            }
        }
    }

    return found
}

Map.prototype.applyOnMooreNeighborhood = function (x, y, type, radius, callback) {
    var nbh = this.getMooreNeighborhood(x, y, type, radius)

    for (var i in nbh) {
        callback(nbh[i])
    }
}

Map.prototype.extinguishAround = function (x, y, radius) {
    // Clamp to a tile
    var tX = Math.min(800, Math.max(0, Math.round(x / 16))),
        tY = Math.min(800, Math.max(0, Math.round(y / 16)))

    this.applyOnMooreNeighborhood(tX, tY, 'fire', radius, function (found) {
        found.sprite.loadTexture('ash', 0)
        found.sprite.animations.stop('s')
        this.fire.remove(found.sprite)
        this.ash.add(found.sprite)
        found.type = 'ash'
    }.bind(this))
}

Map.prototype.getPercentageOf = function (type) {
    return this[type].length / (this.tiles.length * this.tiles[0].length)
}