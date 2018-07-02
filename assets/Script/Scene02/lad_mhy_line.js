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
        this.touchEventOn();
    },

    onDestroy:function(){
        this.touchEventOff();
    },

    setLineIndex:function(a,b,c){
        this.line_index = a;
        this.ball_index_1 = b;
        this.ball_index_2 = c;
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
                        console.log('-=============line点击开始',this)


        let position = this.node.convertToNodeSpaceAR(event.getLocation());
        let pos_x = position.x;
        let pos_y = position.y;

        this.origin_x = this.node.x;
        this.origin_y = this.node.y;

        //传送给主场景，告知是哪个line开始动
        global.setMoveBallAndLine(this.line_index, this.ball_index_1, this.ball_index_2,pos_x,pos_y);
        cc.game.emit("lad_line_start");
    },

    touchMove: function (event, touch) {
        if (event.getTouches().length > 1) {
            return;
        }
        console.log('-=============line点击移动')
        var delta = event.touch.getDelta();
        this.node.x += delta.x;
        this.node.y += delta.y;

        this.node.opacity = 0;
    },

    touchEnd: function (event, touch) {
        if (event.getTouches().length > 1) {
            return;
        }

        this.node.x = this.origin_x;
        this.node.y = this.origin_y;
        this.node.opacity = 255;

        //通过判断当前点是否是正确可落点，来销毁该线段
    },

    destorySelf:function(){
        this.node.removeFromParent();
    },

    getBalls:function(){
        return [this.ball_index_1,this.ball_index_2];
    }
});
