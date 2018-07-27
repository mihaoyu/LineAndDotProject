/*
                  老天保佑
                  永无bug 

                   _ooOoo_ 
                  o8888888o 
                  88" . "88 
                  (| -_- |) 
                  O\  =  /O 
               ____/`---'\____ 
             .'  \\|     |//  `. 
            /  \\|||  :  |||//  \ 
           /  _||||| -:- |||||-  \ 
           |   | \\\  -  /// |   | 
           | \_|  ''\---/''  |   | 
           \  .-\__  `-`  ___/-. / 
         ___`. .'  /--.--\  `. . __ 
      ."" '<  `.___\_<|>_/___.'  >'"". 
     | | :  `- \`.;`\ _ /`;.`/ - ` : | | 
     \  \ `-.   \_ __\ /__ _/   .-` /  / 
======`-.____`-.___\_____/___.-`____.-'====== 
                   `=---=' 


*/

var global = require("lad_mhy_global");
var utils = require("lad_mhy_utils");

cc.Class({
    extends: cc.Component,

    properties: {
        line_prefab:cc.Prefab,
        line_prefab2:cc.Prefab,
        ball_prefab:cc.Prefab,
        circle_prefab:cc.Prefab,
        wrong_prefab:cc.Prefab,

        ball_blue:cc.SpriteFrame,
        ball_red:cc.SpriteFrame,

        target_bg:cc.Node,

        target_layer: cc.Node,
        level_line_layer:cc.Node,
        level_ball_layer:cc.Node,
        level_wrong_tags_layer:cc.Node,

        level_label:cc.Label,
    },

    onLoad: function () {
        this.initGameOnEvents();
        this.initVaribles();
        this.createBasicBalls();
    },

    start:function(){
        this.time = 0;

        this.init_balls_array = [];
        this.init_balls_config = [];

        //涉及到内存分配
        this.ball_storge_array = [];
        this.line_storge_array = [];
        this.lines_array = [];

        //目标
        this.target_ball_config = [];
        this.target_balls_nums = [];
        this.target_lines = [];

        //每个级别现存
        this.current_line_had = [];
        this.target_line_had = [];
        this.record_array = [];

        global.setTargetBallPosition(this.target_bg.width, this.target_bg.height);
        this.updateCurrentLadLevel();
        this.updateTargetLadLevel();

        this.initWrongTags();
        global.initMoveBallAndLine();
    },

    update(dt) {
        //运行完了shader，直接跳过
        if(1)return;

        if(this.shaderNeedTime === -1){return;}

        this.time = (Date.now() - this.shaderStartTime);
        if(this.time > this.shaderNeedTime){
            this.shaderNeedTime = -1;
            return;
        }

        if (this.program) {
            this.program.use();
            if (cc.sys.isNative) {
                var glProgram_state = cc.GLProgramState.getOrCreateWithGLProgram(this.program);
                glProgram_state.setUniformFloat("time", this.time*1000);
            } else {
                let ct = this.program.getUniformLocationForName("time");
                this.program.setUniformLocationWith1f(ct, this.time*1000);
            }
        }
    },

    onDestroy: function () {
        cc.game.off("lad_line_start", this.fingerStart, this);
        cc.game.off("lad_line_move", this.touchMove, this);
        cc.game.off("lad_line_end", this.touchEnd, this);
    },

    initVaribles:function(){
        this.selected_line_1 = -1;
        this.selected_line_2 = -1;
        this.target_ball = -1;
        this.near_ball_index = -1;
    },

    initGameOnEvents: function () {
        cc.game.on("lad_line_start", this.fingerStart, this);
        cc.game.on("lad_line_move", this.touchMove, this);
        cc.game.on("lad_line_end", this.touchEnd, this);
    },

    createBasicBalls: function () {
        //以前自己生成ball，现在直接给了图，这边只提供产生坐标了
        if (global.point_array.length > 1) return;

        this.offset_x = -2*global.BALL_DISTANCE-2;
        this.offset_y = -2*global.BALL_DISTANCE+5;
        for (let i = 0; i < global.BASIC_BALLS_COUNT; i++) {
            let pos_x = this.offset_x + (i % global.BASIC_WIDTH) * global.BALL_DISTANCE;
            let pos_y = this.offset_y + Math.floor(i / global.BASIC_HEIGHT) * global.BALL_DISTANCE;
            global.point_array.push(cc.p(pos_x,pos_y));
        }
    },

    updateCurrentLadLevel: function () {
        this.level_label.string = "当前等级：" + global.current_level;

        this.initBallsAndLinesShowStatus();
        //后面再去考虑优化,这边数组分配有点问题

        this.current_line_had = [];
        this.init_balls_nums = [];

        //放置玩家球
        let ball_index_1 = 0;
        let ball_index_2 = 0;
        let ball_index_array = 0;
        let max = -1;
        let min = -1;

        this.init_balls_config = global.makeStrToArray(global.getInitConfigByLevel(global.current_level), ",");
        
        for (let i = 0; i < this.init_balls_config.length; i++) {
            ball_index_array = global.makeStrToArray(this.init_balls_config[i], "_");
            ball_index_1 = ball_index_array[0] - 0;
            ball_index_2 = ball_index_array[1] - 0;
            this.addBall(ball_index_1);
            this.addBall(ball_index_2);
        }

        /* for (let i = 0; i < 25; i++) {
            ball_index_1 = i
            this.addBall(ball_index_1);
        } */

        //if(1)return;

        for (let i = 0; i < this.init_balls_config.length; i++) {
            ball_index_array = global.makeStrToArray(this.init_balls_config[i], "_");
            ball_index_1 = ball_index_array[0] - 0;
            ball_index_2 = ball_index_array[1] - 0;
            max = (ball_index_1 > ball_index_2) ? ball_index_1 : ball_index_2;
            min = (ball_index_1 > ball_index_2) ? ball_index_2 : ball_index_1;
            this.addLine(min, max);
        }
    },

    updateTargetLadLevel:function(){
        this.target_balls_nums = [];
        this.target_line_had = [];
        this.target_lines_transfer = [];
        
        this.target_ball_config = global.makeStrToArray(global.getTargetConfigByLevel(global.current_level), ",");

        let index_1 = 0;
        let index_2 = 0;
        let index_array = 0;
        let max = 0;
        let min = 0;

        for(let i = 0;i<this.target_lines.length;i++){
            utils.checkIfUndefined(this.target_lines[i]) ? 1 : this.target_lines[i].active = false;
        }

        for (let i = 0; i < this.target_ball_config.length; i++) {
            index_array = global.makeStrToArray(this.target_ball_config[i], "_");
            index_1 = index_array[0] - 0;
            index_2 = index_array[1] - 0;

            this.target_balls_nums[index_1] = true;
            this.target_balls_nums[index_2] = true;

            this.drawTargetLine(index_1, index_2, i);

            //max，min可能以后会发现不需要分的这么清楚
            max = (index_1 > index_2) ? index_1 : index_2;
            min = (index_1 > index_2) ? index_2 : index_1;

            //可能会删除，暂时没有用
            if (utils.checkIfUndefined(this.target_line_had[min])){
                this.target_line_had[min] = [];
                this.target_line_had[min].push(max);
            }else{
                this.target_line_had[min].push(max);
            }

            //部分有误 10,40,43,50
            if (utils.checkIfUndefined(this.target_lines_transfer[min])) {
                this.target_lines_transfer[min] = [];
            }

            let temp_array = utils.checkHowManyBallsBetweenTwoBalls(min,max);

            if(temp_array.length >0){
                this.target_lines_transfer[min][temp_array[0]] = true;
                for(let j = 0;j<temp_array.length;j++){
                    this.target_balls_nums[temp_array[j]] = true;

                    if (j !== temp_array.length - 1) {
                        if (utils.checkIfUndefined(this.target_lines_transfer[temp_array[j]])){
                            this.target_lines_transfer[temp_array[j]] = [];
                        }
                        this.target_lines_transfer[temp_array[j]][temp_array[j + 1]] = true;
                    } else {
                        if (utils.checkIfUndefined(this.target_lines_transfer[temp_array[temp_array.length - 1]])) {
                            this.target_lines_transfer[temp_array[temp_array.length - 1]] = [];
                        }
                        this.target_lines_transfer[temp_array[temp_array.length - 1]][max] = true;
                    }
                }
            }else{
                this.target_lines_transfer[min][max] = true;
            }
        }
    },

    drawTargetLine:function(index_1,index_2,i){
        if (utils.checkIfUndefined(this.target_lines[i])){
            this.target_lines[i] = cc.instantiate(this.line_prefab2);
            this.target_lines[i].parent = this.target_layer;
        }
        //设定位置
        let point_pos1 = cc.p(global.target_ball_position[2 * index_1], global.target_ball_position[2 * index_1+1]);
        let point_pos2 = cc.p(global.target_ball_position[2 * index_2], global.target_ball_position[2 * index_2 + 1]);

        this.target_lines[i].x = point_pos1.x;
        this.target_lines[i].y = point_pos1.y;

        this.target_lines[i].rotation = utils.getTwoPointsRotation(point_pos1, point_pos2);
        this.target_lines[i].scaleY = (utils.getTwoPointsDistance(point_pos1, point_pos2) / this.target_lines[i].height);
        this.target_lines[i].active = true;
    },

    initBallsAndLinesShowStatus:function(){
        let ball_node;
        for (let i = 0; i < global.BASIC_BALLS_COUNT; i++) {
            ball_node = this.init_balls_array[i];
            utils.checkIfUndefined(ball_node) ? 1: this.init_balls_array[i].active = false;
        }
        this.clearAllLineNode();
    },

    initWrongTags: function () {
        this.wrong_tags_array = [];
    },

    setNormalLineInfo: function (line_node, ball_1,ball_2) {
        line_node.x = ball_1.x;
        line_node.y = ball_1.y;
        line_node.rotation = utils.getTwoPointsRotation(ball_1.getPosition(), ball_2.getPosition());
        line_node.scaleY = (utils.getTwoPointsDistance(ball_1.getPosition(), ball_2.getPosition()) / line_node.height);
    },

    setSelectedLineInfo:function(line_index,line_node,ball_1,ball_1_index){
        line_node.x = ball_1.x;
        line_node.y = ball_1.y;
        line_node.rotation = utils.getTwoPointsRotation(ball_1.getPosition(), global.current_target_position);
        line_node.scaleY = (utils.getTwoPointsDistance(ball_1.getPosition(), global.current_target_position) / line_node.height);
        line_node.getComponent('lad_mhy_line').setLineIndex(line_index, ball_1_index, -1);
    },

    updateSelectedLineInfo:function(line_node,ball_1){
        line_node.x = ball_1.x;
        line_node.y = ball_1.y;
        line_node.rotation = utils.getTwoPointsRotation(ball_1.getPosition(), global.current_target_position);
        line_node.scaleY = (utils.getTwoPointsDistance(ball_1.getPosition(), global.current_target_position) / line_node.height);
    },

    fingerStart: function () {
        if (this.selected_line_1 === -1) {
            global.current_selected_line_index_1 = this.getLineNode();
            this.selected_line_1 = this.lines_array[global.current_selected_line_index_1];
        }

        if (this.selected_line_2 === -1) {
            global.current_selected_line_index_2 = this.getLineNode();
            this.selected_line_2 = this.lines_array[global.current_selected_line_index_2];
        }

        this.selected_line_1.active = true;
        this.selected_line_2.active = true;

        global.current_move_ball_1 = this.init_balls_array[global.current_move_ball_index_1];
        global.current_move_ball_2 = this.init_balls_array[global.current_move_ball_index_2];

        //移动线的信息赋值，只需要指定第一个球，后面的第二球的信息会自动忽略
        this.setSelectedLineInfo(global.current_selected_line_index_1,this.selected_line_1, global.current_move_ball_1, global.current_move_ball_index_1, true, global.current_target_position, global.current_selected_line_index_1);
        this.setSelectedLineInfo(global.current_selected_line_index_2,this.selected_line_2, global.current_move_ball_2, global.current_move_ball_index_2, true, global.current_target_position, global.current_selected_line_index_2);

        let pos_x = global.current_target_position.x;
        let pos_y = global.current_target_position.y;

        if (this.target_ball === -1) {
            this.target_ball = this.getBallNodeByBallIndex(global.TARGET_BALL_INDEX);
        }

        this.target_ball.x = pos_x;
        this.target_ball.y = pos_y;
        this.target_ball.active = true;
    },

    touchStart: function (event, touch) {
        if (event.getTouches().length > 1) {
            return;
        }
    },

    touchMove:function(event){
        if (global.current_move_ball_1 === -1 || global.current_move_ball_2 === -1){
            return;
        }  

        let pos_x = 0;
        let pos_y = 0;
        let position = this.node.convertToNodeSpaceAR(global.current_event.getLocation());
        this.near_ball_index = this.checkIfNearOtherNodes(position.x,position.y);

        console.log('===============是否有nearballindex',this.near_ball_index)

        if(this.near_ball_index === -1){
            pos_x = position.x;
            pos_y = position.y;
        }else{
            pos_x = global.point_array[this.near_ball_index].x;
            pos_y = global.point_array[this.near_ball_index].y;
        }

        this.target_ball.x = pos_x;
        this.target_ball.y = pos_y;
        global.current_target_position = cc.p(pos_x, pos_y);

        this.updateSelectedLineInfo(this.selected_line_1, global.current_move_ball_1);
        this.updateSelectedLineInfo(this.selected_line_2, global.current_move_ball_2);

        //显示交集线是否有x号
        //计算wrong_num
        let a = 0;
        this.wrong_num = 0;

        //添加一个判断，只有落点正确了才会去看看是不是有交点，否则不用理会



        //判断移动点是否和其中的一个点重合，如果重合，则返回
        if (this.near_ball_index !== -1 && (this.near_ball_index === global.current_move_ball_index_1 || this.near_ball_index === global.current_move_ball_index_2)) {
            return;
        }

        //判断其他线和当前两条移动线的交点
        for (let i = 0;i < this.lines_array.length;i++){
            a = this.getCrossPoints(this.lines_array[i], this.selected_line_1);
            if (a!= -1 && this.checkIfNotAroundBallPoints(a)) {
                let wrong_temp = this.wrong_tags_array[this.wrong_num];

                if(utils.checkIfUndefined(wrong_temp)){
                    wrong_temp = cc.instantiate(this.wrong_prefab);
                    wrong_temp.scale = 1.1;
                    wrong_temp.parent = this.level_wrong_tags_layer;
                    this.wrong_tags_array[this.wrong_num] = wrong_temp;
                }

                wrong_temp.active = true;
                wrong_temp.x = a[1];
                wrong_temp.y = a[2];
                this.wrong_num++;
            }
            
            a = this.getCrossPoints(this.lines_array[i], this.selected_line_2);
            if (a!= -1 && this.checkIfNotAroundBallPoints(a)) {
                let wrong_temp = this.wrong_tags_array[this.wrong_num];
                if (utils.checkIfUndefined(wrong_temp)) {
                    wrong_temp = cc.instantiate(this.wrong_prefab);
                    wrong_temp.scale = 1.1;
                    wrong_temp.parent = this.level_wrong_tags_layer;
                    this.wrong_tags_array[this.wrong_num] = wrong_temp;
                }
                wrong_temp.active = true;
                wrong_temp.x = a[1];
                wrong_temp.y = a[2];
                this.wrong_num++;
            }
        }

        //判断当前两条移动线共线情况，两条移动线共线一定有交点，共线时返回

        //console.log('====================当前的数量统计',this.wrong_num,this.wrong_tags_array.length)
        if (this.wrong_num < this.wrong_tags_array.length){
            for(let i = this.wrong_num;i<this.wrong_tags_array.length;i++){
                this.wrong_tags_array[i].active = false;
            }
        }
    },

    touchEnd:function(event){
        if (global.current_move_ball_1 === -1 || global.current_move_ball_2 === -1) return;

        //current_move_ball_1这个标记其实是用来标记是否移动了线，只有移动了线
        if (global.current_move_ball_1 !== -1 || global.current_move_ball_2 !== -1) {
            global.current_move_ball_1 = -1;
            global.current_move_ball_2 = -1;
        }

        for (let index = 0; index < this.wrong_tags_array.length; index++) {
            this.wrong_tags_array[index].active = false;
        }

        //判断移动点是否和其中的一个点重合，如果重合，则返回
        let a = this.near_ball_index === -1;
        let b = this.near_ball_index === global.current_move_ball_index_1 || this.near_ball_index === global.current_move_ball_index_2;
        if(a||b){
            this.lines_array[global.current_move_line_index].getComponent('lad_mhy_line').resetSelf();
            this.recycleSelectedLine();
            this.initMoveStatusParams();
            return;
        }

        if (this.checkIfACorrectBall()) {
            //消除当前line
            let index_1 = this.lines_array[global.current_move_line_index].getComponent('lad_mhy_line').getBallsIndex()[0];
            let index_2 = this.lines_array[global.current_move_line_index].getComponent('lad_mhy_line').getBallsIndex()[1];
            this.deleteCurrentLine(index_2, index_1, global.current_move_line_index);

            this.addBall(this.near_ball_index);
            let c = this.checkIfNeedToCreateNewLineAndBall(index_1, index_2, this.near_ball_index);
            
            let need_create = c[0];
            
            //需要存的的东西：删掉的线，多出来的线，多出来的ball
            let temp_array = {};
            temp_array['deleted_lines'] = [index_2,index_1];
            temp_array['added_balls'] = [this.near_ball_index];
            temp_array['added_lines'] = c[1]; 

            let d = -1;
            let e = -1;
            if (!need_create[0]) {
                d = this.selected_line_1.getComponent('lad_mhy_line').getBallsIndex()[0];
                e = this.selected_line_1.getComponent('lad_mhy_line').getLineIndex();
                temp_array['added_lines'].push([d, this.near_ball_index, e]);
                this.setSelectedLineToNormalLine(this.selected_line_1, this.near_ball_index);
            }

            if (!need_create[1]) {
                d = this.selected_line_2.getComponent('lad_mhy_line').getBallsIndex()[0];
                e = this.selected_line_2.getComponent('lad_mhy_line').getLineIndex();
                temp_array['added_lines'].push([d, this.near_ball_index, e]);
                this.setSelectedLineToNormalLine(this.selected_line_2, this.near_ball_index);
            }

            this.record_array.push(temp_array);
            console.log('================当前操作步骤',this.record_array)

            this.recycleSelectedLine(need_create);

            //如果正确，判断是否过关，过关则显示过关效果，否则按下了按钮,添加线
            if (this.checkIfPassLevel()){
                //过关
                //闪亮代码
                //下一关内容刷新
                console.log('=======================过关');
                this.toNextLevel();
            }else{
                //未过关，继续
                console.log('=======================未过关，继续');
            }
        }else{
            this.recycleSelectedLine();
            this.lines_array[global.current_move_line_index].getComponent('lad_mhy_line').resetSelf();
        }
        this.initMoveStatusParams();
    },

    checkIfNeedToCreateNewLineAndBall:function(index_1,index_2,index_3){
        let need = [false,false];
        let add_lines = [];

        let max = index_1;
        let min = index_2;
        let operate_array = false;
        let max_temp = -1;
        let min_temp = -1;

        let temp_array_1 = utils.checkHowManyBallsBetweenTwoBalls(max, index_3);
        let temp_array_2 = utils.checkHowManyBallsBetweenTwoBalls(min, index_3);

        if(temp_array_1.length !== 0){
            max_temp = max > index_3 ? max : index_3;
            min_temp = max > index_3 ? index_3 : max;

            //只会被已有点所分割
            if (temp_array_1.length != 0) {
                operate_array = [];
                for (let i = 0; i < temp_array_1.length; i++) {
                    if (utils.checkIfInArray(temp_array_1[i], this.init_balls_nums)) {
                        operate_array.push(temp_array_1[i]);
                    }
                }
            }

            //在min_temp index_3 max_temp中添加球，线
            if(operate_array.length === 1){
                //此代码可能以后没用
               // this.addBall(operate_array[0]);
                let a = this.addLine(min_temp, operate_array[0]);
                let b = this.addLine(operate_array[0], max_temp);
                add_lines.push([min_temp, operate_array[0],a]);
                add_lines.push([operate_array[0], max_temp,b]);
                
                
                
                need[0] = true;
            }else if(operate_array.length > 1) {
                //this.addBall(operate_array[i]);
                let a = this.addLine(min_temp,operate_array[0]);
                add_lines.push([min_temp, operate_array[0],a]);
                
                
                
                for(let i = 0;i<operate_array.length;i++){
                    if(i!==(operate_array.length-1)){
                        let a = this.addLine(operate_array[i],operate_array[i+1]);
                        add_lines.push([operate_array[i], operate_array[i + 1],a]);
                    }else{
                        let a = this.addLine(operate_array[i],max_temp);
                        add_lines.push([operate_array[i], max_temp,a]);
                    }
                }
                need[0] = true;
            }
        }

        if (temp_array_2.length !== 0) {
            max_temp = min > index_3 ? min : index_3; 
            min_temp = min > index_3 ? index_3:min; 

            if (temp_array_2.length != 0) {
                operate_array = [];
                for (let i = 0; i < temp_array_2.length; i++) {
                    if (utils.checkIfInArray(temp_array_2[i], this.init_balls_nums)) {
                        operate_array.push(temp_array_2[i]);
                    }
                }
            }
            console.log('=======================operate_array2', operate_array)

            if (operate_array.length === 1) {
                //this.addBall(operate_array[0]);

                let a = this.addLine(min_temp, operate_array[0]);
                let b = this.addLine(operate_array[0], max_temp);

                add_lines.push([min_temp, operate_array[0],a]);
                add_lines.push([operate_array[0], max_temp,b]);



                need[1] = true;
            } else if (operate_array.length>1) {
                let a = this.addLine(min_temp, operate_array[0]);
                add_lines.push([min_temp, operate_array[0],a]);

                for (let i = 0; i < operate_array.length; i++) {
                    //this.addBall(operate_array[i]);

                    if (i !== (operate_array.length - 1)) {
                        let a = this.addLine(operate_array[i], operate_array[i + 1]);
                        add_lines.push([operate_array[i], operate_array[i + 1],a]);
                    } else {
                        let b = this.addLine(operate_array[i], max_temp);
                        add_lines.push([operate_array[i], max_temp,b]);


                    }
                }
                need[1] = true;
            }
        }

        return [need,add_lines];
    },

    setSelectedLineToNormalLine:function(line_node,ball_index){
        let line_index = line_node.getComponent('lad_mhy_line').getLineIndex();
        let ball_index_1 = line_node.getComponent('lad_mhy_line').getBallsIndex()[0];
        let ball_index_2 = ball_index;
        let max = (ball_index_1 > ball_index_2) ? ball_index_1 : ball_index_2;
        let min = (ball_index_1 > ball_index_2) ? ball_index_2 : ball_index_1;
        line_node.getComponent('lad_mhy_line').setLineIndex(line_index,max,min);

        if (utils.checkIfUndefined(this.current_line_had[min])) {
            this.current_line_had[min] = [];
            this.current_line_had[min].push(max);
        } else {
            this.current_line_had[min].push(max);
        }
    },

    initMoveStatusParams:function(){
        this.target_ball = -1;
        this.wrong_num = 0;
        this.near_ball_index = -1;
        this.selected_line_1 = -1;
        this.selected_line_2 = -1;
        global.initMoveBallAndLine();
        //target_ball可能以后不用回收
        this.sendBallNodeToPool(global.TARGET_BALL_INDEX);
    },

    recycleSelectedLine:function(params){
        let line_1_status = true;
        let line_2_status = true;

        if(!utils.checkIfUndefined(params)){
            line_1_status = params[0];
            line_2_status = params[1];
        }

        if(line_1_status){
            this.selected_line_1.active = false;
            this.sendLineNodeToPool(this.selected_line_1);
            this.lines_array[global.current_selected_line_index_1] = undefined;
        }

        if(line_2_status){
            this.selected_line_2.active = false;
            this.sendLineNodeToPool(this.selected_line_2);
            this.lines_array[global.current_selected_line_index_2] = undefined;
        }
    },

    checkIfNearOtherNodes:function(pos_x,pos_y){
        let in_row = -1;
        let in_column = -1;

        //防止小数太多计算太多，以后可能会删掉此代码
        pos_x = parseInt(pos_x);
        pos_y = parseInt(pos_y);

        for(let i = 0;i<5;i++){
            pos_y > global.point_array[i * 5].y ? in_row = i : 1 ;
            pos_x > global.point_array[i].x ? in_column = i: 1;
        }

        console.log('===================aaaa',in_row,in_column)

        if (in_row === -1 && in_column === -1) {
            if (this.checkIfNear(pos_x, pos_y, global.point_array[0])) {
                return 0;
            }
            return -1;
        }

        if(in_row === 4 && in_column === 4){
            if (this.checkIfNear(pos_x, pos_y, global.point_array[24])) {
                return 24;
            }
            return -1;
        }

        //这里没有判断in_column，多判断了两次待后面优化
        if(in_row === 4){
            let ball_index = 0;
            for(let i = 0;i < 5;i++){
                ball_index = i + 20;
                if (this.checkIfNear(pos_x, pos_y, global.point_array[ball_index])) {
                    return ball_index;
                }
            }
            return -1;
        }

        //这里没有判断in_row，多判断了两次待后面优化
        if(in_column === 4){
            let ball_index = 0;            
            for (let i = 0; i < 5; i++) {
                ball_index = (i+1)*5-1;
                if (this.checkIfNear(pos_x, pos_y, global.point_array[ball_index])) {
                    return ball_index;
                }
            }
            return -1;
        }

        //这里没有判断in_column，多判断了两次待后面优化
        if (in_row === -1) {
            let ball_index = 0;
            for (let i = 0; i < 5; i++) {
                ball_index = i;
                if (this.checkIfNear(pos_x, pos_y, global.point_array[ball_index])) {
                    return ball_index;
                }
            }
            return -1; 
        }

        //这里没有判断in_row，多判断了两次待后面优化
        if (in_column === -1) {
            let ball_index = 0;
            for (let i = 0; i < 5; i++) {
                ball_index = i * 5;
                if (this.checkIfNear(pos_x, pos_y, global.point_array[ball_index])) {
                    return ball_index;
                }
            }
            return -1;
        }

        let temp_table = [in_row * 5 + in_column, in_row * 5 + in_column + 1, (in_row + 1) * 5 + in_column, (in_row + 1) * 5 + in_column + 1];
        let ball_index = 0;
        for(let i = 0;i<4;i++){
            ball_index = temp_table[i];
            //let juli1 = Math.abs(global.point_array[ball_index].x - pos_x)
            //let juli2 = Math.abs(global.point_array[ball_index].y - pos_y)
            if(this.checkIfNear(pos_x,pos_y,global.point_array[ball_index])){
                return ball_index;
            }
        }
        return -1;
    },

    checkIfNear:function(pos_x,pos_y,point){
        let if_near = false;
        let v1 = cc.v2(parseInt(pos_x), parseInt(pos_y));
        let v2 = cc.v2(parseInt(point.x), parseInt(point.y));
        console.log('==============距离',v1,v2,cc.pDistance(v1, v2))
        if_near = cc.pDistance(v1, v2)<global.NEAR_DISTANCE ? true: false;
        return if_near;
    },

    checkIfACorrectBall:function(){
        return this.wrong_num === 0;
    },

    checkIfPassLevel:function(){
        let if_pass = false;

        let index_1 = -1;
        let index_2 = -1;
        let temp_array = false;
        let sort_func = function (a, b) {
            return a - b;
        }

        let had_got_balls_nums = [];

        console.log('=====================啊啊啊啊啊', this.current_line_had)

        for (let i = 0; i < this.current_line_had.length; i++) {
            if (!utils.checkIfUndefined(this.current_line_had[i])) {
                for(let j = 0;j<this.current_line_had[i].length;j++){
                    index_1 = i;
                    index_2 = this.current_line_had[i][j];
                    had_got_balls_nums[index_1] = true;
                    had_got_balls_nums[index_2] = true;
                    temp_array = utils.checkHowManyBallsBetweenTwoBalls(index_1, index_2);
                        
                    for(let k = 0;k<temp_array.length;k++){
                        had_got_balls_nums[temp_array[k]] = true;
                    }
                }
            }
        }

        //球数量不同，不通关
        if(this.target_balls_nums.length !== had_got_balls_nums.length){
            if_pass = false;
            console.log('=======================球数量不同，不通关', this.target_balls_nums, had_got_balls_nums)
            return if_pass;
        }

        //数量对了在进行线情况的比较

        let had_got_lines_transfer = [];
        for (let i = 0; i < this.current_line_had.length; i++) {
            if (!utils.checkIfUndefined(this.current_line_had[i])) {
                for (let j = 0; j < this.current_line_had[i].length; j++) {
                    index_1 = i
                    index_2 = this.current_line_had[i][j]
                    temp_array = utils.checkHowManyBallsBetweenTwoBalls(index_1, index_2);

                    if(utils.checkIfUndefined(had_got_lines_transfer[index_1])){
                        had_got_lines_transfer[index_1] = [];
                    }

                    //这边需要重点关注

                    if(temp_array.length === 0){
                        had_got_lines_transfer[index_1][index_2] = true;
                    }else{
                        had_got_lines_transfer[index_1][temp_array[0]] = true;

                        for (let k = 0; k < temp_array.length; k++) {
                            if(k!==temp_array.length-1){
                                if (utils.checkIfUndefined(had_got_lines_transfer[temp_array[k]])) {
                                    had_got_lines_transfer[temp_array[k]] = [];
                                }
                                had_got_lines_transfer[temp_array[k]][temp_array[k + 1]] = true;
                            }else{
                                if (utils.checkIfUndefined(had_got_lines_transfer[temp_array[temp_array.length - 1]])) {
                                    had_got_lines_transfer[temp_array[temp_array.length - 1]] = [];
                                }
                                had_got_lines_transfer[temp_array[temp_array.length - 1]][index_2] = true;
                            }
                        }
                    }
                }
            }
        }

        console.log('==================比较一下线', this.target_lines_transfer, had_got_lines_transfer)

        //比较线是否相同
        for(let i = 0;i<this.target_lines_transfer.length;i++){
            if (!utils.checkIfUndefined(this.target_lines_transfer[i])){
                if (utils.checkIfUndefined(had_got_lines_transfer[i])){
                    if_pass = false;
                    return if_pass;
                }else{
                    if(this.target_lines_transfer[i].length !== had_got_lines_transfer[i].length){
                        if_pass = false;
                        return if_pass;
                    }else{
                        for(let j = 0;j<this.target_lines_transfer.length;j++){
                            if(this.target_lines_transfer[i][j] === had_got_lines_transfer[i][j]){
                                if_pass = true;
                            }else{
                                if_pass = false;
                                return if_pass;
                            }
                        }
                    }
                }
            }
        }

        return if_pass;
    },

    //判断交点
    getCrossPoints:function(p,m){
        //a = cross_point 
        //p,m: 固定线，移动线
        //y = ax+b
        let a = -1;

        if(utils.checkIfUndefined(p)){
            return a;
        }

        if (p.opacity === 0) {
            return a;
        }

        if (m.opacity === 0) {
            return a;
        }

        //固定线两个点的索引
        let p_ball_1_index = p.getComponent('lad_mhy_line').getBallsIndex()[0];
        let p_ball_2_index = p.getComponent('lad_mhy_line').getBallsIndex()[1];
        
        //target点索引
        let m_ball_index = m.getComponent('lad_mhy_line').getBallsIndex()[0];

        let p_point1 = cc.p(global.point_array[p_ball_1_index].x, global.point_array[p_ball_1_index].y);
        let m_point1 = cc.p(global.point_array[m_ball_index].x, global.point_array[m_ball_index].y);
        let m_point2 = global.current_target_position;

        //移动线相交，或是另一条或是当前自己这条
        if(p_ball_2_index === -1){
            if(p_ball_1_index === m_ball_index){
                return a;
            }else{
                //p_point1,m_point1,m_point2共线
                if (utils.checkIfTreePointsOnOneLine(p_point1, m_point1, m_point2)) {
                    //共线并且在目标点同侧会产生交点
                    if(parseInt((m_point2.x - m_point1.x) * (p_point1.x - m_point1.x)) < 0 || parseInt((m_point2.y - m_point1.y) * (p_point1.y - m_point1.y)) < 0){
                        return [1, (p_point1.x + m_point1.x) / 2, (p_point1.y + m_point1.y) / 2];
                    }
                }
                return a;
            }
        }

        //只有固定线确定是固定线的时候才拥有第二个点
        let p_point2 = cc.p(global.point_array[p_ball_2_index].x, global.point_array[p_ball_2_index].y);
        let v1x = p_point2.x - p_point1.x;
        let v1y = p_point2.y - p_point1.y;
        let v2x = m_point2.x - m_point1.x;
        let v2y = m_point2.y - m_point1.y;
        let result_1 = v1x * v2y - v2x * v1y;

        //非移动线相交
        if (result_1 == 0){ //平行或共线
            //假如共线，则显示为当前固定两个球中间点
            //console.log('=============这是非移动线平行时候的情况',m_ball_index,p_ball_1_index,this.near_ball_index)
            if (m_ball_index === p_ball_1_index && this.near_ball_index !== -1 && utils.checkIfSameDirection(p_point1, m_point2, p_point2)) {
                return [1, (p_point1.x + p_point2.x) / 2, (p_point1.y + p_point2.y) / 2];
            } else if (m_ball_index === p_ball_2_index && this.near_ball_index !== -1 && utils.checkIfSameDirection(p_point2, m_point2, p_point1)) {
                return [1, (p_point1.x + p_point2.x) / 2, (p_point1.y + p_point2.y) / 2];
            }
            return a; // Collinear
        }

        let not_parallelism = result_1 > 0; 
        let v3x = p_point1.x - m_point1.x;
        let v3y = p_point1.y - m_point1.y;
        let result_2 = v1x * v3y - v1y * v3x;

        if ((result_2 < 0) == not_parallelism) //参数是大于等于0且小于等于1的，分子分母必须同号且分子小于等于分母
            return a; // No cross

        let result_3 = v2x * v3y - v2y * v3x;
        if ((result_3 < 0) == not_parallelism)
            return a; // No cross

        if (((result_2 > result_1) == not_parallelism) || ((result_3 > result_1) == not_parallelism))
            return a; // No cross

        // cross
        let t = result_3 / result_1;
        return [1, p_point1.x + (t * v1x), p_point1.y + (t * v1y)];
    },

    //判断当前坐标是否在已知点附近，如果已知点附近则忽略
    checkIfNotAroundBallPoints:function(position){
        let ball_pos_x = 0;
        let ball_pos_y = 0;
        let distance = 0;
        for(let i = 0;i<this.init_balls_nums.length;i++){
            ball_pos_x = this.init_balls_array[this.init_balls_nums[i]].x;
            ball_pos_y = this.init_balls_array[this.init_balls_nums[i]].y;
            distance = utils.getTwoPointsDistance(cc.p(position[1], position[2]), cc.p(ball_pos_x, ball_pos_y));
            if (position != -1 && parseInt(distance) < global.BASIC_BALL_RADIUS) {
                return false;
            }
        }
        return true;
    },

    addLine: function (min, max, if_random) {
        console.log('======================每次添加后1',min, max)
        let line_index = this.getLineNode();
        let line_node = this.lines_array[line_index];
        let start_ball = -1;
        let end_ball = -1;

         let start_index = parseInt(Math.random() * 2);
        if(utils.checkIfUndefined(if_random)){
            //以后添加动画用到的
            if (start_index === 1) {
                start_ball = this.init_balls_array[min];
                end_ball = this.init_balls_array[max];
            } else {
                start_ball = this.init_balls_array[max];
                end_ball = this.init_balls_array[min];
            }
        }else{
            start_ball = this.init_balls_array[min];
            end_ball = this.init_balls_array[max];
        }

        console.log('======================每次添加后2', this.current_line_had[min], min,max)

        this.setNormalLineInfo(line_node, start_ball, end_ball);
        line_node.getComponent('lad_mhy_line').setLineIndex(line_index, min, max);

        if (utils.checkIfUndefined(this.current_line_had[min])) {
            this.current_line_had[min] = [];
            this.current_line_had[min].push(max);
        } else {
            this.current_line_had[min].push(max);
        }

        return line_index;
    },

    addBall:function(ball_index){
        let index_had_create = utils.checkIfInArray(ball_index, this.init_balls_nums);
        if (!index_had_create) {
            let temp_node = this.getBallNodeByBallIndex(ball_index);
            temp_node.x = global.point_array[ball_index].x + 2;
            temp_node.y = global.point_array[ball_index].y + 3;
            this.init_balls_nums.push(ball_index);
        }
    },

    deleteBall:function(ball_index,if_need_action){
        //预留删除动画
        let index = -1;
        this.sendBallNodeToPool(ball_index);

        console.log('==============删除球之前',this.init_balls_nums)

        for (let i = 0; i < this.init_balls_nums.length; i++) {
            if (this.init_balls_nums[i] === ball_index) {
                index = i;
                break;
            }
        }

        if(index !== -1){
            this.init_balls_nums.splice(index, 1);
        }else{
            console.log('============没找到', ball_index)
        }
                console.log('==============删除球之后', this.init_balls_nums)
    },

    //删除完成线
    deleteCurrentLine: function (a, b, line_index) {
        let min = a>b?b:a;
        let max = a<b?b:a;
        console.log('===========================删除线之前',min,max,line_index,this.lines_array, this.current_line_had)
        if (utils.checkIfUndefined(this.current_line_had[min])) {
            return;
        } else {
            let index = 0;
            for(let i = 0;i<this.current_line_had[min].length;i++){
                if (this.current_line_had[min][i] === max){
                    index = i;
                    break;
                }
            }
            this.current_line_had[min].splice(index,1);
        }

        this.sendLineNodeToPool(this.lines_array[line_index]);
        this.lines_array[line_index] = undefined;
        console.log('===========================删除线之后',this.current_line_had)
    },

    setEndBallNode:function(ball_index){},

    initGLProgram:function(){
        this.program = new cc.GLProgram();

        if (cc.sys.isNative) {
            this.program.initWithString(global.FLUXAY_VERT, global.FLUXAY_FRAG);
        } else {
            this.program.initWithVertexShaderByteArray(Fluxay.FLUXAY_VERT, global.FLUXAY_FRAG);
            this.program.addAttribute(cc.macro.ATTRIBUTE_NAME_POSITION, cc.macro.VERTEX_ATTRIB_POSITION);
            this.program.addAttribute(cc.macro.ATTRIBUTE_NAME_COLOR, cc.macro.VERTEX_ATTRIB_COLOR);
            this.program.addAttribute(cc.macro.ATTRIBUTE_NAME_TEX_COORD, cc.macro.VERTEX_ATTRIB_TEX_COORDS);
        }
        this.program.link();
        this.program.updateUniforms();
        this.program.use();

        if (cc.sys.isNative) {
            var glProgram_state = cc.GLProgramState.getOrCreateWithGLProgram(this.program);
            glProgram_state.setUniformFloat("time", this.time);
        } else {
            let ba = this.program.getUniformLocationForName("time");
            this.program.setUniformLocationWith1f(ba, this.time);
        }
        this.setProgram(this.node.getComponent(cc.Sprite)._sgNode, this.program);
    },

    setProgram(node,program) {
        if (cc.sys.isNative) {
            var glProgram_state = cc.GLProgramState.getOrCreateWithGLProgram(program);
            node.setGLProgramState(glProgram_state);
        } else {
            node.setShaderProgram(program);
        }
    },

    //流光效果
    showFlush:function(){
       
        this.shaderNeedTime = 10;

       this.time = (Date.now() - this.startTime) / 1000;
       if (this.program) {
           this.program.use();
           if (cc.sys.isNative) {
               var glProgram_state = cc.GLProgramState.getOrCreateWithGLProgram(this.program);
               glProgram_state.setUniformFloat("time", this.time);
           } else {
               let ct = this.program.getUniformLocationForName("time");
               this.program.setUniformLocationWith1f(ct, this.time);
           }
       }
    },

    //查看内存是否泄漏
    checkXieTMDLou:function(){
        console.log('===============================,this.init_ball_array', this.init_balls_array, this.ball_storge_array.length,this.target_ball)
        console.log('===============================,this.ball_storge_array',this.ball_storge_array,this.ball_storge_array.length)
        console.log('===============================,this.line_storge_array', this.line_storge_array,this.line_storge_array.length)
        console.log('===============================,this.lines_array', this.lines_array,this.lines_array.length)
        console.log('===============================,this.target_lines', this.target_lines,this.target_lines.length)
    },

    //上一关
    toLastLevel:function(){
        global.current_level = global.current_level - 1;
        global.current_level < 1 ? global.current_level = 1:1;
        this.updateCurrentLadLevel();
        this.updateTargetLadLevel();
        this.record_array = [];
    },

    //下一关
    toNextLevel:function(){
        global.current_level = global.current_level+1;
        this.updateCurrentLadLevel();
        this.updateTargetLadLevel();
        this.record_array = [];
    },

    //反悔
    regretOperate:function(){
        //需要存的的东西：删掉的线，多出来的线，多出来的ball
        if(this.record_array.length === 0){
            console.log('================不存在反悔的步骤了')
            return;
        }

        let regret_array = this.record_array.pop();

        console.log('===================我现在是反悔操作',this.record_array,'====',regret_array)

        let deleted_lines = regret_array["deleted_lines"];
        let added_balls = regret_array["added_balls"];
        let added_lines = regret_array["added_lines"];

        console.log('======================aaaa', deleted_lines, added_balls, added_lines)

            //这边添加完线之后线要线上下动的动画
            //删了的要加上
        this.addLine(deleted_lines[0], deleted_lines[1]);

        for (let i = 0; i < added_balls.length; i++) {
            this.deleteBall(added_balls[i]);
        }

        for (let i = 0; i < added_lines.length; i++) {
            this.deleteCurrentLine(added_lines[i][0], added_lines[i][1], added_lines[i][2]);
        }
    },

    //重来
    retryOperate:function(){
        this.updateCurrentLadLevel();
        this.updateTargetLadLevel();
        this.record_array = [];
    },

    /////////////////////////////////////////对象池操作
    getBallNodeByBallIndex: function (ball_index) {
        let ball_node = this.init_balls_array[ball_index];
        if (utils.checkIfUndefined(ball_node)) {
            ball_node = this.getBallNodeFromPool();
            ball_node.parent = this.level_ball_layer;
            ball_node.scale = 1;
            this.init_balls_array[ball_index] = ball_node;
        }
        ball_node.getComponent('lad_mhy_ball').setBallColor(global.current_ball_color_index);
        ball_node.active = true;
        return this.init_balls_array[ball_index];
    },

    getLineNode: function () {
        let line_node;
        let line_index = -1;

        for (let i = 0; i < this.lines_array.length; i++) {
            if (utils.checkIfUndefined(this.lines_array[i])) {
                line_node = this.getLineNodeFromPool();
                line_node.parent = this.level_line_layer;
                line_index = i;
                line_node.getComponent('lad_mhy_line').initSelf();
                this.lines_array[i] = line_node;
                break;
            }
        }

        if (utils.checkIfUndefined(line_node)) {
            line_node = this.getLineNodeFromPool();
            this.lines_array.push(line_node);
            line_node.parent = this.level_line_layer;
            line_node.getComponent('lad_mhy_line').initSelf();
            line_index = this.lines_array.length - 1;
        }
        line_node.active = true;
        return line_index;
    },

    clearAllLineNode: function () {
        for (let i = 0; i < this.lines_array.length; i++) {
            if (!utils.checkIfUndefined(this.lines_array[i])) {
                this.sendLineNodeToPool(this.lines_array[i]);
                this.lines_array[i] = undefined;
            }
        }
    },

    getBallNodeFromPool: function () {
        if (this.ball_storge_array.length === 0) {
            this.ball_storge_array.push(cc.instantiate(this.ball_prefab));
            this.ball_storge_array.push(cc.instantiate(this.ball_prefab));
        }
        return this.ball_storge_array.pop();
    },

    sendLineNodeToPool: function (node) {
        node.active = false;
        this.line_storge_array.push(node);
    },

    sendBallNodeToPool: function (ball_index) {
        this.init_balls_array[ball_index].active = false;
        this.ball_storge_array.push(this.init_balls_array[ball_index]);
        this.init_balls_array[ball_index] = undefined;
    },

    getLineNodeFromPool: function () {
        if (this.line_storge_array.length === 0) {
            this.line_storge_array.push(cc.instantiate(this.line_prefab));
            this.line_storge_array.push(cc.instantiate(this.line_prefab));
        }
        return this.line_storge_array.pop();
    },

    /////////////////////////////////////////对象池操作
});
