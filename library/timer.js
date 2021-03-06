var Timer = function(app, timespan, whenDone) {
    this.app = app
    this.timespan = timespan * 1000 // We count milliseconds
    this.startTime = new Date().getTime()
    this.remainingTime = this.timespan
    this.whenDone = whenDone
}

Timer.prototype.update = function() {
    this.remainingTime = this.timespan - new Date().getTime() + this.startTime
    if (this.remainingTime <= 0) {
        this.whenDone()
    }
}

Timer.prototype.getTimeString = function() {
    var minutes = Math.floor(this.remainingTime / 60000)
    var seconds = '' + Math.floor((this.remainingTime % 60000) / 1000)
    if (seconds.length == 1) {
        seconds = '0' + seconds
    }
    return '' + minutes + ':' + seconds;
}