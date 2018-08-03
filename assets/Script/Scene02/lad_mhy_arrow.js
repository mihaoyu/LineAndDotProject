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
    },

    onLoad: function () {},

    start: function () {

    },

    startShow:function(start_pos,target_pos){
        let distance = utils.getTwoPointsXYDistance(start_pos, target_pos);
        this.node.x = start_pos.x;
        this.node.y = start_pos.y;

        this.node.height = utils.getTwoPointsDistance(start_pos,target_pos);
        this.arrow_node.height = this.node.height-10;
        this.node.rotation = utils.getTwoPointsRotation(start_pos, target_pos);
        this.node.active = true;

        console.log('=============distance',distance)

        let move_to_action1 = cc.moveTo(0.8, target_pos);
        let delay_action1 = cc.delayTime(0.4);
        let move_to_action2 = cc.moveTo(0.8, cc.p(target_pos.x + distance[0], target_pos.y + distance[1]));
        let back_func2 = cc.callFunc(function(){
            this.node.x = start_pos.x;
            this.node.y = start_pos.y;
        },this);
        this.node.runAction(cc.repeatForever(cc.sequence(move_to_action1, delay_action1, move_to_action2, back_func2)));

        this.arrow_node.y = this.arrow_node.height;
        let move_to_action3 = cc.moveTo(1,cc.p(0,-10));
        let delay_action2 = cc.delayTime(0.4);
        let move_to_action4 = cc.moveTo(1, cc.p(0, -this.node.height));
        let back_func4 = cc.callFunc(function () {
            this.arrow_node.y = this.arrow_node.height;
        }, this);
        this.arrow_node.runAction(cc.repeatForever(cc.sequence(move_to_action3, delay_action2, move_to_action4, back_func4)))
    },

    stopShow:function () {
        this.node.active = false;
        this.node.stopAllActions();
        this.arrow_node.stopAllActions();
    }
});
