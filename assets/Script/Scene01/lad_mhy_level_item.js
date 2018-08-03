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
        bg_open: cc.SpriteFrame,
        bg_close: cc.SpriteFrame,
        bg:cc.Sprite,
        tip:cc.Node,
        level_num:cc.Label,
    },

    start:function () {
    },

    setLevelItemInfo(level){
        this.level = level;
        this.level_num.string = level;
        this.tip.active = (level===global.current_level);
        this.bg.spriteFrame = (level > global.last_open_level) ? this.bg_close : this.bg_open;
    },

    selectLevel:function(){
        console.log('==============',this)

        if(this.level === -1)return;
        if(global.select_level !== -1)return;

        global.select_level = this.level;
        if(this.level > global.last_open_level){
            //吐司提示
            global.current_level = this.level;
            cc.director.loadScene('lad_mhy_scene02');
        }else{
            //进入相应等级，之后记得做个点击时间限制
            global.current_level = this.level;
            cc.director.loadScene('lad_mhy_scene02');
        }
    },
});
