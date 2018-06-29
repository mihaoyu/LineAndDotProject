var global = require("lad_mhy_global")
cc.Class({
    extends: cc.Component,

    properties: {
        line_prefab:cc.Prefab,
        ball_prefab:cc.Prefab,
        ball_blue:cc.SpriteFrame,
        ball_red:cc.SpriteFrame,
        ball_layer:cc.Node,
        click_area:cc.Node,
        bg:cc.Node
    },

    // use this for initialization
    onLoad: function () {
        this.offset_x = -200;
        this.offset_y = -200-225;
        this.createBasicBalls();
        this.initGameOnEvents();
        this.selected_line_1 = -1;
        this.selected_line_2 = -1;
        this.target_ball = -1;
    },

    start:function(){
        global.initMoveBallAndLine();
        this.initLevelBalls();
    },

    initLevelBalls: function (levels) {
        this.createMoveLinesAndBalls();
    },

    initGameOnEvents: function () {
        cc.game.on("lad_line_start", this.fingerStart, this);
        cc.game.on("lad_line_move", this.fingerMove, this);
        cc.game.on("lad_line_end", this.fingerEnd, this);

        this.bg.on(cc.Node.EventType.TOUCH_START, this.touchStart, this);
        this.bg.on(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
        this.bg.on(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
    },

    onDestroy:function(){
        cc.game.off("lad_line_start", this.fingerStart, this);
        cc.game.off("lad_line_move", this.fingerMove, this);
        cc.game.off("lad_line_end", this.fingerEnd, this);
        
        this.bg.off(cc.Node.EventType.TOUCH_MOVE, this.touchStart, this);
        this.bg.off(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
        this.bg.off(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
    },

    createBasicBalls:function(){
        this.basic_balls_array = [];
        for (let i = 0; i < global.BASIC_BALLS_COUNT; i++) {
            var ball_node = cc.instantiate(this.ball_prefab);
            ball_node.scale = 0.6;
            ball_node.parent = this.ball_layer;
            ball_node.x = this.offset_x + (i % global.BASIC_WIDTH) * 90;
            ball_node.y = this.offset_y + Math.floor(i / global.BASIC_HEIGHT) * 90;
            this.basic_balls_array.push(ball_node);
        }
    },

    createMoveLinesAndBalls: function () {
        //后面再去考虑优化,这边数组分配有点问题
        this.init_balls_array = [];
        this.init_balls_nums = [];
        let init_ball_config = global.makeStrToArray(global.getInitConfigByLevel(global.current_level),",");

        //放置玩家球
        for (let i = 0; i < init_ball_config.length; i++) {
            let ball_index = global.makeStrToArray(init_ball_config[i], "_");
            let ball_index_1 = ball_index[0]-0;
            let ball_index_2 = ball_index[1]-0;
            let index_1_had_create = global.checkIfInArray(ball_index_1,this.init_balls_nums);
            let index_2_had_create = global.checkIfInArray(ball_index_2, this.init_balls_nums);

            if (!index_1_had_create) {
                let ball_node_1 = cc.instantiate(this.ball_prefab);
                this.init_balls_nums.push(ball_index_1);
                ball_node_1.x = this.basic_balls_array[ball_index_1].x + 2;
                ball_node_1.y = this.basic_balls_array[ball_index_1].y + 3;
                ball_node_1.parent = this.ball_layer;
                //ball_node_1.getComponent(cc.Sprite).SpriteFrame = this.ball_red;
                this.init_balls_array[ball_index_1] = ball_node_1;
                //this.init_balls_array.push(ball_node_1);
            }

            if (!index_2_had_create) {
                let ball_node_2 = cc.instantiate(this.ball_prefab);
                this.init_balls_nums.push(ball_index_2);
                ball_node_2.x = this.basic_balls_array[ball_index_2].x + 2;
                ball_node_2.y = this.basic_balls_array[ball_index_2].y + 3;
                ball_node_2.parent = this.ball_layer;
                //ball_node_2.getComponent(cc.Sprite).SpriteFrame = this.ball_red;
                this.init_balls_array[ball_index_2] = ball_node_2;
                //this.init_balls_array.push(ball_node_2);
            }
        }

        //放置线，后面线会放到球下面

        this.lines_array = [];
        for (let i = 0; i < init_ball_config.length; i++) {
            let line_index = i;
            let ball_index = global.makeStrToArray(init_ball_config[i], "_");
            let ball_index_1 = ball_index[0] - 0;
            let ball_index_2 = ball_index[1] - 0;
            var line_node = cc.instantiate(this.line_prefab);
            
            let start_index = parseInt(Math.random()*2);
            let start_ball;
            let end_ball;

            if(start_index === 1){
                start_ball = this.init_balls_array[ball_index_1];
                end_ball = this.init_balls_array[ball_index_2];
            }else{
                start_ball = this.init_balls_array[ball_index_2];
                end_ball = this.init_balls_array[ball_index_1];
            }
            line_node.parent = this.ball_layer; //以后看看是不是弄个新层级
            
            this.setLineInfo(line_node,start_ball,end_ball);
            line_node.getComponent('lad_mhy_line').setLineIndex(line_index, ball_index_1, ball_index_2);
            this.lines_array.push(line_node);
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

    setLineInfo: function (line_node, ball_1, ball_2, if_position, target_pos) {
        line_node.x = ball_1.x;
        line_node.y = ball_1.y;

        if (if_position) {
            line_node.rotation = global.getTwoPointsRotation(ball_1.getPosition(), target_pos);
            line_node.scaleY = (global.getTwoPointsDistance(ball_1.getPosition(), target_pos) / line_node.height);
        } else {
            line_node.rotation = global.getTwoPointsRotation(ball_1.getPosition(), ball_2.getPosition());
            line_node.scaleY = (global.getTwoPointsDistance(ball_1.getPosition(), ball_2.getPosition()) / line_node.height);
        }
    },

    fingerStart: function () {
        this.lines_array[global.current_move_line_index].active = false;
        this.addLines();
        this.addBalls();
    },

    touchStart: function (event, touch) {
        console.log('=============界面点击开始')
    },

    touchMove:function(event,touch){
        console.log('===========界面点击移动')

        //多点触控屏蔽
        if (event.getTouches().length > 1) {
            //恢复之前的状态
            return;
        }

        if (global.current_move_ball_1 === -1 || global.current_move_ball_2 === -1)return;

        let position = this.node.convertToNodeSpaceAR(event.getLocation());
        let pos_x = position.x;
        let pos_y = position.y;

        this.target_ball.x = pos_x;
        this.target_ball.y = pos_y;
        global.current_target_position = cc.p(pos_x,pos_y);
        this.setLineInfo(this.selected_line_1, global.current_move_ball_1,1, true, global.current_target_position);
        this.setLineInfo(this.selected_line_2, global.current_move_ball_2,1, true, global.current_target_position);

        //根据移动点创建新的node,line
        //后期添加一个接近点判断
    },

    touchEnd:function(event){
                console.log('===============界面点击结束')
        //多点触控屏蔽
        if (event.getTouches().length > 1) {
            //恢复之前的状态
            return;
        }
        if (global.current_move_ball_1 === -1 || global.current_move_ball_2 === -1) return;


        if (global.current_move_ball_1 !== -1 || global.current_move_ball_2 !== -1) {
            global.current_move_ball_1 = -1;
            global.current_move_ball_2 = -1;
            this.selected_line_1.active = false;
            this.selected_line_2.active = false;
            this.target_ball.active  = false;
        }
        this.lines_array[global.current_move_line_index].active = true;
    },

    setEndBallNode:function(ball_index){
        //设置ballnode点
    },

    fingerMove: function () {},

    fingerEnd: function () {},
});
