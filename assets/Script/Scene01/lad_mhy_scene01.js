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
        level_view:cc.PageView,
        level_item:cc.Prefab,
        view_content:cc.Node,
        page:cc.Node,
        addBtn:cc.Button,
        reduceBtn:cc.Button,
        reward_coin:cc.Label,
    },

    onLoad:function () {
        //this.level_view.node.on('page-turning', this.onPageEvent, this);
    },

    onDestroy:function(){
        //this.level_view.node.off('page-turning', this.onPageEvent, this);
    },

    onEnable: function () {
        this.level_view.node.on('page-turning', this.onPageEvent, this);
    },

    onDisable: function () {
        this.level_view.node.off('page-turning', this.onPageEvent, this);
    },


    start:function () {
        //后面添加延迟0.1s执行
        this.offset_x = -180;
        this.offset_y = 270;
        this.width_distance = 180;
        this.height_distance = 180;

        global.select_level = -1;
        this.current_page = 0;
        this.page_list = [];
        this.level_node = [];
        this.reward_coin.string = global.coin_num;
        this.page_config_length = Math.ceil(global.game_init_line_config.length/12);
        this.initPageNodeByLength();
    },

    initPageNodeByLength:function(){
        this.page_list.push(this.page);
        this.initPageNode(this.page_list[0],1)

        for (let i = 1; i < this.page_config_length; i++) {
            this.createPageNode(i+1);
            this.initPageNode(this.page_list[i],i+1)
        }
        this.addBtn.interactable = !(this.current_page === this.page_config_length - 1);
        this.reduceBtn.interactable = !(this.current_page === 0);
    },

    createPageNode:function(){
        let node = new cc.Node();
        node.anchorX = this.page.anchorX;
        node.anchorY = this.page.anchorY;
        node.width = this.page.width;
        node.height = this.page.height;
        node.x = this.page_list[this.page_list.length-1].x + node.width;
        node.y = this.page.y;
        this.page_list.push(node);
        this.level_view.addPage(node);
    },

    initPageNode:function(page_node,page_index){
        if(page_index === this.page_config_length){
            //生成对应node
            for (let i = 0; i < global.game_init_line_config.length%12;i++){
                let node = cc.instantiate(this.level_item);
                node.parent = page_node;
                node.x = this.offset_x + (i % 3) * this.width_distance;
                node.y = this.offset_y - Math.floor(i/3) * this.height_distance;
                node.getComponent('lad_mhy_level_item').setLevelItemInfo((this.page_config_length-1)*12+i+1);
            }
        }else{
            //生成12个node
            for(let i = 0;i<12;i++){
                let node = cc.instantiate(this.level_item);
                node.x = this.offset_x + (i % 3) * this.width_distance;
                node.y = this.offset_y - Math.floor(i / 3) * this.height_distance;
                node.parent = page_node;
                node.getComponent('lad_mhy_level_item').setLevelItemInfo((page_index-1)*12+i+1);
            }
        }
    },

    addPage:function(){
        this.addBtn.interactable = !(this.current_page === this.page_config_length - 1);
        this.reduceBtn.interactable = !(this.current_page === 0);

        if (this.current_page + 1 > this.page_config_length-1) {
            return;
        }
        this.current_page = this.current_page + 1;
        this.level_view.scrollToPage(this.current_page);
    },

    reducePage:function(){
        this.addBtn.interactable = !(this.current_page === this.page_config_length - 1);
        this.reduceBtn.interactable = !(this.current_page === 0);

        if (this.current_page - 1 < 0) {
            return;
        }
        this.current_page = this.current_page - 1;
        this.level_view.scrollToPage(this.current_page);
    },

    // 监听事件
    onPageEvent(sender, eventType) {
        // 翻页事件
        //console.log('===========================kankana', eventType, cc.PageView.EventType.PAGE_TURNING)

        if (eventType !== cc.PageView.EventType.PAGE_TURNING) {
            return;
        }

        this.current_page = this.level_view.getCurrentPageIndex()
        this.addBtn.interactable = !(this.current_page === this.page_config_length - 1);
        this.reduceBtn.interactable = !(this.current_page === 0);
    },

    goToStartScene:function(){
        cc.director.loadScene('lad_mhy_scene02');
    },

    goToHomeScene: function () {
        cc.director.loadScene('lad_mhy_scene00');
    }
});
