// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html
var global = require("lad_mhy_global")
cc.Class({
    extends: cc.Component,

    properties: {
        bg:cc.Node,
        shadow:cc.Node,
        line:cc.Node,
    },

    start () {
        this._event_id = -1;
        this.origin_x = 0;
        this.origin_y = 0;
        this.opacity = 255;
    },

    onEnable: function () {
        this.touchEventOn();
    },

    onDisable: function () {
        this.touchEventOff();
    },

    setLineIndex:function(a,b,c){
        this.line_index = a;
        b<c? this.ball_index_1 = c: this.ball_index_1 = b;
        b<c? this.ball_index_2 = b: this.ball_index_2 = c;
    },

    touchEventOn: function () {
        console.log('=============我感觉thisbujian',this)
        this.node.on(cc.Node.EventType.TOUCH_START, this.touchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL,this.touchCancel,this)
    },

    touchEventOff: function () {
        this.node.off(cc.Node.EventType.TOUCH_START, this.touchStart, this);
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.touchCancel, this);
    },

    touchStart: function (event, touch) {
        console.log('================主要查看下为啥不能动', event, touch, event.getTouches(), event.getID());
        console.log("=====================global.current_start", global.current_move_line_index)

        //可能需要再判断
        if (global.current_move_line_index !== -1 && global.current_move_line_index !== this.line_index) {
            return;
        }

        if (this._event_id === -1) {
            this._event_id = event.getID();
        } else {
            if (this._event_id != event.getID()) {
                return;
            }
        }

        console.log('=============位置信息设定', this.node.x, this.node.y)

        //做个处理，如果已经有了current_line则忽略其他的移动行为
        //console.log('-=============line点击开始', this,event)

        this.origin_x = this.node.x;
        this.origin_y = this.node.y;

        let position = event.getLocation();
        let pos_x = 0;
        let pos_y = 0;
        pos_x = position.x - cc.winSize.width/2;
        pos_y = position.y - cc.winSize.height/2; 
        this.node.opacity = 0;

        //传送给主场景，告知是哪个line开始动
        global.setMoveBallAndLine(this.line_index, this.ball_index_1, this.ball_index_2,pos_x,pos_y);
        cc.game.emit("lad_line_start");
    },

    touchMove: function (event, touch) {
        if (this._event_id != event.getID()) {
            return;
        }

        if (global.current_move_line_index !== -1 && global.current_move_line_index !== this.line_index) {
            console.log("=====================global.current_move", global.current_move_line_index)
            return;
        }

        var delta = event.touch.getDelta();
        this.node.x += delta.x;
        this.node.y += delta.y;

        global.current_event = event;
        cc.game.emit("lad_line_move");
    },

    touchEnd: function (event, touch) {
        if (this._event_id != event.getID()) {
            return;
        }

        if (global.current_move_line_index !== -1 && global.current_move_line_index !== this.line_index) {
            console.log("=====================global.current_end", global.current_move_line_index)
            return;
        }

        cc.game.emit("lad_line_end");
        this._event_id = -1;
    },

    touchCancel:function(){
        if (global.current_move_line_index !== -1 && global.current_move_line_index !== this.line_index) {
            return;
        }

        cc.game.emit("lad_line_cancel");
        this._event_id = -1;
    },

    initSelf:function(){
        this.origin_x = 0;
        this.origin_y = 0;
        this.node.opacity = 255;
    },

    resetSelf:function(){
        this.node.x = this.origin_x;
        this.node.y = this.origin_y;
        this.node.opacity = 255;
    },

    destorySelf:function(){
        this.node.removeFromParent();
    },

    getBallsIndex: function () {
        //console.log('===================getBallIndex',this.ball_index_1,this.ball_index_2)
        return [this.ball_index_1,this.ball_index_2];
    },

    getLineIndex:function(){
        return this.line_index;
    },

    setLineColor: function (color_index) {
        let line_color = cc.Color.BLACK;
        line_color.fromHEX(global.LINE_COLOR[color_index]);
        this.line.color = line_color;
        var color = cc.Color.BLACK;
        //this.bg.getComponent(cc.Sprite).spriteFrame = this['ball_index_' + color_index];
    },

    setOriginPosition(){
        this.origin_x = this.node.x;
        this.origin_y = this.node.y;
        //console.log('=============位置信息设定',this.origin_x,this.origin_y)
    },
});
