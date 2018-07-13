var global = require("lad_mhy_global")
cc.Class({
    extends: cc.Component,

    properties: {
        line_prefab:cc.Prefab,
        line_prefab2:cc.Prefab,
        ball_prefab:cc.Prefab,
        wrong_prefab:cc.Prefab,

        ball_blue:cc.SpriteFrame,
        ball_red:cc.SpriteFrame,

        game_layer:cc.Node,
        target_layer:cc.Node,
        bg:cc.Node,
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

        this.current_line_had = [];
        this.target_line_had = [];

        global.setTargetBallPosition();
        this.updateCurrentLadLevel();
        this.updateTargetLadLevel();

        this.initWrongTags();
        global.initMoveBallAndLine();
    },

    update(dt) {
        //运行完了shader，直接跳过
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

    initVaribles:function(){
        this.selected_line_1 = -1;
        this.selected_line_2 = -1;
        this.target_ball = -1;
        this.near_ball_index = -1;
    },

    initGameOnEvents: function () {
        cc.game.on("lad_line_start", this.fingerStart, this);
        //this.bg.on(cc.Node.EventType.TOUCH_START, this.touchStart, this);
        this.bg.on(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
        this.bg.on(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
    },

    createBasicBalls: function () {
        this.offset_x = -240;
        this.offset_y = -425;
        this.basic_balls_array = [];
        for (let i = 0; i < global.BASIC_BALLS_COUNT; i++) {
            var ball_node = cc.instantiate(this.ball_prefab);
            ball_node.getChildByName('num').getComponent(cc.Label).string = i;
            ball_node.scale = 0.6;
            ball_node.parent = this.game_layer;
            ball_node.x = this.offset_x + (i % global.BASIC_WIDTH) * global.BALL_DISTANCE;
            ball_node.y = this.offset_y + Math.floor(i / global.BASIC_HEIGHT) * global.BALL_DISTANCE;
            this.basic_balls_array.push(ball_node);
        }
        global.BASIC_BALL_RADIUS = this.basic_balls_array[0].width*this.basic_balls_array[0].scale;
    },

    updateCurrentLadLevel: function () {
        this.setBallsAndLinesNotActive();
        //后面再去考虑优化,这边数组分配有点问题

        //关相关参数初始化
        this.current_line_had = [];
        this.init_balls_nums = [];

        //放置玩家球
        let ball_index_1 = 0;
        let ball_index_2 = 0;
        let ball_index_array = 0;
        let temp_ball_node = false;
        let index_1_had_create = false;
        let index_2_had_create = false;
        let max = -1;
        let min = -1;

        this.init_balls_config = global.makeStrToArray(global.getInitConfigByLevel(global.current_level), ",");
        for (let i = 0; i < this.init_balls_config.length; i++) {
            ball_index_array = global.makeStrToArray(this.init_balls_config[i], "_");
            ball_index_1 = ball_index_array[0] - 0;
            ball_index_2 = ball_index_array[1] - 0;
            index_1_had_create = global.checkIfInArray(ball_index_1, this.init_balls_nums);
            index_2_had_create = global.checkIfInArray(ball_index_2, this.init_balls_nums);

            if (!index_1_had_create) {
                temp_ball_node = this.getBallNodeByBallIndex(ball_index_1);
                temp_ball_node.x = this.basic_balls_array[ball_index_1].x + 2;
                temp_ball_node.y = this.basic_balls_array[ball_index_1].y + 3;
                this.init_balls_nums.push(ball_index_1);
            }

            if (!index_2_had_create) {
                temp_ball_node = this.getBallNodeByBallIndex(ball_index_2);
                temp_ball_node.x = this.basic_balls_array[ball_index_2].x + 2;
                temp_ball_node.y = this.basic_balls_array[ball_index_2].y + 3;
                this.init_balls_nums.push(ball_index_2);
            }

            max = (ball_index_1 > ball_index_2) ? ball_index_1 : ball_index_2;
            min = (ball_index_1 > ball_index_2) ? ball_index_2 : ball_index_1;

            if(max === -1)console.log('========出现问题');

            //todo
            this.addCurrentLine(min,max);
        }

        //console.log('==========初始化后的线都有哪些',this.current_line_had);

        //放置初始线，可能以后要加动画
        let line_index = 0;
        let line_node = 0;
        let start_index = 1;
        let start_ball = 0;
        let end_ball = 0;

        for (let i = 0; i < this.init_balls_config.length; i++) {
            ball_index_array = global.makeStrToArray(this.init_balls_config[i], "_");
            ball_index_1 = ball_index_array[0] - 0;
            ball_index_2 = ball_index_array[1] - 0;

            line_index = this.getLineNode();
            line_node = this.lines_array[line_index];
            start_index = parseInt(Math.random() * 2);

            //console.log('==============这类事分配的line——index',line_index,this.lines_array)

            if (start_index === 1) {
                start_ball = this.init_balls_array[ball_index_1];
                end_ball = this.init_balls_array[ball_index_2];
            } else {
                start_ball = this.init_balls_array[ball_index_2];
                end_ball = this.init_balls_array[ball_index_1];
            }

            this.setLineInfo(line_node, start_ball, end_ball);
            line_node.getComponent('lad_mhy_line').setLineIndex(line_index, ball_index_1, ball_index_2);
        }
    },

    updateTargetLadLevel:function(){
        this.target_balls_nums = [];
        this.target_line_had = [];
        
        this.target_ball_config = global.makeStrToArray(global.getTargetConfigByLevel(global.current_level), ",");

        let index_1 = 0;
        let index_2 = 0;
        let index_array = 0;
        let max = 0;
        let min = 0;

        for(let i = 0;i<this.target_lines.length;i++){
            global.checkIfUndefined(this.target_lines[i]) ? 1 : this.target_lines[i].active = false;
        }

        for (let i = 0; i < this.target_ball_config.length; i++) {
            index_array = global.makeStrToArray(this.target_ball_config[i], "_");
            index_1 = index_array[0] - 0;
            index_2 = index_array[1] - 0;

            if (!global.checkIfInArray(index_1, this.target_balls_nums)) {
                this.target_balls_nums.push(index_1);
            }

            if (!global.checkIfInArray(index_2, this.target_balls_nums)) {
                this.target_balls_nums.push(index_2);
            }

            //画线
            max = (index_1 > index_2) ? index_1 : index_2;
            min = (index_1 > index_2) ? index_2 : index_1;

            if (global.checkIfUndefined(this.target_line_had[min])){
                this.target_line_had[min] = [];
                this.target_line_had[min].push(max);
            }else{
                this.target_line_had[min].push(max);
            }

            this.drawTargetLine(index_1,index_2,i);
        }

        //console.log('===================我当前的确定了的',this.target_line_had)
    },

    drawTargetLine:function(index_1,index_2,i){
        if (global.checkIfUndefined(this.target_lines[i])){
            this.target_lines[i] = cc.instantiate(this.line_prefab2);
            this.target_lines[i].parent = this.target_layer;
        }
        //设定位置
        let point_pos1 = cc.p(global.target_ball_position[2 * index_1], global.target_ball_position[2 * index_1+1]);
        let point_pos2 = cc.p(global.target_ball_position[2 * index_2], global.target_ball_position[2 * index_2 + 1]);

        this.target_lines[i].x = point_pos1.x;
        this.target_lines[i].y = point_pos1.y;

        this.target_lines[i].rotation = global.getTwoPointsRotation(point_pos1, point_pos2);
        this.target_lines[i].scaleY = (global.getTwoPointsDistance(point_pos1, point_pos2) / this.target_lines[i].height);
        this.target_lines[i].active = true;
    },

    setBallsAndLinesNotActive:function(){
        let ball_node;
        for (let i = 0; i < global.BASIC_BALLS_COUNT; i++) {
            ball_node = this.init_balls_array[i];
            global.checkIfUndefined(ball_node) ? 1: this.init_balls_array[i].active = false;
        }

        this.clearAllLineNode();
    },

    initWrongTags: function () {
        //可能直接提前准备四个左右的错号标记
        this.wrong_tags_array = [];
    },

    getBallNodeByBallIndex: function (ball_index) {
        let ball_node = this.init_balls_array[ball_index];
        if(global.checkIfUndefined(ball_node)){
            //console.log('==================这里记录了我创建的次数')
            ball_node = cc.instantiate(this.ball_prefab);
            ball_node.parent = this.game_layer;
            ball_node.getComponent(cc.Sprite).SpriteFrame = this.ball_red;
            this.init_balls_array[ball_index] = ball_node;
        }
        ball_node.active = true;
        return this.init_balls_array[ball_index];
    },

    //设计如此原因待解释
    getLineNode:function(){
        let line_node;
        let line_index = -1;

        for(let i = 0;i<this.lines_array.length;i++){
            if (global.checkIfUndefined(this.lines_array[i])){
                line_node = this.getLineNodeFromPool();
                line_node.parent = this.game_layer;
                line_index = i;
                this.lines_array[i] = line_node;
                break;
            }
        }

        if (global.checkIfUndefined(line_node)) {
            line_node = this.getLineNodeFromPool();
            this.lines_array.push(line_node);
            line_node.parent = this.game_layer;
            line_index = this.lines_array.length-1;
        }
        line_node.active = true;
        return line_index;
    },

    getLineNodeFromPool:function(){
        if(this.line_storge_array.length===0){
            this.line_storge_array.push(cc.instantiate(this.line_prefab));
            this.line_storge_array.push(cc.instantiate(this.line_prefab));
        }
        return this.line_storge_array.pop();
    },

    clearAllLineNode:function(){
        for (let i = 0; i < this.lines_array.length; i++) {
            if (!global.checkIfUndefined(this.lines_array[i])) {
                this.sendLineNodeToPool(this.lines_array[i]);
                this.lines_array[i] = undefined;
            }
        }
    },

    sendLineNodeToPool:function(node){
        //console.log('==============回收了node',node)
        node.active = false;
        this.line_storge_array.push(node);
    },

    getBallNodeFromPool: function () {
        if (this.ball_storge_array.length === 0) {
            this.ball_storge_array.push(cc.instantiate(this.ball_prefab));
            this.ball_storge_array.push(cc.instantiate(this.ball_prefab));
        }
        return this.ball_storge_array.pop();
    },

    sendBallNodeToPool: function (node) {
        node.active = false;
        node.removeFromParent();
        this.ball_storge_array.push(node);
    },

    onDestroy:function(){
        cc.game.off("lad_line_start", this.fingerStart, this);
        
        //this.bg.off(cc.Node.EventType.TOUCH_MOVE, this.touchStart, this);
        this.bg.off(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
        this.bg.off(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
    },

    addLines:function(){
        //console.log('================',this.selected_line_1,this.selected_line_2)

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
        this.setLineInfo(this.selected_line_1, global.current_move_ball_1, global.current_move_ball_index_1, true, global.current_target_position,global.current_selected_line_index_1);
        this.setLineInfo(this.selected_line_2, global.current_move_ball_2, global.current_move_ball_index_2, true, global.current_target_position,global.current_selected_line_index_2);
        //console.log('=============添加了line', global.current_selected_line_index_1, global.current_selected_line_index_2, this.selected_line_1, this.selected_line_2)
    },

    addBalls:function(){
        let pos_x = global.current_target_position.x;
        let pos_y = global.current_target_position.y;
        if (this.target_ball === -1) {
            this.target_ball = this.getBallNodeFromPool();
            this.target_ball.scale = 0.6;
            this.target_ball.parent = this.game_layer;
        }
        this.target_ball.active = true;
        this.target_ball.x = pos_x;
        this.target_ball.y = pos_y;
    },

    //param预留用，只有在两条动态线中才会使用，后面优化这个函数使其美观点
    setLineInfo: function (line_node, ball_1, ball_2_or_ball_1_index, if_position, target_pos,param) {
        line_node.x = ball_1.x;
        line_node.y = ball_1.y;

        if (if_position) {
            line_node.rotation = global.getTwoPointsRotation(ball_1.getPosition(), target_pos);
            line_node.scaleY = (global.getTwoPointsDistance(ball_1.getPosition(), target_pos) / line_node.height);
            line_node.getComponent('lad_mhy_line').setLineIndex(param, ball_2_or_ball_1_index, -1);
        } else {
            line_node.rotation = global.getTwoPointsRotation(ball_1.getPosition(), ball_2_or_ball_1_index.getPosition());
            line_node.scaleY = (global.getTwoPointsDistance(ball_1.getPosition(), ball_2_or_ball_1_index.getPosition()) / line_node.height);
        }
    },

    fingerStart: function () {
        this.addLines();
        this.addBalls();
    },

    touchStart: function (event, touch) {
        if (event.getTouches().length > 1) {
            return;
        }
    },

    touchMove:function(event,touch){
        if (event.getTouches().length > 1) {
            return;
        }

        if (global.current_move_ball_1 === -1 || global.current_move_ball_2 === -1){
            console.log('==================这明显出了问题啊')
            return;
        }  

        let position = this.node.convertToNodeSpaceAR(event.getLocation());
        this.near_ball_index = this.checkIfNearOtherNodes(position.x,position.y);
        let pos_x = 0;
        let pos_y = 0;

        if(this.near_ball_index === -1){
            pos_x = position.x;
            pos_y = position.y;
        }else{
            pos_x = this.basic_balls_array[this.near_ball_index].x;
            pos_y = this.basic_balls_array[this.near_ball_index].y;
        }

        this.target_ball.x = pos_x;
        this.target_ball.y = pos_y;
        global.current_target_position = cc.p(pos_x, pos_y);

        //这里面其实只是需要到了位置的设置
        this.setLineInfo(this.selected_line_1, global.current_move_ball_1, global.current_move_ball_index_1, true, global.current_target_position,global.current_selected_line_index_1);
        this.setLineInfo(this.selected_line_2, global.current_move_ball_2, global.current_move_ball_index_2, true, global.current_target_position, global.current_selected_line_index_2);

        //显示交集线是否有x号
        //计算wrong_num
        let a = 0;
        this.wrong_num = 0;

        //判断其他线和当前两条移动线的交点
        for (let i = 0;i < this.lines_array.length;i++){
            a = this.getCrossPoints(this.lines_array[i], this.selected_line_1);
            if (a!= -1 && this.checkIfNotAroundBallPoints(a)) {
                let wrong_temp = this.wrong_tags_array[this.wrong_num];

                if(global.checkIfUndefined(wrong_temp)){
                    wrong_temp = cc.instantiate(this.wrong_prefab);
                    wrong_temp.parent = this.game_layer;
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
                if (global.checkIfUndefined(wrong_temp)) {
                    wrong_temp = cc.instantiate(this.wrong_prefab);
                    wrong_temp.parent = this.game_layer;
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
        if (event.getTouches().length > 1) {
            return;
        }

        if (global.current_move_ball_1 === -1 || global.current_move_ball_2 === -1) return;

        //current_move_ball_1这个标记其实是用来标记是否移动了线，只有移动了线
        if (global.current_move_ball_1 !== -1 || global.current_move_ball_2 !== -1) {
            global.current_move_ball_1 = -1;
            global.current_move_ball_2 = -1;
        }

        for (let index = 0; index < this.wrong_tags_array.length; index++) {
            this.wrong_tags_array[index].active = false;
        }

        //没有到基础求所在的位置，则弹回回到初始状态
        if(this.near_ball_index === -1){
            this.lines_array[global.current_move_line_index].getComponent('lad_mhy_line').resetSelf();
            this.target_ball.active = false;
            this.recycleSelectedLine();
            this.initMoveStatusParams();
            return;
        }

        if (this.checkIfACorrectBall()) {
            //注意这里有个问题，如果连线中间有n个可分割球，则最后得到的线的数量会是多一条的，因为被分割多了一条线
            //比较推荐直接采用分割多一条线的方法去做
            //暂时不实现这个功能，待之后添加，可以再错号那里判断出来，这个线是否被别的点所割开

            //消除当前line
            let max = this.lines_array[global.current_move_line_index].getComponent('lad_mhy_line').getBallsIndex()[0];
            let min = this.lines_array[global.current_move_line_index].getComponent('lad_mhy_line').getBallsIndex()[1];
            this.deleteCurrentLine(min, max);

            //正确位置，注意如果正确位置连线中有其他已经存在的球，那么这个球，是能延伸出两个线的
            if (global.checkIfInArray(this.near_ball_index, this.init_balls_nums)){
                this.target_ball.active = false;
            }else{
                this.init_balls_nums.push(this.near_ball_index);
                if (global.checkIfUndefined(this.init_balls_array[this.near_ball_index])){
                    this.init_balls_array[this.near_ball_index] = this.target_ball;
                }else{
                    //回收这个this.target_ball
                    this.sendBallNodeToPool(this.target_ball);
                }
            }

            //这边有一个，多产生一条线的判断，暂时未处理
            this.setSelectedLineToNormalLine(this.selected_line_1, this.near_ball_index);
            this.setSelectedLineToNormalLine(this.selected_line_2, this.near_ball_index);

            //暂时不隐藏
            //this.lines_array[global.current_move_line_index].active = false;

            console.log('==============暂时隐藏啊啊啊啊', this.lines_array, global.current_move_line_index)
            this.sendLineNodeToPool(this.lines_array[global.current_move_line_index]);
            this.lines_array[global.current_move_line_index] = undefined;
            this.initMoveStatusParams();
        }else{
            //错误位置
            //回弹效果，暂时未添加
            this.target_ball.active = false;
            this.lines_array[global.current_move_line_index].getComponent('lad_mhy_line').resetSelf();
            this.recycleSelectedLine();
            this.initMoveStatusParams();
            return;
        }

        console.log('==========放置正确后你猜猜', this.lines_array);

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
    },

    setSelectedLineToNormalLine:function(line_node,ball_index){
        let line_index = line_node.getComponent('lad_mhy_line').getLineIndex();
        let ball_index_1 = line_node.getComponent('lad_mhy_line').getBallsIndex()[0];
        let ball_index_2 = ball_index;
        let max = (ball_index_1 > ball_index_2) ? ball_index_1 : ball_index_2;
        let min = (ball_index_1 > ball_index_2) ? ball_index_2 : ball_index_1;

        if(max === -1)console.log('==========出现问题');
        //下面代码以后有空

        this.addCurrentLine(min,max);
        line_node.getComponent('lad_mhy_line').setLineIndex(line_index,max,min);
    },

    initMoveStatusParams:function(){
        this.target_ball = -1;
        this.wrong_num = 0;
        this.near_ball_index = -1;
        this.selected_line_1 = -1;
        this.selected_line_2 = -1;
        global.initMoveBallAndLine();
    },

    recycleSelectedLine:function(){
        console.log('=============不该啊啊',this.selected_line_1,this.selected_line_2)

        this.selected_line_1.active = false;
        this.selected_line_2.active = false;

        this.sendLineNodeToPool(this.selected_line_1);
        this.sendLineNodeToPool(this.selected_line_2);
        this.lines_array[global.current_selected_line_index_1] = undefined;
        this.lines_array[global.current_selected_line_index_2] = undefined;
    },

    checkIfNearOtherNodes:function(pos_x,pos_y){
        let in_row = -1;
        let in_column = -1;

        //防止小数太多计算太多，以后可能会删掉此代码
        pos_x = parseInt(pos_x);
        pos_y = parseInt(pos_y);

        for(let i = 0;i<5;i++){
            pos_y > this.basic_balls_array[i * 5].y ? in_row = i : 1 ;
            pos_x > this.basic_balls_array[i].x ? in_column = i: 1;
        }

        if (in_row === -1 && in_column === -1) {
            if (this.checkIfNear(pos_x, pos_y, this.basic_balls_array[0])) {
                return 0;
            }
            return -1;
        }

        if(in_row === 4 && in_column === 4){
            if (this.checkIfNear(pos_x, pos_y, this.basic_balls_array[24])) {
                return 24;
            }
            return -1;
        }

        //这里没有判断in_column，多判断了两次待后面优化
        if(in_row === 4){
            let ball_index = 0;
            for(let i =0;i<2;i++){
                ball_index = i + 20;
                if (this.checkIfNear(pos_x, pos_y, this.basic_balls_array[ball_index])) {
                    return ball_index;
                }
            }
            return -1;
        }

        //这里没有判断in_row，多判断了两次待后面优化
        if(in_column === 4){
            let ball_index = 0;            
            for (let i = 0; i < 4; i++) {
                ball_index = (i+1)*5-1;
                if (this.checkIfNear(pos_x, pos_y, this.basic_balls_array[ball_index])) {
                    return ball_index;
                }
            }
            return -1;
        }

        //这里没有判断in_column，多判断了两次待后面优化
        if (in_row === -1) {
            let ball_index = 0;
            for (let i = 0; i < 4; i++) {
                ball_index = i + in_column;
                if (this.checkIfNear(pos_x, pos_y, this.basic_balls_array[ball_index])) {
                    return ball_index;
                }
            }
            return -1; 
        }

        //这里没有判断in_row，多判断了两次待后面优化
        if (in_column === -1) {
            let ball_index = 0;
            for (let i = 0; i < 2; i++) {
                ball_index = i * 5;
                if (this.checkIfNear(pos_x, pos_y, this.basic_balls_array[ball_index])) {
                    return ball_index;
                }
            }
            return -1;
        }

        let temp_table = [in_row * 5 + in_column, in_row * 5 + in_column + 1, (in_row + 1) * 5 + in_column, (in_row + 1) * 5 + in_column + 1];
        let ball_index = 0;
        for(let i = 0;i<4;i++){
            ball_index = temp_table[i];
            let juli1 = Math.abs(this.basic_balls_array[ball_index].x - pos_x)
            let juli2 = Math.abs(this.basic_balls_array[ball_index].y - pos_y)
            if(this.checkIfNear(pos_x,pos_y,this.basic_balls_array[ball_index])){
                return ball_index;
            }
        }
        return -1;
    },

    checkIfNear:function(pos_x,pos_y,point){
        let if_near = false;
        if ((Math.abs(pos_x - point.x) < global.NEAR_DISTANCE) && (Math.abs(pos_y - point.y) < global.NEAR_DISTANCE)){if_near = true}
        return if_near;
    },

    checkIfACorrectBall:function(){
        return this.wrong_num === 0;
    },

    checkIfPassLevel:function(){
        return false;

        let if_pass = false;
        let sort_func = function (a, b) {
            return a - b;
        }

        //判断球的数量是否相等，除了球的数量，还有就是线的数量是否相同，其实主要是判断线的数量和相应位置
        console.log('====================判断比较',this.init_balls_nums,this.target_balls_nums)


        if (this.init_balls_nums.length === this.target_balls_nums.length) {
            this.init_balls_nums.sort(sort_func);
            this.target_balls_nums.sort(sort_func);

            console.log('================输出判断',this.init_balls_nums,this.target_balls_nums)


            for(let i = 0;i<this.init_balls_nums.length;i++){
                if(this.init_balls_nums[i] === this.target_balls_nums[i]){
                    if_pass = true;
                }else{
                    if_pass = false;
                    break;
                }
            }

            for(let i = 0;i<this.target_line_had.length;i++){
                if (!global.checkIfUndefined(this.target_line_had[i])) {
                    if (global.checkIfUndefined(this.current_line_had[i])){
                        if_pass = false;
                        break;
                    }else{
                        console.log('==========================来，比较一下',i, this.target_line_had[i], this.current_line_had[i])
                        if(this.target_line_had[i].length === this.current_line_had[i].length){
                            this.current_line_had[i].sort(sort_func);
                            this.target_line_had[i].sort(sort_func);
                            console.log('================排序完毕',this.current_line_had[i],this.target_line_had[i])

                            for (let j = 0; j < this.target_line_had[i].length;j++){
                                console.log('===============深层比较', this.target_line_had[i][j], this.current_line_had[i][j])
                                if (this.target_line_had[i][j] === this.current_line_had[i][j]){
                                    if_pass = true;
                                }else{
                                    if_pass = false;
                                    break;
                                }
                            }
                        }else{
                            if_pass = false;
                            break;
                        }

                    }
                }
            }
            console.log('==============',this.target_line_had,this.current_line_had)
        }

        return if_pass;
    },

    //判断交点
    getCrossPoints:function(p,m){
        //a = cross_point
        //p,m: 固定线，移动线
        //y = ax+b

        let a = -1;

        let p_ball_1_index = p.getComponent('lad_mhy_line').getBallsIndex()[0];
        let p_ball_2_index = p.getComponent('lad_mhy_line').getBallsIndex()[1];
        let m_ball_index = m.getComponent('lad_mhy_line').getBallsIndex()[0];

        //遇到自己这条线或者另一条移动线，则直接跳过
        if(p_ball_2_index === -1)return a;

        let p_point1 = cc.p(this.basic_balls_array[p_ball_1_index].x, this.basic_balls_array[p_ball_1_index].y);
        let p_point2 = cc.p(this.basic_balls_array[p_ball_2_index].x, this.basic_balls_array[p_ball_2_index].y);

        let m_point1 = cc.p(this.basic_balls_array[m_ball_index].x, this.basic_balls_array[m_ball_index].y);
        let m_point2 = global.current_target_position;

        let v1x = p_point2.x - p_point1.x;
        let v1y = p_point2.y - p_point1.y;
        
        let v2x = m_point2.x - m_point1.x;
        let v2y = m_point2.y - m_point1.y;

        let result_1 = v1x * v2y - v2x * v1y;

        if (result_1 == 0){ //平行或共线
            //假如共线，则显示为当前固定两个球中间点
            if(m_ball_index === p_ball_1_index && this.near_ball_index !== -1){
                //return [1, (p_point1.x + p_point2.x) / 2, (p_point1.y + p_point2.y) / 2];
            } else if (m_ball_index === p_ball_2_index && this.near_ball_index !== -1) {
                //return [1, (p_point1.x + p_point2.x) / 2, (p_point1.y + p_point2.y) / 2];
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
        //console.log('===================开始判断是否在已知点附近')
        let ball_pos_x = 0;
        let ball_pos_y = 0;
        let distance = 0;
        for(let i = 0;i<this.init_balls_nums.length;i++){
            ball_pos_x = this.init_balls_array[this.init_balls_nums[i]].x;
            ball_pos_y = this.init_balls_array[this.init_balls_nums[i]].y;
            //console.log('====================这里是对应', this.init_balls_array[this.init_balls_nums[i]].x, this.init_balls_array[this.init_balls_nums[i]].y, position)
            distance = global.getTwoPointsDistance(cc.p(position[1], position[2]), cc.p(ball_pos_x, ball_pos_y));
            if (position != -1 && parseInt(distance) < global.BASIC_BALL_RADIUS) {
                return false;
            }
        }
        return true;
    },

    //添加完成线
    addCurrentLine: function (min, max) {
        if (global.checkIfUndefined(this.current_line_had[min])) {
            this.current_line_had[min] = [];
            this.current_line_had[min].push(max);
        } else {
            this.current_line_had[min].push(max);
        }
    },

    //删除完成线
    deleteCurrentLine: function (min, max) {
        if (global.checkIfUndefined(this.current_line_had[min])) {
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
        console.log('===============================,this.ball_storge_array',this.ball_storge_array,this.ball_storge_array.length)
        console.log('===============================,this.line_storge_array', this.line_storge_array,this.line_storge_array.length)
        console.log('===============================,this.lines_array', this.lines_array,this.lines_array.length)
        console.log('===============================,this.target_lines', this.target_lines,this.target_lines.length)
    },

    //下一关
    toNextLevel:function(){
        global.current_level = global.current_level+1;
        this.updateCurrentLadLevel();
        this.updateTargetLadLevel();
    },
});
