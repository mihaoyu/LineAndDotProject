// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html
var global = require("lad_mhy_global");

cc.Class({
    extends: cc.Component,

    properties: {
    },

    onLoad: function () {},

    start: function () {
        global.getBestLevel();
    },

    startGame:function(){
        cc.director.loadScene('lad_mhy_scene01');
    },

    startPK:function(){

    },

    checkRank:function(){

    },

    moreGame:function(){

    },

    // update (dt) {},
});
