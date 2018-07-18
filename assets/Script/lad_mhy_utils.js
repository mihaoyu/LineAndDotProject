var global = require("lad_mhy_global");
var lad_mhy_utils = {
    getTwoPointsRotation: function (p1, p2) {
        let diff_x = parseInt(p2.x) - parseInt(p1.x);
        let diff_y = parseInt(p2.y) - parseInt(p1.y);
        if (diff_x === 0) {
            diff_x = 0.1;
        }
        let atan_angle = Math.atan(diff_y / diff_x) * 180 / Math.PI;
        let rotation;
        if (diff_x > 0) {
            rotation = 90 - atan_angle;
        } else if (diff_x < 0) {
            rotation = 270 - atan_angle;
        }

        return rotation;
    },

    getTwoPointsDistance: function (p1, p2) {
        let diff_x = parseInt(p2.x) - parseInt(p1.x);
        let diff_y = parseInt(p2.y) - parseInt(p1.y);
        return Math.sqrt(diff_x*diff_x+diff_y*diff_y);
    },

    checkIfInArray:function(num,array){
        let if_in = false;
        for (let index = 0; index < array.length; index++) {
            if(num === array[index]){
                if_in = true;
                break;
            }            
        }
        return if_in;
    },

    ifWXPlatom: function () {
        return cc.sys.platform === cc.sys.WECHAT_GAME;
    },

    localDataSet: function (name, value) {
        //console.log('===========================存入数据到本地',name,value)
        cc.sys.localStorage.setItem(name, value);
    },

    localDataGet: function (name,defaultValue) {
        var value = cc.sys.localStorage.getItem(name);
        //console.log("=======================读取本地数目",name,value)
        if (value && typeof (value) != "undefined" && value != 0) {
            return value;
        }
        if (defaultValue == null){
            return 0;
        }else{
            return defaultValue;
        }
    },

    uploadWXData: function (keyString, valueString) {
        var kvDataList = new Array();
        kvDataList.push({
            key: keyString,
            value: valueString+""
        });

        wx.setUserCloudStorage({
            KVDataList: kvDataList
        })
    },

    checkIfUndefined:function(a){
        let if_undefined = false;
        typeof (a) == "undefined" ? if_undefined = true: if_undefined = false;
        return if_undefined;
    },

    checkIfEqual:function(a,b){
        return (Math.abs(a-b)<0.01);
    },

    checkIfPointAtLine:function(line_p1,line_p2,p3){
        let in_line = false;
        let distance = 0.01;
        line_p1.x = parseInt(line_p1.x);
        line_p1.y = parseInt(line_p1.y);

        line_p2.x = parseInt(line_p2.x);
        line_p2.y = parseInt(line_p2.y);

        p3.x = parseInt(p3.x);
        p3.y = parseInt(p3.y);

        //共线+在所围成的平行四边形中
        if (this.getCrossProduct(this.getPointMinus(p3, line_p1), this.getPointMinus(p3, line_p2)) < distance){
            if (Math.min(line_p1.x, line_p2.x) - distance <= p3.x && p3.x - distance <= Math.max(line_p1.x, line_p2.x)) {
                if (Math.min(line_p1.y, line_p2.y) - distance <= p3.y && p3.y - distance <= Math.max(line_p1.y, line_p2.y)) {
                    in_line = true;
                }
            }
        }
        return in_line;
    },

    getPointMinus:function(p1,p2){
        return cc.p(p1.x-p2.x,p1.y-p2.y);
    },

    getCrossProduct:function(p1,p2){
        return (p1.x*p2.y-p2.x*p1.y);
    },

    getPassedNum:function(){
        //横线
        
        //竖线

        //斜线
    },

    //共线共点向量是否统一方向
    checkIfSameDirection: function (same_point, p1, p2) {
        let if_same_direction = false;
        if (this.getPointMinus(p1, same_point).x === 0){
            if_same_direction = ((this.getPointMinus(p1, same_point).y / this.getPointMinus(p2, same_point).y) > 0) ? true : false;
        }else{
            if_same_direction = ((this.getPointMinus(p1, same_point).x / this.getPointMinus(p2, same_point).x) > 0) ? true : false;
        }
        return if_same_direction;
    },

    //查看当前两点之间存在多少个点
    checkHowManyBallsBetweenTwoBalls:function(ball_index_1,ball_index_2){
        let balls_array = -1;

        let ball_1 = this.getRowAndColumnByBallIndex(ball_index_1);
        let ball_2 = this.getRowAndColumnByBallIndex(ball_index_2);
        let row_max = Math.max(ball_1[0],ball_2[0]);
        let row_min = Math.min(ball_1[0], ball_2[0]);
        let column_max = Math.max(ball_1[1], ball_2[1]);
        let column_min = Math.min(ball_1[1], ball_2[1]);

        if(row_max === row_min){
            balls_array = [];
            for(let i = column_min+1;i<column_max;i++){
                balls_array.push(i+row_max*5);
            }
            return balls_array;
        }

        if(column_max === column_min){
            balls_array = [];
            for(let i = row_min+1;i<row_max;i++){
                balls_array.push(i*5+column_max);
            }
            return balls_array;
        }

        let ball_1_point = global.point_array[ball_index_1];
        let ball_2_point = global.point_array[ball_index_2];
        let ball_index = 0;
        let ball_point = 0;

        balls_array = [];
        for(let i = row_min+1;i<row_max;i++){
            for(let j = column_min+1;j<column_max;j++){
                ball_index = i*5+j;
                ball_point = global.point_array[ball_index];
                if (this.checkIfPointAtLine(ball_1_point, ball_2_point, ball_point)){
                    balls_array.push(ball_index);
                }
            }
        }

        return balls_array;
    },

    getRowAndColumnByBallIndex: function (ball_index) {
        return [Math. floor(ball_index/5),ball_index%5];
    },
};

module.exports = lad_mhy_utils;