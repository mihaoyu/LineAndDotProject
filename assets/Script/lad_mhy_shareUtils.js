  /*
    pikapikap!!!!!!!!!!!!!!!!!!!!!!!!!!
          quu..__
           $$$b  `---.__
            "$$b        `--.                          ___.---uuudP
             `$$b           `.__.------.__     __.---'      $$$$"              .
               "$b          -'            `-.-'            $$$"              .'|
                 ".                                       d$"             _.'  |
                   `.   /                              ..."             .'     |
                     `./                           ..::-'            _.'       |
                      /                         .:::-'            .-'         .'
                     :                          ::''\          _.'            |
                    .' .-.             .-.           `.      .'               |
                    : /'$$|           .@"$\           `.   .'              _.-'
                   .'|$u$$|          |$$,$$|           |  <            _.-'
                   | `:$$:'          :$$$$$:           `.  `.       .-'
                   :                  `"--'             |    `-.     \
                  :##.       ==             .###.       `.      `.    `\
                  |##:                      :###:        |        >     >
                  |#'     `..'`..'          `###'        x:      /     /
                   \                                   xXX|     /    ./
                    \                                xXXX'|    /   ./
                    /`-.                                  `.  /   /
                   :    `-  ...........,                   | /  .'
                   |         ``:::::::'       .            |<    `.
                   |             ```          |           x| \ `.:``.
                   |                         .'    /'   xXX|  `:`M`M':.
                   |    |                    ;    /:' xXXX'|  -'MMMMM:'
                   `.  .'                   :    /:'       |-'MMMM.-'
                    |  |                   .'   /'        .'MMM.-'
                    `'`'                   :  ,'          |MMM<
                      |                     `'            |tbap\
                       \                                  :MM.-'
                        \                 |              .''
                         \.               `.            /
                          /     .:::::::.. :           /
                         |     .:::::::::::`.         /
                         |   .:::------------\       /
                        /   .''               >::'  /
                        `',:                 :    .'
                                             `:.:'
           
*/

var global = require("lad_mhy_global");

//此文件其实多用于服务器字符串状态判断，但是当时名字起得不好
var bcbk_mhy_shareUtils = {
    version: "1.0.0",
    shareUrl: "https://game.zuiqiangyingyu.net/common/game/share_list?app_name=dianxianjiaojipk",
    adsUrl: "https://game.zuiqiangyingyu.net/common/game/ads?app_name=dianxianjiaojipk", //暂无
    revivalStatusUrl: "https://game.zuiqiangyingyu.net/common/config/info?app_name=dianxianjiaojipk&version=1.0.0", //暂无
    shareList: [],
    adsList: [],
    defaultTitle: "踏过这个点连完这条线，我们就是兄弟！",

    /* 
    分享图列表(其中元素 {
        position,
        title,
        imageUrl,
        weight
    })
    其中position: 
        1. 发起挑战, 
        2. 群分享续命, 
        3. 普通分享, 
        4. 分享得金币, 
        5. 胜利炫耀, 
        6. 分享成绩
        7.查看群排行
        8.其他

        其中本游戏用到的：  普通分享3
    */

    //获得分享图信息
    getShareInfo: function (position) {
        if (position < 1 || position > 8) return null;
        var ret = null;
        var sameList = [];
        for (var i = 0; i < this.shareList.length; i++) {
            if (this.shareList[i].position == position) {
                sameList.push(i);
            }
        }

        if (sameList.length == 0) {
            //0
        } else if (sameList.length == 1) { //只有1张
            ret = {
                "title": this.shareList[sameList[0]].title,
                "imageUrl": this.shareList[sameList[0]].imageUrl
            };
        } else { //有多张
            var str2 = "";
            var weightSum = 0; //权重和
            for (var i = 0; i < sameList.length; i++) {
                weightSum += parseInt(this.shareList[sameList[i]].weight);
                str2 += this.shareList[sameList[i]].weight + ",";
            }
            //console.log("权重:" + str2);
            //console.log("weightSum=" + weightSum);
            var rate = []; //几率
            for (var i = 0; i < sameList.length; i++) {
                rate.push(parseInt(this.shareList[sameList[i]].weight) / weightSum);
            }
            var str1 = "";
            for (var i = 0; i < rate.length; i++) {
                str1 += rate[i] + ",";
            }
            //console.log("几率:" + str1);
            var checkNum = []; //所有分享图的几率范围 0-20%-40%-...-100%
            checkNum.push(0);
            for (var i = 0; i < rate.length; i++) { //初始化
                checkNum.push(0);
            }
            for (var i = 1; i < checkNum.length; i++) { //累加几率
                for (var j = 1; j < i + 1 && j < checkNum.length; j++) {
                    checkNum[i] += rate[j - 1];
                }
            }
            var str = "";
            for (var i = 0; i < checkNum.length; i++) {
                str += checkNum[i] + ",";
            }
            //console.log("几率范围:" + str);
            var num = Math.random();
            for (var i = 0; i < checkNum.length - 1; i++) {
                if (num >= checkNum[i] && num < checkNum[i + 1]) {
                    ret = {
                        "title": this.shareList[sameList[i]].title,
                        "imageUrl": this.shareList[sameList[i]].imageUrl
                    };
                    break;
                }
            }
        }
        return ret;
    },

    //请求分享图相关信息
    httpRequestShareImageUrls: function (callbacks) {
        var self = this;
        if (this.shareList.length != 0) {
            return;
        }

        cc.log('发送请求');
        //注意url最后面的游戏唯一标识，要使用自己项目对应的
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && (xhr.status >= 200 && xhr.status < 400)) {
                var res = xhr.response;
                res = JSON.parse(res);
                self.shareList = [];
                for (var i = 0; i < res.data.list.length; i++) {
                    //别踩白块PK只有 群分享续命2， 普通分享3， 分享成绩6 ， 查看群排行7
                    if (res.data.list[i].position == 2 || res.data.list[i].position == 3 || res.data.list[i].position == 6 || res.data.list[i].position == 7) {
                        self.shareList.push({
                            "position": res.data.list[i].position,
                            "title": res.data.list[i].title,
                            "imageUrl": res.data.list[i].image,
                            "weight": res.data.list[i].weight
                        });
                    }
                }

                if (callbacks) {
                    callbacks();
                }
            }
        };
        xhr.open('GET', this.shareUrl, true);
        xhr.send();
    },

    //请求广告图信息
    httpRequestAdsImage: function (callback) {
        var self = this;
        if (this.adsList.length != 0) {
            return;
        }

        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && (xhr.status >= 200 && xhr.status < 400)) {
                var res = JSON.parse(xhr.response);
                self.adsList = [];
                if (res.data && res.data.list) {
                    self.adsList = res.data.list
                    if (callback && typeof callback == 'function') {
                        callback();
                    }
                }
            }
        };
        xhr.open('GET', this.adsUrl, true);
        xhr.send();
    },

    //.根据权重获取广告
    getAdsInfo(type, flag) {
        var info = {};
        var tArray = [];
        var tCount = 0;
        var tRandom = Math.random() * tCount;

        if (flag === "ssgonghao") {
            for (var i = 0; i < this.adsList.length; i++) {
                if (this.adsList[i].flag === "ssgonghao")
                    return this.adsList[i];
            }
        }

        for (var i = 0; i < this.adsList.length; i++) {
            if (this.adsList[i].flag === flag || this.adsList[i].type === type) {
                this.adsList[i].weight = parseInt(this.adsList[i].weight);
                tArray.push(this.adsList[i]);
            }
        }

        //.随机数组
        var iArray = [];
        for (var i = 0; i < tArray.length; i++) {
            for (var j = 0; j < tArray[i].weight; j++) {
                iArray.push(i);
            }
        }
        var rI = iArray[parseInt(Math.random() * iArray.length)];
        return tArray[rI];
    },

    // //获得广告图信息
    // getAdsInfo: function () { 
    //     var ret = null;
    //     if (this.adsList.length == 0) { //0
    //     } else if (this.adsList.length == 1) { //只有1张
    //         ret = {
    //             "iconUrl": this.adsList[0].iconUrl,
    //             "imageUrl": this.adsList[0].imageUrl
    //         };
    //     } else { //有多张
    //         var weightSum = 0; //权重和
    //         for (var i = 0; i < this.adsList.length; i++) {
    //             weightSum += parseInt(this.adsList[i].weight);
    //         }
    //         var rate = []; //几率
    //         for (var i = 0; i < this.adsList.length; i++) {
    //             rate.push(parseInt(this.adsList[i].weight) / weightSum);
    //         }
    //         var checkNum = []; //所有广告图的几率范围 0-20%-40%-...-100%
    //         checkNum.push(0);
    //         for (var i = 0; i < rate.length; i++) { //初始化
    //             checkNum.push(0);
    //         }
    //         for (var i = 1; i < checkNum.length; i++) { //累加几率
    //             for (var j = 1; j < i + 1 && j < checkNum.length; j++) {
    //                 checkNum[i] += rate[j - 1];
    //             }
    //         }
    //         var num = Math.random();
    //         for (var i = 0; i < checkNum.length - 1; i++) {
    //             if (num >= checkNum[i] && num < checkNum[i + 1]) {
    //                 ret = {
    //                     "iconUrl": this.adsList[i].iconUrl,
    //                     "imageUrl": this.adsList[i].imageUrl
    //                 };
    //                 break;
    //             }
    //         }
    //     }
    //     return ret;
    // },

    //创建分享图
    createImage: function (sprite, url) { //加载图片
        let image = wx.createImage();
        image.onload = function () {
            let texture = new cc.Texture2D();
            texture.initWithElement(image);
            texture.handleLoadedTexture();
            sprite.spriteFrame = new cc.SpriteFrame(texture);
        };
        image.src = url;
    },

    //请求复活功能标记（暂无此功能）
    httpRequestRevivalStatus: function () {
        var self = this;
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && (xhr.status >= 200 && xhr.status < 400)) {
                var res = JSON.parse(xhr.response);
                console.log('======================', res)
                lad_mhy_global.if_show_revival = (res.data['gameover'] === 1);
                lad_mhy_global.if_open_all = (res.data['bcbkistotallock'] === 1);
                lad_mhy_global.if_world_cup = (res.data['bcbkworldcup'] === 1);
            }
        };
        xhr.open('GET', this.revivalStatusUrl, true);
        xhr.send();
    },
};

module.exports = bcbk_mhy_shareUtils;