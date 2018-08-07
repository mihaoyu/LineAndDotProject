// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html
var utils = require("lad_mhy_utils");
cc.Class({
    extends: cc.Component,

    properties: {
        mask_node:cc.Node,
        arrow_node:cc.Node,
    },

    onLoad: function () {},

    start: function () {

    },

    startShow:function(start_pos,target_pos){
        this.node.x = target_pos.x;
        this.node.y = target_pos.y;

        this.node.height = utils.getTwoPointsDistance(start_pos,target_pos);
        this.arrow_node.height = this.node.height;
        this.mask_node.height = this.node.height;

        this.node.rotation = utils.getTwoPointsRotation(start_pos, target_pos);
        this.node.active = true;

        this.mask_node.y = 0;
        let move_to_action1 = cc.moveTo(0.8, cc.p(0, this.arrow_node.height)).easing(cc.easeExponentialOut(3.0));
        let delay_action1 = cc.delayTime(0.8);
        let back_func1 = cc.callFunc(function () {
            this.mask_node.y = -this.arrow_node.height;
        }, this);
        let move_to_action2 = cc.moveTo(0.8, cc.p(0, 0)).easing(cc.easeExponentialOut(3.0));
        let back_func2 = cc.callFunc(function(){
            this.mask_node.y = 0;
        },this);

        this.mask_node.runAction(cc.repeatForever(cc.sequence(move_to_action1, delay_action1, back_func1, move_to_action2, back_func2)));
    },

    stopShow:function () {
        this.mask_node.y = 0;
        this.node.active = false;
        this.mask_node.stopAllActions();
    }
});
