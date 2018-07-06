var global = require("lad_mhy_global")
cc.Class({
    extends: cc.Component,

    properties: {
        line_prefab:cc.Prefab,
        ball_prefab:cc.Prefab,
        wrong_prefab:cc.Prefab,

        ball_blue:cc.SpriteFrame,
        ball_red:cc.SpriteFrame,

        ball_layer:cc.Node,
        bg:cc.Node,
    },

    onLoad: function () {
        this.initGameOnEvents();
        this.initVaribles();
        this.createBasicBalls();
    },

    start:function(){
        this.offset_x = -240;
        this.offset_y = -425;
        this.time = 0;

        global.initMoveBallAndLine();
        this.setLadLevel();
        this.initWrongTags();
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
    },

    setLadLevel: function () {
        this.setBallsAndLinesNotActive();
        //后面再去考虑优化,这边数组分配有点问题
        let init_ball_config = global.makeStrToArray(global.getInitConfigByLevel(global.current_level), ",");
        this.init_balls_array = [];
        this.init_balls_nums = [];

        //放置玩家球
        let ball_index_1 = 0;
        let ball_index_2 = 0;
        let ball_index_array = 0;
        let temp_ball_node = false;
        let index_1_had_create = false;
        let index_2_had_create = false;

        for (let i = 0; i < init_ball_config.length; i++) {
            ball_index_array = global.makeStrToArray(init_ball_config[i], "_");
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
        }

        //放置初始线
        let line_index = 0;
        let line_node = 0;
        let start_index = 1;
        let start_ball = 0;
        let end_ball = 0;

        for (let i = 0; i < init_ball_config.length; i++) {
            line_index = i;
            ball_index_array = global.makeStrToArray(init_ball_config[i], "_");
            ball_index_1 = ball_index_array[0] - 0;
            ball_index_2 = ball_index_array[1] - 0;

            line_node = this.getLineNodeByLineIndex(line_index);
            start_index = parseInt(Math.random() * 2);

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

    setBallsAndLinesNotActive:function(){
        for (let i = 0; i < global.BASIC_BALLS_COUNT; i++) {
            (typeof (ball_node) == "undefined") ? 1: this.init_balls_array[i].active = false;
        }

        for(let i=0;i<this.lines_array.length;i++){
            this.lines_array[i].active = false;
        }
    },

    getBallNodeByBallIndex:function(ball_index){
        let ball_node = this.init_balls_array[ball_index];
        if (typeof (ball_node) == "undefined") {
            ball_node = cc.instantiate(this.ball_prefab);
            ball_node.parent = this.ball_layer;
            ball_node.getComponent(cc.Sprite).SpriteFrame = this.ball_red;
            this.init_balls_array[ball_index] = ball_node;
        }
        ball_node.active = true;
        return this.init_balls_array[ball_index];
    },

    getLineNodeByLineIndex:function(line_index){
        let line_node = this.lines_array[line_index];
        if(typeof(line_node) == "undefined"){
            line_node = cc.instantiate(this.line_prefab);
            line_node.parent = this.ball_layer; //以后看看是不是弄个新层级
            this.lines_array[line_index] = line_node;
        }
        line_node.active = true;
        return this.lines_array[line_index];
    },

    initWrongTags:function(){
        //可能直接提前准备四个左右的错号标记
        this.wrong_tags_array = [];
    },

    initGameOnEvents: function () {
        cc.game.on("lad_line_start", this.fingerStart, this);

        this.bg.on(cc.Node.EventType.TOUCH_START, this.touchStart, this);
        this.bg.on(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
        this.bg.on(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
    },

    onDestroy:function(){
        cc.game.off("lad_line_start", this.fingerStart, this);
        
        this.bg.off(cc.Node.EventType.TOUCH_MOVE, this.touchStart, this);
        this.bg.off(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
        this.bg.off(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
    },

    createBasicBalls:function(){
        this.basic_balls_array = [];
        for (let i = 0; i < global.BASIC_BALLS_COUNT; i++) {
            var ball_node = cc.instantiate(this.ball_prefab);
            ball_node.getChildByName('num').getComponent(cc.Label).string = i;
            ball_node.scale = 0.6;
            ball_node.parent = this.ball_layer;
            ball_node.x = this.offset_x + (i % global.BASIC_WIDTH) * global.BALL_DISTANCE;
            ball_node.y = this.offset_y + Math.floor(i / global.BASIC_HEIGHT) * global.BALL_DISTANCE;
            this.basic_balls_array.push(ball_node);
        }
    },

    addLines:function(){
        if (this.selected_line_1 === -1) {
            this.selected_line_1 = cc.instantiate(this.line_prefab);
            this.selected_line_1.parent = this.ball_layer;
        }

        if (this.selected_line_2 === -1) {
            this.selected_line_2 = cc.instantiate(this.line_prefab);
            this.selected_line_2.parent = this.ball_layer;
        }

        this.selected_line_1.active = true;
        this.selected_line_2.active = true;

        global.current_move_ball_1 = this.init_balls_array[global.current_move_ball_index_1];
        global.current_move_ball_2 = this.init_balls_array[global.current_move_ball_index_2];

        this.setLineInfo(this.selected_line_1, global.current_move_ball_1,1, true, global.current_target_position);
        this.setLineInfo(this.selected_line_2, global.current_move_ball_2,1, true, global.current_target_position);
    },

    addBalls:function(){
        let pos_x = global.current_target_position.x;
        let pos_y = global.current_target_position.y;
        if (this.target_ball === -1) {
            this.target_ball = cc.instantiate(this.ball_prefab);
            this.target_ball.scale = 0.6;
            this.target_ball.parent = this.ball_layer;
        }
        this.target_ball.active = true;
        this.target_ball.x = pos_x;
        this.target_ball.y = pos_y;
    },

    setLineInfo: function (line_node, ball_1, ball_2_or_ball_1_index, if_position, target_pos) {
        line_node.x = ball_1.x;
        line_node.y = ball_1.y;

        if (if_position) {
            line_node.rotation = global.getTwoPointsRotation(ball_1.getPosition(), target_pos);
            line_node.scaleY = (global.getTwoPointsDistance(ball_1.getPosition(), target_pos) / line_node.height);
            line_node.getComponent('lad_mhy_line').setLineIndex(-1, ball_2_or_ball_1_index, -1);
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

        if (global.current_move_ball_1 === -1 || global.current_move_ball_2 === -1)return;

        let position = this.node.convertToNodeSpaceAR(event.getLocation());
        let pos_x = 0;
        let pos_y = 0;
        //根据移动点创建新的node,line
        //后期添加一个接近点判断
        let near_ball_index = this.checkIfNearOtherNodes(position.x,position.y);

        if(near_ball_index === -1){
            pos_x = position.x;
            pos_y = position.y;
        }else{
            pos_x = this.basic_balls_array[near_ball_index].x;
            pos_y = this.basic_balls_array[near_ball_index].y;
        }

        this.target_ball.x = pos_x;
        this.target_ball.y = pos_y;
        global.current_target_position = cc.p(pos_x, pos_y);
        this.setLineInfo(this.selected_line_1, global.current_move_ball_1, global.current_move_ball_index_1, true, global.current_target_position);
        this.setLineInfo(this.selected_line_2, global.current_move_ball_2, global.current_move_ball_index_2, true, global.current_target_position);

        //显示交集线是否有x号
        //计算wrong_num
        let a = 0;
        this.wrong_num = 0;

        for (let i = 0;i < this.lines_array.length;i++){
            a = this.getCrossPoints(this.lines_array[i], this.selected_line_1);

            console.log('=======================第一个线判断',a)

            if(a[0]!=-1){
                let wrong_temp = this.wrong_tags_array[this.wrong_num];

                if (typeof (wrong_temp) == "undefined") {
                    wrong_temp = cc.instantiate(this.wrong_prefab);
                    wrong_temp.parent = this.ball_layer;
                    this.wrong_tags_array.push(wrong_temp);
                }

                wrong_temp.active = true;
                wrong_temp.x = a[1];
                wrong_temp.y = a[2];
                this.wrong_num++;
            }
            
            a = this.getCrossPoints(this.lines_array[i], this.selected_line_2);

            console.log('=========================第二个线判断',a)

            if (a[0]!= -1){
                let wrong_temp = this.wrong_tags_array[this.wrong_num];
                if (typeof (wrong_temp) == "undefined") {
                    wrong_temp = cc.instantiate(this.wrong_prefab);
                    wrong_temp.parent = this.ball_layer;
                    this.wrong_tags_array.push(wrong_temp);
                }
                wrong_temp.active = true;
                wrong_temp.x = a[1];
                wrong_temp.y = a[2];
                this.wrong_num++;
            }
        }

        if (this.wrong_num < this.wrong_tags_array.length){
            for(let i = this.wrong_num-1;i<this.wrong_tags_array.lenght;i++){
                this.wrong_tags_array[i].active = false;
            }
        }
    },

    touchEnd:function(event){
        if (event.getTouches().length > 1) {
            return;
        }
        if (global.current_move_ball_1 === -1 || global.current_move_ball_2 === -1) return;


        if (global.current_move_ball_1 !== -1 || global.current_move_ball_2 !== -1) {
            global.current_move_ball_1 = -1;
            global.current_move_ball_2 = -1;
        }


        for (let index = 0; index < this.wrong_tags_array.length; index++) {
            this.wrong_tags_array[index].active = false;
        }

        console.log('===================this.wrong_num', this.wrong_num);

        if (this.checkIfACorrectBall()) {
            //正确位置
            //原来那根线记得干掉
            this.init_balls_array.push(this.target_ball);
            this.lines_array.push(this.selected_line_1);
            this.lines_array.push(this.selected_line_2);

            this.target_ball = -1;
            this.selected_line_1 = -1;
            this.selected_line_2 = -1;
            this.wrong_num = 0;
        }else{
            //错误位置
            //回弹效果，暂时未添加
            this.selected_line_1.active = false;
            this.selected_line_2.active = false;
            this.target_ball.active = false;
            //对错号数组进行处理
            this.wrong_num = 0;
            return;
        }

        //如果正确，判断是否过关，过关则显示过关效果，否则按下了按钮,添加线
        if (this.checkIfPassLevel()){
            //过关
            //闪亮代码
            //下一关内容刷新
        }else{
            //未过关，继续
        }
    },

    checkIfNearOtherNodes:function(pos_x,pos_y){
        let in_row = -1;
        let in_column = -1;

        //防止小数太多计算太多，以后可能会删掉此代码
        pos_x = parseInt(pos_x);
        pos_y = parseInt(pos_y);

        //console.log('-=--------------------我点击的位置',pos_x,pos_y)

        for(let i = 0;i<5;i++){
            pos_y > this.basic_balls_array[i * 5].y ? in_row = i : 1 ;
            pos_x > this.basic_balls_array[i].x ? in_column = i: 1;
        }

        //console.log('===================确定当前的行列',in_row,in_column)

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
            //console.log('===================ballINdex',ball_index)
            let juli1 = Math.abs(this.basic_balls_array[ball_index].x - pos_x)
            let juli2 = Math.abs(this.basic_balls_array[ball_index].y - pos_y)
            //console.log('=================之间距离',juli1,juli2)
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
        let if_pass = (this.wrong_num === 0);
        return if_pass;
    },

    //判断交点,待看是否能用
    getCrossPoints:function(p,m){
        //a = cross_point
        //p = line_1 ,m = line_2，line_1是固定线，line_2是可移动线
        //y = ax+b

        let a = -1;

        let p_ball_1_index = p.getComponent('lad_mhy_line').getBalls()[0];
        let p_ball_2_index = p.getComponent('lad_mhy_line').getBalls()[1];
        let m_ball_index = m.getComponent('lad_mhy_line').getBalls()[0];

        let p_point1 = cc.p(this.basic_balls_array[p_ball_1_index].x, this.basic_balls_array[p_ball_1_index].y);
        let p_point2 = cc.p(this.basic_balls_array[p_ball_2_index].x, this.basic_balls_array[p_ball_2_index].y);

        let m_point1 = cc.p(this.basic_balls_array[m_ball_index].x, this.basic_balls_array[m_ball_index].y);
        let m_point2 = global.current_target_position;

        let v1x = p_point2.x - p_point1.x;
        let v1y = p_point2.y - p_point1.y;
        
        let v2x = m_point2.x - m_point1.x;
        let v2y = m_point2.y - m_point1.y;

        let result_1 = v1x * v2y - v2x * v1y;

        if (result_1 == 0) //平行或共线,这边需要在共线情况下做个处理
            return a; // Collinear
            
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
    }
});
