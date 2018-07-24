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
        // foo: {
        //     // ATTRIBUTES:
        //     default: null,        // The default value will be used only when the component attaching
        //                           // to a node for the first time
        //     type: cc.SpriteFrame, // optional, default is typeof default
        //     serializable: true,   // optional, default is true
        // },
        // bar: {
        //     get () {
        //         return this._bar;
        //     },
        //     set (value) {
        //         this._bar = value;
        //     }
        // },
    },

    start () {
        this.origin_x = 0;
        this.origin_y = 0;
        this.opacity = 255;
        this.touchEventOn();
    },

    onDestroy:function(){
        this.touchEventOff();
    },

    setLineIndex:function(a,b,c){
        this.line_index = a;
        b<c? this.ball_index_1 = c: this.ball_index_1 = b;
        b<c? this.ball_index_2 = b: this.ball_index_2 = c;
    },

    touchEventOn: function () {
        this.node.on(cc.Node.EventType.TOUCH_START, this.touchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
    },

    touchEventOff: function () {
        this.node.off(cc.Node.EventType.TOUCH_START, this.touchStart, this);
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
    },

    touchStart: function (event, touch) {
        if (event.getTouches().length > 1) {
            return;
        }

        //可能需要再判断
        if (global.current_move_line_index!==-1) {
            console.log("=====================global.current_move",global.current_move_line_index)
            return;
        }

        //做个处理，如果已经有了current_line则忽略其他的移动行为
        console.log('-=============line点击开始', this,event)

        let position = event.getLocation();
        let pos_x = 0;
        let pos_y = 0;
        pos_x = position.x - cc.winSize.width/2;
        pos_y = position.y - cc.winSize.height/2; 

        this.origin_x = this.node.x;
        this.origin_y = this.node.y;
        this.node.opacity = 0;

        //传送给主场景，告知是哪个line开始动
        global.setMoveBallAndLine(this.line_index, this.ball_index_1, this.ball_index_2,pos_x,pos_y);
        cc.game.emit("lad_line_start");
    },

    touchMove: function (event, touch) {
        if (event.getTouches().length > 1) {
            return;
        }

        if (global.current_move_line_index !== this.line_index) {
            return;
        }

        var delta = event.touch.getDelta();
        this.node.x += delta.x;
        this.node.y += delta.y;

        global.current_event = event;
        cc.game.emit("lad_line_move");
    },

    touchEnd: function (event, touch) {
        if (event.getTouches().length > 1) {
            return;
        }

        if (global.current_move_line_index !== this.line_index) {
            return;
        }
        cc.game.emit("lad_line_end");
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
});
