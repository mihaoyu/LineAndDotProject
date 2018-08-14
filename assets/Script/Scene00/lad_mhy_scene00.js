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
var utils = require("lad_mhy_utils");
var shareUtils = require("lad_mhy_shareUtils");

cc.Class({
    extends: cc.Component,

    properties: {
    },

    onLoad: function () {
        wx.showShareMenu({
            withShareTicket: true
        })
    },

    start: function () {
        let self = this;
        global.getBestLevel();
        global.getCoinNum();

        shareUtils.httpRequestShareImageUrls(self.shareUrlsCallBacks);

        this.scheduleOnce(function () {
            cc.director.preloadScene("lad_mhy_scene01", function () {
                console.log('====================预加载完毕')
            });
        }, 0.1)
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

    shareUrlsCallBacks:function(){
        let share_data = shareUtils.getShareInfo(3);
        if (utils.checkIfWeChat()) {
            wx.onShareAppMessage(function (res) {
                return {
                    title: share_data.title,
                    imageUrl: share_data.imageUrl,
                    success(res) {},
                    fail(res) {}
                }
            })
        }
    }
    // update (dt) {},
});
