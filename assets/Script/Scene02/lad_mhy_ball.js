// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        ball_index_1: cc.SpriteFrame,
        ball_index_2: cc.SpriteFrame,
        ball_index_3: cc.SpriteFrame,
        ball_index_4: cc.SpriteFrame,
        ball_index_5: cc.SpriteFrame,
    },

    // LIFE-CYCLE CALLBACKS:
    start () {

    },

    setBallColor:function(color_index){
        this.node.getComponent(cc.Sprite).spriteFrame = this['ball_index_' + color_index];
    }

    // update (dt) {},
});
