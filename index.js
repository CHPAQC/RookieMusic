var EventCenter = {
    on: function(type,handler){
        $(document).on(type,handler)
    },
    fire: function(type,data){
        $(document).trigger(type,data)
    }
}


var Footer = {
    init: function(){
        this.$footer = $('footer')
        this.$ul = this.$footer.find('ul')
        this.$box = this.$footer.find('.box')
        this.$rightBtn = this.$footer.find('.icon-right')
        this.$leftBtn = this.$footer.find('.icon-left')
        this.isToEnd = false
        this.isToStart = true
        this.isAnimate = false
        this.bind()
        this.render()
    },
    bind: function () {
        var _this = this
        $(window).resize(function () {
            _this.setStyle()
        })
        this.$rightBtn.on('click', function () {
            if(_this.isAnimate){return}
            var itemWidth = _this.$box.find('li').outerWidth(true)
            var rowCount = ~~(_this.$box.width() / itemWidth)
            // console.log(rowCount)
            if (!_this.isToEnd) {
                _this.isAnimate = true
                _this.$ul.animate({
                    left: '-=' + rowCount * itemWidth
                }, 400, function () {
                    _this.isAnimate = false
                    _this.isToStart = false
                    // console.log(_this.$ul.css('width'),_this.$ul.width(),parseFloat(_this.$ul.css('left')))
                    if (_this.$box.width() - parseFloat(_this.$ul.css('left')) >= _this.$ul.width()) {
                        // console.log('over')
                        _this.isToEnd = true
                    }
                })
            }
        })
        this.$leftBtn.on('click',function(){
            if(_this.isAnimate){return}
            var itemWidth = _this.$box.find('li').outerWidth(true)
            var rowCount = ~~(_this.$box.width() / itemWidth)
            if (!_this.isToStart) {
                _this.isAnimate = true
                _this.$ul.animate({
                    left: '+=' + rowCount * itemWidth
                }, 400, function () {
                    _this.isAnimate = false
                    _this.isToEnd = false
                    // console.log(_this.$ul.css('width'),_this.$ul.width(),parseFloat(_this.$ul.css('left')))
                    if ( parseFloat(_this.$ul.css('left')) >= 0) {
                        _this.isToStart = true
                    }
                })
            }
        })
        this.$footer.on('click','li',function(){
            $(this).addClass('active').
            siblings().removeClass('active')
            EventCenter.fire('select-albumn',{
                channelId:$(this).attr('data-channel-id'),
                channelName:$(this).attr('data-channel-name')
            })
        })
    },
    render(){
        var _this = this
        $.getJSON('http://api.jirengu.com/fm/getChannels.php')
        .done(function(ret){
            // console.log(ret.channels)
            _this.renderFooter(ret.channels)
        }).fail(function(){
            console.log('error')
        })
    },
    renderFooter: function(channels){
        // console.log(channels)
        var html = ''
        channels.forEach(function(channel){
            html += '<li data-channel-id='+channel.channel_id+' data-channel-name='+channel.name+'>'
                  + '  <div class="cover" style="background-image:url('+channel.cover_small+')"></div>'
                  + '  <h3>'+channel.name+'</h3>'
                  + '</li>'
        })
        this.$ul.html(html)
        this.setStyle()
    },
    setStyle: function(){
        var count = this.$footer.find('li').length
        // console.log(count)
        var width = this.$footer.find('li').outerWidth(true)
        this.$ul.css({
            width: count * width + 'px'
        })

    }
    
}
var Fm = {
    init: function(){
        this.$container = $('#page-music')
        this.audio = new Audio()
        this.audio.autoplay = true
        this.bind()
        this.music()
    },
    bind: function(){
        var _this = this
        EventCenter.on('select-albumn',function(e,channelObj){
            _this.channelId = channelObj.channelId
            _this.channelName = channelObj.channelName
            _this.loadMusic()

            // console.log(e)
            // console.log(data)
        })
        this.$container.find('.btn-play').on('click',function(){
            var $btn = $(this)
            if($btn.hasClass('icon-pause')){
                $btn.removeClass('icon-pause').addClass('icon-play')
                _this.audio.pause()
            }else{
                $btn.removeClass('icon-play').addClass('icon-pause')
                _this.audio.play()
            }
        })
        this.$container.find('.icon-next').on('click',function(){
            _this.loadMusic()
        })
        this.audio.addEventListener('play',function(){
            clearInterval(_this.statusClock)
            _this.statusClock = setInterval(function(){
                _this.updateStatus()
            },1000)
        }) 
        this.audio.addEventListener('pause',function(){
            clearInterval(_this.statusClock)
        })
    },
    loadMusic(){
        var _this = this
        $.getJSON('http://jirenguapi.applinzi.com/fm/getSong.php',{channel:this.channelId}).done(function(ret){
            _this.song = ret['song'][0]
            _this.setMusic()
            _this.loadlyric()
            // console.log(ret)
        })
    },
    loadlyric(){
        var _this = this
        $.getJSON('http://jirenguapi.applinzi.com/fm/getLyric.php',{sid:this.song.sid}).done(function(ret){
            console.log(ret)
            var lyric = ret.lyric
            var lyricObj = {}
            // console.log(lyric)
            lyric.split('\n').forEach(function(line){
                var times = line.match(/\d{2}:\d{2}/g)
                var str = line.replace(/\[.+?\]/g, '')
                // console.log(times)
                if (Array.isArray(times)) {
                    times.forEach(function (times) {
                        lyricObj[times] = str
                    })
                }
            })
            _this.lyricObj = lyricObj
        })
    },
    setMusic(){
        var _this = this
        // console.log('set music')
        // console.log(_this.song)
        _this.audio.src = _this.song.url
        if(_this.$container.find('.btn-play').hasClass('icon-play')){
            _this.$container.find('.btn-play').removeClass('icon-play').addClass('icon-pause')
        }
        $('.bg').css('background-image','url('+_this.song.picture+')')
        _this.$container.find('.aside figure').css('background-image','url('+_this.song.picture+')')
        _this.$container.find('.detail h1').text(this.song.title)
        _this.$container.find('.detail .author').text(this.song.artist)
        _this.$container.find('.tag').text(_this.channelName)
    },
    updateStatus(){
        var _this = this
        var min = Math.floor(this.audio.currentTime/60)
        var second = ~~(this.audio.currentTime%60) + ''
        // console.log(second.length)
        second = second.length == 2?second : '0' + second
        this.$container.find('.current-time').text(min+':'+second)
        this.$container.find('.bar-progress').css('width',
        this.audio.currentTime / this.audio.duration * 100 + '%')
        this.$container.find('.bar').on('click',function(e){
            // console.log(e.offsetX)
            // console.log(window.getComputedStyle(this).width)
            // console.log(_this.audio.duration)
            var playtime = e.offsetX / parseInt(window.getComputedStyle(this).width)
            _this.audio.currentTime = _this.audio.duration * playtime
        })
        this.audio.onended = function(){
            _this.loadMusic() 
        }
        // console.log(this.lyricObj['0'+min+':'+second])
        var line = this.lyricObj['0'+min+':'+second]
        if(line){
            this.$container.find('.lyric p').text(line).boomText()
            
        }
    },
    music: function(){
        this.loadMusic()
    }
}
$.fn.boomText = function(type){
    type = type || 'rollIn'
    this.html(function(){
        var arr = $(this).text()
        .split('').map(function(word){
            return '<span style="display:inline-block">'+ word +'</span>'
        })
        return arr.join('')
    })
    var index = 0
    var $boomTexts = $(this).find('span')
    var clock = setInterval(function(){
        $boomTexts.eq(index).addClass('animated' + type)
        index++
        if(index >= $boomTexts.length){
            clearInterval(clock)
        }
    },300)
}
Footer.init()
Fm.init()
